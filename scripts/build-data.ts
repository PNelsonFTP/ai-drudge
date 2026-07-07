// Orchestrator: fetch RSS + scrape HTML -> route -> assemble payload -> write JSON.
//
// Resilience: if BOTH fetch and scrape return zero articles (total failure),
// we keep the existing public/data/headlines.json untouched and exit 0 so the
// GitHub Action deploy step still ships the previous good state. This is the
// property the z.ai site lacked.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchAllFeeds } from "./fetch-feeds";
import { scrapeAllSources } from "./scrape-sources";
import { fetchStocks } from "./fetch-stocks";
import { generateBrief } from "./generate-brief";
import { buildCategories } from "./lib/router";
import { buildSiteFeed } from "./lib/emitFeed";
import { fetchHn } from "./fetch-hn";
import type { HeadlinesPayload } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../public/data");
const PUBLIC_DIR = resolve(__dirname, "../public");

async function readJsonIfExists<T>(path: string): Promise<T | null> {
  try {
    const txt = await readFile(path, "utf-8");
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}

// Minified JSON for the wire (smaller payload for the SPA to fetch).
// We still pretty-print stocks.json because it's tiny and human-readable.
async function writeJsonMin(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data));
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2));
}

async function main() {
  // Run RSS fetch, HTML scrape, and HN index in parallel — independent.
  const [feedOut, scrapeOut, hn] = await Promise.all([
    fetchAllFeeds(),
    scrapeAllSources(),
    fetchHn(),
  ]);

  const allArticles = [...feedOut.articles, ...scrapeOut.articles];
  const allFeedStats = [...feedOut.feedStats, ...scrapeOut.stats];

  if (allArticles.length === 0) {
    console.warn("No articles fetched — keeping previous headlines.json (graceful degradation).");
    const prev = await readJsonIfExists<HeadlinesPayload>(resolve(DATA_DIR, "headlines.json"));
    if (!prev) {
      // First-run failure: write an empty but valid payload so the site boots.
      await writeJsonMin(resolve(DATA_DIR, "headlines.json"), {
        generatedAt: new Date().toISOString(),
        totalCount: 0,
        trending: [],
        categories: [],
        feedStats: allFeedStats,
      });
    }
    process.exit(0);
  }

  // Multi-category routing with per-source global cap, scoring, age windows,
  // starvation fill, HN boost, and freshness gates on Lead/Trending.
  const { buckets: categories, trending, leadUrl } = buildCategories(allArticles, hn);

  const payload: HeadlinesPayload = {
    generatedAt: new Date().toISOString(),
    totalCount: categories.reduce((n, b) => n + b.articles.length, 0),
    trending,
    categories,
    feedStats: allFeedStats,
    leadUrl,
  };

  await writeJsonMin(resolve(DATA_DIR, "headlines.json"), payload);
  console.log(
    `Wrote headlines.json — ${payload.totalCount} grouped stories across ${categories.length} categories, ${trending.length} trending.`
  );

  // Site Atom feed so readers can subscribe to the aggregator itself.
  const siteFeed = buildSiteFeed(trending, categories, payload.generatedAt);
  await writeFile(resolve(PUBLIC_DIR, "feed.xml"), siteFeed);
  console.log("Wrote feed.xml");

  // Stocks (silent fail to {}).
  const stocks = await fetchStocks();
  await writeJson(resolve(DATA_DIR, "stocks.json"), stocks);

  // Brief: Claude if ANTHROPIC_API_KEY is set, else fallback built from
  // trending + lead + cross-category sampling (NOT just top 3 of one feed).
  const brief = await generateBrief(allArticles, { trending, categories });
  await writeJsonMin(resolve(DATA_DIR, "brief.json"), brief);
  console.log(`Wrote brief.json — source: ${brief.source}, ${brief.bullets.length} bullets.`);

  console.log("Done.");
}

main().catch((e) => {
  console.error("build-data failed:", e);
  process.exit(1);
});

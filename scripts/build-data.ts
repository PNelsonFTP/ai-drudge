// Orchestrator: fetch feeds -> group -> pick lead -> assemble payload -> write JSON.
//
// Resilience: if fetch returns zero articles (total feed failure), we keep
// the existing public/data/headlines.json untouched and exit 0 so the GitHub
// Action deploy step still ships the previous good state. This is the
// property the z.ai site lacked.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchAllFeeds } from "./fetch-feeds";
import { fetchStocks } from "./fetch-stocks";
import { generateBrief } from "./generate-brief";
import { buildCategories } from "./lib/router";
import type { HeadlinesPayload } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../public/data");

async function readJsonIfExists<T>(path: string): Promise<T | null> {
  try {
    const txt = await readFile(path, "utf-8");
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2));
}

async function main() {
  const out = await fetchAllFeeds();

  if (out.articles.length === 0) {
    console.warn("No articles fetched — keeping previous headlines.json (graceful degradation).");
    const prev = await readJsonIfExists<HeadlinesPayload>(resolve(DATA_DIR, "headlines.json"));
    if (!prev) {
      // First-run failure: write an empty but valid payload so the site boots.
      await writeJson(resolve(DATA_DIR, "headlines.json"), {
        generatedAt: new Date().toISOString(),
        totalCount: 0,
        categories: [],
        feedStats: out.feedStats,
      });
    }
    process.exit(0);
  }

  // Multi-category routing: each article can appear in multiple sections
  // (its feed's home category PLUS any category whose keywords match its
  // title/summary). Within each category, articles are scored by priority
  // + recency + keyword relevance, then a per-source diversity cap forces
  // variety so no single feed dominates the top.
  //
  // Returns both the category buckets AND a Trending list (stories covered
  // by 3+ distinct sources across categories).
  const { buckets: categories, trending } = buildCategories(out.articles);

  const payload: HeadlinesPayload = {
    generatedAt: new Date().toISOString(),
    totalCount: categories.reduce((n, b) => n + b.articles.length, 0),
    trending,
    categories,
    feedStats: out.feedStats,
  };

  await writeJson(resolve(DATA_DIR, "headlines.json"), payload);
  console.log(
    `Wrote headlines.json — ${payload.totalCount} grouped stories across ${categories.length} categories, ${trending.length} trending.`
  );

  // Stocks (silent fail to {}).
  const stocks = await fetchStocks();
  await writeJson(resolve(DATA_DIR, "stocks.json"), stocks);

  // Brief (uses Claude if key is set; falls back to top-3 otherwise).
  const brief = await generateBrief(out.articles);
  await writeJson(resolve(DATA_DIR, "brief.json"), brief);
  console.log(`Wrote brief.json — source: ${brief.source}, ${brief.bullets.length} bullets.`);

  console.log("Done.");
}

main().catch((e) => {
  console.error("build-data failed:", e);
  process.exit(1);
});

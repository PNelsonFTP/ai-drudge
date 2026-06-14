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
import { groupStories } from "./lib/groupStories";
import { CATEGORIES } from "./sources";
import type { CategoryBucket, GroupedArticle, HeadlinesPayload } from "./types";

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

  // Bucket by category, then group same-story within each bucket.
  const buckets: CategoryBucket[] = CATEGORIES.map((meta) => {
    const inCat = out.articles.filter((a) => a.category === meta.id);
    const grouped: GroupedArticle[] = groupStories(inCat);
    // Cap each category to keep the page tight.
    const cap = meta.id === "industry_news" || meta.id === "research" ? 20 : 12;
    return { id: meta.id, label: meta.label, articles: grouped.slice(0, cap) };
  }).filter((b) => b.articles.length > 0);

  const payload: HeadlinesPayload = {
    generatedAt: new Date().toISOString(),
    totalCount: buckets.reduce((n, b) => n + b.articles.length, 0),
    categories: buckets,
    feedStats: out.feedStats,
  };

  await writeJson(resolve(DATA_DIR, "headlines.json"), payload);
  console.log(`Wrote headlines.json — ${payload.totalCount} grouped stories across ${buckets.length} categories.`);

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

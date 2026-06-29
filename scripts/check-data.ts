// #15: Build-time quality gate. Reads public/data/headlines.json and reports
// on feed health, age distribution, and section emptiness. Exits 1 on hard
// failures so CI surfaces regressions; exits 0 with warnings otherwise.
//
// Run: npm run build:check

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { HeadlinesPayload } from "./types";

const DATA_FILE = resolve(process.cwd(), "public/data/headlines.json");

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

interface Thresholds {
  minFeedOkRatio: number;      // hard fail below
  warnMedianAgeH: number;      // warn above (non-fatal — varies with news cycle)
  maxItemAgeDays: number;      // hard fail if any displayed item older
  warnFeedOkRatio: number;     // warn below (non-fatal)
}

const T: Thresholds = {
  minFeedOkRatio: 0.80,
  // Median age is warn-only: hourly CI often sees 48–72h when many sources
  // publish once/day. Hard-fail on maxItemAgeDays instead — that catches the
  // real regression (845-day articles leaking through age windows).
  warnMedianAgeH: 96,
  maxItemAgeDays: 30,
  warnFeedOkRatio: 0.90,
};

async function main() {
  const raw = await readFile(DATA_FILE, "utf-8");
  const j = JSON.parse(raw) as HeadlinesPayload;

  const now = Date.now();
  const ages: number[] = [];
  const seenUrl = new Set<string>();
  let noDate = 0;
  let maxItemAgeDays = 0;
  const emptyCategories: string[] = [];

  for (const c of j.categories) {
    if (c.articles.length === 0) emptyCategories.push(c.id);
    for (const a of c.articlesAll) {
      if (seenUrl.has(a.url)) continue;
      seenUrl.add(a.url);
      if (!a.publishedAt) { noDate++; continue; }
      const ageH = (now - new Date(a.publishedAt).getTime()) / HOUR_MS;
      ages.push(ageH);
      maxItemAgeDays = Math.max(maxItemAgeDays, ageH / 24);
    }
  }
  ages.sort((x, y) => x - y);
  const median = ages.length ? ages[Math.floor(ages.length / 2)] : NaN;
  const p90 = ages.length ? ages[Math.floor(ages.length * 0.9)] : NaN;
  const share = (h: number) =>
    ages.length ? Math.round((ages.filter((x) => x < h).length / ages.length) * 100) : 0;

  const feedsOk = j.feedStats.filter((f) => f.ok).length;
  const feedRatio = j.feedStats.length ? feedsOk / j.feedStats.length : 0;
  const zeroItemOk = j.feedStats.filter((f) => f.ok && f.count === 0);

  // Report
  console.log("\n=== BUILD QUALITY REPORT ===");
  console.log(`generated:       ${j.generatedAt}`);
  console.log(`feeds:           ${feedsOk}/${j.feedStats.length} OK (${(feedRatio * 100).toFixed(0)}%)`);
  if (zeroItemOk.length > 0) {
    console.log(`zero-item OK:    ${zeroItemOk.map((f) => f.source).join(", ")}`);
  }
  console.log(`articles:        ${ages.length} unique visible (+${noDate} no-date)`);
  console.log(`median age:      ${median.toFixed(1)}h`);
  console.log(`p90 age:         ${(p90 / 24).toFixed(1)}d`);
  console.log(`max age:         ${maxItemAgeDays.toFixed(1)}d`);
  console.log(`share <24h:      ${share(24)}%`);
  console.log(`share >7d:       ${100 - share(7 * 24)}%`);
  console.log(`trending:        ${j.trending.length}`);
  console.log(`empty sections:  ${emptyCategories.length ? emptyCategories.join(", ") : "(none)"}`);

  // Hard failures
  const failures: string[] = [];
  if (feedRatio < T.minFeedOkRatio) {
    failures.push(`feed health ${(feedRatio * 100).toFixed(0)}% < ${(T.minFeedOkRatio * 100).toFixed(0)}% threshold`);
  }
  if (maxItemAgeDays > T.maxItemAgeDays) {
    failures.push(`max item age ${maxItemAgeDays.toFixed(1)}d > ${T.maxItemAgeDays}d threshold (stale content leaking through)`);
  }
  if (emptyCategories.length > j.categories.length / 2) {
    failures.push(`${emptyCategories.length} of ${j.categories.length} sections are empty`);
  }

  // Warnings (non-fatal)
  if (!isNaN(median) && median > T.warnMedianAgeH) {
    console.warn(`⚠  WARN: median age ${median.toFixed(1)}h > ${T.warnMedianAgeH}h target`);
  }
  if (feedRatio < T.warnFeedOkRatio) {
    console.warn(`⚠  WARN: feed health below ${(T.warnFeedOkRatio * 100).toFixed(0)}% target`);
  }
  if (zeroItemOk.length > 0) {
    console.warn(`⚠  WARN: ${zeroItemOk.length} feeds report OK but return 0 items (likely HTML/SPA responses)`);
  }
  if (j.trending.length < 4) {
    console.warn(`⚠  WARN: trending thin (${j.trending.length} clusters)`);
  }

  if (failures.length > 0) {
    console.error("\n❌ BUILD CHECK FAILED:");
    for (const f of failures) console.error(`   - ${f}`);
    process.exit(1);
  }
  console.log("\n✓ build check passed");
}

main().catch((e) => {
  console.error("check-data failed:", e);
  process.exit(1);
});

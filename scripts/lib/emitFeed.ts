// Emit an Atom 1.0 feed of the aggregator itself (#1 from the roadmap), so
// users can subscribe to AI DRUDGE from any feed reader. Entries link
// directly to the original source articles.
//
// Selection mirrors the homepage's editorial hierarchy: trending stories
// first, then each category's top headline, then remaining high scorers —
// deduped by URL, capped at FEED_MAX.

import type { CategoryBucket, GroupedArticle, TrendingStory } from "../types";

const SITE_URL = "https://pnelsonftp.github.io/ai-drudge/";
const FEED_URL = `${SITE_URL}feed.xml`;
const FEED_MAX = 30;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function entryXml(a: GroupedArticle, categoryLabel: string): string {
  const updated = a.publishedAt ?? a.collectedAt;
  const summaryParts = [a.summary, a.related.length > 0 ? `Also covered by: ${a.related.map((r) => r.source).join(", ")}` : null]
    .filter(Boolean)
    .join(" — ");
  return [
    "  <entry>",
    `    <title>${esc(a.title)}</title>`,
    `    <link href="${esc(a.url)}"/>`,
    `    <id>${esc(a.url)}</id>`,
    `    <updated>${esc(updated)}</updated>`,
    `    <author><name>${esc(a.source)}</name></author>`,
    `    <category term="${esc(categoryLabel)}"/>`,
    summaryParts ? `    <summary>${esc(summaryParts)}</summary>` : null,
    "  </entry>",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSiteFeed(
  trending: TrendingStory[],
  categories: CategoryBucket[],
  generatedAt: string
): string {
  const picked: { article: GroupedArticle; label: string }[] = [];
  const seen = new Set<string>();

  const add = (a: GroupedArticle, label: string) => {
    if (picked.length >= FEED_MAX || seen.has(a.url)) return;
    seen.add(a.url);
    picked.push({ article: a, label });
  };

  const labelById = new Map<string, string>(categories.map((c) => [c.id, c.label]));
  for (const t of trending) {
    add(t.lead, labelById.get(t.categoryIds[0]) ?? "Trending");
  }
  for (const c of categories) {
    if (c.articles[0]) add(c.articles[0], c.label);
  }
  for (const c of categories) {
    for (const a of c.articles.slice(1, 3)) add(a, c.label);
  }

  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<feed xmlns="http://www.w3.org/2005/Atom">`,
    `  <title>AI DRUDGE</title>`,
    `  <subtitle>Machine-intelligence headlines, refreshed hourly</subtitle>`,
    `  <link href="${SITE_URL}"/>`,
    `  <link rel="self" href="${FEED_URL}"/>`,
    `  <id>${SITE_URL}</id>`,
    `  <updated>${esc(generatedAt)}</updated>`,
    ...picked.map((p) => entryXml(p.article, p.label)),
    `</feed>`,
    "",
  ].join("\n");
}

// Build-time RSS fetcher. Runs inside GitHub Actions; never in the browser.
//
// Resilience rules (this is the fix for every failure mode the z.ai site hit):
//   1. Per-feed 8s timeout via AbortController
//   2. One retry with a rotated User-Agent
//   3. Parallel via Promise.allSettled — one bad feed never blocks others
//   4. Returns [] on total failure; the caller keeps the previous JSON
//
// Output: a flat Article[] ready for grouping/dedup.

import { XMLParser } from "fast-xml-parser";
import type { Article } from "./types";
import { type FeedSource, PRIORITY_WEIGHT, SOURCES } from "./sources";
import { extractDate } from "./lib/timeAgo";

const PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // fast-xml-parser v5+ caps entity expansions by default to prevent DoS.
  // Legit large feeds (GitHub release Atom, Mandiant, Simon Willison) trip
  // the default 1000-entity limit. Raise it well above any real feed.
  processEntities: {
    enabled: true,
    maxEntitySize: 100000,
    maxTotalExpansions: 100000,
    maxExpandedLength: 1000000,
    maxEntityCount: 100000,
  },
});

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile Safari/605.1.15",
];

function hashId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function stripHtml(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstStr(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && v.length && typeof v[0] === "string") return String(v[0]).trim();
    if (v && typeof v === "object" && "#text" in (v as any)) {
      const t = (v as any)["#text"];
      if (typeof t === "string") return t.trim();
    }
  }
  return null;
}

interface ParsedItem {
  title?: unknown;
  link?: unknown;
  pubDate?: unknown;
  published?: unknown;
  updated?: unknown;
  date?: unknown;
  description?: unknown;
  summary?: unknown;
  content?: unknown;
  "content:encoded"?: unknown;
}

function extractItems(json: any): ParsedItem[] {
  // RSS 2.0
  const rssChannel = json?.rss?.channel;
  if (rssChannel) {
    const items = rssChannel.item;
    return Array.isArray(items) ? items : items ? [items] : [];
  }
  // Atom
  const feed = json?.feed;
  if (feed) {
    const entries = feed.entry;
    return Array.isArray(entries) ? entries : entries ? [entries] : [];
  }
  // RDF
  const rdf = json?.rdf;
  if (rdf) {
    const items = rdf.item;
    return Array.isArray(items) ? items : items ? [items] : [];
  }
  return [];
}

function linkFromItem(item: ParsedItem): string | null {
  if (typeof item.link === "string") return item.link;
  if (Array.isArray(item.link)) {
    const href = item.link.find((l: any) => l?.["@_href"]) || item.link[0];
    if (typeof href === "string") return href;
    if (href?.["@_href"]) return href["@_href"];
  }
  if (item.link && typeof item.link === "object" && (item.link as any)["@_href"]) {
    return (item.link as any)["@_href"];
  }
  // Atom <id> often holds the URL when no link present
  if (typeof (item as any).id === "string" && /^https?:\/\//.test((item as any).id)) {
    return (item as any).id;
  }
  return null;
}

async function fetchWithTimeout(url: string, ua: string, timeoutMs = 8000): Promise<string> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": ua,
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      signal: ctl.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function fetchOneFeed(src: FeedSource): Promise<{ articles: Article[]; ok: boolean }> {
  let body: string | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2 && !body; attempt++) {
    const ua = USER_AGENTS[(attempt + src.url.length) % USER_AGENTS.length];
    try {
      body = await fetchWithTimeout(src.url, ua);
    } catch (e) {
      lastErr = e;
    }
  }
  if (!body) {
    console.warn(`  [skip] ${src.name}: ${lastErr instanceof Error ? lastErr.message : "fetch failed"}`);
    return { articles: [], ok: false };
  }

  let json: any;
  try {
    json = PARSER.parse(body);
  } catch (e) {
    console.warn(`  [skip] ${src.name}: parse failed`);
    return { articles: [], ok: false };
  }

  const items = extractItems(json);
  const collectedAt = new Date().toISOString();
  const now = new Date();
  const out: Article[] = [];

  // Cap each feed to its most recent 15 items. This prevents high-volume
  // feeds (Reddit, OpenAI News, GitHub releases) from flooding categories
  // after keyword routing.
  const ITEMS_PER_FEED_CAP = 15;
  const cappedItems = items.slice(0, ITEMS_PER_FEED_CAP);

  for (const item of cappedItems) {
    const title = stripHtml(firstStr(item.title));
    const link = linkFromItem(item);
    if (!title || !link) continue;
    const rawDate = firstStr(item.pubDate, item.published, item.updated, item.date);
    const summarySrc = firstStr(item.description, item.summary, item.content, item["content:encoded"]);
    out.push({
      id: hashId(link),
      title,
      url: link,
      source: src.name,
      category: src.category,
      priority: src.priority,
      publishedAt: extractDate(rawDate, now),
      publishedRaw: rawDate,
      summary: summarySrc ? stripHtml(summarySrc).slice(0, 320) : null,
      collectedAt,
    });
  }

  return { articles: out, ok: true };
}

export async function fetchAllFeeds(): Promise<{
  articles: Article[];
  feedStats: { source: string; ok: boolean; count: number }[];
}> {
  console.log(`Fetching ${SOURCES.length} feeds in parallel…`);
  const results = await Promise.all(
    SOURCES.map(async (src) => {
      const r = await fetchOneFeed(src);
      console.log(`  ${r.ok ? "OK" : "FAIL"}  ${src.name.padEnd(28)} ${r.articles.length} items`);
      return { src, ...r };
    })
  );

  const feedStats = results.map((r) => ({ source: r.src.name, ok: r.ok, count: r.articles.length }));
  let articles = results.flatMap((r) => r.articles);

  // Dedup by URL first, then by title (case-insensitive).
  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  articles = articles.filter((a) => {
    const urlKey = a.url.replace(/[#?].*$/, "").replace(/\/$/, "");
    const titleKey = a.title.toLowerCase();
    if (seenUrl.has(urlKey) || seenTitle.has(titleKey)) return false;
    seenUrl.add(urlKey);
    seenTitle.add(titleKey);
    return true;
  });

  // Sort by priority then recency.
  articles.sort((a, b) => {
    const p = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (p !== 0) return p;
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });

  console.log(`Total after dedup: ${articles.length}`);
  return { articles, feedStats };
}

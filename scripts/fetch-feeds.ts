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

// Decode the common HTML/XML entities that leak through RSS titles and
// summaries (&#8217; &amp; &lt; &gt; &apos; &quot; &#xNN; &#NN;).
// Applied after stripHtml so entities inside CDATA also get cleaned.
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'",
  nbsp: " ", copy: "\u00a9", reg: "\u00ae", trade: "\u2122",
  mdash: "\u2014", ndash: "\u2013", hellip: "\u2026",
  lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201c", rdquo: "\u201d",
};

function decodeEntities(s: string): string {
  if (!s || !s.includes("&")) return s;
  return s.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (full, body: string) => {
    const lc = body.toLowerCase();
    if (lc in NAMED_ENTITIES) return NAMED_ENTITIES[lc];
    if (lc.startsWith("#x")) {
      const cp = parseInt(lc.slice(2), 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : full;
    }
    if (lc.startsWith("#")) {
      const cp = parseInt(lc.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : full;
    }
    return full;
  });
}

function cleanText(s: string | undefined | null): string {
  return decodeEntities(stripHtml(s));
}

// Detect GitHub-release "noise" titles: pure version tags, commit hashes,
// RC tags, or version-prefixed changelog entries with no real headline.
// Examples we want to drop:
//   "v0.30.8", "b9637", "v5.10.1", "Release v4.2.0"
//   "v0.30.5-rc0: llama.cpp version update (#16511)"
//   "3.3.0b1", "3.1.0b1"
// Examples we want to KEEP (real headline):
//   "Release v5.10.1: Add Mistral Small 3 support"
//   "2026.24: Hey Siri, Tell Me a Fable"
//
// For GitHub release feeds specifically, if the noise filter would drop a
// title, we SYNTHESIZE "<repoShort> <version> released" instead so the
// GITHUB REPOS section isn't empty. (#10)
function isReleaseNoise(title: string, source: string): string {
  // Only apply this filter to GitHub release feeds — news sites occasionally
  // publish legitimate titles like "v8 is here".
  const isGitHubRelease = source.includes("/") && (
    source.includes("github.com/") || source.includes("/")
  );
  if (!isGitHubRelease) return title;
  const t = title.trim();
  if (!t) return title;

  // Pure hash like "b9637" or "abc1234"
  if (/^[a-z]?\d{3,}$/i.test(t)) return "";
  if (/^[a-f0-9]{7,}$/i.test(t)) return "";

  // Strip a leading version-tag prefix (and optional "release " before it),
  // then check if what remains is meaningful English or empty.
  //   "v0.30.5-rc0: llama.cpp version update (#16511)" -> strip prefix -> "llama.cpp version update (#16511)"
  //   "3.3.0b1" -> strip prefix -> "" (drop)
  //   "v0.30.8" -> strip prefix -> "" (drop)
  //   "Release v5.10.1: Add Mistral support" -> strip prefix -> "Add Mistral support" (keep whole)
  const stripped = t
    .replace(/^release\s+/i, "")
    .replace(/^v?\d+\.\d+(?:\.\d+)*(?:-[a-z0-9.]+)?\s*[:：]?\s*/i, "")
    .trim();

  // If after stripping there's nothing meaningful left, SYNTHESIZE a title
  // from the repo name + version so the GITHUB REPOS section has content (#10).
  if (!stripped) {
    const synth = synthesizeGitHubTitle(source, t);
    return synth;
  }

  // If stripped has fewer than 3 real words, also synthesize from repo.
  const words = stripped.split(/\s+/).filter((w) => /[a-z]{3,}/i.test(w));
  if (words.length < 3) {
    const synth = synthesizeGitHubTitle(source, t);
    return synth || stripped;
  }

  // Otherwise, keep the cleaned title (without the version prefix noise).
  return stripped;
}

// Build "<repoShort> <version> released" from a source name like
// "ollama/ollama" and a raw title like "v0.6.2". Returns "" if we can't
// extract anything useful.
function synthesizeGitHubTitle(source: string, rawTitle: string): string {
  const short = source.split("/").pop() || source;
  const vMatch = rawTitle.match(/v?(\d+\.\d+(?:\.\d+)*(?:-[a-z0-9.]+)?)/i);
  const version = vMatch ? `v${vMatch[1]}` : "";
  return `${short} ${version} released`.trim();
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

async function fetchWithTimeout(url: string, ua: string, timeoutMs = 8000): Promise<{ body: string; contentType: string } | null> {
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
    const body = await res.text();
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    return { body, contentType };
  } finally {
    clearTimeout(t);
  }
}

// #11: validate the body actually looks like a feed before parsing.
// Prevents HTML/Cloudflare interstitials from producing silent 0-item "OK"
// feeds (e.g. Cohere, LangChain Blog returning SPA HTML).
function looksLikeFeed(body: string, contentType: string): boolean {
  const ct = contentType.split(";")[0].trim();
  if (ct.includes("xml") || ct.includes("rss") || ct.includes("atom")) return true;
  const head = body.slice(0, 600).trim();
  return /^<\?xml/.test(head) || /^<rss/.test(head) || /^<feed/.test(head) || /^<rdf/i.test(head);
}

async function fetchOneFeed(src: FeedSource): Promise<{ articles: Article[]; ok: boolean }> {
  let body: string | null = null;
  let contentType = "";
  let lastErr: unknown = null;
  // #8: 3 retries (was 2) with small jittered delay for transient failures.
  // Substack feeds in particular sometimes rate-limit on first hit.
  for (let attempt = 0; attempt < 3 && !body; attempt++) {
    const ua = USER_AGENTS[(attempt + src.url.length) % USER_AGENTS.length];
    if (attempt > 0) {
      const jitter = 400 + Math.floor(Math.random() * 600);
      await new Promise((r) => setTimeout(r, jitter));
    }
    try {
      const got = await fetchWithTimeout(src.url, ua);
      if (got) {
        body = got.body;
        contentType = got.contentType;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  if (!body) {
    console.warn(`  [skip] ${src.name}: ${lastErr instanceof Error ? lastErr.message : "fetch failed"}`);
    return { articles: [], ok: false };
  }

  // #11: reject HTML/interstitial responses before parsing.
  if (!looksLikeFeed(body, contentType)) {
    console.warn(`  [skip] ${src.name}: not a feed (got ${contentType.split(";")[0] || "html"})`);
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
    const rawTitle = cleanText(firstStr(item.title));
    const link = linkFromItem(item);
    if (!rawTitle || !link) continue;

    // Drop release-tag noise (b9637, v0.30.4) and strip version prefixes
    // when there's a real headline underneath.
    const title = isReleaseNoise(rawTitle, src.name);
    if (!title) continue;

    const rawDate = firstStr(item.pubDate, item.published, item.updated, item.date);

    // For GitHub Atom releases, the changelog lives in <content type="html">,
    // NOT in <summary>. Pull it so hover cards have something to show.
    // We also try summary/description for RSS feeds.
    const isGitHubRelease = src.url.includes("github.com") && src.url.includes("releases.atom");
    const summarySrc = isGitHubRelease
      ? firstStr(item.content, item.summary, item.description)
      : firstStr(item.description, item.summary, item.content, item["content:encoded"]);

    const summary = summarySrc
      ? cleanText(summarySrc)
          // GitHub release HTML often starts with "<a name=N>N</a>" or whitespace artifacts
          .replace(/^\s*[a-z0-9\s,.-]*\s+by\s+@[\w-]+\s+/i, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 320)
      : null;

    out.push({
      id: hashId(link),
      title,
      url: link,
      source: src.name,
      category: src.category,
      priority: src.priority,
      publishedAt: extractDate(rawDate, now),
      publishedRaw: rawDate,
      summary,
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

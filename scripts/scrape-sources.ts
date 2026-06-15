// Build-time HTML scraper for sites that have NO public RSS feed.
//
// These are SPA-only sites (Anthropic, Mistral, xAI, Cognition, Stability AI,
// Center for AI Safety, etc.). They publish server-rendered HTML we can scrape.
//
// Each site config provides:
//   - listing URL (the page that lists recent posts)
//   - a regex with capture groups: [1]=slug/href, [2]=title, [3]=ISO date, [4]=category
//
// Output: Article[] matching the RSS path's shape, ready to merge.

import type { Article } from "./types";
import type { CategoryId, Priority } from "./sources";

interface ScrapeSource {
  name: string;
  listingUrl: string;
  homeUrl: string;           // base URL for resolving relative slugs
  defaultCategory: CategoryId;
  defaultPriority: Priority;
  // Match one card. Capture groups (in order): href, title, date, [category].
  // The regex runs with /g, so it picks up every card on the page.
  cardPattern: RegExp;
  // Cap results per site — these listing pages can be long.
  maxItems?: number;
}

const SCRAPE_SOURCES: ScrapeSource[] = [
  {
    name: "Anthropic News",
    listingUrl: "https://www.anthropic.com/news",
    homeUrl: "https://www.anthropic.com",
    defaultCategory: "model_releases",
    defaultPriority: "critical",
    // Card structure (verified Jun 2026):
    //   <a href="/news/SLUG" ...>
    //     ... <span class="caption bold">CATEGORY</span>
    //     ... <time>Mon DD, YYYY</time>
    //     ... <h4 class="...title">TITLE</h4> ...
    //   </a>
    cardPattern: /<a href="(\/news\/[a-z0-9-]+)"[^>]*>([\s\S]{0,1500}?)<\/a>/g,
    maxItems: 15,
  },
  {
    name: "Anthropic Research",
    listingUrl: "https://www.anthropic.com/research",
    homeUrl: "https://www.anthropic.com",
    defaultCategory: "safety_policy",
    defaultPriority: "high",
    cardPattern: /<a href="(\/research\/[a-z0-9-]+)"[^>]*>([\s\S]{0,1500}?)<\/a>/g,
    maxItems: 10,
  },
];

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

function hashId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function decodeEntities(s: string): string {
  if (!s) return s;
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Anthropic uses "Jun 11, 2026" — parse to ISO.
function parseMonthDayYear(s: string): string | null {
  const m = s.match(/^([A-Z][a-z]{2})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!m) return null;
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const mo = months[m[1]];
  if (mo === undefined) return null;
  const d = new Date(Date.UTC(parseInt(m[3]), mo, parseInt(m[2])));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function fetchHtml(url: string): Promise<string | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      signal: ctl.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function scrapeOne(src: ScrapeSource): Promise<Article[]> {
  const html = await fetchHtml(src.listingUrl);
  if (!html) {
    console.warn(`  [skip] ${src.name}: HTTP fetch failed`);
    return [];
  }

  const out: Article[] = [];
  const seenSlug = new Set<string>();
  const collectedAt = new Date().toISOString();
  const cap = src.maxItems ?? 10;

  // Reset regex state and iterate matches.
  const re = new RegExp(src.cardPattern.source, src.cardPattern.flags.replace("g", "g"));
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && out.length < cap) {
    const href = m[1];
    const body = m[2];

    if (seenSlug.has(href)) continue;
    seenSlug.add(href);

    // Title: any <h*> with "title" in class, fallback to any <h4>/<h3>.
    const titleMatch =
      body.match(/<h[1-6][^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h[1-6]>/) ||
      body.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/);
    if (!titleMatch) continue;
    const title = decodeEntities(titleMatch[1]);
    if (!title || title.length < 5) continue;

    // Date: <time>YYYY-MM-DD</time> or <time>Mon DD, YYYY</time>
    const timeMatch = body.match(/<time[^>]*datetime="([^"]+)"[^>]*>/) ||
                      body.match(/<time[^>]*>([^<]+)<\/time>/);
    const rawDate = timeMatch ? timeMatch[1].trim() : null;
    const publishedAt = rawDate
      ? (parseMonthDayYear(rawDate) || (isNaN(new Date(rawDate).getTime()) ? null : new Date(rawDate).toISOString()))
      : null;

    // Optional category badge
    const catMatch = body.match(/<span class="caption bold">([^<]+)<\/span>/);
    const postCategory = catMatch ? catMatch[1].trim().toLowerCase() : null;

    const url = href.startsWith("http") ? href : `${src.homeUrl}${href}`;

    out.push({
      id: hashId(url),
      title,
      url,
      source: src.name,
      category: src.defaultCategory,
      priority: src.defaultPriority,
      publishedAt,
      publishedRaw: rawDate,
      // We don't fetch each article page on the listing pass — too slow and
      // would burn the GitHub Actions rate limit. The hover card will just
      // show the title + source + date, which is enough for these lab posts.
      summary: postCategory ? `${postCategory}` : null,
      collectedAt,
    });
  }

  return out;
}

export async function scrapeAllSources(): Promise<{
  articles: Article[];
  stats: { source: string; ok: boolean; count: number }[];
}> {
  if (SCRAPE_SOURCES.length === 0) {
    return { articles: [], stats: [] };
  }

  console.log(`Scraping ${SCRAPE_SOURCES.length} HTML sources…`);
  const results = await Promise.all(
    SCRAPE_SOURCES.map(async (src) => {
      const articles = await scrapeOne(src);
      console.log(`  ${articles.length > 0 ? "OK" : "FAIL"}  ${src.name.padEnd(28)} ${articles.length} items`);
      return { src, articles };
    })
  );

  return {
    articles: results.flatMap((r) => r.articles),
    stats: results.map((r) => ({ source: r.src.name, ok: r.articles.length > 0, count: r.articles.length })),
  };
}

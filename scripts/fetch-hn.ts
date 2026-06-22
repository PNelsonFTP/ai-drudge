// Build-time Hacker News velocity fetcher.
//
// Pulls recent stories from the HN Algolia API (no key required) and builds
// an index the scorer uses as an "importance right now" signal — the AI-
// native equivalent of the cyber project's CISA KEV integration.
//
// Two pulls:
//   1. search_by_date (recent) — captures the freshest posts that may not yet
//      have many points.
//   2. search (front page / high-points) — captures what's currently hot.
//
// Fail-soft: any error returns an empty index so the build never breaks.

import type { HnIndex } from "./lib/score";

interface HnHit {
  objectID: string;
  url?: string | null;
  points?: number | null;
  num_comments?: number | null;
}

const ENDPOINTS = [
  "https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=200",
  "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=100",
];

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

function normalizeUrl(rawUrl: string): { url: string; domain: string } | null {
  try {
    const u = new URL(rawUrl);
    const path = u.pathname.replace(/\/$/, "");
    return { url: `${u.host}${path}`, domain: u.host.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

async function fetchOne(url: string): Promise<HnHit[]> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 9000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: ctl.signal,
      redirect: "follow",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { hits?: HnHit[] };
    return json.hits ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

export async function fetchHn(): Promise<HnIndex> {
  const byUrl = new Map<string, { points: number; comments: number }>();
  const byDomain = new Map<string, number>();

  try {
    const hitsPerEndpoint = await Promise.all(ENDPOINTS.map(fetchOne));
    const allHits = hitsPerEndpoint.flat();
    // Dedupe by URL — keep max points/comments seen.
    for (const hit of allHits) {
      if (!hit.url) continue;
      const n = normalizeUrl(hit.url);
      if (!n) continue;
      const points = hit.points ?? 0;
      const comments = hit.num_comments ?? 0;
      const prev = byUrl.get(n.url);
      if (prev) {
        prev.points = Math.max(prev.points, points);
        prev.comments = Math.max(prev.comments, comments);
      } else {
        byUrl.set(n.url, { points, comments });
      }
      byDomain.set(n.domain, Math.max(byDomain.get(n.domain) ?? 0, points));
    }
  } catch {
    // Fall through — empty index is fine.
  }

  console.log(`HN index: ${byUrl.size} urls, ${byDomain.size} domains`);
  return { byUrl, byDomain };
}

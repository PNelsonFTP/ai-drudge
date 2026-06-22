// Single source of truth for article scoring. Imported by router.ts,
// groupStories.ts (via router re-sort), and fetch-feeds.ts (pre-sort).
//
// Score = priorityScore + recencyScore + importanceScore + hnBoost
// where:
//   - priorityScore  : feed-level priority (rebalanced so recency can dominate)
//   - recencyScore   : continuous exponential decay, 48h half-life
//   - importanceScore: recency-gated keyword boosts (launch / money / event)
//   - hnBoost        : optional Hacker News velocity signal

import type { Article } from "../types";
import type { Priority } from "../sources";

const HOUR_MS = 60 * 60 * 1000;

export interface HnIndex {
  // normalized url (host+path, no query/hash/trailing slash) -> {points, comments}
  byUrl: Map<string, { points: number; comments: number }>;
  // domain -> max points across any HN hit (weaker fallback match)
  byDomain: Map<string, number>;
}

export interface ScoreCtx {
  now: Date;
  hn?: HnIndex;
  // category the article is being scored FOR (keyword routing may differ)
  forCategoryId?: string;
  // small bonus when scoring for the article's home category
  isHomeCategory?: boolean;
}

// REBALANCED from {critical:100, high:50, medium:10, low:1}.
// With recency capped at 100, these let fresh high-priority items (~125) beat
// stale critical items (~42) while keeping priority a meaningful tiebreaker.
export const PRIORITY_SCORE: Record<Priority, number> = {
  critical: 40,
  high: 25,
  medium: 12,
  low: 4,
};

export function priorityScore(priority: Priority): number {
  return PRIORITY_SCORE[priority] ?? 0;
}

export function ageHours(publishedAt: string | null, now: Date): number {
  if (!publishedAt) return 36; // unknown date — treat as ~36h so it isn't invisible
  const t = new Date(publishedAt).getTime();
  if (isNaN(t)) return 36;
  return Math.max(0, (now.getTime() - t) / HOUR_MS);
}

// Continuous exponential decay: 100 at age 0, halving every 48h, floor at 2.
// Replaces the step function in router.ts that flatlined at 5 after 72h and
// let stale critical posts outrank fresh medium ones.
const HALF_LIFE_H = 48;
export function recencyScore(publishedAt: string | null, now: Date): number {
  const h = ageHours(publishedAt, now);
  return Math.max(2, 100 * Math.pow(0.5, h / HALF_LIFE_H));
}

// Importance signal scoring. Recency-gated: only applies when ageH <= 96,
// so it can never resurrect a stale post. Returns 0–30.
const IMPORTANCE_LAUNCH = [
  "releases", "launch", "launches", "launching", "now available",
  "general availability", "unveils", "introduc", "announc",
  "open-source", "open source", "open sources", "state-of-the-art", " sota ",
  "outperform", "benchmark", "beats gpt", "beats claude", "new model",
  "first ", "world first",
];
const IMPORTANCE_MODELS = [
  "gpt-5", "gpt-4", "gpt-3", "claude ", "gemini ", "llama ", "mistral ",
  "qwen", "deepseek", "grok-", "phi-", " o3", " o4", "opus", "sonnet",
  "command r",
];
const IMPORTANCE_MONEY = [
  "raises $", "raised $", "funding round", "series a", "series b", "series c",
  "valuation", " ipo", "acquires", "acquired by", "billion", "mega-round",
];
const IMPORTANCE_EVENT = [
  "lawsuit", "sues", "sued", "banned", "ban ", "outage", "breach",
  "resigns", "resignation", "shuts down", "recall", "investigation",
  "senate", "congress", "ftc ", "sec ", "eu fines",
];

function contains(haystack: string, needles: string[]): number {
  let hits = 0;
  for (const n of needles) if (haystack.includes(n)) hits++;
  return hits;
}

export function importanceScore(
  title: string,
  summary: string | null,
  ageH: number,
): number {
  if (ageH > 96) return 0; // recency gate
  const hay = `${title} ${summary ?? ""}`.toLowerCase();
  let s = 0;
  s += Math.min(2, contains(hay, IMPORTANCE_LAUNCH)) * 6;  // up to 12
  s += Math.min(2, contains(hay, IMPORTANCE_MODELS)) * 3;   // up to 6
  s += Math.min(1, contains(hay, IMPORTANCE_MONEY)) * 8;    // up to 8
  s += Math.min(1, contains(hay, IMPORTANCE_EVENT)) * 6;    // up to 6
  return Math.min(30, s);
}

// Hacker News velocity. URL match is strong; domain match is weak.
function normalizeUrl(rawUrl: string): { url: string; domain: string } | null {
  try {
    const u = new URL(rawUrl);
    const path = u.pathname.replace(/\/$/, "");
    return { url: `${u.host}${path}`, domain: u.host.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

export function hnBoost(url: string, hn: HnIndex | undefined): number {
  if (!hn) return 0;
  const n = normalizeUrl(url);
  if (!n) return 0;
  const exact = hn.byUrl.get(n.url);
  if (exact) return Math.min(25, exact.points / 20);
  const domainHit = hn.byDomain.get(n.domain);
  if (domainHit) return Math.min(8, domainHit / 50);
  return 0;
}

export function finalScore(article: Article, ctx: ScoreCtx): number {
  const ageH = ageHours(article.publishedAt, ctx.now);
  const p = priorityScore(article.priority);
  const r = recencyScore(article.publishedAt, ctx.now);
  const i = importanceScore(article.title, article.summary, ageH);
  const h = hnBoost(article.url, ctx.hn);
  const home = ctx.isHomeCategory ? 6 : 0;
  return p + r + i + h + home;
}

// Freshness helpers used by router.ts (age windows) and the client (NEW badge).
export function ageDays(publishedAt: string | null, now: Date): number {
  return ageHours(publishedAt, now) / 24;
}

export function isFresh(publishedAt: string | null, now: Date, withinHours = 6): boolean {
  return ageHours(publishedAt, now) <= withinHours;
}

export function isStale(publishedAt: string | null, now: Date, afterHours = 72): boolean {
  if (!publishedAt) return false;
  return ageHours(publishedAt, now) > afterHours;
}

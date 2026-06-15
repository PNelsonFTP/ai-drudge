// Multi-category router + scoring + per-source diversity cap.
//
// Each Article has a home category (from its feed's `category`).
// The keyword router adds it to ADDITIONAL categories when its
// title+summary matches. Within each category, articles are scored
// (priority + recency + keyword boost) and then a per-source cap
// forces diversity so no single source can dominate the top.

import type { Article, CategoryBucket, GroupedArticle } from "../types";
import { CATEGORIES, KEYWORDS, PRIORITY_WEIGHT, type CategoryId } from "../sources";
import { groupStories } from "./groupStories";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Recency score: 100 at "now", decays to ~0 over 72h. After that it's flat ~0.
function recencyScore(publishedAt: string | null, now: Date): number {
  if (!publishedAt) return 5; // unknown date — small floor so it doesn't vanish
  const t = new Date(publishedAt).getTime();
  if (isNaN(t)) return 5;
  const ageHrs = Math.max(0, (now.getTime() - t) / HOUR_MS);
  if (ageHrs <= 1)  return 100;
  if (ageHrs <= 6)  return 80;
  if (ageHrs <= 12) return 65;
  if (ageHrs <= 24) return 50;
  if (ageHrs <= 48) return 30;
  if (ageHrs <= 72) return 15;
  return 5;
}

// Which categories does this article belong to?
// - Always: its feed's home category.
// - Additionally: any category whose keyword set matches title+summary.
//
// Exception: noisy aggregators (Reddit) only get keyword-routed into their
// home category, because their post titles are generic and match too broadly.
const KEYWORD_AGNOSTIC_SOURCES = new Set(["LocalLLaMA Subreddit", "r/LocalLLM", "Hacker News"]);

function routesFor(article: Article): Set<CategoryId> {
  const cats = new Set<CategoryId>([article.category]);
  if (KEYWORD_AGNOSTIC_SOURCES.has(article.source)) return cats;
  const hay = `${article.title} ${article.summary ?? ""}`.toLowerCase();
  for (const rule of KEYWORDS) {
    for (const kw of rule.match) {
      if (hay.includes(kw)) {
        cats.add(rule.routeTo);
        break;
      }
    }
  }
  return cats;
}

interface ScoredArticle {
  article: Article;
  score: number;
}

// Score = priority weight + recency + small boost if it arrived via keyword
// (means it's on-topic for this category beyond just being the feed's home).
function scoreArticle(article: Article, catId: CategoryId, now: Date): number {
  const priority = PRIORITY_WEIGHT[article.priority];
  const recency = recencyScore(article.publishedAt, now);
  const isHomeCat = article.category === catId;
  // Articles whose home category IS this one get a small bonus (more relevant),
  // but keyword-routed articles can still rank high if they're fresh + high priority.
  const homeBonus = isHomeCat ? 8 : 0;
  return priority + recency + homeBonus;
}

// Per-source diversity cap: no more than N items from any single source in
// the first M items of a category. After M, allow more.
function enforceDiversity<T extends { article: Article }>(
  scored: T[],
  capFirst = 6,
  maxPerSource = 2
): T[] {
  const head: T[] = [];
  const tail: T[] = [];
  const counts = new Map<string, number>();

  for (const item of scored) {
    const src = item.article.source;
    const n = counts.get(src) ?? 0;
    if (head.length < capFirst && n < maxPerSource) {
      head.push(item);
      counts.set(src, n + 1);
    } else {
      tail.push(item);
    }
  }
  return [...head, ...tail];
}

export function buildCategories(articles: Article[]): CategoryBucket[] {
  const now = new Date();

  // Pre-compute routes per article (avoid repeated work).
  const routed = articles.map((a) => ({ article: a, cats: routesFor(a) }));

  const buckets: CategoryBucket[] = [];

  for (const meta of CATEGORIES) {
    // Collect all articles that should appear in this category.
    const inCat: ScoredArticle[] = [];
    for (const { article, cats } of routed) {
      if (cats.has(meta.id)) {
        inCat.push({ article, score: scoreArticle(article, meta.id, now) });
      }
    }

    // Skip empty categories.
    if (inCat.length === 0) continue;

    // Sort by score descending.
    inCat.sort((a, b) => b.score - a.score);

    // Cap before grouping for performance.
    const cap =
      meta.id === "industry_news" ? 60 :
      meta.id === "research"      ? 40 :
      meta.id === "github_repos"  ? 30 :
      25;
    const top = inCat.slice(0, cap);

    // Group same-story (Jaccard) within the category.
    const grouped: GroupedArticle[] = groupStories(top.map((s) => s.article));

    // Re-sort grouped by the lead article's score (grouping may have reordered).
    const scoreByTitle = new Map(top.map((s) => [s.article.title, s.score]));
    grouped.sort((a, b) => (scoreByTitle.get(b.title) ?? 0) - (scoreByTitle.get(a.title) ?? 0));

    // Enforce per-source diversity across the WHOLE list (not just top 6).
    // Cap of 3 items per source when the category has many sources, but allow
    // up to 5 when the category genuinely has few sources (e.g. specialist
    // sections like Quantum).
    const distinctSources = new Set(grouped.map((g) => g.source)).size;
    const maxPerSource = distinctSources <= 2 ? 5 : distinctSources <= 4 ? 4 : 3;
    const withScore = grouped.map((g) => ({
      article: g,
      score: scoreByTitle.get(g.title) ?? 0,
    }));
    // Apply diversity across the entire list so a dominant source can't
    // queue up 20 items behind the first 2.
    const diversified = enforceDiversity(withScore, withScore.length, maxPerSource);

    // Final cap for display.
    const displayCap = meta.id === "industry_news" ? 15 : 10;
    buckets.push({
      id: meta.id,
      label: meta.label,
      articles: diversified.slice(0, displayCap).map((d) => d.article),
    });
  }

  return buckets;
}

// Multi-category router + scoring + per-source diversity cap.
//
// Each Article has a home category (from its feed's `category`).
// The keyword router adds it to ADDITIONAL categories when its
// title+summary matches. Within each category, articles are scored
// (priority + recency + keyword boost) and then a per-source cap
// forces diversity so no single source can dominate the top.

import type { Article, CategoryBucket, GroupedArticle, TrendingStory } from "../types";
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

// Title token helpers for cross-category story unification in Trending.
const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","by","at","from",
  "is","are","was","were","be","been","as","it","its","this","that","these","those",
  "says","said","will","has","have","had","new","ai","via","after","over","into",
  "you","your","i","we","our","they","their","he","she","his","her",
]);
function titleTokens(title: string): Set<string> {
  return new Set(
    title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
  );
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
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

export function buildCategories(articles: Article[]): {
  buckets: CategoryBucket[];
  trending: TrendingStory[];
} {
  const now = new Date();

  // GLOBAL PER-SOURCE CAP
  // ────────────────────────────────────────────────────────────────────
  // Limit how many items any single source can contribute to the whole
  // site per build. Without this, a high-volume feed (llama.cpp releases,
  // Ollama blog) floods 6+ categories because each category independently
  // caps the source but the source is allowed its full count everywhere.
  //
  // Articles are already sorted (priority then recency) coming in, so
  // taking the first N per source keeps each source's MOST important /
  // freshest items and drops the long tail of its less-important posts.
  const GLOBAL_PER_SOURCE_CAP = 6;
  const perSourceCount = new Map<string, number>();
  const sourceLimited = articles.filter((a) => {
    const n = perSourceCount.get(a.source) ?? 0;
    if (n >= GLOBAL_PER_SOURCE_CAP) return false;
    perSourceCount.set(a.source, n + 1);
    return true;
  });

  // Pre-compute routes per article (avoid repeated work).
  const routed = sourceLimited.map((a) => ({ article: a, cats: routesFor(a) }));

  const buckets: CategoryBucket[] = [];

  // Track every appearance of every article URL across categories so we can
  // compute the Trending section (stories covered by many distinct sources).
  // Key: lead-article URL. Value: { sources: Set, categories: Set, lead, related }.
  const storyCoverage = new Map<string, {
    lead: GroupedArticle;
    sources: Set<string>;
    categories: Set<CategoryId>;
    maxScore: number;
  }>();

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
    const distinctSources = new Set(grouped.map((g) => g.source)).size;
    const maxPerSource = distinctSources <= 2 ? 5 : distinctSources <= 4 ? 4 : 3;
    const withScore = grouped.map((g) => ({
      article: g,
      score: scoreByTitle.get(g.title) ?? 0,
    }));
    const diversified = enforceDiversity(withScore, withScore.length, maxPerSource);
    const ordered = diversified.map((d) => d.article);

    // Caps: short preview for the default view + longer list for "View all".
    const displayCap = meta.id === "industry_news" ? 15 : 10;
    const viewAllCap = meta.id === "industry_news" ? 40 : meta.id === "github_repos" ? 25 : 20;

    buckets.push({
      id: meta.id,
      label: meta.label,
      articles: ordered.slice(0, displayCap),
      articlesAll: ordered.slice(0, viewAllCap),
      sourceCount: distinctSources,
    });

    // Roll up coverage for trending.
    for (const g of ordered.slice(0, viewAllCap)) {
      const allSources = new Set<string>([g.source, ...g.related.map((r) => r.source)]);
      // Try to find an existing story cluster by URL OR by title similarity.
      // Different categories may have different lead URLs for the same story.
      let existing = storyCoverage.get(g.url);
      if (!existing) {
        // Fuzzy match by title tokens.
        const gTok = titleTokens(g.title);
        for (const [, ev] of storyCoverage) {
          if (jaccard(gTok, titleTokens(ev.lead.title)) >= 0.4) {
            existing = ev;
            break;
          }
        }
      }
      if (existing) {
        allSources.forEach((s) => existing!.sources.add(s));
        existing.categories.add(meta.id);
        const score = scoreByTitle.get(g.title) ?? 0;
        if (score > existing.maxScore) {
          existing.maxScore = score;
          existing.lead = g;
        }
      } else {
        storyCoverage.set(g.url, {
          lead: g,
          sources: allSources,
          categories: new Set([meta.id]),
          maxScore: scoreByTitle.get(g.title) ?? 0,
        });
      }
    }
  }

  // Trending = stories covered by 2+ distinct sources, sorted by source count
  // then by score. Cap at 12. (Threshold is 2 because most same-story coverage
  // happens across categories rather than within one — within-category dupes
  // are rare since the per-source diversity cap already spreads things out.)
  const trending: TrendingStory[] = [...storyCoverage.values()]
    .filter((s) => s.sources.size >= 2)
    .sort((a, b) => {
      if (b.sources.size !== a.sources.size) return b.sources.size - a.sources.size;
      return b.maxScore - a.maxScore;
    })
    .slice(0, 12)
    .map((s) => ({
      lead: s.lead,
      sources: [...s.sources],
      sourceCount: s.sources.size,
      categoryIds: [...s.categories],
    }));

  return { buckets, trending };
}

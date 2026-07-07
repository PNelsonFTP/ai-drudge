// Multi-category router + scoring + per-source diversity cap + age windows.
//
// Each Article has a home category (from its feed's `category`).
// The keyword router adds it to ADDITIONAL categories when its
// title+summary matches. Within each category:
//   1. Drop items older than the category's hard age window (#3).
//   2. Score with finalScore (priority + recency + importance + HN + home) (#1/#2/#5/#6).
//   3. Starvation-aware fill: prefer soft-window items, backfill to minItems (#4).
//   4. Per-source diversity cap so no single source dominates the top.
//   5. Group same-story (Jaccard) clusters.
// Lead Story and Trending get a freshness gate (#7).

import type { Article, CategoryBucket, GroupedArticle, TrendingStory } from "../types";
import { AGE_WINDOWS, CATEGORIES, KEYWORDS, type CategoryId } from "../sources";
import { ageHours, finalScore, type HnIndex, type ScoreCtx } from "./score";
import { groupStories } from "./groupStories";

// Which categories does this article belong to?
// - Always: its feed's home category.
// - Additionally: any category whose keyword set matches title+summary.
//
// Exception: noisy aggregators (Reddit, Lemmy) only get keyword-routed into
// their home category, because their post titles are generic and match too
// broadly. (The hnrss/Google News query feeds carry real article titles, so
// they route normally.)
const KEYWORD_AGNOSTIC_SOURCES = new Set([
  "LocalLLaMA Subreddit",
  "r/LocalLLM",
  "Lemmy c/localllama",
  "Hacker News",
]);

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

interface ScoredArticle {
  article: Article;
  score: number;
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

// Starvation-aware fill (#4): items within softDays first; if that yields
// fewer than minItems, backfill with items between softDays and hardDays
// (score-sorted) only up to minItems. Never pad beyond minItems from the
// soft/hard band just to fill larger caps.
function starvationFill(
  scored: ScoredArticle[],
  softDays: number,
  hardDays: number,
  minItems: number,
  now: Date,
): ScoredArticle[] {
  const softHrs = softDays * 24;
  const hardHrs = hardDays * 24;

  const soft = scored.filter((s) => ageHours(s.article.publishedAt, now) <= softHrs);
  if (soft.length >= minItems) return soft;

  const middle = scored.filter((s) => {
    const h = ageHours(s.article.publishedAt, now);
    return h > softHrs && h <= hardHrs;
  });
  // Backfill up to minItems only.
  const need = minItems - soft.length;
  return [...soft, ...middle.slice(0, Math.max(0, need))];
}

export interface BuildCategoriesResult {
  buckets: CategoryBucket[];
  trending: TrendingStory[];
  leadUrl: string | null;   // #7: chosen lead URL (always < 72h)
}

export function buildCategories(
  articles: Article[],
  hn?: HnIndex,
): BuildCategoriesResult {
  const now = new Date();

  // GLOBAL PER-SOURCE CAP
  // ────────────────────────────────────────────────────────────────────
  // Limit how many items any single source can contribute to the whole
  // site per build. Without this, a high-volume feed floods 6+ categories.
  // Articles come in pre-sorted (priority then recency), so taking the first
  // N per source keeps each source's MOST important / freshest items.
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
  const storyCoverage = new Map<string, {
    lead: GroupedArticle;
    sources: Set<string>;
    categories: Set<CategoryId>;
    maxScore: number;
    leadAgeH: number;
  }>();

  // #7: pick the highest-scoring <72h article as the Lead Story.
  let leadCandidate: { url: string; score: number } | null = null;

  for (const meta of CATEGORIES) {
    const window = AGE_WINDOWS[meta.id];

    // Collect all articles routed to this category.
    const inCat: ScoredArticle[] = [];
    for (const { article, cats } of routed) {
      if (!cats.has(meta.id)) continue;
      // #3: drop items older than the hard age window.
      const ageH = ageHours(article.publishedAt, now);
      if (ageH > window.hardDays * 24) continue;
      const ctx: ScoreCtx = {
        now,
        hn,
        forCategoryId: meta.id,
        isHomeCategory: article.category === meta.id,
      };
      inCat.push({ article, score: finalScore(article, ctx) });
    }

    if (inCat.length === 0) continue;

    inCat.sort((a, b) => b.score - a.score);

    // #4: starvation-aware fill — prefer fresh; only backfill to minItems.
    const filled = starvationFill(inCat, window.softDays, window.hardDays, window.minItems, now);
    // Re-sort after fill (soft + middle already sorted within their bands,
    // but a single merged order is safer).
    filled.sort((a, b) => b.score - a.score);

    // Cap before grouping for performance.
    const cap =
      meta.id === "industry_news" ? 60 :
      meta.id === "research"      ? 40 :
      meta.id === "github_repos"  ? 30 :
      25;
    const top = filled.slice(0, cap);

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

    // Roll up coverage for trending (only items that survive the window).
    for (const g of ordered.slice(0, viewAllCap)) {
      const allSources = new Set<string>([g.source, ...g.related.map((r) => r.source)]);
      const score = scoreByTitle.get(g.title) ?? 0;
      const ageH = ageHours(g.publishedAt, now);

      // #7: track the lead candidate (must be < 72h).
      if (ageH <= 72 && (!leadCandidate || score > leadCandidate.score)) {
        leadCandidate = { url: g.url, score };
      }

      // Try to find an existing story cluster by URL OR by title similarity.
      let existing = storyCoverage.get(g.url);
      if (!existing) {
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
        if (score > existing.maxScore) {
          existing.maxScore = score;
          existing.lead = g;
          existing.leadAgeH = ageH;
        }
      } else {
        storyCoverage.set(g.url, {
          lead: g,
          sources: allSources,
          categories: new Set([meta.id]),
          maxScore: score,
          leadAgeH: ageH,
        });
      }
    }
  }

  // Trending = stories covered by 2+ distinct sources AND fresh (<72h).
  // If the strict gate yields too few, relax to <120h to reach min 4.
  // Sorted by source count then by score. Cap at 12.
  const TRENDING_FRESH_H = 72;
  const TRENDING_RELAXED_H = 120;
  const TRENDING_MIN = 4;

  let trending = [...storyCoverage.values()]
    .filter((s) => s.sources.size >= 2 && s.leadAgeH <= TRENDING_FRESH_H);
  if (trending.length < TRENDING_MIN) {
    trending = [...storyCoverage.values()]
      .filter((s) => s.sources.size >= 2 && s.leadAgeH <= TRENDING_RELAXED_H);
  }
  trending.sort((a, b) => {
    if (b.sources.size !== a.sources.size) return b.sources.size - a.sources.size;
    return b.maxScore - a.maxScore;
  });
  const trendingOut: TrendingStory[] = trending.slice(0, 12).map((s) => ({
    lead: s.lead,
    sources: [...s.sources],
    sourceCount: s.sources.size,
    categoryIds: [...s.categories],
  }));

  return { buckets, trending: trendingOut, leadUrl: leadCandidate?.url ?? null };
}

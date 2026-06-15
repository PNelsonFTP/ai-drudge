// Shared types between build scripts and the client SPA.

import type { CategoryId, Priority } from "./sources";

export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  category: CategoryId;
  priority: Priority;
  publishedAt: string | null;   // ISO 8601, or null if unparseable
  publishedRaw: string | null;  // original string from feed, for debug
  summary: string | null;
  collectedAt: string;          // ISO 8601
}

export interface GroupedArticle extends Article {
  related: Article[];           // other articles covering the same story
}

// How widely a story is being covered — drives the Trending section.
export interface TrendingStory {
  lead: GroupedArticle;
  sources: string[];      // distinct source names covering it (incl. lead)
  sourceCount: number;
  categoryIds: string[];  // categories it appeared in
}

export interface CategoryBucket {
  id: CategoryId;
  label: string;
  articles: GroupedArticle[];       // capped preview shown by default
  articlesAll: GroupedArticle[];    // full list for "View all" expansion
  sourceCount: number;              // distinct sources in this category
}

export interface HeadlinesPayload {
  generatedAt: string;          // ISO 8601 build time
  totalCount: number;
  trending: TrendingStory[];    // most-covered stories across all categories
  categories: CategoryBucket[];
  feedStats: { source: string; ok: boolean; count: number }[];
}

export interface StockQuote {
  symbol: string;
  price: number | null;
  changePct: number | null;
  fetchedAt: string;
}

export interface Brief {
  generatedAt: string;
  source: "claude" | "fallback";
  headline: string;
  bullets: string[];
  citedArticles: { title: string; url: string; source: string }[];
}

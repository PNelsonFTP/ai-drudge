// Client-side types. Mirror of scripts/types.ts but standalone so the
// browser bundle never pulls in fast-xml-parser / node built-ins.

export type Priority = "critical" | "high" | "medium" | "low";

export type CategoryId =
  | "model_releases" | "research" | "agents_tools" | "products"
  | "industry_news" | "safety_policy" | "ai_security" | "analysis"
  | "cyber_threats" | "cyber_defense"
  | "hardware" | "open_source" | "agents_watch" | "funding"
  | "robotics" | "quantum"
  | "github_repos" | "ai_finance" | "local_models";

export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  category: CategoryId;
  priority: Priority;
  publishedAt: string | null;
  publishedRaw: string | null;
  summary: string | null;
  collectedAt: string;
}

export interface GroupedArticle extends Article {
  related: Article[];
}

export interface TrendingStory {
  lead: GroupedArticle;
  sources: string[];
  sourceCount: number;
  categoryIds: string[];
}

export interface CategoryBucket {
  id: CategoryId;
  label: string;
  articles: GroupedArticle[];
  articlesAll: GroupedArticle[];
  sourceCount: number;
}

export interface FeedStat {
  source: string;
  ok: boolean;
  count: number;
}

export interface HeadlinesPayload {
  generatedAt: string;
  totalCount: number;
  trending: TrendingStory[];
  categories: CategoryBucket[];
  feedStats: FeedStat[];
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

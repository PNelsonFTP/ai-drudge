import { useMemo, useState } from "react";
import { Header } from "./components/Header";
import { StockTicker } from "./components/StockTicker";
import { DailyBrief } from "./components/DailyBrief";
import { LeadStory } from "./components/LeadStory";
import { CategoryColumn } from "./components/CategoryColumn";
import { HoverCard as HoverCardContent, useHoverCard } from "./components/HoverCard";
import { useHeadlines } from "./hooks/useHeadlines";
import { useBookmarks } from "./hooks/useBookmarks";
import { useTheme } from "./hooks/useTheme";
import type { Article, CategoryBucket, GroupedArticle } from "./lib/types";

export default function App() {
  const { headlines, stocks, brief, error } = useHeadlines();
  const { theme, toggle: toggleTheme } = useTheme();
  const { bookmarks, toggle: toggleBookmark } = useBookmarks();
  const { active: hover, show: showHover, hide: hideHover } = useHoverCard();

  const [search, setSearch] = useState("");
  const [showBookmarks, setShowBookmarks] = useState(false);

  const searchLc = search.trim().toLowerCase();

  // Filter categories by search query across title + source + label.
  const filteredCategories = useMemo<CategoryBucket[]>(() => {
    if (!headlines) return [];
    if (!searchLc) return headlines.categories;
    return headlines.categories
      .map((c: CategoryBucket) => ({
        ...c,
        articles: c.articles.filter(
          (a: GroupedArticle) =>
            a.title.toLowerCase().includes(searchLc) ||
            a.source.toLowerCase().includes(searchLc) ||
            c.label.toLowerCase().includes(searchLc) ||
            a.related.some((r: Article) => r.source.toLowerCase().includes(searchLc))
        ),
      }))
      .filter((c: CategoryBucket) => c.articles.length > 0);
  }, [headlines, searchLc]);

  // Bookmark view: flat list of bookmarked articles across all categories.
  const bookmarkArticles = useMemo<GroupedArticle[]>(() => {
    if (!headlines || bookmarks.size === 0) return [];
    const out: GroupedArticle[] = [];
    for (const c of headlines.categories) {
      for (const a of c.articles) {
        if (bookmarks.has(a.id)) out.push(a);
      }
    }
    return out;
  }, [headlines, bookmarks]);

  // Lead story = the first critical/high story from the highest-priority
  // category present (model_releases preferred).
  const lead = useMemo<GroupedArticle | null>(() => {
    if (!headlines) return null;
    const order = ["model_releases", "industry_news", "ai_security", "cyber_threats", "research"];
    for (const id of order) {
      const cat = headlines.categories.find((c) => c.id === id);
      if (cat && cat.articles.length > 0) return cat.articles[0];
    }
    return headlines.categories[0]?.articles[0] ?? null;
  }, [headlines]);

  // Split categories into 3 columns for the classic Drudge layout.
  const columns = useMemo<CategoryBucket[][]>(() => {
    const cats = showBookmarks
      ? bookmarks.size > 0
        ? [{ id: "model_releases" as const, label: "BOOKMARKS", articles: bookmarkArticles }]
        : []
      : filteredCategories;
    const cols: CategoryBucket[][] = [[], [], []];
    cats.forEach((c, i) => cols[i % 3].push(c));
    return cols;
  }, [filteredCategories, showBookmarks, bookmarkArticles, bookmarks.size]);

  return (
    <div className="min-h-full">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        generatedAt={headlines?.generatedAt ?? null}
        totalCount={headlines?.totalCount ?? 0}
        bookmarksCount={bookmarks.size}
        showingBookmarks={showBookmarks}
        onToggleBookmarks={() => setShowBookmarks((v) => !v)}
        search={search}
        onSearchChange={setSearch}
      />
      <StockTicker stocks={stocks} />

      <main className="mx-auto max-w-[1400px] px-4 py-6">
        {error && (
          <div className="border border-[var(--siren)] text-[var(--siren)] p-4 mb-6">
            {error} — the site will retry on next visit.
          </div>
        )}

        {!headlines && !error && (
          <div className="opacity-60 text-center py-12">Loading headlines…</div>
        )}

        {headlines && !showBookmarks && (
          <>
            {brief && <DailyBrief brief={brief} />}
            {lead && (
              <LeadStory
                article={lead}
                onHover={showHover}
                onHoverEnd={hideHover}
              />
            )}
          </>
        )}

        {columns.length === 0 || columns.every((c) => c.length === 0) ? (
          <div className="opacity-60 text-center py-12">
            {showBookmarks
              ? "No bookmarks yet — click ☆ next to any headline to save it."
              : search
                ? "No headlines match your search."
                : "No headlines available right now."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((col, i) => (
              <div key={i} className="space-y-6">
                {col.map((bucket) => (
                  <CategoryColumn
                    key={bucket.id}
                    bucket={bucket}
                    bookmarkSet={bookmarks}
                    onToggleBookmark={toggleBookmark}
                    onHover={showHover}
                    onHoverEnd={hideHover}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-current border-opacity-20 text-[11px] opacity-50 flex flex-wrap items-center justify-between gap-2">
          <span>AI DRUDGE — aggregator, no affiliation with Drudge Report.</span>
          <span>
            {headlines?.feedStats
              ? `${headlines.feedStats.filter((f: { ok: boolean }) => f.ok).length}/${headlines.feedStats.length} feeds OK`
              : ""}
          </span>
        </footer>
      </main>

      {hover && (
        <HoverCardContent article={hover.article} anchor={hover.anchor} />
      )}
    </div>
  );
}

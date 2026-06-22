import { useMemo, useState } from "react";
import { Header } from "./components/Header";
import { StockTicker } from "./components/StockTicker";
import { DailyBrief } from "./components/DailyBrief";
import { LeadStory } from "./components/LeadStory";
import { Trending } from "./components/Trending";
import { LatestStrip } from "./components/LatestStrip";
import { CategoryColumn } from "./components/CategoryColumn";
import { HoverCard as HoverCardContent, useHoverCard } from "./components/HoverCard";
import { Headline } from "./components/Headline";
import { ManageMutes } from "./components/ManageMutes";
import { useHeadlines } from "./hooks/useHeadlines";
import { useTheme } from "./hooks/useTheme";
import {
  useBookmarks,
  useReadLater,
  useMutedSources,
  useMutedCategories,
} from "./hooks/useLocalStorageSet";
import type { Article, CategoryBucket, GroupedArticle } from "./lib/types";

type View = "home" | "bookmarks" | "queue";

// #13: data considered stale if last refreshed more than this many hours ago.
const STALE_DATA_HOURS = 6;

function dataIsStale(generatedAt: string | null): boolean {
  if (!generatedAt) return false;
  const then = new Date(generatedAt).getTime();
  if (isNaN(then)) return false;
  return (Date.now() - then) / 3_600_000 > STALE_DATA_HOURS;
}

export default function App() {
  const { headlines, stocks, brief, error } = useHeadlines();
  const { theme, toggle: toggleTheme } = useTheme();
  const { bookmarks, toggle: toggleBookmark } = useBookmarks();
  const { queue, toggle: toggleQueue, remove: removeFromQueue } = useReadLater();
  const { muted: mutedSources, toggle: toggleMuteSource } = useMutedSources();
  const { muted: mutedCategories, toggle: toggleMuteCategory } = useMutedCategories();
  const { active: hover, show: showHover, hide: hideHover } = useHoverCard();

  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("home");
  const [manageOpen, setManageOpen] = useState(false);

  const searchLc = search.trim().toLowerCase();

  // Map category id -> label for the ManageMutes panel.
  const categoryLabelsById = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    if (!headlines) return m;
    for (const c of headlines.categories) m[c.id] = c.label;
    return m;
  }, [headlines]);

  // Apply user mutes: drop muted categories entirely; drop muted sources from
  // the remaining categories' article lists. Also apply search filter.
  const filteredCategories = useMemo<CategoryBucket[]>(() => {
    if (!headlines) return [];
    return headlines.categories
      .filter((c) => !mutedCategories.has(c.id))
      .map((c) => {
        const filterFn = (a: GroupedArticle) => {
          if (mutedSources.has(a.source)) return false;
          if (a.related.every((r) => mutedSources.has(r.source))) {
            // Keep if any related source is unmuted; only drop if literally all muted.
          }
          if (!searchLc) return true;
          return (
            a.title.toLowerCase().includes(searchLc) ||
            a.source.toLowerCase().includes(searchLc) ||
            c.label.toLowerCase().includes(searchLc) ||
            a.related.some((r: Article) => r.source.toLowerCase().includes(searchLc))
          );
        };
        return {
          ...c,
          articles: c.articles.filter(filterFn),
          articlesAll: c.articlesAll.filter(filterFn),
        };
      })
      .filter((c) => c.articles.length > 0);
  }, [headlines, mutedCategories, mutedSources, searchLc]);

  // Bookmarks view: flat list of bookmarked articles across all categories.
  const bookmarkArticles = useMemo<GroupedArticle[]>(() => {
    if (!headlines || bookmarks.size === 0) return [];
    const seen = new Set<string>();
    const out: GroupedArticle[] = [];
    for (const c of headlines.categories) {
      for (const a of c.articlesAll) {
        if (bookmarks.has(a.id) && !seen.has(a.id)) {
          seen.add(a.id);
          out.push(a);
        }
      }
    }
    return out;
  }, [headlines, bookmarks]);

  // Queue view: same idea but for read-later items.
  const queueArticles = useMemo<GroupedArticle[]>(() => {
    if (!headlines || queue.size === 0) return [];
    const seen = new Set<string>();
    const out: GroupedArticle[] = [];
    for (const c of headlines.categories) {
      for (const a of c.articlesAll) {
        if (queue.has(a.id) && !seen.has(a.id)) {
          seen.add(a.id);
          out.push(a);
        }
      }
    }
    return out;
  }, [headlines, queue]);

  // Lead story = the chosen lead URL if present (#7, always <72h at build time),
  // otherwise the first article from the highest-priority category present.
  const lead = useMemo<GroupedArticle | null>(() => {
    if (!headlines) return null;
    if (headlines.leadUrl) {
      for (const c of headlines.categories) {
        for (const a of c.articlesAll) {
          if (a.url === headlines.leadUrl) return a;
        }
      }
    }
    const order = ["model_releases", "industry_news", "ai_security", "cyber_threats", "research"];
    for (const id of order) {
      const cat = headlines.categories.find((c) => c.id === id);
      if (cat && cat.articles.length > 0) return cat.articles[0];
    }
    return headlines.categories[0]?.articles[0] ?? null;
  }, [headlines]);

  // #14: flatten filtered categories for the LATEST strip.
  const latestArticles = useMemo<GroupedArticle[]>(() => {
    const seen = new Set<string>();
    const out: GroupedArticle[] = [];
    for (const c of filteredCategories) {
      for (const a of c.articlesAll) {
        if (!seen.has(a.url)) {
          seen.add(a.url);
          out.push(a);
        }
      }
    }
    return out;
  }, [filteredCategories]);

  const staleData = dataIsStale(headlines?.generatedAt ?? null);

  // Three-column layout for the home view.
  const columns = useMemo<CategoryBucket[][]>(() => {
    const cols: CategoryBucket[][] = [[], [], []];
    filteredCategories.forEach((c, i) => cols[i % 3].push(c));
    return cols;
  }, [filteredCategories]);

  const mutedCount = mutedSources.size + mutedCategories.size;

  return (
    <div className="min-h-full">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        generatedAt={headlines?.generatedAt ?? null}
        totalCount={headlines?.totalCount ?? 0}
        bookmarksCount={bookmarks.size}
        queueCount={queue.size}
        mutedCount={mutedCount}
        view={view}
        onSetView={setView}
        onOpenManageMutes={() => setManageOpen(true)}
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

        {/* HOME VIEW */}
        {headlines && view === "home" && (
          <>
            {staleData && (
              <div className="border border-[var(--siren)] text-[var(--siren)] px-4 py-2 mb-4 text-[12px]">
                Headlines may be delayed — last refresh was more than {STALE_DATA_HOURS} hours ago.
              </div>
            )}

            {brief && <DailyBrief brief={brief} />}
            {headlines.trending.length > 0 && (
              <Trending stories={headlines.trending} onHover={showHover} onHoverEnd={hideHover} />
            )}
            {lead && (
              <LeadStory article={lead} onHover={showHover} onHoverEnd={hideHover} />
            )}
            <LatestStrip articles={latestArticles} onHover={showHover} onHoverEnd={hideHover} />

            {filteredCategories.length === 0 ? (
              <div className="opacity-60 text-center py-12">
                {search
                  ? "No headlines match your search."
                  : mutedCategories.size > 0 || mutedSources.size > 0
                    ? "All sections hidden — click ✕ in the header to restore."
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
                        queueSet={queue}
                        mutedSources={mutedSources}
                        onToggleBookmark={toggleBookmark}
                        onToggleQueue={toggleQueue}
                        onMuteSource={toggleMuteSource}
                        onMuteCategory={toggleMuteCategory}
                        onHover={showHover}
                        onHoverEnd={hideHover}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* BOOKMARKS VIEW */}
        {headlines && view === "bookmarks" && (
          <Section
            title="BOOKMARKS"
            subtitle="Saved permanently. Click ★ again to remove."
            articles={bookmarkArticles}
            emptyMessage="No bookmarks yet — click ☆ next to any headline to save it."
            bookmarkSet={bookmarks}
            queueSet={queue}
            mutedSources={mutedSources}
            onToggleBookmark={toggleBookmark}
            onToggleQueue={toggleQueue}
            onMuteSource={toggleMuteSource}
            onHover={showHover}
            onHoverEnd={hideHover}
          />
        )}

        {/* QUEUE VIEW */}
        {headlines && view === "queue" && (
          <Section
            title="READ LATER"
            subtitle="Click a headline to open & clear it from the queue."
            articles={queueArticles}
            emptyMessage="Queue empty — click ○ next to any headline to save it for later."
            bookmarkSet={bookmarks}
            queueSet={queue}
            mutedSources={mutedSources}
            onToggleBookmark={toggleBookmark}
            onToggleQueue={toggleQueue}
            onMuteSource={toggleMuteSource}
            onHover={showHover}
            onHoverEnd={hideHover}
            consumeOnOpen
            onConsume={removeFromQueue}
          />
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

      {manageOpen && (
        <ManageMutes
          mutedSources={[...mutedSources]}
          mutedCategories={[...mutedCategories]}
          categoryLabelsById={categoryLabelsById}
          onUnmuteSource={toggleMuteSource}
          onUnmuteCategory={toggleMuteCategory}
          onClose={() => setManageOpen(false)}
        />
      )}
    </div>
  );
}

// Helper component for the bookmarks & queue single-column views.
interface SectionProps {
  title: string;
  subtitle: string;
  articles: GroupedArticle[];
  emptyMessage: string;
  bookmarkSet: Set<string>;
  queueSet: Set<string>;
  mutedSources: Set<string>;
  onToggleBookmark: (id: string) => void;
  onToggleQueue: (id: string) => void;
  onMuteSource: (s: string) => void;
  onHover: (a: GroupedArticle, e: React.MouseEvent) => void;
  onHoverEnd: () => void;
  consumeOnOpen?: boolean;
  onConsume?: (id: string) => void;
}

function Section({
  title, subtitle, articles, emptyMessage,
  bookmarkSet, queueSet, mutedSources,
  onToggleBookmark, onToggleQueue, onMuteSource,
  onHover, onHoverEnd, consumeOnOpen, onConsume,
}: SectionProps) {
  return (
    <section className="max-w-3xl mx-auto">
      <h2 className="section-heading">{title}</h2>
      <p className="text-[11px] opacity-60 -mt-3 mb-4">{subtitle}</p>
      {articles.length === 0 ? (
        <div className="opacity-60 text-center py-12">{emptyMessage}</div>
      ) : (
        <div>
          {articles.map((a) => (
            <Headline
              key={a.id}
              article={a}
              isBookmark={bookmarkSet.has(a.id)}
              isInQueue={queueSet.has(a.id)}
              isSourceMuted={false}
              onToggleBookmark={onToggleBookmark}
              onToggleQueue={onToggleQueue}
              onMuteSource={onMuteSource}
              onHover={onHover}
              onHoverEnd={onHoverEnd}
              consumeOnOpen={consumeOnOpen}
              onConsume={onConsume}
            />
          ))}
        </div>
      )}
    </section>
  );
}

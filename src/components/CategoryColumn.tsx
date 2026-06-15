import { useState } from "react";
import type { CategoryBucket, GroupedArticle } from "../lib/types";
import { Headline } from "./Headline";

interface CategoryColumnProps {
  bucket: CategoryBucket;
  bookmarkSet: Set<string>;
  queueSet: Set<string>;
  mutedSources: Set<string>;
  onToggleBookmark: (id: string) => void;
  onToggleQueue: (id: string) => void;
  onMuteSource: (source: string) => void;
  onMuteCategory: (id: string) => void;
  onHover: (article: GroupedArticle, e: React.MouseEvent) => void;
  onHoverEnd: () => void;
}

export function CategoryColumn({
  bucket,
  bookmarkSet,
  queueSet,
  mutedSources,
  onToggleBookmark,
  onToggleQueue,
  onMuteSource,
  onMuteCategory,
  onHover,
  onHoverEnd,
}: CategoryColumnProps) {
  // expanded = the "View all" toggle (applies on every screen size).
  const [expanded, setExpanded] = useState(false);
  // open = whether the section body is visible. On mobile the section starts
  // collapsed (so 18 sections don't bury the page); on desktop it's always
  // open. We track open state only so mobile users can expand/collapse.
  const [open, setOpen] = useState(true);

  const list = expanded ? bucket.articlesAll : bucket.articles;
  const hasMore = bucket.articlesAll.length > bucket.articles.length;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-2">
        <h2
          className="section-heading flex-1 cursor-pointer select-none md:cursor-default"
          onClick={() => setOpen((v) => !v)}
          title="Tap to expand/collapse on mobile"
        >
          {/* Caret only shows on mobile (md:hidden) */}
          <span className="md:hidden mr-1">{open ? "▼" : "▶"}</span>
          {bucket.label}
        </h2>
        <div className="flex items-center gap-2 text-[10px] opacity-50 uppercase tracking-wider pb-1 shrink-0">
          <span title="Distinct sources in this section">{bucket.sourceCount} src</span>
          <button
            onClick={() => onMuteCategory(bucket.id)}
            className="hover:text-[var(--siren)] hover:opacity-100"
            title={`Hide the ${bucket.label} section`}
          >
            ✕
          </button>
        </div>
      </div>
      {/* On mobile, hide body when collapsed. On desktop (md:block) always show. */}
      <div className={`${open ? "block" : "hidden"} md:block`}>
        {list.map((a) => (
          <Headline
            key={a.id}
            article={a}
            isBookmark={bookmarkSet.has(a.id)}
            isInQueue={queueSet.has(a.id)}
            isSourceMuted={mutedSources.has(a.source)}
            onToggleBookmark={onToggleBookmark}
            onToggleQueue={onToggleQueue}
            onMuteSource={onMuteSource}
            onHover={onHover}
            onHoverEnd={onHoverEnd}
          />
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] opacity-60 hover:opacity-100 underline mt-2 ml-7"
          >
            {expanded
              ? "▲ show less"
              : `▼ view all ${bucket.articlesAll.length}`}
          </button>
        )}
      </div>
    </section>
  );
}

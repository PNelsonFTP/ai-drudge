import { useState } from "react";
import type { GroupedArticle } from "../lib/types";
import { timeAgoDisplay } from "../lib/timeAgo";

interface HeadlineProps {
  article: GroupedArticle;
  isBookmark: boolean;
  isInQueue: boolean;
  isSourceMuted: boolean;
  onToggleBookmark: (id: string) => void;
  onToggleQueue: (id: string) => void;
  onMuteSource: (source: string) => void;
  onHover: (article: GroupedArticle, e: React.MouseEvent) => void;
  onHoverEnd: () => void;
  // When true (read-later view), clicking the title also removes from queue.
  consumeOnOpen?: boolean;
  onConsume?: (id: string) => void;
}

const PRIORITY_CLASS: Record<string, string> = {
  critical: "headline-critical",
  high: "headline-high",
  medium: "headline-medium",
  low: "headline-low",
};

export function Headline({
  article,
  isBookmark,
  isInQueue,
  isSourceMuted,
  onToggleBookmark,
  onToggleQueue,
  onMuteSource,
  onHover,
  onHoverEnd,
  consumeOnOpen,
  onConsume,
}: HeadlineProps) {
  const [showActions, setShowActions] = useState(false);

  const handleTitleClick = () => {
    if (consumeOnOpen && onConsume) onConsume(article.id);
  };

  // Dimmed if user has muted this source (only happens when explicitly
  // viewing muted items from the manage panel; otherwise they're filtered out).
  return (
    <div
      className="group flex items-start gap-1 py-1"
      onMouseEnter={(e) => { onHover(article, e); setShowActions(true); }}
      onMouseLeave={() => { onHoverEnd(); setShowActions(false); }}
    >
      <button
        onClick={() => onToggleBookmark(article.id)}
        className={`shrink-0 text-xs mt-0.5 ${isBookmark ? "text-[var(--gold)]" : "opacity-30 hover:opacity-100"}`}
        title={isBookmark ? "Remove bookmark" : "Bookmark (save permanently)"}
        aria-label={isBookmark ? "Remove bookmark" : "Bookmark"}
      >
        {isBookmark ? "★" : "☆"}
      </button>
      <button
        onClick={() => onToggleQueue(article.id)}
        className={`shrink-0 text-xs mt-0.5 ${isInQueue ? "text-[var(--accent)]" : "opacity-30 hover:opacity-100"}`}
        title={isInQueue ? "Remove from read-later" : "Add to read-later (clears on open)"}
        aria-label={isInQueue ? "Remove from read-later" : "Add to read-later"}
      >
        {isInQueue ? "◷" : "○"}
      </button>
      <div className={`min-w-0 flex-1 ${isSourceMuted ? "opacity-40" : ""}`}>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer noopener"
          onClick={handleTitleClick}
          className={PRIORITY_CLASS[article.priority] ?? "headline-medium"}
        >
          {article.title}
        </a>
        {article.related.length > 0 && (
          <span className="related-badge" title={`${article.related.length} more source(s) covering this story`}>
            +{article.related.length}
          </span>
        )}
        <div className="flex items-center gap-2 text-[10px] opacity-50 mt-0.5">
          <span className="source-badge">{article.source}</span>
          <span>{timeAgoDisplay(article.publishedAt)}</span>
          {showActions && !isSourceMuted && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMuteSource(article.source); }}
              className="opacity-60 hover:opacity-100 hover:text-[var(--siren)] underline ml-1"
              title={`Hide all stories from ${article.source}`}
            >
              mute
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

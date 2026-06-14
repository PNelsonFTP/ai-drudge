import type { GroupedArticle } from "../lib/types";
import { timeAgoDisplay } from "../lib/timeAgo";

interface HeadlineProps {
  article: GroupedArticle;
  isBookmark: boolean;
  onToggleBookmark: (id: string) => void;
  onHover: (article: GroupedArticle, e: React.MouseEvent) => void;
  onHoverEnd: () => void;
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
  onToggleBookmark,
  onHover,
  onHoverEnd,
}: HeadlineProps) {
  return (
    <div
      className="group flex items-start gap-1 py-1"
      onMouseEnter={(e) => onHover(article, e)}
      onMouseLeave={onHoverEnd}
    >
      <button
        onClick={() => onToggleBookmark(article.id)}
        className={`shrink-0 text-xs mt-0.5 ${isBookmark ? "text-[var(--gold)]" : "opacity-30 hover:opacity-100"}`}
        title={isBookmark ? "Remove bookmark" : "Bookmark"}
        aria-label={isBookmark ? "Remove bookmark" : "Bookmark"}
      >
        {isBookmark ? "★" : "☆"}
      </button>
      <div className="min-w-0 flex-1">
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer noopener"
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
        </div>
      </div>
    </div>
  );
}

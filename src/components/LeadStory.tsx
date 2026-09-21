import type { GroupedArticle } from "../lib/types";
import { timeAgoDisplay } from "../lib/timeAgo";

interface LeadStoryProps {
  article: GroupedArticle;
  onHover: (article: GroupedArticle, e: React.MouseEvent) => void;
  onHoverEnd: () => void;
}

export function LeadStory({ article, onHover, onHoverEnd }: LeadStoryProps) {
  return (
    <section
      className="panel mb-4 pb-3 border-b border-[var(--color-line)]"
      onMouseEnter={(e) => onHover(article, e)}
      onMouseLeave={onHoverEnd}
    >
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer noopener"
        className={`lead-title inline-block ${article.priority === "critical" ? "headline-critical" : ""}`}
      >
        {article.title}
      </a>
      <div className="flex items-center gap-3 mt-2 text-[11px] uppercase tracking-widest text-[var(--color-muted)]">
        <span className="source-badge">{article.source}</span>
        <span>{timeAgoDisplay(article.publishedAt)}</span>
      </div>
      {article.summary && (
        <p className="mt-2 text-[13px] opacity-80 max-w-2xl mx-auto">
          {article.summary}
        </p>
      )}
      {article.related.length > 0 && (
        <p className="mt-2 text-[11px] opacity-60">
          <span className="uppercase tracking-wider">Also covered by:</span>{" "}
          {article.related.map((r, i) => (
            <span key={r.url}>
              {i > 0 && " · "}
              <a href={r.url} target="_blank" rel="noreferrer noopener" className="underline">{r.source}</a>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

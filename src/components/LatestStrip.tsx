// #14: "LATEST" — strict reverse-chronological rail of the freshest stories
// across all sections, pinned near the top of the home view. Computed
// client-side from the filtered categories so it respects mutes/search.
import type { GroupedArticle } from "../lib/types";
import { timeAgoDisplay, isNew } from "../lib/timeAgo";

interface LatestStripProps {
  articles: GroupedArticle[];
  onHover: (a: GroupedArticle, e: React.MouseEvent) => void;
  onHoverEnd: () => void;
}

const LIMIT = 12;

export function LatestStrip({ articles, onHover, onHoverEnd }: LatestStripProps) {
  if (articles.length === 0) return null;

  const sorted = [...articles]
    .filter((a) => a.publishedAt)
    .sort((a, b) => {
      const ta = new Date(a.publishedAt!).getTime();
      const tb = new Date(b.publishedAt!).getTime();
      return tb - ta;
    })
    .slice(0, LIMIT);

  if (sorted.length === 0) return null;

  return (
    <section className="mb-6 border-l-2 border-[var(--accent)] pl-3">
      <h3 className="text-[11px] uppercase tracking-widest opacity-70 mb-2">
        Latest
      </h3>
      <ul className="space-y-1">
        {sorted.map((a) => {
          const fresh = isNew(a.publishedAt);
          return (
            <li
              key={a.id}
              onMouseEnter={(e) => onHover(a, e)}
              onMouseLeave={onHoverEnd}
              className="text-[13px] leading-snug flex items-start gap-1.5"
            >
              <span className="shrink-0 text-[10px] opacity-50 mt-0.5 w-12 tabular-nums">
                {timeAgoDisplay(a.publishedAt)}
              </span>
              <span className="min-w-0 flex-1">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:underline"
                >
                  {a.title}
                </a>
                {fresh && (
                  <span className="ml-1 text-[9px] uppercase tracking-wider text-[var(--siren)] font-bold">
                    NEW
                  </span>
                )}
                <span className="ml-1.5 text-[10px] opacity-50">{a.source}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import type { TrendingStory } from "../lib/types";
import { timeAgoDisplay } from "../lib/timeAgo";

interface TrendingProps {
  stories: TrendingStory[];
  onHover: (article: TrendingStory["lead"], e: React.MouseEvent) => void;
  onHoverEnd: () => void;
}

export function Trending({ stories, onHover, onHoverEnd }: TrendingProps) {
  if (stories.length === 0) return null;

  return (
    <section className="mb-6 p-4 border-2 border-[var(--siren)] bg-[var(--siren)]/[0.04]">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="section-heading" style={{ borderBottom: "none", marginBottom: 0 }}>
          ▶ TRENDING — covered by multiple outlets
        </h2>
        <span className="text-[10px] uppercase tracking-wider opacity-50">
          {stories.length} stories
        </span>
      </div>
      <ol className="space-y-2">
        {stories.map((s, i) => (
          <li
            key={s.lead.url}
            className="flex items-start gap-3"
            onMouseEnter={(e) => onHover(s.lead, e)}
            onMouseLeave={onHoverEnd}
          >
            <span className="font-bold text-[var(--siren)] text-lg leading-none w-6 shrink-0">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <a
                href={s.lead.url}
                target="_blank"
                rel="noreferrer noopener"
                className="font-bold hover:underline"
              >
                {s.lead.title}
              </a>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] opacity-70 flex-wrap">
                <span className="related-badge" style={{ background: "var(--siren)" }}>
                  {s.sourceCount} sources
                </span>
                <span>{timeAgoDisplay(s.lead.publishedAt)}</span>
                <span className="opacity-70">·</span>
                <span className="uppercase tracking-wider text-[10px]">
                  {s.sources.join(" · ")}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

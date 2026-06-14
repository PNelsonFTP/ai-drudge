import { useEffect, useRef, useState } from "react";
import type { GroupedArticle } from "../lib/types";
import { timeAgoDisplay } from "../lib/timeAgo";

interface HoverCardProps {
  article: GroupedArticle;
}

// Fixed-position card that follows the cursor. 200ms hide delay so the user
// can move the mouse into the card (matches the original Task 4 implementation).
export function HoverCard({ article, anchor }: HoverCardProps & { anchor: { x: number; y: number } | null }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(anchor);

  useEffect(() => { setPos(anchor); }, [anchor]);

  if (!pos) return null;

  // Keep card inside the viewport.
  const cardW = 340;
  const cardH = 260;
  const x = Math.min(pos.x + 14, window.innerWidth - cardW - 10);
  const y = Math.min(pos.y + 14, window.innerHeight - cardH - 10);

  return (
    <div className="hover-card p-3 text-[12px]" style={{ left: x, top: y }}>
      <div className="font-bold text-[13px] mb-1">{article.title}</div>
      <div className="flex items-center gap-2 mb-2 opacity-70">
        <span className="source-badge">{article.source}</span>
        <span>{timeAgoDisplay(article.publishedAt)}</span>
      </div>
      {article.summary && (
        <p className="opacity-90 mb-2" style={{ maxHeight: 90, overflow: "hidden" }}>
          {article.summary}
        </p>
      )}
      {article.related.length > 0 && (
        <div className="mb-2 opacity-70">
          <span className="uppercase text-[10px] tracking-wider">Also covered by:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {article.related.slice(0, 4).map((r) => (
              <a key={r.url} href={r.url} target="_blank" rel="noreferrer noopener" className="underline">
                {r.source}
              </a>
            ))}
          </div>
        </div>
      )}
      <a href={article.url} target="_blank" rel="noreferrer noopener" className="underline text-[var(--accent)]">
        Read article →
      </a>
    </div>
  );
}

// Hook used by Headline to manage hover position with the 200ms hide delay.
export function useHoverCard() {
  const [active, setActive] = useState<{ article: GroupedArticle; anchor: { x: number; y: number } } | null>(null);
  const hideTimer = useRef<number | null>(null);

  const show = (article: GroupedArticle, e: React.MouseEvent) => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setActive({ article, anchor: { x: e.clientX, y: e.clientY } });
  };

  const hide = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setActive(null), 200);
  };

  useEffect(() => () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  }, []);

  return { active, show, hide };
}

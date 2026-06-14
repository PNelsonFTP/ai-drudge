import type { StockQuote } from "../lib/types";

const ORDER = ["NVDA", "MSFT", "GOOG", "META", "AMZN"];

export function StockTicker({ stocks }: { stocks: Record<string, StockQuote> | null }) {
  if (!stocks) return null;
  const entries = ORDER.map((s) => stocks[s]).filter(Boolean);
  if (entries.length === 0) return null;

  return (
    <div className="ticker-bar">
      <div className="mx-auto max-w-[1400px] px-4 py-1 flex items-center gap-5 overflow-x-auto whitespace-nowrap">
        <span className="opacity-50 mr-2">AI STOCKS</span>
        {entries.map((q) => {
          const dir = q.changePct == null ? "flat" : q.changePct > 0 ? "up" : q.changePct < 0 ? "down" : "flat";
          const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "■";
          const cls = `ticker-${dir}`;
          const pct = q.changePct == null ? "—" : `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`;
          const price = q.price == null ? "—" : `$${q.price.toFixed(2)}`;
          return (
            <span key={q.symbol} className="flex items-center gap-1">
              <span className="font-bold">{q.symbol}</span>
              <span className={cls}>{price}</span>
              <span className={cls}>{arrow} {pct}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Stock quotes for NVDA, MSFT, GOOG, META, AMZN.
// Uses Stooq (free, no key, CSV) with a Yahoo fallback. Silently returns {}
// if every source fails — the site then hides the ticker gracefully.

import type { StockQuote } from "./types";

const SYMBOLS = ["NVDA", "MSFT", "GOOG", "META", "AMZN"];

// Stooq format: Symbol,Date,Time,Open,High,Low,Close,Volume
async function fromStooq(sym: string): Promise<StockQuote | null> {
  const url = `https://stooq.com/q/l/?s=${sym.toLowerCase()}.us&f=sd2t2ohlcv&h&e=csv`;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    const res = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return null;
    const cols = lines[1].split(",");
    const close = parseFloat(cols[6]);
    const open = parseFloat(cols[3]);
    if (!isFinite(close) || !isFinite(open) || open === 0) return null;
    return {
      symbol: sym,
      price: close,
      changePct: ((close - open) / open) * 100,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Yahoo unofficial quote endpoint. Sometimes blocked from datacenter IPs;
// that's fine — Stooq is the primary.
async function fromYahoo(sym: string): Promise<StockQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15" },
      signal: ctl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const json = await res.json() as any;
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    if (!isFinite(price) || !isFinite(prev)) return null;
    return {
      symbol: sym,
      price,
      changePct: ((price - prev) / prev) * 100,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchStocks(): Promise<Record<string, StockQuote>> {
  console.log("Fetching stock quotes…");
  const out: Record<string, StockQuote> = {};
  const results = await Promise.all(
    SYMBOLS.map(async (sym) => {
      const q = (await fromStooq(sym)) || (await fromYahoo(sym));
      if (q) console.log(`  ${sym}  $${q.price?.toFixed(2)}  ${q.changePct?.toFixed(2)}%`);
      else   console.log(`  ${sym}  (unavailable)`);
      return [sym, q] as const;
    })
  );
  for (const [sym, q] of results) if (q) out[sym] = q;
  return out;
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { Brief, HeadlinesPayload, StockQuote } from "../lib/types";

// Single source of truth for data loading.
//
// STALE-WHILE-REVALIDATE + PREVIEW/FULL SPLIT
// ────────────────────────────────────────────
// headlines-preview.json is the homepage (trending + default article lists)
// without View-All tails. headlines.json is the full payload.
// Returning users with a full session cache paint instantly; first-time
// visitors paint from the preview, then the full file hydrates in the
// background. Layout is unchanged — only the first-paint fetch is smaller.

const PREVIEW_URL   = `${import.meta.env.BASE_URL}data/headlines-preview.json`;
const HEADLINES_URL = `${import.meta.env.BASE_URL}data/headlines.json`;
const STOCKS_URL    = `${import.meta.env.BASE_URL}data/stocks.json`;
const BRIEF_URL     = `${import.meta.env.BASE_URL}data/brief.json`;

const HEADLINES_CACHE_KEY = "ai-drudge:cache:headlines";
const STOCKS_CACHE_KEY    = "ai-drudge:cache:stocks";
const BRIEF_CACHE_KEY     = "ai-drudge:cache:brief";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled — not fatal, just slower next visit.
  }
}

function isFullPayload(h: HeadlinesPayload | null): h is HeadlinesPayload {
  return !!h && !h.partial;
}

export function useHeadlines() {
  const cached = readCache<HeadlinesPayload>(HEADLINES_CACHE_KEY);
  const [headlines, setHeadlines] = useState<HeadlinesPayload | null>(() => cached);
  const [stocks, setStocks] = useState<Record<string, StockQuote> | null>(() =>
    readCache<Record<string, StockQuote>>(STOCKS_CACHE_KEY)
  );
  const [brief, setBrief] = useState<Brief | null>(() =>
    readCache<Brief>(BRIEF_CACHE_KEY)
  );
  const [error, setError] = useState<string | null>(null);

  const fullPromise = useRef<Promise<HeadlinesPayload | null> | null>(null);

  const applyFull = useCallback((h: HeadlinesPayload) => {
    setHeadlines(h);
    writeCache(HEADLINES_CACHE_KEY, h);
  }, []);

  const loadFull = useCallback(() => {
    if (!fullPromise.current) {
      fullPromise.current = fetchJson<HeadlinesPayload>(HEADLINES_URL);
    }
    return fullPromise.current.then((h) => {
      if (h && isFullPayload(h)) applyFull(h);
      return h;
    });
  }, [applyFull]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const haveFullCache = isFullPayload(cached);
      const [preview, s, b] = await Promise.all([
        haveFullCache ? Promise.resolve(null) : fetchJson<HeadlinesPayload>(PREVIEW_URL),
        fetchJson<Record<string, StockQuote>>(STOCKS_URL),
        fetchJson<Brief>(BRIEF_URL),
      ]);
      if (cancelled) return;

      if (preview && !isFullPayload(headlines)) {
        setHeadlines(preview);
        if (!haveFullCache) writeCache(HEADLINES_CACHE_KEY, preview);
      }

      if (s) {
        setStocks(s);
        writeCache(STOCKS_CACHE_KEY, s);
      } else if (!stocks) {
        setStocks({});
      }

      if (b) {
        setBrief(b);
        writeCache(BRIEF_CACHE_KEY, b);
      }

      const full = await loadFull();
      if (cancelled) return;
      if (!full && !preview && !haveFullCache) {
        setError("Failed to load headlines.");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { headlines, stocks, brief, error, loadFull };
}

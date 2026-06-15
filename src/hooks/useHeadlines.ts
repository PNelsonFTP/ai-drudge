import { useEffect, useState } from "react";
import type { Brief, HeadlinesPayload, StockQuote } from "../lib/types";

// Single source of truth for data loading.
//
// STALE-WHILE-REVALIDATE PATTERN
// ──────────────────────────────
// The data files are large (~150KB minified) and refresh hourly. Without
// SWR, every page load blocks on the fetch. With SWR:
//   1. On first paint, we read the cached copy from sessionStorage (instant).
//   2. We immediately render that stale copy.
//   3. In the background we fetch the latest version, then swap it in.
//
// This means: returning users see the previous headlines INSTANTLY, then it
// silently updates if the hourly cron ran since their last visit. First-time
// visitors still see the loading state once (no cache).

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
    // Quota exceeded or storage disabled — not fatal, just slower next load.
  }
}

export function useHeadlines() {
  // Seed from cache so first paint is instant for returning users.
  const [headlines, setHeadlines] = useState<HeadlinesPayload | null>(() =>
    readCache<HeadlinesPayload>(HEADLINES_CACHE_KEY)
  );
  const [stocks, setStocks] = useState<Record<string, StockQuote> | null>(() =>
    readCache<Record<string, StockQuote>>(STOCKS_CACHE_KEY)
  );
  const [brief, setBrief] = useState<Brief | null>(() =>
    readCache<Brief>(BRIEF_CACHE_KEY)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [h, s, b] = await Promise.all([
        fetchJson<HeadlinesPayload>(HEADLINES_URL),
        fetchJson<Record<string, StockQuote>>(STOCKS_URL),
        fetchJson<Brief>(BRIEF_URL),
      ]);
      if (cancelled) return;

      // If the network failed AND we have a cached copy, keep the cache
      // silently — don't surface an error to the user.
      if (h) {
        setHeadlines(h);
        writeCache(HEADLINES_CACHE_KEY, h);
      } else if (!headlines) {
        setError("Failed to load headlines.");
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
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { headlines, stocks, brief, error };
}

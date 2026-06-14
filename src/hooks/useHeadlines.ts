import { useEffect, useState } from "react";
import type { Brief, HeadlinesPayload, StockQuote } from "../lib/types";

// Single source of truth for data loading. Because the data is static JSON
// baked into the site at build time, there is no background refresh state to
// manage — exactly the failure mode the z.ai site hit with hasLoadedOnce refs.
//
// Vite serves anything under /public from the site root, so the JSON paths
// resolve to /data/*.json in dev and production alike.

const HEADLINES_URL = `${import.meta.env.BASE_URL}data/headlines.json`;
const STOCKS_URL    = `${import.meta.env.BASE_URL}data/stocks.json`;
const BRIEF_URL     = `${import.meta.env.BASE_URL}data/brief.json`;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function useHeadlines() {
  const [headlines, setHeadlines] = useState<HeadlinesPayload | null>(null);
  const [stocks, setStocks]       = useState<Record<string, StockQuote> | null>(null);
  const [brief, setBrief]         = useState<Brief | null>(null);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [h, s, b] = await Promise.all([
        fetchJson<HeadlinesPayload>(HEADLINES_URL),
        fetchJson<Record<string, StockQuote>>(STOCKS_URL),
        fetchJson<Brief>(BRIEF_URL),
      ]);
      if (cancelled) return;
      if (!h) setError("Failed to load headlines.");
      setHeadlines(h);
      setStocks(s ?? {});
      setBrief(b);
    })();
    return () => { cancelled = true; };
  }, []);

  return { headlines, stocks, brief, error };
}

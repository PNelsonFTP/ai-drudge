import { useCallback, useEffect, useState } from "react";

// Generic localStorage-backed string Set, with cross-tab sync.
// Used by useBookmarks, useReadLater, useMutedSources, useMutedCategories.
function makeReader(key: string) {
  return function read(): Set<string> {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch {
      return new Set();
    }
  };
}

function makeWriter(key: string) {
  return function write(ids: Set<string>) {
    try {
      localStorage.setItem(key, JSON.stringify([...ids]));
    } catch {
      /* storage might be unavailable — best-effort */
    }
  };
}

function useLocalStorageSet(key: string) {
  const read = makeReader(key);
  const write = makeWriter(key);
  const [set, setSet] = useState<Set<string>>(() => read());

  useEffect(() => {
    const handler = () => setSet(read());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const toggle = useCallback((id: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      write(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = useCallback((id: string) => {
    setSet((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      write(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = useCallback((id: string) => {
    setSet((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      write(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const has = useCallback((id: string) => set.has(id), [set]);

  return { set, toggle, add, remove, has };
}

// ─── Bookmarks (persistent save) ──────────────────────────────────────────
export function useBookmarks() {
  const { set: bookmarks, toggle, has } = useLocalStorageSet("ai-drudge:bookmarks");
  return { bookmarks, toggle, has };
}

// ─── Read-later queue (clears items as you click them open) ───────────────
//
// Unlike bookmarks (which persist forever), the queue is meant for daily
// catch-up: items get removed the moment you click them. Users add with the
// "later" button on a headline, then visit the queue view to read & clear.
export function useReadLater() {
  const { set: queue, toggle, has, remove } = useLocalStorageSet("ai-drudge:read-later");
  return { queue, toggle, has, remove };
}

// ─── Muted sources (hide every article from these outlets) ────────────────
export function useMutedSources() {
  const { set: muted, toggle, has } = useLocalStorageSet("ai-drudge:muted-sources");
  return { muted, toggle, has };
}

// ─── Muted categories (hide entire sections site-wide) ────────────────────
export function useMutedCategories() {
  const { set: muted, toggle, has } = useLocalStorageSet("ai-drudge:muted-categories");
  return { muted, toggle, has };
}

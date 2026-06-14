import { useCallback, useEffect, useState } from "react";

const KEY = "ai-drudge:bookmarks";

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function write(ids: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    /* storage might be unavailable — fine, bookmarks are best-effort */
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => read());

  useEffect(() => {
    const handler = () => setBookmarks(read());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggle = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      write(next);
      return next;
    });
  }, []);

  const has = useCallback((id: string) => bookmarks.has(id), [bookmarks]);

  return { bookmarks, toggle, has };
}

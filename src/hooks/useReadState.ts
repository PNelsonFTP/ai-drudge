import { createContext, useContext, useEffect, useMemo, useRef } from "react";

// Read-state tracking (#3 from the roadmap).
//
// A shared IntersectionObserver watches headline rows. When a row stays
// ≥60% visible for DWELL_MS, its article ID is recorded as "seen" in
// localStorage (LRU, capped). Dimming only applies to articles that were
// already seen when THIS page load started — so headlines never fade while
// you're reading them; they show up dimmed on your next visit.

const KEY = "ai-drudge:seen-articles";
const CAP = 500;
const DWELL_MS = 1500;
const VISIBILITY = 0.6;

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

interface ReadStateApi {
  // Was this article seen in a PREVIOUS session/page load?
  wasSeen: (id: string) => boolean;
  // Ref callback: attach to a headline row element.
  observe: (el: Element | null, id: string) => void;
}

const noop: ReadStateApi = { wasSeen: () => false, observe: () => {} };
export const ReadStateContext = createContext<ReadStateApi>(noop);
export const useReadState = () => useContext(ReadStateContext);

export function useReadStateProvider(): ReadStateApi {
  // Frozen snapshot of what was seen before this page load.
  const seenAtLoad = useMemo(() => new Set(readSeen()), []);

  // Live seen list (insertion order = recency; oldest evicted at CAP).
  const seenLive = useRef<string[]>([]);
  const seenLiveSet = useRef<Set<string>>(new Set());
  const observer = useRef<IntersectionObserver | null>(null);
  const idByEl = useRef<Map<Element, string>>(new Map());
  const elById = useRef<Map<string, Element>>(new Map());
  const dwellTimers = useRef<Map<Element, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    seenLive.current = readSeen();
    seenLiveSet.current = new Set(seenLive.current);

    const markSeen = (id: string) => {
      if (seenLiveSet.current.has(id)) return;
      seenLiveSet.current.add(id);
      seenLive.current.push(id);
      while (seenLive.current.length > CAP) {
        const evicted = seenLive.current.shift();
        if (evicted) seenLiveSet.current.delete(evicted);
      }
      try {
        localStorage.setItem(KEY, JSON.stringify(seenLive.current));
      } catch {
        /* best-effort */
      }
    };

    observer.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target;
          const pending = dwellTimers.current.get(el);
          if (entry.isIntersecting && entry.intersectionRatio >= VISIBILITY) {
            if (!pending) {
              const timer = setTimeout(() => {
                const id = idByEl.current.get(el);
                if (id) markSeen(id);
                dwellTimers.current.delete(el);
              }, DWELL_MS);
              dwellTimers.current.set(el, timer);
            }
          } else if (pending) {
            clearTimeout(pending);
            dwellTimers.current.delete(el);
          }
        }
      },
      { threshold: VISIBILITY }
    );

    return () => {
      for (const t of dwellTimers.current.values()) clearTimeout(t);
      dwellTimers.current.clear();
      observer.current?.disconnect();
      observer.current = null;
    };
  }, []);

  return useMemo<ReadStateApi>(
    () => ({
      wasSeen: (id) => seenAtLoad.has(id),
      observe: (el, id) => {
        const prev = elById.current.get(id);
        if (prev && prev !== el) {
          observer.current?.unobserve(prev);
          idByEl.current.delete(prev);
          const t = dwellTimers.current.get(prev);
          if (t) {
            clearTimeout(t);
            dwellTimers.current.delete(prev);
          }
        }
        if (el) {
          elById.current.set(id, el);
          idByEl.current.set(el, id);
          observer.current?.observe(el);
        } else {
          elById.current.delete(id);
        }
      },
    }),
    [seenAtLoad]
  );
}

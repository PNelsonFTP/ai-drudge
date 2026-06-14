// Same-story grouping via Jaccard similarity on title tokens.
// Mirrors the algorithm from the original site's Task 4 (threshold 0.4).

import type { Article, GroupedArticle } from "../types";

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","by","at","from",
  "is","are","was","were","be","been","as","it","its","this","that","these","those",
  "says","said","will","has","have","had","new","ai","via","after","over","into",
  "you","your","i","we","our","they","their","he","she","his","her",
]);

function tokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

const THRESHOLD = 0.4;

// Greedy clustering: process articles newest-first; the first article in a
// cluster becomes the lead, subsequent matches attach as `related`.
export function groupStories(articles: Article[]): GroupedArticle[] {
  const sorted = [...articles].sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });

  const clusters: { lead: Article; related: Article[]; tokens: Set<string> }[] = [];

  for (const art of sorted) {
    const toks = tokens(art.title);
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < clusters.length; i++) {
      const score = jaccard(toks, clusters[i].tokens);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && bestScore >= THRESHOLD) {
      clusters[bestIdx].related.push(art);
    } else {
      clusters.push({ lead: art, related: [], tokens: toks });
    }
  }

  return clusters.map((c) => ({ ...c.lead, related: c.related }));
}

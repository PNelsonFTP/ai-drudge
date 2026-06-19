# AI DRUDGE — Design Document

Architecture, data flow, algorithms, and design decisions for the static AI news aggregator.

## 1. System overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions (hourly)                          │
│  npm run build:data  →  public/data/*.json  →  npm run build  →  dist  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     GitHub Pages (static hosting)                       │
│   https://pnelsonftp.github.io/ai-drudge/                             │
│   ├── index.html + JS/CSS bundles                                       │
│   └── data/headlines.json, stocks.json, brief.json                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Browser (React SPA, no backend)                     │
│   Fetch JSON → SWR cache → render 3-column Drudge layout                │
│   localStorage: bookmarks, queue, mutes, theme                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core design principle

**All network I/O to third-party feeds happens at build time, never in the browser.**

This eliminates OOM, rate limits, and blank-page refresh states that killed the original Next.js deployment.

## 2. Technology stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| UI | React 19 + TypeScript | Component model, type safety |
| Build | Vite 6 | Fast dev, static output |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | Utility-first, small CSS bundle |
| Data fetch | Node `fetch` + `tsx` scripts | No server; runs in CI only |
| XML | `fast-xml-parser` 4.x | RSS/Atom; entity expansion config critical |
| Hosting | GitHub Pages | Free, cron-friendly, no ops |
| CI | GitHub Actions | Hourly refresh + deploy |

### Base path

`vite.config.ts` sets `base: "/ai-drudge/"` for GitHub Pages project-site hosting. All asset and data URLs are relative to this base.

## 3. Build pipeline

### 3.1 Orchestration (`scripts/build-data.ts`)

1. Run `fetchAllFeeds()` and `scrapeAllSources()` in parallel
2. Merge raw articles
3. `routeArticles()` — assign categories, apply caps, compute trending
4. `groupStories()` per category bucket
5. Fetch stocks and generate brief (parallel)
6. Write minified JSON to `public/data/`

### 3.2 RSS fetch (`scripts/fetch-feeds.ts`)

- **Concurrency:** `Promise.all` over all feeds (no explicit pool — CI has ample memory vs. original OOM context)
- **Timeout:** 8 seconds per feed
- **Per-feed cap:** 15 items (prevents OpenAI News 1005-item flood)
- **Entity decoding:** `decodeHtmlEntities()` on title and summary
- **Release noise filter:** Drops titles matching `^[a-f0-9]{5,}$` or `^v\d+\.\d+` (GitHub release tags)
- **GitHub release summaries:** Extracts text from `<content>` when summary is empty
- **XML parser config:**

```ts
processEntities: {
  maxTotalExpansions: 100000,
  maxEntitySize: 10000,
  maxExpandedLength: 100000,
}
```

Without this, feeds with heavy entity expansion (GitHub, Reddit, Simon Willison) silently return empty.

### 3.3 HTML scraper (`scripts/scrape-sources.ts`)

For publishers without public RSS:

| Source | Method |
|--------|--------|
| Anthropic News | Scrape listing page, extract article links |
| Anthropic Research | Same pattern |

Returns articles in the same `Article` shape as RSS. Category assignment happens in the router.

### 3.4 Routing (`scripts/lib/router.ts`)

Each article can appear in **multiple categories** based on keyword rules in `sources.ts` (`KEYWORDS` array).

**Scoring per (article, category) pair:**

```
score = priorityWeight[priority] + recencyBonus + keywordMatchCount
```

**Selection per category:**

1. Sort candidates by score descending
2. Apply **per-source diversity cap** within category (default: max 2 from same source in preview)
3. Take top N for `articles` (preview), retain full sorted list in `articlesAll`

**Global source cap:** Max **6 unique articles per source** across all categories in one build. Prevents any single publisher from dominating the entire homepage.

**Trending:** Stories with **2+ distinct sources** covering the same grouped story (via Jaccard clustering) surface in `trending[]`.

### 3.5 Story grouping (`scripts/lib/groupStories.ts`)

Within each category:

1. Tokenize titles (lowercase, strip punctuation)
2. Jaccard similarity ≥ **0.4** → same story cluster
3. Highest-scored article becomes `lead`; others go in `related[]`

### 3.6 Stocks (`scripts/fetch-stocks.ts`)

Symbols: NVDA, MSFT, GOOG, META, AMZN

1. Try Stooq CSV endpoint (no API key)
2. Fallback to Yahoo Finance unofficial API
3. Output `stocks.json` with price, changePct, fetchedAt

### 3.7 Daily brief (`scripts/generate-brief.ts`)

1. If `ANTHROPIC_API_KEY` set in CI → Claude generates headline + 5 bullets with citations
2. Else **fallback:** curated bullets from trending stories, lead story, and cross-category sampling (not random single-source posts)

Output: `brief.json` with `source: "claude" | "fallback"`.

## 4. Data contracts

### `HeadlinesPayload` (`scripts/types.ts` / `src/lib/types.ts`)

```ts
{
  generatedAt: string;       // ISO 8601
  totalCount: number;
  trending: TrendingStory[];
  categories: CategoryBucket[];
  feedStats: { source, ok, count }[];
}
```

### `CategoryBucket`

```ts
{
  id: CategoryId;
  label: string;
  articles: GroupedArticle[];      // preview (shown by default)
  articlesAll: GroupedArticle[];   // full list for "View all"
  sourceCount: number;
}
```

### `GroupedArticle`

Extends `Article` with `related: Article[]` for multi-source coverage.

### Local storage keys (client)

| Key | Type | Purpose |
|-----|------|---------|
| `ai-drudge-bookmarks` | `Set<string>` (article IDs) | Saved headlines |
| `ai-drudge-queue` | `Set<string>` | Read-later; cleared when article opened |
| `ai-drudge-muted-sources` | `Set<string>` | Hidden by source name |
| `ai-drudge-muted-categories` | `Set<string>` | Hidden category IDs |
| `ai-drudge-theme` | `"light" \| "dark"` | Color scheme |
| `ai-drudge-headlines-cache` | JSON | sessionStorage SWR cache |

## 5. Client architecture

### 5.1 Layout (`App.tsx`)

Three Drudge-style columns on desktop:

- **Left:** MODEL RELEASES, INDUSTRY NEWS, LOCAL MODELS, AGENTS & TOOLS, AI FINANCE, RESEARCH
- **Center:** Lead story, Daily Brief, Trending, PRODUCTS, HARDWARE, OPEN SOURCE
- **Right:** SAFETY, AI SECURITY, CYBER THREATS, CYBER DEFENSE, FUNDING, ANALYSIS, ROBOTICS, QUANTUM, GITHUB REPOS

Mobile: single column with tap-to-expand accordion per section.

### 5.2 Views

| View | Trigger | Content |
|------|---------|---------|
| Home | Default | Full aggregator |
| Bookmarks | Header toggle | Filtered saved articles |
| Queue | Header toggle | Read-later list |

### 5.3 Data loading (`useHeadlines.ts`)

**Stale-while-revalidate pattern:**

1. On mount, read `sessionStorage` cache if present → render immediately
2. Fetch `${base}data/headlines.json` in background
3. If newer `generatedAt`, update state and cache
4. On fetch error with stale cache → keep showing stale data

`index.html` includes `<link rel="preload">` for all three JSON files.

### 5.4 Hover cards (`HoverCard.tsx`)

- 200ms delay before hide (prevents flicker when moving mouse to card)
- Shows summary, related sources, published time

### 5.5 Filtering

Client-side only:

- Search filters title/source across visible articles
- Muted sources/categories excluded from render
- Bookmarks/queue views use stored ID sets

## 6. Category taxonomy (18)

Order in `CATEGORIES` array = homepage order. GITHUB REPOS is intentionally last.

| ID | Label |
|----|-------|
| `model_releases` | MODEL RELEASES |
| `industry_news` | INDUSTRY NEWS |
| `local_models` | LOCAL MODELS |
| `agents_tools` | AGENTS & TOOLS |
| `ai_finance` | AI FINANCE |
| `research` | RESEARCH |
| `products` | PRODUCTS |
| `hardware` | HARDWARE |
| `open_source` | OPEN SOURCE |
| `safety_policy` | SAFETY & POLICY |
| `ai_security` | AI SECURITY |
| `cyber_threats` | CYBER THREATS |
| `cyber_defense` | CYBER DEFENSE |
| `funding` | FUNDING & DEALS |
| `analysis` | ANALYSIS |
| `robotics` | ROBOTICS |
| `quantum` | QUANTUM |
| `github_repos` | GITHUB REPOS |

## 7. Failure modes and mitigations

| Failure | Symptom | Mitigation |
|---------|---------|------------|
| Feed down / 403 | Missing stories from that source | `feedStats` logs ok:false; site still loads |
| XML entity explosion | Empty feed parse | `processEntities` limits raised |
| Single source flood | One publisher dominates | Per-feed cap 15 + global cap 6 |
| GitHub release spam | Noise titles in GITHUB REPOS | Regex noise filter |
| No Anthropic RSS | Gap in major AI news | HTML scraper |
| CI JSON commit conflict | Rebase failure on `public/data/` | See HANDOFF.md conflict resolution |
| Large JSON payload | Slow first paint | SWR cache, preload, minified JSON |
| Missing API key | Generic brief | Curated fallback from trending |

## 8. Security model

- **No secrets in client bundle** — only static JSON
- **ANTHROPIC_API_KEY** — GitHub Actions secret only; used at build time
- **No user accounts** — all personalization is localStorage
- **External links** — `target="_blank"` with `rel="noopener noreferrer"`
- **Feed URLs** — fetched server-side in CI; users never hit feed endpoints directly

## 9. Performance budget

| Asset | Target |
|-------|--------|
| `headlines.json` | ~360 KB (largest cost; `articlesAll` is main driver) |
| JS bundle | ~67 KB gzip |
| CSS | ~4 KB gzip |
| Time to interactive | Sub-second on repeat visit (SWR) |

## 10. Extension points

| Want to… | Edit… |
|----------|-------|
| Add a feed | `scripts/sources.ts` → `FEEDS` array |
| Add routing keyword | `scripts/sources.ts` → `KEYWORDS` |
| Add category | `CategoryId` type + `CATEGORIES` + column layout in `App.tsx` |
| Scrape new site | `scripts/scrape-sources.ts` |
| Change refresh schedule | `.github/workflows/refresh.yml` cron |
| Change preview count | `router.ts` preview limits |
| Wire PWA | `vite.config.ts` + `vite-plugin-pwa` |

## 11. Related documents

- [PROJECT_HISTORY.md](./PROJECT_HISTORY.md) — what was built and when
- [HANDOFF.md](./HANDOFF.md) — operations and troubleshooting
- [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) — next upgrade cycle
- [SBOM.md](./SBOM.md) — dependency bill of materials

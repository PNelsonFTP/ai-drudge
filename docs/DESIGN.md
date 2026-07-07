# AI DRUDGE — Design Document

Architecture, data flow, algorithms, and design decisions for the static AI
news aggregator. Last updated: 2026-07-06.

## 1. System overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions (hourly)                           │
│  build:data → public/data/*.json + public/feed.xml                      │
│  build:check (quality gate) → vite build → deploy dist/ to Pages        │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     GitHub Pages (static hosting)                        │
│   https://pnelsonftp.github.io/ai-drudge/                                │
│   ├── index.html + JS/CSS bundles                                        │
│   ├── data/headlines.json, stocks.json, brief.json                       │
│   └── feed.xml  (Atom feed of the aggregator itself)                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     Browser (React SPA, no backend)                      │
│   Fetch JSON → SWR cache → render 3-column Drudge layout                 │
│   localStorage: bookmarks+snapshots, queue, mutes, read-state, theme     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Core design principle

**All network I/O to third-party feeds happens at build time, never in the
browser.** This eliminates the OOM, rate-limit, and blank-page failure modes
that killed the original Next.js deployment.

## 2. Technology stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| UI | React 19 + TypeScript 5.8 | Component model, type safety |
| Build | Vite 6 | Fast dev, static output |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | Utility-first, ~5 KB gzip CSS |
| Data fetch | Node `fetch` + `tsx` scripts | No server; runs in CI only |
| XML | `fast-xml-parser` 5.x | RSS/Atom/RDF; raised entity-expansion caps are load-bearing |
| Hosting | GitHub Pages | Free, cron-friendly, no ops |
| CI | GitHub Actions | Hourly refresh + weekly feed audit |

### Base path

`vite.config.ts` sets `base: "/ai-drudge/"` for project-site hosting. All asset
and data URLs are relative to this base.

## 3. Build pipeline

### 3.1 Orchestration (`scripts/build-data.ts`)

1. `fetchAllFeeds()` (RSS/Atom/RDF), `scrapeAllSources()` (HTML), and
   `fetchHn()` (HN velocity index) run in parallel
2. Merge articles → `buildCategories()` (routing, scoring, windows, trending)
3. Write minified `headlines.json`
4. `buildSiteFeed()` → `public/feed.xml` (Atom, top ~30: trending + category leads)
5. Stocks (`stocks.json`) and Claude/fallback brief (`brief.json`)

**Resilience:** if fetch+scrape produce zero articles, the previous
`headlines.json` is kept and the build exits 0 — the site never regresses to
blank.

### 3.2 RSS fetch (`scripts/fetch-feeds.ts`)

- ~170 feeds fetched in parallel (`Promise.all`), 8s timeout, 3 attempts with
  jittered backoff and rotating User-Agent
- **Format support:** RSS 2.0, Atom, and RDF/RSS 1.0 (`rdf:RDF` root — Nature
  journals); item dates read from `pubDate`/`published`/`updated`/`dc:date`
- **Feed sniffing:** non-XML responses (SPA HTML, Cloudflare interstitials)
  are rejected before parsing so they can't produce silent 0-item "OK" feeds
- **Per-feed cap:** 15 newest items (keeps Reddit/Google News floods bounded)
- **GitHub release title cleanup** (`cleanGitHubReleaseTitle`): tag-only
  releases ("v0.30.8", "b9892") synthesize "repo b9892 released"; only the
  NEWEST synthesized title per feed survives so busy repos contribute one line,
  while releases with real headlines keep them (version prefix stripped)
- **Entity decoding** after HTML stripping; parser configured with raised
  entity-expansion limits (large GitHub/Simon Willison feeds trip defaults)
- **Dedup:** by normalized URL, then by lowercased title

### 3.3 HTML scraper (`scripts/scrape-sources.ts`)

For publishers with no public RSS (verified 2026-07-06 — the full no-feed list
is documented at the top of `sources.ts`):

| Source | Method |
|--------|--------|
| Anthropic News | Regex over listing-page cards (`<a href="/news/…">`) |
| Anthropic Research | Same pattern |

### 3.4 Scoring (`scripts/lib/score.ts`)

Single source of truth used by the router:

```
finalScore = priorityScore    (critical 40 / high 25 / medium 12 / low 4)
           + recencyScore     (100 → exponential decay, 48h half-life, floor 2)
           + importanceScore  (0–30; launch/model/money/event keywords, gated to <96h)
           + hnBoost          (0–25 exact-URL HN points match; 0–8 domain match)
           + homeBonus        (6 when scored for the feed's home category)
```

Recency dominating priority is intentional: a fresh medium-priority item
(~112) outranks a 3-day-old critical one (~65).

### 3.5 Routing (`scripts/lib/router.ts`)

1. **Global per-source cap:** max 6 articles per source per build, applied to
   the priority+recency pre-sorted list
2. **Multi-category routing:** home category + any `KEYWORDS` matches
   (aggregators in `KEYWORD_AGNOSTIC_SOURCES` — Reddit, Lemmy — stay home-only)
3. Per category: hard age-window drop → score → starvation-aware fill (soft
   window first, backfill to `minItems` only) → Jaccard story grouping →
   per-source diversity cap (2–5 depending on source count)
4. **Trending:** clusters covered by ≥2 distinct sources and <72h old (relaxed
   to <120h if fewer than 4 qualify), unified across categories by URL or
   title-Jaccard ≥ 0.4, capped at 12
5. **Lead story:** highest-scoring article under 72h

### 3.6 Story grouping (`scripts/lib/groupStories.ts`)

Greedy clustering, newest-first; title-token Jaccard ≥ 0.4 attaches an article
to a cluster as `related`.

### 3.7 Stocks (`scripts/fetch-stocks.ts`)

NVDA, MSFT, GOOG, META, AMZN, AMD, TSM, AVGO — Stooq CSV primary, Yahoo chart
API fallback, silent per-symbol failure.

### 3.8 Daily brief (`scripts/generate-brief.ts`)

With `ANTHROPIC_API_KEY`: Claude Sonnet 5 (`claude-sonnet-5`, thinking
disabled, effort low) summarizes the fetched headlines under a strict
anti-hallucination prompt; cited URLs are validated against the input set.
Without it: curated fallback from trending + lead + cross-category sampling.

### 3.9 Site feed (`scripts/lib/emitFeed.ts`)

Atom 1.0 feed of the aggregator: trending leads, then each category's top
story, then runners-up — deduped, capped at 30, entries link to the original
source articles. Served at `/ai-drudge/feed.xml` and advertised via
`<link rel="alternate">`.

### 3.10 Quality gate (`scripts/check-data.ts`)

Runs in CI after every data build. Hard-fails on: feed health <80%, any
displayed item older than 30 days, or more than half the sections empty.
Warns on: median age >96h, feed health <90%, zero-item OK feeds, thin trending.

### 3.11 Feed validator (`scripts/validate-feeds.ts`)

`npm run validate:feeds` checks every configured URL: HTTP status, feed
sniffing, parse, item count, newest-item age (STALE >60d), and cross-host
redirects (permanently moved feeds). Runs weekly in CI
(`.github/workflows/feed-audit.yml`); also accepts a JSON candidate list as
argv for vetting new sources.

## 4. Data contracts

### `HeadlinesPayload` (`scripts/types.ts` ≡ `src/lib/types.ts`)

```ts
{
  generatedAt: string;          // ISO 8601 build time
  totalCount: number;
  trending: TrendingStory[];    // ≥2-source clusters, fresh-gated
  categories: CategoryBucket[]; // articles (preview) + articlesAll (view-all)
  feedStats: { source, ok, count }[];
  leadUrl?: string | null;      // lead story (<72h at build)
}
```

### localStorage keys (client)

| Key | Type | Purpose |
|-----|------|---------|
| `ai-drudge:bookmarks` | `string[]` (article IDs) | Saved headlines |
| `ai-drudge:read-later` | `string[]` | Queue; cleared when opened |
| `ai-drudge:article-snapshots` | `Record<id, Article>` | Full copies of bookmarked/queued articles so they survive after aging out of the payload; GC'd when unreferenced |
| `ai-drudge:muted-sources` | `string[]` | Hidden source names |
| `ai-drudge:muted-categories` | `string[]` | Hidden category IDs |
| `ai-drudge:seen-articles` | `string[]` (LRU, cap 500) | Read-state; headlines seen ≥1.5s at ≥60% visibility |
| `ai-drudge:last-visit` | ISO string | Drives the "N new since your last visit" banner |
| `ai-drudge:theme` | `"light" \| "dark"` | Color scheme |
| `ai-drudge:cache:*` | JSON (sessionStorage) | SWR cache of the three data files |

## 5. Client architecture

### 5.1 Layout (`App.tsx`)

Header (search, view toggles, theme) → stock ticker → Daily Brief → Trending →
Lead story → LATEST strip → 3-column category grid (round-robin fill).
Mobile: single column, tap-to-collapse sections.

### 5.2 Views & features

| Feature | Where |
|---------|-------|
| Bookmarks / read-later views (payload + snapshot merge) | `App.tsx` `collectSaved`, `useArticleSnapshots` |
| Read-state dimming (previous sessions only) | `useReadState.ts` + `Headline.tsx` |
| "N new since your last visit" banner | `App.tsx` `useLastVisit` (compares `publishedAt`, not `collectedAt` — the latter resets every build) |
| Feed Health panel | footer button → `FeedHealth.tsx` (renders `feedStats`) |
| Hover preview cards (200ms hide delay) | `HoverCard.tsx` |
| Search (title/source/category/summary) | `App.tsx` filter |
| Mute sources & categories | `ManageMutes.tsx` + `useLocalStorageSet` |
| Stale-data warning (>6h) | header + banner |

### 5.3 Data loading (`useHeadlines.ts`)

Stale-while-revalidate: render sessionStorage copy instantly, fetch fresh JSON
in background, swap in. Fetch failure with a cache present is silent.
`index.html` preloads all three JSON files.

## 6. Category taxonomy (18)

Order in `CATEGORIES` = homepage order; GITHUB REPOS intentionally last.
`model_releases, industry_news, local_models, agents_tools, ai_finance,
research, products, hardware, open_source, safety_policy, ai_security,
cyber_threats, cyber_defense, funding, analysis, robotics, quantum,
github_repos` — labels in `scripts/sources.ts`.

## 7. Failure modes and mitigations

| Failure | Symptom | Mitigation |
|---------|---------|------------|
| Feed down / 403 / 429 | Missing stories from that source | `feedStats` marks it; site still ships. Reddit/hnrss failures are expected-intermittent (see HANDOFF). |
| SPA/interstitial response | Would parse as 0 items | Feed sniffing rejects non-XML bodies |
| XML entity explosion | Empty parse on big feeds | Raised `processEntities` caps |
| Single source flood | One publisher dominates | 15/feed cap + 6/source global cap + per-section diversity cap |
| GitHub tag-only releases | Noise or empty REPOS section | Title synthesis, newest-only per feed |
| Total fetch failure | Blank site | Previous `headlines.json` kept; build exits 0 |
| Stale content leak | Old items resurface | Hard age windows + `build:check` 30-day hard fail |
| Feed URL rot | Slow silent decay | Weekly `feed-audit.yml` + `validate:feeds` |
| Missing API key | No AI brief | Curated fallback from trending |

## 8. Security model

- **No secrets in the client** — static JSON only; `ANTHROPIC_API_KEY` exists
  only as an Actions secret used at build time
- **No user accounts** — all personalization is localStorage
- **External links** — `target="_blank"` + `rel="noopener noreferrer"`
- **Feed fetching is CI-side** — users never touch third-party endpoints
- **Dependencies** — 0 `npm audit` findings as of 2026-07-06; CycloneDX SBOM in
  `docs/SBOM.json` regenerated via `npm run sbom`

## 9. Performance budget

| Asset | Current |
|-------|---------|
| `headlines.json` | ~300 KB minified (258 visible stories; `articlesAll` is the driver) |
| JS bundle | ~69 KB gzip |
| CSS | ~4.7 KB gzip |
| Repeat visit | Sub-second (SWR cache) |

## 10. Extension points

| Want to… | Edit… |
|----------|-------|
| Add/remove a feed | `scripts/sources.ts` → `SOURCES`, then `npm run validate:feeds` |
| Add routing keyword | `scripts/sources.ts` → `KEYWORDS` |
| Add a category | `CategoryId` + `CATEGORIES` + `AGE_WINDOWS` in `sources.ts` |
| Scrape a no-RSS site | `scripts/scrape-sources.ts` |
| Change refresh cadence | `refresh.yml` cron |
| Change preview/View-All counts | `router.ts` caps |
| Change ticker symbols | `fetch-stocks.ts` + `StockTicker.tsx` |
| Change site-feed contents | `scripts/lib/emitFeed.ts` |

## 11. Related documents

- [PROJECT_HISTORY.md](./PROJECT_HISTORY.md) — what was built and when
- [HANDOFF.md](./HANDOFF.md) — operations and troubleshooting
- [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) — next upgrade cycle
- [SBOM.md](./SBOM.md) — dependency bill of materials

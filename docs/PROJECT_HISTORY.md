# AI DRUDGE — Project History

Chronological record of what was built, why, and what was deliberately rejected. Use this with [DESIGN.md](./DESIGN.md) and [HANDOFF.md](./HANDOFF.md).

## Origin

| Item | Detail |
|------|--------|
| Inspiration | [Drudge Report](https://www.drudgereport.com/) layout and density |
| Prior attempt | Next.js site at `pacoaifeed.space-z.ai` (hosted on z.ai) |
| Workspace path | `/Users/paulnelson/Documents/Cursor/ai-drudge` |
| Live deployment | https://pnelsonftp.github.io/ai-drudge/ |
| Git remote | https://github.com/PNelsonFTP/ai-drudge |
| Related asset | `cyber-drudge-prompt.md` at workspace root — reusable prompt for a cybersecurity variant |

## Why the original failed (z.ai / Next.js)

The prior site scraped RSS **inside Next.js API routes at request time**. That caused:

- 90+ second blocking responses on first load
- Container OOM kills under concurrent feed fetches
- Rate-limit errors from feed publishers
- Page going **blank during refresh** while the client waited for new data
- A failed fix (commit `75da178`) that added `refreshing` / `justUpdated` / `hasLoadedOnce` ref state and broke the content grid JSX

**Root fix:** move all fetching to **build time** (GitHub Actions hourly cron). The browser only loads static JSON.

## Development timeline

### Phase 1 — Initial build (June 14, 2026)

**Commit:** `76d1637` — Initial commit

- Scaffolded Vite 6 + React 19 + TypeScript 5.8 + Tailwind v4
- ~50 RSS feeds across 16 categories (AI + partial cybersec)
- Build scripts: `fetch-feeds.ts`, `fetch-stocks.ts`, `generate-brief.ts`, `build-data.ts`
- Client: Drudge 3-column layout, dark mode, hover cards (200ms hide), bookmarks
- Jaccard ≥0.4 story grouping, 9-pattern date extraction
- Stock ticker: NVDA, MSFT, GOOG, META, AMZN
- GitHub Actions hourly cron + GitHub Pages deploy
- **Known issue at ship:** each section dominated by one source (feed pinned to single category)

### Phase 2 — Multi-category routing + new sections (June 14–15)

**Commit:** `b916713` — Multi-category routing + 3 new sections + diversity cap

- **Problem:** Articles only appeared in their feed's home category; Microsoft Research could flood RESEARCH alone
- **Fix:** `scripts/lib/router.ts` — keyword routing + priority/recency scoring + per-source diversity cap within categories
- Added categories: **LOCAL MODELS**, **GITHUB REPOS**, **AI FINANCE**
- Expanded to ~103 feed sources
- Data shape: `articlesAll`, `sourceCount`, top-level `trending[]`
- UX: Trending section, View All expansion, read-later queue, mute sources/categories, mobile accordion
- Reordered: GITHUB REPOS moved to bottom of homepage

### Phase 3 — Quality pass (June 15, 2026)

**Commit:** `7d196b2` — Quality pass

| Fix | Before | After |
|-----|--------|-------|
| HTML entities in titles | 18 leaked (`&#8217;`) | 0 |
| GitHub release noise | 43 titles (`b9637`, `v0.30.4`) | 1 (legit Stratechery episode) |
| Per-source global cap | Unlimited cross-category | 6 unique articles per source |
| Anthropic coverage | Missing (no RSS) | 8 posts via HTML scraper |
| Fallback daily brief | 3 random OpenAI posts | 5 diverse bullets from trending + categories |
| Client perf | Block on every load | SWR + sessionStorage + preload hints |
| `fast-xml-parser` entity limit | Default 1000 (silent feed drops) | Raised via `processEntities` config |

## Feature inventory (current)

### Build pipeline (`scripts/`)

| Component | File | Purpose |
|-----------|------|---------|
| Feed registry | `sources.ts` | ~103 feeds, 18 categories, KEYWORDS map |
| RSS fetcher | `fetch-feeds.ts` | Parallel fetch, 8s timeout, entity decode, release-noise filter |
| HTML scraper | `scrape-sources.ts` | Anthropic News + Research (no public RSS) |
| Router | `lib/router.ts` | Multi-category routing, global cap 6, trending, diversity |
| Story grouping | `lib/groupStories.ts` | Jaccard ≥0.4 within category |
| Time parsing | `lib/timeAgo.ts` | 9 date patterns |
| Stocks | `fetch-stocks.ts` | Stooq + Yahoo fallback |
| Brief | `generate-brief.ts` | Claude (optional) or curated fallback |
| Orchestrator | `build-data.ts` | Parallel RSS + scrape → route → minified JSON |

### Client (`src/`)

| Feature | Component / hook |
|---------|------------------|
| 3-column Drudge layout | `App.tsx` |
| Dark/light theme | `useTheme.ts` |
| Stale-while-revalidate load | `useHeadlines.ts` + sessionStorage |
| Bookmarks (persistent) | `useLocalStorageSet.ts` |
| Read-later queue (clears on open) | `useLocalStorageSet.ts` |
| Mute sources / categories | `useLocalStorageSet.ts` + `ManageMutes.tsx` |
| Search | `App.tsx` (client filter) |
| Trending (2+ sources) | `Trending.tsx` |
| Lead story | `LeadStory.tsx` |
| Daily brief | `DailyBrief.tsx` |
| Stock ticker | `StockTicker.tsx` |
| Hover cards | `HoverCard.tsx` (200ms hide delay) |
| Per-section: source count, View All, mute, mobile accordion | `CategoryColumn.tsx` |
| Per-headline: bookmark, queue, mute source | `Headline.tsx` |

### CI/CD

| Trigger | Action |
|---------|--------|
| Cron `5 * * * *` | Fetch data → commit JSON if changed → build → deploy Pages |
| Push to `main` | Same pipeline |
| `workflow_dispatch` | Manual run |

## Commits (reference)

```
7d196b2 Quality pass: entities, release noise, source cap, scraper, brief, perf
b916713 Multi-category routing + 3 new sections + diversity cap
76d1637 Initial commit: AI Drudge — static Vite + React aggregator
```

Plus automated `chore(data): refresh …` commits from the hourly cron.

## Operational metrics (typical run)

| Metric | Value |
|--------|-------|
| Feed sources configured | 103 |
| Feeds OK (local / GH Actions varies) | ~85–90 / 103 |
| Grouped stories displayed | ~180 |
| Categories populated | 18 |
| Trending stories | 3–5 |
| `headlines.json` size | ~360 KB minified |
| Workflow runtime | ~30 seconds |
| Lines of application code (excl. node_modules) | ~3,000 |

## Deliberately NOT implemented

| Feature | Reason |
|---------|--------|
| Live RSS in browser/API | Caused all original failures |
| `refreshing` / blank-page refresh UX | Replaced by hourly static rebuild |
| Next.js / server runtime | OOM and complexity |
| Geist font | Build failures on flaky network |
| PWA plugin wired up | Listed in package.json but not in vite.config |
| Local Collectors integration | Site is cloud-only; uses its own fetch pipeline |
| Site RSS feed (`/feed.xml`) | Deferred to next cycle — see FUTURE_IMPROVEMENTS.md |

# AI DRUDGE

A Drudge-Report-style aggregator for AI news. Static site, no server, refreshed hourly by GitHub Actions.

**Live:** https://pnelsonftp.github.io/ai-drudge/

**Full documentation:** [docs/](./docs/) — design, handoff, SBOM, history, and roadmap.

## Why this exists

An earlier Next.js version at `pacoaifeed.space-z.ai` repeatedly failed: 90-second blocks, OOM kills, rate-limit crashes, and blank pages during refresh. The root cause was live RSS scraping inside Next.js API routes at request time.

This version fetches all feeds **once per hour in GitHub Actions**, writes static JSON, and deploys a Vite SPA to GitHub Pages. No server means no OOM. Pre-fetched JSON means no rate limits at page load and no blank refresh states.

## Stack

- Vite 6 + React 19 + TypeScript 5.8
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `fast-xml-parser` for RSS (build-time only)
- GitHub Pages + GitHub Actions (hourly cron)

## Project layout

```
ai-drudge/
├── docs/                           # Full documentation package
│   ├── DESIGN.md                   # Architecture and algorithms
│   ├── HANDOFF.md                  # Operations and troubleshooting
│   ├── PROJECT_HISTORY.md          # What was built and when
│   ├── SBOM.md / SBOM.json         # Dependency bill of materials
│   └── FUTURE_IMPROVEMENTS.md      # Next upgrade cycle roadmap
├── .github/workflows/refresh.yml   # Hourly: fetch → commit → deploy
├── scripts/
│   ├── sources.ts                  # ~103 feeds, 18 categories, KEYWORDS
│   ├── fetch-feeds.ts              # Parallel RSS, entity decode, noise filter
│   ├── scrape-sources.ts           # HTML scraper (Anthropic — no RSS)
│   ├── fetch-stocks.ts             # NVDA/MSFT/GOOG/META/AMZN
│   ├── generate-brief.ts           # Claude brief or curated fallback
│   ├── build-data.ts               # Orchestrator → public/data/*.json
│   ├── lib/
│   │   ├── router.ts               # Multi-category routing, caps, trending
│   │   ├── groupStories.ts         # Jaccard ≥0.4 clustering
│   │   └── timeAgo.ts              # 9 date-extraction patterns
│   └── types.ts
├── public/data/                    # Generated JSON (committed by CI)
├── src/
│   ├── App.tsx                     # 3-column layout, search, views
│   ├── components/                 # Header, Trending, CategoryColumn, etc.
│   ├── hooks/
│   │   ├── useHeadlines.ts         # Stale-while-revalidate + sessionStorage
│   │   ├── useLocalStorageSet.ts   # Bookmarks, queue, mutes
│   │   └── useTheme.ts
│   └── lib/types.ts
└── vite.config.ts                  # base: "/ai-drudge/"
```

## Local development

```bash
cd ai-drudge
npm ci
npm run build:data   # Fetch RSS + stocks + brief (~30s, needs network)
npm run dev          # http://localhost:5173/ai-drudge/
```

## Deployment

1. Push to GitHub repo `PNelsonFTP/ai-drudge` (or update `base` in `vite.config.ts`).
2. Repo Settings → Pages → Source: **GitHub Actions**.
3. Workflow runs on push to `main`, manual dispatch, and cron `5 * * * *`.

See [docs/HANDOFF.md](./docs/HANDOFF.md) for troubleshooting, git conflict resolution, and monitoring.

## Adding a feed

Edit `scripts/sources.ts`:

```ts
{ name: "My Source", url: "https://example.com/feed.xml", category: "industry_news", priority: "high" },
```

Keyword routing rules in the same file can place articles in additional categories. See [docs/DESIGN.md](./docs/DESIGN.md) §3.4.

## Optional: AI Daily Brief

With `ANTHROPIC_API_KEY` set as a GitHub Actions secret, the build generates a Claude summary (grounded in fetched headlines only). Without it, a curated fallback uses trending stories and cross-category sampling.

## Features

| Feature | Location |
|---------|----------|
| 3-column Drudge layout | `src/App.tsx` |
| 18 categories | `scripts/sources.ts` |
| Multi-category keyword routing | `scripts/lib/router.ts` |
| Trending (2+ source coverage) | `scripts/lib/router.ts` + `Trending.tsx` |
| Story grouping (Jaccard ≥0.4) | `scripts/lib/groupStories.ts` |
| Per-source global cap (6) | `scripts/lib/router.ts` |
| View All per section | `CategoryColumn.tsx` + `articlesAll` |
| Dark/light theme | `useTheme.ts` |
| Hover preview cards (200ms hide) | `HoverCard.tsx` |
| Stock ticker | `StockTicker.tsx` + `fetch-stocks.ts` |
| Search (client-side) | `App.tsx` |
| Bookmarks | `useLocalStorageSet.ts` |
| Read-later queue | `useLocalStorageSet.ts` |
| Mute sources / categories | `ManageMutes.tsx` |
| Mobile accordion | `CategoryColumn.tsx` |
| Stale-while-revalidate load | `useHeadlines.ts` |
| Anthropic HTML scraper | `scrape-sources.ts` |
| Hourly refresh, no blank page | `.github/workflows/refresh.yml` |

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/DESIGN.md](./docs/DESIGN.md) | System design and data contracts |
| [docs/HANDOFF.md](./docs/HANDOFF.md) | Operator handoff |
| [docs/PROJECT_HISTORY.md](./docs/PROJECT_HISTORY.md) | Build history |
| [docs/SBOM.md](./docs/SBOM.md) | Full dependency SBOM |
| [docs/FUTURE_IMPROVEMENTS.md](./docs/FUTURE_IMPROVEMENTS.md) | Next cycle roadmap |

## What was deliberately NOT carried over

- Live RSS in API routes (OOM / rate limits)
- `refreshing` / blank-page refresh UX from commit `75da178`
- Geist font (build failures on flaky network)
- Connection to local Python `Collectors/` — site is standalone cloud-only

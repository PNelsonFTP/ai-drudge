# AI DRUDGE

A Drudge-Report-style aggregator for AI news. Static site, no server, refreshed
hourly by GitHub Actions. ~178 validated sources across 18 categories.

**Live:** https://pnelsonftp.github.io/ai-drudge/
**Subscribe:** https://pnelsonftp.github.io/ai-drudge/feed.xml (Atom)

**Full documentation:** [docs/](./docs/) — design, handoff, SBOM, history, and roadmap.

## Why this exists

An earlier Next.js version at `pacoaifeed.space-z.ai` repeatedly failed:
90-second blocks, OOM kills, rate-limit crashes, and blank pages during
refresh. The root cause was live RSS scraping inside API routes at request time.

This version fetches all feeds **once per hour in GitHub Actions**, writes
static JSON, and deploys a Vite SPA to GitHub Pages. No server means no OOM.
Pre-fetched JSON means no rate limits at page load and no blank refresh states.

## Stack

- Vite 6 + React 19 + TypeScript 5.8
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `fast-xml-parser` 5 for RSS/Atom/RDF (build-time only)
- GitHub Pages + GitHub Actions (hourly refresh cron + weekly feed audit)
- Zero `npm audit` findings; CycloneDX SBOM in [docs/SBOM.json](./docs/SBOM.json)

## Project layout

```
ai-drudge/
├── docs/                           # Full documentation package
│   ├── DESIGN.md                   # Architecture and algorithms
│   ├── HANDOFF.md                  # Operations and troubleshooting
│   ├── PROJECT_HISTORY.md          # What was built and when
│   ├── SBOM.md / SBOM.json         # Dependency bill of materials
│   └── FUTURE_IMPROVEMENTS.md      # Next-cycle roadmap (16 items)
├── .github/workflows/
│   ├── refresh.yml                 # Hourly: fetch → quality gate → deploy
│   └── feed-audit.yml              # Weekly: validate every feed URL
├── scripts/
│   ├── sources.ts                  # ~178 feeds, 18 categories, KEYWORDS
│   ├── fetch-feeds.ts              # Parallel RSS/Atom/RDF, entity decode, release-title synthesis
│   ├── scrape-sources.ts           # HTML scraper (Anthropic — no RSS)
│   ├── fetch-hn.ts                 # Hacker News velocity signal
│   ├── fetch-stocks.ts             # NVDA MSFT GOOG META AMZN AMD TSM AVGO
│   ├── generate-brief.ts           # Claude Sonnet 5 brief or curated fallback
│   ├── build-data.ts               # Orchestrator → public/data/*.json + feed.xml
│   ├── validate-feeds.ts           # Feed liveness/freshness/redirect audit
│   ├── generate-sbom.ts            # CycloneDX SBOM from the lockfile
│   ├── check-data.ts               # CI quality gate
│   └── lib/                        # router, score, groupStories, emitFeed, timeAgo
├── public/data/                    # Generated JSON (committed by CI)
├── public/feed.xml                 # Site Atom feed (committed by CI)
├── src/
│   ├── App.tsx                     # 3-column layout, search, views
│   ├── components/                 # Header, Trending, CategoryColumn, FeedHealth, …
│   └── hooks/                      # useHeadlines (SWR), snapshots, read-state, theme
└── vite.config.ts                  # base: "/ai-drudge/"
```

## Local development

```bash
npm ci
npm run build:data     # Fetch all feeds + stocks + brief (~60-90s, needs network)
npm run dev            # http://localhost:5173/ai-drudge/
```

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run validate:feeds` | Audit every feed URL (liveness, freshness, moved URLs) |
| `npm run build:check` | Quality gate on generated data |
| `npm run sbom` | Regenerate the SBOM after dependency changes |

## Adding a feed

1. Add to `SOURCES` in `scripts/sources.ts`:
   ```ts
   { name: "My Source", url: "https://example.com/feed.xml", category: "industry_news", priority: "medium" },
   ```
2. Verify: `npm run validate:feeds`
3. Keyword routing rules (same file) can place articles in additional
   categories — see [docs/DESIGN.md](./docs/DESIGN.md) §3.5.

## Optional: AI Daily Brief

With `ANTHROPIC_API_KEY` set as a GitHub Actions secret, the build generates a
Claude Sonnet 5 summary (grounded in fetched headlines only, cited URLs
validated). Without it, a curated fallback uses trending stories and
cross-category sampling.

## Features

| Feature | Location |
|---------|----------|
| 3-column Drudge layout, 18 categories | `src/App.tsx`, `scripts/sources.ts` |
| Multi-category keyword routing | `scripts/lib/router.ts` |
| Trending (2+ source coverage, <72h) | `router.ts` + `Trending.tsx` |
| Story grouping (Jaccard ≥ 0.4) | `scripts/lib/groupStories.ts` |
| Scoring (priority + recency decay + importance + HN) | `scripts/lib/score.ts` |
| Site Atom feed | `scripts/lib/emitFeed.ts` → `/feed.xml` |
| Bookmarks + read-later that survive refresh | `useLocalStorageSet.ts` (article snapshots) |
| Read-state dimming across visits | `useReadState.ts` |
| "N new since your last visit" banner | `App.tsx` |
| Feed Health panel (per-feed status) | footer → `FeedHealth.tsx` |
| Mute sources / categories | `ManageMutes.tsx` |
| Dark/light theme, search, hover cards, mobile accordion | `src/` |
| Stock ticker (8 symbols) | `StockTicker.tsx` |
| Hourly refresh, graceful degradation | `.github/workflows/refresh.yml` |
| Weekly feed audit | `.github/workflows/feed-audit.yml` |

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/DESIGN.md](./docs/DESIGN.md) | System design and data contracts |
| [docs/HANDOFF.md](./docs/HANDOFF.md) | Operator handoff and troubleshooting |
| [docs/PROJECT_HISTORY.md](./docs/PROJECT_HISTORY.md) | Build history incl. the 2026-07 overhaul |
| [docs/SBOM.md](./docs/SBOM.md) | Dependency bill of materials |
| [docs/FUTURE_IMPROVEMENTS.md](./docs/FUTURE_IMPROVEMENTS.md) | Next-cycle roadmap |

## What was deliberately NOT carried over

- Live RSS in API routes (OOM / rate limits)
- `refreshing` / blank-page refresh UX from commit `75da178`
- Geist font (build failures on flaky network)
- Connection to local Python `Collectors/` — site is standalone cloud-only

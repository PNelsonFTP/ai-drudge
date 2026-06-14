# AI DRUDGE

A Drudge-Report-style aggregator for AI news. Static site, no server, refreshed hourly by GitHub Actions.

## Why this exists

An earlier Next.js version lived at `pacoaifeed.space-z.ai` and repeatedly fell over: 90-second blocks, OOM kills, rate-limit crashes, blank pages during refresh. Root cause was doing live RSS scraping inside Next.js API routes at request time.

This version moves scraping out of the request path entirely. A GitHub Actions workflow fetches every RSS feed once per hour in parallel, writes a single `headlines.json`, and deploys the static SPA. No server = no OOM. Pre-fetched JSON = no rate limits at request time = no blank pages.

## Stack

- Vite 6 + React 19 + TypeScript 5.8
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `fast-xml-parser` for RSS parsing (build-time only)
- GitHub Pages for hosting

## Project layout

```
ai-drudge/
├── .github/workflows/refresh.yml   # hourly cron: fetch -> commit -> deploy
├── scripts/
│   ├── sources.ts                  # feed list (edit this to add feeds)
│   ├── fetch-feeds.ts              # parallel RSS with timeout + retry
│   ├── fetch-stocks.ts             # NVDA/MSFT/GOOG/META/AMZN
│   ├── generate-brief.ts           # Claude brief if key, else top-3 fallback
│   ├── build-data.ts               # orchestrator -> public/data/*.json
│   ├── lib/
│   │   ├── timeAgo.ts              # 9 date-extraction patterns
│   │   └── groupStories.ts         # Jaccard >=0.4 same-story clustering
│   └── types.ts
├── public/data/                    # generated JSON consumed by the SPA
├── src/
│   ├── App.tsx                     # 3-column Drudge layout
│   ├── main.tsx
│   ├── styles.css                  # Tailwind v4 + Drudge typography
│   ├── components/                  # Header, StockTicker, DailyBrief, etc.
│   ├── hooks/                       # useHeadlines, useBookmarks, useTheme
│   └── lib/                         # types, timeAgo
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Local development

```bash
cd ai-drudge
npm install
npm run build:data   # one-time: populate public/data/*.json
npm run dev          # http://localhost:5173/ai-drudge/
```

You need a network connection for `npm run build:data` (it fetches RSS). The dev server then serves the generated JSON statically.

## Deployment to GitHub Pages

1. Push this folder to a GitHub repo named `ai-drudge` (or update `base` in `vite.config.ts` to match your repo name).
2. In the repo settings → Pages → set Source to **GitHub Actions**.
3. The workflow in `.github/workflows/refresh.yml` runs:
   - on every push to `main`,
   - on a manual dispatch,
   - on an hourly cron (`5 * * * *`).
4. The first run fetches data and deploys. Subsequent hourly runs refresh the JSON in-place and redeploy.

## Adding a feed

Edit `scripts/sources.ts` and append to the relevant category:

```ts
{ name: "My Source", url: "https://example.com/feed.xml", category: "industry_news", priority: "high" },
```

That's it. No other code needs to change. Categories are defined at the bottom of the same file; reorder the `CATEGORIES` array to reorder sections on the homepage.

## Optional: AI Daily Brief

The brief uses Claude (Sonnet 4.5, temperature 0.3) with a strict anti-hallucination system prompt: it may only summarize titles/summaries present in the input. If no key is set, or the call fails, it falls back to the top 3 headlines — the site works either way.

To enable:

1. Get an Anthropic API key.
2. Repo settings → Secrets and variables → Actions → New repository secret.
3. Name: `ANTHROPIC_API_KEY`. Value: your key.

## Feature parity with the original

| Feature | Where |
|---|---|
| 3-column Drudge layout | `src/App.tsx` |
| Dark/light theme (persisted) | `src/hooks/useTheme.ts` |
| 16 categories incl. cybersec | `scripts/sources.ts` |
| Time-ago stamps (9 patterns) | `scripts/lib/timeAgo.ts` |
| Hover preview cards (200ms hide) | `src/components/HoverCard.tsx` |
| Same-story grouping (Jaccard ≥0.4) | `scripts/lib/groupStories.ts` |
| Stock ticker (NVDA/MSFT/GOOG/META/AMZN, ▲/▼) | `src/components/StockTicker.tsx` + `scripts/fetch-stocks.ts` |
| Cybersec categories (threats + defense) | `scripts/sources.ts` |
| Search | `src/App.tsx` (filters client-side) |
| Bookmarks | `src/hooks/useBookmarks.ts` |
| AI Daily Brief (grounded) | `scripts/generate-brief.ts` |
| Hourly refresh, no blank page | `.github/workflows/refresh.yml` |

## What was deliberately NOT carried over

- The `refreshing` / `justUpdated` / `hasLoadedOnce` ref state machine that broke the JSX in commit `75da178`.
- Live RSS in API routes.
- The Geist font (caused a build error in the original).
- Client-side "Updating headlines" banner — not needed since refresh happens server-side at build time.

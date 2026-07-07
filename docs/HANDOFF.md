# AI DRUDGE — Handoff Document

Operations guide for maintaining, deploying, and troubleshooting the live site.
Last updated: 2026-07-06 (post-overhaul — see [PROJECT_HISTORY.md](./PROJECT_HISTORY.md)).

## Quick reference

| Item | Value |
|------|-------|
| Live URL | https://pnelsonftp.github.io/ai-drudge/ |
| Site feed | https://pnelsonftp.github.io/ai-drudge/feed.xml (Atom, top ~30 stories) |
| Repository | https://github.com/PNelsonFTP/ai-drudge |
| Default branch | `main` |
| Local path | `/Users/paulnelson/Documents/Development/ai-drudge` |
| Hourly workflow | `.github/workflows/refresh.yml` (cron `5 * * * *`) |
| Weekly feed audit | `.github/workflows/feed-audit.yml` (Mondays 12:00 UTC) |
| Node version (CI) | 22 |
| GitHub secret (optional) | `ANTHROPIC_API_KEY` — Claude daily brief; curated fallback without it |

## Prerequisites

- Node.js 22+ and npm
- Git access to `PNelsonFTP/ai-drudge`
- GitHub Pages enabled on the repo (source: GitHub Actions)

## Local development

```bash
cd ai-drudge
npm ci

# Refresh data (requires network; ~60-90s with ~170 feeds)
npm run build:data

# Dev server with hot reload
npm run dev
# → http://localhost:5173/ai-drudge/

# Production build (matches CI)
npm run build
npm run preview
```

### npm scripts

| Script | Purpose |
|--------|---------|
| `dev` | Local dev server |
| `build` | Typecheck + static bundle to `dist/` |
| `build:data` | Fetch all feeds + stocks + HN + brief → `public/data/*.json` + `public/feed.xml` |
| `build:check` | Quality gate on the generated data (feed health, age distribution) |
| `validate:feeds` | Check every feed URL: liveness, parseability, item count, freshness, redirects |
| `sbom` | Regenerate `docs/SBOM.json` and the table in `docs/SBOM.md` from the lockfile |
| `typecheck` | `tsc --noEmit` |
| `preview` | Serve `dist/` locally |

## Deployment (automatic)

Every successful hourly workflow run:

1. Checks out `main`, `npm ci`, `npm run typecheck`
2. `npm run build:data` — writes `public/data/*.json` and `public/feed.xml`
3. `npm run build:check` — quality gate (fails the run on real regressions)
4. Commits `public/data` + `public/feed.xml` if changed (`chore(data): refresh …`)
5. `npm run build` → uploads `dist/` → deploys to GitHub Pages

**Manual trigger:** GitHub → Actions → "Refresh and deploy" → Run workflow.

### Verifying a deploy

1. Actions tab shows a green run
2. Live site header shows "updated Xm ago"
3. Footer "N/M feeds OK" → click it — the Feed Health panel lists per-feed status from the last build

## Common maintenance tasks

### Add a feed

1. Add an entry to `SOURCES` in `scripts/sources.ts`:
   ```ts
   { name: "My Source", url: "https://example.com/feed.xml", category: "industry_news", priority: "medium" },
   ```
2. `npm run validate:feeds` — confirm the new feed reports `OK` with a recent newest-item date
3. `npm run build:data && npm run build:check`
4. Commit and push

### Fix a broken feed

1. `npm run validate:feeds` — verdicts: `OK` / `STALE` / `EMPTY` / `NOT_FEED` / `HTTP_xxx` / `TIMEOUT` / `PARSE_FAIL`
2. The **REDIRECTED** section at the end lists feeds whose canonical URL moved — update `sources.ts` to the final URL
3. `STALE` means the feed parses but its newest item is >60 days old — usually the publisher moved platforms; search for their new feed before removing
4. The weekly `feed-audit.yml` run does this automatically every Monday — check it after any red run

### Add keyword routing

Edit `KEYWORDS` in `scripts/sources.ts`:

```ts
{ match: ["your", "keywords"], routeTo: "category_id" },
```

Lowercase; matched as substrings against title+summary. Aggregator feeds listed
in `KEYWORD_AGNOSTIC_SOURCES` (`scripts/lib/router.ts`) skip keyword routing.

### Change homepage section order

Reorder the `CATEGORIES` array in `scripts/sources.ts`. Columns fill top-to-bottom, left-to-right (index % 3).

### Tune noise/diversity

- Per-feed item cap: `ITEMS_PER_FEED_CAP` (15) in `fetch-feeds.ts`
- Global per-source cap: `GLOBAL_PER_SOURCE_CAP` (6) in `lib/router.ts`
- Category age windows: `AGE_WINDOWS` in `sources.ts`
- Scoring weights: `lib/score.ts`

## Known-benign failures (do not "fix")

| Symptom | Cause |
|---------|-------|
| `LocalLLaMA Subreddit` / `r/LocalLLM` FAIL (403/429) | Reddit rate-limits GitHub Actions IPs. Intermittent by design; Lemmy c/localllama + the HN local-LLM query provide backup coverage. |
| `HN: …` feeds FAIL with HTTP 502 | hnrss.org throws transient 502s. Self-heals on the next hourly run. |
| `arXiv cs.*` OK but 0 items on weekends | arXiv publishes weekdays only. |
| `Nature Machine Intelligence` low volume | Journal publishes a handful of items per month. |

## Troubleshooting

### Site loads but headlines are stale

| Check | Action |
|-------|--------|
| Actions workflow failing? | Open the log; the failing step names the problem. Last good deploy keeps serving. |
| Cron disabled? | GitHub disables cron on repos with 60 days of no pushes — re-enable in Actions. |
| Header shows red "updated Xh ago" | Run the workflow manually; check `build:check` output. |

### A section is empty or dominated by one source

- Feed Health panel (footer link) shows which sources delivered 0 items
- `feedStats` in `public/data/headlines.json` has the same data
- Router keywords too narrow → add `KEYWORDS` rules
- One source flooding → it's capped at 6 site-wide and 2–5 per section already; check `enforceDiversity` in `router.ts`

### GitHub release feeds show only 1 item

Expected: tag-only releases (e.g. llama.cpp `b9892`) synthesize a single
"repo bXXXX released" headline per build — see `cleanGitHubReleaseTitle` in
`fetch-feeds.ts`. Repos with real release notes show every release.

### HTML entities or `<tags>` in titles

Check `cleanText`/`decodeEntities` in `fetch-feeds.ts` are still applied after parse.

### Feed parses locally but not in CI

Usually IP-based blocking (Cloudflare, Substack rate limits, Reddit). Confirm
with the Feed Health panel across several hourly runs before changing anything.

### Anthropic section empty

The scraper regex in `scrape-sources.ts` no longer matches Anthropic's HTML.
Update `cardPattern`; test with `npm run build:data` and look for
`Anthropic News … items` in the log. `anthropics/claude-code` releases keep
partial coverage in the meantime.

### Stock ticker shows dashes

Stooq and Yahoo both failed for that symbol — transient; next hourly run retries.
Symbols: NVDA MSFT GOOG META AMZN AMD TSM AVGO (`scripts/fetch-stocks.ts`).

### Local `npm run build` fails typecheck

`npx tsc -b --pretty` and fix the reported file. `scripts/` and `src/` have
separate `types.ts` files that must stay in sync.

## Git conflict resolution

The hourly cron commits `public/data/*.json` + `public/feed.xml` to `main`.
When rebasing local work:

```bash
git checkout --theirs public/data/ public/feed.xml   # take the fresher cron data
git add public/data public/feed.xml
GIT_EDITOR=true git rebase --continue
```

Tip: pull before starting work; push promptly. For large refactors, disable the
workflow temporarily in the GitHub UI.

## Rollback

1. Identify the last good commit on `main`
2. `git revert <bad-commit>` (coordinate with cron commits; disable workflow if needed)
3. Push — the workflow redeploys from the reverted state
4. Data-only problems: reverting `public/data/` alone is enough

## Monitoring checklist (weekly)

- [ ] Monday feed-audit run green? If red, fix `sources.ts` per the log
- [ ] Feed Health panel: failing count < ~10 of ~178
- [ ] Trending shows ≥4 clusters most days
- [ ] `headlines.json` size (currently ~300 KB minified) not ballooning
- [ ] Spot-check Lead story + Daily Brief relevance

## Access and credentials

| Credential | Where | Required? |
|------------|-------|-----------|
| GitHub repo write | Your GitHub account | Yes |
| `ANTHROPIC_API_KEY` | Repo → Settings → Secrets → Actions | No — fallback brief works |
| Feed API keys | None — all public RSS/HTML | — |

## File ownership map

| Area | Primary files |
|------|---------------|
| Feeds, categories, routing keywords | `scripts/sources.ts` |
| Fetch resilience, title cleanup | `scripts/fetch-feeds.ts` |
| Scoring / routing / trending | `scripts/lib/score.ts`, `scripts/lib/router.ts`, `scripts/lib/groupStories.ts` |
| Site Atom feed | `scripts/lib/emitFeed.ts` |
| Feed validation | `scripts/validate-feeds.ts` |
| SBOM | `scripts/generate-sbom.ts`, `docs/SBOM.*` |
| Homepage layout & views | `src/App.tsx` |
| Client persistence (bookmarks/queue/mutes/read-state) | `src/hooks/*` |
| CI/CD | `.github/workflows/refresh.yml`, `.github/workflows/feed-audit.yml` |

## Document index

| Document | Purpose |
|----------|---------|
| [DESIGN.md](./DESIGN.md) | Architecture and algorithms |
| [PROJECT_HISTORY.md](./PROJECT_HISTORY.md) | Build chronology incl. the 2026-07 overhaul |
| [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) | Next cycle roadmap (16 items) |
| [SBOM.md](./SBOM.md) / [SBOM.json](./SBOM.json) | Dependencies |
| [../README.md](../README.md) | Quick start |

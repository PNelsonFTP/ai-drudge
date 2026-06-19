# AI DRUDGE — Handoff Document

Operations guide for maintaining, deploying, and troubleshooting the live site.

## Quick reference

| Item | Value |
|------|-------|
| Live URL | https://pnelsonftp.github.io/ai-drudge/ |
| Repository | https://github.com/PNelsonFTP/ai-drudge |
| Default branch | `main` |
| Local path | `/Users/paulnelson/Documents/Cursor/ai-drudge` |
| Workflow file | `.github/workflows/refresh.yml` |
| Refresh schedule | Hourly at `:05` UTC (`5 * * * *`) |
| Node version (CI) | 20 |
| GitHub secret (optional) | `ANTHROPIC_API_KEY` |

## Prerequisites

- Node.js 20+ and npm
- Git access to `PNelsonFTP/ai-drudge`
- GitHub Pages enabled on the repo (source: GitHub Actions)

## Local development

```bash
cd ai-drudge
npm ci

# Refresh data (requires network; ~30s)
npm run build:data

# Dev server with hot reload
npm run dev
# → http://localhost:5173/ai-drudge/

# Production build (matches CI)
npm run build
npm run preview
```

### npm scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Local dev server |
| `build` | `tsc -b && vite build` | Typecheck + static bundle |
| `build:data` | `tsx scripts/build-data.ts` | Fetch feeds, write JSON |
| `preview` | `vite preview` | Serve `dist/` locally |

### Optional: Claude daily brief locally

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
npm run build:data
```

Without the key, `brief.json` uses the curated fallback generator.

## Deployment (automatic)

Every successful workflow run:

1. Checks out `main`
2. `npm ci`
3. `npm run build:data` — writes `public/data/*.json`
4. Commits JSON to `main` if changed (`chore(data): refresh …`)
5. `npm run build` — outputs `dist/`
6. Uploads artifact and deploys to GitHub Pages

**Manual trigger:** GitHub → Actions → "Refresh and deploy" → Run workflow.

### Verifying a deploy

1. Check Actions tab for green run
2. Visit live URL — header shows "Updated …" from `generatedAt`
3. Inspect `public/data/headlines.json` in repo for latest timestamp

## Common maintenance tasks

### Add or remove an RSS feed

1. Edit `scripts/sources.ts` — add/remove entry in `FEEDS`
2. Set `category` (home category) and `priority` (`high` | `medium` | `low`)
3. Run `npm run build:data` locally and check `feedStats` in output JSON
4. Commit and push — CI will pick it up

### Fix a broken feed URL

1. Find source in `FEEDS` where `ok: false` in `feedStats`
2. Verify URL in browser or `curl -I <url>`
3. Update URL or remove feed
4. Rebuild and verify `ok: true`

### Add keyword routing

Edit `KEYWORDS` in `scripts/sources.ts`:

```ts
{ match: ["your", "keywords"], routeTo: "category_id" },
```

Rebuild and confirm articles appear in the new category.

### Change homepage section order

Edit `CATEGORIES` array order in `scripts/sources.ts`, then mirror column assignment in `src/App.tsx`.

### Mute a noisy source globally (build-time)

Remove or lower priority in `FEEDS`, or tighten the global cap in `scripts/lib/router.ts` (`GLOBAL_SOURCE_CAP`).

## Git conflict resolution

The hourly cron commits `public/data/*.json` back to `main`. If you rebase or merge while data refreshes are landing, you may hit conflicts in JSON files.

**Resolution (keep your branch's data or accept theirs — usually accept latest from main):**

```bash
# During rebase conflict on public/data/
git checkout --ours public/data/    # keep your branch
# OR
git checkout --theirs public/data/   # keep incoming (often the fresher cron data)

git add public/data/
GIT_EDITOR=true git rebase --continue
```

For merge conflicts:

```bash
git checkout --theirs public/data/
git add public/data/
git commit
```

**Tip:** Rebase frequently, or pause cron during large refactors (disable workflow temporarily in GitHub UI).

## Troubleshooting

### Site loads but headlines are stale

| Check | Action |
|-------|--------|
| Actions workflow failing? | Fix build error; last good deploy still serves |
| Cron disabled? | Re-enable workflow |
| `generatedAt` old in JSON? | Run workflow manually |

### Section empty or single-source dominated

| Check | Action |
|-------|--------|
| Feeds for category failing? | Inspect `feedStats` |
| Router keywords too narrow? | Add `KEYWORDS` rules |
| Source hit global cap? | Expected — cap is 6 per source |

### `headlines.json` huge / slow load

- `articlesAll` duplicates full lists per category (~360 KB)
- See FUTURE_IMPROVEMENTS.md — cap `articlesAll` or lazy-load

### HTML entities in titles

- Should be zero after quality pass
- If reappearing, check `decodeHtmlEntities()` in `fetch-feeds.ts` is still called post-parse

### GitHub feeds return empty

- Almost always `fast-xml-parser` entity limit
- Verify `processEntities` config in `fetch-feeds.ts`

### Anthropic section empty

- Scraper may need selector update if Anthropic changes HTML
- Edit `scripts/scrape-sources.ts`
- Test: `npx tsx scripts/scrape-sources.ts` (if standalone export exists) or full `build:data`

### Stock ticker shows dashes

- Stooq and Yahoo both failed for that symbol
- Transient — next hourly run retries
- Check `stocks.json` in `public/data/`

### Local `npm run build` fails typecheck

```bash
npx tsc -b --pretty
```

Fix reported paths in `src/` or `scripts/`.

### GitHub Actions Node 20 deprecation warning

- Upgrade `node-version` to `"22"` or `"24"` in `refresh.yml`
- Test locally on same Node version first

## Monitoring checklist (weekly)

- [ ] Actions workflow success rate
- [ ] `feedStats` — count of `ok: false` (target: <20% of feeds)
- [ ] Live site loads under 3s on cold visit
- [ ] `headlines.json` size trend (watch for bloat)
- [ ] Spot-check Trending and Lead story relevance

## Access and credentials

| Credential | Where | Required? |
|------------|-------|-----------|
| GitHub repo write | Your GitHub account | Yes, for pushes |
| `ANTHROPIC_API_KEY` | Repo → Settings → Secrets | No — fallback brief works |
| Feed API keys | None | All public RSS/HTML |
| Custom domain DNS | Not configured | Optional future |

## File ownership map

| Area | Primary files | Owner concern |
|------|---------------|---------------|
| Feeds & categories | `scripts/sources.ts` | Content editorial |
| Fetch reliability | `scripts/fetch-feeds.ts` | Infra |
| Routing quality | `scripts/lib/router.ts` | Product |
| Homepage layout | `src/App.tsx` | Design |
| CI/CD | `.github/workflows/refresh.yml` | Infra |
| Client perf | `src/hooks/useHeadlines.ts`, `index.html` | Performance |

## Rollback procedure

1. Identify last good commit on `main` (before bad deploy)
2. `git revert <bad-commit>` or reset branch (coordinate with cron commits)
3. Push — workflow redeploys from reverted state
4. GitHub Pages serves previous `dist/` artifact from successful run

For data-only bad commits, reverting `public/data/` JSON is sufficient; no code rollback needed.

## Support contacts and context

- **Original failure analysis:** Next.js live RSS at `pacoaifeed.space-z.ai` — see PROJECT_HISTORY.md
- **Stable reference commit (old site):** `157f7a0` on prior repo
- **Cyber variant prompt:** `/Users/paulnelson/Documents/Cursor/cyber-drudge-prompt.md`
- **Local Python collectors:** `/Users/paulnelson/Documents/Cursor/Collectors/` — **not connected** to this site

## Document index

| Document | Purpose |
|----------|---------|
| [DESIGN.md](./DESIGN.md) | Architecture and algorithms |
| [PROJECT_HISTORY.md](./PROJECT_HISTORY.md) | Build chronology |
| [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) | Next cycle roadmap |
| [SBOM.md](./SBOM.md) | Dependencies |
| [SBOM.json](./SBOM.json) | Machine-readable BOM |
| [../README.md](../README.md) | Quick start |

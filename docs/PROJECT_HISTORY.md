# AI DRUDGE — Project History

Chronological record of what was built, why, and what was deliberately rejected. Use this with [DESIGN.md](./DESIGN.md) and [HANDOFF.md](./HANDOFF.md).

## Origin

| Item | Detail |
|------|--------|
| Inspiration | [Drudge Report](https://www.drudgereport.com/) layout and density |
| Prior attempt | Next.js site at `pacoaifeed.space-z.ai` (hosted on z.ai) |
| Workspace path | `/Users/paulnelson/Documents/Development/ai-drudge` |
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

### Phase 4 — CI stabilization (June 28, 2026)

**Commit:** `81494e4` — Fix CI: relax quality-gate median-age check, Node 22

- `build:check` median-age check demoted to a warning (hourly runs legitimately
  see 48–72h medians when many sources publish daily); hard-fail moved to
  max-item-age (30d) which catches the real regression class
- GitHub Actions Node 20 → 22

### Phase 5 — Full overhaul (July 6, 2026)

Complete source audit + feature cycle, executed with multi-agent research
(13 parallel research agents swept the AI news landscape; every candidate feed
was fetch-verified twice before inclusion).

**Source overhaul (~101 → 178 feeds, all validated 2026-07-06):**

- **Fixed 10 broken/moved URLs:** arXiv (dead `export.arxiv.org` host →
  `rss.arxiv.org`), LangChain (dead Medium feed → `blog.langchain.com`),
  Ars Technica (generic features feed → dedicated `/ai/feed/`), smol.ai
  (abandoned Buttondown → `news.smol.ai`), Google Project Zero, MarketWatch,
  PremAI, The Algorithmic Bridge (permanent redirects), llama.cpp + whisper
  (repos moved to `ggml-org`)
- **Removed 12 dead/stale feeds:** Google Research blogspot (829d stale),
  EleutherAI (404), SemiAnalysis (all endpoints stale since Sep 2025),
  Protect AI (dead post-acquisition), Sebastian Ruder, LlamaIndex Medium,
  openai/whisper + openai-cookbook + gpt_academic + microsoft/autogen
  (dormant repos), CNBC duplicate URL
- **Added ~75 new sources**, biggest gains where the site was thinnest:
  - *AI security* (2 → 13 sources): Embrace The Red, tl;dr sec, Trail of Bits,
    OWASP GenAI, Prompt Security, Straiker, Knostic, JFrog, rez0, Noma,
    Giskard, Google News prompt-injection query
  - *Safety/policy* (2 → 11): Zvi, CAIS newsletter, Transformer, METR, CSET,
    EU AI Act Newsletter, GovAI, Redwood, AI Policy Perspectives
  - *Labs/models:* Mistral (critical), Ai2, Stability, HN Chinese-labs query
    (DeepSeek/Qwen/Kimi/GLM have no first-party feeds)
  - *Products/tools:* Cursor changelog, OpenRouter, Together AI, Copilot
    changelog, Cline, Amp
  - *Research:* Transformer Circuits, MIT News AI, Epoch AI, IBM Research,
    Nature MI, Sakana, Thinking Machines, Lil'Log, TheSequence, HF Daily Papers
  - *Local models:* LM Studio, vLLM blog, Lemmy mirror (Reddit blocks CI IPs),
    HN local-LLM query
  - *Repos:* claude-code, codex, gemini-cli, qwen-code, langgraph, litellm,
    whisper.cpp, ComfyUI, sglang, unsloth, MCP spec
  - *Plus:* Techmeme, Guardian AI, Register AI/ML, WSJ, ZDNet, IEEE Spectrum,
    404 Media, FT AI, Crunchbase AI, Newcomer, Humanoids Daily, Waymo,
    Shtetl-Optimized, Chips and Cheese, More Than Moore, and a Google News
    "AI × SEC/FINRA" query for regulatory signal
- Documented every checked-and-feedless site at the top of `sources.ts` so
  future sessions don't re-litigate them

**Pipeline improvements:**

- `validate-feeds.ts` — permanent feed validator (`npm run validate:feeds`);
  new weekly CI workflow `feed-audit.yml` runs it every Monday
- Site Atom feed emitted to `public/feed.xml` (`lib/emitFeed.ts`)
- GitHub tag-only releases now synthesize one "repo bXXXX released" headline
  per feed instead of being dropped (llama.cpp section was empty before)
- RDF/RSS 1.0 support + `dc:date` (Nature feeds parsed 0 items before)
- `fast-xml-parser` 4.5 → 5.9 (clears GHSA-gh4j-gqv2-49f6); removed unused
  `vite-plugin-pwa`; **npm audit: 0 findings**
- Daily brief moved to `claude-sonnet-5` (removed `temperature`, rejected on
  Sonnet 5)
- Stock ticker: added AMD, TSM, AVGO
- `generate-sbom.ts` — CycloneDX SBOM regeneration (`npm run sbom`)

**Client improvements:**

- **Bookmark/queue snapshots** — saved articles previously vanished when they
  aged out of the hourly payload; now persisted to localStorage and GC'd
- **Read-state** — headlines seen ≥1.5s render dimmed on later visits (LRU 500)
- **"N new since your last visit"** banner
- **Feed Health panel** — footer "N/M feeds OK" opens per-feed status
- Search extended to summaries; dead mute-filter branch removed

**Measured result (first post-overhaul build):** 173/178 feeds OK (97%),
258 visible stories (was ~170), median age 12.7h, 60% under 24h, trending 4
clusters (was 1), zero empty sections, ai_security 2 → 14 articles.

## Feature inventory (current)

### Build pipeline (`scripts/`)

| Component | File | Purpose |
|-----------|------|---------|
| Feed registry | `sources.ts` | ~178 validated feeds, 18 categories, KEYWORDS map |
| RSS fetcher | `fetch-feeds.ts` | Parallel fetch, 8s timeout, entity decode, release-title synthesis, RDF support |
| HTML scraper | `scrape-sources.ts` | Anthropic News + Research (no public RSS) |
| Router | `lib/router.ts` | Multi-category routing, global cap 6, trending, diversity |
| Story grouping | `lib/groupStories.ts` | Jaccard ≥0.4 within category |
| Scoring | `lib/score.ts` | Priority + recency decay + importance + HN boost |
| Site feed | `lib/emitFeed.ts` | Atom feed of the aggregator (`/feed.xml`) |
| Time parsing | `lib/timeAgo.ts` | 9 date patterns |
| Stocks | `fetch-stocks.ts` | 8 symbols, Stooq + Yahoo fallback |
| Brief | `generate-brief.ts` | Claude Sonnet 5 (optional) or curated fallback |
| HN signal | `fetch-hn.ts` | Algolia velocity index for scoring |
| Orchestrator | `build-data.ts` | Parallel RSS + scrape + HN → route → minified JSON + feed.xml |
| Feed validator | `validate-feeds.ts` | Liveness/freshness/redirect audit (`npm run validate:feeds`) |
| Quality gate | `check-data.ts` | CI hard-fail on feed health / stale leakage |
| SBOM generator | `generate-sbom.ts` | CycloneDX from lockfile (`npm run sbom`) |

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

## Operational metrics (post-overhaul build, 2026-07-06)

| Metric | Value |
|--------|-------|
| Feed sources configured | 178 (all validated) |
| Feeds OK per build | ~170–175 (97%; Reddit + hnrss transients account for the rest) |
| Unique visible stories | ~258 |
| Median article age | ~13h (60% under 24h) |
| Categories populated | 18 / 18 |
| Trending clusters | 4+ |
| `headlines.json` size | ~300 KB minified |
| npm audit findings | 0 |
| Workflow runtime | ~60–90 seconds |

## Deliberately NOT implemented

| Feature | Reason |
|---------|--------|
| Live RSS in browser/API | Caused all original failures |
| `refreshing` / blank-page refresh UX | Replaced by hourly static rebuild |
| Next.js / server runtime | OOM and complexity |
| Geist font | Build failures on flaky network |
| PWA | `vite-plugin-pwa` removed 2026-07-06 (was never wired); deliberate re-add is roadmap item #6 |
| Local Collectors integration | Site is cloud-only; uses its own fetch pipeline |
| GitHub Trending RSS mirror | Undated items, repo-name titles — poor headline fit |
| Reddit feed workarounds (old.reddit, mirrors) | Tested 2026-07-06; equally rate-limited. Lemmy + HN queries are the backup instead |

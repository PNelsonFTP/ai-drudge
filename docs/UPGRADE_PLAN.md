# AI DRUDGE — Upgrade Plan (Freshness, Importance, Sources)

**Status:** Ready to implement. Self-contained spec for an implementing agent.
**Primary goals (in priority order):**
1. Rank by **freshest + most important**; stop old articles from lingering.
2. Add **more high-quality sources**.
3. Make this the last major upgrade for a while (guardrails so feeds don't rot silently).

**Strictness setting for this build:** **Balanced** (tight windows for news lanes, longer for research/analysis; backfill only to avoid empty sections). All windows live in one constant block (#3) so they can be retuned without touching logic.

> Architecture constraints — DO NOT BREAK:
> - Static site. All third‑party fetching happens at **build time** in GitHub Actions, never in the browser.
> - Preserve graceful degradation in `build-data.ts` (keep previous `headlines.json` on total fetch failure, exit 0).
> - Keep minified JSON output, the `base: "/ai-drudge/"` path, and SWR client loading.
> - Do not reintroduce client-side RSS/API fetching.

---

## Current-state findings (grounded, measured 2026‑06‑19 snapshot)

Run this to reproduce the age distribution at any time (also used as the before/after metric):

```bash
node -e '
const fs=require("fs");const j=JSON.parse(fs.readFileSync("public/data/headlines.json","utf8"));
const now=Date.now();const ages=[];const seen=new Set();let noDate=0;
for(const c of j.categories){for(const a of (c.articlesAll||c.articles||[])){if(seen.has(a.url))continue;seen.add(a.url);if(!a.publishedAt){noDate++;continue;}ages.push((now-new Date(a.publishedAt).getTime())/3600000);}}
ages.sort((x,y)=>x-y);const p=q=>ages[Math.floor(ages.length*q)];const older=d=>ages.filter(x=>x>d*24).length;
console.log("feeds OK:",j.feedStats.filter(f=>f.ok).length+"/"+j.feedStats.length);
console.log("zero-item OK feeds:",j.feedStats.filter(f=>f.ok&&f.count===0).map(f=>f.source).join(", "));
console.log("unique:",ages.length,"median h:",p(0.5)?.toFixed(1),"p90 d:",(p(0.9)/24).toFixed(1),"max d:",(ages.at(-1)/24).toFixed(1));
console.log("share >3d:",(older(3)/ages.length*100).toFixed(0)+"%","| >7d:",(older(7)/ages.length*100).toFixed(0)+"%","| <24h:",(ages.filter(x=>x<24).length/ages.length*100).toFixed(0)+"%");
console.log("trending:",j.trending.length);'
```

Baseline result on the 06‑19 snapshot:

| Metric | Value | Problem |
|--------|-------|---------|
| Median article age | ~97h (4 days) | Stale by default |
| p90 age | 116 days | Ancient items in view |
| Max age | 845 days | 2+ year‑old posts ranking |
| Share > 3 days | 79% | Old content dominates |
| Share < 24h | 0% | Nothing feels fresh |
| Feed health | 88/103 OK | 15 dead feeds |
| "OK" but 0 items | 16 feeds | GITHUB REPOS dead (release‑noise filter) |
| Trending clusters | 2 | Thin, no freshness gate |

**Root causes:**
1. **No age cap anywhere in `scripts/lib/router.ts`.** Nothing is ever dropped for being old.
2. **Priority swamps recency.** `PRIORITY_WEIGHT.critical = 100` while `recencyScore()` floors to `5` after 72h, so a 2‑year‑old `critical` post beats a fresh `medium` one.
3. **Lead/Trending have no freshness gate.** `lead` = `category[0].articles[0]`, which can be years old.
4. **Release‑noise filter strips entire GitHub feeds.** Version‑only titles (`v0.6.2`) are dropped, leaving GITHUB REPOS empty.
5. **No build‑time quality gate**, so dead feeds rot silently.

---

## Target acceptance metrics (verify after each phase)

- Median visible age **< 24h**; p90 **< 5 days**; **0 items older than 30 days** anywhere.
- Every displayed category respects its hard age window (#3).
- **GITHUB REPOS ≥ 5 items.**
- Feed health **≥ 90% OK**, zero "OK but 0 items" feeds.
- Trending typically **≥ 4 clusters**; Lead Story always **< 72h**.
- `npm run build` typechecks clean; `npm run build:check` passes.

---

# Implementation — 15 items

Phases are ordered by dependency. Re-run the age script + `npm run build:data` after each phase.

## Phase 1 — Foundation

### 1. Shared scoring module — `scripts/lib/score.ts` (NEW) · Effort: S
Ordering logic is currently split and can drift across `router.ts` (`scoreArticle`/`recencyScore`), `groupStories.ts` (date-only sort), and `fetch-feeds.ts` (priority-then-recency). Centralize it.

Create `scripts/lib/score.ts` exporting:
```ts
export function ageHours(publishedAt: string | null, now: Date): number
export function recencyScore(publishedAt: string | null, now: Date): number   // #2
export function priorityScore(priority: Priority): number                     // #2 (rebalanced)
export function importanceScore(title: string, summary: string | null, ageH: number): number // #5
export function hnBoost(url: string, hnIndex: HnIndex): number                // #6
export function finalScore(article: Article, ctx: ScoreCtx): number
```
Then refactor `router.ts` and `fetch-feeds.ts` to import from here. `groupStories.ts` keeps date-only ordering for clustering, but the post-group re-sort in `router.ts` must use `finalScore`.

**Acceptance:** no scoring math remains inline in `router.ts`/`fetch-feeds.ts`; build output unchanged in shape.

---

## Phase 2 — Freshness (priority #1)

### 2. Continuous recency decay + rebalanced priority — `scripts/lib/score.ts` · Effort: S
Replace the step-function `recencyScore` (floors at 5 after 72h) with smooth exponential decay, **48h half-life**, and **lower priority weights** so recency dominates among comparable items.

```ts
const HALF_LIFE_H = 48;
export function recencyScore(publishedAt, now) {
  const h = ageHours(publishedAt, now);              // null date -> treat as ~36h
  return Math.max(2, 100 * Math.pow(0.5, h / HALF_LIFE_H));
}
// REBALANCED from {critical:100, high:50, medium:10, low:1}:
const PRIORITY_SCORE = { critical: 40, high: 25, medium: 12, low: 4 };
```
With this, a fresh `medium` (recency ≈100 +12 = 112) beats a 2‑week‑old `critical` (recency ≈2 +40 = 42), while a fresh `critical` (≈140) still leads. Keep the existing `PRIORITY_WEIGHT` export for the pre-sort in `fetch-feeds.ts` or switch it to `finalScore` too (preferred).

**Acceptance:** within any category, of two same-priority items the fresher ranks higher; a >7‑day item never outranks a <24h item of equal-or-lower priority.

### 3. Per-category hard age windows — `scripts/sources.ts` + `scripts/lib/router.ts` · Effort: M
Add one tunable constant block (Balanced defaults) and enforce it in `buildCategories`.

```ts
// scripts/sources.ts
export interface AgeWindow { softDays: number; hardDays: number; minItems: number; }
export const AGE_WINDOWS: Record<CategoryId, AgeWindow> = {
  // FAST lanes
  model_releases:{softDays:3,hardDays:5,minItems:4}, industry_news:{softDays:3,hardDays:5,minItems:4},
  ai_finance:{softDays:3,hardDays:5,minItems:4},     products:{softDays:3,hardDays:5,minItems:4},
  agents_tools:{softDays:3,hardDays:5,minItems:4},   local_models:{softDays:3,hardDays:5,minItems:4},
  // MID lanes
  research:{softDays:7,hardDays:10,minItems:3},      hardware:{softDays:7,hardDays:10,minItems:3},
  cyber_threats:{softDays:7,hardDays:10,minItems:3}, cyber_defense:{softDays:7,hardDays:10,minItems:3},
  ai_security:{softDays:7,hardDays:10,minItems:3},   open_source:{softDays:7,hardDays:10,minItems:3},
  funding:{softDays:7,hardDays:10,minItems:3},        github_repos:{softDays:7,hardDays:10,minItems:3},
  // SLOW lanes
  analysis:{softDays:14,hardDays:21,minItems:3},     safety_policy:{softDays:14,hardDays:21,minItems:3},
  robotics:{softDays:14,hardDays:21,minItems:3},     quantum:{softDays:14,hardDays:21,minItems:3},
  // legacy/unused (keep until #cleanup): agents_watch
  agents_watch:{softDays:14,hardDays:21,minItems:3},
};
```
In `router.ts`, per category: **drop anything older than `hardDays`** before scoring. (Items with `publishedAt === null` count as fresh-ish — keep but they cannot be Lead/Trending per #7.)

**Acceptance:** the age script shows no displayed item exceeds its category `hardDays`; "fast" sections show mostly <72h items.

### 4. Starvation-aware fill — `scripts/lib/router.ts` · Effort: M
Prefer fewer items over stale ones. After the hard-window drop and scoring:
1. Take items within `softDays` (sorted by `finalScore`).
2. If that yields fewer than `minItems`, backfill from items between `softDays` and `hardDays` (still score-sorted) only up to `minItems`.
3. Never pad beyond `minItems` with soft–hard items just to fill the preview/`articlesAll` caps.

**Acceptance:** sparse categories render short rather than padded with week-old filler; no empty-but-present sections.

### 7. Freshness gate on Lead Story + Trending — `scripts/lib/router.ts` (+ `src/App.tsx` lead) · Effort: S
- **Trending eligibility:** only stories whose lead `ageHours <= 72` can enter `trending`. Keep the 2+ distinct-source rule; if this thins trending too much, allow a `<=120h` fallback only to reach a minimum of 4 clusters.
- **Lead Story:** server-side, compute a `leadId` (or reorder) so the client's `lead` selection lands on a `<72h`, high-`finalScore` story. Simplest: add `payload.leadUrl` chosen in `router.ts` and have `App.tsx` prefer it, falling back to current logic.

**Acceptance:** Lead Story timestamp is always < 72h; Trending shows only recent clusters.

---

## Phase 3 — Importance (priority #1)

### 5. Importance signal scoring — `scripts/lib/score.ts` · Effort: M
Recency-gated boost (only applies when `ageH <= 96`, so it can't revive stale posts). Starter keyword sets (tune freely):
```ts
const LAUNCH = ["releases","launch","launches","now available","general availability","unveils","introduc","open-source","open source","state-of-the-art","sota","outperform","benchmark","beats gpt","new model"];
const MODELS = ["gpt-5","gpt-4","claude ","gemini ","llama ","mistral ","qwen","deepseek","grok-","phi-","o3","o4"];
const MONEY  = ["raises $","raised $","funding round","series a","series b","series c","valuation","ipo","acquires","acquired by","billion"];
const EVENT  = ["lawsuit","sues","banned","outage","breach","resigns","shuts down","recall","investigation"];
// score: +up to ~30, e.g. 12 for a LAUNCH/MONEY hit, +6 MODELS, +6 EVENT, capped at 30, then *(ageH<=96?1:0)
```

**Acceptance:** a fresh "OpenAI releases GPT‑5" outranks routine same-age posts in its sections.

### 6. Hacker News velocity signal — `scripts/fetch-hn.ts` (NEW) + wired into scoring · Effort: M
AI-native equivalent of the Cyber project's CISA KEV. Validated endpoint (JSON, no key):
`https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=200`
(optionally also `https://hn.algolia.com/api/v1/search?tags=front_page` for points-weighted front page).

Build a `HnIndex`: map of normalized URL (host + path, strip query/hash/trailing slash) → `{points, comments}`; also keep a domain→maxPoints fallback. In `score.ts`, `hnBoost(url, idx)` returns `min(25, points/20)` on URL match, or a smaller domain-match boost. Wire into `finalScore`. Call `fetchHn()` in `build-data.ts` alongside feeds (parallel, fail-soft to empty index).

**Acceptance:** articles currently trending on HN get a visible rank lift; missing/blocked HN never breaks the build.

---

## Phase 4 — Sources (priority #2)

### 8. Fix / retire broken feeds — `scripts/sources.ts` · Effort: M
**Remove (verified dead/blocked on live re-check):**

| Feed | Reason |
|------|--------|
| AnandTech | site shut down (HTML) |
| The Information AI | 403 paywall |
| Barron's AI | 403 |
| Wall Street Journal Markets | 404 |
| LM Studio Blog | 404 |
| Jan Blog | 404 |
| TinyML | 404 |
| EleutherAI | 404 |
| Mandiant | dead (timeout; also dead in Cyber project) |
| Tom's Hardware GPUs (subfeed) | 404 — keep main "Tom's Hardware" |
| ServeTheHome GPU (subfeed) | 404 — keep main "ServeTheHome" |
| Cohere Blog | returns HTML (SPA, no real RSS) |
| Cursor Changelog | returns HTML/empty |
| LangChain Blog | `blog.langchain.dev/rss` now serves HTML — keep the LangChain **GitHub** feed instead |

**Keep but harden (transient build-time failures — work on re-check):** Gary Marcus, The Algorithmic Bridge, Seeking Alpha. Implement retry/backoff: bump retries 2→3, add a short jittered delay between attempts, and keep rotating User-Agents (already present).

**Investigate or drop:** Stanford HAI (returns HTML/0), GitHub Changelog (was failing — re-check `https://github.blog/changelog_feed.xml`).

### 9. Add ~15 verified AI feeds — `scripts/sources.ts` · Effort: M
All confirmed live (HTTP 200 + valid XML + items). Paste into `SOURCES` with the suggested home category/priority; keyword routing will fan them into secondary sections automatically.

```ts
// Roundups (high freshness — multiple posts/day)
{ name: "AI News (smol.ai)", url: "https://buttondown.com/ainews/rss", category: "industry_news", priority: "high" },
{ name: "TLDR AI", url: "https://tldr.tech/api/rss/ai", category: "industry_news", priority: "medium" },
{ name: "Last Week in AI", url: "https://lastweekin.ai/feed", category: "industry_news", priority: "medium" },
// News / model releases
{ name: "The Decoder", url: "https://the-decoder.com/feed/", category: "industry_news", priority: "high" },
{ name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", category: "model_releases", priority: "high" },
{ name: "Bloomberg Tech", url: "https://feeds.bloomberg.com/technology/news.rss", category: "industry_news", priority: "medium" },
// Analysis
{ name: "Import AI (Jack Clark)", url: "https://jack-clark.net/feed/", category: "analysis", priority: "high" },
{ name: "Interconnects (Lambert)", url: "https://www.interconnects.ai/feed", category: "analysis", priority: "high" },
{ name: "Latent Space", url: "https://www.latent.space/feed", category: "analysis", priority: "medium" },
// Research
{ name: "Ahead of AI (Raschka)", url: "https://magazine.sebastianraschka.com/feed", category: "research", priority: "medium" },
{ name: "Sebastian Ruder", url: "https://newsletter.ruder.io/feed", category: "research", priority: "low" },
{ name: "MarkTechPost", url: "https://www.marktechpost.com/feed/", category: "research", priority: "medium" },
{ name: "Apple ML", url: "https://machinelearning.apple.com/rss.xml", category: "research", priority: "medium" },
// Products / agents / cloud
{ name: "AWS ML Blog", url: "https://aws.amazon.com/blogs/machine-learning/feed/", category: "products", priority: "medium" },
// Hardware / local
{ name: "NVIDIA Dev Blog", url: "https://developer.nvidia.com/blog/feed", category: "hardware", priority: "medium" },
```

### 10. Rework GITHUB REPOS so feeds stop returning zero — `scripts/fetch-feeds.ts` · Effort: S–M
The release feeds are healthy Atom; the noise filter (`isReleaseNoise`) just strips version-only titles. For GitHub release feeds specifically, **synthesize a display title instead of dropping**:
- Derive repo short name from the feed URL (`ollama/ollama` → `ollama`).
- If the cleaned title is empty/version-only, set title = `"<repoShort> <version> released"` (e.g. `"ollama v0.6.2 released"`).
- Pull the first meaningful line of `<content>` into `summary` (already partially done).
- Keep dropping pure CI/hash noise that has no version at all.

**Acceptance:** GITHUB REPOS shows ≥5 readable items; no bare `v0.6.2` titles.

### 11. Fetch / parse hardening — `scripts/fetch-feeds.ts` · Effort: M
Before `PARSER.parse(body)`, verify the payload is actually a feed:
- Accept if `content-type` includes `xml`/`rss`/`atom`, OR the trimmed body starts with `<?xml`, `<rss`, `<feed`, or `<rdf`.
- Otherwise skip parse, mark `ok:false`, and record a reason (HTML/interstitial). This is exactly why Cohere/LangChain-Blog show "OK but 0 items."
- Optionally extend `feedStats` items to `{ source, ok, count, reason? }` for the quality gate (#15) and footer.

**Acceptance:** no feed reports `ok:true` with 0 items due to an HTML response; failures carry a reason.

---

## Phase 5 — Make freshness visible

### 12. "NEW" badge (<6h) + de-emphasis (>72h) — `src/components/Headline.tsx` · Effort: S
Compute age from `article.publishedAt`. If `<6h`, render a small `NEW` badge near the title; if `>72h`, add a muted class (e.g. `opacity-60`). Add a `timeAgoColor`/`isFresh` helper in `src/lib/timeAgo.ts` if useful.

### 13. Relative "updated" + stale-data warning — `src/components/Header.tsx` (+ `LeadStory.tsx`) · Effort: S
- Replace the absolute masthead timestamp with relative ("updated 12m ago") using `timeAgoDisplay(generatedAt)`.
- If `generatedAt` is older than ~6h, show a visible banner ("Headlines may be delayed — last refresh N h ago"). This would have surfaced the 3‑day‑old snapshot immediately.
- Lead Story already shows a timestamp; ensure it's relative.

### 14. "LATEST" strip — `src/components/LatestStrip.tsx` (NEW) + `src/App.tsx` · Effort: M
A strict reverse-chronological rail of the freshest ~12 stories across all sections, pinned near the top of the home view (above the columns, below Trending). Compute client-side from `filteredCategories` (flatten `articlesAll`, dedupe by `url`, sort by `publishedAt` desc, take 12) so no payload change is required. Respect mutes/search (use `filteredCategories`, not raw payload).

**Acceptance:** the strip always shows the newest items site-wide, newest first.

---

## Phase 6 — Guardrails

### 15. Build-time quality gate + CI typecheck — `scripts/check-data.ts` (NEW), `package.json`, `.github/workflows/refresh.yml` · Effort: M
- `scripts/check-data.ts`: reads `public/data/headlines.json`; **warn** always, **exit 1** when: feed `ok` ratio `< 0.85`, any displayed category empty, median visible age `> 48h`, or any item older than 30 days appears. Print the age-distribution summary.
- `package.json`: add `"build:check": "tsx scripts/check-data.ts"` and `"typecheck": "tsc --noEmit"`.
- `refresh.yml`: after `npm run build:data`, run `npm run build:check` (non-fatal: `|| true` if you don't want it to block deploys initially) and add a `typecheck` step before `build`.

**Acceptance:** a regressed/stale build is flagged in CI logs; types are checked on every run.

---

## Cleanup (fold into Phase 1 or 4)
- **Orphaned `agents_watch` category:** it's in the `CategoryId` union and has one dead feed (Adept AI — acquired by Amazon, defunct) but is **not** in the `CATEGORIES` display array, so it never renders. Either remove `agents_watch` from the type + drop Adept AI, or add it to `CATEGORIES`. Recommended: remove it.
- **Dedupe stopword/jaccard helpers** duplicated in `router.ts` and `groupStories.ts` into a small shared util (optional, low risk).

---

## Sequencing summary
1. **Foundation:** #1
2. **Freshness:** #2 → #3 → #4 → #7
3. **Importance:** #5 → #6
4. **Sources:** #8 → #9 → #10 → #11
5. **Visible polish:** #12 → #13 → #14
6. **Guardrails:** #15 (+ cleanup)

After each phase: `npm run build:data` then the age script above. Expect median age to fall from ~97h toward <24h and the >7‑day share from 31% toward ~0% as #3/#4 land.

## Files touched (quick map)
| File | Items |
|------|-------|
| `scripts/lib/score.ts` (NEW) | 1,2,5,6 |
| `scripts/lib/router.ts` | 1,3,4,7 |
| `scripts/lib/groupStories.ts` | 1 (import shared score for re-sort) |
| `scripts/fetch-feeds.ts` | 1,10,11 |
| `scripts/fetch-hn.ts` (NEW) | 6 |
| `scripts/sources.ts` | 3,8,9, cleanup |
| `scripts/build-data.ts` | 6 (wire HN), 7 (leadUrl) |
| `scripts/check-data.ts` (NEW) | 15 |
| `src/components/Headline.tsx` | 12 |
| `src/components/Header.tsx` | 13 |
| `src/components/LeadStory.tsx` | 13 |
| `src/components/LatestStrip.tsx` (NEW) | 14 |
| `src/App.tsx` | 7 (lead), 14 |
| `src/lib/timeAgo.ts` | 12,13 helpers |
| `package.json`, `.github/workflows/refresh.yml` | 15 |

## Provenance of recommendations
- Numbers from the committed `headlines.json` (06‑19 snapshot) via the age script above.
- Every feed in #8 (drop) and #9 (add) was validated live (HTTP status + content-type + item count) at planning time. Re-validate before shipping; feed availability drifts.
- Adapted from the Cyber‑drudge upgrade plan: shared scorer, per‑category age windows, starvation fill, importance scoring, freshness gates, fetch hardening, NEW/stale cues, LATEST strip, build‑time quality gate. AI‑specific changes: **Hacker News velocity** in place of CISA KEV, AI‑tuned importance keywords, and the validated AI source list.

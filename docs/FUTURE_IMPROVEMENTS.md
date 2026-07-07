# AI DRUDGE — Future Improvements

Roadmap for the next upgrade cycle, written 2026-07-06 at the end of the full
project overhaul (see [PROJECT_HISTORY.md](./PROJECT_HISTORY.md) for what that
cycle shipped: ~75 new validated sources, feed validator + weekly audit CI,
site Atom feed, bookmark snapshots, read-state, feed-health panel,
fast-xml-parser 5, zero npm audit findings).

None of these are required for production stability. Items are prioritized by
impact vs. effort.

| Priority | Meaning |
|----------|---------|
| P1 | High impact, reasonable effort — do first |
| P2 | Meaningful improvement, moderate effort |
| P3 | Nice-to-have or larger scope |

---

## P1 — Next session

### 1. Trending lead-title quality

**Problem:** When a story cluster's highest-scoring member comes from an
aggregator (Reddit/Lemmy/HN), the trending headline can be a terse post title
(observed: "tencent/Hy3" as trending #1 instead of a real headline).

**Proposal:** In `router.ts` story unification, prefer a non-aggregator member
as the cluster lead when one exists within ~10% of the top score; keep the
aggregator item in `related`.

**Acceptance:** No trending lead sourced from `KEYWORD_AGNOSTIC_SOURCES` when a
press alternative exists in the cluster.

### 2. Canonicalize Google News / hnrss article links

**Problem:** The new query feeds (`news.google.com/rss/search`, `hnrss.org`)
return redirect/tracking URLs. Clicks resolve fine, but URL-based dedup can't
match the same story fetched directly from the publisher, producing near-dupes
that only Jaccard grouping catches.

**Proposal:** In `fetch-feeds.ts`, unwrap known wrappers: hnrss items carry the
target URL in the description/comments field; Google News URLs can be decoded
from the `url` query param or resolved once at build time (bounded, cached).

**Acceptance:** ≥90% of query-feed items dedupe against their direct-feed twin.

### 3. Payload split: preview + full

**Problem:** `headlines.json` is a single ~250–400 KB fetch that blocks first
paint on slow networks.

**Proposal:** Emit `headlines-preview.json` (trending + lead + first 5 per
category, ~80 KB) and load the full file lazily on idle / "view all".

**Acceptance:** First-paint fetch under 100 KB; no UX regression in View All.

### 4. CI dependency-audit gate

**Problem:** `npm audit` is run manually; a new advisory could sit unnoticed
between sessions.

**Proposal:** Add `npm audit --omit=dev --audit-level=high` (hard gate) plus a
full-audit warning step to `feed-audit.yml` (weekly, non-blocking on the hourly
refresh).

**Acceptance:** Weekly run fails visibly on any high/critical advisory.

### 5. Feed-audit auto-issue

**Problem:** The weekly feed audit fails red in Actions but nobody is paged;
dead feeds still rely on someone reading logs.

**Proposal:** On validation failures, have `feed-audit.yml` open/update a
GitHub issue (via `gh` or `actions/github-script`) listing DEAD/STALE/MOVED
feeds with suggested fixes from the validator's redirect output.

**Acceptance:** A broken feed produces an issue titled "Feed audit: N problems"
within a week, deduped against existing open issues.

---

## P2 — Medium scope

### 6. Wire PWA (installable, offline repeat visits)

The unused `vite-plugin-pwa` dependency was **removed** this cycle. Re-add it
deliberately: manifest ("AI DRUDGE"), stale-while-revalidate for `data/*.json`,
app-shell precache, `autoUpdate` registration. Test on iOS Safari + Android
Chrome before shipping — a broken service worker can pin users to stale pages.

### 7. HTML scrapers for remaining no-RSS labs

Verified feedless as of 2026-07-06: **xAI** (Cloudflare-blocked — needs a
different UA strategy or press-only coverage), **Cohere**, **Perplexity**,
**Cognition/Devin**, **Anthropic engineering blog** (anthropic.com/engineering).
Extend `scrape-sources.ts` (Anthropic news/research pattern already works).
Budget ~50 lines per site; each needs a regression check in the weekly audit.

### 8. OPML export/import

Emit `public/feeds.opml` from `sources.ts` at build time so subscribers can
import the whole source list into any RSS reader; optionally accept an OPML
upload in a future personal-overlay feature.

### 9. Per-section mute exemptions

Extend the mute model to `{ source, exceptCategories?: CategoryId[] }` so a
user can mute OpenAI everywhere except MODEL RELEASES. Schema change in
localStorage + filter logic in `App.tsx`.

### 10. Full-text search index

Client search currently matches title/source/summary of *displayed* articles.
Build a mini inverted index (titles + summaries, all fetched articles) at build
time as `search-index.json`, lazy-loaded on first search keystroke.

### 11. Claude brief upgrade

The brief prompt predates the source overhaul. Feed it the trending clusters
and per-category leads (not just top-60 by priority), ask for a "why it
matters" clause per bullet, and A/B the `effort` parameter. Consider prompt
caching (system prompt is static; headline payload varies hourly).

### 12. localStorage backup/restore

Bookmarks, queue, snapshots, mutes, and read-state now live in localStorage
only. Add an export/import JSON button (Manage panel) so a browser wipe or
device switch doesn't lose state.

---

## P3 — Larger initiatives

### 13. Major dependency upgrades

Vite 8, `@vitejs/plugin-react` 6, TypeScript 6 are all a major version ahead.
Take them one at a time with a full build + visual check; nothing currently
blocks staying on the working versions.

### 14. Custom domain

`CNAME` + Pages custom-domain config + `base: "/"` in `vite.config.ts`.
Decision needed on domain purchase first.

### 15. Analytics (privacy-preserving)

Plausible or Cloudflare Web Analytics snippet in `index.html` — no cookies, no
PII. Gives popular-story signal that could later feed ranking.

### 16. Cyber-drudge variant

Clone the architecture with cyber-weighted categories/feeds. The
`cyber_threats` / `cyber_defense` sections here already prove the pipeline;
a variant would rebalance rather than rebuild. Reuse `validate-feeds.ts` and
the research-agent source list from this cycle as the starting corpus.

---

## Technical debt register

| Item | Location | Notes |
|------|----------|-------|
| Duplicate `types.ts` | `scripts/types.ts` + `src/lib/types.ts` | Kept in sync manually; consider a shared package or codegen |
| No automated tests | — | `groupStories`, `router`, `cleanGitHubReleaseTitle`, and `extractDate` are pure functions begging for unit tests |
| Scraper fragility | `scrape-sources.ts` | Breaks silently on Anthropic HTML redesign; weekly audit doesn't cover scrapers yet |
| Reddit feeds fail from CI IPs | `sources.ts` | 403/429 most runs; Lemmy mirror + HN query added as backups — consider dropping Reddit if consistently dead |
| hnrss.org transient 502s | `sources.ts` | Tolerated (3 retries, hourly refresh); feeds self-heal next run |
| arXiv feeds empty on weekends | `sources.ts` | Expected — arXiv publishes weekdays; don't "fix" |
| Cron commits clutter history | `public/data/` | Consider a data-only orphan branch |
| Google News titles carry " - Publisher" suffix | query feeds | Cosmetic; strip in `fetch-feeds.ts` if it bothers |

---

## How to propose new items

Add a section with: problem statement, proposed solution, effort estimate,
acceptance criteria, and priority. Link a GitHub Issue when tracking formally.

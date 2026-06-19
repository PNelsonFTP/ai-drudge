# AI DRUDGE — Future Improvements

Roadmap for the next upgrade and improvements cycle. Items are prioritized by impact vs. effort. None of these are required for current production stability.

## Priority legend

| Priority | Meaning |
|----------|---------|
| P1 | High impact, reasonable effort — do first |
| P2 | Meaningful improvement, moderate effort |
| P3 | Nice-to-have or larger scope |

---

## P1 — Quick wins (1–2 days total)

### 1. Site RSS/Atom feed (`/feed.xml`)

**Problem:** Users cannot subscribe to the aggregator itself.

**Proposal:** During `build-data.ts`, emit `public/feed.xml` (or `dist/feed.xml`) from top 30 trending + lead stories.

**Effort:** ~30–50 lines in `build-data.ts`; no new dependencies.

**Acceptance criteria:**
- Valid Atom 1.0 feed at `/ai-drudge/feed.xml`
- Updates hourly with build
- Includes title, link, published date, source

---

### 2. "X new since your last visit" banner

**Problem:** Repeat visitors cannot tell what changed since last session.

**Proposal:**
- Store `lastVisitedAt` in localStorage on page unload or after 30s dwell
- Compare against `generatedAt` and article `publishedAt` / `collectedAt`
- Show dismissible banner: "12 new stories since your last visit"

**Effort:** ~40 lines in `App.tsx` + small hook.

**Acceptance criteria:**
- Banner shows correct count after hourly refresh
- Dismissal persists for session
- No banner on first visit

---

### 3. Read-state via IntersectionObserver

**Problem:** No visual distinction between read and unread headlines.

**Proposal:**
- Observe headline rows at 50% visibility
- Store seen article IDs in localStorage (cap at ~500, LRU eviction)
- Render seen items at ~50% opacity

**Effort:** ~60 lines; new `useReadState.ts` hook.

**Acceptance criteria:**
- Scroll-based marking feels natural
- Bookmarks/queue views respect read state
- Performance: no layout thrash on long pages

---

### 4. Reduce `articlesAll` payload size

**Problem:** `headlines.json` is ~360 KB; `articlesAll` is the main driver.

**Proposal:** Cap `articlesAll` to 15 items per category (preview stays as-is). Full archive deferred to a future paginated endpoint or separate file.

**Effort:** One constant change in `router.ts` + verify "View all" UX copy.

**Acceptance criteria:**
- JSON under ~200 KB
- "View all" still useful for active categories
- No regression in grouping

---

### 5. GitHub Actions Node version bump

**Problem:** Node 20 deprecation warnings in Actions logs.

**Proposal:** Update `refresh.yml` to `node-version: "22"` (or `"24"` when LTS-ready).

**Effort:** One line + test workflow run.

**Acceptance criteria:**
- Green workflow on new Node version
- No tsx/vite compatibility issues

---

## P2 — Medium scope (3–7 days)

### 6. Additional HTML scrapers (no-RSS publishers)

**Problem:** Major AI labs lack public RSS — Anthropic is scraped; others are not.

**Targets:**

| Publisher | Status | Notes |
|-----------|--------|-------|
| Anthropic | Done | `scrape-sources.ts` |
| Mistral | Missing | Check news page structure |
| xAI | Missing | Check blog HTML |
| Cognition (Devin) | Missing | Sparse updates |

**Effort:** ~50 lines per publisher; fragile — needs periodic maintenance.

**Acceptance criteria:**
- ≥3 items per publisher when news exists
- Graceful empty on scrape failure
- `feedStats`-style logging for scrapers

---

### 7. Wire PWA (offline repeat visits)

**Problem:** `vite-plugin-pwa` is in `package.json` but not configured.

**Proposal:**
- Add plugin to `vite.config.ts`
- Cache `data/*.json` and app shell with stale-while-revalidate
- Add `manifest.webmanifest` with name "AI DRUDGE"

**Effort:** Half day; test on iOS Safari and Android Chrome.

**Acceptance criteria:**
- Installable on mobile
- Repeat visit works offline with last cached headlines
- Cache invalidates on new `generatedAt`

---

### 8. Custom domain

**Problem:** URL is `pnelsonftp.github.io/ai-drudge/` — long and project-scoped.

**Proposal:**
- Add `CNAME` (e.g. `aidrudge.example.com`)
- Set `base: "/"` in vite.config if apex domain, or keep subpath
- Configure GitHub Pages custom domain in repo settings

**Effort:** DNS + config change; low code.

---

### 9. LLM brief quality (Anthropic API)

**Problem:** Fallback brief is good but not narrative; API key may not be set.

**Proposal:**
- Document secret setup prominently in HANDOFF.md (done)
- Tune prompt in `generate-brief.ts` for tighter citations
- Add `brief.source` indicator in UI ("AI summary" vs "Editor's picks")

**Effort:** Prompt tuning + small UI badge.

---

### 10. Feed health dashboard (static)

**Problem:** `feedStats` exists in JSON but is invisible to operators.

**Proposal:** Hidden `/stats` route or footer link showing feed ok/fail counts, last success, broken URL list.

**Effort:** ~100 lines; dev/operator facing.

---

### 11. Per-section mute exemptions

**Problem:** Muting a source hides it everywhere; user may want exceptions (e.g. mute OpenAI except MODEL RELEASES).

**Proposal:** Extend mute model to `{ source, exceptCategories?: CategoryId[] }`.

**Effort:** Schema change in localStorage + filter logic in `App.tsx`.

---

## P3 — Larger initiatives (1–2+ weeks)

### 12. Cyber-drudge variant

**Problem:** User wants a dedicated cybersecurity Drudge site.

**Proposal:** Use existing prompt at `/Users/paulnelson/Documents/Cursor/cyber-drudge-prompt.md` to scaffold a sibling repo with cyber-weighted feeds and categories.

**Effort:** Full new project clone; reuse architecture wholesale.

**Note:** Current ai-drudge already includes CYBER THREATS and CYBER DEFENSE categories — variant would rebalance, not duplicate effort here.

---

### 13. Separate `headlines-preview.json` + lazy `headlines-full.json`

**Problem:** Single large JSON blocks first paint on slow networks.

**Proposal:**
- Preview file: trending + 5 articles per category (~80 KB)
- Full file: loaded on "View all" or after idle `requestIdleCallback`

**Effort:** Build pipeline split + client loader refactor.

---

### 14. Full-text search (build-time index)

**Problem:** Client search only matches title/source strings.

**Proposal:** Build mini inverted index from titles + summaries; ship as `search-index.json` or embed in payload.

**Effort:** New script module; ~200 lines.

---

### 15. Multi-language / i18n

**Problem:** English-only UI and content.

**Proposal:** react-i18n for UI strings; content stays source-language.

**Effort:** Low user demand unless audience expands — defer.

---

### 16. User-configurable feed OPML import

**Problem:** Feeds are developer-edited in `sources.ts` only.

**Proposal:** localStorage OPML parse on client for personal overlay feeds (client-only, no CI).

**Effort:** Significant UX + CORS issues for browser fetches — better as build-time OPML upload in Actions.

---

### 17. Integration with local Collectors

**Problem:** `/Users/paulnelson/Documents/Cursor/Collectors/` produces `manifest.json` from Python pipelines.

**Proposal:** Optional CI path: upload collector manifest as artifact, merge in `build-data.ts`.

**Effort:** Medium; user previously chose **standalone cloud site** — only pursue if requirements change.

---

### 18. Analytics (privacy-preserving)

**Problem:** No visibility into popular stories or referrers.

**Proposal:** Plausible or Cloudflare Web Analytics (no cookies).

**Effort:** Snippet in `index.html`; policy consideration.

---

## Technical debt register

| Item | Location | Notes |
|------|----------|-------|
| `fast-xml-parser` 4.x CVE | `package.json` | [GHSA-gh4j-gqv2-49f6](https://github.com/advisories/GHSA-gh4j-gqv2-49f6) moderate; upgrade to 5.x requires retesting `processEntities` config |
| `vite-plugin-pwa` unused | `package.json` | Wire or remove |
| Duplicate `types.ts` | `scripts/types.ts` + `src/lib/types.ts` | Keep in sync manually |
| No automated tests | — | Add router/groupStories unit tests when touching logic |
| Scraper fragility | `scrape-sources.ts` | Breaks on HTML redesign |
| Cron commits clutter history | `public/data/` | Consider orphan branch or Pages-only data repo |
| 16 dead/broken feeds | `sources.ts` | Periodic audit using `feedStats` |

---

## Suggested cycle plan (2-week sprint)

**Week 1**
1. Payload size reduction (#4)
2. Site RSS feed (#1)
3. New-since-visit banner (#2)
4. Node 22 migration (#5)

**Week 2**
1. Read-state (#3)
2. PWA wiring (#7)
3. Feed health view (#10)
4. Feed audit + scraper for one missing publisher (#6)

---

## How to propose new items

Add a row to this file with:

- Problem statement
- Proposed solution
- Effort estimate
- Acceptance criteria
- Priority (P1/P2/P3)

Link to GitHub Issue when tracking formally.

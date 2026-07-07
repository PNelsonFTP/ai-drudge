# AI DRUDGE — Software Bill of Materials

Human-readable SBOM. The machine-readable CycloneDX 1.5 document is
[SBOM.json](./SBOM.json). Regenerate both any time dependencies change:

```bash
npm run sbom
```

_Last regenerated: 2026-07-07_

## Scope

- **Runtime (shipped to browsers):** React + ReactDOM only. Everything else is
  build-time tooling that never leaves CI.
- **Build/CI (GitHub Actions):** TypeScript, Vite, Tailwind, tsx, fast-xml-parser.
- **No server runtime.** The deployed site is static HTML/JS/CSS/JSON on GitHub Pages.

## Direct dependencies

<!-- SBOM-TABLE:START -->
| Package | Resolved | License | Scope |
|---------|----------|---------|-------|
| `@tailwindcss/vite` | 4.3.2 | MIT | dev/build |
| `@types/node` | 25.9.4 | MIT | dev/build |
| `@types/react` | 19.2.17 | MIT | dev/build |
| `@types/react-dom` | 19.2.3 | MIT | dev/build |
| `@vitejs/plugin-react` | 4.7.0 | MIT | dev/build |
| `fast-xml-parser` | 5.9.3 | MIT | dev/build |
| `react` | 19.2.7 | MIT | runtime |
| `react-dom` | 19.2.7 | MIT | runtime |
| `tailwindcss` | 4.3.2 | MIT | dev/build |
| `tsx` | 4.23.0 | MIT | dev/build |
| `typescript` | 5.8.3 | Apache-2.0 | dev/build |
| `vite` | 6.4.3 | MIT | dev/build |
<!-- SBOM-TABLE:END -->

Transitive packages: see [SBOM.json](./SBOM.json) (full component list with
purl + SHA-512 hashes from `package-lock.json`).

## Vulnerability status

`npm audit` as of 2026-07-06: **0 vulnerabilities** (all severities).

| Item | Status |
|------|--------|
| fast-xml-parser CVE GHSA-gh4j-gqv2-49f6 (XMLBuilder CDATA injection) | **Resolved** — upgraded 4.5.x → 5.9.3 on 2026-07-06. Note the project only ever used `XMLParser`, so exploitability was nil even before the upgrade. |
| vite-plugin-pwa (unused dependency) | **Removed** 2026-07-06 — was never wired into `vite.config.ts`; deleting it removes an unneeded supply-chain surface. |

## External services consumed at build time (CI only)

| Service | Purpose | Auth | Data sent |
|---------|---------|------|-----------|
| ~170 RSS/Atom feeds (see `scripts/sources.ts`) | Headlines | None | None (GET only) |
| anthropic.com (HTML scrape) | Anthropic news/research listings | None | None |
| hn.algolia.com | Hacker News velocity signal | None | None |
| hnrss.org, news.google.com/rss | Query-based aggregator feeds | None | None |
| stooq.com, query1.finance.yahoo.com | Stock quotes | None | None |
| api.anthropic.com | Daily brief summarization (Claude Sonnet 5) | `ANTHROPIC_API_KEY` (Actions secret) | Fetched headline titles/summaries only |

No third-party requests happen in the browser — the SPA fetches only its own
static JSON from GitHub Pages.

## Platform / infrastructure

| Component | Version / notes |
|-----------|-----------------|
| Node.js (CI) | 22 (`.github/workflows/refresh.yml`) |
| GitHub Actions | `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4` |
| Hosting | GitHub Pages (static) |

## Update policy

- Semver-compatible updates: run `npm update && npm audit` during any working session.
- Major upgrades pending: Vite 8, @vitejs/plugin-react 6, TypeScript 6 — see
  [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md).
- The weekly `feed-audit.yml` workflow validates feed URLs. Dependency freshness
  is checked manually; an automated audit gate is on the roadmap.

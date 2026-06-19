# AI DRUDGE — Software Bill of Materials (SBOM)

Human-readable dependency inventory. Machine-readable CycloneDX BOM: [SBOM.json](./SBOM.json).

**Generated:** June 15, 2026  
**Application version:** 1.0.0  
**Total npm packages (transitive):** ~372

---

## Direct dependencies

### Production (runtime — shipped in browser bundle)

| Package | Locked version | License | Purpose |
|---------|----------------|---------|---------|
| [react](https://www.npmjs.com/package/react) | 19.2.7 | MIT | UI framework |
| [react-dom](https://www.npmjs.com/package/react-dom) | 19.2.7 | MIT | DOM renderer |

### Development (build-time and CI only)

| Package | Locked version | License | Purpose |
|---------|----------------|---------|---------|
| [vite](https://www.npmjs.com/package/vite) | 6.4.3 | MIT | Bundler and dev server |
| [typescript](https://www.npmjs.com/package/typescript) | 5.8.3 | Apache-2.0 | Type checking |
| [tsx](https://www.npmjs.com/package/tsx) | 4.22.4 | MIT | Run TypeScript build scripts |
| [tailwindcss](https://www.npmjs.com/package/tailwindcss) | 4.3.1 | MIT | CSS framework |
| [@tailwindcss/vite](https://www.npmjs.com/package/@tailwindcss/vite) | 4.3.1 | MIT | Tailwind Vite plugin |
| [@vitejs/plugin-react](https://www.npmjs.com/package/@vitejs/plugin-react) | 4.7.0 | MIT | React Fast Refresh + JSX |
| [fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser) | 4.5.6 | MIT | RSS/Atom XML parsing |
| [@types/node](https://www.npmjs.com/package/@types/node) | 25.9.3 | MIT | Node.js type definitions |
| [@types/react](https://www.npmjs.com/package/@types/react) | 19.2.17 | MIT | React type definitions |
| [@types/react-dom](https://www.npmjs.com/package/@types/react-dom) | 19.2.3 | MIT | React DOM type definitions |
| [vite-plugin-pwa](https://www.npmjs.com/package/vite-plugin-pwa) | 1.3.0 | MIT | **Not wired** — see FUTURE_IMPROVEMENTS.md |

---

## Key transitive dependencies (selected)

These are not direct dependencies but are material to the build output or security posture.

| Package | Version | Parent | Notes |
|---------|---------|--------|-------|
| @babel/core | 7.29.7 | @vitejs/plugin-react | JSX transform |
| rollup | (via vite) | vite | Production bundling |
| esbuild | (via vite/tsx) | vite, tsx | Fast compile |
| lightningcss | 1.32.0 | @tailwindcss/node | CSS processing |
| magic-string | 0.30.21 | @tailwindcss/node | Source maps |
| strnum | (via fast-xml-parser) | fast-xml-parser | Number parsing in XML |

Full tree: run `npm ls --all` from repo root.

---

## External services and data sources

Not npm packages — third-party services contacted at **build time only** (except GitHub Pages serving static files to users).

### Infrastructure

| Service | Purpose | Auth |
|---------|---------|------|
| GitHub Actions | CI: fetch, commit, build, deploy | `GITHUB_TOKEN` (automatic) |
| GitHub Pages | Static hosting | Repo settings |
| npm registry | Dependency install in CI | Public |

### Data APIs (no npm package)

| Service | Script | Auth | Fallback |
|---------|--------|------|----------|
| Stooq | `fetch-stocks.ts` | None | Yahoo Finance |
| Yahoo Finance (unofficial) | `fetch-stocks.ts` | None | — |
| Anthropic Messages API | `generate-brief.ts` | `ANTHROPIC_API_KEY` secret | Curated fallback |
| ~103 RSS/Atom publishers | `fetch-feeds.ts` | None | Per-feed skip on error |
| anthropic.com (HTML) | `scrape-sources.ts` | None | Empty on failure |

### Feed publishers (by category count)

See `scripts/sources.ts` — 103 configured sources across 18 categories. Publisher list changes with editorial updates; do not treat this document as the canonical feed list.

---

## Build artifacts (deployed)

| Artifact | Approx. size | Contains |
|----------|--------------|----------|
| `dist/index.html` | ~2 KB | App shell, preload hints |
| `dist/assets/index-*.js` | ~215 KB (~67 KB gzip) | React SPA |
| `dist/assets/index-*.css` | ~15 KB (~4 KB gzip) | Tailwind styles |
| `dist/data/headlines.json` | ~360 KB | Categories, trending, articlesAll |
| `dist/data/stocks.json` | ~0.7 KB | 5 stock quotes |
| `dist/data/brief.json` | ~1.5 KB | Daily brief |

---

## Runtime requirements

| Environment | Requirement |
|-------------|-------------|
| CI (GitHub Actions) | Node.js 20 (upgrade to 22+ recommended) |
| Local dev | Node.js 20+ |
| End-user browser | Modern evergreen (Chrome, Firefox, Safari, Edge) |
| Server runtime | **None** — static files only |

---

## Security notes

### npm audit (June 15, 2026)

| Package | Severity | Advisory | Notes |
|---------|----------|----------|-------|
| fast-xml-parser 4.5.6 | Moderate | [GHSA-gh4j-gqv2-49f6](https://github.com/advisories/GHSA-gh4j-gqv2-49f6) | XMLBuilder comment/CDATA injection — **build-time only**, not in browser bundle |

Fix requires upgrading to fast-xml-parser 5.x (`npm audit fix --force`). Version 5 uses a different `processEntities` API — test all feeds after upgrade. See FUTURE_IMPROVEMENTS.md technical debt.

```bash
npm audit
npm audit fix   # review breaking changes before applying
```

Production browser bundle contains only `react` and `react-dom`.

### Secrets

| Secret | Exposure |
|--------|----------|
| `ANTHROPIC_API_KEY` | GitHub Actions env only; never in client |
| User localStorage | Bookmarks, mutes, theme — device-local only |

### Supply chain

- Lockfile: `package-lock.json` (commit to repo; CI uses `npm ci`)
- No postinstall scripts in direct dependencies
- No CDN-loaded runtime scripts — all bundled by Vite

---

## License summary

| License | Packages |
|---------|----------|
| MIT | react, react-dom, vite, tailwindcss, fast-xml-parser, tsx, most toolchain |
| Apache-2.0 | typescript |

Application itself: unlicensed / private (no LICENSE file in repo as of this writing).

---

## Regenerating this SBOM

```bash
# Direct dependency versions
npm ls --depth=0

# Full tree (large)
npm ls --all --json > docs/SBOM-tree.json

# Update CycloneDX JSON manually or use:
npx @cyclonedx/cyclonedx-npm --output-file docs/SBOM.json
```

---

## Related documents

- [DESIGN.md](./DESIGN.md) — architecture
- [HANDOFF.md](./HANDOFF.md) — operations
- [PROJECT_HISTORY.md](./PROJECT_HISTORY.md) — build history
- [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) — roadmap

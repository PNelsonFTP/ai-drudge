# AI DRUDGE — Documentation Index

Complete documentation for the static AI news aggregator.
Last full refresh: 2026-07-06 (project overhaul).

## Live site

**https://pnelsonftp.github.io/ai-drudge/** · Atom feed at [/feed.xml](https://pnelsonftp.github.io/ai-drudge/feed.xml)

## Documents

| Document | Audience | Contents |
|----------|----------|----------|
| [PROJECT_HISTORY.md](./PROJECT_HISTORY.md) | Everyone | Chronology of all five build phases, feature inventory, metrics |
| [DESIGN.md](./DESIGN.md) | Engineers | Architecture, data flow, scoring/routing algorithms, failure modes |
| [HANDOFF.md](./HANDOFF.md) | Operators | Deploy, local dev, troubleshooting, known-benign failures |
| [SBOM.md](./SBOM.md) | Security / compliance | Human-readable dependency bill of materials |
| [SBOM.json](./SBOM.json) | Automation | CycloneDX 1.5 machine-readable BOM (regenerate: `npm run sbom`) |
| [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) | Product / engineering | 16-item prioritized roadmap + tech-debt register |
| [UPGRADE_PLAN.md](./UPGRADE_PLAN.md) | Historical | Plan for the June 2026 cycle (executed; kept for reference) |

## Quick start

See the [project README](../README.md) for install and dev commands.

## Key facts

- **Stack:** Vite 6, React 19, TypeScript 5.8, Tailwind v4, fast-xml-parser 5
- **Architecture:** Build-time RSS fetch → static JSON → GitHub Pages SPA
- **Refresh:** Hourly via GitHub Actions (`5 * * * *`); weekly feed audit (Mondays)
- **Categories:** 18 (see DESIGN.md §6)
- **Feeds:** ~178 configured, all URL-validated 2026-07-06 (~97% OK per build)
- **Security posture:** 0 npm audit findings; no server runtime; all third-party
  fetch happens in CI; no secrets in the client

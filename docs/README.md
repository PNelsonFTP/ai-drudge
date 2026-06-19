# AI DRUDGE — Documentation Index

Complete documentation for the static AI news aggregator.

## Live site

**https://pnelsonftp.github.io/ai-drudge/**

## Documents

| Document | Audience | Contents |
|----------|----------|----------|
| [PROJECT_HISTORY.md](./PROJECT_HISTORY.md) | Everyone | Chronology of what was built, why Next.js failed, feature inventory |
| [DESIGN.md](./DESIGN.md) | Engineers | Architecture, data flow, routing algorithm, failure modes |
| [HANDOFF.md](./HANDOFF.md) | Operators | Deploy, local dev, troubleshooting, git conflicts |
| [SBOM.md](./SBOM.md) | Security / compliance | Human-readable dependency bill of materials |
| [SBOM.json](./SBOM.json) | Automation | CycloneDX 1.5 machine-readable BOM |
| [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) | Product / engineering | Prioritized roadmap for next upgrade cycle |

## Quick start

See the [project README](../README.md) for install and dev commands.

## Key facts

- **Stack:** Vite 6, React 19, TypeScript 5.8, Tailwind v4
- **Architecture:** Build-time RSS fetch → static JSON → GitHub Pages SPA
- **Refresh:** Hourly via GitHub Actions (`5 * * * *`)
- **Categories:** 18 (see DESIGN.md §6)
- **Feeds:** ~103 configured (~85–90 typically OK per build)
- **No server runtime** — all third-party fetch happens in CI

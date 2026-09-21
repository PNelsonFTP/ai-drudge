# Review summary — 21 September 2026

AI Drudge only. The RIA site was not part of this pass.

The 8 suggested removals were **not** deleted. The 20 add-now feeds were added. Ranking bugs from the homepage review were fixed, then `public/data/` was refreshed.

| Review | File |
|--------|------|
| Every current feed | [FEED_AUDIT_2026-09-21.md](./FEED_AUDIT_2026-09-21.md) |
| Homepage and ranking | [REVIEW_2026-09-21.md](./REVIEW_2026-09-21.md) |
| New feeds | [FEED_CANDIDATES_2026-09-21.md](./FEED_CANDIDATES_2026-09-21.md) |

## Still in the list (suggested removals)

CNBC Tech, MarketWatch, Bloomberg Markets, ZDNet AI, SentinelOne, Noma Security, Promptfoo Blog, and `continuedev/continue`.

## Added

SemiAnalysis Newsletter (not the stale `semianalysis.com/feed`), The Information, Google Research Blog, Amazon Science, Devin, Microsoft Agent Framework, PyTorch Blog, Quanta Magazine AI, IEEE Spectrum Semiconductors, EleutherAI, HPC Wire, CoreWeave, EE Times, InfoQ AI/ML, JetBrains AI, Databricks, Mozilla AI, NCSC UK, Science Robotics, and Benedict Evans.

## Ranking fixes

Future dates no longer score as just-published. `valuation` no longer matches `evaluation`, and `series a` no longer matches `time-series and`. GitHub release tags cannot take the site lead when a news story exists. Techmeme, smol.ai, TLDR AI, and Last Week in AI are treated as aggregators. Fetches are capped so a full run does not abort the tail, and a publisher plus an aggregator twin can both count toward trending.

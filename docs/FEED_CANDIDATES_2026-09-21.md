# Feed candidates — 2026-09-21

Probed on 2026-09-21 with a desktop Safari user agent and a 10-second timeout. A feed is eligible only when the response is parseable RSS or Atom and the newest item is on or after 2026-06-23. Every URL already in `scripts/sources.ts` was skipped. About 220 candidates were checked, including a recheck of the sources the file header marked dead on 2026-08-18.

`scripts/sources.ts` was not modified.

The add-now list is the best 20. Rank is by how well the feed covers labs, research, agents, security, hardware, and serious industry coverage for people tracking machine intelligence. Category age windows in `sources.ts` are noted where a qualifying feed will sit dark until the next post.

## Add now

| # | Name | URL | Category | Priority | Newest | Sample title |
|---|------|-----|----------|----------|--------|--------------|
| 1 | SemiAnalysis Newsletter | https://newsletter.semianalysis.com/feed | hardware | high | 2026-09-21 | Computation and Data Movement for Inference |
| 2 | The Information | https://www.theinformation.com/feed | industry_news | high | 2026-09-21 | OpenAI Releases Proposal for International AI Safety Coordination |
| 3 | Google Research Blog | https://research.google/blog/rss/ | research | high | 2026-09-18 | MilleMiglia: A realistic instance generator for middle-mile logistics |
| 4 | Amazon Science | https://www.amazon.science/index.rss | research | high | 2026-09-21 | Advancing AI for biology: Teaching models to design and characterize antibodies |
| 5 | Devin (Cognition) | https://devin.ai/rss.xml | agents_tools | high | 2026-09-21 | Bringing Devin Cloud to your terminal |
| 6 | Microsoft Agent Framework | https://devblogs.microsoft.com/agent-framework/feed/ | agents_tools | high | 2026-09-16 | From Specialist Agents to Distributed Skills over MCP |
| 7 | PyTorch Blog | https://pytorch.org/blog/feed/ | open_source | high | 2026-09-18 | PyTorch Day Japan 2026 Comes to Tokyo on December 10 |
| 8 | Quanta Magazine AI | https://www.quantamagazine.org/tag/artificial-intelligence/feed/ | analysis | high | 2026-09-08 | AI Has Solved One of Math's $1 Million Millennium Prize Problems |
| 9 | IEEE Spectrum Semiconductors | https://spectrum.ieee.org/feeds/topic/semiconductors.rss | hardware | medium | 2026-09-14 | How OpenAI Used Its Own LLMs to Design Its Jalapeño Chip |
| 10 | EleutherAI | https://blog.eleuther.ai/index.xml | open_source | high | 2026-08-25 | What We Learned Trying to Catch AI Liars: An Aletheia's Quest Retrospective |
| 11 | HPC Wire | https://www.hpcwire.com/feed/ | hardware | medium | 2026-09-21 | Huawei Unveils New UnifiedBus Computing Architecture for SuperPoDs and Clusters |
| 12 | CoreWeave Blog | https://www.coreweave.com/blog/rss.xml | hardware | medium | 2026-09-16 | CoreWeave Leads Cloud Providers in MLPerf Inference v6.1 Performance with NVIDIA Blackwell Ultra |
| 13 | EE Times | https://www.eetimes.com/feed/ | hardware | medium | 2026-09-21 | AI Power Demands Push GaN into Data Center Design |
| 14 | InfoQ AI/ML | https://feed.infoq.com/ai-ml-data-eng | agents_tools | medium | 2026-09-21 | Podcast: Securing AI Agents: Identity, Authorization, and the DPACT Framework |
| 15 | JetBrains AI | https://blog.jetbrains.com/ai/feed/ | agents_tools | medium | 2026-09-17 | Building a RAG Pipeline for Semantic Code Search: A Developer Diary and Field Notes |
| 16 | Databricks Blog | https://www.databricks.com/feed | products | medium | 2026-09-19 | RADAR: Catch gray failures with anomaly detection |
| 17 | Mozilla AI | https://blog.mozilla.org/en/category/ai/feed/ | open_source | medium | 2026-09-17 | Mila and Mozilla announce new initiative to build trustworthy open source AI for everyone, with Canadian government support |
| 18 | NCSC UK | https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml | cyber_defense | medium | 2026-09-21 | One does not simply defend agentically |
| 19 | Science Robotics | https://www.science.org/action/showFeed?type=etoc&feed=rss&jc=scirobotics | robotics | medium | 2026-09-16 | Advancing minimally invasive precision surgery in large open cavities with robotic flexible endoscopy |
| 20 | Benedict Evans | https://www.ben-evans.com/benedictevans/rss.xml | analysis | medium | 2026-09-03 | AI, tools and transformation |

Machine-readable copy: `scripts/discovered-2026-09-21.json`.

### Why these

Labs and open research were the biggest hole. Google's research blog is publishing again (tool-use data, inference search, plus some non-ML science). Amazon Science is carrying agent benchmarks and judge-agreement work alongside biology models. EleutherAI's recent posts are reward hacking, data filtering, and lying probes. PyTorch's recent set includes low-precision Flash Attention 4 and kernel work, and Mozilla's AI category is the open-source policy and Mila partnership lane. Open source today is only Ai2.

Agents were LangChain, Modal, Cline, Vercel, and Amp. Devin's feed is the Cognition blog that had no usable RSS in August. Microsoft Agent Framework (the Semantic Kernel devblog now redirects here) is posting MCP skills and production harnesses. InfoQ's AI/ML feed and JetBrains AI cover agent engineering and IDE agents. Databricks is the product lane for agent data infrastructure.

Hardware analysis stopped at NVIDIA, Chips and Cheese, More Than Moore, and Fabricated Knowledge. SemiAnalysis is the missing primary source. IEEE Spectrum's semiconductor topic is separate from the AI and robotics topics already configured. HPC Wire and EE Times cover clusters, power, and memory. CoreWeave is the neocloud operations feed (MLPerf, Vera Rubin bring-up), mixed with storage how-tos.

Quanta's AI tag is magazine science (Millennium Prize problems, Erdős problems, what "intelligence" means). It is filed under analysis so the 21-day window can hold a 13-day cadence. The untagged Quanta feed is general science and was rejected. Benedict Evans is the same lane: token pricing, job exposure, and how OpenAI competes.

NCSC's all-content feed is the current UK cyber primary source (agentic defense, shadow AI, plus state spyware). The older reports-only URL is stale. Science Robotics is a thin but real robotics research feed; Figure, 1X, Physical Intelligence, Skild, Agility, Boston Dynamics, and TRI still have no usable RSS.

### Cadence vs homepage windows

These pass the 2026-06-23 bar and will show on the next build:

- Inside a 5-day window: SemiAnalysis, The Information, Amazon Science, Devin, InfoQ, EE Times, HPC Wire, NCSC, Databricks, JetBrains, Mozilla.
- Microsoft Agent Framework's newest item is 2026-09-16, on the edge of the 5-day agents window.
- Inside a 10-day window: Google Research, PyTorch, IEEE Spectrum Semiconductors, CoreWeave.
- Inside a 21-day window: Quanta AI, Science Robotics, Benedict Evans.

EleutherAI's newest post is 2026-08-25, inside the June cutoff and outside the 10-day open-source window. Adding it captures the next post. Until then the section will not show the August essays.

### SemiAnalysis

Verified today.

| URL | Result |
|-----|--------|
| https://newsletter.semianalysis.com/feed | Live. HTTP 200, RSS, newest item 2026-09-21, 13 items in the last 30 days. Recent titles include Vera Rubin NVL72 agentic inference, on-device vs datacenter inference, and HBM stacks. |
| https://semianalysis.substack.com/feed | Redirects to the newsletter URL above. Same feed. |
| https://semianalysis.com/feed | Still stale. Newest item 2025-09-16 (xAI Colossus 2). Same body as `www.semianalysis.com/feed`. |

Use the newsletter URL. Leave the September 2025 site feed off the list.

## Dead-list recheck (header dated 2026-08-18)

| Source | Result today |
|--------|----------------|
| SemiAnalysis site feed | Stale since 2025-09-16. Newsletter URL is the live one. |
| The Information | Was 403. `https://www.theinformation.com/feed` is HTTP 200 and on the add-now list. |
| Google Research Blog | `https://research.google/blog/rss/` is fresh (newest 2026-09-18). The old blogspot FeedBurner is not the URL to add. |
| The Rundown | `https://www.therundown.ai/feed` parses, newest 2026-09-21. Consumer daily that overlaps TLDR AI, smol.ai, and Ben's Bites. Left off the add-now list. |
| Every.to Chain of Thought | Parses, newest 2026-07-10. Too slow and too general. |
| Qwen Blog | `https://qwenlm.github.io/blog/index.xml` still newest 2025-09-22. |
| The Gradient | Newest 2026-02-18. |
| OpenAI Developer Blog | `https://developers.openai.com/rss.xml` newest 2026-05-05. |
| Anthropic news, engineering, research | Pages load. No RSS/Atom link. Keep the existing scraper. |
| xAI | 403 / 404. |
| Cohere | HTML, not a feed. |
| Perplexity, Groq, Cerebras, Nous, Runway, ElevenLabs | No parseable fresh feed. Groq's discovered "feed" links were icons. |
| Stanford HAI | HTML, not a feed. |
| DeepLearning.AI The Batch | 404. |
| LMSYS Blog | Feed URLs 404 or timed out. |
| Unsloth blog | 403. GitHub releases stay the right proxy. |
| Jan.ai | No feed. |
| Figure, 1X, Physical Intelligence, Boston Dynamics | No usable feed. Boston Dynamics `/feed/` is empty. |
| IBM Quantum | 404. |
| LlamaIndex blog | 404. |
| Prompt Security | 404. |
| Cognition | No feed on cognition.ai. The Devin blog RSS above is the working Cognition outlet. |
| Transluce | No feed. |
| Aider blog | `https://aider.chat/feed.xml` parses and is stale (newest 2025-05-08). |
| CrewAI blog | Newest 2026-06-22, one day before the cutoff. |

## Parsed, and left off

Worth knowing about, and not in the 20:

- **Zed Blog** (`https://zed.dev/blog.rss`, newest 2026-09-16, "Replace PRs with Delta"). Serious editor, 5.8 days old, just outside the agents window, mixed with non-agent posts. First alternate if agents need another product blog.
- **Rest of World** (`https://restofworld.org/feed/latest/`). Strong global reporting, including Nvidia in the UAE, mixed with non-AI stories such as iPhone prices.
- **Lambda Blog** (`https://lambda.ai/blog/rss.xml`). MLPerf, OpenResearcher, and customer research on a GPU-cloud blog. CoreWeave already covers the neocloud slot.
- **SemiEngineering** and **SemiWiki**. Real chip-design coverage, including agentic layout repair, with lead items that are often ordinary electronics.
- **Arize Blog** (`https://arize.com/blog/feed/`). Solid eval writing, vendor-heavy.
- **Wiz Blog**. Includes a LiteLLM auth-bypass writeup, and the newest item is an AWS signup post.
- **Chainguard Unchained**. Fresh supply-chain blog, light on model security.
- **Deep (Learning) Focus** (`https://cameronrwolfe.substack.com/feed`, 2026-08-24). High-quality RL/agent guides, 28 days old, outside both the research and analysis windows.
- **Answer.AI** (`https://www.answer.ai/index.xml`, 2026-08-19) and **Hamel Husain** (`https://hamel.dev/index.xml`, 2026-08-12). Same: excellent, too slow for a homepage window.
- **Phoronix, The Economist technology, Axios, Semafor, Mozilla's main blog, Quanta's main feed, Nature machine-learning subject RSS.** Parseable and fresh, and broad enough to crowd a section with non-AI items.
- **NVIDIA Newsroom.** Overlaps the NVIDIA blog and dev blog, and includes GeForce NOW game launches.
- **Irrational Analysis, AMD investor-relations releases.** Market memos and earnings. Wrong audience.
- **AI Impacts.** The post feed is stale (2024-12-16). The fresh URL is a comment spam feed.
- **GitHub release atoms** that parsed and are fresh: OpenCode, pydantic-ai, goose, LocalAI, OpenAI Agents SDK, Cline. Titles are version strings, and the repo lane is already full. mlx-lm, Isaac GR00T, and openpi are stale. Aider releases stopped in February 2026.
- **Google Security Blog** still has prompt-injection posts, and the newest item is 2026-04-23, before the cutoff.
- **Robohub** timed out twice. Ada Lovelace's feed returns empty. Apollo Research, Goodfire, FAR AI, Kyutai, Liquid AI, Prime Intellect, ByteDance Seed, Meta AI (`ai.meta.com`), AI21, and Reka still have no public feed.

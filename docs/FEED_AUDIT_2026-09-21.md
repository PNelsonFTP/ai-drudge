# Feed audit — 2026-09-21

Audit of every RSS/Atom URL in `scripts/sources.ts` and every HTML scraper in `scripts/scrape-sources.ts`. Nothing in this file was applied: `scripts/sources.ts` was not edited, and no feed was deleted.

## Method

- Date basis: 2026-09-21. Ages use 2026-09-21T18:00:00Z.
- Each RSS/Atom URL was fetched with a desktop Safari user agent, a 10 second timeout, and one retry on timeout, HTTP 429, or HTTP 5xx. Responses were parsed as RSS, Atom, or RDF. The newest item date and three sample titles were recorded.
- Each HTML scraper was fetched the same way, then run through the card regex in `scripts/scrape-sources.ts`.
- Build cross-check: `public/data/headlines.json` `generatedAt` 2026-09-21T13:55:57.200Z, `feedStats` length 187 (183 feeds + 4 scrapers). Eleven stats were `ok: false`.
- SUGGEST-REMOVE only for a dead feed, a feed whose newest item is older than 90 days (journals excepted), an empty feed, or consistently off-topic junk. Low volume alone is not a reason. The only journal in the list is Nature Machine Intelligence; its newest item is 2026-09-18, so the journal exception did not keep any stale feed.

## Counts

| | |
| --- | ---: |
| RSS/Atom feeds | 183 |
| HTML scrapers | 4 |
| Total sources | 187 |
| KEEP | 144 |
| WATCH | 35 |
| SUGGEST-REMOVE | 8 |

Probe transport results before classification: 181 parsed, plus these failures on the timed pass: Noma Security HTTP 404, SentinelOne HTTP 404, JFrog Security Research HTML (not a feed), Straiker STAR network/TLS reset, r/LocalLLM HTTP 429, HN: local LLM HTTP 502. Later retries recovered r/LocalLLM and HN: local LLM. Straiker and JFrog still failed here, but both were `ok` in the same-day build.

## Suggested removals

Ranked by damage to the current page, then dead feeds, then long-stale feeds. The last row is only five days past the 90-day line.

### 1. CNBC Tech

- Category: `industry_news`. Priority: medium.
- URL: https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664
- Probe: OK, HTTP 200, newest 2026-09-21 (0.1d), 30 items.
- Why: Consistently off-topic. id=10000664 is a markets wire: stock movers, tariffs, the Fed, Buffett. Two of twelve recent items are about AI. Today's headlines.json is showing the stock-movers piece.
- Sample titles:
  - ‘It's awful’: How tariffs, soaring fuel costs and higher interest rates are squeezing American companies
  - Stocks making the biggest moves premarket: Paramount, Warner Bros., Accenture, Novo & more
  - Three words from Kevin Warsh have Wall Street wondering how far the Fed will go with rate hikes

### 2. MarketWatch

- Category: `ai_finance`. Priority: low.
- URL: https://feeds.content.dowjones.io/public/rss/mw_topstories
- Probe: OK, HTTP 200, newest 2026-09-21 (0d), 10 items.
- Why: Consistently off-topic. mw_topstories is personal-finance advice plus general markets. Two of ten items mention AI stocks; the rest are retirement and lifestyle columns. Today's page is showing Novo Nordisk and a China stock fund, not AI.
- Sample titles:
  - ‘She says it’s just money’: My friend pays for everything. I should be grateful, but I can’t stand her anymore.
  - Meta’s stock is enjoying its best month in 13 years thanks to the company’s hot new AI assistant
  - The future of retirement? Work until you die.

### 3. Bloomberg Markets

- Category: `ai_finance`. Priority: high.
- URL: https://feeds.bloomberg.com/markets/news.rss
- Probe: OK, HTTP 200, newest 2026-09-21 (0d), 20 items.
- Final URL: https://www.bloomberg.com/feeds/markets/news.rss
- Why: Consistently off-topic for AI finance. Of twelve recent items, most are oil, airports, debt, and box office. Today's headlines.json is showing a diesel-export ban and a US-China trade truce. Bloomberg Tech, already in the list, is the on-topic wire.
- Sample titles:
  - NYC Airports Disrupted by Air Traffic Control Outage
  - Radiant World Table Shows Six Lenders With $870 Million Exposure
  - Stocks Climb on US-China Optimism, Copper's AI Bppm

### 4. ZDNet AI

- Category: `industry_news`. Priority: medium.
- URL: https://www.zdnet.com/topic/artificial-intelligence/rss.xml
- Probe: OK, HTTP 200, newest 2026-09-21 (0.1d), 25 items.
- Final URL: https://www.zdnet.com/rss/news/ (same host, so this is a path redirect, not a host change).
- Why: The configured topic URL redirects to the sitewide firehose. The three newest titles happen to be AI. Items just under them include Roku bundles, Bose earbuds, a power station, Pixel, iPhone 18, and a Windows update. https://www.zdnet.com/topic/artificial-intelligence/feed/ is an empty RSS document.
- Sample titles:
  - Claim up to $95 today from Apple’s Siri AI settlement – here’s how
  - The AI models that cheat the most, according to new CAIS benchmark
  - Businesses finally seeing AI ROI, but 62% can’t handle the storage demands

### 5. SentinelOne

- Category: `cyber_defense`. Priority: medium.
- URL: https://www.sentinelone.com/feed/
- Probe: HTTP_404, HTTP 404, newest — (—), 0 items.
- Final URL: https://www.sentinelone.com/feed/
- Why: Dead. https://www.sentinelone.com/feed/ returns HTTP 404, and today's build recorded a failure. The labs feed is a working replacement.

### 6. Noma Security

- Category: `ai_security`. Priority: low.
- URL: https://noma.security/feed/
- Probe: HTTP_404, HTTP 404, newest — (—), 0 items.
- Final URL: https://noma.security/feed
- Why: Dead RSS. /feed/, /blog/rss.xml, /blog/feed/, and /resources/feed/ all return HTTP 404, and today's build recorded a failure. The HTML blog is still publishing.

### 7. Promptfoo Blog

- Category: `ai_security`. Priority: medium.
- URL: https://www.promptfoo.dev/blog/rss.xml
- Probe: OK, HTTP 200, newest 2026-03-12 (193.8d), 20 items.
- Why: Stale. Newest item is 12 Mar 2026 (194 days), "OpenClaw at Work: Prompt Injection Risks." The 9 Mar post says Promptfoo is joining OpenAI, and nothing has been published since. /blog/atom.xml is the same corpus. Over 90 days, and this is not a journal.
- Sample titles:
  - OpenClaw at Work: Prompt Injection Risks
  - McKinsey's Lilli Looks More Like an API Security Failure Than a Model Jailbreak
  - Promptfoo is joining OpenAI

### 8. continuedev/continue

- Category: `github_repos`. Priority: high.
- URL: https://github.com/continuedev/continue/releases.atom
- Probe: OK, HTTP 200, newest 2026-06-19 (94.7d), 10 items.
- Why: Stale. Newest GitHub release is v2.1.0-vscode on 19 Jun 2026 (95 days). The GitHub releases API agrees there is nothing newer. Over 90 days. The repo is not archived; it just has not shipped.
- Sample titles:
  - v2.0.0-vscode
  - v2.1.0-vscode
  - v1.2.24-vscode

## Replacements

Probed on 2026-09-21 with the same user agent and 10 second timeout. Listed only when a live alternative actually responded, or when a nearby URL was checked and failed.

| Remove | Replacement | Probe |
| --- | --- | --- |
| SentinelOne | `https://www.sentinelone.com/labs/feed/` | HTTP 200, RSS, 10 items, newest 2026-09-18. Titles include TraderTraitor backdoors, illicit OpenAI agent activity on Hugging Face, and agentic intrusions. `/blog/feed/` timed out; `/blog/rss.xml` is 404. |
| CNBC Tech | `https://news.google.com/rss/search?q=site:cnbc.com+(%22artificial+intelligence%22+OR+OpenAI+OR+Anthropic+OR+Nvidia)&hl=en-US&gl=US&ceid=US:en` | HTTP 200, 100 items, newest 2026-09-21 (Huang and the AI-safety debate, Anthropic/Accenture, AI data-center deals). CNBC category id `19854910` is still a markets squawk (options, Bitcoin, Morning Squawk), so it is not a replacement. |
| Noma Security | No working RSS. Scrape `https://noma.security/blog` the way Gray Swan is scraped. | Blog HTTP 200, 9 posts, no `<time>` and no RSS link. Titles are current (RSI, insider risk, deploying Fable 5 / Mythos 5 / Daybreak). `/feed/` and the other RSS paths are 404. |
| MarketWatch | None. | `mw_technology` is HTTP 404 (`Feed not found`). `marketwatch.com/rss/topstories` is the same general wire. FT Artificial Intelligence and GN: AI x SEC/FINRA already cover this lane. |
| Bloomberg Markets | None. | Bloomberg Tech is already in `industry_news` and is on-topic (newest 2026-09-21). Do not add another general markets wire. |
| ZDNet AI | None found. | `/topic/artificial-intelligence/feed/` is an empty RSS document. Ars Technica AI, The Verge AI, Wired AI, and The Register AI/ML already cover this lane. |
| Promptfoo Blog | None. | `/rss.xml` is 404. `/blog/atom.xml` is the same feed, newest 2026-03-12. OpenAI News already covers the acquirer. |
| continuedev/continue | None. | GitHub API latest release is `v2.1.0-vscode` (matches the atom feed). `https://blog.continue.dev/rss.xml` and `https://continue.dev/changelog/rss.xml` are 404. |

Not removals, but URL notes: OpenAI Blog already redirects at the OpenAI News RSS, so deleting that one row is a dedupe, not a rescue. Google AI Blog's final URL is `https://blog.google/innovation-and-ai/technology/ai/rss/`. `ai.meta.com/blog/rss.xml` is 404, so there is still no first-party Meta AI feed to swap in.

## WATCH

35 sources. Keep them. Each one is alive, under 90 days when it has dates, or failed only intermittently. Reasons are freshness, noise, a broken scraper, or a flaky fetch.

| Source | Category | Newest | Reason |
| --- | --- | --- | --- |
| Anthropic News | model_releases | 2026-08-31 (21.8d, 1) | Listing page is alive (10 /news/ links, dates through 18 Sep 2026, including Claude Fable 5.1), but the card regex returned 1 post from 31 Aug. Today's build collected that 1 item, and headlines.json has none from this source because it is outside the 5-day model window. |
| Anthropic Research | safety_policy | 2026-09-09 (12.8d, 3) | Listing page has 9 research links and time values through 17 Sep 2026; the regex returned 3, newest 9 Sep. Partial scrape, not a dead site. |
| OpenAI Blog | products | 2026-09-21 (0.3d, 1214) | https://openai.com/blog/rss.xml 301s to https://openai.com/news/rss.xml. Same 1,214 items and the same three newest titles as OpenAI News. Alive, but a duplicate fetch.  |
| Meta AI Blog | model_releases | 2026-09-21 (0.2d, 10) | about.fb.com/feed/ is the company newsroom, not an AI blog. Newest items mix Muse and Meta One with a subsea cable, Threads, WhatsApp payments, and a Polish ads post.  |
| Google AI Blog | model_releases | 2026-09-18 (3.2d, 20) | Redirects to /innovation-and-ai/technology/ai/rss/, which also carries Search, DevFest, football, and lifestyle items beside real AI posts.  |
| Vercel Blog | agents_tools | 2026-09-21 (0d, 1598) | 1,598-item product changelog. Recent entries mix AI Gateway model posts with Teams, billing, and CLI notes, so it can flood Agents & Tools.  |
| Tom's Hardware | hardware | 2026-09-21 (0d, 50) | Fresh, but about half the latest items are gaming PCs, iPhone storage, memory deals, and novelty GPUs. The other half is AI chips and data centers.  |
| TechCrunch Startups | funding | 2026-09-21 (0.1d, 20) | Real rounds are in the feed (Vals, physical-AI startup, a new model), interleaved with Disrupt ticket and exhibitor ads.  |
| TechCrunch Robotics | robotics | 2026-09-20 (0.8d, 19) | Same Disrupt promo block sits above Mecka, Maven, XDOF, and the China robot pieces. Not empty, but the category is ad-heavy.  |
| MIT News AI | research | 2026-09-18 (3.1d, 50) | Topic RSS includes campus items (MIT Reads, real estate, a tech-transfer award) next to genuine AI and robotics stories.  |
| LessWrong | safety_policy | 2026-09-21 (0d, 10) | Front page is current, and several posts are alignment, but the feed is general rationality (essays, grantmaking, roundups), not an AI-only source.  |
| GN: AI x SEC/FINRA | ai_finance | 2026-09-03 (18.5d, 100) | Query is the right idea, but Google News is loose: university AI majors and recycled 2025 alerts sit next to real FINRA/SEC items, and dates are unsorted.  |
| AI News (smol.ai) | industry_news | 2026-09-09 (12.5d, 716) | On-topic digest, but the newest item is 9 Sep 2026 and several entries are the stub title "not much happened today."  |
| VentureBeat AI | industry_news | 2026-08-27 (25.2d, 7) | Newest item 27 Aug 2026 (25 days, 7 items). Today's build failed, and one probe got HTTP 429. Still on-topic enterprise AI, just thin and flaky.  |
| Straiker STAR | ai_security | — (—, 0) | This host got a TLS reset (SSL_ERROR_ZERO_RETURN). Today's build still parsed the feed and surfaced 16–17 Sep posts, so it is not dead.  |
| JFrog Security Research | ai_security | — (—, 0) | Audit fetches returned HTTP 202 HTML, not RSS. Today's build still counted 10 items, and none of those survived into headlines.json. Treat as flaky, not confirmed dead.  |
| LocalLLaMA Subreddit | local_models | 2026-09-21 (0d, 25) | First probe parsed 25 items; the retry and today's build both got HTTP 429. Reddit rate-limits datacenter IPs, as sources.ts already warns.  |
| r/LocalLLM | local_models | — (—, 0) | One probe was HTTP 429; the retry parsed 25 local-model posts from 21 Sep, and today's build collected 15. Same Reddit rate-limit risk. Retry newest 2026-09-21. |
| Lemmy c/localllama | local_models | 2026-09-20 (1.1d, 20) | Probe parsed 20 items, newest about 1 day old, but today's build recorded a failure. The backup mirror is not reliable in CI.  |
| HN: local LLM | local_models | — (—, 0) | The timed audit probe returned HTTP 502. A later fetch parsed 20 items, newest 15 Sep 2026, and today's build collected 15. Flaky, not dead. Later retry newest 2026-09-15. |
| Lil'Log (Lilian Weng) | research | 2026-07-04 (79.8d, 53) | On-topic, but the newest post is 4 Jul 2026 (80 days). Under the 90-day cut, and outside the 10-day research window.  |
| BAIR Blog | research | 2026-07-29 (54.4d, 10) | Still an AI research blog (CUDA/MLX, LLM belief updates). Newest post 29 Jul 2026 (54 days).  |
| Thinking Machines Lab | research | 2026-07-31 (52.8d, 7) | On-topic lab notes, newest "A Safe Path to Open Weights" on 31 Jul 2026 (53 days).  |
| Replicate Blog | products | 2026-08-04 (48.8d, 124) | Newest post 4 Aug 2026 (49 days). Older items include "Replicate is joining Cloudflare" (Nov 2025); the blog has not stopped, but it is quiet.  |
| ML@CMU | research | 2026-08-10 (41.8d, 1) | Parseable, but the feed contains a single item, "Forking-Sequences — Part II," from 10 Aug 2026 (42 days).  |
| EU AI Act Newsletter | safety_policy | 2026-08-07 (45.1d, 27) | On-topic policy letter, newest 7 Aug 2026 (45 days). Normal for a monthly newsletter, and outside the 21-day safety window.  |
| Fabricated Knowledge | hardware | 2026-08-13 (39.1d, 20) | Semiconductor analysis, newest 13 Aug 2026 (39 days). Under 90 days; it will not show inside the 10-day hardware window. |
| Transformer Circuits | research | 2026-08-21 (31.8d, 56) | Interpretability feed is real. Newest item is 32 days old, so it misses the 10-day research window between papers.  |
| Joseph Thacker (rez0) | ai_security | 2026-08-20 (32.6d, 10) | AI-security blog, newest item 33 days old. Under 90 days, outside the 10-day security window.  |
| AI Village | ai_security | 2026-08-22 (30.8d, 26) | DEF CON 34 writeups, newest about 31 days old. On-topic and under the 90-day line.  |
| Stability AI News | model_releases | 2026-08-25 (27.1d, 20) | On-topic (funding, Stable Audio), newest 25 Aug 2026 (27 days). That misses the 5-day model-releases window.  |
| Embrace The Red | ai_security | 2026-08-27 (25.6d, 231) | Canonical prompt-injection blog, 231 items, newest 26 days old. It will not appear inside the 10-day AI-security window until the next post.  |
| METR | safety_policy | 2026-08-31 (21.5d, 100) | On-topic safety research, newest 21.5 days ago, just past the 21-day safety hard window.  |
| Ollama Blog | local_models | 2026-08-31 (21.8d, 58) | Company blog newest 31 Aug 2026 (22 days), so it misses the 5-day local-models window. The ollama/ollama release feed is current and covers the product.  |
| modelcontextprotocol spec | github_repos | 2026-07-28 (55d, 9) | Release atom is valid. Newest spec release is 55 days old. Quiet, not dead, and under 90 days.  |

Sample titles for the noisy or stale watches:

- **Meta AI Blog:** Announcing Petal, a First-of-its-Kind Transoceanic Subsea Cable · Prostujemy: fakty o walce z oszukańczymi reklamami w Polsce · Canadian Start-up smartARM Uses AI to Create Intuitive Bionic Prosthetics
- **Vercel Blog:** Vercel Connect now supports Microsoft Teams · Deployments now show billable duration and CPU minutes · Grok 4.7 now available and 40% off on AI Gateway, fx, and eve
- **Tom's Hardware:** iPhone 18 Pro Max storage can drop lower than a hard drive at 1.1 MB/s during heavy writes — QLC NAND offers higher capacity but reportedly suffers 38% drop compared to TLC-based P · Get the world’s fastest gaming CPU and a DLSS 5-capable GPU in a gaming PC for $2,299 — fully loaded powerhouse sports Ryzen 7 9800X3D, RTX 5080 Founders Edition, 32GB RAM, and 1TB · Local opposition blocked 45 data center projects worth $68 billion in the second quarter of 2026 — data center investments reportedly still on track to hit $32 trillion by 2050
- **TechCrunch Robotics:** 6 days left to save up to $200 to TechCrunch Disrupt 2026 · Prices go up in 7 days — get your Disrupt ticket now · The clock is ticking: Final 24 hours to exhibit at TechCrunch Disrupt 2026
- **AI News (smol.ai):** not much happened today · not much happened today · OpenAI reports Navier-Stokes singularity find, a contender for second ever Millenium Prize awarded, overshadowing Cognition's $48B Series E, Mistral's $24B Series D, Meta's Muse ag
- **VentureBeat AI:** Enterprise AI's real risk isn't autonomous agents. It's the complexity between them. · When agents act on their own, governance has to live in the data layer · Orchestration is the new challenge for CX in the age of AI agents
- **Lil'Log (Lilian Weng):** Harness Engineering for Self-Improvement · Scaling Laws, Carefully · Why We Think
- **Stability AI News:** The Entertainment Industry’s Biggest Names Back Stability AI in Latest Funding Round · Sharing a new way to work with Stable Audio · Meet Stable Audio 3.0, the model family built for artistic experimentation with open-weight models
- **Anthropic News:** Improving our alignment and security efforts
- **Straiker STAR** (from today's build, not this probe): Straiker Named a Pioneer in Gartner’s Emerging Market Quadrant for AI Application Security (2026-09-17) · Nine Questions That Tell You Whether Your AI Security Vendor Is Selling Theater (2026-09-16).
- **HN: local LLM** (later retry): Show HN: Sunk Cost – How long until a local LLM rig pays for itself? · The smallest edge AI device for local LLMs · Why your local LLM feels dumber than it is.

## KEEP

144 sources. Each parsed during this audit, or (for the two undated scrapers) returned on-topic cards and items in today's build. Newest item is inside 21 days unless noted in the reason. One sample title is the newest item.

| Source | Category | Newest | Items | Reason |
| --- | --- | --- | ---: | --- |
| Google DeepMind Blog | model_releases | 2026-09-15 | 100 | Gemini and research posts, newest 15 Sep (6 days). Healthy lab feed. Latest: Introducing Gemini 3.8 Live and 3.8 Live Extended Thinking. |
| HN: Chinese Frontier Labs | model_releases | 2026-09-20 | 20 | Point-filtered DeepSeek/Qwen/Kimi/GLM query is current (Qwen Image, GLM coding agent). Latest: Qwen Image 2.1. |
| Hugging Face Blog | model_releases | 2026-09-21 | 863 | High volume and current. Latest: Pruning LLMs Like a Physicist: Block Removal as an Ising Optimization Problem. |
| Mistral AI | model_releases | 2026-09-16 | 87 | Lab feed, newest 16 Sep (5.3 days). Healthy; it sits on the edge of the 5-day model window. Latest: Mistral and Mozilla are bringing open, private and multilingual AI to your web browser. |
| OpenAI News | model_releases | 2026-09-21 | 1214 | Canonical lab feed, current. Do not confuse with OpenAI Blog, which is the same RSS. Latest: Advisory Group on Mathematics and Artificial Intelligence. |
| The Decoder | model_releases | 2026-09-21 | 10 | Current model news. Latest: UN science panel says there is "no assurance humans will keep control" over AI agents. |
| 404 Media | industry_news | 2026-09-21 | 15 | Investigations mix AI (surveillance, Spotify hijack, agent spam) with other tech. Enough AI to keep. Latest: Is Your City Using Axon License Plate Cameras? We Need Your Help. |
| Ars Technica AI | industry_news | 2026-09-21 | 20 | Current lab and policy news (Gemini breaches, AI Force). Latest: Google confirms Gemini models hacked three companies in May 2026. |
| Bloomberg Tech | industry_news | 2026-09-21 | 20 | Redirects to www.bloomberg.com and is an AI-heavy tech wire (Muse, data centers, OpenAI standards, Nvidia). Latest: Trump-Xi Summit Puts Global AI Race in Focus. |
| HN: AI (150+ points) | industry_news | 2026-09-20 | 20 | Point-filtered Hacker News query is current and about AI. Occasional opinion threads are expected. Latest: AI and the Destruction of the Creative Commons. |
| HN: LLM (100+ points) | industry_news | 2026-09-20 | 20 | Point-filtered LLM query is current. Latest: Pirate Face Rescues LLM Models from Deletion. |
| IEEE Spectrum AI | industry_news | 2026-09-18 | 30 | Current AI and robot-safety pieces, plus some sponsored infrastructure. Latest: Parallel Reads and Write Optimization for Large-Scale Data Replication. |
| Last Week in AI | industry_news | 2026-09-17 | 20 | Newsletter is current enough for a weekly (newest inside the industry window). Latest: Last Week in AI #344 - Navier–Stokes, Pacing the Frontier, AI Misuse. |
| MIT Tech Review AI | industry_news | 2026-09-21 | 10 | A four-part border "virtual wall" package leads the feed, then a run of AI pieces (doomers, materials, agents). Not consistent junk. Latest: How we made the first comprehensive map of deaths along the US border’s “virtual wall”. |
| Platformer | industry_news | 2026-09-18 | 15 | Recent posts are AI regulation and the safety vibe shift. Latest: What was Hard Fork?. |
| Reuters AI (Google News) | industry_news | 2026-09-21 | 100 | Google News query for site:reuters.com AI is current (chip rally, Z.ai coding-assistant shutdown). Latest: Wall St rises on AI gains as oil slides, Treasury yields retreat - Reuters. |
| TechCrunch AI | industry_news | 2026-09-21 | 20 | AI category feed, current. Not the startups or robotics feeds. Latest: Meta’s AI agent has been blocked from using Amazon.com. |
| Techmeme | industry_news | 2026-09-21 | 15 | Current AI-heavy tech aggregation. Latest: OpenAI says automated research could improve alignment, but "fully autonomous RSI is not happening today" and shouldn't be pursued unless it can be done safely (OpenAI). |
| The Guardian AI | industry_news | 2026-09-21 | 20 | Mostly AI. One letters item ("freshly fried chip") leaked into the topic feed; not consistent junk. Latest: Stop relying on chatbots for customer care, UK service providers urged. |
| The Register AI/ML | industry_news | 2026-09-18 | 50 | Redirects to the Register API and stays on the AI/ML tag. Latest: KDE turns 30 and someone's brought an AI-native desktop proposal. |
| The Verge AI | industry_news | 2026-09-21 | 10 | Nine of ten recent items are AI. One is an Apple succession piece. Latest: Can John Ternus find Apple’s next big thing?. |
| TLDR AI | industry_news | 2026-09-21 | 20 | Daily AI links, current. Latest: Muse connectors 🤖, Meta SAM 3.1 🖼️, Gemini hacks companies 🔓. |
| Wired AI | industry_news | 2026-09-21 | 10 | AI policy, Muse, and the vulnerability story. One Googlebook laptop piece. Latest: Got an Android Phone? Google Thinks You’ll Probably Want a Googlebook Laptop. |
| WSJ Tech | industry_news | 2026-09-21 | 40 | Majority AI (safety standards, Gemini, election AI, Dario vs Jensen). A few general tech items. Latest: OpenAI Urges Washington to Lead Global Effort to Create AI-Safety Standards. |
| LM Studio Blog | local_models | 2026-09-18 | 65 | Current local-runtime posts. Latest: Splash Engine - the fastest local Qwen3.8 on Apple Silicon. |
| ModularML | local_models | 2026-09-17 | 100 | Compiler and runtime posts, current. Latest: Modular: Modular 26.6: Open compiler contributions, audio generation, and expanded model support. |
| PremAI Blog | local_models | 2026-09-18 | 15 | Local/inference blog, newest about 3 days. Latest: 5 Best AI Code Security Tools for Enterprise Teams to Secure Code and Detect Critical Vulnerabilities. |
| Puget Systems | local_models | 2026-09-18 | 10 | Workstation GPU tests for local models, mixed with After Effects and DaVinci benches. That mix is why it is in local models. Latest: Consultant’s Corner: The DNA of Storage. |
| vLLM Blog | local_models | 2026-09-21 | 50 | Current serving and training posts. Latest: PD Serving of Qwen3.8-2.4T. |
| Amp (Sourcegraph) | agents_tools | 2026-09-17 | 160 | Coding-agent changelog, current. Latest: One Runner Is Now Enough. |
| Cline Blog | agents_tools | 2026-09-14 | 15 | Coding-agent blog, current. Latest: Cline Desktop: An open-source app for open-weight models. |
| LangChain Blog | agents_tools | 2026-09-21 | 100 | Redirects to www.langchain.com/blog/rss.xml and is current. Latest: Jev is now available in LangSmith Evals. |
| Modal Blog | agents_tools | 2026-09-14 | 133 | Current AI-infra blog. Atom URL is the one that works. Latest: Product updates: Sandbox Sidecars, new models, a refreshed dashboard, and more. |
| FT Artificial Intelligence | ai_finance | 2026-09-21 | 25 | Mostly AI markets and policy. A Fed-inflation brief and a reader-questions box also appear. Latest: US data centres ‘are short six NYCs of electricity’. |
| Ahead of AI (Raschka) | research | 2026-09-09 | 20 | Current technical essays (newest about 12 days). Latest: GPT-6 Astra, Looped Transformers, and Hidden Reasoning. |
| Apple ML | research | 2026-09-18 | 10 | Machine-learning research feed, newest about 4 days. Latest: Dynamically Scaled Activation Steering. |
| arXiv cs.AI | research | 2026-09-21 | 214 | Live preprint firehose, newest today. Latest: RBS-Attention: Radius-Bounded Sparse Prefill for Long-Context Large Language Models. |
| arXiv cs.CL | research | 2026-09-21 | 138 | Live preprint firehose, newest today. Latest: Do small language models know what they don't know?. |
| arXiv cs.LG | research | 2026-09-21 | 237 | Live preprint firehose, newest today. Latest: Sparse Priors for Efficient Distribution Learning. |
| Deep Learning Weekly | research | 2026-09-18 | 20 | Weekly issues 471–473, current. Latest: Deep Learning Weekly: Issue 473. |
| Epoch AI | research | 2026-09-12 | 20 | Build failed; probe parsed, newest about 9 days. Substack blip, feed is current. Latest: The Epoch Brief - September 12, 2026. |
| HF Daily Papers | research | 2026-09-18 | 50 | Redirects to a dated Vercel blob and is current (2026-09-21 papers). Latest: Designer-RSI: Evolving Procedural Memory from User Traffic for Agentic Graphic Design. |
| IBM Research Blog | research | 2026-09-15 | 20 | Quantum systems and Granite/llm-d. On-topic for research, and quantum keywords route the quantum posts. Latest: From error mitigation to fault-tolerant quantum computing. |
| MarkTechPost | research | 2026-09-21 | 10 | Current AI writeups. Latest: Alibaba Qwen Releases Qwen-Image-2.1: A 7B Open-Weight Model for Image Generation and Editing. |
| Microsoft Research Blog | research | 2026-09-21 | 10 | Mix of foundation models, VLMs, and agents with some non-AI science. Majority is ML. Latest: Improving synthesis prediction of small molecules at scale with RetroChimera. |
| Nature Machine Intelligence | research | 2026-09-18 | 8 | Journal, and current anyway: newest 2026-09-18. The 90-day journal exception was not needed. Latest: Cybernetics, interoception, and the art of embodiment. |
| NVIDIA Research | research | 2026-09-16 | 10 | Current papers (human-to-robot transfer, inference). Latest: Human2Any: Human-to-Robot Transfer via Constraint-Aware Compositional Planning. |
| Sakana AI | research | 2026-09-17 | 10 | Lab feed, newest about 4 days. Latest: Introducing Sakana AI’s Frontier Intelligence Group (FIG). |
| TheSequence | research | 2026-09-20 | 20 | Build failed; probe parsed, newest about 1 day. Latest: The Sequence Radar - Issue 936: Last Week in AI: Gemini Talks, Astra Practices Law, Figure Folds Laundry, and Crusoe Powers It All. |
| AWS ML Blog | products | 2026-09-21 | 20 | Machine-learning blog, current. Latest: How BMW Group detects cost anomalies across 14,000 cloud accounts. |
| Cloudflare AI | products | 2026-09-21 | 20 | AI-tag feed, current. Latest: Python Workers are now generally available. |
| Cursor Changelog | products | 2026-09-10 | 50 | Product changelog, current. Latest: Cursor Projects. |
| GitHub Blog | products | 2026-09-18 | 10 | Recent posts are Copilot, MCP, RAG, and multi-model orchestration, plus one availability report. Latest: Should you read the code, is RAG dead, and did Skills kill MCP?. |
| GitHub Copilot Changelog | products | 2026-09-21 | 10 | Copilot label feed, current. Latest: Grok 4.7 is now available in GitHub Copilot. |
| OpenRouter Blog | products | 2026-09-21 | 130 | Model-routing blog, current. Latest: Two Hours of Work That Takes a Week. |
| Together AI Blog | products | 2026-09-18 | 100 | Inference platform blog, current. Latest: How a global fintech scaled coding agent traffic with Dedicated Model Inference. |
| Chips and Cheese | hardware | 2026-09-19 | 20 | CPU and GPU microarchitecture, current. Fits hardware. Latest: Qualcomm’s Adreno X2 GPU. |
| Chipstrat | hardware | 2026-09-17 | 20 | Semiconductor strategy, current. Latest: 🎙️The Race to Build the Next Trillion-Dollar AI Chip Company. |
| Data Center Dynamics | hardware | 2026-09-21 | 20 | Redirects to /en/rss/ and is mostly AI data-center power, cooling, and build-outs, with some telecom. Latest: Nokia ramps up AI-RAN momentum. |
| More Than Moore (Cutress) | hardware | 2026-09-16 | 20 | Build failed; probe parsed, newest about 5 days. Semiconductor blog is current. Latest: AI Infrastructure Summit Day 1. |
| NVIDIA Blog | hardware | 2026-09-21 | 18 | AI factories, inference, and physical AI, plus one GeForce NOW game post. Latest: NVIDIA Launches DSX Ready to Qualify Power and Cooling Products for AI Factories. |
| NVIDIA Dev Blog | hardware | 2026-09-21 | 100 | Inference, agents, and Earth-2. On-topic for hardware. Latest: Turn Your Latest Observations Into Timely Weather Decisions With NVIDIA Earth-2. |
| ServeTheHome | hardware | 2026-09-21 | 6 | Short server-hardware feed (optics, CXL, an Arm CPU lab). Fits the hardware section. Latest: Qotom Q30952UE Review the New Black Box for 10G Networking. |
| The Next Platform | hardware | 2026-09-20 | 83 | GenAI switching, supercomputers, custom accelerators, Nvidia. On-topic. Latest: The GenAI Boom Accelerates And Transforms Ethernet Switching. |
| Ai2 (Allen Institute) | open_source | 2026-09-17 | 25 | Open-model lab feed, current. Latest: What a crowdsourced game revealed about steering Olmo 3. |
| AI Alignment Forum | safety_policy | 2026-09-18 | 10 | Current alignment posts. Latest: [Paper] Stringological sequence prediction III. |
| AI Now Institute | safety_policy | 2026-09-18 | 10 | Policy research, newest about 3 days. Latest: Hugging Face Hack Shows Humans Can Keep AI In Check. |
| AI Policy Perspectives | safety_policy | 2026-09-15 | 20 | Current policy essays. Latest: The AI Discourse: A Guide. |
| AI Safety Newsletter (CAIS) | safety_policy | 2026-09-15 | 20 | Current safety newsletter (AISN #79–#81). Latest: AISN #81: Anthropic Researcher’s Resignation Propels AI Risk into the Public Eye. |
| CSET Georgetown | safety_policy | 2026-09-15 | 10 | Policy research, newest about 6 days. Latest: Inside Beijing’s Chipmaking Offensive, One Year On. |
| Don't Worry About the Vase (Zvi) | safety_policy | 2026-09-21 | 20 | Today's build failed this Substack fetch; the audit probe parsed it, newest 0.2 days. Transient, content is current. Latest: Monthly Roundup #46: September 2026. |
| GovAI | safety_policy | 2026-09-15 | 54 | Governance posts, newest about 6 days. Latest: DC Research Manager (Talent Development Team) \\| GovAI Blog. |
| NIST AI News | safety_policy | 2026-09-24 | 40 | Current. One item is dated slightly in the future (−2.8 days on the age clock). Not stale. Latest: NIST/NIBIB Symposium on Medical Metrology and Standards for American Healthcare and Commerce. |
| Redwood Research | safety_policy | 2026-09-11 | 20 | Safety blog, newest about 10 days. Latest: CoT controllability evals seem very under-elicited. |
| Transformer | safety_policy | 2026-09-18 | 20 | Current AI policy reporting. Latest: Trump’s AI stance is politically toxic. |
| UK AISI Blog | safety_policy | — | 12 | 12 on-topic cards (optimal stopping, an agent incident report, Kimi K3 cyber assessment). Listing HTML has no dates; undated items are treated as about 36 hours old. Today's build kept 10. Latest: Optimal stopping: spending evaluation compute where it counts. |
| Giskard | ai_security | 2026-09-04 | 100 | Knowledge feed is current and on AI assurance. Latest: Best 9 AI guardrails in 2026: how to choose, and how the tools compare. |
| GN: Prompt Injection | ai_security | 2026-09-21 | 100 | Google News query is staying on prompt injection and LLM security. Latest: AWS AgentCore prompt injection exposes credential risks - Cloud Computing News. |
| Gray Swan | ai_security | — | 12 | 12 on-topic AI-security cards and no listing dates. Same 36-hour fallback. Today's build kept 8. Latest: 7 Deadly Signs of AI Security Snake Oil: A Developer's Field Guide. |
| Knostic | ai_security | 2026-09-08 | 10 | AI-security blog, newest 8 Sep (13 days). On-topic and under 30 days. Latest: When “Auto-Signing” Sends Your Wallet: A Malicious MCP Server on npm. |
| OWASP GenAI Security | ai_security | 2026-09-02 | 10 | Current GenAI security posts. Latest: OWASP GenAI Security Project Unveils 2026 Top 10 for LLM Applications, New Agent Control Standard and Sponsors as Community Tops 30,000 Members. |
| tl;dr sec | ai_security | 2026-09-17 | 20 | Redirects to a Beehiiv feed. Recent issues cover AI security research and agent worms. Latest: [tl;dr sec] #346 - Can AI Do Novel Security Research?, Anthropic's Threat Intel Report, How Cloudflare Enforces Engineering Standards. |
| Trail of Bits | ai_security | 2026-09-21 | 20 | Current security engineering, including AI auditing posts. Latest: SAML: A fractal of bad design. |
| BleepingComputer | cyber_threats | 2026-09-21 | 15 | General security news, which is what Cyber Threats is for, including Codex sandbox escapes and AI-browser attacks. Latest: Microsoft to retire Microsoft 365 Companion apps in December. |
| Dark Reading | cyber_threats | 2026-12-03 | 50 | Current cyber news, including model-misalignment and AI-agent breach stories. One virtual-event item is dated 2026-12-03, which makes the raw "newest" look 73 days in the future; the news items are 21 Sep. Latest: [Virtual Event] Cybersecurity Outlook 2027. |
| Krebs on Security | cyber_threats | 2026-09-16 | 10 | Current investigations. Low volume this week (10 items in the feed) is normal for Krebs. Latest: Data Broker Radaris Loses Domains in Privacy Fight. |
| Schneier on Security | cyber_threats | 2026-09-21 | 10 | Security blog with the usual Friday squid post. AI and surveillance items are in the same set. Latest: Reverse-Engineering Flock Cameras. |
| The Hacker News | cyber_threats | 2026-09-21 | 50 | Current threat wire, including AI-agent RCE and a Claude account-takeover story. Latest: Fake LastPass Authenticator Installer Abuses Microsoft-Signed Driver to Kill Antivirus and EDR. |
| The Record | cyber_threats | 2026-09-21 | 5 | Current cyber reporting, including the Gemini breach. Five items in the feed is the wire's short window, not an empty source. Latest: Belgian table tennis, gymnastics federations hit by cyberattacks. |
| CrowdStrike Blog | cyber_defense | 2026-09-17 | 10 | Redirects to /en-us/blog/feed. Mix of product posts and real research (PhantomRaven, Patch Tuesday). Latest: CrowdStrike Named a Leader in The Forrester Wave™: External Threat Intelligence Service Providers, Q3 2026. |
| Google Project Zero | cyber_defense | 2026-09-21 | 10 | Current vulnerability research. Release cadence is the point of this feed. Latest: Windows Exploitation Techniques: Dangling COM Object Registrations. |
| Microsoft Security | cyber_defense | 2026-09-17 | 10 | Current, including AI-assisted impersonation. Latest: From guidance to action: Security fundamentals that materially reduce risk. |
| Palo Alto Unit 42 | cyber_defense | 2026-09-21 | 15 | Current threat research. Latest: From Exposure to Lockdown: How AWS Neutralizes Compromised IAM Credentials through Managed Policies. |
| Talos Intelligence | cyber_defense | 2026-09-17 | 15 | Current threat intel. Latest: Should you care about an “AI slowdown?”. |
| Crunchbase News AI | funding | 2026-09-18 | 10 | AI funding rounds and sector snapshots. Newest 18 Sep. Latest: The Week’s 10 Biggest Funding Rounds: Large Rounds For AI Infrastructure, Space Tech And Investment Management Lead. |
| Newcomer | funding | 2026-09-18 | 20 | VC coverage with AI build-out, agent startups, and Nvidia. Fits funding. Latest: War in the Middle East & Rising Interest Rates Threaten the Funding for AI Build-Out. |
| AI Snake Oil | analysis | 2026-09-14 | 20 | Current (normaltech.ai feed), on AI limits and agents. Latest: The AI-as-Normal-Technology view of loss-of-control incidents. |
| Air Street Press (Benaich) | analysis | 2026-09-20 | 20 | Current, including the State of AI launch. Latest: Join us for the State of AI Report 2026 launch meetups. |
| Ben's Bites | analysis | 2026-09-17 | 20 | Current product/AI notes. Latest: New home for Cowork. |
| Big Technology (Kantrowitz) | analysis | 2026-09-11 | 20 | Current tech/AI business. Latest: It’s Time to Bring Some Sanity to the AI Risk Conversation. |
| ChinAI (Jeffrey Ding) | analysis | 2026-09-21 | 20 | Build failed; probe parsed, newest 0.3 days. Latest: ChinAI #375: Critiquing Anthropic’s Variant of Pacing the Frontier. |
| Dwarkesh Podcast | analysis | 2026-09-17 | 20 | Current AI interviews. Latest: Noam Brown – Agent swarms, alignment, & recursive self-improvement. |
| Exponential View (Azhar) | analysis | 2026-09-21 | 20 | Current AI numbers and politics. Latest: 📈 Monday data: More AI numbers, more clarity?. |
| Gary Marcus | analysis | 2026-09-19 | 20 | Build failed; probe parsed, newest about 2 days. Latest: Top three ways Dario Amodei has blown his credibility in seven days. |
| Import AI (Jack Clark) | analysis | 2026-09-21 | 10 | Current. Latest: Import AI 473: The US’s superintelligence strategy; human brain in a mouse skull; and machine hermeneutics. |
| Interconnects (Lambert) | analysis | 2026-09-21 | 20 | Open-model analysis, current. Latest: The current balance of power in open models. |
| Latent Space | analysis | 2026-09-19 | 20 | Current, including the AINews digests. Latest: [AINews] Here are 6 Clones of Jev in 2 days. |
| One Useful Thing | analysis | 2026-09-18 | 20 | Current AI-use essays. Latest: The Overhang. |
| Simon Willison | analysis | 2026-09-20 | 30 | Current tools and model notes. Latest: Quoting voxium. |
| Stratechery | analysis | 2026-09-21 | 10 | Current strategy coverage; AI is the beat right now. Latest: Frontier Overhangs. |
| The Algorithmic Bridge | analysis | 2026-09-14 | 20 | Current AI commentary. Latest: The AI Industry Has Finally Discovered the Hardest Test: Politics. |
| Understanding AI (Timothy B. Lee) | analysis | 2026-09-17 | 20 | Current AI explainers. Latest: How a single tweet transformed the AI safety debate. |
| Where's Your Ed At (Zitron) | analysis | 2026-09-18 | 15 | Current AI-industry criticism. Latest: Premium: The Hater's Guide To AI Debt (Part 1). |
| Humanoids Daily | robotics | 2026-09-21 | 813 | High-volume humanoid feed, current. Latest: PrimeBOT Launches Personal Robots at 19,999 Yuan, Betting on Apps and Companionship. |
| IEEE Spectrum Robotics | robotics | 2026-09-18 | 30 | Current robotics, including Digit and robot safety. Latest: Video Friday: Two Birotors Make a Quadrotor. |
| New Atlas Robotics | robotics | 2026-09-09 | 60 | Current, broader than humanoids (bio-inspired robots included). Latest: Will a cyborg cockroach paramedic save your life in the future?. |
| The Robot Report | robotics | 2026-09-21 | 15 | Current humanoid and cobot coverage. Latest: Boston Dynamics opens Metaplant Application Center to train Atlas humanoids. |
| Waymo Blog | robotics | 2026-09-17 | 318 | Autonomy expansions (Singapore, Tokyo, Munich, US cities) plus an AI-lessons post. Fits robotics. Latest: Singapore, Next Stop: Bringing Scalable, Safe Autonomous Mobility to the Lion City. |
| MIT News Quantum | quantum | 2026-09-03 | 50 | Quantum topic feed, newest about 19 days. Under the 21-day quantum window. Latest: New qubit architecture enables faster, more accurate operations. |
| Quantum Computing Report | quantum | 2026-09-21 | 10 | Current. Latest: QNu Labs Launches QShield 2.0 to Drive India’s National Cryptographic Assessment & Assurance Framework. |
| Shtetl-Optimized (Aaronson) | quantum | 2026-09-19 | 10 | Current quantum/theory blog. Not every post is about qubits. Latest: Theory Beyond Theorems and Proofs: A Guest Post. |
| The Quantum Insider | quantum | 2026-09-21 | 10 | Current quantum industry news. Latest: IEEE-Presented Study Tests Quantum-to-Classical Handoff for Distributed Computing. |
| All-Hands-AI/OpenHands | github_repos | 2026-09-17 | 10 | Release atom, newest about 4 days. Latest: v1.20.0. |
| anthropics/claude-code | github_repos | 2026-09-19 | 10 | Release atom, newest about 3 days. Latest: v2.1.278. |
| BerriAI/litellm | github_repos | 2026-09-20 | 10 | Release atom, current. Latest: v1.103.0-rc.1. |
| comfyanonymous/ComfyUI | github_repos | 2026-09-21 | 10 | Release atom, current. Latest: v0.37.0. |
| crewAIInc/crewAI | github_repos | 2026-09-16 | 10 | Release atom, newest about 5 days. Latest: 1.15.22. |
| ggml-org/llama.cpp | github_repos | 2026-09-21 | 10 | Release atom is current. Latest: b11077. |
| ggml-org/whisper.cpp | github_repos | 2026-09-11 | 10 | Release atom, newest about 10 days. Latest: v1.9.4. |
| google-gemini/gemini-cli | github_repos | 2026-09-21 | 10 | Release atom, current. Latest: Release v0.62.0-nightly.20260921.gcfbcaa8df. |
| huggingface/transformers | github_repos | 2026-09-10 | 10 | Release atom, newest about 11 days. Normal release gap, under 90 days. Latest: Release 5.17.0. |
| langchain-ai/langchain | github_repos | 2026-09-21 | 10 | Release atom, current. Latest: langchain-core==1.6.4. |
| langchain-ai/langgraph | github_repos | 2026-09-21 | 10 | Release atom, current. Latest: langgraph==1.2.12. |
| lobehub/lobe-chat | github_repos | 2026-09-21 | 10 | Release atom, current. Latest: Desktop Canary v2.2.19-canary.4. |
| ollama/ollama | github_repos | 2026-09-19 | 10 | Release atom is current (about 2 days). Latest: v0.34.3. |
| open-webui/open-webui | github_repos | 2026-08-31 | 10 | Release atom, newest about 21 days. Quiet stretch, under 90 days, not a reason to drop the repo. Latest: v0.11.3. |
| openai/codex | github_repos | 2026-09-21 | 10 | Release atom, current. Latest: 0.157.0-alpha.1. |
| QwenLM/qwen-code | github_repos | 2026-09-21 | 10 | Release atom, current. Latest: Qwen Code Desktop v0.24.3. |
| run-llama/llama_index | github_repos | 2026-09-21 | 10 | Release atom, current. Latest: v0.14.25. |
| sgl-project/sglang | github_repos | 2026-09-18 | 10 | Release atom, current. Latest: v0.5.20. |
| Significant-Gravitas/AutoGPT | github_repos | 2026-09-21 | 10 | Release atom, current. Latest: Preview seed fixture (rolling). |
| stanfordnlp/dspy | github_repos | 2026-09-11 | 10 | Release atom, newest about 10 days. Latest: 3.4.0b1. |
| unslothai/unsloth | github_repos | 2026-09-19 | 10 | Release atom, current. Latest: Docker + Multi User + AMD Support. |
| vllm-project/vllm | github_repos | 2026-09-21 | 10 | Release atom, newest under 1 day. Latest: v0.30.0: [Build] Fix DeepGEMM CUDA 12.9 release builds (#57554). |

## Build failures that are not removals

These eleven `feedStats` entries were `ok: false` with count 0 in the 13:55 UTC build. Classification after the live probe:

| Source | This audit | Class |
| --- | --- | --- |
| Epoch AI | Parsed, newest ~9 days | KEEP |
| TheSequence | Parsed, newest ~1 day | KEEP |
| VentureBeat AI | Parsed on retry, newest 27 Aug; one HTTP 429 | WATCH |
| Don't Worry About the Vase (Zvi) | Parsed, newest same day | KEEP |
| Noma Security | HTTP 404 | SUGGEST-REMOVE |
| ChinAI (Jeffrey Ding) | Parsed, newest same day | KEEP |
| Gary Marcus | Parsed, newest ~2 days | KEEP |
| SentinelOne | HTTP 404 | SUGGEST-REMOVE |
| More Than Moore (Cutress) | Parsed, newest ~5 days | KEEP |
| LocalLLaMA Subreddit | Parsed once, then HTTP 429 | WATCH |
| Lemmy c/localllama | Parsed, newest ~1 day | WATCH |

Substack and Hacker News RSS blips that recovered on the probe stay KEEP. Reddit and Lemmy stay WATCH because the build and the probe disagreed.

## HTML scrapers

| Scraper | Class | What the page returned | What the regex kept |
| --- | --- | --- | --- |
| Anthropic News | WATCH | HTTP 200, 10 `/news/` links, time values through 18 Sep 2026, heading "Introducing Claude Fable 5.1 and Claude Mythos 5.1" | 1 card: "Improving our alignment and security efforts" (31 Aug, 22 days). Build count 1, and that item is outside the 5-day model window, so the homepage got nothing. |
| Anthropic Research | WATCH | HTTP 200, 9 `/research/` links, times through 17 Sep 2026 | 3 cards, newest 9 Sep (13 days). Build count 3. |
| UK AISI Blog | KEEP | HTTP 200, many `/blog/` links, on-topic titles, no `<time>` | 12 cards. Build count 10. |
| Gray Swan | KEEP | HTTP 200, 12 `/blog/` links, on-topic titles, no `<time>` | 12 cards. Build count 8. |

The Anthropic miss is a regex drift problem, not a reason to drop the lab. UK AISI and Gray Swan are fine aside from missing dates.

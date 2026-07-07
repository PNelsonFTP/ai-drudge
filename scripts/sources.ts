// Source feed list for ai-drudge.
//
// Every URL below was validated on 2026-07-06 (HTTP 200, parseable RSS/Atom,
// newest item within freshness window). Re-check any time with:
//   npm run validate:feeds
//
// TWO ROUTING MECHANISMS work together so each section is fresh + diverse:
//
//   1. Each feed has a "home category" — articles from it default there.
//   2. The KEYWORDS map (below) routes any article to ADDITIONAL categories
//      when its title or summary matches. An OpenAI press release that
//      TechCrunch also covers will appear under MODEL RELEASES for users
//      who want it from the source AND under INDUSTRY NEWS for users
//      who want the press take — both sorted by their own score.
//
// Articles are sorted by finalScore (priority + recency + importance + HN),
// dropped when they exceed their category's hard age window, and each
// category enforces a per-source diversity cap so no single source can
// dominate the top of a section.
//
// Feeds with NO working RSS as of 2026-07-06 (checked, do not re-add blindly):
//   Anthropic (scraped via scrape-sources.ts; claude-code releases.atom is the
//   feed proxy), xAI (Cloudflare-blocked), Cohere, Perplexity, Groq, Cerebras,
//   Nous Research, Runway, ElevenLabs, Midjourney, Stanford HAI, Epoch AI main
//   site (substack works), DeepLearning.AI The Batch, The Rundown, Every.to,
//   LMSYS, Unsloth blog (releases work), Jan.ai, Figure AI, 1X, Boston
//   Dynamics (feed exists but empty), IBM Quantum, The Information (403),
//   SemiAnalysis (all feeds stale since Sep 2025), LlamaIndex blog (Medium
//   feed abandoned), Google Research blog (blogspot feed stale since 2024).

export type CategoryId =
  | "model_releases"
  | "research"
  | "agents_tools"
  | "products"
  | "industry_news"
  | "safety_policy"
  | "ai_security"
  | "analysis"
  | "cyber_threats"
  | "cyber_defense"
  | "hardware"
  | "open_source"
  | "funding"
  | "robotics"
  | "quantum"
  | "github_repos"     // useful repos for extending AI/LLMs
  | "ai_finance"       // financial / market side of AI
  | "local_models";    // running models locally (hw, config, etc.)

export type Priority = "critical" | "high" | "medium" | "low";

export interface FeedSource {
  name: string;
  url: string;
  category: CategoryId;
  priority: Priority;
}

export const SOURCES: FeedSource[] = [
  // ---------- model_releases ----------
  { name: "OpenAI News", url: "https://openai.com/news/rss.xml", category: "model_releases", priority: "critical" },
  { name: "Google DeepMind Blog", url: "https://deepmind.google/blog/rss.xml", category: "model_releases", priority: "critical" },
  { name: "Mistral AI", url: "https://mistral.ai/rss.xml", category: "model_releases", priority: "critical" },
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml", category: "model_releases", priority: "high" },
  { name: "Meta AI Blog", url: "https://about.fb.com/feed/", category: "model_releases", priority: "high" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", category: "model_releases", priority: "high" },
  { name: "The Decoder", url: "https://the-decoder.com/feed/", category: "model_releases", priority: "high" },
  // DeepSeek / Qwen / Moonshot / Zhipu publish no first-party feeds; this
  // 150-point-filtered HN query reliably surfaces their releases.
  { name: "HN: Chinese Frontier Labs", url: "https://hnrss.org/newest?q=DeepSeek+OR+Qwen+OR+Kimi+OR+GLM&points=150", category: "model_releases", priority: "high" },
  { name: "Stability AI News", url: "https://stability.ai/news-updates?format=rss", category: "model_releases", priority: "low" },
  // Anthropic / xAI have no public RSS — Anthropic is covered via
  // scrape-sources.ts + anthropics/claude-code releases; both via press.

  // ---------- research ----------
  { name: "arXiv cs.AI", url: "https://rss.arxiv.org/rss/cs.AI", category: "research", priority: "high" },
  { name: "arXiv cs.LG", url: "https://rss.arxiv.org/rss/cs.LG", category: "research", priority: "high" },
  { name: "arXiv cs.CL", url: "https://rss.arxiv.org/rss/cs.CL", category: "research", priority: "high" },
  { name: "Transformer Circuits", url: "https://transformer-circuits.pub/feed.xml", category: "research", priority: "high" },
  { name: "MIT News AI", url: "https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml", category: "research", priority: "high" },
  { name: "Epoch AI", url: "https://epochai.substack.com/feed", category: "research", priority: "high" },
  { name: "Microsoft Research Blog", url: "https://www.microsoft.com/en-us/research/feed/", category: "research", priority: "medium" },
  { name: "IBM Research Blog", url: "https://research.ibm.com/rss", category: "research", priority: "medium" },
  { name: "BAIR Blog", url: "https://bair.berkeley.edu/blog/feed.xml", category: "research", priority: "medium" },
  { name: "ML@CMU", url: "https://blog.ml.cmu.edu/feed/", category: "research", priority: "medium" },
  { name: "Ahead of AI (Raschka)", url: "https://magazine.sebastianraschka.com/feed", category: "research", priority: "medium" },
  { name: "MarkTechPost", url: "https://www.marktechpost.com/feed/", category: "research", priority: "medium" },
  { name: "Apple ML", url: "https://machinelearning.apple.com/rss.xml", category: "research", priority: "medium" },
  { name: "Sakana AI", url: "https://sakana.ai/feed.xml", category: "research", priority: "medium" },
  { name: "Thinking Machines Lab", url: "https://thinkingmachines.ai/blog/index.xml", category: "research", priority: "medium" },
  { name: "Nature Machine Intelligence", url: "https://www.nature.com/natmachintell.rss", category: "research", priority: "low" },
  { name: "TheSequence", url: "https://thesequence.substack.com/feed", category: "research", priority: "low" },
  { name: "Lil'Log (Lilian Weng)", url: "https://lilianweng.github.io/index.xml", category: "research", priority: "low" },
  { name: "HF Daily Papers", url: "https://papers.takara.ai/api/feed", category: "research", priority: "low" },
  { name: "Deep Learning Weekly", url: "https://www.deeplearningweekly.com/feed", category: "research", priority: "low" },

  // ---------- agents_tools ----------
  { name: "LangChain Blog", url: "https://blog.langchain.com/rss.xml", category: "agents_tools", priority: "high" },
  { name: "Cline Blog", url: "https://cline.ghost.io/rss/", category: "agents_tools", priority: "medium" },
  { name: "Vercel Blog", url: "https://vercel.com/atom", category: "agents_tools", priority: "medium" },
  { name: "Amp (Sourcegraph)", url: "https://ampcode.com/news.rss", category: "agents_tools", priority: "low" },

  // ---------- products ----------
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", category: "products", priority: "high" },
  { name: "Cursor Changelog", url: "https://cursor.com/changelog/rss.xml", category: "products", priority: "high" },
  { name: "OpenRouter Blog", url: "https://openrouter.ai/blog/feed.xml", category: "products", priority: "high" },
  { name: "Together AI Blog", url: "https://www.together.ai/blog/rss.xml", category: "products", priority: "high" },
  { name: "GitHub Copilot Changelog", url: "https://github.blog/changelog/label/copilot/feed/", category: "products", priority: "medium" },
  { name: "GitHub Blog", url: "https://github.blog/feed/", category: "products", priority: "medium" },
  { name: "AWS ML Blog", url: "https://aws.amazon.com/blogs/machine-learning/feed/", category: "products", priority: "medium" },

  // ---------- industry_news ----------
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "industry_news", priority: "high" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", category: "industry_news", priority: "high" },
  { name: "Techmeme", url: "https://www.techmeme.com/feed.xml", category: "industry_news", priority: "high" },
  { name: "MIT Tech Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", category: "industry_news", priority: "high" },
  { name: "The Guardian AI", url: "https://www.theguardian.com/technology/artificialintelligenceai/rss", category: "industry_news", priority: "high" },
  { name: "The Register AI/ML", url: "https://www.theregister.com/software/ai_ml/headlines.atom", category: "industry_news", priority: "high" },
  { name: "AI News (smol.ai)", url: "https://news.smol.ai/rss.xml", category: "industry_news", priority: "high" },
  { name: "Ars Technica AI", url: "https://arstechnica.com/ai/feed/", category: "industry_news", priority: "medium" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "industry_news", priority: "medium" },
  { name: "Wired AI", url: "https://www.wired.com/feed/tag/ai/latest/rss", category: "industry_news", priority: "medium" },
  { name: "CNBC Tech", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", category: "industry_news", priority: "medium" },
  { name: "WSJ Tech", url: "https://feeds.content.dowjones.io/public/rss/RSSWSJD", category: "industry_news", priority: "medium" },
  { name: "ZDNet AI", url: "https://www.zdnet.com/topic/artificial-intelligence/rss.xml", category: "industry_news", priority: "medium" },
  { name: "IEEE Spectrum AI", url: "https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss", category: "industry_news", priority: "medium" },
  { name: "404 Media", url: "https://www.404media.co/rss/", category: "industry_news", priority: "medium" },
  { name: "Reuters AI (Google News)", url: "https://news.google.com/rss/search?q=site:reuters.com+AI", category: "industry_news", priority: "medium" },
  { name: "HN: AI (150+ points)", url: "https://hnrss.org/newest?q=AI&points=150", category: "industry_news", priority: "medium" },
  { name: "HN: LLM (100+ points)", url: "https://hnrss.org/newest?q=LLM&points=100", category: "industry_news", priority: "medium" },
  { name: "TLDR AI", url: "https://tldr.tech/api/rss/ai", category: "industry_news", priority: "medium" },
  { name: "Last Week in AI", url: "https://lastweekin.ai/feed", category: "industry_news", priority: "medium" },
  { name: "Bloomberg Tech", url: "https://feeds.bloomberg.com/technology/news.rss", category: "industry_news", priority: "medium" },

  // ---------- safety_policy ----------
  { name: "Don't Worry About the Vase (Zvi)", url: "https://thezvi.substack.com/feed", category: "safety_policy", priority: "high" },
  { name: "AI Safety Newsletter (CAIS)", url: "https://newsletter.safe.ai/feed", category: "safety_policy", priority: "high" },
  { name: "Transformer", url: "https://www.transformernews.ai/feed", category: "safety_policy", priority: "high" },
  { name: "METR", url: "https://metr.org/feed.xml", category: "safety_policy", priority: "high" },
  { name: "CSET Georgetown", url: "https://cset.georgetown.edu/feed/", category: "safety_policy", priority: "medium" },
  { name: "EU AI Act Newsletter", url: "https://artificialintelligenceact.eu/feed/", category: "safety_policy", priority: "medium" },
  { name: "Redwood Research", url: "https://blog.redwoodresearch.org/feed", category: "safety_policy", priority: "medium" },
  { name: "GovAI", url: "https://www.governance.ai/post/rss.xml", category: "safety_policy", priority: "low" },
  { name: "AI Policy Perspectives", url: "https://www.aipolicyperspectives.com/feed", category: "safety_policy", priority: "low" },
  { name: "LessWrong", url: "https://www.lesswrong.com/feed.xml", category: "safety_policy", priority: "low" },
  { name: "AI Alignment Forum", url: "https://www.alignmentforum.org/feed.xml", category: "safety_policy", priority: "low" },

  // ---------- ai_security ----------
  // Johann Rehberger — the canonical prompt-injection / agentic-AI exploit blog.
  { name: "Embrace The Red", url: "https://embracethered.com/blog/index.xml", category: "ai_security", priority: "critical" },
  { name: "tl;dr sec", url: "https://tldrsec.com/feed.xml", category: "ai_security", priority: "high" },
  { name: "Trail of Bits", url: "https://blog.trailofbits.com/feed/", category: "ai_security", priority: "high" },
  { name: "OWASP GenAI Security", url: "https://genai.owasp.org/feed/", category: "ai_security", priority: "medium" },
  { name: "Prompt Security", url: "https://www.prompt.security/blog/rss.xml", category: "ai_security", priority: "medium" },
  { name: "Straiker STAR", url: "https://www.straiker.ai/blog/rss.xml", category: "ai_security", priority: "medium" },
  { name: "Knostic", url: "https://www.knostic.ai/blog/rss.xml", category: "ai_security", priority: "medium" },
  { name: "JFrog Security Research", url: "https://jfrog.com/blog/category/security/feed/", category: "ai_security", priority: "medium" },
  { name: "Joseph Thacker (rez0)", url: "https://josephthacker.com/feed.xml", category: "ai_security", priority: "medium" },
  { name: "GN: Prompt Injection", url: "https://news.google.com/rss/search?q=%22prompt+injection%22+OR+%22LLM+security%22+OR+%22AI+model+vulnerability%22&hl=en-US&gl=US&ceid=US:en", category: "ai_security", priority: "medium" },
  { name: "Noma Security", url: "https://noma.security/feed/", category: "ai_security", priority: "low" },
  { name: "Giskard", url: "https://www.giskard.ai/knowledge/rss.xml", category: "ai_security", priority: "low" },
  { name: "AI Village", url: "https://aivillage.org/feed.xml", category: "ai_security", priority: "low" },

  // ---------- analysis ----------
  { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/", category: "analysis", priority: "high" },
  { name: "Import AI (Jack Clark)", url: "https://jack-clark.net/feed/", category: "analysis", priority: "high" },
  { name: "Interconnects (Lambert)", url: "https://www.interconnects.ai/feed", category: "analysis", priority: "high" },
  { name: "Understanding AI (Timothy B. Lee)", url: "https://www.understandingai.org/feed", category: "analysis", priority: "high" },
  { name: "AI Snake Oil", url: "https://www.normaltech.ai/feed", category: "analysis", priority: "high" },
  { name: "Stratechery", url: "https://stratechery.com/feed/", category: "analysis", priority: "medium" },
  { name: "Latent Space", url: "https://www.latent.space/feed", category: "analysis", priority: "medium" },
  { name: "ChinAI (Jeffrey Ding)", url: "https://chinai.substack.com/feed", category: "analysis", priority: "medium" },
  { name: "Big Technology (Kantrowitz)", url: "https://www.bigtechnology.com/feed", category: "analysis", priority: "medium" },
  { name: "Exponential View (Azhar)", url: "https://www.exponentialview.co/feed", category: "analysis", priority: "medium" },
  { name: "Ben's Bites", url: "https://www.bensbites.com/feed", category: "analysis", priority: "medium" },
  { name: "Dwarkesh Podcast", url: "https://www.dwarkesh.com/feed", category: "analysis", priority: "medium" },
  { name: "Air Street Press (Benaich)", url: "https://press.airstreet.com/feed", category: "analysis", priority: "medium" },
  { name: "One Useful Thing", url: "https://www.oneusefulthing.org/feed", category: "analysis", priority: "low" },
  { name: "The Algorithmic Bridge", url: "https://www.thealgorithmicbridge.com/feed", category: "analysis", priority: "low" },
  { name: "Gary Marcus", url: "https://garymarcus.substack.com/feed", category: "analysis", priority: "low" },
  { name: "Where's Your Ed At (Zitron)", url: "https://www.wheresyoured.at/rss/", category: "analysis", priority: "low" },

  // ---------- cyber_threats ----------
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/", category: "cyber_threats", priority: "high" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", category: "cyber_threats", priority: "high" },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews", category: "cyber_threats", priority: "high" },
  { name: "Dark Reading", url: "https://www.darkreading.com/rss.xml", category: "cyber_threats", priority: "medium" },
  { name: "The Record", url: "https://therecord.media/feed/", category: "cyber_threats", priority: "high" },
  { name: "Schneier on Security", url: "https://www.schneier.com/feed/", category: "cyber_threats", priority: "medium" },

  // ---------- cyber_defense ----------
  { name: "CrowdStrike Blog", url: "https://www.crowdstrike.com/blog/feed/", category: "cyber_defense", priority: "medium" },
  { name: "Palo Alto Unit 42", url: "https://unit42.paloaltonetworks.com/feed/", category: "cyber_defense", priority: "high" },
  { name: "Microsoft Security", url: "https://www.microsoft.com/en-us/security/blog/feed/", category: "cyber_defense", priority: "medium" },
  { name: "SentinelOne", url: "https://www.sentinelone.com/feed/", category: "cyber_defense", priority: "medium" },
  { name: "Google Project Zero", url: "https://projectzero.google/feed.xml", category: "cyber_defense", priority: "critical" },
  { name: "Talos Intelligence", url: "https://blog.talosintelligence.com/rss/", category: "cyber_defense", priority: "high" },

  // ---------- hardware ----------
  { name: "NVIDIA Blog", url: "https://blogs.nvidia.com/feed/", category: "hardware", priority: "high" },
  { name: "Chips and Cheese", url: "https://chipsandcheese.com/feed", category: "hardware", priority: "high" },
  { name: "NVIDIA Dev Blog", url: "https://developer.nvidia.com/blog/feed", category: "hardware", priority: "medium" },
  { name: "More Than Moore (Cutress)", url: "https://morethanmoore.substack.com/feed", category: "hardware", priority: "medium" },
  { name: "Fabricated Knowledge", url: "https://www.fabricatedknowledge.com/feed", category: "hardware", priority: "medium" },
  { name: "The Next Platform", url: "https://www.nextplatform.com/feed/", category: "hardware", priority: "medium" },
  { name: "ServeTheHome", url: "https://www.servethehome.com/feed/", category: "hardware", priority: "medium" },
  { name: "Tom's Hardware", url: "https://www.tomshardware.com/feeds/news", category: "hardware", priority: "medium" },
  { name: "Data Center Dynamics", url: "https://www.datacenterdynamics.com/rss/", category: "hardware", priority: "low" },
  { name: "Chipstrat", url: "https://www.chipstrat.com/feed.xml", category: "hardware", priority: "low" },

  // ---------- open_source ----------
  // Ai2 ships the fully-open Olmo/Molmo/Tulu family — the flagship open lab.
  { name: "Ai2 (Allen Institute)", url: "https://allenai.org/rss.xml", category: "open_source", priority: "high" },

  // ---------- funding ----------
  { name: "Crunchbase News AI", url: "https://news.crunchbase.com/sections/ai/feed/", category: "funding", priority: "high" },
  { name: "Newcomer", url: "https://www.newcomer.co/feed", category: "funding", priority: "medium" },
  { name: "TechCrunch Startups", url: "https://techcrunch.com/category/startups/feed/", category: "funding", priority: "medium" },

  // ---------- robotics ----------
  { name: "Humanoids Daily", url: "https://www.humanoidsdaily.com/feed.xml", category: "robotics", priority: "high" },
  { name: "The Robot Report", url: "https://www.therobotreport.com/feed/", category: "robotics", priority: "medium" },
  { name: "IEEE Spectrum Robotics", url: "https://spectrum.ieee.org/feeds/topic/robotics.rss", category: "robotics", priority: "medium" },
  { name: "New Atlas Robotics", url: "https://newatlas.com/robotics/index.rss", category: "robotics", priority: "medium" },
  { name: "Waymo Blog", url: "https://waymo.com/blog/rss.xml", category: "robotics", priority: "medium" },
  { name: "TechCrunch Robotics", url: "https://techcrunch.com/category/robotics/feed/", category: "robotics", priority: "low" },

  // ---------- quantum ----------
  { name: "Shtetl-Optimized (Aaronson)", url: "https://scottaaronson.blog/?feed=rss2", category: "quantum", priority: "medium" },
  { name: "The Quantum Insider", url: "https://thequantuminsider.com/feed/", category: "quantum", priority: "low" },
  { name: "Quantum Computing Report", url: "https://quantumcomputingreport.com/feed/", category: "quantum", priority: "low" },
  { name: "MIT News Quantum", url: "https://news.mit.edu/rss/topic/quantum-computing", category: "quantum", priority: "low" },

  // ---------- github_repos ----------
  // GitHub release feeds are official Atom feeds per repo — perfect for surfacing
  // useful AI tools as they ship. fetch-feeds.ts synthesizes display titles for
  // version-only release titles so they survive the noise filter.
  { name: "ollama/ollama", url: "https://github.com/ollama/ollama/releases.atom", category: "github_repos", priority: "critical" },
  { name: "ggml-org/llama.cpp", url: "https://github.com/ggml-org/llama.cpp/releases.atom", category: "github_repos", priority: "critical" },
  { name: "huggingface/transformers", url: "https://github.com/huggingface/transformers/releases.atom", category: "github_repos", priority: "critical" },
  { name: "anthropics/claude-code", url: "https://github.com/anthropics/claude-code/releases.atom", category: "github_repos", priority: "high" },
  { name: "vllm-project/vllm", url: "https://github.com/vllm-project/vllm/releases.atom", category: "github_repos", priority: "high" },
  { name: "langchain-ai/langchain", url: "https://github.com/langchain-ai/langchain/releases.atom", category: "github_repos", priority: "high" },
  { name: "run-llama/llama_index", url: "https://github.com/run-llama/llama_index/releases.atom", category: "github_repos", priority: "high" },
  { name: "continuedev/continue", url: "https://github.com/continuedev/continue/releases.atom", category: "github_repos", priority: "high" },
  { name: "open-webui/open-webui", url: "https://github.com/open-webui/open-webui/releases.atom", category: "github_repos", priority: "high" },
  { name: "openai/codex", url: "https://github.com/openai/codex/releases.atom", category: "github_repos", priority: "medium" },
  { name: "google-gemini/gemini-cli", url: "https://github.com/google-gemini/gemini-cli/releases.atom", category: "github_repos", priority: "medium" },
  { name: "QwenLM/qwen-code", url: "https://github.com/QwenLM/qwen-code/releases.atom", category: "github_repos", priority: "medium" },
  { name: "langchain-ai/langgraph", url: "https://github.com/langchain-ai/langgraph/releases.atom", category: "github_repos", priority: "medium" },
  { name: "BerriAI/litellm", url: "https://github.com/BerriAI/litellm/releases.atom", category: "github_repos", priority: "medium" },
  { name: "ggml-org/whisper.cpp", url: "https://github.com/ggml-org/whisper.cpp/releases.atom", category: "github_repos", priority: "medium" },
  { name: "comfyanonymous/ComfyUI", url: "https://github.com/comfyanonymous/ComfyUI/releases.atom", category: "github_repos", priority: "medium" },
  { name: "sgl-project/sglang", url: "https://github.com/sgl-project/sglang/releases.atom", category: "github_repos", priority: "medium" },
  { name: "unslothai/unsloth", url: "https://github.com/unslothai/unsloth/releases.atom", category: "github_repos", priority: "medium" },
  { name: "crewAIInc/crewAI", url: "https://github.com/crewAIInc/crewAI/releases.atom", category: "github_repos", priority: "medium" },
  { name: "All-Hands-AI/OpenHands", url: "https://github.com/All-Hands-AI/OpenHands/releases.atom", category: "github_repos", priority: "medium" },
  { name: "stanfordnlp/dspy", url: "https://github.com/stanfordnlp/dspy/releases.atom", category: "github_repos", priority: "medium" },
  { name: "lobehub/lobe-chat", url: "https://github.com/lobehub/lobe-chat/releases.atom", category: "github_repos", priority: "medium" },
  { name: "Significant-Gravitas/AutoGPT", url: "https://github.com/Significant-Gravitas/AutoGPT/releases.atom", category: "github_repos", priority: "low" },
  { name: "modelcontextprotocol spec", url: "https://github.com/modelcontextprotocol/modelcontextprotocol/releases.atom", category: "github_repos", priority: "low" },

  // ---------- ai_finance ----------
  { name: "FT Artificial Intelligence", url: "https://www.ft.com/artificial-intelligence?format=rss", category: "ai_finance", priority: "high" },
  { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss", category: "ai_finance", priority: "high" },
  // Owner-specific: AI regulatory/compliance signal for a broker-dealer CISO.
  { name: "GN: AI x SEC/FINRA", url: "https://news.google.com/rss/search?q=%22artificial+intelligence%22+(FINRA+OR+SEC+OR+broker-dealer)&hl=en-US&gl=US&ceid=US:en", category: "ai_finance", priority: "medium" },
  { name: "MarketWatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", category: "ai_finance", priority: "low" },

  // ---------- local_models ----------
  // Local-first, on-device, and self-hosted LLMs + hardware configs.
  { name: "Ollama Blog", url: "https://ollama.com/blog/rss.xml", category: "local_models", priority: "critical" },
  { name: "LM Studio Blog", url: "https://lmstudio.ai/rss.xml", category: "local_models", priority: "high" },
  { name: "vLLM Blog", url: "https://vllm.ai/blog/rss.xml", category: "local_models", priority: "high" },
  // Reddit rate-limits GitHub Actions IPs hard (403/429) — these two succeed
  // only intermittently. The Lemmy mirror is the datacenter-friendly backup.
  { name: "LocalLLaMA Subreddit", url: "https://www.reddit.com/r/LocalLLaMA.rss", category: "local_models", priority: "high" },
  { name: "r/LocalLLM", url: "https://www.reddit.com/r/LocalLLM.rss", category: "local_models", priority: "medium" },
  { name: "Lemmy c/localllama", url: "https://sh.itjust.works/feeds/c/localllama.xml?sort=New", category: "local_models", priority: "medium" },
  { name: "HN: local LLM", url: "https://hnrss.org/newest?q=%22local+LLM%22&points=20", category: "local_models", priority: "medium" },
  { name: "Puget Systems", url: "https://www.pugetsystems.com/blog/feed/", category: "local_models", priority: "medium" },
  { name: "ModularML", url: "https://www.modular.com/blog/rss.xml", category: "local_models", priority: "medium" },
  { name: "PremAI Blog", url: "https://www.premai.io/blog/rss/", category: "local_models", priority: "low" },
];

// ─────────────────────────────────────────────────────────────────────────
// PER-CATEGORY AGE WINDOWS
//
// Strictness = BALANCED. Tight windows for fast lanes (news/releases),
// longer windows for slow lanes (research/analysis). Starvation-aware fill
// (#4): items past softDays only appear to keep a section >= minItems, and
// never past hardDays. Retune here only — router.ts reads these constants.
// ─────────────────────────────────────────────────────────────────────────

export interface AgeWindow {
  softDays: number;   // preferred freshness; beyond this only fills to minItems
  hardDays: number;   // absolute cap — nothing older is ever shown
  minItems: number;   // backfill target so sparse sections aren't empty
}

export const AGE_WINDOWS: Record<CategoryId, AgeWindow> = {
  // FAST lanes
  model_releases: { softDays: 3, hardDays: 5, minItems: 4 },
  industry_news:  { softDays: 3, hardDays: 5, minItems: 4 },
  ai_finance:     { softDays: 3, hardDays: 5, minItems: 4 },
  products:       { softDays: 3, hardDays: 5, minItems: 4 },
  agents_tools:   { softDays: 3, hardDays: 5, minItems: 4 },
  local_models:   { softDays: 3, hardDays: 5, minItems: 4 },

  // MID lanes
  research:       { softDays: 7,  hardDays: 10, minItems: 3 },
  hardware:       { softDays: 7,  hardDays: 10, minItems: 3 },
  cyber_threats:  { softDays: 7,  hardDays: 10, minItems: 3 },
  cyber_defense:  { softDays: 7,  hardDays: 10, minItems: 3 },
  ai_security:    { softDays: 7,  hardDays: 10, minItems: 3 },
  open_source:    { softDays: 7,  hardDays: 10, minItems: 3 },
  funding:        { softDays: 7,  hardDays: 10, minItems: 3 },
  github_repos:   { softDays: 7,  hardDays: 10, minItems: 3 },

  // SLOW lanes
  analysis:       { softDays: 14, hardDays: 21, minItems: 3 },
  safety_policy:  { softDays: 14, hardDays: 21, minItems: 3 },
  robotics:       { softDays: 14, hardDays: 21, minItems: 3 },
  quantum:        { softDays: 14, hardDays: 21, minItems: 3 },
};

// ─────────────────────────────────────────────────────────────────────────
// KEYWORD ROUTER
//
// Articles whose title or summary matches these keywords are routed to the
// listed ADDITIONAL categories on top of their feed's home category.
//
// Multiple phrases can map to the same category; use lowercase. The matcher
// does word-boundary substring matching on the lowercased title+summary.
// ─────────────────────────────────────────────────────────────────────────

export const KEYWORDS: { match: string[]; routeTo: CategoryId }[] = [
  // Model releases — announcement keywords pull industry coverage into the
  // models section so users see the press reaction alongside the source.
  { match: ["gpt-", "claude ", "gemini ", "llama ", "mistral ", "qwen", "deepseek", "phi-", "mixtral", "command-r", "grok-", "kimi", "glm-", "gemma"], routeTo: "model_releases" },

  // Research
  { match: ["benchmark", "fine-tun", "rlhf", "rag ", "transformer", "diffusion model", "multimodal", "chain-of-thought", "interpretability"], routeTo: "research" },

  // Agents & tools
  { match: ["agent", "tool use", "function call", "langchain", "llamaindex", "autogen", "mcp ", "model context protocol", "claude code", "coding assistant", "copilot", "cursor "], routeTo: "agents_tools" },

  // Products
  { match: ["launches", "launching", "now available", "beta", "ga ", "pricing", "free tier"], routeTo: "products" },

  // Safety & policy
  { match: ["alignment", "ai safety", "red team", "executive order", "eu ai act", "regulation of ai", "responsible ai", "guardrail", "frontier model", "ai governance"], routeTo: "safety_policy" },

  // AI security
  { match: ["prompt injection", "jailbreak", "data exfiltration", "adversarial attack", "model stealing", "data poisoning", "llm security", "ai security", "model extraction", "shadow ai", "agentic security"], routeTo: "ai_security" },

  // Analysis
  { match: ["deep dive", "explainer: ", "essay: ", "why ai", "what is"], routeTo: "analysis" },

  // Cyber threats
  { match: ["ransomware", "malware", "breach", "vulnerability", "cve-", "0day", "zero-day", "exploit", "phishing"], routeTo: "cyber_threats" },

  // Cyber defense
  { match: ["patch", "mitigation", "incident response", "threat hunt", "edr", "xdr", "siem", "detection"], routeTo: "cyber_defense" },

  // Hardware
  { match: ["gpu", "h100", "h200", "b200", "gb200", "gb300", "blackwell", "rubin ", "tpu", " data center", "datacenter", "infiniband", "inference chip", "asic", "hbm"], routeTo: "hardware" },

  // Open source
  { match: ["open source", "open-source", "open weights", "open-weight", "apache 2.0", "mit license", "apache-2.0"], routeTo: "open_source" },

  // Funding
  { match: ["raises $", "raised $", "funding round", "series a", "series b", "series c", "valuation", " ipo", "acquired by", "acquires", "venture capital"], routeTo: "funding" },

  // Robotics
  { match: ["humanoid", "robot", "boston dynamics", "figure ", "tesla optimus", "embodied", "waymo", "self-driving"], routeTo: "robotics" },

  // Quantum
  { match: ["quantum", "qubit", "ibm quantum", "ionq", "quantinuum", "post-quantum", "pqc"], routeTo: "quantum" },

  // GitHub repos — match release posts and "new tool" announcements
  { match: ["github.com/", "release v", "star on github", "open source on github"], routeTo: "github_repos" },

  // AI finance — anything market/stock/deal related
  { match: ["stock", "earnings", "nasdaq", "s&p 500", "market cap", "ai etf", "ai bubble", "fed rate", "capex"], routeTo: "ai_finance" },

  // Local models
  { match: ["local llm", "local model", "on-device", "on device", "llama.cpp", "gguf", "ggml", "awq", "gptq", "exllama", "apple silicon", "consumer gpu", "vram", "quantiz", "mlx", "sglang", "lm studio", "self-hosted"], routeTo: "local_models" },
];

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  short: string;
}

// Order here = order on the homepage (top-to-bottom, left-to-right).
// GitHub Repos intentionally kept at the bottom — release-note titles
// format differently from news headlines and break the visual flow at the top.
export const CATEGORIES: CategoryMeta[] = [
  { id: "model_releases", label: "MODEL RELEASES", short: "MODELS" },
  { id: "industry_news",  label: "INDUSTRY NEWS",  short: "INDUSTRY" },
  { id: "local_models",   label: "LOCAL MODELS",   short: "LOCAL" },
  { id: "agents_tools",   label: "AGENTS & TOOLS", short: "TOOLS" },
  { id: "ai_finance",     label: "AI FINANCE",     short: "FINANCE" },
  { id: "research",       label: "RESEARCH",       short: "RESEARCH" },
  { id: "products",       label: "PRODUCTS",       short: "PRODUCTS" },
  { id: "hardware",       label: "HARDWARE",       short: "HARDWARE" },
  { id: "open_source",    label: "OPEN SOURCE",    short: "OPEN SRC" },
  { id: "safety_policy",  label: "SAFETY & POLICY",short: "SAFETY" },
  { id: "ai_security",    label: "AI SECURITY",    short: "AI SEC" },
  { id: "cyber_threats",  label: "CYBER THREATS",  short: "THREATS" },
  { id: "cyber_defense",  label: "CYBER DEFENSE",  short: "DEFENSE" },
  { id: "funding",        label: "FUNDING & DEALS",short: "FUNDING" },
  { id: "analysis",       label: "ANALYSIS",       short: "ANALYSIS" },
  { id: "robotics",       label: "ROBOTICS",       short: "ROBOTICS" },
  { id: "quantum",        label: "QUANTUM",        short: "QUANTUM" },
  { id: "github_repos",   label: "GITHUB REPOS",   short: "REPOS" },
];

// KEPT for backwards compatibility with fetch-feeds.ts pre-sort. The new
// scoring module (lib/score.ts) uses its own rebalanced PRIORITY_SCORE;
// this is only used for the initial global sort before routing.
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  critical: 100,
  high: 50,
  medium: 10,
  low: 1,
};

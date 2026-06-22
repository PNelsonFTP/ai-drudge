// Source feed list for ai-drudge.
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
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml", category: "model_releases", priority: "high" },
  { name: "Meta AI Blog", url: "https://about.fb.com/feed/", category: "model_releases", priority: "high" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", category: "model_releases", priority: "high" },
  { name: "The Decoder", url: "https://the-decoder.com/feed/", category: "model_releases", priority: "high" },
  // Anthropic / Mistral / xAI have no public RSS — covered via scrape-sources.ts
  // and via press-trade press (TechCrunch, The Verge, etc.) in industry_news.

  // ---------- research ----------
  { name: "arXiv cs.AI", url: "http://export.arxiv.org/rss/cs.AI", category: "research", priority: "high" },
  { name: "arXiv cs.LG", url: "http://export.arxiv.org/rss/cs.LG", category: "research", priority: "high" },
  { name: "arXiv cs.CL", url: "http://export.arxiv.org/rss/cs.CL", category: "research", priority: "high" },
  { name: "Google Research Blog", url: "https://blog.research.google/feeds/posts/default", category: "research", priority: "high" },
  { name: "Microsoft Research Blog", url: "https://www.microsoft.com/en-us/research/feed/", category: "research", priority: "medium" },
  { name: "BAIR Blog", url: "https://bair.berkeley.edu/blog/feed.xml", category: "research", priority: "medium" },
  { name: "ML@CMU", url: "https://blog.ml.cmu.edu/feed/", category: "research", priority: "medium" },
  { name: "Ahead of AI (Raschka)", url: "https://magazine.sebastianraschka.com/feed", category: "research", priority: "medium" },
  { name: "Sebastian Ruder", url: "https://newsletter.ruder.io/feed", category: "research", priority: "low" },
  { name: "MarkTechPost", url: "https://www.marktechpost.com/feed/", category: "research", priority: "medium" },
  { name: "Apple ML", url: "https://machinelearning.apple.com/rss.xml", category: "research", priority: "medium" },
  { name: "Deep Learning Weekly", url: "https://www.deeplearningweekly.com/feed", category: "research", priority: "low" },

  // ---------- agents_tools ----------
  { name: "LlamaIndex Blog", url: "https://medium.com/feed/llamaindex-blog", category: "agents_tools", priority: "high" },
  { name: "Vercel Blog", url: "https://vercel.com/atom", category: "agents_tools", priority: "medium" },
  { name: "LangChain Blog", url: "https://medium.com/feed/langchain-io", category: "agents_tools", priority: "medium" },
  { name: "OpenAI Cookbook", url: "https://github.com/openai/openai-cookbook/releases.atom", category: "agents_tools", priority: "medium" },
  { name: "AutoGPT", url: "https://github.com/Significant-Gravitas/AutoGPT/releases.atom", category: "agents_tools", priority: "low" },

  // ---------- products ----------
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", category: "products", priority: "high" },
  { name: "GitHub Blog", url: "https://github.blog/feed/", category: "products", priority: "medium" },
  { name: "AWS ML Blog", url: "https://aws.amazon.com/blogs/machine-learning/feed/", category: "products", priority: "medium" },

  // ---------- industry_news ----------
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "industry_news", priority: "high" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", category: "industry_news", priority: "high" },
  { name: "Ars Technica AI", url: "https://feeds.arstechnica.com/arstechnica/features", category: "industry_news", priority: "medium" },
  { name: "MIT Tech Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", category: "industry_news", priority: "high" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "industry_news", priority: "medium" },
  { name: "Wired AI", url: "https://www.wired.com/feed/tag/ai/latest/rss", category: "industry_news", priority: "medium" },
  { name: "CNBC Tech", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", category: "industry_news", priority: "medium" },
  { name: "AI News (smol.ai)", url: "https://buttondown.com/ainews/rss", category: "industry_news", priority: "high" },
  { name: "TLDR AI", url: "https://tldr.tech/api/rss/ai", category: "industry_news", priority: "medium" },
  { name: "Last Week in AI", url: "https://lastweekin.ai/feed", category: "industry_news", priority: "medium" },
  { name: "Bloomberg Tech", url: "https://feeds.bloomberg.com/technology/news.rss", category: "industry_news", priority: "medium" },

  // ---------- safety_policy ----------
  { name: "LessWrong", url: "https://www.lesswrong.com/feed.xml", category: "safety_policy", priority: "low" },
  { name: "AI Alignment Forum", url: "https://www.alignmentforum.org/feed.xml", category: "safety_policy", priority: "low" },

  // ---------- ai_security ----------
  { name: "Protect AI", url: "https://protectai.com/blog/rss.xml", category: "ai_security", priority: "medium" },
  { name: "AI Village", url: "https://aivillage.org/feed.xml", category: "ai_security", priority: "low" },

  // ---------- analysis ----------
  { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/", category: "analysis", priority: "high" },
  { name: "Stratechery", url: "https://stratechery.com/feed/", category: "analysis", priority: "medium" },
  { name: "One Useful Thing", url: "https://www.oneusefulthing.org/feed", category: "analysis", priority: "low" },
  { name: "The Algorithmic Bridge", url: "https://thealgorithmicbridge.substack.com/feed", category: "analysis", priority: "low" },
  { name: "Gary Marcus", url: "https://garymarcus.substack.com/feed", category: "analysis", priority: "low" },
  { name: "Import AI (Jack Clark)", url: "https://jack-clark.net/feed/", category: "analysis", priority: "high" },
  { name: "Interconnects (Lambert)", url: "https://www.interconnects.ai/feed", category: "analysis", priority: "high" },
  { name: "Latent Space", url: "https://www.latent.space/feed", category: "analysis", priority: "medium" },

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
  { name: "Google Project Zero", url: "https://googleprojectzero.blogspot.com/feeds/posts/default", category: "cyber_defense", priority: "critical" },
  { name: "Talos Intelligence", url: "https://blog.talosintelligence.com/rss/", category: "cyber_defense", priority: "high" },

  // ---------- hardware ----------
  { name: "NVIDIA Blog", url: "https://blogs.nvidia.com/feed/", category: "hardware", priority: "high" },
  { name: "NVIDIA Dev Blog", url: "https://developer.nvidia.com/blog/feed", category: "hardware", priority: "medium" },
  { name: "SemiAnalysis", url: "https://www.semianalysis.com/feed", category: "hardware", priority: "medium" },
  { name: "ServeTheHome", url: "https://www.servethehome.com/feed/", category: "hardware", priority: "medium" },
  { name: "Tom's Hardware", url: "https://www.tomshardware.com/feeds/news", category: "hardware", priority: "medium" },
  { name: "Chipstrat", url: "https://www.chipstrat.com/feed.xml", category: "hardware", priority: "low" },

  // ---------- open_source ----------
  { name: "EleutherAI", url: "https://blog.eleuther.ai/feed.xml", category: "open_source", priority: "medium" },

  // ---------- funding ----------
  { name: "TechCrunch Startups", url: "https://techcrunch.com/category/startups/feed/", category: "funding", priority: "medium" },

  // ---------- robotics ----------
  { name: "The Robot Report", url: "https://www.therobotreport.com/feed/", category: "robotics", priority: "medium" },
  { name: "IEEE Spectrum Robotics", url: "https://spectrum.ieee.org/feeds/topic/robotics.rss", category: "robotics", priority: "medium" },
  { name: "TechCrunch Robotics", url: "https://techcrunch.com/category/robotics/feed/", category: "robotics", priority: "low" },

  // ---------- quantum ----------
  { name: "The Quantum Insider", url: "https://thequantuminsider.com/feed/", category: "quantum", priority: "low" },
  { name: "Quantum Computing Report", url: "https://quantumcomputingreport.com/feed/", category: "quantum", priority: "low" },

  // ---------- github_repos ----------
  // GitHub release feeds are official Atom feeds per repo — perfect for surfacing
  // useful AI tools as they ship. fetch-feeds.ts synthesizes display titles for
  // version-only release titles so they survive the noise filter.
  { name: "langchain-ai/langchain", url: "https://github.com/langchain-ai/langchain/releases.atom", category: "github_repos", priority: "high" },
  { name: "run-llama/llama_index", url: "https://github.com/run-llama/llama_index/releases.atom", category: "github_repos", priority: "high" },
  { name: "vllm-project/vllm", url: "https://github.com/vllm-project/vllm/releases.atom", category: "github_repos", priority: "high" },
  { name: "ollama/ollama", url: "https://github.com/ollama/ollama/releases.atom", category: "github_repos", priority: "critical" },
  { name: "ggerganov/llama.cpp", url: "https://github.com/ggerganov/llama.cpp/releases.atom", category: "github_repos", priority: "critical" },
  { name: "openai/whisper", url: "https://github.com/openai/whisper/releases.atom", category: "github_repos", priority: "high" },
  { name: "microsoft/autogen", url: "https://github.com/microsoft/autogen/releases.atom", category: "github_repos", priority: "high" },
  { name: "crewAIInc/crewAI", url: "https://github.com/crewAIInc/crewAI/releases.atom", category: "github_repos", priority: "medium" },
  { name: "huggingface/transformers", url: "https://github.com/huggingface/transformers/releases.atom", category: "github_repos", priority: "critical" },
  { name: "All-Hands-AI/OpenHands", url: "https://github.com/All-Hands-AI/OpenHands/releases.atom", category: "github_repos", priority: "medium" },
  { name: "stanfordnlp/dspy", url: "https://github.com/stanfordnlp/dspy/releases.atom", category: "github_repos", priority: "medium" },
  { name: "binary-husky/gpt_academic", url: "https://github.com/binary-husky/gpt_academic/releases.atom", category: "github_repos", priority: "low" },
  { name: "Significant-Gravitas/AutoGPT", url: "https://github.com/Significant-Gravitas/AutoGPT/releases.atom", category: "github_repos", priority: "medium" },
  { name: "lobehub/lobe-chat", url: "https://github.com/lobehub/lobe-chat/releases.atom", category: "github_repos", priority: "medium" },
  { name: "continuedev/continue", url: "https://github.com/continuedev/continue/releases.atom", category: "github_repos", priority: "high" },
  { name: "open-webui/open-webui", url: "https://github.com/open-webui/open-webui/releases.atom", category: "github_repos", priority: "high" },

  // ---------- ai_finance ----------
  { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss", category: "ai_finance", priority: "high" },
  { name: "CNBC AI Stocks", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", category: "ai_finance", priority: "medium" },
  { name: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/", category: "ai_finance", priority: "low" },

  // ---------- local_models ----------
  // Local-first, on-device, and self-hosted LLMs + hardware configs.
  { name: "Ollama Blog", url: "https://ollama.com/blog/rss.xml", category: "local_models", priority: "critical" },
  { name: "LocalLLaMA Subreddit", url: "https://www.reddit.com/r/LocalLLaMA.rss", category: "local_models", priority: "high" },
  { name: "r/LocalLLM", url: "https://www.reddit.com/r/LocalLLM.rss", category: "local_models", priority: "medium" },
  { name: "Puget Systems", url: "https://www.pugetsystems.com/blog/feed/", category: "local_models", priority: "medium" },
  { name: "ModularML", url: "https://www.modular.com/blog/rss.xml", category: "local_models", priority: "medium" },
  { name: "PremAI Blog", url: "https://blog.premai.io/feed/", category: "local_models", priority: "low" },
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
  { match: ["gpt-", "claude ", "gemini ", "llama ", "mistral ", "qwen", "deepseek", "phi-", "mixtral", "command-r", "grok-"], routeTo: "model_releases" },

  // Research
  { match: ["benchmark", "fine-tun", "rlhf", "rag ", "transformer", "diffusion model", "multimodal", "chain-of-thought"], routeTo: "research" },

  // Agents & tools
  { match: ["agent", "tool use", "function call", "langchain", "llamaindex", "autogen", "mcp ", "model context protocol"], routeTo: "agents_tools" },

  // Products
  { match: ["launches", "launching", "now available", "beta", "ga ", "pricing", "free tier"], routeTo: "products" },

  // Safety & policy
  { match: ["alignment", "ai safety", "red team", "executive order", "eu ai act", "regulation of ai", "responsible ai", "guardrail"], routeTo: "safety_policy" },

  // AI security
  { match: ["prompt injection", "jailbreak", "data exfiltration", "adversarial attack", "model stealing", "data poisoning"], routeTo: "ai_security" },

  // Analysis
  { match: ["deep dive", "explainer: ", "essay: ", "why ai", "what is"], routeTo: "analysis" },

  // Cyber threats
  { match: ["ransomware", "malware", "breach", "vulnerability", "cve-", "0day", "zero-day", "exploit", "phishing"], routeTo: "cyber_threats" },

  // Cyber defense
  { match: ["patch", "mitigation", "incident response", "threat hunt", "edr", "xdr", "siem", "detection"], routeTo: "cyber_defense" },

  // Hardware
  { match: ["gpu", "h100", "h200", "b100", "b200", "gb200", "tpu", " data center", "datacenter", "infiniband", "inference chip", "asic", "tpu"], routeTo: "hardware" },

  // Open source
  { match: ["open source", "open-source", "apache 2.0", "mit license", "apache-2.0"], routeTo: "open_source" },

  // Funding
  { match: ["raises $", "raised $", "funding round", "series a", "series b", "series c", "valuation", " ipo", "acquired by", "acquires", "venture capital"], routeTo: "funding" },

  // Robotics
  { match: ["humanoid", "robot", "boston dynamics", "figure ", "tesla optimus", "embodied"], routeTo: "robotics" },

  // Quantum
  { match: ["quantum", "qubit", "ibm quantum", "ionq", "quantinuum", "post-quantum", "pqc"], routeTo: "quantum" },

  // GitHub repos — match release posts and "new tool" announcements
  { match: ["github.com/", "release v", "v1.", "v2.", "star on github", "open source on github"], routeTo: "github_repos" },

  // AI finance — anything market/stock/deal related
  { match: ["stock", "earnings", "nasdaq", "s&p 500", "market cap", "ai etf", "ai bubble", "fed rate"], routeTo: "ai_finance" },

  // Local models
  { match: ["local llm", "local model", "on-device", "on device", "llama.cpp", "gguf", "ggml", "awq", "gptq", "exllama", "apple silicon", "consumer gpu", "vram", "quantiz"], routeTo: "local_models" },
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

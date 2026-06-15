// Source feed list for ai-drudge.
//
// TWO ROUTING MECHANISMS work together so each section is fresh + diverse:
//
//   1. Each feed has a "home category" — articles from it default there.
//   2. The KEYWORDS map (below) routes any article to ADDITIONAL categories
//      when its title or summary matches. An OpenAI press release that
//      TechCrunch also covers will appear under MODEL RELEASES for users
//      who want it from the source AND under INDUSTRY NEWS for users who
//      want the press take — both sorted by their own priority+recency.
//
// Articles are then sorted by score (priority + recency + keyword boost),
// and each category enforces a per-source diversity cap so no single
// source can dominate the top of a section.

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
  | "agents_watch"
  | "funding"
  | "robotics"
  | "quantum"
  | "github_repos"     // NEW: useful repos for extending AI/LLMs
  | "ai_finance"       // NEW: financial / market side of AI
  | "local_models";    // NEW: running models locally (hw, config, etc.)

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
  { name: "Anthropic News", url: "https://www.anthropic.com/news/rss.xml", category: "model_releases", priority: "critical" },
  { name: "Meta AI Blog", url: "https://ai.meta.com/blog/rss/", category: "model_releases", priority: "high" },
  { name: "Mistral AI", url: "https://mistral.ai/feed.xml", category: "model_releases", priority: "high" },
  { name: "xAI", url: "https://x.ai/blog/rss.xml", category: "model_releases", priority: "high" },
  { name: "Cohere News", url: "https://cohere.com/blog/rss.xml", category: "model_releases", priority: "medium" },
  { name: "AI21 Labs", url: "https://www.ai21.com/blog/feed.xml", category: "model_releases", priority: "medium" },

  // ---------- research ----------
  { name: "arXiv cs.AI", url: "http://export.arxiv.org/rss/cs.AI", category: "research", priority: "high" },
  { name: "arXiv cs.LG", url: "http://export.arxiv.org/rss/cs.LG", category: "research", priority: "high" },
  { name: "arXiv cs.CL", url: "http://export.arxiv.org/rss/cs.CL", category: "research", priority: "high" },
  { name: "Google Research Blog", url: "https://blog.research.google/feeds/posts/default", category: "research", priority: "high" },
  { name: "Microsoft Research Blog", url: "https://www.microsoft.com/en-us/research/feed/", category: "research", priority: "medium" },
  { name: "BAIR Blog", url: "https://bair.berkeley.edu/blog/feed.xml", category: "research", priority: "medium" },
  { name: "ML@CMU", url: "https://blog.ml.cmu.edu/feed/", category: "research", priority: "medium" },
  { name: "Stanford HAI", url: "https://hai.stanford.edu/news/rss.xml", category: "research", priority: "medium" },
  { name: "Deep Learning Weekly", url: "https://www.deeplearningweekly.com/feed", category: "research", priority: "low" },

  // ---------- agents_tools ----------
  { name: "LlamaIndex Blog", url: "https://medium.com/feed/llamaindex-blog", category: "agents_tools", priority: "high" },
  { name: "Vercel Blog", url: "https://vercel.com/atom", category: "agents_tools", priority: "medium" },
  { name: "Cursor Changelog", url: "https://www.cursor.com/changelog.xml", category: "agents_tools", priority: "medium" },
  { name: "LangChain Blog", url: "https://blog.langchain.dev/rss/", category: "agents_tools", priority: "high" },
  { name: "OpenAI Cookbook", url: "https://github.com/openai/openai-cookbook/releases.atom", category: "agents_tools", priority: "medium" },
  { name: "AutoGPT", url: "https://github.com/Significant-Gravitas/AutoGPT/releases.atom", category: "agents_tools", priority: "low" },

  // ---------- products ----------
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", category: "products", priority: "high" },
  { name: "GitHub Blog", url: "https://github.blog/feed/", category: "products", priority: "medium" },
  { name: "GitHub Changelog", url: "https://github.blog/changelog_feed.xml", category: "products", priority: "low" },
  { name: "Anthropic Blog", url: "https://www.anthropic.com/blog/feed.xml", category: "products", priority: "high" },

  // ---------- industry_news ----------
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "industry_news", priority: "high" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", category: "industry_news", priority: "high" },
  { name: "Ars Technica AI", url: "https://feeds.arstechnica.com/arstechnica/features", category: "industry_news", priority: "medium" },
  { name: "MIT Tech Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", category: "industry_news", priority: "high" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "industry_news", priority: "medium" },
  { name: "Wired AI", url: "https://www.wired.com/feed/tag/ai/latest/rss", category: "industry_news", priority: "medium" },
  { name: "The Information AI", url: "https://www.theinformation.com/feed", category: "industry_news", priority: "medium" },
  { name: "Reuters Tech", url: "https://feeds.reuters.com/reuters/technologyNews", category: "industry_news", priority: "medium" },
  { name: "CNBC Tech", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", category: "industry_news", priority: "medium" },

  // ---------- safety_policy ----------
  { name: "Anthropic Research", url: "https://www.anthropic.com/research", category: "safety_policy", priority: "high" },
  { name: "LessWrong", url: "https://www.lesswrong.com/feed.xml", category: "safety_policy", priority: "low" },
  { name: "AI Alignment Forum", url: "https://www.alignmentforum.org/feed.xml", category: "safety_policy", priority: "low" },
  { name: "Center for AI Safety", url: "https://www.safe.ai/feed.xml", category: "safety_policy", priority: "medium" },

  // ---------- ai_security ----------
  { name: "Embrace The Red", url: "https://embracethered.com/feed/", category: "ai_security", priority: "high" },
  { name: "Protect AI", url: "https://protectai.com/blog/rss.xml", category: "ai_security", priority: "medium" },
  { name: "AI Village", url: "https://aivillage.org/feed.xml", category: "ai_security", priority: "low" },

  // ---------- analysis ----------
  { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/", category: "analysis", priority: "high" },
  { name: "Stratechery", url: "https://stratechery.com/feed/", category: "analysis", priority: "medium" },
  { name: "One Useful Thing", url: "https://www.oneusefulthing.org/feed", category: "analysis", priority: "low" },
  { name: "The Algorithmic Bridge", url: "https://thealgorithmicbridge.substack.com/feed", category: "analysis", priority: "low" },
  { name: "Gary Marcus", url: "https://garymarcus.substack.com/feed", category: "analysis", priority: "low" },

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
  { name: "Mandiant", url: "https://www.mandiant.com/resources/blog/rss.xml", category: "cyber_defense", priority: "high" },
  { name: "Microsoft Security", url: "https://www.microsoft.com/en-us/security/blog/feed/", category: "cyber_defense", priority: "medium" },
  { name: "SentinelOne", url: "https://www.sentinelone.com/feed/", category: "cyber_defense", priority: "medium" },
  { name: "Google Project Zero", url: "https://googleprojectzero.blogspot.com/feeds/posts/default", category: "cyber_defense", priority: "critical" },
  { name: "Talos Intelligence", url: "https://blog.talosintelligence.com/rss/", category: "cyber_defense", priority: "high" },

  // ---------- hardware ----------
  { name: "NVIDIA Blog", url: "https://blogs.nvidia.com/feed/", category: "hardware", priority: "high" },
  { name: "SemiAnalysis", url: "https://www.semianalysis.com/feed", category: "hardware", priority: "medium" },
  { name: "ServeTheHome", url: "https://www.servethehome.com/feed/", category: "hardware", priority: "medium" },
  { name: "Tom's Hardware", url: "https://www.tomshardware.com/rss", category: "hardware", priority: "medium" },
  { name: "AnandTech", url: "https://www.anandtech.com/rss/", category: "hardware", priority: "low" },
  { name: "Chipstrat", url: "https://www.chipstrat.com/feed.xml", category: "hardware", priority: "low" },

  // ---------- open_source ----------
  { name: "EleutherAI", url: "https://blog.eleuther.ai/feed.xml", category: "open_source", priority: "medium" },
  { name: "Stability AI", url: "https://stability.ai/news/feed.xml", category: "open_source", priority: "medium" },

  // ---------- agents_watch ----------
  { name: "Adept AI", url: "https://www.adept.ai/blog/rss.xml", category: "agents_watch", priority: "low" },
  { name: "Cognition AI", url: "https://cognition.ai/blog/feed.xml", category: "agents_watch", priority: "low" },

  // ---------- funding ----------
  { name: "TechCrunch Startups", url: "https://techcrunch.com/category/startups/feed/", category: "funding", priority: "medium" },

  // ---------- robotics ----------
  { name: "The Robot Report", url: "https://www.therobotreport.com/feed/", category: "robotics", priority: "medium" },
  { name: "IEEE Spectrum Robotics", url: "https://spectrum.ieee.org/feeds/topic/robotics.rss", category: "robotics", priority: "medium" },
  { name: "TechCrunch Robotics", url: "https://techcrunch.com/category/robotics/feed/", category: "robotics", priority: "low" },

  // ---------- quantum ----------
  { name: "The Quantum Insider", url: "https://thequantuminsider.com/feed/", category: "quantum", priority: "low" },
  { name: "Quantum Computing Report", url: "https://quantumcomputingreport.com/feed/", category: "quantum", priority: "low" },

  // ---------- github_repos (NEW) ----------
  // GitHub release feeds are official Atom feeds per repo — perfect for surfacing
  // useful AI tools as they ship.
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

  // ---------- ai_finance (NEW) ----------
  { name: "Bloomberg AI", url: "https://www.bloomberg.com/feed/artificial-intelligence.xml", category: "ai_finance", priority: "high" },
  { name: "CNBC AI Stocks", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", category: "ai_finance", priority: "medium" },
  { name: "Seeking Alpha AI", url: "https://seekingalpha.com/market-news/ai.xml", category: "ai_finance", priority: "medium" },
  { name: "Barron's AI", url: "https://www.barrons.com/feed/news/category/artificial-intelligence", category: "ai_finance", priority: "medium" },
  { name: "Investor's Business Daily AI", url: "https://www.investors.com/feed/", category: "ai_finance", priority: "medium" },
  { name: "Wall Street Journal AI", url: "https://feeds.content.dowjones.io/public/rss/RSSMarketsMain.xml", category: "ai_finance", priority: "medium" },
  { name: "MarketWatch AI", url: "https://feeds.marketwatch.com/marketwatch/topstories/", category: "ai_finance", priority: "low" },
  { name: "AI Stock Tracker", url: "https://aistocktracker.com/feed/", category: "ai_finance", priority: "low" },

  // ---------- local_models (NEW) ----------
  // Local-first, on-device, and self-hosted LLMs + hardware configs.
  { name: "Ollama Blog", url: "https://ollama.com/blog/rss.xml", category: "local_models", priority: "critical" },
  { name: "LM Studio Blog", url: "https://lmstudio.ai/blog/rss.xml", category: "local_models", priority: "high" },
  { name: "Jan Blog", url: "https://jan.ai/blog/rss.xml", category: "local_models", priority: "medium" },
  { name: "LocalLLaMA Subreddit", url: "https://www.reddit.com/r/LocalLLaMA.rss", category: "local_models", priority: "high" },
  { name: "r/LocalLLM", url: "https://www.reddit.com/r/LocalLLM.rss", category: "local_models", priority: "medium" },
  { name: "ServeTheHome GPU", url: "https://www.servethehome.com/category/gpu/feed/", category: "local_models", priority: "medium" },
  { name: "Puget Systems", url: "https://www.pugetsystems.com/blog/feed/", category: "local_models", priority: "medium" },
  { name: "Tom's Hardware GPUs", url: "https://www.tomshardware.com/pc-components/gpus/feed", category: "local_models", priority: "medium" },
  { name: "TinyML", url: "https://tinyml.org/feed/", category: "local_models", priority: "low" },
  { name: "ModularML", url: "https://www.modular.com/blog/rss.xml", category: "local_models", priority: "medium" },
  { name: "PremAI Blog", url: "https://blog.premai.io/feed/", category: "local_models", priority: "low" },
];

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
export const CATEGORIES: CategoryMeta[] = [
  { id: "model_releases", label: "MODEL RELEASES", short: "MODELS" },
  { id: "industry_news",  label: "INDUSTRY NEWS",  short: "INDUSTRY" },
  { id: "local_models",   label: "LOCAL MODELS",   short: "LOCAL" },     // NEW, high-interest
  { id: "github_repos",   label: "GITHUB REPOS",   short: "REPOS" },    // NEW
  { id: "agents_tools",   label: "AGENTS & TOOLS", short: "TOOLS" },
  { id: "ai_finance",     label: "AI FINANCE",     short: "FINANCE" },  // NEW
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
];

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  critical: 100,
  high: 50,
  medium: 10,
  low: 1,
};

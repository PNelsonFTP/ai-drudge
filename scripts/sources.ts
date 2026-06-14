// Source feed list for ai-drudge.
//
// Categories map onto the 16-section homepage layout:
//   model_releases, research, agents_tools, products, industry_news,
//   safety_policy, ai_security, analysis,           (8 AI sections)
//   cyber_threats, cyber_defense,                   (2 cybersec sections)
//   hardware, open_source, agents_watch, funding    (4 cross-cutting sections)
//
// Priority drives both sort order and visual emphasis (critical = red siren headline).
// Source names are displayed as badges next to each link.
//
// Add a feed: append to the right category. No other code needs to change.

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
  | "quantum";

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

  // ---------- research ----------
  { name: "arXiv cs.AI", url: "http://export.arxiv.org/rss/cs.AI", category: "research", priority: "high" },
  { name: "arXiv cs.LG", url: "http://export.arxiv.org/rss/cs.LG", category: "research", priority: "high" },
  { name: "arXiv cs.CL", url: "http://export.arxiv.org/rss/cs.CL", category: "research", priority: "high" },
  { name: "Google Research Blog", url: "https://blog.research.google/feeds/posts/default", category: "research", priority: "high" },
  { name: "Microsoft Research Blog", url: "https://www.microsoft.com/en-us/research/feed/", category: "research", priority: "medium" },
  { name: "BAIR Blog", url: "https://bair.berkeley.edu/blog/feed.xml", category: "research", priority: "medium" },
  { name: "ML@CMU", url: "https://blog.ml.cmu.edu/feed/", category: "research", priority: "medium" },

  // ---------- agents_tools ----------
  { name: "LlamaIndex Blog", url: "https://medium.com/feed/llamaindex-blog", category: "agents_tools", priority: "high" },
  { name: "Vercel Blog", url: "https://vercel.com/atom", category: "agents_tools", priority: "medium" },
  { name: "Cursor Changelog", url: "https://www.cursor.com/changelog.xml", category: "agents_tools", priority: "medium" },
  { name: "LangChain Blog", url: "https://blog.langchain.dev/rss/", category: "agents_tools", priority: "high" },

  // ---------- products ----------
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", category: "products", priority: "high" },
  { name: "GitHub Blog", url: "https://github.blog/feed/", category: "products", priority: "medium" },

  // ---------- industry_news ----------
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "industry_news", priority: "high" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", category: "industry_news", priority: "high" },
  { name: "Ars Technica AI", url: "https://feeds.arstechnica.com/arstechnica/features", category: "industry_news", priority: "medium" },
  { name: "MIT Tech Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", category: "industry_news", priority: "high" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "industry_news", priority: "medium" },
  { name: "Wired AI", url: "https://www.wired.com/feed/tag/ai/latest/rss", category: "industry_news", priority: "medium" },
  { name: "The Information AI", url: "https://www.theinformation.com/feed", category: "industry_news", priority: "medium" },

  // ---------- safety_policy ----------
  { name: "Anthropic Research", url: "https://www.anthropic.com/research", category: "safety_policy", priority: "high" },
  { name: "LessWrong", url: "https://www.lesswrong.com/feed.xml", category: "safety_policy", priority: "low" },
  { name: "AI Alignment Forum", url: "https://www.alignmentforum.org/feed.xml", category: "safety_policy", priority: "low" },

  // ---------- ai_security ----------
  { name: "Embrace The Red", url: "https://embracethered.com/feed/", category: "ai_security", priority: "high" },
  { name: "Protect AI", url: "https://protectai.com/blog/rss.xml", category: "ai_security", priority: "medium" },

  // ---------- analysis ----------
  { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/", category: "analysis", priority: "high" },
  { name: "Stratechery", url: "https://stratechery.com/feed/", category: "analysis", priority: "medium" },
  { name: "One Useful Thing", url: "https://www.oneusefulthing.org/feed", category: "analysis", priority: "low" },
  { name: "The Algorithmic Bridge", url: "https://thealgorithmicbridge.substack.com/feed", category: "analysis", priority: "low" },

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
  { name: "AMD Newsroom", url: "https://www.amd.com/en/newsroom/rss.html", category: "hardware", priority: "low" },
  { name: "SemiAnalysis", url: "https://www.semianalysis.com/feed", category: "hardware", priority: "medium" },

  // ---------- open_source ----------
  { name: "Hugging Face Daily Papers", url: "https://huggingface.co/papers/feed", category: "open_source", priority: "low" },
  { name: "EleutherAI", url: "https://www.eleuther.ai/feed.xml", category: "open_source", priority: "low" },

  // ---------- agents_watch ----------
  { name: "Adept AI", url: "https://www.adept.ai/blog/rss.xml", category: "agents_watch", priority: "low" },
  { name: "Cognition AI", url: "https://cognition.ai/blog/feed.xml", category: "agents_watch", priority: "low" },

  // ---------- funding ----------
  { name: "PitchBook News", url: "https://pitchbook.com/news/rss", category: "funding", priority: "low" },

  // ---------- robotics ----------
  { name: "The Robot Report", url: "https://www.therobotreport.com/feed/", category: "robotics", priority: "medium" },
  { name: "IEEE Spectrum Robotics", url: "https://spectrum.ieee.org/feeds/topic/robotics.rss", category: "robotics", priority: "medium" },
  { name: "TechCrunch Robotics", url: "https://techcrunch.com/category/robotics/feed/", category: "robotics", priority: "low" },
  { name: "Boston Dynamics", url: "https://www.bostondynamics.com/blog/feed", category: "robotics", priority: "medium" },

  // ---------- quantum ----------
  { name: "IBM Quantum Blog", url: "https://www.ibm.com/quantum/blog/feed.xml", category: "quantum", priority: "low" },
  { name: "The Quantum Insider", url: "https://thequantuminsider.com/feed/", category: "quantum", priority: "low" },
];

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  short: string;
}

// Order here = order on the homepage (top-to-bottom, left-to-right).
export const CATEGORIES: CategoryMeta[] = [
  { id: "model_releases", label: "MODEL RELEASES", short: "MODELS" },
  { id: "research", label: "RESEARCH", short: "RESEARCH" },
  { id: "agents_tools", label: "AGENTS & TOOLS", short: "TOOLS" },
  { id: "products", label: "PRODUCTS", short: "PRODUCTS" },
  { id: "industry_news", label: "INDUSTRY NEWS", short: "INDUSTRY" },
  { id: "safety_policy", label: "SAFETY & POLICY", short: "SAFETY" },
  { id: "ai_security", label: "AI SECURITY", short: "AI SEC" },
  { id: "analysis", label: "ANALYSIS", short: "ANALYSIS" },
  { id: "cyber_threats", label: "CYBER THREATS", short: "THREATS" },
  { id: "cyber_defense", label: "CYBER DEFENSE", short: "DEFENSE" },
  { id: "hardware", label: "HARDWARE", short: "HARDWARE" },
  { id: "open_source", label: "OPEN SOURCE", short: "OPEN SRC" },
  { id: "agents_watch", label: "AGENTS WATCH", short: "AGENTS" },
  { id: "funding", label: "FUNDING & MARKETS", short: "FUNDING" },
  { id: "robotics", label: "ROBOTICS", short: "ROBOTICS" },
  { id: "quantum", label: "QUANTUM", short: "QUANTUM" },
];

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  critical: 100,
  high: 50,
  medium: 10,
  low: 1,
};

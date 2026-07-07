// AI Daily Brief generator.
//
// If ANTHROPIC_API_KEY is set, calls Claude with a strict anti-hallucination
// system prompt: the model may ONLY summarize titles/summaries it is given.
//
// If no key is present, or the call fails, falls back to a CURATED brief
// built from:
//   1. The top trending story (most distinct sources covering it)
//   2. The lead story of the most important category present
//   3. One item each from up to 3 distinct categories not yet represented
// This produces a brief that feels editorially picked, not just "the 3 most
// recent posts from the loudest source".

import type { Article, Brief, CategoryBucket, TrendingStory } from "./types";
import { PRIORITY_WEIGHT } from "./sources";

export interface BriefContext {
  trending: TrendingStory[];
  categories: CategoryBucket[];
}

function pickTop(articles: Article[], n: number): Article[] {
  return [...articles]
    .sort((a, b) => {
      const p = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (p !== 0) return p;
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, n);
}

// Curated fallback: trending + lead + cross-category sampling.
function fallback(articles: Article[], ctx: BriefContext | undefined): Brief {
  const cited: { title: string; url: string; source: string }[] = [];
  const seenUrls = new Set<string>();

  const add = (a: Article | TrendingStory["lead"]) => {
    if (seenUrls.has(a.url)) return;
    seenUrls.add(a.url);
    cited.push({ title: a.title, url: a.url, source: a.source });
  };

  // 1. Top trending story (if any) — multi-source coverage is the strongest
  // signal of "this is actually important today".
  if (ctx?.trending && ctx.trending.length > 0) {
    add(ctx.trending[0].lead);
  }

  // 2. Lead from the highest-priority category that's present.
  const leadCatOrder = ["model_releases", "industry_news", "ai_security", "cyber_threats", "research"];
  if (ctx?.categories) {
    for (const id of leadCatOrder) {
      const cat = ctx.categories.find((c) => c.id === id);
      if (cat && cat.articles.length > 0) {
        add(cat.articles[0]);
        break;
      }
    }
  }

  // 3. Sample one item from up to 3 distinct categories not yet represented,
  // preferring variety over yet-another-model-release.
  if (ctx?.categories) {
    const varietyOrder = [
      "ai_security", "cyber_threats", "local_models", "funding",
      "safety_policy", "agents_tools", "hardware", "ai_finance",
      "research", "products",
    ];
    let added = 0;
    for (const id of varietyOrder) {
      if (added >= 3) break;
      const cat = ctx.categories.find((c) => c.id === id);
      if (cat && cat.articles.length > 0) {
        const before = cited.length;
        add(cat.articles[0]);
        if (cited.length > before) added++;
      }
    }
  }

  // 4. If we still have nothing (no ctx or empty), fall back to plain top-3.
  if (cited.length === 0) {
    for (const a of pickTop(articles, 3)) add(a);
  }

  // Synthesize a headline from the top cited item.
  const headline = cited.length > 0
    ? `Today's top AI story: ${cited[0].title}`
    : "No headlines available";

  // Bullets = one per cited item, terse.
  const bullets = cited.map((c) => c.title);

  return {
    generatedAt: new Date().toISOString(),
    source: "fallback",
    headline,
    bullets,
    citedArticles: cited.slice(0, 6),
  };
}

const SYSTEM_PROMPT = `You are the editor of AI DRUDGE, an aggregator of machine-intelligence news.
You will receive a JSON list of today's AI headlines (title, source, category, summary)
PLUS a list of trending stories (those covered by multiple outlets).

Your job: produce a 4-6 bullet "daily brief" that synthesizes the most important themes.

HARD RULES (violation = failure):
- ONLY reference articles present in the input. Do not invent stories.
- Do NOT invent model names, version numbers, dates, statistics, or quotes that are not in the input.
- If the input mentions a model/story, you may name it. Otherwise do not.
- Each bullet must be one sentence, ~15-25 words.
- Be neutral and factual. No hype words like "revolutionary", "game-changing", "stunning".
- Prioritize themes covered by MULTIPLE sources (the trending list). One-source
  stories are fine to include but should not dominate the brief.
- Cover DIVERSE topics — do not make every bullet about model releases.

Respond as strict JSON: {"headline": str, "bullets": str[], "cited": [{"title","url","source"}]}
The "cited" array must contain 4-6 of the actual input articles that the brief references.`;

interface ClaudeResponse {
  content: { type: "text"; text: string }[];
}

export async function generateBrief(
  articles: Article[],
  ctx?: BriefContext
): Promise<Brief> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || articles.length === 0) {
    return fallback(articles, ctx);
  }

  const top = pickTop(articles, 60);
  const input = top.map((a) => ({
    title: a.title,
    source: a.source,
    category: a.category,
    summary: a.summary,
    url: a.url,
  }));
  const trendingInput = (ctx?.trending ?? []).map((t) => ({
    title: t.lead.title,
    sources: t.sources,
    sourceCount: t.sourceCount,
  }));

  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 30000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        // Sonnet 5: cheapest current-gen tier for an hourly summarization job.
        // Note: non-default temperature/top_p are rejected (400) on Sonnet 5,
        // and thinking is adaptive-on by default — disabled here to keep the
        // hourly brief fast and cheap.
        model: "claude-sonnet-5",
        max_tokens: 1024,
        thinking: { type: "disabled" },
        output_config: { effort: "low" },
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Today's headlines:\n\n${JSON.stringify(input, null, 2)}\n\nTrending (multi-source coverage):\n${JSON.stringify(trendingInput, null, 2)}`,
          },
        ],
      }),
      signal: ctl.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      console.warn(`  Claude brief: HTTP ${res.status}, using fallback`);
      return fallback(articles, ctx);
    }

    const json = (await res.json()) as ClaudeResponse;
    const text = json.content?.find((b) => b.type === "text")?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn("  Claude brief: no JSON in response, using fallback");
      return fallback(articles, ctx);
    }
    const parsed = JSON.parse(match[0]) as {
      headline: string;
      bullets: string[];
      cited: { title: string; url: string; source: string }[];
    };

    // Validate cited URLs are actually in our input (anti-hallucination guard).
    const validUrls = new Set(input.map((a) => a.url));
    const cited = (parsed.cited || []).filter((c) => validUrls.has(c.url));

    return {
      generatedAt: new Date().toISOString(),
      source: "claude",
      headline: parsed.headline ?? "AI Daily Brief",
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 6) : [],
      citedArticles: cited,
    };
  } catch (e) {
    console.warn(`  Claude brief failed: ${e instanceof Error ? e.message : "unknown"}, using fallback`);
    return fallback(articles, ctx);
  }
}

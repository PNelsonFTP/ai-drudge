// AI Daily Brief generator.
//
// If ANTHROPIC_API_KEY is set, calls Claude (claude-sonnet-4-5-20250929,
// temperature 0.3) with a strict anti-hallucination system prompt: the model
// may ONLY summarize titles/summaries it is given; it is forbidden from
// inventing model names, story details, dates, or numbers.
//
// If no key is present, or the call fails, falls back to picking the top 3
// headlines by priority/recency as the "brief". The site works either way.

import type { Article, Brief } from "./types";
import { PRIORITY_WEIGHT } from "./sources";

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

function fallback(articles: Article[]): Brief {
  const top = pickTop(articles, 3);
  return {
    generatedAt: new Date().toISOString(),
    source: "fallback",
    headline: top.length ? "Top AI headlines right now" : "No headlines available",
    bullets: top.map((a) => a.title),
    citedArticles: top.map((a) => ({ title: a.title, url: a.url, source: a.source })),
  };
}

const SYSTEM_PROMPT = `You are the editor of AI DRUDGE, an aggregator of machine-intelligence news.
You will receive a JSON list of today's AI headlines (title, source, category, summary).

Your job: produce a 4-6 bullet "daily brief" that synthesizes the most important themes.

HARD RULES (violation = failure):
- ONLY reference articles present in the input. Do not invent stories.
- Do NOT invent model names, version numbers, dates, statistics, or quotes that are not in the input.
- If the input mentions a model/story, you may name it. Otherwise do not.
- Each bullet must be one sentence, ~15-25 words.
- Be neutral and factual. No hype words like "revolutionary", "game-changing", "stunning".
- Bullets should reflect the BIGGEST themes (multiple sources covering the same story = bigger theme).

Respond as strict JSON: {"headline": str, "bullets": str[], "cited": [{"title","url","source"}]}
The "cited" array must contain 3-6 of the actual input articles that the brief references.`;

interface ClaudeResponse {
  content: { type: "text"; text: string }[];
}

export async function generateBrief(articles: Article[]): Promise<Brief> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || articles.length === 0) {
    return fallback(articles);
  }

  const top = pickTop(articles, 60);
  const input = top.map((a) => ({
    title: a.title,
    source: a.source,
    category: a.category,
    summary: a.summary,
    url: a.url,
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
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Today's headlines:\n\n${JSON.stringify(input, null, 2)}`,
          },
        ],
      }),
      signal: ctl.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      console.warn(`  Claude brief: HTTP ${res.status}, using fallback`);
      return fallback(articles);
    }

    const json = (await res.json()) as ClaudeResponse;
    const text = json.content?.[0]?.text ?? "";
    // Pull the JSON object out of the response (it may have surrounding prose).
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn("  Claude brief: no JSON in response, using fallback");
      return fallback(articles);
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
    return fallback(articles);
  }
}

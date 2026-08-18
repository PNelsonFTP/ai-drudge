import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAggregatorSource, pickTrendingLead } from "./router";
import type { GroupedArticle } from "../types";

function article(partial: Partial<GroupedArticle> & Pick<GroupedArticle, "title" | "url" | "source">): GroupedArticle {
  return {
    id: partial.id ?? partial.url,
    category: "industry_news",
    priority: "high",
    publishedAt: "2026-08-18T12:00:00.000Z",
    publishedRaw: null,
    summary: null,
    collectedAt: "2026-08-18T12:00:00.000Z",
    related: [],
    ...partial,
  };
}

describe("trending lead quality", () => {
  it("treats HN/GN/Reddit titles as aggregators", () => {
    assert.equal(isAggregatorSource("HN: AI (150+ points)"), true);
    assert.equal(isAggregatorSource("GN: Prompt Injection"), true);
    assert.equal(isAggregatorSource("Reuters AI (Google News)"), true);
    assert.equal(isAggregatorSource("TechCrunch AI"), false);
  });

  it("prefers a press headline within 10% of the top aggregator score", () => {
    const hn = article({ title: "tencent/Hy3", url: "https://news.ycombinator.com/item?id=1", source: "HN: AI (150+ points)" });
    const press = article({
      title: "Tencent releases Hy3, a 295B open model",
      url: "https://simonwillison.net/2026/Jul/6/hy3/",
      source: "Simon Willison",
    });
    const lead = pickTrendingLead([
      { article: hn, score: 100 },
      { article: press, score: 92 },
    ]);
    assert.equal(lead.source, "Simon Willison");
    assert.equal(lead.related.some((r) => r.source.startsWith("HN:")), true);
  });

  it("keeps the aggregator when no press alternative is close", () => {
    const hn = article({ title: "only on HN", url: "https://news.ycombinator.com/item?id=2", source: "HN: AI (150+ points)" });
    const old = article({ title: "unrelated press", url: "https://example.com/old", source: "TechCrunch AI" });
    const lead = pickTrendingLead([
      { article: hn, score: 100 },
      { article: old, score: 50 },
    ]);
    assert.equal(lead.source, "HN: AI (150+ points)");
  });
});

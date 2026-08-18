import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isGoogleNewsUrl,
  isHnDiscussionUrl,
  normalizeArticleUrl,
  stripGoogleNewsTitle,
  unwrapSync,
  urlFromHnDescription,
  urlFromQueryParam,
} from "./unwrapUrl";

describe("unwrapUrl", () => {
  it("detects Google News and HN discussion URLs", () => {
    assert.equal(isGoogleNewsUrl("https://news.google.com/rss/articles/CBMiabc"), true);
    assert.equal(isGoogleNewsUrl("https://www.reuters.com/world/x"), false);
    assert.equal(isHnDiscussionUrl("https://news.ycombinator.com/item?id=123"), true);
    assert.equal(isHnDiscussionUrl("https://example.com/item?id=123"), false);
  });

  it("takes a url query param off a wrapper", () => {
    const wrapped =
      "https://news.google.com/rss/search?q=AI&url=https://www.reuters.com/world/ai-story";
    assert.equal(urlFromQueryParam(wrapped), "https://www.reuters.com/world/ai-story");
    assert.equal(unwrapSync(wrapped), "https://www.reuters.com/world/ai-story");
  });

  it("extracts Article URL from an hnrss description", () => {
    const desc =
      '<p>Article URL: <a href="https://openai.com/blog/gpt">https://openai.com/blog/gpt</a></p><p>Comments URL: <a href="https://news.ycombinator.com/item?id=1">1</a></p>';
    assert.equal(urlFromHnDescription(desc), "https://openai.com/blog/gpt");
    assert.equal(
      unwrapSync("https://news.ycombinator.com/item?id=1", { description: desc }),
      "https://openai.com/blog/gpt",
    );
  });

  it("strips Google News publisher suffixes only", () => {
    assert.equal(
      stripGoogleNewsTitle("OpenAI unveils ChatGPT for teens - Reuters", "Reuters"),
      "OpenAI unveils ChatGPT for teens",
    );
    assert.equal(
      stripGoogleNewsTitle("GPT-5 - what we know", "Reuters"),
      "GPT-5 - what we know",
    );
  });

  it("drops tracking params", () => {
    assert.equal(
      normalizeArticleUrl("https://www.reuters.com/world/x/?utm_source=gn&oc=5#frag"),
      "https://www.reuters.com/world/x",
    );
  });
});

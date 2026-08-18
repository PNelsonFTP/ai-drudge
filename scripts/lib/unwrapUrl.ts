// Unwrap aggregator wrapper URLs so URL-based dedup can match the same
// story fetched from the publisher's own feed.
//
// hnrss.org: <link> is usually the article; if it points at HN instead,
// the real URL is in the description ("Article URL: …").
// Google News: post-2024 feeds use news.google.com/rss/articles/CBMi…
// redirects. We take a `url` query param when present, otherwise resolve
// via Google's batchexecute RPC (bounded + cached at the call site).

const HN_HOSTS = new Set(["news.ycombinator.com", "hnrss.org", "www.hnrss.org"]);

export function isGoogleNewsUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "news.google.com";
  } catch {
    return false;
  }
}

export function isHnDiscussionUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return HN_HOSTS.has(u.hostname.replace(/^www\./, "")) && u.pathname.includes("/item");
  } catch {
    return false;
  }
}

export function normalizeArticleUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|oc$|smid$|sref$|srsltid$)/i.test(key)) u.searchParams.delete(key);
    }
    const path = u.pathname.replace(/\/$/, "") || "/";
    const search = u.searchParams.toString();
    return `${u.protocol}//${u.host}${path}${search ? `?${search}` : ""}`;
  } catch {
    return raw;
  }
}

export function urlFromQueryParam(raw: string): string | null {
  try {
    const q = new URL(raw).searchParams.get("url");
    if (q && /^https?:\/\//i.test(q) && !isGoogleNewsUrl(q)) return q;
  } catch {
    /* ignore */
  }
  return null;
}

export function urlFromHnDescription(description: string | null | undefined): string | null {
  if (!description) return null;
  const html = description.match(/Article URL:\s*<a href="([^"]+)"/i);
  if (html?.[1] && /^https?:\/\//i.test(html[1])) return html[1];
  const plain = description.match(/Article URL:\s*(https?:\/\/\S+)/i);
  if (plain?.[1]) return plain[1].replace(/[.)>,]+$/, "");
  return null;
}

// Google News titles are "Headline - Publisher". Only strip when we know
// the publisher label (from <source>) so we don't eat legitimate dashes.
export function stripGoogleNewsTitle(title: string, publisher: string | null | undefined): string {
  const src = (publisher ?? "").trim();
  if (!src) return title;
  const suffix = ` - ${src}`;
  if (title.endsWith(suffix) && title.length > suffix.length + 8) {
    return title.slice(0, -suffix.length).trim();
  }
  return title;
}

export function unwrapSync(
  rawUrl: string,
  extras?: { description?: string | null; comments?: string | null },
): string {
  const fromQuery = urlFromQueryParam(rawUrl);
  if (fromQuery) return normalizeArticleUrl(fromQuery);

  if (isHnDiscussionUrl(rawUrl) || (extras?.description && HN_HOSTS.has(safeHost(rawUrl)))) {
    const fromDesc = urlFromHnDescription(extras?.description);
    if (fromDesc && !isHnDiscussionUrl(fromDesc)) return normalizeArticleUrl(fromDesc);
  }

  return normalizeArticleUrl(rawUrl);
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const GN_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

// Post-2024 Google News article IDs no longer embed the publisher URL.
// Fetch the interstitial for data-n-a-sg / data-n-a-ts, then call Fbv4je.
export async function resolveGoogleNewsUrl(
  articleUrl: string,
  timeoutMs = 8000,
): Promise<string | null> {
  if (!isGoogleNewsUrl(articleUrl)) return null;
  const fromQuery = urlFromQueryParam(articleUrl);
  if (fromQuery) return normalizeArticleUrl(fromQuery);

  let articleId: string;
  try {
    const path = new URL(articleUrl).pathname;
    const parts = path.split("/").filter(Boolean);
    articleId = parts[parts.length - 1] ?? "";
  } catch {
    return null;
  }
  if (!articleId.startsWith("CB")) return null;

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const pageRes = await fetch(articleUrl, {
      headers: { "User-Agent": GN_UA, Accept: "text/html,*/*" },
      signal: ctl.signal,
      redirect: "follow",
    });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();
    const sig = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
    const ts = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
    if (!sig || !ts) return null;

    const rpcInner = JSON.stringify([
      "garturlreq",
      [
        ["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1],
        "X",
        "X",
        1,
        [1, 1, 1],
        1,
        1,
        null,
        0,
        0,
        null,
        0,
      ],
      articleId,
      Number(ts),
      sig,
    ]);
    const fReq = JSON.stringify([[["Fbv4je", rpcInner, null, "generic"]]]);
    const postRes = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Referer: "https://news.google.com/",
        "User-Agent": GN_UA,
      },
      body: new URLSearchParams({ "f.req": fReq }),
      signal: ctl.signal,
    });
    if (!postRes.ok) return null;
    let body = await postRes.text();
    if (body.startsWith(")]}'")) body = body.split("\n").slice(1).join("\n");
    body = body.replace(/^\s*\d+\n/, "");
    const envelopes = JSON.parse(body) as unknown[];
    for (const env of envelopes) {
      if (!Array.isArray(env) || env[0] !== "wrb.fr" || env[1] !== "Fbv4je") continue;
      const payload = typeof env[2] === "string" ? JSON.parse(env[2]) : env[2];
      if (Array.isArray(payload) && payload[0] === "garturlres" && typeof payload[1] === "string") {
        return normalizeArticleUrl(payload[1]);
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveGoogleNewsUrls(
  urls: string[],
  opts?: { concurrency?: number; timeoutMs?: number; cap?: number },
): Promise<Map<string, string>> {
  const concurrency = opts?.concurrency ?? 4;
  const timeoutMs = opts?.timeoutMs ?? 8000;
  const cap = opts?.cap ?? 40;
  const unique = [...new Set(urls.filter(isGoogleNewsUrl))].slice(0, cap);
  const out = new Map<string, string>();
  let i = 0;
  async function worker() {
    while (i < unique.length) {
      const url = unique[i++];
      const resolved = await resolveGoogleNewsUrl(url, timeoutMs);
      if (resolved && resolved !== url) out.set(url, resolved);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, worker));
  return out;
}

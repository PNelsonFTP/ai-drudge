// Feed link validator. Checks every URL in sources.ts (or a JSON list passed
// as argv[2]) and reports liveness, parseability, item count, and freshness.
//
// Run:  npm run validate:feeds
//       tsx scripts/validate-feeds.ts candidates.json   (validate a candidate list)
//
// Verdicts:
//   OK          feed parses, has items, newest item < staleDays old
//   STALE       feed parses but newest item is older than staleDays
//   EMPTY       feed parses but has 0 items
//   NOT_FEED    endpoint returns HTML/JSON, not RSS/Atom (SPA or interstitial)
//   HTTP_xxx    non-2xx response
//   TIMEOUT     no response within 15s after retries
//   PARSE_FAIL  body looked like XML but did not parse
//
// A cross-host redirect is reported (→ host) so permanently-moved feeds can
// be updated at the source of truth instead of relying on redirects forever.

import { readFile, writeFile } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";
import { SOURCES } from "./sources";

interface Target {
  name: string;
  url: string;
  category?: string;
}

interface Verdict {
  name: string;
  url: string;
  category?: string;
  verdict: string;
  httpStatus?: number;
  finalUrl?: string;
  redirected?: boolean;
  itemCount?: number;
  newestAgeDays?: number | null;
  note?: string;
}

// Same parser config as fetch-feeds.ts — large feeds (GitHub release Atom,
// Simon Willison) trip fast-xml-parser's default entity-expansion caps.
const PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: {
    enabled: true,
    maxEntitySize: 100000,
    maxTotalExpansions: 100000,
    maxExpandedLength: 1000000,
    maxEntityCount: 100000,
  },
});
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const STALE_DAYS = 60;
const CONCURRENCY = 8;

function looksLikeFeed(body: string, contentType: string): boolean {
  const ct = contentType.split(";")[0].trim();
  if (ct.includes("xml") || ct.includes("rss") || ct.includes("atom")) return true;
  const head = body.slice(0, 600).trim();
  return /^<\?xml/.test(head) || /^<rss/.test(head) || /^<feed/.test(head) || /^<rdf/i.test(head);
}

function extractItems(json: any): any[] {
  const rss = json?.rss?.channel?.item;
  if (rss) return Array.isArray(rss) ? rss : [rss];
  const atom = json?.feed?.entry;
  if (atom) return Array.isArray(atom) ? atom : [atom];
  const rdf = json?.["rdf:RDF"]?.item ?? json?.rdf?.item;
  if (rdf) return Array.isArray(rdf) ? rdf : [rdf];
  return [];
}

function newestDate(items: any[]): Date | null {
  let newest: Date | null = null;
  for (const it of items) {
    const raw =
      it?.pubDate ?? it?.published ?? it?.updated ?? it?.["dc:date"] ?? it?.date ?? null;
    const s = typeof raw === "string" ? raw : raw?.["#text"];
    if (!s) continue;
    const d = new Date(s);
    if (!isNaN(d.getTime()) && (!newest || d > newest)) newest = d;
  }
  return newest;
}

async function checkOne(t: Target): Promise<Verdict> {
  let lastStatus: number | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    try {
      const res = await fetch(t.url, {
        headers: {
          "User-Agent": UA,
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        },
        signal: ctl.signal,
        redirect: "follow",
      });
      lastStatus = res.status;
      const finalUrl = res.url;
      const redirected =
        new URL(finalUrl).host.replace(/^www\./, "") !== new URL(t.url).host.replace(/^www\./, "");
      if (!res.ok) {
        if (res.status >= 500 || res.status === 429) continue; // retry transient
        return { ...t, verdict: `HTTP_${res.status}`, httpStatus: res.status, finalUrl, redirected };
      }
      const body = await res.text();
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (!looksLikeFeed(body, contentType)) {
        return {
          ...t, verdict: "NOT_FEED", httpStatus: res.status, finalUrl, redirected,
          note: contentType.split(";")[0] || "unknown content-type",
        };
      }
      let json: any;
      try {
        json = PARSER.parse(body);
      } catch {
        return { ...t, verdict: "PARSE_FAIL", httpStatus: res.status, finalUrl, redirected };
      }
      const items = extractItems(json);
      if (items.length === 0) {
        return { ...t, verdict: "EMPTY", httpStatus: res.status, finalUrl, redirected, itemCount: 0 };
      }
      const newest = newestDate(items);
      const ageDays = newest ? (Date.now() - newest.getTime()) / 86_400_000 : null;
      const verdict = ageDays !== null && ageDays > STALE_DAYS ? "STALE" : "OK";
      return {
        ...t, verdict, httpStatus: res.status, finalUrl, redirected,
        itemCount: items.length,
        newestAgeDays: ageDays === null ? null : Math.round(ageDays * 10) / 10,
      };
    } catch {
      // timeout or network error — retry once
    } finally {
      clearTimeout(timer);
    }
  }
  return { ...t, verdict: lastStatus ? `HTTP_${lastStatus}` : "TIMEOUT", httpStatus: lastStatus };
}

async function run(targets: Target[]): Promise<Verdict[]> {
  const out: Verdict[] = [];
  let i = 0;
  async function worker() {
    while (i < targets.length) {
      const t = targets[i++];
      const v = await checkOne(t);
      const age = v.newestAgeDays != null ? `${v.newestAgeDays}d` : "-";
      const redir = v.redirected ? ` → ${v.finalUrl}` : "";
      console.log(
        `  ${v.verdict.padEnd(10)} ${String(v.itemCount ?? "-").padStart(3)} items  newest ${age.padStart(7)}  ${v.name}${redir}`
      );
      out.push(v);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return out;
}

async function main() {
  let targets: Target[];
  const arg = process.argv[2];
  if (arg) {
    targets = JSON.parse(await readFile(arg, "utf-8")) as Target[];
    console.log(`Validating ${targets.length} candidate feeds from ${arg}…`);
  } else {
    targets = SOURCES.map((s) => ({ name: s.name, url: s.url, category: s.category }));
    console.log(`Validating ${targets.length} configured feeds…`);
  }

  const verdicts = await run(targets);
  verdicts.sort((a, b) => a.verdict.localeCompare(b.verdict) || a.name.localeCompare(b.name));

  const bad = verdicts.filter((v) => v.verdict !== "OK");
  console.log(`\n=== FEED VALIDATION: ${verdicts.length - bad.length}/${verdicts.length} OK ===`);
  for (const v of bad) {
    console.log(`  ${v.verdict.padEnd(10)} ${v.name.padEnd(30)} ${v.url}${v.note ? `  (${v.note})` : ""}`);
  }
  const moved = verdicts.filter((v) => v.redirected && v.verdict === "OK");
  if (moved.length) {
    console.log(`\n=== REDIRECTED (update URLs) ===`);
    for (const v of moved) console.log(`  ${v.name}: ${v.url} → ${v.finalUrl}`);
  }

  const outPath = process.env.VALIDATE_OUT;
  if (outPath) {
    await writeFile(outPath, JSON.stringify(verdicts, null, 2));
    console.log(`\nWrote ${outPath}`);
  }
}

main().catch((e) => {
  console.error("validate-feeds failed:", e);
  process.exit(1);
});

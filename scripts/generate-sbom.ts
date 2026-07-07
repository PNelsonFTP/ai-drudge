// Generate docs/SBOM.json (CycloneDX 1.5) from package-lock.json.
// Run after any dependency change:  npm run sbom
//
// Also refreshes the component table inside docs/SBOM.md between the
// AUTO-GENERATED markers so the human-readable doc never drifts from the
// lockfile.

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dirname, "..");

interface LockPackage {
  version?: string;
  resolved?: string;
  integrity?: string;
  license?: string;
  dev?: boolean;
}

async function main() {
  const lock = JSON.parse(await readFile(resolve(ROOT, "package-lock.json"), "utf-8"));
  const pkg = JSON.parse(await readFile(resolve(ROOT, "package.json"), "utf-8"));

  const direct = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);

  const packages: [string, LockPackage][] = Object.entries(lock.packages as Record<string, LockPackage>)
    .filter(([path, meta]) => path.startsWith("node_modules/") && meta.version) as [string, LockPackage][];

  const components = packages.map(([path, meta]) => {
    // "node_modules/@scope/name" or "node_modules/a/node_modules/b" — take the
    // final package name after the last node_modules/.
    const name = path.slice(path.lastIndexOf("node_modules/") + "node_modules/".length);
    return {
      type: "library",
      "bom-ref": `pkg:npm/${name}@${meta.version}`,
      name,
      version: meta.version!,
      purl: `pkg:npm/${name}@${meta.version}`,
      scope: meta.dev ? "optional" : "required",
      licenses: meta.license ? [{ license: { id: meta.license } }] : undefined,
      hashes: meta.integrity?.startsWith("sha512-")
        ? [{ alg: "SHA-512", content: Buffer.from(meta.integrity.slice(7), "base64").toString("hex") }]
        : undefined,
      properties: [{ name: "cdx:npm:package:development", value: String(!!meta.dev) }],
    };
  });

  const serialNumber = `urn:uuid:${createHash("sha256")
    .update(JSON.stringify(components.map((c) => c.purl)))
    .digest("hex")
    .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*$/, "$1-$2-$3-$4-$5")}`;

  const bom = {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: {
        type: "application",
        "bom-ref": `pkg:npm/${pkg.name}@${pkg.version}`,
        name: pkg.name,
        version: pkg.version,
        description: "Static AI news aggregator (Drudge-style), GitHub Pages + Actions",
      },
      tools: [{ vendor: "ai-drudge", name: "scripts/generate-sbom.ts", version: "1.0" }],
    },
    components,
  };

  await writeFile(resolve(ROOT, "docs/SBOM.json"), JSON.stringify(bom, null, 2));
  console.log(`Wrote docs/SBOM.json — ${components.length} components.`);

  // Refresh the direct-dependency table in SBOM.md between markers.
  const mdPath = resolve(ROOT, "docs/SBOM.md");
  let md: string;
  try {
    md = await readFile(mdPath, "utf-8");
  } catch {
    return; // SBOM.md not present — JSON is still authoritative
  }
  const rows = [...direct]
    .sort()
    .map((name) => {
      const meta = lock.packages[`node_modules/${name}`] as LockPackage | undefined;
      const kind = pkg.dependencies?.[name] ? "runtime" : "dev/build";
      return `| \`${name}\` | ${meta?.version ?? "?"} | ${meta?.license ?? "?"} | ${kind} |`;
    })
    .join("\n");
  const table = `| Package | Resolved | License | Scope |\n|---------|----------|---------|-------|\n${rows}`;
  const START = "<!-- SBOM-TABLE:START -->";
  const END = "<!-- SBOM-TABLE:END -->";
  if (md.includes(START) && md.includes(END)) {
    md = md.replace(
      new RegExp(`${START}[\\s\\S]*?${END}`),
      `${START}\n${table}\n${END}`
    );
    md = md.replace(/(_Last regenerated: )[^_]*(_)/, `$1${new Date().toISOString().slice(0, 10)}$2`);
    await writeFile(mdPath, md);
    console.log("Refreshed docs/SBOM.md component table.");
  }
}

main().catch((e) => {
  console.error("generate-sbom failed:", e);
  process.exit(1);
});

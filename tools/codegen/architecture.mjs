// "How this library is built": the hand-authored pages under docs/docs/architecture/
// keep their prose; codegen rewrites only the block between `<!-- gen:status -->` and
// `<!-- /gen:status -->` on each (families, counts, the vendor pin), so the page is
// registered as an output and `codegen:check` fails when the status block is stale.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const ARCHITECTURE_PAGES = ["index", "espn-vendored", "flat-vendored", "flat-js-owned", "hand-written", "loaders"];
const OPEN = "<!-- gen:status -->";
const CLOSE = "<!-- /gen:status -->";

/** The status block of one page from the codegen facts `f`. */
function statusBlock(page, f) {
  const pin = `sdv-py pin: [\`${f.vendorRef.slice(0, 12)}\`](https://github.com/${f.vendorRepo}/commit/${f.vendorRef})${f.vendorDate ? ` (${f.vendorDate})` : ""}`;
  const lines = [];
  switch (page) {
    case "index":
      lines.push(
        `| Surface | Source of truth | Generated | Count |`,
        `|---|---|---|---:|`,
        `| [ESPN (vendored)](./espn-vendored) | sdv-py \`espn_*.yaml\` at the pin | \`src/generated/espn/*.ts\`, \`docs/docs/<league>/\` | ${f.espn.wrappers} endpoints × ${f.espn.leagues} leagues |`,
        `| [Native, vendored](./flat-vendored) | sdv-py \`<family>.yaml\` at the pin | \`src/generated/flat/*.ts\` | ${f.flat.vendored.length} families |`,
        `| [Native, JS-owned](./flat-js-owned) | \`tools/codegen/endpoints/<family>.yaml\` in this repo | \`src/generated/flat/*.ts\` | ${f.flat.jsOwned.length} families |`,
        `| [Dataset loaders](./loaders) | sdv-py \`releases.yaml\` + \`loader_schemas.yaml\` | \`src/generated/loaders/*.ts\` | ${f.loaders.count} loaders |`,
        `| [Hand-written](./hand-written) | TypeScript under \`src/\` | \`src/generated/utilities.ts\`, \`docs/docs/utilities/\` | ${f.utilities.exports} utility exports |`,
        ``,
        `${pin}. ${f.flat.wrappers} native wrappers in total; ${f.rows.typed} verified endpoints carry row types; ${f.breaking} breaking changes on record.`
      );
      break;
    case "espn-vendored":
      lines.push(
        `${pin}.`,
        ``,
        `| Family YAML | Host |`,
        `|---|---|`,
        ...f.espn.families.map((fam) => `| \`tools/codegen/endpoints/${fam}.yaml\` | ${ESPN_HOST[fam] ?? ""} |`),
        ``,
        `${f.espn.wrappers} endpoint shorts bound on ${f.espn.leagues} leagues.`
      );
      break;
    case "flat-vendored":
      lines.push(
        `${pin}.`,
        ``,
        `| Family | wrappers |`,
        `|---|---:|`,
        ...f.flat.vendored.map((api) => `| \`${api}\` | ${f.flat.counts[api]} |`)
      );
      break;
    case "flat-js-owned":
      lines.push(`| Family | wrappers |`, `|---|---:|`, ...f.flat.jsOwned.map((api) => `| \`${api}\` | ${f.flat.counts[api]} |`));
      break;
    case "hand-written":
      lines.push(
        `| Category | exports | modules |`,
        `|---|---:|---:|`,
        ...Object.entries(f.utilities.categories).map(([c, s]) => `| [${c}](/docs/utilities/${c}) | ${s.exports} | ${s.modules} |`),
        ``,
        `${f.utilities.exports} exports in ${f.utilities.modules} modules (tools/codegen/utilities.yaml).`
      );
      break;
    case "loaders":
      lines.push(
        `${pin}.`,
        ``,
        `${f.loaders.count} loaders on ${f.loaders.namespaces.length} namespaces: ${f.loaders.namespaces.map((n) => `\`sdv.${n}\``).join(", ")}.`
      );
      break;
    default:
      throw new Error(`architecture: no status block for ${page}`);
  }
  return `${OPEN}\n${lines.join("\n")}\n${CLOSE}`;
}

const ESPN_HOST = {
  espn_site_v2: "`site.api.espn.com`",
  espn_core_v2: "`sports.core.api.espn.com`",
  espn_web_v3: "`site.web.api.espn.com`",
  espn_fitt_v3: "`site.web.api.espn.com` (FPI)",
  espn_cdn: "`cdn.espn.com`",
};

/**
 * Register docs/docs/architecture/<page>.md into `outputs`: the committed page with its
 * status block replaced. A page without both markers fails the codegen.
 */
export function registerArchitectureDocs(outputs, docsRootDir, facts) {
  const dir = join(docsRootDir, "architecture");
  for (const page of ARCHITECTURE_PAGES) {
    const file = join(dir, `${page}.md`);
    if (!existsSync(file)) throw new Error(`architecture: ${file} is missing (hand-authored; add it with a gen:status block)`);
    const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
    const a = text.indexOf(OPEN);
    const b = text.indexOf(CLOSE);
    if (a < 0 || b < 0 || b < a) throw new Error(`architecture: ${file} needs a ${OPEN} … ${CLOSE} block`);
    outputs[file] = text.slice(0, a) + statusBlock(page, facts) + text.slice(b + CLOSE.length);
  }
  outputs[join(dir, "_category_.json")] =
    JSON.stringify({ label: "How this library is built", position: 2, collapsible: true, collapsed: true, link: { type: "doc", id: "index" } }, null, 2) + "\n";
}

/** The sidebar group (right after Getting Started). */
export function architectureSidebar() {
  return {
    type: "category",
    label: "How this library is built",
    collapsible: true,
    collapsed: true,
    link: { type: "doc", id: "architecture/index" },
    items: ARCHITECTURE_PAGES.filter((p) => p !== "index").map((p) => ({ type: "doc", id: `architecture/${p}` })),
  };
}

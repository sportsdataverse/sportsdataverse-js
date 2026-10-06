// Utilities catalogue: tools/codegen/utilities.yaml (JS-owned) -> docs/docs/utilities/
// (an index of category cards + one page per category), src/generated/utilities.ts
// (the name -> category table `discover.listFunctions` labels utilities with), the
// "Utilities" sidebar group and the `utilities` block of docs/src/generated/coverage.json.
//
// Signatures are read off the TypeScript source with a light regex (the first line(s)
// of the `export` declaration, up to its body), never invented: a listed export the
// source does not declare fails the codegen.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export const CATEGORY_ORDER = [
  "parsers",
  "analytics",
  "odds",
  "models",
  "producers",
  "discovery",
  "transforms",
  "http-core",
  "errors",
  "config",
];
const KINDS = new Set(["function", "class", "const", "type"]);

/** Load + validate utilities.yaml. Returns `{ categories, modules }`. */
export function loadUtilities(codegenDir) {
  const doc = parse(readFileSync(join(codegenDir, "utilities.yaml"), "utf8"));
  const repoRoot = join(codegenDir, "..", "..");
  const seen = new Map();
  for (const m of doc.modules) {
    if (!CATEGORY_ORDER.includes(m.category)) throw new Error(`utilities.yaml: ${m.module}: unknown category ${m.category}`);
    if (!doc.categories[m.category]) throw new Error(`utilities.yaml: category ${m.category} has no entry`);
    const files = [m.module, ...(m.sources ?? [])].filter((f) => existsSync(join(repoRoot, f)));
    if (!files.length && (m.sources ?? null) !== null && m.sources.length === 0) files.push(m.module);
    for (const e of m.exports) {
      if (!KINDS.has(e.kind)) throw new Error(`utilities.yaml: ${m.module}.${e.name}: unknown kind ${e.kind}`);
      if (!e.summary) throw new Error(`utilities.yaml: ${m.module}.${e.name}: no summary`);
      const key = `${m.module}.${e.name}`;
      if (seen.has(e.name) && seen.get(e.name) !== m.module) {
        throw new Error(`utilities.yaml: ${e.name} is listed under both ${seen.get(e.name)} and ${m.module}`);
      }
      seen.set(e.name, m.module);
      e.signature = findSignature(repoRoot, files, e.name, key);
    }
  }
  return doc;
}

/** One export's declaration line(s) from the first of `files` that declares it. */
function findSignature(repoRoot, files, name, where) {
  const re = new RegExp(
    `^export\\s+(?:declare\\s+)?(?:async\\s+)?(?:function\\*?|const|let|class|interface|type|abstract class)\\s+${name.replace(/\$/g, "\\$")}\\b`
  );
  for (const f of files) {
    const lines = readFileSync(join(repoRoot, f), "utf8").split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (!re.test(lines[i])) continue;
      let sig = lines[i].trim();
      let depth = paren(sig);
      let j = i;
      // a declaration ends at its body `{` (or an empty `{}`), at `;`, or at `=` for a const
      // (keep the type annotation); anything after a trailing `/**` is the next declaration's doc.
      const ends = (s) => /[{};]\s*$/.test(s.replace(/\/\*\*.*$/, "").trimEnd());
      while (!ends(sig) && !/=\s*\S/.test(sig.replace(/=>/g, "")) && j < i + 12 && j < lines.length - 1) {
        j++;
        sig += " " + lines[j].trim();
        depth += paren(lines[j]);
        if (depth <= 0 && ends(sig)) break;
      }
      sig = sig
        .replace(/\/\*\*.*$/, "")
        .replace(/\s*\{\s*\}\s*$/, " {}")
        .replace(/\s*\{\s*$/, "")
        .replace(/\s*=\s*(?:async\s*)?\([^)]*\)\s*=>.*$/, "")
        .replace(/\s+=\s*[^=].*$/, "");
      return sig.replace(/\s+/g, " ").trim();
    }
    // a re-export (`export { x } from`) resolves through the barrel's own sources, so a
    // barrel-only name needs the defining file in `sources`.
  }
  // `export { name }` lists (an alias re-exported from the barrel): accept the bare name.
  for (const f of files) {
    const text = readFileSync(join(repoRoot, f), "utf8");
    if (new RegExp(`export\\s+(?:type\\s+)?\\{[^}]*\\b${name}\\b[^}]*\\}`).test(text) || new RegExp(`export\\s+const\\s+${name}\\s*=`).test(text)) {
      return `export ${name}`;
    }
  }
  throw new Error(`utilities.yaml: ${where}: no export named ${name} in ${files.join(", ")}`);
}
const paren = (s) => (s.match(/[({[]/g) ?? []).length - (s.match(/[)}\]]/g) ?? []).length;

/** `{ modules, exports, categories: { <cat>: { modules, exports } } }`. */
export function utilitiesCoverage(doc) {
  const categories = {};
  let exportsN = 0;
  for (const m of doc.modules) {
    const c = (categories[m.category] ??= { modules: 0, exports: 0 });
    c.modules += 1;
    c.exports += m.exports.length;
    exportsN += m.exports.length;
  }
  return { modules: doc.modules.length, exports: exportsN, categories };
}

/** src/generated/utilities.ts: name -> category for the runtime (discover.listFunctions). */
export function renderUtilitiesTs(doc) {
  const table = {};
  for (const m of doc.modules) {
    for (const e of m.exports) {
      for (const n of [e.name, ...(e.aliases ?? [])]) table[n] = m.category;
    }
  }
  const sorted = Object.fromEntries(Object.keys(table).sort().map((k) => [k, table[k]]));
  return (
    "// AUTO-GENERATED by tools/codegen/generate.mjs — do not edit by hand.\n" +
    "// Run `npm run codegen` to regenerate from tools/codegen/utilities.yaml.\n//\n" +
    "// Every hand-written non-data export (and its aliases) -> its utilities category.\n" +
    "// `discover.listFunctions` labels a name in this table `utility`; every other callable is `data`.\n\n" +
    `export type UtilityCategory = ${CATEGORY_ORDER.map((c) => JSON.stringify(c)).join(" | ")};\n\n` +
    `export const UTILITY_CATEGORIES: Record<string, UtilityCategory> = ${JSON.stringify(sorted, null, 2)};\n`
  );
}

const mdx = (s) => String(s ?? "").replace(/[{}<>]/g, (c) => `\\${c}`);
const cell = (s) => mdx(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
const anchor = (s) => s.toLowerCase().replace(/[^a-z0-9_]+/g, "-");

const BANNER =
  ":::info Not data functions\nThese utilities never fetch a provider payload by themselves — they transform, " +
  "classify, configure or look things up. The data surface (every `espn*` / native wrapper and `load*` loader) " +
  "is under [ESPN Reference](/docs/reference/).\n:::\n";

/** Register docs/docs/utilities/{index.md, <category>.md, _category_.json} into `outputs`. */
export function registerUtilityDocs(outputs, docsRootDir, doc) {
  const dir = join(docsRootDir, "utilities");
  const cov = utilitiesCoverage(doc);
  const cats = CATEGORY_ORDER.filter((c) => cov.categories[c]);

  let index =
    `---\ntitle: Utilities\nsidebar_label: Overview\nsidebar_position: 0\n---\n\n` +
    `# Utilities\n\n${BANNER}\n` +
    `**${cov.exports}** hand-written exports in **${cov.modules}** modules, in ${cats.length} categories ` +
    `(tools/codegen/utilities.yaml). Each category links to its page; every entry there shows the ` +
    `signature read from the TypeScript source.\n\n` +
    `| Category | exports | modules | what |\n|---|---:|---:|---|\n`;
  for (const c of cats) {
    const meta = doc.categories[c];
    index += `| [${meta.label}](./${c}) | ${cov.categories[c].exports} | ${cov.categories[c].modules} | ${cell(meta.summary)} |\n`;
  }
  outputs[join(dir, "index.md")] = index;
  outputs[join(dir, "_category_.json")] =
    JSON.stringify({ label: "Utilities", position: 6, collapsible: true, collapsed: true, link: { type: "doc", id: "index" } }, null, 2) + "\n";

  cats.forEach((c, i) => {
    const meta = doc.categories[c];
    const mods = doc.modules.filter((m) => m.category === c);
    let body =
      `---\ntitle: ${meta.label}\nsidebar_label: ${meta.label}\nsidebar_position: ${i + 1}\n---\n\n` +
      `# ${meta.label}\n\n${BANNER}\n${mdx(meta.summary)}\n\n` +
      `| Export | kind | module |\n|---|---|---|\n`;
    for (const m of mods) {
      for (const e of m.exports) body += `| [\`${e.name}\`](#${anchor(e.name)}) | ${e.kind} | \`${m.module}\` |\n`;
    }
    for (const m of mods) {
      body += `\n## \`${m.module}\`\n\n${mdx(m.summary)}\n\n`;
      if (m.namespace) body += `**Mounted on:** \`${mdx(m.namespace)}\` (snake_case name + camelCase alias).\n\n`;
      else body += `**Import:** \`import { … } from '${m.import ?? "sportsdataverse"}'\`\n\n`;
      for (const e of m.exports) {
        body += `### \`${e.name}\`\n\n`;
        body += `${mdx(e.summary)}\n\n`;
        body += "```ts\n" + e.signature + "\n```\n\n";
        if (e.aliases?.length) body += `**Aliases:** ${e.aliases.map((a) => `\`${a}\``).join(", ")}\n\n`;
        if (e.import) body += `**Import:** \`import { ${e.name} } from '${e.import}'\`\n\n`;
        if (e.example) body += "**Example:**\n\n```js\n" + e.example.trim() + "\n```\n\n";
      }
    }
    outputs[join(dir, `${c}.md`)] = body;
  });
}

/** The "Utilities" group for the generated reference sidebar. */
export function utilitiesSidebar(doc) {
  const cov = utilitiesCoverage(doc);
  return {
    type: "category",
    label: "Utilities",
    collapsible: true,
    collapsed: true,
    link: { type: "doc", id: "utilities/index" },
    items: CATEGORY_ORDER.filter((c) => cov.categories[c]).map((c) => ({
      type: "doc",
      id: `utilities/${c}`,
      label: doc.categories[c].label,
    })),
  };
}

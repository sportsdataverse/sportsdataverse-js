// Breaking-change callouts: tools/codegen/breaking.yaml -> a `:::danger` admonition at
// the top of every affected generated docs page + the by-version table on
// reference/deprecations.md. See breaking.yaml for the surface vocabulary.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const SURFACE_ALIAS = { hockeytech: "flat:hockeytech" };
const normalize = (s) => SURFACE_ALIAS[s] ?? s;

/** Load + validate breaking.yaml; every entry's `surface` becomes an array. */
export function loadBreaking(codegenDir) {
  const doc = parse(readFileSync(join(codegenDir, "breaking.yaml"), "utf8"));
  const entries = (doc?.entries ?? []).map((e, i) => {
    for (const k of ["version", "surface", "title", "note", "changelog_anchor"]) {
      if (!e[k]) throw new Error(`breaking.yaml: entry ${i + 1} has no ${k}`);
    }
    const surface = (Array.isArray(e.surface) ? e.surface : [e.surface]).map(normalize);
    for (const s of surface) {
      if (!/^(espn|loaders|legacy|core|flat:(\*|[a-z0-9_]+))$/.test(s)) throw new Error(`breaking.yaml: entry ${i + 1}: unknown surface ${s}`);
    }
    return { ...e, surface, note: String(e.note).replace(/\s+/g, " ").trim() };
  });
  return entries;
}

/** The entries that apply to a page whose surfaces are `pageSurface` (one or a list). */
export function breakingFor(entries, pageSurface) {
  const page = (Array.isArray(pageSurface) ? pageSurface : [pageSurface]).map(normalize);
  return entries.filter((e) =>
    e.surface.some((s) => page.includes(s) || (s === "flat:*" && page.some((p) => p.startsWith("flat:"))))
  );
}

const link = (e) => `[changelog](/CHANGELOG#${e.changelog_anchor})`;

/** The admonition for a page (one `:::danger` per version), or "" when nothing applies. */
export function breakingAdmonition(entries, pageSurface) {
  const hits = breakingFor(entries, pageSurface);
  if (!hits.length) return "";
  const byVersion = new Map();
  for (const e of hits) (byVersion.get(e.version) ?? byVersion.set(e.version, []).get(e.version)).push(e);
  let out = "";
  for (const [version, list] of [...byVersion].sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))) {
    out += `:::danger Breaking in ${version}\n\n`;
    for (const e of list) out += `- **${e.title}** — ${e.note} (${link(e)})\n`;
    out += `\n:::\n`;
  }
  return out;
}

/** The "Breaking changes by version" table (reference/deprecations.md). */
export function breakingTable(entries) {
  let out =
    `## Breaking changes by version\n\n` +
    `${entries.length} breaking changes are on record (tools/codegen/breaking.yaml); each affected ` +
    `reference page carries them as a callout at its top.\n\n` +
    `| Version | Surface | Change | Changelog |\n|---|---|---|---|\n`;
  const sorted = entries
    .slice()
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }) || a.title.localeCompare(b.title));
  for (const e of sorted) {
    const surf = e.surface.map((s) => `\`${s}\``).join(", ");
    out += `| ${e.version} | ${surf} | **${e.title}** — ${e.note.replace(/\|/g, "\\|")} | ${link(e)} |\n`;
  }
  return out + "\n";
}

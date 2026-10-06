// Returns-table column descriptions (a port of sdv-py generate.py's render-time
// fill: `_table_cell_desc` / `_manual_col_desc` / `_r_col_desc`).
//
// A returns schema carries name + type and, for a JS-owned schema, sometimes a
// `description`. Every other cell is filled at render time from two files sdv-py
// owns and `npm run vendor` copies verbatim (tools/codegen/vendor.yaml `copy:`):
//   manual_column_descriptions.yaml   {<schema key>: {col: desc}, _global: {col: desc}}
//   r_column_descriptions.yaml        {<R package>: {col: desc}, _merged: {col: desc}}
// Resolution, first non-empty wins:
//   1. the schema's own description text
//   2. manual[<key>][col] for each candidate key of the table (its `schema:` field,
//      its file stem, the endpoint short, the public name, a loader's `load_*` fn)
//   3. manual._global[col]
//   4. the R package(s) of the table's league (LEAGUE_R_PACKAGES), then the other
//      packages of the same sport (sdv-py `_sport_merged`: wehoop text for an nba
//      column beats nflreadr's)
//   5. r._merged[col] (the cross-package union)
//   6. "" (left blank, never invented)
// R text gets sdv-py's read-time fixes: four roxygen typos and the trailing
// "; `team_detail = TRUE` only" condition (the JS parsers always return the column).
//
// `describeColumns` also records per-family coverage (filled / total, one count per
// table and league) for the codegen stats line + docs/src/generated/description_coverage.json.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));

/** sdv-py `_LEAGUE_R_PACKAGE`, plus the JS namespaces that merge onto a league. */
export const LEAGUE_R_PACKAGES = {
  cfb: ["cfbfastR"],
  nba: ["hoopR"],
  mbb: ["hoopR"],
  torvik: ["hoopR"],
  kenpom: ["hoopR"],
  wnba: ["wehoop"],
  wbb: ["wehoop"],
  mlb: ["baseballr"],
  nhl: ["fastRhockey"],
  nfl: ["nflreadr", "nflfastR"],
  hockeytech: ["fastRhockey"],
  ahl: ["fastRhockey"],
  ohl: ["fastRhockey"],
  whl: ["fastRhockey"],
  qmjhl: ["fastRhockey"],
  pwhl: ["fastRhockey"],
};

/** sdv-py `_PACKAGE_SPORT`: same-sport siblings are tried before `_merged`. */
const PACKAGE_SPORT = {
  hoopR: "basketball",
  wehoop: "basketball",
  cfbfastR: "football",
  nflreadr: "football",
  nflfastR: "football",
  fastRhockey: "hockey",
  baseballr: "baseball",
};

/** sdv-py `_R_DESC_TYPO_FIXES`: roxygen misspellings, corrected at read time. */
const TYPO_FIXES = [
  ["probabiity", "probability"],
  ["indentifier", "identifier"],
  ["identifcation", "identification"],
  ["wheter", "whether"],
];
/** sdv-py `_R_ONLY_ARG`: an R-only argument condition the JS parsers do not have. */
const R_ONLY_ARG = /;\s*`[a-z_]+ = (?:TRUE|FALSE)` only(?=\.?$)/;

const cleanR = (text) => {
  let t = String(text ?? "");
  for (const [bad, good] of TYPO_FIXES) t = t.split(bad).join(good);
  return t.replace(R_ONLY_ARG, "");
};

let SOURCES = null;
/** The two vendored description files, parsed once (missing file -> `{}`). */
export function loadDescriptionSources(dir = here) {
  if (SOURCES) return SOURCES;
  const load = (name) => {
    const file = join(dir, name);
    return existsSync(file) ? parse(readFileSync(file, "utf8")) ?? {} : {};
  };
  SOURCES = { manual: load("manual_column_descriptions.yaml"), r: load("r_column_descriptions.yaml") };
  return SOURCES;
}

/** sdv-py `_sport_merged`: the union of the same-sport packages' dicts (first package wins). */
const sportDicts = new Map();
function sameSport(r, pkg) {
  const sport = PACKAGE_SPORT[pkg];
  if (!sport) return {};
  if (!sportDicts.has(sport)) {
    const out = {};
    for (const [p, s] of Object.entries(PACKAGE_SPORT)) {
      if (s !== sport) continue;
      for (const [col, desc] of Object.entries(r[p] ?? {})) if (desc && !(col in out)) out[col] = desc;
    }
    sportDicts.set(sport, out);
  }
  return sportDicts.get(sport);
}

/**
 * The description of one column: `existing` (the schema's own text) if non-empty, else
 * the manual file under each of `keys`, then `_global`, then the R dicts for `league`
 * (its package(s), its sport's other packages, `_merged`), else "".
 */
export function describeColumn(existing, col, keys = [], league = null, sources = loadDescriptionSources()) {
  if (existing && String(existing).trim()) return String(existing).trim();
  if (!col) return "";
  const { manual, r } = sources;
  for (const k of keys) {
    const v = k && manual[k]?.[col];
    if (v) return String(v);
  }
  const g = manual._global?.[col];
  if (g) return String(g);
  const pkgs = LEAGUE_R_PACKAGES[league ?? ""] ?? [];
  for (const pkg of pkgs) {
    const v = r[pkg]?.[col];
    if (v) return cleanR(v);
  }
  for (const pkg of pkgs) {
    const v = sameSport(r, pkg)[col];
    if (v) return cleanR(v);
  }
  const m = r._merged?.[col];
  return m ? cleanR(m) : "";
}

/** family -> { filled, total }, one count per (family, league, table). */
const COVERAGE = new Map();
const COUNTED = new Set();

/**
 * `columns` with every `description` resolved (a new array; the input is not
 * mutated), counted once per `(family, league, ref)` into the coverage stats.
 * `keys`: the candidate manual keys of this table; `league`: the namespace whose R
 * package backs the fallback (null: `_merged` only).
 */
export function describeColumns(family, ref, columns, { keys = [], league = null } = {}) {
  if (!columns) return columns;
  const out = columns.map((c) => ({ ...c, description: describeColumn(c.description, c.name, keys, league) }));
  const tag = `${family}\0${league ?? ""}\0${ref}`;
  if (!COUNTED.has(tag)) {
    COUNTED.add(tag);
    const s = COVERAGE.get(family) ?? { filled: 0, total: 0 };
    s.total += out.length;
    s.filled += out.filter((c) => c.description).length;
    COVERAGE.set(family, s);
  }
  return out;
}

/** The coverage stats: `{ families: { <family>: { filled, total, rate } }, totals }`, sorted. */
export function descriptionCoverage() {
  const families = {};
  const totals = { filled: 0, total: 0 };
  for (const fam of [...COVERAGE.keys()].sort()) {
    const { filled, total } = COVERAGE.get(fam);
    families[fam] = { filled, total, rate: total ? Math.round((filled / total) * 10000) / 10000 : 0 };
    totals.filled += filled;
    totals.total += total;
  }
  totals.rate = totals.total ? Math.round((totals.filled / totals.total) * 10000) / 10000 : 0;
  return { families, totals };
}

/** One line per family for the codegen stats output. */
export function coverageLines() {
  const { families, totals } = descriptionCoverage();
  const lines = Object.entries(families).map(([f, s]) => `descriptions ${f}: ${s.filled}/${s.total}`);
  lines.push(`descriptions total: ${totals.filled}/${totals.total} (${(totals.rate * 100).toFixed(1)}%)`);
  return lines;
}

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
//   4. the R package(s) of the table's league (LEAGUE_R_PACKAGES) — ONLY the packages of
//      that league's own sport, in order (hoopR then wehoop for a basketball league, …)
//   5. "" (left blank, never invented)
// There is NO cross-sport fallback: r._merged (the union of every package, first package
// wins) put "Inning number." on a basketball jersey number and SP+ text on NFL Pro
// ratings, so it is never read; a namespace with no entry in LEAGUE_R_PACKAGES (cbs,
// fox, yahoo, on3, 247, asa, odds, soccer, cricket, …) and the shared ESPN
// parsed-returns page (league null) resolve through the manual file only.
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

/**
 * The R packages whose column descriptions may back a league's blanks — the packages of
 * THAT sport only, in order (sdv-py `_LEAGUE_R_PACKAGE` + its same-sport sibling, e.g.
 * wehoop after hoopR for a basketball league; cfbfastR and the NFL packages are both
 * football but are NOT siblings here: SP+ text on an NFL rating is wrong). A namespace
 * missing from this table gets no R fallback at all.
 */
export const LEAGUE_R_PACKAGES = {
  // basketball
  nba: ["hoopR", "wehoop"],
  nbagl: ["hoopR", "wehoop"],
  mbb: ["hoopR", "wehoop"],
  torvik: ["hoopR", "wehoop"],
  kenpom: ["hoopR", "wehoop"],
  wnba: ["wehoop", "hoopR"],
  wbb: ["wehoop", "hoopR"],
  // football
  cfb: ["cfbfastR"],
  nfl: ["nflreadr", "nflfastR"],
  // baseball
  mlb: ["baseballr"],
  college_baseball: ["baseballr"],
  college_softball: ["baseballr"],
  // hockey
  nhl: ["fastRhockey"],
  mch: ["fastRhockey"],
  wch: ["fastRhockey"],
  hockeytech: ["fastRhockey"],
  ahl: ["fastRhockey"],
  ohl: ["fastRhockey"],
  whl: ["fastRhockey"],
  qmjhl: ["fastRhockey"],
  pwhl: ["fastRhockey"],
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

/**
 * A mined R entry that is a function ARGUMENT's description, not a column's (wehoop's
 * `rank` = "Whether to include statistical ranks in the returned table."): never used.
 */
const R_ARGUMENT_TEXT = /^Whether to (?:include|return) .* table\.?$/i;

const cleanR = (text) => {
  let t = String(text ?? "");
  if (R_ARGUMENT_TEXT.test(t)) return "";
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

/**
 * Families whose tables are player / team AGGREGATES while their sport's R dicts describe
 * play-by-play columns ("Binary indicator for if the play ended in a sack" on a season
 * total): no R fallback, manual text only. Keyed by flat family (api stem).
 */
export const FAMILY_R_PACKAGES = { nfl_api: [], nfl_pro: [], pff_api: [] };

/**
 * The description of one column: `existing` (the schema's own text) if non-empty, else
 * the manual file under each of `keys`, then `_global`, then the R package(s) of
 * `league`'s own sport (LEAGUE_R_PACKAGES; none for an unmapped namespace or `null`;
 * `packages` overrides the list, `[]` for no R fallback), else "".
 */
export function describeColumn(existing, col, keys = [], league = null, sources = loadDescriptionSources(), packages = null) {
  if (existing && String(existing).trim()) return String(existing).trim();
  if (!col) return "";
  const { manual, r } = sources;
  for (const k of keys) {
    const v = k && manual[k]?.[col];
    if (v) return String(v);
  }
  const g = manual._global?.[col];
  if (g) return String(g);
  for (const pkg of packages ?? LEAGUE_R_PACKAGES[league ?? ""] ?? []) {
    const v = r[pkg]?.[col] ? cleanR(r[pkg][col]) : "";
    if (v) return v;
  }
  return "";
}

/** family -> { filled, total }, one count per (family, league, table). */
const COVERAGE = new Map();
const COUNTED = new Set();

/**
 * `columns` with every `description` resolved (a new array; the input is not
 * mutated), counted once per `(family, league, ref)` into the coverage stats.
 * `keys`: the candidate manual keys of this table; `league`: the namespace whose R
 * own-sport packages back the fallback (null, or an unmapped namespace: no R fallback).
 */
export function describeColumns(family, ref, columns, { keys = [], league = null } = {}) {
  if (!columns) return columns;
  const packages = FAMILY_R_PACKAGES[family] ?? null;
  const out = columns.map((c) => ({
    ...c,
    description: describeColumn(c.description, c.name, keys, league, loadDescriptionSources(), packages),
  }));
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

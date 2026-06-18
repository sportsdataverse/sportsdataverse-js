// One-shot enrichment: derive returns-schema columns for the Fox Sports
// "Bifrost" (`fox`) family from captured response payloads.
//
// 14 of the 38 fox returns schemas already carry real columns (typed
// from the spec's `components.schemas`); this script only fills the 24 that
// start as `columns: []`. It:
//
//   1. reads the endpoint YAML (short / path / parser / returns_schema);
//   2. matches each EMPTY-schema endpoint to its capture(s) under
//      <refs>/fox/captures/<sport>/ (or _sample/). Capture filenames encode the
//      endpoint as `<sport>_<path-suffix>.json` (IDs inlined), so each empty
//      short maps to a filename matcher. When multiple sport captures match the
//      same template, the one whose parse yields the MOST rows is used (richest
//      column union); ties keep the first.
//   3. runs the endpoint's REGISTERED parser over the chosen payload and takes
//      the union of row keys (first 200 rows) as the column set;
//   4. OVERWRITES only the 24 empty schemas — the 14 already-typed schemas are
//      left untouched. Endpoints with no matching capture (or a 0-row parse)
//      stay `columns: []` and are logged.
//
// Run:  node tools/codegen/_enrich_fox_schemas.mjs
// (requires `npm run build` first — imports compiled parsers from dist/).

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import * as foxParsers from "../../dist/parsers/fox.js";

// fox.ts exports named parser functions (no aggregated registry object
// like cbs's CBS_NAPI_PARSERS), so key them by function name here.
const FOX_BIFROST_PARSERS = Object.fromEntries(
  Object.entries(foxParsers).filter(([, v]) => typeof v === "function")
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const endpointsYaml = join(__dirname, "endpoints", "fox.yaml");
const schemasDir = join(__dirname, "schemas");
// External capture corpus (the sdv-internal-refs checkout). Point SDV_REFS_ROOT
// at it; no default (a hard-coded path would be non-portable + leak a local
// username). Absent the env var there's nothing to enrich — exit cleanly so the
// already-committed schemas are untouched.
const REFS_ROOT = process.env.SDV_REFS_ROOT;
if (!REFS_ROOT) {
  console.log(
    "SDV_REFS_ROOT is not set — set it to your sdv-internal-refs checkout to " +
      "re-derive columns from the capture corpus. Nothing to do; exiting."
  );
  process.exit(0);
}
const capturesRoot = join(REFS_ROOT, "fox", "captures");
const SPORT_DIRS = ["cbk", "cfb", "mlb", "nba", "nfl", "nhl", "soccer", "ufl", "wbc", "wcbk", "wnba", "_sample"];

// Endpoint `short` -> a regex matched against capture BASENAMES (sport prefix
// already stripped). Only the 24 currently-empty shorts are listed; absence
// means "no capture" and the schema is left as columns: []. The capture
// filename pattern encodes the path suffix with any path IDs inlined.
const MATCHERS = {
  event_odds: /^event_\d+_odds\.json$/,
  event_recap: /^event_\d+_recap\.json$/,
  event_standings: /^event_\d+_standings\.json$/,
  league_conferences: /^league_conferences\.json$/,
  league_header: /^league_header\.json$/,
  league_playernews: /^league_playernews\.json$/,
  league_stats: /^league_stats\.json$/,
  // stats-con tables ship as league_stats-con__<who>__<cat>__p<page>.json
  league_stats_con: /^league_stats-con__.+\.json$/,
  team_header: /^team_\d+_header\.json$/,
  team_standings: /^team_\d+_standings\.json$/,
  team_stats: /^team_\d+_stats\.json$/,
  explore_browse: /^explore_browse_.+_main\.json$/,
  explore_odds: /^explore_odds_main\.json$/,
  search_popular: /^search_popular\.json$/,
  trending_articles: /^trending_articles\.json$/,
  trending_videos: /^trending_videos\.json$/,
  // No capture in the corpus for these (logged, left empty):
  //   explore_favorite, foxpolls, fs_feed, fs_images, fs_layouts, fs_videos,
  //   league_scores_segment, scorechip
};

// Strip the leading sport directory token from a basename so the path-suffix
// matchers above are sport-agnostic.
const SPORT_PREFIX = /^(cbk|cfb|mlb|nba|nfl|nhl|soccer|ufl|wbc|wcbk|wnba)_/;

/** All capture files (abs path) whose sport-stripped basename matches `re`. */
function findCaptures(re) {
  const hits = [];
  for (const d of SPORT_DIRS) {
    const dir = join(capturesRoot, d);
    let entries;
    try {
      // Sort for deterministic candidate ordering across platforms/filesystems
      // (richest-candidate tie-break depends on a stable scan order).
      entries = readdirSync(dir).sort();
    } catch {
      continue;
    }
    for (const f of entries) {
      const stripped = f.replace(SPORT_PREFIX, "");
      if (re.test(stripped)) hits.push(join(dir, f));
    }
  }
  return hits;
}

// ---- helpers (shared shape with the CBS enrichment script) ----------------

function inferType(v) {
  if (typeof v === "boolean") return "logical";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  if (typeof v === "string") return "character";
  if (v === null || v === undefined) return "character";
  // Non-scalar -> "list" to match the rest of the returns-schema corpus (the
  // parsers stringify arrays/objects, so this is a rare safety branch).
  if (typeof v === "object") return "list";
  return "character";
}

function describe(name) {
  const map = {
    id: "ID",
    url: "URL",
    abbr: "abbreviation",
    uri: "URI",
    cta: "call-to-action",
    pbp: "play-by-play",
  };
  const words = name.split("_").map((w) => map[w] ?? w).join(" ");
  if (!words) return "";
  return `Bifrost field \`${name}\`: ${words}.`;
}

function deriveColumns(rows, cap = 200) {
  const order = [];
  const sample = new Map();
  for (const row of rows.slice(0, cap)) {
    for (const [k, v] of Object.entries(row)) {
      if (!sample.has(k)) {
        order.push(k);
        sample.set(k, v);
      } else if (sample.get(k) === null || sample.get(k) === undefined) {
        if (v !== null && v !== undefined) sample.set(k, v);
      }
    }
  }
  return order.map((name) => ({
    name,
    type: inferType(sample.get(name)),
    description: describe(name),
  }));
}

const HEADER = `# Fox Sports Bifrost returns schema — columns DERIVED from a captured live
# response run through the registered parser (parse_fox_*). The Fox spec
# left this response untyped (\`object\`), so the columns are enumerated here from
# a representative capture. \`type\` is inferred from the captured JS value;
# \`description\` is best-effort from the snake_cased key. Endpoints with no
# capture remain \`columns: []\`.
`;

function dumpYaml(short, columns) {
  let out = HEADER;
  out += `schema: ${short}\n`;
  out += `kind: dataframe\n`;
  out += `columns:\n`;
  for (const c of columns) {
    out += `- name: ${c.name}\n`;
    out += `  type: ${c.type}\n`;
    const d = c.description ?? "";
    out += `  description: ${JSON.stringify(d)}\n`;
  }
  return out;
}

// ---- main ------------------------------------------------------------------

const doc = parse(readFileSync(endpointsYaml, "utf8"));
const endpoints = doc.endpoints ?? [];

let typed = 0;
let leftEmpty = 0;
const emptyReasons = [];

for (const ep of endpoints) {
  const { short, parser, returns_schema } = ep;
  const schemaFile = join(schemasDir, `${returns_schema}.yaml`);
  if (!existsSync(schemaFile)) {
    leftEmpty++;
    emptyReasons.push(`${short}: schema file missing`);
    continue;
  }
  const existing = parse(readFileSync(schemaFile, "utf8"));
  if (Array.isArray(existing?.columns) && existing.columns.length > 0) continue; // already typed — leave it

  const re = MATCHERS[short];
  if (!re) {
    leftEmpty++;
    emptyReasons.push(`${short}: no capture`);
    continue;
  }
  const candidates = findCaptures(re);
  if (candidates.length === 0) {
    leftEmpty++;
    emptyReasons.push(`${short}: no capture`);
    continue;
  }
  const parseFn = FOX_BIFROST_PARSERS[parser];
  if (!parseFn) {
    leftEmpty++;
    emptyReasons.push(`${short}: parser ${parser} not found`);
    continue;
  }

  // Pick the candidate whose parse yields the most rows (richest column union).
  let best = null;
  for (const c of candidates) {
    let rows;
    try {
      rows = parseFn(JSON.parse(readFileSync(c, "utf8")));
    } catch {
      continue;
    }
    if (Array.isArray(rows) && (!best || rows.length > best.rows.length)) {
      best = { path: c, rows };
    }
  }
  if (!best || best.rows.length === 0) {
    leftEmpty++;
    emptyReasons.push(`${short}: parser yielded 0 rows`);
    continue;
  }
  const columns = deriveColumns(best.rows);
  if (columns.length === 0) {
    leftEmpty++;
    emptyReasons.push(`${short}: 0 columns derived`);
    continue;
  }
  writeFileSync(schemaFile, dumpYaml(short, columns));
  typed++;
  console.log(
    `  typed ${short.padEnd(24)} <- ${best.path.replace(capturesRoot + "/", "").replace(capturesRoot + "\\", "")} (${best.rows.length} rows, ${columns.length} cols)`
  );
}

console.log("");
console.log(`Fox Bifrost enrichment: ${typed} schemas newly typed, ${leftEmpty} left empty (of 24 empty / 38 total).`);
console.log("Left empty (no capture / 0 rows):");
for (const r of emptyReasons) console.log(`  - ${r}`);

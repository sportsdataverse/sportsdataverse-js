// One-shot enrichment: derive returns-schema columns for the CBS NAPI
// (`cbs_napi`) family from captured response payloads.
//
// The CBS NAPI OpenAPI spec ships no typed 200-response schemas, so every
// returns schema under tools/codegen/schemas/native/cbs_napi/ starts as
// `columns: []`. This script fills the empty schemas by:
//
//   1. reading the endpoint YAML (short / path / parser / returns_schema);
//   2. matching each endpoint to a capture under
//      <refs>/cbs/captures/napi/ — the manifest `templates` column is empty
//      for CBS, so we match by the capture FILENAME pattern that encodes the
//      resource (league_<id>_meta / season_<id>_teams / team_<id>_players /
//      team_<id>_standings) plus the _discovery endpoint_registry capture;
//   3. running the endpoint's REGISTERED parser over the captured payload and
//      taking the union of row keys (first 200 rows) as the column set;
//   4. OVERWRITING only the currently-empty schemas. Endpoints with no
//      matching capture (or a 0-row parse) are LEFT as `columns: []` and logged.
//
// Run:  node tools/codegen/_enrich_cbs_napi_schemas.mjs
// (requires `npm run build` first — imports the compiled parsers from dist/).

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { CBS_NAPI_PARSERS } from "../../dist/parsers/cbs_napi.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const endpointsYaml = join(__dirname, "endpoints", "cbs_napi.yaml");
const schemasDir = join(__dirname, "schemas");
// The capture corpus lives outside the repo (the sdv-internal-refs checkout).
// Override its root with the SDV_REFS_ROOT env var; defaults to the author's
// local path. When the corpus is absent the script simply types nothing.
const REFS_ROOT = process.env.SDV_REFS_ROOT || "c:/Users/saiem/Documents/sdv-internal-refs";
const capturesRoot = join(REFS_ROOT, "cbs", "captures");
const napiDir = join(capturesRoot, "napi");

// Endpoint `short` -> a representative capture file (absolute path). CBS only
// captured 5 distinct resource families; everything else has no capture.
function findNapiCapture(suffixMatcher) {
  // Walk napi/<id>/ subdirs + napi/_discovery for the first file matching.
  // The capture corpus is external, so tolerate a missing directory; sort for
  // deterministic selection across platforms/filesystems.
  let subs;
  try {
    subs = readdirSync(napiDir).sort();
  } catch {
    return null; // no capture corpus present
  }
  for (const sub of subs) {
    const subPath = join(napiDir, sub);
    let entries;
    try {
      entries = readdirSync(subPath).sort();
    } catch {
      continue; // not a directory
    }
    for (const f of entries) {
      if (suffixMatcher(f)) return join(subPath, f);
    }
  }
  return null;
}

const CAPTURE_BY_SHORT = {
  league: findNapiCapture((f) => /^league_\d+_meta\.json$/.test(f)),
  season_teams: findNapiCapture((f) => /^season_\d+_teams\.json$/.test(f)),
  team_players: findNapiCapture((f) => /^team_\d+_players\.json$/.test(f)),
  team_standings: findNapiCapture((f) => /^team_\d+_standings\.json$/.test(f)),
  endpoint_registry: findNapiCapture((f) => /^resource_endpoint_registry\.json$/.test(f)),
};

// ---- helpers ---------------------------------------------------------------

function inferType(v) {
  if (typeof v === "boolean") return "logical";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  if (typeof v === "string") return "character";
  if (v === null || v === undefined) return "character";
  if (typeof v === "object") return "object"; // (parser stringifies arrays, but be safe)
  return "character";
}

function describe(name) {
  // Best-effort human description from the snake_cased key.
  const words = name
    .split("_")
    .map((w) => {
      const map = {
        id: "ID",
        url: "URL",
        abbr: "abbreviation",
        ytd: "year-to-date",
        rtwp: "real-time win probability",
        ts: "timestamp",
        uid: "UID",
      };
      return map[w] ?? w;
    })
    .join(" ");
  if (!words) return "";
  return words.charAt(0).toUpperCase() + words.slice(1) + ".";
}

/** Union of keys across rows (first `cap`), preserving first-seen order, with
 *  a representative non-null value per key for type inference. */
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

const HEADER = `# CBS NAPI returns schema — columns DERIVED from a captured live response run
# through the registered parser (parse_cbs_napi_*). The CBS NAPI OpenAPI spec
# ships no typed 200-response schema, so columns are not enumerable from the
# spec; they are enumerated here from a representative capture. \`type\` is
# inferred from the captured JS value; \`description\` is best-effort from the
# snake_cased key. Endpoints with no capture remain \`columns: []\`.
`;

function dumpYaml(short, columns) {
  let out = HEADER;
  out += `schema: ${short}\n`;
  out += `kind: dataframe\n`;
  out += `columns:\n`;
  for (const c of columns) {
    out += `- name: ${c.name}\n`;
    out += `  type: ${c.type}\n`;
    // descriptions are plain ASCII words + a period; no YAML escaping needed,
    // but quote defensively if a colon/# sneaks in.
    const d = c.description ?? "";
    const needsQuote = /[:#]/.test(d);
    out += `  description: ${needsQuote ? JSON.stringify(d) : d}\n`;
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
    emptyReasons.push(`${short}: schema file missing (${returns_schema})`);
    continue;
  }
  // Only touch currently-empty schemas.
  const existing = parse(readFileSync(schemaFile, "utf8"));
  const alreadyTyped = Array.isArray(existing?.columns) && existing.columns.length > 0;
  if (alreadyTyped) continue;

  const capPath = CAPTURE_BY_SHORT[short];
  if (!capPath || !existsSync(capPath)) {
    leftEmpty++;
    emptyReasons.push(`${short}: no capture`);
    continue;
  }
  const parseFn = CBS_NAPI_PARSERS[parser];
  if (!parseFn) {
    leftEmpty++;
    emptyReasons.push(`${short}: parser ${parser} not found`);
    continue;
  }
  // Guard per-capture: a malformed JSON file or a parser throwing must not abort
  // the whole run (the corpus is external + heterogeneous) — log + skip it.
  let rows;
  try {
    const payload = JSON.parse(readFileSync(capPath, "utf8"));
    rows = parseFn(payload);
  } catch (err) {
    leftEmpty++;
    emptyReasons.push(`${short}: capture parse/parser error (${err.message})`);
    continue;
  }
  if (!rows || rows.length === 0) {
    leftEmpty++;
    emptyReasons.push(`${short}: parser yielded 0 rows`);
    continue;
  }
  const columns = deriveColumns(rows);
  if (columns.length === 0) {
    leftEmpty++;
    emptyReasons.push(`${short}: 0 columns derived`);
    continue;
  }
  writeFileSync(schemaFile, dumpYaml(short, columns));
  typed++;
  console.log(
    `  typed ${short.padEnd(30)} <- ${capPath.replace(capturesRoot + "/", "")} (${rows.length} rows, ${columns.length} cols)`
  );
}

console.log("");
console.log(`CBS NAPI enrichment: ${typed} schemas typed, ${leftEmpty} left empty (of 82 total).`);
console.log("Left empty (no capture / 0 rows):");
for (const r of emptyReasons) console.log(`  - ${r}`);

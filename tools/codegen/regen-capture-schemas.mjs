// Regenerate the JS-owned returns schemas of the fox / cbs / yahoo / yahoo_scores
// families from the committed REAL captures: the parity manifest
// (test/fixtures/py/manifest.yaml, sections cbs / fox / yahoo) maps each capture to
// its endpoint short; every listed endpoint's registered parser runs on its
// capture(s) and the union of the row keys (first-seen order, types inferred from
// the values) becomes the schema's columns. A schema's JS-owned `description`
// text is preserved by column name. An endpoint of these families with no capture
// is marked `unverified:` (the docs then say so) unless it already carries no
// columns. Never hand-type a column: a capture is the only source.
//
//   npm run build && node tools/codegen/regen-capture-schemas.mjs          # write
//   node tools/codegen/regen-capture-schemas.mjs --check                    # gate
//
// test/parsers/capture-schema-agreement.test.js holds every schema to the parser
// on the same captures (column set + value types), so a parser change that moves
// a column fails there until this is re-run.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse, stringify } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");
const schemasDir = join(here, "schemas");
const fixturesDir = join(repoRoot, "test", "fixtures");

/** The families whose schemas are JS-owned and capture-derived. */
export const CAPTURE_FAMILIES = ["fox", "cbs", "yahoo", "yahoo_scores"];

/**
 * Endpoints whose schema was written for the parser output BEFORE the 4.0.0 port to
 * sdv-py's row builders and that no committed capture can confirm: marked
 * `unverified` (ClaudeCowork/notes/sdv-js-overhaul/followups.md). Every other
 * capture-less schema (the yahoo `parse_yahoo_list` ones derived from the OpenAPI
 * spec, the empty `columns: []` ones) is left alone.
 */
export const STALE_NO_CAPTURE = {
  fox: [
    "event_odds", "event_recap", "event_standings", "explore_browse", "explore_odds", "league_odds",
    "league_playernews", "league_schedule", "league_scores", "league_stats", "league_stats_con",
    "league_teamnav", "scoreboard", "team_gamelog", "team_header", "team_standings", "team_stats",
    "trending_articles",
  ],
  yahoo: [
    "game_stats_leaders", "league_stats_by_team", "league_stats_individual", "league_stats_weekly",
    "league_stats_overview", "team_stats_leaders_v2",
    "season_stats_football_defense_ncaaf", "season_stats_football_kicking_ncaaf",
    "season_stats_football_punting_ncaaf", "season_stats_football_receiving_ncaaf",
    "season_stats_football_returns_ncaaf", "season_stats_football_rushing_ncaaf",
    "season_team_stats_football_defense", "season_team_stats_football_kicking",
    "season_team_stats_football_kickoffs", "season_team_stats_football_offense",
    "season_team_stats_football_passing", "season_team_stats_football_passing_defense",
    "season_team_stats_football_punting", "season_team_stats_football_receiving",
    "season_team_stats_football_receiving_defense", "season_team_stats_football_returns",
    "season_team_stats_football_rushing", "season_team_stats_football_rushing_defense",
  ],
};

/**
 * family -> { short -> [capture paths relative to test/fixtures] }: the parity
 * manifest's cbs / fox / yahoo sections, plus the yahoo_scores family, whose
 * `boxscore` / `scoreboard` read the same editorial captures as yahoo's
 * `editorial_boxscore` / `editorial_scoreboard`.
 */
export function captureMap() {
  const manifest = parse(readFileSync(join(fixturesDir, "py", "manifest.yaml"), "utf8"));
  const out = {};
  for (const fam of ["cbs", "fox", "yahoo"]) {
    out[fam] = {};
    for (const [file, short] of Object.entries(manifest[fam] ?? {})) (out[fam][short] ??= []).push(file);
  }
  out.yahoo_scores = {
    boxscore: out.yahoo.editorial_boxscore ?? [],
    scoreboard: out.yahoo.editorial_scoreboard ?? [],
  };
  return out;
}

/** The endpoints of a family: `[{ short, parser, returns_schema }]`. */
export function familyEndpoints(family) {
  const doc = parse(readFileSync(join(here, "endpoints", `${family}.yaml`), "utf8"));
  return doc.endpoints.map((e) => ({ short: e.short, parser: e.parser, ref: e.returns_schema }));
}

/** The schema type of a JS value (the corpus's R-ish vocabulary). */
export function valueType(v) {
  if (typeof v === "boolean") return "logical";
  if (typeof v === "bigint") return "integer";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "double";
  if (typeof v === "string") return "character";
  return null; // null / undefined: no evidence
}

/** Widen two observed types (integer + double -> double; anything + character -> character). */
function widen(a, b) {
  if (!a) return b;
  if (!b || a === b) return a;
  if (new Set([a, b]).has("character")) return "character";
  if (new Set([a, b]).has("double")) return "double";
  return "character";
}

/** The columns a parser's rows show: `[{ name, type }]` in first-seen order (null-only -> character). */
export function columnsOf(rowsPerCapture) {
  const types = new Map();
  for (const rows of rowsPerCapture) {
    for (const row of rows) {
      for (const [k, v] of Object.entries(row)) {
        if (!types.has(k)) types.set(k, null);
        types.set(k, widen(types.get(k), valueType(v)));
      }
    }
  }
  return [...types].map(([name, type]) => ({ name, type: type ?? "character" }));
}

/** The corpus style: sequences at the parent indent (`- name:` under `columns:`). */
const YAML_OPTS = { indent: 2, indentSeq: false, lineWidth: 0 };

const HEADER = (family, short, files) =>
  `# ${family} returns schema (JS-owned): columns derived from the registered parser's rows on\n` +
  `# the committed real capture(s) ${files.join(", ")} by\n` +
  `# tools/codegen/regen-capture-schemas.mjs. Types are inferred from the captured values;\n` +
  `# \`description\` is JS-owned text kept across regeneration (blanks fill at render time from\n` +
  `# sdv-py's manual_column_descriptions.yaml). Do not hand-type columns: re-run the script.\n`;

async function main() {
  const check = process.argv.includes("--check");
  const { parserFor } = await import(pathToFileURL(join(repoRoot, "dist", "parsers", "_registry.js")).href);
  const { MULTI_TABLE_SECTIONS } = await import(pathToFileURL(join(repoRoot, "dist", "parsers", "_frames.js")).href);
  const map = captureMap();
  let drift = 0;
  let written = 0;
  // A schema file shared by two endpoints (yahoo.editorial_boxscore and
  // yahoo_scores.boxscore both read native/yahoo_scores/boxscore) is written once,
  // from the union of both endpoints' captures, so the check is stable.
  const done = new Set();
  for (const family of CAPTURE_FAMILIES) {
    for (const ep of familyEndpoints(family)) {
      if (!ep.ref || !ep.parser || done.has(ep.ref)) continue;
      done.add(ep.ref);
      const file = join(schemasDir, `${ep.ref}.yaml`);
      const old = existsSync(file) ? parse(readFileSync(file, "utf8")) ?? {} : {};
      const files = [
        ...new Set(
          CAPTURE_FAMILIES.flatMap((fam) =>
            familyEndpoints(fam)
              .filter((e) => e.ref === ep.ref)
              .flatMap((e) => map[fam]?.[e.short] ?? [])
          )
        ),
      ];
      let next;
      if (files.length) {
        const fn = parserFor(ep.parser);
        if (!fn) throw new Error(`${family}.${ep.short}: parser ${ep.parser} is not registered`);
        const rows = files.map((f) => {
          const raw = JSON.parse(readFileSync(join(fixturesDir, f), "utf8"));
          const out = ep.parser in MULTI_TABLE_SECTIONS ? fn(raw, undefined) : fn(raw);
          if (!Array.isArray(out)) throw new Error(`${family}.${ep.short}: ${ep.parser} returned tables, not rows`);
          return out;
        });
        const keep = new Map((old.columns ?? []).map((c) => [c.name, c.description]));
        const columns = columnsOf(rows).map((c) => ({ ...c, description: keep.get(c.name) || "" }));
        next =
          HEADER(family, ep.short, files) +
          stringify({ schema: old.schema ?? ep.ref.split("/").pop(), kind: "dataframe", columns }, YAML_OPTS);
      } else if (STALE_NO_CAPTURE[family]?.includes(ep.short) && !old.unverified) {
        // written for the pre-port output and no capture to confirm them: the columns stay
        // on file for reference, but the docs render the note instead of the table
        next =
          (existsSync(file) ? readFileSync(file, "utf8").match(/^(?:#[^\n]*\n)*/)[0] : "") +
          stringify(
            {
            schema: old.schema ?? ep.ref.split("/").pop(),
            kind: "dataframe",
            unverified:
              `these columns were written for ${ep.parser}'s output before it was ported to sdv-py's ` +
              `row builders (4.0.0) and no committed capture of this endpoint confirms them ` +
              `(tools/codegen/regen-capture-schemas.mjs)`,
            columns: old.columns ?? [],
          }, YAML_OPTS);
      } else {
        continue; // spec-derived or already empty / unverified: a capture is the only thing that could change it
      }
      const current = existsSync(file) ? readFileSync(file, "utf8") : "";
      if (current === next) continue;
      if (check) {
        console.error(`DRIFT: ${file} — run \`node tools/codegen/regen-capture-schemas.mjs\``);
        drift++;
      } else {
        writeFileSync(file, next);
        written++;
        console.log(`wrote ${file}`);
      }
    }
  }
  console.log(check ? `regen-capture-schemas: ${drift} stale` : `regen-capture-schemas: ${written} written`);
  if (check && drift) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

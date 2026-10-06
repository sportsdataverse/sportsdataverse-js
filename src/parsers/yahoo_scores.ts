// Yahoo Sports editorial API (api-secure.sports.yahoo.com/v1/editorial/s)
// flat-API parsers: a port of sdv-py's `parse_yahoo_editorial`
// (sportsdataverse/yahoo/yahoo_shangrila_parsers.py), verified cell by cell
// against its output on the committed captures (test/parsers/parity.test.js).
// Same contract as src/parsers/cbs.ts / fox.ts / mlb.ts:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - columns are `pandas.json_normalize(sep="_")`-flattened and snake_cased
//     exactly as sdv-py names them (`pyFrame`, src/parsers/yahoo.ts).
//
// Editorial envelope: `{ service: { "xml:lang": ..., <root>: { <collection>:
// { <id>: <entry> } } } }` — `root` is `scoreboard` or `boxscore`, each
// collection a map keyed by a dotted Yahoo id (`ncaaf.g.202509200023`). sdv-py
// returns one frame per collection, the map key surfaced as `entity_id`; an entry
// that is itself an id-keyed map (`player_stats` -> stat variation) is one row per
// sub-entry with the sub-key in `sub_id`. A JS parser returns one frame, so the
// two routed parsers pick the collection their endpoint is about —
// `parse_yahoo_scores_scoreboard` the `games`, `parse_yahoo_scores_boxscore`
// the `player_stats` — and the generic `parse_yahoo_scores_list` the first.

import type { ParserRow } from "../core/types.js";
import { isPlainObject, underscore } from "./_normalize.js";
import { pyFrame } from "./yahoo.js";

/** sdv-py's `_is_id_map`: a non-empty object whose every value is an object. */
const isIdMap = (entry: unknown): entry is Record<string, Record<string, unknown>> =>
  isPlainObject(entry) && Object.keys(entry).length > 0 && Object.values(entry).every(isPlainObject);

/** sdv-py's row build for one id-keyed collection (`{ <id>: <entry> }`). */
function collectionRows(collection: Record<string, unknown>): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const [entity_id, entry] of Object.entries(collection)) {
    if (isIdMap(entry)) {
      for (const [sub_id, rec] of Object.entries(entry)) rows.push({ entity_id, sub_id, ...rec });
    } else if (isPlainObject(entry)) {
      rows.push({ entity_id, ...entry });
    } else if (Array.isArray(entry)) {
      for (const item of entry) rows.push(isPlainObject(item) ? { entity_id, ...item } : { entity_id, value: item });
    } else {
      rows.push({ entity_id, value: entry });
    }
  }
  return rows;
}

/**
 * `underscore(collection name) -> its map` for every object-valued collection of
 * the envelope's root (the first object under `service` other than `xml:lang`),
 * in payload order. Empty for a malformed envelope.
 */
function collections(raw: unknown): Map<string, Record<string, unknown>> {
  const out = new Map<string, Record<string, unknown>>();
  const service = isPlainObject(raw) ? raw.service : undefined;
  if (!isPlainObject(service)) return out;
  const root = Object.entries(service).find(([k, v]) => k !== "xml:lang" && isPlainObject(v))?.[1];
  if (!isPlainObject(root)) return out;
  for (const [name, collection] of Object.entries(root)) {
    if (isPlainObject(collection)) out.set(underscore(name), collection);
  }
  return out;
}

/** The frame of one collection: `[]` when the envelope lacks it or it is empty. */
const frame = (raw: unknown, name: string): ParserRow[] => {
  const collection = collections(raw).get(name);
  return collection ? pyFrame(collectionRows(collection)) : [];
};

/**
 * Generic editorial parser (catch-all): the FIRST collection of the envelope's
 * root as sdv-py frames it (`games` of a scoreboard, `player_stats` of a
 * boxscore). Returns `[]` when empty / malformed.
 */
export function parse_yahoo_scores_list(raw: unknown): ParserRow[] {
  const first = collections(raw).keys().next();
  return first.done ? [] : frame(raw, first.value);
}

/**
 * Parse the editorial scoreboard into one row per game: sdv-py's `games` frame.
 * `service.scoreboard.games.<id>` is a map keyed by game id; the key becomes
 * `entity_id`, nested `navigation_links` / `provider_coverage` blocks flatten to
 * `navigation_links_*` / `provider_coverage_*`, list-valued fields
 * (`game_periods`, the data-island paths) are JSON-encoded. Returns `[]` when the
 * map is empty / absent / malformed.
 */
export function parse_yahoo_scores_scoreboard(raw: unknown): ParserRow[] {
  return frame(raw, "games");
}

/**
 * Parse the editorial boxscore into one row per player stat line: sdv-py's
 * `player_stats` frame. `service.boxscore.player_stats.<player id>.<stat
 * variation>` is two id-keyed levels: `entity_id` (`ncaaf.p.457863`), `sub_id`
 * (`ncaaf.stat_variation.2`), then one column per stat type
 * (`ncaaf.stat_type.102` -> `ncaaf_stat_type_102`), values as Yahoo ships them
 * (strings). Returns `[]` when the map is empty / absent / malformed.
 */
export function parse_yahoo_scores_boxscore(raw: unknown): ParserRow[] {
  return frame(raw, "player_stats");
}

/**
 * Endpoint (parser name) -> parser. Mirrors the Python-side registries; keyed by
 * the parser function name the YAML references. Registered in
 * src/parsers/_registry.ts.
 */
export const YAHOO_SCORES_PARSERS = {
  parse_yahoo_scores_list,
  parse_yahoo_scores_scoreboard,
  parse_yahoo_scores_boxscore,
};

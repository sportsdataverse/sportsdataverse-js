// Fox Sports API (api.foxsports.com/bifrost/v1) flat-API parsers: a faithful
// port of sdv-py's `fox/fox_api_parsers.py` + the row builders in
// `_fox_layout.py` (parse_segment_events / parse_standings / parse_polls /
// parse_nav_items / parse_header / parse_search_results / parse_trending /
// parse_roster), same contract as src/parsers/cbs.ts / mlb.ts:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing;
//   - ids are decimal strings (the v4 id rule, src/core/int64.ts).
//
// Bifrost is a layout API (sections -> tables -> rows -> cells), so a handful
// of row builders cover the whole family. Each public parser follows sdv-py's
// `_dedicated(builder)` pattern: run the dedicated builder(s); when none yields
// a row, fall back to the generic flattener (`parse_fox_api` in sdv-py: the
// LARGEST list of records anywhere in the payload, each record deep-flattened
// with `_`-joined `underscore`d keys and list cells JSON-encoded).
//
// sdv-py maps several of its parsers onto one JS parser (tools/codegen/
// vendor.yaml), so a JS parser cascades through the builders sdv-py would pick
// per endpoint; each step is gated on a shape marker so a payload never lands
// on the wrong builder (verified against every sdv-py fox fixture):
//   parse_fox_list      nav -> trending -> header (`template: entity-header`;
//                       a playernews shell also has a `title`) -> scorechip
//                       (top-level `id`) -> generic
//   parse_fox_standings polls (a `table-polls` table) -> standings -> generic
//   parse_fox_scoreboard / _team_roster / _search: one builder -> generic
//   parse_fox_event     generic (sdv-py: event_data / event_matchup are
//                       `parse_fox_api`)

import { idColumnsToStrings } from "../core/int64.js";
import { isPlainObject, underscore } from "./_normalize.js";
import type { ParserRow } from "../core/types.js";

type Row = Record<string, any>;
type Builder = (raw: Row) => Row[];

// ---- sdv-py `_fox_layout` helpers ----------------------------------------

/** `_cells`: a Bifrost cell list -> its `text` values (a bare scalar cell is kept). */
const cells = (columns: any): any[] =>
  (Array.isArray(columns) ? columns : []).map((c) => (isPlainObject(c) ? (c as Row).text ?? null : c));

/** `_uri_id`: the trailing digits of a Bifrost content uri (`football/nfl/teams/22` -> `"22"`). */
function uriId(uri: unknown): string | null {
  if (!uri || typeof uri !== "string") return null;
  const m = /(\d+)$/.exec(uri);
  return m ? m[1] : null;
}

/** `_clean`: a header label -> a column name (`W-L-T` -> `w_l_t`; blank -> `v`). */
const clean = (name: unknown): string =>
  String(name)
    .replace(/[^\p{L}\p{N}_]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "v";

const nil = (v: unknown): boolean => v === null || v === undefined;
const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Row => (isPlainObject(v) ? (v as Row) : {});

/** `_table_rows`: a Bifrost table `{headers, rows}` -> wide rows (+ `entity_id`). */
function tableRows(tbl: unknown, extra: Row = {}): Row[] {
  if (!tbl || !isPlainObject(tbl)) return [];
  const t = tbl as Row;
  const headers = cells(obj(list(t.headers)[0]).columns);
  const names = headers.map((h, i) => (nil(h) || h === "" ? `v${i}` : clean(h)));
  const out: Row[] = [];
  for (const r of list(t.rows)) {
    const row: Row = { ...extra };
    const vals = cells(obj(r).columns);
    for (let i = 0; i < Math.min(names.length, vals.length); i++) row[names[i]] = vals[i];
    row.entity_id = uriId(obj(obj(r).entityLink).contentUri);
    out.push(row);
  }
  return out;
}

/** `_full_team_name`: a scoreboard team block -> `"Location Nickname"`. */
function fullTeamName(team: Row | null): string | null {
  if (!team) return null;
  const stacked = `${team.stackedNameTop || ""} ${team.stackedNameBottom || ""}`.trim();
  return stacked || team.longName || team.name || null;
}

// ---- row builders (sdv-py `_fox_layout.parse_*`) --------------------------

/** `parse_segment_events`: scores-segment / topevents segment -> one row per game. */
function segmentEvents(raw: Row): Row[] {
  const rows: Row[] = [];
  for (const sec of list(raw.sectionList)) {
    const s = obj(sec);
    const events = [...list(s.events)];
    for (const mod of list(s.modules)) events.push(...list(obj(obj(mod).model).events));
    for (const e of events) {
      const ev = obj(e);
      const tokens = obj(obj(obj(ev.entityLink).layout).tokens);
      const homeUri = tokens.homeUri;
      const awayUri = tokens.awayUri;
      const upper = obj(ev.upperTeam);
      const lower = obj(ev.lowerTeam);
      const byUri = new Map<string, Row>();
      for (const t of [upper, lower]) if (t.uri) byUri.set(t.uri, t);
      // explicit home/away uri wins; else the US convention (away on top).
      const home = homeUri ? byUri.get(homeUri) ?? null : lower;
      const away = awayUri ? byUri.get(awayUri) ?? null : upper;
      rows.push({
        segment_id: null,
        section_id: s.id ?? null,
        section_title: s.title ?? null,
        game_id: tokens.id || uriId(ev.contentUri),
        chip_id: ev.id ?? null,
        league: ev.league ?? null,
        date: ev.eventTime ?? null,
        event_status: ev.eventStatus ?? null,
        status: ev.statusLine ?? null,
        tv_station: ev.tvStation ?? null,
        headline: ev.eventHeadline ?? null,
        odds_line: ev.oddsLine ?? null,
        over_under_line: ev.overUnderLine ?? null,
        home_team: fullTeamName(home),
        home_team_id: uriId(homeUri) || uriId(home?.uri),
        home_score: home?.score ?? null,
        home_record: home?.record ?? null,
        away_team: fullTeamName(away),
        away_team_id: uriId(awayUri) || uriId(away?.uri),
        away_score: away?.score ?? null,
        away_record: away?.record ?? null,
      });
    }
  }
  return rows;
}

/** `parse_standings`: `standingsSections[].standings[]` tables -> wide rows, one per team. */
function standings(raw: Row): Row[] {
  const rows: Row[] = [];
  for (const sec of list(raw.standingsSections)) {
    const s = obj(sec);
    for (const tbl of list(s.standings)) rows.push(...tableRows(tbl, { section: s.title ?? null }));
  }
  return rows;
}

const MOVE_SIGN: Record<string, number> = { up: 1, down: -1 };

/** `parse_polls`: standings rows plus `team` (the `cell-entity` cell) and the signed `rank_change`. */
function polls(raw: Row): Row[] {
  const rows: Row[] = [];
  for (const sec of list(raw.standingsSections)) {
    const s = obj(sec);
    for (const tbl of list(s.standings)) {
      if (!tbl || !isPlainObject(tbl)) continue;
      const t = tbl as Row;
      const templates = list(obj(list(t.headers)[0]).columns).map((c) => (isPlainObject(c) ? (c as Row).template : null));
      const ent = templates.indexOf("cell-entity");
      const chg = templates.indexOf("cell-change");
      const built = tableRows(t, { section: s.title ?? null });
      const raws = list(t.rows);
      for (let i = 0; i < Math.min(built.length, raws.length); i++) {
        const row = built[i];
        const cols = list(obj(raws[i]).columns).map((c) => (isPlainObject(c) ? (c as Row) : { text: c }));
        const cell = chg >= 0 && chg < cols.length ? cols[chg] : {};
        const sign = MOVE_SIGN[cell.subType || ""];
        const text = cell.text;
        if (ent >= 0 && ent < cols.length) row.team = cols[ent].text ?? null;
        if (!("team" in row)) row.team = null;
        const decimal = typeof text === "string" && /^\d+$/.test(text) ? text : null;
        row.rank_change = sign && decimal ? sign * Number(decimal) : null;
        rows.push(row);
      }
    }
  }
  return rows;
}

/** `parse_nav_items`: teamnav `navItems` / conferences + browse `groups[].items` -> one row per entity. */
function navItems(raw: Row): Row[] {
  const buckets: [string | null, any[]][] = [[null, list(raw.navItems)]];
  for (const g of list(raw.groups)) buckets.push([obj(obj(g).header).title ?? null, list(obj(g).items)]);
  const rows: Row[] = [];
  for (const [group, items] of buckets) {
    for (const i of items) {
      const it = obj(i);
      const link = obj(it.entityLink);
      rows.push({
        group,
        fox_id: uriId(link.contentUri),
        abbreviation: it.title ?? null,
        name: link.title || it.imageAltText || null,
        content_uri: link.contentUri ?? null,
        content_type: link.contentType ?? null,
        web_url: link.webUrl || it.webUrl || null,
        color: link.color ?? null,
        logo_url: it.logoUrl ?? null,
      });
    }
  }
  return rows;
}

/** `parse_header`: league / team entity header -> a single summary row. */
function header(raw: Row): Row[] {
  if (!(raw.title || raw.contentUri)) return [];
  const details = list(raw.details)
    .filter(isPlainObject)
    .map((d) => (d as Row).text)
    .filter((d) => d);
  return [
    {
      template: raw.template ?? null,
      title: raw.title ?? null,
      entity_id: uriId(raw.contentUri),
      content_uri: raw.contentUri ?? null,
      content_type: raw.contentType ?? null,
      color: raw.color ?? null,
      logo_url: raw.logoUrl ?? null,
      image_alt_text: raw.imageAltText ?? null,
      rank: raw.rank ?? null,
      details: details.map(String).join(" · ") || null,
    },
  ];
}

/** `parse_search_results`: search content / entities / popular -> one row per result component. */
function searchResults(raw: Row): Row[] {
  const rows: Row[] = [];
  for (const r of list(raw.results)) {
    const res = obj(r);
    for (const c of list(res.components)) {
      const comp = obj(c);
      const model = obj(comp.model);
      rows.push({
        group: res.title ?? null,
        type: comp.type ?? null,
        entity_id: uriId(model.contentUri),
        title: model.title ?? null,
        subtitle: model.subtitle ?? null,
        content_type: model.contentType ?? null,
        content_uri: model.contentUri ?? null,
        web_url: model.webUrl ?? null,
        analytics_name: model.analyticsName ?? null,
        image_url: isPlainObject(model.image) ? (model.image as Row).url ?? null : null,
      });
    }
  }
  return rows;
}

/** `parse_trending`: trending articles / videos feed -> one row per CMS item. */
function trending(raw: Row): Row[] {
  const rows: Row[] = [];
  for (const i of list(obj(raw.data).results)) {
    const it = obj(i);
    let thumbUrl: unknown = null;
    if (isPlainObject(it.thumbnail)) {
      const thumb = it.thumbnail as Row;
      thumbUrl = thumb.url || (isPlainObject(thumb.content) ? (thumb.content as Row).url ?? null : null);
    }
    rows.push({
      id: it.id ?? null,
      spark_id: it.spark_id ?? null,
      title: it.title ?? null,
      description: it.description || it.dek || it.meta_description || null,
      content_type: it.content_type ?? null,
      component_type: it.component_type ?? null,
      publication_date: it.publication_date ?? null,
      last_published_date: it.last_published_date ?? null,
      canonical_url: it.canonical_url ?? null,
      thumbnail_url: thumbUrl ?? null,
      playback_url: it.playback_url ?? null,
    });
  }
  return rows;
}

/** `parse_roster` (minus `team_id`): roster `groups[]` tables -> one row per athlete. */
function roster(raw: Row): Row[] {
  const rows: Row[] = [];
  for (const g of list(raw.groups)) {
    const grp = obj(g);
    const headers = cells(obj(list(grp.headers)[0]).columns);
    const groupLabel = grp.title || (headers.length ? headers[0] : null);
    const names = ["player", ...headers.slice(1).map((h) => (nil(h) ? "none" : String(h).toLowerCase()))];
    for (const r of list(grp.rows)) {
      const uri = obj(obj(r).entityLink).contentUri;
      if (!uri || typeof uri !== "string" || !uri.includes("athletes/")) continue; // players only
      const vals = cells(obj(r).columns);
      const row: Row = { position_group: groupLabel ?? null };
      for (let i = 0; i < Math.min(names.length, vals.length); i++) row[names[i]] = vals[i];
      row.athlete_id = uriId(uri);
      rows.push(row);
    }
  }
  return rows;
}

/** `parse_fox_api_scorechip`: one game chip -> one flattened row, only when the body carries an `id`. */
const scorechip = (raw: Row): Row[] => (raw.id ? [flatten(raw)] : []);

// ---- generic flattener (sdv-py `parse_fox_api`) ---------------------------

/** `_flatten`: nested objects joined with `_` (each segment `underscore`d), lists JSON-encoded. */
function flatten(rec: Row, prefix = "", out: Row = {}): Row {
  for (const [k, v] of Object.entries(rec)) {
    const key = `${prefix}${underscore(String(k))}`;
    if (isPlainObject(v)) flatten(v as Row, `${key}_`, out);
    else if (Array.isArray(v)) out[key] = JSON.stringify(v);
    else out[key] = v;
  }
  return out;
}

/** `_largest_record_list`: breadth-first search for the longest list of objects anywhere in `payload`. */
function largestRecordList(payload: unknown): Row[] {
  let best: Row[] = [];
  const queue: unknown[] = [payload];
  while (queue.length) {
    const node = queue.shift();
    if (isPlainObject(node)) queue.push(...Object.values(node as Row));
    else if (Array.isArray(node)) {
      const recs = node.filter(isPlainObject) as Row[];
      if (recs.length > best.length) best = recs;
      queue.push(...recs);
    }
  }
  return best;
}

/** `_homogenize`: a column mixing JS types (polars refuses one) is stringified, py `str()` style. */
function homogenize(rows: Row[]): Row[] {
  const kinds = new Map<string, Set<string>>();
  for (const r of rows) {
    for (const [k, v] of Object.entries(r)) {
      if (v === null || v === undefined) continue;
      if (!kinds.has(k)) kinds.set(k, new Set());
      kinds.get(k)!.add(typeof v);
    }
  }
  const toStr = new Set([...kinds].filter(([, t]) => t.size > 1).map(([k]) => k));
  if (!toStr.size) return rows;
  const str = (v: unknown): unknown =>
    v === null || v === undefined ? v : typeof v === "boolean" ? (v ? "True" : "False") : String(v);
  return rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, toStr.has(k) ? str(v) : v])));
}

/** sdv-py `parse_fox_api`: one row per record of the largest record list; `[]` when there is none. */
function generic(raw: unknown): ParserRow[] {
  try {
    return idColumnsToStrings(homogenize(largestRecordList(raw).map((r) => flatten(r)))) as ParserRow[];
  } catch {
    return [];
  }
}

/** sdv-py `_dedicated`: the first builder yielding rows wins, else the generic flattener. */
function dedicated(raw: unknown, ...builders: Builder[]): ParserRow[] {
  if (isPlainObject(raw)) {
    for (const b of builders) {
      let rows: Row[] = [];
      try {
        rows = b(raw as Row);
      } catch {
        rows = [];
      }
      if (rows.length) return idColumnsToStrings(rows) as ParserRow[];
    }
  }
  return generic(raw);
}

// ---- public parsers ---------------------------------------------------------

/**
 * Generic parser for any Fox module payload (the DEFAULT for most fox
 * endpoints). Cascades through the sdv-py builders that map to it — nav
 * (`parse_fox_api_nav`: teamnav / conferences / explore-browse, one row per
 * entity), trending (`parse_fox_api_trending`: one row per CMS item), header
 * (`parse_fox_api_header`: an `entity-header` shell -> one descriptive row),
 * scorechip (`parse_fox_api_scorechip`: a body with an `id` -> one flat row) —
 * then the generic largest-record-list flattener (`parse_fox_api`). Returns
 * `[]` for empty / unrecognized payloads.
 */
export function parse_fox_list(raw: any): ParserRow[] {
  return dedicated(
    raw,
    navItems,
    trending,
    (r) => (r.template === "entity-header" ? header(r) : []),
    scorechip
  );
}

/**
 * Parse the scoreboard / scores / schedule family into one row per game
 * (sdv-py `parse_fox_api_events`): `sectionList[].events[]` (scores-segment,
 * topevents segment) and `sectionList[].modules[].model.events[]` (explore
 * odds) are unrolled to `game_id` / `home_*` / `away_*` rows; any other shape
 * (a `selectionGroupList` scoreboard shell) falls back to the generic
 * flattener. Returns `[]` when empty.
 */
export function parse_fox_scoreboard(raw: any): ParserRow[] {
  return dedicated(raw, segmentEvents);
}

/**
 * Parse the standings / polls family into one row per team (sdv-py
 * `parse_fox_api_standings` / `parse_fox_api_polls`): `standingsSections[]
 * .standings[]` tables are widened by header label (a blank header is `v<i>`,
 * `entity_id` from the row's entity link, `section` the section title). A
 * `table-polls` table additionally carries `team` (the `cell-entity` cell) and
 * the signed `rank_change`. Falls back to the generic flattener for
 * un-sectioned payloads (`league_stats_con`). Returns `[]` when empty.
 */
export function parse_fox_standings(raw: any): ParserRow[] {
  return dedicated(
    raw,
    (r) => (list(r.standingsSections).some((s) => list(obj(s).standings).some((t) => obj(t).template === "table-polls")) ? polls(r) : []),
    standings
  );
}

/**
 * Parse the event-data / matchup family (sdv-py `parse_fox_api`): the largest
 * list of records anywhere in the module shell (a pbp group's plays, a matchup's
 * featured-player news), each deep-flattened. Returns `[]` when empty.
 */
export function parse_fox_event(raw: any): ParserRow[] {
  return generic(raw);
}

/**
 * Parse the team-roster family into one row per athlete (sdv-py
 * `parse_fox_api_roster`): every `groups[]` table row whose entity link is an
 * athlete, as `position_group` + the header-named cells (`player`, `pos`,
 * `age`, ...) + `athlete_id`. Falls back to the generic flattener. Returns `[]`
 * when empty.
 */
export function parse_fox_team_roster(raw: any): ParserRow[] {
  return dedicated(raw, roster);
}

/**
 * Parse the search-results family into one row per hit (sdv-py
 * `parse_fox_api_search`): `results[].components[]` with the bucket title as
 * `group`, the component `model` fields and `entity_id`. Falls back to the
 * generic flattener. Returns `[]` when empty / malformed.
 */
export function parse_fox_search(raw: any): ParserRow[] {
  return dedicated(raw, searchResults);
}

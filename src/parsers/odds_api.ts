// The Odds API (api.the-odds-api.com) flat-API parsers. Each parser turns a raw
// JSON payload into tidy rectangular rows. Faithful port of the oddsapiR R
// package (R/toa_*.R) `tidyr::unnest(...)` tidying chains:
//
//   - return an array of flat row objects (the JS analogue of a tibble);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are deep-flattened (`_`) and snake_cased via `normalize`.
//
// The odds / event-odds / history families unroll the nested
// events[] -> bookmakers[] -> markets[] -> outcomes[] structure to ONE ROW PER
// OUTCOME (the `outcomes_*` columns), mirroring the R `unnest("bookmakers") ->
// unnest("markets") -> unnest("outcomes", names_sep = "_")` chain. The flat
// list endpoints (sports / events / scores / participants) flatten directly.

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Unroll an events array (each `{id, sport_key, sport_title, commence_time,
 * home_team, away_team, bookmakers: [...]}`) into one row per outcome.
 *
 * Mirrors the R chain `unnest("bookmakers") -> rename(bookmaker_key=key,
 * bookmaker=title, bookmaker_last_update=last_update) -> unnest("markets") ->
 * rename(market_key=key, market_last_update=last_update) -> unnest("outcomes",
 * names_sep="_")`. Events with no bookmakers / markets / outcomes contribute no
 * rows (an event with empty odds is dropped, matching `unnest`'s inner-join
 * semantics). `extra` columns (e.g. history snapshot timestamps) are prefixed
 * onto every emitted row.
 */
function unrollOutcomes(
  events: any[],
  extra: Record<string, any> = {}
): Record<string, any>[] {
  if (!Array.isArray(events)) return [];
  const rows: Record<string, any>[] = [];
  for (const ev of events) {
    if (!isPlainObject(ev)) continue;
    const { bookmakers, ...eventCols } = ev;
    for (const bm of bookmakers ?? []) {
      if (!isPlainObject(bm)) continue;
      const bookmakerCols = {
        bookmaker_key: bm.key,
        bookmaker: bm.title,
        bookmaker_last_update: bm.last_update,
      };
      for (const mk of bm.markets ?? []) {
        if (!isPlainObject(mk)) continue;
        const marketCols = {
          market_key: mk.key,
          market_last_update: mk.last_update,
        };
        for (const oc of mk.outcomes ?? []) {
          if (!isPlainObject(oc)) continue;
          // `outcomes_*` prefix matches the R `names_sep = "_"` on the
          // outcomes unnest (name -> outcomes_name, price -> outcomes_price).
          const outcomeCols: Record<string, any> = {};
          for (const [k, v] of Object.entries(oc)) outcomeCols[`outcomes_${k}`] = v;
          rows.push({ ...extra, ...eventCols, ...bookmakerCols, ...marketCols, ...outcomeCols });
        }
      }
    }
  }
  return normalize(rows);
}

/**
 * Parse `odds_api_sports()` into one row per sport (the bare top-level JSON
 * array from `/v4/sports`). Columns: key, group, title, description, active,
 * has_outrights.
 */
export function parse_odds_api_sports(raw: any): Record<string, any>[] {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}

/**
 * Parse `odds_api_sports_odds()` into one row per outcome.
 *
 * `/v4/sports/{sport_key}/odds` returns a bare array of event objects, each
 * `{..., bookmakers: [{..., markets: [{..., outcomes: [...]}]}]}`. Unrolled to
 * one row per outcome (`outcomes_name` / `outcomes_price` / `outcomes_point`).
 */
export function parse_odds_api_sports_odds(raw: any): Record<string, any>[] {
  return unrollOutcomes(raw);
}

/**
 * Parse `odds_api_sports_scores()` into one row per event (bare array of
 * `{id, sport_key, sport_title, commence_time, completed, home_team, away_team,
 * scores, last_update}`). The `scores` list cell is stringified by `normalize`.
 */
export function parse_odds_api_sports_scores(raw: any): Record<string, any>[] {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}

/**
 * Parse `odds_api_sports_events()` into one row per event (bare array of
 * `{id, sport_key, sport_title, commence_time, home_team, away_team}`, plus
 * `home_rotation`/`away_rotation` when requested).
 */
export function parse_odds_api_sports_events(raw: any): Record<string, any>[] {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}

/**
 * Parse `odds_api_sports_participants()` into one row per participant.
 *
 * `/v4/sports/{sport_key}/participants` returns a bare array of
 * `{id, full_name}`. The R wrapper echoes the queried `sport_key`; here the
 * caller has it, so the raw `{id, full_name}` rows are flattened directly.
 */
export function parse_odds_api_sports_participants(raw: any): Record<string, any>[] {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}

/**
 * Parse `odds_api_event_odds()` into one row per outcome.
 *
 * `/v4/sports/{sport_key}/events/{event_id}/odds` returns a SINGLE event object
 * (not an array) `{id, ..., bookmakers: [...]}`. Wrapped in a one-element array
 * and unrolled to one row per outcome (props add `outcomes_description`).
 */
export function parse_odds_api_event_odds(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  return unrollOutcomes([raw]);
}

/**
 * Parse `odds_api_event_markets()` into one row per (bookmaker, market).
 *
 * `/v4/sports/{sport_key}/events/{event_id}/markets` returns a SINGLE event
 * object `{id, ..., bookmakers: [{..., markets: [{key, last_update}]}]}`. Each
 * available market is a row (no `outcomes` to unroll for this endpoint).
 */
export function parse_odds_api_event_markets(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const { bookmakers, ...eventCols } = raw;
  const rows: Record<string, any>[] = [];
  for (const bm of bookmakers ?? []) {
    if (!isPlainObject(bm)) continue;
    const bookmakerCols = {
      bookmaker_key: bm.key,
      bookmaker: bm.title,
    };
    for (const mk of bm.markets ?? []) {
      if (!isPlainObject(mk)) continue;
      rows.push({
        ...eventCols,
        ...bookmakerCols,
        market_key: mk.key,
        market_last_update: mk.last_update,
      });
    }
  }
  return normalize(rows);
}

/**
 * Parse `odds_api_sports_odds_history()` into one row per outcome.
 *
 * `/v4/historical/sports/{sport_key}/odds` wraps the events under
 * `{timestamp, previous_timestamp, next_timestamp, data: [events...]}`. The
 * three snapshot timestamps are prefixed onto every emitted outcome row.
 */
export function parse_odds_api_sports_odds_history(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const extra = {
    timestamp: raw.timestamp,
    previous_timestamp: raw.previous_timestamp,
    next_timestamp: raw.next_timestamp,
  };
  return unrollOutcomes(raw.data ?? [], extra);
}

/**
 * Parse `odds_api_sports_events_history()` into one row per event.
 *
 * `/v4/historical/sports/{sport_key}/events` wraps the events under
 * `{timestamp, previous_timestamp, next_timestamp, data: [events...]}` (no
 * bookmakers to unroll). The snapshot timestamps are prefixed onto each event.
 */
export function parse_odds_api_sports_events_history(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const data = raw.data;
  if (!Array.isArray(data)) return [];
  const rows = data.map((ev: any) => ({
    timestamp: raw.timestamp,
    previous_timestamp: raw.previous_timestamp,
    next_timestamp: raw.next_timestamp,
    ...ev,
  }));
  return normalize(rows);
}

/**
 * Parse `odds_api_event_odds_history()` into one row per outcome.
 *
 * `/v4/historical/sports/{sport_key}/events/{event_id}/odds` wraps a SINGLE
 * event under `{timestamp, previous_timestamp, next_timestamp, data: {event}}`.
 * The event is unrolled to one row per outcome, with snapshot timestamps
 * prefixed onto every row.
 */
export function parse_odds_api_event_odds_history(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const extra = {
    timestamp: raw.timestamp,
    previous_timestamp: raw.previous_timestamp,
    next_timestamp: raw.next_timestamp,
  };
  const data = raw.data;
  // The historical event-odds endpoint nests a single event object under
  // `data` (not an array); wrap it so the shared unroller can consume it.
  const events = Array.isArray(data) ? data : isPlainObject(data) ? [data] : [];
  return unrollOutcomes(events, extra);
}

/**
 * Endpoint (parser name) -> parser. Mirrors the Python style registry but is
 * keyed by the *parser function name* the YAML references (the JS generator
 * threads `def.parser` straight through `parserFor`).
 */
export const ODDS_API_PARSERS = {
  parse_odds_api_sports,
  parse_odds_api_sports_odds,
  parse_odds_api_sports_scores,
  parse_odds_api_sports_events,
  parse_odds_api_sports_participants,
  parse_odds_api_event_odds,
  parse_odds_api_event_markets,
  parse_odds_api_sports_odds_history,
  parse_odds_api_sports_events_history,
  parse_odds_api_event_odds_history,
};

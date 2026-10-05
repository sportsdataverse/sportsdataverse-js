// Network wrappers for the HockeyTech analytics (py `_family.build_family`'s
// `<lg>_game_shifts`, `<lg>_player_toi`, `<lg>_game_corsi`). The maths lives in
// `./hockeytech.ts`; this file only fetches the feeds through the HockeyTech
// getter (so transport / retry / error vocabulary are the family's) and calls it.
//
// Fetch failures throw (`NoDataError` / `AssetFetchError`) — a failed fetch is never
// reported as an empty game.

import { AssetFetchError } from "../core/errors.js";
import { HOCKEYTECH_LEAGUES, hockeytechGetText, stripJsonp } from "../core/hockeytech_runtime.js";
import {
  enrich_pbp,
  game_corsi_rows,
  parse_pbp,
  parse_shifts,
  player_toi,
  type Row,
} from "./hockeytech.js";

type GameId = number | string;

const isObj = (v: unknown): v is Record<string, any> => v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * HockeyTech's recognised "this key has no access to this feed" reply: HTTP 200 with the
 * PLAIN-TEXT body `Feed type access denied.` (observed 2026-10-05: MJHL `gc/gamesummary`).
 * A league that never has the data is "nothing here" (py returns empty / blank for it), not a
 * failed fetch.
 */
const ACCESS_DENIED = /^\s*Feed type access denied\.?\s*$/i; // JS \s also covers a leading BOM (U+FEFF)

interface FeedSpec {
  /** Does the parsed body carry the feed's recognisable envelope? */
  ok: (payload: any) => boolean;
  what: string;
  /** What an access-denied reply stands for (an empty envelope). */
  denied: any;
}

/**
 * Fetch a feed and require its recognisable envelope. An unparseable body, an error
 * sentinel or any other structureless 200 is a FAILED fetch (unknown) -> `AssetFetchError`,
 * never "no data". The recognised access-denied reply and a present-but-empty envelope are
 * genuinely empty and give `[]` downstream. (The shared `hockeytechGet` collapses all of
 * these to `{}`, hence the raw-text fetch.)
 */
async function feed(league: string, f: string, view: string, gameId: GameId, spec: FeedSpec): Promise<any> {
  const text = await hockeytechGetText({ league, feed: f, view, game_id: gameId });
  if (text !== null && ACCESS_DENIED.test(text)) return spec.denied;
  let payload: any;
  try {
    payload = JSON.parse(stripJsonp(text ?? ""));
  } catch {
    payload = undefined;
  }
  if (!spec.ok(payload)) {
    throw new AssetFetchError(
      `HockeyTech ${league} ${f}/${view} game ${gameId}: response has no ${spec.what} structure (unparseable body or error sentinel)`,
      { url: `hockeytech:${league}/${f}/${view}?game_id=${gameId}` }
    );
  }
  return payload;
}

const shiftsFeed = (lg: string, id: GameId) =>
  feed(lg, "modulekit", "gameshifts", id, {
    ok: (p) => isObj(p) && isObj(p.SiteKit) && isObj(p.SiteKit.Gameshifts),
    what: "SiteKit.Gameshifts",
    denied: { SiteKit: { Gameshifts: {} } },
  });
const pbpFeed = (lg: string, id: GameId) =>
  feed(lg, "statviewfeed", "gameCenterPlayByPlay", id, {
    ok: (p) => Array.isArray(p),
    what: "play-by-play event list",
    denied: [],
  });
const metaFeed = (lg: string, id: GameId) =>
  feed(lg, "gc", "gamesummary", id, {
    ok: (p) => isObj(p) && isObj(p.GC),
    what: "GC.Gamesummary",
    denied: { GC: { Gamesummary: {} } },
  });

/** `<lg>_game_shifts`: one row per player-shift stint. */
export async function hockeytechShiftStints(league: string, gameId: GameId): Promise<Row[]> {
  return parse_shifts(await shiftsFeed(league, gameId), gameId);
}

/** `<lg>_player_toi`: per-player time-on-ice totals for a game. */
export async function hockeytechPlayerToi(league: string, gameId: GameId): Promise<Row[]> {
  return player_toi(await hockeytechShiftStints(league, gameId));
}

async function enriched(league: string, gameId: GameId): Promise<{ pbp: Row[]; shiftsPayload: any }> {
  const cfg = HOCKEYTECH_LEAGUES[league];
  const payload = await pbpFeed(league, gameId);
  const meta = await metaFeed(league, gameId);
  const shiftsPayload = await shiftsFeed(league, gameId);
  const pbp = enrich_pbp(parse_pbp(payload, cfg?.pbpStyle, gameId), league, gameId, {
    meta_payload: meta,
    shifts_payload: shiftsPayload,
  });
  return { pbp, shiftsPayload };
}

/** `<lg>_pbp` (public in py): one row per event with clock, coordinate, shot-geometry and on-ice columns. */
export async function hockeytechEnrichedPbp(league: string, gameId: GameId): Promise<Row[]> {
  return (await enriched(league, gameId)).pbp;
}

/** `<lg>_game_corsi`: player-level on-ice Corsi/Fenwick (proxies; no missed shots) + TOI + `corsi_for_per60`. */
export async function hockeytechGameCorsi(league: string, gameId: GameId): Promise<Row[]> {
  const { pbp, shiftsPayload } = await enriched(league, gameId);
  return game_corsi_rows(pbp, parse_shifts(shiftsPayload, gameId));
}

const toCamel = (s: string): string => s.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

/** The four per-league callables py's `build_family(league)` mints, keyed `<lg>_game_shifts` etc. */
export function buildHockeytechAnalytics(league: string): Record<string, (gameId: GameId) => Promise<Row[]>> {
  if (!HOCKEYTECH_LEAGUES[league]) throw new Error(`Unknown HockeyTech league ${JSON.stringify(league)}`);
  return {
    [`${league}_game_shifts`]: (gameId) => hockeytechShiftStints(league, gameId),
    [`${league}_pbp`]: (gameId) => hockeytechEnrichedPbp(league, gameId),
    [`${league}_player_toi`]: (gameId) => hockeytechPlayerToi(league, gameId),
    [`${league}_game_corsi`]: (gameId) => hockeytechGameCorsi(league, gameId),
  };
}

/** Every league's analytics callables (snake_case + camelCase aliases), for merging onto `sdv.hockeytech`. */
export function allHockeytechAnalytics(): Record<string, (gameId: GameId) => Promise<Row[]>> {
  const out: Record<string, (gameId: GameId) => Promise<Row[]>> = {};
  for (const lg of Object.keys(HOCKEYTECH_LEAGUES)) {
    for (const [name, fn] of Object.entries(buildHockeytechAnalytics(lg))) {
      out[name] = fn;
      out[toCamel(name)] = fn;
    }
  }
  return out;
}

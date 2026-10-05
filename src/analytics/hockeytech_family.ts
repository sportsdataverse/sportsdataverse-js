// Network wrappers for the HockeyTech analytics (py `_family.build_family`'s
// `<lg>_game_shifts`, `<lg>_player_toi`, `<lg>_game_corsi`). The maths lives in
// `./hockeytech.ts`; this file only fetches the feeds through the HockeyTech
// getter (so transport / retry / error vocabulary are the family's) and calls it.
//
// Fetch failures throw (`NoDataError` / `AssetFetchError`) — a failed fetch is never
// reported as an empty game.

import { HOCKEYTECH_LEAGUES, hockeytechGet } from "../core/hockeytech_runtime.js";
import {
  enrich_pbp,
  game_corsi_rows,
  parse_pbp,
  parse_shifts,
  player_toi,
  type Row,
} from "./hockeytech.js";

type GameId = number | string;

async function feed(league: string, f: string, view: string, gameId: GameId): Promise<any> {
  return hockeytechGet("", { params: { league, feed: f, view, game_id: gameId } });
}

/** `<lg>_game_shifts`: one row per player-shift stint. */
export async function hockeytechShiftStints(league: string, gameId: GameId): Promise<Row[]> {
  return parse_shifts(await feed(league, "modulekit", "gameshifts", gameId), gameId);
}

/** `<lg>_player_toi`: per-player time-on-ice totals for a game. */
export async function hockeytechPlayerToi(league: string, gameId: GameId): Promise<Row[]> {
  return player_toi(await hockeytechShiftStints(league, gameId));
}

/** `<lg>_pbp` (py's fully-enriched play-by-play): one row per event with clock, coordinate, shot-geometry and on-ice columns. */
export async function hockeytechEnrichedPbp(league: string, gameId: GameId): Promise<Row[]> {
  const cfg = HOCKEYTECH_LEAGUES[league];
  const payload = await feed(league, "statviewfeed", "gameCenterPlayByPlay", gameId);
  const meta = await feed(league, "gc", "gamesummary", gameId);
  const shifts = await feed(league, "modulekit", "gameshifts", gameId);
  const df = parse_pbp(payload, cfg?.pbpStyle, gameId);
  return enrich_pbp(df, league, gameId, { meta_payload: meta, shifts_payload: shifts });
}

/** `<lg>_game_corsi`: player-level on-ice Corsi/Fenwick (proxies; no missed shots) + TOI + `corsi_for_per60`. */
export async function hockeytechGameCorsi(league: string, gameId: GameId): Promise<Row[]> {
  const cfg = HOCKEYTECH_LEAGUES[league];
  const payload = await feed(league, "statviewfeed", "gameCenterPlayByPlay", gameId);
  const meta = await feed(league, "gc", "gamesummary", gameId);
  const shiftsPayload = await feed(league, "modulekit", "gameshifts", gameId);
  const pbp = enrich_pbp(parse_pbp(payload, cfg?.pbpStyle, gameId), league, gameId, {
    meta_payload: meta,
    shifts_payload: shiftsPayload,
  });
  return game_corsi_rows(pbp, parse_shifts(shiftsPayload, gameId));
}

const toCamel = (s: string): string => s.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

/** The three per-league callables py's `build_family(league)` mints, keyed `<lg>_game_shifts` etc. */
export function buildHockeytechAnalytics(league: string): Record<string, (gameId: GameId) => Promise<Row[]>> {
  if (!HOCKEYTECH_LEAGUES[league]) throw new Error(`Unknown HockeyTech league ${JSON.stringify(league)}`);
  return {
    [`${league}_game_shifts`]: (gameId) => hockeytechShiftStints(league, gameId),
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

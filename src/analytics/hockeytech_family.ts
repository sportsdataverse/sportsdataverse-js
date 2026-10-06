// Network wrappers for the HockeyTech analytics (py `_family.build_family`'s
// `<lg>_game_shifts`, `<lg>_player_toi`, `<lg>_game_corsi`). The maths lives in
// `./hockeytech.ts`; this file only fetches the feeds through the HockeyTech
// getter (so transport / retry / error vocabulary are the family's) and calls it.
//
// Fetch failures throw (`NoDataError` / `AssetFetchError`) — a failed fetch is never
// reported as an empty game.
//
// Every public wrapper returns its id columns (`game_id`, `player_id`, `team_id`,
// `goalie_id`, ...) as decimal strings (the v4 id rule, src/core/int64.ts), like
// `parse_hockeytech_pbp` and every other parser. The pure frame functions in
// `./hockeytech.ts` stay sdv-py-faithful (their joins use the raw ids); the
// conversion happens once, on the way out.

import { AssetFetchError } from "../core/errors.js";
import { idColumnsToStrings } from "../core/int64.js";
import { HOCKEYTECH_LEAGUES, hockeytechFetch, type HockeytechLeagueSlug } from "../core/hockeytech_runtime.js";
import type { SnakeToCamel } from "../core/types.js";
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

interface FeedSpec {
  /** Does the parsed body carry the feed's recognisable envelope? */
  ok: (payload: any) => boolean;
  what: string;
  /** What an access-denied reply stands for (an empty envelope). */
  denied: any;
}

/**
 * Fetch a feed and require its recognisable envelope. An unparseable body or an error
 * sentinel already throws `AssetFetchError` in `hockeytechFetch`; any other 200 without the
 * envelope is a failed fetch too, never "no data". The recognised access-denied reply and a
 * present-but-empty envelope are genuinely empty and give `[]` downstream.
 */
async function feed(league: string, f: string, view: string, gameId: GameId, spec: FeedSpec): Promise<any> {
  const payload = await hockeytechFetch({ league, feed: f, view, game_id: gameId });
  if (payload === undefined) return spec.denied;
  if (!spec.ok(payload)) {
    throw new AssetFetchError(
      `HockeyTech ${league} ${f}/${view} game ${gameId}: response has no ${spec.what} structure`,
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

const stints = async (league: string, gameId: GameId): Promise<Row[]> =>
  parse_shifts(await shiftsFeed(league, gameId), gameId);

/**
 * `<lg>_game_shifts` (py `parse_shifts` over the live feed): one row per player-shift stint.
 *
 * @param league - HockeyTech league slug from `HOCKEYTECH_LEAGUES` (`'pwhl'`, `'ahl'`,
 *   `'ohl'`, ...).
 * @param gameId - The league's game id (number or string); stamped into `game_id`.
 * @returns The {@link parse_shifts} rows (`game_id`, `player_id`, `first_name`, `last_name`,
 *   `jersey_number`, `home`, `period`, `start_time` / `end_time` / `length`, `start_s` /
 *   `end_s` on the countdown clock, `goal_on_shift`, `penalty_on_shift`) with every id column
 *   as a decimal string. `[]` for a game whose shift feed is empty or access-denied.
 * @throws AssetFetchError when the fetch fails, the body is unparseable or an error sentinel,
 *   or a 200 body lacks the `SiteKit.Gameshifts` envelope (propagated from the getter / the
 *   envelope check). A failed fetch is never reported as an empty game.
 * @throws NoDataError on a 404 (propagated from the getter).
 * @example
 * ```ts
 * import sdv from "sportsdataverse";
 * const stints = await sdv.hockeytech.hockeytech_shift_stints({ league: "pwhl", game_id: 42 });
 * // or the per-league member: await sdv.hockeytech.pwhl_game_shifts(42)
 * ```
 * @remarks Ids are converted in place by `idColumnsToStrings` on the way out (the v4 id rule);
 * the pure frame functions in `./hockeytech.ts` still see the raw feed ids. An unknown league
 * slug throws an `Error` from the HockeyTech runtime's league resolver.
 */
export async function hockeytechShiftStints(league: string, gameId: GameId): Promise<Row[]> {
  return idColumnsToStrings(await stints(league, gameId));
}

/**
 * `<lg>_player_toi` (py `player_toi` over the live shift feed): per-player time-on-ice totals
 * for a game.
 *
 * @param league - HockeyTech league slug from `HOCKEYTECH_LEAGUES`.
 * @param gameId - The league's game id (number or string).
 * @returns The {@link player_toi} rows — `player_id` (decimal string), `first_name`,
 *   `last_name`, `toi_seconds`, `num_shifts`, `avg_shift_s` — sorted by `toi_seconds`
 *   descending. `[]` for a game with no shifts.
 * @throws AssetFetchError when the fetch fails or a 200 body lacks the `SiteKit.Gameshifts`
 *   envelope (propagated).
 * @throws NoDataError on a 404 (propagated from the getter).
 * @example
 * ```ts
 * import sdv from "sportsdataverse";
 * const toi = await sdv.hockeytech.hockeytech_player_toi({ league: "pwhl", game_id: 42 });
 * toi[0].toi_seconds; // the game's ice-time leader
 * ```
 * @remarks One `modulekit/gameshifts` request. Ids become decimal strings on the way out.
 */
export async function hockeytechPlayerToi(league: string, gameId: GameId): Promise<Row[]> {
  return idColumnsToStrings(player_toi(await stints(league, gameId)));
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

/**
 * `<lg>_pbp` (public in py): one row per event with clock, coordinate, shot-geometry and
 * on-ice columns.
 *
 * @param league - HockeyTech league slug from `HOCKEYTECH_LEAGUES`; also selects the
 *   `pbpStyle` dialect passed to {@link parse_pbp} (`hockeytech_a` ≈ 850x400 for PWHL / AHL,
 *   `hockeytech_b` ≈ 600x300 for the junior leagues).
 * @param gameId - The league's game id (number or string).
 * @returns The {@link enrich_pbp} rows: the {@link parse_pbp} event columns plus `game_date`,
 *   `game_season`, `game_season_id`, `home_team` / `home_team_id`, `away_team` /
 *   `away_team_id`, the ten `x_coord_*` / `y_coord_*` transforms, `minute_start`,
 *   `second_start`, `clock`, `sec_from_start`, back-filled `power_play` / `short_handed`,
 *   `shot_distance`, `shot_angle`, `scoring_chance`, `on_ice_home` / `on_ice_away`. Every id
 *   column is a decimal string. `[]` when the play-by-play feed is empty.
 * @throws AssetFetchError when any of the three fetches fails or a 200 body lacks its
 *   envelope (the pbp event list, `GC.Gamesummary`, `SiteKit.Gameshifts`) (propagated).
 * @throws NoDataError on a 404 (propagated from the getter).
 * @example
 * ```ts
 * import sdv from "sportsdataverse";
 * const pbp = await sdv.hockeytech.hockeytech_enriched_pbp({ league: "pwhl", game_id: 42 });
 * pbp.filter((r) => r.event === "goal").map((r) => r.on_ice_home);
 * ```
 * @remarks Three sequential requests: `statviewfeed/gameCenterPlayByPlay`, `gc/gamesummary`,
 * `modulekit/gameshifts`. A league whose gamesummary / shifts feed is access-denied (e.g. no
 * shift chart) yields blank meta columns and `null` on-ice columns rather than an error.
 */
export async function hockeytechEnrichedPbp(league: string, gameId: GameId): Promise<Row[]> {
  return idColumnsToStrings((await enriched(league, gameId)).pbp);
}

/**
 * `<lg>_game_corsi`: player-level on-ice Corsi/Fenwick (proxies; no missed shots) + TOI +
 * `corsi_for_per60`.
 *
 * @param league - HockeyTech league slug from `HOCKEYTECH_LEAGUES`.
 * @param gameId - The league's game id (number or string).
 * @returns The {@link game_corsi_rows} rows: `player_id` (decimal string), `corsi_for`,
 *   `corsi_against`, `corsi_for_pct`, `fenwick_for`, `fenwick_against`, `fenwick_for_pct`,
 *   `corsi_includes_missed` (always `false`), `toi_seconds`, `corsi_for_per60` (`null` unless
 *   TOI > 0). `[]` when the game has no on-ice data (no shift feed).
 * @throws AssetFetchError when any of the three fetches fails or a 200 body lacks its
 *   envelope (propagated).
 * @throws NoDataError on a 404 (propagated from the getter).
 * @example
 * ```ts
 * import sdv from "sportsdataverse";
 * const corsi = await sdv.hockeytech.hockeytech_game_corsi({ league: "pwhl", game_id: 42 });
 * corsi.sort((a, b) => Number(b.corsi_for_pct) - Number(a.corsi_for_pct))[0];
 * ```
 * @remarks Shares the three fetches of {@link hockeytechEnrichedPbp}; the shift payload is
 * parsed a second time for the TOI join. Shot attempts are `shot + blocked_shot + goal`
 * because the feed has no missed-shot event.
 */
export async function hockeytechGameCorsi(league: string, gameId: GameId): Promise<Row[]> {
  const { pbp, shiftsPayload } = await enriched(league, gameId);
  return idColumnsToStrings(game_corsi_rows(pbp, parse_shifts(shiftsPayload, gameId)));
}

const toCamel = (s: string): string => s.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

/**
 * The four per-league callables py's `build_family(league)` mints, keyed `<lg>_game_shifts` etc.
 *
 * @param league - A slug present in `HOCKEYTECH_LEAGUES`.
 * @returns An object with `<league>_game_shifts` ({@link hockeytechShiftStints}),
 *   `<league>_pbp` ({@link hockeytechEnrichedPbp}), `<league>_player_toi`
 *   ({@link hockeytechPlayerToi}) and `<league>_game_corsi` ({@link hockeytechGameCorsi}),
 *   each taking only a `gameId`.
 * @throws Error when `league` is not a key of `HOCKEYTECH_LEAGUES`.
 * @example
 * ```ts
 * import { buildHockeytechAnalytics } from "sportsdataverse/dist/analytics/hockeytech_family.js";
 * const ohl = buildHockeytechAnalytics("ohl");
 * const pbp = await ohl.ohl_pbp(27225);
 * ```
 * @remarks Snake_case names only; {@link allHockeytechAnalytics} adds the camelCase aliases.
 */
export function buildHockeytechAnalytics(league: string): Record<string, (gameId: GameId) => Promise<Row[]>> {
  if (!HOCKEYTECH_LEAGUES[league]) throw new Error(`Unknown HockeyTech league ${JSON.stringify(league)}`);
  return {
    [`${league}_game_shifts`]: (gameId) => hockeytechShiftStints(league, gameId),
    [`${league}_pbp`]: (gameId) => hockeytechEnrichedPbp(league, gameId),
    [`${league}_player_toi`]: (gameId) => hockeytechPlayerToi(league, gameId),
    [`${league}_game_corsi`]: (gameId) => hockeytechGameCorsi(league, gameId),
  };
}

/** The analytics member names: `<lg>_game_shifts`, `<lg>_pbp`, `<lg>_player_toi`, `<lg>_game_corsi` for every league. */
type AnalyticsName = `${HockeytechLeagueSlug}_${"game_shifts" | "pbp" | "player_toi" | "game_corsi"}`;

/**
 * Every league's analytics callables, under snake_case and camelCase names.
 *
 * @remarks One `(gameId) => Promise<Row[]>` member per league x
 * `{game_shifts, pbp, player_toi, game_corsi}`, e.g. `pwhl_game_corsi` and
 * `pwhlGameCorsi`. The league set is `HockeytechLeagueSlug` (the keys of `HOCKEYTECH_LEAGUES`).
 */
export type HockeytechAnalytics = {
  [K in AnalyticsName as K | SnakeToCamel<K>]: (gameId: GameId) => Promise<Row[]>;
};

/**
 * Every league's analytics callables (snake_case + camelCase aliases), for merging onto
 * `sdv.hockeytech`.
 *
 * @returns A fresh {@link HockeytechAnalytics} object: for every league in
 *   `HOCKEYTECH_LEAGUES`, the four {@link buildHockeytechAnalytics} members under their
 *   snake_case name and a camelCase alias pointing at the same function.
 * @example
 * ```ts
 * import { allHockeytechAnalytics } from "sportsdataverse/dist/analytics/hockeytech_family.js";
 * const fns = allHockeytechAnalytics();
 * const shifts = await fns.pwhl_game_shifts(42); // === fns.pwhlGameShifts(42)
 * ```
 * @remarks This is what `src/index.ts` spreads onto `sdv.hockeytech`, so
 * `sdv.hockeytech.pwhl_game_shifts(42)` is the same callable. Pure (no network until a member
 * is called).
 */
export function allHockeytechAnalytics(): HockeytechAnalytics {
  const out: Record<string, (gameId: GameId) => Promise<Row[]>> = {};
  for (const lg of Object.keys(HOCKEYTECH_LEAGUES)) {
    for (const [name, fn] of Object.entries(buildHockeytechAnalytics(lg))) {
      out[name] = fn;
      out[toCamel(name)] = fn;
    }
  }
  return out as HockeytechAnalytics;
}

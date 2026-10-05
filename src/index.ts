import cfb from './services/cfb.service.js';
import { allHockeytechAnalytics, hockeytechEnrichedPbp, hockeytechGameCorsi, hockeytechPlayerToi, hockeytechShiftStints } from './analytics/hockeytech_family.js';
import { hockeytechSeasonId, mostRecentHockeytechSeason, resolveSeasonId } from './core/hockeytech_runtime.js';
import mbb from './services/mbb.service.js';
import mlb from './services/mlb.service.js';
import nba from './services/nba.service.js';
import ncaa from './services/ncaa.service.js';
import nfl from './services/nfl.service.js';
import nhl from './services/nhl.service.js';
import tennis from './services/tennis.service.js';
import wbb from './services/wbb.service.js';
import wnba from './services/wnba.service.js';

import { LEAGUES } from './generated/leagues.js';
import { makeLeagueModule } from './leagues/_make.js';
import { WRITTEN_FLAT } from './generated/flat/index.js';
import { WRITTEN_LOADERS } from './generated/loaders/index.js';
import { ESPN_DEPRECATED_ALIASES, FLAT_DEPRECATED_ALIASES } from './generated/aliases.js';
import { withDeprecatedAliases } from './core/deprecation.js';
import * as mlbStatcastExtra from './leagues/mlb_statcast_extra.js';
import * as cricketWp from './models/cricket_wp.js';
import { BASKETBALL_BOX_PRODUCERS } from './producers/espn_basketball_box.js';
import { BASKETBALL_PBP_PRODUCERS, _espnPbp } from './producers/espn_basketball_pbp.js';
import { oddsMath, oddsErrors } from './odds/math.js';

// WRITTEN ESPN source modules — every ESPN league is composed from explicit,
// documented `export const` wrappers in src/generated/espn/<prefix>.ts, exposed
// as a `prefix -> module` map by the generated barrel, instead of being
// materialized at runtime by makeLeagueModule(cfg) (now only a safety fallback).
import { WRITTEN_ESPN } from './generated/espn/index.js';

// Legacy hand-written services. Their methods (e.g. `sdv.nba.getPlayByPlay`) are
// preserved; the generated cross-league `espn_<prefix>_<short>` wrappers are
// merged onto the matching namespace below.
const legacy: Record<string, Record<string, any>> = {
  cfb, mbb, mlb, nba, ncaa, nfl, nhl, tennis, wbb, wnba,
};

// Build the full surface: every league in the generated matrix gets its
// `espn_<prefix>_*` wrappers, merged onto its legacy service when one exists
// (and added as a new namespace otherwise — soccer, cricket, ufl, mch, ...).
// Each league pulls from its written module (WRITTEN_ESPN); makeLeagueModule is
// only a fallback if a module is somehow missing. v4: wrappers carry sdv-py's
// names, and every pre-v4 name a rename replaced is added as a deprecated alias
// (one DeprecationWarning per name per process; src/generated/aliases.ts).
const sdv: Record<string, Record<string, any>> = { ...legacy };
for (const cfg of LEAGUES) {
  const espn = WRITTEN_ESPN[cfg.prefix]
    ? withDeprecatedAliases(WRITTEN_ESPN[cfg.prefix], ESPN_DEPRECATED_ALIASES[cfg.prefix])
    : makeLeagueModule(cfg);
  sdv[cfg.prefix] = { ...(sdv[cfg.prefix] ?? {}), ...espn };
}

// Merge the non-ESPN "flat API" wrappers onto their target league namespace,
// AFTER the ESPN merge so they're added alongside (never clobbering) the ESPN
// + legacy surface. Each flat family (`WrapperDef.api`) maps to a league prefix.
const FLAT_API_NAMESPACES: Record<string, string> = {
  mlb: 'mlb',
  mlb_statcast: 'mlb',
  nhl_api_web: 'nhl',
  nhl_edge: 'nhl',
  nhl_stats_rest: 'nhl',
  nhl_records: 'nhl',
  nfl_api: 'nfl',
  // The Odds API — first cross-sport provider family. `odds` is a standalone
  // namespace (NOT a league), so `prefix` here is its own name: the merge below
  // creates `sdv.odds.*` from scratch (no legacy/ESPN service to merge onto).
  odds_api: 'odds',
  // 247Sports Recruit Database on api.247sports.com — DEPRECATED (the host
  // answers HTTP 500; every method warns once). Kept for back-compat.
  recruiting: 'recruiting',
  // 247Sports, the supported surface: the RDB on ipa.247sports.com (guest JWT
  // minted automatically) + the 247sports.com `*.json` page models, both on
  // `sdv.sports247` (browser-impersonating transport — needs `impit`).
  // Supersedes `recruiting` and the legacy 247 scrapers on sdv.cfb / sdv.mbb.
  sports247: 'sports247',
  sports247_site_pages: 'sports247',
  // CBS Sports API — third standalone (non-league) provider family. `cbs` is a
  // cross-sport namespace; the merge creates `sdv.cbs.*` from scratch (no token —
  // the API data resources are anonymously reachable).
  cbs: 'cbs',
  // Fox Sports API — fourth standalone (non-league) provider family.
  // `fox` is a cross-sport namespace; the merge creates `sdv.fox.*` from scratch.
  // Auth is a public apikey + api-version query pair (both default in the wrapper
  // metadata, no account/token), so it is NOT flagged auth:true.
  fox: 'fox',
  // Yahoo Sports — fifth (and final) standalone provider family. TWO api stems
  // (scores + stats) share ONE `yahoo` namespace (two hosts, one
  // namespace — like the four NHL stems share `nhl`); the merge creates
  // `sdv.yahoo.*` from scratch. Keyless (no securityScheme), so NOT auth:true —
  // callers pass browser-y Origin/Referer via the flat `headers` arg.
  yahoo_scores: 'yahoo',
  yahoo: 'yahoo',
  // HockeyTech / LeagueStat — standalone provider family. `hockeytech` is a
  // cross-sport namespace; the merge creates `sdv.hockeytech.*` from scratch.
  // One feed gateway serves every league (PWHL + junior/minor); the `league`
  // call-param selects it. Responses are JSONP (stripped by the family's
  // content-type-aware getter), so it is NOT a plain-JSON passthrough.
  hockeytech: 'hockeytech',
  // BartTorvik / T-Rank — standalone provider family. `torvik` is a cross-sport
  // namespace; the merge creates `sdv.torvik.*` from scratch. Keyless but needs
  // a browser User-Agent (set by the family's getter); endpoints mix CSV/JSON.
  torvik: 'torvik',
  // Subscription families (caller's own credentials; never on the playground
  // allowlist) merge onto their league namespace.
  pff_api: 'nfl',
  nfl_pro: 'nfl',
  kenpom: 'mbb',
  // Women's T-Rank joins `sdv.torvik`; On3 / ASA are standalone provider
  // namespaces; the MLS / NWSL native APIs merge onto their league namespaces.
  bart_wbb: 'torvik',
  on3: 'on3',
  asa: 'asa',
  mls_api: 'mls',
  nwsl_api: 'nwsl',
  // stats.nba.com / stats.wnba.com (TLS-impersonating transport; see
  // src/core/nba_stats_runtime.ts) merge onto the league namespaces.
  nba_stats: 'nba',
  wnba_stats: 'wnba',
};
// Each flat family is composed from WRITTEN source (src/generated/flat/<api>.ts,
// exposed via the barrel) instead of makeFlatModule(defs) at runtime — both call
// the same `callFlat` core, so they resolve identically.
for (const [api, mod] of Object.entries(WRITTEN_FLAT)) {
  const prefix = FLAT_API_NAMESPACES[api] ?? api;
  sdv[prefix] = { ...(sdv[prefix] ?? {}), ...withDeprecatedAliases(mod, FLAT_DEPRECATED_ALIASES[api]) };
}

// Release dataset loaders (`load*` + snake alias, generated from the vendored
// sdv-py releases.yaml) merged onto their league namespace — additive, after
// ESPN + flat. A loader-only namespace (`pwhl`) is created here.
for (const [prefix, mod] of Object.entries(WRITTEN_LOADERS)) {
  sdv[prefix] = { ...(sdv[prefix] ?? {}), ...mod };
}

// Hand-written Baseball Savant / Statcast wrappers (date-chunked search +
// HTML-embedded player page) that aren't flat passthroughs — merged onto
// `sdv.mlb` alongside the generated flat `mlb_statcast_*` wrappers, under BOTH
// snake_case (export name) and camelCase (idiomatic JS) names.
const toCamel = (s: string): string =>
  s.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
for (const [name, fn] of Object.entries(mlbStatcastExtra)) {
  if (typeof fn !== 'function') continue; // skip exported types/interfaces
  sdv.mlb[name] = fn;
  sdv.mlb[toCamel(name)] = fn;
}

// HockeyTech season-id helpers (py `<lg>_season_id` / `most_recent_<lg>_season` /
// `resolve_season_id`, league-parameterised) merged onto `sdv.hockeytech`.
const hockeytechSeasonExtra = {
  hockeytech_season_id: hockeytechSeasonId,
  most_recent_hockeytech_season: mostRecentHockeytechSeason,
  hockeytech_resolve_season_id: resolveSeasonId,
};
// HockeyTech analytics (py `<lg>_game_shifts` / `<lg>_player_toi` / `<lg>_game_corsi`): every
// league gets the three callables (`sdv.hockeytech.pwhl_game_shifts(42)`), plus league-parameterised
// generics. `hockeytech_game_shifts` stays the raw-feed flat wrapper; the py-parity shift stints
// are `hockeytech_shift_stints`.
const hockeytechAnalytics = {
  ...allHockeytechAnalytics(),
  hockeytech_shift_stints: ({ league, game_id }: { league: string; game_id: number | string }) =>
    hockeytechShiftStints(league, game_id),
  hockeytech_enriched_pbp: ({ league, game_id }: { league: string; game_id: number | string }) =>
    hockeytechEnrichedPbp(league, game_id),
  hockeytech_player_toi: ({ league, game_id }: { league: string; game_id: number | string }) =>
    hockeytechPlayerToi(league, game_id),
  hockeytech_game_corsi: ({ league, game_id }: { league: string; game_id: number | string }) =>
    hockeytechGameCorsi(league, game_id),
};
// Never silently overwrite an existing sdv.hockeytech key (the flat raw-feed wrappers share the namespace).
for (const name of Object.keys(hockeytechAnalytics)) {
  for (const n of [name, toCamel(name)]) {
    if (n in sdv.hockeytech || n in hockeytechSeasonExtra) throw new Error(`sdv.hockeytech.${n} already exists`);
  }
}
Object.assign(hockeytechSeasonExtra, hockeytechAnalytics);
for (const [name, fn] of Object.entries(hockeytechSeasonExtra)) {
  sdv.hockeytech[name] = fn;
  sdv.hockeytech[toCamel(name)] = fn;
}

// Cricket in-play win probability (pure, offline) merged onto `sdv.cricket`
// under py's snake_case names and camelCase aliases.
const cricketWpExports: Record<string, any> = {
  cricket_match_state: cricketWp.cricket_match_state,
  cricket_win_probability: cricketWp.cricket_win_probability,
  cricket_expected_runs: cricketWp.cricket_expected_runs,
  cricket_wpa: cricketWp.cricket_wpa,
  cricket_parse_score_string: cricketWp.parse_score_string,
  cricket_get_format: cricketWp.get_format,
};
for (const [name, fn] of Object.entries(cricketWpExports)) {
  sdv.cricket[name] = fn;
  sdv.cricket[toCamel(name)] = fn;
}

// ESPN basketball box + PBP producers (py `helper_<lg>_player_box` / `helper_<lg>_team_box`,
// `helper_<lg>_pbp` and its stages; pure: one summary payload in) plus py's `espn_<lg>_pbp`
// (the generated `espn_<lg>_summary` -> py's key trimming -> `helper_<lg>_pbp`) merged onto
// sdv.nba / wnba / mbb / wbb under py + camelCase names. Never silently overwrite an existing key.
const espnPbp = Object.fromEntries(
  Object.keys(BASKETBALL_PBP_PRODUCERS).map((lg) => [
    lg,
    { [`espn_${lg}_pbp`]: _espnPbp(lg as keyof typeof BASKETBALL_PBP_PRODUCERS, sdv[lg][`espn_${lg}_summary`]) },
  ])
);
for (const [lg, fns] of [
  ...Object.entries(BASKETBALL_BOX_PRODUCERS),
  ...Object.entries(BASKETBALL_PBP_PRODUCERS),
  ...Object.entries(espnPbp),
]) {
  for (const [name, fn] of Object.entries(fns)) {
    for (const n of [name, toCamel(name)]) {
      if (n in sdv[lg]) throw new Error(`sdv.${lg}.${n} already exists`);
      sdv[lg][n] = fn;
    }
  }
}

// Odds / market math (py wexp.market) merged onto sdv.odds under py + camelCase names.
sdv.odds = { ...(sdv.odds ?? {}), ...oddsMath, errors: oddsErrors };

export default sdv;

export { OddsValueError, OddsZeroDivisionError, OddsOverflowError, OddsRuntimeError } from './odds/math.js';

// Advanced / tree-shakeable use:
export { LEAGUES };
export { makeLeagueModule } from './leagues/_make.js';
export { makeFlatModule } from './leagues/_make_flat.js';
export { WRAPPERS, FLAT_WRAPPERS } from './generated/wrappers.js';
export { resolveFlat } from './core/flat.js';
export { FLAT_HOSTS } from './core/client.js';
export {
  nflTokenGen,
  nflHeadersGen,
  nflClearTokenCache,
  jwtExp,
  NFL_API_HOST,
} from './core/nfl_auth.js';
export type { NflTokenOptions } from './core/nfl_auth.js';
export { sports247ClearTokenCache } from './core/sports247_runtime.js';
// Runtime core: error vocabulary, configuration, transports, auth providers.
export {
  SdvError,
  NoDataError,
  NoESPNDataError,
  AssetFetchError,
  SeasonNotFoundError,
  TransportUnavailableError,
  InvalidParameterError,
} from './core/errors.js';
// Subscription families (PFF Developer API, KenPom, NFL Pro): helpers beyond the
// generated wrappers — credential checks, a pre-flight login, token checks.
export { resolvePffApiKey } from './core/pff_api_runtime.js';
export { hasKenpomLogin, kenpomLogin, kenpomClearSessionCache } from './core/kenpom_runtime.js';
// node-only (cheerio) — not in the browser `sportsdataverse/parsers` barrel
export { parse_kenpom_page } from './parsers/kenpom.js';
export { NflProAuthError, nflProToken, nflProBrowserLogin, nflProClearTokenCache } from './core/nfl_pro_runtime.js';
export type { PlaywrightLike } from './core/nfl_pro_runtime.js';
export type { FetchErrorDetails } from './core/errors.js';
// `code` of the DeprecationWarning a pre-v4 name / a deprecated endpoint emits, to filter on.
export { DEPRECATED_NAME_CODE, DEPRECATED_ENDPOINT_CODE } from './core/deprecation.js';
export {
  configure,
  getConfig,
  resetConfig,
  registerFamilyDefaults,
  DEFAULT_RETRY_STATUSES,
} from './core/config.js';
export type { ConfigureOptions, SdvConfig, FamilyDefaults } from './core/config.js';
export { axiosTransport, createImpersonatingTransport } from './core/transport.js';
export type { Transport, TransportRequest, TransportResponse } from './core/transport.js';
export { bearerAuth, headerAuth, queryAuth, tokenAuth, sessionAuth } from './core/auth.js';
export { RELEASES_FAMILY } from './core/releases.js';
export type {
  ReleaseRow,
  ReleaseColumns,
  ReleaseLoaderOptions,
  SeasonLoaderOptions,
  SeasonLoader,
  AssetLoader,
} from './core/releases.js';
export type { AuthProvider, AuthContext } from './core/auth.js';
export {
  listFunctions, functionCount, findTeam, findAthlete, findEvent, clearTeamCache,
  list_functions, function_count, find_team, find_athlete, find_event, clear_team_cache,
} from './discover.js';
export type { ListFunctionsOptions, Namespaces } from './discover.js';
export { normalize } from './parsers/_normalize.js';
export { PARSERS, parserFor, NODE_ONLY_PARSERS } from './parsers/_registry.js';
export type { ParserFn, FlatParserFn, ParsedTables } from './parsers/_registry.js';
// Re-export the tidy.js toolkit so callers can pipe the parsed tidy arrays
// (from `{ parsed: true }`) through grammar-of-data-manipulation verbs, e.g.
// `import { tidy } from 'sportsdataverse';
//  tidy.tidy(rows, tidy.groupBy('team', tidy.summarize({ n: tidy.n() })))`.
// Same module namespace as `export * as tidy from '@tidyjs/tidy'`, spelled as
// import + export because API Extractor (`npm run api:report`) cannot analyze
// `export * as` of an external package.
import * as tidy from '@tidyjs/tidy';
export { tidy };
export type {
  LeagueConfig,
  EspnFamily,
  Scope,
  WrapperFn,
  WrapperDef,
  QueryParam,
  PathParam,
} from './core/types.js';

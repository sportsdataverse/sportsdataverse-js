import cfb from './services/cfb.service.js';
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
import { FLAT_WRAPPERS } from './generated/wrappers.js';
import { makeLeagueModule } from './leagues/_make.js';
import { makeFlatModule } from './leagues/_make_flat.js';
import * as mlbStatcastExtra from './leagues/mlb_statcast_extra.js';

// WRITTEN ESPN source modules (phased proof — basketball only). These leagues
// are composed from explicit, documented `export const` wrappers in
// src/generated/espn/<prefix>.ts instead of being materialized at runtime by
// makeLeagueModule(cfg). Every OTHER league still uses the runtime factory.
import * as nbaEspn from './generated/espn/nba.js';
import * as wnbaEspn from './generated/espn/wnba.js';
import * as mbbEspn from './generated/espn/mbb.js';
import * as wbbEspn from './generated/espn/wbb.js';
import type { WrapperFn } from './core/types.js';

// Legacy hand-written services. Their methods (e.g. `sdv.nba.getPlayByPlay`) are
// preserved; the generated cross-league `espn_<prefix>_<short>` wrappers are
// merged onto the matching namespace below.
const legacy: Record<string, Record<string, any>> = {
  cfb, mbb, mlb, nba, ncaa, nfl, nhl, tennis, wbb, wnba,
};

// Basketball is composed from WRITTEN source modules (phased proof). Each value
// is the module's function exports only (the module-private CFG is not
// exported), keyed by league prefix. The composition loop prefers this map and
// falls back to the runtime factory for every other league.
const WRITTEN_ESPN: Record<string, Record<string, WrapperFn>> = {
  nba: nbaEspn,
  wnba: wnbaEspn,
  mbb: mbbEspn,
  wbb: wbbEspn,
};

// Build the full surface: every league in the generated matrix gets its
// `espn_<prefix>_*` wrappers, merged onto its legacy service when one exists
// (and added as a new namespace otherwise — soccer, cricket, ufl, mch, ...).
// Basketball pulls from the written modules; all other leagues use the factory.
const sdv: Record<string, Record<string, any>> = { ...legacy };
for (const cfg of LEAGUES) {
  const espn = WRITTEN_ESPN[cfg.prefix] ?? makeLeagueModule(cfg);
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
  // 247Sports Recruit Database — second standalone (non-league) provider family.
  // `recruiting` is a cross-sport namespace; the merge creates `sdv.recruiting.*`
  // from scratch. Supersedes the legacy 247 scrapers on sdv.cfb / sdv.mbb.
  recruiting: 'recruiting',
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
};
const flatByApi: Record<string, typeof FLAT_WRAPPERS> = {};
for (const w of FLAT_WRAPPERS) (flatByApi[w.api as string] ??= []).push(w);
for (const [api, defs] of Object.entries(flatByApi)) {
  const prefix = FLAT_API_NAMESPACES[api] ?? api;
  sdv[prefix] = { ...(sdv[prefix] ?? {}), ...makeFlatModule(defs) };
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

export default sdv;

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
export { normalize } from './parsers/_normalize.js';
export { PARSERS, parserFor } from './parsers/_registry.js';
export type { ParserFn } from './parsers/_registry.js';
// Re-export the tidy.js toolkit so callers can pipe the parsed tidy arrays
// (from `{ parsed: true }`) through grammar-of-data-manipulation verbs, e.g.
// `import { tidy } from 'sportsdataverse';
//  tidy.tidy(rows, tidy.groupBy('team', tidy.summarize({ n: tidy.n() })))`.
export * as tidy from '@tidyjs/tidy';
export type {
  LeagueConfig,
  EspnFamily,
  Scope,
  WrapperFn,
  WrapperDef,
  QueryParam,
  PathParam,
} from './core/types.js';

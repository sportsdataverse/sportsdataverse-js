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

// Legacy hand-written services. Their methods (e.g. `sdv.nba.getPlayByPlay`) are
// preserved; the generated cross-league `espn_<prefix>_<short>` wrappers are
// merged onto the matching namespace below.
const legacy: Record<string, Record<string, any>> = {
  cfb, mbb, mlb, nba, ncaa, nfl, nhl, tennis, wbb, wnba,
};

// Build the full surface: every league in the generated matrix gets its
// `espn_<prefix>_*` wrappers, merged onto its legacy service when one exists
// (and added as a new namespace otherwise — soccer, cricket, ufl, mch, ...).
const sdv: Record<string, Record<string, any>> = { ...legacy };
for (const cfg of LEAGUES) {
  sdv[cfg.prefix] = { ...(sdv[cfg.prefix] ?? {}), ...makeLeagueModule(cfg) };
}

// Merge the non-ESPN "flat API" wrappers onto their target league namespace,
// AFTER the ESPN merge so they're added alongside (never clobbering) the ESPN
// + legacy surface. Each flat family (`WrapperDef.api`) maps to a league prefix.
const FLAT_API_NAMESPACES: Record<string, string> = {
  mlb_api: 'mlb',
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
  sports247: 'recruiting',
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

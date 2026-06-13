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
import { makeLeagueModule } from './leagues/_make.js';

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

export default sdv;

// Advanced / tree-shakeable use:
export { LEAGUES };
export { makeLeagueModule } from './leagues/_make.js';
export { WRAPPERS } from './generated/wrappers.js';
export type {
  LeagueConfig,
  EspnFamily,
  Scope,
  WrapperFn,
  WrapperDef,
  QueryParam,
} from './core/types.js';

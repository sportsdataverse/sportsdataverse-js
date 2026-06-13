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

// Cross-league ESPN wrappers (Phase 1/2 — basketball vertical slice). These are
// merged onto the existing per-sport namespaces, so legacy methods like
// `sdv.nba.getPlayByPlay()` keep working alongside the new `espn_nba_*` wrappers.
import nbaEspn from './leagues/nba.js';
import wnbaEspn from './leagues/wnba.js';
import mbbEspn from './leagues/mbb.js';
import wbbEspn from './leagues/wbb.js';

export default {
    cfb,
    mbb: { ...mbb, ...mbbEspn },
    mlb,
    nba: { ...nba, ...nbaEspn },
    ncaa,
    nfl,
    nhl,
    tennis,
    wbb: { ...wbb, ...wbbEspn },
    wnba: { ...wnba, ...wnbaEspn }
};

// Also expose the league modules directly for tree-shakeable, cross-league use:
//   import { nbaEspn } from "sportsdataverse";
export {
    nbaEspn,
    wnbaEspn,
    mbbEspn,
    wbbEspn
};
export { makeLeagueModule } from './leagues/_make.js';
export type { LeagueConfig, EspnFamily, Scope, WrapperFn } from './core/types.js';

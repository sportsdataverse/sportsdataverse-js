import { makeLeagueModule } from "./_make.js";

/** Cross-league ESPN wrappers for the NBA (`espn_nba_*`). */
export default makeLeagueModule({
  prefix: "nba",
  sport: "basketball",
  league: "nba",
  scopes: ["universal"],
});

import { makeLeagueModule } from "./_make.js";

/** Cross-league ESPN wrappers for the WNBA (`espn_wnba_*`). */
export default makeLeagueModule({
  prefix: "wnba",
  sport: "basketball",
  league: "wnba",
  scopes: ["universal"],
});

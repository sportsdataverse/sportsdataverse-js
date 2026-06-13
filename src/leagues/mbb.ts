import { makeLeagueModule } from "./_make.js";

/** Cross-league ESPN wrappers for men's college basketball (`espn_mbb_*`). */
export default makeLeagueModule({
  prefix: "mbb",
  sport: "basketball",
  league: "mens-college-basketball",
  scopes: ["universal", "ncaa"],
});

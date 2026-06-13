import { makeLeagueModule } from "./_make.js";

/** Cross-league ESPN wrappers for women's college basketball (`espn_wbb_*`). */
export default makeLeagueModule({
  prefix: "wbb",
  sport: "basketball",
  league: "womens-college-basketball",
  scopes: ["universal"],
});

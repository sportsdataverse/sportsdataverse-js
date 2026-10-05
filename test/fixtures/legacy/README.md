# Legacy `get*` method fixtures

Real captures behind `test/legacy_services.test.js`, the offline tests for the
hand-written `sdv.<league>.get*` methods (`src/services`). The tests also use the
ESPN captures in `../espn/` (`summary_nba.json`, `scoreboard_nba.json`,
`standings_nba.json`, `teams_site_nba.json`, `team_roster_nba.json`).

| File | Source |
|---|---|
| `summary_nhl.json.gz` | sdv-py@755f9e458a `tests/fixtures/espn/summary_nhl.json` (Site v2 `summary?event=401675111`, 2024 Stanley Cup Final G7), gzipped verbatim (`gzip -9 -n`; blob `528b3db`) |
| `summary_nfl.json.gz` | sdv-py@755f9e458a `tests/fixtures/espn/summary_nfl.json` (Site v2 `summary?event=401671889`, Super Bowl LIX), gzipped verbatim (`gzip -9 -n`; blob `7cb0812`) |
| `summary_mlb.json.gz` | sdv-py@755f9e458a `tests/fixtures/espn/summary_mlb.json` (Site v2 `summary?event=401701044`, 2024 World Series G5), gzipped verbatim (`gzip -9 -n`; blob `9cde41d`) |
| `sports247_cfb_composite_2024_p1.html` | `GET https://247sports.com/Season/2024-Football/CompositeRecruitRankings?InstitutionGroup=HighSchool&Page=1`, captured live 2026-10-05. Trimmed to the `ul.rankings-page__list` element with its header row and the first 3 recruits (the page's other 297 KB are scripts and chrome). |
| `ncaa_scoreboard_basketball-men_d3_20190215.json.gz` | `GET https://data.ncaa.com/casablanca/scoreboard/basketball-men/d3/2019/02/15/scoreboard.json`, captured live 2026-10-05 (26 games), gzipped verbatim |

# The Odds API fixtures

## h2h_rows.json / odds_math_oracle.json

sdv-py `wexp.market` parity oracle (see each file's `provenance` key): real
h2h prices extracted from the `odds-data` backfill, and sdv-py's outputs at the
pinned commit. Used by `test/odds_math.test.js`.

## nfl_lines_20200911T001500Z_0.json

One real `GET https://api.the-odds-api.com/v4/historical/sports/americanfootball_nfl/odds?regions=us&markets=h2h,spreads,totals&date=2020-09-11T00:15:00Z`
response (verbatim), copied from the SportsDataverse backfill repo
[`sportsdataverse/odds-data`](https://github.com/sportsdataverse/odds-data)
`odds/nfl/lines/20200911T001500Z_0.json` at commit `5ed6115971ad3d99866f57f54b1aadf26a5203b7`
(Houston Texans at Kansas City Chiefs, 2020-09-10 kickoff; 14 bookmakers). Used by
`examples/11_providers_odds_math.mjs` (the `sports_odds_history` parsed shape) and
the tutorial output injector.

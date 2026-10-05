
## fpi_cfb_2024.json / py_oracle_fpi.json

`GET https://site.web.api.espn.com/apis/fitt/v3/sports/football/college-football/powerindex?season=2024&limit=3`, captured live 2026-10-05 (3 of 134 teams). `py_oracle_fpi.json` is sdv-py@719de79 `parse_fpi` on that body.

## teams_site_nba.json

`GET https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=1000`, captured live 2026-10-05 (all 30 teams). Used by the discover/find tests.

## cdn/*.json.gz

sdv-py@81eb7e7060 `tests/fixtures/espn/cdn/*.json`, gzipped verbatim (`gzip -9 -n`; byte-identical to the sdv-py blob after gunzip). Captured 2026-10-05 from `https://cdn.espn.com/core/{league}/{page}?xhr=1` and trimmed by sdv-py to the keys its parsers read (see that directory's README). Used by `test/parsers/espn_cdn.test.js`.

| File | Request |
|---|---|
| `playbyplay_nba` | `nba/playbyplay?gameId=401705127` (441 plays) |
| `playbyplay_cfb` | `college-football/playbyplay?gameId=401628551` (drives + scoringPlays) |
| `boxscore_mlb` | `mlb/boxscore?gameId=401696358` (618 plays) |
| `schedule_nba` | `nba/schedule?date=20250115` (7 days, 51 games) |
| `scoreboard_nba` | `nba/scoreboard?date=20250115` (11 games) |
| `scoreboard_epl` | `eng.1/scoreboard?date=20250201` (6 games) |
| `rankings_cfb` | `college-football/rankings?week=5&year=2024&seasontype=2` (5 polls) |

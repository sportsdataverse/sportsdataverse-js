
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

## rankings_*.json.gz

sdv-py@410c66c259 (sportsdataverse-py#732) `tests/fixtures/espn/rankings_*.json`, gzipped verbatim (`gzip -9 -n`; byte-identical to the sdv-py blob after gunzip). Captured live 2026-10-08 from `https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/rankings` (no query) and trimmed by sdv-py to the top-level `rankings` list, without each team's `logos` list or the season's `$ref` links. Used by `test/parsers/espn.test.js` and `test/espn_shapes.test.js`.

| File | Request | Polls |
|---|---|---|
| `rankings_cfb` | `football/college-football/rankings` | 5 (AP, AFCA Coaches, FCS, D-II, D-III), 2026 week 6; 125 ranked + 83 receiving votes |
| `rankings_mbb` | `basketball/mens-college-basketball/rankings` | 2 (AP, Coaches), 2025-26 postseason week 3 (`occurrence` number 20); 50 + 27 |
| `rankings_wbb` | `basketball/womens-college-basketball/rankings` | 2 (AP, Coaches), 2025-26 postseason week 3; 50 + 25 |
| `rankings_mch` | `hockey/mens-college-hockey/rankings` | 1 (USCHO Men's), 2026-27 week 2; 20 + 15, no `firstPlaceVotes` on ranked entries |
| `rankings_wch` | `hockey/womens-college-hockey/rankings` | 1 (USCHO Women's), 2026-27 week 3; 15 + 5 |

## standings_wnba_2025.json / scoreboard_nfl_2024_w1.json / standings_nfl_2024.json / standings_laliga_2024.json

Captured live 2026-10-06 (verbatim, untrimmed) for the runnable examples (`examples/`, served by `examples/_offline.mjs`) and the tutorial output injector.

| File | Request |
|---|---|
| `standings_wnba_2025.json` | `GET https://site.api.espn.com/apis/v2/sports/basketball/wnba/standings?season=2025` (2 conferences, 13 teams) |
| `scoreboard_nfl_2024_w1.json` | `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2024&week=1&seasontype=2&limit=500` (16 games) |
| `standings_nfl_2024.json` | `GET https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=2024` (2 conferences, 32 teams) |
| `standings_laliga_2024.json` | `GET https://site.api.espn.com/apis/v2/sports/soccer/esp.1/standings?season=2024` (20 teams) |

## athlete_gamelog_nba_1966_2024.json.gz

`GET https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/1966/gamelog?season=2024`
(LeBron James, 2023-24), captured live 2026-10-08T22:58:10Z through
`sdv.nba.espnNbaPlayerGamelog({ athlete_id: '1966', season: 2024 })`: the whole
response (787,166 bytes as JSON; sha256 of the gunzipped bytes
`a71cffd3cb45f6fcaadb6522abe396a10998842018092129d382b47152464695`), gzipped with
zlib level 9 (25,087 bytes). Untrimmed: 82 games across the preseason, regular
season (73, of which 71 count), play-in and postseason blocks. Served to
`examples/97_sdvplot_player_gamelog.mjs` by `examples/_offline.mjs`;
`test/tutorial-fixtures.test.js` checks the sha256 and re-derives the official
regular season (71 games, 1,822 points).

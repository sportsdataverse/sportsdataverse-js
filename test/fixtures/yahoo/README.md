# Yahoo Sports fixtures

All four files are sdv-py@2cfc90c9e7 `tests/fixtures/yahoo/*.json`, copied verbatim (byte-identical to the sdv-py blob; none exceeds 1 MB so none is gzipped). They are REAL captures: sdv-py trimmed the three 2026-06 bodies from `sdv-internal-refs/yahoo/discovery/responses/` (fewer games / players / leaders, every top-level collection kept) and captured the Alabama-at-Kentucky box score directly. Request URLs are what the internal-refs discovery manifest / sdv-py `cfb_yahoo_ext` record; the trailing locale params (`lang=en-US&region=US&tz=America/Chicago&ysp_redesign=1&ysp_platform=desktop`) are elided below.

## shangrila_season_stats_football_passing_ncaaf.json

`GET https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonStatsFootballPassingNcaaf?season=2025&league=ncaaf&leagueStructure=ncaaf.struct.div.1&count=200&sortStatId=PASSING_YARDS&cutTypeIds=&qualified=FALSE`, captured 2026-06-10 (internal-refs `graphite_seasonStatsFootballPassingNcaaf.json`, 213 KB) and trimmed by sdv-py (2026-09-03) to 3 of 200 leaders; the 12-entry `data.statTypes` dictionary is untrimmed. Used by `test/parsers/yahoo_shangrila.test.js` (`parse_yahoo_stats` + `parse_yahoo_list`).

## editorial_scoreboard_ncaaf.json

`GET https://api-secure.sports.yahoo.com/v1/editorial/s/scoreboard?leagues=ncaaf&week=1&sched_states=2&conferences=1,4,6,7,8,11,71,72,87,90,122&top25=0&v=2&ysp_enable_last_update=1&count=500`, captured 2026-06-10 (internal-refs `editorial_scoreboard_ncaaf.json`, 1.9 MB) and trimmed by sdv-py (2026-09-03) to 2 of the 2026 week-1 games (both pregame); the sibling `teams` / `leagues` / `gameodds` / ... maps are kept. Used by `test/parsers/yahoo_editorial.test.js` (`parse_yahoo_scores_scoreboard`, `parse_yahoo_scores_list`) and `yahoo_shangrila.test.js` (`parse_yahoo_list` on an editorial envelope).

## editorial_boxscore_ncaaf.json

`GET https://api-secure.sports.yahoo.com/v1/editorial/s/boxscore/ncaaf.g.202509200023?mode=&v=4&ysp_enable_last_update=1&polling=1` (Michigan 30 at Nebraska 27, 2025-09-20, final), captured 2026-06-10 (internal-refs `editorial_boxscore_ncaaf.json`, 281 KB) and trimmed by sdv-py (2026-09-03) to 2 `player_stats` entries (one QB per side) and 3 plays per play collection; both `team_stats` blocks and the stat dictionaries are kept. Used by `test/parsers/yahoo_editorial.test.js` (`parse_yahoo_scores_boxscore`, `parse_yahoo_scores_list`).

## editorial_boxscore_ncaaf_ala_at_uk.json

`GET https://api-secure.sports.yahoo.com/v1/editorial/s/boxscore/ncaaf.g.202609120069?v=4` (Alabama 45 at Kentucky 17, 2026-09-12, final; the URL `sportsdataverse.cfb.cfb_yahoo_ext.yahoo_cfb_boxscore` builds), captured by sdv-py between 2026-09-12 and 2026-09-17 and trimmed to 4 `player_stats` entries (two per side) plus both `team_stats` blocks, `games`, `gamelineups` and the untrimmed stat dictionaries. Used by `test/parsers/yahoo_editorial.test.js` (`parse_yahoo_scores_boxscore`).

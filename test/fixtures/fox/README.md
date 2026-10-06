# Fox Sports Bifrost fixtures

Real captures from the public `api.foxsports.com/bifrost/v1` data tier (public
`apikey` + `api-version=1.1` query pair from the foxsports.com web bundle; no
account), copied verbatim from sdv-py's `tests/fixtures/fox/` (sdv-py@46ec2b88cb)
and `tests/fixtures/fox_api/` (sdv-py@e2cacc347f). Every file is byte-identical
to the sdv-py blob (plain `cp`; none exceeds 1 MB, so none is gzipped). Where the
two sdv-py directories hold a file of the same name (`cbk_league_conferences`,
`trending_videos`) the `fox_api/` copy was taken. All are used by
`test/parsers/fox_bifrost.test.js`; the "Parser" column is the parser the
endpoint maps to in `tools/codegen/endpoints/fox.yaml`.

## sdv-py `tests/fixtures/fox_api/` (sdv-py@e2cacc347f), captured 2026-10-05 with `curl`

| File | Route | Trimming | Parser |
|---|---|---|---|
| `nfl_league_scores_segment.json` | `/bifrost/v1/nfl/league/scores-segment/2026-3-1` (16 games) | none | `parse_fox_scoreboard` |
| `topevents_segment.json` | `/bifrost/v1/topevents/scoreboard/segment/1` (segment id from `topevents/scoreboard/main`) | none | `parse_fox_scoreboard` |
| `nfl_league_standings.json` | `/bifrost/v1/nfl/league/standings` | none | `parse_fox_standings` |
| `nfl_event_matchup.json` | `/bifrost/v1/nfl/event/11195/matchup` | none | `parse_fox_event` |
| `nfl_team_roster.json` | `/bifrost/v1/nfl/team/25/roster` | none | `parse_fox_team_roster` |
| `search_content.json` | `/bifrost/v1/search/content?text=mahomes` | none | `parse_fox_search` |
| `search_popular.json` | `/bifrost/v1/search/popular` | none | `parse_fox_search` (parity vs sdv-py `parse_fox_api_search`) |
| `nfl_league_header.json` | `/bifrost/v1/nfl/league/header` | none | `parse_fox_list` |
| `cbk_league_conferences.json` | `/bifrost/v1/cbk/league/conferences` | none | `parse_fox_list` |
| `trending_videos.json` | `/bifrost/v1/general/trending/videos?duration=4&maxItems=12` (feed key) | sliced by sdv-py to the first 5 of 12 records (rows sliced, nothing edited) | `parse_fox_list` |

## sdv-py `tests/fixtures/fox/` (sdv-py@46ec2b88cb), captured 2026-06-09/12 by the `sdv-internal-refs/fox` crawl

| File | Route | Trimming | Parser |
|---|---|---|---|
| `cbk_league_polls.json` | `/cbk/league/polls` (AP, Coaches, RPI -- RPI has no change column) | none | `parse_fox_standings` |
| `cbk_event_data_pbp_first_half.json` | `/cbk/event/262052/data` | trimmed by sdv-py to `pbp.sections[0].groups[0]` (1ST HALF, 158 plays); unmodified captured JSON with the list truncated | `parse_fox_event` |
| `search_entities.json` | `/search/entities?text=chiefs` | none | `parse_fox_search` |

Every value asserted in the tests comes from the capture as served.

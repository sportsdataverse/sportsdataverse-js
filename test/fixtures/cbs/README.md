# CBS Sports NAPI (`api.cbssports.com/napi`) real captures

The ten `*.json` files are sdv-py@2cfc90c9e7 `tests/fixtures/cbs/*.json`, copied
verbatim (`cp`; each file is byte-identical to the sdv-py blob). None exceeds 1 MB,
so none is gzipped. No synthetic payloads. Consumed by
`test/parsers/cbs_napi.test.js`.

sdv-py's files are themselves trimmed copies of the real committed captures in
`sdv-internal-refs/cbs/captures/_sample/` (the NAPI crawl, `napi_crawl.py`):
rows sliced, nothing edited, and the `{data: ...}` envelope left exactly as the
API served it (the `league` and `team/standings` resources are served un-enveloped;
the registry is a keyed collection). Ids throughout are CBS NAPI ids (NFL league /
season id 59, NHL 60).

| File | Request (`https://api.cbssports.com/napi` + route) | Capture | Trimming |
| --- | --- | --- | --- |
| `endpoint_registry.json` | `/resource/endpoint/registry` | NAPI crawl, vendored 2026-09-03 (sdv-py #452) | 4 of 85 self-documented resources kept (`BoxscoreResource`, `PlayerResource`, `PlayerTeamAssociationsResource`, `RecruitTeamAssociationsResource`) |
| `league_meta_nfl.json` | `/resource/league/59` | NAPI crawl, vendored 2026-09-03 (sdv-py #452) | none (one plain object, `teams: []`) |
| `season_teams_nfl.json` | `/resource/season/teams/18` (NFL season id 18; each row's `meta.seasonId` is 18) | NAPI crawl, vendored 2026-09-03 (sdv-py #452) | first 3 of 36 teams (ARI 404, ATL 405, BAL 406) |
| `team_players_nfl.json` | `/resource/team/players/247415` (NFL team 247415: CBS team-code 34, Houston) | NAPI crawl, vendored 2026-09-03 (sdv-py #452) | first 3 of 576 players (ids 1751796, 2129673, 1675230) |
| `team_standings_nfl.json` | `/resource/team/standings/247415` (team-code 34, global-id 325, Houston) | NAPI crawl, vendored 2026-09-03 (sdv-py #452) | years 2024 and 2025 of 2016-2025 kept, each with `pre` + `regular` blocks |
| `team_standings_nhl.json` | `/resource/team/standings/1842464` (team-code 28, global-id 4981, Winnipeg) | NAPI crawl, vendored 2026-09-03 (sdv-py #452) | year 2025 of 2015-2025 kept (`regular` + `pre`) |
| `game_scoring_plays_ncaaf.json` | `/resource/game/scoring/plays/50027666` (OHIOST @ TEXAS, 2026-09-12) | vendored 2026-09-17 (sdv-py #511) | first 10 plays |
| `game_scoring_plays_nfl.json` | `/resource/game/scoring/plays/50029216` (CLE @ JAX, 2026-09-13) | vendored 2026-09-17 (sdv-py #511) | first 10 plays |
| `game_scoring_drives_ncaaf.json` | `/resource/game/scoring/drives/50027666` | vendored 2026-09-17 (sdv-py #511) | first 3 drives |
| `game_scoring_drives_nfl.json` | `/resource/game/scoring/drives/50029216` | vendored 2026-09-17 (sdv-py #511) | first 3 drives |

The standings route's requested `team_id` is not recorded in the trimmed body (the
crawl sampled one team per league); the team is identified by the `team-code` /
`team-city` blocks inside it.

Not covered by any public capture: the `scoreboard` / `scores` family
(`parse_cbs_scoreboard`) and the `odds` family (`parse_cbs_odds`). Their tests in
`cbs_napi.test.js` stay synthetic and are labelled as such.

# NWSL (StatsPerform SDP) fixtures

Real, trimmed responses from `https://api-sdp.nwslsoccer.com/v1/nwsl/football/...`,
captured 2026-07-18 and copied byte-for-byte from `sdv-internal-refs/nwsl/captures/`.

| File | Route |
|---|---|
| `sdp_competitions.json` | `/competitions` |
| `sdp_teams.json` | `/seasons/{seasonId}/teams` |
| `sdp_stages.json` | `/seasons/{seasonId}/stages` |
| `sdp_standings_overall.json` | `/seasons/{seasonId}/standings/overall` |
| `sdp_stats_players.json` | `/seasons/{seasonId}/stats/players` |
| `sdp_stats_teams.json` | `/seasons/{seasonId}/stats/teams` |
| `sdp_match_lineups.json` | `/seasons/{seasonId}/matches/{matchId}/lineups` |
| `sdp_multipleSeasonMatches.json` | `/seasons/multipleSeasonMatches` |

Row arrays are trimmed to three entries. `sdp_stages.json` is a real
`{"stages": null}` body -- a pure-league season has no stages -- and is kept
precisely because it is the empty-payload case the parser must survive. Do not
hand-edit.

---

Copied byte-for-byte from sportsdataverse-py@719de79edb685b89c524f8b4c0c146fea0b53855 `tests/fixtures/nwsl_api/` (only the JSON files that back the sportsdataverse-js tests). `py_oracle.json` is sdv-py's own parser output on these bodies (polars frames -> columns, dtypes, rows), generated at that pin; `test/parsers/keyless.test.js` compares the JS parsers to it.

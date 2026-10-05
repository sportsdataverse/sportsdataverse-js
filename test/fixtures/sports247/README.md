# 247Sports RDB fixtures (`sports247`)

**Provenance:** copied byte-for-byte (git blob shas match) from
`sportsdataverse-py@719de79edb685b89c524f8b4c0c146fea0b53855:tests/fixtures/sports247/`.
They are real captures from `ipa.247sports.com` (the 247Sports Recruit Database)
taken 2026-07-07/08 with Chrome TLS impersonation. The gated routes were captured
with the free guest JWT and trimmed to 3 rows. Used by
`test/parsers/sports247.test.js`. Do not hand-edit them. To refresh, re-copy
them from sdv-py at the vendor pin.

| File | Endpoint | Shape |
|---|---|---|
| `sports247_teams_football.json` | `/rdb/v1/teams/?sportKey=1` | bare array (139 teams) |
| `sports247_institution_rankings_fb_2026.json` | `/rdb/v1/rankings/1/2026/institutionrankings/?pagesize=5` | `{pagination, list}` |
| `sports247_recruits_fb_2026.json` | `/rdb/v1/recruits/?sportKey=1&year=2026` | `{pagination, players}` |
| `sports247_transfers_fb_2026.json` | `/rdb/v1/transfers/?sportKey=1&year=2026` | `{lastUpdated, pagination, players}` |
| `sports247_coaches_fb_2026.json` | `/rdb/v1/coaches/?sportKey=1&year=2026` | `{pagination, results}` |
| `sports247_transfer_portal_player_feed_fb_2026.json` | `/rdb/v1/rankings/1/2026/transferPortalPlayerfeed/` | `{rankings}` |
| `sports247_composite_team_ranking_feed_fb_2026.json` | `/rdb/v1/rankings/1/2026/compositeTeamRankingFeed/` | bare array |
| `sports247_transfer_portal_only_team_feed_fb_2026.json` | `/rdb/v1/rankings/1/2026/transferPortalOnlyTeamFeed/` | bare array |
| `sports247_current_target_predictions_fb_2026.json` | `/rdb/v1/sites/1/years/2026/sports/1/currentTargetPredictions/` | bare array |
| `sports247_sports_year_fb.json` | `/rdb/v1/sports/1/year/` | bare array of scalar years |
| `sports247_tags_autocomplete.json` | `/rdb/v1/tags/autocomplete/?defaultName=smith` | bare array |
| `sports247_positions_fb_2026.json` | `/rdb/v1/positions/?sportKey=1&year=2026` | bare array |

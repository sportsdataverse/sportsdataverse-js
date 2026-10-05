# stats.nba.com / stats.wnba.com fixtures

Real captured response bodies, copied byte-for-byte from sportsdataverse-py at
`719de79edb685b89c524f8b4c0c146fea0b53855` (captured live from a residential IP
with curl_cffi `impersonate="chrome"`). No synthetic payloads.

| File | sdv-py source | endpoint |
|---|---|---|
| `cap_leaguedashplayerstats_nba.json` | `tests/nba/fixtures/` | `leaguedashplayerstats` LeagueID=00, 2023-24 (572 rows) |
| `cap_leaguedashplayerstats_wnba.json` | `tests/nba/fixtures/` | `leaguedashplayerstats` LeagueID=10 |
| `cap_leaguedashplayerstats_gleague.json` | `tests/nba/fixtures/` | `leaguedashplayerstats` LeagueID=20 |
| `cap_leaguedashplayerstats_summer.json` | `tests/nba/fixtures/` | `leaguedashplayerstats` LeagueID=15 |
| `cap_playercareerstats_nba.json` | `tests/nba/fixtures/` | `playercareerstats` (14 result sets, most empty) |
| `cap_boxscoretraditionalv3_wnba.json` | `tests/nba/fixtures/` | `boxscoretraditionalv3` GameID=1022400001 |
| `cap_boxscoresummaryv3_wnba.json` | `tests/nba/fixtures/` | `boxscoresummaryv3` GameID=1022400001 |
| `scheduleleaguev2_2025_26.json` | `tests/fixtures/nba_stats/` | `scheduleleaguev2` 2025-26 (trimmed to first/last 4 dates) |
| `scheduleleaguev2_2026_wnba.json` | `tests/fixtures/wnba_stats/scheduleleaguev2_2026.json` | WNBA `scheduleleaguev2` 2026 |

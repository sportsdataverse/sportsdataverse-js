# ESPN basketball box producer fixtures

Inputs + oracle for `test/producers/espn_basketball_box.test.js` (the
`src/producers/espn_basketball_box.ts` port of sdv-py's `helper_<lg>_player_box` /
`helper_<lg>_team_box`). Every capture is a REAL ESPN game payload, gzipped byte-for-byte
(`gzip`, mtime 0): the sdv-py and raw-repo files are the committed git blobs
(`git -C <repo> show <commit>:<path>`, so LF line endings, never a Windows working-tree
copy); `gunzip -c <file> | git hash-object --stdin` reproduces the blob id. `../summary_nba.json`
(the existing NBA capture, identical to sdv-py's `tests/fixtures/espn/summary_nba.json`) is
used as well.

| File | Source | What it exercises (sdv-py output) |
|---|---|---|
| `summary_wnba.json.gz` | sdv-py@719de79 `tests/fixtures/espn/summary_wnba.json` (Site v2 `summary?event=401726992`) | full WNBA game, `plus_minus`, DNP `reason` |
| `summary_mbb.json.gz` | sdv-py@719de79 `tests/fixtures/espn/summary_mbb.json` (event 401638645) | full MBB game; UTC date crosses into the previous New York day |
| `summary_wbb.json.gz` | sdv-py@719de79 `tests/fixtures/espn/summary_wbb.json` (event 401637613) | full WBB game |
| `wbb_final_320940239_archival_flag_false.json.gz` | sdv-py@719de79 `tests/fixtures/wbb/final_320940239_archival_flag_false.json` (trimmed real payload, see sdv-py `tests/fixtures/wbb/README.md`) | `boxscoreAvailable=false` with real stats: extracted; minutes `--` -> null |
| `mbb_final_303173134.json.gz` | hoopR-mbb-raw@5e26c88 `mbb/json/final/303173134.json` | 2010 game vs a non-D1 opponent, team 2 ships NO athletes: strict gate (MBB/WBB) -> no rows, lax gate (NBA/WNBA) -> team 1's 21 rows |
| `mbb_final_401721722.json.gz` | hoopR-mbb-raw@5e26c88 `mbb/json/final/401721722.json` | first athlete is a DNP with empty stats: player box skipped (probe), team box published |
| `mbb_final_320710153.json.gz` | hoopR-mbb-raw@5e26c88 `mbb/json/final/320710153.json` | no team statistics: team box skipped, player box published |
| `wnba_final_230628004.json.gz` | wehoop-wnba-raw@53422a7 `wnba/json/final/230628004.json` | team 1 ships no athletes: player box skipped for every league, team box published |
| `wnba_final_230614002.json.gz` | wehoop-wnba-raw@53422a7 `wnba/json/final/230614002.json` | first athlete's stats are `--`: player box skipped (float probe), team box published |
| `nba_final_220210031.json.gz` | hoopR-nba-raw@1bee7b3 `nba/json/final/220210031.json` | no athletes and no team statistics: both skipped |
| `nba_final_230209031.json.gz` | hoopR-nba-raw@1bee7b3 `nba/json/final/230209031.json` | every stat `--`, no team statistics: both skipped |
| `wbb_final_223142348.json.gz` | wehoop-wbb-raw@b106236 `wbb/json/final/223142348.json` | archival WBB with no athletes / team statistics: both skipped |
| `nba_summary_scheduled_401909093.json.gz` | `GET https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=401909093` via `sdv.nba.espn_nba_summary`, captured live 2026-10-05 | a scheduled game: no `boxscore.players` (player box skipped). Team box skipped at the `winner` gate: neither competitor has a `winner` key, and sdv-py checks that before the split-stat gate (the `M-A` split stats are absent too, so the split-stat gate would also skip it). The derived `team_no_winner` case reaches the winner gate on a full-stats payload |
| `oracle.json.gz` | `tools/parity/espn_basketball_box_oracle.py` run in a clean sdv-py checkout at 719de79 | all eight helpers on every capture above (never on itself), plus `derived` cases (a capture + one documented mutation, inputs stored in the oracle) for gate branches no capture reaches. Date / Datetime cells are py `isoformat()` strings; the test reads them as JS `Date`s |

Raw-repo blobs are from the noted commits of `sportsdataverse/<repo>` on GitHub.
To regenerate the oracle, follow the docstring of `tools/parity/espn_basketball_box_oracle.py`.

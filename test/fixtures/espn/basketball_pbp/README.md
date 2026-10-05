# ESPN basketball PBP producer fixtures

Inputs + oracle for `test/producers/espn_basketball_pbp.test.js` (the
`src/producers/espn_basketball_pbp.ts` port of sdv-py's `espn_<lg>_pbp` / `helper_<lg>_pbp`).
The test also runs on every capture in `../basketball_box/` and on `../summary_nba.json`; the
captures here add the league facts those do not reach. Each is a REAL ESPN Site v2 summary,
`GET https://site.api.espn.com/apis/site/v2/sports/basketball/<league>/summary?event=<id>`
(user agent `Mozilla/5.0 (compatible; sportsdataverse-js/3.x)`), captured live on 2026-10-05 and
stored byte-for-byte (`gzip -9 -n`); `gunzip -c <file> | sha256sum` gives the hash below.

| File | Game | sha256 of the JSON | What it exercises (sdv-py output) |
|---|---|---|---|
| `nba_summary_401360428.json.gz` | NBA 2022-01-10, OT | `a4178cd820b28dd323a45c72affb9f34e7f775d3a1998f5a14f2fce53ea7d2b0` | OT (period 5 starts at 300); two `pickcenter` providers (`"1004"`, `"1002"`: read in str(provider.id) order, so spread -8.5 / over-under 212 / favorite all from the `"1002"` row) |
| `wnba_summary_230614002.json.gz` | WNBA 2003 | `d5fec8754e4b16bf1e41ebda0fe7885c46625dbab91406301cf53fc3285f7b57` | WNBA halves era (`format.regulation.periods` 2): period IS the half, 1200 / 2400 ladders, timeouts split at period 1; decimal clocks (`"23.4"`) get the `"0:"` prefix (MBB too, for its clock split only, since sdv-py #688) |
| `mbb_summary_401600379.json.gz` | MBB 2024 Maryland @ Ohio State, 2OT | `5ffcde30fcc84ce7c55b5b61fbe2e9e2f4fa7d445aeeb7d9351bb5b99b43eb47` | MBB OT: `end.game_seconds_remaining` and `end.period_seconds_remaining` both reset to 300 at both OTs (sdv-py #688; before, `end.period` only at the first); ShortTimeOut and RegularTimeOut plays; `Ohio State` -> alt name `Ohio St` |
| `wbb_summary_400787556.json.gz` | WBB 2015 tournament, OT | `2a15d0eb4541a23dc719e07e6e9e38584e7f6fb56f9c0bb0ef2ae41ff92f040e` | WBB halves era with OT (period 3); 18-digit play ids (BigInt) |
| `wbb_summary_401587390.json.gz` | WBB 2024, 4OT | `41982c36db3af859b10dbb60675a77502129b3adf21d8c8369b85f639f2cbc4c` | quarter era with four OTs (periods 5-8 each start at 300); ShortTimeOut plays |
| `nba_summary_401430219.json.gz` | NBA 2022-04-26 ATL @ MIA, playoffs (`event=401430219`) | `15fe46b3f82a1d35e010363f574bfc2756ae033d1b08ba4d747b97498e9719bf` | sdv-py #688's mixed-row pickcenter: a record-only teamrankings `"1002"` row (no spread, favorite false for both teams) sorts ahead of consensus `"1004"` (MIA -4.5). The spread and the favorite now both come from the consensus row: MIA's home line is +4.5 (was -4.5) |
| `nba_summary_260312029.json.gz` | NBA 2006-03-12 PHI @ MEM (`event=260312029`) | `1f16f160ebd287d979e533ecd21774da04edf779076753f1778a7927bab07ac4` | "Memphis full timeout" contains "phi": team timeouts are credited by `team.id`, and the derived `timeout_team_stripped` case (every play's `team` removed) checks the whole-word name fallback |
| `wnba_summary_400927398.json.gz` | WNBA 2017-05-14 CHI @ MIN (`event=400927398`) | `40a8ccd88aca69cfe472df2ee53ce525856b5dd76d3206a245a5e81fd83e19b4` | two RegularTimeOut plays whose text names no team (`" Full timeout"`), credited by their `team.id` (CHI, MIN) |
| `pickcenter.json` | the `pickcenter` arrays of MBB 401856600 / 400766104 / 400587253 / 330582427 / 401364342, NBA 401809238 / 400578293 / 401430219, WNBA 401320565, WBB 401468165 | `c30c4cc3de7df1e45e4d586a2512f299a93fe05d9832c0f10570a43488d4ec2d` (the file) | copied verbatim from sdv-py `tests/fixtures/espn/basketball_pbp/pickcenter.json` at 3135873 (sdv-py took them from the hoopR / wehoop raw stores, 2026-10-05). Not a capture (only `*.json.gz` are); the oracle splices four of them (MBB 330582427 and 401364342, WNBA 401320565, WBB 401468165) into `summary_{mbb,wnba,wbb}` as `derived` cases, and the #688 tests assert sdv-py's own expected values on all of them: one provider, several providers, str(provider.id) order (teamrankings `"1002"` before Caesars `"45"`), a lone record-only entry, a record-only row ahead of consensus |
| `oracle.json.gz` | `tools/parity/espn_basketball_pbp_oracle.py` run in a clean sdv-py checkout at 3135873 (`BASKETBALL_PBP_PIN`) | | all four leagues on every capture (here, `../basketball_box/`, `../summary_nba.json`; never an oracle), plus `derived` cases (a capture + one documented mutation; inputs = its `header` / `format` / `plays` / `pickcenter`, links stripped, stored in the oracle) for branches no capture reaches |

To regenerate the oracle, follow the docstring of `tools/parity/espn_basketball_pbp_oracle.py`.

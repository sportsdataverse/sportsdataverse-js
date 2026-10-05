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
| `nba_summary_401360428.json.gz` | NBA 2022-01-10, OT | `a4178cd820b28dd323a45c72affb9f34e7f775d3a1998f5a14f2fce53ea7d2b0` | OT (period 5 starts at 300); the only capture with two `pickcenter` providers (`"1004"`, `"1002"`: sorted by id, spread -8.5 / over-under 212 / favorite from `"1002"`) |
| `wnba_summary_230614002.json.gz` | WNBA 2003 | `d5fec8754e4b16bf1e41ebda0fe7885c46625dbab91406301cf53fc3285f7b57` | WNBA halves era (`format.regulation.periods` 2): period IS the half, 1200 / 2400 ladders, timeouts split at period 1; decimal clocks (`"23.4"`) get the `"0:"` prefix; MBB raises on them |
| `mbb_summary_401600379.json.gz` | MBB 2024 Maryland @ Ohio State, 2OT | `5ffcde30fcc84ce7c55b5b61fbe2e9e2f4fa7d445aeeb7d9351bb5b99b43eb47` | MBB OT: `end.game_seconds_remaining` resets to 300 at both OTs, `end.period_seconds_remaining` only at the first (py quirk); ShortTimeOut plays; `Ohio State` -> alt name `Ohio St` |
| `wbb_summary_400787556.json.gz` | WBB 2015 tournament, OT | `2a15d0eb4541a23dc719e07e6e9e38584e7f6fb56f9c0bb0ef2ae41ff92f040e` | WBB halves era with OT (period 3); 18-digit play ids (BigInt) |
| `wbb_summary_401587390.json.gz` | WBB 2024, 4OT | `41982c36db3af859b10dbb60675a77502129b3adf21d8c8369b85f639f2cbc4c` | quarter era with four OTs (periods 5-8 each start at 300); ShortTimeOut plays |
| `oracle.json.gz` | `tools/parity/espn_basketball_pbp_oracle.py` run in a clean sdv-py checkout at 719de79 | | all four leagues on every capture (here, `../basketball_box/`, `../summary_nba.json`; never an oracle), plus `derived` cases (a capture + one documented mutation; inputs = its `header` / `format` / `plays` / `pickcenter`, links stripped, stored in the oracle) for branches no capture reaches |

To regenerate the oracle, follow the docstring of `tools/parity/espn_basketball_pbp_oracle.py`.

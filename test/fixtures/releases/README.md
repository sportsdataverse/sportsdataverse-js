# Release-loader fixtures

No-network fixtures for `test/releases.test.js` (the generated `load*` release
loaders, `src/core/releases.ts`). Real SportsDataverse / nflverse release assets,
downloaded 2026-10-05.

| File | source asset | notes |
|---|---|---|
| `cfb_ratings_2024.parquet` | `sportsdataverse-data` release `cfb_ratings`, `cfb_ratings_2024.parquet` | verbatim (17,743 bytes). Polars writer, ZSTD. `team_id` is a STRING id (`id_int64` in releases.yaml); `season`, `games`, `*_rank` are INT64. 134 rows. |
| `nhl_groups.parquet` | `sportsdataverse-data` release `nhl_groups`, `nhl_groups.parquet` | verbatim (3,997 bytes). Polars writer, ZSTD. Single-asset loader (no season token). 21 rows. |
| `cfb_team_portal_2024.parquet` | `sportsdataverse-data` release `cfb_team_portal`, `cfb_team_portal_2024.parquet` | verbatim (7,814 bytes). Polars writer. Its `team_id` is INT64 where `cfb_ratings_2024`'s is STRING — the real cross-dataset drift sdv-py's `id_int64` exists for; used for the season type-drift (supercast) test. polars `pl.concat([portal, ratings], how="diagonal_relaxed")` gives `team_id` String, 370 rows, head `['2', '5', '6']`, tail `['239', '66']`. 236 rows. |
| `ftn_charting_2022_head100.parquet` | `nflverse-data` release `ftn_charting`, `ftn_charting_2022.parquet` | the first 100 rows of the real asset re-written with pyarrow 24.0.0 (`pq.write_table(t.slice(0, 100), compression="snappy")`); the arrow schema, including its metadata, is identical to the original (asserted when written). arrow-cpp writer, SNAPPY. Carries a `timestamp[us, tz=UTC]` column. |
| `cfb_pbp_2024_head20.parquet` | `sportsdataverse-data` release `espn_cfb_pbp`, `play_by_play_2024.parquet` (55,573,805 bytes, 163,567 rows × 506 columns) | the first 20 rows re-written with pyarrow 24.0.0 (`pq.write_table(t.slice(0, 20), compression="zstd")`); arrow schema incl. metadata asserted identical to the original. Its INT64 play `id` (e.g. `401628579101849903`) is beyond `Number.MAX_SAFE_INTEGER` — the modern 18-digit case of the INT64 id rule (a decimal string). |
| `cfb_pbp_2013_head20.parquet` | `sportsdataverse-data` release `espn_cfb_pbp`, `play_by_play_2013.parquet` (53,006,390 bytes, 159,038 rows × 499 columns, Polars writer, ZSTD), downloaded 2026-10-05 | the first 20 rows re-written the same way (pyarrow 24.0.0, zstd; schema incl. metadata asserted identical). Its INT64 play ids are 12 digits (`332830097002`, safe; every 2013 id is 12 digits) — the old-era case: before v4 they decoded to numbers while 2024's were BigInt. polars `pl.concat([2013, 2024], how="diagonal_relaxed")`: 40 rows × 506 columns (2013's 499 ⊂ 2024's), `id` Int64, head `332830097002`, tail `401628579101877912`. |
| `cfb_pbp_r_2024_head20.parquet` | `sportsdataverse-data` release `cfbfastR_cfb_pbp`, `play_by_play_2024.parquet` (120,791,523 bytes, 277,048 rows × 362 columns, parquet-cpp-arrow 11.0.0, SNAPPY; sha256 `60489da0…92bd4`), downloaded 2026-10-05 | the first 20 rows re-written with pyarrow 25.0.1 (`pq.write_table(t.slice(0, 20), compression="snappy")`; schema incl. metadata asserted identical). cfbfastR's R-written pbp (`load_cfb_pbp_r`): its `id_play` is a DOUBLE already rounded past 2^53 (`4.016283191018499e+17`, the first two plays alike), the real case of the double-id type rule (a number at runtime, typed `string \| number`); `game_id` is INT32. |
| `pbp_participation_2025_head20.parquet` | `nflverse-data` release `pbp_participation`, `pbp_participation_2025.parquet` (4,741,443 bytes, 45,184 rows × 26 columns, arrow-cpp 23.0.0, SNAPPY), downloaded 2026-10-05 | the first 20 rows re-written with pyarrow 24.0.0 (`compression="snappy"`; schema incl. metadata asserted identical). Its `play_id` is a DOUBLE holding integer ids (`40.0`, `71.0`, …; R numeric) — the real DOUBLE case of the any-width id rule (`"40"`, never `"40.0"`). Every 2025 `play_id` is integral and below 2^53 (all 45,184 checked). |
| `crafted_ids_2021.parquet`, `crafted_ids_2022.parquet`, `crafted_ids_2023.parquet` | **crafted** (not a release asset): pyarrow 24.0.0, zstd | The edge cases no real release carries, for the cross-season id unification test: `play_id` STRING `["40", "71"]` (2021); DOUBLE with a fraction `[1.5, 2.0, null]` (2022); DOUBLE integral with a NaN value (not a null) `[40.0, 71.0, null, NaN]` (2023); each with an INT32 `season`. Written by `pq.write_table(pa.table({...}), path, compression="zstd")`. |

sha256:

```
2743dc576c0f9dd7e32ad0d9c717d9c303e8a88c991a2edf376be995f0d2f1d2  cfb_ratings_2024.parquet
f3f811b990a9a640d13ec1bde8f3e82ebb208a631e0c8e9774483dcaad3697cd  nhl_groups.parquet
1265c683e9d3f1cbbd3bd8da7637a91801b563426d1ac1aa2b9f29e728595c6a  cfb_team_portal_2024.parquet
f8bd58b245bb871a76ccb8b971bf5e1a2aa807c01eaf624953f83d18c4a537e4  ftn_charting_2022_head100.parquet
2d12745d5ae47083b0cd8568da0384245a67cc7e3f81151c8cbf82984ce8db5a  cfb_pbp_2024_head20.parquet
5ac95feecb2b36391c91a1466d93a17787ab0137a7337cc82c8b33530aa765fd  cfb_pbp_2013_head20.parquet
cf5207aadcc1a57810a9f643ef7a84f92be147bb0eaedecb91f0ba8b8e65de6d  cfb_pbp_r_2024_head20.parquet
401bbd1a6a36fd4ab4e2b5ccbd91d20a56d9c7efe45021aa67701f5586b7e496  pbp_participation_2025_head20.parquet
835237c763577b3cb6aa8a1c1921715019415478fcd74286f30456fefd1b2df4  crafted_ids_2021.parquet
edec14280bf7df68dc5a6f091dab5f124cb3e39fb4163cbb781714810f1c36c4  crafted_ids_2022.parquet
f696736c3a5ae9ada88537ac0bd89d85dc0331cc5952583a90faa3a09a47df6f  crafted_ids_2023.parquet
```

The two codecs are the two the release assets actually use: Polars-written
SportsDataverse assets are ZSTD, arrow-cpp (R / nflverse) assets are SNAPPY.

## nba_shots_2024_spots.json (tutorial snapshot)

The league baseline for the "shot chart vs league" tutorial
(`examples/94_sdvplot_shots_vs_league.mjs`). **Derived**, not verbatim:
`tools/snapshots/nba-league-shots.mjs` downloads `sportsdataverse-data` release
`espn_nba_shots`, `shots_2024.parquet` (3,641,778 bytes, sha256
`bdfc1be853d0a7f56e8b7529eb3523a496fabababf6ffd7bd7473f518ea87972`, 291,139 rows,
1,320 games) on 2026-10-08T23:04:57Z, decodes those bytes with
`sdv.nba.loadNbaShots({ seasons: 2024 })`, drops free throws, and counts the
234,063 field-goal attempts per ESPN spot as `[x, y, value, attempts, makes]`
(2,310 rows). The provenance block inside the file records the same, plus the
sdv-js commit. A miss's `value` (2 or 3) comes from the measured `isThree` rule in
that script (99.95% agreement with the scorer on the season's 110,857 makes; 169 of
169 on game 401585607). `test/tutorial-fixtures.test.js` checks it against
`espn/summary_nba.json` offline and, with `SDV_LIVE=1`, re-downloads the asset,
checks its sha256 and re-derives every row.

```
9244145c4322b9dad164b8b69bfcbd036fb8e96975f10ef56ce8075dc7ab9a18  nba_shots_2024_spots.json
```

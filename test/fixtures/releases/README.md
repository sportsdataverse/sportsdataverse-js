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

sha256:

```
2743dc576c0f9dd7e32ad0d9c717d9c303e8a88c991a2edf376be995f0d2f1d2  cfb_ratings_2024.parquet
f3f811b990a9a640d13ec1bde8f3e82ebb208a631e0c8e9774483dcaad3697cd  nhl_groups.parquet
1265c683e9d3f1cbbd3bd8da7637a91801b563426d1ac1aa2b9f29e728595c6a  cfb_team_portal_2024.parquet
f8bd58b245bb871a76ccb8b971bf5e1a2aa807c01eaf624953f83d18c4a537e4  ftn_charting_2022_head100.parquet
2d12745d5ae47083b0cd8568da0384245a67cc7e3f81151c8cbf82984ce8db5a  cfb_pbp_2024_head20.parquet
5ac95feecb2b36391c91a1466d93a17787ab0137a7337cc82c8b33530aa765fd  cfb_pbp_2013_head20.parquet
```

The two codecs are the two the release assets actually use: Polars-written
SportsDataverse assets are ZSTD, arrow-cpp (R / nflverse) assets are SNAPPY.

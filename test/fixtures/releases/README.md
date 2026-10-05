# Release-loader fixtures

No-network fixtures for `test/releases.test.js` (the generated `load*` release
loaders, `src/core/releases.ts`). Real SportsDataverse / nflverse release assets,
downloaded 2026-10-05.

| File | source asset | notes |
|---|---|---|
| `cfb_ratings_2024.parquet` | `sportsdataverse-data` release `cfb_ratings`, `cfb_ratings_2024.parquet` | verbatim (17,743 bytes). Polars writer, ZSTD. `team_id` is a STRING id (`id_int64` in releases.yaml); `season`, `games`, `*_rank` are INT64. 134 rows. |
| `nhl_groups.parquet` | `sportsdataverse-data` release `nhl_groups`, `nhl_groups.parquet` | verbatim (3,997 bytes). Polars writer, ZSTD. Single-asset loader (no season token). 21 rows. |
| `ftn_charting_2022_head100.parquet` | `nflverse-data` release `ftn_charting`, `ftn_charting_2022.parquet` | the first 100 rows of the real asset re-written with pyarrow 24.0.0 (`pq.write_table(t.slice(0, 100), compression="snappy")`); the arrow schema, including its metadata, is identical to the original (asserted when written). arrow-cpp writer, SNAPPY. Carries a `timestamp[us, tz=UTC]` column. |

sha256:

```
2743dc576c0f9dd7e32ad0d9c717d9c303e8a88c991a2edf376be995f0d2f1d2  cfb_ratings_2024.parquet
f3f811b990a9a640d13ec1bde8f3e82ebb208a631e0c8e9774483dcaad3697cd  nhl_groups.parquet
f8bd58b245bb871a76ccb8b971bf5e1a2aa807c01eaf624953f83d18c4a537e4  ftn_charting_2022_head100.parquet
```

The two codecs are the two the release assets actually use: Polars-written
SportsDataverse assets are ZSTD, arrow-cpp (R / nflverse) assets are SNAPPY.

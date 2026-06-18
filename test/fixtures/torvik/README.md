# BartTorvik / T-Rank fixtures

No-network captures for the `torvik` flat-API parser tests
(`test/parsers/torvik.test.js`). All five are **2024** (the 2023-24 season)
responses captured live from `https://barttorvik.com` on **2026-06-18**, trimmed
to a few rows. They preserve each endpoint's native format so the parser tests
exercise the real shapes.

| File | endpoint | format |
|---|---|---|
| `torvik_ratings.csv` | `/2024_team_results.csv` | CSV **with header** |
| `torvik_team_factors.csv` | `/2024_fffinal.csv` | CSV **with header** |
| `torvik_player_stats.csv` | `/getadvstats.php?year=2024&csv=1` | **headerless** CSV (67 positional cols) |
| `torvik_game_stats.json` | `/getgamestats.php?year=2024&json=1` | **headerless** JSON array-of-arrays (31 positional cols) |
| `torvik_game_schedule.json` | `/2024_super_sked.json` | **headerless** JSON array-of-arrays (55 positional cols) |

The positional column-name arrays are ported verbatim from hoopR's
`R/torvik_*.R` and live in `src/parsers/torvik.ts`. `barttorvik.com` rejects
default programmatic User-Agents, so the family's getter
(`src/core/torvik_runtime.ts`) sets a browser UA.

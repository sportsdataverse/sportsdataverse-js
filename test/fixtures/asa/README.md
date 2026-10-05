# ASA fixtures

Real, trimmed responses from the American Soccer Analysis public API
(`https://app.americansocceranalysis.com/api/v1/mls/...`), captured 2026-07-18
and copied byte-for-byte from `sdv-internal-refs/asa/captures/mls/`.

| File | Route |
|---|---|
| `teams.json` | `/mls/teams` |
| `players.json` | `/mls/players` |
| `games.json` | `/mls/games` |
| `players_xgoals.json` | `/mls/players/xgoals` |
| `players_salaries.json` | `/mls/players/salaries` |
| `players_goals-added.json` | `/mls/players/goals-added` |
| `teams_goals-added.json` | `/mls/teams/goals-added` |

Each body is the real top-level JSON array trimmed to three rows. Regenerate by
re-copying from the reference repo; do not hand-edit.

---

Copied byte-for-byte from sportsdataverse-py@719de79edb685b89c524f8b4c0c146fea0b53855 `tests/fixtures/asa/` (only the JSON files that back the sportsdataverse-js tests). `py_oracle.json` is sdv-py's own parser output on these bodies (polars frames -> columns, dtypes, rows), generated at that pin; `test/parsers/keyless.test.js` compares the JS parsers to it.

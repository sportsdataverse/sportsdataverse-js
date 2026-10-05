# NFL Pro fixtures

`<name>.json` — copied verbatim from sportsdataverse-py `tests/fixtures/nflpro/`
at `719de79edb685b89c524f8b4c0c146fea0b53855` (blob shas match): trims of verified
`pro.nfl.com` captures (season 2024, seasonType REG, captured 2026-09-03), each
fetched to completion (rows == the envelope's own `total`) before trimming.

| File | Route | Collection key |
|---|---|---|
| `players_offense_passing_season.json` | `/api/secured/stats/players-offense/passing/season` | `passers` |
| `team_offense_overview_season.json` | `/api/secured/stats/team-offense/overview/season` | `offense` |
| `fantasy_game.json` | `/api/secured/stats/fantasy/game` | `players` |

`<name>.py.json` — the golden master: sdv-py's `parse_nfl_pro_stats`
(`sportsdataverse/nfl/nflpro_parsers.py`, same pin) run on `<name>.json`, written
as `{columns, rows}` (`to_dicts()`; NaN -> null).

# PFF Developer API fixtures

`<name>.json` — copied verbatim from sportsdataverse-py
`tests/fixtures/pff_api/` at `719de79edb685b89c524f8b4c0c146fea0b53855` (blob shas
match). Each is an example response PFF itself publishes in its public Developer
API spec (`https://api.pff.com/openapi.json`, v2.1.0, fetched 2026-09-26): "an
actual body … cut to its first few rows" from one request (Cincinnati Bengals,
franchise 7, 2022, week 1; Joe Burrow, player 28022). None are our own captures.

`<name>.py.json` — the golden master: sdv-py's own parser at the same pin
(`parse_pff_report` / `parse_pff_player_detail` / `parse_pff_v2_table` from
`sportsdataverse/nfl/pff_parsers.py`) run on `<name>.json`, written as
`{columns, rows}` (`polars.DataFrame.to_dicts()`; NaN -> null).
`test/parsers/pff_api.test.js` asserts the JS port returns exactly these rows,
in this column order.

`<name>.<section>.py.json` — the same golden master for a non-default table,
i.e. sdv-py's own argument for it: `team_rushing_direction.teamTotals`
(`parse_pff_v2_table(raw, table="teamTotals")`), `player_offense_pass_blocking.career`
(`parse_pff_player_detail(raw, career=True)`), and
`facet_passing_summary.passing_summary` (`parse_pff_report(raw, report="passing_summary")`).
The JS wrappers select these with `section`.

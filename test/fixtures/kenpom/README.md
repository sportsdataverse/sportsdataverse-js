# KenPom fixtures

`ratings_2025.trim.html` — copied verbatim from sportsdataverse-py
`tests/fixtures/kenpom/` at `719de79edb685b89c524f8b4c0c146fea0b53855` (blob sha
matches): `GET https://kenpom.com/index.php?y=2025`, captured 2026-09-02 with a
live subscription, trimmed to 3 of the page's 10 `<thead>` blocks and the first 8
`<tbody>` rows (it keeps a seeded team, an in-table header repeat and a blank
separator row). No cookies or session ids. KenPom is subscription content, so
only enough rows to pin parsing behaviour are committed.

`ratings_2025.trim.py.json` — the golden master: sdv-py's `parse_kenpom_page`
(`sportsdataverse/mbb/kenpom_runtime.py` + `_html_tables.py`, same pin, pandas
3.0.4 / lxml 6.1.1 / bs4 4.15.0) run on the HTML, written as
`{table_key: {columns, rows}}`.

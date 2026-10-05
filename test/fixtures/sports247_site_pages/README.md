# 247Sports site-page fixtures (`sports247_site_pages`)

**Provenance:** copied byte-for-byte (git blob shas match) from
`sportsdataverse-py@719de79edb685b89c524f8b4c0c146fea0b53855:tests/fixtures/sports247_site_pages/`.
They are real captures of the auth-free `247sports.com/*.json` page-model routes,
taken 2026-07-08. Each one matches an `x-example-url` in
`sdv-internal-refs/247sports/site-pages.openapi.yaml`. Two examples:
`institution.json` comes from `https://247sports.com/Institution/24099.json`, and
`recruits_season.json` comes from
`https://247sports.com/Season/2026-Football/Recruits.json?Items=15&Page=1`.
Used by `test/parsers/sports247.test.js`. Do not hand-edit them. To refresh,
re-copy them from sdv-py at the vendor pin.

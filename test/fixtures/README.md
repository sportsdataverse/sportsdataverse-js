# Test fixtures

Every directory holds REAL captured responses (never synthetic payloads) with a
`README.md` giving each file's request URL, capture date, trimming (if any) and
the test that consumes it. A sdv-py-sourced capture cites the sdv-py commit it
was copied at and is byte-identical to that blob (a `*.gz` file is the capture
gzipped with `gzip -9 -n`; files are gzipped only above 1 MB).

| Directory | Source | Consumed by |
|---|---|---|
| `espn/` | ESPN Site v2 / Core v2 / Web v3 / fitt v3 / CDN, live + sdv-py | `test/parsers/espn*.test.js`, `test/producers/*`, `test/espn_shapes.test.js`, `test/legacy_services.test.js` |
| `py/` | sdv-py captures for the parser-parity harness (MLB Stats, NHL x4, stats.nba.com, stats.wnba.com, On3, Statcast) | `test/parsers/parity.test.js`, `test/parsers/mlb_api.test.js`, `test/parsers/nhl.test.js`, `test/types/*` |
| `cbs/`, `fox/`, `yahoo/`, `nfl_api/` | sdv-py captures of the CBS NAPI, Fox Bifrost, Yahoo shangrila + editorial and api.nfl.com families | `test/parsers/{cbs_napi,fox_bifrost,yahoo_*,nfl_api}.test.js` |
| `legacy/` | ESPN summaries, data.ncaa.com, 247sports.com page, ESPN tennis scoreboard | `test/legacy_services.test.js`, `test/tennis.test.js` |
| the rest | per-family READMEs | per-family suites |

## Known synthetic suites

Three suites still run on inline synthetic payloads because no real capture
exists anywhere in the ecosystem; their `describe` titles say so
(`(synthetic — no public capture)`). Replace them the day a capture lands.

| Suite | Why no capture |
|---|---|
| `test/parsers/odds_api.test.js` | The Odds API (`api.the-odds-api.com`) needs a paid API key; sdv-py and oddsapiR ship no captured body. |
| `test/parsers/recruiting.test.js` | The 247Sports Recruit Database API (`247sports.com/.../rdb`) answers HTTP 500 to every probe; no capture exists in sdv-py, recruitR or sdv-internal-refs. |
| `test/parsers/nfl_api.test.js` (partly) | api.nfl.com needs a minted token; sdv-py's five captures cover only the live-stats / gamedetails routes (`parse_nfl_team`). The standings / rosters / weeks / injuries / draft / combine / game-summaries / weekly-game-details parsers stay synthetic. |

`test/parsers/normalize.test.js` is synthetic by design: `normalize` is a pure
helper with no upstream payload (its header says so).

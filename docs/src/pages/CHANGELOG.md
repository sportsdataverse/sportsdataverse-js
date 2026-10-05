# ChangeLog

## **Unreleased**

### Added — `section` on the stats.nba.com / stats.wnba.com wrappers

- **`nba_stats_*` / `wnba_stats_*`:** `{ parsed: true, section: "<result set>" }` returns that one result set, as sdv-py's `result_set` does; an unknown name returns `[]` (sdv-py: a zero-row frame, no error). Without `section` the result is unchanged. Each result set of the committed real captures equals sdv-py's frame. The playground passes `section` to flat multi-table parsers and offers a section picker; the parity oracles keep sdv-py's NaN / inf as a marker the tests decode.

### Changed — sdv-py `frames_by` returns schemas and the `season_or_previous` transform

- **Codegen:** sdv-py adds `frames_by` (a request parameter name) to a `kind: frames` returns schema when the function returns ONE table, whose columns are the frame that parameter's value names (the pff_api `/v2` reports: `position_report` and `team_report` by `report`, `team_leaders` by `group`, `team_stats` by `category`). `vendor` accepts the key only on `kind: frames`, only as a non-empty string, and only when every endpoint that attaches the schema takes that parameter; anything else still fails closed. The reference docs render one column table per value ("When `group` is `passing`") under a single-table heading instead of "an object of tables", and the wrapper's `@returns` says the columns depend on the parameter. The parity harness counts every frame's columns but leaves these endpoints unverified (a capture records no request parameter to pick the frame by). The returns-table renderer moved to `tools/codegen/returns-tables.mjs`, so the tests run the real sdv-py schema through it. Unblocks the vendor sync (#88, #95).
- **Param transforms:** port of sdv-py's `season_or_previous`, which the next vendor sync puts on the season argument of 105 `nba_stats` / `wnba_stats` endpoints. An unset season becomes the family's previous season at call time (NBA: `2025-26` from October 2026; WNBA: last year's, turning over in May), because stats.nba.com and stats.wnba.com answer a request without one with an empty HTTP 500. The flat resolver and the playground copy pass the wrapper's family to the transform; a family with no rule throws.

### BREAKING — 4.0.0 (Unreleased): integer id columns are decimal strings, everywhere

- **One type per id column, in every row, call and season, on every surface.** A column whose name marks an id that holds integers now comes back as **exact decimal strings**, whatever width it was stored with (INT32, INT64, or a DOUBLE / JSON number holding integer ids, e.g. pandas' Float64 of an id column with nulls) and whatever the magnitude. Before, it was a `number` (or a `BigInt` past 2^53, with a warning), so its type changed with the season and the source: ESPN college play ids are 12-13 digits through 2013 and 18 digits from 2014-15, and one release stores `game_id` as INT32 where another stores it as INT64. Now `load_nhl_game_info` and `load_nhl_schedules` join on `game_id` (1,398 of 1,398 games in 2025), `load_cfb_schedule` and `load_cfb_team_info` on `venue_id` (662 of 662), loader ids join parser ids, and every result is JSON-safe. A string id is exact past 2^53 and works with `===`, `Set` and `Map` keys.
- **Which names are ids:** the last dotted segment of the column name is `id`; ends `_id` or `_ids`; is a numbered id (`athlete_id_1`, `sack_player_id2`, `team_id_247`); is `id_play` or `id_drive`; ends `_id_started` / `_id_ended` (`drive_play_id_started`); ends stats.nba.com's underscore-less `teamid`, `personid`, `playerid` or `matchupid` (`hometeam_teamid`, `gameleaders_homeleaders_personid`); or is camelCase `…Id` / `…Ids` (`playerId`, `homeTeamId`, `eventId`). Dotted names use their last segment (`start.team.id`, `participants.0.athlete.id`). Listed names count too: the MLBAM id columns `batter`, `pitcher`, `on_1b`..`on_3b`, `fielder_2`..`fielder_9`, `game_pk`, and the stats.nba.com video playlist's `hid` / `vid` (home / visitor team ids). Words such as `valid`, `paid`, `void`, `idle`, `width` and `event_idx` never match, and neither do the non-id columns `team_id_source` (`"espn"`), `*_sportec_id_overwrite` (a flag), `player_id_list` (a joined list) and Savant's `n_pk` (a pickoff count). Integer `*_key` join keys (247Sports / On3 / recruiting `player_key`, `institution_key`, ...) are not id-named and stay numbers, with the same type on every surface. One predicate (`isIdColumn`, `src/core/int64.ts`) decides on every surface. So `load_nba_pbp` `athlete_id_1` joins `load_nba_player_boxscore` `athlete_id`, `load_nhl_scoring` `playerId` joins `load_nhl_skater_boxscores` `player_id`, `load_cfb_pbp` `homeTeamId` joins `load_cfb_team_info` `team_id`, and `load_nfl_pbp` `drive_play_id_started` joins its `play_id`.
- **Release loaders** (`load*`; rows and `format: "columns"`, one season or many): every id column, e.g. `loadCfbPbp` `id` `"401628579101849903"` (2024) and `"332830097002"` (2013), `game_id` `"401628579"`; `loadNflPbp` / `loadNflPbpParticipation` `play_id` (a DOUBLE in the release) `"40"`, never `"40.0"`; INT32 ids such as `loadNflFtnCharting` `ftn_game_id`; `id_int64` columns (pinned to Int64 like sdv-py's `_cast_ids_int64`), e.g. `loadCfbRatings` `team_id` `"2306"`. Code-like id columns are strings in the loaders now too, as they already were in the parsers: `type_id`, `status_id`, `period_id`, `season_id`, ... (`r.type_id === 58` becomes `r.type_id === "58"`, or `Number(r.type_id) === 58`).
- **Producers:** the box producers' `game_id`, `team_id`, `athlete_id`, `opponent_team_id` (`helper_<lg>_player_box` / `helper_<lg>_team_box`), and the pbp producers' play `id`, `game_id`, `homeTeamId`, `awayTeamId`, the result's `gameId` and the `timeouts` id lists (`espn_<lg>_pbp` / `helper_<lg>_pbp`), for `nba`, `wnba`, `mbb`, `wbb`, so producer rows join the release rows.
- **Parsers** (`parsed: true` and the `parse_*` exports): every id column of integers. That covers `normalize` (MLB Stats API, NHL api-web / EDGE / stats-rest / records, ESPN, CBS, Fox, Yahoo, ...), `parse_nba_stats_result_sets` (`player_id`, `team_id`, ...; `game_id` already was a string), Baseball Savant (`game_pk`, `batter`, `pitcher`, `on_1b`..`on_3b`, `fielder_2`..`fielder_9`, `id`; an empty cell stays `null`), the PFF API, NFL Pro, `parse_cdn_rankings` (`poll_id`), 247Sports and the on3 / soccer frames.
- **HockeyTech analytics:** `<lg>_game_shifts`, `<lg>_player_toi`, `<lg>_pbp`, `<lg>_game_corsi` and the league-parameterised `hockeytech_shift_stints`, `hockeytech_player_toi`, `hockeytech_enriched_pbp`, `hockeytech_game_corsi` return their id columns (`game_id`, `player_id`, `goalie_id`, ...) as decimal strings, like `parse_hockeytech_pbp`. The pure frame functions in `dist/analytics/hockeytech.js` stay sdv-py-faithful.
- **Unchanged:** any other integer column is a `number` when every value is a safe integer, else a `BigInt`. Its warning is now emitted once per (loader or parser, column) per process, with its own code `SDV_INT64` (a loader's used to be `SDV_RELEASE`, on every call).
- **Not an integer:** an id column whose values are not exact integers (a fraction, a DOUBLE past 2^53, a boolean) is never turned into strings, since that would be a wrong id: a loader leaves it as read with one `SDV_INT64` warning per (loader, column) per process, and a parser leaves it as read. A missing DOUBLE (`NaN`) in an id column is `null`. Across seasons, an id column that is a string in one season and a DOUBLE in another is unified by the same rule (a DOUBLE NaN is `null`, never `"NaN"`; a fraction is left as read with the warning, never `"1.5"`). A fraction in one season does not change the other seasons, so such a column mixes strings and numbers (`["40", "71", 1.5, 2]`) where sdv-py's `diagonal_relaxed` makes one String column; no real release has one, and the warning names it. One real column stays a number for this reason: `load_cfb_pbp_r` `id_play`, whose 18-digit ESPN play ids the release stores as DOUBLE, already rounded past 2^53. A JSON number past 2^53 was already rounded by `JSON.parse`; the pbp producers throw a `TypeError` there (as before).
- **Migrating:** compare and join ids as strings. For a number back, `Number(row.game_id)` (safe ids only); for a 64-bit id keep the string or use `BigInt(row.id)`; for a column array, `cols.id.map(Number)` or `cols.id.map(BigInt)`. To match your own numeric id: `String(myId) === row.team_id`. This covers the widened names too: `athlete_id_1`, `playerId`, `homeTeamId`, `id_play`, `start.team.id` (e.g. `Number(r.playerId)`).
- **Also:** the loaders run the integer policy only on the id columns and the columns some season stores as INT64 (CFB pbp 2024: 153 INT64 columns of 506), about 2x faster after the decode; the `maxCells` default is documented as a measured heuristic (long-string-only selections cost more per cell).

### Changed — tooling, playground and docs cleanup

- **Exports:** `DEPRECATED_NAME_CODE` and `DEPRECATED_ENDPOINT_CODE` are exported from the package entry, so callers can filter the v4 rename and dead-route `DeprecationWarning`s by `w.code` without copying the strings.
- **Playground:** five Examples presets named pre-v4 family stems (`mlb_api`, `cbs_napi`, `fox_bifrost`, `yahoo_shangrila`, `yahoo_editorial`) and selected nothing; they now use `mlb`, `cbs`, `fox`, `yahoo` and `yahoo_scores`, and a test checks that every preset and guide cell resolves. The parser bundle is rebuilt (the HockeyTech scorebar parser was stale), and a test now compares it byte for byte with a fresh `npm run bundle:parsers`.
- **`from-openapi`:** a `--host` without its `https://` scheme now fails with a message that names the fix, instead of a bare `Invalid URL`.
- **Oracle generators:** every sdv-py oracle generator (`tools/parity`, `tools/oracle`) runs one shared guard, `tools/sdv_py_pin.py`: the checkout must be at the pin, clean, and the one `sportsdataverse` is imported from. The cricket and odds generators had no pin check before. The cricket and HockeyTech generators now produce the same bytes on every run; their committed fixtures changed in key and row order only. The six keyless-parser oracles (On3, ASA, MLS, NWSL, FPI, women's T-Rank) now have a generator too, `tools/parity/keyless_oracle.py`, which reproduces them byte for byte.
- **Tests:** a test scans every page Docusaurus compiles for braces and tags that MDX would parse (it reports file:line), so a broken page fails locally and not only on Vercel. Warn-once warnings share one registry that tests can reset, and tests that trigger a deprecation on purpose capture the warning instead of printing it.

### Changed — vendor tooling + CI hardening

- **`fetchWithRetry`:** each attempt gets its own `AbortSignal.timeout` (30 s), and the body is read inside the attempt, so a hung socket or a mid-body reset is retried (error names the URL) and cannot stall a job. Worst case per URL: 3 x 30 s plus 1.5 s of backoff. `raw.githubusercontent.com` file fetches retry exactly like the API ones.
- **BOM:** upstream text is decoded by one function for a fresh fetch and a committed copy, so a leading BOM can never make the two diverge. The bytes on disk (and in LOCK) stay verbatim.
- **Overlays:** an overlay addition whose `path` duplicates a vendored endpoint (or an earlier addition) now throws. On a pin bump, `vendor` warns when a whole-key overlay patch replaces a key whose upstream value also changed in that bump (the change is masked).
- **`vendor.yaml`:** `py_reserved` gains `espn_nba_pbp`, `espn_wnba_pbp`, `espn_mbb_pbp`, `espn_wbb_pbp` (hand-written in sdv-py); a test checks no generated ESPN wrapper takes one.
- **Workflows:** `timeout-minutes` on every CI, vendor-sync and live-smoke job. The vendor and live steps have their own step timeouts, so a hang reaches the issue step. Live smoke serialises runs and files a separate `live-tests:build-failure` issue when install or build fails (only a failing live step is "drift"). The vendor-sync failure issue names the resolved sdv-py sha.
- **vendor-sync to CI:** the sync PR is opened with `GITHUB_TOKEN`, which starts no `pull_request` run. `ci.yml` gains `workflow_dispatch`, and a separate `dispatch-ci` job (fresh VM, no checkout or npm, the only place with `actions: write`) runs `gh workflow run ci.yml --ref chore/vendor-sync` after the PR is created or updated. The workflow-wide permissions are now empty; the `sync` job holds contents / pull-requests / issues write only, so its token cannot dispatch other workflows (for example a publish).
- **Masked overlay patches:** the check compares the raw upstream value (taken before the schema policy runs) and the warning shows old -> new; it lands in the sync PR body and the step summary. The duplicate-path check keys on host + path + params.
- **Tests:** the token-scoping check allows a token or secret expression only in a step `env` (any other place, including `toJSON(secrets)`, `secrets[...]`, `secrets: inherit` and container credentials, fails, proven on mutated workflow clones); the failed-fetch test runs on a temp copy (`SDV_VENDOR_ROOT`), never the real codegen dir; the pipefail semantics test no longer spawns a bare `bash` on Windows (WSL); the pruned-file check asserts the file is gone instead of reading a spawned process status; the skipped-family pre-bump message is covered.
- **Docs:** `@param params.parsed` on the 130 `kind: frames` flat endpoints now says it returns an object of tables keyed by result set (matching `@returns`). `FLAT_FAMILY_HOSTS` in the generator is built once and frozen.

### Fixed — legacy `get*` methods fetch through the request layer

- The last 77 raw axios calls in the hand-written `sdv.<league>.get*` methods (`src/services`) now go through the core request layer. That gives them https, retries with backoff, `configure()` transports, and the `NoDataError` / `AssetFetchError` vocabulary. Signatures, URLs (bar `http://` → `https://`), queries and return shapes are unchanged. For each ESPN endpoint shape, the old and new code returned the same object live.
  - ESPN site API, family `site_v2`: `getSummary`, `getPicks`, `getScoreboard`, `getConferences`, `getTeamList`, `getTeamInfo`, `getTeamPlayers` on the 8 leagues, NHL `getPlayByPlay` / `getBoxScore` (read off the summary), and `sdv.tennis.getScoreboard`. `getStandings` (`site.web.api.espn.com`) uses family `web_v3`.
  - 247Sports HTML scrapers (deprecated `getPlayerRankings`, `getSchoolRankings`, `getSchoolCommits` on cfb / mbb): family `sports247_html`. Over `http://`, 247sports.com answered HTTP 406. Over https the pages load and parse again. As on the other 247 families, a 403 is the edge's block and is not retried.
  - `sdv.ncaa`: ncaa.com and data.ncaa.com (`getRedirectUrl`, `getInfo`, `getBoxScore`, `getPlayByPlay`, `getScoreboard`) use family `ncaa_com`. A 2xx casablanca response that is not JSON throws `AssetFetchError`. `getRedirectUrl` throws `AssetFetchError` when the final URL carries no game id (e.g. a custom transport that does not report redirects); it used to return `NaN`. The deprecated stats.ncaa.org scrapers use family `stats_ncaa` over https and keep their `DeprecationWarning`. Their Akamai 403 is a block, so it is not retried.
- **Fixed — `sdv.nba.getSummary` / `sdv.mlb.getSummary`:** 7 of their 12 fields (`teams`, `id`, `plays`, `competitions`, `season`, `seasonSeries`, `standings`) read a `gamepackageJSON` key, which only the CDN game pages have. A site v2 summary does not, so these fields were always `undefined`. They now read the summary's `header` (`teams`, `id`, `competitions`, `season`) and top level (`plays`, `seasonseries`, `standings`), as `sdv.wnba.getSummary` already did. `id` stays the header's string. MLB summaries have no `leaders` section, so `mlb` `leaders` (in `getSummary` and `getPicks`) is still `undefined`.
- **BREAKING — errors:** a failed fetch throws a typed error instead of a raw axios error. HTTP 404 is `NoDataError`. A 403 / 429 / 5xx that persists after retries, or a network error, is `AssetFetchError`, whose `cause` carries no request config. These cases differ beyond the error class:
  - The ESPN methods that return the body as-is (`getScoreboard`, `getStandings`, `getTeamList`, `getTeamInfo`, `getTeamPlayers`, `getConferences`) now throw `NoDataError` for ESPN's HTTP 200 `{ code: 404 }` body, which they used to return. They throw `AssetFetchError` for a 2xx body that is not JSON, which they used to return as a string.
  - On such a body, `nba.getSummary` / `mlb.getSummary` used to return a 12-key object of `undefined`s and `mbb.getSummary` / `wbb.getSummary` a 7-key one. They now throw `NoDataError` / `AssetFetchError`. The other 12 summary-reading methods (`getSummary` on cfb / nfl / nhl / wnba, `getPicks` on 6 leagues, NHL `getPlayByPlay` / `getBoxScore`) used to throw a `TypeError` there. They now throw `NoDataError` / `AssetFetchError` as well.
  - `sdv.ncaa.getInfo` / `getBoxScore` / `getPlayByPlay` / `getScoreboard` (casablanca) used to return a 2xx body that is not JSON as a string. They now throw `AssetFetchError`.
  - A 403 / 408 / 429 / 5xx is now retried (at most 4 times) before it fails. The 247Sports and stats.ncaa.org families never retry a 403.
  - Requests now time out after 30 s by default (`configure({ timeoutMs })`); they had no timeout. They also send the sportsdataverse User-Agent instead of axios's. The deprecated 247Sports scrapers still send their own browser User-Agent.

### Changed — vendor pin 81eb7e7060: ESPN CDN, Fox, stats/On3 returns tables, `on_missing`

- **Pin:** the vendored sdv-py ref moves from `719de79` to `81eb7e7060`. Two JS overlays the upstream absorbed are gone:
  - The MLB `pbp` `timecode` patch (sdv-py #679).
  - The torvik `game_stats` / `player_stats` / `game_schedule` additions. They are vendored now (sdv-py #678). Names are unchanged, and JS keeps its hoopR-ported parsers and its own returns tables.
- **Added — ESPN CDN (`cdn.espn.com/core`):** 5 endpoints become 41 wrappers on 14 leagues: `espn_<lg>_cdn_playbyplay`, `_cdn_boxscore`, `_cdn_schedule`, `_cdn_scoreboard`, and `espn_cfb_cdn_rankings`.
  - The generator honours sdv-py's per-endpoint `include_prefixes` (a probed league allowlist) and the family's `fixed_params` (`xhr=1`, which a caller param can override).
  - Ported parsers:
    - `parse_cdn_game` runs the summary dispatcher and takes `section`.
    - `parse_cdn_scoreboard` and `parse_cdn_schedule` return scoreboard rows.
    - `parse_cdn_rankings` returns a string `team_id`.
- **Fixed — legacy `getSchedule` dates:** `sdv.{nba,wnba,nhl,mlb,mbb,wbb,cfb,nfl}.getSchedule({ year, month, day })` sent `dates=`. The CDN ignores that key and answered with today's page for every date.
  - The methods now route through `espn_<lg>_cdn_schedule`, which sends `date=`. The signature and the return shape (`content.schedule`) are unchanged, and a failed fetch throws `AssetFetchError`.
  - The other legacy CDN methods (`getPlayByPlay`, `getBoxScore` on nba / wnba / mbb / wbb / mlb / cfb / nfl, `sdv.cfb.getRankings`, `sdv.nfl.getWeeklySchedule`) also route through the vendored `espn_<lg>_cdn_*` wrappers instead of raw axios over `http://`: https, the same signatures and return shapes, and the core error vocabulary.
- **Fixed — ESPN JSON families:** a 2xx response whose body is not a JSON object / array (the CDN's HTTP 202 HTML bot challenge, an error page, an empty body) now throws `AssetFetchError` instead of passing through as data. Before, a parsed CDN wrapper returned `[]` (a failed fetch that looked like no data) and the legacy `getSchedule` threw a `TypeError`.
  - Football pages ignore dates, so `cfb` / `nfl` take an optional `week`. A date without a `week` warns once (`SDV_CDN_FOOTBALL_DATE`).
- **BREAKING — Fox:** `sdv.fox` is now vendored from sdv-py's `fox_api`.
  - The canonical names are `fox_api_*` / `foxApi*`. Every pre-v4 `fox_*` name is a deprecated alias.
  - `scorechip` no longer sends `api-version`, which made it answer 400.
  - The 5 routes sdv-py dropped as dead (`fs_feed`, `fs_images`, `fs_layouts`, `fs_videos`, `explore_favorite`) keep their old names, are deprecated, and warn once (`DeprecationWarning`, code `SDV_DEPRECATED_ENDPOINT`, the code every deprecated endpoint now carries, `recruiting_*` included).
  - `parsed: true` output is unchanged.
- **Codegen:** an endpoint-level `fixed_params` on a flat family is honoured (sent first, overridable), as sdv-py's spec allows; a family-level one on a flat YAML fails codegen (sdv-py merges it only for ESPN families). `kind: frames` endpoints document their `parsed: true` return as an object of tables keyed by result set.
- **Loaders — `on_missing: raise`:** the 25 seasonal NFL loaders that sdv-py hand-writes (pbp, rosters, the usage/tendency tables, …) now throw `NoDataError` for a season with no published asset instead of skipping it. A failed fetch is still `AssetFetchError`.
- **Returns tables:** sdv-py now derives these from parser output, so they document their columns again:

  | family | tables documented |
  |---|---|
  | 247Sports site pages | 35 |
  | `nba_stats` | 126 of 128 |
  | `wnba_stats` | 110 of 111 |
  | On3 | 23 of 78 (48 are `unverified` upstream) |

  - A `kind: frames` schema renders one table per frame. An `unverified` schema prints its reason. The vendor fails closed on a schema shape it does not know.
  - Kept off, because the parity harness disproves them on real captures:
    - `nba_stats.leaguedashptstats`: the table documents the default measure type, and the 7 other tracking measure types return other columns.
    - 7 On3 tables: sdv-py stringifies a bool column that contains a null, while JS keeps booleans.
- **Parity harness:** 259 more sdv-py captures (124 NBA, 109 WNBA, 26 On3), with `kind: frames` checked frame by frame. Verified endpoints go from 179 to 438.

### Fixed — transport / auth runtime

- **Date query values.** A `Date` passed as a query parameter is sent as ISO-8601 UTC again (`2025-02-01T00:00:00.000Z`, what axios sent before the transport layer); it had become `Date#toString()` (`"Sat Feb 01 2025 …"`). An invalid `Date` throws an `SdvError` naming the parameter before anything is sent. Both built-in transports serialise the same way, and axios' `config.url` stays query-free (an app interceptor that logs it never sees a query-param key). A date-only API (`YYYY-MM-DD`, ESPN's `YYYYMMDD`) wants a string.
- **Credential redaction.** `safeCause` (every `SdvError` cause) also redacts credential-looking text, so an error your own transport throws can't carry it: `Authorization` / `Proxy-Authorization` / `X-Api-Key` / `X-Auth-Token` / `X-Access-Token` / `Api-Key` / `Ocp-Apim-Subscription-Key` and `Cookie` / `Set-Cookie` values, `Bearer <token>` / `Basic <base64>`, JWT-shaped strings (also glued to a word or `%3D`), and the values of `password` / `token` / `accessToken` / `refreshToken` / `api_key` / `client_secret` / … pairs (`=`, `:`, URL-encoded, or `"password": "…"`; a bare `key=` only when the value looks like a credential). Ordinary text is untouched; the error name is redacted too. Every redaction pattern is now linear-time: the URL patterns were quadratic on long scheme-character runs (100 KB took seconds; now < 10 ms).
- **Retries / timeout per family.** `registerFamilyDefaults` takes `retries` and `timeoutMs`; a value you pass to `configure` still wins. `pff_api` now retries 4 times (sdv-py's budget; was 3). `nfl_pro` keeps sdv-py's 45 s timeout but no longer overrides `configure({ timeoutMs })`. Login and token-mint requests (KenPom, 247Sports, `nfl_api`) use the resolved timeout too. `pff_api` no longer retries a `408` (sdv-py retries `{429, 5xx}`; the read budget is shared).
- **`nfl_api`:** the built-in token mint retries a network error or a `408` / `429` / `5xx` itself (never `401` / `403`); since the transport layer one network blip at `/identity/v3/token` failed the call at once. When the retries run out, `nflTokenGen` throws an `AssetFetchError` (sanitized cause) instead of the transport's raw error.
- **`tokenAuth`:** a `401` on a request that carried your own credential no longer mints a token that would never be sent.
- **`sports247`:** a `403` re-mints the guest JWT once and retries, as sdv-py does (not when you sent your own `Authorization`); after a failed mint, calls go out tokenless for a minute instead of re-trying the site root on every call; `sports247ClearTokenCache()` also resets the once-per-process warning; the User-Agent is now the one impit's `chrome142` profile sends (was Chrome/124 over a Chrome 142 TLS fingerprint).
- **`torvik` / `bart_wbb`:** no hard-coded User-Agent any more (it carried a `+https://` token, which ESPN's site API answers with 403). They send the configured `userAgent`, so `configure({ userAgent })` applies; a caller `User-Agent` header still wins. barttorvik.com answered 200 to the default UA (one live request, 2026-10-05).
- **`nfl_pro` login:** the error name is scrubbed like the message; the browser-close cap no longer lets the process exit before the login settles.
- `AuthProvider` documents its failure contract on the interface. Test isolation: an `@internal` `_unregisterFamilyDefaults` seam.

### Changed (breaking) — HockeyTech hardening (error vocabulary, User-Agent, returns descriptions)

- **BREAKING: a failed HockeyTech fetch is no longer an empty result.** The shared getter behind the 16 `hockeytech_*` wrappers and the season helpers used to turn any HTTP-200 body it could not use into `{}` (so `parsed: true` gave `[]`). It now throws `AssetFetchError` for an empty or unparseable body and for HockeyTech's in-body error sentinels (`{"SiteKit"|"GC": {"Undefined": "Undefined Tab <view>"}}`, `{"error": "InvalidView error: …"}`). The one reply that still reads as empty is the recognised plain-text `Feed type access denied.` (a league key without access to that feed, e.g. MJHL's game summary): `{}` raw, `[]` parsed, as in sdv-py. HTTP 404 stays `NoDataError`. A missing or unknown `league` now throws instead of returning `{}`.
- **BREAKING:** `most_recent_hockeytech_season` / `hockeytech_season_id` throw on a failed fetch instead of returning 2026 / `[]`. When the feed answers with no seasons, `hockeytech_season_id` returns `[]` and `most_recent_hockeytech_season` throws `NoDataError` (sdv-py returns a hard-coded 2026, already stale: PWHL's newest season is 2026-27). `hockeytech_resolve_season_id` keeps the PWHL fallback table for a failed fetch, but rethrows a non-`SdvError`.
- The `<lg>_pbp` / `<lg>_game_corsi` analytics now also reject a `GC` error sentinel on the game summary (they used to take it as blank game metadata).
- HockeyTech requests send the configured User-Agent (`configure({ userAgent })`, default `Mozilla/5.0 (compatible; sportsdataverse-js/3.x)`) instead of a hard-coded one carrying a `+https://` token, which also overrode `configure`. HockeyTech and Baseball Savant both answered 200 to the default UA (live check, 2026-10-05).
- `parse_hockeytech_scorebar` now shares `parse_hockeytech_schedule`'s implementation (same `SiteKit.Scorebar` payload); both names stay.
- The `hockeytech_scorebar`, `_stats`, `_player_search`, `_player_game_log`, `_playoff_bracket` and `_transactions` returns tables replace 250 placeholder descriptions ("HockeyTech `x` field.") with real ones: sdv-py's text where the column exists there and the captured data agrees with it, otherwise text written from the captured payloads. `hockeytech_schedule` (the same `SiteKit.Scorebar` frame) now carries the scorebar descriptions, replacing several that were wrong (`date`, `game_letter`, `quick_score`).

### Fixed — parser / analytics minors (sdv-py parity)

- **Statcast `/gf`:** an empty-string id cell (`batter: ""`) is now `null`, like sdv-py's `to_numeric("")`; it kept the column text before (whitespace still leaves the column as read, as in py).
- **`findTeam` / `findAthlete`:** the team-list cache is keyed by namespace identity (an injected namespace no longer poisons or reads another's), caches the in-flight promise (concurrent first calls share one fetch) and evicts it on rejection.
- **Odds math:** `sum` is CPython 3.12+ compensated (Neumaier), so `devig_*` match py bit for bit; the Shin-fallback warning fires once per distinct message per process (py default filter); a NaN function value anywhere in the Shin solver is a `ValueError`, as in scipy.
- **Cricket `norm_cdf`:** relative-accurate in the far-left tail (was ~1.8e-11 relative off from the `1 - erf` branch; now ~4e-16 vs a 60-digit reference).
- **nba_stats:** documented/tested that a legit-empty `resultSets` is data (raw keeps the headers) and parses to `[]`/an empty entry.

### Changed — package checks: attw + publint on the packed tarball, API Extractor reports

- **New CI gates** (Node 20 and 22). `npm run pack:check` packs the package with `npm pack` and runs `@arethetypeswrong/cli` and `publint --strict` on that tarball. `npm run api:check` fails when the public API in `dist/*.d.ts` no longer matches the committed API Extractor reports, `etc/sportsdataverse.api.md` (package root) and `etc/sportsdataverse-parsers.api.md` (`sportsdataverse/parsers`). After an intended API change, run `npm run api:report` and commit the updated report, so the change shows up in the PR diff. Generated wrappers are not listed one by one in the report (the default export is typed `Record<string, Record<string, any>>`); they are reviewed through `src/generated/**` and the codegen drift gate.
- **Fixed:** `sportsdataverse/parsers` now resolves its types under TypeScript `moduleResolution: "node"` / `"node10"` (new `typesVersions` entry; the package root already resolved). The `exports` map is unchanged.
- `package.json` now says `"sideEffects": true`. Importing the package registers per-family transport defaults and the KenPom parser, so a bundler must not drop those imports. Behavior is unchanged (a missing field already meant `true`).
- The package stays ESM-only. attw's `cjs-resolves-to-esm` rule is ignored on purpose: CommonJS callers use `await import('sportsdataverse')`, or `require()` on Node 20.19+ / 22.12+.
- New devDependencies only: `@arethetypeswrong/cli`, `publint`, `@microsoft/api-extractor`. `npm audit` is clean.

### Changed — vendor LOCK online integrity check + vendor-sync hardening

- **New:** `npm run vendor:check:online` (CI and the weekly vendor-sync) checks `vendor/upstream/LOCK` against sdv-py's `git/trees/<ref>` at the pinned ref: every blob sha must match, and LOCK's path set must equal exactly what the vendor fetches (computed by the same path-selection helper `npm run vendor` uses), so editing a copy together with its LOCK line, or dropping a LOCK line and hand-editing the vendored copy, both fail. A network failure is a failure to verify, never a pass; 5xx/network errors are retried (3 attempts), 403/404 are not.
- **vendor-sync:** `GITHUB_TOKEN` is exposed to the vendor step only (codegen runs in its own step without it); a ref/vendor/codegen failure opens or updates a "vendor-sync failed" issue naming the failing step (the run still goes red) instead of only failing.
- **Pin bumps:** `npm run vendor` (not `vendor:check`) now removes a py schema copy that the new pin renamed or dropped (byte-identical to the old upstream, not referenced by any endpoint; JS-authored files are never touched). It derives the outgoing outputs per family, and names any family whose prune was skipped.
- The vendor tests no longer flake against their timeout: endpoint-YAML parsing (the slow path, repeated per temp-tree copy) is memoized.

### Added — NFL Pro email/password login

- **NFL Pro** (`nfl_pro`) can now log in for you, ported from sdv-py's `nflpro_runtime`. The token resolves in sdv-py's order: `headers.Authorization` > `token` > `NFLPRO_TOKEN` > a headless-browser id.nfl.com login with `email` / `password` on the call, else `NFLPRO_EMAIL` / `NFLPRO_PW` (the same env var names as sdv-py) > `NflProAuthError` with instructions. `NFLPRO_TOKEN` wins over `email` / `password` on the call, as in sdv-py.
- The login drives id.nfl.com as a state machine (e-mail, an optional passkey offer, password, in whatever order the site shows them). It keeps only a token whose JWT carries an active `NFL_PLUS_*` plan, because an anonymous token looks the same. Tokens are cached per account until 120 s before they expire, keyed by an HMAC of e-mail + password under a random per-process key (a wrong password is never answered from the cache; expired entries are dropped). Concurrent calls for one account share one login; the whole login has one 3-minute deadline, after which the browser is closed and every waiter rejects. A `401` on a logged-in token drops it and logs in again once (a supplied token is never re-minted). The e-mail, password and token never reach an error, its `cause`, or a warning; note that `DEBUG=pw:api` makes Playwright itself log `fill()` values to stderr.
- The password is submitted **once**: if id.nfl.com still shows the password field afterwards, the login stops with "did not accept the password" instead of retrying (sdv-py resubmits, which with a wrong `NFLPRO_PW` is repeated failed attempts against a paid account).
- `playwright` is a new **optional** peer dependency, imported only when a login is actually needed: `npm i playwright && npx playwright install chromium`. Without it, a login throws `TransportUnavailableError` naming that command.
- New exports `nflProBrowserLogin(email, password, { playwright })` (the login itself; the module is injectable) and `nflProClearTokenCache()`, plus the `PlaywrightLike` type. `nflProToken` (new in this release) is now `async` and takes `{ token, email, password }`. Live test: `SDV_NFLPRO_LIVE=1` (or `SDV_NFL_PRO_LIVE=1`) with `NFLPRO_TOKEN` or `NFLPRO_EMAIL` / `NFLPRO_PW`.

### Added — ESPN basketball PBP producers (NBA / WNBA / MBB / WBB)

- `sdv.<lg>.espn_<lg>_pbp(game_id, { raw })` plus `helper_<lg>_pbp(game_id, pbp_txt)` and its stages `helper_<lg>_pickcenter`, `helper_<lg>_game_data`, `helper_<lg>_pbp_features` (+ camelCase, e.g. `sdv.nba.espnNbaPbp`, `sdv.mbb.helperMbbPbp`) for `nba`, `wnba`, `mbb`, `wbb`, under sdv-py's names. `espn_<lg>_pbp` fetches the summary through `espn_<lg>_summary`, keeps sdv-py's incoming keys (absent ones defaulted as py does) and returns py's cleaned game dict: `plays` rows with py's column names and order (dotted, e.g. `end.half_seconds_remaining`), the `timeouts` map (team id -> `{"1": play ids, "2": play ids}`), and the summary keys passed through; `raw: true` returns the trimmed payload. The helpers are pure. Ported from sdv-py (pin 719de79) with its per-league facts: NBA quarters with the 720 / 1440 / 2160 / 2880 ladder; WNBA and WBB use the format's period count (else the season year: WNBA halves before 2006, WBB before 2016) for the 600-second quarter or 1200-second half ladders; MBB plays halves with its own columns (`half` = period, `start.period_seconds_remaining`, ...) and an Int32 M:SS clock -- a decimal clock such as `"23.4"` throws, as in py, but ESPN's college feeds use whole-second M:SS clocks, so that only happens on a non-MBB payload; OT is 300 seconds everywhere. Seconds-remaining columns round to float32 at every step like polars. `helper_<lg>_pickcenter` / `helper_<lg>_game_data` return a value taken from the pickcenter as a one-element array (py: a numpy array), e.g. `gameSpread: [-8.5]`; a league default stays a scalar. The play `id` column and the `timeouts` id lists are exact decimal strings in every era (see "integer id columns are decimal strings, everywhere" above). Lag / lead / row numbers never cross a `game_id`. Not ported, deliberately: `<lg>_pbp_disk` (it reads a local JSON path; in JS, `JSON.parse` the file and call `helper_<lg>_pbp`, and `fs` would break browser builds). Parity: every league is compared cell by cell with sdv-py's own `espn_<lg>_pbp` on 19 real captures (5 new live-captured games: WNBA 2003 halves, WBB 2015 halves + OT, WBB 4OT, MBB 2OT, NBA OT with two pickcenter providers) and 25 derived payloads, including the halves cutoffs pinned on both sides (`tools/parity/espn_basketball_pbp_oracle.py`).

### Added — ESPN basketball box producers (NBA / WNBA / MBB / WBB)

- `sdv.<lg>.helper_<lg>_player_box(summary)` and `helper_<lg>_team_box(summary)` (+ camelCase, e.g. `sdv.nba.helperNbaPlayerBox`) for `nba`, `wnba`, `mbb`, `wbb`: one game's ESPN summary payload in, the rows the hoopR / wehoop box-score releases publish out. Pure (no network): fetch with `espn_<lg>_summary({ event_id })` and pass the result in. Ported from sdv-py (pin 719de79) with its per-league facts: NBA/WNBA carry `plus_minus` (a string such as `"+16"`), MBB/WBB do not; MBB/WBB skip a game whose second team ships no athletes, NBA/WNBA publish the first team's rows; MBB orders `active` last. Same columns, order and null handling as sdv-py; Int32 columns are numbers, except the id columns (`game_id`, `team_id`, `athlete_id`, `opponent_team_id`), which are decimal strings like the release loaders return; `game_date_time` and `game_date` are JS `Date`s, exactly as the release loaders decode the published parquet (the instant, and the New York calendar date at UTC midnight), so producer rows and loaded rows join on the same values. A payload sdv-py skips returns `[]`. Parity: every helper is compared cell by cell with sdv-py's output on 14 real captures (full games in all four leagues, plus archival, one-sided, scheduled and stat-less payloads) and 24 derived gate payloads (`tools/parity/espn_basketball_box_oracle.py`).

### Security

- Runtime dependencies patched: `axios` `^1.17.0` → `^1.20.0` (22 advisories, 8 high — header injection, prototype-pollution gadgets, ReDoS, HTTP/2 DoS, fetch-adapter redirect SSRF) and `undici` (pulled in by `cheerio`) 7.27.2 → 7.30.0 in the lockfile (21 advisories, 6 high). Both stay within their major version; no API change. `npm audit --omit=dev` is clean. The `undici` bump is lockfile-only: a consumer's install resolves cheerio's `^7.19.0` itself. sdv-js never sends requests through `undici`; it only calls `cheerio.load` on HTML that `axios` fetched, and the KenPom parser imports `cheerio/slim`.
- Dev-only dependencies patched (never shipped — `files` is `dist/` only): `js-yaml` 4.3.2 (override floor raised from `^4.2.0`), `brace-expansion` 2.1.7 / 5.0.12, `markdown-it` 14.3.2, `linkify-it` 5.0.2, all through `mocha` / `typedoc`. Root `npm audit` is clean.
- Docs-site dependencies (`docs/package-lock.json`, build-time only, never shipped) refreshed: every `@docusaurus/*` package 3.10.1 → 3.10.2 on one version (including `@docusaurus/faster` and `@docusaurus/types`, which the lockfile refresh would otherwise have left on 3.10.1), plus in-range patches that close 53 of 54 Dependabot advisories (`brace-expansion`, `fast-uri`, `js-yaml`, `joi`, `svgo`, `postcss`, `nanoid`, `image-size`, `browserslist`, `shell-quote`, `http-cache-semantics`, `webpack-dev-server`, `qs`, …). The one left, `braces` (GHSA-vfj7-8cjw-p6xm), has no fixed release and is build-time only; see `SECURITY.md`.
- Credentials no longer reach `err.cause`. A raw axios error carries its request config — the `Authorization` header, cookies, and a POSTed login form, password included — and it was attached as-is to `AssetFetchError` (network failures, auth failures), so `util.inspect(err)` or a logged error could expose them. Every `SdvError` now stores its `cause` through `safeCause` (name, message and stack with URL query strings and `user:password@` redacted, plus `code` / `errno` / `syscall` — nothing else). `axiosTransport` and the impersonating (impit) transport reject with the same sanitized errors. This applies to every family; the old behavior predates this PR.

### Added — release dataset loaders (323 `load*` functions)

- **New:** one loader per entry of sdv-py's `releases.yaml` (vendored verbatim), generated onto its league namespace as camelCase + snake alias, e.g. `await sdv.cfb.loadCfbPbp({ seasons: 2024, columns: ['game_id', 'text', 'EPA', 'home_wp_before'] })` / `sdv.cfb.load_cfb_pbp(...)`: cfb 71, nba 41, mbb 34, wbb 34, wnba 34, mlb 32, nfl 29, nhl 27, pwhl 21 (new `sdv.pwhl` namespace). They read the published SportsDataverse / nflverse parquet assets — play-by-play with EPA/WP, schedules, rosters, box scores, ratings, player value — and resolve to an array of plain row objects. Options: `seasons` (one or a list; integers or 4-digit year strings, anything else raises `SdvError`), `columns` (read only those), `format` (`"rows"` default, or `"columns"` → `{ [column]: values[] }`, ~4x lighter), `maxCells`, `timeoutMs` (default 5 min).
- **Size guard:** before decoding each season, a loader adds its rows × columns (from the parquet footer) to a running total and checks it against `maxCells` (seasons are downloaded and decoded one at a time, so at most one compressed download is held) — by default V8 heap limit / 100 for rows (≈45M cells on Node's default 4 GB heap) and / 30 for `format: "columns"` — and throws a catchable `SdvError` naming `columns`, `format: "columns"` and `--max-old-space-size` instead of crashing the process. A full row-object read of CFB play-by-play 2024 (163,567 × 506) needs ~5.4 GB of heap; `format: "columns"` loads it in ~1.7 GB, and the generated play-by-play examples pass `columns`.
- Seasons below a loader's floor raise `SeasonNotFoundError` before any download; a season with no asset (HTTP 404) is skipped with a warning; any other failure raises `AssetFetchError`. Multi-season results union columns, null-fill gaps and cast a column whose type changed between seasons to the common type (sdv-py's `diagonal_relaxed`: an integer id that became a string → strings, `"123"` never `"123.0"`). `{season + 1}` assets (nba_stats) take the START year, as in sdv-py. The three `load_nba_stats_*_v3` loaders are deprecated aliases (one-time `DeprecationWarning`).
- Id columns (`id`, `*_id`, `*_ids`, `*_pk`) of integers are exact decimal strings whatever their stored width — ESPN play ids (`id` in CFB / MBB play-by-play, 18 digits) are beyond 2^53 — and `id_int64` columns are pinned to Int64 first, as sdv-py's `_cast_ids_int64` does (canonical integer strings convert; anything else is left untouched). Other INT64 columns are plain `number` when every value is a safe integer, else `BigInt` with one warning per column per process (see "integer id columns are decimal strings, everywhere" above).
- Downloads go through the new keyless `releases` transport family (default retry statuses, 403 included). Parquet is decoded by the new runtime dependencies `hyparquet` + `hyparquet-compressors` (the assets are ZSTD from Polars and SNAPPY from arrow-cpp). Node only; loaders are not in the docs playground. Each league's reference gains a **Dataset loaders** page.

### Added — odds market math (sdv.odds)

- `sdv.odds` market math, ported from sdv-py `wexp.market` (pin 719de79): `prob_from_american`, `prob_from_decimal`, `devig_multiplicative`, `devig_shin`, `spread_to_prob`, `logit_blend`, `moneyline_pair_prob` (snake_case + camelCase). Same formulas, edge cases and error types as Python; parity-tested against a committed sdv-py oracle over real The Odds API h2h rows.
### Added — 247Sports via `sdv.sports247` (supersedes `recruiting`)

- New namespace `sdv.sports247` with 47 wrappers vendored from sdv-py at the pin. `sports247` (12) covers the 247Sports Recruit Database on `ipa.247sports.com`: recruits, transfers, coaches, institution rankings, the ranking feeds, target predictions, positions, sport years and tag autocomplete. `sports247_site_pages` (35) covers the `247sports.com/*.json` page models: player, recruitment, season, coach, institution, league and event. Parsers `parse_sports247_result_set` and `parse_sports247_site_page` are faithful ports of sdv-py's. sdv-py's returns tables are attached for `sports247` only. The site-page tables are left off because sdv-py's schemas at the pin type many numeric columns as `character`, and a test checks the column types of every attached table against the real captures.
- `sports247` mints the free 247Sports **guest JWT** for you (`GET https://247sports.com/` sets a `JWT` cookie, valid about 12 h). The registered `tokenAuth` caches it, re-mints it a minute before its `exp` and once after a `401`, and `sports247ClearTokenCache()` drops it. If the mint fails, the request goes out without a token, as in sdv-py, and one warning is emitted per process. Public routes still answer; routes that need the token fail with `AssetFetchError`. Neither 247 family retries a `403`.
- Both hosts block plain HTTP clients at the TLS layer, so both families default to the browser-impersonating transport, which needs the optional `impit` dependency (`npm install impit`). Without it, calls reject with `TransportUnavailableError`. The families are kept off the docs playground and its proxy allowlist.
- The 13 RDB routes that need a logged-in 247Sports session are not wrapped, as in sdv-py.

### Deprecated — `sdv.recruiting` (api.247sports.com)

- All 25 `recruiting_*` methods are `@deprecated`, because `api.247sports.com` answers HTTP 500. Each emits one `DeprecationWarning` on its first call. Twelve name their `sports247_*` replacement. The other 13 have none, since they need a logged-in 247Sports session. The methods still exist. Endpoint YAML can now mark any flat wrapper `deprecated:`.
_The next release is **4.0.0**: the naming change below is breaking._

### BREAKING — 4.0.0 (Unreleased): public names are sportsdataverse-py's

Every generated wrapper now carries **sdv-py's public name**, so the same endpoint
has the same name in Python and JavaScript. `tools/codegen/generate.mjs` ports
sdv-py's emit-time rename layer (`tools/codegen/generate.py` at the vendor pin):

- **ESPN** (all 29 leagues): `athlete` → `player`, `event` → `game` (plurals too) as
  whole `_`-separated words (`espnNbaAthleteGamelog` → `espnNbaPlayerGamelog`,
  `espnNflEvents` → `espnNflGames`; `athlete_eventlog` → `player_eventlog`),
  `event_competitor*` → `game_team*`, `event_competition` → `game_competition`.
  sdv-py's curated CFB renames apply (`espnCfbSeasonFutures` → `espnCfbFutures`, …,
  from the now-vendored `espn_rename_map.yaml`). Where sdv-py hand-writes a
  `player_stats`, the web-v3 stats endpoint is `player_stats_v3`
  (`espnNbaAthleteStats` → `espnNbaPlayerStatsV3`; cfb, mbb, mlb, nba, nfl, nhl,
  wbb, wnba), elsewhere plain `player_stats`.
- **Native APIs** use sdv-py's `name_pattern` / `qualifier`: NHL api-web
  `nhlApiWeb*` → `nhl*` (`nhlWebPbp` / `nhlWebSchedule` where sdv-py's own
  `nhl_pbp` / `nhl_schedule` take the plain name); NFL.com `nflApi*` → `nfl*`.
- **CBS** takes sdv-py's 16 short names (`cbsBoxscore` → `cbsGameBoxscore`,
  `cbsClientConfiguration` → `cbsClientConfig`, …).
  The 16 CBS `FLAT_WRAPPERS[].short` values change with them (`boxscore` →
  `game_boxscore`); each def keeps its pre-v4 short as `legacyShort`, and the docs
  playground (share links `?e=flat:cbs:boxscore`, `RunCell`) and `/api/run`
  (`{ api: 'cbs', endpoint: 'boxscore' }`) still accept it. Code that matches
  `FLAT_WRAPPERS` by `short` should also match `legacyShort`.
- Families already named like sdv-py (MLB, Statcast, NHL edge / stats-rest /
  records, nba_stats, wnba_stats, Torvik, Yahoo) are unchanged.

**Nothing is removed.** All 1,405 renamed pre-v4 names (2,810 counting both
snake_case and camelCase) stay callable as deprecated aliases: each forwards to the
new wrapper (its `.name` is the old name) and emits one `DeprecationWarning` per
name per process, with `code: 'SDV_DEPRECATED_NAME'` so it can be filtered. The full
mapping is the new [Deprecated names (v4)](https://js.sportsdataverse.org/docs/reference/deprecations)
reference page; `test/naming.test.js` asserts every pre-v4 public name (frozen in
`tools/codegen/pre_v4_names.json`) still resolves, and that the v4 names equal
sdv-py's generated names at the pin. The raw-JSON default and `{ parsed: true }`
are unchanged. Wrapper defs gain `publicShort` (ESPN) / `publicName` (flat) and
`LeagueConfig` gains `publicShorts`; `makeLeagueModule` / `makeFlatModule` build
the v4 names and register the same aliases.

**Also BREAKING for `parsed: true`:** Baseball Savant CSV rows (`parse_mlb_statcast_leaderboard`, `parse_mlb_statcast_search`, and the hand-written `mlb_statcast_search` / `_search_minors` / `_search_wbc` with `{ parsed: true }`) are now typed the way sdv-py's pandas reader types them: numeric columns are numbers (were strings), an integer column with a value beyond `Number.MAX_SAFE_INTEGER` is `BigInt` (one warning per column per process), `inf` / `-inf` are `Infinity` / `-Infinity`, True/False columns booleans, NA cells (`""`, `NA`, `NaN`, ...) `null`. The MLBAM id columns (`batter`, `pitcher`, `on_1b`..`on_3b`, `fielder_2`..`fielder_9`, `game_pk`) are pinned to Int64 in the CSV rows and in `parse_mlb_statcast_gamefeed` (whose `game_pk` was the feed's string `"745444"`), as sdv-py's `_pin_id_columns` does, and come back as decimal strings (`"745444"`, the id rule above), so the two join. Found by the parser-parity harness below.

### Added — cricket in-play win probability / WPA (`sdv.cricket`)

- `sdv.cricket.cricket_win_probability` / `cricket_match_state` / `cricket_expected_runs` / `cricket_wpa` (+ camelCase): faithful port of sdv-py's cricket in-play win probability (resource surface + isotonic calibration, bundled as `dist/models/data/cricket_wp_tables.json`). Pure/offline; parity-tested to 1e-12 against sdv-py outputs on real ESPN + Cricsheet states.

### Fixed

- NHL api-web / EDGE / records wrappers now honor sdv-py's `now_variant`: omitting the toggle arg (`season`, `date`, ...) requests the endpoint's `now_variant` route (`/now`, `/current`, or the collection path) instead of a malformed dated URL (`now_variant`/`now_toggle` carried through codegen, `resolveFlat`, and the playground resolver).
- `sdv.cbs.*`: host is now `https://api.cbssports.com/napi` (every endpoint 404'd without the `/napi` base). `tools/codegen/from-openapi.mjs` no longer drops the spec base path when `--host` is a bare origin.
- `getPicks` (cfb, mbb, mlb, nba, nfl, nhl): `pickcenter` was populated from `winprobability`; it now returns the real `pickcenter`.
- `sdv.wnba.getTeamList()` no longer throws when called with no argument.
- ESPN site API rejected the default User-Agent (HTTP 403 on every site_v2 wrapper: scoreboard, summary, teams, rosters…); the default UA no longer carries the `+https://…` token.


### Deprecated

- The six stats.ncaa.org scrapers in `sdv.ncaa` (`getSports`, `getSeasons`, `getDivisions`, `getSportDivisionData`, `getPlayerData`, `getTeamData`) are marked `@deprecated` and emit a one-time `DeprecationWarning` (the host 403s plain clients). `ncaa.getScoreboard` only serves historical seasons.


### CI

- New weekly `live-smoke.yml` runs the `SDV_LIVE=1` suite and opens/updates one `live-tests:drift` issue on failure; `npm-publish.yml` now runs `npm test` before publishing.

### Changed — parser-parity harness: returns tables verified on real captures

- New `test/parsers/parity.test.js` runs the vendored parsers on sdv-py's real committed captures (216, listed in `test/fixtures/py/manifest.yaml`; provenance in `test/fixtures/py/README.md`) and checks each endpoint's py returns table against what the JS parser returns: every documented column present, each value's JS type matching the documented type, every value's type matching sdv-py's own dtype, and cells equal to sdv-py's own output on the same bytes (oracle regenerated by `tools/parity/py_oracle.py` at the vendor pin; join keys incl. `*_pk` and MLBAM ids compare strictly). 179 of the 239 endpoints carrying a py returns table are verified, including all of MLB Stats, NHL api-web / EDGE / Records / Stats REST and the 247Sports RDB.
- `test/fixtures/py/parity_coverage.json` (drift-checked) splits all 825 vendored py returns tables per family into documented / no_schema / incompatible / overridden / overlay_schema / undeclared (asserted to sum), and lists per verified endpoint the schema columns its captures exercise; 117 columns on 25 verified endpoints are null in every capture (unexercised, type unchecked) and must be typed `unknown`. Generated row types key on this file.
- Returns tables that fail on real captures are dropped (`tools/codegen/vendor.yaml`, evidence inline; the parsers still match sdv-py cell for cell). **`nba_stats`, `wnba_stats` and `on3` wholesale** (`schema_compatible: false`): sdv-py builds the stats.nba.com tables from its endpoint catalog rather than the parser (`fg3m` / `leagueid` vs the parsed `fg3_m` / `league_id`, multi-result-set payloads) and the On3 ones from other captures; every table the harness could check failed (11/13 NBA, 8/8 WNBA, 3/3 On3). They return when sdv-py regenerates those schemas from parser output (a later pin bump, gated by the harness). Per endpoint, via the new `schema_incompatible` key: NWSL `standings`, Statcast `gamefeed` / `leaderboard_catcher_stance`.
- `npm run vendor` / `vendor:check` delete / flag a py schema copy the vendor wrote and no longer attaches by its exact path (byte-identical to the upstream copy; this removed the copies of the three flipped families and a stale `native/bart_wbb/ratings.yaml`); a JS-authored schema is never touched, wherever it lives. A hand-added file in a vendored directory is no longer flagged.

### Added — subscription families: PFF Developer API, KenPom, NFL Pro

Vendored from sportsdataverse-py (`719de79`). Each needs the caller's own paid credentials, has its own runtime, never retries a `403`, and is left out of the docs playground and its proxy allowlist. See the "Subscription families" section of the Transport & auth guide.

- **PFF Developer API** — `sdv.nfl.pffApi*` (68 wrappers, `api.pff.com`). Bearer key from `headers.Authorization` > `api_key` > `SDV_PFF_API_KEY` > `PFF_API_KEY`. `400` / `422` throw the new `InvalidParameterError` with PFF's message; `404` → `NoDataError`; `401` / `403` / `429` / `5xx` and non-object `200` bodies → `AssetFetchError`. Columns withheld by entitlement (`restricted`) warn, or throw with `strict: true` / `SDV_PFF_STRICT=1`. `/v1` query keys stay snake_case as the spec. Parsers `parse_pff_report` / `parse_pff_player_detail` / `parse_pff_v2_table` are ports of sdv-py's and match its output on PFF's published examples.
- **KenPom** — `sdv.mbb.kenpom*` (30 wrappers, `kenpom.com`). Password login (`email` / `password`, or `KENPOM_EMAIL` / `KENPOM_PW`, hoopR's `KP_USER` / `KP_PW`), session reused for 30 minutes; a rejected login throws. The default transport for this family is the browser-impersonating one (kenpom.com's Cloudflare check answers `403` to Node's TLS fingerprint), so it needs the optional `impit`. `{ parsed: true }` returns every table on the page keyed by HTML id; the parser ports sdv-py's `parse_kenpom_page` and the `pandas.read_html` header rules it relies on, and matches sdv-py on the committed fixture and on eight live pages. The parser is node-only (cheerio), so it is registered by the runtime rather than in the browser parser bundle (`NODE_ONLY_PARSERS`).
- **NFL Pro** — `sdv.nfl.nflPro*` (16 wrappers, `pro.nfl.com`). User-bound bearer from `headers.Authorization` > `token` > `NFLPRO_TOKEN`, checked for an active `NFL_PLUS_*` plan and expiry first (`NflProAuthError`). Pages on `offset` until the envelope's `total`; a capped result is flagged `_truncated`. An empty `200` (how the API rejects a parameter) → `InvalidParameterError`. With no token it logs in with `email` / `password` (see "NFL Pro email/password login").
- Core: `registerFamilyDefaults(family, { classifyError })` lets a family map a final failed response to its own error (404 stays `NoDataError`). New exports: `InvalidParameterError`, `NflProAuthError`, `nflProToken`, `resolvePffApiKey`, `hasKenpomLogin`, `kenpomLogin`, `kenpomClearSessionCache`, `parse_kenpom_page`, `NODE_ONLY_PARSERS`, and the `FlatParserFn` / `ParsedTables` types (a flat parser may return a dict of tables, as for KenPom pages and PFF's multi-table bodies).
- Live tests: `SDV_PFF_LIVE=1`, `SDV_KENPOM_LIVE=1`, `SDV_NFL_PRO_LIVE=1`, each also skipped without its credentials.
- `section` (the `MULTI_TABLE_SECTIONS` mechanism, extended): `parse_pff_v2_table` `'rows'` (default) / `'teamTotals'`, `parse_pff_player_detail` `'weeks'` (default) / `'career'`, and for the dict-default `parse_pff_report` / `parse_kenpom_page`, one table by name (a PFF report or dict key, a KenPom table id). An unknown name throws, listing the valid ones. `MULTI_TABLE_SECTIONS` entries may now have `default: null` (sdv-py's dict of tables) and `sections: null` (payload-named tables, described by `dynamic`). The reference docs and JSDoc show `section` for every multi-table wrapper.
- **Public TS type change:** `PARSERS` / `parserFor` are now typed `FlatParserFn` (`(raw, section?) => rows | ParsedTables`), since a flat parser may return a dict of tables. Code that called `parserFor(...)(raw).map(...)` must narrow the result first.
- `sportsdataverse/parsers` exports `parse_pff_report` / `parse_pff_player_detail` / `parse_pff_v2_table` / `parse_pff_matrix` / `parse_nfl_pro_stats` and `parse_kenpom_page`. The playground bundle is now built from `src/parsers/browser.ts`, which excludes the node-only KenPom parser.
- KenPom: explicit-credential sessions are keyed by an HMAC of e-mail + password under a random per-process key (never the plaintext or an unsalted hash), cached only after a successful login, and capped at 8, so a corrected password now works. Concurrent calls for one account share a single login, and a request in flight keeps its session even if a ninth account evicts it from the cache. A page that comes back logged out refreshes the session it used once, then throws `AssetFetchError`; it is never returned as data. A `401` refreshes the session the request actually used (`AuthContext.request` is passed to `refresh`).
- NFL Pro: boolean query params are sent as sdv-py's `requests` sends them, `"True"` / `"False"` (unverified live).

### Added — HockeyTech analytics: shifts, time on ice, on-ice tracking, Corsi/Fenwick

Port of sdv-py's `hockeytech/_analytics.py` (+ `parse_shifts` / `parse_pbp`) at the existing pin (`719de79`), in `src/analytics/hockeytech.ts` (pure) and `hockeytech_family.ts` (fetch).

- Every HockeyTech league gets `<lg>_game_shifts(gameId)`, `<lg>_player_toi(gameId)`, `<lg>_game_corsi(gameId)` and py's public `<lg>_pbp(gameId)` (fully enriched play-by-play) on `sdv.hockeytech` (camelCase aliases too, e.g. `sdv.hockeytech.pwhlGameCorsi(42)`), plus league-parameterised `hockeytech_shift_stints`, `hockeytech_enriched_pbp`, `hockeytech_player_toi`, `hockeytech_game_corsi` taking `{ league, game_id }`. `hockeytech_game_shifts` stays the raw-feed flat wrapper.
- Pure building blocks in `dist/analytics/hockeytech.js`: `parse_shifts`, `parse_pbp`, `enrich_pbp` (game meta, coordinate transforms, clock, power-play back-fill, shot geometry, on-ice), `build_on_ice`, `add_strength_state`, `corsi_fenwick`, `corsi_fenwick_on_ice`, `player_toi`, `game_corsi_rows`, and the rest of py's `_analytics`.
- A 200 body with no recognisable pbp / shift / game-summary structure (unparseable, error sentinel) throws `AssetFetchError`; only a present-but-empty structure gives `[]`. HockeyTech's plain-text `Feed type access denied.` reply (e.g. MJHL `gc/gamesummary`) is recognised as "no access" and treated as empty, as in sdv-py. New `hockeytechGetText` returns the raw feed text; `hockeytechGet` is unchanged.
- Corsi/Fenwick are proxies: the feed has no missed-shot event, so attempts = shot + blocked_shot + goal (`corsi_includes_missed = false`).
- Checked cell by cell against sdv-py's own output (`test/fixtures/hockeytech/analytics/oracle.json`, generated by `tools/oracle/hockeytech_analytics_oracle.py`) on the real PWHL game 42 / OHL game 27225 captures plus hand-built edge frames. Deliberate differences: `enrich_pbp` never fetches (pass the payloads), group-by output order is first-seen, and an empty pbp returns `[]` where py raises.

### Added — discovery + name lookup (sdv-py `discover.py` / `find.py`)

- `listFunctions` / `functionCount` (index of every wrapper per namespace, `search`, `parsersOnly`, `wrappersOnly`) and `findTeam` / `findAthlete` / `findEvent` / `clearTeamCache` (ESPN name -> id via teams, rosters, scoreboard). Built over the live registries, so generated/renamed wrappers appear automatically. py snake_case aliases exported too.

### Added — keyless sdv-py families: On3, ASA, MLS, NWSL, women's T-Rank, ESPN FPI

Vendored from sdv-py at the existing pin (`719de79`); no key or login for any of them.

- `sdv.on3.*` (78 endpoints, On3 Recruit Database `api.on3.com/public/rdb`), `sdv.asa.*` (15, American Soccer Analysis, `league_slug` = mls/nwsl/uslc/usl1/mlsnp), `sdv.mls.mls_*` (12, the three mlssoccer.com hosts) and `sdv.nwsl.nwsl_*` (9, StatsPerform SDP; sdv-py's names, v4). MLS and NWSL send the site `Referer` plus a browser User-Agent; NWSL composite ids (`nwsl::Football_Season::<hex>`) go on the wire with the `::` unencoded. The four deprecated On3 `_next/data` scrape shims are not ported.
- `sdv.torvik.bart_wbb_ratings` (women's T-Rank, `barttorvik.com/ncaaw`).
- `espn_<league>_fpi` on every league: ESPN's resolved Football Power Index table (`site.web.api.espn.com/apis/fitt/v3`, a fifth ESPN host family), parsed by `parse_fpi`.
- Parsers are ports of sdv-py's, checked cell by cell against sdv-py's own output on real captures. Multi-table parsers (ASA goals-added, MLS standings and match, NWSL lineups) return one sub-frame under `parsed: true` — the one sdv-py's returns schema documents (ASA `summary`, MLS `entries` / `match_information`, NWSL `players`) — and `section: "<name>"` selects any other (unknown name throws, listing the valid ones; values are in the generated reference). Every sub-frame at once: `parse_asa_goals_added_tables`, `parse_mls_standings_tables`, `parse_mls_match_tables`, `parse_nwsl_lineups_tables` from `sportsdataverse/parsers`.
- A 2xx non-JSON body (HTML bot block) from these JSON hosts is an `AssetFetchError`, not an empty result; a genuinely empty `[]` / `{}` is data.
- Playground proxy: the new hosts (and MLS's per-endpoint `sportapi` / `dapi` hosts) are allowlisted; the proxy supplies the MLS / NWSL `Referer`.

### Added — stats.nba.com / stats.wnba.com (`nba_stats` 128, `wnba_stats` 111)

- Vendored from sdv-py@719de79 onto `sdv.nba.nba_stats_<slug>` (e.g. `nba_stats_leaguedashplayerstats`, `nba_stats_playercareerstats`) and `sdv.wnba.wnba_stats_<slug>`; `league_id` selects `"00"` NBA, `"20"` G-League, `"15"` Summer League (WNBA `"10"`). `{ parsed: true }` runs the ported `parse_nba_stats_result_sets` (single set -> rows, several -> `{ setName: rows }`, empty/malformed -> `[]`).
- **Needs a TLS-impersonating transport.** stats.nba.com fingerprint-blocks plain clients (the request hangs instead of failing) and hangs on datacenter/cloud IPs. Both families default to `createImpersonatingTransport({ browser: "chrome" })` (optional peer `impit`: `npm install impit`) with the sdv-py stats headers, and 403 is never retried. Without `impit`, calls reject with `TransportUnavailableError` explaining the install and the datacenter-IP caveat. A timeout, blank body or bare `{}` is a failure (`AssetFetchError`), never "no data".
- Not on the docs playground proxy. Live tests use their own gate `SDV_NBA_STATS_LIVE=1` (never set in CI).


### Added — HockeyTech: 15 more leagues, season-id helpers, PWHL views

- Registry now covers all 20 sdv-py leagues: added `echl`, `sphl`, `chl`, `ushl`, `bchl`, `ajhl`, `sjhl`, `ojhl`, `cchl`, `gojhl`, `mhl`, `nojhl`, `vijhl`, `kijhl`, `mjhl` (keys/ids copied from sdv-py; `SDV_<LEAGUE>_API_KEY` overrides). Registry entries also carry `pbpStyle` and `otPeriodLength`. Caveats: `ushl` PBP has no coordinates; `mjhl`'s public key has no gamecenter access (pbp/game_summary come back empty).
- New wrappers (every league): `hockeytech_scorebar`, `_player_game_log`, `_player_search`, `_stats`, `_transactions`, `_playoff_bracket`. py's `streaks`, `game_info`, `player_box` and `player_info` are not ported (upstream view absent / non-functional in sdv-py).
- Season helpers on `sdv.hockeytech`: `hockeytech_season_id(league)`, `most_recent_hockeytech_season(league)`, `hockeytech_resolve_season_id(league, {season|seasonId, gameType})` (camelCase too).
- `hockeytech_seasons` parsed rows gain `season_yr` and `game_type_label`; `hockeytech_schedule` now defaults to the full-history window (`numberofdaysback/ahead/limit` = 10000, as sdv-py).
- Season ids: `hockeytech_schedule` / `hockeytech_playoff_bracket` take a raw `season_id` (py accepts an end-year `season=`). Resolve first with `hockeytech_resolve_season_id(league, { season })`; brackets need `gameType: 'playoffs'`. The views that sdv-py sends `league_id` on (schedule/scorebar, standings, transactions, brackets) now send the league's registry `leagueId` (overridable via `league_id`).


### Changed (breaking) — error vocabulary, pluggable transport + auth

Every wrapper now fetches through one runtime core: auth provider → transport →
retry → classification.

- **BREAKING:** wrapper failures raise `NoDataError` (HTTP 404, or an ESPN 200
  body `{ code: 404 }`) / `AssetFetchError` (403, 429, 5xx, network, retries
  exhausted) instead of raw axios errors — siblings under `SdvError`;
  `NoESPNDataError` aliases `NoDataError`. The Statcast, BartTorvik and
  HockeyTech getters no longer turn a failed HTTP fetch into `{}` / `""`
  (HockeyTech's unknown-league and unparseable-200 cases, which still
  returned `{}` here, throw as of the "HockeyTech hardening" entry above.)
- Retries network errors and 403 / 408 / 429 / 500 / 502 / 503 / 504 with
  backoff + jitter (honours `Retry-After`; default 3 retries, at most 4 on
  statuses). Auth-gated families drop 403 via
  `registerFamilyDefaults(family, { retryStatuses })` (`nfl_api` does). A 401
  refreshes credentials once.
- `configure({ transport, auth, retries, timeoutMs, userAgent })`,
  `getConfig()`, `resetConfig()` — per-family transports + auth.
- Transports: `axiosTransport` (default), `createImpersonatingTransport()` via
  the optional peer dependency `impit`. Auth helpers: `bearerAuth`,
  `headerAuth`, `queryAuth`, `tokenAuth`, `sessionAuth`; NFL.com auth is a
  registered `tokenAuth` (same `NFL_*` env vars).
- Fix: a flat wrapper's `headers` argument is now forwarded for every family
  whose getter takes headers (not HockeyTech, which builds its own).
- New guide: [Transport, auth & errors](/docs/guides/transport-and-auth).


### Changed (breaking) — provider method naming

Dropped internal vendor API codenames (and redundant `_api` stems) from provider
method names + labels (the `sdv.fox`/`cbs`/`yahoo`/`mlb`/`recruiting` namespaces
are unchanged):

- `foxBifrost*` → `fox*`, `cbsNapi*` → `cbs*`, `yahooShangrila*` → `yahoo*`,
  `yahooEditorial*` → `yahooScores*`, `mlbApi*` → `mlb*`,
  `sports247*` → `recruiting*` (label kept as "247Sports").

The rename flows through the codegen stems, returns-schema paths, parser names,
playground ids, and docs. Real upstream URL paths that contain the vendor
codename (Fox `/bifrost/v1/…`, Yahoo `/v1/query/shangrila/…`) are unchanged.


### Changed — shared endpoint YAML is vendored from sportsdataverse-py

The shared codegen families (`espn_site_v2`, `espn_core_v2`, `espn_web_v3`,
`leagues`, `mlb_statcast`, `nfl_api`, the four `nhl_*`, `mlb`, `torvik`, `cbs`,
`yahoo`) and every returns schema they reference are now derived from a pinned
sportsdataverse-py commit by `tools/codegen/vendor.mjs` (`npm run vendor`), with
JS-only endpoints in `tools/codegen/overlay/`. `npm run vendor:check` (CI) fails
on a hand-edit; a weekly `vendor-sync.yml` PR bumps the pin. The first re-vendor
(sdv-py `719de79edb`) converges the 127 shared endpoint definitions that had
drifted since the 2026-06 fork:

- **New wrappers:** ESPN Core v2 `season_week_powerindex` (every league) and NCAA
  `recruiting_years` / `recruiting_athletes` / `recruiting_rankings`;
  `sdv.nfl.nflApi{GameDetailsBySlug,GameDetailsV2,LiveTeamStatistics,LivePlayerStatistics}`;
  `sdv.yahoo.yahooEditorial{Boxscore,Scoreboard}` (on the editorial host — flat
  endpoints may now carry their own `host`). Their py-only parsers fall back to the
  family's generic parser in JS.
- **New query defaults:** ESPN `team_roster` / `transactions` /
  `season_group_children` send `limit=500`; `awards` / `season_awards` /
  `positions` / `tournaments` `limit=200`; `teams_core` / `season_teams` /
  `season_recruits` `limit=1000` + `page=1`; `venues` `limit=1000`; `season_coaches`
  `limit=500`. ESPN otherwise pages these silently (CFB rosters were cut at 100).
  `nflApiRosters` gains `team_id`.
- **`sdv.yahoo.*` (stats graph):** host is now
  `https://graphite-secure.sports.yahoo.com/v1/query/shangrila` (same final URLs).
  The wrappers no longer declare `lang` / `region` / `tz` (Yahoo applies the same
  locale defaults server-side) and the stats queries no longer default
  `league=ncaaf` — pass `league` explicitly. **BREAKING** for callers that passed a
  locale or relied on the `league` default.
- **`sdv.cbs.*`:** host `https://api.cbssports.com/napi` (what sdv-py ships).
- **Param transforms:** `sdv.nhl.nhlEdge*` / `nhlApiWeb*` accept a 4-digit season
  and send the 8-digit form (`season: 2025` → `20242025`, sdv-py's
  `format_nhl_season`; an unrecognized season throws). `nflApi*` `include_*` flags and
  ESPN `athletes_index` `active` are sent as `"true"`/`"false"`. The codegen fails on
  a transform the runtime doesn't implement.
- 75 returns-schema files arrive from sdv-py (NHL Records, NHL EDGE, NHL Stats
  REST, NHL api-web, MLB Stats, nfl_api). A py schema is attached only where
  vendor.yaml declares the JS parser equivalent to sdv-py's (fail-closed); CBS,
  Yahoo, torvik, ESPN and the endpoints on a different or fallback parser keep JS's
  own schema or show none.

## **V3.1.0**

A minor, additive release: two new flat-API families (no breaking changes), plus
the docs-site overhaul.


### New flat-API families

Two standalone provider namespaces join the flat-API surface — **532 flat-API
wrappers across 15 families** now (was 517 across 13). Both expose dual-case names
(snake_case + camelCase), accept `{ parsed: true }`, and ship fully
column-described returns tables.

- **HockeyTech / LeagueStat** (`sdv.hockeytech.*`, 10 endpoints) — a
  **league-parameterized** women's + junior hockey family for the **PWHL** plus
  **AHL / OHL / WHL / QMJHL**; pick the league with a `league` slug
  (`sdv.hockeytech.hockeytech_schedule({ league: 'pwhl', parsed: true })`).
  Endpoints: `seasons`, `schedule`, `teams`, `team_roster`, `player_stats`,
  `game_shifts`, `standings`, `leaders`, `pbp`, `game_summary`. Hosts:
  `lscluster.hockeytech.com` (+ `cluster.leaguestat.com` for QMJHL). Its runtime
  (`src/core/hockeytech_runtime.ts`) unwraps the JSONP envelope
  (`angular.callbacks._N({…})`) before `JSON.parse`, switches the `gc` feed to
  `tab=` (not `view=`), applies the PWHL play-by-play key override, and injects
  each league's `client_code` / `key` / `site_id` from a per-league registry
  (overridable via `SDV_<LEAGUE>_API_KEY`). Ported from `fastRhockey` +
  `sportsdataverse-py`.
- **BartTorvik / T-Rank** (`sdv.torvik.*`, 5 endpoints) — men's
  college-basketball analytics (`ratings`, `team_factors`, `game_stats`,
  `player_stats`, `game_schedule`) from `barttorvik.com`. Its runtime
  (`src/core/torvik_runtime.ts`) sends a browser-like User-Agent (barttorvik
  rejects default UAs) and returns the raw body so each parser branches on format
  — CSV via papaparse, or `JSON.parse` of the **headerless positional column
  arrays** (31 / 55 / 67 fields, ported verbatim from `hoopR`'s `torvik_*.R`).

  A flat family needing non-JSON bodies or custom request shaping registers its
  own getter runtime in `GETTER_OVERRIDES` (`src/leagues/_make_flat.ts`), so the
  shared no-auth getter stays JSON-only.

  **Playground caveat:** QMJHL's secondary host works from the **library** but not
  the in-browser **playground** — the `/api/run` proxy allowlist derives one host
  per family, so QMJHL calls there hit the primary host. Use the library directly
  for QMJHL.


### Docs

A docs-site overhaul that makes the guides literate and the navigation
data-driven:

- **Sport-grouped reference sidebar.** ESPN league reference docs are now nested
  under a collapsible category named for their sport (plus a Providers group),
  emitted by codegen into `docs/src/generated/reference-sidebar.js` and consumed
  by `docs/sidebars.js`. It's drift-guarded (`npm run codegen:check`) and regroups
  automatically from `leagues.yaml` — the reference pages stay flat (no URL change).
- **Nav/footer + sidebar Playground link.** Docs / News / Tutorials / Playground
  appear in both the navbar and the footer, and a 🛝 [Playground](/playground)
  link sits near the top of the docs sidebar.
- **Data-driven homepage.** The home page maps over the generated `endpoints.json`
  (leagues by sport + provider families), so adding a sport/provider updates it on
  `npm run codegen` — no bespoke edit.
- **Embeddable live RunCell guides.** `<RunCell>` is a compact single-endpoint
  live runner droppable inline in any `.mdx` guide: editable params → resolved URL
  → Run (via the `/api/run` proxy) → raw JSON or a parsed table. It handles every
  flat family, the `summary` section selector, enum dropdowns, and non-JSON
  Statcast CSV, and is SSR-safe.
- **Build-time output injector.** A build-time injector (`tools/docs/inject-outputs.mjs`
  + the manifest `tools/docs/examples.mjs`) freezes real parsed tables into guides
  between `<!-- inject:example:ID -->` markers — deterministic (fixture-driven, no
  network). `npm run docs:examples` writes them; `npm run docs:examples:check` is a
  CI drift gate.

## **V3.0.0**

A major release that turns `sportsdataverse` into a **cross-league ESPN client**
**plus a native (non-ESPN) live-API client** with a tidy parser layer.

- **Cross-league ESPN surface.** 116 endpoint wrappers are now generated for
  **29 leagues** (31 namespaces) from a single YAML source of truth — every
  league exposes the same `espn_<league>_<short>` methods (e.g.
  `sdv.nba.espn_nba_scoreboard()`, `sdv.soccer.espn_soccer_scoreboard({ league: 'eng.1' })`).
  Soccer, cricket, and the UFL join the existing NBA/NFL/NHL/MLB/WNBA/MBB/WBB/CFB set.
- **Native API integration (255 flat wrappers across 7 families).** Beyond ESPN,
  the package now wraps the major leagues' own live APIs, merged onto the matching
  league namespace:
  - **MLB Stats API** (`statsapi.mlb.com`) — `sdv.mlb.mlb*` (e.g. `mlbSchedule`).
  - **Baseball Savant / Statcast** (`baseballsavant.mlb.com`) — `sdv.mlb.mlbStatcast*`,
    including date-chunked Statcast search; heterogeneous CSV/JSON/HTML responses
    are content-type-aware.
  - **NHL api-web** game feed + **NHL EDGE** player tracking (`api-web.nhle.com`),
    **NHL Stats REST** (`api.nhle.com/stats/rest`), and **NHL Records**
    (`records.nhl.com`) — `sdv.nhl.nhlApiWeb*` / `nhlEdge*` / `nhlStatsRest*` / `nhlRecords*`.
  - **NFL.com "Shield" API** (`api.nfl.com`) — `sdv.nfl.nflApi*`, with automatic
    anonymous `WEB_DESKTOP` bearer-token minting (cached + auto-renewed; no
    credentials required).
- **tidy.js parser layer.** Every native wrapper returns the raw response by
  default; pass `{ parsed: true }` to run the payload through a registered parser
  that flattens it to a tidy array of row objects via a shared in-house
  `normalize` helper (a `json_normalize` equivalent). Strictly additive — omitting
  `parsed` is the unchanged raw-response behavior, matching `sdv-py`'s
  `return_parsed=True`. The [`@tidyjs/tidy`](https://github.com/pbeshai/tidy)
  toolkit is re-exported (`import { tidy } from 'sportsdataverse'`) so the parsed
  arrays compose directly with its grammar-of-data verbs. The **cross-league ESPN
  wrappers** now accept the same `{ parsed: true }` flag — a faithful port of
  `sdv-py`'s `_common_espn_parsers` (22 parsers covering all 116 ESPN endpoints,
  incl. the 21-sub-frame `summary` dispatcher with a `section` arg).
- **Five cross-sport provider families.** Beyond ESPN + the native league APIs,
  five independent providers each get a standalone `sdv.<ns>.*` namespace +
  reference page, generated from a canonical OpenAPI spec via a reusable
  **OpenAPI→endpoint-YAML transform**:
  - **The Odds API** (`sdv.odds.*`, 10) — odds/scores; `apiKey` query param.
  - **247Sports** (`sdv.recruiting.*`, 25) — recruiting rankings (caller JWT).
  - **CBS Sports** (`sdv.cbs.*`, 82) — public NAPI, keyless.
  - **Fox Sports** (`sdv.fox.*`, 38) — Bifrost API (`{sport}`); public apikey.
  - **Yahoo Sports** (`sdv.yahoo.*`, 107) — editorial + shangrila stats-graph.

  **517 flat-API wrappers across 13 families** in total; `{ parsed: true }` works
  for every one.
- **Dual-case naming.** Every generated wrapper (ESPN and native) is exposed
  under BOTH its snake_case name (`mlb_teams`, py/R parity) and its camelCase
  canonical name (`mlbTeams`, idiomatic JS) — same function, either name.
- **Flat-aware docs + playground.** The generated reference pages now include a
  **Native API — `<family>`** section per league (host, path, params, parser, auth);
  the live [playground](/playground) groups native endpoints under their league by
  family and runs them through a flat-aware serverless proxy (host-allowlisted,
  with server-side token minting for NFL.com and content-type passthrough for
  Statcast CSV/HTML). A shared **ESPN parsed returns** page documents the columns
  each of the 22 ESPN parsers yields (documented once by parser, since the 116
  endpoints share them), linked from every league page. The playground now also
  has a **Raw/Parsed toggle** (tidy rows render as a sortable table), **shareable
  deep-link URLs**, and an **Examples menu** spanning ESPN, the native APIs, and
  all five providers.
- **Getting-started guides + RunKit notebooks.** Per-area recipe pages under
  `/docs/guides/` (quickstart, NBA/WNBA/college-basketball/NFL/MLB/NHL/CFB/soccer,
  providers) with runnable raw-vs-parsed snippets, "Open in playground" deep-links,
  and embedded RunKit live notebooks.
- **Migrated to TypeScript.** The package is authored in TypeScript and ships
  type declarations (`.d.ts`) alongside the ESM build. The compiler caught
  several latent bugs during the port.
- **ESM-only, Node ≥ 20.18.1.** `cheerio` 1.2 (via `undici` 7) sets the floor.
- **Codegen + drift gate.** `npm run codegen` regenerates the wrapper tables
  (ESPN + flat) and docs from `tools/codegen/endpoints/*.yaml`;
  `npm run codegen:check` fails CI if the committed output is stale.
- **Legacy methods preserved.** Every pre-3.0 method (`sdv.nba.getPlayByPlay(id)`,
  etc.) still works — the generated wrappers are merged *alongside* them.

## **V2.0.0**

- Major version bump to 2.0.0
- Convert to ESM (fixes tabletojson import error)
- Update dependency versions
- Remove broken functions due to API 404 so all tests pass (mbb getRankings, wbb getRankings, ncaa getTeamStats getScoringSummary)

## **V1.2.5**

- NFL getWeeklySchedule function added by @unmonk

## **V1.2.4**

- MLB functionality added by @unmonk (very grateful for the contribution!)

## **V1.2.0-2**

- Updated standings functions to be able to provide league-wide, conference and division for each applicable existing sport from ESPN.

## **V1.1.0**

The following breaking changes were made:

- submodules were just basically simplified/removed, all functions are just now `{sport-league}.getXXX`, eg. `cfb.getTeamList()` and no longer `cfbTeams.getTeamList()`;
- support for statistics from stats.ncaa.com added, so you can get information on everything from men's ice-hockey to women's bowling.
- Documentation website created and updated

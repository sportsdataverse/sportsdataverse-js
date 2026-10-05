# Changelog

All notable changes to `sportsdataverse` (Node.js) are documented here. The
docs-site copy lives at [`docs/src/pages/CHANGELOG.md`](docs/src/pages/CHANGELOG.md)
and renders at <https://js.sportsdataverse.org/CHANGELOG>.

## Unreleased

### Fixed — transport / auth runtime

- **Date query values.** A `Date` passed as a query parameter is sent as ISO-8601 UTC again (`2025-02-01T00:00:00.000Z`, what axios sent before the transport layer); it had become `Date#toString()` (`"Sat Feb 01 2025 …"`). An invalid `Date` throws an `SdvError` naming the parameter before anything is sent. Both built-in transports serialise the same way, and axios' `config.url` stays query-free (an app interceptor that logs it never sees a query-param key). A date-only API (`YYYY-MM-DD`, ESPN's `YYYYMMDD`) wants a string.
- **Credential redaction.** `safeCause` (every `SdvError` cause) also redacts credential-looking text, so an error your own transport throws can't carry it: `Authorization` / `Proxy-Authorization` / `X-Api-Key` / `X-Auth-Token` / `X-Access-Token` / `Api-Key` / `Ocp-Apim-Subscription-Key` and `Cookie` / `Set-Cookie` values, `Bearer <token>` / `Basic <base64>`, JWT-shaped strings (also glued to a word or `%3D`), and the values of `password` / `token` / `accessToken` / `refreshToken` / `api_key` / `client_secret` / … pairs (`=`, `:`, URL-encoded, or `"password": "…"`; a bare `key=` only when the value looks like a credential). Ordinary text is untouched; the error name is redacted too. Every redaction pattern is now linear-time: the URL patterns were quadratic on long scheme-character runs (100 KB took seconds; now < 10 ms).
- **Retries / timeout per family.** `registerFamilyDefaults` takes `retries` and `timeoutMs`; a value you pass to `configure` still wins. `pff_api` now retries 4 times (sdv-py's budget; was 3). `nfl_pro` keeps sdv-py's 45 s timeout but no longer overrides `configure({ timeoutMs })`. Login and token-mint requests (KenPom, 247Sports, `nfl_api`) use the resolved timeout too. `pff_api` no longer retries a `408` (sdv-py retries {429, 5xx}; the read budget is shared).
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

- `sdv.<lg>.espn_<lg>_pbp(game_id, { raw })` plus `helper_<lg>_pbp(game_id, pbp_txt)` and its stages `helper_<lg>_pickcenter`, `helper_<lg>_game_data`, `helper_<lg>_pbp_features` (+ camelCase, e.g. `sdv.nba.espnNbaPbp`, `sdv.mbb.helperMbbPbp`) for `nba`, `wnba`, `mbb`, `wbb`, under sdv-py's names. `espn_<lg>_pbp` fetches the summary through `espn_<lg>_summary`, keeps sdv-py's incoming keys (absent ones defaulted as py does) and returns py's cleaned game dict: `plays` rows with py's column names and order (dotted, e.g. `end.half_seconds_remaining`), the `timeouts` map (team id -> `{"1": play ids, "2": play ids}`), and the summary keys passed through; `raw: true` returns the trimmed payload. The helpers are pure. Ported from sdv-py (pin 719de79) with its per-league facts: NBA quarters with the 720 / 1440 / 2160 / 2880 ladder; WNBA and WBB use the format's period count (else the season year: WNBA halves before 2006, WBB before 2016) for the 600-second quarter or 1200-second half ladders; MBB plays halves with its own columns (`half` = period, `start.period_seconds_remaining`, ...) and an Int32 M:SS clock -- a decimal clock such as `"23.4"` throws, as in py, but ESPN's college feeds use whole-second M:SS clocks, so that only happens on a non-MBB payload; OT is 300 seconds everywhere. Seconds-remaining columns round to float32 at every step like polars. `helper_<lg>_pickcenter` / `helper_<lg>_game_data` return a value taken from the pickcenter as a one-element array (py: a numpy array), e.g. `gameSpread: [-8.5]`; a league default stays a scalar. The play `id` column follows the INT64 policy per game: numbers when every id is a safe integer, else BigInt with one warning -- so its type depends on the era: ESPN's college play ids are 13 digits (numbers) for 2006-2013 and 18 digits (BigInt) from 2014-15, with the 2014 season mixing both; NBA / WNBA ids are numbers. The per-column id type is under review for v4. Lag / lead / row numbers never cross a `game_id`. Not ported, deliberately: `<lg>_pbp_disk` (it reads a local JSON path; in JS, `JSON.parse` the file and call `helper_<lg>_pbp`, and `fs` would break browser builds). Parity: every league is compared cell by cell with sdv-py's own `espn_<lg>_pbp` on 19 real captures (5 new live-captured games: WNBA 2003 halves, WBB 2015 halves + OT, WBB 4OT, MBB 2OT, NBA OT with two pickcenter providers) and 25 derived payloads, including the halves cutoffs pinned on both sides (`tools/parity/espn_basketball_pbp_oracle.py`).

### Added — ESPN basketball box producers (NBA / WNBA / MBB / WBB)

- `sdv.<lg>.helper_<lg>_player_box(summary)` and `helper_<lg>_team_box(summary)` (+ camelCase, e.g. `sdv.nba.helperNbaPlayerBox`) for `nba`, `wnba`, `mbb`, `wbb`: one game's ESPN summary payload in, the rows the hoopR / wehoop box-score releases publish out. Pure (no network): fetch with `espn_<lg>_summary({ event_id })` and pass the result in. Ported from sdv-py (pin 719de79) with its per-league facts: NBA/WNBA carry `plus_minus` (a string such as `"+16"`), MBB/WBB do not; MBB/WBB skip a game whose second team ships no athletes, NBA/WNBA publish the first team's rows; MBB orders `active` last. Same columns, order and null handling as sdv-py; Int32 columns are numbers (ids included); `game_date_time` and `game_date` are JS `Date`s, exactly as the release loaders decode the published parquet (the instant, and the New York calendar date at UTC midnight), so producer rows and loaded rows join on the same values. A payload sdv-py skips returns `[]`. Parity: every helper is compared cell by cell with sdv-py's output on 14 real captures (full games in all four leagues, plus archival, one-sided, scheduled and stat-less payloads) and 24 derived gate payloads (`tools/parity/espn_basketball_box_oracle.py`).

### Security

- Runtime dependencies patched: `axios` `^1.17.0` → `^1.20.0` (22 advisories, 8 high — header injection, prototype-pollution gadgets, ReDoS, HTTP/2 DoS, fetch-adapter redirect SSRF) and `undici` (pulled in by `cheerio`) 7.27.2 → 7.30.0 in the lockfile (21 advisories, 6 high). Both stay within their major version; no API change. `npm audit --omit=dev` is clean. The `undici` bump is lockfile-only: a consumer's install resolves cheerio's `^7.19.0` itself. sdv-js never sends requests through `undici`; it only calls `cheerio.load` on HTML that `axios` fetched, and the KenPom parser imports `cheerio/slim`.
- Dev-only dependencies patched (never shipped — `files` is `dist/` only): `js-yaml` 4.3.2 (override floor raised from `^4.2.0`), `brace-expansion` 2.1.7 / 5.0.12, `markdown-it` 14.3.2, `linkify-it` 5.0.2, all through `mocha` / `typedoc`. Root `npm audit` is clean.
- Docs-site dependencies (`docs/package-lock.json`, build-time only, never shipped) refreshed: every `@docusaurus/*` package 3.10.1 → 3.10.2 on one version (including `@docusaurus/faster` and `@docusaurus/types`, which the lockfile refresh would otherwise have left on 3.10.1), plus in-range patches that close 53 of 54 Dependabot advisories (`brace-expansion`, `fast-uri`, `js-yaml`, `joi`, `svgo`, `postcss`, `nanoid`, `image-size`, `browserslist`, `shell-quote`, `http-cache-semantics`, `webpack-dev-server`, `qs`, …). The one left, `braces` (GHSA-vfj7-8cjw-p6xm), has no fixed release and is build-time only; see `SECURITY.md`.
- Credentials no longer reach `err.cause`. A raw axios error carries its request config — the `Authorization` header, cookies, and a POSTed login form, password included — and it was attached as-is to `AssetFetchError` (network failures, auth failures), so `util.inspect(err)` or a logged error could expose them. Every `SdvError` now stores its `cause` through `safeCause` (name, message and stack with URL query strings and `user:password@` redacted, plus `code` / `errno` / `syscall` — nothing else). `axiosTransport` and the impersonating (impit) transport reject with the same sanitized errors. This applies to every family; the old behavior predates this PR.

### Added — release dataset loaders (323 `load*` functions)

- **New:** one loader per entry of sdv-py's `releases.yaml` (vendored verbatim), generated onto its league namespace as camelCase + snake alias, e.g. `await sdv.cfb.loadCfbPbp({ seasons: 2024, columns: ['game_id', 'text', 'EPA', 'home_wp_before'] })` / `sdv.cfb.load_cfb_pbp(...)`: cfb 71, nba 41, mbb 34, wbb 34, wnba 34, mlb 32, nfl 29, nhl 27, pwhl 21 (new `sdv.pwhl` namespace). They read the published SportsDataverse / nflverse parquet assets — play-by-play with EPA/WP, schedules, rosters, box scores, ratings, player value — and resolve to an array of plain row objects. Options: `seasons` (one or a list; integers or 4-digit year strings, anything else raises `SdvError`), `columns` (read only those), `format` (`"rows"` default, or `"columns"` → `{ [column]: values[] }`, ~4x lighter), `maxCells`, `timeoutMs` (default 5 min).
- **Size guard:** before decoding each season, a loader adds its rows × columns (from the parquet footer) to a running total and checks it against `maxCells` (seasons are downloaded and decoded one at a time, so at most one compressed download is held) — by default V8 heap limit / 100 for rows (≈45M cells on Node's default 4 GB heap) and / 30 for `format: "columns"` — and throws a catchable `SdvError` naming `columns`, `format: "columns"` and `--max-old-space-size` instead of crashing the process. A full row-object read of CFB play-by-play 2024 (163,567 × 506) needs ~5.4 GB of heap; `format: "columns"` loads it in ~1.7 GB, and the generated play-by-play examples pass `columns`.
- Seasons below a loader's floor raise `SeasonNotFoundError` before any download; a season with no asset (HTTP 404) is skipped with a warning; any other failure raises `AssetFetchError`. Multi-season results union columns, null-fill gaps and cast a column whose type changed between seasons to the common type (sdv-py's `diagonal_relaxed`: an integer id that became a string → strings, `"123"` never `"123.0"`). `{season + 1}` assets (nba_stats) take the START year, as in sdv-py. The three `load_nba_stats_*_v3` loaders are deprecated aliases (one-time `DeprecationWarning`).
- INT64 columns are plain `number` when every value is a safe integer, else left `BigInt` with one warning naming the column — ESPN play ids (`id` in CFB / MBB play-by-play, 18 digits) are beyond 2^53 and stay `BigInt`. `id_int64` columns are pinned to integers first, as sdv-py's `_cast_ids_int64` does (canonical integer strings convert; anything else is left untouched).
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

**Also BREAKING for `parsed: true`:** Baseball Savant CSV rows (`parse_mlb_statcast_leaderboard`, `parse_mlb_statcast_search`, and the hand-written `mlb_statcast_search` / `_search_minors` / `_search_wbc` with `{ parsed: true }`) are now typed the way sdv-py's pandas reader types them: numeric columns are numbers (were strings), an integer column with a value beyond `Number.MAX_SAFE_INTEGER` is `BigInt` (one warning), `inf` / `-inf` are `Infinity` / `-Infinity`, True/False columns booleans, NA cells (`""`, `NA`, `NaN`, ...) `null`. The MLBAM id columns (`batter`, `pitcher`, `on_1b`..`on_3b`, `fielder_2`..`fielder_9`, `game_pk`) are pinned to integers in the CSV rows and in `parse_mlb_statcast_gamefeed` (whose `game_pk` was the feed's string `"745444"`), so the two join (sdv-py `_pin_id_columns`). Found by the parser-parity harness below.

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

Every wrapper (ESPN and flat-API) now fetches through one runtime core
(`src/core/request.ts`): auth provider → transport → retry → classification.

- **BREAKING: wrapper failures raise `NoDataError` / `AssetFetchError` instead of
  raw axios errors.** `NoDataError` = the fetch worked and there is nothing there
  (HTTP 404, or an ESPN 200 body `{ code: 404 }`, which used to be returned as
  data). `AssetFetchError` = the fetch failed (403, 429, 5xx, network, retries
  exhausted; carries `status`, `url`, `cause`). They are siblings under `SdvError`;
  `NoESPNDataError` aliases `NoDataError`; `SeasonNotFoundError` and
  `TransportUnavailableError` are new too.
- **BREAKING: the Statcast, BartTorvik and HockeyTech getters no longer turn a
  failed HTTP fetch** into `{}` / `""` — they throw like every other wrapper, so
  a failed fetch can't be mistaken for an empty table. (HockeyTech's unknown-league and unparseable-200 cases, which still
  returned `{}` here, throw as of the "HockeyTech hardening" entry above.)
- **Retries:** network errors and the family's retry statuses (default
  `DEFAULT_RETRY_STATUSES` = 403 / 408 / 429 / 500 / 502 / 503 / 504, as
  sdv-py) are retried with exponential backoff + jitter (0.5s doubling, capped
  at 4s), honouring `Retry-After` (capped at 120s). The default budget is 3
  retries, with at most 4 spent on statuses. 403 is retried because ESPN Core v2
  answers 403 under load. Auth-gated families narrow the set with
  `registerFamilyDefaults(family, { retryStatuses })`; `nfl_api` never retries a
  403. A 401 refreshes credentials once.
- **`configure({ transport, auth, retries, timeoutMs, userAgent })`** +
  `getConfig()` / `resetConfig()`. Transports and auth are per family
  (`site_v2`, `core_v2`, `mlb`, `nfl_api`, …) with an optional `default`
  transport.
- **Transports:** `axiosTransport` (default) and `createImpersonatingTransport()`
  — browser TLS fingerprinting via the new **optional peer dependency
  [`impit`](https://github.com/apify/impit)** (`npm install impit`).
- **Auth helpers:** `bearerAuth`, `headerAuth`, `queryAuth`, `tokenAuth` (minted +
  cached tokens), `sessionAuth` (login cookies / headers). NFL.com auth is now a
  `tokenAuth` registered for `nfl_api` (same `NFL_ACCESS_TOKEN` /
  `NFL_CLIENT_KEY` / `NFL_CLIENT_SECRET` behaviour).
- **Fix:** a flat wrapper's `headers` argument is now forwarded for every family
  whose getter takes headers. It was dropped for non-`auth` families such as
  247Sports and Yahoo. HockeyTech's getter builds its own headers and still
  takes params only.
- New guide: *Transport, auth & errors*. CI adds a `strict: true` type-check of
  the runtime core (`npm run typecheck:strict`).


### Changed (breaking) — provider method naming

Dropped internal vendor API codenames (and redundant `_api` stems) from the
provider method names + labels so they read as the product / namespace, not the
vendor's internal API name. The namespaces (`sdv.fox` / `sdv.cbs` / `sdv.yahoo` /
`sdv.mlb` / `sdv.recruiting`) are unchanged; only the method prefixes were renamed:

- `foxBifrost*` → `fox*` (e.g. `foxBifrostScoreboard` → `foxScoreboard`)
- `cbsNapi*` → `cbs*`
- `yahooShangrila*` → `yahoo*`, `yahooEditorial*` → `yahooScores*`
- `mlbApi*` → `mlb*` (e.g. `mlbApiSchedule` → `mlbSchedule`)
- `sports247*` → `recruiting*` (matches the `sdv.recruiting` namespace; the
  "247Sports" label is kept — it's the real product)

The same rename flows through the codegen `api` stems, returns-schema paths,
parser names, playground endpoint ids, and reference docs. Upstream URL paths
that genuinely contain the vendor codename (Fox's `/bifrost/v1/…`, Yahoo's
`/v1/query/shangrila/…`) are unchanged — those are the real endpoints.
(`odds_api` / `mlb_statcast` / the four `nhl_*` families /
`hockeytech` / `torvik` are real product names and were left as-is.)


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

## v3.1.0

A minor, additive release: two new flat-API families (no breaking changes), plus
the docs-site overhaul.


### New flat-API families (2)

Two standalone provider namespaces join the flat-API surface, bringing the total
to **532 flat-API wrappers across 15 families** (was 517 across 13). Both expose
the usual dual-case names (snake_case + camelCase), accept `{ parsed: true }` for
tidy rows, and ship fully column-described returns tables.

- **HockeyTech / LeagueStat** (`sdv.hockeytech.*`, 10 endpoints) — a
  **league-parameterized** women's + junior hockey family covering the **PWHL**
  plus the CHL juniors (**AHL / OHL / WHL / QMJHL**); pick the league with a
  `league` slug (e.g. `sdv.hockeytech.hockeytech_schedule({ league: 'pwhl' })`).
  Endpoints: `seasons`, `schedule`, `teams`, `team_roster`, `player_stats`,
  `game_shifts`, `standings`, `leaders`, `pbp`, `game_summary`. Hosts:
  `lscluster.hockeytech.com` (and `cluster.leaguestat.com` for QMJHL). The
  `src/core/hockeytech_runtime.ts` getter unwraps the JSONP envelope
  (`angular.callbacks._N({…})`) before `JSON.parse`, switches the `gc` feed to its
  `tab=` form (not `view=`), applies the PWHL play-by-play key override, and
  injects each league's `client_code` / `key` / `site_id` from a per-league
  registry (overridable via `SDV_<LEAGUE>_API_KEY`). Ported from `fastRhockey`'s
  `hockeytech_*` and `sportsdataverse-py`'s `sportsdataverse/hockeytech/`.
- **BartTorvik / T-Rank** (`sdv.torvik.*`, 5 endpoints) — men's college-basketball
  advanced analytics (`ratings`, `team_factors`, `game_stats`, `player_stats`,
  `game_schedule`) from `barttorvik.com`. The `src/core/torvik_runtime.ts` getter
  sends a browser-like User-Agent (barttorvik rejects default programmatic UAs)
  and returns the raw response body so each parser can branch on format — CSV via
  papaparse, or `JSON.parse` of the **headerless positional column arrays**
  (31 / 55 / 67 fields, ported verbatim from `hoopR`'s `torvik_*.R`).

A flat family that needs non-JSON bodies or custom request shaping registers its
own getter runtime in `GETTER_OVERRIDES` (`src/leagues/_make_flat.ts`) — the same
pattern as the existing Statcast getter — so the shared no-auth getter stays
JSON-only.

> **Playground caveat.** QMJHL's secondary host (`cluster.leaguestat.com`) works
> from the **library**, but not from the in-browser **playground**: the `/api/run`
> proxy allowlist derives a single host per family, so QMJHL calls there hit the
> primary host. Use the library directly for QMJHL.


### Docs

A docs-site overhaul that makes the guides literate and the navigation
data-driven:

- **Sport-grouped reference sidebar.** ESPN league reference docs are now nested
  under a collapsible category named for their sport (plus a Providers group),
  emitted by codegen into `docs/src/generated/reference-sidebar.js` and consumed
  by `docs/sidebars.js`. It's drift-guarded (`npm run codegen:check`) and regroups
  automatically from `leagues.yaml` — the reference pages stay flat (no URL change).
- **Nav/footer + sidebar Playground link.** Docs / News / Tutorials / Playground
  appear in both the navbar and the footer, and a 🛝 Playground link sits near the
  top of the docs sidebar.
- **Data-driven homepage.** `docs/src/pages/index.js` maps over the generated
  `endpoints.json` (leagues by sport + provider families), so adding a
  sport/provider updates the home page on `npm run codegen` — no bespoke edit.
- **Embeddable live RunCell guides.** `<RunCell>` is a compact single-endpoint
  live runner droppable inline in any `.mdx` guide: editable params → resolved URL
  → Run (via the `/api/run` proxy) → raw JSON or a parsed table. It handles every
  flat family, the `summary` section selector, enum dropdowns, and non-JSON
  Statcast CSV, and is SSR-safe.
- **Build-time output injector.** `tools/docs/inject-outputs.mjs` (+ the manifest
  `tools/docs/examples.mjs`) freezes real parsed tables into guides between
  `<!-- inject:example:ID -->` markers — deterministic (fixture-driven, no network).
  `npm run docs:examples` writes them; `npm run docs:examples:check` is a CI drift
  gate.

## v3.0.0

A major release that turns `sportsdataverse` into a **cross-league ESPN client**
**plus a native (non-ESPN) live-API client** with a tidy parser layer.


### ESPN cross-league surface

- **116 endpoint wrappers** generated for **29 leagues** (31 namespaces) from a
  single YAML source of truth — every league exposes the same
  `espn_<league>_<short>` methods (e.g. `sdv.nba.espn_nba_scoreboard()`,
  `sdv.soccer.espn_soccer_scoreboard({ league: 'eng.1' })`). Soccer, cricket, and
  the UFL join the existing NBA/NFL/NHL/MLB/WNBA/MBB/WBB/CFB set.


### Native API integration (255 flat wrappers across 7 families)

Beyond ESPN, the package now wraps the major leagues' own live APIs, merged onto
the matching league namespace:

- **MLB Stats API** (`statsapi.mlb.com`) — `sdv.mlb.mlb*` (e.g. `mlbSchedule`).
- **Baseball Savant / Statcast** (`baseballsavant.mlb.com`) — `sdv.mlb.mlbStatcast*`,
  including date-chunked Statcast search; heterogeneous CSV/JSON/HTML responses are
  handled by a content-type-aware getter.
- **NHL** — api-web game feed + EDGE player tracking (`api-web.nhle.com`),
  Stats REST (`api.nhle.com/stats/rest`), and Records (`records.nhl.com`):
  `sdv.nhl.nhlApiWeb*` / `nhlEdge*` / `nhlStatsRest*` / `nhlRecords*`.
- **NFL.com "Shield" API** (`api.nfl.com`) — `sdv.nfl.nflApi*`, with automatic
  anonymous `WEB_DESKTOP` bearer-token minting (cached + auto-renewed; no
  credentials required).


### Provider families (5 cross-sport, standalone namespaces)

Beyond ESPN + the league-native APIs, v3.0.0 adds **five independent provider
families**, each generated from a canonical OpenAPI spec (the `sdv-swagger`
collection) via a new reusable **OpenAPI 3.x → endpoint-YAML transform**
(`tools/codegen/from-openapi.mjs`, with path / query / `$ref` param resolution +
auth detection). Each cross-sport family gets its own standalone `sdv.<ns>.*`
namespace and its own generated reference page; pass `{ parsed: true }` for tidy
rows. The transform makes adding the next provider largely mechanical.

- **The Odds API** (`sdv.odds.*`, 10 endpoints) — betting odds / scores / events
  across sports. `apiKey` is a plain query param you supply. Ported from
  [`oddsapiR`](https://oddsapiR.sportsdataverse.org); odds / event / history
  parsers unroll events → bookmakers → markets → outcomes to one row per outcome.
- **247Sports** (`sdv.recruiting.*`, 25 endpoints) — recruiting rankings /
  commits / profiles (caller-supplied JWT via `headers`). Supersedes the legacy
  `getPlayerRankings`-style service methods (kept for back-compat).
- **CBS Sports** (`sdv.cbs.*`, 82 endpoints) — the public NAPI (scores /
  standings / teams / odds across sports), keyless.
- **Fox Sports** (`sdv.fox.*`, 38 endpoints) — the Bifrost API (`{sport}` path
  param across 11 sports); a public `apikey` + `api-version` query pair, defaulted.
- **Yahoo Sports** (`sdv.yahoo.*`, 107 endpoints) — the editorial scoreboard /
  boxscore feed + the shangrila stats-graph API; keyless (needs browser-y
  `Origin` / `Referer` headers).

In total: **517 flat-API wrappers across 13 families** (the 7 native + 5 provider
+ Statcast).


### tidy.js parser layer

- Every native wrapper returns the raw response by default; pass `{ parsed: true }`
  to run the payload through a registered parser that flattens it to a tidy array
  of row objects via a shared in-house `normalize` helper (a `json_normalize`
  equivalent). Strictly additive — omitting `parsed` is the unchanged raw-response
  behavior, matching `sportsdataverse-py`'s `return_parsed=True`.
- The [`@tidyjs/tidy`](https://github.com/pbeshai/tidy) toolkit is re-exported
  (`import { tidy } from 'sportsdataverse'`) so the parsed tidy arrays compose
  directly with grammar-of-data-manipulation verbs (`groupBy`, `summarize`, …).
- **ESPN parsed dispatch.** The cross-league ESPN wrappers now accept the same
  `{ parsed: true }` flag — a faithful port of `sportsdataverse-py`'s
  `_common_espn_parsers` (22 parsers: scoreboard / standings / rosters / leaders /
  athlete deep-dives / the 21-sub-frame `summary` dispatcher, plus two generics
  for the Core v2 list + single-resource long tail). All **116** ESPN endpoints
  route through these parsers; `summary` additionally honours a `section` arg
  (`{ parsed: true, section: 'boxscore_team' }`). Omitting `parsed` is the
  unchanged raw-`Dict` behavior.


### Dual-case naming

- Every generated wrapper (ESPN and native) is exposed under BOTH its snake_case
  name (`mlb_teams`, py/R parity) and its camelCase canonical name
  (`mlbTeams`, idiomatic JS) — the same function under either name.


### Docs + playground

- Generated reference pages now include a **Native API — `<family>`** section per
  league (host, path, params, parser, auth gate).
- A shared **ESPN parsed returns** reference page documents the `col_name | type |
  description` columns each of the 22 ESPN parsers produces (the 116 endpoints
  share them, so they're documented once by parser rather than repeated per
  endpoint), with every league page linking to it.
- The live [playground](https://js.sportsdataverse.org/playground) groups native
  endpoints under their league by family and runs them through a flat-aware
  serverless proxy — host-allowlisted (derived from the generated metadata), with
  server-side token minting for NFL.com and content-type passthrough for Statcast
  CSV/HTML so credentials never reach the browser and non-JSON bodies display raw.
  It now also has a **Raw/Parsed toggle** (tidy rows render as a sortable table —
  with a section selector for the 21-sub-frame `summary` dispatcher),
  **deep-linkable URLs** (every call is shareable), and an **Examples menu** of
  curated presets across ESPN, the native APIs, and all 5 providers. The provider
  families each appear under their standalone namespace.
- **Getting-started guides** (`/docs/guides/`) — per-area recipe pages (quickstart,
  NBA/WNBA/college-basketball/NFL/MLB/NHL/CFB/soccer, providers) with runnable
  raw-vs-parsed snippets, "Open in playground" deep-links, and embedded **RunKit**
  live notebooks.


### Tooling / housekeeping

- **Migrated to TypeScript.** Authored in TypeScript; ships `.d.ts` declarations
  alongside the ESM build.
- **ESM-only, Node ≥ 20.18.1.** `cheerio` 1.2 (via `undici` 7) sets the floor.
- **Codegen + drift gate.** `npm run codegen` regenerates the wrapper tables
  (ESPN + flat) and docs from `tools/codegen/endpoints/*.yaml`;
  `npm run codegen:check` fails CI if the committed output is stale.
- **Legacy methods preserved.** Every pre-3.0 method (`sdv.nba.getPlayByPlay(id)`,
  etc.) still works — the generated wrappers are merged *alongside* them.

## v2.0.0

- Major version bump to 2.0.0.
- Convert to ESM (fixes the `tabletojson` import error).
- Update dependency versions.
- Remove broken functions due to API 404s so all tests pass (mbb `getRankings`,
  wbb `getRankings`, ncaa `getTeamStats` / `getScoringSummary`).

## v1.2.5

- NFL `getWeeklySchedule` function added by @unmonk.

## v1.2.4

- MLB functionality added by @unmonk.

## v1.2.0–1.2.2

- Updated standings functions to provide league-wide, conference, and division
  splits for each applicable sport from ESPN.

## v1.1.0

Breaking changes:

- Submodules simplified/removed — all functions are now `{sport-league}.getXXX`
  (e.g. `cfb.getTeamList()` instead of `cfbTeams.getTeamList()`).
- Support for statistics from stats.ncaa.com added.
- Documentation website created.

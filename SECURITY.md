# Security

## Reporting a vulnerability

Please report it privately: use the **Report a vulnerability** button on this
repository's **Security** tab. If that button is not shown, open a regular issue
asking for a private contact and include **no** vulnerability details in it.

## Supported versions

Only the latest release line (currently 3.x) receives security fixes.

## What ships

The npm package ships `dist/` only (`"files": ["dist"]`). Its runtime
dependencies are the `dependencies` block of the root `package.json`: `axios`,
`hyparquet`, `hyparquet-compressors`, `@tidyjs/tidy`, `papaparse`, and the
HTML-scraping deps `cheerio`, `tabletojson`, and `decode-html` (see below). Root
`devDependencies` and everything under `docs/` (its own
`docs/package-lock.json`) are build, test, or docs-site tooling and never reach
a library user. The deployed docs site is static HTML plus the
`docs/api/run.mjs` playground proxy, which uses the global `fetch` and local
modules only; it imports no npm package.

The root `overrides` (`js-yaml`, `serialize-javascript`, `diff`) are all
dev-only: each pins a transitive dependency of `mocha`.

Policy: a HIGH advisory on a runtime dependency is fixed (upgrade or
`overrides`), never accepted, unless no fixed version exists. Dev and docs
advisories are fixed when a fix exists and otherwise listed below with the
reason they are not reachable.

### `undici` (transitive, via `cheerio`)

`undici` comes in through `cheerio` (`^7.19.0`). The lockfile pins a patched
release, but that pin does not travel with the package: a consumer's install
resolves cheerio's `^7.19.0` itself. sdv-js never sends a request through
`undici`: it only calls `cheerio.load` on HTML that `axios` already fetched, and
the KenPom parser imports `cheerio/slim`, which does not load `undici` at all.

## Accepted advisories (no fixed version exists)

### `braces`: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) (high)

- **Issue:** stack-exhaustion DoS through deeply nested brace patterns.
- **Installed:** `braces` 3.0.3, the latest release; every published version is
  in the vulnerable range, so there is nothing to upgrade or override to.
- **Lockfile:** `docs/package-lock.json` only. The root package does not depend
  on it.
- **Path:** `@docusaurus/core` → `chokidar@3` → `braces`, and
  `@docusaurus/utils` → `micromatch` / `globby` / `fast-glob` → `braces`.
- **Why it is not reachable:** GHSA-vfj7-8cjw-p6xm is triggered by the glob
  PATTERN that `braces` expands, not by the paths being matched, and only a
  committer can supply a pattern here (`docusaurus.config.js` and Docusaurus
  plugin defaults), at docs build or dev-server time only. No site visitor or
  library user can supply one. `braces` is not in the npm tarball, the browser
  bundle, or the playground proxy.
- `npm audit` in `docs/` reports 28 high entries. Every one is this single
  advisory propagated up the `@docusaurus/*` dependency chain.

Revisit when `braces` publishes a fixed release or Docusaurus stops depending on
`chokidar@3` / `micromatch`.

## HTML / CSV parsing dependencies

All four are reachable from the public API, so removing any of them is a
breaking change.

- `cheerio` **stays.** The live KenPom parser `parse_kenpom_page`
  (`src/parsers/kenpom.ts`, exported from the package root and from
  `sportsdataverse/parsers`) uses `cheerio/slim`. The legacy services use the
  full `cheerio` entry: `sdv.cfb` / `sdv.mbb` `getPlayerRankings`,
  `getSchoolRankings`, `getSchoolCommits` (247Sports HTML) and the deprecated
  `sdv.ncaa` `getSports`, `getSeasons`, `getDivisions`, `getSportDivisionData`.
  Those services could move to `cheerio/slim` to keep `undici` out of loaded
  code. Note that `slim` parses with `htmlparser2`, not `parse5`, so their
  output would need re-checking against real pages.
- `papaparse` **stays.** It backs the `parse_torvik_*` parsers and the Statcast
  CSV parsers (`parse_mlb_statcast_search`, `parse_mlb_statcast_leaderboard`).
- `decode-html`: only `sdv.ncaa.extractSelectList`, used by the deprecated
  `sdv.ncaa` `getSports`, `getSeasons`, `getDivisions`, `getSportDivisionData`.
- `tabletojson`: only the deprecated `sdv.ncaa.getPlayerData` and
  `sdv.ncaa.getTeamData`.

`tabletojson` and `decode-html` are the only removal candidates. They can be
dropped (BREAKING, in a major release) when the deprecated `sdv.ncaa` methods
are removed.

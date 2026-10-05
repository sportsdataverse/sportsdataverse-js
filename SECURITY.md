# Security notes

## What ships

The npm package ships `dist/` only (`"files": ["dist"]`). Its runtime
dependencies are the `dependencies` block of the root `package.json`: `axios`,
`hyparquet`, `hyparquet-compressors`, `@tidyjs/tidy`, `papaparse`, and the four
legacy scraping deps below. Root `devDependencies` and everything under `docs/`
(its own `docs/package-lock.json`) are build, test, or docs-site tooling and
never reach a library user. The deployed docs site is static HTML plus the
`docs/api/run.mjs` playground proxy, which uses the global `fetch` and local
modules only; it imports no npm package.

Policy: a HIGH advisory on a runtime dependency is fixed (upgrade or
`overrides`), never accepted, unless no fixed version exists. Dev and docs
advisories are fixed when a fix exists and otherwise listed below with the
reason they are not reachable.

## Accepted advisories (no fixed version exists)

### `braces`: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) (high)

- **Issue:** stack-exhaustion DoS through deeply nested brace patterns.
- **Installed:** `braces` 3.0.3, the latest release; every published version is
  in the vulnerable range, so there is nothing to upgrade or override to.
- **Lockfile:** `docs/package-lock.json` only. The root package does not depend
  on it.
- **Path:** `@docusaurus/core` → `chokidar@3` → `braces`, and
  `@docusaurus/utils` → `micromatch` / `globby` / `fast-glob` → `braces`.
- **Why it is not reachable:** it runs during the docs build and dev server only.
  `braces` expands glob patterns written in `docusaurus.config.js` and in
  Docusaurus plugin source, never input from a site visitor or a library user.
  It is not in the npm tarball, the browser bundle, or the playground proxy.
- `npm audit` in `docs/` reports 28 high entries. Every one is this single
  advisory propagated up the `@docusaurus/*` dependency chain.

Revisit when `braces` publishes a fixed release or Docusaurus stops depending on
`chokidar@3` / `micromatch`.

## Legacy scraping dependencies (kept)

`cheerio`, `tabletojson`, and `decode-html` are used only by the legacy
hand-written services in `src/services/`, and `papaparse` by the `torvik` and
`mlb_statcast` parsers. All four are reachable from the public API, so removing
any of them is a breaking change:

- `cheerio`: `sdv.cfb` / `sdv.mbb` `getPlayerRankings`, `getSchoolRankings`,
  `getSchoolCommits` (247Sports HTML), and the deprecated `sdv.ncaa`
  `getSports`, `getSeasons`, `getDivisions`, `getSportDivisionData`.
- `decode-html`: `sdv.ncaa` select-list helpers (same methods).
- `tabletojson`: deprecated `sdv.ncaa.getPlayerData`, `sdv.ncaa.getTeamData`.
- `papaparse`: the `parse_torvik_*` parsers and the Statcast CSV parsers
  (`parse_mlb_statcast_search`, `parse_mlb_statcast_leaderboard`).

They can be dropped (BREAKING, in a major release) when the legacy 247Sports and
`sdv.ncaa` methods are removed.

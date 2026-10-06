# Runnable examples

One script per topic, `NN_<topic>.mjs`. Each prints one to three small tables and
runs **offline by default** against the captured fixtures under `test/fixtures/`
(`_offline.mjs` installs a `configure({ transport })` that serves them by URL;
an unrouted URL throws so nothing silently returns `{}`). Set `SDV_LIVE=1` to hit
the real hosts instead. Every script is also a docs tutorial
(`docs/docs/tutorials/`) whose output + source the injector freezes
(`npm run docs:examples`).

```sh
cd examples
node --import ./_resolve.mjs 01_nba_scoreboard_to_table.mjs            # offline, no install needed
SDV_LIVE=1 node --import ./_resolve.mjs 01_nba_scoreboard_to_table.mjs # live
```

`_resolve.mjs` is a preload that resolves `import sdv from 'sportsdataverse'` to
this repo's `dist/` (run `npm run build` at the root first), so the scripts stay
copy-pasteable and need no install here. `npm install` in this directory
(`package.json` links the package with `file:..`) is an optional convenience for
plain `node NN_*.mjs`.

| Script | Sources |
| --- | --- |
| `01_nba_scoreboard_to_table.mjs` | ESPN site v2 scoreboard |
| `02_nba_pbp_shots.mjs` | ESPN site v2 summary (plays, the measured shot-coordinate frame) |
| `03_wnba_standings.mjs` | ESPN v2 standings |
| `04_nfl_schedule_and_standings.mjs` | ESPN site v2 scoreboard + v2 standings, joined on `team_id` |
| `05_cfb_rankings_and_pbp.mjs` | ESPN CDN rankings + playbyplay (drives / drive_plays / scoring_plays) |
| `06_college_basketball_torvik_and_espn.mjs` | BartTorvik CSV + ESPN summary box scores |
| `07_mlb_statcast_and_stats_api.mjs` | Baseball Savant CSV leaderboard + MLB Stats API |
| `08_nhl_api_web_and_edge.mjs` | NHL api-web standings / play-by-play + EDGE landing |
| `09_hockeytech_pwhl_corsi.mjs` | HockeyTech (PWHL) pbp, shifts, Corsi analytics |
| `10_soccer_cross_league.mjs` | ESPN soccer with the `league` param + CDN scoreboard |
| `11_providers_odds_math.mjs` | The Odds API historical snapshot + `sdv.odds` market math |
| `12_release_loaders.mjs` | GitHub-release parquet loaders (`load*`, the string-id rule) |
| `13_discover_and_utilities.mjs` | `listFunctions` / `findTeam` / `sportsdataverse/parsers` |
| `90_sdvplot_shot_chart.mjs` | ESPN plays → sporty court → SVG (needs sdvplot-js, below) |
| `91_sdvplot_standings_colors.mjs` | ESPN standings → bar chart in team colours (sdvplot-js) |
| `92_sdvplot_roster_table.mjs` | ESPN roster → HTML table with headshots + logo (sdvplot-js) |

`test/examples.test.js` runs every script offline (exit 0 + at least one table).

## The `9x` scripts need sdvplot-js (unpublished)

`@sportsdataverse/sdvplot` (team colours, logo + headshot URLs) and
`@sportsdataverse/sporty` (sport surfaces, SVG) are **not on npm yet**. They live
in <https://github.com/sportsdataverse/sdvplot-js>. `_resolve.mjs` resolves them
from a built checkout at `$SDVPLOT_JS_DIR` (default: `../../sdvplot-js` relative
to this repo's root, i.e. a sibling clone). To set it up:

```sh
git clone https://github.com/sportsdataverse/sdvplot-js ../../sdvplot-js   # from the repo root
cd ../../sdvplot-js && pnpm install
cd packages/sporty  && npx tsup          # the root `pnpm build` filter can be a no-op on Windows
cd ../sdvplot       && npx tsup
cd <this repo>/examples
node --import ./_resolve.mjs 90_sdvplot_shot_chart.mjs   # writes out/shot_chart.svg
SDVPLOT_JS_DIR=/path/to/sdvplot-js node --import ./_resolve.mjs 90_sdvplot_shot_chart.mjs  # elsewhere
```

Give `SDVPLOT_JS_DIR` an **absolute** path when going through `npm run docs:examples` or
`npm test`: a relative one resolves against each spawned script's cwd (`examples/`), the
preload then finds no dist and the three scripts are skipped (the injector keeps their
committed output, so the gate stays green on a stale page). CI never sets it — after
changing a `9x_*` script or its tutorial, run the injector with it set and commit the result.

```sh
```

Without that build, a `9x` script prints `skipped: build sdvplot-js first` and
exits 0: `test/examples.test.js` skips it and the docs injector keeps the
committed output for its tutorial. Colours and URLs come from sdvplot's bundled
index, so the `9x` scripts are offline too (the logo / headshot values are URL
strings; nothing is fetched).

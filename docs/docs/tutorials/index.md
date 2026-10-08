---
title: Tutorials
sidebar_label: All tutorials
sidebar_position: 0
sidebar_class_name: sidebar-category-index
description: Guided, runnable walkthroughs — each one is a script in examples/ whose output is frozen into the page from committed fixtures.
---

# Tutorials

Every tutorial below is a real script in the repo's
[`examples/`](https://github.com/sportsdataverse/sportsdataverse-js/tree/main/examples)
directory. The page shows what you will build, which upstream sources the script
hits, the full script, and its output. The output is not typed in: the docs
build runs each script **offline against committed fixtures** (captured
responses under `test/fixtures/`) and injects what it printed, so the tables
you see are the tables the code produces, and a parser change that alters them
fails CI until the page is regenerated.

To run one yourself:

```sh
git clone https://github.com/sportsdataverse/sportsdataverse-js && cd sportsdataverse-js
npm ci && npm run build
cd examples && npm install
node 01_nba_scoreboard_to_table.mjs            # offline, same output as the page
SDV_LIVE=1 node 01_nba_scoreboard_to_table.mjs # the real hosts
```

New here? Start with the [Quickstart](../guides/quickstart) guide (install, first raw and parsed calls); every tutorial below assumes it.

| # | Tutorial | Script | Sources used |
| --- | --- | --- | --- |
| 1 | [The cross-league surface](./cross-league) | `13_discover_and_utilities.mjs` | ESPN teams (site.api.espn.com), the package's own index |
| 2 | [From scoreboard to a table](./scoreboard-to-table) | `01_nba_scoreboard_to_table.mjs` | ESPN NBA scoreboard (site.api.espn.com) |
| 3 | [NBA play-by-play shots](./nba-pbp-shots) | `02_nba_pbp_shots.mjs` | ESPN NBA summary (site.api.espn.com) |
| 4 | [WNBA standings](./wnba-standings) | `03_wnba_standings.mjs` | ESPN WNBA standings (site.api.espn.com) |
| 5 | [NFL schedule and standings](./nfl-schedule-standings) | `04_nfl_schedule_and_standings.mjs` | ESPN NFL scoreboard + standings (site.api.espn.com) |
| 6 | [College football rankings and drives](./cfb-rankings-pbp) | `05_cfb_rankings_and_pbp.mjs` | ESPN CDN rankings + playbyplay (cdn.espn.com) |
| 7 | [College basketball: T-Rank and box scores](./college-basketball-torvik) | `06_college_basketball_torvik_and_espn.mjs` | BartTorvik (barttorvik.com), ESPN MBB summary (site.api.espn.com) |
| 8 | [MLB: Statcast and the Stats API](./mlb-statcast-stats-api) | `07_mlb_statcast_and_stats_api.mjs` | Baseball Savant (baseballsavant.mlb.com), MLB Stats API (statsapi.mlb.com) |
| 9 | [NHL: api-web and EDGE](./nhl-api-web-edge) | `08_nhl_api_web_and_edge.mjs` | NHL api-web + EDGE (api-web.nhle.com) |
| 10 | [PWHL Corsi from HockeyTech](./pwhl-hockeytech-corsi) | `09_hockeytech_pwhl_corsi.mjs` | HockeyTech / LeagueStat (lscluster.hockeytech.com) |
| 11 | [Soccer across leagues](./soccer-cross-league) | `10_soccer_cross_league.mjs` | ESPN soccer standings (site.api.espn.com), ESPN CDN scoreboard (cdn.espn.com) |
| 12 | [The Odds API and market math](./odds-api-math) | `11_providers_odds_math.mjs` | The Odds API (api.the-odds-api.com) |
| 13 | [Release-dataset loaders](./release-loaders) | `12_release_loaders.mjs` | GitHub Releases (github.com/sportsdataverse/sportsdataverse-data) |
| 14 | [Shot chart with sdvplot + sporty](./sdvplot-shot-chart) | `90_sdvplot_shot_chart.mjs` | ESPN NBA summary (site.api.espn.com); `@sportsdataverse/sporty`, `@sportsdataverse/sdvplot` |
| 15 | [Standings bars in team colours](./sdvplot-standings-colors) | `91_sdvplot_standings_colors.mjs` | ESPN WNBA standings (site.api.espn.com); `@sportsdataverse/sdvplot` |
| 16 | [Roster table with headshots](./sdvplot-roster-table) | `92_sdvplot_roster_table.mjs` | ESPN NBA roster (site.api.espn.com); `@sportsdataverse/sdvplot` |

Tutorials 14–16 use [sdvplot-js](https://github.com/sportsdataverse/sdvplot-js),
which is not published to npm yet; see [the shot chart page](./sdvplot-shot-chart)
for how to build and link it.

### Automations

Scripts that run on a schedule in GitHub Actions and produce a PNG, each with a
workflow template under `examples/workflows/`. The images on these pages come
from live runs, not the offline fixtures.

| Tutorial | Script | Sources used |
| --- | --- | --- |
| [Nightly scores card, posted by a GitHub Action](./sdvplot-scores-card) | `93_scores_card_action.mjs` | ESPN scoreboard (site.api.espn.com); `@sportsdataverse/sdvplot` + `/export` |
| [Weekly power-rankings ladder, posted by a GitHub Action](./sdvplot-rankings-ladder) | `95_rankings_ladder_action.mjs` | ESPN CDN rankings (cdn.espn.com); `@sportsdataverse/sdvplot` + `/export` |

---
title: Dataset loaders
sidebar_label: Dataset loaders
sidebar_position: 50
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))

:::


# `sdv.mlb` — dataset loaders

32 loaders reading the published sportsdataverse-data releases (parquet) — the JS mirror of sportsdataverse-py's `load_*` functions. Each is a camelCase export plus its snake_case alias and resolves to an array of plain row objects (or `{ [column]: values[] }` with `format: "columns"`).

- **Size:** row objects cost ~60-100 bytes per cell on the heap, so before decoding each season a loader adds its rows × columns (from the parquet footer) to a running total and checks it against `maxCells` — by default heap limit / 100 for rows (≈45M cells on Node's default 4 GB heap) and heap limit / 30 for `format: "columns"` — and throws a catchable `SdvError` instead of running out of memory. Play-by-play is the usual case: pass `columns`, use `format: "columns"`, or raise the heap (`node --max-old-space-size=8192`).
- **Seasons:** `seasons` takes one season or a list. A season with no published asset (HTTP 404) is skipped with a warning (loaders marked so in their `seasons` row — sdv-py's hand-written ones — throw `NoDataError` instead); any other failure raises `AssetFetchError` (a failed download is never an empty season); a season below the loader's floor raises `SeasonNotFoundError` before anything is fetched. Multi-season results union the columns, null-filling gaps, and cast a column whose type changed between seasons to the common type (an integer id that became a string → strings, "123" not "123.0"), as sdv-py's `diagonal_relaxed` concat does.
- **Integers:** an id column (`id`, `*_id`, `*_ids`, `game_pk`, `athlete_id_1`, `id_play`, `playerId`, `homeTeamId`, `start.team.id`, …) of integers comes back as exact decimal strings in every row and every season, whatever width the release stores it with (INT32, INT64, or a DOUBLE holding integers: `"401628579101849903"`, `"39"`, never `"39.0"`), so ids join across seasons and across releases. Code-like id columns (`type_id`, `status_id`, …) are strings too. An id column that is not exact integers (a fraction, a DOUBLE past 2^53) is left as read with one warning. Any other INT64 column comes back as `number` when every value is a safe integer, otherwise as `BigInt` with one warning (code `SDV_INT64`) per column per process.
- **Runtime:** Node only. Downloads go through the `releases` transport family (see [Transport, auth & errors](../../guides/transport-and-auth.md)); each asset is downloaded whole, then decoded.

| Loader | Release | Seasons |
|---|---|---|
| [`loadMlbRe24Matrix`](#loadmlbre24matrix) | [mlb_game_state](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_game_state) | 2015+ |
| [`loadMlbWeTable`](#loadmlbwetable) | [mlb_game_state](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_game_state) | 2015+ |
| [`loadMlbWpa`](#loadmlbwpa) | [mlb_game_state](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_game_state) | 2015+ |
| [`loadMlbPbp`](#loadmlbpbp) | [mlb_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_pbp) | 1988+ |
| [`loadMlbPitches`](#loadmlbpitches) | [mlb_pitches](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_pitches) | 1988+ |
| [`loadMlbRunners`](#loadmlbrunners) | [mlb_runners](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_runners) | 1988+ |
| [`loadMlbExpectedStats`](#loadmlbexpectedstats) | [mlb_hitting_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_hitting_models) | 2015+ |
| [`loadMlbExpectedHr`](#loadmlbexpectedhr) | [mlb_hitting_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_hitting_models) | 2015+ |
| [`loadMlbBatterProjection`](#loadmlbbatterprojection) | [mlb_hitting_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_hitting_models) | 2016+ |
| [`loadMlbOaa`](#loadmlboaa) | [mlb_fielding_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_fielding_models) | 2015+ |
| [`loadMlbCatcherFraming`](#loadmlbcatcherframing) | [mlb_fielding_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_fielding_models) | 2015+ |
| [`loadMlbXera`](#loadmlbxera) | [mlb_pitching_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_pitching_models) | 2015+ |
| [`loadMlbStuffPlus`](#loadmlbstuffplus) | [mlb_pitching_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_pitching_models) | 2015+ |
| [`loadMlbCommandPlus`](#loadmlbcommandplus) | [mlb_pitching_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_pitching_models) | 2015+ |
| [`loadNcaaBaseballPbp`](#loadncaabaseballpbp) | [ncaa_baseball_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_pbp) | 2017+ |
| [`loadNcaaBaseballSchedule`](#loadncaabaseballschedule) | [ncaa_baseball_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_schedules) | 2012+ |
| [`loadNcaaBaseballTeams`](#loadncaabaseballteams) | [ncaa_baseball_teams](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_teams) | 2024+ |
| [`loadNcaaBaseballRosters`](#loadncaabaseballrosters) | [ncaa_baseball_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_rosters) | 2024+ |
| [`loadNcaaBaseballLinescore`](#loadncaabaseballlinescore) | [ncaa_baseball_linescore](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_linescore) | 2024+ |
| [`loadNcaaBaseballTeamStats`](#loadncaabaseballteamstats) | [ncaa_baseball_team_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_team_stats) | 2024+ |
| [`loadNcaaBaseballPlayerStats`](#loadncaabaseballplayerstats) | [ncaa_baseball_player_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_player_stats) | 2024+ |
| [`loadNcaaBaseballSituationalStats`](#loadncaabaseballsituationalstats) | [ncaa_baseball_situational_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_situational_stats) | 2024+ |
| [`loadNcaaBaseballGames`](#loadncaabaseballgames) | [ncaa_baseball_games](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_games) | 2017+ |
| [`loadMlbGroups`](#loadmlbgroups) | [mlb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_groups) | one asset |
| [`loadMlbGroupSeasons`](#loadmlbgroupseasons) | [mlb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_groups) | one asset |
| [`loadMlbGroupAliases`](#loadmlbgroupaliases) | [mlb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_groups) | one asset |
| [`loadMlbTeamGroupSeasons`](#loadmlbteamgroupseasons) | [mlb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_groups) | 1901+ |
| [`loadNcaaBaseballGroups`](#loadncaabaseballgroups) | [ncaa_baseball_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_groups) | one asset |
| [`loadNcaaBaseballGroupSeasons`](#loadncaabaseballgroupseasons) | [ncaa_baseball_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_groups) | one asset |
| [`loadNcaaBaseballGroupAliases`](#loadncaabaseballgroupaliases) | [ncaa_baseball_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_groups) | one asset |
| [`loadNcaaBaseballTeamGroupSeasons`](#loadncaabaseballteamgroupseasons) | [ncaa_baseball_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_groups) | 2010+ |
| [`loadMlbParkDimensions`](#loadmlbparkdimensions) | [mlb_parks](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_parks) | one asset |

## `loadMlbRe24Matrix`

Release: [mlb_game_state](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_game_state) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_game_state/mlb_re24_matrix_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2015) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbRe24Matrix({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_re24_matrix(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbRe24MatrixRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `base_state` | `string` | Three-character pre-play base occupancy where each slot carries its base number when occupied and an underscore when empty, so ___ is bases empty and 123 is bases loaded. |
| `outs` | `number \| bigint` | Outs in the inning after the play. |
| `re` | `number` | Mean runs the batting team went on to score from this base-out state through the end of the half-inning, with bottom-of-the-9th-and-later halves excluded to avoid walk-off selection bias. |
| `n` | `number` | Plate appearances observed starting in this base-out state, the sample size behind re. |
| `season` | `number \| bigint` | Season year. |

## `loadMlbWeTable`

Release: [mlb_game_state](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_game_state) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_game_state/mlb_we_table_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2015) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbWeTable({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_we_table(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbWeTableRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `inning_capped` | `number \| bigint` | Inning number with the ninth and every extra inning collapsed into 9, so extras share the ninth-inning win-expectancy cells. |
| `half` | `string` |  |
| `base_state` | `string` | Three-character pre-play base occupancy where each slot carries its base number when occupied and an underscore when empty, so ___ is bases empty and 123 is bases loaded. |
| `outs_start` | `number \| bigint` | Outs already recorded when the plate appearance began, normally 0 through 2, though a handful of published rows carry a stale 3 that the RE24 matrix filters out but this table does not. |
| `score_diff_bucket` | `number \| bigint` | Home score minus away score before the play, clipped to the range -6 through +6 so blowouts collapse into the end buckets. |
| `home_win_exp` | `number` | Home team win expectancy before the play. |
| `n` | `number` | Plate appearances observed in this state bucket, the sample size behind the Laplace-smoothed home_win_exp. |
| `thin` | `boolean` | Whether the win-expectancy cell was estimated from a thin sample of historical games. |
| `season` | `number \| bigint` | Season year. |

## `loadMlbWpa`

Release: [mlb_game_state](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_game_state) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_game_state/mlb_wpa_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2015) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbWpa({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_wpa(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbWpaRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique ESPN game/event identifier. |
| `at_bat_index` | `number \| bigint` | Zero-based index of the at-bat within the game. |
| `wpa` | `number` |  |
| `season` | `number \| bigint` | Season year. |

## `loadMlbPbp`

Release: [mlb_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_pbp/mlb_pbp_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1988) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbPbp({ seasons: 2024, columns: ['game_pk', 'inning', 'event_type', 'description'] });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_pk` | `string` | statsapi game identifier; the join key to every other MLB release. |
| `at_bat_index` | `number \| bigint` | Zero-based index of the plate appearance within the game; joins to mlb_pitches and mlb_runners. |
| `inning` | `number \| bigint` | Inning number, counting from 1; extra innings continue the sequence. |
| `half_inning` | `string` | `top` or `bottom`. |
| `batter_id` | `string` | statsapi person id of the batter. |
| `pitcher_id` | `string` | statsapi person id of the pitcher. |
| `event_type` | `string` | Machine-readable plate-appearance outcome (e.g. `single`, `strikeout`, `field_out`). |
| `event` | `string` | Human-readable outcome of the plate appearance. |
| `description` | `string` | Narrative text for the plate appearance. |
| `rbi` | `number \| bigint` | Runs batted in credited to this plate appearance. |
| `away_score` | `number \| bigint` | Away score AFTER the plate appearance. |
| `home_score` | `number \| bigint` | Home score AFTER the plate appearance. |
| `is_scoring_play` | `boolean` | Whether the plate appearance scored a run. |
| `outs` | `number \| bigint` | Outs recorded after the plate appearance. |
| `start_time` | `string` | UTC timestamp when the plate appearance began; null in older seasons. |
| `end_time` | `string` | UTC timestamp when the plate appearance ended; null in older seasons. |
| `post_on_first_id` | `string` | Person id on first base after the plate appearance; null when unoccupied. |
| `post_on_second_id` | `string` | Person id on second base after the plate appearance; null when unoccupied. |
| `post_on_third_id` | `string` | Person id on third base after the plate appearance; null when unoccupied. |

## `loadMlbPitches`

Release: [mlb_pitches](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_pitches) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_pitches/mlb_pitches_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1988) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbPitches({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_pitches(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbPitchesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_pk` | `string` | statsapi game identifier; the join key to every other MLB release. |
| `at_bat_index` | `number \| bigint` | Zero-based index of the plate appearance within the game; joins to mlb_pbp and mlb_runners. |
| `pitch_number` | `number \| bigint` | One-based pitch number within the plate appearance. |
| `batter_id` | `string` | statsapi person id of the batter. |
| `pitcher_id` | `string` | statsapi person id of the pitcher. |
| `pitch_type` | `string` | Classified pitch-type code (FF, SL, CH, ...). statsapi `pitchData`, measured fill: ~0% before 2007, 45.7% in 2007 (mid-season PITCHf/x rollout across ballparks), 96.6% in 2008, ~100% from 2015. Null for pitches the system never tracked. |
| `pitch_name` | `string` | Human-readable pitch type. statsapi `pitchData`, measured fill: ~0% before 2007, 45.7% in 2007 (mid-season PITCHf/x rollout across ballparks), 96.6% in 2008, ~100% from 2015. Null for pitches the system never tracked. |
| `call_code` | `string` | Umpire call code (B, C, S, X, ...). |
| `call_description` | `string` | Human-readable umpire call. |
| `balls` | `number \| bigint` | Ball count BEFORE the pitch. |
| `strikes` | `number \| bigint` | Strike count BEFORE the pitch. |
| `outs` | `number \| bigint` | Outs BEFORE the pitch. |
| `start_speed` | `number` | Release speed in mph. statsapi `pitchData`, measured fill: ~0% before 2007, 45.7% in 2007 (mid-season PITCHf/x rollout across ballparks), 96.6% in 2008, ~100% from 2015. Null for pitches the system never tracked. |
| `end_speed` | `number` | Speed crossing the plate in mph. statsapi `pitchData`, measured fill: ~0% before 2007, 45.7% in 2007 (mid-season PITCHf/x rollout across ballparks), 96.6% in 2008, ~100% from 2015. Null for pitches the system never tracked. |
| `spin_rate` | `number` | Spin rate in rpm. statsapi `pitchData`, measured fill: ~0% before 2007, 45.7% in 2007 (mid-season PITCHf/x rollout across ballparks), 96.6% in 2008, ~100% from 2015. Null for pitches the system never tracked. |
| `extension` | `number` | Release extension toward the plate in feet. Later than the rest of `pitchData`: measured 0% through 2016 and ~100% from 2017, so it is null for the 2007-2016 PITCHf/x seasons that do carry speed and spin. |
| `px` | `number` | Horizontal location crossing the plate in feet from the plate's centre, catcher's view. statsapi `pitchData`, measured fill: ~0% before 2007, 45.7% in 2007 (mid-season PITCHf/x rollout across ballparks), 96.6% in 2008, ~100% from 2015. Null for pitches the system never tracked. |
| `pz` | `number` | Height crossing the plate in feet above the ground. statsapi `pitchData`, measured fill: ~0% before 2007, 45.7% in 2007 (mid-season PITCHf/x rollout across ballparks), 96.6% in 2008, ~100% from 2015. Null for pitches the system never tracked. |
| `sz_top` | `number` | Top of the batter's strike zone in feet. Derived from the batter, not `pitchData`, so it is populated back to 1988. |
| `sz_bot` | `number` | Bottom of the batter's strike zone in feet. Derived from the batter, not `pitchData`, so it is populated back to 1988. |
| `launch_speed` | `number` | Exit velocity off the bat in mph. statsapi `hitData`, Statcast-era and batted balls only: null before 2015 and ~17% populated after, which is the share of pitches put in play rather than a coverage gap. |
| `launch_angle` | `number` | Vertical launch angle in degrees. statsapi `hitData`, Statcast-era and batted balls only: null before 2015 and ~17% populated after, which is the share of pitches put in play rather than a coverage gap. |
| `total_distance` | `number` | Batted-ball distance travelled in feet. statsapi `hitData`, Statcast-era and batted balls only: null before 2015 and ~17% populated after, which is the share of pitches put in play rather than a coverage gap. |
| `trajectory` | `string` | Batted-ball trajectory (`ground_ball`, `line_drive`, `fly_ball`, `popup`). Legacy scorer field, batted balls only: ~20% populated in every season back to 1988, and present long before Statcast. |
| `hardness` | `string` | Scorer's contact-quality grade (`soft`, `medium`, `hard`). Legacy scorer field, batted balls only: ~20% populated in every season back to 1988, and present long before Statcast. |

## `loadMlbRunners`

Release: [mlb_runners](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_runners) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_runners/mlb_runners_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1988) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbRunners({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_runners(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbRunnersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_pk` | `string` | statsapi game identifier; the join key to every other MLB release. |
| `at_bat_index` | `number \| bigint` | Zero-based index of the plate appearance within the game; joins to mlb_pbp and mlb_pitches. |
| `runner_id` | `string` | statsapi person id of the baserunner. |
| `origin_base` | `string` | Base the runner occupied when the plate appearance began; null for the batter. |
| `start_base` | `string` | Base the runner started this movement from; null when the movement begins at the plate. |
| `end_base` | `string` | Base the runner finished on; null when retired or when scoring is recorded by `is_scoring_event`. |
| `out_base` | `string` | Base at which the runner was retired; null when not retired. |
| `is_out` | `boolean` | Whether the runner was retired on this movement. |
| `out_number` | `number \| bigint` | Which out of the half-inning this retirement was; null when not retired. |
| `event` | `string` | Human-readable event that caused the movement. |
| `event_type` | `string` | Machine-readable event that caused the movement. |
| `movement_reason` | `string` | statsapi reason code for a movement not caused by the plate appearance itself (e.g. `r_stolen_base_2b`). |
| `is_scoring_event` | `boolean` | Whether this movement scored a run. |
| `rbi` | `boolean` | Whether the run was credited as an RBI to the batter. |
| `earned` | `boolean` | Whether the run was earned against the responsible pitcher. |
| `responsible_pitcher_id` | `string` | statsapi person id of the pitcher charged with the runner. |

## `loadMlbExpectedStats`

Release: [mlb_hitting_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_hitting_models) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_hitting_models/mlb_expected_stats_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2015) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbExpectedStats({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_expected_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbExpectedStatsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `batter` | `string` | MLBAM player id of the batter. |
| `season` | `number \| bigint` | Season year. |
| `pa` | `number \| bigint` | Plate appearances for the batter in the season, counted as the Statcast rows that END a plate appearance (a non-empty events value). Pitches within a plate appearance are not counted. |
| `ab` | `number \| bigint` | At-bats, derived from the same plate-appearance-ending rows by excluding walks, hit-by-pitches, sacrifice flies, sacrifice bunts and catcher's interference. |
| `xwoba` | `number` | Expected wOBA blending the exit-velocity by launch-angle grid's predicted contact value on balls in play with realized wOBA value on walks, hit-by-pitches and strikeouts, over the wOBA denominator; low-sample batters can exceed 1. |
| `xba` | `number` | Grid-predicted hit probability summed over the at-bat balls in play that carry launch data, plus the realized hit for balls in play Statcast did not track, divided by at-bats, on the conventional batting-average scale. An untracked ball in play takes its realized outcome exactly as xwoba does, rather than counting in ab with a zero numerator, which deflated league-mean xBA by the untracked share. |
| `xslg` | `number` | The same construction on total bases -- grid-predicted total bases where launch data exists, realized total bases for untracked balls in play -- divided by at-bats, on the conventional slugging scale. |
| `woba` | `number` | Actual weighted on-base average (wOBA) for the player over the sample. |
| `ba` | `number` | Actual batting average for the player over the sample (0-1), alongside the expected-stat columns. |

## `loadMlbExpectedHr`

Release: [mlb_hitting_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_hitting_models) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_hitting_models/mlb_expected_hr_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2015) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbExpectedHr({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_expected_hr(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbExpectedHrRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `batter` | `string` | MLBAM player id of the batter. |
| `season` | `number \| bigint` | Season year. |
| `hr` | `number \| bigint` | Home runs hit by the batter over the covered sample. |
| `xhr_neutral` | `number` | Park-neutral expected home runs, summing over the batter's balls in play the home-run probability read off the exit-velocity by launch-angle by spray-angle grid. |
| `xhr_park_adj` | `number` | The same expected-home-run sum after scaling each ball by its ballpark's Savant home-run park factor over 100; published values run between 0.77 and 1.26 times xhr_neutral. |
| `hr_above_expected` | `number` | Home runs actually hit minus xhr_neutral, so it grades over- and under-performance against the park-neutral expectation rather than the park-adjusted one. |

## `loadMlbBatterProjection`

Release: [mlb_hitting_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_hitting_models) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_hitting_models/mlb_batter_projection_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2016) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbBatterProjection({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_batter_projection(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbBatterProjectionRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `batter` | `string` | MLBAM player id of the batter. |
| `age` | `number \| bigint` | Player age (in years). |
| `proj_xwoba` | `number` | Projected expected weighted on-base average for the batter. |
| `proj_pa` | `number` | Combined prior-three-season pa behind the projection, its effective sample size; it inherits the pitch-row counting of load_mlb_expected_stats pa rather than true plate appearances. |

## `loadMlbOaa`

Release: [mlb_fielding_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_fielding_models) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_fielding_models/mlb_oaa_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2015) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbOaa({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_oaa(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbOaaRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `fielder_id` | `string` | MLBAM identifier of the fielder charged with the ball in play, resolved from whichever fielder_N column matches the responsible position and published as a string rather than an integer. |
| `position` | `number \| bigint` | Listed roster position (G, F, C, etc.). |
| `opportunities` | `number` | Balls in play charged to this fielder at this position, the sample the oaa sum runs over. |
| `oaa` | `number` | Outs above average: outs the fielder actually recorded minus what a per-position catch-probability logistic expected from the same batted-ball trajectories, summed across their opportunities. |
| `season` | `number \| bigint` | Season year. |

## `loadMlbCatcherFraming`

Release: [mlb_fielding_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_fielding_models) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_fielding_models/mlb_catcher_framing_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2015) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbCatcherFraming({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_catcher_framing(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbCatcherFramingRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `catcher_id` | `string` | MLBAM identifier of the receiving catcher, taken from Savant's fielder_2 and published as a string rather than an integer. |
| `takes` | `number` | Called strikes plus balls the catcher received across the season, a pure workload count; the framing figures themselves sum only over the shadow-zone subset of these. |
| `framing_runs` | `number` | Runs saved by receiving, summing actual called strike minus modeled strike probability times that count's strike run value over shadow-zone takes only. |
| `strikes_gained` | `number` | The same shadow-zone sum of actual called strike minus modeled strike probability left unweighted by run value, so it measures stolen strikes rather than runs. |
| `season` | `number \| bigint` | Season year. |

## `loadMlbXera`

Release: [mlb_pitching_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_pitching_models) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_pitching_models/mlb_xera_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2015) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbXera({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_xera(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbXeraRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `pitcher` | `string` | Whether the position is a pitcher. |
| `season` | `number \| bigint` | Season year. |
| `x_woba` | `number` | Expected weighted on-base average, derived from batted-ball quality rather than outcomes. |
| `x_era` | `number` | ERA-scale conversion of x_woba as league_era plus (x_woba minus league_woba) over woba_scale times pa_per_9, an exact linear function of x_woba that can go negative for extreme pitchers. |

## `loadMlbStuffPlus`

Release: [mlb_pitching_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_pitching_models) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_pitching_models/mlb_stuff_plus_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2015) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbStuffPlus({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_stuff_plus(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbStuffPlusRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `pitcher` | `string` | Whether the position is a pitcher. |
| `pitch_type` | `string` | Abbreviation of the pitch type thrown (e.g. FF, SL, CH). |
| `stuff_rv_hat` | `number` | Mean predicted per-pitch run value from the bundled xgboost stuff model over this pitcher's pitches of this type, on Savant's batter-perspective delta_run_exp scale so lower is better for the pitcher. |
| `stuff_plus` | `number` | Stuff+ on the 100-is-average scale, exactly 100 minus 10 times (stuff_rv_hat minus the league mean) over the league SD, so higher is better and outlier run-value predictions can push it well below zero. |
| `season` | `number \| bigint` | Season year. |

## `loadMlbCommandPlus`

Release: [mlb_pitching_models](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_pitching_models) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_pitching_models/mlb_command_plus_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2015) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbCommandPlus({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_command_plus(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbCommandPlusRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `pitcher` | `string` | Whether the position is a pitcher. |
| `location_rv_hat` | `number` | Mean predicted per-pitch run value from the bundled location model, which sees plate location, count, handedness and pitch type but no raw pitch physics; lower is better for the pitcher. |
| `command_plus` | `number` | Command+/Location+ on the 100-is-average scale, exactly 100 minus 10 times (location_rv_hat minus the league mean) over the league SD; it grades where the pitch finished, not intent, since Statcast ships no catcher target. |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaBaseballPbp`

Release: [ncaa_baseball_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_pbp/ncaa_baseball_pbp_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2017) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballPbp({ seasons: 2023, columns: ['contest_id', 'inning', 'play_type', 'description'] });
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `contest_id` | `string` | stats.ncaa.org contest (game) identifier. |
| `inning` | `number \| bigint` | Inning number. |
| `inning_top_bot` | `string` | Half-inning ("top" or "bot"). |
| `batting` | `string` | Whether the situation applies to batting stats. |
| `fielding` | `string` | Whether the situation applies to fielding stats. |
| `play_number` | `number \| bigint` |  |
| `score_away` | `number \| bigint` |  |
| `score_home` | `number \| bigint` |  |
| `batter` | `string` | MLBAM player id of the batter. |
| `play_type` | `string` | Play category the NCAA baseball parser classified from the play text: single, double, triple, home_run, strikeout, walk, hit_by_pitch, groundout, flyout, lineout, out, double_play, fielders_choice, reached_on_error, stolen_base, wild_pitch, passed_ball, runner_advance, substitution, other, or unknown when the clause could not be classified. |
| `hit_trajectory` | `string` | Batted-ball trajectory: one of ground, line, fly, pop, foul. |
| `fielded_position` | `string` | Free-text description of where/how the ball was fielded or the runner advanced, as written by the scorer. |
| `is_hit` | `boolean` | Whether the plate appearance resulted in a hit. |
| `is_out` | `boolean` | Whether the play recorded at least one out. |
| `strikeout_type` | `string` | How the strikeout ended: 'swinging' or 'looking'. |
| `is_sacrifice` | `boolean` | Whether the play was scored as a sacrifice. |
| `sac_type` | `string` | Kind of sacrifice when one was scored: 'fly' or 'bunt'. |
| `is_double_play` | `boolean` | Whether the play resulted in a double play. |
| `rbi` | `number \| bigint` | Runs batted in. |
| `count_balls` | `number \| bigint` | Ball count when the plate appearance resolved. |
| `count_strikes` | `number \| bigint` | Strike count when the plate appearance resolved. |
| `pitch_sequence` | `string` | Per-pitch result string for the plate appearance (e.g. 'BBKKS'), one character per pitch. |
| `error_position` | `string` | Fielding position credited with the error, as the feed labels it (e.g. 'ss', 'rf', 'c'). |
| `unearned` | `boolean` | Whether the run(s) on the play were scored as unearned. |
| `runs_scored` | `number \| bigint` | Runs that scored on the play. |
| `scoring_runners` | `Array<string \| null>` | List of runner names who scored on the play. |
| `runners_advanced` | `Array<string \| null>` | List of 'runner-\>base' strings describing each runner's advance on the play. |
| `outs_on_play` | `number \| bigint` | Number of outs recorded on the play (0-3). |
| `is_scoring_play` | `boolean` | Flag indicating that the play put points on the board (1 = scoring play, 0 = not). |
| `description` | `string` | Long-form description text. |
| `source` | `string` | Source. |
| `espn_game_id` | `string` |  |
| `game_key` | `string` | NCAA contest identifier for the game the row belongs to; the join key to the other ncaa_baseball_* tables. |
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `location` | `string` | Team city/region (e.g. "Los Angeles"). |
| `attendance` | `number \| bigint` | Reported attendance (NA on the redesigned page). |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaBaseballSchedule`

Release: [ncaa_baseball_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_schedules) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_schedules/ncaa_baseball_schedule_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2012) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballSchedule({ seasons: 2023 });
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_schedule(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballScheduleRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique ESPN team identifier. |
| `team_name` | `string` | Team name. |
| `date` | `string` | Date in YYYY-MM-DD format. |
| `game_number` | `number \| bigint` | Game number within a doubleheader. |
| `opponent_id` | `string` | Unique identifier for opponent. |
| `opponent` | `string` |  |
| `result` | `string` | Win/loss/tie result for `team_id`. |
| `outcome` | `string` | Result for the team the row is keyed to: 'W', 'L' or 'T'. |
| `team_score` | `number \| bigint` | Team's score / final score. |
| `opponent_score` | `number \| bigint` | Opponent score. |
| `contest_id` | `string` | stats.ncaa.org contest (game) identifier. |
| `attendance` | `number \| bigint` | Reported attendance (NA on the redesigned page). |
| `division` | `number \| bigint` | NCAA division (1, 2, 3). |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaBaseballTeams`

Release: [ncaa_baseball_teams](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_teams) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_teams/ncaa_baseball_teams_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballTeams({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_teams(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballTeamsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique ESPN team identifier. |
| `team_name` | `string` | Team name. |
| `division` | `number \| bigint` | NCAA division (1, 2, 3). |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaBaseballRosters`

Release: [ncaa_baseball_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_rosters/ncaa_baseball_rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballRosters({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique ESPN team identifier. |
| `team_name` | `string` | Team name. |
| `player_id` | `string` | stats.ncaa.org player identifier. |
| `player_name` | `string` | Player name. |
| `jersey` | `string` | Jersey number worn by the player. |
| `statcrew_jersey` | `string` | StatCrew jersey number; present in the schema but entirely unpopulated in the published asset. |
| `player_class` | `string` | Class year as the feed reports it (Fr., So., Jr., Sr.); '---' when unreported. |
| `position` | `string` | Position the NCAA baseball feed reports for the player. |
| `height` | `string` | Height (feet and inches). |
| `weight` | `number \| bigint` | Weight in pounds. |
| `hometown` | `string` |  |
| `high_school` | `string` |  |
| `games_played` | `number \| bigint` | Games played. |
| `games_started` | `number \| bigint` | Games started. |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaBaseballLinescore`

Release: [ncaa_baseball_linescore](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_linescore) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_linescore/ncaa_baseball_linescore_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballLinescore({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_linescore(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballLinescoreRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `contest_id` | `string` | stats.ncaa.org contest (game) identifier. |
| `team` | `string` | Team. |
| `home_away` | `string` | Venue label for the team ('home' or 'away'). |
| `inning` | `string` | Inning number. |
| `runs` | `number \| bigint` | Runs scored. |
| `runs_total` | `number \| bigint` | Total runs scored by the team across the whole game. |
| `hits` | `number \| bigint` | Hits. |
| `errors` | `number \| bigint` | Fielding errors. |
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `venue` | `string` |  |
| `attendance` | `number \| bigint` | Reported attendance (NA on the redesigned page). |
| `source` | `string` | Source. |
| `espn_game_id` | `string` |  |
| `game_key` | `string` | NCAA contest identifier for the game the row belongs to; the join key to the other ncaa_baseball_* tables. |
| `location` | `string` | Team city/region (e.g. "Los Angeles"). |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaBaseballTeamStats`

Release: [ncaa_baseball_team_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_team_stats) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_team_stats/ncaa_baseball_team_stats_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballTeamStats({ seasons: 2025, columns: ['contest_id', 'category', 'stat', 'away_value', 'home_value'] });
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_team_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballTeamStatsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `contest_id` | `string` | stats.ncaa.org contest (game) identifier. |
| `category` | `string` | Category label. |
| `stat` | `string` |  |
| `period` | `string` | Inning number. |
| `away_team` | `string` | Away team name. |
| `away_value` | `string` | Away team's value for the stat named by the row, as a string (the table is long/tidy, one stat per row). |
| `home_team` | `string` | Home team name. |
| `home_value` | `string` | Home team's value for the stat named by the row, as a string (the table is long/tidy, one stat per row). |
| `source` | `string` | Source. |
| `espn_game_id` | `string` |  |
| `game_key` | `string` | NCAA contest identifier for the game the row belongs to; the join key to the other ncaa_baseball_* tables. |
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `location` | `string` | Team city/region (e.g. "Los Angeles"). |
| `attendance` | `number \| bigint` | Reported attendance (NA on the redesigned page). |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaBaseballPlayerStats`

Release: [ncaa_baseball_player_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_player_stats) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_player_stats/ncaa_baseball_player_stats_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballPlayerStats({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_player_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballPlayerStatsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `contest_id` | `string` | stats.ncaa.org contest (game) identifier. |
| `team_id` | `string` | Unique ESPN team identifier. |
| `number` | `string` | Jersey number. |
| `name` | `string` | Display name. |
| `position` | `string` | Position the NCAA baseball feed reports for the player. |
| `r` | `string` | Runs scored. |
| `ab` | `string` | At-bats. |
| `h` | `string` | Hits. |
| `2b` | `string` | Doubles hit by the batter. |
| `3b` | `string` | Triples hit by the batter. |
| `tb` | `string` | Total bases accumulated by the batter. |
| `hr` | `string` | Home runs hit by the batter over the covered sample. |
| `rbi` | `string` | Runs batted in. |
| `bb` | `string` | Bases on balls (walks). |
| `hbp` | `string` | Times the batter was hit by a pitch. |
| `sf` | `string` | Sacrifice flies hit by the batter. |
| `sh` | `string` | Sacrifice hits (bunts) laid down by the batter. |
| `k` | `string` | Strikeouts. |
| `opp_dp` | `string` | Double plays turned by the opposing defense against this side. |
| `cs` | `string` | Times the baserunner was caught stealing. |
| `picked` | `string` | Times the baserunner was picked off. |
| `sb` | `string` | Stolen bases by the baserunner. |
| `ibb` | `string` | Intentional bases on balls drawn by the batter. |
| `kl` | `string` | Strikeouts looking -- called third strikes, as opposed to swinging strikeouts. |
| `category` | `string` | Category label. |
| `source` | `string` | Source. |
| `espn_game_id` | `string` |  |
| `game_key` | `string` | NCAA contest identifier for the game the row belongs to; the join key to the other ncaa_baseball_* tables. |
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `location` | `string` | Team city/region (e.g. "Los Angeles"). |
| `attendance` | `number \| bigint` | Reported attendance (NA on the redesigned page). |
| `ip` | `string` | Innings pitched. |
| `er` | `string` | Earned runs. |
| `so` | `string` | Strikeouts: the batter's strikeouts on the batting line, the pitcher's strikeouts recorded on the pitching line. |
| `bf` | `string` | Batters faced by the pitcher. |
| `2b_a` | `string` | Doubles allowed by the pitcher. |
| `3b_a` | `string` | Triples allowed by the pitcher. |
| `bk` | `string` | Balks charged to the pitcher. |
| `hr_a` | `string` | Home runs allowed by the pitcher. |
| `wp` | `string` | Wild pitches charged to the pitcher. |
| `hb` | `string` | Batters hit by a pitch from this pitcher. |
| `inh_run` | `string` | Inherited runners on base when this relief pitcher entered. |
| `inh_run_score` | `string` | Inherited runners who subsequently scored. |
| `sha` | `string` | Sacrifice hits allowed by the pitcher. |
| `sfa` | `string` | Sacrifice flies allowed by the pitcher. |
| `tuer` | `string` | Team unearned runs scored while this pitcher was in the game. |
| `pickoffs` | `string` | Pickoffs. |
| `po` | `string` | Putouts recorded by the fielder. |
| `a` | `string` | Fielding assists credited to the player. |
| `tc` | `string` | Total chances for the fielder (putouts + assists + errors). |
| `e` | `string` | Errors charged to the fielder. |
| `ci` | `string` | Times the batter reached base on catcher's interference. |
| `pb` | `string` | Passed balls charged to the catcher. |
| `sba` | `string` | Stolen bases allowed while this catcher was behind the plate. |
| `csb` | `string` | Runners caught stealing while this catcher was behind the plate. |
| `idp` | `string` | Times the batter grounded into a double play. |
| `tp` | `string` | Triple plays the player took part in. |
| `sbapct` | `string` | Stolen-base success rate allowed by the catcher, as a PROPORTION on 0-1 (e.g. 0.625), not a percentage. |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaBaseballSituationalStats`

Release: [ncaa_baseball_situational_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_situational_stats) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_situational_stats/ncaa_baseball_situational_stats_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballSituationalStats({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_situational_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballSituationalStatsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `contest_id` | `string` | stats.ncaa.org contest (game) identifier. |
| `team_seq` | `number \| bigint` | Side indicator for the row: 0 and 1 distinguish the two teams in the contest. |
| `player` | `string` |  |
| `position` | `string` | Position the NCAA baseball feed reports for the player. |
| `with_runrs` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- plate appearances with runners on base. |
| `hits_scorepos` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- at-bats with runners in scoring position. |
| `vs_lhp` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- batting against left-handed pitching. |
| `vs_rhp` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- batting against right-handed pitching. |
| `leadoff_pct` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- leadoff batters reaching base; despite the name it is a pair string, not a percentage. |
| `rbi3rd` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- chances to drive in a runner from third. |
| `h_pinchit` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- pinch-hitting appearances. |
| `adv_ops` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- advancing-opportunity situations. |
| `with_2_outs` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- plate appearances with two outs. |
| `with_runrs2` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- secondary runners-on split emitted by the feed. |
| `with_scorepos2` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- secondary runners-in-scoring-position split emitted by the feed. |
| `bases_empty` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- plate appearances with the bases empty. |
| `bases_loaded` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- plate appearances with the bases loaded. |
| `category` | `string` | Category label. |
| `source` | `string` | Source. |
| `espn_game_id` | `string` |  |
| `game_key` | `string` | NCAA contest identifier for the game the row belongs to; the join key to the other ncaa_baseball_* tables. |
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `location` | `string` | Team city/region (e.g. "Los Angeles"). |
| `attendance` | `number \| bigint` | Reported attendance (NA on the redesigned page). |
| `runners` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- plate appearances with runners on base. |
| `vs_lhb` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- pitching against left-handed batters. |
| `with_2outs` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- two-out split under the feed's second, unpunctuated key (distinct column from with_2_outs). |
| `emtpy` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- bases-empty split under the upstream feed's misspelled key ('emtpy', sic). |
| `with_scorepos` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- plate appearances with runners in scoring position. |
| `with_runners2` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- secondary runners-on split emitted by the feed alongside with_runrs2. |
| `vs_rhb` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- pitching against right-handed batters. |
| `field_pct` | `string` | Situational split as a 'successes-opportunities' pair string (e.g. '5-13'), not a numeric rate -- fielding chances handled cleanly; despite the name it is a pair string, not a fielding percentage. |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaBaseballGames`

Release: [ncaa_baseball_games](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_games) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_games/ncaa_baseball_games_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2017) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballGames({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_games(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballGamesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_key` | `string` | NCAA contest identifier for the game the row belongs to; the join key to the other ncaa_baseball_* tables. |
| `contest_id` | `string` | stats.ncaa.org contest (game) identifier. |
| `game_pbp_id` | `string` | stats.ncaa.org play-by-play (contest) identifier. |
| `season` | `number \| bigint` | Season year. |
| `source` | `string` | Source. |
| `espn_game_id` | `string` |  |
| `away_team` | `string` | Away team name. |
| `away_final` | `number \| bigint` | Final runs scored by the away team. |
| `home_team` | `string` | Home team name. |
| `home_final` | `number \| bigint` | Final runs scored by the home team. |

## `loadMlbGroups`

Release: [mlb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_groups/mlb_groups.parquet`

:::caution[Coverage]
One season-less file: one row per group lineage (the league, subdivisions, conferences, divisions) with the first and last season it had members. group_id is SDV's own id (e.g. mlb:al-east) and names a lineage: a rename that keeps continuity keeps the id, a new body gets a new one, and notes records each call. Seasons are the calendar year.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbGroups();
// snake_case alias (py/R parity): sdv.mlb.load_mlb_groups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbGroupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("mlb"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `first_season` | `number` | First season in which the group had at least one member (calendar year). |
| `last_season` | `number` | Last season in which the group had at least one member (calendar year). |
| `notes` | `string` | Builder notes on the group: the lineage decisions behind its group_id and any source caveats. |

## `loadMlbGroupSeasons`

Release: [mlb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_groups/mlb_group_seasons.parquet`

:::caution[Coverage]
One season-less file: one row per group per season it existed, with its name, short name, abbreviation and parent group AS OF that season (never today's label applied to the past) and its member count. season is the calendar year.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbGroupSeasons();
// snake_case alias (py/R parity): sdv.mlb.load_mlb_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("mlb"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `season` | `number` | Season the row describes (calendar year). |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `name` | `string` | Full name of the group as of that season -- the label in use then, not today's name. |
| `short_name` | `string` | Short display name of the group as of that season. |
| `abbreviation` | `string` | Abbreviation of the group as of that season. |
| `parent_group_id` | `string` | group_id one level up as of that season (division -\> conference -\> subdivision -\> league); null at the top level or where no higher group applied that season. |
| `n_teams` | `number` | Number of member teams in the group that season. |

## `loadMlbGroupAliases`

Release: [mlb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_groups/mlb_group_aliases.parquet`

:::caution[Coverage]
One season-less file: every name, abbreviation, slug and source id that a source (espn, mlb) uses for a group, each with the seasons it is valid for (valid_from / valid_to, inclusive; null = unbounded). Match a source's conference or division label here to reach group_id.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbGroupAliases();
// snake_case alias (py/R parity): sdv.mlb.load_mlb_group_aliases(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbGroupAliasesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("mlb"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `source` | `string` | Source that uses this label or id (in this table: espn, mlb); "sdv" marks SDV's own labels. |
| `source_id` | `string` | The source's own id for the group (ESPN group id, NCAA conf_id, CFBD id, MLB division id) when it has one; null otherwise. |
| `name_kind` | `string` | Kind of label in value: "name", "short_name", "abbreviation", "slug" or "code". |
| `value` | `string` | The label exactly as the source writes it; match a source's conference or division label against it to reach group_id. |
| `valid_from` | `number` | First season the alias is valid for, inclusive (calendar year); null = unbounded. |
| `valid_to` | `number` | Last season the alias is valid for, inclusive (calendar year); null = unbounded (still in use). |

## `loadMlbTeamGroupSeasons`

Release: [mlb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_groups/mlb_team_group_seasons_{season}.parquet`

:::caution[Coverage]
One row per team per season: the SDV subdivision, conference and division group ids the team belonged to that season (null where a level does not apply), the team name as of that season, where the membership came from, and whether a second source agreed (null when only one source covers the season). team_id is a string: the ESPN team id where ESPN covers the team, otherwise the MLB Stats API id; team_id_source names the id space. season is the calendar year; seasons 1901-2026.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1901) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbTeamGroupSeasons({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_mlb_team_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbTeamGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("mlb"); the prefix of every group_id in it. |
| `season` | `number` | Season of the membership (calendar year). |
| `team_id` | `string` | Team id as a string: the ESPN team id where ESPN covers the team, otherwise the league's own id; team_id_source says which. |
| `team_id_source` | `string` | Id space of team_id (in this table: espn, mlb). |
| `team_name` | `string` | Team name as of that season, not today's. |
| `subdivision_id` | `string` | SDV group_id of the team's subdivision that season (e.g. FBS / FCS, Division I); null where the league has no subdivision level. |
| `conference_id` | `string` | SDV group_id of the team's conference that season; null where the team had no conference (an independent, or a season played without conferences). |
| `division_id` | `string` | SDV group_id of the team's division that season; null where the level does not apply. |
| `source` | `string` | Source the membership was taken from -- the most reliable per-season source for that era. |
| `sources_agree` | `boolean` | Whether a second source agreed on the membership; null when only one source covers the season. |
| `notes` | `string` | Builder notes on the team-season, such as a source disagreement or which of several listed memberships was kept. |

## `loadNcaaBaseballGroups`

Release: [ncaa_baseball_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_groups/ncaa_baseball_groups.parquet`

:::caution[Coverage]
One season-less file: one row per group lineage (the league, subdivisions, conferences, divisions) with the first and last season it had members. group_id is SDV's own id (e.g. ncaa_baseball:acc) and names a lineage: a rename that keeps continuity keeps the id, a new body gets a new one, and notes records each call. Seasons are the calendar year.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballGroups();
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_groups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballGroupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("ncaa_baseball"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `first_season` | `number` | First season in which the group had at least one member (calendar year). |
| `last_season` | `number` | Last season in which the group had at least one member (calendar year). |
| `notes` | `string` | Builder notes on the group: the lineage decisions behind its group_id and any source caveats. |

## `loadNcaaBaseballGroupSeasons`

Release: [ncaa_baseball_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_groups/ncaa_baseball_group_seasons.parquet`

:::caution[Coverage]
One season-less file: one row per group per season it existed, with its name, short name, abbreviation and parent group AS OF that season (never today's label applied to the past) and its member count. season is the calendar year.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballGroupSeasons();
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("ncaa_baseball"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `season` | `number` | Season the row describes (calendar year). |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `name` | `string` | Full name of the group as of that season -- the label in use then, not today's name. |
| `short_name` | `string` | Short display name of the group as of that season. |
| `abbreviation` | `string` | Abbreviation of the group as of that season. |
| `parent_group_id` | `string` | group_id one level up as of that season (division -\> conference -\> subdivision -\> league); null at the top level or where no higher group applied that season. |
| `n_teams` | `number` | Number of member teams in the group that season. |

## `loadNcaaBaseballGroupAliases`

Release: [ncaa_baseball_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_groups/ncaa_baseball_group_aliases.parquet`

:::caution[Coverage]
One season-less file: every name, abbreviation, slug and source id that a source (ncaa, sdv) uses for a group, each with the seasons it is valid for (valid_from / valid_to, inclusive; null = unbounded). Match a source's conference or division label here to reach group_id.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballGroupAliases();
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_group_aliases(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballGroupAliasesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("ncaa_baseball"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `source` | `string` | Source that uses this label or id (in this table: ncaa, sdv); "sdv" marks SDV's own labels. |
| `source_id` | `string` | The source's own id for the group (ESPN group id, NCAA conf_id, CFBD id, MLB division id) when it has one; null otherwise. |
| `name_kind` | `string` | Kind of label in value: "name", "short_name", "abbreviation", "slug" or "code". |
| `value` | `string` | The label exactly as the source writes it; match a source's conference or division label against it to reach group_id. |
| `valid_from` | `number` | First season the alias is valid for, inclusive (calendar year); null = unbounded. |
| `valid_to` | `number` | Last season the alias is valid for, inclusive (calendar year); null = unbounded (still in use). |

## `loadNcaaBaseballTeamGroupSeasons`

Release: [ncaa_baseball_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_baseball_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_baseball_groups/ncaa_baseball_team_group_seasons_{season}.parquet`

:::caution[Coverage]
One row per team per season: the SDV subdivision, conference and division group ids the team belonged to that season (null where a level does not apply), the team name as of that season, where the membership came from, and whether a second source agreed (null when only one source covers the season). team_id is a string: the stats.ncaa.org org id (not an ESPN id); team_id_source names the id space. season is the calendar year; seasons 2010-2026.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadNcaaBaseballTeamGroupSeasons({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mlb.load_ncaa_baseball_team_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaBaseballTeamGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("ncaa_baseball"); the prefix of every group_id in it. |
| `season` | `number` | Season of the membership (calendar year). |
| `team_id` | `string` | Team id as a string: the ESPN team id where ESPN covers the team, otherwise the league's own id; team_id_source says which. |
| `team_id_source` | `string` | Id space of team_id (in this table: ncaa_org). |
| `team_name` | `string` | Team name as of that season, not today's. |
| `subdivision_id` | `string` | SDV group_id of the team's subdivision that season (e.g. FBS / FCS, Division I); null where the league has no subdivision level. |
| `conference_id` | `string` | SDV group_id of the team's conference that season; null where the team had no conference (an independent, or a season played without conferences). |
| `division_id` | `string` | SDV group_id of the team's division that season; null where the level does not apply. |
| `source` | `string` | Source the membership was taken from -- the most reliable per-season source for that era. |
| `sources_agree` | `boolean` | Whether a second source agreed on the membership; null when only one source covers the season. |
| `notes` | `string` | Builder notes on the team-season, such as a source disagreement or which of several listed memberships was kept. |

## `loadMlbParkDimensions`

Release: [mlb_parks](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mlb_parks) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mlb_parks/mlb_park_dimensions.parquet`

:::caution[Coverage]
One season-less file, seasons 2001 on: one row per MLB venue per season (regular-season, spring-training, neutral and international sites) from the MLB Stats API venues endpoint, with fence distances in feet at MLB's seven markers, capacity, turf, roof, azimuth, elevation and coordinates as of that season. venue_id is a string (the MLB Stats API venue id, venue.id in game feeds); venue_name is the name in use that season. The API lags or misses some fence moves: cited corrections (Camden Yards, Petco Park, T-Mobile Park, Comerica Park, 2022 Rate Field and Progressive Field) are applied and described in notes, which is null on uncorrected rows.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mlb.loadMlbParkDimensions();
// snake_case alias (py/R parity): sdv.mlb.load_mlb_park_dimensions(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMlbParkDimensionsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("mlb"). |
| `season` | `number` | Season the row describes (calendar year, 2001 on). |
| `venue_id` | `string` | MLB Stats API venue id (venue.id in MLB game feeds and schedules), published as a string. |
| `venue_name` | `string` | Venue name as of that season (e.g. PacBell Park 2001-03, SBC Park 2004-05, AT&T Park 2006-18, Oracle Park 2019-), not today's name. |
| `retro_park_id` | `string` | Retrosheet park id (e.g. "BOS07") from the MLB Stats API's cross-reference; null for most spring-training and minor-league parks. |
| `left_line_ft` | `number` | Distance in feet from home plate to the fence at the left-field foul pole. |
| `left_ft` | `number` | Distance in feet from home plate to the fence at MLB's left-field marker. |
| `left_center_ft` | `number` | Distance in feet from home plate to the fence at MLB's left-centre marker; a park may re-label which point this is (Oracle Park's reads 364 through 2019, then the 399 ft deep left-centre). |
| `center_ft` | `number` | Distance in feet from home plate to the fence in straightaway centre field. |
| `right_center_ft` | `number` | Distance in feet from home plate to the fence at MLB's right-centre marker. |
| `right_ft` | `number` | Distance in feet from home plate to the fence at MLB's right-field marker. |
| `right_line_ft` | `number` | Distance in feet from home plate to the fence at the right-field foul pole. |
| `capacity` | `number` | Seating capacity that season. |
| `turf_type` | `string` | Playing surface: "Grass" or "Artificial Turf". |
| `roof_type` | `string` | Roof: "Open", "Retractable" or "Dome". |
| `azimuth_deg` | `number` | MLB's azimuthAngle: degrees clockwise from north of the line from home plate to centre field (Fenway Park 45, Progressive Field 0). |
| `elevation_ft` | `number` | Elevation of the venue in feet above sea level. |
| `latitude` | `number` | Latitude of the venue in decimal degrees. |
| `longitude` | `number` | Longitude of the venue in decimal degrees. |
| `notes` | `string` | Null unless a curated correction applies to the row; then which columns changed, from what to what, why, and the citation. |

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/releases.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/loaders)._

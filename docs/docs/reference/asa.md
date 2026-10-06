---
title: asa
sidebar_label: asa
sidebar_position: 41
toc_max_heading_level: 2
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **An empty or non-JSON 2xx body raises `AssetFetchError`** — An empty 200 or an HTML challenge page is a failed fetch, not `""` / `[]`. Catch `AssetFetchError` (unknown — retry later) apart from `NoDataError` (nothing there). ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `asa` — native provider reference

- **namespace:** `sdv.asa` *(standalone — not an ESPN league)*
- **families:** American Soccer Analysis
- **wrappers:** 15 native

`asa` is a Soccer provider namespace (no ESPN `{sport}`/`{league}` nesting). Every method is exposed under BOTH its snake_case name (`<family>_<endpoint>`, py/R parity) and a camelCase canonical name (`<family><Endpoint>`) on `sdv.asa`. Pass `{ parsed: true }` to any endpoint to get tidy rows instead of raw JSON.

```js
import sdv from 'sportsdataverse';

// American Soccer Analysis is keyless; league_slug is mls | nwsl | uslc | usl1 | mlsnp:
await sdv.asa.asa_teams({ league_slug: 'mls', parsed: true });
```

## Native API — American Soccer Analysis

Flat (non-ESPN) wrappers for the American Soccer Analysis public API. Host: `https://app.americansocceranalysis.com/api/v1`. Each method is exposed under BOTH its snake_case name `asa_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.asa`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response. Endpoints marked **multi-table** parse to several frames in sdv-py; with `parsed: true` they return the default shown in the Parser column (one sub-frame, or every table as a dict), and `section: "<name>"` selects any other (an unknown name throws, listing the valid ones).

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `asa_games` / `asaGames` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/games` | `league_slug`\* | — | `parse_asa` | — |
| `asa_games_xgoals` / `asaGamesXgoals` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/games/xgoals` | `league_slug`\* | `season_name`, `stage_name`, `minimum_minutes`, `general_position`, `split_by_teams`, `split_by_seasons`, `split_by_games`, `start_date`, `end_date` | `parse_asa` | — |
| `asa_goalkeepers_goals_added` / `asaGoalkeepersGoalsAdded` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/goalkeepers/goals-added` | `league_slug`\* | `season_name`, `stage_name`, `minimum_minutes`, `general_position`, `split_by_teams`, `split_by_seasons`, `split_by_games`, `start_date`, `end_date` | `parse_asa_goals_added` — multi-table: `section` = `summary` (default), `actions` | — |
| `asa_goalkeepers_xgoals` / `asaGoalkeepersXgoals` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/goalkeepers/xgoals` | `league_slug`\* | `season_name`, `stage_name`, `minimum_minutes`, `general_position`, `split_by_teams`, `split_by_seasons`, `split_by_games`, `start_date`, `end_date` | `parse_asa` | — |
| `asa_managers` / `asaManagers` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/managers` | `league_slug`\* | — | `parse_asa` | — |
| `asa_players` / `asaPlayers` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/players` | `league_slug`\* | — | `parse_asa` | — |
| `asa_players_goals_added` / `asaPlayersGoalsAdded` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/players/goals-added` | `league_slug`\* | `season_name`, `stage_name`, `minimum_minutes`, `general_position`, `split_by_teams`, `split_by_seasons`, `split_by_games`, `start_date`, `end_date` | `parse_asa_goals_added` — multi-table: `section` = `summary` (default), `actions` | — |
| `asa_players_salaries` / `asaPlayersSalaries` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/players/salaries` | `league_slug`\* | `season_name`, `stage_name`, `minimum_minutes`, `general_position`, `split_by_teams`, `split_by_seasons`, `split_by_games`, `start_date`, `end_date` | `parse_asa` | — |
| `asa_players_xgoals` / `asaPlayersXgoals` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/players/xgoals` | `league_slug`\* | `season_name`, `stage_name`, `minimum_minutes`, `general_position`, `split_by_teams`, `split_by_seasons`, `split_by_games`, `start_date`, `end_date` | `parse_asa` | — |
| `asa_referees` / `asaReferees` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/referees` | `league_slug`\* | — | `parse_asa` | — |
| `asa_stadia` / `asaStadia` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/stadia` | `league_slug`\* | — | `parse_asa` | — |
| `asa_teams` / `asaTeams` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/teams` | `league_slug`\* | — | `parse_asa` | — |
| `asa_teams_goals_added` / `asaTeamsGoalsAdded` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/teams/goals-added` | `league_slug`\* | `season_name`, `stage_name`, `minimum_minutes`, `general_position`, `split_by_teams`, `split_by_seasons`, `split_by_games`, `start_date`, `end_date` | `parse_asa_goals_added` — multi-table: `section` = `summary` (default), `actions` | — |
| `asa_teams_xgoals` / `asaTeamsXgoals` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/teams/xgoals` | `league_slug`\* | `season_name`, `stage_name`, `minimum_minutes`, `general_position`, `split_by_teams`, `split_by_seasons`, `split_by_games`, `start_date`, `end_date` | `parse_asa` | — |
| `asa_teams_xpass` / `asaTeamsXpass` | `https://app.americansocceranalysis.com/api/v1/{league_slug}/teams/xpass` | `league_slug`\* | `season_name`, `stage_name`, `minimum_minutes`, `general_position`, `split_by_teams`, `split_by_seasons`, `split_by_games`, `start_date`, `end_date` | `parse_asa` | — |

### Returns — `asa_games` / `asaGames`

| col_name | type | description |
|---|---|---|
| `game_id` | character | ASA game id (base62 string; Utf8 join key). |
| `date_time_utc` | character | Kickoff timestamp (UTC, ISO 8601). |
| `home_score` | integer | Home goals (regulation + extra time). |
| `away_score` | integer | Away goals (regulation + extra time). |
| `home_team_id` | character | FK -\> Team (home side). |
| `away_team_id` | character | FK -\> Team (away side). |
| `referee_id` | character | ASA referee id (base62 string; Utf8 join key). |
| `stadium_id` | character | ASA stadium id (base62 string; Utf8 join key). |
| `home_manager_id` | character | FK -\> Manager (home side; nullable). |
| `away_manager_id` | character | FK -\> Manager (away side; nullable). |
| `expanded_minutes` | integer | Total match minutes incl. stoppage (data coverage window). |
| `season_name` | character | Season(s) the player appears in; may serialize as a scalar, a list, or an object across the leagues. |
| `matchday` | integer | Round/matchday number. |
| `knockout_game` | logical | True if a knockout/playoff fixture. |
| `status` | character | Game status (e.g. `final`). |
| `last_updated_utc` | character | Last-updated timestamp (UTC, ISO 8601). |
| `attendance` | numeric | Reported attendance (nullable). |

**Row type:** `AsaGamesRow` (exported from the package root).

### Returns — `asa_games_xgoals` / `asaGamesXgoals`

| col_name | type | description |
|---|---|---|
| `game_id` | character | ASA game id (base62 string; Utf8 join key). |
| `date_time_utc` | character | Kickoff timestamp (UTC, ISO 8601). |
| `home_team_id` | character | FK -\> Team (home side). |
| `home_goals` | integer | Home goals scored. |
| `home_team_xgoals` | numeric | Home expected goals (team model). |
| `home_player_xgoals` | numeric | Home expected goals (player-shot model). |
| `away_team_id` | character | FK -\> Team (away side). |
| `away_goals` | integer | Away goals scored. |
| `away_team_xgoals` | numeric | Away expected goals (team model). |
| `away_player_xgoals` | numeric | Away expected goals (player-shot model). |
| `goal_difference` | integer | goals_for - goals_against. |
| `team_xgoal_difference` | numeric | Home minus away team xGoals. |
| `player_xgoal_difference` | numeric | Home minus away player xGoals. |
| `final_score_difference` | integer | Final goal margin (home perspective). |
| `home_xpoints` | numeric | Home expected points from the match. |
| `away_xpoints` | numeric | Away expected points from the match. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `asa_goalkeepers_goals_added` / `asaGoalkeepersGoalsAdded`

| col_name | type | description |
|---|---|---|
| `player_id` | character | ASA player id (base62 string; Utf8 join key). |
| `team_id` | character | ASA team id (base62 string; Utf8 join key, never numeric). |
| `minutes_played` | integer | Minutes played in the filtered window. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `asa_goalkeepers_xgoals` / `asaGoalkeepersXgoals`

| col_name | type | description |
|---|---|---|
| `player_id` | character | ASA player id (base62 string; Utf8 join key). |
| `team_id` | character | ASA team id (base62 string; Utf8 join key, never numeric). |
| `minutes_played` | integer | Minutes played in the filtered window. |
| `shots_faced` | integer | Shots faced. |
| `goals_conceded` | integer | Goals conceded. |
| `saves` | integer | Saves made. |
| `share_headed_shots` | numeric | Share of faced shots that were headers. |
| `xgoals_gk_faced` | numeric | Post-shot expected goals faced. |
| `goals_minus_xgoals_gk` | numeric | Goals conceded minus post-shot xG (negative = shots saved above expectation). |
| `goals_divided_by_xgoals_gk` | numeric | Goals conceded / post-shot xG faced. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `asa_managers` / `asaManagers`

| col_name | type | description |
|---|---|---|
| `manager_id` | character | ASA manager id (base62 string; Utf8 join key). |
| `manager_name` | character | Manager display name. |
| `nationality` | character | Player nationality (country name). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `asa_players` / `asaPlayers`

| col_name | type | description |
|---|---|---|
| `player_id` | character | ASA player id (base62 string; Utf8 join key). |
| `player_name` | character | Player display name. |
| `birth_date` | character | Date of birth (`YYYY-MM-DD`; may be null). |
| `height_ft` | integer | Listed height, feet component. |
| `height_in` | integer | Listed height, inches component. |
| `weight_lb` | integer | Listed weight in pounds. |
| `nationality` | character | Player nationality (country name). |
| `primary_broad_position` | character | Broad position bucket (Goalkeeper/Defender/Midfielder/Forward). |
| `primary_general_position` | character | General position code (GK/CB/FB/DM/CM/AM/W/ST). |
| `season_name` | character | Season(s) the player appears in; may serialize as a scalar, a list, or an object across the leagues. |
| `secondary_general_position` | character | Secondary general position code (nullable). |

**Row type:** `AsaPlayersRow` (exported from the package root).

### Returns — `asa_players_goals_added` / `asaPlayersGoalsAdded`

| col_name | type | description |
|---|---|---|
| `player_id` | character | ASA player id (base62 string; Utf8 join key). |
| `team_id` | character | ASA team id (base62 string; Utf8 join key, never numeric). |
| `general_position` | character | General position code (GK/CB/FB/DM/CM/AM/W/ST). |
| `minutes_played` | integer | Minutes played in the filtered window. |

**Row type:** `AsaPlayersGoalsAddedRow` (exported from the package root).

### Returns — `asa_players_salaries` / `asaPlayersSalaries`

| col_name | type | description |
|---|---|---|
| `player_id` | character | ASA player id (base62 string; Utf8 join key). |
| `team_id` | character | ASA team id (base62 string; Utf8 join key, never numeric). |
| `season_name` | integer | Season(s) the player appears in; may serialize as a scalar, a list, or an object across the leagues. |
| `position` | character | Roster position designation (string; distinct from `general_position`). |
| `base_salary` | integer | Base salary (USD). |
| `guaranteed_compensation` | integer | Guaranteed compensation (USD). |
| `mlspa_release` | character | MLSPA salary-release label/date the row is sourced from. |

**Row type:** `AsaPlayersSalariesRow` (exported from the package root).

### Returns — `asa_players_xgoals` / `asaPlayersXgoals`

| col_name | type | description |
|---|---|---|
| `player_id` | character | ASA player id (base62 string; Utf8 join key). |
| `team_id` | character | ASA team id (base62 string; Utf8 join key, never numeric). |
| `general_position` | character | General position code (GK/CB/FB/DM/CM/AM/W/ST). |
| `minutes_played` | integer | Minutes played in the filtered window. |
| `shots` | integer | Shots taken. |
| `shots_on_target` | integer | Shots on target. |
| `goals` | integer | Goals scored. |
| `xgoals` | numeric | Expected goals (pre-shot xG). |
| `xplace` | numeric | Expected goals added by shot placement (post-shot minus pre-shot). |
| `goals_minus_xgoals` | numeric | Finishing over expectation (goals - xG). |
| `key_passes` | integer | Passes that led to a shot. |
| `primary_assists` | integer | Primary assists. |
| `xassists` | numeric | Expected assists. |
| `primary_assists_minus_xassists` | numeric | Assists over expectation. |
| `goals_plus_primary_assists` | integer | Goals + primary assists (G+A). |
| `xgoals_plus_xassists` | numeric | xGoals + xAssists (xG+xA). |
| `points_added` | numeric | Team points added by the player's attacking output. |
| `xpoints_added` | numeric | Expected team points added. |

**Row type:** `AsaPlayersXgoalsRow` (exported from the package root).

### Returns — `asa_referees` / `asaReferees`

| col_name | type | description |
|---|---|---|
| `referee_id` | character | ASA referee id (base62 string; Utf8 join key). |
| `referee_name` | character | Referee display name. |
| `birth_date` | character | Date of birth (`YYYY-MM-DD`; may be null). |
| `nationality` | character | Player nationality (country name). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `asa_stadia` / `asaStadia`

| col_name | type | description |
|---|---|---|
| `stadium_id` | character | ASA stadium id (base62 string; Utf8 join key). |
| `stadium_name` | character | Venue name. |
| `capacity` | integer | Seating capacity. |
| `year_built` | integer | Year the venue opened. |
| `roof` | logical | Whether the venue has a roof. |
| `turf` | logical | Whether the playing surface is artificial turf. |
| `street` | character | Street address. |
| `city` | character | City. |
| `province` | character | State/province. |
| `country` | character | Country. |
| `postal_code` | character | Postal/ZIP code. |
| `latitude` | numeric | Latitude (decimal degrees). |
| `longitude` | numeric | Longitude (decimal degrees). |
| `field_x` | integer | Pitch length (venue-reported field dimension). |
| `field_y` | integer | Pitch width (venue-reported field dimension). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `asa_teams` / `asaTeams`

| col_name | type | description |
|---|---|---|
| `team_id` | character | ASA team id (base62 string; Utf8 join key, never numeric). |
| `team_name` | character | Full club name. |
| `team_short_name` | character | Short club name. |
| `team_abbreviation` | character | Short (2-4 char) club abbreviation. |

**Row type:** `AsaTeamsRow` (exported from the package root).

### Returns — `asa_teams_goals_added` / `asaTeamsGoalsAdded`

| col_name | type | description |
|---|---|---|
| `team_id` | character | ASA team id (base62 string; Utf8 join key, never numeric). |
| `minutes` | integer | Team minutes in the window. |

**Row type:** `AsaTeamsGoalsAddedRow` (exported from the package root).

### Returns — `asa_teams_xgoals` / `asaTeamsXgoals`

| col_name | type | description |
|---|---|---|
| `team_id` | character | ASA team id (base62 string; Utf8 join key, never numeric). |
| `count_games` | integer | Games included in the window. |
| `shots_for` | integer | Shots taken. |
| `shots_against` | integer | Shots faced. |
| `goals_for` | integer | Goals scored. |
| `goals_against` | integer | Goals conceded. |
| `goal_difference` | integer | goals_for - goals_against. |
| `xgoals_for` | numeric | Expected goals created. |
| `xgoals_against` | numeric | Expected goals conceded. |
| `xgoal_difference` | numeric | xgoals_for - xgoals_against. |
| `goal_difference_minus_xgoal_difference` | numeric | Finishing/keeping over expectation. |
| `points` | integer | Actual league points earned. |
| `xpoints` | numeric | Expected league points. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `asa_teams_xpass` / `asaTeamsXpass`

| col_name | type | description |
|---|---|---|
| `team_id` | character | ASA team id (base62 string; Utf8 join key, never numeric). |
| `count_games` | integer | Games included in the window. |
| `attempted_passes_for` | integer | Passes attempted by the team. |
| `pass_completion_percentage_for` | numeric | Actual pass completion % (for). |
| `xpass_completion_percentage_for` | numeric | Expected pass completion % (for). |
| `passes_completed_over_expected_for` | numeric | Passes completed over expected (for). |
| `passes_completed_over_expected_p100_for` | numeric | Passes completed over expected per 100 passes (for). |
| `avg_vertical_distance_for` | numeric | Average vertical (goalward) pass distance (for). |
| `attempted_passes_against` | integer | Passes attempted by opponents. |
| `pass_completion_percentage_against` | numeric | Actual pass completion % (against). |
| `xpass_completion_percentage_against` | numeric | Expected pass completion % (against). |
| `passes_completed_over_expected_against` | numeric | Passes completed over expected (against). |
| `passes_completed_over_expected_p100_against` | numeric | Passes completed over expected per 100 passes (against). |
| `avg_vertical_distance_against` | numeric | Average vertical pass distance (against). |
| `passes_completed_over_expected_difference` | numeric | For minus against (passes over expected). |
| `avg_vertical_distance_difference` | numeric | For minus against (vertical distance). |

_Rows are untyped `Row[]` (not parity-verified yet)._

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/asa.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._

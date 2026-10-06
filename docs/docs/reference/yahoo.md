---
title: yahoo
sidebar_label: yahoo
sidebar_position: 37
toc_max_heading_level: 2
---

:::danger Breaking in 4.0.0

- **Public names are sportsdataverse-py's** — `athlete` → `player`, `event` → `game` on every ESPN league; sdv-py's `name_pattern` on the native families (`nhlApiWeb*` → `nhl*`, `nflApi*` → `nfl*`, CBS's 16 shorts, the 3.0.0 file-stem names). Every pre-v4 name still works as a deprecated alias that warns once. ([changelog](/CHANGELOG#public-names-are-sportsdataverse-pys-every-pre-v4-and-300-name-is-a-deprecated-alias))
- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **An empty or non-JSON 2xx body raises `AssetFetchError`** — An empty 200 or an HTML challenge page is a failed fetch, not `""` / `[]`. Catch `AssetFetchError` (unknown — retry later) apart from `NoDataError` (nothing there). ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))
- **`sdv.yahoo.*` no longer defaults `league=ncaaf` or sets a locale** — The stats queries send no `lang` / `region` / `tz` and no default `league` — pass `league` explicitly. ([changelog](/CHANGELOG#shared-endpoint-yaml-is-vendored-from-sportsdataverse-py))

:::


# `yahoo` — native provider reference

- **namespace:** `sdv.yahoo` *(standalone — not an ESPN league)*
- **families:** Yahoo Sports (scores), Yahoo Sports
- **wrappers:** 109 native

`yahoo` is a cross-sport provider namespace (no ESPN `{sport}`/`{league}` nesting). Every method is exposed under BOTH its snake_case name (`<family>_<endpoint>`, py/R parity) and a camelCase canonical name (`<family><Endpoint>`) on `sdv.yahoo`. Pass `{ parsed: true }` to any endpoint to get tidy rows instead of raw JSON.

```js
import sdv from 'sportsdataverse';

// Yahoo Sports is keyless but rejects requests without browser-y headers —
// pass Origin/Referer via `headers` (two hosts share the `yahoo` namespace):
await sdv.yahoo.yahoo_league_standings({
  league: 'ncaaf',
  headers: { Origin: 'https://sports.yahoo.com', Referer: 'https://sports.yahoo.com/' },
});
```

## Native API — Yahoo Sports (scores)

Flat (non-ESPN) wrappers for the Yahoo Sports scoreboard/boxscore feed. Host: `https://api-secure.sports.yahoo.com`. Each method is exposed under BOTH its snake_case name `yahoo_scores_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.yahoo`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `yahoo_scores_boxscore` / `yahooScoresBoxscore` | `https://api-secure.sports.yahoo.com/v1/editorial/s/boxscore/{game_id}` | `game_id`\* | `lang`, `region`, `tz`, `v`, `polling` | `parse_yahoo_scores_boxscore` | — |
| `yahoo_scores_scoreboard` / `yahooScoresScoreboard` | `https://api-secure.sports.yahoo.com/v1/editorial/s/scoreboard` | — | `lang`, `region`, `tz`, `leagues`, `week`, `season`, `conferences`, `count`, `v` | `parse_yahoo_scores_scoreboard` | — |

### Returns — `yahoo_scores_boxscore` / `yahooScoresBoxscore`

| col_name | type | description |
|---|---|---|
| `entity_id` | character | Composite Yahoo id this editorial row was keyed under, surfaced from the collection map key (e.g., "ncaaf.g.202509200023" for a game, "ncaaf.t.29" for a team); always carried as Utf8. |
| `sub_id` | character | Second-level key of an id-keyed editorial collection, present when one entity holds many sub-records — a play id, a scoring-play id, or a stat variation such as "ncaaf.stat_variation.2". |
| `ncaaf_stat_type_102` | character | Value recorded for the "Completions" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.102, abbreviated "Comp"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_103` | character | Value recorded for the "Attempts" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.103, abbreviated "Att"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_105` | character | Value recorded for the "Yards" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.105, abbreviated "Yds"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_104` | character | Value recorded for the "Completion Percentage" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.104, abbreviated "Pct"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_106` | character | Value recorded for the "Yards per Attempt" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.106, abbreviated "Y/A"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_111` | character | Value recorded for the "Sacks" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.111, abbreviated "Sack"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_112` | character | Value recorded for the "Yards Lost" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.112, abbreviated "YdsL"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_108` | character | Value recorded for the "Touchdowns" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.108, abbreviated "TD"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_109` | character | Value recorded for the "Interceptions" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.109, abbreviated "Int"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_113` | character | Value recorded for the "QB Rating" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.113, abbreviated "QBRat"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_202` | character | Value recorded for the "Rushes" statistic in Yahoo's Rushing category (stat type ncaaf.stat_type.202, abbreviated "Rush"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_203` | character | Value recorded for the "Yards" statistic in Yahoo's Rushing category (stat type ncaaf.stat_type.203, abbreviated "Yds"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_205` | character | Value recorded for the "Average" statistic in Yahoo's Rushing category (stat type ncaaf.stat_type.205, abbreviated "Avg"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_206` | character | Value recorded for the "Longest" statistic in Yahoo's Rushing category (stat type ncaaf.stat_type.206, abbreviated "Long"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_207` | character | Value recorded for the "Touchdowns" statistic in Yahoo's Rushing category (stat type ncaaf.stat_type.207, abbreviated "TD"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_411` | character | Value recorded for the "Extra Points Made" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.411, abbreviated "XPM"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_412` | character | Value recorded for the "Extra Points Attempted" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.412, abbreviated "XPA"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_407` | character | Value recorded for the "Total Made" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.407, abbreviated "FGM"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_408` | character | Value recorded for the "Total Attempted" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.408, abbreviated "FGA"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_410` | character | Value recorded for the "Long" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.410, abbreviated "Long"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_409` | character | Value recorded for the "Percent" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.409, abbreviated "Pct"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_502` | character | Value recorded for the "Kickoff Returns" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.502, abbreviated "KR"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_503` | character | Value recorded for the "Yards" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.503, abbreviated "Yds"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_505` | character | Value recorded for the "Average" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.505, abbreviated "Avg"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_506` | character | Value recorded for the "Longest" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.506, abbreviated "Long"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_507` | character | Value recorded for the "Touchdowns" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.507, abbreviated "TD"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_508` | character | Value recorded for the "Punt Returns" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.508, abbreviated "PR"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_509` | character | Value recorded for the "Yards" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.509, abbreviated "Yds"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_511` | character | Value recorded for the "Average" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.511, abbreviated "Avg"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_512` | character | Value recorded for the "Longest" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.512, abbreviated "Long"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_513` | character | Value recorded for the "Touchdowns" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.513, abbreviated "TD"), for the player or team on this boxscore row. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_scores_scoreboard` / `yahooScoresScoreboard`

| col_name | type | description |
|---|---|---|
| `entity_id` | character | Composite Yahoo id this editorial row was keyed under, surfaced from the collection map key (e.g., "ncaaf.g.202509200023" for a game, "ncaaf.t.29" for a team); always carried as Utf8. |
| `gameid` | character | Date-encoded Yahoo composite game id for this row (e.g., "ncaaf.g.202509200023"). |
| `global_gameid` | character | Yahoo cross-provider game id, distinct from the date-encoded gameid (e.g., "ncaaf.g.13556882"). |
| `start_time` | character |  |
| `is_time_tba` | logical | Flag indicating that the scheduled start time has not yet been announced. |
| `season_phase_id` | character | Identifier of the season phase the game falls in (e.g., "season.phase.season"). |
| `game_type` | character |  |
| `winning_team_id` | character | Composite Yahoo team id of the side that won the game (e.g., "ncaaf.t.29"). |
| `is_rank_upset` | character | Flag indicating that the lower-ranked side won, judged against the teams' poll rankings. |
| `is_spread_upset` | character | Flag indicating that the winning side was the betting underdog against the closing spread. |
| `outcome_type` | character | Outcome classification for a completed game (e.g., "outcome.type.won", "outcome.type.tied"). |
| `home_team_id` | character | Home team ESPN id. |
| `away_team_id` | character | Away team ESPN id. |
| `week_number` | character |  |
| `sportacular_url` | character | Deep link into the Yahoo Sportacular mobile app for this game (a "ysportacular://" URL). |
| `status_display_name` | character | Short game or event status as shown on the scoreboard (e.g., "Final", "12:00 pm ET"). |
| `status_description` | character |  |
| `status_type` | character |  |
| `total_away_points` | character | Points scored by the away team in the game. |
| `current_period_id` | character | Ordinal number of the period currently in progress, counting from 1. |
| `total_home_points` | character | Points scored by the home team in the game. |
| `total_away_shootout_points` | character | Shootout goals converted by the away team, populated only for sports that break ties by shootout. |
| `total_home_shootout_points` | character | Shootout goals converted by the home team, populated only for sports that break ties by shootout. |
| `home_team_stats` | character | JSON-encoded team-stat block for the home team, populated once the game is under way. |
| `away_team_stats` | character | JSON-encoded team-stat block for the away team, populated once the game is under way. |
| `game_period_balls` | character | Balls in the count for the at-bat in progress; baseball only. |
| `game_period_strikes` | character | Strikes in the count for the at-bat in progress; baseball only. |
| `game_period_outs` | character | Outs recorded so far in the current half-inning; baseball only. |
| `yards_to_endzone` | character | Distance from the current ball spot to the opponent's goal line, in yards. |
| `start_yardline` | character |  |
| `distance` | character |  |
| `down` | character |  |
| `team_in_possession` | character | Yahoo team id of the side currently in possession of the ball. |
| `power_play_strength_home` | character | Number of skaters the home team has on the ice during special-teams play; hockey only. |
| `power_play_strength_away` | character | Number of skaters the away team has on the ice during special-teams play; hockey only. |
| `game_time_elapsed` | character | Playing time elapsed in the game, in seconds. |
| `game_time_elapsed_display` | character | Playing time elapsed formatted for display (e.g., "67:12"), used by sports whose clock counts up. |
| `inning_status` | character | Half-inning indicator for a game in progress (e.g., "Top", "Bottom"); baseball only. |
| `away_timeouts` | character |  |
| `home_timeouts` | character |  |
| `is_halftime` | character | Flag indicating that the game is currently stopped at halftime. |
| `minimum_periods` | character | Number of periods a game of this sport runs before overtime is required (4 for football, 9 for baseball). |
| `game_periods` | character | JSON-encoded list of the game's period nodes, each carrying a period number and its display names. |
| `baserunners` | character | JSON-encoded baserunner occupancy for the game in progress; baseball only. |
| `season` | character |  |
| `subleague` | character | Sub-league the game belongs to, for leagues split into constituent circuits. |
| `subleague_display_name` | character | Display name of the sub-league the game belongs to. |
| `agg_score` | character | Aggregate score across the legs of a two-leg tie, populated only for competitions decided on aggregate. |
| `leg_number` | character | Ordinal of this leg within a multi-leg tie, counting from 1. |
| `tv_coverage` | character | Network carrying the game, as a short broadcast abbreviation (e.g., "CBS", "ESPN"). |
| `seatgeek_id` | character | SeatGeek performer or event identifier used to build the ticket-purchase link. |
| `last_updated` | logical |  |
| `teams` | character |  |
| `play_by_play` | character | JSON-encoded data-island pointer to the game's play-by-play collection in the same editorial payload. |
| `pitches` | character | JSON-encoded data-island pointer to the game's pitch-level feed; baseball only. |
| `at_bat` | character | JSON-encoded data-island pointer to the game's current at-bat feed; baseball only. |
| `penalty_summary` | character |  |
| `scoring_summary` | character |  |
| `stat_categories` | character | JSON-encoded pointer to the stat-category dictionary that groups this feed's statistics. |
| `stadium` | character |  |
| `stadium_id` | character |  |
| `stadium_image` | character | JSON-encoded data-island pointer to the venue photograph used on the game page. |
| `attendance` | character |  |
| `lineups` | character | JSON-encoded data-island pointer to the game's lineup collection. |
| `top_performer` | character | JSON-encoded data-island pointer to the game's top-performing players. |
| `players` | character |  |
| `byline` | character |  |
| `highlight` | character | JSON-encoded data-island pointer to the game's highlight video. |
| `highlights` | character |  |
| `live_video` | character | JSON-encoded data-island pointer to the live video stream for the game. |
| `odds` | character | JSON-encoded data-island pointer to the game's odds collection. |
| `current_players` | character | JSON-encoded data-island pointer to the players currently on the field, ice or court. |
| `last_play` | character |  |
| `series_type` | character | JSON-encoded data-island pointer to the kind of series the game belongs to. |
| `series_status` | character | JSON-encoded data-island pointer to the current state of the series the game belongs to. |
| `games` | character |  |
| `series_games` | character | JSON-encoded data-island pointer to the games making up the series. |
| `game_details` | character | JSON-encoded data-island pointer to supplementary detail notes for the game. |
| `section_notes` | character | JSON-encoded data-island pointer to editorial section notes attached to the game page. |
| `articles` | character | JSON-encoded data-island pointer to the editorial articles attached to the game. |
| `tweets` | character | JSON-encoded data-island pointer to the social posts attached to the game page. |
| `playoff_round` | character |  |
| `media_stream` | character | JSON-encoded data-island pointer to the game's media-stream collection. |
| `playoff_series_status` | character | JSON-encoded data-island pointer to the current state of the playoff series the game belongs to. |
| `playoff_series_details` | character | JSON-encoded data-island pointer to detail about the playoff series the game belongs to. |
| `drives` | character | JSON-encoded data-island pointer to the game's drive collection; football only. |
| `user_teams_game` | character | JSON-encoded data-island pointer to the viewer's followed-team context for the game. |
| `page_metadata` | character | JSON-encoded data-island pointer to the SEO and page metadata for the entity. |
| `penalty_box` | character | JSON-encoded data-island pointer to the game's penalty-box feed; hockey only. |
| `starting_pitchers` | character | JSON-encoded data-island pointer to the game's announced starting pitchers; baseball only. |
| `unrestricted_streams` | character | JSON-encoded data-island pointer to the streams viewable without a subscription. |
| `tv_details` | character | JSON-encoded list of broadcast entries for the game, each carrying a network abbreviation and full channel name (e.g., [\{"abbr": "NBC", "name": "NBC/Peacock"\}]). |
| `away_seed` | character |  |
| `home_seed` | character |  |
| `navigation_links_tickets_url` | character | Affiliate ticket-purchase URL for the game, pointing at the SeatGeek marketplace. |
| `navigation_links_boxscore_url` | character | Site-relative URL of the game's boxscore page on sports.yahoo.com. |
| `navigation_links_match_page_url` | character | Site-relative URL of the game's match page on sports.yahoo.com. |
| `navigation_links_league_home_url` | character | Site-relative URL of the league's home page on sports.yahoo.com. |
| `navigation_links_league_scores_url` | character | Site-relative URL of the league's scoreboard page on sports.yahoo.com. |
| `provider_coverage_score_update_frequency_in_minutes` | character | How often, in minutes, the data provider refreshes the score for this game. |
| `provider_coverage_has_plays` | character | Flag indicating that the data provider supplies play-by-play for this game. |
| `provider_coverage_has_stats` | character | Flag indicating that the data provider supplies box-score statistics for this game. |
| `provider_coverage_has_extended_stats` | character | Flag indicating that the data provider supplies extended statistics beyond the standard box score. |
| `provider_coverage_has_final_stats` | character | Flag indicating that the data provider has published final, official statistics for the game. |

_Rows are untyped `Row[]` (not parity-verified yet)._

## Native API — Yahoo Sports

Flat (non-ESPN) wrappers for the Yahoo Sports stats API. Host: `https://graphite-secure.sports.yahoo.com/v1/query/shangrila`. Each method is exposed under BOTH its snake_case name `yahoo_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.yahoo`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `yahoo_alias` / `yahooAlias` *(was `yahoo_shangrila_alias`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/alias` | — | `alias` | `parse_yahoo_list` | — |
| `yahoo_article_list_card_players` / `yahooArticleListCardPlayers` *(was `yahoo_shangrila_article_list_card_players`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/articleListCardPlayers` | — | `player_ids` → `playerIds` | `parse_yahoo_list` | — |
| `yahoo_article_list_card_teams` / `yahooArticleListCardTeams` *(was `yahoo_shangrila_article_list_card_teams`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/articleListCardTeams` | — | `team_ids` → `teamIds` | `parse_yahoo_list` | — |
| `yahoo_basic_players` / `yahooBasicPlayers` *(was `yahoo_shangrila_basic_players`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/basicPlayers` | — | `players` | `parse_yahoo_list` | — |
| `yahoo_betting_disclaimer` / `yahooBettingDisclaimer` *(was `yahoo_shangrila_betting_disclaimer`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/bettingDisclaimer` | — | `betting_disclaimer_id` → `bettingDisclaimerId` | `parse_yahoo_list` | — |
| `yahoo_combat_event_fights` / `yahooCombatEventFights` *(was `yahoo_shangrila_combat_event_fights`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/combatEventFights` | — | `event_group_id` → `eventGroupId`, `season`, `league` | `parse_yahoo_list` | — |
| `yahoo_combat_schedule` / `yahooCombatSchedule` *(was `yahoo_shangrila_combat_schedule`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/combatSchedule` | — | `season`, `league` | `parse_yahoo_list` | — |
| `yahoo_common_pills` / `yahooCommonPills` *(was `yahoo_shangrila_common_pills`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/common/pills` | — | `add_team_logos` → `addTeamLogos`, `date`, `team_ids` → `teamIds` | `parse_yahoo_list` | — |
| `yahoo_consensus_rankings_php` / `yahooConsensusRankingsPhp` *(was `yahoo_shangrila_consensus_rankings_php`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/consensus-rankings.php` | — | `sport`, `position`, `filters`, `experts`, `scoring`, `type` | `parse_yahoo_list` | — |
| `yahoo_draft` / `yahooDraft` *(was `yahoo_shangrila_draft`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/draft` | — | `league`, `season` | `parse_yahoo_list` | — |
| `yahoo_draft_prospects` / `yahooDraftProspects` *(was `yahoo_shangrila_draft_prospects`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/draftProspects` | — | `league`, `season`, `image_height` → `imageHeight`, `image_width` → `imageWidth` | `parse_yahoo_list` | — |
| `yahoo_driver_results` / `yahooDriverResults` *(was `yahoo_shangrila_driver_results`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/driverResults` | — | `player_id` → `playerId`, `season` | `parse_yahoo_list` | — |
| `yahoo_driver_splits` / `yahooDriverSplits` *(was `yahoo_shangrila_driver_splits`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/driverSplits` | — | `player_id` → `playerId` | `parse_yahoo_list` | — |
| `yahoo_editorial_boxscore` / `yahooEditorialBoxscore` | `https://api-secure.sports.yahoo.com/v1/editorial/s/boxscore/{game_id}` | `game_id`\* | `v`, `polling` | `parse_yahoo_scores_boxscore` | — |
| `yahoo_editorial_scoreboard` / `yahooEditorialScoreboard` | `https://api-secure.sports.yahoo.com/v1/editorial/s/scoreboard` | — | `leagues`, `week`, `season`, `conferences`, `count`, `v` | `parse_yahoo_scores_scoreboard` | — |
| `yahoo_featured_game_ids` / `yahooFeaturedGameIds` *(was `yahoo_shangrila_featured_game_ids`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/featuredGameIds` | — | — | `parse_yahoo_list` | — |
| `yahoo_game_prop_bets` / `yahooGamePropBets` *(was `yahoo_shangrila_game_prop_bets`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/gamePropBets` | — | `game_id` → `gameId` | `parse_yahoo_list` | — |
| `yahoo_game_stats_leaders` / `yahooGameStatsLeaders` *(was `yahoo_shangrila_game_stats_leaders`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/gameStatsLeaders` | — | `game_id` → `gameId`, `season`, `season_phases` → `seasonPhases`, `qualified`, `count`, `is_pregame` → `isPregame`, `team_image_height` → `teamImageHeight`, `team_image_width` → `teamImageWidth`, `player_image_height` → `playerImageHeight`, `player_image_width` → `playerImageWidth`, `baseball_leader_sort_stat0` → `baseballLeaderSortStat0`, `baseball_leader_sort_stat1` → `baseballLeaderSortStat1`, `baseball_leader_sort_stat2` → `baseballLeaderSortStat2`, `baseball_leader_sort_stat3` → `baseballLeaderSortStat3`, `baseball_leader_sort_stat4` → `baseballLeaderSortStat4`, `baseball_leader_stat_ids0` → `baseballLeaderStatIds0`, `baseball_leader_stat_ids1` → `baseballLeaderStatIds1`, `baseball_leader_stat_ids2` → `baseballLeaderStatIds2`, `baseball_leader_stat_ids3` → `baseballLeaderStatIds3`, `baseball_leader_stat_ids4` → `baseballLeaderStatIds4`, `baseball_player_stat_ids0` → `baseballPlayerStatIds0`, `baseball_player_stat_ids1` → `baseballPlayerStatIds1`, `baseball_team_sort_stat0` → `baseballTeamSortStat0`, `baseball_team_sort_stat1` → `baseballTeamSortStat1`, `baseball_team_sort_stat2` → `baseballTeamSortStat2`, `baseball_team_sort_stat3` → `baseballTeamSortStat3`, `baseball_team_sort_stat4` → `baseballTeamSortStat4`, `baseball_team_sort_stat5` → `baseballTeamSortStat5`, `baseball_team_sort_stat6` → `baseballTeamSortStat6`, `baseball_team_sort_stat7` → `baseballTeamSortStat7`, `baseball_team_sort_stat8` → `baseballTeamSortStat8`, `baseball_team_sort_stat9` → `baseballTeamSortStat9`, `baseball_team_sort_stat10` → `baseballTeamSortStat10`, `baseball_team_sort_stat11` → `baseballTeamSortStat11`, `baseball_team_stat_ids0` → `baseballTeamStatIds0`, `baseball_team_stat_ids1` → `baseballTeamStatIds1`, `baseball_team_stat_ids2` → `baseballTeamStatIds2`, `baseball_team_stat_ids3` → `baseballTeamStatIds3`, `baseball_team_stat_ids4` → `baseballTeamStatIds4`, `baseball_team_stat_ids5` → `baseballTeamStatIds5`, `baseball_team_stat_ids6` → `baseballTeamStatIds6`, `baseball_team_stat_ids7` → `baseballTeamStatIds7`, `baseball_team_stat_ids8` → `baseballTeamStatIds8`, `baseball_team_stat_ids9` → `baseballTeamStatIds9`, `baseball_team_stat_ids10` → `baseballTeamStatIds10`, `baseball_team_stat_ids11` → `baseballTeamStatIds11`, `basketball_leader_sort_stat0` → `basketballLeaderSortStat0`, `basketball_leader_sort_stat1` → `basketballLeaderSortStat1`, `basketball_leader_sort_stat2` → `basketballLeaderSortStat2`, `basketball_leader_sort_stat3` → `basketballLeaderSortStat3`, `basketball_leader_sort_stat4` → `basketballLeaderSortStat4`, `basketball_leader_stat_ids0` → `basketballLeaderStatIds0`, `basketball_leader_stat_ids1` → `basketballLeaderStatIds1`, `basketball_leader_stat_ids2` → `basketballLeaderStatIds2`, `basketball_leader_stat_ids3` → `basketballLeaderStatIds3`, `basketball_leader_stat_ids4` → `basketballLeaderStatIds4`, `basketball_player_stat_ids0` → `basketballPlayerStatIds0`, `basketball_team_sort_stat0` → `basketballTeamSortStat0`, `basketball_team_sort_stat1` → `basketballTeamSortStat1`, `basketball_team_sort_stat2` → `basketballTeamSortStat2`, `basketball_team_sort_stat3` → `basketballTeamSortStat3`, `basketball_team_sort_stat4` → `basketballTeamSortStat4`, `basketball_team_sort_stat5` → `basketballTeamSortStat5`, `basketball_team_sort_stat6` → `basketballTeamSortStat6`, `basketball_team_sort_stat7` → `basketballTeamSortStat7`, `basketball_team_sort_stat8` → `basketballTeamSortStat8`, `basketball_team_sort_stat9` → `basketballTeamSortStat9`, `basketball_team_stat_ids0` → `basketballTeamStatIds0`, `basketball_team_stat_ids1` → `basketballTeamStatIds1`, `basketball_team_stat_ids2` → `basketballTeamStatIds2`, `basketball_team_stat_ids3` → `basketballTeamStatIds3`, `basketball_team_stat_ids4` → `basketballTeamStatIds4`, `basketball_team_stat_ids5` → `basketballTeamStatIds5`, `basketball_team_stat_ids6` → `basketballTeamStatIds6`, `basketball_team_stat_ids7` → `basketballTeamStatIds7`, `basketball_team_stat_ids8` → `basketballTeamStatIds8`, `basketball_team_stat_ids9` → `basketballTeamStatIds9`, `football_leader_sort_stat0` → `footballLeaderSortStat0`, `football_leader_sort_stat1` → `footballLeaderSortStat1`, `football_leader_sort_stat2` → `footballLeaderSortStat2`, `football_leader_sort_stat3` → `footballLeaderSortStat3`, `football_leader_stat_ids0` → `footballLeaderStatIds0`, `football_leader_stat_ids1` → `footballLeaderStatIds1`, `football_leader_stat_ids2` → `footballLeaderStatIds2`, `football_leader_stat_ids3` → `footballLeaderStatIds3`, `football_player_stat_ids0` → `footballPlayerStatIds0`, `football_player_stat_ids1` → `footballPlayerStatIds1`, `football_player_stat_ids2` → `footballPlayerStatIds2`, `football_player_stat_ids3` → `footballPlayerStatIds3`, `football_player_stat_ids4` → `footballPlayerStatIds4`, `football_player_stat_ids5` → `footballPlayerStatIds5`, `football_player_stat_ids6` → `footballPlayerStatIds6`, `football_player_stat_ids7` → `footballPlayerStatIds7`, `football_team_sort_stat0` → `footballTeamSortStat0`, `football_team_sort_stat1` → `footballTeamSortStat1`, `football_team_sort_stat2` → `footballTeamSortStat2`, `football_team_sort_stat3` → `footballTeamSortStat3`, `football_team_sort_stat4` → `footballTeamSortStat4`, `football_team_sort_stat5` → `footballTeamSortStat5`, `football_team_sort_stat6` → `footballTeamSortStat6`, `football_team_sort_stat7` → `footballTeamSortStat7`, `football_team_sort_stat8` → `footballTeamSortStat8`, `football_team_sort_stat9` → `footballTeamSortStat9`, `football_team_sort_stat10` → `footballTeamSortStat10`, `football_team_sort_stat11` → `footballTeamSortStat11`, `football_team_stat_ids0` → `footballTeamStatIds0`, `football_team_stat_ids1` → `footballTeamStatIds1`, `football_team_stat_ids2` → `footballTeamStatIds2`, `football_team_stat_ids3` → `footballTeamStatIds3`, `football_team_stat_ids4` → `footballTeamStatIds4`, `football_team_stat_ids5` → `footballTeamStatIds5`, `football_team_stat_ids6` → `footballTeamStatIds6`, `football_team_stat_ids7` → `footballTeamStatIds7`, `football_team_stat_ids8` → `footballTeamStatIds8`, `football_team_stat_ids9` → `footballTeamStatIds9`, `football_team_stat_ids10` → `footballTeamStatIds10`, `football_team_stat_ids11` → `footballTeamStatIds11`, `hockey_leader_sort_stat0` → `hockeyLeaderSortStat0`, `hockey_leader_sort_stat1` → `hockeyLeaderSortStat1`, `hockey_leader_sort_stat2` → `hockeyLeaderSortStat2`, `hockey_leader_sort_stat3` → `hockeyLeaderSortStat3`, `hockey_leader_stat_ids0` → `hockeyLeaderStatIds0`, `hockey_leader_stat_ids1` → `hockeyLeaderStatIds1`, `hockey_leader_stat_ids2` → `hockeyLeaderStatIds2`, `hockey_leader_stat_ids3` → `hockeyLeaderStatIds3`, `hockey_player_stat_ids0` → `hockeyPlayerStatIds0`, `hockey_player_stat_ids1` → `hockeyPlayerStatIds1`, `hockey_player_stat_ids2` → `hockeyPlayerStatIds2`, `hockey_team_sort_stat0` → `hockeyTeamSortStat0`, `hockey_team_sort_stat1` → `hockeyTeamSortStat1`, `hockey_team_sort_stat2` → `hockeyTeamSortStat2`, `hockey_team_sort_stat3` → `hockeyTeamSortStat3`, `hockey_team_sort_stat4` → `hockeyTeamSortStat4`, `hockey_team_sort_stat5` → `hockeyTeamSortStat5`, `hockey_team_sort_stat6` → `hockeyTeamSortStat6`, `hockey_team_stat_ids0` → `hockeyTeamStatIds0`, `hockey_team_stat_ids1` → `hockeyTeamStatIds1`, `hockey_team_stat_ids2` → `hockeyTeamStatIds2`, `hockey_team_stat_ids3` → `hockeyTeamStatIds3`, `hockey_team_stat_ids4` → `hockeyTeamStatIds4`, `hockey_team_stat_ids5` → `hockeyTeamStatIds5`, `hockey_team_stat_ids6` → `hockeyTeamStatIds6`, `soccer_player_stat_ids0` → `soccerPlayerStatIds0`, `soccer_player_stat_ids1` → `soccerPlayerStatIds1`, `soccer_player_stat_ids2` → `soccerPlayerStatIds2`, `soccer_player_stat_ids3` → `soccerPlayerStatIds3`, `soccer_player_stat_ids4` → `soccerPlayerStatIds4`, `soccer_team_sort_stat0` → `soccerTeamSortStat0`, `soccer_team_sort_stat1` → `soccerTeamSortStat1`, `soccer_team_sort_stat2` → `soccerTeamSortStat2`, `soccer_team_sort_stat3` → `soccerTeamSortStat3`, `soccer_team_sort_stat4` → `soccerTeamSortStat4`, `soccer_team_sort_stat5` → `soccerTeamSortStat5`, `soccer_team_stat_ids0` → `soccerTeamStatIds0`, `soccer_team_stat_ids1` → `soccerTeamStatIds1`, `soccer_team_stat_ids2` → `soccerTeamStatIds2`, `soccer_team_stat_ids3` → `soccerTeamStatIds3`, `soccer_team_stat_ids4` → `soccerTeamStatIds4`, `soccer_team_stat_ids5` → `soccerTeamStatIds5` | `parse_yahoo_stats` | — |
| `yahoo_gametime_game` / `yahooGametimeGame` *(was `yahoo_shangrila_gametime_game`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/gametimeGame` | — | `game_id` → `gameId` | `parse_yahoo_list` | — |
| `yahoo_gametime_team` / `yahooGametimeTeam` *(was `yahoo_shangrila_gametime_team`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/gametimeTeam` | — | `team_id` → `teamId` | `parse_yahoo_list` | — |
| `yahoo_golf_tournament_seasons` / `yahooGolfTournamentSeasons` *(was `yahoo_shangrila_golf_tournament_seasons`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/golfTournamentSeasons` | — | `event_group_id` → `eventGroupId` | `parse_yahoo_list` | — |
| `yahoo_golf_tournaments` / `yahooGolfTournaments` *(was `yahoo_shangrila_golf_tournaments`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/golfTournaments` | — | `association`, `season`, `show_defending_champs` → `showDefendingChamps` | `parse_yahoo_list` | — |
| `yahoo_golf_tournaments_basic` / `yahooGolfTournamentsBasic` *(was `yahoo_shangrila_golf_tournaments_basic`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/golfTournamentsBasic` | — | `event_group_id` → `eventGroupId`, `association`, `season` | `parse_yahoo_list` | — |
| `yahoo_league_conferences` / `yahooLeagueConferences` *(was `yahoo_shangrila_league_conferences`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueConferences` | — | `league`, `division_ids` → `divisionIds` | `parse_yahoo_list` | — |
| `yahoo_league_filters_data` / `yahooLeagueFiltersData` *(was `yahoo_shangrila_league_filters_data`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueFiltersData` | — | `league`, `season`, `view_type` → `viewType`, `include_pos_and_splits_data` → `includePosAndSplitsData` | `parse_yahoo_list` | — |
| `yahoo_league_future_odds` / `yahooLeagueFutureOdds` *(was `yahoo_shangrila_league_future_odds`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueFutureOdds` | — | `league`, `bet_categories` → `betCategories` | `parse_yahoo_list` | — |
| `yahoo_league_game_ids` / `yahooLeagueGameIds` *(was `yahoo_shangrila_league_game_ids`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueGameIds` | — | `count`, `league`, `week`, `date`, `season`, `game_status_order` → `gameStatusOrder`, `start_time_order` → `startTimeOrder`, `date_flip_offset` → `dateFlipOffset`, `season_phase` → `seasonPhase`, `conference_ids` → `conferenceIds`, `top25`, `game_day_query_type` → `gameDayQueryType` | `parse_yahoo_list` | — |
| `yahoo_league_game_ids_by_date` / `yahooLeagueGameIdsByDate` *(was `yahoo_shangrila_league_game_ids_by_date`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueGameIdsByDate` | — | `leagues`, `week`, `dates`, `start_range` → `startRange`, `end_range` → `endRange`, `season`, `season_phases` → `seasonPhases`, `conference_ids` → `conferenceIds`, `division_ids` → `divisionIds`, `top25`, `tournament_ids` → `tournamentIds`, `is_tennis` → `isTennis` | `parse_yahoo_list` | — |
| `yahoo_league_games_by_round` / `yahooLeagueGamesByRound` *(was `yahoo_shangrila_league_games_by_round`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueGamesByRound` | — | `league`, `tournament_round_ids` → `tournamentRoundIds`, `season` | `parse_yahoo_list` | — |
| `yahoo_league_info` / `yahooLeagueInfo` *(was `yahoo_shangrila_league_info`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueInfo` | — | `league` | `parse_yahoo_list` | — |
| `yahoo_league_injuries` / `yahooLeagueInjuries` *(was `yahoo_shangrila_league_injuries`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueInjuries` | — | `league_id` → `leagueId` | `parse_yahoo_list` | — |
| `yahoo_league_names` / `yahooLeagueNames` *(was `yahoo_shangrila_league_names`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueNames` | — | `leagues` | `parse_yahoo_list` | — |
| `yahoo_league_prop_odds` / `yahooLeaguePropOdds` *(was `yahoo_shangrila_league_prop_odds`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leaguePropOdds` | — | `count`, `league` | `parse_yahoo_list` | — |
| `yahoo_league_standings` / `yahooLeagueStandings` *(was `yahoo_shangrila_league_standings`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueStandings` | — | `league`, `season`, `season_phase` → `seasonPhase` | `parse_yahoo_list` | — |
| `yahoo_league_stats_by_team` / `yahooLeagueStatsByTeam` *(was `yahoo_shangrila_league_stats_by_team`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueStatsByTeam` | — | `leagues`, `count`, `season`, `league_structure_id` → `leagueStructureId`, `baseball_cut_type` → `baseballCutType`, `basketball_cut_type` → `basketballCutType`, `football_cut_type` → `footballCutType`, `hockey_cut_type` → `hockeyCutType` | `parse_yahoo_stats` | — |
| `yahoo_league_stats_individual` / `yahooLeagueStatsIndividual` *(was `yahoo_shangrila_league_stats_individual`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueStatsIndividual` | — | `leagues`, `count`, `season`, `qualified`, `league_structure_id` → `leagueStructureId`, `baseball_cut_type` → `baseballCutType`, `baseball_position` → `baseballPosition`, `basketball_cut_type` → `basketballCutType`, `basketball_position` → `basketballPosition`, `football_cut_type` → `footballCutType`, `hockey_cut_type` → `hockeyCutType`, `hockey_position` → `hockeyPosition`, `golf_sort_stat` → `golfSortStat`, `golf_stat_ids` → `golfStatIds`, `motorsports_sort_stat` → `motorsportsSortStat`, `motorsports_stat_ids` → `motorsportsStatIds` | `parse_yahoo_stats` | — |
| `yahoo_league_stats_overview` / `yahooLeagueStatsOverview` *(was `yahoo_shangrila_league_stats_overview`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueStatsOverview` | — | `leagues`, `count`, `week`, `week_season_phase` → `weekSeasonPhase`, `season_phase` → `seasonPhase`, `league_structure_id` → `leagueStructureId`, `golf_sort_stat` → `golfSortStat`, `golf_stat_ids` → `golfStatIds`, `motorsports_sort_stat` → `motorsportsSortStat`, `motorsports_stat_ids` → `motorsportsStatIds` | `parse_yahoo_stats` | — |
| `yahoo_league_stats_weekly` / `yahooLeagueStatsWeekly` *(was `yahoo_shangrila_league_stats_weekly`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueStatsWeekly` | — | `leagues`, `count`, `week`, `season`, `season_phase` → `seasonPhase` | `parse_yahoo_stats` | — |
| `yahoo_league_team_ids` / `yahooLeagueTeamIds` *(was `yahoo_shangrila_league_team_ids`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueTeamIds` | — | `league`, `division_ids` → `divisionIds`, `get_teams_by_division` → `getTeamsByDivision` | `parse_yahoo_list` | — |
| `yahoo_league_teams` / `yahooLeagueTeams` *(was `yahoo_shangrila_league_teams`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leagueTeams` | — | `league`, `season`, `division_ids` → `divisionIds`, `get_teams_by_division` → `getTeamsByDivision` | `parse_yahoo_list` | — |
| `yahoo_leagues_season_states` / `yahooLeaguesSeasonStates` *(was `yahoo_shangrila_leagues_season_states`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/leaguesSeasonStates` | — | `leagues` | `parse_yahoo_list` | — |
| `yahoo_module_game` / `yahooModuleGame` *(was `yahoo_shangrila_module_game`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/moduleGame` | — | `game_id` → `gameId`, `image_height` → `imageHeight`, `image_width` → `imageWidth` | `parse_yahoo_list` | — |
| `yahoo_motorsport_standings` / `yahooMotorsportStandings` *(was `yahoo_shangrila_motorsport_standings`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/motorsportStandings` | — | `league`, `season` | `parse_yahoo_list` | — |
| `yahoo_nascar_drivers` / `yahooNascarDrivers` *(was `yahoo_shangrila_nascar_drivers`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/nascarDrivers` | — | `league` | `parse_yahoo_list` | — |
| `yahoo_nav_dropdown_tray` / `yahooNavDropdownTray` *(was `yahoo_shangrila_nav_dropdown_tray`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/navDropdownTray` | — | `get_soccer_data` → `getSoccerData`, `soccer_league_ids` → `soccerLeagueIds`, `soccer_team_ids` → `soccerTeamIds` | `parse_yahoo_list` | — |
| `yahoo_oly_medal_count` / `yahooOlyMedalCount` *(was `yahoo_shangrila_oly_medal_count`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/OlyMedalCount` | — | `season`, `sort_method` → `sortMethod` | `parse_yahoo_list` | — |
| `yahoo_oly_seasons` / `yahooOlySeasons` *(was `yahoo_shangrila_oly_seasons`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/OlySeasons` | — | `seasons` | `parse_yahoo_list` | — |
| `yahoo_pick_distribution` / `yahooPickDistribution` *(was `yahoo_shangrila_pick_distribution`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/pickDistribution` | — | `league`, `dates`, `count` | `parse_yahoo_list` | — |
| `yahoo_playbook_boxscore` / `yahooPlaybookBoxscore` *(was `yahoo_shangrila_playbook_boxscore`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookBoxscore` | — | `game_id` → `gameId`, `standings_season_phases` → `standingsSeasonPhases`, `image_height` → `imageHeight`, `image_width` → `imageWidth`, `is_baseball` → `isBaseball`, `is_football` → `isFootball`, `is_pro_basketball` → `isProBasketball`, `is_college_basketball` → `isCollegeBasketball`, `is_hockey` → `isHockey`, `is_soccer` → `isSoccer`, `event_state` → `eventState` | `parse_yahoo_list` | — |
| `yahoo_playbook_boxscore_poll` / `yahooPlaybookBoxscorePoll` *(was `yahoo_shangrila_playbook_boxscore_poll`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookBoxscorePoll` | — | `game_id` → `gameId`, `standings_season_phases` → `standingsSeasonPhases`, `is_baseball` → `isBaseball`, `is_football` → `isFootball`, `is_pro_basketball` → `isProBasketball`, `is_college_basketball` → `isCollegeBasketball`, `is_hockey` → `isHockey`, `is_soccer` → `isSoccer`, `event_state` → `eventState` | `parse_yahoo_list` | — |
| `yahoo_playbook_boxscore_social_share` / `yahooPlaybookBoxscoreSocialShare` *(was `yahoo_shangrila_playbook_boxscore_social_share`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookBoxscoreSocialShare` | — | `game_id` → `gameId` | `parse_yahoo_list` | — |
| `yahoo_playbook_combat_match` / `yahooPlaybookCombatMatch` *(was `yahoo_shangrila_playbook_combat_match`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookCombatMatch` | — | `game_id` → `gameId`, `image_height` → `imageHeight`, `image_width` → `imageWidth`, `headshot_height` → `headshotHeight`, `headshot_width` → `headshotWidth` | `parse_yahoo_list` | — |
| `yahoo_playbook_game` / `yahooPlaybookGame` *(was `yahoo_shangrila_playbook_game`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookGame` | — | `game_id` → `gameId`, `image_height` → `imageHeight`, `image_width` → `imageWidth` | `parse_yahoo_list` | — |
| `yahoo_playbook_game_odds_poll` / `yahooPlaybookGameOddsPoll` *(was `yahoo_shangrila_playbook_game_odds_poll`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookGameOddsPoll` | — | `game_id` → `gameId`, `event_state` → `eventState` | `parse_yahoo_list` | — |
| `yahoo_playbook_golf_tournament` / `yahooPlaybookGolfTournament` *(was `yahoo_shangrila_playbook_golf_tournament`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookGolfTournament` | — | `game_id` → `gameId`, `season`, `count`, `stat_ids` → `statIds`, `show_hole_results` → `showHoleResults` | `parse_yahoo_list` | — |
| `yahoo_playbook_league_odds` / `yahooPlaybookLeagueOdds` *(was `yahoo_shangrila_playbook_league_odds`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookLeagueOdds` | — | `league`, `dates`, `count`, `start_time_filter` → `startTimeFilter`, `range_start_date` → `rangeStartDate`, `range_end_date` → `rangeEndDate` | `parse_yahoo_list` | — |
| `yahoo_playbook_player` / `yahooPlaybookPlayer` *(was `yahoo_shangrila_playbook_player`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookPlayer` | — | `player_id` → `playerId`, `season_phases` → `seasonPhases` | `parse_yahoo_list` | — |
| `yahoo_playbook_player_social_share` / `yahooPlaybookPlayerSocialShare` *(was `yahoo_shangrila_playbook_player_social_share`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookPlayerSocialShare` | — | `player_id` → `playerId` | `parse_yahoo_list` | — |
| `yahoo_playbook_race` / `yahooPlaybookRace` *(was `yahoo_shangrila_playbook_race`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookRace` | — | `game_id` → `gameId`, `player_image_height` → `playerImageHeight`, `player_image_width` → `playerImageWidth` | `parse_yahoo_list` | — |
| `yahoo_playbook_team` / `yahooPlaybookTeam` *(was `yahoo_shangrila_playbook_team`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookTeam` | — | `team_id` → `teamId`, `image_height` → `imageHeight`, `image_width` → `imageWidth`, `league_short_name` → `leagueShortName`, `disable_conference` → `disableConference`, `disable_division` → `disableDivision` | `parse_yahoo_list` | — |
| `yahoo_playbook_team_basic` / `yahooPlaybookTeamBasic` *(was `yahoo_shangrila_playbook_team_basic`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookTeamBasic` | — | `team_id` → `teamId`, `image_height` → `imageHeight`, `image_width` → `imageWidth` | `parse_yahoo_list` | — |
| `yahoo_playbook_team_social_share` / `yahooPlaybookTeamSocialShare` *(was `yahoo_shangrila_playbook_team_social_share`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookTeamSocialShare` | — | `team_id` → `teamId` | `parse_yahoo_list` | — |
| `yahoo_playbook_tennis_match` / `yahooPlaybookTennisMatch` *(was `yahoo_shangrila_playbook_tennis_match`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playbookTennisMatch` | — | `game_id` → `gameId` | `parse_yahoo_list` | — |
| `yahoo_player_basic` / `yahooPlayerBasic` *(was `yahoo_shangrila_player_basic`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playerBasic` | — | `league`, `player_id` → `playerId` | `parse_yahoo_list` | — |
| `yahoo_player_career_stats` / `yahooPlayerCareerStats` *(was `yahoo_shangrila_player_career_stats`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playerCareerStats` | — | `player_id` → `playerId`, `season_phases` → `seasonPhases`, `football_stat_ids` → `footballStatIds`, `basketball_stat_ids` → `basketballStatIds`, `baseball_stat_ids` → `baseballStatIds`, `hockey_stat_ids` → `hockeyStatIds`, `soccer_stat_ids` → `soccerStatIds` | `parse_yahoo_list` | — |
| `yahoo_player_game_log` / `yahooPlayerGameLog` *(was `yahoo_shangrila_player_game_log`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playerGameLog` | — | `player_id` → `playerId`, `count`, `seasons`, `season_phases` → `seasonPhases`, `football_stat_ids` → `footballStatIds`, `basketball_stat_ids` → `basketballStatIds`, `baseball_stat_ids` → `baseballStatIds`, `hockey_stat_ids` → `hockeyStatIds`, `soccer_stat_ids` → `soccerStatIds` | `parse_yahoo_list` | — |
| `yahoo_player_props` / `yahooPlayerProps` *(was `yahoo_shangrila_player_props`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playerProps` | — | `player_id` → `playerId` | `parse_yahoo_list` | — |
| `yahoo_player_search` / `yahooPlayerSearch` *(was `yahoo_shangrila_player_search`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playerSearch` | — | `league`, `name`, `on_active_roster_only` → `onActiveRosterOnly`, `nfl_position_id` → `nflPositionId`, `nba_position_id` → `nbaPositionId`, `mlb_position_id` → `mlbPositionId`, `nhl_position_id` → `nhlPositionId` | `parse_yahoo_list` | — |
| `yahoo_player_season_stats` / `yahooPlayerSeasonStats` *(was `yahoo_shangrila_player_season_stats`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playerSeasonStats` | — | `player_id` → `playerId`, `seasons`, `season_phases` → `seasonPhases`, `football_stat_ids` → `footballStatIds`, `football_cut_type_groups` → `footballCutTypeGroups`, `basketball_stat_ids` → `basketballStatIds`, `basketball_cut_type_groups` → `basketballCutTypeGroups`, `baseball_stat_ids` → `baseballStatIds`, `baseball_cut_type_groups` → `baseballCutTypeGroups`, `hockey_stat_ids` → `hockeyStatIds`, `hockey_cut_type_groups` → `hockeyCutTypeGroups`, `group_by_season_phase` → `groupBySeasonPhase`, `use_player_unique_id` → `usePlayerUniqueId` | `parse_yahoo_list` | — |
| `yahoo_playoff_bracket` / `yahooPlayoffBracket` *(was `yahoo_shangrila_playoff_bracket`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playoffBracket` | — | `league`, `season`, `tournament`, `type`, `playoff_rounds` → `playoffRounds` | `parse_yahoo_list` | — |
| `yahoo_playoff_series_game` / `yahooPlayoffSeriesGame` *(was `yahoo_shangrila_playoff_series_game`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/playoffSeriesGame` | — | `game_id` → `gameId` | `parse_yahoo_list` | — |
| `yahoo_polymarket_game` / `yahooPolymarketGame` *(was `yahoo_shangrila_polymarket_game`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/polymarketGame` | — | `game_id` → `gameId` | `parse_yahoo_list` | — |
| `yahoo_racing_schedule` / `yahooRacingSchedule` *(was `yahoo_shangrila_racing_schedule`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/racingSchedule` | — | `league`, `season`, `today`, `has_series` → `hasSeries` | `parse_yahoo_list` | — |
| `yahoo_scoreboard_game` / `yahooScoreboardGame` *(was `yahoo_shangrila_scoreboard_game`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/scoreboardGame` | — | `game_id` → `gameId`, `season`, `season_phase` → `seasonPhase`, `stat_leader_count` → `statLeaderCount`, `single_stat_leader` → `singleStatLeader`, `bet_event_state` → `betEventState` | `parse_yahoo_list` | — |
| `yahoo_season_stats_football_defense_ncaaf` / `yahooSeasonStatsFootballDefenseNcaaf` *(was `yahoo_shangrila_season_stats_football_defense_ncaaf`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonStatsFootballDefenseNcaaf` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_stats_football_kicking_ncaaf` / `yahooSeasonStatsFootballKickingNcaaf` *(was `yahoo_shangrila_season_stats_football_kicking_ncaaf`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonStatsFootballKickingNcaaf` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_stats_football_passing_ncaaf` / `yahooSeasonStatsFootballPassingNcaaf` *(was `yahoo_shangrila_season_stats_football_passing_ncaaf`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonStatsFootballPassingNcaaf` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_stats_football_punting_ncaaf` / `yahooSeasonStatsFootballPuntingNcaaf` *(was `yahoo_shangrila_season_stats_football_punting_ncaaf`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonStatsFootballPuntingNcaaf` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_stats_football_receiving_ncaaf` / `yahooSeasonStatsFootballReceivingNcaaf` *(was `yahoo_shangrila_season_stats_football_receiving_ncaaf`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonStatsFootballReceivingNcaaf` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_stats_football_returns_ncaaf` / `yahooSeasonStatsFootballReturnsNcaaf` *(was `yahoo_shangrila_season_stats_football_returns_ncaaf`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonStatsFootballReturnsNcaaf` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_stats_football_rushing_ncaaf` / `yahooSeasonStatsFootballRushingNcaaf` *(was `yahoo_shangrila_season_stats_football_rushing_ncaaf`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonStatsFootballRushingNcaaf` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_defense` / `yahooSeasonTeamStatsFootballDefense` *(was `yahoo_shangrila_season_team_stats_football_defense`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballDefense` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_kicking` / `yahooSeasonTeamStatsFootballKicking` *(was `yahoo_shangrila_season_team_stats_football_kicking`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballKicking` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_kickoffs` / `yahooSeasonTeamStatsFootballKickoffs` *(was `yahoo_shangrila_season_team_stats_football_kickoffs`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballKickoffs` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_offense` / `yahooSeasonTeamStatsFootballOffense` *(was `yahoo_shangrila_season_team_stats_football_offense`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballOffense` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_passing` / `yahooSeasonTeamStatsFootballPassing` *(was `yahoo_shangrila_season_team_stats_football_passing`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballPassing` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_passing_defense` / `yahooSeasonTeamStatsFootballPassingDefense` *(was `yahoo_shangrila_season_team_stats_football_passing_defense`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballPassingDefense` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_punting` / `yahooSeasonTeamStatsFootballPunting` *(was `yahoo_shangrila_season_team_stats_football_punting`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballPunting` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_receiving` / `yahooSeasonTeamStatsFootballReceiving` *(was `yahoo_shangrila_season_team_stats_football_receiving`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballReceiving` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_receiving_defense` / `yahooSeasonTeamStatsFootballReceivingDefense` *(was `yahoo_shangrila_season_team_stats_football_receiving_defense`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballReceivingDefense` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_returns` / `yahooSeasonTeamStatsFootballReturns` *(was `yahoo_shangrila_season_team_stats_football_returns`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballReturns` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_rushing` / `yahooSeasonTeamStatsFootballRushing` *(was `yahoo_shangrila_season_team_stats_football_rushing`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballRushing` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_season_team_stats_football_rushing_defense` / `yahooSeasonTeamStatsFootballRushingDefense` *(was `yahoo_shangrila_season_team_stats_football_rushing_defense`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/seasonTeamStatsFootballRushingDefense` | — | `season`, `league`, `league_structure` → `leagueStructure`, `count`, `sort_stat_id` → `sortStatId` | `parse_yahoo_stats` | — |
| `yahoo_team_injuries` / `yahooTeamInjuries` *(was `yahoo_shangrila_team_injuries`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/teamInjuries` | — | `team_id` → `teamId` | `parse_yahoo_list` | — |
| `yahoo_team_playoff_series` / `yahooTeamPlayoffSeries` *(was `yahoo_shangrila_team_playoff_series`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/teamPlayoffSeries` | — | `team_id` → `teamId`, `season` | `parse_yahoo_list` | — |
| `yahoo_team_roster` / `yahooTeamRoster` *(was `yahoo_shangrila_team_roster`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/teamRoster` | — | `team_id` → `teamId`, `player_image_height` → `playerImageHeight`, `player_image_width` → `playerImageWidth` | `parse_yahoo_list` | — |
| `yahoo_team_schedule_by_season` / `yahooTeamScheduleBySeason` *(was `yahoo_shangrila_team_schedule_by_season`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/teamScheduleBySeason` | — | `season`, `team_id` → `teamId` | `parse_yahoo_list` | — |
| `yahoo_team_search` / `yahooTeamSearch` *(was `yahoo_shangrila_team_search`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/teamSearch` | — | `name`, `image_height` → `imageHeight`, `image_width` → `imageWidth` | `parse_yahoo_list` | — |
| `yahoo_team_stats_leaders_v2` / `yahooTeamStatsLeadersV2` *(was `yahoo_shangrila_team_stats_leaders_v2`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/teamStatsLeadersV2` | — | `league`, `team_id` → `teamId`, `count`, `season`, `baseball_cut_type` → `baseballCutType`, `qualified`, `include_team_stats` → `includeTeamStats`, `include_player_stats` → `includePlayerStats`, `is_baseball` → `isBaseball` | `parse_yahoo_stats` | — |
| `yahoo_team_transactions` / `yahooTeamTransactions` *(was `yahoo_shangrila_team_transactions`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/teamTransactions` | — | `team_id` → `teamId` | `parse_yahoo_list` | — |
| `yahoo_teams_basic` / `yahooTeamsBasic` *(was `yahoo_shangrila_teams_basic`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/teamsBasic` | — | `team_ids` → `teamIds`, `image_height` → `imageHeight`, `image_width` → `imageWidth` | `parse_yahoo_list` | — |
| `yahoo_tennis_matches_by_date` / `yahooTennisMatchesByDate` *(was `yahoo_shangrila_tennis_matches_by_date`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/tennisMatchesByDate` | — | `tournament_id` → `tournamentId`, `season`, `date` | `parse_yahoo_list` | — |
| `yahoo_tennis_tournament` / `yahooTennisTournament` *(was `yahoo_shangrila_tennis_tournament`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/tennisTournament` | — | `tournament_id` → `tournamentId`, `season` | `parse_yahoo_list` | — |
| `yahoo_tennis_tournaments` / `yahooTennisTournaments` *(was `yahoo_shangrila_tennis_tournaments`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/tennisTournaments` | — | `league_id` → `leagueId`, `match_type` → `matchType`, `season` | `parse_yahoo_list` | — |
| `yahoo_tennis_tournaments_by_date` / `yahooTennisTournamentsByDate` *(was `yahoo_shangrila_tennis_tournaments_by_date`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/tennisTournamentsByDate` | — | `season`, `date` | `parse_yahoo_list` | — |
| `yahoo_trending_event_ids` / `yahooTrendingEventIds` *(was `yahoo_shangrila_trending_event_ids`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/trendingEventIds` | — | `count`, `league`, `date_flip_offset` → `dateFlipOffset` | `parse_yahoo_list` | — |
| `yahoo_trending_game_ids` / `yahooTrendingGameIds` *(was `yahoo_shangrila_trending_game_ids`)* | `https://graphite-secure.sports.yahoo.com/v1/query/shangrila/trendingGameIds` | — | `count`, `league`, `date_flip_offset` → `dateFlipOffset`, `dates` | `parse_yahoo_list` | — |

### Returns — `yahoo_article_list_card_players` / `yahooArticleListCardPlayers`

| col_name | type | description |
|---|---|---|
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `alias_lang` | character | Language/locale tag attached to the entity's Yahoo alias (e.g., "en-US"). |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_domain` | character | Host the entity's Yahoo alias resolves against (e.g., "sports.yahoo.com"). |
| `player_id` | character |  |
| `display_name` | character |  |
| `short_display_name` | character |  |
| `player_cutout` | character | JSON-encoded image node for the player's transparent cut-out portrait. |
| `team_alias` | character | JSON-encoded alias object for the entity's team, carrying its Yahoo page URL and path. |
| `team_display_name` | character |  |
| `team_primary_color` | character | Primary brand color of the entity's team, as a hex RGB string without the leading hash. |
| `team_secondary_color` | character | Secondary brand color of the entity's team, as a hex RGB string without the leading hash. |
| `team_team_id` | character |  |
| `team_team_logo_white` | character | JSON-encoded image node for the team's white knockout logo. |
| `team_team_logo` | character | JSON-encoded image node for the team's standard logo. |
| `team_gametime_ticket_url` | character | Gametime affiliate ticket-purchase URL for the team's home games. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_article_list_card_teams` / `yahooArticleListCardTeams`

| col_name | type | description |
|---|---|---|
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `alias_lang` | character | Language/locale tag attached to the entity's Yahoo alias (e.g., "en-US"). |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_domain` | character | Host the entity's Yahoo alias resolves against (e.g., "sports.yahoo.com"). |
| `display_name` | character |  |
| `nickname` | character |  |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `team_id` | character |  |
| `team_logo_white_width` | character | Pixel width of the team's white knockout logo image. |
| `team_logo_white_last_updated` | character | Timestamp at which the team's white knockout logo asset was last refreshed. |
| `team_logo_white_image_type` | character | File format of the team's white knockout logo asset (e.g., "png"). |
| `team_logo_white_url` | character | Absolute URL of the team's white knockout logo, the variant used on dark backgrounds. |
| `team_logo_white_height` | character | Pixel height of the team's white knockout logo image. |
| `team_logo_white_team_id` | character | Yahoo composite team id the white knockout logo asset belongs to. |
| `team_logo_width` | character | Pixel width of the team's standard logo image. |
| `team_logo_last_updated` | character | Timestamp at which the team's standard logo asset was last refreshed. |
| `team_logo_image_type` | character | File format of the team's standard logo asset (e.g., "png"). |
| `team_logo_url` | character | Absolute URL of the team's standard logo image on Yahoo's image CDN. |
| `team_logo_height` | character | Pixel height of the team's standard logo image. |
| `team_logo_team_id` | character | Yahoo composite team id the standard logo asset belongs to. |
| `gametime_ticket_url` | character | Gametime affiliate ticket-purchase URL for the event or team. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_basic_players` / `yahooBasicPlayers`

| col_name | type | description |
|---|---|---|
| `player_id` | character |  |
| `display_name` | character |  |
| `suggested_headshot` | character | JSON-encoded image node for the headshot Yahoo recommends for this player. |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_betting_disclaimer` / `yahooBettingDisclaimer`

| col_name | type | description |
|---|---|---|
| `disclaimer_id` | character | Identifier of the responsible-gambling disclaimer block to render alongside the odds. |
| `text` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_combat_event_fights` / `yahooCombatEventFights`

| col_name | type | description |
|---|---|---|
| `short_name` | character |  |
| `full_name` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_combat_schedule` / `yahooCombatSchedule`

| col_name | type | description |
|---|---|---|
| `short_name` | character |  |
| `full_name` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_editorial_boxscore` / `yahooEditorialBoxscore`

| col_name | type | description |
|---|---|---|
| `entity_id` | character | Composite Yahoo id this editorial row was keyed under, surfaced from the collection map key (e.g., "ncaaf.g.202509200023" for a game, "ncaaf.t.29" for a team); always carried as Utf8. |
| `sub_id` | character | Second-level key of an id-keyed editorial collection, present when one entity holds many sub-records — a play id, a scoring-play id, or a stat variation such as "ncaaf.stat_variation.2". |
| `ncaaf_stat_type_102` | character | Value recorded for the "Completions" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.102, abbreviated "Comp"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_103` | character | Value recorded for the "Attempts" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.103, abbreviated "Att"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_105` | character | Value recorded for the "Yards" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.105, abbreviated "Yds"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_104` | character | Value recorded for the "Completion Percentage" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.104, abbreviated "Pct"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_106` | character | Value recorded for the "Yards per Attempt" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.106, abbreviated "Y/A"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_111` | character | Value recorded for the "Sacks" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.111, abbreviated "Sack"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_112` | character | Value recorded for the "Yards Lost" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.112, abbreviated "YdsL"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_108` | character | Value recorded for the "Touchdowns" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.108, abbreviated "TD"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_109` | character | Value recorded for the "Interceptions" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.109, abbreviated "Int"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_113` | character | Value recorded for the "QB Rating" statistic in Yahoo's Passing category (stat type ncaaf.stat_type.113, abbreviated "QBRat"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_202` | character | Value recorded for the "Rushes" statistic in Yahoo's Rushing category (stat type ncaaf.stat_type.202, abbreviated "Rush"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_203` | character | Value recorded for the "Yards" statistic in Yahoo's Rushing category (stat type ncaaf.stat_type.203, abbreviated "Yds"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_205` | character | Value recorded for the "Average" statistic in Yahoo's Rushing category (stat type ncaaf.stat_type.205, abbreviated "Avg"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_206` | character | Value recorded for the "Longest" statistic in Yahoo's Rushing category (stat type ncaaf.stat_type.206, abbreviated "Long"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_207` | character | Value recorded for the "Touchdowns" statistic in Yahoo's Rushing category (stat type ncaaf.stat_type.207, abbreviated "TD"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_411` | character | Value recorded for the "Extra Points Made" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.411, abbreviated "XPM"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_412` | character | Value recorded for the "Extra Points Attempted" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.412, abbreviated "XPA"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_407` | character | Value recorded for the "Total Made" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.407, abbreviated "FGM"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_408` | character | Value recorded for the "Total Attempted" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.408, abbreviated "FGA"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_410` | character | Value recorded for the "Long" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.410, abbreviated "Long"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_409` | character | Value recorded for the "Percent" statistic in Yahoo's Kicking category (stat type ncaaf.stat_type.409, abbreviated "Pct"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_502` | character | Value recorded for the "Kickoff Returns" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.502, abbreviated "KR"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_503` | character | Value recorded for the "Yards" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.503, abbreviated "Yds"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_505` | character | Value recorded for the "Average" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.505, abbreviated "Avg"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_506` | character | Value recorded for the "Longest" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.506, abbreviated "Long"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_507` | character | Value recorded for the "Touchdowns" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.507, abbreviated "TD"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_508` | character | Value recorded for the "Punt Returns" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.508, abbreviated "PR"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_509` | character | Value recorded for the "Yards" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.509, abbreviated "Yds"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_511` | character | Value recorded for the "Average" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.511, abbreviated "Avg"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_512` | character | Value recorded for the "Longest" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.512, abbreviated "Long"), for the player or team on this boxscore row. |
| `ncaaf_stat_type_513` | character | Value recorded for the "Touchdowns" statistic in Yahoo's Returns category (stat type ncaaf.stat_type.513, abbreviated "TD"), for the player or team on this boxscore row. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_editorial_scoreboard` / `yahooEditorialScoreboard`

| col_name | type | description |
|---|---|---|
| `entity_id` | character | Composite Yahoo id this editorial row was keyed under, surfaced from the collection map key (e.g., "ncaaf.g.202509200023" for a game, "ncaaf.t.29" for a team); always carried as Utf8. |
| `gameid` | character | Date-encoded Yahoo composite game id for this row (e.g., "ncaaf.g.202509200023"). |
| `global_gameid` | character | Yahoo cross-provider game id, distinct from the date-encoded gameid (e.g., "ncaaf.g.13556882"). |
| `start_time` | character |  |
| `is_time_tba` | logical | Flag indicating that the scheduled start time has not yet been announced. |
| `season_phase_id` | character | Identifier of the season phase the game falls in (e.g., "season.phase.season"). |
| `game_type` | character |  |
| `winning_team_id` | character | Composite Yahoo team id of the side that won the game (e.g., "ncaaf.t.29"). |
| `is_rank_upset` | character | Flag indicating that the lower-ranked side won, judged against the teams' poll rankings. |
| `is_spread_upset` | character | Flag indicating that the winning side was the betting underdog against the closing spread. |
| `outcome_type` | character | Outcome classification for a completed game (e.g., "outcome.type.won", "outcome.type.tied"). |
| `home_team_id` | character | Home team ESPN id. |
| `away_team_id` | character | Away team ESPN id. |
| `week_number` | character |  |
| `sportacular_url` | character | Deep link into the Yahoo Sportacular mobile app for this game (a "ysportacular://" URL). |
| `status_display_name` | character | Short game or event status as shown on the scoreboard (e.g., "Final", "12:00 pm ET"). |
| `status_description` | character |  |
| `status_type` | character |  |
| `total_away_points` | character | Points scored by the away team in the game. |
| `current_period_id` | character | Ordinal number of the period currently in progress, counting from 1. |
| `total_home_points` | character | Points scored by the home team in the game. |
| `total_away_shootout_points` | character | Shootout goals converted by the away team, populated only for sports that break ties by shootout. |
| `total_home_shootout_points` | character | Shootout goals converted by the home team, populated only for sports that break ties by shootout. |
| `home_team_stats` | character | JSON-encoded team-stat block for the home team, populated once the game is under way. |
| `away_team_stats` | character | JSON-encoded team-stat block for the away team, populated once the game is under way. |
| `game_period_balls` | character | Balls in the count for the at-bat in progress; baseball only. |
| `game_period_strikes` | character | Strikes in the count for the at-bat in progress; baseball only. |
| `game_period_outs` | character | Outs recorded so far in the current half-inning; baseball only. |
| `yards_to_endzone` | character | Distance from the current ball spot to the opponent's goal line, in yards. |
| `start_yardline` | character |  |
| `distance` | character |  |
| `down` | character |  |
| `team_in_possession` | character | Yahoo team id of the side currently in possession of the ball. |
| `power_play_strength_home` | character | Number of skaters the home team has on the ice during special-teams play; hockey only. |
| `power_play_strength_away` | character | Number of skaters the away team has on the ice during special-teams play; hockey only. |
| `game_time_elapsed` | character | Playing time elapsed in the game, in seconds. |
| `game_time_elapsed_display` | character | Playing time elapsed formatted for display (e.g., "67:12"), used by sports whose clock counts up. |
| `inning_status` | character | Half-inning indicator for a game in progress (e.g., "Top", "Bottom"); baseball only. |
| `away_timeouts` | character |  |
| `home_timeouts` | character |  |
| `is_halftime` | character | Flag indicating that the game is currently stopped at halftime. |
| `minimum_periods` | character | Number of periods a game of this sport runs before overtime is required (4 for football, 9 for baseball). |
| `game_periods` | character | JSON-encoded list of the game's period nodes, each carrying a period number and its display names. |
| `baserunners` | character | JSON-encoded baserunner occupancy for the game in progress; baseball only. |
| `season` | character |  |
| `subleague` | character | Sub-league the game belongs to, for leagues split into constituent circuits. |
| `subleague_display_name` | character | Display name of the sub-league the game belongs to. |
| `agg_score` | character | Aggregate score across the legs of a two-leg tie, populated only for competitions decided on aggregate. |
| `leg_number` | character | Ordinal of this leg within a multi-leg tie, counting from 1. |
| `tv_coverage` | character | Network carrying the game, as a short broadcast abbreviation (e.g., "CBS", "ESPN"). |
| `seatgeek_id` | character | SeatGeek performer or event identifier used to build the ticket-purchase link. |
| `last_updated` | logical |  |
| `teams` | character |  |
| `play_by_play` | character | JSON-encoded data-island pointer to the game's play-by-play collection in the same editorial payload. |
| `pitches` | character | JSON-encoded data-island pointer to the game's pitch-level feed; baseball only. |
| `at_bat` | character | JSON-encoded data-island pointer to the game's current at-bat feed; baseball only. |
| `penalty_summary` | character |  |
| `scoring_summary` | character |  |
| `stat_categories` | character | JSON-encoded pointer to the stat-category dictionary that groups this feed's statistics. |
| `stadium` | character |  |
| `stadium_id` | character |  |
| `stadium_image` | character | JSON-encoded data-island pointer to the venue photograph used on the game page. |
| `attendance` | character |  |
| `lineups` | character | JSON-encoded data-island pointer to the game's lineup collection. |
| `top_performer` | character | JSON-encoded data-island pointer to the game's top-performing players. |
| `players` | character |  |
| `byline` | character |  |
| `highlight` | character | JSON-encoded data-island pointer to the game's highlight video. |
| `highlights` | character |  |
| `live_video` | character | JSON-encoded data-island pointer to the live video stream for the game. |
| `odds` | character | JSON-encoded data-island pointer to the game's odds collection. |
| `current_players` | character | JSON-encoded data-island pointer to the players currently on the field, ice or court. |
| `last_play` | character |  |
| `series_type` | character | JSON-encoded data-island pointer to the kind of series the game belongs to. |
| `series_status` | character | JSON-encoded data-island pointer to the current state of the series the game belongs to. |
| `games` | character |  |
| `series_games` | character | JSON-encoded data-island pointer to the games making up the series. |
| `game_details` | character | JSON-encoded data-island pointer to supplementary detail notes for the game. |
| `section_notes` | character | JSON-encoded data-island pointer to editorial section notes attached to the game page. |
| `articles` | character | JSON-encoded data-island pointer to the editorial articles attached to the game. |
| `tweets` | character | JSON-encoded data-island pointer to the social posts attached to the game page. |
| `playoff_round` | character |  |
| `media_stream` | character | JSON-encoded data-island pointer to the game's media-stream collection. |
| `playoff_series_status` | character | JSON-encoded data-island pointer to the current state of the playoff series the game belongs to. |
| `playoff_series_details` | character | JSON-encoded data-island pointer to detail about the playoff series the game belongs to. |
| `drives` | character | JSON-encoded data-island pointer to the game's drive collection; football only. |
| `user_teams_game` | character | JSON-encoded data-island pointer to the viewer's followed-team context for the game. |
| `page_metadata` | character | JSON-encoded data-island pointer to the SEO and page metadata for the entity. |
| `penalty_box` | character | JSON-encoded data-island pointer to the game's penalty-box feed; hockey only. |
| `starting_pitchers` | character | JSON-encoded data-island pointer to the game's announced starting pitchers; baseball only. |
| `unrestricted_streams` | character | JSON-encoded data-island pointer to the streams viewable without a subscription. |
| `tv_details` | character | JSON-encoded list of broadcast entries for the game, each carrying a network abbreviation and full channel name (e.g., [\{"abbr": "NBC", "name": "NBC/Peacock"\}]). |
| `away_seed` | character |  |
| `home_seed` | character |  |
| `navigation_links_tickets_url` | character | Affiliate ticket-purchase URL for the game, pointing at the SeatGeek marketplace. |
| `navigation_links_boxscore_url` | character | Site-relative URL of the game's boxscore page on sports.yahoo.com. |
| `navigation_links_match_page_url` | character | Site-relative URL of the game's match page on sports.yahoo.com. |
| `navigation_links_league_home_url` | character | Site-relative URL of the league's home page on sports.yahoo.com. |
| `navigation_links_league_scores_url` | character | Site-relative URL of the league's scoreboard page on sports.yahoo.com. |
| `provider_coverage_score_update_frequency_in_minutes` | character | How often, in minutes, the data provider refreshes the score for this game. |
| `provider_coverage_has_plays` | character | Flag indicating that the data provider supplies play-by-play for this game. |
| `provider_coverage_has_stats` | character | Flag indicating that the data provider supplies box-score statistics for this game. |
| `provider_coverage_has_extended_stats` | character | Flag indicating that the data provider supplies extended statistics beyond the standard box score. |
| `provider_coverage_has_final_stats` | character | Flag indicating that the data provider has published final, official statistics for the game. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_featured_game_ids` / `yahooFeaturedGameIds`

| col_name | type | description |
|---|---|---|
| `game_id` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_game_prop_bets` / `yahooGamePropBets`

| col_name | type | description |
|---|---|---|
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `alias_lang` | character | Language/locale tag attached to the entity's Yahoo alias (e.g., "en-US"). |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_domain` | character | Host the entity's Yahoo alias resolves against (e.g., "sports.yahoo.com"). |
| `game_id` | character |  |
| `status` | character |  |
| `away_team_team_id` | character | Yahoo composite team id of the away team (e.g., "ncaaf.t.29"). |
| `away_team_primary_color` | character | Primary brand color of the away team, as a hex RGB string without the leading hash. |
| `away_team_display_name` | character |  |
| `home_team_team_id` | character | Yahoo composite team id of the home team (e.g., "ncaaf.t.29"). |
| `home_team_primary_color` | character | Primary brand color of the home team, as a hex RGB string without the leading hash. |
| `home_team_display_name` | character |  |
| `active_prop_bets` | list | JSON-encoded list of the prop-bet markets currently open for the game. |
| `game_props` | list | JSON-encoded list of player and game prop markets offered on the game. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_game_stats_leaders` / `yahooGameStatsLeaders`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_gametime_game` / `yahooGametimeGame`

| col_name | type | description |
|---|---|---|
| `game_id` | character |  |
| `gametime_ticket_url` | character | Gametime affiliate ticket-purchase URL for the event or team. |
| `game_ticket_price` | character | Lowest available ticket price for the game from the Gametime affiliate feed, in US dollars. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_gametime_team` / `yahooGametimeTeam`

| col_name | type | description |
|---|---|---|
| `gametime_ticket_url` | character | Gametime affiliate ticket-purchase URL for the event or team. |
| `team_id` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_golf_tournaments` / `yahooGolfTournaments`

| col_name | type | description |
|---|---|---|
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `event_group_id` | character | Yahoo identifier that groups the rounds or legs making up a single tournament. |
| `name` | character |  |
| `display_name` | character |  |
| `start_time` | character |  |
| `start_date` | character |  |
| `end_date` | character |  |
| `status` | character |  |
| `status_display_name` | character | Short game or event status as shown on the scoreboard (e.g., "Final", "12:00 pm ET"). |
| `player_tournament_stats` | list | JSON-encoded per-player statistics recorded at the golf tournament. |
| `purse` | character | Total prize money on offer at the tournament, in US dollars. |
| `major` | logical | Flag indicating that the golf tournament is one of the sport's majors. |
| `venue_display_name` | character | Name of the venue hosting the event. |
| `venue_country` | character | Country the venue is located in. |
| `venue_city` | character |  |
| `venue_state` | character |  |
| `par` | numeric | Par of the golf course in play for the tournament. |
| `yardage` | numeric | Total yardage of the golf course in play for the tournament. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_golf_tournaments_basic` / `yahooGolfTournamentsBasic`

| col_name | type | description |
|---|---|---|
| `event_group_id` | character | Yahoo identifier that groups the rounds or legs making up a single tournament. |
| `start_time` | character |  |
| `start_date` | character |  |
| `end_date` | character |  |
| `season` | numeric |  |
| `clubs` | list | JSON-encoded list of the golf clubs hosting the tournament. |
| `courses` | list | JSON-encoded list of the courses in play at the tournament, with their par and yardage. |
| `name` | character |  |
| `status` | character |  |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `association` | character | Governing tour that sanctions the event (e.g., "pga"). |
| `league_short_name` | character |  |
| `league_full_name` | character | Full league name (e.g., "NCAA Football"). |
| `league_alias` | character | JSON-encoded Yahoo alias object for the league, carrying its site URL and path. |
| `purse` | character | Total prize money on offer at the tournament, in US dollars. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_conferences` / `yahooLeagueConferences`

| col_name | type | description |
|---|---|---|
| `short_name` | character |  |
| `conferences` | list | JSON-encoded list of the league's conference nodes, each carrying an id, a name and its member teams. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_filters_data` / `yahooLeagueFiltersData`

| col_name | type | description |
|---|---|---|
| `sport_sport_id` | character | Yahoo identifier of the sport the league belongs to. |
| `sport_name` | character |  |
| `short_name` | character |  |
| `full_name` | character |  |
| `name` | character |  |
| `current_league_day` | list | Calendar date the league's live scoreboard is anchored on, in YYYY-MM-DD form. |
| `teams` | list |  |
| `current_week` | numeric | Week number within the league's current season phase, counting from 1. |
| `current_season_phase` | character | Phase of the season currently in effect (e.g., "season.phase.season", "season.phase.offseason"). |
| `current_game_season_phase` | character | Season phase of the games the league feed is currently serving. |
| `current_season` | numeric | Season the league is currently playing, as the four-digit starting year. |
| `current_league_season` | list | Yahoo league-season identifier for the season currently in progress. |
| `league_seasons` | list | JSON-encoded list of the seasons for which Yahoo carries data for this league. |
| `league_weeks` | list | JSON-encoded list of the league's week nodes for the season. |
| `current_season_league_weeks` | list | JSON-encoded list of the week nodes making up the current league season. |
| `divisions` | list | JSON-encoded list of the league's division nodes, each carrying its member conferences and teams. |
| `conferences` | list | JSON-encoded list of the league's conference nodes, each carrying an id, a name and its member teams. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_future_odds` / `yahooLeagueFutureOdds`

| col_name | type | description |
|---|---|---|
| `bets` | list | JSON-encoded list of the betting markets offered on the event (spread, moneyline and total). |
| `league` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_game_ids` / `yahooLeagueGameIds`

| col_name | type | description |
|---|---|---|
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_navigation_links` | character | JSON-encoded map of navigation links (scores, standings, teams) hanging off the entity's Yahoo alias. |
| `current_week` | numeric | Week number within the league's current season phase, counting from 1. |
| `games` | list |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_game_ids_by_date` / `yahooLeagueGameIdsByDate`

| col_name | type | description |
|---|---|---|
| `display_short` | character | Short league label used in navigation and compact UI (e.g., "NCAA FB"). |
| `full_name` | character |  |
| `name` | character |  |
| `current_week` | numeric | Week number within the league's current season phase, counting from 1. |
| `current_game_season_phase` | character | Season phase of the games the league feed is currently serving. |
| `current_league_season` | list | Yahoo league-season identifier for the season currently in progress. |
| `games` | list |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_info` / `yahooLeagueInfo`

| col_name | type | description |
|---|---|---|
| `display_short` | character | Short league label used in navigation and compact UI (e.g., "NCAA FB"). |
| `name` | character |  |
| `full_name` | character |  |
| `short_name` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_injuries` / `yahooLeagueInjuries`

| col_name | type | description |
|---|---|---|
| `teams` | list |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_names` / `yahooLeagueNames`

| col_name | type | description |
|---|---|---|
| `league_id` | numeric |  |
| `short_name` | character |  |
| `full_name` | character |  |
| `name` | character |  |
| `display_short` | character | Short league label used in navigation and compact UI (e.g., "NCAA FB"). |
| `display_abbr` | character | Compact league abbreviation used in dense UI (e.g., "NCAAF"). |
| `current_season` | numeric | Season the league is currently playing, as the four-digit starting year. |
| `league_seasons` | list | JSON-encoded list of the seasons for which Yahoo carries data for this league. |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `alias_subpages` | character | JSON-encoded list of subpage aliases (roster, schedule, stats) available beneath the entity's Yahoo page. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_standings` / `yahooLeagueStandings`

| col_name | type | description |
|---|---|---|
| `sport_name` | character |  |
| `current_season_phase` | character | Phase of the season currently in effect (e.g., "season.phase.season", "season.phase.offseason"). |
| `current_league_season` | list | Yahoo league-season identifier for the season currently in progress. |
| `divisions` | list | JSON-encoded list of the league's division nodes, each carrying its member conferences and teams. |
| `teams` | list |  |
| `conferences` | list | JSON-encoded list of the league's conference nodes, each carrying an id, a name and its member teams. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_stats_by_team` / `yahooLeagueStatsByTeam`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_stats_individual` / `yahooLeagueStatsIndividual`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_stats_overview` / `yahooLeagueStatsOverview`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_stats_weekly` / `yahooLeagueStatsWeekly`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_team_ids` / `yahooLeagueTeamIds`

| col_name | type | description |
|---|---|---|
| `short_name` | character |  |
| `teams` | list |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_league_teams` / `yahooLeagueTeams`

| col_name | type | description |
|---|---|---|
| `short_name` | character |  |
| `teams` | list |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_leagues_season_states` / `yahooLeaguesSeasonStates`

| col_name | type | description |
|---|---|---|
| `name` | character |  |
| `short_name` | character |  |
| `full_name` | character |  |
| `display_short` | character | Short league label used in navigation and compact UI (e.g., "NCAA FB"). |
| `current_season_phase` | character | Phase of the season currently in effect (e.g., "season.phase.season", "season.phase.offseason"). |
| `current_week` | numeric | Week number within the league's current season phase, counting from 1. |
| `current_season` | numeric | Season the league is currently playing, as the four-digit starting year. |
| `stats_season` | list | Season the returned statistics cover, as a four-digit year. |
| `sport_name` | character |  |
| `league_weeks` | list | JSON-encoded list of the league's week nodes for the season. |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_navigation_links` | character | JSON-encoded map of navigation links (scores, standings, teams) hanging off the entity's Yahoo alias. |
| `league_seasons` | list | JSON-encoded list of the seasons for which Yahoo carries data for this league. |
| `bye_weeks` | list | JSON-encoded list of the week numbers in which the team has no scheduled game. |
| `divisions` | list | JSON-encoded list of the league's division nodes, each carrying its member conferences and teams. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_module_game` / `yahooModuleGame`

| col_name | type | description |
|---|---|---|
| `game_id` | character |  |
| `display_name` | character |  |
| `league_name` | character |  |
| `league_full_name` | character | Full league name (e.g., "NCAA Football"). |
| `league_display_abbr` | character | Compact league abbreviation used in dense UI alongside the game. |
| `league_display_short` | character | Short league label used in navigation and compact UI (e.g., "NCAA FB"). |
| `league_short_name` | character |  |
| `league_sport` | character | Sport the league belongs to (e.g., "football"). |
| `league_alias` | character | JSON-encoded Yahoo alias object for the league, carrying its site URL and path. |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `away_team_id` | character |  |
| `away_team_record` | character |  |
| `away_team_full_name` | character |  |
| `away_team_team_id` | character | Yahoo composite team id of the away team (e.g., "ncaaf.t.29"). |
| `away_team_primary_color` | character | Primary brand color of the away team, as a hex RGB string without the leading hash. |
| `away_team_secondary_color` | character | Secondary brand color of the away team, as a hex RGB string without the leading hash. |
| `away_team_display_name` | character |  |
| `away_team_abbreviation` | character |  |
| `away_team_location` | character |  |
| `away_team_gametime_ticket_url` | character | Gametime affiliate ticket-purchase URL for the away team's games. |
| `away_team_alias` | character | JSON-encoded Yahoo alias object for the away team, carrying its site URL and path. |
| `away_team_nickname` | character |  |
| `away_team_last_games` | character | JSON-encoded list of the away team's most recently completed games. |
| `away_team_team_logo_white` | character | JSON-encoded image node for the away team's white knockout logo, used on dark backgrounds. |
| `away_team_team_logo` | character | JSON-encoded image node for the away team's standard logo. |
| `away_team_team_standings` | character | JSON-encoded standings node for the away team, carrying its record, position and streak. |
| `away_team_rank_polls` | character | JSON-encoded list of the poll rankings the away team currently holds. |
| `away_team_playoff_seeds` | character | JSON-encoded list of the away team's playoff-seed entries for the season. |
| `home_team_id` | character |  |
| `home_team_record` | character |  |
| `home_team_full_name` | character |  |
| `home_team_team_id` | character | Yahoo composite team id of the home team (e.g., "ncaaf.t.29"). |
| `home_team_primary_color` | character | Primary brand color of the home team, as a hex RGB string without the leading hash. |
| `home_team_secondary_color` | character | Secondary brand color of the home team, as a hex RGB string without the leading hash. |
| `home_team_display_name` | character |  |
| `home_team_abbreviation` | character |  |
| `home_team_location` | character |  |
| `home_team_gametime_ticket_url` | character | Gametime affiliate ticket-purchase URL for the home team's games. |
| `home_team_alias` | character | JSON-encoded Yahoo alias object for the home team, carrying its site URL and path. |
| `home_team_nickname` | character |  |
| `home_team_last_games` | character | JSON-encoded list of the home team's most recently completed games. |
| `home_team_team_logo_white` | character | JSON-encoded image node for the home team's white knockout logo, used on dark backgrounds. |
| `home_team_team_logo` | character | JSON-encoded image node for the home team's standard logo. |
| `home_team_team_standings` | character | JSON-encoded standings node for the home team, carrying its record, position and streak. |
| `home_team_rank_polls` | character | JSON-encoded list of the poll rankings the home team currently holds. |
| `home_team_playoff_seeds` | character | JSON-encoded list of the home team's playoff-seed entries for the season. |
| `away_score` | numeric |  |
| `home_score` | numeric |  |
| `start_time` | character |  |
| `start_date` | character |  |
| `if_necessary` | character |  |
| `status` | character |  |
| `status_display_name` | character | Short game or event status as shown on the scoreboard (e.g., "Final", "12:00 pm ET"). |
| `season` | numeric |  |
| `season_phase` | character | Phase of the season the game falls in (e.g., "season.phase.season"). |
| `time_left` | character |  |
| `tournament_id` | character |  |
| `gametime_ticket_url` | character | Gametime affiliate ticket-purchase URL for the event or team. |
| `game_ticket_price` | character | Lowest available ticket price for the game from the Gametime affiliate feed, in US dollars. |
| `playoff_series` | character | JSON-encoded playoff-series node the game belongs to. |
| `winning_team_id` | character | Composite Yahoo team id of the side that won the game (e.g., "ncaaf.t.29"). |
| `broadcast_channels` | list | JSON-encoded list of the channels broadcasting the event. |
| `news_break_subtext` | character | Secondary line of the news-break banner attached to the game. |
| `news_break_title` | character | Headline of the news-break banner attached to the game. |
| `news_break_url` | character | URL of the article behind the game's news-break banner. |
| `news_break_uuid` | character | Yahoo content UUID of the article behind the game's news-break banner. |
| `brief` | character | Short editorial blurb summarizing the game's state or result. |
| `event_extended_display_name` | character | Long-form event title used for marquee games, such as a bowl or rivalry name. |
| `bets` | list | JSON-encoded list of the betting markets offered on the event (spread, moneyline and total). |
| `venue_display_name` | character | Name of the venue hosting the event. |
| `venue_city` | character |  |
| `venue_cover_type` | character | Whether the venue is open-air, domed or fitted with a retractable roof. |
| `venue_state` | character |  |
| `venue_venue_id` | character | Yahoo identifier of the venue hosting the event. |
| `venue_country` | character | Country the venue is located in. |
| `tv_coverage` | character | Network carrying the game, as a short broadcast abbreviation (e.g., "CBS", "ESPN"). |
| `weather` | character |  |
| `away_line_score` | list | JSON-encoded per-period scoring line for the away team. |
| `current_period_period` | character | Ordinal number of the period currently in progress within the game. |
| `field_position` | character | Ball spot expressed on Yahoo's 0-100 field scale, measured toward the offense's target goal line. |
| `field_position_display_name` | character | Ball spot rendered the way a scoreboard shows it (e.g., "MICH 35"). |
| `home_line_score` | list | JSON-encoded per-period scoring line for the home team. |
| `home_timeouts_remaining` | numeric |  |
| `away_timeouts_remaining` | numeric |  |
| `last_play` | list |  |
| `game_stat_leaders` | list | JSON-encoded pointer to the per-category statistical leaders for the game. |
| `team_possessing_ball` | character | Yahoo team id of the side currently possessing the ball. |
| `recap_videos` | list | JSON-encoded list of recap videos published for the game. |
| `week` | numeric |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_motorsport_standings` / `yahooMotorsportStandings`

| col_name | type | description |
|---|---|---|
| `name` | character |  |
| `full_name` | character |  |
| `current_league_season` | list | Yahoo league-season identifier for the season currently in progress. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_nascar_drivers` / `yahooNascarDrivers`

| col_name | type | description |
|---|---|---|
| `short_name` | character |  |
| `players` | list |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_nav_dropdown_tray` / `yahooNavDropdownTray`

| col_name | type | description |
|---|---|---|
| `short_name` | character |  |
| `teams` | list |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_oly_medal_count` / `yahooOlyMedalCount`

| col_name | type | description |
|---|---|---|
| `display_name` | character |  |
| `short_display_name` | character |  |
| `start_date` | character |  |
| `end_date` | character |  |
| `season` | numeric |  |
| `alias` | character | JSON-encoded Yahoo alias object for the entity, carrying the site URL, path and subpage routing used to build links to its page. |
| `olympic_team` | list | JSON-encoded national team node whose medal count this row reports. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_oly_seasons` / `yahooOlySeasons`

| col_name | type | description |
|---|---|---|
| `season` | numeric |  |
| `display_name` | character |  |
| `type` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_pick_distribution` / `yahooPickDistribution`

| col_name | type | description |
|---|---|---|
| `ncaaf_games` | list | JSON-encoded list of NCAAF game nodes carrying the pick or odds distribution for the slate. |
| `conferences` | list | JSON-encoded list of the league's conference nodes, each carrying an id, a name and its member teams. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playbook_boxscore` / `yahooPlaybookBoxscore`

| col_name | type | description |
|---|---|---|
| `position_id` | character |  |
| `name` | character |  |
| `abbreviation` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playbook_boxscore_poll` / `yahooPlaybookBoxscorePoll`

| col_name | type | description |
|---|---|---|
| `position_id` | character |  |
| `name` | character |  |
| `abbreviation` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playbook_boxscore_social_share` / `yahooPlaybookBoxscoreSocialShare`

| col_name | type | description |
|---|---|---|
| `game_id` | character |  |
| `away_team_active` | character |  |
| `away_team_primary_color` | character | Primary brand color of the away team, as a hex RGB string without the leading hash. |
| `away_team_secondary_color` | character | Secondary brand color of the away team, as a hex RGB string without the leading hash. |
| `away_team_team_logo_white` | character | JSON-encoded image node for the away team's white knockout logo, used on dark backgrounds. |
| `away_team_team_logo` | character | JSON-encoded image node for the away team's standard logo. |
| `home_team_active` | character |  |
| `home_team_primary_color` | character | Primary brand color of the home team, as a hex RGB string without the leading hash. |
| `home_team_secondary_color` | character | Secondary brand color of the home team, as a hex RGB string without the leading hash. |
| `home_team_team_logo_white` | character | JSON-encoded image node for the home team's white knockout logo, used on dark backgrounds. |
| `home_team_team_logo` | character | JSON-encoded image node for the home team's standard logo. |
| `league_league_logo` | character | JSON-encoded image node for the league's logo. |
| `start_time` | character |  |
| `start_date` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playbook_game` / `yahooPlaybookGame`

| col_name | type | description |
|---|---|---|
| `game_id` | character |  |
| `display_name` | character |  |
| `league_name` | character |  |
| `league_full_name` | character | Full league name (e.g., "NCAA Football"). |
| `league_display_short` | character | Short league label used in navigation and compact UI (e.g., "NCAA FB"). |
| `league_short_name` | character |  |
| `league_sport` | character | Sport the league belongs to (e.g., "football"). |
| `league_alias` | character | JSON-encoded Yahoo alias object for the league, carrying its site URL and path. |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `away_team_id` | character |  |
| `away_team_full_name` | character |  |
| `away_team_team_id` | character | Yahoo composite team id of the away team (e.g., "ncaaf.t.29"). |
| `away_team_primary_color` | character | Primary brand color of the away team, as a hex RGB string without the leading hash. |
| `away_team_secondary_color` | character | Secondary brand color of the away team, as a hex RGB string without the leading hash. |
| `away_team_display_name` | character |  |
| `away_team_abbreviation` | character |  |
| `away_team_location` | character |  |
| `away_team_alias` | character | JSON-encoded Yahoo alias object for the away team, carrying its site URL and path. |
| `away_team_nickname` | character |  |
| `away_team_last_games` | character | JSON-encoded list of the away team's most recently completed games. |
| `away_team_team_logo_white` | character | JSON-encoded image node for the away team's white knockout logo, used on dark backgrounds. |
| `away_team_team_logo` | character | JSON-encoded image node for the away team's standard logo. |
| `away_team_team_standings` | character | JSON-encoded standings node for the away team, carrying its record, position and streak. |
| `away_team_players` | character | JSON-encoded roster of away-team players attached to the game. |
| `away_team_rank_polls` | character | JSON-encoded list of the poll rankings the away team currently holds. |
| `away_team_playoff_seeds` | character | JSON-encoded list of the away team's playoff-seed entries for the season. |
| `home_team_id` | character |  |
| `home_team_full_name` | character |  |
| `home_team_team_id` | character | Yahoo composite team id of the home team (e.g., "ncaaf.t.29"). |
| `home_team_primary_color` | character | Primary brand color of the home team, as a hex RGB string without the leading hash. |
| `home_team_secondary_color` | character | Secondary brand color of the home team, as a hex RGB string without the leading hash. |
| `home_team_display_name` | character |  |
| `home_team_abbreviation` | character |  |
| `home_team_location` | character |  |
| `home_team_alias` | character | JSON-encoded Yahoo alias object for the home team, carrying its site URL and path. |
| `home_team_nickname` | character |  |
| `home_team_last_games` | character | JSON-encoded list of the home team's most recently completed games. |
| `home_team_team_logo_white` | character | JSON-encoded image node for the home team's white knockout logo, used on dark backgrounds. |
| `home_team_team_logo` | character | JSON-encoded image node for the home team's standard logo. |
| `home_team_team_standings` | character | JSON-encoded standings node for the home team, carrying its record, position and streak. |
| `home_team_players` | character | JSON-encoded roster of home-team players attached to the game. |
| `home_team_rank_polls` | character | JSON-encoded list of the poll rankings the home team currently holds. |
| `home_team_playoff_seeds` | character | JSON-encoded list of the home team's playoff-seed entries for the season. |
| `away_score` | numeric |  |
| `home_score` | numeric |  |
| `start_time` | character |  |
| `start_date` | character |  |
| `if_necessary` | character |  |
| `status` | character |  |
| `status_display_name` | character | Short game or event status as shown on the scoreboard (e.g., "Final", "12:00 pm ET"). |
| `season` | numeric |  |
| `season_phase` | character | Phase of the season the game falls in (e.g., "season.phase.season"). |
| `time_left` | character |  |
| `tournament_id` | character |  |
| `playoff_series` | character | JSON-encoded playoff-series node the game belongs to. |
| `winning_team_id` | character | Composite Yahoo team id of the side that won the game (e.g., "ncaaf.t.29"). |
| `broadcast_channels` | list | JSON-encoded list of the channels broadcasting the event. |
| `news_break_subtext` | character | Secondary line of the news-break banner attached to the game. |
| `news_break_title` | character | Headline of the news-break banner attached to the game. |
| `news_break_url` | character | URL of the article behind the game's news-break banner. |
| `news_break_uuid` | character | Yahoo content UUID of the article behind the game's news-break banner. |
| `brief` | character | Short editorial blurb summarizing the game's state or result. |
| `bets` | list | JSON-encoded list of the betting markets offered on the event (spread, moneyline and total). |
| `venue_display_name` | character | Name of the venue hosting the event. |
| `venue_city` | character |  |
| `venue_cover_type` | character | Whether the venue is open-air, domed or fitted with a retractable roof. |
| `venue_state` | character |  |
| `venue_venue_id` | character | Yahoo identifier of the venue hosting the event. |
| `venue_country` | character | Country the venue is located in. |
| `tv_coverage` | character | Network carrying the game, as a short broadcast abbreviation (e.g., "CBS", "ESPN"). |
| `weather` | character |  |
| `away_line_score` | list | JSON-encoded per-period scoring line for the away team. |
| `current_period_period` | character | Ordinal number of the period currently in progress within the game. |
| `field_position` | character | Ball spot expressed on Yahoo's 0-100 field scale, measured toward the offense's target goal line. |
| `field_position_display_name` | character | Ball spot rendered the way a scoreboard shows it (e.g., "MICH 35"). |
| `home_line_score` | list | JSON-encoded per-period scoring line for the home team. |
| `home_timeouts_remaining` | numeric |  |
| `away_timeouts_remaining` | numeric |  |
| `last_play` | list |  |
| `game_stat_leaders` | list | JSON-encoded pointer to the per-category statistical leaders for the game. |
| `team_possessing_ball` | character | Yahoo team id of the side currently possessing the ball. |
| `recap_videos` | list | JSON-encoded list of recap videos published for the game. |
| `week` | numeric |  |
| `play_by_play` | list | JSON-encoded data-island pointer to the game's play-by-play collection in the same editorial payload. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playbook_game_odds_poll` / `yahooPlaybookGameOddsPoll`

| col_name | type | description |
|---|---|---|
| `game_id` | character |  |
| `bets` | list | JSON-encoded list of the betting markets offered on the event (spread, moneyline and total). |
| `partial_game_bets` | list | JSON-encoded list of in-game betting markets covering only part of the game, such as halves or quarters. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playbook_league_odds` / `yahooPlaybookLeagueOdds`

| col_name | type | description |
|---|---|---|
| `ncaaf_games` | list | JSON-encoded list of NCAAF game nodes carrying the pick or odds distribution for the slate. |
| `conferences` | list | JSON-encoded list of the league's conference nodes, each carrying an id, a name and its member teams. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playbook_player` / `yahooPlaybookPlayer`

| col_name | type | description |
|---|---|---|
| `player_id` | character |  |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_subpages` | character | JSON-encoded list of subpage aliases (roster, schedule, stats) available beneath the entity's Yahoo page. |
| `sport_name` | character |  |
| `first_name` | character |  |
| `last_name` | character |  |
| `display_name` | character |  |
| `college` | character |  |
| `birth_state` | character |  |
| `birth_city` | character |  |
| `birth_country` | character |  |
| `birth_date` | character |  |
| `height` | numeric |  |
| `display_height` | character |  |
| `weight` | numeric |  |
| `status` | character |  |
| `active` | logical |  |
| `suggested_headshot` | character | JSON-encoded image node for the headshot Yahoo recommends for this player. |
| `uniform_number` | character | Jersey number the player wears for the team. |
| `positions` | list |  |
| `team_id` | character |  |
| `team_team_id` | character |  |
| `team_display_name` | character |  |
| `team_full_name` | character |  |
| `team_alias` | character | JSON-encoded alias object for the entity's team, carrying its Yahoo page URL and path. |
| `team_team_logo` | character | JSON-encoded image node for the team's standard logo. |
| `team_team_logo_white` | character | JSON-encoded image node for the team's white knockout logo. |
| `team_primary_color` | character | Primary brand color of the entity's team, as a hex RGB string without the leading hash. |
| `team_secondary_color` | character | Secondary brand color of the entity's team, as a hex RGB string without the leading hash. |
| `draft_position` | character | Round and pick at which the player was drafted, left null for undrafted players. |
| `player_seasons` | list | JSON-encoded list of the seasons for which Yahoo carries data on this player. |
| `header_stats_passing` | list | JSON-encoded headline passing statistics shown at the top of the player's page. |
| `season_stats_passing` | list | JSON-encoded full-season passing statistics for the player. |
| `header_stats_rushing` | list | JSON-encoded headline rushing statistics shown at the top of the player's page. |
| `season_stats_rushing` | list | JSON-encoded full-season rushing statistics for the player. |
| `header_stats_receiving` | list | JSON-encoded headline receiving statistics shown at the top of the player's page. |
| `season_stats_receiving` | list | JSON-encoded full-season receiving statistics for the player. |
| `header_stats_defense` | list | JSON-encoded headline defensive statistics shown at the top of the player's page. |
| `season_stats_defense` | list | JSON-encoded full-season defensive statistics for the player. |
| `header_stats_kicking` | list | JSON-encoded headline kicking statistics shown at the top of the player's page. |
| `season_stats_kicking` | list | JSON-encoded full-season kicking statistics for the player. |
| `header_stats_punting` | list | JSON-encoded headline punting statistics shown at the top of the player's page. |
| `season_stats_punting` | list | JSON-encoded full-season punting statistics for the player. |
| `earnings` | list | Prize money the player has earned over the covered period, in US dollars. |
| `first_year` | character | First season in which the player appeared in this league. |
| `last_year` | numeric | Most recent season in which the player appeared in this league. |
| `injury` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playbook_player_social_share` / `yahooPlaybookPlayerSocialShare`

| col_name | type | description |
|---|---|---|
| `sport_name` | character |  |
| `short_display_name` | character |  |
| `suggested_headshot` | character | JSON-encoded image node for the headshot Yahoo recommends for this player. |
| `team_primary_color` | character | Primary brand color of the entity's team, as a hex RGB string without the leading hash. |
| `team_secondary_color` | character | Secondary brand color of the entity's team, as a hex RGB string without the leading hash. |
| `team_league` | character | JSON-encoded league node for the entity's team. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playbook_team` / `yahooPlaybookTeam`

| col_name | type | description |
|---|---|---|
| `sport_sport_id` | character | Yahoo identifier of the sport the league belongs to. |
| `sport_name` | character |  |
| `league_name` | character |  |
| `league_short_name` | character |  |
| `league_current_season_phase` | character | Phase the league's season is currently in (e.g., "season.phase.season"). |
| `team_id` | character |  |
| `conference_id` | numeric |  |
| `full_name` | character |  |
| `display_name` | character |  |
| `location` | character |  |
| `nickname` | character |  |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `team_logo_white_url` | character | Absolute URL of the team's white knockout logo, the variant used on dark backgrounds. |
| `team_logo_url` | character | Absolute URL of the team's standard logo image on Yahoo's image CDN. |
| `alias_navigation_links` | character | JSON-encoded map of navigation links (scores, standings, teams) hanging off the entity's Yahoo alias. |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `last_games` | list | JSON-encoded list of the team's most recently completed games, used for form and streak displays. |
| `next_games` | list | JSON-encoded list of the team's next scheduled games. |
| `division_name` | character |  |
| `division_teams` | character | JSON-encoded list of the teams that make up the division. |
| `conference_short_name` | character |  |
| `conference_name` | character |  |
| `conference_conference_id` | character | Yahoo numeric identifier of the conference carried on the team's conference node. |
| `conference_team_standings` | character | JSON-encoded standings rows for every team in the conference. |
| `conference_abbreviation` | character |  |
| `team_standings_team` | character | JSON-encoded team node the standings row describes. |
| `team_standings_conference_id` | character | Yahoo numeric conference id for the team's standings row. |
| `team_standings_conference` | character | JSON-encoded conference node the standings row sits under. |
| `team_standings_display_name` | character | Display name of the team on its standings row. |
| `team_standings_full_name` | character | Full name of the team on its standings row. |
| `team_standings_position` | character | Rank of the team within the standings grouping it is listed in. |
| `team_standings_sequence` | character | Tie-break ordering value Yahoo uses to sequence teams holding identical records. |
| `team_standings_team_record` | character | Formatted overall record for the team (e.g., "8-2"). |
| `team_standings_conference_position` | character | Rank of the team within its conference standings. |
| `team_standings_points_for` | character | Points the team has scored over the standings period. |
| `team_standings_points_against` | character | Points the team has allowed over the standings period. |
| `team_standings_clinched_playoff` | character | Flag indicating that the team has clinched a playoff berth. |
| `team_standings_clinched_division` | character | Flag indicating that the team has clinched its division. |
| `team_standings_streak_display` | character | Formatted current streak for the team (e.g., "W3", "L2"). |
| `gametime_ticket_url` | character | Gametime affiliate ticket-purchase URL for the event or team. |
| `football_team_season_stats` | list | JSON-encoded team-level season statistics for the team's football side. |
| `football_player_season_stats` | list | JSON-encoded per-player season statistics for the team's football roster. |
| `injured_players` | list | JSON-encoded list of the team's players currently carrying an injury designation. |
| `transactions` | list | JSON-encoded list of the team's roster transactions over the requested window. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playbook_team_basic` / `yahooPlaybookTeamBasic`

| col_name | type | description |
|---|---|---|
| `sport_sport_id` | character | Yahoo identifier of the sport the league belongs to. |
| `sport_name` | character |  |
| `league_name` | character |  |
| `league_short_name` | character |  |
| `league_current_season_phase` | character | Phase the league's season is currently in (e.g., "season.phase.season"). |
| `team_id` | character |  |
| `conference_id` | numeric |  |
| `full_name` | character |  |
| `display_name` | character |  |
| `location` | character |  |
| `nickname` | character |  |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `team_logo_white_url` | character | Absolute URL of the team's white knockout logo, the variant used on dark backgrounds. |
| `team_logo_url` | character | Absolute URL of the team's standard logo image on Yahoo's image CDN. |
| `alias_navigation_links` | character | JSON-encoded map of navigation links (scores, standings, teams) hanging off the entity's Yahoo alias. |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `last_games` | list | JSON-encoded list of the team's most recently completed games, used for form and streak displays. |
| `next_games` | list | JSON-encoded list of the team's next scheduled games. |
| `division_name` | character |  |
| `conference_short_name` | character |  |
| `conference_name` | character |  |
| `conference_conference_id` | character | Yahoo numeric identifier of the conference carried on the team's conference node. |
| `conference_abbreviation` | character |  |
| `team_standings_team` | character | JSON-encoded team node the standings row describes. |
| `team_standings_conference_id` | character | Yahoo numeric conference id for the team's standings row. |
| `team_standings_conference` | character | JSON-encoded conference node the standings row sits under. |
| `team_standings_display_name` | character | Display name of the team on its standings row. |
| `team_standings_full_name` | character | Full name of the team on its standings row. |
| `team_standings_position` | character | Rank of the team within the standings grouping it is listed in. |
| `team_standings_sequence` | character | Tie-break ordering value Yahoo uses to sequence teams holding identical records. |
| `team_standings_team_record` | character | Formatted overall record for the team (e.g., "8-2"). |
| `team_standings_conference_position` | character | Rank of the team within its conference standings. |
| `team_standings_points_for` | character | Points the team has scored over the standings period. |
| `team_standings_points_against` | character | Points the team has allowed over the standings period. |
| `team_standings_clinched_playoff` | character | Flag indicating that the team has clinched a playoff berth. |
| `team_standings_clinched_division` | character | Flag indicating that the team has clinched its division. |
| `team_standings_streak_display` | character | Formatted current streak for the team (e.g., "W3", "L2"). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playbook_team_social_share` / `yahooPlaybookTeamSocialShare`

| col_name | type | description |
|---|---|---|
| `sport_sport_id` | character | Yahoo identifier of the sport the league belongs to. |
| `sport_name` | character |  |
| `team_id` | character |  |
| `primary_color` | character |  |
| `team_logo_url` | character | Absolute URL of the team's standard logo image on Yahoo's image CDN. |
| `team_logo_white_url` | character | Absolute URL of the team's white knockout logo, the variant used on dark backgrounds. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_player_basic` / `yahooPlayerBasic`

| col_name | type | description |
|---|---|---|
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `alias_lang` | character | Language/locale tag attached to the entity's Yahoo alias (e.g., "en-US"). |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_domain` | character | Host the entity's Yahoo alias resolves against (e.g., "sports.yahoo.com"). |
| `display_name` | character |  |
| `first_name` | character |  |
| `last_name` | character |  |
| `player_id` | character |  |
| `positions` | list |  |
| `team_display_name` | character |  |
| `team_team_id` | character |  |
| `uniform_number` | character | Jersey number the player wears for the team. |
| `injury` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_player_career_stats` / `yahooPlayerCareerStats`

| col_name | type | description |
|---|---|---|
| `positions` | list |  |
| `stats_by_season` | list | JSON-encoded per-season statistical lines for the player. |
| `total_stats` | list | JSON-encoded career-total statistical line summing the player's seasons. |
| `career_stats` | list | JSON-encoded career statistical totals for the player across every season. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_player_game_log` / `yahooPlayerGameLog`

| col_name | type | description |
|---|---|---|
| `player_id` | character |  |
| `active` | logical |  |
| `positions` | list |  |
| `team_id` | character |  |
| `player_game_stats` | list | JSON-encoded per-game statistical lines for the player across the requested game log. |
| `player_season_stats` | list | JSON-encoded season statistical totals for the player. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_player_props` / `yahooPlayerProps`

| col_name | type | description |
|---|---|---|
| `games` | list |  |
| `player_id` | character |  |
| `display_name` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_player_search` / `yahooPlayerSearch`

| col_name | type | description |
|---|---|---|
| `players` | list |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_player_season_stats` / `yahooPlayerSeasonStats`

| col_name | type | description |
|---|---|---|
| `player_id` | character |  |
| `active` | logical |  |
| `positions` | list |  |
| `team_id` | character |  |
| `player_season_stats` | list | JSON-encoded season statistical totals for the player. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playoff_bracket` / `yahooPlayoffBracket`

| col_name | type | description |
|---|---|---|
| `bracket_slots` | list |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_playoff_series_game` / `yahooPlayoffSeriesGame`

| col_name | type | description |
|---|---|---|
| `game_id` | character |  |
| `playoff_series` | character | JSON-encoded playoff-series node the game belongs to. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_polymarket_game` / `yahooPolymarketGame`

| col_name | type | description |
|---|---|---|
| `game_id` | character |  |
| `polymarket_url` | character | Polymarket prediction-market URL for wagering on the game. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_racing_schedule` / `yahooRacingSchedule`

| col_name | type | description |
|---|---|---|
| `league_seasons` | list | JSON-encoded list of the seasons for which Yahoo carries data for this league. |
| `current_season` | numeric | Season the league is currently playing, as the four-digit starting year. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_scoreboard_game` / `yahooScoreboardGame`

| col_name | type | description |
|---|---|---|
| `game_id` | character |  |
| `display_name` | character |  |
| `league_name` | character |  |
| `league_full_name` | character | Full league name (e.g., "NCAA Football"). |
| `league_display_short` | character | Short league label used in navigation and compact UI (e.g., "NCAA FB"). |
| `league_short_name` | character |  |
| `league_sport` | character | Sport the league belongs to (e.g., "football"). |
| `league_alias` | character | JSON-encoded Yahoo alias object for the league, carrying its site URL and path. |
| `league_league_logo` | character | JSON-encoded image node for the league's logo. |
| `partner_url` | list | Partner or affiliate deep link associated with the scoreboard game. |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `away_team_id` | character |  |
| `away_team_full_name` | character |  |
| `away_team_team_id` | character | Yahoo composite team id of the away team (e.g., "ncaaf.t.29"). |
| `away_team_display_name` | character |  |
| `away_team_abbreviation` | character |  |
| `away_team_alias` | character | JSON-encoded Yahoo alias object for the away team, carrying its site URL and path. |
| `away_team_nickname` | character |  |
| `away_team_team_logo_white` | character | JSON-encoded image node for the away team's white knockout logo, used on dark backgrounds. |
| `away_team_team_logo` | character | JSON-encoded image node for the away team's standard logo. |
| `away_team_team_standings` | character | JSON-encoded standings node for the away team, carrying its record, position and streak. |
| `away_team_rank_polls` | character | JSON-encoded list of the poll rankings the away team currently holds. |
| `away_team_playoff_seeds` | character | JSON-encoded list of the away team's playoff-seed entries for the season. |
| `away_team_record` | character |  |
| `home_team_id` | character |  |
| `home_team_full_name` | character |  |
| `home_team_team_id` | character | Yahoo composite team id of the home team (e.g., "ncaaf.t.29"). |
| `home_team_display_name` | character |  |
| `home_team_abbreviation` | character |  |
| `home_team_alias` | character | JSON-encoded Yahoo alias object for the home team, carrying its site URL and path. |
| `home_team_nickname` | character |  |
| `home_team_team_logo_white` | character | JSON-encoded image node for the home team's white knockout logo, used on dark backgrounds. |
| `home_team_team_logo` | character | JSON-encoded image node for the home team's standard logo. |
| `home_team_team_standings` | character | JSON-encoded standings node for the home team, carrying its record, position and streak. |
| `home_team_rank_polls` | character | JSON-encoded list of the poll rankings the home team currently holds. |
| `home_team_playoff_seeds` | character | JSON-encoded list of the home team's playoff-seed entries for the season. |
| `home_team_record` | character |  |
| `current_period_overtime` | character | Flag indicating that the period in progress is an overtime period. |
| `current_period_short_display_name` | character | Abbreviated label for the period in progress (e.g., "4th"). |
| `away_score` | numeric |  |
| `home_score` | numeric |  |
| `start_time` | character |  |
| `start_date` | character |  |
| `if_necessary` | character |  |
| `status` | character |  |
| `status_display_name` | character | Short game or event status as shown on the scoreboard (e.g., "Final", "12:00 pm ET"). |
| `full_status_display_name` | character | Long-form game status label including overtime and date context (e.g., "Final/OT"). |
| `season` | numeric |  |
| `season_phase` | character | Phase of the season the game falls in (e.g., "season.phase.season"). |
| `time_left` | character |  |
| `tournament_id` | character |  |
| `display_result` | character |  |
| `playoff_series` | character | JSON-encoded playoff-series node the game belongs to. |
| `winning_team_id` | character | Composite Yahoo team id of the side that won the game (e.g., "ncaaf.t.29"). |
| `broadcast_channels` | list | JSON-encoded list of the channels broadcasting the event. |
| `news_break_subtext` | character | Secondary line of the news-break banner attached to the game. |
| `news_break_title` | character | Headline of the news-break banner attached to the game. |
| `news_break_url` | character | URL of the article behind the game's news-break banner. |
| `news_break_uuid` | character | Yahoo content UUID of the article behind the game's news-break banner. |
| `news_break_type` | character | Category of the news-break banner, such as an injury note, preview or recap. |
| `brief` | character | Short editorial blurb summarizing the game's state or result. |
| `event_extended_display_name` | character | Long-form event title used for marquee games, such as a bowl or rivalry name. |
| `special_event_type` | character | Marker identifying a special framing for the game, such as a bowl game or neutral-site showcase. |
| `bets` | list | JSON-encoded list of the betting markets offered on the event (spread, moneyline and total). |
| `venue_display_name` | character | Name of the venue hosting the event. |
| `weather` | character |  |
| `gametime_ticket_url` | character | Gametime affiliate ticket-purchase URL for the event or team. |
| `game_ticket_price` | character | Lowest available ticket price for the game from the Gametime affiliate feed, in US dollars. |
| `teams` | list |  |
| `field_position` | character | Ball spot expressed on Yahoo's 0-100 field scale, measured toward the offense's target goal line. |
| `field_position_display_name` | character | Ball spot rendered the way a scoreboard shows it (e.g., "MICH 35"). |
| `team_possessing_ball` | character | Yahoo team id of the side currently possessing the ball. |
| `week` | numeric |  |
| `passing_leader` | list | JSON-encoded leading passer for the game or team, with the statistics that earned the billing. |
| `rushing_leader` | list | JSON-encoded leading rusher for the game or team, with the statistics that earned the billing. |
| `receiving_leader` | list | JSON-encoded leading receiver for the game or team, with the statistics that earned the billing. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_stats_football_defense_ncaaf` / `yahooSeasonStatsFootballDefenseNcaaf`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_stats_football_kicking_ncaaf` / `yahooSeasonStatsFootballKickingNcaaf`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_stats_football_passing_ncaaf` / `yahooSeasonStatsFootballPassingNcaaf`

| col_name | type | description |
|---|---|---|
| `stats` | character |  |
| `player_display_name` | character |  |
| `player_player_id` | character | Yahoo composite player id of the leader-board entry (e.g., "ncaaf.p.464024"); always carried as Utf8. |
| `player_team_display_name` | character |  |
| `player_team_abbreviation` | character |  |
| `player_team_team_logo_url` | character |  |
| `player_positions` | character | JSON-encoded list of the positions the leader-board entry plays, each with a name, abbreviation and position id (e.g., [\{"name": "Quarterback", "abbreviation": "QB", "positionId": "QUARTERBACK"\}]). |
| `player_alias_url` | character |  |
| `player_player_cutout` | character | JSON-encoded image node for the leader-board entry's transparent cut-out portrait. |
| `player_player_cutout_url` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_stats_football_punting_ncaaf` / `yahooSeasonStatsFootballPuntingNcaaf`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_stats_football_receiving_ncaaf` / `yahooSeasonStatsFootballReceivingNcaaf`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_stats_football_returns_ncaaf` / `yahooSeasonStatsFootballReturnsNcaaf`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_stats_football_rushing_ncaaf` / `yahooSeasonStatsFootballRushingNcaaf`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_defense` / `yahooSeasonTeamStatsFootballDefense`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_kicking` / `yahooSeasonTeamStatsFootballKicking`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_kickoffs` / `yahooSeasonTeamStatsFootballKickoffs`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_offense` / `yahooSeasonTeamStatsFootballOffense`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_passing` / `yahooSeasonTeamStatsFootballPassing`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_passing_defense` / `yahooSeasonTeamStatsFootballPassingDefense`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_punting` / `yahooSeasonTeamStatsFootballPunting`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_receiving` / `yahooSeasonTeamStatsFootballReceiving`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_receiving_defense` / `yahooSeasonTeamStatsFootballReceivingDefense`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_returns` / `yahooSeasonTeamStatsFootballReturns`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_rushing` / `yahooSeasonTeamStatsFootballRushing`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_season_team_stats_football_rushing_defense` / `yahooSeasonTeamStatsFootballRushingDefense`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_team_injuries` / `yahooTeamInjuries`

| col_name | type | description |
|---|---|---|
| `team_id` | character |  |
| `nickname` | character |  |
| `full_name` | character |  |
| `location` | character |  |
| `display_name` | character |  |
| `primary_color` | character |  |
| `abbreviation` | character |  |
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `team_logo_white_url` | character | Absolute URL of the team's white knockout logo, the variant used on dark backgrounds. |
| `team_logo_url` | character | Absolute URL of the team's standard logo image on Yahoo's image CDN. |
| `players` | list |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_team_playoff_series` / `yahooTeamPlayoffSeries`

| col_name | type | description |
|---|---|---|
| `playoff_series` | list | JSON-encoded playoff-series node the game belongs to. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_team_roster` / `yahooTeamRoster`

| col_name | type | description |
|---|---|---|
| `league_current_season` | character | Yahoo league-season identifier for the league's season currently in progress. |
| `roster` | list | JSON-encoded roster of the players on the team for the requested season. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_team_schedule_by_season` / `yahooTeamScheduleBySeason`

| col_name | type | description |
|---|---|---|
| `team_id` | character |  |
| `display_name` | character |  |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `gametime_ticket_url` | character | Gametime affiliate ticket-purchase URL for the event or team. |
| `bye_weeks` | list | JSON-encoded list of the week numbers in which the team has no scheduled game. |
| `games` | list |  |
| `leagues` | list | JSON-encoded list of the league nodes the team's schedule spans. |
| `full_name` | character |  |
| `abbreviation` | character |  |
| `nickname` | character |  |
| `team_logo_white_url` | character | Absolute URL of the team's white knockout logo, the variant used on dark backgrounds. |
| `team_logo_url` | character | Absolute URL of the team's standard logo image on Yahoo's image CDN. |
| `team_standings_team_record` | character | Formatted overall record for the team (e.g., "8-2"). |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_team_search` / `yahooTeamSearch`

| col_name | type | description |
|---|---|---|
| `team_id` | character |  |
| `display_name` | character |  |
| `full_name` | character |  |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `abbreviation` | character |  |
| `league_short_name` | character |  |
| `league_display_short` | character | Short league label used in navigation and compact UI (e.g., "NCAA FB"). |
| `league_name` | character |  |
| `team_logo_url` | character | Absolute URL of the team's standard logo image on Yahoo's image CDN. |
| `team_logo_white_url` | character | Absolute URL of the team's white knockout logo, the variant used on dark backgrounds. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_team_stats_leaders_v2` / `yahooTeamStatsLeadersV2`

No returns table is published for this endpoint: these columns were written for parse_yahoo_stats's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_team_transactions` / `yahooTeamTransactions`

| col_name | type | description |
|---|---|---|
| `team_id` | character |  |
| `nickname` | character |  |
| `full_name` | character |  |
| `location` | character |  |
| `display_name` | character |  |
| `primary_color` | character |  |
| `abbreviation` | character |  |
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_domain` | character | Host the entity's Yahoo alias resolves against (e.g., "sports.yahoo.com"). |
| `team_logo_white_url` | character | Absolute URL of the team's white knockout logo, the variant used on dark backgrounds. |
| `team_logo_url` | character | Absolute URL of the team's standard logo image on Yahoo's image CDN. |
| `transactions` | list | JSON-encoded list of the team's roster transactions over the requested window. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_teams_basic` / `yahooTeamsBasic`

| col_name | type | description |
|---|---|---|
| `team_id` | character |  |
| `team_logo_url` | character | Absolute URL of the team's standard logo image on Yahoo's image CDN. |
| `team_logo_white_url` | character | Absolute URL of the team's white knockout logo, the variant used on dark backgrounds. |
| `display_name` | character |  |
| `full_name` | character |  |
| `nickname` | character |  |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `abbreviation` | character |  |
| `league_display_short` | character | Short league label used in navigation and compact UI (e.g., "NCAA FB"). |
| `league_name` | character |  |
| `league_short_name` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_tennis_matches_by_date` / `yahooTennisMatchesByDate`

| col_name | type | description |
|---|---|---|
| `display_name` | character |  |
| `tournament_status` | character | State of the tournament, distinguishing scheduled, in-progress and completed events. |
| `start_time` | character |  |
| `end_time` | character |  |
| `events` | list |  |
| `champions` | list | JSON-encoded list of the current champions of the tennis event, one entry per draw. |
| `previous_champions` | list | JSON-encoded list of the champions of the previous edition of the tennis event. |
| `venue_country` | character | Country the venue is located in. |
| `venue_city` | character |  |
| `venue_state` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_tennis_tournament` / `yahooTennisTournament`

| col_name | type | description |
|---|---|---|
| `display_name` | character |  |
| `tournament_status` | character | State of the tournament, distinguishing scheduled, in-progress and completed events. |
| `start_time` | character |  |
| `end_time` | character |  |
| `events` | list |  |
| `champions` | list | JSON-encoded list of the current champions of the tennis event, one entry per draw. |
| `previous_champions` | list | JSON-encoded list of the champions of the previous edition of the tennis event. |
| `venue_country` | character | Country the venue is located in. |
| `venue_city` | character |  |
| `venue_state` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `yahoo_tennis_tournaments` / `yahooTennisTournaments`

| col_name | type | description |
|---|---|---|
| `gender` | character |  |
| `event_group_id` | character | Yahoo identifier that groups the rounds or legs making up a single tournament. |
| `display_name` | character |  |
| `match_type` | character | Format of the matches in the tennis draw (e.g., "SINGLES", "DOUBLES"). |
| `surface` | character |  |
| `start_time` | character |  |
| `end_time` | character |  |
| `tournament_status` | character | State of the tournament, distinguishing scheduled, in-progress and completed events. |
| `champions` | list | JSON-encoded list of the current champions of the tennis event, one entry per draw. |
| `alias_path` | character | Site-relative path portion of the entity's Yahoo alias (e.g., "/ncaaf/teams/tcu/"). |
| `alias_lang` | character | Language/locale tag attached to the entity's Yahoo alias (e.g., "en-US"). |
| `alias_url` | character | Absolute sports.yahoo.com URL of the entity's page (e.g., "https://sports.yahoo.com/ncaaf/players/464024/"). |
| `alias_domain` | character | Host the entity's Yahoo alias resolves against (e.g., "sports.yahoo.com"). |
| `previous_champions` | list | JSON-encoded list of the champions of the previous edition of the tennis event. |
| `venue_country` | character | Country the venue is located in. |
| `venue_city` | character |  |
| `venue_state` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/yahoo_scores.yaml (JS-owned) + tools/codegen/endpoints/yahoo.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._

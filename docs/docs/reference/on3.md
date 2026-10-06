---
title: on3
sidebar_label: on3
sidebar_position: 40
toc_max_heading_level: 2
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `on3` — native provider reference

- **namespace:** `sdv.on3` *(standalone — not an ESPN league)*
- **families:** On3 Recruit Database
- **wrappers:** 78 native

`on3` is a cross-sport provider namespace (no ESPN `{sport}`/`{league}` nesting). Every method is exposed under BOTH its snake_case name (`<family>_<endpoint>`, py/R parity) and a camelCase canonical name (`<family><Endpoint>`) on `sdv.on3`. Pass `{ parsed: true }` to any endpoint to get tidy rows instead of raw JSON.

```js
import sdv from 'sportsdataverse';

// The On3 Recruit Database is keyless:
await sdv.on3.on3_player_profile({ person_key: 89617, parsed: true });
```

## Native API — On3 Recruit Database

Flat (non-ESPN) wrappers for the On3 public Recruit Database (RDB). Host: `https://api.on3.com/public/rdb/v1`. Each method is exposed under BOTH its snake_case name `on3_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.on3`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `on3_coaches_history` / `on3CoachesHistory` | `https://api.on3.com/public/rdb/v1/coaches/{person_key}/history` | `person_key`\* | `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_coaches_profile` / `on3CoachesProfile` | `https://api.on3.com/public/rdb/v1/coaches/{person_key}/profile` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_collective_groups` / `on3CollectiveGroups` | `https://api.on3.com/public/rdb/v1/collective-groups` | — | `sport_key` → `sportKey`, `organization_key` → `organizationKey`, `query`, `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_collective_groups_deals` / `on3CollectiveGroupsDeals` | `https://api.on3.com/public/rdb/v1/collective-groups/{key}/deals` | `key`\* | `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_collective_groups_key` / `on3CollectiveGroupsKey` | `https://api.on3.com/public/rdb/v1/collective-groups/{key}` | `key`\* | — | `parse_on3_rdb` | — |
| `on3_commits_latest` / `on3CommitsLatest` | `https://api.on3.com/public/rdb/v1/commits/latest` | — | `sport_key` → `sportKey`, `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_commits_organizations_latest_commits` / `on3CommitsOrganizationsLatestCommits` | `https://api.on3.com/public/rdb/v1/commits/organizations/{org_key}/latest-commits` | `org_key`\* | — | `parse_on3_rdb` | — |
| `on3_commits_organizations_org_key` / `on3CommitsOrganizationsOrgKey` | `https://api.on3.com/public/rdb/v1/commits/organizations/{org_key}` | `org_key`\* | — | `parse_on3_rdb` | — |
| `on3_draft_organization_rank` / `on3DraftOrganizationRank` | `https://api.on3.com/public/rdb/v1/draft-organization-rank` | — | `sport_key` → `sportKey`, `year`, `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_draft_pick_organization_rank` / `on3DraftPickOrganizationRank` | `https://api.on3.com/public/rdb/v1/draft-pick-organization-rank` | — | `sport_key` → `sportKey`, `year`, `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_drafts` / `on3Drafts` | `https://api.on3.com/public/rdb/v1/drafts` | — | `sport_key` → `sportKey`, `round`, `year` | `parse_on3_rdb` | — |
| `on3_drafts_by_stars` / `on3DraftsByStars` | `https://api.on3.com/public/rdb/v1/drafts-by-stars` | — | `sport_key` → `sportKey`, `year`, `year_span` → `yearSpan` | `parse_on3_rdb` | — |
| `on3_drafts_by_stars_summary` / `on3DraftsByStarsSummary` | `https://api.on3.com/public/rdb/v1/drafts-by-stars-summary` | — | `sport_key` → `sportKey`, `year` | `parse_on3_rdb` | — |
| `on3_drafts_players` / `on3DraftsPlayers` | `https://api.on3.com/public/rdb/v1/drafts/{org_key}/players` | `org_key`\* | `year` | `parse_on3_rdb` | — |
| `on3_filters_conferences` / `on3FiltersConferences` | `https://api.on3.com/public/rdb/v1/filters/conferences` | — | `year`, `sport_key` → `sportKey` | `parse_on3_rdb` | — |
| `on3_filters_draft_rounds` / `on3FiltersDraftRounds` | `https://api.on3.com/public/rdb/v1/filters/draft-rounds` | — | `year`, `sport_key` → `sportKey` | `parse_on3_rdb` | — |
| `on3_filters_positions` / `on3FiltersPositions` | `https://api.on3.com/public/rdb/v1/filters/positions` | — | `sport_key` → `sportKey`, `position_type` → `positionType` | `parse_on3_rdb` | — |
| `on3_filters_sports` / `on3FiltersSports` | `https://api.on3.com/public/rdb/v1/filters/sports` | — | — | `parse_on3_rdb` | — |
| `on3_filters_status` / `on3FiltersStatus` | `https://api.on3.com/public/rdb/v1/filters/status` | — | — | `parse_on3_rdb` | — |
| `on3_filters_teams` / `on3FiltersTeams` | `https://api.on3.com/public/rdb/v1/filters/teams` | — | `group_by` → `groupBy`, `year`, `sport_key` → `sportKey` | `parse_on3_rdb` | — |
| `on3_filters_years` / `on3FiltersYears` | `https://api.on3.com/public/rdb/v1/filters/years` | — | — | `parse_on3_rdb` | — |
| `on3_nil_100` / `on3Nil100` | `https://api.on3.com/public/rdb/v1/nil-100` | — | `year` | `parse_on3_rdb` | — |
| `on3_nil_100_v2` / `on3Nil100V2` | `https://api.on3.com/public/rdb/v2/nil-100` | — | `year`, `org_key` → `orgKey`, `limit`, `page` | `parse_on3_rdb` | — |
| `on3_nil_compliances_state` / `on3NilCompliancesState` | `https://api.on3.com/public/rdb/v1/nil-compliances/state` | — | `state_key` → `stateKey` | `parse_on3_rdb` | — |
| `on3_nil_rankings` / `on3NilRankings` | `https://api.on3.com/public/rdb/v1/nil-rankings` | — | `sport_key` → `sportKey`, `gender`, `year`, `org_type` → `orgType`, `position_abbr` → `positionAbbr`, `state_abbr` → `stateAbbr` | `parse_on3_rdb` | — |
| `on3_organizations_draft_class_by_state` / `on3OrganizationsDraftClassByState` | `https://api.on3.com/public/rdb/v1/organizations/{organization_key}/draft-class-by-state` | `organization_key`\* | `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_organizations_draft_class_by_year` / `on3OrganizationsDraftClassByYear` | `https://api.on3.com/public/rdb/v1/organizations/{organization_key}/draft-class-by-year` | `organization_key`\* | `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_organizations_draft_count_by_stars` / `on3OrganizationsDraftCountByStars` | `https://api.on3.com/public/rdb/v1/organizations/{organization_key}/draft-count-by-stars` | `organization_key`\* | — | `parse_on3_rdb` | — |
| `on3_organizations_draft_count_by_year` / `on3OrganizationsDraftCountByYear` | `https://api.on3.com/public/rdb/v1/organizations/{organization_key}/draft-count-by-year` | `organization_key`\* | `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_organizations_draft_ranking_summary` / `on3OrganizationsDraftRankingSummary` | `https://api.on3.com/public/rdb/v1/organizations/{organization_key}/draft-ranking-summary` | `organization_key`\* | `year` | `parse_on3_rdb` | — |
| `on3_organizations_drafted_players` / `on3OrganizationsDraftedPlayers` | `https://api.on3.com/public/rdb/v1/organizations/{organization_key}/drafted-players` | `organization_key`\* | `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_organizations_drafts_by_stars_summary` / `on3OrganizationsDraftsByStarsSummary` | `https://api.on3.com/public/rdb/v1/organizations/{organization_key}/drafts-by-stars-summary` | `organization_key`\* | `year` | `parse_on3_rdb` | — |
| `on3_organizations_roster` / `on3OrganizationsRoster` | `https://api.on3.com/public/rdb/v1/organizations/{organization_key}/roster` | `organization_key`\* | `sport_key` → `sportKey`, `year`, `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_organizations_roster_header` / `on3OrganizationsRosterHeader` | `https://api.on3.com/public/rdb/v1/organizations/{organization_key}/roster-header` | `organization_key`\* | `sport_key` → `sportKey`, `year` | `parse_on3_rdb` | — |
| `on3_people_combine_measurements` / `on3PeopleCombineMeasurements` | `https://api.on3.com/public/rdb/v1/people/{person_key}/combine-measurements` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_people_latest_valuation` / `on3PeopleLatestValuation` | `https://api.on3.com/public/rdb/v1/people/{person_key}/latest-valuation` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_people_measurements` / `on3PeopleMeasurements` | `https://api.on3.com/public/rdb/v1/people/{person_key}/measurements` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_people_measurements_averages` / `on3PeopleMeasurementsAverages` | `https://api.on3.com/public/rdb/v1/people/{person_key}/measurements/averages` | `person_key`\* | `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_people_person_connections` / `on3PeoplePersonConnections` | `https://api.on3.com/public/rdb/v1/people/{person_key}/person-connections` | `person_key`\* | `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_people_social` / `on3PeopleSocial` | `https://api.on3.com/public/rdb/v1/people/{person_key}/social` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_people_social_post_summary` / `on3PeopleSocialPostSummary` | `https://api.on3.com/public/rdb/v1/people/{person_key}/social-post-summary` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_people_track_and_field_measurements` / `on3PeopleTrackAndFieldMeasurements` | `https://api.on3.com/public/rdb/v1/people/{person_key}/track-and-field-measurements` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_people_valuation_growth` / `on3PeopleValuationGrowth` | `https://api.on3.com/public/rdb/v1/people/{person_key}/valuation-growth` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_person_connections_connection_key` / `on3PersonConnectionsConnectionKey` | `https://api.on3.com/public/rdb/v1/person-connections/{connection_key}` | `connection_key`\* | — | `parse_on3_rdb` | — |
| `on3_person_primary_recruitment_evaluation` / `on3PersonPrimaryRecruitmentEvaluation` | `https://api.on3.com/public/rdb/v1/person/{person_key}/primary-recruitment-evaluation` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_person_recruitment_evaluations` / `on3PersonRecruitmentEvaluations` | `https://api.on3.com/public/rdb/v1/person/{person_key}/recruitment-evaluations` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_person_sport_profile_recruit` / `on3PersonSportProfileRecruit` | `https://api.on3.com/public/rdb/v1/person-sport/{ps_key}/profile-recruit` | `ps_key`\* | — | `parse_on3_rdb` | — |
| `on3_person_sport_rankings` / `on3PersonSportRankings` | `https://api.on3.com/public/rdb/v1/person-sport-rankings` | — | `sport_key` → `sportKey`, `year`, `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_player_all_rankings` / `on3PlayerAllRankings` | `https://api.on3.com/public/rdb/v1/player/{person_key}/all-rankings` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_player_database_updates` / `on3PlayerDatabaseUpdates` | `https://api.on3.com/public/rdb/v1/player/{person_key}/database-updates` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_player_images` / `on3PlayerImages` | `https://api.on3.com/public/rdb/v1/player/{person_key}/images` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_player_organizations` / `on3PlayerOrganizations` | `https://api.on3.com/public/rdb/v1/player/{person_key}/organizations` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_player_organizations_org_key` / `on3PlayerOrganizationsOrgKey` | `https://api.on3.com/public/rdb/v1/player/{player_key}/organizations/{org_key}` | `player_key`\*, `org_key`\* | — | `parse_on3_rdb` | — |
| `on3_player_person_rankings` / `on3PlayerPersonRankings` | `https://api.on3.com/public/rdb/v1/player/{person_key}/rankings` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_player_profile` / `on3PlayerProfile` | `https://api.on3.com/public/rdb/v1/player/{person_key}/profile` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_player_team_targets` / `on3PlayerTeamTargets` | `https://api.on3.com/public/rdb/v1/player/{player_key}/team-targets` | `player_key`\* | — | `parse_on3_rdb` | — |
| `on3_player_verified` / `on3PlayerVerified` | `https://api.on3.com/public/rdb/v1/player/verified` | — | `sport_key` → `sportKey`, `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_player_videos` / `on3PlayerVideos` | `https://api.on3.com/public/rdb/v1/player/{person_key}/videos` | `person_key`\* | — | `parse_on3_rdb` | — |
| `on3_player_visit_center` / `on3PlayerVisitCenter` | `https://api.on3.com/public/rdb/v1/player/{player_key}/visit-center` | `player_key`\* | — | `parse_on3_rdb` | — |
| `on3_players_industry_comparision` / `on3PlayersIndustryComparision` | `https://api.on3.com/public/rdb/v1/players/industry-comparision` | — | `sport_key` → `sportKey`, `year`, `state_abbr` → `stateAbbr`, `position_abbr` → `positionAbbr`, `page`, `sort_by_industry` → `sortByIndustry` | `parse_on3_rdb` | — |
| `on3_players_industry_comparision_list` / `on3PlayersIndustryComparisionList` | `https://api.on3.com/public/rdb/v1/players/industry-comparision-list` | — | `sport_key` → `sportKey`, `year`, `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_predictions_user_key` / `on3PredictionsUserKey` | `https://api.on3.com/public/rdb/v1/predictions/{user_key}` | `user_key`\* | `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_quotes` / `on3Quotes` | `https://api.on3.com/public/rdb/v1/quotes` | — | `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_quotes_key` / `on3QuotesKey` | `https://api.on3.com/public/rdb/v1/quotes/{key}` | `key`\* | — | `parse_on3_rdb` | — |
| `on3_recruitment_primary_recruitment_evaluation` / `on3RecruitmentPrimaryRecruitmentEvaluation` | `https://api.on3.com/public/rdb/v1/recruitment/{recruitment_key}/primary-recruitment-evaluation` | `recruitment_key`\* | — | `parse_on3_rdb` | — |
| `on3_recruitment_recruitment_evaluations` / `on3RecruitmentRecruitmentEvaluations` | `https://api.on3.com/public/rdb/v1/recruitment/{recruitment_key}/recruitment-evaluations` | `recruitment_key`\* | — | `parse_on3_rdb` | — |
| `on3_recruitments_latest_rpm_picks` / `on3RecruitmentsLatestRpmPicks` | `https://api.on3.com/public/rdb/v1/recruitments/latest-rpm-picks` | — | `org_key` → `orgKey`, `year`, `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_recruitments_profile` / `on3RecruitmentsProfile` | `https://api.on3.com/public/rdb/v1/recruitments/{rec_key}/profile` | `rec_key`\* | — | `parse_on3_rdb` | — |
| `on3_recruitments_rpm_picks` / `on3RecruitmentsRpmPicks` | `https://api.on3.com/public/rdb/v1/recruitments/{rec_key}/rpm-picks` | `rec_key`\* | — | `parse_on3_rdb` | — |
| `on3_recruitments_rpm_summary` / `on3RecruitmentsRpmSummary` | `https://api.on3.com/public/rdb/v1/recruitments/{rec_key}/rpm-summary` | `rec_key`\* | — | `parse_on3_rdb` | — |
| `on3_team_ranking` / `on3TeamRanking` | `https://api.on3.com/public/rdb/v1/team-ranking` | — | `sport_key` → `sportKey`, `year`, `page`, `page_size` → `pageSize` | `parse_on3_rdb` | — |
| `on3_team_ranking_bluechips_team_rankings` / `on3TeamRankingBluechipsTeamRankings` | `https://api.on3.com/public/rdb/v1/team-ranking/{sport_slug}-{year}/bluechips-team-rankings` | `sport_slug`\*, `year`\* | — | `parse_on3_rdb` | — |
| `on3_team_ranking_consensus_team_rankings` / `on3TeamRankingConsensusTeamRankings` | `https://api.on3.com/public/rdb/v1/team-ranking/{sport_slug}-{year}/consensus-team-rankings` | `sport_slug`\*, `year`\* | — | `parse_on3_rdb` | — |
| `on3_team_ranking_organizations_summary` / `on3TeamRankingOrganizationsSummary` | `https://api.on3.com/public/rdb/v1/team-ranking/organizations/{org_key}/summary` | `org_key`\* | — | `parse_on3_rdb` | — |
| `on3_team_ranking_team_rankings` / `on3TeamRankingTeamRankings` | `https://api.on3.com/public/rdb/v1/team-ranking/{sport_slug}-{year}/team-rankings` | `sport_slug`\*, `year`\* | — | `parse_on3_rdb` | — |
| `on3_transfers_best_available` / `on3TransfersBestAvailable` | `https://api.on3.com/public/rdb/v1/transfers/best-available` | — | `org_key` → `orgKey`, `sport_key` → `sportKey`, `year`, `position_abbr` → `positionAbbr`, `status`, `page`, `cutoff`, `order_by` → `orderBy` | `parse_on3_rdb` | — |
| `on3_transfers_latest` / `on3TransfersLatest` | `https://api.on3.com/public/rdb/v1/transfers/latest` | — | `org_key` → `orgKey`, `sport_key` → `sportKey`, `year`, `position_abbr` → `positionAbbr`, `status`, `page` | `parse_on3_rdb` | — |
| `on3_videos_video_key` / `on3VideosVideoKey` | `https://api.on3.com/public/rdb/v1/videos/{video_key}` | `video_key`\* | — | `parse_on3_rdb` | — |

### Returns — `on3_coaches_history` / `on3CoachesHistory`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_coaches_profile` / `on3CoachesProfile`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_collective_groups` / `on3CollectiveGroups`

| col_name | type | description |
|---|---|---|
| `key` | integer | On3 RDB key for the NIL collective group. |
| `name` | character |  |
| `default_asset_key` | integer | On3 asset key for the collective's primary logo image. |
| `social_asset_key` | integer | On3 asset key for the collective's social-media image. |
| `organization_key` | integer | On3 organization key of the school the collective supports. |
| `launch_date` | character | Date the NIL collective launched. |
| `organization_type` | character |  |
| `twitter_handle` | character | Collective's Twitter/X account handle. |
| `instagram_handle` | character | Collective's Instagram account handle. |
| `tik_tok_handle` | character | Collective's TikTok account handle. |
| `youtube_handle` | character | Collective's YouTube channel handle. |
| `linked_in_handle` | character | Collective's LinkedIn account handle. |
| `website_name` | character | Display name of the collective's website. |
| `website_url` | character | URL of the collective's website. |
| `mission_statement` | character | Collective's stated mission, as published to On3. |
| `description` | character |  |
| `annual_goal_amount` | numeric | Collective's annual fundraising goal in dollars, as reported to On3. |
| `confirmed_raised_amount` | numeric | Dollar amount the collective has confirmed raising, per On3. |
| `merged_into_group_key` | integer | On3 key of the collective this group merged into, when applicable. |
| `merged_into_group` | character | Nested On3 record for the collective this group merged into (stringified). |
| `slug` | character |  |
| `founders` | character | Founders of the collective, as a stringified list. |
| `sports` | character | Sports the collective funds, as a stringified list. |
| `default_asset_key_2` | integer |  |
| `default_asset_domain_override` | character |  |
| `default_asset_domain` | character |  |
| `default_asset_source_override` | character |  |
| `default_asset_source` | character |  |
| `default_asset_title` | character |  |
| `default_asset_description` | character |  |
| `default_asset_caption` | character |  |
| `default_asset_category` | character |  |
| `default_asset_alt_text` | character |  |
| `default_asset_height` | integer |  |
| `default_asset_width` | integer |  |
| `default_asset_asset_type` | character |  |
| `default_asset_file_system` | character |  |
| `default_asset_path` | character |  |
| `default_asset_type` | character |  |
| `default_asset_thumbnail` | character |  |
| `default_asset_duration` | integer |  |
| `default_asset_mime_type` | character |  |
| `social_asset_key_2` | integer |  |
| `social_asset_domain_override` | character |  |
| `social_asset_domain` | character |  |
| `social_asset_source_override` | character |  |
| `social_asset_source` | character |  |
| `social_asset_title` | character |  |
| `social_asset_description` | character |  |
| `social_asset_caption` | character |  |
| `social_asset_category` | character |  |
| `social_asset_alt_text` | character |  |
| `social_asset_height` | integer |  |
| `social_asset_width` | integer |  |
| `social_asset_asset_type` | character |  |
| `social_asset_file_system` | character |  |
| `social_asset_path` | character |  |
| `social_asset_type` | character |  |
| `social_asset_thumbnail` | character |  |
| `social_asset_duration` | integer |  |
| `social_asset_mime_type` | character |  |
| `organization_key_2` | integer |  |
| `organization_full_name` | character |  |
| `organization_name` | character |  |
| `organization_known_as` | character |  |
| `organization_mascot` | character |  |
| `organization_abbreviation` | character |  |
| `organization_asset_url` | character |  |
| `organization_default_asset_key` | integer |  |
| `organization_default_asset_domain_override` | character |  |
| `organization_default_asset_domain` | character |  |
| `organization_default_asset_source_override` | character |  |
| `organization_default_asset_source` | character |  |
| `organization_default_asset_title` | character |  |
| `organization_default_asset_description` | character |  |
| `organization_default_asset_caption` | character |  |
| `organization_default_asset_category` | character |  |
| `organization_default_asset_alt_text` | character |  |
| `organization_default_asset_height` | integer |  |
| `organization_default_asset_width` | integer |  |
| `organization_default_asset_asset_type` | character |  |
| `organization_default_asset_file_system` | character |  |
| `organization_default_asset_path` | character |  |
| `organization_default_asset_type` | character |  |
| `organization_default_asset_thumbnail` | character |  |
| `organization_default_asset_duration` | integer |  |
| `organization_default_asset_mime_type` | character |  |
| `organization_slug` | character |  |
| `organization_primary_color` | character |  |
| `organization_org_type` | character |  |
| `organization_org_type_enum` | character |  |
| `organization_division` | character |  |
| `organization_site_keys` | character |  |
| `organization_url_slug` | character |  |

**Row type:** `On3CollectiveGroupsRow` (exported from the package root).

### Returns — `on3_collective_groups_deals` / `on3CollectiveGroupsDeals`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_collective_groups_key` / `on3CollectiveGroupsKey`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_commits_organizations_latest_commits` / `on3CommitsOrganizationsLatestCommits`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_commits_organizations_org_key` / `on3CommitsOrganizationsOrgKey`

No returns table is published for this endpoint: no committed capture with rows; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_draft_organization_rank` / `on3DraftOrganizationRank`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_draft_pick_organization_rank` / `on3DraftPickOrganizationRank`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_drafts` / `on3Drafts`

No returns table is published for this endpoint: its committed capture has 0 rows, so the parser emits no columns; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_drafts_by_stars` / `on3DraftsByStars`

| col_name | type | description |
|---|---|---|
| `blue_chip_percent` | numeric | Percent of the drafted group who were blue-chip (four- or five-star) recruits. |
| `population_percent` | numeric | Percent of the overall recruit population holding this star rating. |
| `talent_ratio` | numeric | Ratio of the star tier's draft share to its population share (On3's talent ratio). |
| `five_stars` | integer | Number of drafted players who were five-star recruits. |
| `four_stars` | integer | Number of drafted players who were four-star recruits. |
| `three_stars` | integer | Number of drafted players who were three-star recruits. |
| `zero_stars` | integer | Number of drafted players who were unrated (zero-star) recruits. |
| `total` | integer |  |
| `state_key` | integer |  |
| `state_name` | character |  |
| `state_abbreviation` | character |  |
| `state_country_key` | integer |  |

**Row type:** `On3DraftsByStarsRow` (exported from the package root).

### Returns — `on3_drafts_by_stars_summary` / `on3DraftsByStarsSummary`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_drafts_players` / `on3DraftsPlayers`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_filters_conferences` / `on3FiltersConferences`

No returns table is published for this endpoint: no committed capture with rows; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_filters_draft_rounds` / `on3FiltersDraftRounds`

| col_name | type | description |
|---|---|---|
| `round` | integer |  |

**Row type:** `On3FiltersDraftRoundsRow` (exported from the package root).

### Returns — `on3_filters_positions` / `on3FiltersPositions`

No returns table is published for this endpoint: no committed capture with rows; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_filters_sports` / `on3FiltersSports`

No returns table is published for this endpoint: no committed capture with rows; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_filters_status` / `on3FiltersStatus`

| col_name | type | description |
|---|---|---|
| `value` | character |  |

**Row type:** `On3FiltersStatusRow` (exported from the package root).

### Returns — `on3_filters_teams` / `on3FiltersTeams`

No returns table is published for this endpoint: no committed capture with rows; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_filters_years` / `on3FiltersYears`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_nil_100` / `on3Nil100`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_nil_100_v2` / `on3Nil100V2`

| col_name | type | description |
|---|---|---|
| `person_rating_consensus_rating` | numeric |  |
| `person_rating_consensus_stars` | integer |  |
| `person_rating_consensus_national_rank` | integer |  |
| `person_rating_consensus_position_rank` | integer |  |
| `person_rating_consensus_state_rank` | integer |  |
| `person_rating_key` | integer |  |
| `person_rating_rating` | numeric |  |
| `person_rating_stars` | integer |  |
| `person_rating_national_rank` | integer |  |
| `person_rating_position_rank` | integer |  |
| `person_rating_state_rank` | integer |  |
| `person_rating_position_abbr` | character |  |
| `person_rating_state_abbr` | character |  |
| `person_rating_five_star_plus` | logical |  |
| `person_division` | character |  |
| `person_default_sport_key` | integer |  |
| `person_default_sport_name` | character |  |
| `person_organization_level` | character |  |
| `person_age` | numeric |  |
| `person_tags` | character |  |
| `person_key` | integer |  |
| `person_recruitment_key` | integer |  |
| `person_name` | character |  |
| `person_slug` | character |  |
| `person_high_school_name` | character |  |
| `person_high_school_key` | integer |  |
| `person_high_school_full_name` | character |  |
| `person_high_school_name_2` | character |  |
| `person_high_school_known_as` | character |  |
| `person_high_school_mascot` | character |  |
| `person_high_school_abbreviation` | character |  |
| `person_high_school_asset_url` | character |  |
| `person_high_school_default_asset_key` | numeric |  |
| `person_high_school_default_asset_domain_override` | character |  |
| `person_high_school_default_asset_domain` | character |  |
| `person_high_school_default_asset_source_override` | character |  |
| `person_high_school_default_asset_source` | character |  |
| `person_high_school_default_asset_title` | character |  |
| `person_high_school_default_asset_description` | character |  |
| `person_high_school_default_asset_caption` | character |  |
| `person_high_school_default_asset_category` | character |  |
| `person_high_school_default_asset_alt_text` | character |  |
| `person_high_school_default_asset_height` | numeric |  |
| `person_high_school_default_asset_width` | numeric |  |
| `person_high_school_default_asset_asset_type` | character |  |
| `person_high_school_default_asset_file_system` | character |  |
| `person_high_school_default_asset_path` | character |  |
| `person_high_school_default_asset_type` | character |  |
| `person_high_school_default_asset_thumbnail` | character |  |
| `person_high_school_default_asset_duration` | numeric |  |
| `person_high_school_default_asset_mime_type` | character |  |
| `person_high_school_slug` | character |  |
| `person_high_school_primary_color` | character |  |
| `person_high_school_org_type` | character |  |
| `person_high_school_org_type_enum` | character |  |
| `person_high_school_division` | character |  |
| `person_high_school_site_keys` | character |  |
| `person_high_school_url_slug` | character |  |
| `person_home_town_name` | character |  |
| `person_early_enrollee` | logical |  |
| `person_early_signee` | logical |  |
| `person_default_asset_url` | character |  |
| `person_class_year` | integer |  |
| `person_athlete_verified` | logical |  |
| `person_prospect_verified` | logical |  |
| `person_default_asset_key` | integer |  |
| `person_default_asset_domain_override` | character |  |
| `person_default_asset_domain` | character |  |
| `person_default_asset_source_override` | character |  |
| `person_default_asset_source` | character |  |
| `person_default_asset_title` | character |  |
| `person_default_asset_description` | character |  |
| `person_default_asset_caption` | character |  |
| `person_default_asset_category` | character |  |
| `person_default_asset_alt_text` | character |  |
| `person_default_asset_height` | integer |  |
| `person_default_asset_width` | integer |  |
| `person_default_asset_asset_type` | character |  |
| `person_default_asset_file_system` | character |  |
| `person_default_asset_path` | character |  |
| `person_default_asset_type` | character |  |
| `person_default_asset_thumbnail` | character |  |
| `person_default_asset_duration` | integer |  |
| `person_default_asset_mime_type` | character |  |
| `person_position_abbreviation` | character |  |
| `person_height` | character |  |
| `person_weight` | integer |  |
| `person_roster_rating` | character |  |
| `person_commit_status_type` | character |  |
| `person_commit_status_short_term_signee` | logical |  |
| `person_commit_status_date` | character |  |
| `person_commit_status_committed_asset` | character |  |
| `person_commit_status_committed_asset_res` | character |  |
| `person_commit_status_transferred_asset_key` | integer |  |
| `person_commit_status_transferred_asset_url` | character |  |
| `person_commit_status_transferred_asset_slug` | character |  |
| `person_commit_status_transferred_asset_full_name` | character |  |
| `person_commit_status_transferred_asset_res` | character |  |
| `person_commit_status_committed_organization_key` | integer |  |
| `person_commit_status_committed_organization_full_name` | character |  |
| `person_commit_status_committed_organization_name` | character |  |
| `person_commit_status_committed_organization_mascot` | character |  |
| `person_commit_status_committed_organization_abbreviation` | character |  |
| `person_commit_status_committed_organization_asset_url` | character |  |
| `person_commit_status_committed_organization_asset_key` | integer |  |
| `person_commit_status_committed_organization_asset_domain_override` | character |  |
| `person_commit_status_committed_organization_asset_domain` | character |  |
| `person_commit_status_committed_organization_asset_source_override` | character |  |
| `person_commit_status_committed_organization_asset_source` | character |  |
| `person_commit_status_committed_organization_asset_title` | character |  |
| `person_commit_status_committed_organization_asset_description` | character |  |
| `person_commit_status_committed_organization_asset_caption` | character |  |
| `person_commit_status_committed_organization_asset_category` | character |  |
| `person_commit_status_committed_organization_asset_alt_text` | character |  |
| `person_commit_status_committed_organization_asset_height` | integer |  |
| `person_commit_status_committed_organization_asset_width` | integer |  |
| `person_commit_status_committed_organization_asset_asset_type` | character |  |
| `person_commit_status_committed_organization_asset_file_system` | character |  |
| `person_commit_status_committed_organization_asset_path` | character |  |
| `person_commit_status_committed_organization_asset_type` | character |  |
| `person_commit_status_committed_organization_asset_thumbnail` | character |  |
| `person_commit_status_committed_organization_asset_duration` | integer |  |
| `person_commit_status_committed_organization_asset_mime_type` | character |  |
| `person_commit_status_committed_organization_slug` | character |  |
| `person_commit_status_committed_organization_primary_color` | character |  |
| `person_commit_status_class_rank` | character |  |
| `person_commit_status_transfer_entered` | character |  |
| `person_commit_status_recruitment_year` | integer |  |
| `person_commit_status_decommitted_asset` | character |  |
| `person_commit_status_transfer` | logical |  |
| `person_commit_status_expected_to_transfer` | logical |  |
| `person_commit_status_recruitment_key` | integer |  |
| `person_commit_status_withdrawn_transfer` | logical |  |
| `person_commit_status_withdrawn_transfer_date` | character |  |
| `person_predictions` | character |  |
| `person_nil_status` | character |  |
| `person_nil_value` | numeric |  |
| `person_sport` | character |  |
| `valuation_nil_status` | character |  |
| `valuation_valuation` | integer |  |
| `valuation_valuation_change` | integer |  |
| `valuation_followers` | integer |  |
| `valuation_rank` | integer |  |
| `valuation_last_updated` | integer |  |
| `valuation_whisper` | numeric |  |
| `valuation_whisper_change` | numeric |  |
| `valuation_social_valuations` | character |  |
| `valuation_group_rank` | integer |  |
| `valuation_group_name` | character |  |
| `valuation_tags` | character |  |
| `valuation_roster_value` | character |  |
| `valuation_nil_value` | character |  |
| `person_high_school_default_asset` | character |  |

**Row type:** `On3Nil100V2Row` (exported from the package root).

### Returns — `on3_nil_compliances_state` / `on3NilCompliancesState`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_nil_rankings` / `on3NilRankings`

| col_name | type | description |
|---|---|---|
| `person_default_sport_key` | integer |  |
| `person_default_sport_name` | character |  |
| `person_default_sport_slug` | character |  |
| `person_default_sport_abbreviation` | character |  |
| `person_default_sport_is_rankable` | logical |  |
| `person_default_sport_is_industry_rankable` | logical |  |
| `person_default_sport_is_scoutable` | logical |  |
| `person_rating_consensus_rating` | numeric |  |
| `person_rating_consensus_stars` | integer |  |
| `person_rating_consensus_national_rank` | integer |  |
| `person_rating_consensus_position_rank` | integer |  |
| `person_rating_consensus_state_rank` | integer |  |
| `person_rating_key` | integer |  |
| `person_rating_rating` | numeric |  |
| `person_rating_stars` | integer |  |
| `person_rating_national_rank` | integer |  |
| `person_rating_position_rank` | integer |  |
| `person_rating_state_rank` | integer |  |
| `person_rating_position_abbr` | character |  |
| `person_rating_state_abbr` | character |  |
| `person_rating_five_star_plus` | logical |  |
| `person_status_is_committed` | logical |  |
| `person_status_is_signed` | logical |  |
| `person_status_is_transfer` | logical |  |
| `person_status_is_enrolled` | logical |  |
| `person_status_commitment_date` | character |  |
| `person_status_committed_organization_key` | numeric |  |
| `person_status_committed_organization_slug` | character |  |
| `person_status_committed_organization_asset_url` | character |  |
| `person_status_committed_organization_asset_key` | numeric |  |
| `person_status_committed_organization_asset_domain_override` | character |  |
| `person_status_committed_organization_asset_domain` | character |  |
| `person_status_committed_organization_asset_source_override` | character |  |
| `person_status_committed_organization_asset_source` | character |  |
| `person_status_committed_organization_asset_title` | character |  |
| `person_status_committed_organization_asset_description` | character |  |
| `person_status_committed_organization_asset_caption` | character |  |
| `person_status_committed_organization_asset_category` | character |  |
| `person_status_committed_organization_asset_alt_text` | character |  |
| `person_status_committed_organization_asset_height` | numeric |  |
| `person_status_committed_organization_asset_width` | numeric |  |
| `person_status_committed_organization_asset_asset_type` | character |  |
| `person_status_committed_organization_asset_file_system` | character |  |
| `person_status_committed_organization_asset_path` | character |  |
| `person_status_committed_organization_asset_type` | character |  |
| `person_status_committed_organization_asset_thumbnail` | character |  |
| `person_status_committed_organization_asset_duration` | numeric |  |
| `person_status_committed_organization_asset_mime_type` | character |  |
| `person_status_committed_organization_primary_color` | character |  |
| `person_status_transferred_from_organization_asset_url` | character |  |
| `person_status_transferred_from_organization_slug` | character |  |
| `person_status_highest_interest_level` | numeric |  |
| `person_status_interest_count` | integer |  |
| `person_status_recruitment_year` | integer |  |
| `person_status_sport_name` | character |  |
| `person_status_short_term_signee` | logical |  |
| `person_predictions` | character |  |
| `person_tags` | character |  |
| `person_key` | integer |  |
| `person_name` | character |  |
| `person_slug` | character |  |
| `person_high_school_name` | character |  |
| `person_high_school_key` | integer |  |
| `person_high_school_full_name` | character |  |
| `person_high_school_name_2` | character |  |
| `person_high_school_known_as` | character |  |
| `person_high_school_mascot` | character |  |
| `person_high_school_abbreviation` | character |  |
| `person_high_school_asset_url` | character |  |
| `person_high_school_default_asset_key` | integer |  |
| `person_high_school_default_asset_domain_override` | character |  |
| `person_high_school_default_asset_domain` | character |  |
| `person_high_school_default_asset_source_override` | character |  |
| `person_high_school_default_asset_source` | character |  |
| `person_high_school_default_asset_title` | character |  |
| `person_high_school_default_asset_description` | character |  |
| `person_high_school_default_asset_caption` | character |  |
| `person_high_school_default_asset_category` | character |  |
| `person_high_school_default_asset_alt_text` | character |  |
| `person_high_school_default_asset_height` | integer |  |
| `person_high_school_default_asset_width` | integer |  |
| `person_high_school_default_asset_asset_type` | character |  |
| `person_high_school_default_asset_file_system` | character |  |
| `person_high_school_default_asset_path` | character |  |
| `person_high_school_default_asset_type` | character |  |
| `person_high_school_default_asset_thumbnail` | character |  |
| `person_high_school_default_asset_duration` | integer |  |
| `person_high_school_default_asset_mime_type` | character |  |
| `person_high_school_slug` | character |  |
| `person_high_school_primary_color` | character |  |
| `person_high_school_org_type` | character |  |
| `person_high_school_org_type_enum` | character |  |
| `person_high_school_division` | character |  |
| `person_high_school_site_keys` | character |  |
| `person_high_school_url_slug` | character |  |
| `person_home_town_name` | character |  |
| `person_default_asset_url` | character |  |
| `person_default_asset_key` | integer |  |
| `person_default_asset_domain_override` | character |  |
| `person_default_asset_domain` | character |  |
| `person_default_asset_source_override` | character |  |
| `person_default_asset_source` | character |  |
| `person_default_asset_title` | character |  |
| `person_default_asset_description` | character |  |
| `person_default_asset_caption` | character |  |
| `person_default_asset_category` | character |  |
| `person_default_asset_alt_text` | character |  |
| `person_default_asset_height` | integer |  |
| `person_default_asset_width` | integer |  |
| `person_default_asset_asset_type` | character |  |
| `person_default_asset_file_system` | character |  |
| `person_default_asset_path` | character |  |
| `person_default_asset_type` | character |  |
| `person_default_asset_thumbnail` | character |  |
| `person_default_asset_duration` | integer |  |
| `person_default_asset_mime_type` | character |  |
| `person_early_signee` | logical |  |
| `person_early_enrollee` | logical |  |
| `person_position_abbreviation` | character |  |
| `person_height` | numeric |  |
| `person_formatted_height` | character |  |
| `person_weight` | integer |  |
| `person_class_year` | integer |  |
| `person_athlete_verified` | logical |  |
| `person_prospect_verified` | logical |  |
| `person_class_rank` | character |  |
| `person_recruitment_key` | integer |  |
| `person_age` | integer |  |
| `valuation_nil_status` | character |  |
| `valuation_valuation` | integer |  |
| `valuation_valuation_change` | integer |  |
| `valuation_followers` | integer |  |
| `valuation_rank` | integer |  |
| `valuation_last_updated` | integer |  |
| `valuation_whisper` | character |  |
| `valuation_whisper_change` | character |  |
| `valuation_social_valuations` | character |  |
| `valuation_group_rank` | integer |  |
| `valuation_group_name` | character |  |
| `valuation_tags` | character |  |
| `valuation_roster_value` | character |  |
| `valuation_nil_value` | character |  |
| `person_status_committed_organization_asset` | character |  |

**Row type:** `On3NilRankingsRow` (exported from the package root).

### Returns — `on3_organizations_draft_class_by_state` / `on3OrganizationsDraftClassByState`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_organizations_draft_class_by_year` / `on3OrganizationsDraftClassByYear`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_organizations_draft_count_by_stars` / `on3OrganizationsDraftCountByStars`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_organizations_draft_count_by_year` / `on3OrganizationsDraftCountByYear`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_organizations_draft_ranking_summary` / `on3OrganizationsDraftRankingSummary`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_organizations_drafted_players` / `on3OrganizationsDraftedPlayers`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_organizations_drafts_by_stars_summary` / `on3OrganizationsDraftsByStarsSummary`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_organizations_roster_header` / `on3OrganizationsRosterHeader`

| col_name | type | description |
|---|---|---|
| `talent_rank` | character | Program's current national roster-talent rank per On3. |
| `prev_talent_rank` | character | Program's roster-talent rank in the previous cycle. |
| `conference_rank` | character | Program's roster-talent rank within its conference. |
| `prev_conference_rank` | character | Program's conference roster-talent rank in the previous cycle. |
| `average_rating` | character | Average On3 rating across the roster. |
| `prev_average_rating` | character | Average On3 roster rating in the previous cycle. |
| `average_nil_value` | numeric | Average On3 NIL valuation across the roster, in dollars. |
| `total_nil_value` | integer | Total On3 NIL valuation across the roster, in dollars. |
| `head_coach_key` | integer |  |
| `head_coach_first_name` | character |  |
| `head_coach_last_name` | character |  |
| `head_coach_known_as_name` | character |  |
| `head_coach_full_name` | character |  |
| `head_coach_slug` | character |  |
| `head_coach_default_asset_key` | integer |  |
| `head_coach_default_asset_domain_override` | character |  |
| `head_coach_default_asset_domain` | character |  |
| `head_coach_default_asset_source_override` | character |  |
| `head_coach_default_asset_source` | character |  |
| `head_coach_default_asset_title` | character |  |
| `head_coach_default_asset_description` | character |  |
| `head_coach_default_asset_caption` | character |  |
| `head_coach_default_asset_category` | character |  |
| `head_coach_default_asset_alt_text` | character |  |
| `head_coach_default_asset_height` | integer |  |
| `head_coach_default_asset_width` | integer |  |
| `head_coach_default_asset_asset_type` | character |  |
| `head_coach_default_asset_file_system` | character |  |
| `head_coach_default_asset_path` | character |  |
| `head_coach_default_asset_type` | character |  |
| `head_coach_default_asset_thumbnail` | character |  |
| `head_coach_default_asset_duration` | integer |  |
| `head_coach_default_asset_mime_type` | character |  |
| `head_coach_organization_key` | integer |  |
| `head_coach_organization_full_name` | character |  |
| `head_coach_organization_name` | character |  |
| `head_coach_organization_known_as` | character |  |
| `head_coach_organization_mascot` | character |  |
| `head_coach_organization_abbreviation` | character |  |
| `head_coach_organization_asset_url` | character |  |
| `head_coach_organization_default_asset_key` | integer |  |
| `head_coach_organization_default_asset_domain_override` | character |  |
| `head_coach_organization_default_asset_domain` | character |  |
| `head_coach_organization_default_asset_source_override` | character |  |
| `head_coach_organization_default_asset_source` | character |  |
| `head_coach_organization_default_asset_title` | character |  |
| `head_coach_organization_default_asset_description` | character |  |
| `head_coach_organization_default_asset_caption` | character |  |
| `head_coach_organization_default_asset_category` | character |  |
| `head_coach_organization_default_asset_alt_text` | character |  |
| `head_coach_organization_default_asset_height` | integer |  |
| `head_coach_organization_default_asset_width` | integer |  |
| `head_coach_organization_default_asset_asset_type` | character |  |
| `head_coach_organization_default_asset_file_system` | character |  |
| `head_coach_organization_default_asset_path` | character |  |
| `head_coach_organization_default_asset_type` | character |  |
| `head_coach_organization_default_asset_thumbnail` | character |  |
| `head_coach_organization_default_asset_duration` | integer |  |
| `head_coach_organization_default_asset_mime_type` | character |  |
| `head_coach_organization_slug` | character |  |
| `head_coach_organization_primary_color` | character |  |
| `head_coach_organization_org_type` | character |  |
| `head_coach_organization_org_type_enum` | character |  |
| `head_coach_organization_division` | character |  |
| `head_coach_organization_site_keys` | character |  |
| `head_coach_organization_url_slug` | character |  |
| `head_coach_primary_position_key` | integer |  |
| `head_coach_primary_position_name` | character |  |
| `head_coach_primary_position_abbr` | character |  |
| `head_coach_secondary_position` | character |  |
| `head_coach_org_season_count` | integer |  |
| `head_coach_years_active` | integer |  |

**Row type:** `On3OrganizationsRosterHeaderRow` (exported from the package root).

### Returns — `on3_people_combine_measurements` / `on3PeopleCombineMeasurements`

No returns table is published for this endpoint: its committed capture has 0 rows, so the parser emits no columns; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_people_latest_valuation` / `on3PeopleLatestValuation`

| col_name | type | description |
|---|---|---|
| `nil_status` | character | Status of the athlete's On3 NIL valuation (e.g. active, inactive). |
| `valuation` | integer | Athlete's latest On3 NIL valuation in dollars. |
| `valuation_change` | integer | Change in the NIL valuation since the previous update, in dollars. |
| `followers` | integer | Total social-media followers counted toward the valuation. |
| `rank` | integer |  |
| `last_updated` | integer |  |
| `whisper` | numeric |  |
| `whisper_change` | numeric |  |
| `social_valuations` | character | Per-platform breakdown of the social components of the valuation (stringified list). |
| `group_rank` | integer |  |
| `group_name` | character |  |
| `tags` | character |  |
| `roster_value` | character |  |
| `nil_value` | character |  |

**Row type:** `On3PeopleLatestValuationRow` (exported from the package root).

### Returns — `on3_people_measurements` / `on3PeopleMeasurements`

| col_name | type | description |
|---|---|---|
| `player_measurements` | character |  |

**Row type:** `On3PeopleMeasurementsRow` (exported from the package root).

### Returns — `on3_people_person_connections` / `on3PeoplePersonConnections`

No returns table is published for this endpoint: its committed capture has 0 rows, so the parser emits no columns; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_people_social` / `on3PeopleSocial`

| col_name | type | description |
|---|---|---|
| `type` | character |  |
| `handle` | character | Athlete's account handle on the social platform. |
| `handshake` | logical | On3 RDB handshake field on the social-account record (platform link/verification metadata). |

**Row type:** `On3PeopleSocialRow` (exported from the package root).

### Returns — `on3_people_social_post_summary` / `on3PeopleSocialPostSummary`

| col_name | type | description |
|---|---|---|
| `social_type` | character | Social platform the post summary covers (e.g. Twitter/X, Instagram). |
| `type` | character |  |
| `followers` | integer | Athlete's follower count on the platform. |

**Row type:** `On3PeopleSocialPostSummaryRow` (exported from the package root).

### Returns — `on3_people_track_and_field_measurements` / `on3PeopleTrackAndFieldMeasurements`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_people_valuation_growth` / `on3PeopleValuationGrowth`

| col_name | type | description |
|---|---|---|
| `nil_status` | character | Status of the athlete's On3 NIL valuation at the snapshot (e.g. active, inactive). |
| `valuation` | integer | Athlete's On3 NIL valuation in dollars at the snapshot. |
| `valuation_change` | numeric | Change in the NIL valuation versus the previous snapshot, in dollars. |
| `date` | character | Date of the On3 NIL valuation snapshot. |
| `date_unix` | integer | Unix timestamp of the valuation snapshot. |

**Row type:** `On3PeopleValuationGrowthRow` (exported from the package root).

### Returns — `on3_person_connections_connection_key` / `on3PersonConnectionsConnectionKey`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_person_primary_recruitment_evaluation` / `on3PersonPrimaryRecruitmentEvaluation`

No returns table is published for this endpoint: no committed capture with rows; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_person_recruitment_evaluations` / `on3PersonRecruitmentEvaluations`

No returns table is published for this endpoint: no committed capture with rows; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_person_sport_profile_recruit` / `on3PersonSportProfileRecruit`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_person_sport_rankings` / `on3PersonSportRankings`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_player_all_rankings` / `on3PlayerAllRankings`

| col_name | type | description |
|---|---|---|
| `type` | character |  |
| `link` | character |  |
| `ranking_key` | integer | On3 key of the ranking cycle the row belongs to. |
| `ranking_year` | integer |  |
| `ranking_type` | character |  |
| `rating` | numeric |  |
| `sport` | character | Nested On3 sport object for the ranking row (stringified). |
| `class_year` | integer | Recruiting class year the ranking covers. |
| `state_rank` | integer |  |
| `state_abbr` | character | Two-letter abbreviation of the player's home state. |
| `position_rank` | integer |  |
| `position_abbr` | character |  |
| `overall_rank` | integer |  |
| `stars` | integer |  |
| `five_star_plus` | logical | Whether On3 designates the player a Five-Star Plus+ prospect. |
| `nearly_five_star_plus` | logical | On3 flag that the player narrowly missed the Five-Star Plus+ designation. |
| `change_1` | character |  |

**Row type:** `On3PlayerAllRankingsRow` (exported from the package root).

### Returns — `on3_player_database_updates` / `on3PlayerDatabaseUpdates`

| col_name | type | description |
|---|---|---|
| `key` | integer | On3 RDB key for the database-update entry. |
| `type` | character |  |
| `text` | character |  |
| `replacement_text` | character | Rendered text of the update entry (with references substituted in). |
| `link` | character |  |
| `date_added` | integer | Date the update entry was logged. |
| `date_occurred` | integer | Date the underlying event occurred. |
| `object_key` | integer | On3 key of the object the update refers to. |
| `sport_key` | integer | On3 sport key the update is scoped to. |
| `person_key` | integer | On3 person key of the player the update concerns. |
| `organization_key` | integer | On3 organization key involved in the update, when any. |

**Row type:** `On3PlayerDatabaseUpdatesRow` (exported from the package root).

### Returns — `on3_player_images` / `on3PlayerImages`

| col_name | type | description |
|---|---|---|
| `key` | integer | On3 asset key for the image. |
| `domain_override` | character | Override CDN domain for serving the image, when set. |
| `domain` | character | CDN domain the image is served from. |
| `source_override` | character | Override source attribution for the image, when set. |
| `source` | character |  |
| `title` | character |  |
| `description` | character |  |
| `caption` | character | Caption text for the image. |
| `category` | character |  |
| `alt_text` | character | Alt text for the image. |
| `height` | integer |  |
| `width` | integer | Image width in pixels. |
| `asset_type` | character | Type of the asset (e.g. image) in On3's asset system. |
| `file_system` | character | Storage file system the asset lives on (On3 asset metadata). |
| `path` | character | Storage path of the image file. |
| `type` | character |  |
| `thumbnail` | character | URL or path of the image's thumbnail rendition. |
| `duration` | integer |  |
| `mime_type` | character | MIME type of the image file (e.g. image/jpeg). |

**Row type:** `On3PlayerImagesRow` (exported from the package root).

### Returns — `on3_player_organizations` / `on3PlayerOrganizations`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_player_organizations_org_key` / `on3PlayerOrganizationsOrgKey`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_player_person_rankings` / `on3PlayerPersonRankings`

| col_name | type | description |
|---|---|---|
| `key` | integer | On3 RDB key for the player's ranking row. |
| `ranking_key` | integer | On3 key of the ranking cycle the row belongs to. |
| `rating` | integer |  |
| `state_rank` | integer |  |
| `state_abbr` | character | Two-letter abbreviation of the player's home state. |
| `position_rank` | integer |  |
| `position_abbr` | character |  |
| `overall_rank` | integer |  |
| `stars` | integer |  |
| `consensus_rating` | numeric | Player's industry-consensus rating (blend of the major recruiting services). |
| `consensus_state_rank` | integer | Player's consensus rank within their home state. |
| `consensus_position_rank` | integer | Player's consensus rank at their position. |
| `consensus_overall_rank` | integer | Player's national consensus rank. |
| `consensus_stars` | integer | Player's star rating under the industry consensus. |
| `strength` | integer |  |
| `five_star_plus` | logical | Whether On3 designates the player a Five-Star Plus+ prospect. |
| `ranking_type` | character |  |
| `ranking_key_2` | integer |  |
| `ranking_sport_key` | integer |  |
| `ranking_sport_key_2` | integer |  |
| `ranking_sport_name` | character |  |
| `ranking_year` | integer |  |
| `change_38` | character |  |
| `consensus_change_41` | character |  |

**Row type:** `On3PlayerPersonRankingsRow` (exported from the package root).

### Returns — `on3_player_profile` / `on3PlayerProfile`

| col_name | type | description |
|---|---|---|
| `key` | integer | On3 RDB key for the player profile. |
| `class_year_recruitment_key` | integer | On3 recruitment key for the player's recruiting-class cycle. |
| `recruitment_key` | integer | On3 key of the player's active recruitment record. |
| `person_can_manage_recruitment` | logical | Whether the athlete can self-manage the recruitment on On3. |
| `ranking_key` | integer | On3 key of the ranking cycle the profile's rating belongs to. |
| `person_sport_key` | integer | On3 key of the athlete-sport profile (person x sport). |
| `oracle_key` | character | On3's internal oracle identifier for the player record. |
| `name` | character |  |
| `slug` | character |  |
| `high_school_name` | character |  |
| `hometown_name` | character | Player's hometown, as listed by On3. |
| `position_abbreviation` | character |  |
| `class_rank` | character | Player's rank within their recruiting class. |
| `height` | character |  |
| `weight` | integer |  |
| `class_year` | integer | Player's recruiting class year. |
| `degree` | character | Degree the player earned or is pursuing, when listed. |
| `age` | integer |  |
| `sports` | character | Sports the player is profiled in, as a stringified list. |
| `description` | character |  |
| `bio_pro_prospect` | character | Bio text framing the player as a pro prospect (On3 RDB). |
| `bio_college_recruit` | character | Bio text framing the player as a college recruit (On3 RDB). |
| `organization_level` | character | Level of the player's current organization (e.g. high school, college, professional). |
| `high_school_org_key` | integer | On3 organization key of the player's high school. |
| `prep_school_org_key` | character | On3 organization key of the player's prep school, when attended. |
| `junior_college_org_key` | character | On3 organization key of the player's junior college, when attended. |
| `college_org_key` | integer | On3 organization key of the player's college. |
| `nil_value` | integer | Player's On3 NIL valuation in dollars. |
| `athlete_verified` | logical | Whether the athlete has verified their own On3 profile. |
| `prospect_verified` | logical | Whether On3 has verified the prospect's profile information. |
| `is_coach` | logical | Whether the person record is a coach. |
| `is_athlete` | logical | Whether the person record is an athlete. |
| `visibility` | character | Profile visibility setting on On3. |
| `tier` | character | On3 profile tier classification for the player. |
| `review_status` | character | Editorial review status of the profile in the On3 database. |
| `jersey_number` | integer |  |
| `badge` | character | Profile badge assigned by On3, when any. |
| `ncaa_id` | character | Player's NCAA identifier, when known to On3. |
| `managed_by_user` | logical | On3 user account that manages the player's profile, when claimed. |
| `ranking_key_2` | integer |  |
| `ranking_rating` | numeric |  |
| `ranking_stars` | integer |  |
| `ranking_national_rank` | integer |  |
| `ranking_position_rank` | integer |  |
| `ranking_state_rank` | integer |  |
| `ranking_position_abbr` | character |  |
| `ranking_state_abbr` | character |  |
| `ranking_five_star_plus` | logical |  |
| `high_school_key` | integer |  |
| `high_school_full_name` | character |  |
| `high_school_name_2` | character |  |
| `high_school_known_as` | character |  |
| `high_school_mascot` | character |  |
| `high_school_abbreviation` | character |  |
| `high_school_asset_url` | character |  |
| `high_school_default_asset_key` | integer |  |
| `high_school_default_asset_domain_override` | character |  |
| `high_school_default_asset_domain` | character |  |
| `high_school_default_asset_source_override` | character |  |
| `high_school_default_asset_source` | character |  |
| `high_school_default_asset_title` | character |  |
| `high_school_default_asset_description` | character |  |
| `high_school_default_asset_caption` | character |  |
| `high_school_default_asset_category` | character |  |
| `high_school_default_asset_alt_text` | character |  |
| `high_school_default_asset_height` | integer |  |
| `high_school_default_asset_width` | integer |  |
| `high_school_default_asset_asset_type` | character |  |
| `high_school_default_asset_file_system` | character |  |
| `high_school_default_asset_path` | character |  |
| `high_school_default_asset_type` | character |  |
| `high_school_default_asset_thumbnail` | character |  |
| `high_school_default_asset_duration` | integer |  |
| `high_school_default_asset_mime_type` | character |  |
| `high_school_slug` | character |  |
| `high_school_primary_color` | character |  |
| `high_school_org_type` | character |  |
| `high_school_org_type_enum` | character |  |
| `high_school_division` | character |  |
| `high_school_site_keys` | character |  |
| `high_school_url_slug` | character |  |
| `hometown_state_key` | integer |  |
| `hometown_state_name` | character |  |
| `hometown_state_abbreviation` | character |  |
| `hometown_state_country_key` | integer |  |
| `current_state_key` | integer |  |
| `current_state_name` | character |  |
| `current_state_abbreviation` | character |  |
| `current_state_country_key` | integer |  |
| `default_asset_key` | integer |  |
| `default_asset_domain_override` | character |  |
| `default_asset_domain` | character |  |
| `default_asset_source_override` | character |  |
| `default_asset_source` | character |  |
| `default_asset_title` | character |  |
| `default_asset_description` | character |  |
| `default_asset_caption` | character |  |
| `default_asset_category` | character |  |
| `default_asset_alt_text` | character |  |
| `default_asset_height` | integer |  |
| `default_asset_width` | integer |  |
| `default_asset_asset_type` | character |  |
| `default_asset_file_system` | character |  |
| `default_asset_path` | character |  |
| `default_asset_type` | character |  |
| `default_asset_thumbnail` | character |  |
| `default_asset_duration` | integer |  |
| `default_asset_mime_type` | character |  |
| `primary_position_key` | integer |  |
| `primary_position_name` | character |  |
| `primary_position_abbreviation` | character |  |
| `primary_position_sport_key` | integer |  |
| `primary_position_sport_key_2` | integer |  |
| `primary_position_sport_name` | character |  |
| `primary_position_sport_slug` | character |  |
| `primary_position_sport_abbreviation` | character |  |
| `primary_position_sport_is_rankable` | logical |  |
| `primary_position_sport_is_industry_rankable` | logical |  |
| `primary_position_sport_is_scoutable` | logical |  |
| `primary_position_position_type` | character |  |
| `default_sport_key` | integer |  |
| `default_sport_name` | character |  |
| `player_status_type` | character |  |
| `player_status_short_term_signee` | logical |  |
| `player_status_date` | character |  |
| `player_status_committed_asset_key` | integer |  |
| `player_status_committed_asset_url` | character |  |
| `player_status_committed_asset_slug` | character |  |
| `player_status_committed_asset_full_name` | character |  |
| `player_status_committed_asset_res_key` | integer |  |
| `player_status_committed_asset_res_domain_override` | character |  |
| `player_status_committed_asset_res_domain` | character |  |
| `player_status_committed_asset_res_source_override` | character |  |
| `player_status_committed_asset_res_source` | character |  |
| `player_status_committed_asset_res_title` | character |  |
| `player_status_committed_asset_res_description` | character |  |
| `player_status_committed_asset_res_caption` | character |  |
| `player_status_committed_asset_res_category` | character |  |
| `player_status_committed_asset_res_alt_text` | character |  |
| `player_status_committed_asset_res_height` | integer |  |
| `player_status_committed_asset_res_width` | integer |  |
| `player_status_committed_asset_res_asset_type` | character |  |
| `player_status_committed_asset_res_file_system` | character |  |
| `player_status_committed_asset_res_path` | character |  |
| `player_status_committed_asset_res_type` | character |  |
| `player_status_committed_asset_res_thumbnail` | character |  |
| `player_status_committed_asset_res_duration` | integer |  |
| `player_status_committed_asset_res_mime_type` | character |  |
| `player_status_transferred_asset_key` | integer |  |
| `player_status_transferred_asset_url` | character |  |
| `player_status_transferred_asset_slug` | character |  |
| `player_status_transferred_asset_full_name` | character |  |
| `player_status_transferred_asset_res_key` | integer |  |
| `player_status_transferred_asset_res_domain_override` | character |  |
| `player_status_transferred_asset_res_domain` | character |  |
| `player_status_transferred_asset_res_source_override` | character |  |
| `player_status_transferred_asset_res_source` | character |  |
| `player_status_transferred_asset_res_title` | character |  |
| `player_status_transferred_asset_res_description` | character |  |
| `player_status_transferred_asset_res_caption` | character |  |
| `player_status_transferred_asset_res_category` | character |  |
| `player_status_transferred_asset_res_alt_text` | character |  |
| `player_status_transferred_asset_res_height` | integer |  |
| `player_status_transferred_asset_res_width` | integer |  |
| `player_status_transferred_asset_res_asset_type` | character |  |
| `player_status_transferred_asset_res_file_system` | character |  |
| `player_status_transferred_asset_res_path` | character |  |
| `player_status_transferred_asset_res_type` | character |  |
| `player_status_transferred_asset_res_thumbnail` | character |  |
| `player_status_transferred_asset_res_duration` | integer |  |
| `player_status_transferred_asset_res_mime_type` | character |  |
| `player_status_committed_organization_key` | integer |  |
| `player_status_committed_organization_full_name` | character |  |
| `player_status_committed_organization_name` | character |  |
| `player_status_committed_organization_mascot` | character |  |
| `player_status_committed_organization_abbreviation` | character |  |
| `player_status_committed_organization_asset_url` | character |  |
| `player_status_committed_organization_asset_key` | integer |  |
| `player_status_committed_organization_asset_domain_override` | character |  |
| `player_status_committed_organization_asset_domain` | character |  |
| `player_status_committed_organization_asset_source_override` | character |  |
| `player_status_committed_organization_asset_source` | character |  |
| `player_status_committed_organization_asset_title` | character |  |
| `player_status_committed_organization_asset_description` | character |  |
| `player_status_committed_organization_asset_caption` | character |  |
| `player_status_committed_organization_asset_category` | character |  |
| `player_status_committed_organization_asset_alt_text` | character |  |
| `player_status_committed_organization_asset_height` | integer |  |
| `player_status_committed_organization_asset_width` | integer |  |
| `player_status_committed_organization_asset_asset_type` | character |  |
| `player_status_committed_organization_asset_file_system` | character |  |
| `player_status_committed_organization_asset_path` | character |  |
| `player_status_committed_organization_asset_type` | character |  |
| `player_status_committed_organization_asset_thumbnail` | character |  |
| `player_status_committed_organization_asset_duration` | integer |  |
| `player_status_committed_organization_asset_mime_type` | character |  |
| `player_status_committed_organization_slug` | character |  |
| `player_status_committed_organization_primary_color` | character |  |
| `player_status_class_rank` | character |  |
| `player_status_transfer_entered` | character |  |
| `player_status_recruitment_year` | character |  |
| `player_status_decommitted_asset` | character |  |
| `player_status_transfer` | logical |  |
| `player_status_expected_to_transfer` | logical |  |
| `player_status_recruitment_key` | integer |  |
| `player_status_withdrawn_transfer` | logical |  |
| `player_status_withdrawn_transfer_date` | character |  |

**Row type:** `On3PlayerProfileRow` (exported from the package root).

### Returns — `on3_player_team_targets` / `on3PlayerTeamTargets`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_player_videos` / `on3PlayerVideos`

| col_name | type | description |
|---|---|---|
| `key` | integer | On3 RDB key for the video record. |
| `source_url` | character | Source URL of the hosted video. |
| `title` | character |  |
| `thumbnail` | character | URL of the video's thumbnail image. |
| `description` | character |  |
| `date` | integer | Publication date of the video, per On3. |
| `person_key` | integer | On3 person key of the featured athlete. |
| `person_sport` | character | Nested athlete-sport profile the video is attached to (stringified). |
| `is_featured` | logical | Whether the video is featured on the player's On3 profile. |
| `featured_order` | character |  |
| `category_key` | integer |  |
| `category_value` | character |  |

**Row type:** `On3PlayerVideosRow` (exported from the package root).

### Returns — `on3_player_visit_center` / `on3PlayerVisitCenter`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_players_industry_comparision` / `on3PlayersIndustryComparision`

| col_name | type | description |
|---|---|---|
| `ratings` | character | List of per-service rating entries (On3, Rivals, 247, ESPN) composing the industry comparison. |
| `nil_value` | integer | On3 NIL valuation for the player (US dollars). |
| `person_key` | integer |  |
| `person_name` | character |  |
| `person_slug` | character |  |
| `person_high_school_name` | character |  |
| `person_high_school_key` | integer |  |
| `person_high_school_full_name` | character |  |
| `person_high_school_name_2` | character |  |
| `person_high_school_known_as` | character |  |
| `person_high_school_mascot` | character |  |
| `person_high_school_abbreviation` | character |  |
| `person_high_school_asset_url` | character |  |
| `person_high_school_default_asset_key` | integer |  |
| `person_high_school_default_asset_domain_override` | character |  |
| `person_high_school_default_asset_domain` | character |  |
| `person_high_school_default_asset_source_override` | character |  |
| `person_high_school_default_asset_source` | character |  |
| `person_high_school_default_asset_title` | character |  |
| `person_high_school_default_asset_description` | character |  |
| `person_high_school_default_asset_caption` | character |  |
| `person_high_school_default_asset_category` | character |  |
| `person_high_school_default_asset_alt_text` | character |  |
| `person_high_school_default_asset_height` | integer |  |
| `person_high_school_default_asset_width` | integer |  |
| `person_high_school_default_asset_asset_type` | character |  |
| `person_high_school_default_asset_file_system` | character |  |
| `person_high_school_default_asset_path` | character |  |
| `person_high_school_default_asset_type` | character |  |
| `person_high_school_default_asset_thumbnail` | character |  |
| `person_high_school_default_asset_duration` | integer |  |
| `person_high_school_default_asset_mime_type` | character |  |
| `person_high_school_slug` | character |  |
| `person_high_school_primary_color` | character |  |
| `person_high_school_org_type` | character |  |
| `person_high_school_org_type_enum` | character |  |
| `person_high_school_division` | character |  |
| `person_high_school_site_keys` | character |  |
| `person_high_school_url_slug` | character |  |
| `person_home_town_name` | character |  |
| `person_default_asset_url` | character |  |
| `person_default_asset_key` | integer |  |
| `person_default_asset_domain_override` | character |  |
| `person_default_asset_domain` | character |  |
| `person_default_asset_source_override` | character |  |
| `person_default_asset_source` | character |  |
| `person_default_asset_title` | character |  |
| `person_default_asset_description` | character |  |
| `person_default_asset_caption` | character |  |
| `person_default_asset_category` | character |  |
| `person_default_asset_alt_text` | character |  |
| `person_default_asset_height` | integer |  |
| `person_default_asset_width` | integer |  |
| `person_default_asset_asset_type` | character |  |
| `person_default_asset_file_system` | character |  |
| `person_default_asset_path` | character |  |
| `person_default_asset_type` | character |  |
| `person_default_asset_thumbnail` | character |  |
| `person_default_asset_duration` | integer |  |
| `person_default_asset_mime_type` | character |  |
| `person_early_signee` | logical |  |
| `person_early_enrollee` | logical |  |
| `person_position_abbreviation` | character |  |
| `person_height` | numeric |  |
| `person_formatted_height` | character |  |
| `person_weight` | integer |  |
| `person_class_year` | integer |  |
| `person_athlete_verified` | logical |  |
| `person_prospect_verified` | logical |  |
| `person_class_rank` | character |  |
| `person_recruitment_key` | integer |  |
| `person_age` | integer |  |

**Row type:** `On3PlayersIndustryComparisionRow` (exported from the package root).

### Returns — `on3_players_industry_comparision_list` / `on3PlayersIndustryComparisionList`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_predictions_user_key` / `on3PredictionsUserKey`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_quotes` / `on3Quotes`

| col_name | type | description |
|---|---|---|
| `key` | integer | On3 RDB key for the quote record. |
| `body` | character | Full text of the quote. |
| `category` | character |  |
| `person_key` | integer | On3 person key of the person quoted or quoted about. |
| `date_added` | character | Date the quote was added to the On3 database. |
| `date_updated` | character | Date the quote was last updated. |
| `person_key_2` | integer |  |
| `person_known_as_name` | character |  |
| `person_first_name` | character |  |
| `person_last_name` | character |  |
| `person_twitter_handle` | character |  |
| `person_instagram_profile` | character |  |
| `person_tik_tok_handle` | character |  |
| `person_espn_profile` | character |  |
| `person_class_year` | integer |  |
| `person_two_four_seven_profile` | character |  |
| `person_rivals_profile` | character |  |

**Row type:** `On3QuotesRow` (exported from the package root).

### Returns — `on3_quotes_key` / `on3QuotesKey`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_recruitment_primary_recruitment_evaluation` / `on3RecruitmentPrimaryRecruitmentEvaluation`

No returns table is published for this endpoint: no committed capture with rows; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_recruitment_recruitment_evaluations` / `on3RecruitmentRecruitmentEvaluations`

No returns table is published for this endpoint: its committed capture has 0 rows, so the parser emits no columns; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_recruitments_profile` / `on3RecruitmentsProfile`

| col_name | type | description |
|---|---|---|
| `class_year` | integer | Recruiting class year of the recruitment. |
| `high_school` | character |  |
| `home_town` | character |  |
| `rating_key` | integer |  |
| `rating_rating` | numeric |  |
| `rating_stars` | integer |  |
| `rating_national_rank` | integer |  |
| `rating_position_rank` | integer |  |
| `rating_state_rank` | integer |  |
| `rating_position_abbr` | character |  |
| `rating_state_abbr` | character |  |
| `rating_five_star_plus` | logical |  |
| `committed_status_type` | character |  |
| `committed_status_short_term_signee` | logical |  |
| `committed_status_date` | character |  |
| `committed_status_committed_asset_key` | integer |  |
| `committed_status_committed_asset_url` | character |  |
| `committed_status_committed_asset_slug` | character |  |
| `committed_status_committed_asset_full_name` | character |  |
| `committed_status_committed_asset_res_key` | integer |  |
| `committed_status_committed_asset_res_domain_override` | character |  |
| `committed_status_committed_asset_res_domain` | character |  |
| `committed_status_committed_asset_res_source_override` | character |  |
| `committed_status_committed_asset_res_source` | character |  |
| `committed_status_committed_asset_res_title` | character |  |
| `committed_status_committed_asset_res_description` | character |  |
| `committed_status_committed_asset_res_caption` | character |  |
| `committed_status_committed_asset_res_category` | character |  |
| `committed_status_committed_asset_res_alt_text` | character |  |
| `committed_status_committed_asset_res_height` | integer |  |
| `committed_status_committed_asset_res_width` | integer |  |
| `committed_status_committed_asset_res_asset_type` | character |  |
| `committed_status_committed_asset_res_file_system` | character |  |
| `committed_status_committed_asset_res_path` | character |  |
| `committed_status_committed_asset_res_type` | character |  |
| `committed_status_committed_asset_res_thumbnail` | character |  |
| `committed_status_committed_asset_res_duration` | integer |  |
| `committed_status_committed_asset_res_mime_type` | character |  |
| `committed_status_transferred_asset` | character |  |
| `committed_status_transferred_asset_res` | character |  |
| `committed_status_committed_organization_key` | integer |  |
| `committed_status_committed_organization_full_name` | character |  |
| `committed_status_committed_organization_name` | character |  |
| `committed_status_committed_organization_mascot` | character |  |
| `committed_status_committed_organization_abbreviation` | character |  |
| `committed_status_committed_organization_asset_url` | character |  |
| `committed_status_committed_organization_asset` | character |  |
| `committed_status_committed_organization_slug` | character |  |
| `committed_status_committed_organization_primary_color` | character |  |
| `committed_status_class_rank` | character |  |
| `committed_status_transfer_entered` | character |  |
| `committed_status_recruitment_year` | character |  |
| `committed_status_decommitted_asset` | character |  |
| `committed_status_transfer` | logical |  |
| `committed_status_expected_to_transfer` | logical |  |
| `committed_status_recruitment_key` | integer |  |
| `committed_status_withdrawn_transfer` | logical |  |
| `committed_status_withdrawn_transfer_date` | character |  |
| `high_school_org_key` | integer |  |
| `high_school_org_full_name` | character |  |
| `high_school_org_name` | character |  |
| `high_school_org_known_as` | character |  |
| `high_school_org_mascot` | character |  |
| `high_school_org_abbreviation` | character |  |
| `high_school_org_asset_url` | character |  |
| `high_school_org_default_asset_key` | integer |  |
| `high_school_org_default_asset_domain_override` | character |  |
| `high_school_org_default_asset_domain` | character |  |
| `high_school_org_default_asset_source_override` | character |  |
| `high_school_org_default_asset_source` | character |  |
| `high_school_org_default_asset_title` | character |  |
| `high_school_org_default_asset_description` | character |  |
| `high_school_org_default_asset_caption` | character |  |
| `high_school_org_default_asset_category` | character |  |
| `high_school_org_default_asset_alt_text` | character |  |
| `high_school_org_default_asset_height` | integer |  |
| `high_school_org_default_asset_width` | integer |  |
| `high_school_org_default_asset_asset_type` | character |  |
| `high_school_org_default_asset_file_system` | character |  |
| `high_school_org_default_asset_path` | character |  |
| `high_school_org_default_asset_type` | character |  |
| `high_school_org_default_asset_thumbnail` | character |  |
| `high_school_org_default_asset_duration` | integer |  |
| `high_school_org_default_asset_mime_type` | character |  |
| `high_school_org_slug` | character |  |
| `high_school_org_primary_color` | character |  |
| `high_school_org_org_type` | character |  |
| `high_school_org_org_type_enum` | character |  |
| `high_school_org_division` | character |  |
| `high_school_org_site_keys` | character |  |
| `high_school_org_url_slug` | character |  |

**Row type:** `On3RecruitmentsProfileRow` (exported from the package root).

### Returns — `on3_recruitments_rpm_picks` / `on3RecruitmentsRpmPicks`

No returns table is published for this endpoint: its committed capture has 0 rows, so the parser emits no columns; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_recruitments_rpm_summary` / `on3RecruitmentsRpmSummary`

| col_name | type | description |
|---|---|---|
| `predictions` | character | Per-team RPM prediction percentages for the recruitment, as a stringified list. |
| `locked` | logical | Whether the RPM prediction for the recruitment is locked (no longer updating). |

**Row type:** `On3RecruitmentsRpmSummaryRow` (exported from the package root).

### Returns — `on3_team_ranking` / `on3TeamRanking`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_team_ranking_bluechips_team_rankings` / `on3TeamRankingBluechipsTeamRankings`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_team_ranking_consensus_team_rankings` / `on3TeamRankingConsensusTeamRankings`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_team_ranking_organizations_summary` / `on3TeamRankingOrganizationsSummary`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_team_ranking_team_rankings` / `on3TeamRankingTeamRankings`

| col_name | type | description |
|---|---|---|
| `key` | integer | On3 organization-ranking key for the class row. |
| `year` | integer |  |
| `applied_total_rating` | numeric | Total On3 rating applied to the class after deductions. |
| `applied_total_consensus_rating` | numeric | Total consensus rating applied to the class after deductions. |
| `applied_average_rating` | numeric | Average On3 rating applied to the class after deductions. |
| `applied_average_consensus_rating` | numeric | Average consensus rating applied to the class after deductions. |
| `commits` | integer | Number of commits in the recruiting class. |
| `applied_commits` | integer | Number of commits counted toward the applied class rating. |
| `deductions` | numeric | Rating deductions applied to the class (e.g. for roster limits). |
| `deductions_description` | character | Human-readable explanation of any applied deductions. |
| `five_stars` | integer | Count of On3 five-star commits in the class. |
| `consensus_five_stars` | integer | Count of consensus five-star commits in the class. |
| `four_stars` | integer | Count of On3 four-star commits in the class. |
| `consensus_four_stars` | integer | Count of consensus four-star commits in the class. |
| `three_stars` | integer | Count of On3 three-star commits in the class. |
| `consensus_three_stars` | integer | Count of consensus three-star commits in the class. |
| `overall_rank` | integer | National rank of the class by On3 score. |
| `overall_consensus_rank` | integer | National rank of the class by consensus score. |
| `dispay_consensus_score` | numeric | Display consensus score for the class (On3 sic spelling of "display"). |
| `dispay_on3_score` | numeric | Display On3 score for the class (On3 sic spelling of "display"). |
| `average_nil_value` | numeric | Average On3 NIL valuation across the class's commits (US dollars). |
| `conference_rank` | integer | Rank of the class within its conference by On3 score. |
| `conference_consensus_rank` | integer | Rank of the class within its conference by consensus score. |
| `organization_key` | integer |  |
| `organization_full_name` | character |  |
| `organization_name` | character |  |
| `organization_mascot` | character |  |
| `organization_abbreviation` | character |  |
| `organization_asset_url` | character |  |
| `organization_asset_key` | integer |  |
| `organization_asset_domain_override` | character |  |
| `organization_asset_domain` | character |  |
| `organization_asset_source_override` | character |  |
| `organization_asset_source` | character |  |
| `organization_asset_title` | character |  |
| `organization_asset_description` | character |  |
| `organization_asset_caption` | character |  |
| `organization_asset_category` | character |  |
| `organization_asset_alt_text` | character |  |
| `organization_asset_height` | integer |  |
| `organization_asset_width` | integer |  |
| `organization_asset_asset_type` | character |  |
| `organization_asset_file_system` | character |  |
| `organization_asset_path` | character |  |
| `organization_asset_type` | character |  |
| `organization_asset_thumbnail` | character |  |
| `organization_asset_duration` | integer |  |
| `organization_asset_mime_type` | character |  |
| `organization_slug` | character |  |
| `organization_primary_color` | character |  |

**Row type:** `On3TeamRankingTeamRankingsRow` (exported from the package root).

### Returns — `on3_videos_video_key` / `on3VideosVideoKey`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/on3.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._

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
| `name` | character | Display name of the row's record. |
| `default_asset_key` | integer | On3 asset key for the collective's primary logo image. |
| `social_asset_key` | integer | On3 asset key for the collective's social-media image. |
| `organization_key` | integer | On3 organization key of the school the collective supports. |
| `launch_date` | character | Date the NIL collective launched. |
| `organization_type` | character | Legal form of the collective (e.g. LLC, 501(c)(3)). |
| `twitter_handle` | character | Collective's Twitter/X account handle. |
| `instagram_handle` | character | Collective's Instagram account handle. |
| `tik_tok_handle` | character | Collective's TikTok account handle. |
| `youtube_handle` | character | Collective's YouTube channel handle. |
| `linked_in_handle` | character | Collective's LinkedIn account handle. |
| `website_name` | character | Display name of the collective's website. |
| `website_url` | character | URL of the collective's website. |
| `mission_statement` | character | Collective's stated mission, as published to On3. |
| `description` | character | Free-text description or biography shipped by On3. |
| `annual_goal_amount` | numeric | Collective's annual fundraising goal in dollars, as reported to On3. |
| `confirmed_raised_amount` | numeric | Dollar amount the collective has confirmed raising, per On3. |
| `merged_into_group_key` | integer | On3 key of the collective this group merged into, when applicable. |
| `merged_into_group` | character | Nested On3 record for the collective this group merged into (stringified). |
| `slug` | character | URL slug of the row's record on On3. |
| `founders` | character | Founders of the collective, as a stringified list. |
| `sports` | character | Sports the collective funds, as a stringified list. |
| `default_asset_key_2` | integer | Asset key repeated from the nested default-asset object (json_normalize de-duplication suffix). |
| `default_asset_domain_override` | character | CDN domain override for the record's default asset (usually null). |
| `default_asset_domain` | character | CDN domain serving the default asset. |
| `default_asset_source_override` | character | Source-path override for the default asset (usually null). |
| `default_asset_source` | character | CDN-relative source path of the default asset. |
| `default_asset_title` | character | Editorial title attached to the default asset. |
| `default_asset_description` | character | Editorial description attached to the default asset (usually null). |
| `default_asset_caption` | character | Editorial caption attached to the default asset (usually null). |
| `default_asset_category` | character | Editorial category label of the default asset (usually null). |
| `default_asset_alt_text` | character | Accessibility alt text of the default asset (usually null). |
| `default_asset_height` | integer | Pixel height of the default asset. |
| `default_asset_width` | integer | Pixel width of the default asset. |
| `default_asset_asset_type` | character | On3 asset-type discriminator of the default asset (e.g. Image). |
| `default_asset_file_system` | character | Storage file-system flag of the default asset. |
| `default_asset_path` | character | Storage path of the default asset. |
| `default_asset_type` | character | Media type field of the default asset (file extension, e.g. png). |
| `default_asset_thumbnail` | character | Thumbnail variant of the default asset (video assets; usually null). |
| `default_asset_duration` | integer | Duration of the default asset when it is a video (usually null or 0). |
| `default_asset_mime_type` | character | MIME type of the default asset. |
| `social_asset_key_2` | integer | Asset key repeated from the nested social-asset object (json_normalize de-duplication suffix). |
| `social_asset_domain_override` | character | CDN domain override for the social-media asset (usually null). |
| `social_asset_domain` | character | CDN domain serving the social-media asset. |
| `social_asset_source_override` | character | Source-path override for the social-media asset (usually null). |
| `social_asset_source` | character | CDN-relative source path of the social-media asset. |
| `social_asset_title` | character | Editorial title attached to the social-media asset. |
| `social_asset_description` | character | Editorial description attached to the social-media asset (usually null). |
| `social_asset_caption` | character | Editorial caption attached to the social-media asset (usually null). |
| `social_asset_category` | character | Editorial category label of the social-media asset (usually null). |
| `social_asset_alt_text` | character | Accessibility alt text of the social-media asset (usually null). |
| `social_asset_height` | integer | Pixel height of the social-media asset. |
| `social_asset_width` | integer | Pixel width of the social-media asset. |
| `social_asset_asset_type` | character | On3 asset-type discriminator of the social-media asset (e.g. Image). |
| `social_asset_file_system` | character | Storage file-system flag of the social-media asset. |
| `social_asset_path` | character | Storage path of the social-media asset. |
| `social_asset_type` | character | Media type field of the social-media asset (file extension, e.g. png). |
| `social_asset_thumbnail` | character | Thumbnail variant of the social-media asset (video assets; usually null). |
| `social_asset_duration` | integer | Duration of the social-media asset when it is a video (usually null or 0). |
| `social_asset_mime_type` | character | MIME type of the social-media asset. |
| `organization_key_2` | integer | Organization key repeated from the nested organization object (json_normalize de-duplication suffix). |
| `organization_full_name` | character | Full name of the program (e.g. 'Alabama Crimson Tide'). |
| `organization_name` | character | Short name of the program. |
| `organization_known_as` | character | Common short name of the program, when On3 lists one. |
| `organization_mascot` | character | Mascot of the program. |
| `organization_abbreviation` | character | Abbreviation of the program. |
| `organization_asset_url` | character | Convenience CDN URL of the program's logo. |
| `organization_default_asset_key` | integer | On3 asset key of the program's logo asset. |
| `organization_default_asset_domain_override` | character | CDN domain override for the program's logo asset (usually null). |
| `organization_default_asset_domain` | character | CDN domain serving the program's logo asset. |
| `organization_default_asset_source_override` | character | Source-path override for the program's logo asset (usually null). |
| `organization_default_asset_source` | character | CDN-relative source path of the program's logo asset. |
| `organization_default_asset_title` | character | Editorial title attached to the program's logo asset. |
| `organization_default_asset_description` | character | Editorial description attached to the program's logo asset (usually null). |
| `organization_default_asset_caption` | character | Editorial caption attached to the program's logo asset (usually null). |
| `organization_default_asset_category` | character | Editorial category label of the program's logo asset (usually null). |
| `organization_default_asset_alt_text` | character | Accessibility alt text of the program's logo asset (usually null). |
| `organization_default_asset_height` | integer | Pixel height of the program's logo asset. |
| `organization_default_asset_width` | integer | Pixel width of the program's logo asset. |
| `organization_default_asset_asset_type` | character | On3 asset-type discriminator of the program's logo asset (e.g. Image). |
| `organization_default_asset_file_system` | character | Storage file-system flag of the program's logo asset. |
| `organization_default_asset_path` | character | Storage path of the program's logo asset. |
| `organization_default_asset_type` | character | Media type field of the program's logo asset (file extension, e.g. png). |
| `organization_default_asset_thumbnail` | character | Thumbnail variant of the program's logo asset (video assets; usually null). |
| `organization_default_asset_duration` | integer | Duration of the program's logo asset when it is a video (usually null or 0). |
| `organization_default_asset_mime_type` | character | MIME type of the program's logo asset. |
| `organization_slug` | character | URL slug of the program on On3. |
| `organization_primary_color` | character | Primary hex color of the program. |
| `organization_org_type` | character | Organization type label of the program (e.g. HighSchool, College). |
| `organization_org_type_enum` | character | Organization type enum of the program (same vocabulary as org_type). |
| `organization_division` | character | Division or classification of the program (e.g. NCAA-FB). |
| `organization_site_keys` | character | JSON-encoded On3 site keys covering the program (usually null). |
| `organization_url_slug` | character | URL slug variant of the program's page, with the key appended. |

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
| `total` | integer | Total drafted players counted in the row. |
| `state_key` | integer | On3 numeric key of the state. |
| `state_name` | character | Name of the state the row aggregates (e.g. Alabama). |
| `state_abbreviation` | character | Two-letter state abbreviation. |
| `state_country_key` | integer | On3 numeric key of the state's country. |

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
| `round` | integer | Draft round number. |

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
| `value` | character | Filter value as On3 lists it. |

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
| `person_rating_consensus_rating` | numeric | Industry-consensus numeric rating paired with the person's On3 rating (0-100 scale). |
| `person_rating_consensus_stars` | integer | Industry-consensus star rating paired with the person's On3 rating (2-5). |
| `person_rating_consensus_national_rank` | integer | Industry-consensus national rank paired with the person's On3 rating. |
| `person_rating_consensus_position_rank` | integer | Industry-consensus position rank paired with the person's On3 rating. |
| `person_rating_consensus_state_rank` | integer | Industry-consensus state rank paired with the person's On3 rating. |
| `person_rating_key` | integer | On3 key of the person's On3 rating record. |
| `person_rating_rating` | numeric | Numeric value of the person's On3 rating (0-100 scale). |
| `person_rating_stars` | integer | Star rating of the person's On3 rating (2-5). |
| `person_rating_national_rank` | integer | National rank of the person's On3 rating. |
| `person_rating_position_rank` | integer | Position rank of the person's On3 rating. |
| `person_rating_state_rank` | integer | State rank of the person's On3 rating. |
| `person_rating_position_abbr` | character | Position abbreviation the person's On3 rating was assigned at. |
| `person_rating_state_abbr` | character | State abbreviation the person's On3 rating was assigned in. |
| `person_rating_five_star_plus` | logical | Five-star-plus flag on the person's On3 rating. |
| `person_division` | character | Division of the person's current organization (e.g. NCAA-FB, NCAA-BK). |
| `person_default_sport_key` | integer | On3 numeric key of the person's primary sport. |
| `person_default_sport_name` | character | Name of the person's primary sport (e.g. Football). |
| `person_organization_level` | character | Level of the person's current organization (e.g. HighSchool, College, Professional). |
| `person_age` | numeric | Age of the person in years, when known. |
| `person_tags` | character | JSON-encoded list of On3 profile tags on the person (e.g. Influencer). |
| `person_key` | integer | On3 numeric key of the person. |
| `person_recruitment_key` | integer | On3 key of the person's active recruitment record. |
| `person_name` | character | Display name of the person. |
| `person_slug` | character | URL slug of the person's On3 profile. |
| `person_high_school_name` | character | High-school display name on the person's record. |
| `person_high_school_key` | integer | On3 numeric key of the person's high school. |
| `person_high_school_full_name` | character | Full name of the person's high school (e.g. 'Alabama Crimson Tide'). |
| `person_high_school_name_2` | character | High-school display name on the person's record (json_normalize de-duplication suffix). |
| `person_high_school_known_as` | character | Common short name of the person's high school, when On3 lists one. |
| `person_high_school_mascot` | character | Mascot of the person's high school. |
| `person_high_school_abbreviation` | character | Abbreviation of the person's high school. |
| `person_high_school_asset_url` | character | Convenience CDN URL of the person's high school's logo. |
| `person_high_school_default_asset_key` | numeric | On3 asset key of the person's high school's logo asset. |
| `person_high_school_default_asset_domain_override` | character | CDN domain override for the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_domain` | character | CDN domain serving the person's high school's logo asset. |
| `person_high_school_default_asset_source_override` | character | Source-path override for the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_source` | character | CDN-relative source path of the person's high school's logo asset. |
| `person_high_school_default_asset_title` | character | Editorial title attached to the person's high school's logo asset. |
| `person_high_school_default_asset_description` | character | Editorial description attached to the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_caption` | character | Editorial caption attached to the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_category` | character | Editorial category label of the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_alt_text` | character | Accessibility alt text of the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_height` | numeric | Pixel height of the person's high school's logo asset. |
| `person_high_school_default_asset_width` | numeric | Pixel width of the person's high school's logo asset. |
| `person_high_school_default_asset_asset_type` | character | On3 asset-type discriminator of the person's high school's logo asset (e.g. Image). |
| `person_high_school_default_asset_file_system` | character | Storage file-system flag of the person's high school's logo asset. |
| `person_high_school_default_asset_path` | character | Storage path of the person's high school's logo asset. |
| `person_high_school_default_asset_type` | character | Media type field of the person's high school's logo asset (file extension, e.g. png). |
| `person_high_school_default_asset_thumbnail` | character | Thumbnail variant of the person's high school's logo asset (video assets; usually null). |
| `person_high_school_default_asset_duration` | numeric | Duration of the person's high school's logo asset when it is a video (usually null or 0). |
| `person_high_school_default_asset_mime_type` | character | MIME type of the person's high school's logo asset. |
| `person_high_school_slug` | character | URL slug of the person's high school on On3. |
| `person_high_school_primary_color` | character | Primary hex color of the person's high school. |
| `person_high_school_org_type` | character | Organization type label of the person's high school (e.g. HighSchool, College). |
| `person_high_school_org_type_enum` | character | Organization type enum of the person's high school (same vocabulary as org_type). |
| `person_high_school_division` | character | Division or classification of the person's high school (e.g. NCAA-FB). |
| `person_high_school_site_keys` | character | JSON-encoded On3 site keys covering the person's high school (usually null). |
| `person_high_school_url_slug` | character | URL slug variant of the person's high school's page, with the key appended. |
| `person_home_town_name` | character | Home town of the person as On3 lists it (e.g. 'Belleville, MI'). |
| `person_early_enrollee` | logical | Whether the person early-enrolled at college. |
| `person_early_signee` | logical | Whether the person signed during the early signing period. |
| `person_default_asset_url` | character | Convenience CDN URL of the person's headshot. |
| `person_class_year` | integer | High-school graduating class year of the person. |
| `person_athlete_verified` | logical | Whether the person's athlete profile is verified by On3. |
| `person_prospect_verified` | logical | Whether the person's prospect measurables are verified by On3. |
| `person_default_asset_key` | integer | On3 asset key of the person's headshot asset. |
| `person_default_asset_domain_override` | character | CDN domain override for the person's headshot asset (usually null). |
| `person_default_asset_domain` | character | CDN domain serving the person's headshot asset. |
| `person_default_asset_source_override` | character | Source-path override for the person's headshot asset (usually null). |
| `person_default_asset_source` | character | CDN-relative source path of the person's headshot asset. |
| `person_default_asset_title` | character | Editorial title attached to the person's headshot asset. |
| `person_default_asset_description` | character | Editorial description attached to the person's headshot asset (usually null). |
| `person_default_asset_caption` | character | Editorial caption attached to the person's headshot asset (usually null). |
| `person_default_asset_category` | character | Editorial category label of the person's headshot asset (usually null). |
| `person_default_asset_alt_text` | character | Accessibility alt text of the person's headshot asset (usually null). |
| `person_default_asset_height` | integer | Pixel height of the person's headshot asset. |
| `person_default_asset_width` | integer | Pixel width of the person's headshot asset. |
| `person_default_asset_asset_type` | character | On3 asset-type discriminator of the person's headshot asset (e.g. Image). |
| `person_default_asset_file_system` | character | Storage file-system flag of the person's headshot asset. |
| `person_default_asset_path` | character | Storage path of the person's headshot asset. |
| `person_default_asset_type` | character | Media type field of the person's headshot asset (file extension, e.g. png). |
| `person_default_asset_thumbnail` | character | Thumbnail variant of the person's headshot asset (video assets; usually null). |
| `person_default_asset_duration` | integer | Duration of the person's headshot asset when it is a video (usually null or 0). |
| `person_default_asset_mime_type` | character | MIME type of the person's headshot asset. |
| `person_position_abbreviation` | character | Position abbreviation on the person's record. |
| `person_height` | character | Height of the person: a formatted string (e.g. '6-8') or inches, depending on the endpoint. |
| `person_weight` | integer | Weight of the person in pounds. |
| `person_roster_rating` | character | On3 roster (transfer-portal-adjusted) rating of the person, when published. |
| `person_commit_status_type` | character | Type of the person's commitment status (e.g. Committed, Signed, Enrolled, None). |
| `person_commit_status_short_term_signee` | logical | Short-term-signee flag of the person's commitment status (null when not applicable). |
| `person_commit_status_date` | character | Date the person's commitment status took effect (ISO timestamp string). |
| `person_commit_status_committed_asset` | character | Nested asset of the committed-to program (the person's commitment status; usually null). |
| `person_commit_status_committed_asset_res` | character | Nested logo asset of the committed-to program (the person's commitment status; usually null). |
| `person_commit_status_transferred_asset_key` | integer | On3 numeric key of the person's commitment status's program transferred to. |
| `person_commit_status_transferred_asset_url` | character | CDN URL of the person's commitment status's program transferred to's logo. |
| `person_commit_status_transferred_asset_slug` | character | URL slug of the person's commitment status's program transferred to on On3. |
| `person_commit_status_transferred_asset_full_name` | character | Full name of the person's commitment status's program transferred to (e.g. 'Alabama Crimson Tide'). |
| `person_commit_status_transferred_asset_res` | character | Nested logo asset of the program transferred to (the person's commitment status; usually null). |
| `person_commit_status_committed_organization_key` | integer | On3 key of the committed-to program (the person's commitment status). |
| `person_commit_status_committed_organization_full_name` | character | Full name of the person's commitment status's committed-to program (e.g. 'Alabama Crimson Tide'). |
| `person_commit_status_committed_organization_name` | character | Short name of the person's commitment status's committed-to program. |
| `person_commit_status_committed_organization_mascot` | character | Mascot of the person's commitment status's committed-to program. |
| `person_commit_status_committed_organization_abbreviation` | character | Abbreviation of the person's commitment status's committed-to program. |
| `person_commit_status_committed_organization_asset_url` | character | CDN URL of the committed-to program's logo (the person's commitment status). |
| `person_commit_status_committed_organization_asset_key` | integer | On3 asset key of the person's commitment status's committed-to program's logo asset. |
| `person_commit_status_committed_organization_asset_domain_override` | character | CDN domain override for the person's commitment status's committed-to program's logo asset (usually null). |
| `person_commit_status_committed_organization_asset_domain` | character | CDN domain serving the person's commitment status's committed-to program's logo asset. |
| `person_commit_status_committed_organization_asset_source_override` | character | Source-path override for the person's commitment status's committed-to program's logo asset (usually null). |
| `person_commit_status_committed_organization_asset_source` | character | CDN-relative source path of the person's commitment status's committed-to program's logo asset. |
| `person_commit_status_committed_organization_asset_title` | character | Editorial title attached to the person's commitment status's committed-to program's logo asset. |
| `person_commit_status_committed_organization_asset_description` | character | Editorial description attached to the person's commitment status's committed-to program's logo asset (usually null). |
| `person_commit_status_committed_organization_asset_caption` | character | Editorial caption attached to the person's commitment status's committed-to program's logo asset (usually null). |
| `person_commit_status_committed_organization_asset_category` | character | Editorial category label of the person's commitment status's committed-to program's logo asset (usually null). |
| `person_commit_status_committed_organization_asset_alt_text` | character | Accessibility alt text of the person's commitment status's committed-to program's logo asset (usually null). |
| `person_commit_status_committed_organization_asset_height` | integer | Pixel height of the person's commitment status's committed-to program's logo asset. |
| `person_commit_status_committed_organization_asset_width` | integer | Pixel width of the person's commitment status's committed-to program's logo asset. |
| `person_commit_status_committed_organization_asset_asset_type` | character | On3 asset-type discriminator of the person's commitment status's committed-to program's logo asset (e.g. Image). |
| `person_commit_status_committed_organization_asset_file_system` | character | Storage file-system flag of the person's commitment status's committed-to program's logo asset. |
| `person_commit_status_committed_organization_asset_path` | character | Storage path of the person's commitment status's committed-to program's logo asset. |
| `person_commit_status_committed_organization_asset_type` | character | Media type field of the person's commitment status's committed-to program's logo asset (file extension, e.g. png). |
| `person_commit_status_committed_organization_asset_thumbnail` | character | Thumbnail variant of the person's commitment status's committed-to program's logo asset (video assets; usually null). |
| `person_commit_status_committed_organization_asset_duration` | integer | Duration of the person's commitment status's committed-to program's logo asset when it is a video (usually null or 0). |
| `person_commit_status_committed_organization_asset_mime_type` | character | MIME type of the person's commitment status's committed-to program's logo asset. |
| `person_commit_status_committed_organization_slug` | character | URL slug of the committed-to program (the person's commitment status). |
| `person_commit_status_committed_organization_primary_color` | character | Primary hex color of the person's commitment status's committed-to program. |
| `person_commit_status_class_rank` | character | Academic class standing recorded on the person's commitment status (e.g. Senior). |
| `person_commit_status_transfer_entered` | character | Date the player entered the transfer portal (the person's commitment status; null when never entered). |
| `person_commit_status_recruitment_year` | integer | Recruiting-cycle year the person's commitment status belongs to. |
| `person_commit_status_decommitted_asset` | character | Nested asset of the program decommitted from (the person's commitment status; usually null). |
| `person_commit_status_transfer` | logical | Transfer flag of the person's commitment status (null when not applicable). |
| `person_commit_status_expected_to_transfer` | logical | Expected-to-transfer flag of the person's commitment status (null when not applicable). |
| `person_commit_status_recruitment_key` | integer | On3 key of the recruitment record the person's commitment status belongs to. |
| `person_commit_status_withdrawn_transfer` | logical | Whether the player withdrew from the transfer portal (the person's commitment status). |
| `person_commit_status_withdrawn_transfer_date` | character | Date the player withdrew from the transfer portal (the person's commitment status; null when never withdrawn). |
| `person_predictions` | character | JSON-encoded On3 RPM (Recruiting Prediction Machine) entries for the person. |
| `person_nil_status` | character | On3 NIL valuation status of the person (e.g. Normal). |
| `person_nil_value` | numeric | On3 NIL valuation of the person in US dollars. |
| `person_sport` | character | Sport slug the video belongs to. |
| `valuation_nil_status` | character | Status of the NIL valuation (e.g. Normal). |
| `valuation_valuation` | integer | The NIL valuation in US dollars. |
| `valuation_valuation_change` | integer | Change in the NIL valuation since the previous update, in US dollars. |
| `valuation_followers` | integer | Social-media follower count feeding the NIL valuation. |
| `valuation_rank` | integer | Overall rank of the NIL valuation across On3's NIL 100. |
| `valuation_last_updated` | integer | Unix timestamp (seconds) of the last update to the NIL valuation. |
| `valuation_whisper` | numeric | On3 whisper valuation (reported deal value) behind the NIL valuation, in US dollars. |
| `valuation_whisper_change` | numeric | Change in the whisper valuation behind the NIL valuation, in US dollars. |
| `valuation_social_valuations` | character | JSON-encoded per-platform social valuations behind the NIL valuation. |
| `valuation_group_rank` | integer | Rank of the NIL valuation within its group (sport or position). |
| `valuation_group_name` | character | Name of the group the NIL valuation is ranked within (usually null). |
| `valuation_tags` | character | JSON-encoded list of NIL tags on the NIL valuation (e.g. Influencer). |
| `valuation_roster_value` | character | Nested roster-value object of the NIL valuation (usually null). |
| `valuation_nil_value` | character | Nested NIL-value object of the NIL valuation (usually null). |
| `person_high_school_default_asset` | character | Nested default-asset object of the person's high school (null when On3 ships none). |

**Row type:** `On3Nil100V2Row` (exported from the package root).

### Returns — `on3_nil_compliances_state` / `on3NilCompliancesState`

No returns table is published for this endpoint: no committed capture with rows, and the response type is only heuristically mapped (x-source: call-site); names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_nil_rankings` / `on3NilRankings`

| col_name | type | description |
|---|---|---|
| `person_default_sport_key` | integer | On3 numeric key of the person's primary sport. |
| `person_default_sport_name` | character | Name of the person's primary sport (e.g. Football). |
| `person_default_sport_slug` | character | URL slug of the person's primary sport. |
| `person_default_sport_abbreviation` | character | Abbreviation of the person's primary sport. |
| `person_default_sport_is_rankable` | logical | Whether On3 ranks players in the person's primary sport. |
| `person_default_sport_is_industry_rankable` | logical | Whether industry-consensus rankings exist for the person's primary sport. |
| `person_default_sport_is_scoutable` | logical | Whether On3 scouting reports exist for the person's primary sport. |
| `person_rating_consensus_rating` | numeric | Industry-consensus numeric rating paired with the person's On3 rating (0-100 scale). |
| `person_rating_consensus_stars` | integer | Industry-consensus star rating paired with the person's On3 rating (2-5). |
| `person_rating_consensus_national_rank` | integer | Industry-consensus national rank paired with the person's On3 rating. |
| `person_rating_consensus_position_rank` | integer | Industry-consensus position rank paired with the person's On3 rating. |
| `person_rating_consensus_state_rank` | integer | Industry-consensus state rank paired with the person's On3 rating. |
| `person_rating_key` | integer | On3 key of the person's On3 rating record. |
| `person_rating_rating` | numeric | Numeric value of the person's On3 rating (0-100 scale). |
| `person_rating_stars` | integer | Star rating of the person's On3 rating (2-5). |
| `person_rating_national_rank` | integer | National rank of the person's On3 rating. |
| `person_rating_position_rank` | integer | Position rank of the person's On3 rating. |
| `person_rating_state_rank` | integer | State rank of the person's On3 rating. |
| `person_rating_position_abbr` | character | Position abbreviation the person's On3 rating was assigned at. |
| `person_rating_state_abbr` | character | State abbreviation the person's On3 rating was assigned in. |
| `person_rating_five_star_plus` | logical | Five-star-plus flag on the person's On3 rating. |
| `person_status_is_committed` | logical | Whether the recruit is committed (the person's recruiting status). |
| `person_status_is_signed` | logical | Whether the recruit has signed (the person's recruiting status). |
| `person_status_is_transfer` | logical | Whether the recruit is a transfer (the person's recruiting status). |
| `person_status_is_enrolled` | logical | Whether the recruit is enrolled (the person's recruiting status). |
| `person_status_commitment_date` | character | Date of the commitment (the person's recruiting status; ISO timestamp string). |
| `person_status_committed_organization_key` | numeric | On3 key of the committed-to program (the person's recruiting status). |
| `person_status_committed_organization_slug` | character | URL slug of the committed-to program (the person's recruiting status). |
| `person_status_committed_organization_asset_url` | character | CDN URL of the committed-to program's logo (the person's recruiting status). |
| `person_status_committed_organization_asset_key` | numeric | On3 asset key of the person's recruiting status's committed-to program's logo asset. |
| `person_status_committed_organization_asset_domain_override` | character | CDN domain override for the person's recruiting status's committed-to program's logo asset (usually null). |
| `person_status_committed_organization_asset_domain` | character | CDN domain serving the person's recruiting status's committed-to program's logo asset. |
| `person_status_committed_organization_asset_source_override` | character | Source-path override for the person's recruiting status's committed-to program's logo asset (usually null). |
| `person_status_committed_organization_asset_source` | character | CDN-relative source path of the person's recruiting status's committed-to program's logo asset. |
| `person_status_committed_organization_asset_title` | character | Editorial title attached to the person's recruiting status's committed-to program's logo asset. |
| `person_status_committed_organization_asset_description` | character | Editorial description attached to the person's recruiting status's committed-to program's logo asset (usually null). |
| `person_status_committed_organization_asset_caption` | character | Editorial caption attached to the person's recruiting status's committed-to program's logo asset (usually null). |
| `person_status_committed_organization_asset_category` | character | Editorial category label of the person's recruiting status's committed-to program's logo asset (usually null). |
| `person_status_committed_organization_asset_alt_text` | character | Accessibility alt text of the person's recruiting status's committed-to program's logo asset (usually null). |
| `person_status_committed_organization_asset_height` | numeric | Pixel height of the person's recruiting status's committed-to program's logo asset. |
| `person_status_committed_organization_asset_width` | numeric | Pixel width of the person's recruiting status's committed-to program's logo asset. |
| `person_status_committed_organization_asset_asset_type` | character | On3 asset-type discriminator of the person's recruiting status's committed-to program's logo asset (e.g. Image). |
| `person_status_committed_organization_asset_file_system` | character | Storage file-system flag of the person's recruiting status's committed-to program's logo asset. |
| `person_status_committed_organization_asset_path` | character | Storage path of the person's recruiting status's committed-to program's logo asset. |
| `person_status_committed_organization_asset_type` | character | Media type field of the person's recruiting status's committed-to program's logo asset (file extension, e.g. png). |
| `person_status_committed_organization_asset_thumbnail` | character | Thumbnail variant of the person's recruiting status's committed-to program's logo asset (video assets; usually null). |
| `person_status_committed_organization_asset_duration` | numeric | Duration of the person's recruiting status's committed-to program's logo asset when it is a video (usually null or 0). |
| `person_status_committed_organization_asset_mime_type` | character | MIME type of the person's recruiting status's committed-to program's logo asset. |
| `person_status_committed_organization_primary_color` | character | Primary hex color of the person's recruiting status's committed-to program. |
| `person_status_transferred_from_organization_asset_url` | character | Convenience CDN URL of the person's recruiting status's program transferred from's logo. |
| `person_status_transferred_from_organization_slug` | character | URL slug of the person's recruiting status's program transferred from on On3. |
| `person_status_highest_interest_level` | numeric | Highest interest level a program has logged for the recruit (the person's recruiting status). |
| `person_status_interest_count` | integer | Number of programs with logged interest in the recruit (the person's recruiting status). |
| `person_status_recruitment_year` | integer | Recruiting-cycle year the person's recruiting status belongs to. |
| `person_status_sport_name` | character | Sport the person's recruiting status applies to. |
| `person_status_short_term_signee` | logical | Short-term-signee flag of the person's recruiting status (null when not applicable). |
| `person_predictions` | character | JSON-encoded On3 RPM (Recruiting Prediction Machine) entries for the person. |
| `person_tags` | character | JSON-encoded list of On3 profile tags on the person (e.g. Influencer). |
| `person_key` | integer | On3 numeric key of the person. |
| `person_name` | character | Display name of the person. |
| `person_slug` | character | URL slug of the person's On3 profile. |
| `person_high_school_name` | character | High-school display name on the person's record. |
| `person_high_school_key` | integer | On3 numeric key of the person's high school. |
| `person_high_school_full_name` | character | Full name of the person's high school (e.g. 'Alabama Crimson Tide'). |
| `person_high_school_name_2` | character | High-school display name on the person's record (json_normalize de-duplication suffix). |
| `person_high_school_known_as` | character | Common short name of the person's high school, when On3 lists one. |
| `person_high_school_mascot` | character | Mascot of the person's high school. |
| `person_high_school_abbreviation` | character | Abbreviation of the person's high school. |
| `person_high_school_asset_url` | character | Convenience CDN URL of the person's high school's logo. |
| `person_high_school_default_asset_key` | integer | On3 asset key of the person's high school's logo asset. |
| `person_high_school_default_asset_domain_override` | character | CDN domain override for the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_domain` | character | CDN domain serving the person's high school's logo asset. |
| `person_high_school_default_asset_source_override` | character | Source-path override for the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_source` | character | CDN-relative source path of the person's high school's logo asset. |
| `person_high_school_default_asset_title` | character | Editorial title attached to the person's high school's logo asset. |
| `person_high_school_default_asset_description` | character | Editorial description attached to the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_caption` | character | Editorial caption attached to the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_category` | character | Editorial category label of the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_alt_text` | character | Accessibility alt text of the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_height` | integer | Pixel height of the person's high school's logo asset. |
| `person_high_school_default_asset_width` | integer | Pixel width of the person's high school's logo asset. |
| `person_high_school_default_asset_asset_type` | character | On3 asset-type discriminator of the person's high school's logo asset (e.g. Image). |
| `person_high_school_default_asset_file_system` | character | Storage file-system flag of the person's high school's logo asset. |
| `person_high_school_default_asset_path` | character | Storage path of the person's high school's logo asset. |
| `person_high_school_default_asset_type` | character | Media type field of the person's high school's logo asset (file extension, e.g. png). |
| `person_high_school_default_asset_thumbnail` | character | Thumbnail variant of the person's high school's logo asset (video assets; usually null). |
| `person_high_school_default_asset_duration` | integer | Duration of the person's high school's logo asset when it is a video (usually null or 0). |
| `person_high_school_default_asset_mime_type` | character | MIME type of the person's high school's logo asset. |
| `person_high_school_slug` | character | URL slug of the person's high school on On3. |
| `person_high_school_primary_color` | character | Primary hex color of the person's high school. |
| `person_high_school_org_type` | character | Organization type label of the person's high school (e.g. HighSchool, College). |
| `person_high_school_org_type_enum` | character | Organization type enum of the person's high school (same vocabulary as org_type). |
| `person_high_school_division` | character | Division or classification of the person's high school (e.g. NCAA-FB). |
| `person_high_school_site_keys` | character | JSON-encoded On3 site keys covering the person's high school (usually null). |
| `person_high_school_url_slug` | character | URL slug variant of the person's high school's page, with the key appended. |
| `person_home_town_name` | character | Home town of the person as On3 lists it (e.g. 'Belleville, MI'). |
| `person_default_asset_url` | character | Convenience CDN URL of the person's headshot. |
| `person_default_asset_key` | integer | On3 asset key of the person's headshot asset. |
| `person_default_asset_domain_override` | character | CDN domain override for the person's headshot asset (usually null). |
| `person_default_asset_domain` | character | CDN domain serving the person's headshot asset. |
| `person_default_asset_source_override` | character | Source-path override for the person's headshot asset (usually null). |
| `person_default_asset_source` | character | CDN-relative source path of the person's headshot asset. |
| `person_default_asset_title` | character | Editorial title attached to the person's headshot asset. |
| `person_default_asset_description` | character | Editorial description attached to the person's headshot asset (usually null). |
| `person_default_asset_caption` | character | Editorial caption attached to the person's headshot asset (usually null). |
| `person_default_asset_category` | character | Editorial category label of the person's headshot asset (usually null). |
| `person_default_asset_alt_text` | character | Accessibility alt text of the person's headshot asset (usually null). |
| `person_default_asset_height` | integer | Pixel height of the person's headshot asset. |
| `person_default_asset_width` | integer | Pixel width of the person's headshot asset. |
| `person_default_asset_asset_type` | character | On3 asset-type discriminator of the person's headshot asset (e.g. Image). |
| `person_default_asset_file_system` | character | Storage file-system flag of the person's headshot asset. |
| `person_default_asset_path` | character | Storage path of the person's headshot asset. |
| `person_default_asset_type` | character | Media type field of the person's headshot asset (file extension, e.g. png). |
| `person_default_asset_thumbnail` | character | Thumbnail variant of the person's headshot asset (video assets; usually null). |
| `person_default_asset_duration` | integer | Duration of the person's headshot asset when it is a video (usually null or 0). |
| `person_default_asset_mime_type` | character | MIME type of the person's headshot asset. |
| `person_early_signee` | logical | Whether the person signed during the early signing period. |
| `person_early_enrollee` | logical | Whether the person early-enrolled at college. |
| `person_position_abbreviation` | character | Position abbreviation on the person's record. |
| `person_height` | numeric | Height of the person: a formatted string (e.g. '6-8') or inches, depending on the endpoint. |
| `person_formatted_height` | character | Human-formatted height of the person (e.g. '6-3.5'). |
| `person_weight` | integer | Weight of the person in pounds. |
| `person_class_year` | integer | High-school graduating class year of the person. |
| `person_athlete_verified` | logical | Whether the person's athlete profile is verified by On3. |
| `person_prospect_verified` | logical | Whether the person's prospect measurables are verified by On3. |
| `person_class_rank` | character | Academic class standing of the person (e.g. Senior, RedShirt Senior). |
| `person_recruitment_key` | integer | On3 key of the person's active recruitment record. |
| `person_age` | integer | Age of the person in years, when known. |
| `valuation_nil_status` | character | Status of the NIL valuation (e.g. Normal). |
| `valuation_valuation` | integer | The NIL valuation in US dollars. |
| `valuation_valuation_change` | integer | Change in the NIL valuation since the previous update, in US dollars. |
| `valuation_followers` | integer | Social-media follower count feeding the NIL valuation. |
| `valuation_rank` | integer | Overall rank of the NIL valuation across On3's NIL 100. |
| `valuation_last_updated` | integer | Unix timestamp (seconds) of the last update to the NIL valuation. |
| `valuation_whisper` | character | On3 whisper valuation (reported deal value) behind the NIL valuation, in US dollars. |
| `valuation_whisper_change` | character | Change in the whisper valuation behind the NIL valuation, in US dollars. |
| `valuation_social_valuations` | character | JSON-encoded per-platform social valuations behind the NIL valuation. |
| `valuation_group_rank` | integer | Rank of the NIL valuation within its group (sport or position). |
| `valuation_group_name` | character | Name of the group the NIL valuation is ranked within (usually null). |
| `valuation_tags` | character | JSON-encoded list of NIL tags on the NIL valuation (e.g. Influencer). |
| `valuation_roster_value` | character | Nested roster-value object of the NIL valuation (usually null). |
| `valuation_nil_value` | character | Nested NIL-value object of the NIL valuation (usually null). |
| `person_status_committed_organization_asset` | character | Nested logo asset of the committed-to program (the person's recruiting status; stringified or null). |

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
| `head_coach_key` | integer | On3 numeric key of the head coach. |
| `head_coach_first_name` | character | First name of the head coach. |
| `head_coach_last_name` | character | Last name of the head coach. |
| `head_coach_known_as_name` | character | Preferred name of the head coach, when it differs from the given name. |
| `head_coach_full_name` | character | Full name of the head coach. |
| `head_coach_slug` | character | URL slug of the head coach's On3 profile. |
| `head_coach_default_asset_key` | integer | On3 asset key of the head coach's headshot asset. |
| `head_coach_default_asset_domain_override` | character | CDN domain override for the head coach's headshot asset (usually null). |
| `head_coach_default_asset_domain` | character | CDN domain serving the head coach's headshot asset. |
| `head_coach_default_asset_source_override` | character | Source-path override for the head coach's headshot asset (usually null). |
| `head_coach_default_asset_source` | character | CDN-relative source path of the head coach's headshot asset. |
| `head_coach_default_asset_title` | character | Editorial title attached to the head coach's headshot asset. |
| `head_coach_default_asset_description` | character | Editorial description attached to the head coach's headshot asset (usually null). |
| `head_coach_default_asset_caption` | character | Editorial caption attached to the head coach's headshot asset (usually null). |
| `head_coach_default_asset_category` | character | Editorial category label of the head coach's headshot asset (usually null). |
| `head_coach_default_asset_alt_text` | character | Accessibility alt text of the head coach's headshot asset (usually null). |
| `head_coach_default_asset_height` | integer | Pixel height of the head coach's headshot asset. |
| `head_coach_default_asset_width` | integer | Pixel width of the head coach's headshot asset. |
| `head_coach_default_asset_asset_type` | character | On3 asset-type discriminator of the head coach's headshot asset (e.g. Image). |
| `head_coach_default_asset_file_system` | character | Storage file-system flag of the head coach's headshot asset. |
| `head_coach_default_asset_path` | character | Storage path of the head coach's headshot asset. |
| `head_coach_default_asset_type` | character | Media type field of the head coach's headshot asset (file extension, e.g. png). |
| `head_coach_default_asset_thumbnail` | character | Thumbnail variant of the head coach's headshot asset (video assets; usually null). |
| `head_coach_default_asset_duration` | integer | Duration of the head coach's headshot asset when it is a video (usually null or 0). |
| `head_coach_default_asset_mime_type` | character | MIME type of the head coach's headshot asset. |
| `head_coach_organization_key` | integer | On3 numeric key of the head coach's program. |
| `head_coach_organization_full_name` | character | Full name of the head coach's program (e.g. 'Alabama Crimson Tide'). |
| `head_coach_organization_name` | character | Short name of the head coach's program. |
| `head_coach_organization_known_as` | character | Common short name of the head coach's program, when On3 lists one. |
| `head_coach_organization_mascot` | character | Mascot of the head coach's program. |
| `head_coach_organization_abbreviation` | character | Abbreviation of the head coach's program. |
| `head_coach_organization_asset_url` | character | Convenience CDN URL of the head coach's program's logo. |
| `head_coach_organization_default_asset_key` | integer | On3 asset key of the head coach's program's logo asset. |
| `head_coach_organization_default_asset_domain_override` | character | CDN domain override for the head coach's program's logo asset (usually null). |
| `head_coach_organization_default_asset_domain` | character | CDN domain serving the head coach's program's logo asset. |
| `head_coach_organization_default_asset_source_override` | character | Source-path override for the head coach's program's logo asset (usually null). |
| `head_coach_organization_default_asset_source` | character | CDN-relative source path of the head coach's program's logo asset. |
| `head_coach_organization_default_asset_title` | character | Editorial title attached to the head coach's program's logo asset. |
| `head_coach_organization_default_asset_description` | character | Editorial description attached to the head coach's program's logo asset (usually null). |
| `head_coach_organization_default_asset_caption` | character | Editorial caption attached to the head coach's program's logo asset (usually null). |
| `head_coach_organization_default_asset_category` | character | Editorial category label of the head coach's program's logo asset (usually null). |
| `head_coach_organization_default_asset_alt_text` | character | Accessibility alt text of the head coach's program's logo asset (usually null). |
| `head_coach_organization_default_asset_height` | integer | Pixel height of the head coach's program's logo asset. |
| `head_coach_organization_default_asset_width` | integer | Pixel width of the head coach's program's logo asset. |
| `head_coach_organization_default_asset_asset_type` | character | On3 asset-type discriminator of the head coach's program's logo asset (e.g. Image). |
| `head_coach_organization_default_asset_file_system` | character | Storage file-system flag of the head coach's program's logo asset. |
| `head_coach_organization_default_asset_path` | character | Storage path of the head coach's program's logo asset. |
| `head_coach_organization_default_asset_type` | character | Media type field of the head coach's program's logo asset (file extension, e.g. png). |
| `head_coach_organization_default_asset_thumbnail` | character | Thumbnail variant of the head coach's program's logo asset (video assets; usually null). |
| `head_coach_organization_default_asset_duration` | integer | Duration of the head coach's program's logo asset when it is a video (usually null or 0). |
| `head_coach_organization_default_asset_mime_type` | character | MIME type of the head coach's program's logo asset. |
| `head_coach_organization_slug` | character | URL slug of the head coach's program on On3. |
| `head_coach_organization_primary_color` | character | Primary hex color of the head coach's program. |
| `head_coach_organization_org_type` | character | Organization type label of the head coach's program (e.g. HighSchool, College). |
| `head_coach_organization_org_type_enum` | character | Organization type enum of the head coach's program (same vocabulary as org_type). |
| `head_coach_organization_division` | character | Division or classification of the head coach's program (e.g. NCAA-FB). |
| `head_coach_organization_site_keys` | character | JSON-encoded On3 site keys covering the head coach's program (usually null). |
| `head_coach_organization_url_slug` | character | URL slug variant of the head coach's program's page, with the key appended. |
| `head_coach_primary_position_key` | integer | On3 numeric key of the head coach's primary position. |
| `head_coach_primary_position_name` | character | Name of the head coach's primary position (e.g. Quarterback). |
| `head_coach_primary_position_abbr` | character | Abbreviation of the head coach's primary position (e.g. QB). |
| `head_coach_secondary_position` | character | Secondary position of the head coach, when listed. |
| `head_coach_org_season_count` | integer | Seasons the head coach has spent at the program. |
| `head_coach_years_active` | integer | Years the head coach has been active in coaching. |

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
| `rank` | integer | Overall rank of the player's NIL valuation across On3's NIL 100. |
| `last_updated` | integer | Unix timestamp (seconds) of the last update to the NIL valuation. |
| `whisper` | numeric | On3 whisper valuation (reported deal value) behind the NIL valuation, in US dollars. |
| `whisper_change` | numeric | Change in the whisper valuation since the previous update, in US dollars. |
| `social_valuations` | character | Per-platform breakdown of the social components of the valuation (stringified list). |
| `group_rank` | integer | Rank of the NIL valuation within its group (sport or position). |
| `group_name` | character | Name of the group the NIL valuation is ranked within (usually null). |
| `tags` | character | JSON-encoded list of NIL tags on the valuation (e.g. Influencer). |
| `roster_value` | character | Nested roster-value object of the NIL valuation (usually null). |
| `nil_value` | character | On3 NIL valuation in US dollars. |

**Row type:** `On3PeopleLatestValuationRow` (exported from the package root).

### Returns — `on3_people_measurements` / `on3PeopleMeasurements`

| col_name | type | description |
|---|---|---|
| `player_measurements` | character | JSON-encoded list of the player's measurement records (type, value, verification). |

**Row type:** `On3PeopleMeasurementsRow` (exported from the package root).

### Returns — `on3_people_person_connections` / `on3PeoplePersonConnections`

No returns table is published for this endpoint: its committed capture has 0 rows, so the parser emits no columns; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_people_social` / `on3PeopleSocial`

| col_name | type | description |
|---|---|---|
| `type` | character | Type label of the row (vocabulary depends on the endpoint). |
| `handle` | character | Athlete's account handle on the social platform. |
| `handshake` | logical | On3 RDB handshake field on the social-account record (platform link/verification metadata). |

**Row type:** `On3PeopleSocialRow` (exported from the package root).

### Returns — `on3_people_social_post_summary` / `on3PeopleSocialPostSummary`

| col_name | type | description |
|---|---|---|
| `social_type` | character | Social platform the post summary covers (e.g. Twitter/X, Instagram). |
| `type` | character | Type label of the row (vocabulary depends on the endpoint). |
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
| `type` | character | Type label of the row (vocabulary depends on the endpoint). |
| `link` | character | Site-relative On3 link for the row, when any. |
| `ranking_key` | integer | On3 key of the ranking cycle the row belongs to. |
| `ranking_year` | integer | Ranking cycle year. |
| `ranking_type` | character | Ranking type (e.g. Player, TransferPortal, Team). |
| `rating` | numeric | On3 rating of the player (0-100 scale), when published. |
| `sport` | character | Nested On3 sport object for the ranking row (stringified). |
| `class_year` | integer | Recruiting class year the ranking covers. |
| `state_rank` | integer | Rank within the player's state in the ranking. |
| `state_abbr` | character | Two-letter abbreviation of the player's home state. |
| `position_rank` | integer | Rank at the player's position in the ranking. |
| `position_abbr` | character | Position abbreviation the ranking entry was assigned at. |
| `overall_rank` | integer | Overall national rank in the ranking. |
| `stars` | integer | Star rating (2-5). |
| `five_star_plus` | logical | Whether On3 designates the player a Five-Star Plus+ prospect. |
| `nearly_five_star_plus` | logical | On3 flag that the player narrowly missed the Five-Star Plus+ designation. |
| `change_1` | character | Direction of the rating change since the previous update (e.g. Increase); the numeric suffix is a json_normalize de-duplication artefact. |

**Row type:** `On3PlayerAllRankingsRow` (exported from the package root).

### Returns — `on3_player_database_updates` / `on3PlayerDatabaseUpdates`

| col_name | type | description |
|---|---|---|
| `key` | integer | On3 RDB key for the database-update entry. |
| `type` | character | Type label of the row (vocabulary depends on the endpoint). |
| `text` | character | Text of the update as On3 displays it. |
| `replacement_text` | character | Rendered text of the update entry (with references substituted in). |
| `link` | character | Site-relative On3 link for the row, when any. |
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
| `source` | character | CDN-relative source path of the image asset. |
| `title` | character | Title of the row's record. |
| `description` | character | Free-text description or biography shipped by On3. |
| `caption` | character | Caption text for the image. |
| `category` | character | Category label On3 attaches to the row. |
| `alt_text` | character | Alt text for the image. |
| `height` | integer | Height as a formatted string (e.g. '6-3.5'). |
| `width` | integer | Image width in pixels. |
| `asset_type` | character | Type of the asset (e.g. image) in On3's asset system. |
| `file_system` | character | Storage file system the asset lives on (On3 asset metadata). |
| `path` | character | Storage path of the image file. |
| `type` | character | Type label of the row (vocabulary depends on the endpoint). |
| `thumbnail` | character | URL or path of the image's thumbnail rendition. |
| `duration` | integer | Duration of the asset when it is a video (0 for images). |
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
| `rating` | integer | On3 rating of the player (0-100 scale), when published. |
| `state_rank` | integer | Rank within the player's state in the ranking. |
| `state_abbr` | character | Two-letter abbreviation of the player's home state. |
| `position_rank` | integer | Rank at the player's position in the ranking. |
| `position_abbr` | character | Position abbreviation the ranking entry was assigned at. |
| `overall_rank` | integer | Overall national rank in the ranking. |
| `stars` | integer | Star rating (2-5). |
| `consensus_rating` | numeric | Player's industry-consensus rating (blend of the major recruiting services). |
| `consensus_state_rank` | integer | Player's consensus rank within their home state. |
| `consensus_position_rank` | integer | Player's consensus rank at their position. |
| `consensus_overall_rank` | integer | Player's national consensus rank. |
| `consensus_stars` | integer | Player's star rating under the industry consensus. |
| `strength` | integer | Strength score On3 attaches to the ranking entry. |
| `five_star_plus` | logical | Whether On3 designates the player a Five-Star Plus+ prospect. |
| `ranking_type` | character | Ranking type (e.g. Player, TransferPortal, Team). |
| `ranking_key_2` | integer | Ranking key repeated from the nested ranking object (json_normalize de-duplication suffix). |
| `ranking_sport_key` | integer | On3 numeric key of the sport the ranking is in. |
| `ranking_sport_key_2` | integer | On3 numeric key of the sport the ranking is in (json_normalize de-duplication suffix). |
| `ranking_sport_name` | character | Name of the sport the ranking is in (e.g. Football). |
| `ranking_year` | integer | Ranking cycle year. |
| `change_38` | character | Direction of the On3 rating change since the previous update (e.g. Increase); the numeric suffix is a json_normalize de-duplication artefact. |
| `consensus_change_41` | character | Direction of the consensus rating change since the previous update (e.g. Increase); the numeric suffix is a json_normalize de-duplication artefact. |

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
| `name` | character | Display name of the row's record. |
| `slug` | character | URL slug of the row's record on On3. |
| `high_school_name` | character | High-school display name (top-level field). |
| `hometown_name` | character | Player's hometown, as listed by On3. |
| `position_abbreviation` | character | Position abbreviation on the record. |
| `class_rank` | character | Player's rank within their recruiting class. |
| `height` | character | Height as a formatted string (e.g. '6-3.5'). |
| `weight` | integer | Weight in pounds. |
| `class_year` | integer | Player's recruiting class year. |
| `degree` | character | Degree the player earned or is pursuing, when listed. |
| `age` | integer | Age in years, when known. |
| `sports` | character | Sports the player is profiled in, as a stringified list. |
| `description` | character | Free-text description or biography shipped by On3. |
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
| `jersey_number` | integer | Jersey number, when listed. |
| `badge` | character | Profile badge assigned by On3, when any. |
| `ncaa_id` | character | Player's NCAA identifier, when known to On3. |
| `managed_by_user` | logical | On3 user account that manages the player's profile, when claimed. |
| `ranking_key_2` | integer | Ranking key repeated from the nested ranking object (json_normalize de-duplication suffix). |
| `ranking_rating` | numeric | Numeric value of the ranking (0-100 scale). |
| `ranking_stars` | integer | Star rating of the ranking (2-5). |
| `ranking_national_rank` | integer | National rank of the ranking. |
| `ranking_position_rank` | integer | Position rank of the ranking. |
| `ranking_state_rank` | integer | State rank of the ranking. |
| `ranking_position_abbr` | character | Position abbreviation the ranking was assigned at. |
| `ranking_state_abbr` | character | State abbreviation the ranking was assigned in. |
| `ranking_five_star_plus` | logical | Five-star-plus flag on the ranking. |
| `high_school_key` | integer | On3 numeric key of the high school. |
| `high_school_full_name` | character | Full name of the high school (with mascot). |
| `high_school_name_2` | character | Name field of the nested high-school object (json_normalize de-duplication of high_school_name). |
| `high_school_known_as` | character | Common short name of the high school, when On3 lists one. |
| `high_school_mascot` | character | High-school mascot. |
| `high_school_abbreviation` | character | High-school abbreviation. |
| `high_school_asset_url` | character | Convenience CDN URL of the high-school logo. |
| `high_school_default_asset_key` | integer | On3 asset key of the high school's logo asset. |
| `high_school_default_asset_domain_override` | character | CDN domain override for the high school's logo asset (usually null). |
| `high_school_default_asset_domain` | character | CDN domain serving the high school's logo asset. |
| `high_school_default_asset_source_override` | character | Source-path override for the high school's logo asset (usually null). |
| `high_school_default_asset_source` | character | CDN-relative source path of the high school's logo asset. |
| `high_school_default_asset_title` | character | Editorial title attached to the high school's logo asset. |
| `high_school_default_asset_description` | character | Editorial description attached to the high school's logo asset (usually null). |
| `high_school_default_asset_caption` | character | Editorial caption attached to the high school's logo asset (usually null). |
| `high_school_default_asset_category` | character | Editorial category label of the high school's logo asset (usually null). |
| `high_school_default_asset_alt_text` | character | Accessibility alt text of the high school's logo asset (usually null). |
| `high_school_default_asset_height` | integer | Pixel height of the high school's logo asset. |
| `high_school_default_asset_width` | integer | Pixel width of the high school's logo asset. |
| `high_school_default_asset_asset_type` | character | On3 asset-type discriminator of the high school's logo asset (e.g. Image). |
| `high_school_default_asset_file_system` | character | Storage file-system flag of the high school's logo asset. |
| `high_school_default_asset_path` | character | Storage path of the high school's logo asset. |
| `high_school_default_asset_type` | character | Media type field of the high school's logo asset (file extension, e.g. png). |
| `high_school_default_asset_thumbnail` | character | Thumbnail variant of the high school's logo asset (video assets; usually null). |
| `high_school_default_asset_duration` | integer | Duration of the high school's logo asset when it is a video (usually null or 0). |
| `high_school_default_asset_mime_type` | character | MIME type of the high school's logo asset. |
| `high_school_slug` | character | URL slug of the high school on On3. |
| `high_school_primary_color` | character | Primary hex color of the high school. |
| `high_school_org_type` | character | Organization type label of the school (e.g. HighSchool). |
| `high_school_org_type_enum` | character | Organization type enum of the school. |
| `high_school_division` | character | Division or classification of the high school, when listed. |
| `high_school_site_keys` | character | JSON-encoded On3 site keys covering the school (usually null). |
| `high_school_url_slug` | character | URL slug variant of the high-school page, with the key appended. |
| `hometown_state_key` | integer | On3 numeric key of the home-town state. |
| `hometown_state_name` | character | Name of the home-town state. |
| `hometown_state_abbreviation` | character | Two-letter abbreviation of the home-town state. |
| `hometown_state_country_key` | integer | On3 numeric key of the home-town state's country. |
| `current_state_key` | integer | On3 numeric key of the current state. |
| `current_state_name` | character | Name of the current state. |
| `current_state_abbreviation` | character | Two-letter abbreviation of the current state. |
| `current_state_country_key` | integer | On3 numeric key of the current state's country. |
| `default_asset_key` | integer | On3 asset key of the default asset. |
| `default_asset_domain_override` | character | CDN domain override for the record's default asset (usually null). |
| `default_asset_domain` | character | CDN domain serving the default asset. |
| `default_asset_source_override` | character | Source-path override for the default asset (usually null). |
| `default_asset_source` | character | CDN-relative source path of the default asset. |
| `default_asset_title` | character | Editorial title attached to the default asset. |
| `default_asset_description` | character | Editorial description attached to the default asset (usually null). |
| `default_asset_caption` | character | Editorial caption attached to the default asset (usually null). |
| `default_asset_category` | character | Editorial category label of the default asset (usually null). |
| `default_asset_alt_text` | character | Accessibility alt text of the default asset (usually null). |
| `default_asset_height` | integer | Pixel height of the default asset. |
| `default_asset_width` | integer | Pixel width of the default asset. |
| `default_asset_asset_type` | character | On3 asset-type discriminator of the default asset (e.g. Image). |
| `default_asset_file_system` | character | Storage file-system flag of the default asset. |
| `default_asset_path` | character | Storage path of the default asset. |
| `default_asset_type` | character | Media type field of the default asset (file extension, e.g. png). |
| `default_asset_thumbnail` | character | Thumbnail variant of the default asset (video assets; usually null). |
| `default_asset_duration` | integer | Duration of the default asset when it is a video (usually null or 0). |
| `default_asset_mime_type` | character | MIME type of the default asset. |
| `primary_position_key` | integer | On3 numeric key of the primary position. |
| `primary_position_name` | character | Name of the primary position (e.g. Quarterback). |
| `primary_position_abbreviation` | character | Abbreviation of the primary position (e.g. QB). |
| `primary_position_sport_key` | integer | On3 numeric key of the primary position's sport. |
| `primary_position_sport_key_2` | integer | On3 numeric key of the primary position's sport (json_normalize de-duplication suffix). |
| `primary_position_sport_name` | character | Name of the primary position's sport (e.g. Football). |
| `primary_position_sport_slug` | character | URL slug of the primary position's sport. |
| `primary_position_sport_abbreviation` | character | Abbreviation of the primary position's sport. |
| `primary_position_sport_is_rankable` | logical | Whether On3 ranks players in the primary position's sport. |
| `primary_position_sport_is_industry_rankable` | logical | Whether industry-consensus rankings exist for the primary position's sport. |
| `primary_position_sport_is_scoutable` | logical | Whether On3 scouting reports exist for the primary position's sport. |
| `primary_position_position_type` | character | Position type of the primary position (e.g. Offense, Defense). |
| `default_sport_key` | integer | On3 numeric key of the primary sport. |
| `default_sport_name` | character | Name of the primary sport (e.g. Football). |
| `player_status_type` | character | Type of the player's recruiting status (e.g. Committed, Signed, Enrolled, None). |
| `player_status_short_term_signee` | logical | Short-term-signee flag of the player's recruiting status (null when not applicable). |
| `player_status_date` | character | Date the player's recruiting status took effect (ISO timestamp string). |
| `player_status_committed_asset_key` | integer | On3 numeric key of the player's recruiting status's committed-to program. |
| `player_status_committed_asset_url` | character | CDN URL of the player's recruiting status's committed-to program's logo. |
| `player_status_committed_asset_slug` | character | URL slug of the player's recruiting status's committed-to program on On3. |
| `player_status_committed_asset_full_name` | character | Full name of the player's recruiting status's committed-to program (e.g. 'Alabama Crimson Tide'). |
| `player_status_committed_asset_res_key` | integer | On3 asset key of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_asset_res_domain_override` | character | CDN domain override for the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_asset_res_domain` | character | CDN domain serving the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_asset_res_source_override` | character | Source-path override for the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_asset_res_source` | character | CDN-relative source path of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_asset_res_title` | character | Editorial title attached to the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_asset_res_description` | character | Editorial description attached to the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_asset_res_caption` | character | Editorial caption attached to the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_asset_res_category` | character | Editorial category label of the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_asset_res_alt_text` | character | Accessibility alt text of the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_asset_res_height` | integer | Pixel height of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_asset_res_width` | integer | Pixel width of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_asset_res_asset_type` | character | On3 asset-type discriminator of the player's recruiting status's committed-to program's logo asset (e.g. Image). |
| `player_status_committed_asset_res_file_system` | character | Storage file-system flag of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_asset_res_path` | character | Storage path of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_asset_res_type` | character | Media type field of the player's recruiting status's committed-to program's logo asset (file extension, e.g. png). |
| `player_status_committed_asset_res_thumbnail` | character | Thumbnail variant of the player's recruiting status's committed-to program's logo asset (video assets; usually null). |
| `player_status_committed_asset_res_duration` | integer | Duration of the player's recruiting status's committed-to program's logo asset when it is a video (usually null or 0). |
| `player_status_committed_asset_res_mime_type` | character | MIME type of the player's recruiting status's committed-to program's logo asset. |
| `player_status_transferred_asset_key` | integer | On3 numeric key of the player's recruiting status's program transferred to. |
| `player_status_transferred_asset_url` | character | CDN URL of the player's recruiting status's program transferred to's logo. |
| `player_status_transferred_asset_slug` | character | URL slug of the player's recruiting status's program transferred to on On3. |
| `player_status_transferred_asset_full_name` | character | Full name of the player's recruiting status's program transferred to (e.g. 'Alabama Crimson Tide'). |
| `player_status_transferred_asset_res_key` | integer | On3 asset key of the player's recruiting status's program transferred to's logo asset. |
| `player_status_transferred_asset_res_domain_override` | character | CDN domain override for the player's recruiting status's program transferred to's logo asset (usually null). |
| `player_status_transferred_asset_res_domain` | character | CDN domain serving the player's recruiting status's program transferred to's logo asset. |
| `player_status_transferred_asset_res_source_override` | character | Source-path override for the player's recruiting status's program transferred to's logo asset (usually null). |
| `player_status_transferred_asset_res_source` | character | CDN-relative source path of the player's recruiting status's program transferred to's logo asset. |
| `player_status_transferred_asset_res_title` | character | Editorial title attached to the player's recruiting status's program transferred to's logo asset. |
| `player_status_transferred_asset_res_description` | character | Editorial description attached to the player's recruiting status's program transferred to's logo asset (usually null). |
| `player_status_transferred_asset_res_caption` | character | Editorial caption attached to the player's recruiting status's program transferred to's logo asset (usually null). |
| `player_status_transferred_asset_res_category` | character | Editorial category label of the player's recruiting status's program transferred to's logo asset (usually null). |
| `player_status_transferred_asset_res_alt_text` | character | Accessibility alt text of the player's recruiting status's program transferred to's logo asset (usually null). |
| `player_status_transferred_asset_res_height` | integer | Pixel height of the player's recruiting status's program transferred to's logo asset. |
| `player_status_transferred_asset_res_width` | integer | Pixel width of the player's recruiting status's program transferred to's logo asset. |
| `player_status_transferred_asset_res_asset_type` | character | On3 asset-type discriminator of the player's recruiting status's program transferred to's logo asset (e.g. Image). |
| `player_status_transferred_asset_res_file_system` | character | Storage file-system flag of the player's recruiting status's program transferred to's logo asset. |
| `player_status_transferred_asset_res_path` | character | Storage path of the player's recruiting status's program transferred to's logo asset. |
| `player_status_transferred_asset_res_type` | character | Media type field of the player's recruiting status's program transferred to's logo asset (file extension, e.g. png). |
| `player_status_transferred_asset_res_thumbnail` | character | Thumbnail variant of the player's recruiting status's program transferred to's logo asset (video assets; usually null). |
| `player_status_transferred_asset_res_duration` | integer | Duration of the player's recruiting status's program transferred to's logo asset when it is a video (usually null or 0). |
| `player_status_transferred_asset_res_mime_type` | character | MIME type of the player's recruiting status's program transferred to's logo asset. |
| `player_status_committed_organization_key` | integer | On3 key of the committed-to program (the player's recruiting status). |
| `player_status_committed_organization_full_name` | character | Full name of the player's recruiting status's committed-to program (e.g. 'Alabama Crimson Tide'). |
| `player_status_committed_organization_name` | character | Short name of the player's recruiting status's committed-to program. |
| `player_status_committed_organization_mascot` | character | Mascot of the player's recruiting status's committed-to program. |
| `player_status_committed_organization_abbreviation` | character | Abbreviation of the player's recruiting status's committed-to program. |
| `player_status_committed_organization_asset_url` | character | CDN URL of the committed-to program's logo (the player's recruiting status). |
| `player_status_committed_organization_asset_key` | integer | On3 asset key of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_organization_asset_domain_override` | character | CDN domain override for the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_organization_asset_domain` | character | CDN domain serving the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_organization_asset_source_override` | character | Source-path override for the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_organization_asset_source` | character | CDN-relative source path of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_organization_asset_title` | character | Editorial title attached to the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_organization_asset_description` | character | Editorial description attached to the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_organization_asset_caption` | character | Editorial caption attached to the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_organization_asset_category` | character | Editorial category label of the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_organization_asset_alt_text` | character | Accessibility alt text of the player's recruiting status's committed-to program's logo asset (usually null). |
| `player_status_committed_organization_asset_height` | integer | Pixel height of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_organization_asset_width` | integer | Pixel width of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_organization_asset_asset_type` | character | On3 asset-type discriminator of the player's recruiting status's committed-to program's logo asset (e.g. Image). |
| `player_status_committed_organization_asset_file_system` | character | Storage file-system flag of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_organization_asset_path` | character | Storage path of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_organization_asset_type` | character | Media type field of the player's recruiting status's committed-to program's logo asset (file extension, e.g. png). |
| `player_status_committed_organization_asset_thumbnail` | character | Thumbnail variant of the player's recruiting status's committed-to program's logo asset (video assets; usually null). |
| `player_status_committed_organization_asset_duration` | integer | Duration of the player's recruiting status's committed-to program's logo asset when it is a video (usually null or 0). |
| `player_status_committed_organization_asset_mime_type` | character | MIME type of the player's recruiting status's committed-to program's logo asset. |
| `player_status_committed_organization_slug` | character | URL slug of the committed-to program (the player's recruiting status). |
| `player_status_committed_organization_primary_color` | character | Primary hex color of the player's recruiting status's committed-to program. |
| `player_status_class_rank` | character | Academic class standing recorded on the player's recruiting status (e.g. Senior). |
| `player_status_transfer_entered` | character | Date the player entered the transfer portal (the player's recruiting status; null when never entered). |
| `player_status_recruitment_year` | character | Recruiting-cycle year the player's recruiting status belongs to. |
| `player_status_decommitted_asset` | character | Nested asset of the program decommitted from (the player's recruiting status; usually null). |
| `player_status_transfer` | logical | Transfer flag of the player's recruiting status (null when not applicable). |
| `player_status_expected_to_transfer` | logical | Expected-to-transfer flag of the player's recruiting status (null when not applicable). |
| `player_status_recruitment_key` | integer | On3 key of the recruitment record the player's recruiting status belongs to. |
| `player_status_withdrawn_transfer` | logical | Whether the player withdrew from the transfer portal (the player's recruiting status). |
| `player_status_withdrawn_transfer_date` | character | Date the player withdrew from the transfer portal (the player's recruiting status; null when never withdrawn). |

**Row type:** `On3PlayerProfileRow` (exported from the package root).

### Returns — `on3_player_team_targets` / `on3PlayerTeamTargets`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_player_videos` / `on3PlayerVideos`

| col_name | type | description |
|---|---|---|
| `key` | integer | On3 RDB key for the video record. |
| `source_url` | character | Source URL of the hosted video. |
| `title` | character | Title of the row's record. |
| `thumbnail` | character | URL of the video's thumbnail image. |
| `description` | character | Free-text description or biography shipped by On3. |
| `date` | integer | Publication date of the video, per On3. |
| `person_key` | integer | On3 person key of the featured athlete. |
| `person_sport` | character | Nested athlete-sport profile the video is attached to (stringified). |
| `is_featured` | logical | Whether the video is featured on the player's On3 profile. |
| `featured_order` | character | Display order among featured videos, when featured. |
| `category_key` | integer | On3 key of the video category. |
| `category_value` | character | Video category label (e.g. Highlights). |

**Row type:** `On3PlayerVideosRow` (exported from the package root).

### Returns — `on3_player_visit_center` / `on3PlayerVisitCenter`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `on3_players_industry_comparision` / `on3PlayersIndustryComparision`

| col_name | type | description |
|---|---|---|
| `ratings` | character | List of per-service rating entries (On3, Rivals, 247, ESPN) composing the industry comparison. |
| `nil_value` | integer | On3 NIL valuation for the player (US dollars). |
| `person_key` | integer | On3 numeric key of the person. |
| `person_name` | character | Display name of the person. |
| `person_slug` | character | URL slug of the person's On3 profile. |
| `person_high_school_name` | character | High-school display name on the person's record. |
| `person_high_school_key` | integer | On3 numeric key of the person's high school. |
| `person_high_school_full_name` | character | Full name of the person's high school (e.g. 'Alabama Crimson Tide'). |
| `person_high_school_name_2` | character | High-school display name on the person's record (json_normalize de-duplication suffix). |
| `person_high_school_known_as` | character | Common short name of the person's high school, when On3 lists one. |
| `person_high_school_mascot` | character | Mascot of the person's high school. |
| `person_high_school_abbreviation` | character | Abbreviation of the person's high school. |
| `person_high_school_asset_url` | character | Convenience CDN URL of the person's high school's logo. |
| `person_high_school_default_asset_key` | integer | On3 asset key of the person's high school's logo asset. |
| `person_high_school_default_asset_domain_override` | character | CDN domain override for the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_domain` | character | CDN domain serving the person's high school's logo asset. |
| `person_high_school_default_asset_source_override` | character | Source-path override for the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_source` | character | CDN-relative source path of the person's high school's logo asset. |
| `person_high_school_default_asset_title` | character | Editorial title attached to the person's high school's logo asset. |
| `person_high_school_default_asset_description` | character | Editorial description attached to the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_caption` | character | Editorial caption attached to the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_category` | character | Editorial category label of the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_alt_text` | character | Accessibility alt text of the person's high school's logo asset (usually null). |
| `person_high_school_default_asset_height` | integer | Pixel height of the person's high school's logo asset. |
| `person_high_school_default_asset_width` | integer | Pixel width of the person's high school's logo asset. |
| `person_high_school_default_asset_asset_type` | character | On3 asset-type discriminator of the person's high school's logo asset (e.g. Image). |
| `person_high_school_default_asset_file_system` | character | Storage file-system flag of the person's high school's logo asset. |
| `person_high_school_default_asset_path` | character | Storage path of the person's high school's logo asset. |
| `person_high_school_default_asset_type` | character | Media type field of the person's high school's logo asset (file extension, e.g. png). |
| `person_high_school_default_asset_thumbnail` | character | Thumbnail variant of the person's high school's logo asset (video assets; usually null). |
| `person_high_school_default_asset_duration` | integer | Duration of the person's high school's logo asset when it is a video (usually null or 0). |
| `person_high_school_default_asset_mime_type` | character | MIME type of the person's high school's logo asset. |
| `person_high_school_slug` | character | URL slug of the person's high school on On3. |
| `person_high_school_primary_color` | character | Primary hex color of the person's high school. |
| `person_high_school_org_type` | character | Organization type label of the person's high school (e.g. HighSchool, College). |
| `person_high_school_org_type_enum` | character | Organization type enum of the person's high school (same vocabulary as org_type). |
| `person_high_school_division` | character | Division or classification of the person's high school (e.g. NCAA-FB). |
| `person_high_school_site_keys` | character | JSON-encoded On3 site keys covering the person's high school (usually null). |
| `person_high_school_url_slug` | character | URL slug variant of the person's high school's page, with the key appended. |
| `person_home_town_name` | character | Home town of the person as On3 lists it (e.g. 'Belleville, MI'). |
| `person_default_asset_url` | character | Convenience CDN URL of the person's headshot. |
| `person_default_asset_key` | integer | On3 asset key of the person's headshot asset. |
| `person_default_asset_domain_override` | character | CDN domain override for the person's headshot asset (usually null). |
| `person_default_asset_domain` | character | CDN domain serving the person's headshot asset. |
| `person_default_asset_source_override` | character | Source-path override for the person's headshot asset (usually null). |
| `person_default_asset_source` | character | CDN-relative source path of the person's headshot asset. |
| `person_default_asset_title` | character | Editorial title attached to the person's headshot asset. |
| `person_default_asset_description` | character | Editorial description attached to the person's headshot asset (usually null). |
| `person_default_asset_caption` | character | Editorial caption attached to the person's headshot asset (usually null). |
| `person_default_asset_category` | character | Editorial category label of the person's headshot asset (usually null). |
| `person_default_asset_alt_text` | character | Accessibility alt text of the person's headshot asset (usually null). |
| `person_default_asset_height` | integer | Pixel height of the person's headshot asset. |
| `person_default_asset_width` | integer | Pixel width of the person's headshot asset. |
| `person_default_asset_asset_type` | character | On3 asset-type discriminator of the person's headshot asset (e.g. Image). |
| `person_default_asset_file_system` | character | Storage file-system flag of the person's headshot asset. |
| `person_default_asset_path` | character | Storage path of the person's headshot asset. |
| `person_default_asset_type` | character | Media type field of the person's headshot asset (file extension, e.g. png). |
| `person_default_asset_thumbnail` | character | Thumbnail variant of the person's headshot asset (video assets; usually null). |
| `person_default_asset_duration` | integer | Duration of the person's headshot asset when it is a video (usually null or 0). |
| `person_default_asset_mime_type` | character | MIME type of the person's headshot asset. |
| `person_early_signee` | logical | Whether the person signed during the early signing period. |
| `person_early_enrollee` | logical | Whether the person early-enrolled at college. |
| `person_position_abbreviation` | character | Position abbreviation on the person's record. |
| `person_height` | numeric | Height of the person: a formatted string (e.g. '6-8') or inches, depending on the endpoint. |
| `person_formatted_height` | character | Human-formatted height of the person (e.g. '6-3.5'). |
| `person_weight` | integer | Weight of the person in pounds. |
| `person_class_year` | integer | High-school graduating class year of the person. |
| `person_athlete_verified` | logical | Whether the person's athlete profile is verified by On3. |
| `person_prospect_verified` | logical | Whether the person's prospect measurables are verified by On3. |
| `person_class_rank` | character | Academic class standing of the person (e.g. Senior, RedShirt Senior). |
| `person_recruitment_key` | integer | On3 key of the person's active recruitment record. |
| `person_age` | integer | Age of the person in years, when known. |

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
| `category` | character | Category label On3 attaches to the row. |
| `person_key` | integer | On3 person key of the person quoted or quoted about. |
| `date_added` | character | Date the quote was added to the On3 database. |
| `date_updated` | character | Date the quote was last updated. |
| `person_key_2` | integer | Person key repeated from the nested person object (json_normalize de-duplication suffix). |
| `person_known_as_name` | character | Preferred name of the person, when it differs from the given name. |
| `person_first_name` | character | First name of the person. |
| `person_last_name` | character | Last name of the person. |
| `person_twitter_handle` | character | Twitter/X handle of the person, when listed. |
| `person_instagram_profile` | character | Instagram profile of the person, when listed. |
| `person_tik_tok_handle` | character | TikTok handle of the person, when listed. |
| `person_espn_profile` | character | ESPN profile link of the person, when listed. |
| `person_class_year` | integer | High-school graduating class year of the person. |
| `person_two_four_seven_profile` | character | 247Sports profile link of the person, when listed. |
| `person_rivals_profile` | character | Rivals profile link of the person, when listed. |

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
| `high_school` | character | High-school display name on the record. |
| `home_town` | character | Home town as On3 lists it (e.g. 'Pewaukee, WI'). |
| `rating_key` | integer | On3 key of the On3 rating record. |
| `rating_rating` | numeric | Numeric value of the On3 rating (0-100 scale). |
| `rating_stars` | integer | Star rating of the On3 rating (2-5). |
| `rating_national_rank` | integer | National rank of the On3 rating. |
| `rating_position_rank` | integer | Position rank of the On3 rating. |
| `rating_state_rank` | integer | State rank of the On3 rating. |
| `rating_position_abbr` | character | Position abbreviation the On3 rating was assigned at. |
| `rating_state_abbr` | character | State abbreviation the On3 rating was assigned in. |
| `rating_five_star_plus` | logical | Five-star-plus flag on the On3 rating. |
| `committed_status_type` | character | Type of the commitment status (e.g. Committed, Signed, Enrolled, None). |
| `committed_status_short_term_signee` | logical | Short-term-signee flag of the commitment status (null when not applicable). |
| `committed_status_date` | character | Date the commitment status took effect (ISO timestamp string). |
| `committed_status_committed_asset_key` | integer | On3 numeric key of the committed-to program. |
| `committed_status_committed_asset_url` | character | CDN URL of the committed-to program's logo. |
| `committed_status_committed_asset_slug` | character | URL slug of the committed-to program on On3. |
| `committed_status_committed_asset_full_name` | character | Full name of the committed-to program (e.g. 'Alabama Crimson Tide'). |
| `committed_status_committed_asset_res_key` | integer | On3 asset key of the committed-to program's logo asset. |
| `committed_status_committed_asset_res_domain_override` | character | CDN domain override for the committed-to program's logo asset (usually null). |
| `committed_status_committed_asset_res_domain` | character | CDN domain serving the committed-to program's logo asset. |
| `committed_status_committed_asset_res_source_override` | character | Source-path override for the committed-to program's logo asset (usually null). |
| `committed_status_committed_asset_res_source` | character | CDN-relative source path of the committed-to program's logo asset. |
| `committed_status_committed_asset_res_title` | character | Editorial title attached to the committed-to program's logo asset. |
| `committed_status_committed_asset_res_description` | character | Editorial description attached to the committed-to program's logo asset (usually null). |
| `committed_status_committed_asset_res_caption` | character | Editorial caption attached to the committed-to program's logo asset (usually null). |
| `committed_status_committed_asset_res_category` | character | Editorial category label of the committed-to program's logo asset (usually null). |
| `committed_status_committed_asset_res_alt_text` | character | Accessibility alt text of the committed-to program's logo asset (usually null). |
| `committed_status_committed_asset_res_height` | integer | Pixel height of the committed-to program's logo asset. |
| `committed_status_committed_asset_res_width` | integer | Pixel width of the committed-to program's logo asset. |
| `committed_status_committed_asset_res_asset_type` | character | On3 asset-type discriminator of the committed-to program's logo asset (e.g. Image). |
| `committed_status_committed_asset_res_file_system` | character | Storage file-system flag of the committed-to program's logo asset. |
| `committed_status_committed_asset_res_path` | character | Storage path of the committed-to program's logo asset. |
| `committed_status_committed_asset_res_type` | character | Media type field of the committed-to program's logo asset (file extension, e.g. png). |
| `committed_status_committed_asset_res_thumbnail` | character | Thumbnail variant of the committed-to program's logo asset (video assets; usually null). |
| `committed_status_committed_asset_res_duration` | integer | Duration of the committed-to program's logo asset when it is a video (usually null or 0). |
| `committed_status_committed_asset_res_mime_type` | character | MIME type of the committed-to program's logo asset. |
| `committed_status_transferred_asset` | character | Nested asset of the program transferred to (the commitment status; usually null). |
| `committed_status_transferred_asset_res` | character | Nested logo asset of the program transferred to (the commitment status; usually null). |
| `committed_status_committed_organization_key` | integer | On3 key of the committed-to program (the commitment status). |
| `committed_status_committed_organization_full_name` | character | Full name of the commitment status's committed-to program (e.g. 'Alabama Crimson Tide'). |
| `committed_status_committed_organization_name` | character | Short name of the commitment status's committed-to program. |
| `committed_status_committed_organization_mascot` | character | Mascot of the commitment status's committed-to program. |
| `committed_status_committed_organization_abbreviation` | character | Abbreviation of the commitment status's committed-to program. |
| `committed_status_committed_organization_asset_url` | character | CDN URL of the committed-to program's logo (the commitment status). |
| `committed_status_committed_organization_asset` | character | Nested logo asset of the committed-to program (the commitment status; stringified or null). |
| `committed_status_committed_organization_slug` | character | URL slug of the committed-to program (the commitment status). |
| `committed_status_committed_organization_primary_color` | character | Primary hex color of the commitment status's committed-to program. |
| `committed_status_class_rank` | character | Academic class standing recorded on the commitment status (e.g. Senior). |
| `committed_status_transfer_entered` | character | Date the player entered the transfer portal (the commitment status; null when never entered). |
| `committed_status_recruitment_year` | character | Recruiting-cycle year the commitment status belongs to. |
| `committed_status_decommitted_asset` | character | Nested asset of the program decommitted from (the commitment status; usually null). |
| `committed_status_transfer` | logical | Transfer flag of the commitment status (null when not applicable). |
| `committed_status_expected_to_transfer` | logical | Expected-to-transfer flag of the commitment status (null when not applicable). |
| `committed_status_recruitment_key` | integer | On3 key of the recruitment record the commitment status belongs to. |
| `committed_status_withdrawn_transfer` | logical | Whether the player withdrew from the transfer portal (the commitment status). |
| `committed_status_withdrawn_transfer_date` | character | Date the player withdrew from the transfer portal (the commitment status; null when never withdrawn). |
| `high_school_org_key` | integer | On3 numeric key of the high school. |
| `high_school_org_full_name` | character | Full name of the high school (e.g. 'Alabama Crimson Tide'). |
| `high_school_org_name` | character | Short name of the high school. |
| `high_school_org_known_as` | character | Common short name of the high school, when On3 lists one. |
| `high_school_org_mascot` | character | Mascot of the high school. |
| `high_school_org_abbreviation` | character | Abbreviation of the high school. |
| `high_school_org_asset_url` | character | Convenience CDN URL of the high school's logo. |
| `high_school_org_default_asset_key` | integer | On3 asset key of the high school's logo asset. |
| `high_school_org_default_asset_domain_override` | character | CDN domain override for the high school's logo asset (usually null). |
| `high_school_org_default_asset_domain` | character | CDN domain serving the high school's logo asset. |
| `high_school_org_default_asset_source_override` | character | Source-path override for the high school's logo asset (usually null). |
| `high_school_org_default_asset_source` | character | CDN-relative source path of the high school's logo asset. |
| `high_school_org_default_asset_title` | character | Editorial title attached to the high school's logo asset. |
| `high_school_org_default_asset_description` | character | Editorial description attached to the high school's logo asset (usually null). |
| `high_school_org_default_asset_caption` | character | Editorial caption attached to the high school's logo asset (usually null). |
| `high_school_org_default_asset_category` | character | Editorial category label of the high school's logo asset (usually null). |
| `high_school_org_default_asset_alt_text` | character | Accessibility alt text of the high school's logo asset (usually null). |
| `high_school_org_default_asset_height` | integer | Pixel height of the high school's logo asset. |
| `high_school_org_default_asset_width` | integer | Pixel width of the high school's logo asset. |
| `high_school_org_default_asset_asset_type` | character | On3 asset-type discriminator of the high school's logo asset (e.g. Image). |
| `high_school_org_default_asset_file_system` | character | Storage file-system flag of the high school's logo asset. |
| `high_school_org_default_asset_path` | character | Storage path of the high school's logo asset. |
| `high_school_org_default_asset_type` | character | Media type field of the high school's logo asset (file extension, e.g. png). |
| `high_school_org_default_asset_thumbnail` | character | Thumbnail variant of the high school's logo asset (video assets; usually null). |
| `high_school_org_default_asset_duration` | integer | Duration of the high school's logo asset when it is a video (usually null or 0). |
| `high_school_org_default_asset_mime_type` | character | MIME type of the high school's logo asset. |
| `high_school_org_slug` | character | URL slug of the high school on On3. |
| `high_school_org_primary_color` | character | Primary hex color of the high school. |
| `high_school_org_org_type` | character | Organization type label of the high school (e.g. HighSchool, College). |
| `high_school_org_org_type_enum` | character | Organization type enum of the high school (same vocabulary as org_type). |
| `high_school_org_division` | character | Division or classification of the high school (e.g. NCAA-FB). |
| `high_school_org_site_keys` | character | JSON-encoded On3 site keys covering the high school (usually null). |
| `high_school_org_url_slug` | character | URL slug variant of the high school's page, with the key appended. |

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
| `year` | integer | Recruiting class year of the row. |
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
| `organization_key` | integer | On3 numeric key of the program. |
| `organization_full_name` | character | Full name of the program (e.g. 'Alabama Crimson Tide'). |
| `organization_name` | character | Short name of the program. |
| `organization_mascot` | character | Mascot of the program. |
| `organization_abbreviation` | character | Abbreviation of the program. |
| `organization_asset_url` | character | Convenience CDN URL of the program's logo. |
| `organization_asset_key` | integer | On3 asset key of the program's logo asset. |
| `organization_asset_domain_override` | character | CDN domain override for the program's logo asset (usually null). |
| `organization_asset_domain` | character | CDN domain serving the program's logo asset. |
| `organization_asset_source_override` | character | Source-path override for the program's logo asset (usually null). |
| `organization_asset_source` | character | CDN-relative source path of the program's logo asset. |
| `organization_asset_title` | character | Editorial title attached to the program's logo asset. |
| `organization_asset_description` | character | Editorial description attached to the program's logo asset (usually null). |
| `organization_asset_caption` | character | Editorial caption attached to the program's logo asset (usually null). |
| `organization_asset_category` | character | Editorial category label of the program's logo asset (usually null). |
| `organization_asset_alt_text` | character | Accessibility alt text of the program's logo asset (usually null). |
| `organization_asset_height` | integer | Pixel height of the program's logo asset. |
| `organization_asset_width` | integer | Pixel width of the program's logo asset. |
| `organization_asset_asset_type` | character | On3 asset-type discriminator of the program's logo asset (e.g. Image). |
| `organization_asset_file_system` | character | Storage file-system flag of the program's logo asset. |
| `organization_asset_path` | character | Storage path of the program's logo asset. |
| `organization_asset_type` | character | Media type field of the program's logo asset (file extension, e.g. png). |
| `organization_asset_thumbnail` | character | Thumbnail variant of the program's logo asset (video assets; usually null). |
| `organization_asset_duration` | integer | Duration of the program's logo asset when it is a video (usually null or 0). |
| `organization_asset_mime_type` | character | MIME type of the program's logo asset. |
| `organization_slug` | character | URL slug of the program on On3. |
| `organization_primary_color` | character | Primary hex color of the program. |

**Row type:** `On3TeamRankingTeamRankingsRow` (exported from the package root).

### Returns — `on3_videos_video_key` / `on3VideosVideoKey`

No returns table is published for this endpoint: no committed capture with rows, and the row has nested objects whose flattened column names depend on which are null in the data; names derived from the OpenAPI response type matched parse_on3_rdb's output on only 7 of the 9 checkable endpoints, so none are published

_Rows are untyped `Row[]` (not parity-verified yet)._

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/on3.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._

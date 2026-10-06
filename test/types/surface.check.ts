// Type tests for the typed public surface (Task 18a), compiled against the BUILT
// declarations (dist/index.d.ts) by test/types/namespaces.test.js, the way a
// consumer's `tsc` sees them. Each `Expect<Equal<A, B>>` fails to compile when the
// types differ; each `@ts-expect-error` fails when the line stops being an error.
import sdv from "../../dist/index.js";
import type {
  AsaPlayersGoalsAddedRow,
  EspnTeamRosterParams,
  MlbAwardsRow,
  NbaStatsBoxscoredefensivev2Tables,
  NbaStatsBoxscoredefensivev2TeamStatsRow,
  NbaStatsLeaguedashplayerstatsRow,
  NhlRecordsAllTimeRecordVsFranchiseRow,
  ParsedTables,
  Row,
} from "../../dist/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
type Result<F extends (...args: never[]) => unknown> = Awaited<ReturnType<F>>;

declare const p: <T>(x: Promise<T>) => T;

// A verified endpoint: `parsed: true` -> its generated rows; raw -> unknown.
const records = p(sdv.nhl.nhlRecordsAllTimeRecordVsFranchise({ parsed: true }));
const recordsRaw = p(sdv.nhl.nhlRecordsAllTimeRecordVsFranchise());
const recordsSnake = p(sdv.nhl.nhl_records_all_time_record_vs_franchise({ parsed: true }));
type _records = [
  Expect<Equal<typeof records, NhlRecordsAllTimeRecordVsFranchiseRow[]>>,
  Expect<Equal<typeof recordsRaw, unknown>>,
  Expect<Equal<typeof recordsSnake, NhlRecordsAllTimeRecordVsFranchiseRow[]>>,
  // an id column is a decimal string; a count a number; every column optional + nullable
  Expect<Equal<NhlRecordsAllTimeRecordVsFranchiseRow["id"], string | null | undefined>>,
  Expect<Equal<NhlRecordsAllTimeRecordVsFranchiseRow["home_losses"], number | null | undefined>>,
  // a DOUBLE id (pandas' Float64 of an id with nulls): a string, or the number a value past 2^53 stays
  Expect<Equal<MlbAwardsRow["sport_id"], string | number | null | undefined>>,
  // a column null in every capture: unknown
  Expect<Equal<NbaStatsBoxscoredefensivev2TeamStatsRow["minutes"], unknown>>,
];
// @ts-expect-error a column the schema does not have
records[0].no_such_column;

// stats.nba.com, several result sets: the tables, or a one-set payload's table; `section` picks one.
const box = p(sdv.nba.nbaStatsBoxscoredefensivev2({ parsed: true, game_id: "0022300001" }));
const boxTeam = p(sdv.nba.nbaStatsBoxscoredefensivev2({ parsed: true, section: "TeamStats" }));
const boxOther = p(sdv.nba.nbaStatsBoxscoredefensivev2({ parsed: true, section: "Nope" }));
type _box = [
  Expect<Equal<typeof box, NbaStatsBoxscoredefensivev2Tables | Row[]>>,
  Expect<Equal<typeof boxTeam, NbaStatsBoxscoredefensivev2TeamStatsRow[]>>,
  Expect<Equal<typeof boxOther, Row[]>>,
];
// one result set in the capture: that table, or every table of a multi-set payload
const dash = p(sdv.nba.nbaStatsLeaguedashplayerstats({ parsed: true }));
type _dash = Expect<Equal<typeof dash, NbaStatsLeaguedashplayerstatsRow[] | ParsedTables>>;

// A fixed-default multi-table parser: the default table is typed by name.
const ga = p(sdv.asa.asaPlayersGoalsAdded({ league_slug: "mls", parsed: true }));
const gaSummary = p(sdv.asa.asaPlayersGoalsAdded({ league_slug: "mls", parsed: true, section: "summary" }));
const gaActions = p(sdv.asa.asaPlayersGoalsAdded({ leagueSlug: "mls", parsed: true, section: "actions" }));
type _ga = [
  Expect<Equal<typeof ga, AsaPlayersGoalsAddedRow[]>>,
  Expect<Equal<typeof gaSummary, AsaPlayersGoalsAddedRow[]>>,
  Expect<Equal<typeof gaActions, Row[]>>,
];

// Unverified (ESPN): Row; the summary dispatcher: every sub-frame, or one with `section`.
const sb = p(sdv.nba.espnNbaScoreboard({ parsed: true }));
const sum = p(sdv.nba.espnNbaSummary({ parsed: true, event_id: 401584793 }));
const sumBox = p(sdv.nba.espnNbaSummary({ parsed: true, section: "boxscore_player" }));
type _espn = [Expect<Equal<typeof sb, Row[]>>, Expect<Equal<typeof sum, ParsedTables>>, Expect<Equal<typeof sumBox, Row[]>>];

// `parsed: boolean` (not literally true) may be either: unknown.
declare const flag: boolean;
const either = p(sdv.nba.espnNbaScoreboard({ parsed: flag }));
type _either = Expect<Equal<typeof either, unknown>>;

// A deprecated pre-v4 alias has its v4 wrapper's type (and `@deprecated` JSDoc).
type _alias = [
  Expect<Equal<typeof sdv.nba.espn_nba_athlete_bio, typeof sdv.nba.espn_nba_player_bio>>,
  Expect<Equal<typeof sdv.nba.espnNbaAthleteBio, typeof sdv.nba.espnNbaPlayerBio>>,
];

// Loaders, legacy services and hand-written members are on their namespaces, typed.
const pbp = p(sdv.nfl.loadNflPbp({ seasons: 2024, format: "columns" }));
type _loader = Expect<Equal<typeof pbp, Record<string, unknown[]>>>;
sdv.nba.getPlayByPlay;
sdv.hockeytech.pwhlGameShifts;
sdv.hockeytech.pwhl_game_corsi;
sdv.hockeytech.hockeytech_shift_stints;
sdv.cricket.cricketWinProbability;
sdv.odds.probFromAmerican;
sdv.odds.errors.ValueError;
sdv.mlb.mlbStatcastSearch;
sdv.nba.helperNbaPbp;
sdv.wbb.espnWbbPbp;
// @ts-expect-error a member no namespace has
sdv.nba.no_such_wrapper;
// @ts-expect-error a namespace that does not exist
sdv.no_such_namespace;

// Params (T18b-2): every wrapper takes its endpoint's own params type. A required path
// param must be passed (by its snake_case name or camelCase alias), an unknown param is
// an error, `int` / `str` params take a number or a string (ids come back as strings),
// `bool` ones a boolean, and an optional one `null` for unset.
sdv.nba.espnNbaTeamRoster({ team_id: 13 });
sdv.nba.espnNbaTeamRoster({ teamId: "13", limit: null });
// @ts-expect-error the required path param is missing
sdv.nba.espnNbaTeamRoster({ limit: 5 });
// @ts-expect-error a wrapper with a required param needs its params
sdv.nba.espnNbaTeamRoster();
sdv.nba.espnNbaScoreboard();
sdv.nba.espnNbaScoreboard({ dates: 20240115, seasonType: 2 });
// @ts-expect-error a param the endpoint does not have
sdv.nba.espnNbaScoreboard({ datez: "20240115" });
// @ts-expect-error a `bool` param is a boolean
sdv.mlb.mlbAnalyticsGames({ is_non_statcast: "yes" });
sdv.mlb.mlbLeagues({ sport_id: 1, league_ids: [103, "104"] });
// Family controls ride on the params: PFF's api_key / strict, NFL Pro's token; headers everywhere.
sdv.nfl.pffApiPlayerDefenseSummary({ league: "nfl", player_id: 1, api_key: "ak_live_x", strict: true });
// @ts-expect-error PFF player summaries need the player
sdv.nfl.pffApiPlayerDefenseSummary({ league: "nfl", api_key: "ak_live_x" });
sdv.nfl.nflProDefenseNearestSeason({ token: "t", max_pages: 2, headers: { Authorization: "Bearer t" } });
// A soccer / cricket league takes an ESPN `league` slug override; a fixed league does not.
sdv.soccer.espnSoccerScoreboard({ league: "esp.1" });
// @ts-expect-error epl's league is fixed
sdv.epl.espnEplScoreboard({ league: "esp.1" });
// `parsed` with params still picks the parsed overload; the params type is exported by name.
const roster = p(sdv.nba.espnNbaTeamRoster({ team_id: 13, parsed: true }));
type _params = [
  Expect<Equal<typeof roster, Row[]>>,
  // (the last overload, the raw call)
  Expect<Equal<Parameters<typeof sdv.nba.espnNbaTeamRoster>[0], EspnTeamRosterParams & { parsed?: boolean }>>,
];

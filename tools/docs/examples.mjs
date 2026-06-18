// ---------------------------------------------------------------------------
// examples.mjs — the manifest the build-time output injector reads.
//
// Each entry pairs a committed fixture + a parse target with the guide page +
// marker id where its frozen table should land. inject-outputs.mjs runs every
// entry through the SAME parser bundle the playground uses and writes the first
// few rows × cols as a markdown table between the page's
//   <!-- inject:example:<id> -->  ...  <!-- /inject -->
// markers. It is deterministic (fixtures are committed, no network) so CI can
// reproduce the exact tables and fail on drift (`--check`).
//
// Supported `family` kinds:
//   - "espn"          ESPN array-frame parser: parseEndpoint('espn', key, raw)
//                     → an array of row objects (scoreboard, standings, roster…).
//   - "flat"          a flat (non-ESPN) parser: parseEndpoint('flat', parserName,
//                     raw) → an array of row objects (MLB Stats, NHL ×4, NFL.com,
//                     Statcast, odds, CBS/Fox/Yahoo, 247).
//   - "espn-summary"  the ESPN summary dispatcher: parse the whole payload to its
//                     dict-of-frames, then render ONE chosen `section` sub-frame.
//
// Fixture lookup:
//   - `fixtureDir: "espn"`   → test/fixtures/espn/<fixture>     (committed captures)
//   - `fixtureDir: "tools"`  → tools/docs/fixtures/<fixture>    (tiny inline samples
//                              for flat families without a committed capture)
//
// `target` is the guide file relative to docs/docs/guides/. Add a new example by
// dropping a fixture, then adding an entry here + the marker pair in the guide.
// ---------------------------------------------------------------------------

export const EXAMPLES = [
  // --- ESPN array frames (quickstart) -------------------------------------
  {
    id: 'scoreboard',
    family: 'espn',
    fixtureDir: 'espn',
    fixture: 'scoreboard_nba.json',
    key: 'scoreboard',
    target: '01-quickstart.mdx',
    caption: '`sdv.nba.espnNbaScoreboard({ parsed: true })` — one row per game.',
  },
  {
    id: 'standings',
    family: 'espn',
    fixtureDir: 'espn',
    fixture: 'standings_nba.json',
    key: 'standings',
    target: '01-quickstart.mdx',
    caption: '`sdv.nba.espnNbaStandings({ parsed: true })` — one row per team.',
  },
  {
    id: 'team_roster',
    family: 'espn',
    fixtureDir: 'espn',
    fixture: 'team_roster_nba.json',
    key: 'team_roster',
    target: '01-quickstart.mdx',
    caption:
      '`sdv.nba.espnNbaTeamRoster({ team_id: 13, parsed: true })` — one row per player.',
  },

  // --- ESPN summary dict-of-frames (one sub-frame) ------------------------
  {
    id: 'summary_leaders',
    family: 'espn-summary',
    fixtureDir: 'espn',
    fixture: 'summary_nba.json',
    section: 'leaders',
    target: 'nba.mdx',
    caption:
      "`sdv.nba.espnNbaSummary({ event_id, parsed: true, section: 'leaders' })` — " +
      'the `leaders` sub-frame of the 21-section summary dispatcher.',
  },

  // --- Flat-API parser frame ----------------------------------------------
  {
    id: 'nfl_standings',
    family: 'flat',
    fixtureDir: 'tools',
    fixture: 'nfl_api_standings.json',
    parser: 'parse_nfl_standings',
    target: 'nfl.mdx',
    caption:
      '`sdv.nfl.nflApiStandings({ season: 2024, parsed: true })` — the native ' +
      'NFL.com Shield standings, one row per team (sample fixture).',
  },
];

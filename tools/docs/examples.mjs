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
      '`sdv.nfl.nflStandings({ season: 2024, parsed: true })` — the native ' +
      'NFL.com Shield standings, one row per team (sample fixture).',
  },

  // --- Runnable example scripts (examples/NN_*.mjs → docs/docs/tutorials/) ---
  // family "script": the injector runs the script OFFLINE (examples/_offline.mjs
  // serves the committed fixtures), freezes its stdout between
  //   <!-- inject:example:ID -->  and its source between  <!-- inject:source:ID -->
  // in the tutorial page (`dir: 'tutorials'`). `artifacts` are files the script
  // writes to examples/out/, copied to docs/static/examples/ (drift-gated too).
  // Scripts run with `--import ./_resolve.mjs` (resolves the package from this
  // worktree's dist/; no install in examples/). The 9x sdvplot scripts skip
  // themselves without a sibling sdvplot-js build; their committed output stays.
  ...[
    ['ex01', '01_nba_scoreboard_to_table.mjs', 'scoreboard-to-table.md'],
    ['ex02', '02_nba_pbp_shots.mjs', 'nba-pbp-shots.mdx'],
    ['ex03', '03_wnba_standings.mjs', 'wnba-standings.mdx'],
    ['ex04', '04_nfl_schedule_and_standings.mjs', 'nfl-schedule-standings.mdx'],
    ['ex05', '05_cfb_rankings_and_pbp.mjs', 'cfb-rankings-pbp.mdx'],
    ['ex06', '06_college_basketball_torvik_and_espn.mjs', 'college-basketball-torvik.mdx'],
    ['ex07', '07_mlb_statcast_and_stats_api.mjs', 'mlb-statcast-stats-api.mdx'],
    ['ex08', '08_nhl_api_web_and_edge.mjs', 'nhl-api-web-edge.mdx'],
    ['ex09', '09_hockeytech_pwhl_corsi.mjs', 'pwhl-hockeytech-corsi.mdx'],
    ['ex10', '10_soccer_cross_league.mjs', 'soccer-cross-league.mdx'],
    ['ex11', '11_providers_odds_math.mjs', 'odds-api-math.mdx'],
    ['ex12', '12_release_loaders.mjs', 'release-loaders.mdx'],
    ['ex13', '13_discover_and_utilities.mjs', 'cross-league.md'],
    ['ex90', '90_sdvplot_shot_chart.mjs', 'sdvplot-shot-chart.mdx', ['shot_chart.svg']],
    ['ex91', '91_sdvplot_standings_colors.mjs', 'sdvplot-standings-colors.mdx', ['standings.svg']],
    ['ex92', '92_sdvplot_roster_table.mjs', 'sdvplot-roster-table.mdx', ['roster.html']],
    // The automation scripts' PNGs come from LIVE runs (logos downloaded, fonts vary by OS),
    // so they are committed by hand and not listed as artifacts; only source + offline stdout are frozen.
    ['ex93', '93_scores_card_action.mjs', 'sdvplot-scores-card.mdx'],
    ['ex95', '95_rankings_ladder_action.mjs', 'sdvplot-rankings-ladder.mdx'],
  ].map(([id, script, target, artifacts]) => ({
    id,
    family: 'script',
    script,
    dir: 'tutorials',
    target,
    caption: `Output of \`node examples/${script}\` (offline, against the committed fixtures):`,
    ...(artifacts ? { artifacts } : {}),
  })),
];

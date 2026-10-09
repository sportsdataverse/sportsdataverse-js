import should from 'should';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv, { configure, resetConfig, WRAPPERS } from '../dist/index.js';
import { isIdColumn } from '../dist/core/int64.js';

// Every real ESPN capture under test/fixtures/espn/ is fed, through a stubbed
// transport, to the generated wrapper that would have fetched it, with
// `{ parsed: true }`. The test asserts (a) the wrapper hit the documented host +
// path on the documented family, (b) the parse is a non-empty array of rows,
// (c) every key is snake_case, (d) every id column (`isIdColumn`) holds decimal
// strings, never numbers. Fixture -> request URL map: test/fixtures/espn/README.md,
// basketball_box/README.md, basketball_pbp/README.md (and, for the top-level NBA
// captures those omit, sdv-py's tests/fixtures/espn/README.md they were copied from).
//
// NOT endpoint payloads, so not in the table: `py_oracle_fpi.json` (sdv-py parse_fpi
// output), `basketball_box/oracle.json.gz` and `basketball_pbp/oracle.json.gz`
// (sdv-py producer oracles), `basketball_pbp/pickcenter.json` (spliced pickcenter
// arrays, "not a capture" per its README).

const here = dirname(fileURLToPath(import.meta.url));
const load = (file) => {
  const buf = readFileSync(join(here, 'fixtures', 'espn', file));
  return JSON.parse((file.endsWith('.gz') ? gunzipSync(buf) : buf).toString('utf8'));
};

const SITE = 'https://site.api.espn.com/apis/site/v2/sports';
const SITE_ALT = 'https://site.api.espn.com/apis/v2/sports';
const CORE = 'https://sports.core.api.espn.com/v2/sports';
const WEB = 'https://site.web.api.espn.com/apis/common/v3/sports';
const FITT = 'https://site.web.api.espn.com/apis/fitt/v3/sports';
const CDN = 'https://cdn.espn.com/core';

/** One row per capture: { file, league, short, args, family, url, query } — url/query from the README. */
const summary = (file, league, event, note) => ({
  file, league, short: 'summary', args: { event_id: event }, family: 'site_v2',
  url: `${SITE}/basketball/${SLUG[league]}/summary`, query: { event: String(event) }, note,
});
const SLUG = { nba: 'nba', wnba: 'wnba', mbb: 'mens-college-basketball', wbb: 'womens-college-basketball' };

const CASES = [
  // --- top-level captures (espn/README.md + sdv-py tests/fixtures/espn/README.md) ---
  // sdv-py README: Core v2 `athletes/1966/statisticslog` (LeBron, 23 entries)
  { file: 'athlete_statslog_lbj.json', league: 'nba', short: 'athlete_statisticslog', args: { athlete_id: 1966 }, family: 'core_v2',
    url: `${CORE}/basketball/leagues/nba/athletes/1966/statisticslog`, query: {} },
  // sdv-py README: Core v2 `events?limit=3` (1 $ref item, off-season)
  { file: 'events_core_nba.json', league: 'nba', short: 'events', args: { limit: 3 }, family: 'core_v2',
    url: `${CORE}/basketball/leagues/nba/events`, query: { limit: '3' } },
  // espn/README.md: fitt v3 `football/college-football/powerindex?season=2024&limit=3`
  { file: 'fpi_cfb_2024.json', league: 'cfb', short: 'fpi', args: { season: 2024, limit: 3 }, family: 'fitt_v3',
    url: `${FITT}/football/college-football/powerindex`, query: { season: '2024', limit: '3' } },
  // sdv-py README: Site v2 `injuries` (26 teams reporting)
  { file: 'injuries_nba.json', league: 'nba', short: 'injuries', args: {}, family: 'site_v2',
    url: `${SITE}/basketball/nba/injuries`, query: {} },
  // payload `pagination.first` = site.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?season=2024&limit=50 (web_v3 `leaders`)
  { file: 'leaders_nba.json', league: 'nba', short: 'leaders', args: { season: 2024, limit: 50 }, family: 'web_v3',
    url: `${WEB}/basketball/nba/statistics/byathlete`, query: { season: '2024', limit: '50' } },
  // sdv-py README: Site v2 `news?limit=5` (5 articles)
  { file: 'news_nba.json', league: 'nba', short: 'news', args: { limit: 5 }, family: 'site_v2',
    url: `${SITE}/basketball/nba/news`, query: { limit: '5' } },
  // legacy_services.test.js answers `scoreboard` with it: Site v2 `basketball/nba/scoreboard` (10 events)
  { file: 'scoreboard_nba.json', league: 'nba', short: 'scoreboard', args: {}, family: 'site_v2',
    url: `${SITE}/basketball/nba/scoreboard`, query: {} },
  // legacy_services.test.js answers `standings` with it: Site v2 alt `apis/v2/sports/basketball/nba/standings`
  { file: 'standings_nba.json', league: 'nba', short: 'standings', args: {}, family: 'site_v2_alt',
    url: `${SITE_ALT}/basketball/nba/standings`, query: {} },
  // sdv-py README: Site v2 `summary?event=401585607` (2024-03-17 TOR@ORL)
  summary('summary_nba.json', 'nba', 401585607),
  // sdv-py README: Site v2 `teams/10/roster` (MLB = NYY id 10)
  { file: 'team_roster_mlb.json', league: 'mlb', short: 'team_roster', args: { team_id: 10 }, family: 'site_v2',
    url: `${SITE}/baseball/mlb/teams/10/roster`, query: {} },
  // sdv-py README: Site v2 `teams/13/roster` (LAL, 17 athletes + 1 coach)
  { file: 'team_roster_nba.json', league: 'nba', short: 'team_roster', args: { team_id: 13 }, family: 'site_v2',
    url: `${SITE}/basketball/nba/teams/13/roster`, query: {} },
  // espn/README.md: Site v2 `basketball/nba/teams?limit=1000` (all 30 teams)
  { file: 'teams_site_nba.json', league: 'nba', short: 'teams_site', args: { limit: 1000 }, family: 'site_v2',
    url: `${SITE}/basketball/nba/teams`, query: { limit: '1000' } },

  // --- basketball_box/README.md: every capture is a Site v2 summary ---
  summary('basketball_box/summary_wnba.json.gz', 'wnba', 401726992),
  summary('basketball_box/summary_mbb.json.gz', 'mbb', 401638645),
  summary('basketball_box/summary_wbb.json.gz', 'wbb', 401637613),
  summary('basketball_box/wbb_final_320940239_archival_flag_false.json.gz', 'wbb', 320940239, 'trimmed real payload (sdv-py tests/fixtures/wbb)'),
  summary('basketball_box/mbb_final_303173134.json.gz', 'mbb', 303173134, 'hoopR-mbb-raw final/'),
  summary('basketball_box/mbb_final_401721722.json.gz', 'mbb', 401721722, 'hoopR-mbb-raw final/'),
  summary('basketball_box/mbb_final_320710153.json.gz', 'mbb', 320710153, 'hoopR-mbb-raw final/'),
  summary('basketball_box/wnba_final_230628004.json.gz', 'wnba', 230628004, 'wehoop-wnba-raw final/'),
  summary('basketball_box/wnba_final_230614002.json.gz', 'wnba', 230614002, 'wehoop-wnba-raw final/'),
  summary('basketball_box/nba_final_220210031.json.gz', 'nba', 220210031, 'hoopR-nba-raw final/'),
  summary('basketball_box/nba_final_230209031.json.gz', 'nba', 230209031, 'hoopR-nba-raw final/'),
  summary('basketball_box/wbb_final_223142348.json.gz', 'wbb', 223142348, 'wehoop-wbb-raw final/'),
  summary('basketball_box/nba_summary_scheduled_401909093.json.gz', 'nba', 401909093, 'scheduled game via sdv.nba.espn_nba_summary'),

  // --- basketball_pbp/README.md: Site v2 `basketball/<league>/summary?event=<id>` ---
  summary('basketball_pbp/nba_summary_401360428.json.gz', 'nba', 401360428),
  summary('basketball_pbp/wnba_summary_230614002.json.gz', 'wnba', 230614002),
  summary('basketball_pbp/mbb_summary_401600379.json.gz', 'mbb', 401600379),
  summary('basketball_pbp/wbb_summary_400787556.json.gz', 'wbb', 400787556),
  summary('basketball_pbp/wbb_summary_401587390.json.gz', 'wbb', 401587390),
  summary('basketball_pbp/nba_summary_401430219.json.gz', 'nba', 401430219),
  summary('basketball_pbp/nba_summary_260312029.json.gz', 'nba', 260312029),
  summary('basketball_pbp/wnba_summary_400927398.json.gz', 'wnba', 400927398),

  // --- cdn/ (espn/README.md table): cdn.espn.com/core/{league}/{page}?xhr=1 ---
  { file: 'cdn/playbyplay_nba.json.gz', league: 'nba', short: 'cdn_playbyplay', args: { game_id: 401705127 }, family: 'cdn',
    url: `${CDN}/nba/playbyplay`, query: { xhr: '1', gameId: '401705127' } },
  { file: 'cdn/playbyplay_cfb.json.gz', league: 'cfb', short: 'cdn_playbyplay', args: { game_id: 401628551 }, family: 'cdn',
    url: `${CDN}/college-football/playbyplay`, query: { xhr: '1', gameId: '401628551' } },
  { file: 'cdn/boxscore_mlb.json.gz', league: 'mlb', short: 'cdn_boxscore', args: { game_id: 401696358 }, family: 'cdn',
    url: `${CDN}/mlb/boxscore`, query: { xhr: '1', gameId: '401696358' } },
  { file: 'cdn/schedule_nba.json.gz', league: 'nba', short: 'cdn_schedule', args: { date: '20250115' }, family: 'cdn',
    url: `${CDN}/nba/schedule`, query: { xhr: '1', date: '20250115' } },
  { file: 'cdn/scoreboard_nba.json.gz', league: 'nba', short: 'cdn_scoreboard', args: { date: '20250115' }, family: 'cdn',
    url: `${CDN}/nba/scoreboard`, query: { xhr: '1', date: '20250115' } },
  { file: 'cdn/scoreboard_epl.json.gz', league: 'epl', short: 'cdn_scoreboard', args: { date: '20250201' }, family: 'cdn',
    url: `${CDN}/eng.1/scoreboard`, query: { xhr: '1', date: '20250201' } },
  // Site v2 rankings (README: rankings_*.json.gz, sdv-py captures 2026-10-08)
  { file: 'rankings_cfb.json.gz', league: 'cfb', short: 'rankings', args: {}, family: 'site_v2',
    url: `${SITE}/football/college-football/rankings`, query: {} },
  { file: 'rankings_mbb.json.gz', league: 'mbb', short: 'rankings', args: {}, family: 'site_v2',
    url: `${SITE}/basketball/mens-college-basketball/rankings`, query: {} },
  { file: 'rankings_wbb.json.gz', league: 'wbb', short: 'rankings', args: {}, family: 'site_v2',
    url: `${SITE}/basketball/womens-college-basketball/rankings`, query: {} },
  { file: 'rankings_mch.json.gz', league: 'mch', short: 'rankings', args: {}, family: 'site_v2',
    url: `${SITE}/hockey/mens-college-hockey/rankings`, query: {} },
  { file: 'rankings_wch.json.gz', league: 'wch', short: 'rankings', args: {}, family: 'site_v2',
    url: `${SITE}/hockey/womens-college-hockey/rankings`, query: {} },
  { file: 'cdn/rankings_cfb.json.gz', league: 'cfb', short: 'cdn_rankings', args: { week: 5, season: 2024, season_type: 2 }, family: 'cdn',
    url: `${CDN}/college-football/rankings`, query: { xhr: '1', week: '5', year: '2024', seasontype: '2' } },
];

const FAMILIES = ['site_v2', 'site_v2_alt', 'core_v2', 'web_v3', 'fitt_v3', 'cdn'];

/** Stub every ESPN family with `data`; returns the request log (family + url + params). */
function stub(data) {
  const calls = [];
  const transport = {};
  for (const family of FAMILIES) {
    transport[family] = async (req) => {
      calls.push({ family, ...req });
      return { status: 200, headers: {}, url: req.url, data };
    };
  }
  configure({ transport });
  return calls;
}

const SNAKE = /^[a-z0-9_]+$/;
const DECIMAL = /^-?\d+$/;
// Measured on these captures (and faithful to sdv-py, whose `underscore` keeps the
// same characters and whose tests assert `"$ref" in df.columns`): the ONLY keys that
// are not snake_case. ESPN's hypermedia `$ref` link columns keep the `$`; ESPN stat
// labels keep their `/`. A key outside this set still fails.
const KNOWN_NON_SNAKE = new Set([
  '$ref', // events (Core v2 $ref-only items)
  'season_$ref', // athlete_statisticslog
  'away_team_odds_team_$ref', 'home_team_odds_team_$ref', // summary.pickcenter
  'ap_rank/cfp_rank', // fpi
  'completions/passing_attempts', 'field_goals_made/field_goal_attempts', 'extra_points_made/extra_point_attempts', // cdn_playbyplay.boxscore_player (CFB)
]);
// The only id column that is not a decimal: ESPN's own composite "now" id on
// news / article rows, e.g. "1-45539787" (a payload string, not a library cast).
const COMPOSITE_IDS = { now_id: /^\d+-\d+$/ };

/** rows: non-empty array of objects, snake_case keys, decimal-string id columns. */
function assertFrame(rows, label) {
  should(rows).be.an.Array();
  rows.length.should.be.above(0, `${label}: 0 rows`);
  for (const row of rows) {
    should(row).be.an.Object();
    for (const [k, v] of Object.entries(row)) {
      (SNAKE.test(k) || KNOWN_NON_SNAKE.has(k)).should.be.true(`${label}: non-snake key ${JSON.stringify(k)}`);
      if (isIdColumn(k) && v != null) {
        (typeof v).should.equal('string', `${label}: id column ${k} is a ${typeof v} (${String(v)})`);
        (COMPOSITE_IDS[k] ?? DECIMAL).test(v).should.be.true(`${label}: id column ${k} is not a decimal string (${JSON.stringify(v)})`);
      }
    }
  }
}

describe('ESPN wrappers on real captures (offline)', () => {
  afterEach(() => resetConfig());

  for (const c of CASES) {
    const def = WRAPPERS.find((w) => w.short === c.short);
    const fn = `espn_${c.league}_${def.publicShort ?? c.short}`;
    it(`${c.league}.${c.short} <- espn/${c.file}`, async () => {
      const calls = stub(load(c.file));
      const out = await sdv[c.league][fn]({ ...c.args, parsed: true });

      // the wrapper fetched the README's URL, on the README's family, with its query
      calls.length.should.equal(1, `expected one request, got ${calls.length}`);
      calls[0].family.should.equal(c.family);
      calls[0].url.should.equal(c.url);
      for (const [k, v] of Object.entries(c.query)) String(calls[0].query?.[k]).should.equal(v, `query ${k}`);

      if (Array.isArray(out)) return assertFrame(out, c.short);
      // the summary dispatcher (and the CDN game pages that run it): a dict of section frames
      should(out).be.an.Object();
      const sections = Object.entries(out).filter(([, rows]) => Array.isArray(rows) && rows.length > 0);
      sections.length.should.be.above(0, `${c.short}: every section parsed empty`);
      for (const [name, rows] of sections) assertFrame(rows, `${c.short}.${name}`);
    });
  }
});

import should from 'should';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv, { configure, resetConfig, AssetFetchError, NoDataError } from '../dist/index.js';
import { _timer } from '../dist/core/request.js';
import { resetWarnOnce } from '../dist/core/deprecation.js';
import { captureWarnings } from './helpers/warnings.mjs';

// The legacy hand-written `sdv.<league>.get*` methods that used raw axios (mostly
// over http://) now fetch through the core request layer: https, retries, the
// ESPN non-JSON guard, and NoDataError / AssetFetchError. Signatures, URLs (bar
// the scheme), queries and return shapes are unchanged. Offline: a fake transport
// per family answers real captures (test/fixtures/legacy/README.md).

const here = dirname(fileURLToPath(import.meta.url));
const read = (...p) => {
  const buf = readFileSync(join(here, 'fixtures', ...p));
  return p.at(-1).endsWith('.gz') ? gunzipSync(buf).toString('utf8') : buf.toString('utf8');
};
const json = (...p) => JSON.parse(read(...p));

const SUMMARY = json('espn', 'summary_nba.json');
const SUMMARY_NHL = json('legacy', 'summary_nhl.json.gz');
const SUMMARY_NFL = json('legacy', 'summary_nfl.json.gz');
const SUMMARY_MLB = json('legacy', 'summary_mlb.json.gz');
const SCOREBOARD = json('espn', 'scoreboard_nba.json');
const STANDINGS = json('espn', 'standings_nba.json');
const TEAMS = json('espn', 'teams_site_nba.json');
const ROSTER = json('espn', 'team_roster_nba.json');
const RANKINGS_247 = read('legacy', 'sports247_cfb_composite_2024_p1.html');
const NCAA_SCOREBOARD = json('legacy', 'ncaa_scoreboard_basketball-men_d3_20190215.json.gz');

/** Each league's real site v2 summary (cfb answers the NFL one: same football shape). */
const SUMMARIES = {
  nba: SUMMARY,
  wnba: json('espn', 'basketball_box', 'summary_wnba.json.gz'),
  mbb: json('espn', 'basketball_box', 'summary_mbb.json.gz'),
  wbb: json('espn', 'basketball_box', 'summary_wbb.json.gz'),
  mlb: SUMMARY_MLB,
  nhl: SUMMARY_NHL,
  nfl: SUMMARY_NFL,
  cfb: SUMMARY_NFL,
};

// The CDN's documented bot challenge: HTTP 202 + an HTML page instead of JSON.
const CHALLENGE = { status: 202, headers: { 'content-type': 'text/html' }, data: '<html><body>Just a moment...</body></html>' };
const FAMILIES = ['site_v2', 'web_v3', 'sports247_html', 'stats_ncaa', 'ncaa_com'];

/** A fake transport on every family the legacy methods use; returns the request log (with the family). */
function fake(respond) {
  const calls = [];
  const transport = {};
  for (const family of FAMILIES) {
    transport[family] = async (req) => {
      calls.push({ family, ...req });
      return { status: 200, headers: {}, url: req.url, ...respond(req, family) };
    };
  }
  configure({ transport });
  return calls;
}
const answer = (data) => () => ({ data });

/** Resolve to the rejection (or fail the test if the call resolved). */
const rejection = (call) =>
  call().then(
    (v) => {
      throw new Error(`resolved with ${JSON.stringify(v)?.slice(0, 80)}`);
    },
    (e) => e
  );

const SITE = 'https://site.api.espn.com/apis/site/v2/sports';
const WEB = 'https://site.web.api.espn.com/apis/v2/sports';
const PATH = {
  nba: 'basketball/nba',
  wnba: 'basketball/wnba',
  mbb: 'basketball/mens-college-basketball',
  wbb: 'basketball/womens-college-basketball',
  mlb: 'baseball/mlb',
  nhl: 'hockey/nhl',
  nfl: 'football/nfl',
  cfb: 'football/college-football',
};
const ID = 401585607;

/** Where each projected field of a summary-reading method comes from in a site v2 summary. */
const SRC = {
  boxScore: (b) => b.boxscore,
  gameInfo: (b) => b.gameInfo,
  header: (b) => b.header,
  leaders: (b) => b.leaders,
  winProbability: (b) => b.winprobability,
  plays: (b) => b.plays,
  standings: (b) => b.standings,
  drives: (b) => b.drives,
  scoringPlays: (b) => b.scoringPlays,
  onIce: (b) => b.onIce,
  seasonSeries: (b) => b.seasonseries,
  pickcenter: (b) => b.pickcenter,
  againstTheSpread: (b) => b.againstTheSpread,
  odds: (b) => b.odds,
  teams: (b) => b.header.competitions[0].competitors,
  competitions: (b) => b.header.competitions,
  season: (b) => b.header.season,
  week: (b) => b.header.week,
  id: (b) => parseInt(b.header.id),
  'id:str': (b) => b.header.id,
};
const FOOTBALL_SUMMARY = 'id boxScore gameInfo drives leaders header teams scoringPlays winProbability competitions season week standings';
const GAME_SUMMARY = 'boxScore gameInfo header teams id:str plays winProbability leaders competitions season seasonSeries standings';
const PICKS = 'id gameInfo leaders header teams competitions winProbability pickcenter againstTheSpread odds season standings';
/** The documented return of every summary-reading method: its keys and their sources. */
const SHAPE = {
  'cfb.getSummary': FOOTBALL_SUMMARY,
  'nfl.getSummary': FOOTBALL_SUMMARY,
  'mbb.getSummary': 'boxScore gameInfo leaders winProbability header plays standings',
  'wbb.getSummary': 'boxScore gameInfo leaders winProbability header plays standings',
  'nba.getSummary': GAME_SUMMARY,
  'mlb.getSummary': GAME_SUMMARY,
  'wnba.getSummary': GAME_SUMMARY,
  'nhl.getSummary': 'boxScore gameInfo header teams id plays onIce leaders competitions season seasonSeries standings',
  'cfb.getPicks': `${PICKS} week`,
  'nfl.getPicks': `${PICKS} week`,
  'mbb.getPicks': PICKS,
  'nba.getPicks': `${PICKS} seasonSeries`,
  'mlb.getPicks': `${PICKS} seasonSeries`,
  'nhl.getPicks': 'id gameInfo leaders header teams competitions pickcenter againstTheSpread odds seasonSeries season standings',
  'nhl.getPlayByPlay': 'teams id plays onIce competitions season boxScore seasonSeries standings',
};

/** Assert `out` is the documented return of `label` for the real summary `body`. */
function checkShape(label, out, body) {
  if (label === 'nhl.getBoxScore') {
    out.should.equal(body.boxscore, label);
    out.id.should.equal(parseInt(body.header.id));
    return;
  }
  const spec = SHAPE[label];
  if (!spec) return out.should.equal(body, label); // raw-body method: the response body itself
  const fields = spec.split(' ');
  Object.keys(out).sort().should.eql(fields.map((f) => f.replace(':str', '')).sort(), label);
  for (const f of fields) should(out[f.replace(':str', '')]).equal(SRC[f](body), `${label}.${f}`);
}

/** Every legacy ESPN site-API method: [label, call, family, url, league]. */
const ESPN_METHODS = [];
for (const [lg, path] of Object.entries(PATH)) {
  const add = (m, args, family, url) => ESPN_METHODS.push([`${lg}.${m}`, () => sdv[lg][m](...args), family, url, lg]);
  add('getSummary', [ID], 'site_v2', `${SITE}/${path}/summary`);
  if (!['wbb', 'wnba'].includes(lg)) add('getPicks', [ID], 'site_v2', `${SITE}/${path}/summary`);
  if (lg === 'nhl') {
    // NHL has no CDN game pages: its play-by-play / box score read the site summary.
    add('getPlayByPlay', [ID], 'site_v2', `${SITE}/${path}/summary`);
    add('getBoxScore', [ID], 'site_v2', `${SITE}/${path}/summary`);
  }
  add('getScoreboard', [{}], 'site_v2', `${SITE}/${path}/scoreboard`);
  if (['cfb', 'mbb', 'wbb'].includes(lg)) add('getConferences', [{}], 'site_v2', `${SITE}/${path}/scoreboard/conferences`);
  add('getStandings', [{}], 'web_v3', `${WEB}/${path}/standings`);
  add('getTeamList', [{}], 'site_v2', `${SITE}/${path}/teams`);
  const team = lg === 'nfl' ? { id: 16 } : 16; // nfl's legacy signature takes { id }
  add('getTeamInfo', [team], 'site_v2', `${SITE}/${path}/teams/16`);
  add('getTeamPlayers', [team], 'site_v2', `${SITE}/${path}/teams/16`);
}
ESPN_METHODS.push(['tennis.getScoreboard', () => sdv.tennis.getScoreboard({}), 'site_v2', `${SITE}/tennis/atp/scoreboard`, 'nba']);

const STANDINGS_BASE = { region: 'us', lang: 'en', contentorigin: 'espn' };
const NCAA_SORT =
  'leaguewinpercent:desc,vsconf_winpercent:desc,' +
  'vsconf_gamesbehind:asc,vsconf_playoffseed:asc,wins:desc,' +
  'losses:desc,playoffseed:asc,alpha:asc';

describe('legacy ESPN site-API methods: https through the core request layer', () => {
  afterEach(() => resetConfig());

  it(`all ${ESPN_METHODS.length} methods: one https request on their ESPN family, documented return (real summaries)`, async () => {
    for (const [label, call, family, url, lg] of ESPN_METHODS) {
      const body = SUMMARIES[lg];
      const calls = fake(answer(body));
      const out = await call();
      calls.map((c) => [c.family, c.method, c.url]).should.eql([[family, 'GET', url]], label);
      checkShape(label, out, body);
    }
  });

  it('every documented summary field is present in its real capture (the shape check is not vacuous)', () => {
    const missing = [];
    for (const [label, spec] of Object.entries(SHAPE)) {
      const body = SUMMARIES[label.split('.')[0]];
      for (const f of spec.split(' ')) if (SRC[f](body) === undefined) missing.push(`${label}.${f}`);
    }
    // MLB site v2 summaries carry no `leaders` section (no equivalent elsewhere): that field stays undefined.
    missing.should.eql(['mlb.getSummary.leaders', 'mlb.getPicks.leaders']);
  });

  it('nba / mlb getSummary: the 7 fields once read off a nonexistent gamepackageJSON are populated', async () => {
    for (const lg of ['nba', 'mlb']) {
      const body = SUMMARIES[lg];
      fake(answer(body));
      const out = await sdv[lg].getSummary(ID);
      out.teams.should.equal(body.header.competitions[0].competitors);
      out.teams.length.should.equal(2);
      out.id.should.equal(body.header.id);
      out.plays.should.equal(body.plays);
      out.plays.length.should.be.above(100);
      out.competitions.should.equal(body.header.competitions);
      out.season.should.equal(body.header.season);
      out.seasonSeries.should.equal(body.seasonseries);
      out.standings.should.equal(body.standings);
    }
  });

  it('queries are unchanged (an exact row per league)', async () => {
    const cases = [
      [() => sdv.nba.getSummary(ID), { event: ID }],
      [() => sdv.nba.getPicks(ID), { event: ID }],
      [() => sdv.nba.getScoreboard({ year: 2025, month: '1', day: 5 }), { limit: 300, dates: '20250105' }],
      [() => sdv.nba.getScoreboard({}), { limit: 300 }],
      [() => sdv.nba.getStandings({ year: 2024, group: 'conference' }), { ...STANDINGS_BASE, season: 2024, type: 1, level: 2 }],
      [() => sdv.nba.getTeamList(), { limit: 1000 }],
      [() => sdv.nba.getTeamInfo(16), undefined],
      [() => sdv.nba.getTeamPlayers(16), { enable: 'roster' }],
      [
        () => sdv.cfb.getScoreboard({ year: 2023, month: 11, day: 25, groups: 81 }),
        { groups: 81, seasontype: 2, limit: 300, dates: '20231125' },
      ],
      [() => sdv.cfb.getConferences({ year: 2023 }), { season: 2023, group: 80 }],
      [
        () => sdv.cfb.getStandings({ year: 2023 }),
        { ...STANDINGS_BASE, season: 2023, group: 80, type: 0, level: 1, sort: `winpercent:desc,${NCAA_SORT}` },
      ],
      [() => sdv.cfb.getTeamList({ group: 81 }), { group: 81, limit: 1000 }],
      [() => sdv.mbb.getScoreboard({ year: 2024, month: 3, day: 9 }), { groups: 50, seasontype: 2, limit: 1000, dates: '20240309' }],
      [() => sdv.mbb.getStandings({ year: 2024 }), { ...STANDINGS_BASE, season: 2024, group: 50, type: 0, level: 1, sort: NCAA_SORT }],
      [() => sdv.mbb.getTeamList({}), { group: 50, limit: 1000 }],
      [() => sdv.wbb.getScoreboard({ year: 2024, month: 3, day: 9 }), { groups: 50, seasontype: 2, limit: 300, dates: '20240309' }],
      [() => sdv.wbb.getConferences({ year: 2024 }), { season: 2024, group: 50 }],
      [() => sdv.wbb.getStandings({ year: 2024 }), { ...STANDINGS_BASE, season: 2024, group: 50, type: 0, level: 1, sort: NCAA_SORT }],
      [() => sdv.wnba.getScoreboard({ year: 2024, month: 9, day: 1 }), { limit: 300, dates: '20240901' }],
      [() => sdv.wnba.getStandings({ year: 2024, group: 'conference' }), { ...STANDINGS_BASE, season: 2024, type: 0, level: 2 }],
      [() => sdv.mlb.getScoreboard({ year: 2024, month: 10, day: 30 }), { limit: 300, dates: '20241030' }],
      [() => sdv.mlb.getStandings({ year: 2024, group: 'division' }), { ...STANDINGS_BASE, season: 2024, type: 1, level: 3 }],
      [() => sdv.mlb.getTeamPlayers(16), { enable: 'roster' }],
      [() => sdv.nhl.getScoreboard({ year: 2024, month: 6, day: 24 }), { limit: 300, dates: '20240624' }],
      [
        () => sdv.nhl.getStandings({ year: 2024 }),
        { ...STANDINGS_BASE, type: 1, level: 1, sort: 'playoffseed:asc,points:desc,gamesplayed:asc,rotwins:desc', season: 2024 },
      ],
      [() => sdv.nhl.getPlayByPlay(ID), { event: ID }],
      [() => sdv.nfl.getScoreboard({ year: 2025, month: 2, day: 9 }), { limit: 300, dates: '20250209' }],
      [() => sdv.nfl.getStandings({ year: 2024, group: 'division' }), { ...STANDINGS_BASE, season: 2024, type: 1, level: 3 }],
      [() => sdv.nfl.getTeamPlayers({ id: 16 }), { enable: 'roster' }],
      [() => sdv.tennis.getScoreboard({ league: 'wta', year: 2023, month: 6, day: 20 }), { dates: '20230620' }],
    ];
    for (const [call, query] of cases) {
      const calls = fake(answer(SUMMARY));
      await call();
      should(calls[0].query).eql(query, call.toString());
    }
  });

  it('raw-body methods return the response body itself (real captures)', async () => {
    for (const [call, body] of [
      [() => sdv.nba.getScoreboard({}), SCOREBOARD],
      [() => sdv.nba.getStandings({}), STANDINGS],
      [() => sdv.nba.getTeamList(), TEAMS],
      [() => sdv.nba.getTeamInfo(16), TEAMS],
      [() => sdv.nba.getTeamPlayers(16), ROSTER],
      [() => sdv.tennis.getScoreboard({}), SCOREBOARD],
    ]) {
      fake(answer(body));
      (await call()).should.equal(body);
    }
  });

  it('a 2xx non-JSON body (the HTTP 202 HTML bot challenge) is AssetFetchError on every method', async () => {
    fake(() => CHALLENGE);
    for (const [label, call] of ESPN_METHODS) {
      const err = await rejection(call);
      err.should.be.instanceOf(AssetFetchError, label);
      err.status.should.equal(202);
      err.message.should.match(/non-JSON body/);
    }
  });

  it('HTTP 404 and an ESPN 200 { code: 404 } body are NoDataError on every method', async () => {
    for (const respond of [() => ({ status: 404, data: '' }), answer({ code: 404, message: 'Not Found' })]) {
      fake(respond);
      for (const [label, call] of ESPN_METHODS) {
        (await rejection(call)).should.be.instanceOf(NoDataError, label);
      }
    }
  });
});

describe('legacy 247sports.com scrapers (deprecated): https through the request layer', () => {
  const UA = /Chrome\/41\.0/;
  let sleep;
  beforeEach(() => {
    sleep = _timer.sleep;
    _timer.sleep = async () => {};
  });
  afterEach(() => {
    _timer.sleep = sleep;
    resetConfig();
  });

  it('getPlayerRankings parses the real page; URL, query and UA unchanged but https', async () => {
    const calls = fake(answer(RANKINGS_247));
    const rows = await sdv.cfb.getPlayerRankings({ year: 2024 });
    rows.map((r) => [r.ranking, r.name, r.position, r.stars]).should.eql([
      [1, 'Jeremiah Smith', 'WR', 5],
      [2, 'Ellis Robinson IV', 'CB', 5],
      [3, 'Cam Coleman', 'WR', 5],
    ]);
    rows[0].college.should.equal('Ohio State');
    calls.length.should.equal(1);
    calls[0].family.should.equal('sports247_html');
    calls[0].url.should.equal('https://247sports.com/Season/2024-Football/CompositeRecruitRankings');
    calls[0].query.should.eql({ InstitutionGroup: 'HighSchool', Page: 1, Position: null, State: null });
    calls[0].responseType.should.equal('text');
    calls[0].headers['User-Agent'].should.match(UA);
  });

  it('every 247 method: https URL + query', async () => {
    const calls = fake(answer('<html></html>'));
    await sdv.cfb.getPlayerRankings({ year: 2024, page: 2, rankingsType: '247' });
    await sdv.mbb.getPlayerRankings({ year: 2024 });
    await sdv.cfb.getSchoolRankings(2024, 2);
    await sdv.mbb.getSchoolRankings(2024);
    await sdv.cfb.getSchoolCommits('alabama', 2024);
    await sdv.mbb.getSchoolCommits('duke', 2024);
    calls.map((c) => [c.family, c.url, c.query]).should.eql([
      ['sports247_html', 'https://247sports.com/Season/2024-Football/recruitrankings', { InstitutionGroup: 'HighSchool', Page: 2, Position: null, State: null }],
      ['sports247_html', 'https://247sports.com/Season/2024-Basketball/CompositeRecruitRankings', { InstitutionGroup: 'HighSchool', Page: 1, Position: null, State: null }],
      ['sports247_html', 'https://247sports.com/Season/2024-Football/CompositeTeamRankings', { Page: 2 }],
      ['sports247_html', 'https://247sports.com/Season/2024-Basketball/CompositeTeamRankings', { Page: 1 }],
      ['sports247_html', 'https://alabama.247sports.com/Season/2024-Football/Commits', undefined],
      ['sports247_html', 'https://duke.247sports.com/Season/2024-Basketball/Commits', undefined],
    ]);
    calls.every((c) => UA.test(c.headers['User-Agent'])).should.be.true();
  });

  it('404 is NoDataError; a persistent 5xx is AssetFetchError', async () => {
    fake(() => ({ status: 404, data: 'Not Found' }));
    (await rejection(() => sdv.cfb.getSchoolRankings(2024))).should.be.instanceOf(NoDataError);
    fake(() => ({ status: 503, data: '' }));
    const err = await rejection(() => sdv.mbb.getPlayerRankings({ year: 2024 }));
    err.should.be.instanceOf(AssetFetchError);
    err.status.should.equal(503);
  });

  it("a 403 (the 247 edge's block) is AssetFetchError at once, never retried", async () => {
    const calls = fake(() => ({ status: 403, data: '' }));
    const err = await rejection(() => sdv.cfb.getPlayerRankings({ year: 2024 }));
    err.should.be.instanceOf(AssetFetchError);
    err.status.should.equal(403);
    calls.length.should.equal(1);
  });

  it('a network error is AssetFetchError with a sanitized cause (no raw HTTP-client error escapes)', async () => {
    configure({
      transport: {
        sports247_html: async () => {
          throw Object.assign(new Error('socket hang up'), { code: 'ECONNRESET', config: { headers: { Cookie: 'secret' } } });
        },
      },
    });
    const err = await rejection(() => sdv.cfb.getSchoolCommits('alabama', 2024));
    err.should.be.instanceOf(AssetFetchError);
    err.cause.code.should.equal('ECONNRESET');
    should(err.cause.config).be.undefined();
  });
});

describe('legacy ncaa methods: through the request layer', () => {
  afterEach(() => resetConfig());

  it('getScoreboard returns the casablanca JSON (real capture), https', async () => {
    const calls = fake(answer(NCAA_SCOREBOARD));
    const out = await sdv.ncaa.getScoreboard({ sport: 'basketball-men', division: 'd3', year: 2019, month: 2, day: 15 });
    out.should.equal(NCAA_SCOREBOARD);
    out.games.length.should.equal(26);
    calls.map((c) => [c.family, c.url]).should.eql([
      ['ncaa_com', 'https://data.ncaa.com/casablanca/scoreboard/basketball-men/d3/2019/02/15/scoreboard.json'],
    ]);
  });

  it('casablanca per-game files: 404 is NoDataError, a 2xx non-JSON body AssetFetchError', async () => {
    const calls = fake(() => ({ status: 404, data: '' }));
    (await rejection(() => sdv.ncaa.getInfo(5764053))).should.be.instanceOf(NoDataError);
    calls[0].url.should.equal('https://data.ncaa.com/casablanca/game/5764053/gameInfo.json');
    fake(answer('<html>maintenance</html>'));
    for (const m of ['getInfo', 'getBoxScore', 'getPlayByPlay']) {
      const err = await rejection(() => sdv.ncaa[m](5764053));
      err.should.be.instanceOf(AssetFetchError, m);
      err.message.should.match(/non-JSON body/);
    }
  });

  it('getRedirectUrl reads the game id off the final (redirected) URL', async () => {
    const calls = fake(() => ({ data: '<html></html>', url: 'https://www.ncaa.com/game/3194501' }));
    (await sdv.ncaa.getRedirectUrl('/game/basketball-men/d3/2019/02/15/alfred-utica')).should.equal(3194501);
    calls.map((c) => [c.family, c.url, c.responseType]).should.eql([
      ['ncaa_com', 'https://ncaa.com//game/basketball-men/d3/2019/02/15/alfred-utica', 'text'],
    ]);
  });

  it('getRedirectUrl: a final URL without a game id (a transport that does not report redirects) is AssetFetchError, not NaN', async () => {
    fake(() => ({ data: '<html></html>' })); // url echoes the request URL
    const err = await rejection(() => sdv.ncaa.getRedirectUrl('/game/basketball-men/d3/2019/02/15/alfred-utica'));
    err.should.be.instanceOf(AssetFetchError);
    err.message.should.match(/no game id in the final URL/);
  });

  it("stats.ncaa.org scrapers: https; Akamai's 403 is AssetFetchError at once (not retried); still deprecated", async () => {
    const calls = fake(() => ({ status: 403, data: '<HTML><HEAD><TITLE>Access Denied</TITLE></HEAD></HTML>' }));
    let err;
    resetWarnOnce(); // warn-once state is per process: start clean whatever ran before
    const warnings = await captureWarnings(async () => {
      err = await rejection(() => sdv.ncaa.getTeamData('MFB', '2017', '11', '52', 'N', '20'));
    });
    err.should.be.instanceOf(AssetFetchError);
    err.status.should.equal(403);
    warnings.some((w) => w.name === 'DeprecationWarning' && /getTeamData\(\) scrapes stats\.ncaa\.org/.test(w.message)).should.be.true();
    calls.length.should.equal(1);
    calls[0].family.should.equal('stats_ncaa');
    calls[0].url.should.equal('https://stats.ncaa.org/rankings/change_sport_year_div');
    calls[0].query.should.containEql({ sport_code: 'MFB', academic_year: '2017', team_individual: 'T', stat_seq: '20' });
    calls[0].responseType.should.equal('text');

    const all = fake(() => ({ status: 403, data: '' }));
    await captureWarnings(async () => {
      for (const call of [
        () => sdv.ncaa.getSeasons('MBB'),
        () => sdv.ncaa.getDivisions('MBB', '2017'),
        () => sdv.ncaa.getSportDivisionData('MFB', '2016', 12, 'team', true),
        () => sdv.ncaa.getPlayerData('MFB', '2017', '11', '52', 'N', '20'),
      ]) {
        (await rejection(call)).should.be.instanceOf(AssetFetchError);
      }
    });
    all.map((c) => c.url).should.eql(Array(4).fill('https://stats.ncaa.org/rankings/change_sport_year_div'));
  });
});

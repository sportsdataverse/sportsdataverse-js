import should from 'should';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv, { configure, resetConfig, AssetFetchError, NoDataError } from '../dist/index.js';
import { _timer } from '../dist/core/request.js';

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
const SCOREBOARD = json('espn', 'scoreboard_nba.json');
const STANDINGS = json('espn', 'standings_nba.json');
const TEAMS = json('espn', 'teams_site_nba.json');
const ROSTER = json('espn', 'team_roster_nba.json');
const RANKINGS_247 = read('legacy', 'sports247_cfb_composite_2024_p1.html');
const NCAA_SCOREBOARD = json('legacy', 'ncaa_scoreboard_basketball-men_d3_20190215.json.gz');

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

/** Every legacy ESPN site-API method: [label, call, family, url]. */
const ESPN_METHODS = [];
for (const [lg, path] of Object.entries(PATH)) {
  const add = (m, args, family, url) => ESPN_METHODS.push([`${lg}.${m}`, () => sdv[lg][m](...args), family, url]);
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
ESPN_METHODS.push(['tennis.getScoreboard', () => sdv.tennis.getScoreboard({}), 'site_v2', `${SITE}/tennis/atp/scoreboard`]);

describe('legacy ESPN site-API methods: https through the core request layer', () => {
  afterEach(() => resetConfig());

  it(`all ${ESPN_METHODS.length} methods send one https request on their ESPN family`, async () => {
    for (const [label, call, family, url] of ESPN_METHODS) {
      const calls = fake(answer(SUMMARY));
      await call();
      calls.map((c) => [c.family, c.method, c.url]).should.eql([[family, 'GET', url]], label);
    }
  });

  it('queries are unchanged', async () => {
    const cases = [
      [() => sdv.nba.getSummary(ID), { event: ID }],
      [() => sdv.nba.getPicks(ID), { event: ID }],
      [() => sdv.nba.getScoreboard({ year: 2025, month: '1', day: 5 }), { limit: 300, dates: '20250105' }],
      [() => sdv.nba.getScoreboard({}), { limit: 300 }],
      [
        () => sdv.nba.getStandings({ year: 2024, group: 'conference' }),
        { region: 'us', lang: 'en', contentorigin: 'espn', season: 2024, type: 1, level: 2 },
      ],
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
        {
          region: 'us',
          lang: 'en',
          contentorigin: 'espn',
          season: 2023,
          group: 80,
          type: 0,
          level: 1,
          sort:
            'winpercent:desc,leaguewinpercent:desc,vsconf_winpercent:desc,' +
            'vsconf_gamesbehind:asc,vsconf_playoffseed:asc,wins:desc,' +
            'losses:desc,playoffseed:asc,alpha:asc',
        },
      ],
      [() => sdv.cfb.getTeamList({ group: 81 }), { group: 81, limit: 1000 }],
      [() => sdv.tennis.getScoreboard({ league: 'wta', year: 2023, month: 6, day: 20 }), { dates: '20230620' }],
    ];
    for (const [call, query] of cases) {
      const calls = fake(answer(SUMMARY));
      await call();
      should(calls[0].query).eql(query);
    }
  });

  it('summary-backed methods keep their return shapes (real summaries)', async () => {
    fake(answer(SUMMARY));
    const s = await sdv.nba.getSummary(ID);
    s.boxScore.should.equal(SUMMARY.boxscore);
    s.header.should.equal(SUMMARY.header);
    s.leaders.should.equal(SUMMARY.leaders);
    s.winProbability.should.equal(SUMMARY.winprobability);
    const p = await sdv.nba.getPicks(ID);
    p.id.should.equal(parseInt(SUMMARY.header.id));
    p.teams.should.equal(SUMMARY.header.competitions[0].competitors);
    p.pickcenter.should.equal(SUMMARY.pickcenter);
    p.againstTheSpread.should.equal(SUMMARY.againstTheSpread);

    fake(answer(SUMMARY_NHL));
    const id = parseInt(SUMMARY_NHL.header.id);
    const pbp = await sdv.nhl.getPlayByPlay(id);
    pbp.id.should.equal(id);
    pbp.plays.should.equal(SUMMARY_NHL.plays);
    pbp.teams.should.equal(SUMMARY_NHL.header.competitions[0].competitors);
    const box = await sdv.nhl.getBoxScore(id);
    box.should.equal(SUMMARY_NHL.boxscore);
    box.id.should.equal(id);
    (await sdv.nhl.getSummary(id)).plays.should.equal(SUMMARY_NHL.plays);
    (await sdv.nhl.getPicks(id)).odds.should.equal(SUMMARY_NHL.odds);

    fake(answer(SUMMARY_NFL));
    for (const lg of ['nfl', 'cfb']) {
      const g = await sdv[lg].getSummary(ID);
      g.id.should.equal(parseInt(SUMMARY_NFL.header.id));
      g.drives.should.equal(SUMMARY_NFL.drives);
      g.scoringPlays.should.equal(SUMMARY_NFL.scoringPlays);
      g.week.should.equal(SUMMARY_NFL.header.week);
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

  it("stats.ncaa.org scrapers: https; Akamai's 403 is AssetFetchError at once (not retried); still deprecated", async () => {
    const calls = fake(() => ({ status: 403, data: '<HTML><HEAD><TITLE>Access Denied</TITLE></HEAD></HTML>' }));
    const warnings = [];
    const onWarn = (w) => w.name === 'DeprecationWarning' && warnings.push(w.message);
    process.on('warning', onWarn);
    try {
      const err = await rejection(() => sdv.ncaa.getTeamData('MFB', '2017', '11', '52', 'N', '20'));
      err.should.be.instanceOf(AssetFetchError);
      err.status.should.equal(403);
      await new Promise((r) => setImmediate(r)); // 'warning' is emitted on the next tick
    } finally {
      process.off('warning', onWarn);
    }
    warnings.some((m) => /getTeamData\(\) scrapes stats\.ncaa\.org/.test(m)).should.be.true();
    calls.length.should.equal(1);
    calls[0].family.should.equal('stats_ncaa');
    calls[0].url.should.equal('https://stats.ncaa.org/rankings/change_sport_year_div');
    calls[0].query.should.containEql({ sport_code: 'MFB', academic_year: '2017', team_individual: 'T', stat_seq: '20' });
    calls[0].responseType.should.equal('text');

    const all = fake(() => ({ status: 403, data: '' }));
    // (getSports is left to test/phase0-fixes.test.js: its once-per-process warning test must see the first call)
    for (const call of [
      () => sdv.ncaa.getSeasons('MBB'),
      () => sdv.ncaa.getDivisions('MBB', '2017'),
      () => sdv.ncaa.getSportDivisionData('MFB', '2016', 12, 'team', true),
      () => sdv.ncaa.getPlayerData('MFB', '2017', '11', '52', 'N', '20'),
    ]) {
      (await rejection(call)).should.be.instanceOf(AssetFetchError);
    }
    all.map((c) => c.url).should.eql(Array(4).fill('https://stats.ncaa.org/rankings/change_sport_year_div'));
  });
});

import should from 'should';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv, { configure, resetConfig, AssetFetchError } from '../dist/index.js';

// The legacy hand-written CDN methods (`sdv.<league>.getSchedule / getPlayByPlay /
// getBoxScore`, `sdv.cfb.getRankings`, `sdv.nfl.getWeeklySchedule`) used raw axios
// over http:// and, for schedules, sent `?dates=`, which cdn.espn.com ignores (it
// answers today's page). They now route through the vendored
// `espn_<league>_cdn_*` wrappers: https, `xhr=1`, `date` (not `dates`), and the
// core request layer's error vocabulary. Offline: a fake `cdn` transport answers
// sdv-py's real CDN captures (test/fixtures/espn/cdn/).

const here = dirname(fileURLToPath(import.meta.url));
const capture = (name) =>
  JSON.parse(gunzipSync(readFileSync(join(here, 'fixtures', 'espn', 'cdn', `${name}.json.gz`))).toString('utf8'));
const SCHEDULE = capture('schedule_nba');

// The CDN's documented bot challenge: HTTP 202 + an HTML page instead of JSON.
const CHALLENGE = { status: 202, headers: { 'content-type': 'text/html' }, data: '<html><body>Just a moment...</body></html>' };

/** Install a fake `cdn` transport that answers `respond(req)`; returns the request log. */
function cdn(respond) {
  const calls = [];
  configure({
    transport: {
      cdn: async (req) => {
        calls.push(req);
        return { status: 200, headers: {}, url: req.url, ...respond(req) };
      },
    },
  });
  return calls;
}
const answer = (data) => () => ({ data });

// league -> the CDN league slug in the request path
const SLUG = {
  nba: 'nba',
  wnba: 'wnba',
  nhl: 'nhl',
  mlb: 'mlb',
  mbb: 'mens-college-basketball',
  wbb: 'womens-college-basketball',
  cfb: 'college-football',
  nfl: 'nfl',
};

describe('legacy getSchedule: the CDN date key is `date`, not `dates`', () => {
  afterEach(() => resetConfig());

  for (const lg of ['nba', 'wnba', 'nhl', 'mlb', 'mbb', 'wbb']) {
    it(`${lg}.getSchedule({ year, month, day }) sends date=YYYYMMDD`, async () => {
      const calls = cdn(answer(SCHEDULE));
      const out = await sdv[lg].getSchedule({ year: 2025, month: '1', day: 15 });
      calls.length.should.equal(1);
      calls[0].url.should.equal(`https://cdn.espn.com/core/${SLUG[lg]}/schedule`);
      calls[0].query.should.eql({ xhr: 1, date: '20250115' });
      should(calls[0].query.dates).be.undefined();
      out.should.equal(SCHEDULE.content.schedule); // same return shape as before
    });
  }

  it('without a date the request carries none (today)', async () => {
    const calls = cdn(answer(SCHEDULE));
    await sdv.nba.getSchedule({});
    calls[0].query.should.eql({ xhr: 1 });
  });

  for (const lg of ['cfb', 'nfl']) {
    it(`${lg}.getSchedule selects a week (football ignores a date)`, async () => {
      const calls = cdn(answer(SCHEDULE));
      await sdv[lg].getSchedule({ year: 2024, week: 5, seasontype: 2 });
      calls[0].url.should.equal(`https://cdn.espn.com/core/${SLUG[lg]}/schedule`);
      calls[0].query.should.eql({ xhr: 1, week: 5, year: 2024, seasontype: 2 });
    });

    it(`${lg}.getSchedule with only a date sends date= and warns once`, async () => {
      const calls = cdn(answer(SCHEDULE));
      const warnings = [];
      const onWarn = (w) => w.code === 'SDV_CDN_FOOTBALL_DATE' && warnings.push(w.message);
      process.on('warning', onWarn);
      try {
        await sdv[lg].getSchedule({ year: 2024, month: 10, day: 6 });
        await sdv[lg].getSchedule({ year: 2024, month: 10, day: 13 });
        await new Promise((r) => setImmediate(r)); // 'warning' is emitted on the next tick
      } finally {
        process.off('warning', onWarn);
      }
      calls.map((c) => c.query).should.eql([
        { xhr: 1, date: '20241006' },
        { xhr: 1, date: '20241013' },
      ]);
      warnings.length.should.equal(1);
      warnings[0].should.match(/week-oriented/);
    });
  }

  it('nfl.getWeeklySchedule sends week / year / seasontype as query params', async () => {
    const calls = cdn(answer(SCHEDULE));
    (await sdv.nfl.getWeeklySchedule({ week: 5, year: 2024, seasonType: 2 })).should.equal(SCHEDULE.content.schedule);
    calls.map((c) => [c.url, c.query]).should.eql([
      ['https://cdn.espn.com/core/nfl/schedule', { xhr: 1, week: 5, year: 2024, seasontype: 2 }],
    ]);
  });
});

describe('legacy getPlayByPlay / getBoxScore / getRankings: via the vendored CDN wrappers', () => {
  afterEach(() => resetConfig());

  // A real capture per sport shape (football pages carry drives; MLB the box score).
  const GAME = { cfb: 'playbyplay_cfb', nfl: 'playbyplay_cfb', mlb: 'boxscore_mlb' };
  for (const lg of ['nba', 'wnba', 'mbb', 'wbb', 'mlb', 'cfb', 'nfl']) {
    const page = capture(GAME[lg] ?? 'playbyplay_nba');
    const header = page.gamepackageJSON.header;

    it(`${lg}.getPlayByPlay(id) -> https ${SLUG[lg]}/playbyplay?xhr=1&gameId=, same return shape`, async () => {
      const calls = cdn(answer(page));
      const out = await sdv[lg].getPlayByPlay(401705127);
      calls.map((c) => [c.url, c.query]).should.eql([
        [`https://cdn.espn.com/core/${SLUG[lg]}/playbyplay`, { xhr: 1, gameId: 401705127 }],
      ]);
      out.teams.should.equal(header.competitions[0].competitors);
      out.boxScore.should.equal(page.gamepackageJSON.boxscore);
    });

    it(`${lg}.getBoxScore(id) -> https ${SLUG[lg]}/boxscore?xhr=1&gameId=, same return shape`, async () => {
      const calls = cdn(answer(page));
      const out = await sdv[lg].getBoxScore(401705127);
      calls.map((c) => [c.url, c.query]).should.eql([
        [`https://cdn.espn.com/core/${SLUG[lg]}/boxscore`, { xhr: 1, gameId: 401705127 }],
      ]);
      out.should.equal(page.gamepackageJSON.boxscore);
      out.id.should.equal(page.gameId);
    });
  }

  it('cfb.getRankings({ year, week }) maps year -> year, week -> week (and sends neither when absent)', async () => {
    const page = capture('rankings_cfb');
    const calls = cdn(answer(page));
    (await sdv.cfb.getRankings({ year: 2024, week: 5 })).should.equal(page);
    await sdv.cfb.getRankings({});
    calls.map((c) => [c.url, c.query]).should.eql([
      ['https://cdn.espn.com/core/college-football/rankings', { xhr: 1, week: 5, year: 2024 }],
      ['https://cdn.espn.com/core/college-football/rankings', { xhr: 1 }],
    ]);
  });
});

describe('CDN: a 2xx non-JSON body (the HTTP 202 HTML bot challenge) is a failed fetch, never "no data"', () => {
  afterEach(() => resetConfig());
  const rejects = async (call) => {
    const err = await call().then(
      (v) => new Error(`resolved with ${JSON.stringify(v)?.slice(0, 80)}`),
      (e) => e
    );
    err.should.be.instanceOf(AssetFetchError);
    err.status.should.equal(202);
    err.message.should.match(/non-JSON body/);
  };

  it('the vendored wrappers: parsed and raw', async () => {
    cdn(() => CHALLENGE);
    await rejects(() => sdv.nba.espnNbaCdnSchedule({ date: '20250115', parsed: true }));
    await rejects(() => sdv.nba.espnNbaCdnSchedule({ date: '20250115' }));
    await rejects(() => sdv.nba.espnNbaCdnPlaybyplay({ game_id: 401705127, parsed: true }));
    await rejects(() => sdv.nba.espnNbaCdnPlaybyplay({ game_id: 401705127 }));
  });

  it('every legacy CDN method', async () => {
    cdn(() => CHALLENGE);
    for (const lg of ['nba', 'wnba', 'nhl', 'mlb', 'mbb', 'wbb', 'cfb', 'nfl']) {
      await rejects(() => sdv[lg].getSchedule({ year: 2025, month: 1, day: 15, week: 1 }));
      if (lg === 'nhl') continue; // no NHL game pages on the CDN
      await rejects(() => sdv[lg].getPlayByPlay(401705127));
      await rejects(() => sdv[lg].getBoxScore(401705127));
    }
    await rejects(() => sdv.cfb.getRankings({ year: 2024, week: 5 }));
    await rejects(() => sdv.nfl.getWeeklySchedule({ week: 5, year: 2024 }));
  });

  it('an empty 2xx body too', async () => {
    cdn(() => ({ data: '' }));
    await rejects2xx200(() => sdv.nba.espnNbaCdnSchedule({}));
  });

  async function rejects2xx200(call) {
    const err = await call().then(() => null, (e) => e);
    err.should.be.instanceOf(AssetFetchError);
    err.status.should.equal(200);
  }
});

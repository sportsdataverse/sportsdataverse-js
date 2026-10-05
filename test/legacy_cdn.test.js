import should from 'should';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv, { configure, resetConfig } from '../dist/index.js';

// The legacy `sdv.<league>.getSchedule({ year, month, day })` methods sent
// `?dates=`, which cdn.espn.com ignores (it answers today's page). They now route
// through the vendored `espn_<league>_cdn_schedule` wrappers, which send `date`.
// Offline: a fake `cdn` transport answers sdv-py's real NBA schedule capture.

const here = dirname(fileURLToPath(import.meta.url));
const page = JSON.parse(
  gunzipSync(readFileSync(join(here, 'fixtures', 'espn', 'cdn', 'schedule_nba.json.gz'))).toString('utf8')
);

function capture() {
  const calls = [];
  configure({
    transport: {
      cdn: async (req) => {
        calls.push(req);
        return { status: 200, headers: {}, url: req.url, data: page };
      },
    },
  });
  return calls;
}

// league -> the CDN league slug in the request path
const DATED = {
  nba: 'nba',
  wnba: 'wnba',
  nhl: 'nhl',
  mlb: 'mlb',
  mbb: 'mens-college-basketball',
  wbb: 'womens-college-basketball',
};

describe('legacy getSchedule: the CDN date key is `date`, not `dates`', () => {
  afterEach(() => resetConfig());

  for (const [lg, slug] of Object.entries(DATED)) {
    it(`${lg}.getSchedule({ year, month, day }) sends date=YYYYMMDD`, async () => {
      const calls = capture();
      const out = await sdv[lg].getSchedule({ year: 2025, month: '1', day: 15 });
      calls.length.should.equal(1);
      calls[0].url.should.equal(`https://cdn.espn.com/core/${slug}/schedule`);
      calls[0].query.should.eql({ xhr: 1, date: '20250115' });
      should(calls[0].query.dates).be.undefined();
      out.should.equal(page.content.schedule); // same return shape as before
    });
  }

  it('without a date the request carries none (today)', async () => {
    const calls = capture();
    await sdv.nba.getSchedule({});
    calls[0].query.should.eql({ xhr: 1 });
  });

  for (const [lg, slug] of [
    ['cfb', 'college-football'],
    ['nfl', 'nfl'],
  ]) {
    it(`${lg}.getSchedule selects a week (football ignores a date)`, async () => {
      const calls = capture();
      await sdv[lg].getSchedule({ year: 2024, week: 5, seasontype: 2 });
      calls[0].url.should.equal(`https://cdn.espn.com/core/${slug}/schedule`);
      calls[0].query.should.eql({ xhr: 1, week: 5, year: 2024, seasontype: 2 });
    });

    it(`${lg}.getSchedule with only a date sends date= and warns once`, async () => {
      const calls = capture();
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
});

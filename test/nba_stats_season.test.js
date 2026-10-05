import should from 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import sdv, { configure, resetConfig, FLAT_WRAPPERS } from '../dist/index.js';
import { resolveFlat } from '../dist/core/flat.js';
import { latestSeason, season_latest_with_data } from '../dist/core/transforms.js';
import { latestSeason as playgroundLatestSeason, resolveFlat as playgroundResolveFlat } from '../docs/src/playground/resolve.mjs';

// Port of sdv-py@28ee34b tests/nba/test_nba_stats_season_defaults.py: the default season of
// the nba_stats / wnba_stats wrappers is the latest season with rows (sdv-py #693,
// nba_stats_runtime._latest_season), re-dated per league, endpoint and SeasonType. Its
// tables (_FIRST_ROWS, _LAG_MONTH, _HOOPR_DIFFERS, _TABLE) are copied as-is; the exact
// labels are pinned by sdv-py's own output (tools/parity/season_oracle.py).

const here = dirname(fileURLToPath(import.meta.url));
const def = (api, short) => FLAT_WRAPPERS.find((w) => w.api === api && w.short === short);
const sent = (api, short, params = {}) => resolveFlat(def(api, short), params).query;
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function* days(year) {
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d = new Date(year, d.getMonth(), d.getDate() + 1)) yield d;
}

// py `_on(day)`: `date.today()` is `day` (local, as py's). Every `new Date()` / `Date.now()` is it.
const RealDate = Date;
function on(y, m, d) {
  const t = new RealDate(y, m - 1, d).getTime();
  globalThis.Date = class extends RealDate {
    constructor(...a) {
      super(...(a.length ? a : [t]));
    }
    static now() {
      return t;
    }
  };
}
const restoreDate = () => {
  globalThis.Date = RealDate;
};

describe('latestSeason: parity with sdv-py _latest_season (every day, every case)', () => {
  const oracle = JSON.parse(readFileSync(join(here, 'fixtures/py/oracle/nba_stats_latest_season.json'), 'utf8'));

  for (const [name, impl] of [['package', latestSeason], ['playground copy', playgroundLatestSeason]]) {
    it(`${name}: 0 diffs over ${oracle.years.join(', ')}`, () => {
      const diffs = [];
      let n = 0;
      for (const [key, runs] of Object.entries(oracle.cases)) {
        const [league, endpoint, seasonType] = key.split('|');
        let i = 0;
        for (const year of oracle.years) {
          for (const d of days(year)) {
            if (runs[i + 1]?.[0] === iso(d)) i++;
            const got = impl(league, endpoint, d, seasonType || undefined);
            n++;
            if (got !== runs[i][1]) diffs.push(`${key} ${iso(d)}: py ${runs[i][1]}, js ${got}`);
          }
        }
      }
      n.should.equal(80 * (365 + 366 + 365)); // 4 leagues x 4 endpoint classes x 5 season types
      diffs.slice(0, 5).should.eql([]);
    });
  }
});

// The first day each kind of season has rows, as [month, day, years after its first year].
// sdv-py measured them on stats.nba.com 2026-10-05 (see the py test for the dates).
const FIRST_ROWS = {
  '00|': [10, 21, 0],
  '20|': [12, 19, 0],
  '15|': [7, 9, 0],
  '10|': [5, 16, 0],
  '00|draftcombinestats': [5, 18, 0],
  '20|draftcombinestats': [5, 18, 0],
  '00|drafthistory': [6, 26, 0],
  '10|drafthistory': [4, 15, 0],
  '00|commonplayoffseries': [4, 18, 1],
  '20|commonplayoffseries': [4, 2, 1],
  '10|commonplayoffseries': [9, 14, 0],
  '00|SeasonType=All Star': [2, 20, 1],
  '10|SeasonType=All Star': [7, 25, 0],
  '20|SeasonType=All Star': [12, 19, 0],
};
// The one month in which the newest season has rows but the default is still the previous one.
const LAG_MONTH = {
  '00|': 10,
  '20|': 12,
  '15|': 7,
  '10|': 5,
  '00|draftcombinestats': 5,
  '20|draftcombinestats': 5,
  '00|drafthistory': 6,
  '10|drafthistory': 4,
  '00|commonplayoffseries': 4,
  '20|commonplayoffseries': 4,
  '10|commonplayoffseries': 9,
  '00|SeasonType=All Star': 2,
  '10|SeasonType=All Star': 7,
  '20|SeasonType=All Star': 12,
};
// Months in which hoopR's current season (rolls over in October) or wehoop's
// most_recent_wnba_season() (rolls over in May) is a different one.
const HOOPR_DIFFERS = { '00': [10], '20': [10, 11, 12], '15': [8, 9], '10': [5] };
const yearToSeason = (y) => `${y}-${String(y + 1).slice(2)}`;
const hooprCurrent = (league, d) =>
  league === '10'
    ? String(d.getMonth() + 1 >= 5 ? d.getFullYear() : d.getFullYear() - 1)
    : yearToSeason(d.getFullYear() + (d.getMonth() + 1 >= 10 ? 1 : 0) - 1);

describe('latestSeason: the default is the latest season with rows, every day (py property test)', () => {
  for (const year of [1999, 2008, 2026]) {
    for (const kind of Object.keys(FIRST_ROWS)) {
      it(`${kind} ${year}`, () => {
        const [league, what] = kind.split('|');
        const [endpoint, seasonType] = what.split('SeasonType=');
        const firstRows = (start) => {
          const [m, d, years] = FIRST_ROWS[kind];
          return new Date(start + years, m - 1, d);
        };
        for (const d of days(year)) {
          const label = latestSeason(league, endpoint, d, seasonType || undefined);
          const start = Number(label.slice(0, 4));
          label.length.should.equal(league === '10' || endpoint === 'drafthistory' ? 4 : 7, iso(d));
          (firstRows(start) <= d).should.be.true(`${iso(d)}: default ${label} has no rows yet`);
          if (firstRows(start + 1) <= d) {
            (d.getMonth() + 1).should.equal(LAG_MONTH[kind], `${iso(d)}: ${label} is not the latest with rows`);
          }
          if (!what && !HOOPR_DIFFERS[league].includes(d.getMonth() + 1)) label.should.equal(hooprCurrent(league, d), iso(d));
        }
      });
    }
  }
});

// date -> NBA, G League, WNBA, Summer League, draft combine (py _TABLE)
const TABLE = [
  [[2026, 1, 15], '2025-26', '2025-26', '2025', '2025-26', '2025-26'],
  [[2026, 5, 31], '2025-26', '2025-26', '2025', '2025-26', '2025-26'],
  [[2026, 6, 1], '2025-26', '2025-26', '2026', '2025-26', '2026-27'],
  [[2026, 7, 31], '2025-26', '2025-26', '2026', '2025-26', '2026-27'],
  [[2026, 8, 1], '2025-26', '2025-26', '2026', '2026-27', '2026-27'],
  [[2026, 10, 5], '2025-26', '2025-26', '2026', '2026-27', '2026-27'],
  [[2026, 10, 31], '2025-26', '2025-26', '2026', '2026-27', '2026-27'],
  [[2026, 11, 1], '2026-27', '2025-26', '2026', '2026-27', '2026-27'],
  [[2026, 12, 31], '2026-27', '2025-26', '2026', '2026-27', '2026-27'],
  [[2027, 1, 1], '2026-27', '2026-27', '2026', '2026-27', '2026-27'],
  [[1999, 11, 1], '1999-00', '1998-99', '1999', '1999-00', '1999-00'],
  [[2008, 6, 1], '2007-08', '2007-08', '2008', '2007-08', '2008-09'],
];

describe('nba_stats / wnba_stats wrappers send the latest season with rows', () => {
  afterEach(restoreDate);
  for (const [day, nba, gleague, wnba, summer, combine] of TABLE) {
    it(day.join('-'), () => {
      on(...day);
      String(season_latest_with_data(undefined, { api: 'nba_stats' })).should.equal(nba);
      String(season_latest_with_data(null, { api: 'wnba_stats' })).should.equal(wnba);
      sent('nba_stats', 'playergamelogs').Season.should.equal(nba);
      sent('nba_stats', 'commonteamroster').Season.should.equal(nba);
      sent('nba_stats', 'leaguedashteamstats').Season.should.equal(nba); // was every season summed
      sent('nba_stats', 'leaguedashplayerstats', { league_id: '20' }).Season.should.equal(gleague);
      sent('nba_stats', 'leaguedashplayerstats', { leagueId: '15' }).Season.should.equal(summer);
      sent('nba_stats', 'draftcombinestats').SeasonYear.should.equal(combine);
      sent('wnba_stats', 'playergamelogs').Season.should.equal(wnba);
      sent('wnba_stats', 'playerdashptshotdefend').Season.should.equal(wnba);
      sent('wnba_stats', 'leaguedashteamstats').Season.should.equal(wnba);
    });
  }

  // One wrapper per SeasonType argument name; each sends the wire key `SeasonType`.
  const SEASON_TYPE_ARGS = [
    ['leaguedashplayerstats', 'season_type_all_star'],
    ['leaguegamefinder', 'season_type_nullable'],
    ['leaderstiles', 'season_type_playoffs'],
    ['assisttracker', 'season_type_all_star_nullable'],
    ['playerestimatedmetrics', 'season_type'],
  ];
  for (const seasonType of ['Playoffs', 'PlayIn', 'All Star']) {
    it(`a ${seasonType} season type defaults to one that has been played`, () => {
      on(2027, 2, 1); // 2026-27 under way, its All-Star and playoffs not
      for (const [short, arg] of SEASON_TYPE_ARGS) {
        sent('nba_stats', short).Season.should.equal('2026-27', short);
        sent('nba_stats', short, { [arg]: seasonType }).Season.should.equal('2025-26', `${short} ${arg}`);
      }
    });
  }

  it('season type rollover per league', () => {
    on(2027, 2, 1);
    sent('nba_stats', 'commonplayoffseries').Season.should.equal('2025-26');
    sent('nba_stats', 'commonplayoffseries', { league_id: '20' }).Season.should.equal('2025-26');
    const gleague = { league_id: '20', season_type_all_star: 'Playoffs' };
    sent('nba_stats', 'leaguegamelog', gleague).Season.should.equal('2025-26');
    gleague.season_type_all_star = 'All Star'; // no G League All-Star rows: its regular rule
    sent('nba_stats', 'leaguegamelog', gleague).Season.should.equal('2026-27');
    on(2027, 7, 1); // WNBA 2027 under way, its playoffs not
    sent('wnba_stats', 'commonplayoffseries').Season.should.equal('2026');
    sent('wnba_stats', 'leaguedashplayerstats').Season.should.equal('2027');
    sent('wnba_stats', 'leaguedashplayerstats', { season_type_all_star: 'Playoffs' }).Season.should.equal('2026');
    sent('wnba_stats', 'leaguedashplayerstats', { season_type_all_star: 'All Star' }).Season.should.equal('2026');
    on(2027, 8, 1); // WNBA 2027 All-Star played
    sent('wnba_stats', 'leaguedashplayerstats', { season_type_all_star: 'All Star' }).Season.should.equal('2027');
  });

  it('drafts default to the latest draft, as a year', () => {
    on(2026, 6, 30); // NBA draft late June, WNBA mid-April
    sent('nba_stats', 'drafthistory').Season.should.equal('2025');
    sent('wnba_stats', 'drafthistory').Season.should.equal('2026');
    on(2026, 7, 1);
    sent('nba_stats', 'drafthistory').Season.should.equal('2026');
    // the combine rule holds for whichever league asks
    sent('nba_stats', 'draftcombinestats', { league_id: '20' }).SeasonYear.should.equal('2026-27');
  });

  it('an explicit season wins; an explicit "" is sent empty (every season)', () => {
    on(2026, 10, 5);
    sent('nba_stats', 'playergamelogs', { season_nullable: '2023-24' }).Season.should.equal('2023-24');
    // never re-dated, even for a league whose default differs
    sent('nba_stats', 'leaguedashplayerstats', { league_id: '15', season: '2025-26' }).Season.should.equal('2025-26');
    season_latest_with_data('', { api: 'nba_stats' }).should.equal('');
    sent('nba_stats', 'playergamelogs', { season_nullable: '' }).Season.should.equal('');
    sent('nba_stats', 'leaguedashteamstats', { season: '' }).Season.should.equal('');
    sent('wnba_stats', 'leaguedashteamstats', { season: '' }).Season.should.equal('');
  });

  it('every endpoint with a Season / SeasonYear argument sends a season', () => {
    let n = 0;
    for (const stem of ['nba_stats', 'wnba_stats']) {
      const doc = parse(readFileSync(join(here, '..', 'tools/codegen/endpoints', `${stem}.yaml`), 'utf8'));
      for (const ep of doc.endpoints) {
        const keys = (ep.extra_params ?? []).map((p) => p.query_key).filter((k) => k === 'Season' || k === 'SeasonYear');
        if (!keys.length) continue;
        n++;
        const q = sent(stem, ep.short);
        keys.some((k) => q[k]).should.be.true(`${stem}_${ep.short} sends no ${keys.join('/')}`);
        for (const k of keys) if (q[k] !== undefined) q[k].should.be.a.String(); // re-dated, not a DefaultSeason
      }
    }
    n.should.be.above(150);
  });

  it('the playground copy re-dates the same way', () => {
    on(2027, 2, 1);
    const pg = (api, short, params) => playgroundResolveFlat(def(api, short), params).query.Season;
    pg('nba_stats', 'leaguegamelog', { league_id: '20', season_type_all_star: 'Playoffs' }).should.equal('2025-26');
    pg('nba_stats', 'leaguegamelog', { league_id: '20' }).should.equal('2026-27');
    pg('wnba_stats', 'leaguedashplayerstats', {}).should.equal('2026');
  });
});

describe('nba_stats wrappers: the re-dated season reaches the wire', () => {
  afterEach(() => {
    restoreDate();
    resetConfig();
  });

  it('G League default, and an explicit "" as Season=', async () => {
    const calls = [];
    const ok = JSON.stringify({ resultSets: [{ name: 'A', headers: ['X'], rowSet: [[1]] }] });
    configure({ transport: { nba_stats: async (req) => (calls.push(req), { status: 200, headers: {}, url: req.url, data: ok }) } });
    on(2027, 2, 1);
    await sdv.nba.nba_stats_leaguegamelog({ league_id: '20', season_type_all_star: 'Playoffs' });
    await sdv.nba.nba_stats_leaguedashteamstats({ season: '' });
    calls[0].query.Season.should.equal('2025-26');
    calls[1].query.Season.should.equal('');
  });
});

import should from 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse_hockeytech_seasons } from '../../dist/parsers/hockeytech.js';
import { HOCKEYTECH_LEAGUES, mostRecentHockeytechSeason, resolveSeasonId } from '../../dist/core/hockeytech_runtime.js';
import { configure, resetConfig } from '../../dist/core/config.js';

// Season names -> end year, checked on every league's real seasons feed. Port of sdv-py
// tests/hockeytech/test_season_names.py (#694), on the same fixtures: the `modulekit/seasons`
// replies of all 20 leagues (test/fixtures/hockeytech/seasons/, copied from sdv-py; 18 live
// 2026-10-05, AHL trimmed from 2026-07-12, PWHL through id 10 from 2026-06-09). The feed's own
// dates are the oracle: a regular season or playoffs ends in its end year, a one-year-named
// preseason or exhibition starts the year before it.

const here = dirname(fileURLToPath(import.meta.url));
const fixDir = join(here, '..', 'fixtures', 'hockeytech', 'seasons');
const LEAGUES = Object.keys(HOCKEYTECH_LEAGUES).sort();
const seasons = (lg) => JSON.parse(readFileSync(join(fixDir, `${lg}.json`), 'utf8'));
const parse = (payload) => parse_hockeytech_seasons(payload);
const one = (name, extra = {}) => parse({ SiteKit: { Seasons: [{ season_id: '1', season_name: name, ...extra }] } })[0];

// The same patterns py's tests use (py SPECIAL_EVENT_SEASON_RE / TWO_YEAR_NAME_RE).
const SPECIAL = /all[- ]?star|showcase|prospect|combine|special event|exhibition|play[- ]?in\b/i;
const TWO_YEAR = /\d{2}\s*[-/]\s*\d{2}/;
const CAMP = ['preseason', 'exhibition'];
// Rows whose name and dates disagree at the source: "CCHL Playoffs 2022" ran March-May 2023,
// and MJHL's "2015 Playoffs" runs 2015-03-04 to 2016-04-30 on the feed.
const FEED_DATE_ANOMALIES = new Set(['cchl|CCHL Playoffs 2022', 'mjhl|2015 Playoffs']);

/** Serve `payload` as every hockeytech seasons reply (py's monkeypatched `_fetch_seasons_raw`). */
function serve(payload) {
  configure({
    retries: 0,
    transport: { hockeytech: async (req) => ({ status: 200, headers: {}, url: req.url, data: JSON.stringify(payload) }) },
  });
}

describe('hockeytech seasons: every name form (py test_derive_season_year_every_name_form)', () => {
  const cases = [
    ['2025-26 Regular Season', 2026],
    ['1999-00 Regular Season', 2000],
    ['2025/26 Regular Season', 2026], // KIJHL: was 2025
    ['2025-2026 Regular Season', 2026], // AJHL, SPHL, VIJHL: was 2120
    ['1999-2000 WHL Season', 2000], // was 2020
    ['2026 - 27 Regular Season', 2027], // WHL: was 2026
    ['2026 - 2027 Preseason', 2027], // OJHL: was 2026
    ['OJHL 2019/2020', 2020], // was 2019
    ['2026-27 | Regular Season', 2027], // QMJHL
    ['26-27 Regular Season', 2027], // OJHL: was null
    ['98-99 Regular Season', 1999], // 2099 is not a season yet
    ['CCHL 2425 Special Events', 2025], // was 2425
    ['CCHL 2324 ALL-STAR GAMES', 2024], // was 2324
    ['2026 Playoffs', 2026],
    ['OJHL Playoffs - 2026', 2026],
    ['Season 2099', null],
    ['3025-26 Regular Season', null],
    ['19 Tie Break', null],
    ['Eastern Canada Cup', null],
  ];
  for (const [name, year] of cases) {
    it(`${name} -> ${year}`, () => should(one(name).season_yr).equal(year));
  }
});

describe('hockeytech seasons: game type label (py test_game_type_label)', () => {
  const cases = [
    ['2026-27 Regular Season', 'regular'],
    ['2026 Memorial Cup', 'regular'],
    ['2026 Pre-season', 'preseason'],
    ['2025-26 Preseason Exhibition', 'preseason'], // SJHL: a preseason first
    ['2026 Calder Cup Playoffs', 'playoffs'],
    ['2026 Exhibition Season', 'exhibition'], // AJHL: was regular
    ['2026-2027 Exhibition Schedule', 'exhibition'], // VIJHL: was regular
  ];
  for (const [name, label] of cases) {
    it(`${name} -> ${label}`, () => one(name).game_type_label.should.equal(label));
  }
});

describe('hockeytech seasons: season_yr agrees with the feed dates (all 20 leagues)', () => {
  it('has the 20 fixtures', () => LEAGUES.length.should.equal(20));
  for (const lg of LEAGUES) {
    it(lg, () => {
      const rows = parse(seasons(lg));
      rows.length.should.be.above(0);
      let checked = 0;
      for (const r of rows) {
        const name = r.season_name;
        const yr = r.season_yr;
        should(yr === null || Number.isInteger(yr)).be.true(name); // py: Int64
        const m = /(?<!\d)(\d{4}|\d{2})\s*[-/]\s*(?:\d{4}|\d{2})(?!\d)/.exec(name);
        if (m) {
          // a two-year name ends the year after it starts
          const start = Number(m[1]);
          should(yr).equal((start > 99 ? start : 2000 + start) + 1, name);
        }
        if (yr === null || !/^\d{4}/.test(r.end_date ?? '') || FEED_DATE_ANOMALIES.has(`${lg}|${name}`)) continue;
        if (CAMP.includes(r.game_type_label)) {
          if (!m) yr.should.equal(Number(r.start_date.slice(0, 4)) + 1, name); // the season the camp opens
        } else if (SPECIAL.test(name)) {
          continue;
        } else {
          yr.should.equal(Number(r.end_date.slice(0, 4)), name);
        }
        checked += 1;
      }
      checked.should.be.above(0);
    });
  }
});

describe('hockeytech seasons: camp rows belong to the season they open', () => {
  const cases = [
    ['ajhl', '2026 Exhibition Season', 2027, 'exhibition'], // starts 2026-08-30: was 2026
    ['mhl', '2026-27 MHL Exhibition Season', 2027, 'exhibition'],
    ['mjhl', '2026-27 Exhibition Season', 2027, 'exhibition'],
    ['vijhl', '2026-2027 Exhibition Schedule', 2027, 'exhibition'],
    ['kijhl', '2025/26 Exhibition', 2026, 'exhibition'],
    ['ahl', '2017-18 Exhibition', 2018, 'exhibition'], // two-year name starting 2018-02-13: not moved
    ['ohl', '2026 Pre-season', 2027, 'preseason'],
    ['pwhl', '2024 Preseason', 2024, 'preseason'], // began 2023-11-01
  ];
  for (const [lg, name, year, label] of cases) {
    it(`${lg}: ${name} -> ${year} ${label}`, () => {
      const r = parse(seasons(lg)).find((x) => x.season_name === name);
      [r.season_yr, r.game_type_label].should.eql([year, label]);
    });
  }

  it('a two-year preseason name is never moved by its dates', () => {
    one('2026-27 Preseason', { start_date: '2027-01-05' }).season_yr.should.equal(2027);
  });
});

describe('hockeytech seasons: every resolved season is that season (all 20 leagues)', () => {
  afterEach(() => resetConfig());
  for (const lg of LEAGUES) {
    it(lg, async () => {
      const payload = seasons(lg);
      serve(payload);
      const parsed = parse(payload);
      const byId = new Map(parsed.map((r) => [Number(r.season_id), r]));
      const years = [...new Set(parsed.map((r) => r.season_yr).filter((y) => y !== null))].sort();
      let resolved = 0;
      for (const yr of years) {
        for (const gameType of ['regular', 'playoffs', ...CAMP]) {
          let r;
          try {
            r = byId.get(await resolveSeasonId(lg, { season: yr, gameType }));
          } catch (e) {
            if (/^No /.test(e.message)) continue; // no such season
            throw e;
          }
          if (!r) continue; // PWHL's fallback table
          resolved += 1;
          const name = r.season_name;
          if (gameType === 'regular' && lg !== 'chl') {
            name.should.match(/regular season|season|\d{2}\s*[-/]\s*\d{2}/i, `${yr} ${name}`);
          }
          if (FEED_DATE_ANOMALIES.has(`${lg}|${name}`) || !/^\d{4}/.test(r.end_date ?? '')) continue;
          let dated;
          if (CAMP.includes(gameType)) {
            if (TWO_YEAR.test(name)) continue;
            dated = Number(r.start_date.slice(0, 4)) + 1;
          } else {
            dated = Number(r.end_date.slice(0, 4));
          }
          dated.should.equal(yr, `${yr} ${gameType} ${name}`);
        }
      }
      resolved.should.be.above(0);
    });
  }
});

describe('hockeytech seasons: the default season (newest regular season)', () => {
  afterEach(() => resetConfig());

  for (const lg of LEAGUES) {
    it(`${lg}: most recent season is 2026 or 2027 and resolves`, async () => {
      serve(seasons(lg));
      const yr = await mostRecentHockeytechSeason(lg);
      [2026, 2027].should.containEql(yr);
      (await resolveSeasonId(lg, { season: yr })).should.be.above(0);
    });
  }

  // Rebuild the feed as it stood when each preseason / exhibition row was added (every row with a
  // season_id up to its own) and resolve the default season. The feed lists the camp first ("2026
  // Preseason", id 77, before "2026-27 Regular Season", id 78, in ECHL), and a default taken from
  // every row named a 2027 that had no regular season yet.
  for (const lg of LEAGUES) {
    it(`${lg}: the default resolves while a camp precedes its regular season`, async () => {
      const rows = seasons(lg).SiteKit.Seasons;
      const camps = parse({ SiteKit: { Seasons: rows } }).filter((r) => CAMP.includes(r.game_type_label));
      let windows = 0;
      for (const camp of camps) {
        const cut = Number(camp.season_id);
        const payload = { SiteKit: { Seasons: rows.filter((r) => Number(r.season_id) <= cut) } };
        const regular = parse(payload).filter((r) => r.game_type_label === 'regular' && !SPECIAL.test(r.season_name));
        if (!regular.length) continue; // MJHL's "2017-18 Pre-season" is id 1: nothing to default to
        serve(payload);
        await resolveSeasonId(lg, { season: await mostRecentHockeytechSeason(lg) });
        windows += 1;
      }
      // the trimmed July AHL capture keeps no row older than its 2017-18 exhibition (id 58)
      should(windows > 0 || lg === 'ahl' || camps.length === 0).be.true();
    });
  }

  it('ECHL cut at "2026 Preseason" (id 77): the default is 2026 and resolves to 2025-26', async () => {
    const rows = seasons('echl').SiteKit.Seasons.filter((r) => Number(r.season_id) <= 77);
    serve({ SiteKit: { Seasons: rows } });
    (await mostRecentHockeytechSeason('echl')).should.equal(2026);
    const regular202526 = Number(rows.find((r) => r.season_name === '2025-26 Regular Season').season_id);
    (await resolveSeasonId('echl', { season: 2026 })).should.equal(regular202526);
  });

  it('PWHL capture ending at the 2026-27 preseason (id 10): the default is 2026', async () => {
    serve(seasons('pwhl'));
    (await mostRecentHockeytechSeason('pwhl')).should.equal(2026);
  });
});

describe('hockeytech seasons: resolveSeasonId picks the season (py test_resolve_season_id_picks_the_season)', () => {
  afterEach(() => resetConfig());
  const cases = [
    ['ajhl', 2026, 'regular', '2025-2026 Regular Season'], // was an error
    ['ajhl', 2025, 'playoffs', '2024-2025 Playoffs'],
    ['ajhl', 2027, 'exhibition', '2026 Exhibition Season'],
    ['sphl', 2026, 'regular', '2025-2026 Regular Season'],
    ['gojhl', 2026, 'regular', '2025-2026 GOHL Season'],
    ['vijhl', 2024, 'regular', '2023-2024 VIJHL Regular Season'],
    ['vijhl', 2026, 'playoffs', '2025-2026 VIJHL Playoffs'],
    ['cchl', 2024, 'regular', 'CCHL 2023-2024'],
    ['cchl', 2022, 'playoffs', 'CCHL Playoffs 2021-22'], // not "CCHL Playoffs 2022" (2023)
    ['ojhl', 2027, 'regular', '26-27 Regular Season'],
    ['ojhl', 2025, 'regular', '2024-2025 Regular Season'], // not "2025 Cottage Cup"
    ['ojhl', 2023, 'regular', 'OJHL 22-23'],
    ['ojhl', 2010, 'regular', 'OJAHL 2009/2010'], // not the CCHL's, listed first in OJHL's feed
    ['ojhl', 2010, 'playoffs', 'OJAHL Playoffs 2010'],
    ['whl', 2026, 'regular', '2025 - 26 Regular Season'], // was 2026-27
    ['kijhl', 2026, 'regular', '2025/26 Regular Season'], // was 2026/27
    ['kijhl', 2025, 'regular', '2024/25 Regular Season'], // not "2025 Mowat Cup"
    ['mjhl', 2019, 'regular', '2018-19 Regular Season'], // not "2019 ANAVET Cup"
    ['gojhl', 2027, 'preseason', '2026 GOHL Pre-Season'], // was 2026
    ['ohl', 2027, 'preseason', '2026 Pre-season'],
    ['pwhl', 2024, 'preseason', '2024 Preseason'], // began 2023-11-01: stays 2024
    ['pwhl', 2024, 'regular', '2024 Regular Season'],
    ['chl', 2026, 'regular', '2026 Memorial Cup'], // single-year seasons still resolve
    ['ahl', 2026, 'regular', '2025-26 Regular Season'], // not "2026 All-Star Challenge" (91)
    // Divisions side by side, no marker between them: feed order, documented, not chosen.
    ['bchl', 2024, 'regular', '2023-24 BC Regular Season'],
    ['bchl', 2024, 'playoffs', '2024 AB Playoffs'],
  ];
  for (const [lg, season, gameType, expected] of cases) {
    it(`${lg} ${season} ${gameType} -> ${expected}`, async () => {
      const payload = seasons(lg);
      serve(payload);
      const names = new Map(payload.SiteKit.Seasons.map((s) => [Number(s.season_id), s.season_name]));
      const picked = names.get(await resolveSeasonId(lg, { season, gameType }));
      should(picked).equal(expected);
      should(CAMP.includes(gameType) || !SPECIAL.test(picked)).be.true();
    });
  }

  it('AHL ids from the py fixture: 2026 -> 90, 2025 -> 86, 2026 playoffs -> 92, 2027 -> 94', async () => {
    serve(seasons('ahl'));
    (await resolveSeasonId('ahl', { season: 2026 })).should.equal(90);
    (await resolveSeasonId('ahl', { season: 2025 })).should.equal(86);
    (await resolveSeasonId('ahl', { season: 2026, gameType: 'playoffs' })).should.equal(92);
    (await resolveSeasonId('ahl', { season: 2027 })).should.equal(94);
  });

  it('a name that says "Regular Season" outranks a two-year event (constructed: no feed has this tie)', async () => {
    serve({
      SiteKit: {
        Seasons: [
          { season_id: '2', season_name: '2023-24 Hockey Canada Cup' },
          { season_id: '1', season_name: '2024 Regular Season' },
        ],
      },
    });
    (await resolveSeasonId('sjhl', { season: 2024 })).should.equal(1);
  });

  it('PWHL fallback table matches every row of the real capture and adds 2026-27 (id 11)', async () => {
    const rows = parse(seasons('pwhl'));
    rows.length.should.equal(10);
    configure({ retries: 0, transport: { hockeytech: async (req) => ({ status: 200, headers: {}, url: req.url, data: '<html>oops</html>' }) } });
    for (const r of rows) {
      // failed fetch -> the table alone answers
      (await resolveSeasonId('pwhl', { season: r.season_yr, gameType: r.game_type_label })).should.equal(Number(r.season_id), r.season_name);
    }
    (await resolveSeasonId('pwhl', { season: 2027 })).should.equal(11);
  });
});

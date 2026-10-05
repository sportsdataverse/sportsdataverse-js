import should from 'should';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv from '../../dist/index.js';
import * as P from '../../dist/producers/espn_basketball_box.js';

// Parity: all eight helpers (helper_<lg>_player_box / helper_<lg>_team_box, lg = nba wnba mbb
// wbb) run on every payload and are compared to sdv-py@719de79's own output
// (tools/parity/espn_basketball_box_oracle.py -> basketball_box/oracle.json.gz): row count,
// column names AND order, each value's type against py's polars dtype, and every cell strictly.
// Payloads: the REAL captures in test/fixtures/espn/basketball_box/ (+ summary_nba.json), and
// labelled `derived` payloads (a real capture with one documented mutation) for gate branches
// no capture reaches.
const ESPN = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'espn');
const read = (p) => JSON.parse((p.endsWith('.gz') ? gunzipSync(readFileSync(p)) : readFileSync(p)).toString('utf8'));
const O = read(join(ESPN, 'basketball_box', 'oracle.json.gz'));
const capture = (name) => read(name === 'summary_nba.json' ? join(ESPN, name) : join(ESPN, 'basketball_box', name));
const HELPERS = ['nba', 'wnba', 'mbb', 'wbb'].flatMap((lg) => [`helper_${lg}_player_box`, `helper_${lg}_team_box`]);

const DATETIME_NY = "Datetime(time_unit='us', time_zone='America/New_York')";

/** Does a non-null JS value have the JS shape of a polars dtype? */
function dtypeOk(v, dtype) {
  if (/^U?Int\d+$/.test(dtype)) return Number.isInteger(v);
  if (/^Float\d+$/.test(dtype)) return typeof v === 'number';
  if (dtype === 'String') return typeof v === 'string';
  if (dtype === 'Boolean') return typeof v === 'boolean';
  // Date / Datetime decode to JS Date, as the release loaders (hyparquet) decode them.
  if (dtype === 'Date' || dtype === DATETIME_NY) return v instanceof Date && !Number.isNaN(v.getTime());
  if (dtype === 'Null') return false; // py has no value anywhere in the column
  throw new Error(`unknown polars dtype ${dtype}`);
}

/**
 * An oracle cell as the JS value it must equal: py `isoformat()` strings in Date / Datetime
 * columns -> Date (a date-only ISO string parses as UTC midnight, the DATE convention);
 * `{"__float__": "nan" | "inf" | "-inf"}` (non-JSON floats) -> NaN / +-Infinity.
 */
function pyCell(v, dtype) {
  if (v !== null && typeof v === 'object' && '__float__' in v) {
    return { nan: NaN, inf: Infinity, '-inf': -Infinity }[v.__float__];
  }
  return v !== null && (dtype === 'Date' || dtype === DATETIME_NY) ? new Date(v) : v;
}

function expectFrame(fn, payload, want, label) {
  if (want.raises) {
    (() => fn(payload)).should.throw(undefined, `${label}: py raises ${want.raises}`);
    return;
  }
  const rows = fn(payload);
  rows.length.should.equal(want.rows.length, `${label}: row count`);
  if (!rows.length) return want.columns.should.eql([], `${label}: py's empty frame has no columns`);
  rows.forEach((r, i) => Object.keys(r).should.eql(want.columns, `${label}[${i}]: column names/order`));
  want.columns.forEach((c, k) => {
    const bad = rows.find((r) => r[c] !== null && !dtypeOk(r[c], want.dtypes[k]));
    assert.equal(bad?.[c], undefined, `${label}.${c}: JS value does not fit py dtype ${want.dtypes[k]}`);
  });
  rows.forEach((r, i) =>
    want.columns.forEach((c, k) =>
      assert.deepStrictEqual(r[c], pyCell(want.rows[i][c], want.dtypes[k]), `${label}[${i}].${c}`)
    )
  );
}

describe('ESPN basketball box oracle covers exactly the committed captures', () => {
  it('fixture files == oracle capture keys (a capture added without regenerating fails here)', () => {
    const files = readdirSync(join(ESPN, 'basketball_box')).filter((f) => f.endsWith('.json.gz') && f !== 'oracle.json.gz');
    Object.keys(O.captures).sort().should.eql([...files, 'summary_nba.json'].sort());
  });
});

describe('ESPN basketball box producers vs the sdv-py oracle (real captures)', () => {
  for (const [name, outs] of Object.entries(O.captures)) {
    it(name, () => {
      const payload = capture(name);
      for (const h of HELPERS) expectFrame(P[h], payload, outs[h], `${name} ${h}`);
    });
  }
});

describe('ESPN basketball box producers vs the sdv-py oracle (derived gate payloads)', () => {
  for (const [name, c] of Object.entries(O.derived)) {
    it(`${name}: ${c.mutation} (from ${c.from})`, () => {
      for (const h of HELPERS) expectFrame(P[h], c.input, c.out[h], `derived ${name} ${h}`);
    });
  }
});

describe('ESPN basketball box league facts', () => {
  const nba = capture('summary_nba.json');
  it('known-positive control: every helper yields rows on each full league capture', () => {
    for (const n of ['summary_nba.json', 'summary_wnba.json.gz', 'summary_mbb.json.gz', 'summary_wbb.json.gz']) {
      for (const h of HELPERS) O.captures[n][h].rows.length.should.be.above(0, `${n} ${h}`);
    }
  });
  it('plus_minus: NBA/WNBA keep it (a string, after fouls); MBB/WBB drop it', () => {
    for (const h of ['helper_nba_player_box', 'helper_wnba_player_box']) {
      const cols = Object.keys(P[h](nba)[0]);
      cols[cols.indexOf('fouls') + 1].should.equal('plus_minus');
      P[h](nba).some((r) => typeof r.plus_minus === 'string' && /^[+-]\d+$/.test(r.plus_minus)).should.be.true();
    }
    for (const h of ['helper_mbb_player_box', 'helper_wbb_player_box']) Object.keys(P[h](nba)[0]).should.not.containEql('plus_minus');
  });
  it('MBB orders `active` last; WBB keeps it after did_not_play/reason', () => {
    Object.keys(P.helper_mbb_player_box(nba)[0]).at(-1).should.equal('active');
    const w = Object.keys(P.helper_wbb_player_box(nba)[0]);
    w.slice(w.indexOf('active') - 2, w.indexOf('active')).should.eql(['did_not_play', 'reason']);
  });
  it('both-teams gate on a REAL one-sided payload: strict (MBB/WBB) skips, lax (NBA/WNBA) publishes team 1', () => {
    const one = capture('mbb_final_303173134.json.gz'); // 2010 MBB vs a non-D1 opponent: no team-2 athletes
    P.helper_mbb_player_box(one).should.eql([]);
    P.helper_wbb_player_box(one).should.eql([]);
    for (const h of ['helper_nba_player_box', 'helper_wnba_player_box']) {
      const rows = P[h](one);
      rows.length.should.equal(21);
      new Set(rows.map((r) => r.team_id)).should.eql(new Set([2443]));
    }
  });
  it('ids are numbers (py Int32), never strings', () => {
    for (const r of [...P.helper_nba_player_box(nba), ...P.helper_nba_team_box(nba)]) {
      for (const k of Object.keys(r).filter((c) => c.endsWith('_id'))) r[k].should.be.a.Number();
    }
  });
  it('date columns are JS Dates like the release loaders: the instant, and the New York date at UTC midnight', () => {
    // MBB event 401638645 tips at 2024-04-09T01:20Z = 2024-04-08 21:20 EDT.
    const mbb = capture('summary_mbb.json.gz');
    for (const rows of [P.helper_mbb_player_box(mbb), P.helper_mbb_team_box(mbb)]) {
      for (const r of rows) {
        r.game_date_time.should.be.instanceof(Date);
        r.game_date.should.be.instanceof(Date);
        r.game_date_time.getTime().should.equal(Date.UTC(2024, 3, 9, 1, 20));
        r.game_date.getTime().should.equal(Date.UTC(2024, 3, 8));
      }
      rows[0].game_date.should.not.equal(rows[1].game_date); // one Date per row, not shared
    }
  });
  it('is on sdv.<lg> under py and camelCase names', () => {
    for (const lg of ['nba', 'wnba', 'mbb', 'wbb']) {
      for (const kind of ['player', 'team']) {
        const fn = P[`helper_${lg}_${kind}_box`];
        sdv[lg][`helper_${lg}_${kind}_box`].should.equal(fn);
        sdv[lg][`helper${lg[0].toUpperCase()}${lg.slice(1)}${kind[0].toUpperCase()}${kind.slice(1)}Box`].should.equal(fn);
      }
    }
  });
});

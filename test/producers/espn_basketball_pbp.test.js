import should from 'should';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv, { configure, resetConfig } from '../../dist/index.js';
import * as P from '../../dist/producers/espn_basketball_pbp.js';
import { _warn } from '../../dist/core/releases.js';

// Parity: espn_<lg>_pbp's trimming + helper_<lg>_pbp (and the stage helpers' init) for every
// league on every payload, compared to sdv-py@719de79's own output
// (tools/parity/espn_basketball_pbp_oracle.py -> basketball_pbp/oracle.json.gz): plays column
// names AND order, each value's type against py's polars dtype, every cell strictly; the timeouts
// map; every other output key; the raw (trimmed) payload; init. Payloads: the REAL captures in
// test/fixtures/espn/basketball_box/ + basketball_pbp/ (+ summary_nba.json), and labelled
// `derived` payloads (a real capture with one documented mutation) for branches no capture reaches.
const ESPN = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'espn');
const read = (p) => JSON.parse((p.endsWith('.gz') ? gunzipSync(readFileSync(p)) : readFileSync(p)).toString('utf8'));
const O = read(join(ESPN, 'basketball_pbp', 'oracle.json.gz'));
const DIRS = ['basketball_box', 'basketball_pbp'];
const capture = (name) =>
  read(name === 'summary_nba.json' ? join(ESPN, name) : join(ESPN, DIRS.find((d) => readdirSync(join(ESPN, d)).includes(name)), name));
const LEAGUES = ['nba', 'wnba', 'mbb', 'wbb'];

/** Oracle markers -> JS values: {"__int__"} (beyond 2^53) -> BigInt, {"__float__"} -> NaN / +-Infinity. */
function decode(v) {
  if (Array.isArray(v)) return v.map(decode);
  if (v !== null && typeof v === 'object') {
    if ('__int__' in v) return BigInt(v.__int__);
    if ('__float__' in v) return { nan: NaN, inf: Infinity, '-inf': -Infinity }[v.__float__];
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decode(x)]));
  }
  return v;
}

/** Does a non-null JS value have the JS shape of a polars dtype? */
function dtypeOk(v, dtype) {
  if (dtype === 'Int64') return Number.isInteger(v) || typeof v === 'bigint';
  if (/^U?Int\d+$/.test(dtype)) return Number.isInteger(v);
  if (dtype === 'Float32') return typeof v === 'number' && (Number.isNaN(v) || Math.fround(v) === v);
  if (dtype === 'Float64') return typeof v === 'number';
  if (dtype === 'String') return typeof v === 'string';
  if (dtype === 'Boolean') return typeof v === 'boolean';
  if (dtype === 'Null') return false;
  throw new Error(`unknown polars dtype ${dtype}`);
}

/** The INT64 policy applied to py's column: all BigInt when any value is beyond 2^53, else numbers. */
const int64Column = (vals) => (vals.some((v) => typeof v === 'bigint') ? vals.map((v) => (v === null ? null : BigInt(v))) : vals);

function expectPlays(rows, want, label) {
  rows.length.should.equal(want.rows.length, `${label}: row count`);
  if (!rows.length) return want.columns.should.eql([], `${label}: py's empty frame`);
  rows.forEach((r, i) => Object.keys(r).should.eql(want.columns, `${label}[${i}]: column names/order`));
  const idMode = { bigint: false };
  want.columns.forEach((c, k) => {
    let vals = want.rows.map((r) => decode(r[k]));
    if (want.dtypes[k] === 'Int64') vals = int64Column(vals);
    if (c === 'id') idMode.bigint = vals.some((v) => typeof v === 'bigint');
    const bad = rows.find((r) => r[c] !== null && !dtypeOk(r[c], want.dtypes[k]));
    assert.equal(bad?.[c], undefined, `${label}.${c}: JS value does not fit py dtype ${want.dtypes[k]}`);
    rows.forEach((r, i) => assert.deepStrictEqual(r[c], vals[i], `${label}[${i}].${c}`));
  });
  return idMode.bigint;
}

/** One league on one payload: raw trimming, the cleaned dict, and the stage helpers' init. */
function expectLeague(lg, payload, gameId, want, label) {
  const trimmed = P.espn_basketball_pbp_from_summary(lg, gameId, payload, true);
  Object.keys(trimmed).should.eql(want.raw.keys, `${label}: raw key order`);
  for (const [k, v] of Object.entries(want.raw.values)) {
    if (v.__same__) assert.deepStrictEqual(trimmed[k], payload[k], `${label}: raw.${k} is the capture's own`);
    else assert.deepStrictEqual(trimmed[k], decode(v), `${label}: raw.${k}`);
  }

  if (want.init.raises) {
    (() => P[`helper_${lg}_game_data`](trimmed, P[`helper_${lg}_pickcenter`](trimmed))).should.throw(
      undefined,
      `${label}: py raises ${want.init.raises} before init`
    );
  } else {
    const [txt, init] = P[`helper_${lg}_game_data`](trimmed, P[`helper_${lg}_pickcenter`](trimmed));
    assert.deepStrictEqual(init, decode(want.init.init), `${label}: init`);
    for (const [k, v] of Object.entries(want.init.pbp_txt)) assert.deepStrictEqual(txt[k], decode(v), `${label}: game_data pbp_txt.${k}`);
  }

  const run = () => P.espn_basketball_pbp_from_summary(lg, gameId, payload);
  if (want.out.raises) return run.should.throw(undefined, `${label}: py raises ${want.out.raises}`);
  const out = run();
  Object.keys(out).should.eql(want.out.keys, `${label}: output key order`);
  assert.deepStrictEqual(out.gameId, decode(want.out.gameId), `${label}: gameId`);
  const bigIds = expectPlays(out.plays, want.out.plays, `${label} plays`);
  // timeouts: py int keys -> JS string keys (JS orders integer keys itself); ids follow the id column.
  const tw = Object.fromEntries(
    want.out.timeouts.map(([k, v]) => [String(k), Object.fromEntries(Object.entries(v).map(([h, ids]) => [h, decode(ids).map((x) => (bigIds ? BigInt(x) : x))]))])
  );
  assert.deepStrictEqual(out.timeouts, tw, `${label}: timeouts`);
  for (const [k, v] of Object.entries(want.out.pass)) {
    if (v.__same__) assert.deepStrictEqual(out[k], payload[k], `${label}: ${k} is the capture's own`);
    else assert.deepStrictEqual(out[k], decode(v), `${label}: ${k}`);
  }
}

const quiet = () => {
  let emit;
  beforeEach(() => {
    emit = _warn.emit;
    _warn.emit = () => {};
  });
  afterEach(() => {
    _warn.emit = emit;
  });
};

describe('ESPN basketball pbp oracle covers exactly the committed captures', () => {
  it('fixture files == oracle capture keys (a capture added without regenerating fails here)', () => {
    const files = DIRS.flatMap((d) => readdirSync(join(ESPN, d)).filter((f) => f.endsWith('.json.gz') && f !== 'oracle.json.gz'));
    Object.keys(O.captures).sort().should.eql([...files, 'summary_nba.json'].sort());
  });
});

describe('ESPN basketball pbp producers vs the sdv-py oracle (real captures)', () => {
  quiet();
  for (const [name, c] of Object.entries(O.captures)) {
    it(name, () => {
      const payload = capture(name);
      for (const lg of LEAGUES) expectLeague(lg, payload, c.game_id, c[lg], `${name} ${lg}`);
    });
  }
});

describe('ESPN basketball pbp producers vs the sdv-py oracle (derived payloads)', () => {
  quiet();
  for (const [name, c] of Object.entries(O.derived)) {
    it(`${name}: ${c.mutation} (from ${c.from})`, () => {
      for (const lg of LEAGUES) expectLeague(lg, c.input, c.game_id, c.out[lg], `derived ${name} ${lg}`);
    });
  }
});

describe('ESPN basketball pbp league facts', () => {
  quiet();
  const run = (lg, name) => {
    const cap = capture(name);
    return P.espn_basketball_pbp_from_summary(lg, Number(cap.header.id), cap);
  };
  // py's end.* overrides fire on the FIRST play of the new period (lag == previous period).
  const firstOf = (rows, period) => rows.find((r) => r['period.number'] === period);

  it('known-positive control: each league yields plays on its own real games', () => {
    const own = {
      nba: ['summary_nba.json', 'nba_summary_401360428.json.gz'],
      wnba: ['summary_wnba.json.gz', 'wnba_summary_230614002.json.gz'],
      mbb: ['summary_mbb.json.gz', 'mbb_summary_401600379.json.gz'],
      wbb: ['summary_wbb.json.gz', 'wbb_summary_400787556.json.gz', 'wbb_summary_401587390.json.gz'],
    };
    for (const [lg, names] of Object.entries(own)) for (const n of names) run(lg, n).plays.length.should.be.above(250, `${lg} ${n}`);
  });

  it('NBA quarters ladder 720 / 1440 / 2160 / 2880; WNBA / WBB 600 / 1200 / 1800 / 2400 on the SAME plays', () => {
    for (const [lg, q] of [['nba', 720], ['wnba', 600], ['wbb', 600]]) {
      const rows = run(lg, 'summary_nba.json').plays;
      rows[0]['end.game_seconds_remaining'].should.equal(4 * q);
      firstOf(rows, 2)['end.game_seconds_remaining'].should.equal(3 * q);
      firstOf(rows, 3)['end.half_seconds_remaining'].should.equal(2 * q);
      firstOf(rows, 4)['end.quarter_seconds_remaining'].should.equal(q);
      firstOf(rows, 3).half.should.equal(2);
    }
  });

  it('WNBA 2003 plays halves (period IS the half); the same game as NBA / WBB-2024-era math differs', () => {
    const w = run('wnba', 'wnba_summary_230614002.json.gz').plays;
    firstOf(w, 2).half.should.equal(2);
    firstOf(w, 2)['end.half_seconds_remaining'].should.equal(1200);
    firstOf(w, 2)['end.game_seconds_remaining'].should.equal(1200);
    const n = run('nba', 'wnba_summary_230614002.json.gz').plays;
    firstOf(n, 2).half.should.equal(1); // NBA has no era logic: period 2 is still the first half
  });

  it('OT: the overtime period starts at 300 (NBA OT, WBB 4OT); MBB resets end.period only on 2 -> 3', () => {
    const nba = run('nba', 'nba_summary_401360428.json.gz').plays;
    firstOf(nba, 5)['end.quarter_seconds_remaining'].should.equal(300);
    const wbb = run('wbb', 'wbb_summary_401587390.json.gz').plays;
    for (const p of [5, 6, 7, 8]) firstOf(wbb, p)['end.game_seconds_remaining'].should.equal(300);
    const mbb = run('mbb', 'mbb_summary_401600379.json.gz').plays; // 2OT
    firstOf(mbb, 3)['end.period_seconds_remaining'].should.equal(300);
    firstOf(mbb, 4)['end.period_seconds_remaining'].should.not.equal(300); // py quirk, kept
    firstOf(mbb, 4)['end.game_seconds_remaining'].should.equal(300);
  });

  it('MBB columns: half = period, lag_period, period_seconds; no qtr / game_half / period; Int32 clock', () => {
    const cols = Object.keys(run('mbb', 'summary_mbb.json.gz').plays[0]);
    cols.should.containDeep(['half', 'lag_period', 'lead_period', 'start.period_seconds_remaining', 'end.period_seconds_remaining']);
    for (const c of ['qtr', 'game_half', 'period', 'lag_qtr', 'start.quarter_seconds_remaining']) cols.should.not.containEql(c);
    (() => run('mbb', 'summary_nba.json')).should.throw(/conversion to i32/); // "53.1": no "0:" prefix
    run('nba', 'summary_nba.json').plays.some((r) => r.time.startsWith('0:') && r['clock.seconds'] % 1 !== 0).should.be.true();
  });

  it('Float32 seconds: every step rounds to float32 like polars (NBA ((K + 60m) + s))', () => {
    const r = run('nba', 'summary_nba.json').plays.find((x) => x['clock.seconds'] === Math.fround(53.1));
    r['start.quarter_seconds_remaining'].should.equal(Math.fround(53.1));
    r['start.game_seconds_remaining'].should.not.equal(53.1);
  });

  it('INT64 policy: 18-digit MBB play ids stay BigInt with ONE warning; NBA ids are numbers', () => {
    const seen = [];
    _warn.emit = (m) => seen.push(m);
    const mbb = run('mbb', 'summary_mbb.json.gz');
    seen.length.should.equal(1);
    seen[0].should.match(/helper_mbb_pbp_features: column "id"/);
    mbb.plays.every((r) => typeof r.id === 'bigint').should.be.true();
    Object.values(mbb.timeouts).flatMap((h) => [...h['1'], ...h['2']]).every((x) => typeof x === 'bigint').should.be.true();
    run('nba', 'summary_nba.json').plays.every((r) => typeof r.id === 'number').should.be.true();
  });

  it('lag / lead / row numbers are per game: a concatenated two-game frame never leaks', () => {
    for (const [lg, a, b] of [
      ['mbb', 'summary_mbb.json.gz', 'mbb_summary_401600379.json.gz'],
      ['wbb', 'summary_wbb.json.gz', 'wbb_summary_401587390.json.gz'],
    ]) {
      const stageA = (name) => {
        const cap = capture(name);
        const t = P.espn_basketball_pbp_from_summary(lg, Number(cap.header.id), cap, true);
        const [txt, init] = P[`helper_${lg}_game_data`](t, P[`helper_${lg}_pickcenter`](t));
        return { f: P._playsFrame(lg, Number(cap.header.id), txt, init), init, v: P._variant(lg, txt) };
      };
      const one = (name) => {
        const s = stageA(name);
        return P._rows(P._features(s.f, s.init, s.v), 'x');
      };
      const [ra, rb] = [one(a), one(b)];
      const [sa, sb] = [stageA(a), stageA(b)];
      const both = { cols: [...new Set([...sa.f.cols, ...sb.f.cols])], rows: [...sa.f.rows, ...sb.f.rows] };
      const rows = P._rows(P._features(both, sa.init, sa.v), 'x');
      rows.length.should.equal(ra.length + rb.length);
      const skip = new Set(['homeTimeoutCalled', 'awayTimeoutCalled']); // team names are per call
      [...ra, ...rb].forEach((want, i) => {
        for (const c of Object.keys(want)) if (!skip.has(c)) assert.deepStrictEqual(rows[i][c], want[c], `${lg} row ${i}.${c}`);
      });
      rows[ra.length].game_play_number.should.equal(1);
      should(rows[ra.length].lag_half).be.null();
      should(rows[ra.length - 1].lead_half).be.null();
    }
  });

  it('is on sdv.<lg> under py and camelCase names (helpers + espn_<lg>_pbp)', () => {
    const camel = (s) => s.replace(/_([a-z0-9])/g, (_m, ch) => ch.toUpperCase());
    for (const lg of LEAGUES) {
      for (const stage of ['pbp', 'pickcenter', 'game_data', 'pbp_features']) {
        const name = `helper_${lg}_${stage}`;
        sdv[lg][name].should.equal(P[name]);
        sdv[lg][camel(name)].should.equal(P[name]);
      }
      sdv[lg][`espn_${lg}_pbp`].should.be.a.Function();
      sdv[lg][camel(`espn_${lg}_pbp`)].should.equal(sdv[lg][`espn_${lg}_pbp`]);
    }
  });

  describe('espn_<lg>_pbp fetches the summary through the ESPN site family', () => {
    afterEach(() => resetConfig());
    it('requests summary?event=<id> and returns helper_<lg>_pbp of it (raw: the trimmed payload)', async () => {
      const cap = capture('wbb_summary_401587390.json.gz');
      const calls = [];
      configure({ transport: async (req) => (calls.push(req), { status: 200, headers: {}, data: cap, url: req.url }) });
      const out = await sdv.wbb.espn_wbb_pbp(401587390);
      calls.length.should.equal(1);
      String(calls[0].url).should.match(/\/basketball\/womens-college-basketball\/summary/);
      String(calls[0].query.event).should.equal('401587390');
      assert.deepStrictEqual(out, P.espn_basketball_pbp_from_summary('wbb', 401587390, cap));
      assert.deepStrictEqual(await sdv.wbb.espn_wbb_pbp(401587390, { raw: true }), P.espn_basketball_pbp_from_summary('wbb', 401587390, cap, true));
    });
  });
});

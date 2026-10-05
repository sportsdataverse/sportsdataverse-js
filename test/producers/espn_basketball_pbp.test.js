import should from 'should';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv, * as root from '../../dist/index.js';
import * as P from '../../dist/producers/espn_basketball_pbp.js';
import { _warn } from '../../dist/core/releases.js';
import { isIdColumn } from '../../dist/core/int64.js';

// Parity: espn_<lg>_pbp's trimming + helper_<lg>_pbp (and the stage helpers' init) for every
// league on every payload, compared to sdv-py@3135873's own output (BASKETBALL_PBP_PIN)
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

/** Does a non-null JS value of column `col` have the JS shape of a polars dtype? (An integer id, any width, is a decimal string: the v4 id rule.) */
function dtypeOk(v, dtype, col) {
  if (/^U?Int\d+$/.test(dtype) && isIdColumn(col)) return typeof v === 'string' && /^-?\d+$/.test(v);
  if (dtype === 'Int64') return Number.isInteger(v) || typeof v === 'bigint';
  if (/^U?Int\d+$/.test(dtype)) return Number.isInteger(v);
  if (dtype === 'Float32') return typeof v === 'number' && (Number.isNaN(v) || Math.fround(v) === v);
  if (dtype === 'Float64') return typeof v === 'number';
  if (dtype === 'String') return typeof v === 'string';
  if (dtype === 'Boolean') return typeof v === 'boolean';
  if (dtype === 'Null') return false;
  throw new Error(`unknown polars dtype ${dtype}`);
}

/**
 * py's integer column as JS returns it: an id column (any width: the Int64 play `id`, the
 * Int32 `game_id`) is exact decimal strings (the v4 id rule, every era); any other Int64
 * column all BigInt when a value is beyond 2^53, else numbers.
 */
const intColumn = (vals, col, dtype) =>
  isIdColumn(col)
    ? vals.map((v) => (v === null ? null : String(v)))
    : dtype === 'Int64' && vals.some((v) => typeof v === 'bigint')
      ? vals.map((v) => (v === null ? null : BigInt(v)))
      : vals;

function expectPlays(rows, want, label) {
  rows.length.should.equal(want.rows.length, `${label}: row count`);
  if (!rows.length) return want.columns.should.eql([], `${label}: py's empty frame`);
  rows.forEach((r, i) => Object.keys(r).should.eql(want.columns, `${label}[${i}]: column names/order`));
  want.columns.forEach((c, k) => {
    let vals = want.rows.map((r) => decode(r[k]));
    if (/^U?Int\d+$/.test(want.dtypes[k])) vals = intColumn(vals, c, want.dtypes[k]);
    const bad = rows.find((r) => r[c] !== null && !dtypeOk(r[c], want.dtypes[k], c));
    assert.equal(bad?.[c], undefined, `${label}.${c}: JS value does not fit py dtype ${want.dtypes[k]}`);
    rows.forEach((r, i) => assert.deepStrictEqual(r[c], vals[i], `${label}[${i}].${c}`));
  });
}

/**
 * The JS error for a py exception: its message starts with py's exception name (pandas -> arrow's
 * ArrowInvalid on a mixed-type column is reported as the TypeError pandas raises for str / int).
 */
const raisesAs = (k) => new RegExp('^' + ({ ArrowInvalid: 'TypeError' }[k] ?? k) + ':');

/** One league on one payload: raw trimming, the cleaned dict, and the stage helpers' init. */
function expectLeague(lg, payload, gameId, want, label) {
  const trimmed = P._pbpFromSummary(lg, gameId, payload, true);
  Object.keys(trimmed).should.eql(want.raw.keys, `${label}: raw key order`);
  for (const [k, v] of Object.entries(want.raw.values)) {
    if (v.__same__) assert.deepStrictEqual(trimmed[k], payload[k], `${label}: raw.${k} is the capture's own`);
    else assert.deepStrictEqual(trimmed[k], decode(v), `${label}: raw.${k}`);
  }

  if (want.init.raises) {
    (() => P[`helper_${lg}_game_data`](trimmed, P[`helper_${lg}_pickcenter`](trimmed))).should.throw(
      raisesAs(want.init.raises),
      `${label}: py raises ${want.init.raises} before init`
    );
  } else {
    const [txt, init] = P[`helper_${lg}_game_data`](trimmed, P[`helper_${lg}_pickcenter`](trimmed));
    assert.deepStrictEqual(init, decode(want.init.init), `${label}: init`);
    for (const [k, v] of Object.entries(want.init.pbp_txt)) assert.deepStrictEqual(txt[k], decode(v), `${label}: game_data pbp_txt.${k}`);
  }

  const run = () => P._pbpFromSummary(lg, gameId, payload);
  if (want.out.raises) return run.should.throw(raisesAs(want.out.raises), `${label}: py raises ${want.out.raises}`);
  const out = run();
  Object.keys(out).should.eql(want.out.keys, `${label}: output key order`);
  const pyGameId = decode(want.out.gameId); // py int -> the id rule's decimal string
  assert.deepStrictEqual(out.gameId, Number.isInteger(pyGameId) ? String(pyGameId) : pyGameId, `${label}: gameId`);
  expectPlays(out.plays, want.out.plays, `${label} plays`);
  // timeouts: py int keys -> JS string keys (JS orders integer keys itself); ids follow the id
  // column (exact decimal strings).
  const tw = Object.fromEntries(
    want.out.timeouts.map(([k, v]) => [String(k), Object.fromEntries(Object.entries(v).map(([h, ids]) => [h, decode(ids).map(String)]))])
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

  it('was generated at BASKETBALL_PBP_PIN (a pin bump without a regenerate fails here)', () => {
    const pinFile = readFileSync(join(ESPN, '..', '..', '..', 'tools', 'sdv_py_pin.py'), 'utf8');
    const pin = pinFile.match(/^BASKETBALL_PBP_PIN = "([0-9a-f]{40})"\r?$/m)?.[1];
    should(pin).be.a.String();
    O._provenance.should.startWith(`sportsdataverse-py@${pin} `);
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

// sdv-py #688 (merged as ebac69ed2d), locked on real ESPN payloads as sdv-py's own
// tests/test_basketball_pbp_offline.py locks it: the captures here, and the verbatim pickcenter
// arrays of basketball_pbp/pickcenter.json (copied from sdv-py, which took them from the hoopR /
// wehoop raw stores).
describe('ESPN basketball pbp: sdv-py #688 fixes on real payloads', () => {
  quiet();
  const PC = read(join(ESPN, 'basketball_pbp', 'pickcenter.json'));
  const DEFAULT_OU = { nba: 215.5, wnba: 165.5, mbb: 142.0, wbb: 130.5 };
  const TYPES = new Set(['RegularTimeOut', 'ShortTimeOut', 'Full Timeout', 'Short Timeout', 'No Timeout', 'Reset Timeout']);
  const pick = (lg, pickcenter) => {
    const init = P[`helper_${lg}_pickcenter`]({ pickcenter: structuredClone(pickcenter) });
    return [init.gameSpread, init.overUnder, init.homeFavorite, init.gameSpreadAvailable];
  };
  const homeLine = ([spread, , favorite]) => (favorite ? Math.abs(spread) : -Math.abs(spread));
  /** py's `_expected_timeouts`: every team-timeout play credited to its own team.id, split by half. */
  const expectedTimeouts = (plays, teamIds, firstHalfPeriods) => {
    const out = Object.fromEntries(teamIds.map((t) => [String(t), { 1: [], 2: [] }]));
    for (const p of plays) {
      const team = p.team?.id;
      if (TYPES.has(p.type.text) && team != null && String(Number(team)) in out) {
        out[String(Number(team))][p.period.number <= firstHalfPeriods ? '1' : '2'].push(String(p.id));
      }
    }
    return out;
  };
  const pbpOf = (lg, name, mutate = (c) => c) => {
    const cap = mutate(structuredClone(capture(name)));
    return { cap, out: P._pbpFromSummary(lg, Number(cap.header.id), cap) };
  };

  it('one provider is enough: the scheduled NBA capture reads DraftKings (was the 2.5 default)', () => {
    pick('nba', capture('nba_summary_scheduled_401909093.json.gz').pickcenter).should.eql([-4.5, 233.5, true, true]);
  });

  for (const [lg, id, want] of [
    ['mbb', '401856600', [-6.5, 146.5, true, true]], // one provider: DraftKings, MICH -6.5
    ['nba', '401809238', [-4.5, 241.5, true, true]], // one provider: DraftKings
    ['wnba', '401320565', [2.5, 161.0, false, true]], // one provider: Caesars, away favored
    ['wbb', '401468165', [8.0, 147.5, false, true]], // one provider: Caesars, away favored
    ['mbb', '400766104', [-6.5, 132.5, true, true]], // several providers: unchanged
    ['nba', '400578293', [-9.0, 191.0, true, true]], // several providers: unchanged
    ['mbb', '401364342', [-13.0, 160.5, true, true]], // str(provider.id) order: teamrankings "1002" before Caesars "45"
  ]) {
    it(`${lg} ${id}: pickcenter reads the provider (${want.slice(0, 2).join(' / ')})`, () => {
      pick(lg, PC[lg][id]).should.eql(want);
    });
  }

  it('the spread and its home favorite come from the same provider row (record-only teamrankings row first)', () => {
    // MBB 330582427 (UNCA home -17.5) and NBA 401430219 (MIA home -4.5): the home line was -17.5 / -4.5
    homeLine(pick('mbb', PC.mbb['330582427'])).should.equal(17.5);
    homeLine(pick('nba', PC.nba['401430219'])).should.equal(4.5);
    // the live NBA capture of 401430219 carries the same two rows; every play gets MIA's line
    const { out } = pbpOf('nba', 'nba_summary_401430219.json.gz');
    out.plays.length.should.be.above(400);
    out.plays.every((r) => r.gameSpread === 4.5 && r.homeFavorite === true && r.homeTeamSpread === 4.5).should.be.true();
  });

  for (const lg of LEAGUES) {
    it(`${lg}: a pickcenter without a spread keeps the defaults ([], {}, null, a lone record-only entry)`, () => {
      for (const pc of [[], {}, null, PC.mbb['400587253']]) pick(lg, pc).should.eql([2.5, DEFAULT_OU[lg], true, false]);
    });
  }

  it("a zero spread takes that row's favorite flag, home when unset (py test_zero_spread_takes_that_rows_favorite_flag)", () => {
    // real case WNBA 401391858 (spread 0, home favorite false)
    const row = { provider: { id: '1002' }, spread: 0.0, overUnder: 160.5, homeTeamOdds: { favorite: false } };
    pick('wnba', [row]).should.eql([0, 160.5, false, true]);
    row.homeTeamOdds.favorite = true;
    pick('wnba', [row])[2].should.equal(true);
    delete row.homeTeamOdds;
    pick('wnba', [row])[2].should.equal(true);
  });

  for (const [lg, firstHalf, n] of [
    ['nba', 2, 9], // 9 "Full Timeout" (the ShortTimeOut-only filter found 0)
    ['wnba', 2, 15], // 13 "Full Timeout" + 2 "No Timeout"; "Official Timeout" excluded
    ['mbb', 1, 6], // 6 ShortTimeOut; 8 OfficialTVTimeOut excluded
    ['wbb', 2, 4], // 4 ShortTimeOut; 4 OfficialTVTimeOut excluded
  ]) {
    it(`${lg}: the timeouts map holds every team timeout of summary_${lg}, credited by team.id (${n})`, () => {
      const name = lg === 'nba' ? 'summary_nba.json' : `summary_${lg}.json.gz`;
      const { cap, out } = pbpOf(lg, name);
      out.timeouts.should.eql(expectedTimeouts(cap.plays, Object.keys(out.timeouts), firstHalf));
      Object.values(out.timeouts).flatMap((h) => [...h['1'], ...h['2']]).length.should.equal(n);
    });
  }

  it('WNBA 400927398: two " Full timeout" plays that name no team go to the play team (CHI, MIN)', () => {
    const { cap, out } = pbpOf('wnba', 'wnba_summary_400927398.json.gz');
    out.timeouts.should.eql(expectedTimeouts(cap.plays, ['8', '19'], 2));
    out.timeouts['19']['1'].should.containEql('400927398184');
    out.timeouts['8']['2'].should.containEql('400927398402');
  });

  it('NBA 260312029 PHI @ MEM: "Memphis full timeout" goes to MEM only, by team.id and by the whole-word name fallback', () => {
    const { cap, out } = pbpOf('nba', 'nba_summary_260312029.json.gz');
    const want = expectedTimeouts(cap.plays, ['29', '20'], 2);
    out.timeouts.should.eql(want);
    const [mem, phi] = ['29', '20'].map((t) => new Set([...want[t]['1'], ...want[t]['2']]));
    (mem.size && phi.size && ![...mem].some((x) => phi.has(x))).should.be.ok();
    // every play's team removed: only the name fallback runs ("phi" is inside "Memphis", not a word)
    const stripped = pbpOf('nba', 'nba_summary_260312029.json.gz', (c) => (c.plays.forEach((p) => delete p.team), c));
    stripped.out.timeouts.should.eql(want);
  });
});

describe('ESPN basketball pbp league facts', () => {
  quiet();
  const run = (lg, name) => {
    const cap = capture(name);
    return P._pbpFromSummary(lg, Number(cap.header.id), cap);
  };
  // py's end.* overrides fire on the FIRST play of the new period (lag == previous period).
  const firstOf = (rows, period) => rows.find((r) => r['period.number'] === period);

  it('a numeric play id past 2^53 is refused (already rounded), a safe one is still cast', () => {
    // every id numeric (a caller that parsed them as numbers): safe first, one unsafe later
    const numeric = () => {
      const c = structuredClone(capture('summary_nba.json'));
      c.plays.forEach((p, i) => (p.id = 1000 + i));
      return c;
    };
    const cap = numeric();
    cap.plays[cap.plays.length - 1].id = 2 ** 60;
    let err;
    try {
      P._pbpFromSummary('nba', Number(cap.header.id), cap);
    } catch (e) {
      err = e;
    }
    err.should.be.instanceOf(TypeError);
    err.message.should.match(/lost precision/);
    const ok = numeric();
    P._pbpFromSummary('nba', Number(ok.header.id), ok).plays.length.should.be.above(0);
  });

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

  it('OT: the overtime period starts at 300 (NBA OT, WBB 4OT, MBB every OT for end.period AND end.game: sdv-py #688)', () => {
    const nba = run('nba', 'nba_summary_401360428.json.gz').plays;
    firstOf(nba, 5)['end.quarter_seconds_remaining'].should.equal(300);
    const wbb = run('wbb', 'wbb_summary_401587390.json.gz').plays;
    for (const p of [5, 6, 7, 8]) firstOf(wbb, p)['end.game_seconds_remaining'].should.equal(300);
    const mbb = run('mbb', 'mbb_summary_401600379.json.gz').plays; // 2OT
    for (const p of [3, 4]) {
      firstOf(mbb, p)['end.period_seconds_remaining'].should.equal(300, `MBB OT period ${p}`);
      firstOf(mbb, p)['end.game_seconds_remaining'].should.equal(300, `MBB OT period ${p}`);
    }
    // from the second half on, the two columns measure the same clock (py's lock on 401830342)
    const late = mbb.filter((r) => r['period.number'] >= 2);
    late.map((r) => r['end.period_seconds_remaining']).should.eql(late.map((r) => r['end.game_seconds_remaining']));
  });

  it('MBB columns: half = period, lag_period, period_seconds; no qtr / game_half / period; Int32 clock', () => {
    const cols = Object.keys(run('mbb', 'summary_mbb.json.gz').plays[0]);
    cols.should.containDeep(['half', 'lag_period', 'lead_period', 'start.period_seconds_remaining', 'end.period_seconds_remaining']);
    for (const c of ['qtr', 'game_half', 'period', 'lag_qtr', 'start.quarter_seconds_remaining']) cols.should.not.containEql(c);
    // a bare-seconds clock ("53.1") reads as 0:53 in MBB (Int32, truncated; sdv-py #688), and
    // MBB's `time` keeps the display, where the NBA path prefixes it and keeps Float32 tenths
    const bare = run('mbb', 'summary_nba.json').plays.find((r) => r.time === '53.1');
    [bare['clock.minutes'], bare['clock.seconds'], bare['start.period_seconds_remaining']].should.eql([0, 53, 53]);
    run('nba', 'summary_nba.json').plays.some((r) => r.time.startsWith('0:') && r['clock.seconds'] % 1 !== 0).should.be.true();
  });

  it('Float32 seconds: every step rounds to float32 like polars (NBA ((K + 60m) + s))', () => {
    const r = run('nba', 'summary_nba.json').plays.find((x) => x['clock.seconds'] === Math.fround(53.1));
    r['start.quarter_seconds_remaining'].should.equal(Math.fround(53.1));
    r['start.game_seconds_remaining'].should.not.equal(53.1);
  });

  it('INT64 id rule: the play id is an exact decimal string in every era, timeouts too; no warning', () => {
    const seen = [];
    _warn.emit = (m) => seen.push(m);
    const ids = (out) => out.plays.map((r) => r.id);
    const timeoutIds = (out) => Object.values(out.timeouts).flatMap((h) => [...h['1'], ...h['2']]);
    // 18-digit (beyond 2^53) college ids: exact strings, the value pyarrow / polars hold
    const mbb = run('mbb', 'summary_mbb.json.gz');
    ids(mbb)[0].should.equal('401638645101799901');
    mbb.plays.every((r) => r.game_id === '401638645').should.be.true(); // the Int32 game_id too (any width)
    mbb.gameId.should.equal('401638645'); // the top-level gameId (py int)
    // homeTeamId / awayTeamId (Int32 on NBA / WNBA, py int on MBB / WBB): strings, every league
    for (const out of [mbb, run('nba', 'summary_nba.json')]) {
      out.plays.every((r) => typeof r.homeTeamId === 'string' && /^\d+$/.test(r.homeTeamId)).should.be.true();
      out.plays.every((r) => typeof r.awayTeamId === 'string' && /^\d+$/.test(r.awayTeamId)).should.be.true();
      Object.keys(out.timeouts).should.containEql(out.plays[0].homeTeamId); // joins the timeouts keys
    }
    ids(mbb).every((x) => /^\d{18}$/.test(x)).should.be.true();
    timeoutIds(mbb).length.should.be.above(0);
    timeoutIds(mbb).every((x) => typeof x === 'string').should.be.true();
    // safe ids (NBA, 10-12 digits) are strings too: one type per column, whatever the magnitude
    run('nba', 'summary_nba.json').plays.every((r) => typeof r.id === 'string' && /^\d{10,12}$/.test(r.id)).should.be.true();
    // one league, two eras: WBB on a 14-digit-id game and an 18-digit-id game -> one batch, all strings
    const old = run('wbb', 'wnba_summary_230614002.json.gz');
    const modern = run('wbb', 'wbb_summary_401587390.json.gz');
    ids(old)[0].should.match(/^\d{14}$/);
    ids(modern)[0].should.match(/^\d{18}$/);
    const batch = [...old.plays, ...modern.plays];
    batch.every((r) => typeof r.id === 'string').should.be.true();
    // the whole result is JSON-safe (a BigInt anywhere would throw)
    for (const out of [mbb, old, modern]) JSON.parse(JSON.stringify(out)).plays.length.should.equal(out.plays.length);
    seen.should.eql([]);
  });

  it('a numeric (already-parsed) safe play id is cast exactly to its decimal string', () => {
    const c = structuredClone(capture('summary_nba.json'));
    c.plays.forEach((p, i) => (p.id = 4015856074 + i));
    P._pbpFromSummary('nba', Number(c.header.id), c).plays.map((r) => r.id).slice(0, 2).should.eql(['4015856074', '4015856075']);
  });

  it('lag / lead / row numbers are per game: a concatenated two-game frame never leaks', () => {
    for (const [lg, a, b] of [
      ['mbb', 'summary_mbb.json.gz', 'mbb_summary_401600379.json.gz'],
      ['wbb', 'summary_wbb.json.gz', 'wbb_summary_401587390.json.gz'],
    ]) {
      const stageA = (name) => {
        const cap = capture(name);
        const t = P._pbpFromSummary(lg, Number(cap.header.id), cap, true);
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

  it('is on sdv.<lg> under py and camelCase names (helpers + espn_<lg>_pbp); the trim core is internal', () => {
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
    Object.keys(root).filter((k) => /pbp|summary/i.test(k)).should.eql([]); // no py-less root name
  });

  describe('espn_<lg>_pbp: the ESPN summary wrapper -> py trimming -> helper_<lg>_pbp (injected transport)', () => {
    afterEach(() => root.resetConfig());
    const games = {
      nba: 'nba_summary_401360428.json.gz',
      wnba: 'wnba_summary_230614002.json.gz',
      mbb: 'mbb_summary_401600379.json.gz',
      wbb: 'wbb_summary_401587390.json.gz',
    };
    const slug = { nba: 'nba', wnba: 'wnba', mbb: 'mens-college-basketball', wbb: 'womens-college-basketball' };
    for (const [lg, name] of Object.entries(games)) {
      it(`${lg}: requests summary?event=<id> once and returns py's dict for ${name} (raw: py's raw)`, async () => {
        const cap = capture(name);
        const id = O.captures[name].game_id;
        const calls = [];
        root.configure({ transport: async (req) => (calls.push(req), { status: 200, headers: {}, data: cap, url: req.url }) });
        const out = await sdv[lg][`espn_${lg}_pbp`](id);
        calls.length.should.equal(1);
        String(calls[0].url).should.match(new RegExp(`/basketball/${slug[lg]}/summary$`));
        String(calls[0].query.event).should.equal(String(id));
        assert.deepStrictEqual(out, P._pbpFromSummary(lg, id, cap)); // == the oracle-checked core
        out.plays.length.should.equal(O.captures[name][lg].out.plays.rows.length);
        Object.keys(await sdv[lg][`espn_${lg}_pbp`](id, { raw: true })).should.eql(O.captures[name][lg].raw.keys);
      });
    }
  });
});

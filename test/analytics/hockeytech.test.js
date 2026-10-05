import should from 'should';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv from '../../dist/index.js';
import { configure, resetConfig } from '../../dist/core/config.js';
import { AssetFetchError } from '../../dist/core/errors.js';
import * as FLAT from '../../dist/generated/flat/hockeytech.js';
import * as A from '../../dist/analytics/hockeytech.js';

// Parity: every case below is compared cell-by-cell against `oracle.json`, produced ONCE by
// running sdv-py @719de79 (tools/oracle/hockeytech_analytics_oracle.py) over the REAL committed
// HockeyTech captures in test/fixtures/hockeytech/analytics/. Ids and strings compare strictly;
// only the trig/sqrt geometry columns allow a 1e-12 relative slack.
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'hockeytech', 'analytics');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const O = load('oracle').cases;
const shifts42 = load('pwhl_gameshifts_42');
const pbp42 = load('pwhl_pbp_42');
const meta42 = load('pwhl_game_summary_42');
const ohlPbp = load('ohl_pbp_27225');

const FUZZY = new Set(['shot_distance', 'shot_angle']);

function expectFrame(rows, oracle, { sortBy } = {}) {
  if (oracle.rows.length === 0) return rows.length.should.equal(0);
  const order = (rs) => (sortBy ? [...rs].sort(sortBy) : rs);
  const got = order(rows);
  const want = order(oracle.rows);
  got.length.should.equal(want.length);
  Object.keys(got[0]).should.eql(oracle.columns);
  got.forEach((row, i) => {
    for (const c of oracle.columns) {
      const a = row[c];
      const b = want[i][c];
      if (FUZZY.has(c) && typeof a === 'number' && typeof b === 'number') {
        Math.abs(a - b).should.be.belowOrEqual(1e-12 * Math.max(1, Math.abs(b)), `row ${i} ${c}`);
      } else {
        assert.deepStrictEqual(a, b, `row ${i} column ${c}: ${a} vs ${b}`);
      }
    }
  });
}
const byPid = (a, b) =>
  String(a.player_id).localeCompare(String(b.player_id), 'en', { numeric: true }) ||
  String(a.first_name).localeCompare(String(b.first_name));
const byTeam = (a, b) => String(a.team_id).localeCompare(String(b.team_id));

describe('hockeytech analytics: parsers vs the sdv-py oracle (real PWHL game 42 / OHL game 27225)', () => {
  it('parse_shifts: one row per stint, ids strict', () => {
    const rows = A.parse_shifts(shifts42, 42);
    rows.length.should.equal(730);
    expectFrame(rows, O.pwhl_shifts);
    rows.every((r) => r.start_s >= r.end_s).should.be.true(); // countdown clock
  });
  it('parse_pbp dialect a (PWHL) and b (OHL)', () => {
    expectFrame(A.parse_pbp(pbp42, 'hockeytech_a', 42), O.pwhl_pbp_parsed);
    expectFrame(A.parse_pbp(ohlPbp, 'hockeytech_b', 27225), O.ohl_pbp_parsed);
  });
  it('mmss_to_seconds edge cases', () => {
    A.mmss_to_seconds('03:16').should.equal(196);
    A.mmss_to_seconds('00:00').should.equal(0);
    should(A.mmss_to_seconds(null)).be.null();
    should(A.mmss_to_seconds('')).be.null();
    should(A.mmss_to_seconds('3')).be.null();
    should(A.mmss_to_seconds('a:b')).be.null();
  });
  it('empty / malformed payloads give []', () => {
    A.parse_shifts(null).should.eql([]);
    A.parse_shifts({}).should.eql([]);
    A.parse_pbp(null).should.eql([]);
    A.parse_pbp({ not: 'a list' }).should.eql([]);
  });
});

describe('hockeytech analytics: enrichment + metrics vs the oracle', () => {
  const parsed = A.parse_pbp(pbp42, 'hockeytech_a', 42);
  const enriched = A.enrich_pbp(parsed, 'pwhl', 42, { meta_payload: meta42, shifts_payload: shifts42 });

  it('enrich_pbp (meta + coords + clock + PP back-fill + geometry + on-ice) matches py', () => {
    expectFrame(enriched, O.pwhl_pbp_enriched);
    // known-positive control: on-ice lists really were populated (not a vacuous all-null match)
    enriched.filter((r) => r.on_ice_home !== null).length.should.be.above(100);
    enriched.filter((r) => r.event === 'goal').length.should.be.above(0);
  });
  it('enrich_pbp without meta / shifts (OHL, no shifts feed): on_ice null, meta blank', () => {
    const ohl = A.enrich_pbp(A.parse_pbp(ohlPbp, 'hockeytech_b', 27225), 'ohl', 27225, {
      meta_payload: {},
      shifts_payload: {},
    });
    expectFrame(ohl, O.ohl_pbp_enriched_no_meta_no_shifts);
    ohl.every((r) => r.on_ice_home === null && r.on_ice_away === null).should.be.true();
  });
  it('player_toi (tie order undefined in py -> compared sorted)', () => {
    expectFrame(A.player_toi(A.parse_shifts(shifts42, 42)), O.pwhl_player_toi, { sortBy: byPid });
  });
  it('corsi_fenwick (team) and corsi_fenwick_on_ice', () => {
    expectFrame(A.corsi_fenwick(enriched), O.pwhl_corsi_fenwick_team, { sortBy: byTeam });
    expectFrame(A.corsi_fenwick_on_ice(enriched), O.pwhl_corsi_fenwick_on_ice);
  });
  it('game_corsi_rows == py <lg>_game_corsi', () => {
    expectFrame(A.game_corsi_rows(enriched, A.parse_shifts(shifts42, 42)), O.pwhl_family_game_corsi);
  });
  it('add_strength_state with and without goalie ids', () => {
    const g = O.pwhl_strength_state.goalie_ids;
    expectFrame(A.add_strength_state(enriched, g), O.pwhl_strength_state.out);
    expectFrame(A.add_strength_state(enriched), O.pwhl_strength_state_no_goalies);
  });
});

describe('hockeytech analytics: edge cases vs the oracle (hand-built frames through the same py code)', () => {
  const S = O.synthetic_build_on_ice;
  it('build_on_ice: line-change boundary, goal epsilon (default / 0 / 5), clamp to period start, unseen period, null time', () => {
    expectFrame(A.build_on_ice(S.pbp, S.shifts), S.default_eps);
    expectFrame(A.build_on_ice(S.pbp, S.shifts, 0), S.eps0);
    expectFrame(A.build_on_ice(S.pbp, S.shifts, 5), S.eps5);
    expectFrame(A.build_on_ice(S.pbp, []), S.no_shifts); // empty shifts
  });
  it('add_strength_state: pulled goalie, impossible counts, duplicates, no / empty goalie list', () => {
    const T = O.synthetic_strength_state;
    expectFrame(A.add_strength_state(T.rows, T.goalie_ids), T.with_goalies);
    expectFrame(A.add_strength_state(T.rows), T.no_goalies);
    expectFrame(A.add_strength_state(T.rows, []), T.empty_goalie_list);
  });
  it('add_clock_columns: period starts, period offsets, null / unparseable parts', () => {
    expectFrame(A.add_clock_columns(O.synthetic_clock.rows), O.synthetic_clock.out);
    (() => A.add_clock_columns([{ time_of_period: 'oops', period_of_game: '1' }])).should.throw(/out of bounds/);
  });
  it('add_coord_transforms: home/away, null team, null coords', () => {
    expectFrame(A.add_coord_transforms(O.synthetic_coords.rows), O.synthetic_coords.out);
  });
  it('add_shot_distance_angle / scoring_chances: thresholds, goal_x, non-shots, null coords, scale guard', () => {
    const G = O.synthetic_shot_geometry;
    expectFrame(A.scoring_chances(A.add_shot_distance_angle(G.rows)), G.out);
    expectFrame(A.scoring_chances(A.add_shot_distance_angle(G.rows, 80), 15), G.out_goalx80);
    (() => A.add_shot_distance_angle(G.rows, 250)).should.throw(RangeError);
    (() => A.add_shot_distance_angle(G.rows, 0)).should.throw(RangeError);
  });
  it('backfill_power_play: window truncated at a goal, shorthanded flag, second penalty', () => {
    expectFrame(A.backfill_power_play(O.synthetic_backfill_power_play.rows), O.synthetic_backfill_power_play.out);
  });
  it('corsi_fenwick / corsi_fenwick_on_ice: null team, null on-ice, blocked shots Corsi-only', () => {
    const C = O.synthetic_corsi;
    expectFrame(A.corsi_fenwick(C.rows), C.team, { sortBy: byTeam });
    expectFrame(A.corsi_fenwick_on_ice(C.rows), C.on_ice);
  });
  it('player_toi: null end_s, multi-stint players', () => {
    expectFrame(A.player_toi(O.synthetic_toi.rows), O.synthetic_toi.out, { sortBy: byPid });
  });
  it('empty frames in, empty frames out', () => {
    for (const f of [A.player_toi, A.corsi_fenwick, A.corsi_fenwick_on_ice, A.add_clock_columns, A.backfill_power_play]) {
      f([]).should.eql([]);
    }
    A.enrich_pbp([], 'pwhl', 1).should.eql([]);
    A.game_corsi_rows([], []).should.eql([]);
  });
  it('per60', () => A.per60(20, 1131).should.equal(O.pwhl_family_game_corsi.rows[0].corsi_for_per60));
});

describe('hockeytech analytics: per-league wrappers (offline stub transport serving the captures)', () => {
  const jsonp = (o) => `angular.callbacks._0(${JSON.stringify(o)})`;
  const calls = [];
  let mode = 'ok'; // ok | garbage | sentinel | emptyGame
  before(() => {
    configure({
      retries: 0,
      transport: async (req) => {
        const q = req.query ?? {};
        calls.push({ url: req.url, q });
        if (mode === 'garbage') return { status: 200, headers: {}, data: '<html>blocked</html>', url: req.url };
        if (mode === 'sentinel') return { status: 200, headers: {}, data: jsonp({ error: 'invalid key' }), url: req.url };
        let body = {};
        if (mode === 'emptyGame') {
          if (q.view === 'gameshifts') body = { SiteKit: { Gameshifts: { home: [], visitor: [] } } };
          else if (q.feed === 'statviewfeed') body = [];
          else if (q.feed === 'gc') body = { GC: { Gamesummary: {} } };
          return { status: 200, headers: {}, data: jsonp(body), url: req.url };
        }
        if (q.client_code === 'pwhl') {
          if (q.feed === 'modulekit' && q.view === 'gameshifts') body = shifts42;
          else if (q.feed === 'statviewfeed') body = pbp42;
          else if (q.feed === 'gc') body = meta42;
        } else if (q.client_code === 'ohl' && q.feed === 'statviewfeed') body = ohlPbp;
        return { status: 200, headers: {}, data: jsonp(body), url: req.url };
      },
    });
  });
  after(() => resetConfig());

  it('every league exposes <lg>_game_shifts / _player_toi / _game_corsi on sdv.hockeytech (snake + camel)', () => {
    for (const lg of ['pwhl', 'ahl', 'ohl', 'whl', 'qmjhl', 'echl', 'mjhl']) {
      sdv.hockeytech[`${lg}_game_shifts`].should.be.a.Function();
      sdv.hockeytech[`${lg}_player_toi`].should.be.a.Function();
      sdv.hockeytech[`${lg}_game_corsi`].should.be.a.Function();
      sdv.hockeytech[`${lg}GameShifts`].should.be.a.Function();
      sdv.hockeytech[`${lg}PlayerToi`].should.be.a.Function();
      sdv.hockeytech[`${lg}GameCorsi`].should.be.a.Function();
    }
    sdv.hockeytech.hockeytech_game_shifts.should.be.a.Function(); // the raw-feed flat wrapper is untouched
  });
  it('pwhl_game_shifts / pwhl_player_toi / pwhl_game_corsi match py end to end', async () => {
    expectFrame(await sdv.hockeytech.pwhl_game_shifts(42), O.pwhl_family_game_shifts);
    expectFrame(await sdv.hockeytech.pwhl_player_toi(42), O.pwhl_family_player_toi, { sortBy: byPid });
    expectFrame(await sdv.hockeytech.pwhl_game_corsi(42), O.pwhl_family_game_corsi);
    const shiftCall = calls.find((c) => c.q.view === 'gameshifts');
    String(shiftCall.q.game_id).should.equal('42');
    shiftCall.q.client_code.should.equal('pwhl');
  });
  it('generic league-parameterised forms', async () => {
    expectFrame(
      await sdv.hockeytech.hockeytech_player_toi({ league: 'pwhl', game_id: 42 }),
      O.pwhl_family_player_toi,
      { sortBy: byPid }
    );
    expectFrame(await sdv.hockeytech.hockeytechGameCorsi({ league: 'pwhl', game_id: 42 }), O.pwhl_family_game_corsi);
  });
  it('a valid game with no events / shifts (envelopes present, no rows) is [] for every function', async () => {
    mode = 'emptyGame';
    try {
      for (const f of ['game_shifts', 'player_toi', 'pbp', 'game_corsi']) {
        (await sdv.hockeytech[`ohl_${f}`](27225)).should.eql([]);
      }
    } finally {
      mode = 'ok';
    }
  });
  for (const bad of ['garbage', 'sentinel']) {
    it(`a ${bad} 200 body is AssetFetchError, never an empty game`, async () => {
      mode = bad;
      try {
        for (const f of ['game_shifts', 'player_toi', 'pbp', 'game_corsi']) {
          await sdv.hockeytech[`pwhl_${f}`](42).should.be.rejectedWith(AssetFetchError);
        }
        await sdv.hockeytech.hockeytech_enriched_pbp({ league: 'pwhl', game_id: 42 }).should.be.rejectedWith(AssetFetchError);
      } finally {
        mode = 'ok';
      }
    });
  }
  it('pwhl_pbp (public in py) matches the enriched oracle', async () => {
    expectFrame(await sdv.hockeytech.pwhl_pbp(42), O.pwhl_family_pbp);
  });
  it('new public names never collide with an existing flat sdv.hockeytech key', () => {
    const flat = new Set(Object.keys(FLAT));
    const camel = (x) => x.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());
    const mine = [];
    for (const lg of ['pwhl', 'ahl', 'ohl', 'whl', 'qmjhl', 'echl', 'mjhl']) {
      for (const f of ['game_shifts', 'player_toi', 'game_corsi', 'pbp']) mine.push(`${lg}_${f}`);
    }
    mine.push('hockeytech_shift_stints', 'hockeytech_enriched_pbp', 'hockeytech_player_toi', 'hockeytech_game_corsi');
    for (const n of mine) {
      flat.has(n).should.be.false(n);
      flat.has(camel(n)).should.be.false(camel(n));
    }
    // and the real namespace carries the flat raw-feed wrappers unchanged
    sdv.hockeytech.hockeytech_game_shifts.should.equal(FLAT.hockeytech_game_shifts);
  });
});

describe('hockeytech analytics: live 2026-10-05 captures (MJHL access denied, USHL partial pbp) vs the py oracle', () => {
  const live = (n) => readFileSync(join(dir, 'live-2026-10-05', `${n}.txt`), 'utf8');
  const GAMES = { mjhl: 7301, ushl: 13506 };
  let override = null; // { league, feed/view -> text }
  before(() => {
    configure({
      retries: 0,
      transport: async (req) => {
        const q = req.query ?? {};
        const key = q.view === 'gameshifts' ? 'shifts' : q.feed === 'statviewfeed' ? 'pbp' : 'summary';
        let text;
        if (override && override[key] !== undefined) text = override[key];
        else if (q.client_code === 'ohl' && key === 'shifts') text = live('ohl_shifts_29044');
        else text = live(`${q.client_code}_${key}_${GAMES[q.client_code]}`);
        return { status: 200, headers: {}, data: text, url: req.url };
      },
    });
  });
  after(() => resetConfig());
  afterEach(() => {
    override = null;
  });

  it('the MJHL summary really is the plain-text "Feed type access denied." reply', () => {
    live('mjhl_summary_7301').should.equal('Feed type access denied.');
  });
  for (const lg of ['mjhl', 'ushl']) {
    it(`${lg}: pbp (goals / penalties / goalie changes only) matches py; shifts / toi / corsi are [] like py`, async () => {
      const pbp = await sdv.hockeytech[`${lg}_pbp`](GAMES[lg]);
      expectFrame(pbp, O[`live_${lg}_pbp`]);
      // known-positive control: real events came back, with no shot rows and no coordinates (partial feed)
      pbp.length.should.be.above(15);
      pbp.some((r) => r.event === 'goal').should.be.true();
      pbp.every((r) => r.event !== 'shot' && r.x_coord === null).should.be.true();
      expectFrame(await sdv.hockeytech[`${lg}_game_shifts`](GAMES[lg]), O[`live_${lg}_game_shifts`]);
      expectFrame(await sdv.hockeytech[`${lg}_player_toi`](GAMES[lg]), O[`live_${lg}_player_toi`]);
      expectFrame(await sdv.hockeytech[`${lg}_game_corsi`](GAMES[lg]), O[`live_${lg}_game_corsi`]);
    });
  }
  it('an access-denied pbp or shifts feed is "nothing here" ([]), not a failed fetch', async () => {
    override = { pbp: 'Feed type access denied.', shifts: 'Feed type access denied.' };
    (await sdv.hockeytech.mjhl_pbp(7301)).should.eql([]);
    (await sdv.hockeytech.mjhl_game_shifts(7301)).should.eql([]);
    (await sdv.hockeytech.mjhl_game_corsi(7301)).should.eql([]);
  });
  it('an empty OHL shift envelope (real capture) is []', async () => {
    (await sdv.hockeytech.ohl_game_shifts(29044)).should.eql([]);
  });
  it('unrecognised bodies are still AssetFetchError (near-miss text, HTML, invalid-view sentinels)', async () => {
    const bads = [
      'Feed type access granted.',
      'Access denied.',
      '<html>blocked</html>',
      JSON.stringify({ error: 'InvalidView error: gameshifts' }),
      JSON.stringify({ SiteKit: { Undefined: 'Undefined Tab gameshifts' } }),
    ];
    for (const b of bads) {
      override = { shifts: b };
      await sdv.hockeytech.ushl_game_shifts(13506).should.be.rejectedWith(AssetFetchError);
      override = { pbp: b };
      await sdv.hockeytech.ushl_pbp(13506).should.be.rejectedWith(AssetFetchError);
    }
    override = { summary: 'nope' };
    await sdv.hockeytech.ushl_pbp(13506).should.be.rejectedWith(AssetFetchError);
  });
});

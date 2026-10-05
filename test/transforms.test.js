import should from 'should';
import { TRANSFORMS, applyTransform, bool_str, _bool_str, format_nhl_season } from '../dist/core/transforms.js';
import { resolveFlat } from '../dist/core/flat.js';
import { resolveRequest } from '../dist/core/espn.js';
import { WRAPPERS, FLAT_WRAPPERS, LEAGUES } from '../dist/index.js';
import { TRANSFORMS as PLAYGROUND_TRANSFORMS } from '../docs/src/playground/resolve.mjs';
import { PARAM_TRANSFORMS, checkTransform } from '../tools/codegen/param-transforms.mjs';

// Ports of sdv-py@719de79 `_codegen_runtime.format_nhl_season` / `bool_str`
// and `nfl/nfl_api_runtime._bool_str`, applied by the resolvers to the param
// values the vendored YAML marks with `transform:`.
const flat = (api, short) => FLAT_WRAPPERS.find((w) => w.api === api && w.short === short);

describe('param transforms (ports of the sdv-py runtime functions)', () => {
  it('format_nhl_season: py test + docstring cases', () => {
    format_nhl_season(2025).should.equal('20242025'); // tests/codegen/test_api_module.py
    format_nhl_season('2025').should.equal('20242025');
    format_nhl_season('20242025').should.equal('20242025'); // already formatted
    format_nhl_season(20242025).should.equal('20242025');
    should(format_nhl_season(undefined)).be.undefined();
    should(format_nhl_season(null)).be.null();
    (() => format_nhl_season(12345)).should.throw(/Unrecognized NHL season 12345/);
    (() => format_nhl_season('2024-25')).should.throw(/Unrecognized NHL season/);
  });

  it('bool_str: Python truthiness -> "true"/"false"; None passes through', () => {
    bool_str(true).should.equal('true');
    bool_str(false).should.equal('false');
    should(bool_str(undefined)).be.undefined();
    should(bool_str(null)).be.null();
    bool_str(0).should.equal('false');
    bool_str('').should.equal('false');
    bool_str('false').should.equal('true'); // a non-empty str is truthy in py
  });

  it('_bool_str: str(value).lower(); None passes through', () => {
    _bool_str(true).should.equal('true'); // tests/odds/test_the_odds_api.py
    _bool_str(false).should.equal('false');
    should(_bool_str(undefined)).be.undefined();
    should(_bool_str(null)).be.null();
    _bool_str('False').should.equal('false');
  });

  it('applyTransform: no name is identity, an unknown name throws', () => {
    applyTransform(undefined, 7).should.equal(7);
    (() => applyTransform('nope', 1)).should.throw(/unknown param transform "nope"/);
  });

  it('codegen allowlist == runtime registry == playground copy', () => {
    Object.keys(TRANSFORMS).sort().should.eql([...PARAM_TRANSFORMS].sort());
    Object.keys(PLAYGROUND_TRANSFORMS).sort().should.eql([...PARAM_TRANSFORMS].sort());
    for (const v of [true, false, 0, 1, '', 'False', 2025, '20242025', null, undefined]) {
      for (const name of PARAM_TRANSFORMS) {
        let a, b;
        try { a = TRANSFORMS[name](v); } catch (e) { a = `throws ${e.message}`; }
        try { b = PLAYGROUND_TRANSFORMS[name](v); } catch (e) { b = `throws ${e.message}`; }
        should(b).eql(a, `${name}(${String(v)})`);
      }
    }
  });

  it('codegen refuses an unknown transform name', () => {
    checkTransform('format_nhl_season', 'x').should.equal('format_nhl_season');
    (() => checkTransform('to_upper', 'nhl_edge.skater_detail.season')).should.throw(
      /nhl_edge\.skater_detail\.season: unknown param transform "to_upper"/
    );
  });

  it('every transform on a generated def is one the runtime implements', () => {
    const named = [...WRAPPERS, ...FLAT_WRAPPERS].flatMap((d) =>
      [...d.pathParams, ...d.queryParams].map((p) => p.transform).filter(Boolean)
    );
    named.length.should.equal(52); // 42 format_nhl_season + 9 _bool_str + 1 bool_str
    for (const t of named) should(TRANSFORMS[t]).be.a.Function();
  });
});

describe('resolvers apply param transforms (path + query, snake + camel)', () => {
  it('nhl_edge: a 4-digit season becomes the 8-digit api-web season', () => {
    const def = flat('nhl_edge', 'skater_detail');
    resolveFlat(def, { player_id: 8478402, season: 2025 }).url.should.equal(
      'https://api-web.nhle.com/v1/edge/skater-detail/8478402/20242025/2'
    );
    resolveFlat(def, { playerId: 8478402, season: '20232024', gameType: 3 }).url.should.equal(
      'https://api-web.nhle.com/v1/edge/skater-detail/8478402/20232024/3'
    );
  });

  it('nhl_api_web: club_schedule_season formats the season path token (py test case)', () => {
    resolveFlat(flat('nhl_api_web', 'club_schedule_season'), { team: 'TOR', season: 2025 }).url.should.equal(
      'https://api-web.nhle.com/v1/club-schedule-season/TOR/20242025'
    );
  });

  it('nfl_api: _bool_str on query flags (defaults + explicit, camelCase alias)', () => {
    const def = flat('nfl_api', 'weekly_game_details');
    const { query } = resolveFlat(def, { includeReplays: true });
    query.includeDriveChart.should.equal('true'); // default true -> "true"
    query.includeReplays.should.equal('true');
    query.includeStandings.should.equal('false');
  });

  it('espn core v2: bool_str on athletes_index `active`', () => {
    const def = WRAPPERS.find((w) => w.short === 'athletes_index');
    const nba = LEAGUES.find((l) => l.prefix === 'nba');
    resolveRequest(def, nba, {}).query.active.should.equal('true');
    resolveRequest(def, nba, { active: false }).query.active.should.equal('false');
  });
});

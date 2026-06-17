import should from 'should';
import sdv, { FLAT_WRAPPERS } from '../dist/index.js';
// deep import (not public API) — exercise flat request building w/o network
import { resolveFlat } from '../dist/core/flat.js';
import { FLAT_HOSTS } from '../dist/core/client.js';

// No-network contract tests for the flat-API (non-ESPN) surface. Mirrors
// espn-contract.test.js but for the absolute-host MLB Stats API slice: every
// flat wrapper is exposed under both names on its target namespace and builds a
// valid absolute https URL with no unresolved {tokens}.

const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());

// api stem -> sdv namespace prefix (mirrors index.ts FLAT_API_NAMESPACES)
const FLAT_API_NAMESPACES = {
  mlb_api: 'mlb',
  mlb_statcast: 'mlb',
  nhl_api_web: 'nhl',
  nhl_edge: 'nhl',
  nhl_stats_rest: 'nhl',
  nhl_records: 'nhl',
  nfl_api: 'nfl',
};

/** Fill every required path param so the URL fully resolves. */
function minimalParams(def) {
  const params = {};
  for (const p of def.pathParams || []) {
    if (p.required !== false && p.default === undefined) params[p.name] = 12345;
  }
  return params;
}

describe('flat-API wrapper metadata invariants', () => {
  it('exposes a non-empty, flagged flat wrapper table', () => {
    FLAT_WRAPPERS.length.should.be.above(0);
    for (const w of FLAT_WRAPPERS) {
      w.flat.should.be.true(`flat flag missing on ${w.short}`);
      (typeof w.api).should.equal('string', `api stem missing on ${w.short}`);
      w.host.startsWith('https://').should.be.true(`host not https on ${w.short}`);
      w.path.startsWith('/').should.be.true(`path not absolute on ${w.short}: ${w.path}`);
      Array.isArray(w.pathParams).should.be.true(`pathParams not an array on ${w.short}`);
      Array.isArray(w.queryParams).should.be.true(`queryParams not an array on ${w.short}`);
    }
  });

  it('FLAT_HOSTS provides an https base for every api family in use', () => {
    for (const api of new Set(FLAT_WRAPPERS.map((w) => w.api))) {
      (typeof FLAT_HOSTS[api]).should.equal('string', `no FLAT_HOSTS entry for ${api}`);
      FLAT_HOSTS[api].startsWith('https://').should.be.true(`host not https for ${api}`);
    }
  });

  it('includes the proof-slice mlb_api teams + schedule endpoints', () => {
    const shorts = FLAT_WRAPPERS.filter((w) => w.api === 'mlb_api').map((w) => w.short);
    shorts.should.containEql('teams');
    shorts.should.containEql('schedule');
  });

  it('registers all four NHL native-API families with their endpoint counts', () => {
    const countFor = (api) => FLAT_WRAPPERS.filter((w) => w.api === api).length;
    countFor('nhl_api_web').should.equal(27);
    countFor('nhl_edge').should.equal(35);
    countFor('nhl_stats_rest').should.equal(21);
    countFor('nhl_records').should.equal(44);
  });

  it('nhl_api_web + nhl_edge are separate api stems sharing one host', () => {
    const web = FLAT_WRAPPERS.find((w) => w.api === 'nhl_api_web');
    const edge = FLAT_WRAPPERS.find((w) => w.api === 'nhl_edge');
    should(web).be.ok();
    should(edge).be.ok();
    web.host.should.equal('https://api-web.nhle.com');
    edge.host.should.equal('https://api-web.nhle.com');
    web.api.should.not.equal(edge.api);
  });

  it('FLAT_HOSTS carries the three distinct NHL hosts', () => {
    FLAT_HOSTS.nhl_api_web.should.equal('https://api-web.nhle.com');
    FLAT_HOSTS.nhl_edge.should.equal('https://api-web.nhle.com');
    FLAT_HOSTS.nhl_stats_rest.should.equal('https://api.nhle.com/stats/rest');
    FLAT_HOSTS.nhl_records.should.equal('https://records.nhl.com/site/api');
  });

  it('registers the mlb_statcast family (39 endpoints) on https://baseballsavant.mlb.com', () => {
    const sc = FLAT_WRAPPERS.filter((w) => w.api === 'mlb_statcast');
    sc.length.should.equal(39); // 35 CSV + 2 HTML leaderboards + gamefeed + schedule
    FLAT_HOSTS.mlb_statcast.should.equal('https://baseballsavant.mlb.com');
    for (const w of sc) w.host.should.equal('https://baseballsavant.mlb.com');
    // the 2 HTML-embedded leaderboards + the gamefeed + schedule are present
    const shorts = sc.map((w) => w.short);
    shorts.should.containEql('leaderboard_fielding_run_value');
    shorts.should.containEql('leaderboard_park_factors');
    shorts.should.containEql('gamefeed');
    shorts.should.containEql('schedule');
  });

  it('every mlb_statcast wrapper names a registered statcast parser, none auth', () => {
    for (const w of FLAT_WRAPPERS.filter((x) => x.api === 'mlb_statcast')) {
      (typeof w.parser).should.equal('string', `parser missing on ${w.short}`);
      w.parser.should.startWith('parse_mlb_statcast_');
      should(w.auth).not.be.true(`unexpected auth flag on mlb_statcast_${w.short}`);
    }
  });

  it('registers the nfl_api family (11 endpoints) on https://api.nfl.com', () => {
    const nfl = FLAT_WRAPPERS.filter((w) => w.api === 'nfl_api');
    nfl.length.should.equal(11);
    FLAT_HOSTS.nfl_api.should.equal('https://api.nfl.com');
    for (const w of nfl) w.host.should.equal('https://api.nfl.com');
  });

  it('flags every nfl_api wrapper auth:true (and only nfl_api so far)', () => {
    for (const w of FLAT_WRAPPERS) {
      if (w.api === 'nfl_api') w.auth.should.be.true(`auth flag missing on ${w.short}`);
      else should(w.auth).not.be.true(`unexpected auth flag on ${w.api}_${w.short}`);
    }
  });

  it('every nfl_api wrapper names a registered parser', () => {
    for (const w of FLAT_WRAPPERS.filter((x) => x.api === 'nfl_api')) {
      (typeof w.parser).should.equal('string', `parser missing on ${w.short}`);
      w.parser.should.startWith('parse_nfl_');
    }
  });
});

describe('every flat wrapper is exposed under both names on sdv.mlb', () => {
  for (const def of FLAT_WRAPPERS) {
    const prefix = FLAT_API_NAMESPACES[def.api] ?? def.api;
    it(`${def.api}_${def.short} present as snake + camelCase (same fn) on sdv.${prefix}`, () => {
      const ns = sdv[prefix];
      should(ns).be.an.Object();
      const snake = `${def.api}_${def.short}`;
      const camel = toCamel(snake);
      (typeof ns[snake]).should.equal('function', `missing ${snake}`);
      (typeof ns[camel]).should.equal('function', `missing ${camel}`);
      ns[camel].should.equal(ns[snake], `${camel} and ${snake} differ`);
    });
  }

  it('flat wrappers coexist with the legacy + ESPN MLB surface (no clobbering)', () => {
    (typeof sdv.mlb.getPlayByPlay).should.equal('function'); // legacy
    (typeof sdv.mlb.espnMlbScoreboard).should.equal('function'); // ESPN
    (typeof sdv.mlb.mlbApiTeams).should.equal('function'); // mlb_api flat
    (typeof sdv.mlb.mlbStatcastGamefeed).should.equal('function'); // mlb_statcast flat
  });

  it('mlb_statcast flat wrappers merge onto sdv.mlb (snake + camel, same fn)', () => {
    sdv.mlb.mlbStatcastLeaderboardSprintSpeed.should.equal(
      sdv.mlb.mlb_statcast_leaderboard_sprint_speed
    );
    (typeof sdv.mlb.mlb_statcast_gamefeed).should.equal('function');
    (typeof sdv.mlb.mlbStatcastSchedule).should.equal('function');
    (typeof sdv.mlb.mlb_statcast_leaderboard_fielding_run_value).should.equal('function');
  });

  it('hand-written statcast search/player wrappers merge onto sdv.mlb (snake + camel)', () => {
    for (const snake of [
      'mlb_statcast_search',
      'mlb_statcast_search_minors',
      'mlb_statcast_search_wbc',
      'mlb_statcast_player',
    ]) {
      const camel = toCamel(snake);
      (typeof sdv.mlb[snake]).should.equal('function', `missing ${snake}`);
      (typeof sdv.mlb[camel]).should.equal('function', `missing ${camel}`);
      sdv.mlb[camel].should.equal(sdv.mlb[snake], `${camel} and ${snake} differ`);
    }
    // these are hand-written (not in the generated FLAT_WRAPPERS table)
    FLAT_WRAPPERS.some((w) => w.api === 'mlb_statcast' && w.short === 'search').should.be.false();
  });

  it('all four NHL families merge onto sdv.nhl alongside legacy + ESPN', () => {
    (typeof sdv.nhl.getPlayByPlay).should.equal('function'); // legacy
    (typeof sdv.nhl.espnNhlScoreboard).should.equal('function'); // ESPN
    (typeof sdv.nhl.nhlApiWebSchedule).should.equal('function'); // nhl_api_web
    (typeof sdv.nhl.nhlEdgeSkaterDetail).should.equal('function'); // nhl_edge
    (typeof sdv.nhl.nhlStatsRestTeam).should.equal('function'); // nhl_stats_rest
    (typeof sdv.nhl.nhlRecordsFranchises).should.equal('function'); // nhl_records
  });

  it('nfl_api family merges onto sdv.nfl alongside legacy + ESPN (snake + camel)', () => {
    (typeof sdv.nfl.getPlayByPlay).should.equal('function'); // legacy
    (typeof sdv.nfl.espnNflScoreboard).should.equal('function'); // ESPN
    (typeof sdv.nfl.nfl_api_standings).should.equal('function'); // flat snake
    (typeof sdv.nfl.nflApiStandings).should.equal('function'); // flat camel
    sdv.nfl.nflApiStandings.should.equal(sdv.nfl.nfl_api_standings);
    (typeof sdv.nfl.nflApiWeeklyGameDetails).should.equal('function');
  });
});

describe('every flat wrapper builds a well-formed absolute URL (no network)', () => {
  for (const def of FLAT_WRAPPERS) {
    it(`${def.api}_${def.short} resolves to a valid ${def.host} URL`, () => {
      const { url, query } = resolveFlat(def, minimalParams(def));
      url.should.startWith(def.host, `${def.short}: wrong host`);
      url.should.startWith('https://', `${def.short}: not https`);
      url.should.not.match(/[{}]/, `${def.short}: unresolved token in ${url}`);
      should(query).be.an.Object();
    });
  }

  it('mlb_api teams resolves to https://statsapi.mlb.com/api/v1/teams with default sportId', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'mlb_api' && w.short === 'teams');
    should(def).be.ok();
    const { url, query } = resolveFlat(def, {});
    url.should.equal('https://statsapi.mlb.com/api/v1/teams');
    query.sportId.should.equal(1); // default applied
  });

  it('honours camelCase + snake_case aliases for query params (mapped to the API key)', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'mlb_api' && w.short === 'teams');
    const snake = resolveFlat(def, { sport_id: 11 }).query;
    const camel = resolveFlat(def, { sportId: 11 }).query;
    JSON.stringify(snake).should.equal(JSON.stringify(camel));
    snake.sportId.should.equal(11); // resolved under the API key, not the call-param name
  });

  it('nhl_api_web pbp substitutes the game_id path token', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'nhl_api_web' && w.short === 'pbp');
    const { url } = resolveFlat(def, { game_id: 2024020001 });
    url.should.equal('https://api-web.nhle.com/v1/gamecenter/2024020001/play-by-play');
  });

  it('nhl_stats_rest applies the lang path default + names its own host', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'nhl_stats_rest' && w.short === 'team');
    const { url } = resolveFlat(def, {});
    url.should.equal('https://api.nhle.com/stats/rest/en/team'); // lang defaults to 'en'
  });

  it('nhl_edge fills the game_type default (2) for detail endpoints', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'nhl_edge' && w.short === 'skater_detail');
    const { url } = resolveFlat(def, { player_id: 8480801, season: 20242025 });
    url.should.equal('https://api-web.nhle.com/v1/edge/skater-detail/8480801/20242025/2');
  });

  it('nhl_records resolves a literal-path endpoint to its own host', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'nhl_records' && w.short === 'franchises');
    const { url } = resolveFlat(def, {});
    url.should.equal('https://records.nhl.com/site/api/franchise');
  });

  it('nfl_api standings resolves to https://api.nfl.com with its query defaults', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'nfl_api' && w.short === 'standings');
    should(def).be.ok();
    const { url, query } = resolveFlat(def, {});
    url.should.equal('https://api.nfl.com/football/v2/standings');
    query.season.should.equal(2024);
    query.seasonType.should.equal('REG'); // string code, not ESPN numeric
    query.week.should.equal(1);
    query.limit.should.equal(40);
  });

  it('nfl_api weeks substitutes the season + season_type path tokens', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'nfl_api' && w.short === 'weeks');
    const { url } = resolveFlat(def, { season: 2023, season_type: 'POST' });
    url.should.equal('https://api.nfl.com/football/v2/weeks/season/2023/seasonType/POST');
  });

  it('nfl_api weekly_game_details maps season_type to the `type` query key', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'nfl_api' && w.short === 'weekly_game_details');
    const { query } = resolveFlat(def, { season_type: 'PRE' });
    query.type.should.equal('PRE');
    should(query.seasonType).be.undefined();
  });

  it('nfl_api control keys (headers/parsed) do NOT leak into the query string', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'nfl_api' && w.short === 'standings');
    const { query } = resolveFlat(def, { headers: { Authorization: 'Bearer x' }, parsed: true });
    should(query.headers).be.undefined();
    should(query.parsed).be.undefined();
  });
});

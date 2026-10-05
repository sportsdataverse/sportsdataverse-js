import should from 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  parse_hockeytech_seasons,
  parse_hockeytech_schedule,
  parse_hockeytech_teams,
  parse_hockeytech_team_roster,
  parse_hockeytech_player_stats,
  parse_hockeytech_game_shifts,
  parse_hockeytech_standings,
  parse_hockeytech_leaders,
  parse_hockeytech_pbp,
  parse_hockeytech_game_summary,
  parse_hockeytech_scorebar,
  parse_hockeytech_player_search,
  parse_hockeytech_stats,
  parse_hockeytech_transactions,
  parse_hockeytech_playoff_bracket,
  parse_hockeytech_player_game_log,
} from '../../dist/parsers/hockeytech.js';
import {
  buildHockeytechUrl,
  stripJsonp,
  resolveApiKey,
  resolveLeague,
  HOCKEYTECH_LEAGUES,
  resolveSeasonId,
  hockeytechGet,
  hockeytechErrorReason,
  mostRecentHockeytechSeason,
} from '../../dist/core/hockeytech_runtime.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';
import { configure, resetConfig } from '../../dist/core/config.js';
import { AssetFetchError, NoDataError } from '../../dist/core/errors.js';
import * as FLAT from '../../dist/generated/flat/hockeytech.js';
import sdv from '../../dist/index.js';

// No-network tests for the HockeyTech / LeagueStat flat-API family:
//   - the runtime URL builder honours the league registry, the `gc`-feed
//     `tab=` quirk, the PWHL play-by-play key override, the QMJHL host swap,
//     and the env-var key override;
//   - the JSONP-unwrap (`angular.callbacks._N(...)`) strips correctly;
//   - each parser turns a captured (JSONP-wrapped) fixture into tidy rows and
//     returns [] for empty/malformed input.

const here = dirname(fileURLToPath(import.meta.url));
const fixDir = join(here, '..', 'fixtures', 'hockeytech');
// Read a fixture, strip its JSONP wrapper, and JSON.parse — exactly what the
// runtime getter does, so the fixtures double as a JSONP-strip regression.
function loadFixture(name) {
  return JSON.parse(stripJsonp(readFileSync(join(fixDir, name), 'utf8')));
}

// ---------------------------------------------------------------------------
// Runtime: league registry + URL builder
// ---------------------------------------------------------------------------

describe('core/hockeytech_runtime: league registry', () => {
  it('registers the original five leagues with their web-client defaults', () => {
    ['ahl', 'ohl', 'pwhl', 'qmjhl', 'whl'].forEach((l) => HOCKEYTECH_LEAGUES.should.have.property(l));
    resolveLeague('pwhl').apiKey.should.equal('446521baf8c38984');
    resolveLeague('pwhl').siteId.should.equal(0);
    resolveLeague('qmjhl').clientCode.should.equal('lhjmq'); // NOT "qmjhl"
  });

  it('throws on an unknown league', () => {
    (() => resolveLeague('nhl')).should.throw(/Unknown HockeyTech league/);
  });

  it('resolveApiKey applies the PWHL play-by-play key override', () => {
    resolveApiKey('pwhl').should.equal('446521baf8c38984'); // default
    resolveApiKey('pwhl', 'gameCenterPlayByPlay').should.equal('694cfeed58c932ee'); // override
    resolveApiKey('ahl', 'gameCenterPlayByPlay').should.equal('ccb91f29d6744675'); // no override
  });

  it('resolveApiKey honours SDV_<LEAGUE>_API_KEY (env wins over the override)', () => {
    process.env.SDV_PWHL_API_KEY = 'ENV_OVERRIDE';
    try {
      resolveApiKey('pwhl').should.equal('ENV_OVERRIDE');
      resolveApiKey('pwhl', 'gameCenterPlayByPlay').should.equal('ENV_OVERRIDE');
    } finally {
      delete process.env.SDV_PWHL_API_KEY;
    }
  });
});

describe('core/hockeytech_runtime: buildHockeytechUrl', () => {
  it('injects key/client_code/site_id/lang from the league registry', () => {
    const url = buildHockeytechUrl({ league: 'pwhl', feed: 'modulekit', view: 'seasons' });
    url.should.startWith('https://lscluster.hockeytech.com/feed/index.php?');
    url.should.match(/key=446521baf8c38984/);
    url.should.match(/client_code=pwhl/);
    url.should.match(/site_id=0/);
    url.should.match(/lang=en/);
    url.should.match(/feed=modulekit/);
    url.should.match(/view=seasons/);
  });

  it('the gc feed selects its view with tab= (NOT view=)', () => {
    const url = buildHockeytechUrl({ league: 'pwhl', feed: 'gc', view: 'gamesummary', game_id: 74 });
    url.should.match(/tab=gamesummary/);
    url.should.not.match(/view=/);
    url.should.match(/game_id=74/);
  });

  it('the play-by-play view uses the PWHL override key', () => {
    const url = buildHockeytechUrl({ league: 'pwhl', feed: 'statviewfeed', view: 'gameCenterPlayByPlay', game_id: 74 });
    url.should.match(/key=694cfeed58c932ee/);
    url.should.match(/view=gameCenterPlayByPlay/); // statviewfeed still uses view=
  });

  it('routes QMJHL to the cluster.leaguestat.com host with client_code=lhjmq', () => {
    const url = buildHockeytechUrl({ league: 'qmjhl', feed: 'modulekit', view: 'seasons' });
    url.should.startWith('https://cluster.leaguestat.com/feed/index.php?');
    url.should.match(/client_code=lhjmq/);
  });

  it('appends per-view params verbatim and drops empty values', () => {
    const url = buildHockeytechUrl({ league: 'pwhl', feed: 'modulekit', view: 'scorebar', league_id: 1, limit: 50, blank: '' });
    url.should.match(/league_id=1/);
    url.should.match(/limit=50/);
    url.should.not.match(/blank=/);
  });

  it('throws when `league` is missing', () => {
    (() => buildHockeytechUrl({ feed: 'modulekit', view: 'seasons' })).should.throw(/missing required `league`/);
  });
});

describe('core/hockeytech_runtime: stripJsonp', () => {
  it('strips an angular.callbacks._N(...) wrapper', () => {
    stripJsonp('angular.callbacks._0({"a":1})').should.equal('{"a":1}');
  });
  it('strips a bare (...) wrapper', () => {
    stripJsonp('([1,2,3])').should.equal('[1,2,3]');
  });
  it('leaves un-wrapped JSON untouched', () => {
    stripJsonp('{"x":2}').should.equal('{"x":2}');
    stripJsonp('  [1]  ').should.equal('[1]');
  });
});

// ---------------------------------------------------------------------------
// Parsers (over captured, JSONP-wrapped fixtures)
// ---------------------------------------------------------------------------

describe('parsers/hockeytech: parse_hockeytech_seasons', () => {
  it('unrolls SiteKit.Seasons into one row per season', () => {
    const rows = parse_hockeytech_seasons(loadFixture('pwhl_seasons.jsonp'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('season_id');
    rows[0].should.have.property('season_name');
  });
  it('returns [] for empty / malformed input', () => {
    parse_hockeytech_seasons({}).should.eql([]);
    parse_hockeytech_seasons(null).should.eql([]);
    parse_hockeytech_seasons({ SiteKit: {} }).should.eql([]);
  });
});

describe('parsers/hockeytech: parse_hockeytech_schedule', () => {
  it('unrolls SiteKit.Scorebar into one row per game', () => {
    const rows = parse_hockeytech_schedule(loadFixture('pwhl_scorebar.jsonp'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('id'); // PWHL scorebar keys on `ID` -> `id`
    rows[0].should.have.property('home_code');
    rows[0].should.have.property('visitor_goals');
  });
});

describe('parsers/hockeytech: parse_hockeytech_pbp', () => {
  it('lifts each {event,details} into a flat row (one per play)', () => {
    const rows = parse_hockeytech_pbp(loadFixture('pwhl_pbp.jsonp'));
    rows.length.should.be.above(0);
    rows.every((r) => r.event !== undefined).should.be.true();
    // a goalie_change row's nested details are deep-flattened + snake_cased
    const gc = rows.find((r) => r.event === 'goalie_change');
    should(gc).be.ok();
    gc.should.have.property('goalie_coming_in_id');
  });
  it('returns [] for a non-array payload', () => {
    parse_hockeytech_pbp({}).should.eql([]);
    parse_hockeytech_pbp(null).should.eql([]);
  });
});

describe('parsers/hockeytech: parse_hockeytech_game_summary', () => {
  it('returns the goals sub-frame (one row per goal) from GC.Gamesummary', () => {
    const rows = parse_hockeytech_game_summary(loadFixture('pwhl_gamesummary.jsonp'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('period_id');
  });
  it('returns [] when GC.Gamesummary / goals is absent', () => {
    parse_hockeytech_game_summary({}).should.eql([]);
    parse_hockeytech_game_summary({ GC: { Gamesummary: {} } }).should.eql([]);
  });
});

describe('parsers/hockeytech: statviewfeed + modulekit shape parsers', () => {
  it('parse_hockeytech_standings unrolls sections[].data[].row', () => {
    const payload = [
      {
        sections: [
          {
            headers: {},
            data: [
              { prop: {}, row: { team_code: 'BOS', points: 30, name: 'Fleet' } },
              { prop: {}, row: { team_code: 'MTL', points: 28, name: 'Victoire' } },
            ],
          },
        ],
      },
    ];
    const rows = parse_hockeytech_standings(payload);
    rows.length.should.equal(2);
    rows[0].should.have.property('team_code', 'BOS');
    rows[0].should.have.property('points', 30);
  });

  it('parse_hockeytech_leaders flattens skaters.<Category>.results[]', () => {
    const payload = {
      skaters: {
        Points: { results: [{ rank: 1, player_id: '5', name: 'A. Player' }], sortKey: 'points' },
        Goals: { results: [{ rank: 1, player_id: '7', name: 'B. Player' }], sortKey: 'goals' },
      },
    };
    const rows = parse_hockeytech_leaders(payload);
    rows.length.should.equal(2);
    rows.map((r) => r.category).sort().should.eql(['Goals', 'Points']);
    rows[0].should.have.property('player_type', 'skaters');
  });

  it('parse_hockeytech_teams / team_roster unroll their SiteKit array', () => {
    parse_hockeytech_teams({ SiteKit: { Teamsbyseason: [{ id: 1, name: 'Fleet' }] } }).length.should.equal(1);
    parse_hockeytech_team_roster({ SiteKit: { Roster: [{ id: 9, first_name: 'A' }] } }).length.should.equal(1);
  });

  it('parse_hockeytech_player_stats concatenates regular/exhibition/playoff with stat_class', () => {
    const payload = {
      SiteKit: {
        Player: {
          regular: [{ season_id: '8', games_played: '10' }],
          playoff: [{ season_id: '6', games_played: '4' }],
        },
      },
    };
    const rows = parse_hockeytech_player_stats(payload);
    rows.length.should.equal(2);
    rows.map((r) => r.stat_class).sort().should.eql(['playoff', 'regular']);
  });

  it('parse_hockeytech_game_shifts concatenates the home + visitor sides', () => {
    const payload = { SiteKit: { Gameshifts: { home: [{ player_id: 1 }], visitor: [{ player_id: 2 }] } } };
    const rows = parse_hockeytech_game_shifts(payload);
    rows.length.should.equal(2);
    rows.map((r) => r.side).sort().should.eql(['home', 'visitor']);
  });

  it('every statviewfeed/modulekit parser returns [] for empty input', () => {
    parse_hockeytech_standings([]).should.eql([]);
    parse_hockeytech_leaders({}).should.eql([]);
    parse_hockeytech_teams({}).should.eql([]);
    parse_hockeytech_team_roster(null).should.eql([]);
    parse_hockeytech_player_stats({}).should.eql([]);
    parse_hockeytech_game_shifts({}).should.eql([]);
  });
});

describe('parsers/hockeytech: registry wiring', () => {
  it('registers the hockeytech parsers in PARSERS (scorebar alongside schedule)', () => {
    for (const name of [
      'parse_hockeytech_seasons',
      'parse_hockeytech_schedule',
      'parse_hockeytech_teams',
      'parse_hockeytech_team_roster',
      'parse_hockeytech_player_stats',
      'parse_hockeytech_game_shifts',
      'parse_hockeytech_standings',
      'parse_hockeytech_leaders',
      'parse_hockeytech_pbp',
      'parse_hockeytech_game_summary',
      'parse_hockeytech_scorebar',
    ]) {
      (typeof PARSERS[name]).should.equal('function', `missing ${name}`);
      should(parserFor(name)).equal(PARSERS[name]);
    }
  });

  it('parse_hockeytech_scorebar is the schedule parser under a second name (same SiteKit.Scorebar)', () => {
    const fx = loadFixture('pwhl_scorebar.jsonp');
    const rows = parse_hockeytech_scorebar(fx);
    rows.length.should.be.above(0);
    rows.should.eql(parse_hockeytech_schedule(fx));
  });
});

describe('hockeytech: 20-league registry + new views', () => {
  const NEW = ['echl','sphl','chl','ushl','bchl','ajhl','sjhl','ojhl','cchl','gojhl','mhl','nojhl','vijhl','kijhl','mjhl'];
  it('registers all 20 leagues with py keys/ids', () => {
    Object.keys(HOCKEYTECH_LEAGUES).length.should.equal(20);
    for (const l of NEW) {
      const c = resolveLeague(l);
      c.leagueId.should.equal(1); c.siteId.should.equal(0); c.clientCode.should.equal(l);
      c.apiKey.should.match(/^[0-9a-f]{16}$/);
      c.baseUrl.should.match(/^https:\/\/lscluster\.hockeytech\.com/);
    }
    resolveLeague('echl').apiKey.should.equal('2c2b89ea7345cae8');
    resolveLeague('mjhl').apiKey.should.equal('f894c324fe5fd8f0');
    resolveLeague('pwhl').pbpStyle.should.equal('hockeytech_a');
    resolveLeague('ushl').pbpStyle.should.equal('hockeytech_b');
  });
  it('builds URLs and honours env key override for new leagues', () => {
    const u = buildHockeytechUrl({ league: 'bchl', feed: 'modulekit', view: 'seasons' });
    u.should.match(/client_code=bchl/); u.should.match(/key=f3ed30007ad2124e/);
    process.env.SDV_BCHL_API_KEY = 'abc';
    try { buildHockeytechUrl({ league: 'bchl', view: 'seasons' }).should.match(/key=abc/); }
    finally { delete process.env.SDV_BCHL_API_KEY; }
  });
  it('seasons parser derives season_yr and game_type_label (real PWHL capture)', () => {
    const rows = parse_hockeytech_seasons(loadFixture('pwhl_seasons.jsonp'));
    rows.map((r) => [r.season_yr, r.game_type_label]).should.eql([[2027, 'preseason'], [2026, 'playoffs'], [2026, 'regular']]);
  });
  it('scorebar / search / stats / transactions / bracket / game log parse real captures', () => {
    parse_hockeytech_scorebar(loadFixture('pwhl_scorebar.jsonp')).length.should.be.above(0);
    const s = parse_hockeytech_player_search(loadFixture('pwhl_searchplayers.jsonp'));
    s.length.should.equal(2); s[0].should.have.property('player_id');
    const st = parse_hockeytech_stats(loadFixture('pwhl_statviewtype.jsonp'));
    st.length.should.equal(3); st[0].should.have.property('player_id');
    const tx = parse_hockeytech_transactions(loadFixture('pwhl_transactions.jsonp'));
    tx.length.should.equal(3); tx[0].should.have.property('ttype_text');
    const br = parse_hockeytech_playoff_bracket(loadFixture('pwhl_brackets.jsonp'));
    br.length.should.equal(3); br[0].should.have.property('round_name');
    br[0].should.have.property('series_letter');
    const gl = parse_hockeytech_player_game_log(loadFixture('pwhl_player_gamebygame.jsonp'));
    gl.length.should.equal(1); gl[0].should.have.property('date_played');
  });
  it('new parsers return [] on empty input', () => {
    for (const f of [parse_hockeytech_scorebar, parse_hockeytech_player_search, parse_hockeytech_stats,
      parse_hockeytech_transactions, parse_hockeytech_playoff_bracket, parse_hockeytech_player_game_log]) {
      f({}).should.eql([]); f(null).should.eql([]);
    }
  });
  it('resolveSeasonId short-circuits on seasonId and requires season otherwise', async () => {
    (await resolveSeasonId('echl', { seasonId: 70 })).should.equal(70);
    let err; try { await resolveSeasonId('echl', {}); } catch (e) { err = e; }
    err.message.should.match(/Provide either season/);
  });
});

describe('hockeytech: league_id injection', () => {
  it('sends the registry leagueId on scorebar/transactions/brackets, explicit wins, none elsewhere', () => {
    buildHockeytechUrl({ league: 'ahl', feed: 'modulekit', view: 'scorebar' }).should.match(/league_id=4/);
    buildHockeytechUrl({ league: 'whl', feed: 'modulekit', view: 'transactions' }).should.match(/league_id=7/);
    buildHockeytechUrl({ league: 'qmjhl', feed: 'modulekit', view: 'brackets' }).should.match(/league_id=6/);
    buildHockeytechUrl({ league: 'ahl', feed: 'statviewfeed', view: 'teams' }).should.match(/league_id=4/);
    buildHockeytechUrl({ league: 'ahl', view: 'scorebar', league_id: 9 }).should.match(/league_id=9/);
    buildHockeytechUrl({ league: 'ahl', feed: 'modulekit', view: 'seasons' }).should.not.match(/league_id/);
  });
});

// ---------------------------------------------------------------------------
// Runtime body classification + every hockeytechGet caller (JS-1)
// ---------------------------------------------------------------------------

const readFix = (name) => readFileSync(join(fixDir, name), 'utf8');
// Real HTTP-200 bodies: MJHL gc/gamesummary access denied (2026-10-05) and the two error
// sentinels captured 2026-07-12 (see test/fixtures/hockeytech/README.md).
const DENIED = () => readFix(join('analytics', 'live-2026-10-05', 'mjhl_summary_7301.txt'));
const UNDEFINED_TAB = () => readFix('pwhl_streaks_undefined_tab.json');
const INVALID_VIEW = () => readFix('pwhl_svf_streaks_invalidview.json');
const SEASONS = () => readFix('pwhl_seasons.jsonp');

/** Route the hockeytech family through a scripted transport; `respond(req)` -> {status, data}. */
function useTransport(respond, extra = {}) {
  const calls = [];
  const t = async (req) => {
    calls.push(req);
    return { headers: {}, url: req.url, status: 200, ...respond(req) };
  };
  configure({ transport: { hockeytech: t }, retries: 0, ...extra });
  return calls;
}

describe('core/hockeytech_runtime: body classification', () => {
  afterEach(() => resetConfig());
  const get = () => hockeytechGet('ignored', { params: { league: 'pwhl', feed: 'modulekit', view: 'seasons' } });

  it('valid JSONP -> the parsed payload', async () => {
    useTransport(() => ({ data: SEASONS() }));
    (await get()).SiteKit.Seasons.length.should.equal(3);
  });

  it('the recognised access-denied reply (real MJHL body) -> {} (the source never has it)', async () => {
    useTransport(() => ({ data: DENIED() }));
    (await get()).should.eql({});
    for (const v of ['﻿Feed type access denied.\r\n', '  feed type access denied']) {
      useTransport(() => ({ data: v }));
      (await get()).should.eql({});
    }
  });

  it('an error sentinel (real Undefined Tab / InvalidView bodies) -> AssetFetchError', async () => {
    useTransport(() => ({ data: UNDEFINED_TAB() }));
    await get().should.be.rejectedWith(AssetFetchError, { message: /Undefined Tab streaks/ });
    useTransport(() => ({ data: INVALID_VIEW() }));
    await get().should.be.rejectedWith(AssetFetchError, { message: /InvalidView error: streaks/ });
  });

  it('an unparseable or empty 200 body -> AssetFetchError (never {})', async () => {
    for (const body of ['<html><body>Service Unavailable</body></html>', 'Feed type access denied. Contact us', '', null]) {
      useTransport(() => ({ data: body }));
      const err = await get().should.be.rejectedWith(AssetFetchError);
      err.status.should.equal(200);
      err.url.should.equal('https://lscluster.hockeytech.com/feed/index.php'); // no key-bearing query
    }
  });

  it('HTTP 404 -> NoDataError; 5xx -> AssetFetchError', async () => {
    useTransport(() => ({ status: 404, data: '' }));
    await get().should.be.rejectedWith(NoDataError);
    useTransport(() => ({ status: 503, data: '' }));
    await get().should.be.rejectedWith(AssetFetchError);
  });

  it('a missing / unknown league throws before any request (was a silent {})', async () => {
    const calls = useTransport(() => ({ data: SEASONS() }));
    await hockeytechGet('ignored', { params: { view: 'seasons' } }).should.be.rejectedWith(/missing required `league`/);
    await hockeytechGet('ignored', { params: { league: 'nhl', view: 'seasons' } }).should.be.rejectedWith(/Unknown HockeyTech league/);
    calls.length.should.equal(0);
  });

  it('hockeytechErrorReason: null for healthy real payloads', () => {
    should(hockeytechErrorReason(loadFixture('pwhl_seasons.jsonp'))).be.null();
    should(hockeytechErrorReason(loadFixture('pwhl_pbp.jsonp'))).be.null();
    should(hockeytechErrorReason(loadFixture('pwhl_gamesummary.jsonp'))).be.null();
    hockeytechErrorReason(JSON.parse(UNDEFINED_TAB())).should.equal('Undefined Tab streaks');
  });

  it('sends the configured User-Agent (no hard-coded +https token)', async () => {
    let calls = useTransport(() => ({ data: SEASONS() }));
    await get();
    calls[0].headers['User-Agent'].should.equal('Mozilla/5.0 (compatible; sportsdataverse-js/3.x)');
    calls[0].headers.Referer.should.equal('https://www.thepwhl.com/');
    calls = useTransport(() => ({ data: SEASONS() }), { userAgent: 'my-agent/1.0' });
    await get();
    calls[0].headers['User-Agent'].should.equal('my-agent/1.0');
  });
});

describe('hockeytech: every hockeytechGet caller under the new classification', () => {
  afterEach(() => resetConfig());
  const wrappers = Object.keys(FLAT).filter((k) => /^hockeytech_/.test(k));

  it('all 16 flat wrappers: access denied -> [] parsed / {} raw; error sentinel -> AssetFetchError', async () => {
    wrappers.length.should.equal(16);
    for (const name of wrappers) {
      useTransport(() => ({ data: DENIED() }));
      (await FLAT[name]({ league: 'mjhl', parsed: true })).should.eql([], name);
      (await FLAT[name]({ league: 'mjhl' })).should.eql({}, name);
      useTransport(() => ({ data: UNDEFINED_TAB() }));
      await FLAT[name]({ league: 'pwhl', parsed: true }).should.be.rejectedWith(AssetFetchError);
    }
  });

  it('season helpers: a failed fetch throws instead of reading as "no season"', async () => {
    useTransport(() => ({ data: '<html>oops</html>' }));
    await mostRecentHockeytechSeason('ahl').should.be.rejectedWith(AssetFetchError); // was 2026
    await sdv.hockeytech.hockeytech_season_id('ahl').should.be.rejectedWith(AssetFetchError); // was []
    useTransport(() => ({ status: 503, data: '' }));
    await mostRecentHockeytechSeason('ahl').should.be.rejectedWith(AssetFetchError);
  });

  it('season helpers: real seasons -> newest regular season_yr; an answered-but-empty list -> NoDataError', async () => {
    useTransport(() => ({ data: SEASONS() }));
    // id 10 is the 2026-27 preseason, listed before its regular season: the default is 2026 (py: pwhl 2026)
    (await mostRecentHockeytechSeason('pwhl')).should.equal(2026);
    useTransport(() => ({ data: '{"SiteKit":{"Seasons":[]}}' }));
    const err = await mostRecentHockeytechSeason('pwhl').should.be.rejectedWith(NoDataError, { message: /lists no season/ });
    err.should.not.be.instanceOf(AssetFetchError);
    (await sdv.hockeytech.hockeytech_season_id('pwhl')).should.eql([]); // the list itself stays a list
  });

  it('analytics feeds: a GC Undefined-Tab sentinel on the game summary -> AssetFetchError (was blank meta)', async () => {
    // GC-rooted variant of the real SiteKit capture (same sentinel key, gc envelope).
    const gcSentinel = JSON.stringify({ GC: JSON.parse(UNDEFINED_TAB()).SiteKit });
    useTransport((req) => ({
      data:
        req.query.view === 'gameCenterPlayByPlay'
          ? readFix('pwhl_pbp.jsonp')
          : req.query.tab === 'gamesummary'
            ? gcSentinel
            : '{"SiteKit":{"Gameshifts":{}}}',
    }));
    await sdv.hockeytech.pwhl_pbp(74).should.be.rejectedWith(AssetFetchError, { message: /Undefined Tab/ });
  });
});

describe('hockeytech: resolveSeasonId (gameType filter + PWHL fallback)', () => {
  afterEach(() => resetConfig());

  it('filters the real seasons list by end-year AND gameType (default regular)', async () => {
    useTransport(() => ({ data: SEASONS() }));
    (await resolveSeasonId('pwhl', { season: 2026 })).should.equal(8);
    (await resolveSeasonId('pwhl', { season: 2026, gameType: 'playoffs' })).should.equal(9);
    (await resolveSeasonId('pwhl', { season: 2027, gameType: 'preseason' })).should.equal(10);
    await resolveSeasonId('ahl', { season: 2027 }).should.be.rejectedWith(/No ahl season for season=2027, gameType=regular/);
  });

  it('PWHL falls back to its table when the answered list lacks the season, or the fetch failed', async () => {
    useTransport(() => ({ data: SEASONS() })); // the live list starts at 2025-26
    (await resolveSeasonId('pwhl', { season: 2024 })).should.equal(1);
    (await resolveSeasonId('pwhl', { season: 2024, gameType: 'playoffs' })).should.equal(3);
    useTransport(() => ({ data: '<html>oops</html>' })); // unparseable -> AssetFetchError -> fallback
    (await resolveSeasonId('pwhl', { season: 2025 })).should.equal(5);
    await resolveSeasonId('pwhl', { season: 2019 }).should.be.rejectedWith(/No pwhl season/);
    await resolveSeasonId('echl', { season: 2025 }).should.be.rejectedWith(AssetFetchError);
  });

  it('PWHL does not fall back on a non-SdvError (a programming error is rethrown, not masked)', async () => {
    // request() wraps a throwing transport in AssetFetchError, so raise the TypeError from the
    // response instead: it escapes the fetch unwrapped.
    configure({
      retries: 0,
      transport: {
        hockeytech: async (req) => ({
          status: 200,
          headers: {},
          url: req.url,
          get data() {
            throw new TypeError('boom');
          },
        }),
      },
    });
    const err = await resolveSeasonId('pwhl', { season: 2025 }).should.be.rejectedWith(TypeError, { message: 'boom' });
    err.should.not.be.instanceOf(AssetFetchError);
  });
});

describe('hockeytech: T5 view URL defaults (generated wrappers)', () => {
  afterEach(() => resetConfig());

  it('each new view sends its feed/view and documented defaults', async () => {
    const calls = useTransport(() => ({ data: '{"SiteKit":{}}' }));
    await FLAT.hockeytech_scorebar({ league: 'ahl' });
    await FLAT.hockeytech_stats({ league: 'pwhl', season_id: 8 });
    await FLAT.hockeytech_player_game_log({ league: 'pwhl', player_id: 36, season_id: 7 });
    await FLAT.hockeytech_player_search({ league: 'pwhl', search_term: 'Poulin' });
    await FLAT.hockeytech_transactions({ league: 'whl' });
    await FLAT.hockeytech_playoff_bracket({ league: 'qmjhl', season_id: 9 });
    const q = calls.map((c) => c.query);
    q[0].should.containEql({ feed: 'modulekit', view: 'scorebar', numberofdaysback: '3', numberofdaysahead: '3', limit: '100', league_id: '4', client_code: 'ahl' });
    q[1].should.containEql({ feed: 'modulekit', view: 'statviewtype', type: 'skaters', season_id: '8' });
    q[2].should.containEql({ feed: 'modulekit', view: 'player', category: 'gamebygame', player_id: '36', season_id: '7' });
    q[3].should.containEql({ feed: 'modulekit', view: 'searchplayers', search_term: 'Poulin' });
    q[4].should.containEql({ feed: 'modulekit', view: 'transactions', league_id: '7' });
    q[5].should.containEql({ feed: 'modulekit', view: 'brackets', season_id: '9', league_id: '6', client_code: 'lhjmq' });
    calls[5].url.should.equal('https://cluster.leaguestat.com/feed/index.php');
    for (const c of q) {
      c.should.have.property('lang', 'en');
      c.should.not.have.property('league'); // the control param never reaches the feed
    }
  });
});

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
} from '../../dist/parsers/hockeytech.js';
import {
  buildHockeytechUrl,
  stripJsonp,
  resolveApiKey,
  resolveLeague,
  HOCKEYTECH_LEAGUES,
} from '../../dist/core/hockeytech_runtime.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';

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
  it('registers the five leagues with their web-client defaults', () => {
    Object.keys(HOCKEYTECH_LEAGUES).sort().should.eql(['ahl', 'ohl', 'pwhl', 'qmjhl', 'whl']);
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
  it('registers all ten hockeytech parsers in PARSERS', () => {
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
    ]) {
      (typeof PARSERS[name]).should.equal('function', `missing ${name}`);
      should(parserFor(name)).equal(PARSERS[name]);
    }
  });
});

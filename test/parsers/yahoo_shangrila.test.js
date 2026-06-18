import should from 'should';
import {
  parse_yahoo_list,
  parse_yahoo_stats,
} from '../../dist/parsers/yahoo.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';
import sdv, { FLAT_WRAPPERS } from '../../dist/index.js';
import { FLAT_HOSTS } from '../../dist/core/client.js';

const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());

// Unit tests for the Yahoo Sports shangrila stats-graph parsers. Inline raw
// GraphQL-envelope payloads (no network) -> tidy rows: row count + snake_cased
// flattened keys + the nested stat-array unroll. Covers the generic
// `{ data }`-envelope flattener (default) plus the dedicated stat-array
// unroller, and a flat-contract metadata block asserting the family registers
// on graphite-secure.sports.yahoo.com under the `yahoo` namespace with no auth
// and a resolvable parser per endpoint.

describe('parsers/yahoo: parse_yahoo_list (generic)', () => {
  it('peels the GraphQL data envelope + flattens the first root list', () => {
    const raw = {
      data: { leagues: [{ shortName: 'ncaaf', fullName: 'NCAA Football' }] },
      extensions: {},
    };
    const rows = parse_yahoo_list(raw);
    rows.length.should.equal(1);
    rows[0].should.have.property('short_name', 'ncaaf');
    rows[0].should.have.property('full_name', 'NCAA Football');
  });

  it('flattens a games root list (one row per game)', () => {
    const raw = { data: { games: [{ gameId: 1 }, { gameId: 2 }] } };
    const rows = parse_yahoo_list(raw);
    rows.length.should.equal(2);
    rows[1].should.have.property('game_id', 2);
  });

  it('emits a single root object with no inner list as one row', () => {
    const rows = parse_yahoo_list({ data: { leagueId: 'nfl', name: 'NFL' } });
    rows.length.should.equal(1);
    rows[0].should.have.property('league_id', 'nfl');
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_yahoo_list({ data: {} }).should.eql([]);
    parse_yahoo_list(null).should.eql([]);
    parse_yahoo_list('nope').should.eql([]);
  });
});

describe('parsers/yahoo: parse_yahoo_stats', () => {
  it('unrolls leagues[].footballStats[] into one row per player w/ league meta', () => {
    const raw = {
      data: {
        leagues: [
          {
            shortName: 'ncaaf',
            name: 'NCAA Football',
            footballStats: [
              { player: 'QB One', stats: { passYards: 4000 } },
              { player: 'QB Two', stats: { passYards: 3800 } },
            ],
          },
        ],
      },
    };
    const rows = parse_yahoo_stats(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('player', 'QB One');
    rows[0].should.have.property('short_name', 'ncaaf'); // league meta prefixed
    rows[0].should.have.property('stats_pass_yards', 4000); // deep-flatten
  });

  it('unrolls a leaders[] stat array too', () => {
    const raw = {
      data: { leagues: [{ name: 'NFL', leaders: [{ rank: 1, name: 'A' }, { rank: 2, name: 'B' }] }] },
    };
    const rows = parse_yahoo_stats(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('rank', 1);
    rows[0].should.have.property('name', 'A');
  });

  it('falls back to flattening the root list when no nested stat array', () => {
    const raw = { data: { leagues: [{ shortName: 'nba', name: 'NBA' }] } };
    const rows = parse_yahoo_stats(raw);
    rows.length.should.equal(1);
    rows[0].should.have.property('short_name', 'nba');
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_yahoo_stats({ data: {} }).should.eql([]);
    parse_yahoo_stats(null).should.eql([]);
  });
});

describe('parsers/yahoo: registry wiring', () => {
  it('registers both yahoo parsers by name', () => {
    for (const name of ['parse_yahoo_list', 'parse_yahoo_stats']) {
      (typeof PARSERS[name]).should.equal('function', `missing ${name}`);
      should(parserFor(name)).equal(PARSERS[name]);
    }
  });
});

describe('yahoo flat-API family metadata (flat-contract style)', () => {
  const family = () => FLAT_WRAPPERS.filter((w) => w.api === 'yahoo');

  it('registers the yahoo family (105 endpoints) on https://graphite-secure.sports.yahoo.com', () => {
    const rows = family();
    rows.length.should.equal(105);
    FLAT_HOSTS.yahoo.should.equal('https://graphite-secure.sports.yahoo.com');
    for (const w of rows) w.host.should.equal('https://graphite-secure.sports.yahoo.com');
  });

  it('every yahoo wrapper names a registered parser, none auth', () => {
    for (const w of family()) {
      (typeof w.parser).should.equal('string', `parser missing on ${w.short}`);
      w.parser.should.startWith('parse_yahoo_');
      (typeof parserFor(w.parser)).should.equal('function', `parser ${w.parser} not registered`);
      should(w.auth).not.be.true(`unexpected auth flag on yahoo_${w.short}`);
    }
  });

  it('uses the generic list parser as the default for most endpoints', () => {
    const rows = family();
    const generic = rows.filter((w) => w.parser === 'parse_yahoo_list').length;
    generic.should.be.above(rows.length / 2);
  });

  it('routes the stats queries to the dedicated stats parser', () => {
    const stats = family().filter((w) => w.parser === 'parse_yahoo_stats');
    stats.length.should.equal(25);
    stats.map((w) => w.short).should.containEql('league_stats_individual');
    stats.map((w) => w.short).should.containEql('season_team_stats_football_offense');
  });
});

describe('yahoo namespace (both stems share sdv.yahoo)', () => {
  it('creates the standalone sdv.yahoo namespace with both stems (snake + camel)', () => {
    // `yahoo` is NOT a league — the namespace is created from scratch by the
    // flat merge; two hosts (editorial + shangrila) share it.
    should(sdv.yahoo).be.an.Object();
    for (const snake of [
      'yahoo_scores_scoreboard',
      'yahoo_scores_boxscore',
      'yahoo_league_standings',
      'yahoo_league_stats_individual',
    ]) {
      const camel = toCamel(snake);
      (typeof sdv.yahoo[snake]).should.equal('function', `missing ${snake}`);
      (typeof sdv.yahoo[camel]).should.equal('function', `missing ${camel}`);
      sdv.yahoo[camel].should.equal(sdv.yahoo[snake], `${camel} and ${snake} differ`);
    }
  });
});

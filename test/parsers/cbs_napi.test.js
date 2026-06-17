import should from 'should';
import {
  parse_cbs_napi_list,
  parse_cbs_napi_scoreboard,
  parse_cbs_napi_standings,
  parse_cbs_napi_odds,
} from '../../dist/parsers/cbs_napi.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';
import { FLAT_WRAPPERS } from '../../dist/index.js';
import { FLAT_HOSTS } from '../../dist/core/client.js';

// Unit tests for the CBS Sports NAPI parsers. Inline raw payloads (no network)
// -> tidy rows: row count + snake_cased flattened keys. Covers the generic
// {data}-envelope flattener plus every dedicated parser (scoreboard / standings
// / odds unrolling), and a flat-contract metadata block asserting the family
// registers correctly on the CBS host with no auth.

describe('parsers/cbs_napi: parse_cbs_napi_list (generic flattener)', () => {
  it('unwraps the {data} envelope around a bare list', () => {
    const raw = {
      data: [
        { playerId: 1, firstName: 'John', lastName: 'Doe', batsHand: 'R' },
        { playerId: 2, firstName: 'Jane', lastName: 'Roe', batsHand: 'L' },
      ],
    };
    const rows = parse_cbs_napi_list(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('player_id', 1); // playerId -> player_id
    rows[0].should.have.property('first_name', 'John');
    rows[0].should.have.property('bats_hand', 'R');
  });

  it('finds the first inner list under a known list key', () => {
    parse_cbs_napi_list({ data: { rows: [{ teamId: 7, name: 'A' }] } })[0].should.have.property(
      'team_id',
      7
    );
    parse_cbs_napi_list({ data: { items: [{ id: 'x' }] } })[0].should.have.property('id', 'x');
  });

  it('falls back to the first array-of-objects own property', () => {
    const rows = parse_cbs_napi_list({ data: { players: [{ jerseyNo: 12 }] } });
    rows[0].should.have.property('jersey_no', 12);
  });

  it('emits a single resource object (no inner list) as one row', () => {
    const rows = parse_cbs_napi_list({ data: { teamId: 5, location: { city: 'Boston' } } });
    rows.length.should.equal(1);
    rows[0].should.have.property('team_id', 5);
    rows[0].should.have.property('location_city', 'Boston'); // deep-flatten
  });

  it('also accepts an un-enveloped payload (bare array / object)', () => {
    parse_cbs_napi_list([{ id: 9 }])[0].should.have.property('id', 9);
    parse_cbs_napi_list({ venueId: 3 })[0].should.have.property('venue_id', 3);
  });

  it('returns [] for empty / error-envelope / malformed payloads', () => {
    parse_cbs_napi_list({ data: [] }).should.eql([]);
    parse_cbs_napi_list({ data: {} }).should.eql([]);
    parse_cbs_napi_list({ error: 'not found' }).should.eql([]); // error envelope -> []
    parse_cbs_napi_list(null).should.eql([]);
    parse_cbs_napi_list('nope').should.eql([]);
  });
});

describe('parsers/cbs_napi: parse_cbs_napi_scoreboard', () => {
  it('unrolls a {data:{games:[...]}} scoreboard into one row per game', () => {
    const raw = {
      data: {
        games: [
          { gameId: 100, home: { abbr: 'NE', score: 21 }, away: { abbr: 'BUF', score: 17 } },
          { gameId: 101, home: { abbr: 'KC', score: 30 }, away: { abbr: 'DEN', score: 24 } },
        ],
      },
    };
    const rows = parse_cbs_napi_scoreboard(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('game_id', 100);
    rows[0].should.have.property('home_abbr', 'NE'); // nested deep-flatten
    rows[0].should.have.property('away_score', 17);
  });

  it('accepts a bare array and a single-game object', () => {
    parse_cbs_napi_scoreboard({ data: [{ gameId: 1 }] })[0].should.have.property('game_id', 1);
    parse_cbs_napi_scoreboard({ data: { gameId: 9, status: 'final' } })[0].should.have.property(
      'game_id',
      9
    );
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_cbs_napi_scoreboard({ data: {} }).should.eql([]);
    parse_cbs_napi_scoreboard(null).should.eql([]);
  });
});

describe('parsers/cbs_napi: parse_cbs_napi_standings', () => {
  it('unrolls a {data:{standings:[...]}} table into one row per entry', () => {
    const raw = {
      data: {
        standings: [
          { teamAbbr: 'NE', wins: 12, losses: 5 },
          { teamAbbr: 'BUF', wins: 11, losses: 6 },
        ],
      },
    };
    const rows = parse_cbs_napi_standings(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('team_abbr', 'NE');
    rows[0].should.have.property('wins', 12);
  });

  it('prefixes group_* context for grouped standings', () => {
    const raw = {
      data: {
        groups: [
          {
            name: 'AFC East',
            conference: 'AFC',
            standings: [
              { teamAbbr: 'NE', wins: 12 },
              { teamAbbr: 'BUF', wins: 11 },
            ],
          },
        ],
      },
    };
    const rows = parse_cbs_napi_standings(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('group_name', 'AFC East'); // group label prefixed
    rows[0].should.have.property('group_conference', 'AFC');
    rows[0].should.have.property('team_abbr', 'NE');
  });

  it('accepts a bare array and returns [] when empty', () => {
    parse_cbs_napi_standings({ data: [{ teamAbbr: 'NE', wins: 1 }] })[0].should.have.property(
      'wins',
      1
    );
    parse_cbs_napi_standings({ data: {} }).should.eql([]);
    parse_cbs_napi_standings(null).should.eql([]);
  });
});

describe('parsers/cbs_napi: parse_cbs_napi_odds', () => {
  it('unrolls markets -> books into one row per book line', () => {
    const raw = {
      data: {
        markets: [
          {
            marketId: 'spread',
            books: [
              { bookId: 'dk', line: -3.5, price: -110 },
              { bookId: 'fd', line: -3.0, price: -105 },
            ],
          },
        ],
      },
    };
    const rows = parse_cbs_napi_odds(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('market_id', 'spread'); // market field prefixed onto book
    rows[0].should.have.property('book_id', 'dk');
    rows[0].should.have.property('line', -3.5);
    rows[1].should.have.property('book_id', 'fd');
  });

  it('flattens markets with no nested book list to one row each', () => {
    const rows = parse_cbs_napi_odds({
      data: { markets: [{ marketId: 'ml', overUnder: 47.5 }] },
    });
    rows.length.should.equal(1);
    rows[0].should.have.property('market_id', 'ml');
    rows[0].should.have.property('over_under', 47.5);
  });

  it('accepts a single odds object and returns [] when empty', () => {
    parse_cbs_napi_odds({ data: { gameId: 5, spread: -3 } })[0].should.have.property('game_id', 5);
    parse_cbs_napi_odds({ data: {} }).should.eql([]);
    parse_cbs_napi_odds(null).should.eql([]);
  });
});

describe('parsers/cbs_napi: registry wiring', () => {
  it('registers all four cbs_napi parsers by name', () => {
    for (const name of [
      'parse_cbs_napi_list',
      'parse_cbs_napi_scoreboard',
      'parse_cbs_napi_standings',
      'parse_cbs_napi_odds',
    ]) {
      (typeof PARSERS[name]).should.equal('function', `missing ${name}`);
      should(parserFor(name)).equal(PARSERS[name]);
    }
  });
});

describe('cbs_napi flat-API family metadata (flat-contract style)', () => {
  const family = () => FLAT_WRAPPERS.filter((w) => w.api === 'cbs_napi');

  it('registers the cbs_napi family (82 endpoints) on https://api.cbssports.com', () => {
    const rows = family();
    rows.length.should.equal(82);
    FLAT_HOSTS.cbs_napi.should.equal('https://api.cbssports.com');
    for (const w of rows) w.host.should.equal('https://api.cbssports.com');
  });

  it('every cbs_napi wrapper names a registered parser, none auth', () => {
    for (const w of family()) {
      (typeof w.parser).should.equal('string', `parser missing on ${w.short}`);
      w.parser.should.startWith('parse_cbs_napi_');
      (typeof parserFor(w.parser)).should.equal('function', `parser ${w.parser} not registered`);
      should(w.auth).not.be.true(`unexpected auth flag on cbs_napi_${w.short}`);
    }
  });

  it('uses the generic list parser as the default for most endpoints', () => {
    const rows = family();
    const generic = rows.filter((w) => w.parser === 'parse_cbs_napi_list').length;
    // most endpoints use the generic flattener; the rest use dedicated parsers
    generic.should.be.above(rows.length / 2);
  });
});

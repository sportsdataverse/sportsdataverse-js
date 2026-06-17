import should from 'should';
import {
  parse_yahoo_editorial_list,
  parse_yahoo_editorial_scoreboard,
  parse_yahoo_editorial_boxscore,
} from '../../dist/parsers/yahoo_editorial.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';
import { FLAT_WRAPPERS } from '../../dist/index.js';
import { FLAT_HOSTS } from '../../dist/core/client.js';

// Unit tests for the Yahoo Sports editorial parsers. Inline raw payloads (no
// network) -> tidy rows: row count + snake_cased flattened keys + the keyed-map
// unroll (map key -> `id` column). Covers the generic service-envelope
// flattener plus the two dedicated keyed-map unrollers (scoreboard / boxscore),
// and a flat-contract metadata block asserting the family registers on
// api-secure.sports.yahoo.com under the `yahoo` namespace with no auth and a
// resolvable parser per endpoint.

describe('parsers/yahoo_editorial: parse_yahoo_editorial_list (generic)', () => {
  it('peels the service envelope + flattens the first list-bearing key', () => {
    const raw = { service: { games: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] } };
    const rows = parse_yahoo_editorial_list(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('id', 1);
  });

  it('deep-flattens + snake_cases a single service object into one row', () => {
    const rows = parse_yahoo_editorial_list({ service: { meta: { gameId: 5 } } });
    rows.length.should.equal(1);
    rows[0].should.have.property('meta_game_id', 5);
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_yahoo_editorial_list({ service: {} }).should.eql([]);
    parse_yahoo_editorial_list(null).should.eql([]);
    parse_yahoo_editorial_list('nope').should.eql([]);
  });
});

describe('parsers/yahoo_editorial: parse_yahoo_editorial_scoreboard', () => {
  it('unrolls service.scoreboard.games keyed map into one row per game (key -> id)', () => {
    const raw = {
      service: {
        scoreboard: {
          games: {
            'ncaaf.g.100': { home: { name: 'GA' }, away: { name: 'BAMA' }, status: { type: 'final' } },
            'ncaaf.g.101': { home: { name: 'OSU' }, away: { name: 'MICH' }, status: { type: 'live' } },
          },
        },
      },
    };
    const rows = parse_yahoo_editorial_scoreboard(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('id', 'ncaaf.g.100'); // map key promoted to id
    rows[0].should.have.property('home_name', 'GA'); // deep-flatten
    rows[0].should.have.property('status_type', 'final');
  });

  it('returns [] when the games map is present but empty', () => {
    parse_yahoo_editorial_scoreboard({ service: { scoreboard: { games: {} } } }).should.eql([]);
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_yahoo_editorial_scoreboard(null).should.eql([]);
    parse_yahoo_editorial_scoreboard({ service: {} }).should.eql([]);
  });
});

describe('parsers/yahoo_editorial: parse_yahoo_editorial_boxscore', () => {
  it('unrolls service.boxscore.player_stats keyed map into one row per player', () => {
    const raw = {
      service: {
        boxscore: {
          player_stats: {
            'ncaaf.p.457863': { passing_yards: 312, team: { id: 'GA' } },
            'ncaaf.p.469436': { rushing_yards: 84, team: { id: 'GA' } },
          },
        },
      },
    };
    const rows = parse_yahoo_editorial_boxscore(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('id', 'ncaaf.p.457863');
    rows[0].should.have.property('passing_yards', 312);
    rows[0].should.have.property('team_id', 'GA');
  });

  it('returns [] when player_stats is present but empty', () => {
    parse_yahoo_editorial_boxscore({ service: { boxscore: { player_stats: {} } } }).should.eql([]);
  });

  it('returns [] for empty / malformed payloads', () => {
    parse_yahoo_editorial_boxscore(null).should.eql([]);
    parse_yahoo_editorial_boxscore({ service: {} }).should.eql([]);
  });
});

describe('parsers/yahoo_editorial: registry wiring', () => {
  it('registers all three yahoo_editorial parsers by name', () => {
    for (const name of [
      'parse_yahoo_editorial_list',
      'parse_yahoo_editorial_scoreboard',
      'parse_yahoo_editorial_boxscore',
    ]) {
      (typeof PARSERS[name]).should.equal('function', `missing ${name}`);
      should(parserFor(name)).equal(PARSERS[name]);
    }
  });
});

describe('yahoo_editorial flat-API family metadata (flat-contract style)', () => {
  const family = () => FLAT_WRAPPERS.filter((w) => w.api === 'yahoo_editorial');

  it('registers the yahoo_editorial family (2 endpoints) on https://api-secure.sports.yahoo.com', () => {
    const rows = family();
    rows.length.should.equal(2);
    FLAT_HOSTS.yahoo_editorial.should.equal('https://api-secure.sports.yahoo.com');
    for (const w of rows) w.host.should.equal('https://api-secure.sports.yahoo.com');
  });

  it('every yahoo_editorial wrapper names a registered parser, none auth', () => {
    for (const w of family()) {
      (typeof w.parser).should.equal('string', `parser missing on ${w.short}`);
      w.parser.should.startWith('parse_yahoo_editorial_');
      (typeof parserFor(w.parser)).should.equal('function', `parser ${w.parser} not registered`);
      should(w.auth).not.be.true(`unexpected auth flag on yahoo_editorial_${w.short}`);
    }
  });
});

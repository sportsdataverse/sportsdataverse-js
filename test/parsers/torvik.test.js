import should from 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  parse_torvik_ratings,
  parse_torvik_team_factors,
  parse_torvik_game_stats,
  parse_torvik_player_stats,
  parse_torvik_game_schedule,
} from '../../dist/parsers/torvik.js';
import { FLAT_WRAPPERS } from '../../dist/index.js';
import { resolveFlat } from '../../dist/core/flat.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';

// No-network tests for the BartTorvik / T-Rank flat-API family:
//   - the wrappers resolve to the right barttorvik.com URL (CSV-file paths +
//     the .php endpoints' year/json/csv query params);
//   - each parser turns a captured fixture into tidy rows — header CSV ->
//     janitor-style snake columns; headerless CSV/JSON -> the hardcoded
//     positional column arrays (with nested stat sub-arrays ;-joined);
//   - empty / malformed input returns [].

const here = dirname(fileURLToPath(import.meta.url));
const fixDir = join(here, '..', 'fixtures', 'torvik');
const load = (name) => readFileSync(join(fixDir, name), 'utf8');
const torvikDef = (short) => FLAT_WRAPPERS.find((w) => w.api === 'torvik' && w.short === short);

// ---------------------------------------------------------------------------
// URL resolution (no network)
// ---------------------------------------------------------------------------

describe('torvik: wrapper URL resolution', () => {
  it('ratings -> /{year}_team_results.csv', () => {
    resolveFlat(torvikDef('ratings'), { year: 2024 }).url.should.equal('https://barttorvik.com/2024_team_results.csv');
  });
  it('team_factors -> /{year}_fffinal.csv', () => {
    resolveFlat(torvikDef('team_factors'), { year: 2024 }).url.should.equal('https://barttorvik.com/2024_fffinal.csv');
  });
  it('game_schedule -> /{year}_super_sked.json', () => {
    resolveFlat(torvikDef('game_schedule'), { year: 2024 }).url.should.equal('https://barttorvik.com/2024_super_sked.json');
  });
  it('game_stats -> /getgamestats.php with year + json=1 query', () => {
    const { url, query } = resolveFlat(torvikDef('game_stats'), { year: 2024 });
    url.should.equal('https://barttorvik.com/getgamestats.php');
    query.year.should.equal(2024);
    query.json.should.equal(1); // default applied
  });
  it('player_stats -> /getadvstats.php with year + csv=1 query', () => {
    const { url, query } = resolveFlat(torvikDef('player_stats'), { year: 2024 });
    url.should.equal('https://barttorvik.com/getadvstats.php');
    query.csv.should.equal(1); // default applied
  });
});

// ---------------------------------------------------------------------------
// Parsers (over captured fixtures)
// ---------------------------------------------------------------------------

describe('parsers/torvik: parse_torvik_ratings (header CSV)', () => {
  it('parses the T-Rank CSV header into snake_cased columns', () => {
    const rows = parse_torvik_ratings(load('torvik_ratings.csv'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('rank');
    rows[0].should.have.property('team');
    rows[0].should.have.property('adjoe');
    rows[0].should.have.property('oe_rank'); // "oe Rank" -> oe_rank
  });
  it('returns [] for empty / non-string input', () => {
    parse_torvik_ratings('').should.eql([]);
    parse_torvik_ratings('   ').should.eql([]);
    parse_torvik_ratings(null).should.eql([]);
  });
});

describe('parsers/torvik: parse_torvik_team_factors (header CSV)', () => {
  it('maps % headers to _percent (janitor::clean_names parity)', () => {
    const rows = parse_torvik_team_factors(load('torvik_team_factors.csv'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('team_name'); // TeamName -> team_name
    rows[0].should.have.property('e_fg_percent'); // eFG% -> e_fg_percent
    rows[0].should.have.property('e_fg_percent_def'); // "eFG% Def" -> e_fg_percent_def
  });
});

describe('parsers/torvik: parse_torvik_game_stats (headerless JSON, 31 cols)', () => {
  it('applies the 31 positional columns; ;-joins the nested stat array', () => {
    const rows = parse_torvik_game_stats(load('torvik_game_stats.json'));
    rows.length.should.be.above(0);
    Object.keys(rows[0]).length.should.equal(31);
    rows[0].should.have.property('team');
    rows[0].should.have.property('opp');
    rows[0].should.have.property('win_prob');
    rows[0].should.have.property('overtimes');
    // field 30 (game_stats) ships as a (pre-encoded) per-game stat blob — keep
    // it verbatim as a non-empty string (Torvik double-encodes this one).
    (typeof rows[0].game_stats).should.equal('string');
    rows[0].game_stats.length.should.be.above(0);
  });
  it('accepts an already-parsed array as well as the raw JSON string', () => {
    const arr = JSON.parse(load('torvik_game_stats.json'));
    parse_torvik_game_stats(arr).length.should.equal(arr.length);
  });
  it('returns [] for empty / non-array input', () => {
    parse_torvik_game_stats('').should.eql([]);
    parse_torvik_game_stats(null).should.eql([]);
    parse_torvik_game_stats('not json').should.eql([]);
  });
});

describe('parsers/torvik: parse_torvik_player_stats (headerless CSV, 67 cols)', () => {
  it('applies the 67 positional columns', () => {
    const rows = parse_torvik_player_stats(load('torvik_player_stats.csv'));
    rows.length.should.be.above(0);
    Object.keys(rows[0]).length.should.equal(67);
    rows[0].should.have.property('player_name');
    rows[0].should.have.property('player_id');
    rows[0].should.have.property('bpm');
    rows[0].should.have.property('role');
  });
  it('returns [] for empty input', () => {
    parse_torvik_player_stats('').should.eql([]);
    parse_torvik_player_stats(null).should.eql([]);
  });
});

describe('parsers/torvik: parse_torvik_game_schedule (headerless JSON, 55 cols)', () => {
  it('applies the 55 positional columns; ;-joins the nested gamestats array', () => {
    const rows = parse_torvik_game_schedule(load('torvik_game_schedule.json'));
    rows.length.should.be.above(0);
    Object.keys(rows[0]).length.should.equal(55);
    rows[0].should.have.property('team1');
    rows[0].should.have.property('team2');
    rows[0].should.have.property('winner');
    rows[0].should.have.property('overtimes');
    String(rows[0].gamestats).indexOf(';').should.be.above(-1);
  });
  it('returns [] for empty input', () => {
    parse_torvik_game_schedule('').should.eql([]);
    parse_torvik_game_schedule(null).should.eql([]);
  });
});

describe('parsers/torvik: registry wiring', () => {
  it('registers all five torvik parsers in PARSERS', () => {
    for (const name of [
      'parse_torvik_ratings',
      'parse_torvik_team_factors',
      'parse_torvik_game_stats',
      'parse_torvik_player_stats',
      'parse_torvik_game_schedule',
    ]) {
      (typeof PARSERS[name]).should.equal('function', `missing ${name}`);
      should(parserFor(name)).equal(PARSERS[name]);
    }
  });
});

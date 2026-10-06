import { readFileSync } from 'node:fs';
import should from 'should';
import {
  parse_yahoo_list,
  parse_yahoo_stats,
} from '../../dist/parsers/yahoo.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';
import { isIdColumn } from '../../dist/core/int64.js';
import sdv, { FLAT_WRAPPERS } from '../../dist/index.js';
import { FLAT_HOSTS } from '../../dist/core/client.js';
import { resolveFlat } from '../../dist/core/flat.js';

const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());

// Unit tests for the Yahoo Sports shangrila stats-graph parsers, run on a REAL
// capture (no network): test/fixtures/yahoo/shangrila_season_stats_football_
// passing_ncaaf.json (`seasonStatsFootballPassingNcaaf`, 2025 season, trimmed
// to 3 leaders). Provenance in test/fixtures/yahoo/README.md. The parsers are a
// port of sdv-py's `parse_yahoo_shangrila` / `parse_yahoo_shangrila_tables`;
// test/parsers/parity.test.js holds them to sdv-py's output cell by cell, this
// file pins the concrete rows (counts, names, yards, team abbreviations,
// snake_case keys, string ids). Malformed / empty payloads and the pandas
// typing rules stay synthetic. The flat-contract metadata block asserts the
// family registers on graphite-secure.sports.yahoo.com under the `yahoo`
// namespace with no auth and a resolvable parser per endpoint.

const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`../fixtures/yahoo/${name}`, import.meta.url), 'utf8'));

const SNAKE = /^[a-z0-9_]+$/;
const assertTidy = (rows) => {
  for (const r of rows) {
    for (const [k, v] of Object.entries(r)) {
      k.should.match(SNAKE, `non-snake key ${k}`);
      if (isIdColumn(k) && v != null) (typeof v).should.equal('string', `id column ${k} is ${typeof v}`);
    }
  }
};

const shangrila = fixture('shangrila_season_stats_football_passing_ncaaf.json');
const scoreboard = fixture('editorial_scoreboard_ncaaf.json');

// sdv-py's `leagues` frame of this capture: one row per leader, these columns.
const LEADER_COLUMNS = [
  'stats',
  'player_display_name',
  'player_player_id',
  'player_team_display_name',
  'player_team_abbreviation',
  'player_team_team_logo_url',
  'player_positions',
  'player_alias_url',
  'player_player_cutout',
  'player_player_cutout_url',
];

describe('parsers/yahoo: parse_yahoo_stats (real seasonStatsFootballPassingNcaaf capture)', () => {
  const rows = parse_yahoo_stats(shangrila);

  it('returns the leaders (data.leagues[0].leaders), one row per passer, not the statTypes dictionary', () => {
    rows.length.should.equal(3);
    for (const r of rows) Object.keys(r).should.eql(LEADER_COLUMNS);
    rows.map((r) => r.player_display_name).should.eql(['Drew Mestemaker', 'Darian Mensah', 'Trinidad Chambliss']);
    rows.map((r) => r.player_player_id).should.eql(['ncaaf.p.464024', 'ncaaf.p.406169', 'ncaaf.p.471748']);
    rows.map((r) => r.player_team_abbreviation).should.eql(['OKST', 'MIA', 'MISS']);
    rows.map((r) => r.player_team_display_name).should.eql(['Oklahoma St.', 'Miami (FL)', 'Mississippi']);
    rows[0].should.have.property('player_alias_url', 'https://sports.yahoo.com/ncaaf/players/464024/');
    rows[0].player_team_team_logo_url.should.endWith('/oklahomast.png');
    assertTidy(rows);
  });

  it('keeps the per-player stats list as one JSON cell (sdv-py json.dumps), not widened to columns', () => {
    for (const r of rows) (typeof r.stats).should.equal('string');
    const stats = JSON.parse(rows[0].stats);
    stats.length.should.equal(12);
    stats.should.containEql({ statId: 'PASSING_YARDS', value: '4379' });
    stats.should.containEql({ statId: 'PASSING_TOUCHDOWNS', value: '34' });
    JSON.parse(rows[0].player_positions).should.eql([{ name: 'Quarterback', abbreviation: 'QB', positionId: 'QUARTERBACK' }]);
    for (const r of rows) r.should.not.have.property('stat_id');
  });

  it('a nested object that is null on some leaders and an object on others yields both columns (pandas)', () => {
    // playerCutout: null for the first two passers, {url} for Chambliss ->
    // `player_player_cutout` (null everywhere) AND `player_player_cutout_url`.
    rows.map((r) => r.player_player_cutout).should.eql([null, null, null]);
    should(rows[0].player_player_cutout_url).be.null();
    should(rows[1].player_player_cutout_url).be.null();
    rows[2].player_player_cutout_url.should.endWith('/ncaaf_cutout/players_l/01082026/471748.png');
  });

  it('falls back to the first collection with rows when there is no `leagues` collection', () => {
    parse_yahoo_stats({ data: { statTypes: shangrila.data.statTypes } }).should.eql(parse_yahoo_list(shangrila));
    parse_yahoo_stats({ data: { leagues: [], teams: [{ teamId: 'nfl.t.1' }] } }).should.eql([{ team_id: 'nfl.t.1' }]);
  });
});

describe('parsers/yahoo: parse_yahoo_list (generic, real capture)', () => {
  it('returns the FIRST data collection: the 12-entry statTypes dictionary of this capture', () => {
    const rows = parse_yahoo_list(shangrila);
    rows.length.should.equal(12);
    Object.keys(rows[0]).should.eql(['stat_id', 'display_name', 'abbreviation', 'sort_order']);
    rows[0].should.eql({ stat_id: 'GAMES_PASSING', display_name: 'Games', abbreviation: 'G', sort_order: 'DESCENDING' });
    rows[11].should.have.property('stat_id', 'SACKS_YARDS_LOST');
    new Set(rows.map((r) => r.stat_id)).size.should.equal(12);
    assertTidy(rows);
  });

  it('descends the single-key wrapper leagues[0].leaders (the real subtree) to the same 3 passer rows', () => {
    const rows = parse_yahoo_list({ data: { leagues: shangrila.data.leagues } });
    rows.should.eql(parse_yahoo_stats(shangrila));
    rows[1].should.have.property('player_display_name', 'Darian Mensah');
    rows[1].should.have.property('player_team_abbreviation', 'MIA');
  });

  it('an envelope without `data` (the editorial feed) is [] (sdv-py: a zero-row frame)', () => {
    parse_yahoo_list(scoreboard).should.eql([]);
    parse_yahoo_stats(scoreboard).should.eql([]);
  });
});

describe('parsers/yahoo (synthetic edge cases)', () => {
  it('parse_yahoo_list returns [] for empty / malformed payloads', () => {
    parse_yahoo_list({ data: {} }).should.eql([]);
    parse_yahoo_list({ data: [] }).should.eql([]);
    parse_yahoo_list({ data: { players: [] } }).should.eql([]);
    parse_yahoo_list({ data: { count: 3 } }).should.eql([]);
    parse_yahoo_list({ errors: [{ message: 'nope' }] }).should.eql([]);
    parse_yahoo_list(null).should.eql([]);
    parse_yahoo_list('nope').should.eql([]);
  });

  it('parse_yahoo_stats returns [] for empty / malformed payloads', () => {
    parse_yahoo_stats({ data: {} }).should.eql([]);
    parse_yahoo_stats({ data: { leagues: [] } }).should.eql([]);
    parse_yahoo_stats({ data: { statTypes: [], leagues: [{ leaders: [] }] } }).should.eql([]);
    parse_yahoo_stats(null).should.eql([]);
    parse_yahoo_stats('nope').should.eql([]);
  });

  it('descends single-key wrappers only into collections; a plain object is one row (sdv-py _descend)', () => {
    parse_yahoo_list({ data: { league: { standings: { teams: [{ teamId: 'nfl.t.1' }, { teamId: 'nfl.t.2' }] } } } })
      .map((r) => r.team_id)
      .should.eql(['nfl.t.1', 'nfl.t.2']);
    // several same-key wrappers (one per league) concatenate
    parse_yahoo_list({ data: { leagues: [{ leaders: [{ a: 1 }] }, { leaders: [{ a: 2 }] }] } }).should.eql([{ a: 1 }, { a: 2 }]);
    // a single-key object whose value is a scalar is a row, not a wrapper
    parse_yahoo_list({ data: { league: { name: 'NFL' } } }).should.eql([{ name: 'NFL' }]);
    // mixed-key elements are rows themselves
    parse_yahoo_list({ data: { leagues: [{ leaders: [{ a: 1 }] }, { teams: [{ a: 2 }] }] } }).should.eql([
      { leaders: '[{"a":1}]', teams: null },
      { leaders: null, teams: '[{"a":2}]' },
    ]);
  });

  it('names and types cells as sdv-py (json_normalize + pandas + str()): rectangular rows', () => {
    const rows = parse_yahoo_list({
      data: {
        players: [
          { 'ncaaf.stat_type.102': '30', playerId: 1, team: { teamId: 2, name: 'A', empty: {} }, flag: true, n: 1, mixed: 1, tags: ['x'] },
          { 'ncaaf.stat_type.102': '41', playerId: 3, team: { teamId: 4, name: null }, flag: null, n: null, mixed: 'one' },
        ],
      },
    });
    rows.should.eql([
      // ids as decimal strings; `mixed` str()-ed; `flag` (bool with a null) stays a native boolean; `n` stays numeric; lists JSON
      { ncaaf_stat_type_102: '30', player_id: '1', flag: true, n: 1, mixed: '1', tags: '["x"]', team_team_id: '2', team_name: 'A' },
      { ncaaf_stat_type_102: '41', player_id: '3', flag: null, n: null, mixed: 'one', tags: null, team_team_id: '4', team_name: null },
    ]);
    // a collision after snake-casing takes the pandas-style `_2` suffix
    parse_yahoo_list({ data: { rows: [{ teamId: 1, team_id: 2 }] } }).should.eql([{ team_id: '1', team_id_2: '2' }]);
    // bool columns stay booleans; scalar rows become a `value` column
    parse_yahoo_list({ data: { rows: [{ ok: true }, { ok: false }] } }).should.eql([{ ok: true }, { ok: false }]);
    parse_yahoo_list({ data: { ids: ['nfl.g.1', 2, null] } }).should.eql([{ value: 'nfl.g.1' }, { value: '2' }, { value: null }]);
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

  it('registers the yahoo family (107 endpoints) on https://graphite-secure.sports.yahoo.com/v1/query/shangrila', () => {
    const rows = family();
    rows.length.should.equal(107);
    FLAT_HOSTS.yahoo.should.equal('https://graphite-secure.sports.yahoo.com/v1/query/shangrila');
    // The two editorial routes carry a per-endpoint host (vendored from sdv-py).
    for (const w of rows) {
      w.host.should.equal(
        w.short.startsWith('editorial_')
          ? 'https://api-secure.sports.yahoo.com/v1/editorial/s'
          : 'https://graphite-secure.sports.yahoo.com/v1/query/shangrila'
      );
    }
  });

  it('resolves an editorial route against its per-endpoint host', () => {
    const def = family().find((w) => w.short === 'editorial_boxscore');
    resolveFlat(def, { game_id: 'nfl.g.123' }).url.should.equal(
      'https://api-secure.sports.yahoo.com/v1/editorial/s/boxscore/nfl.g.123'
    );
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

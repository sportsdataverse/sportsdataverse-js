import { readFileSync } from 'node:fs';
import should from 'should';
import {
  parse_yahoo_scores_list,
  parse_yahoo_scores_scoreboard,
  parse_yahoo_scores_boxscore,
} from '../../dist/parsers/yahoo_scores.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';
import { isIdColumn } from '../../dist/core/int64.js';
import { FLAT_WRAPPERS } from '../../dist/index.js';
import { FLAT_HOSTS } from '../../dist/core/client.js';

// Unit tests for the Yahoo Sports editorial parsers, run on REAL captures (no
// network) from test/fixtures/yahoo/: the 2026 week-1 ncaaf scoreboard (2
// games) and two ncaaf box scores (Michigan at Nebraska 2025-09-20, Alabama at
// Kentucky 2026-09-12). Provenance in test/fixtures/yahoo/README.md. The
// parsers are a port of sdv-py's `parse_yahoo_editorial` (one frame per
// collection; the scoreboard parser returns its `games`, the boxscore parser
// its `player_stats`); test/parsers/parity.test.js holds them to sdv-py's
// output cell by cell, this file pins the concrete rows (counts, scores, team
// ids, stat values, snake_case keys, string ids, the map key as `entity_id`).
// Malformed / empty payloads stay synthetic. The flat-contract metadata block
// asserts the family registers on api-secure.sports.yahoo.com under the
// `yahoo` namespace with no auth and a resolvable parser per endpoint.

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

const scoreboard = fixture('editorial_scoreboard_ncaaf.json');
const boxMichNeb = fixture('editorial_boxscore_ncaaf.json');
const boxAlaUk = fixture('editorial_boxscore_ncaaf_ala_at_uk.json');

describe('parsers/yahoo_scores: parse_yahoo_scores_scoreboard (real 2026 week-1 ncaaf capture)', () => {
  const rows = parse_yahoo_scores_scoreboard(scoreboard);

  it('unrolls service.scoreboard.games into one row per game (map key -> entity_id), 104 columns', () => {
    rows.length.should.equal(2);
    rows.map((r) => r.entity_id).should.eql(['ncaaf.g.202608290085', 'ncaaf.g.202608290062']);
    for (const r of rows) {
      Object.keys(r).length.should.equal(104);
      r.should.not.have.property('id'); // sdv-py names the map key entity_id
      r.should.not.have.property('xml:lang'); // the service-level locale never reaches a row
    }
    rows[0].should.have.property('gameid', 'ncaaf.g.202608290085');
    rows[0].should.have.property('global_gameid', 'ncaaf.g.13591612');
    assertTidy(rows);
  });

  it('deep-flattens team ids / status / week / navigation links onto the game row', () => {
    rows[0].should.have.property('home_team_id', 'ncaaf.t.85'); // TCU
    rows[0].should.have.property('away_team_id', 'ncaaf.t.6'); // North Carolina
    rows[0].should.have.property('status_type', 'status.type.pregame');
    rows[0].should.have.property('status_description', 'Pregame');
    rows[0].should.have.property('start_time', 'Sat, 29 Aug 2026 16:00:00 +0000');
    rows[0].should.have.property('week_number', '1'); // Yahoo ships numerics as strings
    rows[0].should.have.property('tv_coverage', 'ESPN');
    rows[0].should.have.property('navigation_links_boxscore_url', '/ncaaf/north-carolina-tar-heels-tcu-horned-frogs-202608290085/');
    rows[1].should.have.property('home_team_id', 'ncaaf.t.62'); // USC
    rows[1].should.have.property('away_team_id', 'ncaaf.t.44');
  });

  it('keeps JSON types as pandas does: booleans stay, lists are JSON cells, pregame nulls are null', () => {
    for (const r of rows) {
      r.is_time_tba.should.equal(false);
      r.last_updated.should.equal(false);
      r.game_periods.should.equal('[]');
      JSON.parse(r.teams).should.eql(['dataIslandPaths', r.entity_id, 'teams']);
      should(r.total_home_points).be.null();
      should(r.total_away_points).be.null();
      should(r.winning_team_id).be.null();
      should(r.minimum_periods).be.null();
    }
  });
});

describe('parsers/yahoo_scores: parse_yahoo_scores_boxscore (real ncaaf captures)', () => {
  it('Michigan at Nebraska: one row per player x stat variation (entity_id + sub_id), stat values as strings', () => {
    const rows = parse_yahoo_scores_boxscore(boxMichNeb);
    rows.length.should.equal(2);
    rows.map((r) => r.entity_id).should.eql(['ncaaf.p.457863', 'ncaaf.p.469436']);
    rows.map((r) => r.sub_id).should.eql(['ncaaf.stat_variation.2', 'ncaaf.stat_variation.2']);
    for (const r of rows) Object.keys(r).length.should.equal(17);
    Object.keys(rows[0]).slice(0, 5).should.eql(['entity_id', 'sub_id', 'ncaaf_stat_type_102', 'ncaaf_stat_type_103', 'ncaaf_stat_type_105']);
    // stat_type.102/103/105 = Completions / Attempts / Yards (per the capture's
    // stat_types dictionary): 30-of-41 for 308, 12-of-22 for 105.
    rows[0].should.have.property('ncaaf_stat_type_102', '30');
    rows[0].should.have.property('ncaaf_stat_type_103', '41');
    rows[0].should.have.property('ncaaf_stat_type_105', '308');
    rows[1].should.have.property('ncaaf_stat_type_102', '12');
    rows[1].should.have.property('ncaaf_stat_type_103', '22');
    rows[1].should.have.property('ncaaf_stat_type_105', '105');
    assertTidy(rows);
  });

  it('Alabama at Kentucky: four players, rectangular over the union of their stat families (null where absent)', () => {
    const rows = parse_yahoo_scores_boxscore(boxAlaUk);
    rows.length.should.equal(4);
    rows.map((r) => r.entity_id).should.eql(['ncaaf.p.470424', 'ncaaf.p.403635', 'ncaaf.p.404415', 'ncaaf.p.470454']);
    for (const r of rows) Object.keys(r).length.should.equal(33);
    rows[0].should.have.property('ncaaf_stat_type_102', '16'); // 16-of-23 for 188
    rows[0].should.have.property('ncaaf_stat_type_103', '23');
    rows[0].should.have.property('ncaaf_stat_type_105', '188');
    rows[1].should.have.property('ncaaf_stat_type_105', '146');
    rows[2].should.have.property('ncaaf_stat_type_411', '4'); // a kicker: XPM 4, no passing stats
    should(rows[2].ncaaf_stat_type_102).be.null();
    rows[3].should.have.property('ncaaf_stat_type_502', '2'); // a returner: KR 2, 16.5 avg
    rows[3].should.have.property('ncaaf_stat_type_505', '16.5');
    should(rows[0].ncaaf_stat_type_502).be.null();
    assertTidy(rows);
  });

  it('the surrounding game block is in the raw capture but not on the player rows', () => {
    const game = boxAlaUk.service.boxscore.games['ncaaf.g.202609120069'];
    game.should.have.property('total_away_points', '45');
    game.should.have.property('total_home_points', '17');
    game.should.have.property('status_type', 'status.type.final');
    for (const r of parse_yahoo_scores_boxscore(boxAlaUk)) r.should.not.have.property('gameid');
  });
});

describe('parsers/yahoo_scores: parse_yahoo_scores_list (generic, real captures)', () => {
  it('returns the FIRST collection of the envelope: the games of a scoreboard', () => {
    const rows = parse_yahoo_scores_list(scoreboard);
    rows.should.eql(parse_yahoo_scores_scoreboard(scoreboard));
    rows.length.should.equal(2);
    rows[0].should.have.property('entity_id', 'ncaaf.g.202608290085');
  });

  it('returns the FIRST collection of the envelope: the player_stats of a boxscore', () => {
    const rows = parse_yahoo_scores_list(boxMichNeb);
    rows.should.eql(parse_yahoo_scores_boxscore(boxMichNeb));
    rows.length.should.equal(2);
    rows[0].should.have.property('entity_id', 'ncaaf.p.457863');
  });

  it('frames a scalar-valued collection as entity_id + value (sdv-py gamescore)', () => {
    const { gamescore } = boxMichNeb.service.boxscore;
    parse_yahoo_scores_list({ service: { 'xml:lang': 'en-US', boxscore: { gamescore } } }).should.eql([
      { entity_id: 'ncaaf.g.202509200023', value: 'Michigan Wolverines 30 - Nebraska Cornhuskers 27: Final' },
    ]);
  });
});

describe('parsers/yahoo_scores (synthetic edge cases)', () => {
  it('parse_yahoo_scores_list returns [] for empty / malformed payloads', () => {
    parse_yahoo_scores_list({ service: {} }).should.eql([]);
    parse_yahoo_scores_list({ service: { 'xml:lang': 'en-US' } }).should.eql([]);
    parse_yahoo_scores_list({ service: { scoreboard: { games: {} } } }).should.eql([]);
    parse_yahoo_scores_list(null).should.eql([]);
    parse_yahoo_scores_list('nope').should.eql([]);
  });

  it('parse_yahoo_scores_scoreboard returns [] for an empty / missing games map and for malformed payloads', () => {
    parse_yahoo_scores_scoreboard({ service: { scoreboard: { games: {} } } }).should.eql([]);
    parse_yahoo_scores_scoreboard({ service: { scoreboard: { teams: { 'nfl.t.1': { abbr: 'A' } } } } }).should.eql([]);
    parse_yahoo_scores_scoreboard(null).should.eql([]);
    parse_yahoo_scores_scoreboard({ service: {} }).should.eql([]);
  });

  it('parse_yahoo_scores_boxscore returns [] for an empty / missing player_stats map and for malformed payloads', () => {
    parse_yahoo_scores_boxscore({ service: { boxscore: { player_stats: {} } } }).should.eql([]);
    parse_yahoo_scores_boxscore({ service: { boxscore: { games: { 'nfl.g.1': { gameid: 'nfl.g.1' } } } } }).should.eql([]);
    parse_yahoo_scores_boxscore(null).should.eql([]);
    parse_yahoo_scores_boxscore({ service: {} }).should.eql([]);
  });

  it('a list-valued entry is one row per element, an id-map entry one row per sub-entry (sdv-py)', () => {
    parse_yahoo_scores_list({
      service: { boxscore: { gamedrives: { 'nfl.g.1': [{ drive: 1 }, { drive: 2 }, 'odd'] } } },
    }).should.eql([
      { entity_id: 'nfl.g.1', drive: 1, value: null },
      { entity_id: 'nfl.g.1', drive: 2, value: null },
      { entity_id: 'nfl.g.1', drive: null, value: 'odd' },
    ]);
    parse_yahoo_scores_boxscore({
      service: { boxscore: { player_stats: { 'nfl.p.1': { 'nfl.stat_variation.2': { 'nfl.stat_type.5': '7' } } } } },
    }).should.eql([{ entity_id: 'nfl.p.1', sub_id: 'nfl.stat_variation.2', nfl_stat_type_5: '7' }]);
  });
});

describe('parsers/yahoo_scores: registry wiring', () => {
  it('registers all three yahoo_scores parsers by name', () => {
    for (const name of [
      'parse_yahoo_scores_list',
      'parse_yahoo_scores_scoreboard',
      'parse_yahoo_scores_boxscore',
    ]) {
      (typeof PARSERS[name]).should.equal('function', `missing ${name}`);
      should(parserFor(name)).equal(PARSERS[name]);
    }
  });
});

describe('yahoo_scores flat-API family metadata (flat-contract style)', () => {
  const family = () => FLAT_WRAPPERS.filter((w) => w.api === 'yahoo_scores');

  it('registers the yahoo_scores family (2 endpoints) on https://api-secure.sports.yahoo.com', () => {
    const rows = family();
    rows.length.should.equal(2);
    FLAT_HOSTS.yahoo_scores.should.equal('https://api-secure.sports.yahoo.com');
    for (const w of rows) w.host.should.equal('https://api-secure.sports.yahoo.com');
  });

  it('every yahoo_scores wrapper names a registered parser, none auth', () => {
    for (const w of family()) {
      (typeof w.parser).should.equal('string', `parser missing on ${w.short}`);
      w.parser.should.startWith('parse_yahoo_scores_');
      (typeof parserFor(w.parser)).should.equal('function', `parser ${w.parser} not registered`);
      should(w.auth).not.be.true(`unexpected auth flag on yahoo_scores_${w.short}`);
    }
  });
});

import should from 'should';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parse_scoreboard,
  parse_teams,
  parse_standings,
  parse_leaders,
  parse_team_roster,
  parse_news,
  parse_injuries,
  parse_event_plays,
  parse_items,
  parse_single_entity,
  parse_summary,
  parse_summary_boxscore_player,
  parse_summary_plays,
  SUMMARY_SECTION_PARSERS,
  ESPN_ENDPOINT_PARSERS,
  parserForEndpoint,
} from '../../dist/parsers/espn.js';

// Offline unit tests for the ESPN cross-league parser layer (a faithful port of
// sportsdataverse/_common_espn_parsers.py). Real ESPN captures (copied from the
// sdv-py espn fixtures dir) exercise the dedicated parsers; small inline
// payloads cover the two generics + the parsers whose fixture is degenerate.
// Assertions are payload-agnostic (row counts / key presence), mirroring sdv-py
// tests/test_espn_universal_parsers.py.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(__dirname, '..', 'fixtures', 'espn');
const load = (stem) => JSON.parse(fs.readFileSync(path.join(FIX, `${stem}.json`), 'utf8'));

describe('parsers/espn: generics (parse_items, parse_single_entity)', () => {
  it('parse_items walks the items key ($ref-only rows yield a $ref column)', () => {
    const rows = parse_items({ items: [{ $ref: 'https://x/1' }, { $ref: 'https://x/2' }] });
    rows.length.should.equal(2);
    rows[0].should.have.property('$ref', 'https://x/1');
  });

  it('parse_items falls back to the entries key (athlete_statisticslog shape)', () => {
    const rows = parse_items({ entries: [{ id: '1', value: 10 }, { id: '2', value: 20 }] });
    rows.length.should.equal(2);
    rows[0].should.have.property('value', 10);
  });

  it('parse_items returns [] when no known list key resolves', () => {
    parse_items({ foo: [1, 2] }).should.eql([]);
    parse_items({}).should.eql([]);
    parse_items(null).should.eql([]);
  });

  it('parse_single_entity flattens one dict to a single row (nested -> _ cols)', () => {
    const rows = parse_single_entity({ id: '5', venue: { fullName: 'Arena', address: { city: 'Boston' } } });
    rows.length.should.equal(1);
    rows[0].should.have.property('id', '5');
    rows[0].should.have.property('venue_full_name', 'Arena');
    rows[0].should.have.property('venue_address_city', 'Boston');
  });

  it('parse_single_entity returns [] for empty / non-dict input', () => {
    parse_single_entity({}).should.eql([]);
    parse_single_entity(null).should.eql([]);
    parse_single_entity([1, 2]).should.eql([]);
  });
});

describe('parsers/espn: parse_summary dispatcher', () => {
  const summary = load('summary_nba');

  it('returns an object with all 21 section keys when section omitted', () => {
    const out = parse_summary(summary);
    Object.keys(out).sort().should.eql(Object.keys(SUMMARY_SECTION_PARSERS).sort());
    Object.keys(out).length.should.equal(21);
    // every value is an array (a tidy frame)
    for (const v of Object.values(out)) Array.isArray(v).should.be.true();
  });

  it('returns rows[] for a known section', () => {
    const plays = parse_summary(summary, 'plays');
    Array.isArray(plays).should.be.true();
    plays.length.should.be.above(0);
  });

  it('throws for an unknown section', () => {
    (() => parse_summary(summary, 'not_a_section')).should.throw(/Unknown summary section/);
  });
});

describe('parsers/espn: dedicated parsers (real fixtures)', () => {
  it('parse_scoreboard -> one row per event', () => {
    const rows = parse_scoreboard(load('scoreboard_nba'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('game_id');
    rows[0].should.have.property('home_abbreviation');
    rows[0].should.have.property('away_abbreviation');
  });

  it('parse_team_roster (flat shape) -> one row per athlete', () => {
    const rows = parse_team_roster(load('team_roster_nba'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('id');
    rows[0].should.have.property('display_name');
  });

  it('parse_team_roster (grouped shape) -> tags position_group', () => {
    const rows = parse_team_roster(load('team_roster_mlb'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('position_group');
  });

  it('parse_standings -> one row per team, stats pivoted to columns', () => {
    const rows = parse_standings(load('standings_nba'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('team_abbreviation');
    rows[0].should.have.property('group_name');
    rows[0].should.have.property('wins');
    rows[0].should.have.property('losses');
  });

  it('parse_news -> one row per article', () => {
    const rows = parse_news(load('news_nba'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('headline');
    rows[0].should.have.property('type');
  });

  it('parse_injuries -> one row per team', () => {
    const rows = parse_injuries(load('injuries_nba'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('id');
    rows[0].should.have.property('display_name');
    rows[0].should.have.property('injuries');
  });

  it('parse_summary_boxscore_player -> one row per (team x athlete)', () => {
    const rows = parse_summary_boxscore_player(load('summary_nba'));
    rows.length.should.be.above(0);
    rows[0].should.have.property('team_id');
    rows[0].should.have.property('athlete_id');
  });

  it('parse_summary_plays -> one row per play', () => {
    const rows = parse_summary_plays(load('summary_nba'));
    rows.length.should.be.above(100);
    rows[0].should.have.property('id');
  });
});

describe('parsers/espn: parse_leaders + parse_event_plays (inline payloads)', () => {
  it('parse_leaders -> one row per (category x leader), stat cols from names', () => {
    const payload = {
      categories: [
        {
          name: 'points',
          names: ['pts', 'reb'],
          leaders: [
            { rank: 1, athlete: { id: '1', displayName: 'A', position: { abbreviation: 'G' } }, team: { id: '10', abbreviation: 'BOS' }, stats: [30, 8] },
            { rank: 2, athlete: { id: '2', displayName: 'B' }, team: { id: '11', abbreviation: 'LAL' }, stats: [28, 6] },
          ],
        },
      ],
    };
    const rows = parse_leaders(payload);
    rows.length.should.equal(2);
    rows[0].should.have.property('category', 'points');
    rows[0].should.have.property('athlete_id', '1');
    rows[0].should.have.property('pts', 30);
    rows[0].should.have.property('reb', 8);
    rows[0].should.have.property('team_abbreviation', 'BOS');
  });

  it('parse_leaders returns [] for empty payload', () => {
    parse_leaders(null).should.eql([]);
  });

  it('parse_event_plays -> one row per item, deep nesting skipped/flattened', () => {
    const payload = {
      items: [
        {
          id: 'p1',
          sequenceNumber: '1',
          text: 'Jump ball',
          type: { id: '1', text: 'Jumpball' },
          period: { number: 1 },
          participants: [{ athlete: { $ref: 'x' } }], // skipped
        },
        { id: 'p2', sequenceNumber: '2', text: 'Made shot', scoringPlay: true },
      ],
    };
    const rows = parse_event_plays(payload);
    rows.length.should.equal(2);
    rows[0].should.have.property('id', 'p1');
    rows[0].should.have.property('type_text', 'Jumpball'); // one-deep dict flatten
    rows[0].should.have.property('period_number', 1);
    rows[0].should.not.have.property('participants'); // skip key dropped
    rows[1].should.have.property('scoring_play', true);
  });

  it('parse_event_plays returns [] when no items/plays list', () => {
    parse_event_plays({}).should.eql([]);
    parse_event_plays(null).should.eql([]);
  });
});

describe('parsers/espn: ESPN_ENDPOINT_PARSERS registry', () => {
  it('has exactly 121 entries, all functions', () => {
    const entries = Object.entries(ESPN_ENDPOINT_PARSERS);
    entries.length.should.equal(121);
    for (const [, fn] of entries) (typeof fn).should.equal('function');
  });

  it('parserForEndpoint resolves known short names and returns undefined otherwise', () => {
    parserForEndpoint('scoreboard').should.equal(parse_scoreboard);
    parserForEndpoint('summary').should.equal(parse_summary);
    parserForEndpoint('team').should.equal(parse_single_entity);
    parserForEndpoint('venues').should.equal(parse_items);
    should(parserForEndpoint('nope')).be.undefined();
  });

  it('SUMMARY_SECTION_PARSERS has exactly 21 entries, all functions', () => {
    const entries = Object.entries(SUMMARY_SECTION_PARSERS);
    entries.length.should.equal(21);
    for (const [, fn] of entries) (typeof fn).should.equal('function');
  });
});

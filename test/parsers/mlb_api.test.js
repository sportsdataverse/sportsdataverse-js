import should from 'should';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  parse_mlb_list,
  parse_mlb_teams,
  parse_mlb_schedule,
  parse_mlb_team_roster,
  parse_mlb_standings,
  parse_mlb_person_stats,
  parse_mlb_boxscore,
  parse_mlb_linescore,
  parse_mlb_play_by_play,
  parse_mlb_win_probability,
  parse_mlb_draft_latest,
  parse_mlb_timecodes,
} from '../../dist/parsers/mlb.js';
import { isIdColumn } from '../../dist/core/int64.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';

// Unit tests for the MLB Stats API parsers (dist/parsers/mlb.js), run on
// sdv-py's REAL committed captures vendored under test/fixtures/py/mlb/
// (provenance: test/fixtures/py/README.md; capture -> endpoint short in
// test/fixtures/py/manifest.yaml; short -> parser in
// tools/codegen/endpoints/mlb.yaml). Every assertion is a concrete fact about
// the capture: an exact row count, a named player / team / game_pk / score.
// The expected values were cross-read from sdv-py's own output on the same
// bytes (test/fixtures/py/oracle/mlb.json.gz), which test/parsers/parity.test.js
// compares cell by cell; here the JS parser output is asserted directly.
//
// Two parsers have no vendored capture whose endpoint maps to them:
// parse_mlb_teams runs on teams_history.json (a real `{teams: [...]}` payload
// that the manifest maps to parse_mlb_list) and parse_mlb_standings stays
// synthetic (no `records[].teamRecords[]` capture exists). Synthetic payloads
// are otherwise used only for the malformed / empty edge cases at the bottom.

const here = dirname(fileURLToPath(import.meta.url));
const FIX = join(here, '..', 'fixtures', 'py', 'mlb');
const text = (p) => (p.endsWith('.gz') ? gunzipSync(readFileSync(p)) : readFileSync(p)).toString('utf8');
const capture = (name) => JSON.parse(text(join(FIX, name)));

const SNAKE = /^[a-z0-9_]+$/;
const DECIMAL = /^-?\d+$/;
/** Every key snake_case; every id column (`id`, `*_id`, `*_ids`, `*_pk`) null or a string, never a number. */
function assertTidy(rows) {
  rows.length.should.be.above(0);
  for (const r of rows) {
    for (const [k, v] of Object.entries(r)) {
      SNAKE.test(k).should.be.true(`key ${k} is not snake_case`);
      if (isIdColumn(k) && v !== null && v !== undefined) {
        (typeof v).should.equal('string', `id column ${k} holds a ${typeof v}: ${v}`);
      }
    }
  }
}
const countBy = (rows, k) => rows.reduce((a, r) => ((a[r[k]] = (a[r[k]] ?? 0) + 1), a), {});

describe('parsers/mlb: parse_mlb_teams (teams_history.json — real {teams:[]} capture)', () => {
  const raw = capture('teams_history.json');
  const rows = parse_mlb_teams(raw);

  it('produces one row per franchise-history entry (5 Yankees eras)', () => {
    rows.length.should.equal(5);
    rows.length.should.equal(raw.teams.length);
    assertTidy(rows);
    rows.every((r) => r.id === '147').should.be.true();
  });

  it('flattens venue.* and snake_cases teamCode / firstYearOfPlay', () => {
    rows[0].should.have.property('name', 'New York Yankees');
    rows[0].should.have.property('abbreviation', 'NYY');
    rows[0].should.have.property('season', 2009);
    rows[0].should.have.property('venue_id', '3313');
    rows[0].should.have.property('venue_name', 'Yankee Stadium');
    rows[0].should.have.property('spring_venue_id', '2523');
    rows[0].should.have.property('team_code', 'nya');
    rows[0].should.have.property('first_year_of_play', '1903');
    rows[4].should.have.property('name', 'New York Highlanders');
    rows[4].should.have.property('abbreviation', 'NYH');
    rows[4].should.have.property('season', 1903);
    rows[4].should.have.property('venue_name', 'Hilltop Park');
  });
});

describe('parsers/mlb: parse_mlb_schedule (schedule_postseason_2024.json.gz + schedule_tied.json)', () => {
  const post = parse_mlb_schedule(capture('schedule_postseason_2024.json.gz'));
  const tied = parse_mlb_schedule(capture('schedule_tied.json'));

  it('unrolls dates[].games[] into 43 postseason games with the schedule_date prefix', () => {
    post.length.should.equal(43);
    assertTidy(post);
    countBy(post, 'schedule_date')['2024-10-01'].should.equal(4); // four Wild Card games
    post[0].should.have.property('schedule_date', '2024-10-01');
    post[0].should.have.property('game_pk', '775345');
    DECIMAL.test(post[0].game_pk).should.be.true();
    post[0].should.have.property('game_type', 'F');
    post[0].should.have.property('teams_away_team_id', '116');
    post[0].should.have.property('teams_away_team_name', 'Detroit Tigers');
    post[0].should.have.property('teams_home_team_name', 'Houston Astros');
    post[0].should.have.property('teams_away_score', 3);
    post[0].should.have.property('teams_home_score', 1);
    post[0].should.have.property('status_detailed_state', 'Final');
  });

  it('ends on World Series Game 5 (2024-10-30, Yankees hosting)', () => {
    const last = post[post.length - 1];
    last.should.have.property('schedule_date', '2024-10-30');
    last.should.have.property('game_pk', '775296');
    last.should.have.property('game_type', 'W');
    last.should.have.property('teams_home_team_name', 'New York Yankees');
    last.should.have.property('description', 'World Series Game 5');
  });

  it('keeps a tied game (2016-09-29 CHC @ PIT, 1-1) as a single Final row', () => {
    tied.length.should.equal(1);
    assertTidy(tied);
    tied[0].should.have.property('game_pk', '449244');
    tied[0].should.have.property('teams_away_team_name', 'Chicago Cubs');
    tied[0].should.have.property('teams_home_team_name', 'Pittsburgh Pirates');
    tied[0].should.have.property('teams_away_score', 1);
    tied[0].should.have.property('teams_home_score', 1);
    tied[0].should.have.property('is_tie', true);
    tied[0].should.have.property('status_reason', 'Tied');
  });
});

describe('parsers/mlb: parse_mlb_list (generic flattener on venues / sports / award_recipients)', () => {
  it('venues_active.json.gz: 1,646 venues, Yankee Stadium is id 3313', () => {
    const rows = parse_mlb_list(capture('venues_active.json.gz'));
    rows.length.should.equal(1646);
    assertTidy(rows);
    rows[0].should.have.property('id', '2857');
    rows[0].should.have.property('name', 'Veterans Memorial Stadium');
    const ys = rows.find((r) => r.id === '3313');
    ys.should.have.property('name', 'Yankee Stadium');
    ys.should.have.property('active', true);
    rows[rows.length - 1].should.have.property('name', 'Aloha Stadium');
    rows[rows.length - 1].should.have.property('active', false);
  });

  it('sports.json: 20 sports, MLB first with sortOrder -> sort_order', () => {
    const rows = parse_mlb_list(capture('sports.json'));
    rows.length.should.equal(20);
    assertTidy(rows);
    rows[0].should.have.property('id', '1');
    rows[0].should.have.property('code', 'mlb');
    rows[0].should.have.property('name', 'Major League Baseball');
    rows[0].should.have.property('abbreviation', 'MLB');
    rows[0].should.have.property('sort_order', 11);
    rows[1].should.have.property('id', '11');
    rows[1].should.have.property('abbreviation', 'AAA');
  });

  it('award_recipients_almvp.json.gz: 95 AL MVPs, deep-flattening player.* / team.*', () => {
    const rows = parse_mlb_list(capture('award_recipients_almvp.json.gz'));
    rows.length.should.equal(95);
    assertTidy(rows);
    rows[0].should.have.property('id', 'ALMVP');
    rows[0].should.have.property('season', '2025');
    rows[0].should.have.property('team_id', '147');
    rows[0].should.have.property('player_id', '592450');
    rows[0].should.have.property('player_name_first_last', 'Aaron Judge');
    rows[0].should.have.property('player_primary_position_abbreviation', 'OF');
    rows[94].should.have.property('season', '1931');
    rows[94].should.have.property('player_id', '115201');
  });
});

describe('parsers/mlb: parse_mlb_team_roster (team_roster_yankees_2024.json.gz)', () => {
  const rows = parse_mlb_team_roster(capture('team_roster_yankees_2024.json.gz'));

  it('produces 54 player rows with flattened person / position / status', () => {
    rows.length.should.equal(54);
    assertTidy(rows);
    Object.keys(rows[0]).length.should.equal(10);
    rows[0].should.have.property('person_id', '677076');
    rows[0].should.have.property('person_full_name', 'Clayton Andrews');
    rows[0].should.have.property('jersey_number', '74');
    rows[0].should.have.property('status_code', 'MIN');
    rows[0].should.have.property('status_description', 'Minor League Contract');
  });

  it('carries Judge / Cole / Soto with their 2024 numbers and positions', () => {
    const byName = Object.fromEntries(rows.map((r) => [r.person_full_name, r]));
    byName['Aaron Judge'].should.have.property('person_id', '592450');
    byName['Aaron Judge'].should.have.property('jersey_number', '99');
    byName['Aaron Judge'].should.have.property('position_abbreviation', 'CF');
    byName['Aaron Judge'].should.have.property('status_code', 'A');
    byName['Gerrit Cole'].should.have.property('person_id', '543037');
    byName['Gerrit Cole'].should.have.property('jersey_number', '45');
    byName['Gerrit Cole'].should.have.property('position_abbreviation', 'P');
    byName['Juan Soto'].should.have.property('person_id', '665742');
    byName['Juan Soto'].should.have.property('jersey_number', '22');
  });
});

describe('parsers/mlb: parse_mlb_standings (synthetic — no vendored capture)', () => {
  it('unrolls records[].teamRecords[] with namespaced division context', () => {
    const raw = {
      records: [
        {
          standingsType: 'regularSeason',
          league: { id: 103, name: 'American League' },
          division: { id: 201, name: 'AL East' },
          lastUpdated: '2024-09-30',
          teamRecords: [
            { team: { id: 147, name: 'Yankees' }, wins: 94, losses: 68, divisionRank: '1' },
            { team: { id: 141, name: 'Blue Jays' }, wins: 74, losses: 88, divisionRank: '5' },
          ],
        },
        {
          standingsType: 'regularSeason',
          league: { id: 104, name: 'National League' },
          division: { id: 204, name: 'NL East' },
          teamRecords: [{ team: { id: 144, name: 'Braves' }, wins: 89, losses: 73, divisionRank: '2' }],
        },
      ],
    };
    const rows = parse_mlb_standings(raw);
    rows.length.should.equal(3);
    assertTidy(rows);
    rows[0].should.have.property('standings_league_id', '103');
    rows[0].should.have.property('standings_division_name', 'AL East');
    rows[0].should.have.property('wins', 94);
    rows[0].should.have.property('team_id', '147');
    rows[0].should.have.property('division_rank', '1');
    rows[2].should.have.property('standings_league_id', '104');
  });
});

describe('parsers/mlb: parse_mlb_person_stats (person_game_stats_660271.json — real stats[].splits[] capture)', () => {
  const raw = capture('person_game_stats_660271.json');
  const rows = parse_mlb_person_stats(raw);

  it('emits one row per split across the 3 stats blocks (the third block has no splits)', () => {
    raw.stats.length.should.equal(3);
    rows.length.should.equal(2);
    rows.length.should.equal(raw.stats.flatMap((b) => b.splits ?? []).length);
    assertTidy(rows);
  });

  it('prefixes stats_type / stats_group and flattens stat.* / team.* / opponent.*', () => {
    rows[0].should.have.property('stats_type', 'vsPlayer5Y');
    rows[0].should.have.property('stats_group', 'hitting');
    rows[0].should.have.property('team_name', 'Los Angeles Angels');
    rows[0].should.have.property('opponent_name', 'Boston Red Sox');
    rows[0].should.have.property('stat_games_played', 3);
    rows[0].should.have.property('stat_hits', 1);
    rows[0].should.have.property('stat_at_bats', 7);
    rows[0].should.have.property('stat_avg', '.143');
    rows[1].should.have.property('stats_group', 'pitching');
    rows[1].should.have.property('team_name', 'Los Angeles Dodgers');
    rows[1].should.have.property('opponent_name', 'Pittsburgh Pirates');
  });
});

describe('parsers/mlb: parse_mlb_boxscore (boxscore_745282.json.gz — STL @ SF, 2024-09-29)', () => {
  const rows = parse_mlb_boxscore(capture('boxscore_745282.json.gz'));

  it('walks the players-by-ID dict on both sides: 29 Giants + 28 Cardinals', () => {
    rows.length.should.equal(57);
    assertTidy(rows);
    countBy(rows, 'team_side').should.eql({ home: 29, away: 28 });
    countBy(rows, 'team_id').should.eql({ 137: 29, 138: 28 });
    countBy(rows, 'team_name').should.eql({ 'San Francisco Giants': 29, 'St. Louis Cardinals': 28 });
  });

  it('flattens person / position / stats.batting.* per player', () => {
    rows[0].should.have.property('team_side', 'home');
    rows[0].should.have.property('person_id', '669477');
    rows[0].should.have.property('person_full_name', 'Casey Schmitt');
    rows[0].should.have.property('position_abbreviation', '3B');
    rows[0].should.have.property('batting_order', '401');
    rows[0].should.have.property('parent_team_id', '137');
    const hr = rows.filter((r) => r.stats_batting_home_runs > 0);
    hr.length.should.equal(1); // the game's only home run
    hr[0].should.have.property('person_full_name', 'Brendan Donovan');
    hr[0].should.have.property('person_id', '680977');
    hr[0].should.have.property('team_side', 'away');
    hr[0].should.have.property('stats_batting_hits', 2);
    hr[0].should.have.property('position_abbreviation', '2B');
  });
});

describe('parsers/mlb: parse_mlb_linescore (linescore_745282.json)', () => {
  const rows = parse_mlb_linescore(capture('linescore_745282.json'));

  it('produces one row per inning (9) with flattened home/away splits', () => {
    rows.length.should.equal(9);
    assertTidy(rows);
    rows.map((r) => r.num).should.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    rows[0].should.have.property('ordinal_num', '1st');
    rows[0].should.have.property('away_left_on_base', 1);
    rows[5].should.have.property('away_runs', 3); // STL three-run 6th
    rows[5].should.have.property('away_hits', 3);
    rows[6].should.have.property('home_runs', 1); // SF's lone run in the 7th
    rows[6].should.have.property('home_hits', 2);
  });

  it('sums to the 6-1 final the play-by-play reports', () => {
    rows.reduce((a, r) => a + r.away_runs, 0).should.equal(6);
    rows.reduce((a, r) => a + r.home_runs, 0).should.equal(1);
  });
});

describe('parsers/mlb: parse_mlb_play_by_play (play_by_play_745282.json.gz)', () => {
  const rows = parse_mlb_play_by_play(capture('play_by_play_745282.json.gz'));

  it('produces one row per plate appearance (73) with deep-flattened result / about / matchup / count', () => {
    rows.length.should.equal(73);
    assertTidy(rows);
    rows[0].should.have.property('about_at_bat_index', 0);
    rows[0].should.have.property('about_inning', 1);
    rows[0].should.have.property('about_half_inning', 'top');
    rows[0].should.have.property('result_event', 'Walk');
    rows[0].should.have.property('result_description', 'Brendan Donovan walks.');
    rows[0].should.have.property('matchup_batter_id', '680977');
    rows[0].should.have.property('matchup_batter_full_name', 'Brendan Donovan');
    rows[0].should.have.property('matchup_pitcher_id', '806185');
    rows[0].should.have.property('matchup_pitcher_full_name', 'Hayden Birdsong');
    rows[0].should.have.property('count_balls', 4);
    rows[0].should.have.property('count_strikes', 1);
  });

  it('counts 20 strikeouts and one home run, ending 6-1 in the 9th', () => {
    const ev = countBy(rows, 'result_event');
    ev.Strikeout.should.equal(20);
    ev['Home Run'].should.equal(1);
    ev.Single.should.equal(12);
    rows[72].should.have.property('about_at_bat_index', 72);
    rows[72].should.have.property('about_inning', 9);
    rows[72].should.have.property('result_event', 'Lineout');
    rows[72].should.have.property('result_away_score', 6);
    rows[72].should.have.property('result_home_score', 1);
  });
});

describe('parsers/mlb: parse_mlb_win_probability (win_probability_745282.json.gz — bare array)', () => {
  const rows = parse_mlb_win_probability(capture('win_probability_745282.json.gz'));

  it('flattens the bare top-level array into one row per plate appearance (73)', () => {
    rows.length.should.equal(73);
    assertTidy(rows);
    rows[0].should.have.property('at_bat_index', 0);
    rows[0].should.have.property('result_event', 'Walk');
    rows[0].home_team_win_probability.should.be.approximately(46.4, 1e-9);
    rows[0].away_team_win_probability.should.be.approximately(53.6, 1e-9);
    rows[0].home_team_win_probability_added.should.be.approximately(-3.6, 1e-9);
  });

  it('resolves to 0 / 100 on the final out (visitors won)', () => {
    rows[72].should.have.property('at_bat_index', 72);
    rows[72].should.have.property('home_team_win_probability', 0);
    rows[72].should.have.property('away_team_win_probability', 100);
  });
});

describe('parsers/mlb: parse_mlb_draft_latest (draft_latest.json)', () => {
  const rows = parse_mlb_draft_latest(capture('draft_latest.json'));

  it('flattens the single {pick, number} object as one row, dropping copyright', () => {
    rows.length.should.equal(1);
    assertTidy(rows);
    rows[0].should.not.have.property('copyright');
    rows[0].should.have.property('number', 614);
    rows[0].should.have.property('pick_pick_number', 614);
    rows[0].should.have.property('pick_pick_round', '20');
    rows[0].should.have.property('pick_person_id', '814299');
    rows[0].should.have.property('pick_person_full_name', 'Pascanel Ferreras');
    rows[0].should.have.property('pick_team_id', '117');
    rows[0].should.have.property('pick_team_name', 'Houston Astros');
    rows[0].should.have.property('pick_school_name', 'Western Carolina');
  });

  it('stringifies the list-valued person.xrefIds cell (one row per call)', () => {
    (typeof rows[0].pick_person_xref_ids).should.equal('string');
    JSON.parse(rows[0].pick_person_xref_ids)[0].should.have.property('xrefType', 'bis');
  });
});

describe('parsers/mlb: parse_mlb_timecodes (game_timestamps.json — bare array of strings)', () => {
  const raw = capture('game_timestamps.json');
  const rows = parse_mlb_timecodes(raw);

  it('shapes 412 timecode strings into a single timecode column', () => {
    rows.length.should.equal(412);
    rows.length.should.equal(raw.length);
    rows.every((r) => Object.keys(r).join() === 'timecode').should.be.true();
    rows[0].should.have.property('timecode', '20230929_215457');
    rows[411].should.have.property('timecode', '20230930_013014');
  });
});

describe('parsers/mlb (synthetic edge cases): empty / malformed payloads return []', () => {
  it('parse_mlb_list returns [] when no recognized list key resolves', () => {
    parse_mlb_list({ copyright: 'x', totalItems: 0 }).should.eql([]);
    parse_mlb_list({}).should.eql([]);
    parse_mlb_list(null).should.eql([]);
  });

  it('dict-wrapped parsers return [] for a missing / empty block', () => {
    parse_mlb_teams({}).should.eql([]);
    parse_mlb_teams({ teams: [] }).should.eql([]);
    parse_mlb_teams(null).should.eql([]);
    parse_mlb_schedule({}).should.eql([]);
    parse_mlb_schedule({ dates: [] }).should.eql([]);
    parse_mlb_schedule(null).should.eql([]);
    parse_mlb_team_roster({}).should.eql([]);
    parse_mlb_team_roster({ roster: [] }).should.eql([]);
    parse_mlb_team_roster(null).should.eql([]);
    parse_mlb_standings({}).should.eql([]);
    parse_mlb_standings({ records: [] }).should.eql([]);
    parse_mlb_standings(null).should.eql([]);
    parse_mlb_person_stats({}).should.eql([]);
    parse_mlb_person_stats({ stats: [] }).should.eql([]);
    parse_mlb_person_stats(null).should.eql([]);
    parse_mlb_boxscore({}).should.eql([]);
    parse_mlb_boxscore({ teams: {} }).should.eql([]);
    parse_mlb_boxscore(null).should.eql([]);
    parse_mlb_linescore({}).should.eql([]);
    parse_mlb_linescore(null).should.eql([]);
    parse_mlb_play_by_play({}).should.eql([]);
    parse_mlb_play_by_play(null).should.eql([]);
    parse_mlb_draft_latest({}).should.eql([]);
    parse_mlb_draft_latest(null).should.eql([]);
  });

  it('bare-array parsers return [] for a non-array / empty payload', () => {
    parse_mlb_win_probability({}).should.eql([]);
    parse_mlb_win_probability(null).should.eql([]);
    parse_mlb_win_probability([]).should.eql([]);
    parse_mlb_timecodes({}).should.eql([]);
    parse_mlb_timecodes([]).should.eql([]);
    parse_mlb_timecodes(null).should.eql([]);
  });
});

describe('parsers/_registry', () => {
  it('registers the dedicated parsers and resolves them by name', () => {
    parserFor('parse_mlb_teams').should.equal(parse_mlb_teams);
    parserFor('parse_mlb_schedule').should.equal(parse_mlb_schedule);
    parserFor('parse_mlb_list').should.equal(parse_mlb_list);
    parserFor('parse_mlb_standings').should.equal(parse_mlb_standings);
    parserFor('parse_mlb_boxscore').should.equal(parse_mlb_boxscore);
    for (const name of [
      'parse_mlb_list',
      'parse_mlb_teams',
      'parse_mlb_schedule',
      'parse_mlb_team_roster',
      'parse_mlb_standings',
      'parse_mlb_person_stats',
      'parse_mlb_boxscore',
      'parse_mlb_linescore',
      'parse_mlb_play_by_play',
      'parse_mlb_win_probability',
      'parse_mlb_draft_latest',
      'parse_mlb_timecodes',
    ]) {
      Object.keys(PARSERS).should.containEql(name);
    }
  });

  it('returns undefined for an unknown or missing parser name', () => {
    should(parserFor('nope')).be.undefined();
    should(parserFor()).be.undefined();
  });
});

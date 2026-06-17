import should from 'should';
import {
  parse_mlb_api_list,
  parse_mlb_api_teams,
  parse_mlb_api_schedule,
  parse_mlb_api_team_roster,
  parse_mlb_api_standings,
  parse_mlb_api_person_stats,
  parse_mlb_api_boxscore,
  parse_mlb_api_linescore,
  parse_mlb_api_play_by_play,
  parse_mlb_api_win_probability,
  parse_mlb_api_draft_latest,
  parse_mlb_api_timecodes,
} from '../../dist/parsers/mlb_api.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';

// Unit tests for the MLB Stats API parsers. Inline raw payloads (no network)
// -> tidy rows: row count + snake_cased flattened keys. Covers the generic
// list flattener plus every dedicated parser (extra unrolling logic).

describe('parsers/mlb_api: parse_mlb_api_teams', () => {
  it('produces one tidy row per team with snake_cased keys', () => {
    const raw = {
      teams: [
        { id: 147, name: 'New York Yankees', teamCode: 'nya' },
        { id: 111, name: 'Boston Red Sox', teamCode: 'bos' },
      ],
    };
    const rows = parse_mlb_api_teams(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('id', 147);
    rows[0].should.have.property('name', 'New York Yankees');
    rows[0].should.have.property('team_code', 'nya'); // teamCode -> team_code
  });

  it('flattens nested team fields (venue.*) into _ columns', () => {
    const rows = parse_mlb_api_teams({
      teams: [{ id: 147, venue: { id: 3313, name: 'Yankee Stadium' } }],
    });
    rows[0].should.have.property('venue_id', 3313);
    rows[0].should.have.property('venue_name', 'Yankee Stadium');
  });

  it('returns [] for a missing / empty teams block', () => {
    parse_mlb_api_teams({}).should.eql([]);
    parse_mlb_api_teams({ teams: [] }).should.eql([]);
    parse_mlb_api_teams(null).should.eql([]);
  });
});

describe('parsers/mlb_api: parse_mlb_api_schedule', () => {
  it('unrolls dates[].games[] into one row per game with the schedule_date prefix', () => {
    const raw = {
      dates: [
        {
          date: '2024-07-04',
          games: [
            { gamePk: 1, teams: { home: { team: { id: 147 } }, away: { team: { id: 111 } } } },
            { gamePk: 2, teams: { home: { team: { id: 121 } }, away: { team: { id: 143 } } } },
          ],
        },
        { date: '2024-07-05', games: [{ gamePk: 3 }] },
      ],
    };
    const rows = parse_mlb_api_schedule(raw);
    rows.length.should.equal(3);
    rows[0].should.have.property('schedule_date', '2024-07-04');
    rows[0].should.have.property('game_pk', 1); // gamePk -> game_pk
    rows[0].should.have.property('teams_home_team_id', 147); // deep flatten + snake
    rows[2].should.have.property('schedule_date', '2024-07-05');
    rows[2].should.have.property('game_pk', 3);
  });

  it('returns [] for a missing / empty dates block', () => {
    parse_mlb_api_schedule({}).should.eql([]);
    parse_mlb_api_schedule({ dates: [] }).should.eql([]);
    parse_mlb_api_schedule(null).should.eql([]);
  });
});

describe('parsers/mlb_api: parse_mlb_api_list (generic flattener)', () => {
  it('finds the first list-valued top-level key and flattens it', () => {
    const rows = parse_mlb_api_list({
      copyright: 'MLB Advanced Media',
      venues: [
        { id: 15, name: 'Dodger Stadium', location: { city: 'Los Angeles' } },
        { id: 1, name: 'Oriole Park' },
      ],
    });
    rows.length.should.equal(2);
    rows[0].should.have.property('id', 15);
    rows[0].should.have.property('location_city', 'Los Angeles'); // deep flatten
  });

  it('returns [] when no recognized list key resolves', () => {
    parse_mlb_api_list({ copyright: 'x', totalItems: 0 }).should.eql([]);
    parse_mlb_api_list({}).should.eql([]);
    parse_mlb_api_list(null).should.eql([]);
  });
});

describe('parsers/mlb_api: parse_mlb_api_team_roster', () => {
  it('produces one row per player with flattened person/position/status', () => {
    const raw = {
      roster: [
        {
          jerseyNumber: '99',
          person: { id: 592450, fullName: 'Aaron Judge' },
          position: { abbreviation: 'RF' },
          status: { code: 'A' },
        },
        {
          jerseyNumber: '45',
          person: { id: 543037, fullName: 'Gerrit Cole' },
          position: { abbreviation: 'P' },
          status: { code: 'A' },
        },
      ],
    };
    const rows = parse_mlb_api_team_roster(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('jersey_number', '99'); // jerseyNumber -> jersey_number
    rows[0].should.have.property('person_id', 592450); // person.id -> person_id
    rows[0].should.have.property('position_abbreviation', 'RF');
    rows[0].should.have.property('status_code', 'A');
  });

  it('returns [] for a missing / empty roster block', () => {
    parse_mlb_api_team_roster({}).should.eql([]);
    parse_mlb_api_team_roster({ roster: [] }).should.eql([]);
    parse_mlb_api_team_roster(null).should.eql([]);
  });
});

describe('parsers/mlb_api: parse_mlb_api_standings', () => {
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
          teamRecords: [
            { team: { id: 144, name: 'Braves' }, wins: 89, losses: 73, divisionRank: '2' },
          ],
        },
      ],
    };
    const rows = parse_mlb_api_standings(raw);
    rows.length.should.equal(3);
    rows[0].should.have.property('standings_league_id', 103);
    rows[0].should.have.property('standings_division_name', 'AL East');
    rows[0].should.have.property('wins', 94);
    rows[0].should.have.property('team_id', 147); // team.id -> team_id
    rows[0].should.have.property('division_rank', '1'); // divisionRank -> division_rank
    rows[2].should.have.property('standings_league_id', 104);
  });

  it('returns [] for a missing / empty records block', () => {
    parse_mlb_api_standings({}).should.eql([]);
    parse_mlb_api_standings({ records: [] }).should.eql([]);
    parse_mlb_api_standings(null).should.eql([]);
  });
});

describe('parsers/mlb_api: parse_mlb_api_person_stats', () => {
  it('unrolls stats[].splits[] with stats_type / stats_group context', () => {
    const raw = {
      stats: [
        {
          type: { displayName: 'season' },
          group: { displayName: 'hitting' },
          splits: [
            { season: '2024', stat: { homeRuns: 58, avg: '.322' }, team: { id: 147 } },
            { season: '2023', stat: { homeRuns: 37, avg: '.267' }, team: { id: 147 } },
          ],
        },
      ],
    };
    const rows = parse_mlb_api_person_stats(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('stats_type', 'season');
    rows[0].should.have.property('stats_group', 'hitting');
    rows[0].should.have.property('stat_home_runs', 58); // stat.homeRuns -> stat_home_runs
    rows[0].should.have.property('team_id', 147);
    rows[1].should.have.property('season', '2023');
  });

  it('returns [] for a missing / empty stats block', () => {
    parse_mlb_api_person_stats({}).should.eql([]);
    parse_mlb_api_person_stats({ stats: [] }).should.eql([]);
    parse_mlb_api_person_stats(null).should.eql([]);
  });
});

describe('parsers/mlb_api: parse_mlb_api_boxscore', () => {
  it('walks the players-by-ID dict on both sides into one row per player', () => {
    const raw = {
      teams: {
        home: {
          team: { id: 147, name: 'Yankees' },
          players: {
            ID592450: { person: { id: 592450, fullName: 'Aaron Judge' }, stats: { batting: { hits: 2 } } },
          },
        },
        away: {
          team: { id: 111, name: 'Red Sox' },
          players: {
            ID646240: { person: { id: 646240, fullName: 'Rafael Devers' }, stats: { batting: { hits: 1 } } },
            ID605141: { person: { id: 605141, fullName: 'Mookie Betts' }, stats: { batting: { hits: 0 } } },
          },
        },
      },
    };
    const rows = parse_mlb_api_boxscore(raw);
    rows.length.should.equal(3); // 1 home + 2 away
    rows[0].should.have.property('team_side', 'home');
    rows[0].should.have.property('team_id', 147);
    rows[0].should.have.property('person_id', 592450);
    rows[0].should.have.property('stats_batting_hits', 2); // deep flatten
    const away = rows.filter((r) => r.team_side === 'away');
    away.length.should.equal(2);
  });

  it('returns [] for a missing / empty teams block', () => {
    parse_mlb_api_boxscore({}).should.eql([]);
    parse_mlb_api_boxscore({ teams: {} }).should.eql([]);
    parse_mlb_api_boxscore(null).should.eql([]);
  });
});

describe('parsers/mlb_api: parse_mlb_api_linescore', () => {
  it('produces one row per inning with flattened home/away splits', () => {
    const raw = {
      innings: [
        { num: 1, ordinalNum: '1st', home: { runs: 0, hits: 1 }, away: { runs: 2, hits: 3 } },
        { num: 2, ordinalNum: '2nd', home: { runs: 1, hits: 2 }, away: { runs: 0, hits: 0 } },
      ],
    };
    const rows = parse_mlb_api_linescore(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('num', 1);
    rows[0].should.have.property('home_runs', 0);
    rows[0].should.have.property('away_hits', 3);
  });

  it('returns [] for a missing / empty innings block', () => {
    parse_mlb_api_linescore({}).should.eql([]);
    parse_mlb_api_linescore(null).should.eql([]);
  });
});

describe('parsers/mlb_api: parse_mlb_api_play_by_play', () => {
  it('produces one row per play from allPlays[] with deep-flattened keys', () => {
    const raw = {
      allPlays: [
        { result: { event: 'Home Run', rbi: 1 }, about: { inning: 1, halfInning: 'top' }, count: { balls: 2, strikes: 1 } },
        { result: { event: 'Strikeout', rbi: 0 }, about: { inning: 1, halfInning: 'top' }, count: { balls: 0, strikes: 3 } },
      ],
    };
    const rows = parse_mlb_api_play_by_play(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('result_event', 'Home Run'); // result.event -> result_event
    rows[0].should.have.property('about_half_inning', 'top'); // about.halfInning -> about_half_inning
    rows[0].should.have.property('count_strikes', 1);
  });

  it('returns [] for a missing / empty allPlays block', () => {
    parse_mlb_api_play_by_play({}).should.eql([]);
    parse_mlb_api_play_by_play(null).should.eql([]);
  });
});

describe('parsers/mlb_api: parse_mlb_api_win_probability', () => {
  it('flattens a bare top-level array of play win-prob objects', () => {
    const raw = [
      { atBatIndex: 0, homeTeamWinProbability: 50.0, awayTeamWinProbability: 50.0 },
      { atBatIndex: 1, homeTeamWinProbability: 53.2, awayTeamWinProbability: 46.8 },
    ];
    const rows = parse_mlb_api_win_probability(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('at_bat_index', 0);
    rows[1].should.have.property('home_team_win_probability', 53.2); // snake_cased
  });

  it('returns [] for a non-array payload', () => {
    parse_mlb_api_win_probability({}).should.eql([]);
    parse_mlb_api_win_probability(null).should.eql([]);
    parse_mlb_api_win_probability([]).should.eql([]);
  });
});

describe('parsers/mlb_api: parse_mlb_api_draft_latest', () => {
  it('flattens the single {pick, ...} object as one row, dropping copyright', () => {
    const raw = {
      copyright: 'MLB Advanced Media',
      pick: { pickNumber: 1, person: { id: 12345, fullName: 'Top Prospect' } },
      number: 1,
    };
    const rows = parse_mlb_api_draft_latest(raw);
    rows.length.should.equal(1);
    rows[0].should.not.have.property('copyright');
    rows[0].should.have.property('pick_pick_number', 1); // pick.pickNumber -> pick_pick_number
    rows[0].should.have.property('pick_person_id', 12345);
    rows[0].should.have.property('number', 1);
  });

  it('returns [] for an empty payload', () => {
    parse_mlb_api_draft_latest({}).should.eql([]);
    parse_mlb_api_draft_latest(null).should.eql([]);
  });
});

describe('parsers/mlb_api: parse_mlb_api_timecodes', () => {
  it('shapes a bare array of timecode strings into a single timecode column', () => {
    const rows = parse_mlb_api_timecodes(['20230929_215457', '20230929_215512']);
    rows.length.should.equal(2);
    rows[0].should.have.property('timecode', '20230929_215457');
  });

  it('returns [] for a non-array / empty payload', () => {
    parse_mlb_api_timecodes({}).should.eql([]);
    parse_mlb_api_timecodes([]).should.eql([]);
    parse_mlb_api_timecodes(null).should.eql([]);
  });
});

describe('parsers/_registry', () => {
  it('registers the dedicated parsers and resolves them by name', () => {
    parserFor('parse_mlb_api_teams').should.equal(parse_mlb_api_teams);
    parserFor('parse_mlb_api_schedule').should.equal(parse_mlb_api_schedule);
    parserFor('parse_mlb_api_list').should.equal(parse_mlb_api_list);
    parserFor('parse_mlb_api_standings').should.equal(parse_mlb_api_standings);
    parserFor('parse_mlb_api_boxscore').should.equal(parse_mlb_api_boxscore);
    for (const name of [
      'parse_mlb_api_list',
      'parse_mlb_api_teams',
      'parse_mlb_api_schedule',
      'parse_mlb_api_team_roster',
      'parse_mlb_api_standings',
      'parse_mlb_api_person_stats',
      'parse_mlb_api_boxscore',
      'parse_mlb_api_linescore',
      'parse_mlb_api_play_by_play',
      'parse_mlb_api_win_probability',
      'parse_mlb_api_draft_latest',
      'parse_mlb_api_timecodes',
    ]) {
      Object.keys(PARSERS).should.containEql(name);
    }
  });

  it('returns undefined for an unknown or missing parser name', () => {
    should(parserFor('nope')).be.undefined();
    should(parserFor()).be.undefined();
  });
});

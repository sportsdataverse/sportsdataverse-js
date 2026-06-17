import should from 'should';
import {
  parse_nhl_web_pbp,
  parse_nhl_web_boxscore,
  parse_nhl_web_schedule,
  parse_nhl_web_roster,
  parse_nhl_web_leaders,
  parse_nhl_web_right_rail,
  parse_nhl_web_club_stats,
  parse_nhl_web_player_spotlight,
} from '../../dist/parsers/nhl_api_web.js';
import {
  parse_edge_top10,
  parse_edge_detail,
  parse_edge_shot_location,
  parse_edge_zone_time,
  parse_edge_hardest_shots,
  parse_edge_payload,
} from '../../dist/parsers/nhl_edge.js';
import { parse_nhl_stats_rest } from '../../dist/parsers/nhl_stats_rest.js';
import { parse_nhl_records } from '../../dist/parsers/nhl_records.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';

// Unit tests for the four NHL native-API parser families. Inline raw payloads
// (no network) -> tidy rows: row counts + a couple snake_cased flattened keys.
// Faithful-port parity with sdv-py's nhl_*_parsers test suites.

// ---------------------------------------------------------------------------
// nhl_api_web (modern game-feed)
// ---------------------------------------------------------------------------

describe('parsers/nhl_api_web: parse_nhl_web_pbp', () => {
  it('produces one row per play, deep-flattening periodDescriptor / details', () => {
    const raw = {
      plays: [
        { eventId: 8, typeDescKey: 'faceoff', periodDescriptor: { number: 1 }, details: { xCoord: 0, yCoord: 0 } },
        { eventId: 51, typeDescKey: 'goal', periodDescriptor: { number: 1 }, details: { scoringPlayerId: 8478402 } },
      ],
    };
    const rows = parse_nhl_web_pbp(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('event_id', 8); // eventId -> event_id
    rows[0].should.have.property('period_descriptor_number', 1); // deep flatten
    rows[1].should.have.property('details_scoring_player_id', 8478402);
  });

  it('returns [] for a missing / empty plays block', () => {
    parse_nhl_web_pbp({}).should.eql([]);
    parse_nhl_web_pbp(null).should.eql([]);
  });
});

describe('parsers/nhl_api_web: parse_nhl_web_boxscore', () => {
  it('walks all six (team × position-group) buckets into long-form rows', () => {
    const raw = {
      playerByGameStats: {
        awayTeam: {
          forwards: [{ playerId: 1, name: { default: 'A Fwd' } }],
          defense: [{ playerId: 2 }],
          goalies: [],
        },
        homeTeam: {
          forwards: [{ playerId: 3 }],
          defense: [],
          goalies: [{ playerId: 4 }],
        },
      },
    };
    const rows = parse_nhl_web_boxscore(raw);
    rows.length.should.equal(4); // 1+1 away, 1+1 home
    rows[0].should.have.property('home_away', 'away');
    rows[0].should.have.property('position_group', 'forwards');
    rows[0].should.have.property('player_id', 1);
    rows[0].should.have.property('name_default', 'A Fwd'); // deep flatten
    const home = rows.filter((r) => r.home_away === 'home');
    home.length.should.equal(2);
    home.some((r) => r.position_group === 'goalies').should.be.true();
  });

  it('returns [] for a missing playerByGameStats block', () => {
    parse_nhl_web_boxscore({}).should.eql([]);
    parse_nhl_web_boxscore(null).should.eql([]);
  });
});

describe('parsers/nhl_api_web: parse_nhl_web_schedule', () => {
  it('unrolls gameWeek[].games[] with the schedule_date prefix', () => {
    const raw = {
      gameWeek: [
        { date: '2024-10-08', games: [{ id: 2024020001 }, { id: 2024020002 }] },
        { date: '2024-10-09', games: [{ id: 2024020003 }] },
      ],
    };
    const rows = parse_nhl_web_schedule(raw);
    rows.length.should.equal(3);
    rows[0].should.have.property('schedule_date', '2024-10-08');
    rows[0].should.have.property('id', 2024020001);
    rows[2].should.have.property('schedule_date', '2024-10-09');
  });

  it('returns [] for a missing gameWeek block', () => {
    parse_nhl_web_schedule({}).should.eql([]);
    parse_nhl_web_schedule(null).should.eql([]);
  });
});

describe('parsers/nhl_api_web: parse_nhl_web_roster', () => {
  it('merges forwards / defensemen / goalies with a position_group column', () => {
    const raw = {
      forwards: [{ id: 1 }, { id: 2 }],
      defensemen: [{ id: 3 }],
      goalies: [{ id: 4 }],
    };
    const rows = parse_nhl_web_roster(raw);
    rows.length.should.equal(4);
    rows[0].should.have.property('position_group', 'forwards');
    rows[2].should.have.property('position_group', 'defensemen');
    rows[3].should.have.property('position_group', 'goalies');
    rows[3].should.have.property('id', 4);
  });

  it('returns [] for a non-dict payload', () => {
    parse_nhl_web_roster(null).should.eql([]);
  });
});

describe('parsers/nhl_api_web: parse_nhl_web_leaders', () => {
  it('walks category-keyed lists, tagging each row with its category', () => {
    const raw = {
      points: [{ id: 8478402, value: 100 }, { id: 8477934, value: 95 }],
      goals: [{ id: 8478402, value: 50 }],
    };
    const rows = parse_nhl_web_leaders(raw);
    rows.length.should.equal(3);
    rows[0].should.have.property('category', 'points');
    rows[0].should.have.property('id', 8478402);
    rows[2].should.have.property('category', 'goals');
  });

  it('returns [] for a non-dict payload', () => {
    parse_nhl_web_leaders(null).should.eql([]);
  });
});

describe('parsers/nhl_api_web: dispatchers return their primary sub-frame', () => {
  it('parse_nhl_web_right_rail returns the seasonSeries rows', () => {
    const raw = {
      seasonSeries: [{ id: 1, gameDate: '2024-10-08' }, { id: 2, gameDate: '2024-11-01' }],
      shotsByPeriod: [{ period: 1 }],
      gameInfo: { referees: [] },
    };
    const rows = parse_nhl_web_right_rail(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('game_date', '2024-10-08');
  });

  it('parse_nhl_web_club_stats returns the skaters rows', () => {
    const raw = {
      skaters: [{ playerId: 1, goals: 10 }, { playerId: 2, goals: 7 }],
      goalies: [{ playerId: 3 }],
    };
    const rows = parse_nhl_web_club_stats(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('player_id', 1);
    rows[0].should.have.property('goals', 10);
  });
});

describe('parsers/nhl_api_web: parse_nhl_web_player_spotlight (bare array)', () => {
  it('flattens a bare top-level array of featured players', () => {
    const raw = [{ playerId: 1, fullName: 'X' }, { playerId: 2 }];
    const rows = parse_nhl_web_player_spotlight(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('player_id', 1);
  });

  it('returns [] for a non-array payload', () => {
    parse_nhl_web_player_spotlight({}).should.eql([]);
    parse_nhl_web_player_spotlight(null).should.eql([]);
  });
});

// ---------------------------------------------------------------------------
// nhl_edge (player/team tracking)
// ---------------------------------------------------------------------------

describe('parsers/nhl_edge: parse_edge_detail (single-row flatten)', () => {
  it('flattens a detail payload to a single row, stringifying list cells', () => {
    const raw = {
      playerId: 8478402,
      skatingSpeed: { maxSpeed: 38.1, percentile: 99 },
      gameLog: [{ g: 1 }, { g: 2 }],
    };
    const rows = parse_edge_detail(raw);
    rows.length.should.equal(1);
    rows[0].should.have.property('player_id', 8478402);
    rows[0].should.have.property('skating_speed_max_speed', 38.1); // deep flatten
    (typeof rows[0].game_log).should.equal('string'); // list stringified
  });

  it('returns [] for an empty payload', () => {
    parse_edge_detail({}).should.eql([]);
    parse_edge_detail(null).should.eql([]);
  });
});

describe('parsers/nhl_edge: parse_edge_top10 (leaderboard)', () => {
  it('finds the first non-empty list key and flattens it', () => {
    const raw = { leaderboard: [{ playerId: 1, rank: 1 }, { playerId: 2, rank: 2 }] };
    const rows = parse_edge_top10(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('player_id', 1);
  });

  it('falls back to the first list-of-dicts when no known key matches', () => {
    const rows = parse_edge_top10({ somethingElse: [{ a: 1 }] });
    rows.length.should.equal(1);
    rows[0].should.have.property('a', 1);
  });

  it('returns [] when nothing resolves', () => {
    parse_edge_top10({ total: 0 }).should.eql([]);
    parse_edge_top10(null).should.eql([]);
  });
});

describe('parsers/nhl_edge: parse_edge_shot_location (heat map)', () => {
  it('returns the most granular zone list (shotLocationDetails first)', () => {
    const raw = {
      shotLocationDetails: [{ area: 'A', shots: 5 }, { area: 'B', shots: 3 }],
      sogSummary: [{ locationCode: 'X' }],
    };
    const rows = parse_edge_shot_location(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('area', 'A');
    rows[0].should.have.property('shots', 5);
  });

  it('returns [] when no zone key is present', () => {
    parse_edge_shot_location({ foo: 1 }).should.eql([]);
    parse_edge_shot_location(null).should.eql([]);
  });
});

describe('parsers/nhl_edge: parse_edge_zone_time', () => {
  it('returns multi-row strength splits from a list-valued zoneTimeDetails', () => {
    const raw = {
      zoneTimeDetails: [
        { strengthCode: 'ev', offensiveZonePctg: 0.55 },
        { strengthCode: 'pp', offensiveZonePctg: 0.7 },
      ],
    };
    const rows = parse_edge_zone_time(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('strength_code', 'ev');
    rows[0].should.have.property('offensive_zone_pctg', 0.55);
  });

  it('flattens a dict-valued zoneTimeDetails to a single row', () => {
    const rows = parse_edge_zone_time({ zoneTimeDetails: { offensiveZonePctg: 0.6 } });
    rows.length.should.equal(1);
    rows[0].should.have.property('offensive_zone_pctg', 0.6);
  });
});

describe('parsers/nhl_edge: sub-frame + generic fallback', () => {
  it('parse_edge_hardest_shots returns the hardestShots list', () => {
    const rows = parse_edge_hardest_shots({ hardestShots: [{ shotSpeed: 100 }, { shotSpeed: 99 }] });
    rows.length.should.equal(2);
    rows[0].should.have.property('shot_speed', 100);
    parse_edge_hardest_shots({}).should.eql([]);
  });

  it('parse_edge_payload picks the largest list-of-dicts', () => {
    const rows = parse_edge_payload({ small: [{ a: 1 }], big: [{ b: 1 }, { b: 2 }, { b: 3 }] });
    rows.length.should.equal(3);
    rows[0].should.have.property('b', 1);
  });
});

// ---------------------------------------------------------------------------
// nhl_stats_rest + nhl_records (shared {data:[...]} generic)
// ---------------------------------------------------------------------------

describe('parsers/nhl_stats_rest: parse_nhl_stats_rest', () => {
  it('unwraps {data:[...]} and deep-flattens', () => {
    const raw = {
      data: [
        { id: 10, fullName: 'Toronto Maple Leafs', franchise: { teamCommonName: 'Maple Leafs' } },
        { id: 5, fullName: 'Pittsburgh Penguins' },
      ],
      total: 2,
    };
    const rows = parse_nhl_stats_rest(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('id', 10);
    rows[0].should.have.property('full_name', 'Toronto Maple Leafs'); // fullName -> full_name
    rows[0].should.have.property('franchise_team_common_name', 'Maple Leafs'); // deep flatten
  });

  it('returns [] for meta payloads with no data array', () => {
    parse_nhl_stats_rest({ ok: true }).should.eql([]);
    parse_nhl_stats_rest({ data: [] }).should.eql([]);
    parse_nhl_stats_rest(null).should.eql([]);
  });
});

describe('parsers/nhl_records: parse_nhl_records', () => {
  it('unwraps the same {data:[...]} shape', () => {
    const raw = {
      data: [
        { id: 1, fullName: 'Montréal Canadiens', mostRecentTeamId: 8 },
        { id: 2, fullName: 'Toronto Maple Leafs' },
      ],
      total: 2,
    };
    const rows = parse_nhl_records(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('id', 1);
    rows[0].should.have.property('most_recent_team_id', 8); // mostRecentTeamId -> most_recent_team_id
  });

  it('returns [] for a missing / empty data block', () => {
    parse_nhl_records({}).should.eql([]);
    parse_nhl_records({ data: [] }).should.eql([]);
    parse_nhl_records(null).should.eql([]);
  });
});

// ---------------------------------------------------------------------------
// registry wiring
// ---------------------------------------------------------------------------

describe('parsers/_registry: NHL parsers are registered + resolvable by name', () => {
  it('resolves each NHL parser by its YAML-referenced name', () => {
    parserFor('parse_nhl_web_pbp').should.equal(parse_nhl_web_pbp);
    parserFor('parse_edge_detail').should.equal(parse_edge_detail);
    parserFor('parse_nhl_stats_rest').should.equal(parse_nhl_stats_rest);
    parserFor('parse_nhl_records').should.equal(parse_nhl_records);
  });

  it('registers every NHL parser name the YAMLs reference', () => {
    for (const name of [
      // nhl_api_web
      'parse_nhl_web_pbp',
      'parse_nhl_web_boxscore',
      'parse_nhl_web_landing',
      'parse_nhl_web_right_rail',
      'parse_nhl_web_schedule',
      'parse_nhl_web_score',
      'parse_nhl_web_club_schedule',
      'parse_nhl_web_standings',
      'parse_nhl_web_standings_season',
      'parse_nhl_web_club_stats',
      'parse_nhl_web_roster',
      'parse_nhl_web_player_landing',
      'parse_nhl_web_player_game_log',
      'parse_nhl_web_leaders',
      'parse_nhl_web_draft_picks',
      'parse_nhl_web_player_spotlight',
      'parse_nhl_web_draft_rankings',
      'parse_nhl_web_playoff_series',
      // nhl_edge
      'parse_edge_top10',
      'parse_edge_detail',
      'parse_edge_shot_location',
      'parse_edge_zone_time',
      // nhl_stats_rest + nhl_records
      'parse_nhl_stats_rest',
      'parse_nhl_records',
    ]) {
      Object.keys(PARSERS).should.containEql(name);
    }
  });
});

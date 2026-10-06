import { readFileSync } from 'node:fs';
import should from 'should';
import {
  parse_cbs_list,
  parse_cbs_scoreboard,
  parse_cbs_standings,
  parse_cbs_odds,
} from '../../dist/parsers/cbs.js';
import { isIdColumn } from '../../dist/core/int64.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';
import { FLAT_WRAPPERS } from '../../dist/index.js';
import { FLAT_HOSTS } from '../../dist/core/client.js';

// Unit tests for the CBS Sports NAPI parsers (no network). The generic envelope
// parser (`parse_cbs_list`: sdv-py `parse_cbs_napi` plus the two scoring-feed
// parsers) and the standings parser (sdv-py `parse_cbs_napi_standings`) run on
// the REAL captures in test/fixtures/cbs/ (sdv-py@2cfc90c9e7, provenance in
// that directory's README): row counts, ids, names and scores are read off the
// bodies; test/parsers/parity.test.js holds the same captures cell-for-cell to
// sdv-py's output. `parse_cbs_scoreboard` / `parse_cbs_odds` have no public
// capture, so their shape tests stay synthetic and say so. Malformed / empty
// payloads are a separate synthetic block. The registry-wiring and
// flat-contract metadata blocks assert the family registers on the CBS host
// with no auth.

const load = (stem) =>
  JSON.parse(readFileSync(new URL(`../fixtures/cbs/${stem}.json`, import.meta.url), 'utf8'));

const SNAKE = /^[a-z0-9_]+$/;
const DECIMAL = /^-?\d+$/;

/** Every key snake_case; every id column (per `isIdColumn`) a decimal string, never a number. */
function assertTidy(rows) {
  rows.length.should.be.above(0);
  for (const row of rows) {
    for (const [k, v] of Object.entries(row)) {
      k.should.match(SNAKE, `non-snake key ${k}`);
      if (isIdColumn(k) && v !== null && v !== undefined) {
        (typeof v).should.equal('string', `${k} is a ${typeof v}: ${v}`);
        v.should.match(DECIMAL, `${k} is not a decimal string: ${v}`);
      }
    }
  }
}

// sdv-py's pinned scoring-feed column orders (`_PLAY_COLUMNS` / `_DRIVE_COLUMNS`).
const PLAY_COLUMNS = [
  'id', 'game_id', 'drive_id', 'quarter', 'time_remaining', 'down', 'distance', 'side', 'yardline',
  'team_in_possession', 'description', 'medium', 'short', 'score_on_play', 'score_type', 'short_score',
  'under_review', 'home_timeouts_remaining', 'away_timeouts_remaining', 'real_clock', 'subplays',
];
const DRIVE_COLUMNS = [
  'id', 'team_id', 'quarter', 'starting_time', 'ending_time', 'time_of_possession', 'starting_yardline',
  'ending_yardline', 'starting_play_id', 'ending_play_id', 'drive_plays', 'yards_on_drive', 'drive_yards_total',
  'penalty_yards', 'first_downs_on_drive', 'inside_the_20', 'score_on_drive', 'result',
];

describe('parsers/cbs: parse_cbs_list on real captures', () => {
  it('season/teams/18 — {data:[...]} list -> 3 team rows with string ids', () => {
    const rows = parse_cbs_list(load('season_teams_nfl'));
    rows.length.should.equal(3);
    assertTidy(rows);
    rows.map((r) => r.team_id).should.eql(['404', '405', '406']);
    rows.map((r) => r.abbrev).should.eql(['ARI', 'ATL', 'BAL']);
    rows.map((r) => r.nick_name).should.eql(['Cardinals', 'Falcons', 'Ravens']);
    rows.map((r) => r.division_id).should.eql(['262', '288858', '288856']);
    for (const r of rows) r.league_id.should.equal('59');
    rows[0].meta_season_id.should.equal('18'); // nested meta.seasonId deep-flattens
    rows[0].players.should.equal('[]'); // empty list JSON-encoded, not exploded
    rows[0].meta_tsa_overlay.should.be.true(); // a bool column with no gap stays boolean
    should(rows[0].league).be.null();
    Object.keys(rows[0]).length.should.equal(30);
  });

  it('team/players/247415 — 3 player rows; nullable scalars stay null', () => {
    const rows = parse_cbs_list(load('team_players_nfl'));
    rows.length.should.equal(3);
    assertTidy(rows);
    rows.map((r) => r.player_id).should.eql(['1751796', '2129673', '1675230']);
    rows.map((r) => r.last_name).should.eql(['Prosch', 'Ballentine', 'Verdell']);
    rows[0].should.have.property('first_name', 'Jay');
    rows[0].should.have.property('school', 'Auburn');
    rows[0].should.have.property('weight', 255); // non-id numbers stay numbers
    rows[0].should.have.property('experience', 5);
    should(rows[2].weight).be.null();
    should(rows[2].school).be.null();
    Object.keys(rows[0]).length.should.equal(31);
  });

  it('league/59 — un-enveloped plain object -> one row', () => {
    const rows = parse_cbs_list(load('league_meta_nfl'));
    rows.length.should.equal(1);
    assertTidy(rows);
    rows[0].should.eql({
      league_id: '59',
      league_abbr: 'NFL',
      league_name: 'National Football League',
      sport_id: '1',
      league_type: 'M',
      teams: '[]',
      color_primary: '#003369',
      color_secondary: '#D50A0A',
    });
  });

  it('endpoint/registry — keyed collection -> one row per resource, the key in `key`', () => {
    const rows = parse_cbs_list(load('endpoint_registry'));
    rows.length.should.equal(4);
    assertTidy(rows);
    rows.map((r) => r.key).should.eql([
      'BoxscoreResource',
      'PlayerResource',
      'PlayerTeamAssociationsResource',
      'RecruitTeamAssociationsResource',
    ]);
    Object.keys(rows[0])[0].should.equal('key');
    Object.keys(rows[0]).length.should.equal(17);
    rows.map((r) => r.path).should.eql([
      '/resource/game/boxscore/{gameId}',
      '/resource/player/{playerId}',
      '/resource/player/teamAssociations/{playerId}',
      '/resource/player/recruitAssociations/{playerId}',
    ]);
    rows[0].auth_settings_require_auth.should.be.true(); // nested authSettings deep-flattens
    rows[0].resource_cache_cache_buster.should.equal(1); // non-id numbers stay numbers
    rows[0].methods.should.equal('["GET"]'); // list cells JSON-encoded, py json.dumps spacing
    rows[0].parameters.should.startWith('[{"name": "gameId", "required": true');
  });

  for (const [league, gameId, firstId, lastId, driveIds, sides, quarters, downs] of [
    ['ncaaf', '50027666', '1789257032308', '1789265326725', ['1', '1', '2', '2', '2', '2', '2', '4', '9', '16'], ['OHIOST', 'TEXAS'], [1, 1, 1, 1, 1, 1, 1, 1, 2, 3], [0, 1, 1, 2, 1, 3, 4, 0, 3, 4]],
    ['nfl', '50029216', '40', '2827', ['1', '1', '1', '1', '1', '2', '2', '3', '4', '15'], ['CLE', 'JAC'], [1, 1, 1, 1, 1, 1, 1, 1, 1, 3], [0, 1, 1, 2, 1, 3, 0, 0, 1, 0]],
  ]) {
    it(`game/scoring/plays/${gameId} (${league}) — {plays:[...]} -> 10 play rows, pinned columns, 13-digit ids kept exact`, () => {
      const rows = parse_cbs_list(load(`game_scoring_plays_${league}`));
      rows.length.should.equal(10);
      assertTidy(rows);
      Object.keys(rows[0]).should.eql(PLAY_COLUMNS); // sdv-py's pinned order, every column present
      for (const r of rows) r.game_id.should.equal(gameId);
      rows[0].id.should.equal(firstId);
      rows[9].id.should.equal(lastId);
      rows.map((r) => r.drive_id).should.eql(driveIds);
      [...new Set(rows.map((r) => r.side))].sort().should.eql(sides);
      rows.map((r) => r.distance).should.containEql('Goal'); // CBS sends the literal on goal-to-go: stays text
      // the always-integer string fields are numbers (ids excepted), the Yes/No flags booleans
      rows.map((r) => r.quarter).should.eql(quarters);
      rows.map((r) => r.down).should.eql(downs);
      rows.filter((r) => r.score_on_play === true).length.should.equal(2);
      rows.every((r) => r.under_review === false).should.be.true();
      (typeof rows[0].team_in_possession).should.equal('number');
      // subplays: the sub-events flattened (event block merged in), JSON-encoded, one field set per body
      const subplays = JSON.parse(rows[0].subplays);
      subplays.map((s) => s.type).should.eql(['Kickoff', 'KickReturn']);
      subplays[0].should.have.property('kicker_name');
      subplays[0].should.have.property('returned_by', null);
      subplays[1].returned_by.should.match(DECIMAL);
      Object.keys(subplays[0]).should.eql(Object.keys(subplays[1]));
    });

    it(`game/scoring/drives/${gameId} (${league}) — {drives:[...]} -> 3 drive rows that join to the plays on drive_id`, () => {
      const drives = parse_cbs_list(load(`game_scoring_drives_${league}`));
      drives.length.should.equal(3);
      assertTidy(drives);
      Object.keys(drives[0]).should.eql(DRIVE_COLUMNS);
      drives.map((d) => d.id).should.eql(['1', '2', '3']);
      const plays = parse_cbs_list(load(`game_scoring_plays_${league}`));
      drives[0].starting_play_id.should.equal(plays[0].id); // same id, same string
      const driveIdSet = new Set(drives.map((d) => d.id));
      plays.filter((p) => driveIdSet.has(p.drive_id)).length.should.equal(
        driveIds.filter((d) => Number(d) <= 3).length
      );
    });
  }

  it('ncaaf drives: results, team ids and typed counts read off the body', () => {
    const drives = parse_cbs_list(load('game_scoring_drives_ncaaf'));
    drives.map((d) => d.result).should.eql(['Fumble', 'Field Goal', 'Interception']);
    drives.map((d) => d.team_id).should.eql(['853', '758', '853']);
    drives.map((d) => d.yards_on_drive).should.eql([-4, 11, 13]); // CBS ships "-4": cast like sdv-py's Int64
    drives.map((d) => d.score_on_drive).should.eql([false, true, false]);
    drives.map((d) => d.inside_the_20).should.eql([false, true, false]);
    drives.map((d) => d.starting_play_id).should.eql(['1789257032308', '1789257234221', '1789257635028']);
  });

  it('nfl drives: results, team ids and typed counts read off the body', () => {
    const drives = parse_cbs_list(load('game_scoring_drives_nfl'));
    drives.map((d) => d.result).should.eql(['Interception', 'Touchdown', 'Punt']);
    drives.map((d) => d.team_id).should.eql(['434', '416', '434']);
    drives.map((d) => d.drive_plays).should.eql([5, 8, 3]);
    drives.map((d) => d.quarter).should.eql([1, 1, 1]);
    drives.map((d) => d.score_on_drive).should.eql([false, true, false]);
  });
});

describe('parsers/cbs: parse_cbs_standings on real captures', () => {
  // The team/standings body is {year: {season_type: {stat: {...}}}}: one row per
  // (season_year, season_type), the two keys leading the flattened stat columns
  // (sdv-py parse_cbs_napi_standings).
  it('team/standings/247415 (NFL) — 2 years x {pre, regular} -> 4 rows, 44 columns', () => {
    const rows = parse_cbs_standings(load('team_standings_nfl'));
    rows.length.should.equal(4);
    assertTidy(rows);
    rows.map((r) => [r.season_year, r.season_type]).should.eql([
      [2024, 'pre'],
      [2024, 'regular'],
      [2025, 'regular'],
      [2025, 'pre'],
    ]);
    Object.keys(rows[0]).slice(0, 2).should.eql(['season_year', 'season_type']);
    Object.keys(rows[0]).length.should.equal(44);
    rows.map((r) => r.wins_number).should.eql([3, 10, 12, 2]);
    rows.map((r) => r.losses_number).should.eql([1, 7, 5, 1]);
    for (const r of rows) {
      r.team_city_city.should.equal('Houston');
      r.team_code_id.should.equal('34');
      r.team_code_global_id.should.equal('325');
      r.season_league_id.should.equal('59');
      should(r.season_league).be.null(); // CBS leaves it empty: null, not an object
    }
    rows[0].games_back_number.should.equal(0.5);
    JSON.parse(rows[0].win_loss_record)[0].should.eql({ wins: 2, ties: 0, name: 'home record', type: 'home', losses: 0 });
    // a stat that is "-" in the preseason and a number in the regular season is one
    // text column (sdv-py: pandas object dtype), never a mixed number/string column
    rows.map((r) => r.strength_of_schedule_rank).should.eql(['-', '22', '9', '-']);
    rows.map((r) => r.conference_seed_seed).should.eql(['-', '4', '5', '-']);
    // a stat block only the regular season carries: null where absent
    rows.map((r) => r.clinched_playoffs_date_date).should.eql([null, null, 27, null]);
    // a bool stat with a null in it stays boolean (pandas would stringify it to "True" / "False" / "nan")
    rows.map((r) => r.clinched_first_round_bye_clinched).should.eql([null, false, false, null]);
    Object.keys(rows[0]).some((k) => k.includes('goals')).should.be.false(); // football-shaped
  });

  it('team/standings/1842464 (NHL) — hockey-shaped stat block, 2 rows, 44 columns', () => {
    const rows = parse_cbs_standings(load('team_standings_nhl'));
    rows.length.should.equal(2);
    assertTidy(rows);
    rows.map((r) => [r.season_year, r.season_type]).should.eql([
      [2025, 'regular'],
      [2025, 'pre'],
    ]);
    Object.keys(rows[0]).length.should.equal(44);
    const r = rows[0];
    r.should.have.property('wins_number', 35);
    r.should.have.property('losses_number', 35);
    r.should.have.property('overtime_losses_number', 12);
    r.should.have.property('team_points_number', 82);
    r.should.have.property('games_played_games', 82);
    r.should.have.property('goals_against_goals', 260);
    r.should.have.property('team_city_city', 'Winnipeg');
    r.should.have.property('team_code_id', '28');
    r.should.have.property('season_league_id', '60');
    JSON.parse(r.streak).map((s) => s.kind).should.eql(['losing', 'winless', 'ot-loss']);
    rows.map((x) => x.magic_number_number).should.eql(['9', '']); // 9 vs "" -> one text column
    rows.map((x) => x.eliminated_from_playoffs_eliminated).should.eql([true, null]); // native boolean, null where absent
  });

  it('a body that is not a year map falls back to the generic envelope parser (sdv-py uses parse_cbs_napi for player / SportsLine standings)', () => {
    parse_cbs_standings({ data: [{ teamId: 1, rank: 2 }] }).should.eql([{ team_id: '1', rank: 2 }]);
  });
});

describe('parsers/cbs: parse_cbs_scoreboard (synthetic — no public capture)', () => {
  it('unrolls a {data:{games:[...]}} scoreboard into one row per game', () => {
    const raw = {
      data: {
        games: [
          { gameId: 100, home: { abbr: 'NE', score: 21 }, away: { abbr: 'BUF', score: 17 } },
          { gameId: 101, home: { abbr: 'KC', score: 30 }, away: { abbr: 'DEN', score: 24 } },
        ],
      },
    };
    const rows = parse_cbs_scoreboard(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('game_id', '100');
    rows[0].should.have.property('home_abbr', 'NE'); // nested deep-flatten
    rows[0].should.have.property('away_score', 17);
  });

  it('accepts a bare array and a single-game object', () => {
    parse_cbs_scoreboard({ data: [{ gameId: 1 }] })[0].should.have.property('game_id', '1');
    parse_cbs_scoreboard({ data: { gameId: 9, status: 'final' } })[0].should.have.property(
      'game_id',
      '9'
    );
  });
});

describe('parsers/cbs: parse_cbs_odds (synthetic — no public capture)', () => {
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
    const rows = parse_cbs_odds(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('market_id', 'spread'); // market field prefixed onto book
    rows[0].should.have.property('book_id', 'dk');
    rows[0].should.have.property('line', -3.5);
    rows[1].should.have.property('book_id', 'fd');
  });

  it('flattens markets with no nested book list to one row each', () => {
    const rows = parse_cbs_odds({
      data: { markets: [{ marketId: 'ml', overUnder: 47.5 }] },
    });
    rows.length.should.equal(1);
    rows[0].should.have.property('market_id', 'ml');
    rows[0].should.have.property('over_under', 47.5);
  });

  it('accepts a single odds object', () => {
    parse_cbs_odds({ data: { gameId: 5, spread: -3 } })[0].should.have.property('game_id', '5');
  });
});

describe('parsers/cbs: malformed / empty payloads (synthetic edge cases)', () => {
  it('parse_cbs_list returns [] for empty / error-envelope / malformed payloads', () => {
    parse_cbs_list({ data: [] }).should.eql([]);
    parse_cbs_list({ data: {} }).should.eql([]);
    parse_cbs_list({ plays: [] }).should.eql([]); // an empty scoring feed is no rows, not one row
    parse_cbs_list({ drives: [] }).should.eql([]);
    parse_cbs_list({ error: 'not found' }).should.eql([]); // error envelope -> []
    // the real HTTP-200 not-found envelope NAPI returns for a bad id
    parse_cbs_list({
      warnings: [{ code: 404, type: 'NotFoundException', message: 'No scoring plays data for that game.' }],
    }).should.eql([]);
    parse_cbs_list(null).should.eql([]);
    parse_cbs_list(undefined).should.eql([]);
    parse_cbs_list('nope').should.eql([]);
    parse_cbs_list(42).should.eql([]);
  });

  it('parse_cbs_list types a scoring feed like sdv-py: a column CBS omits is present and null, "Goal" is not a number', () => {
    const rows = parse_cbs_list({ plays: [{ id: '7', drive_id: '2', down: '1', distance: 'Goal', yardline: 'x', score_on_play: 'Yes' }] });
    rows.length.should.equal(1);
    Object.keys(rows[0]).should.eql(PLAY_COLUMNS);
    rows[0].should.containEql({ id: '7', drive_id: '2', down: 1, distance: 'Goal', yardline: null, score_on_play: true, game_id: null, subplays: '[]' });
    should(rows[0].under_review).be.null(); // a missing flag is null, not false
  });

  it('parse_cbs_scoreboard returns [] for empty / malformed payloads', () => {
    parse_cbs_scoreboard({ data: {} }).should.eql([]);
    parse_cbs_scoreboard({ data: [] }).should.eql([]);
    parse_cbs_scoreboard({ errors: [{ code: 404 }] }).should.eql([]);
    parse_cbs_scoreboard(null).should.eql([]);
    parse_cbs_scoreboard('nope').should.eql([]);
  });

  it('parse_cbs_standings returns [] for empty / malformed payloads', () => {
    parse_cbs_standings({ data: {} }).should.eql([]);
    parse_cbs_standings({ data: [] }).should.eql([]);
    parse_cbs_standings({ errors: [{ code: 404 }] }).should.eql([]);
    parse_cbs_standings({ 2025: { regular: 'not a block' } }).should.eql([]);
    parse_cbs_standings(null).should.eql([]);
    parse_cbs_standings('nope').should.eql([]);
  });

  it('parse_cbs_odds returns [] for empty / malformed payloads', () => {
    parse_cbs_odds({ data: {} }).should.eql([]);
    parse_cbs_odds({ data: [] }).should.eql([]);
    parse_cbs_odds({ data: { markets: [] } }).should.eql([]);
    parse_cbs_odds(null).should.eql([]);
    parse_cbs_odds('nope').should.eql([]);
  });
});

describe('parsers/cbs: registry wiring', () => {
  it('registers all four cbs parsers by name', () => {
    for (const name of [
      'parse_cbs_list',
      'parse_cbs_scoreboard',
      'parse_cbs_standings',
      'parse_cbs_odds',
    ]) {
      (typeof PARSERS[name]).should.equal('function', `missing ${name}`);
      should(parserFor(name)).equal(PARSERS[name]);
    }
  });
});

describe('cbs flat-API family metadata (flat-contract style)', () => {
  const family = () => FLAT_WRAPPERS.filter((w) => w.api === 'cbs');

  it('registers the cbs family (82 endpoints) on https://api.cbssports.com/napi', () => {
    const rows = family();
    rows.length.should.equal(82);
    FLAT_HOSTS.cbs.should.equal('https://api.cbssports.com/napi');
    for (const w of rows) w.host.should.equal('https://api.cbssports.com/napi');
  });

  it('every cbs wrapper names a registered parser, none auth', () => {
    for (const w of family()) {
      (typeof w.parser).should.equal('string', `parser missing on ${w.short}`);
      w.parser.should.startWith('parse_cbs_');
      (typeof parserFor(w.parser)).should.equal('function', `parser ${w.parser} not registered`);
      should(w.auth).not.be.true(`unexpected auth flag on cbs_${w.short}`);
    }
  });

  it('uses the generic list parser as the default for most endpoints', () => {
    const rows = family();
    const generic = rows.filter((w) => w.parser === 'parse_cbs_list').length;
    // most endpoints use the generic flattener; the rest use dedicated parsers
    generic.should.be.above(rows.length / 2);
  });
});

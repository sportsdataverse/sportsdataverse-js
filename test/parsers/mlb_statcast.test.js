import should from 'should';
import {
  parse_mlb_statcast_leaderboard,
  parse_mlb_statcast_search,
  parse_mlb_statcast_gamefeed,
  parse_mlb_statcast_schedule,
  parse_mlb_statcast_html_leaderboard,
  parse_mlb_statcast_player,
  csvToRowsRaw,
  underscoreKeys,
} from '../../dist/parsers/mlb_statcast.js';
import {
  pipe,
  translateFilters,
  dateChunks,
} from '../../dist/leagues/mlb_statcast_extra.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';

// Unit tests for the Baseball Savant / Statcast parsers + the hand-written
// search/player helpers. Inline raw payloads (no network) -> tidy rows: row
// count + key columns. CSV text -> leaderboard rows; a gamefeed JSON ->
// per-pitch rows; an HTML <script>const data=[...] -> html-leaderboard rows; a
// serverVals HTML -> player rows; a schedule JSON -> per-game rows. Plus the
// _pipe / filter-translation unit tests (incl. scalar season=2024).

describe('parsers/mlb_statcast: parse_mlb_statcast_leaderboard (CSV)', () => {
  it('parses a tiny CSV into rows, keeping the comma first-header verbatim', () => {
    const csv =
      '"last_name, first_name",player_id,xwOBA,attempts\n' +
      '"Judge, Aaron",592450,0.458,540\n' +
      '"Ohtani, Shohei",660271,0.412,602';
    const rows = parse_mlb_statcast_leaderboard(csv);
    rows.length.should.equal(2);
    // first column header is preserved verbatim (comma + space), matching the
    // Python parser which does NOT collapse it to last_name_first_name.
    rows[0].should.have.property('last_name, first_name', 'Judge, Aaron');
    rows[0].should.have.property('player_id', '592450'); // dynamicTyping:false -> string
    rows[0].should.have.property('xw_oba', '0.458'); // xwOBA -> xw_oba (underscore)
    rows[0].should.have.property('attempts', '540');
    rows[1].should.have.property('last_name, first_name', 'Ohtani, Shohei');
  });

  it('returns [] for empty / non-string input', () => {
    parse_mlb_statcast_leaderboard('').should.eql([]);
    parse_mlb_statcast_leaderboard('   ').should.eql([]);
    parse_mlb_statcast_leaderboard(null).should.eql([]);
    parse_mlb_statcast_leaderboard({}).should.eql([]);
  });

  it('parse_mlb_statcast_search shares the CSV path (one row per result)', () => {
    const csv = 'pitch_type,release_speed,launch_speed\nFF,95.2,108.4\nSL,87.1,92.0';
    const rows = parse_mlb_statcast_search(csv);
    rows.length.should.equal(2);
    rows[0].should.have.property('pitch_type', 'FF');
    rows[0].should.have.property('release_speed', '95.2');
    rows[1].should.have.property('launch_speed', '92.0');
  });

  it('csvToRowsRaw keeps original headers; underscoreKeys applies the tidy pass', () => {
    // The hand-written search wrappers return csvToRowsRaw by default (raw) and
    // map through underscoreKeys only when { parsed: true } — this locks the split.
    const csv = '"last_name, first_name",xwOBA\n"Judge, Aaron",0.458';
    const raw = csvToRowsRaw(csv);
    raw.length.should.equal(1);
    raw[0].should.have.property('xwOBA', '0.458'); // raw: camelCase header preserved
    raw[0].should.have.property('last_name, first_name', 'Judge, Aaron');
    const tidy = raw.map(underscoreKeys);
    tidy[0].should.have.property('xw_oba', '0.458'); // tidy: underscore pass applied
    tidy[0].should.have.property('last_name, first_name', 'Judge, Aaron'); // comma preserved
  });
});

describe('parsers/mlb_statcast: parse_mlb_statcast_gamefeed (JSON)', () => {
  it('concats team_home + team_away into one row per pitch', () => {
    const raw = {
      team_home: [
        { pitch_type: 'FF', start_speed: 95.2, batter: { id: 1 } },
        { pitch_type: 'SL', start_speed: 87.1, batter: { id: 1 } },
      ],
      team_away: [{ pitch_type: 'CH', start_speed: 84.0, batter: { id: 2 } }],
    };
    const rows = parse_mlb_statcast_gamefeed(raw);
    rows.length.should.equal(3); // 2 home + 1 away
    rows[0].should.have.property('pitch_type', 'FF');
    rows[0].should.have.property('start_speed', 95.2);
    rows[0].should.have.property('batter_id', 1); // nested flatten batter.id -> batter_id
    rows[2].should.have.property('pitch_type', 'CH');
  });

  it('falls back to exit_velocity when neither side is present', () => {
    const rows = parse_mlb_statcast_gamefeed({
      exit_velocity: [{ launch_speed: 108.4, launch_angle: 28 }],
    });
    rows.length.should.equal(1);
    rows[0].should.have.property('launch_speed', 108.4);
    rows[0].should.have.property('launch_angle', 28);
  });

  it('returns [] for empty / malformed input', () => {
    parse_mlb_statcast_gamefeed({}).should.eql([]);
    parse_mlb_statcast_gamefeed({ team_home: [], team_away: [] }).should.eql([]);
    parse_mlb_statcast_gamefeed(null).should.eql([]);
    parse_mlb_statcast_gamefeed('nope').should.eql([]);
  });
});

describe('parsers/mlb_statcast: parse_mlb_statcast_html_leaderboard (HTML-embedded JSON)', () => {
  it('extracts the embedded const data = [...] array and flattens it', () => {
    const html =
      '<html><head></head><body>' +
      '<script type="text/javascript">' +
      'var methods_data = {ignore: true};' + // word-boundary guard: must NOT match `data`
      'const data = [' +
      '{"player_id":592450,"name":"Judge","value":{"runs":7}},' +
      '{"player_id":660271,"name":"Ohtani","value":{"runs":5}}' +
      '];' +
      'var other = 1;' +
      '</script></body></html>';
    const rows = parse_mlb_statcast_html_leaderboard(html);
    rows.length.should.equal(2);
    rows[0].should.have.property('player_id', 592450);
    rows[0].should.have.property('name', 'Judge');
    rows[0].should.have.property('value_runs', 7); // nested flatten value.runs -> value_runs
  });

  it('returns [] when no data array is present / input not a string', () => {
    parse_mlb_statcast_html_leaderboard('<html>no script here</html>').should.eql([]);
    parse_mlb_statcast_html_leaderboard('').should.eql([]);
    parse_mlb_statcast_html_leaderboard(null).should.eql([]);
  });
});

describe('parsers/mlb_statcast: parse_mlb_statcast_player (serverVals HTML)', () => {
  it('decodes serverVals and flattens the requested section (default statcast)', () => {
    const html =
      '<script>var serverVals = {' +
      '"statcast":[{"season":2024,"xwoba":0.458,"team":{"abbrev":"NYY"}},{"season":2023,"xwoba":0.401,"team":{"abbrev":"NYY"}}],' +
      '"statcastGameLogs":[{"game_pk":745444,"hits":2}]' +
      '};</script>';
    const rows = parse_mlb_statcast_player(html);
    rows.length.should.equal(2);
    rows[0].should.have.property('season', 2024);
    rows[0].should.have.property('xwoba', 0.458);
    rows[0].should.have.property('team_abbrev', 'NYY'); // nested flatten

    const logs = parse_mlb_statcast_player(html, 'statcastGameLogs');
    logs.length.should.equal(1);
    logs[0].should.have.property('game_pk', 745444);
    logs[0].should.have.property('hits', 2);
  });

  it('returns [] when the page / section is absent', () => {
    parse_mlb_statcast_player('<html>nope</html>').should.eql([]);
    parse_mlb_statcast_player('<script>var serverVals = {"statcast":[]};</script>').should.eql([]);
    parse_mlb_statcast_player('').should.eql([]);
    parse_mlb_statcast_player(null).should.eql([]);
  });
});

describe('parsers/mlb_statcast: parse_mlb_statcast_schedule (JSON)', () => {
  it('unrolls schedule.dates[].games[] into one row per game', () => {
    const raw = {
      schedule: {
        dates: [
          {
            date: '2024-07-04',
            games: [
              { gamePk: 745444, teams: { home: { team: { id: 147 } } } },
              { gamePk: 745445, teams: { home: { team: { id: 121 } } } },
            ],
          },
          { date: '2024-07-05', games: [{ gamePk: 745446 }] },
        ],
      },
    };
    const rows = parse_mlb_statcast_schedule(raw);
    rows.length.should.equal(3);
    rows[0].should.have.property('game_pk', 745444); // gamePk -> game_pk
    rows[0].should.have.property('teams_home_team_id', 147); // nested flatten
    rows[2].should.have.property('game_pk', 745446);
  });

  it('returns [] for missing / malformed schedule', () => {
    parse_mlb_statcast_schedule({}).should.eql([]);
    parse_mlb_statcast_schedule({ schedule: {} }).should.eql([]);
    parse_mlb_statcast_schedule({ schedule: { dates: [] } }).should.eql([]);
    parse_mlb_statcast_schedule(null).should.eql([]);
  });
});

describe('mlb_statcast_extra: _pipe / filter translation', () => {
  it('pipe() formats scalars + iterables with a trailing pipe', () => {
    pipe(['FF', 'SL']).should.equal('FF|SL|');
    pipe('FF').should.equal('FF|');
    pipe('FF|').should.equal('FF|'); // already-piped string is left alone
    pipe(2024).should.equal('2024|'); // non-string scalar season=2024 -> "2024|"
    pipe(null).should.equal('');
    pipe(undefined).should.equal('');
    pipe([]).should.equal('');
  });

  it('translateFilters maps friendly kwargs to Savant query keys', () => {
    const out = translateFilters({
      season: 2024, // scalar -> "2024|" under hfSea
      pitch_type: ['FF', 'SL'],
      at_bat_result: 'home_run',
      batters_lookup: 592450, // -> batters_lookup[] list of strings
      team: 'NYY', // scalar passthrough
      hfZ: '7|8|9', // raw Savant param forwarded verbatim
    });
    out.should.have.property('hfSea', '2024|');
    out.should.have.property('hfPT', 'FF|SL|');
    out.should.have.property('hfAB', 'home_run|');
    out['batters_lookup[]'].should.eql(['592450']);
    out.should.have.property('team', 'NYY');
    out.should.have.property('hfZ', '7|8|9'); // unknown key passed through
  });

  it('dateChunks splits an inclusive range into windows', () => {
    dateChunks('2024-06-01', '2024-06-16', 7).should.eql([
      ['2024-06-01', '2024-06-07'],
      ['2024-06-08', '2024-06-14'],
      ['2024-06-15', '2024-06-16'],
    ]);
    // single day
    dateChunks('2024-06-01', '2024-06-01', 7).should.eql([['2024-06-01', '2024-06-01']]);
  });
});

describe('parsers/_registry: mlb_statcast parsers registered', () => {
  it('registers + resolves each statcast parser by name', () => {
    for (const name of [
      'parse_mlb_statcast_leaderboard',
      'parse_mlb_statcast_search',
      'parse_mlb_statcast_gamefeed',
      'parse_mlb_statcast_schedule',
      'parse_mlb_statcast_html_leaderboard',
      'parse_mlb_statcast_player',
    ]) {
      Object.keys(PARSERS).should.containEql(name);
      (typeof parserFor(name)).should.equal('function');
    }
  });
});

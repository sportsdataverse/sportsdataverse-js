import should from 'should';
import {
  _int64Warned,
  bigintWarning,
  idColumnsToStrings,
  notIntegerIdWarning,
  idsToStrings,
  INT64_WARNING_CODE,
  isIdColumn,
  MLBAM_ID_COLUMNS,
  rowCells,
  warnBigint,
} from '../dist/core/int64.js';

// The v4 INT64 rules (src/core/int64.ts), shared by the loaders, producers,
// parsers and the parity harness. Surface behaviour is tested where each one
// decodes (test/releases.test.js, test/producers/espn_basketball_pbp.test.js,
// test/parsers/*); this pins the shared pieces.

describe('INT64 id rule (src/core/int64.ts)', () => {
  it('names an id: id, *_id, *_ids, numbered, id_play / id_drive, *_id_started, teamid / personid, camelCase, dotted, listed', () => {
    const ids = [
      'id', 'game_id', 'athlete_ids', 'game_pk', // the base forms
      'athlete_id_1', 'athlete_id_3', 'sack_player_id2', 'team_id_247', 'details_team_id_2', // numbered
      'id_play', 'id_drive', // id_<entity>: only the names the data has
      'drive_play_id_started', 'drive_play_id_ended',
      'playerId', 'homeTeamId', 'awayTeamId', 'eventId', 'firstHalfKickoffTeamId', 'mediaId', 'teamIds', // camelCase
      'start.team.id', 'end.pos_team.id', 'pointAfterAttempt.id', 'participants.0.athlete.id', 'end.team_id', // dotted
      'batter', 'pitcher', 'on_1b', 'on_3b', 'fielder_2', 'fielder_9', // MLBAM
      'hometeam_teamid', 'awayteam_teamid', 'gameleaders_homeleaders_personid', 'teamleaders_awayleaders_personid', // stats.nba.com
      'playerid', 'matchupid', 'teamid', 'personid', 'hid', 'vid', // (hid / vid: the video playlist's home / visitor team ids)
    ];
    for (const c of ids) isIdColumn(c).should.be.true(c);
    // ordinary words and the real non-id columns the enumeration found (f-js6 report)
    const words = [
      'valid', 'paid', 'void', 'Idaho', 'idle', 'width', 'avoid', 'hybrid', 'kid', 'rapid', 'liquid', 'android',
      'humid', 'squid', 'Ideal', 'identity', 'ident', 'idiom', 'guide', 'videos', 'ID', 'pkg', 'ids', 'idx', 'pk',
      'games', 'event_idx', 'valid_games', 'valid_from', 'video_available', 'mid_pct', 'middle_8', 'team.uid',
      'team_id_source', 'fields_competition_sportec_id_overwrite', 'parameters_player_id_list',
      'html_body_table_id_ratings_table', 'fielder_1', 'fielder_10', 'on_4b',
      'n_pk', 'id_type', 'id_source', 'blk_mid', 'ei', 'gi', 'squid', 'player_key', 'institution_key', // n_pk: Savant pickoffs; *_key stay numbers
    ];
    for (const c of words) isIdColumn(c).should.be.false(c);
  });

  it('integers -> exact decimal strings (bigint, safe number, lists); strings and nulls kept', () => {
    const rows = [
      { id: 401628579101849903n },
      { id: 332830097002 },
      { id: '7' },
      { id: null },
      { id: -0 },
      { other: 1 }, // a row without the column stays without it
    ];
    idsToStrings(rowCells(rows, 'id')).should.equal('strings');
    rows.map((r) => r.id).should.eql(['401628579101849903', '332830097002', '7', null, '0', undefined]);
    ('id' in rows[5]).should.be.false();
    const lists = [{ ids: [1n, 2] }, { ids: [] }];
    idsToStrings(rowCells(lists, 'ids')).should.equal('strings');
    lists.should.eql([{ ids: ['1', '2'] }, { ids: [] }]);
    idsToStrings(rowCells([{ id: 'a' }, { id: null }], 'id')).should.equal('unchanged');
  });

  it('any width: INT32 numbers, INT64 bigints and DOUBLE integers alike ("123", never "123.0"); NaN is missing', () => {
    const mixed = [{ game_id: 401585607 }, { game_id: 401628579n }, { game_id: 39.0 }, { game_id: Number.NaN }];
    idsToStrings(rowCells(mixed, 'game_id')).should.equal('strings');
    mixed.map((r) => r.game_id).should.eql(['401585607', '401628579', '39', null]);
  });

  it('leaves a column that is not exact integers as read (fraction, boolean, object, a double past 2^53)', () => {
    for (const bad of [1.5, true, { a: 1 }, 2 ** 60, Infinity]) {
      const rows = [{ id: 1 }, { id: bad }];
      idsToStrings(rowCells(rows, 'id')).should.equal('not-integers', String(bad));
      rows[0].id.should.equal(1);
    }
    const nan = [{ id: 1.5 }, { id: Number.NaN }, { id: 2 }];
    idsToStrings(rowCells(nan, 'id')).should.equal('not-integers');
    nan.map((r) => r.id).should.eql([1.5, null, 2]); // left as read, but a NaN is still a missing value
  });

  it('idColumnsToStrings: every id column of a parser frame, nothing else', () => {
    const rows = idColumnsToStrings([{ team_id: 5, score: 3, name: 'x' }, { team_id: 6, score: 4, name: 'y' }]);
    rows.should.eql([{ team_id: '5', score: 3, name: 'x' }, { team_id: '6', score: 4, name: 'y' }]);
  });
});

describe('INT64 BigInt warning dedupe', () => {
  beforeEach(() => _int64Warned.clear());
  after(() => _int64Warned.clear());

  it('one message per (surface, column) per process', () => {
    bigintWarning('load_x', 'games').should.equal(
      'load_x: column "games" holds integers beyond Number.MAX_SAFE_INTEGER; left as BigInt'
    );
    should(bigintWarning('load_x', 'games')).be.undefined();
    bigintWarning('load_x', 'plays').should.be.a.String(); // another column
    bigintWarning('load_y', 'games').should.be.a.String(); // another surface
    notIntegerIdWarning('load_x', 'games').should.match(/id column "games" holds values that are not exact integers/);
    should(notIntegerIdWarning('load_x', 'games')).be.undefined();
  });

  it('warnBigint emits a process warning with its own code, once', async () => {
    const seen = [];
    const on = (w) => seen.push(w);
    process.on('warning', on);
    try {
      warnBigint('Savant CSV', 'big');
      warnBigint('Savant CSV', 'big');
      await new Promise((r) => setImmediate(r));
    } finally {
      process.off('warning', on);
    }
    seen.length.should.equal(1);
    seen[0].code.should.equal(INT64_WARNING_CODE);
    INT64_WARNING_CODE.should.equal('SDV_INT64');
    seen[0].message.should.match(/^Savant CSV: column "big" holds integers beyond/);
  });
});

describe('one id predicate: codegen type generator == runtime (src/core/id_columns.ts)', () => {
  it('tools/codegen/id-columns.mjs loads the runtime source, and both classify every schema column alike', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const { join } = await import('node:path');
    const gen = await import('../tools/codegen/id-columns.mjs');
    gen.ID_COLUMNS_SOURCE.pathname.should.match(/\/src\/core\/id_columns\.ts$/);
    // the generator module holds no id regex of its own
    readFileSync(new URL('../tools/codegen/id-columns.mjs', import.meta.url), 'utf8').should.not.match(/_id|\bid\$/);
    gen.MLBAM_ID_COLUMNS.should.eql(MLBAM_ID_COLUMNS);
    const names = new Set();
    const walk = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.yaml')) {
          for (const m of readFileSync(p, 'utf8').matchAll(/^\s*-?\s*name: ['"]?([^'"\n]+?)['"]?\s*$/gm)) names.add(m[1]);
        }
      }
    };
    walk(new URL('../tools/codegen/schemas', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
    names.size.should.be.above(5000);
    const differ = [...names].filter((n) => gen.isIdColumn(n) !== isIdColumn(n));
    differ.should.eql([]);
    [...names].filter((n) => isIdColumn(n)).length.should.be.above(300);
  });
});

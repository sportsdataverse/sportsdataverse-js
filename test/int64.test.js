import should from 'should';
import {
  _int64Warned,
  bigintWarning,
  idColumnsToStrings,
  idsToStrings,
  INT64_WARNING_CODE,
  isIdColumn,
  rowCells,
  warnBigint,
} from '../dist/core/int64.js';

// The v4 INT64 rules (src/core/int64.ts), shared by the loaders, producers,
// parsers and the parity harness. Surface behaviour is tested where each one
// decodes (test/releases.test.js, test/producers/espn_basketball_pbp.test.js,
// test/parsers/*); this pins the shared pieces.

describe('INT64 id rule (src/core/int64.ts)', () => {
  it('names an id: id, *_id, *_ids, *_pk, MLBAM id columns', () => {
    for (const c of ['id', 'game_id', 'athlete_ids', 'game_pk', 'batter', 'pitcher', 'on_1b', 'on_3b', 'fielder_2', 'fielder_9']) {
      isIdColumn(c).should.be.true(c);
    }
    for (const c of ['ids', 'idx', 'id_type', 'games', 'paid', 'fielder_1', 'fielder_10', 'on_4b', 'pk']) {
      isIdColumn(c).should.be.false(c);
    }
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
    idsToStrings(rowCells(rows, 'id')).should.be.true();
    rows.map((r) => r.id).should.eql(['401628579101849903', '332830097002', '7', null, '0', undefined]);
    ('id' in rows[5]).should.be.false();
    const lists = [{ ids: [1n, 2] }, { ids: [] }];
    idsToStrings(rowCells(lists, 'ids')).should.be.true();
    lists.should.eql([{ ids: ['1', '2'] }, { ids: [] }]);
  });

  it('leaves a column that is not exact integers as read (fraction, boolean, object, number past 2^53)', () => {
    for (const bad of [1.5, true, { a: 1 }, 2 ** 60, Number.NaN]) {
      const rows = [{ id: 1 }, { id: bad }];
      idsToStrings(rowCells(rows, 'id')).should.be.false(String(bad));
      rows[0].id.should.equal(1);
    }
  });

  it('requireBigint: only a column holding a bigint (an INT64 parquet column) converts', () => {
    const int32 = [{ game_id: 401585607 }];
    idsToStrings(rowCells(int32, 'game_id'), true).should.be.false();
    int32[0].game_id.should.equal(401585607);
    const mixed = [{ game_id: 1 }, { game_id: 2n }]; // INT32 season + INT64 season
    idsToStrings(rowCells(mixed, 'game_id'), true).should.be.true();
    mixed.map((r) => r.game_id).should.eql(['1', '2']);
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

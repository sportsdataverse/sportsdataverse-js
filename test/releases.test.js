import should from 'should';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
import sdv, {
  configure,
  resetConfig,
  SdvError,
  AssetFetchError,
  SeasonNotFoundError,
  RELEASES_FAMILY,
} from '../dist/index.js';
import { _timer } from '../dist/core/request.js';
import {
  _warn,
  applyInt64Policy,
  castIdInt64,
  releaseUrl,
} from '../dist/core/releases.js';

// No-network tests for the generated release loaders (src/generated/loaders/,
// runtime src/core/releases.ts) against REAL release assets — see
// test/fixtures/releases/README.md for provenance. Every download goes through
// a fake `releases` transport; the retry backoff sleep is stubbed.

const fixture = (f) => readFileSync(new URL(`./fixtures/releases/${f}`, import.meta.url));
const SDV = 'https://github.com/sportsdataverse/sportsdataverse-data/releases/download/';
const MANIFEST = parse(
  readFileSync(new URL('../tools/codegen/endpoints/releases.yaml', import.meta.url), 'utf8')
);

/** A fake transport: `route(url)` returns a fixture name, a status number, or an Error. */
function releasesTransport(route) {
  const calls = [];
  const t = async (req) => {
    calls.push(req);
    const r = route(req.url);
    if (r instanceof Error) throw r;
    if (typeof r === 'number') return { status: r, headers: {}, data: Buffer.from('nope'), url: req.url };
    return { status: 200, headers: {}, data: fixture(r), url: req.url };
  };
  t.calls = calls;
  return t;
}

describe('release loaders', () => {
  let warnings;
  let realSleep;
  let realEmit;
  beforeEach(() => {
    resetConfig();
    warnings = [];
    realEmit = _warn.emit;
    _warn.emit = (m) => warnings.push(m);
    realSleep = _timer.sleep;
    _timer.sleep = async () => {};
  });
  afterEach(() => {
    _warn.emit = realEmit;
    _timer.sleep = realSleep;
    resetConfig();
  });

  const use = (t) => configure({ transport: { [RELEASES_FAMILY]: t } });

  describe('release loaders: surface', () => {
    it('generates one loader per releases.yaml entry on its league namespace (camel + snake)', () => {
      MANIFEST.loaders.length.should.equal(323);
      for (const ld of MANIFEST.loaders) {
        const camel = ld.fn.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());
        should(sdv[ld.league]).be.ok();
        sdv[ld.league][camel].should.be.a.Function();
        sdv[ld.league][ld.fn].should.equal(sdv[ld.league][camel]);
      }
    });

    it('is not on the playground (no loader in endpoints.json)', () => {
      const json = readFileSync(new URL('../docs/src/playground/endpoints.json', import.meta.url), 'utf8');
      json.should.not.match(/load_cfb_pbp|releases\/download/);
    });

    it('fills {season} and {season + N} like sdv-py spec.render_url', () => {
      releaseUrl('a/pbp_{season}.parquet', 2024).should.equal('a/pbp_2024.parquet');
      releaseUrl('a/sched_{season + 1}.parquet', 2024).should.equal('a/sched_2025.parquet');
    });
  });

  describe('release loaders: real fixtures', () => {
    it('loads cfb_ratings 2024 (ZSTD) through the releases family, ids pinned to numbers', async () => {
      const t = releasesTransport(() => 'cfb_ratings_2024.parquet');
      use(t);
      const rows = await sdv.cfb.loadCfbRatings({ seasons: 2024 });
      t.calls.length.should.equal(1);
      t.calls[0].url.should.equal(`${SDV}cfb_ratings/cfb_ratings_2024.parquet`);
      t.calls[0].responseType.should.equal('arraybuffer');
      rows.length.should.equal(134);
      Object.keys(rows[0]).length.should.equal(18);
      // INT64 `season` / `games` -> number; STRING `team_id` (id_int64) -> number.
      rows.every((r) => r.season === 2024).should.be.true();
      rows.every((r) => Number.isInteger(r.games) && Number.isInteger(r.team_id)).should.be.true();
      rows.find((r) => r.team_id === 2306).should.be.ok();
      warnings.should.eql([]);
    });

    it('`columns` reads only those columns; an unknown one is null-filled and named', async () => {
      use(releasesTransport(() => 'cfb_ratings_2024.parquet'));
      const rows = await sdv.cfb.load_cfb_ratings({ seasons: 2024, columns: ['team_id', 'net_rank', 'nope'] });
      rows.length.should.equal(134);
      Object.keys(rows[0]).should.eql(['team_id', 'net_rank', 'nope']);
      should(rows[0].nope).be.null();
      warnings.should.eql(['load_cfb_ratings: column(s) nope not in the loaded data (null-filled)']);
    });

    it('decodes an arrow-cpp SNAPPY asset (nflverse) with timestamps and booleans', async () => {
      use(releasesTransport(() => 'ftn_charting_2022_head100.parquet'));
      const rows = await sdv.nfl.loadNflFtnCharting({ seasons: 2022 });
      rows.length.should.equal(100);
      rows[0].nflverse_game_id.should.equal('2022_01_BUF_LA');
      rows[0].season.should.equal(2022);
      rows[0].date_pulled.should.be.instanceOf(Date);
      (typeof rows[0].is_rpo).should.equal('boolean');
    });

    it('single-asset loader reads the one asset (no seasons)', async () => {
      const t = releasesTransport(() => 'nhl_groups.parquet');
      use(t);
      const rows = await sdv.nhl.loadNhlGroups();
      t.calls[0].url.should.equal(`${SDV}nhl_groups/nhl_groups.parquet`);
      rows.length.should.equal(21);
      rows[0].league.should.equal('nhl');
    });

    it('{season + 1} loaders request the END-year asset', async () => {
      const t = releasesTransport(() => 404);
      use(t);
      (await sdv.nba.loadNbaStatsSchedules({ seasons: 2024 })).should.eql([]);
      t.calls[0].url.should.equal(`${SDV}nba_stats_schedules/nba_schedule_2025.parquet`);
    });

    it('a garbage 200 body is a decode error (SdvError), not a failed fetch', async () => {
      use(async (req) => ({ status: 200, headers: {}, data: Buffer.from('<html>'), url: req.url }));
      const err = await sdv.cfb.loadCfbRatings({ seasons: 2024 }).catch((e) => e);
      err.should.be.instanceOf(SdvError);
      (err instanceof AssetFetchError).should.be.false();
    });
  });

  describe('release loaders: seasons, 404 skip, failures', () => {
    it('a 404 season is skipped with one warning; the rest load', async () => {
      use(releasesTransport((u) => (u.includes('_2024.') ? 'cfb_ratings_2024.parquet' : 404)));
      const rows = await sdv.cfb.loadCfbRatings({ seasons: [2023, 2024, 2025] });
      rows.length.should.equal(134);
      warnings.should.eql(['load_cfb_ratings: no data for season(s) 2023, 2025 (skipped)']);
    });

    it('every season 404 -> [] with a warning (never an error)', async () => {
      use(releasesTransport(() => 404));
      (await sdv.cfb.loadCfbRatings({ seasons: 2024 })).should.eql([]);
      warnings.length.should.equal(1);
    });

    it('an absent single asset -> [] with a warning', async () => {
      use(releasesTransport(() => 404));
      (await sdv.nhl.loadNhlGroups()).should.eql([]);
      warnings.should.eql(['load_nhl_groups: no published asset (returning no rows)']);
    });

    it('a persistent 403 is retried (gateway family) then raises AssetFetchError', async () => {
      const t = releasesTransport(() => 403);
      use(t);
      const err = await sdv.cfb.loadCfbRatings({ seasons: 2024 }).catch((e) => e);
      err.should.be.instanceOf(AssetFetchError);
      err.status.should.equal(403);
      t.calls.length.should.equal(4); // 1 + 3 retries (default budget)
      warnings.should.eql([]);
    });

    it('a failure on a later season raises — never a partial / empty result', async () => {
      use(releasesTransport((u) => (u.includes('_2024.') ? 'cfb_ratings_2024.parquet' : 503)));
      const err = await sdv.cfb.loadCfbRatings({ seasons: [2024, 2025] }).catch((e) => e);
      err.should.be.instanceOf(AssetFetchError);
      err.status.should.equal(503);
    });

    it('a network error raises AssetFetchError', async () => {
      use(releasesTransport(() => new Error('ECONNRESET')));
      (await sdv.nhl.loadNhlGroups().catch((e) => e)).should.be.instanceOf(AssetFetchError);
    });

    it('a season below min_season raises SeasonNotFoundError before any fetch', async () => {
      const t = releasesTransport(() => 'cfb_ratings_2024.parquet');
      use(t);
      const err = await sdv.cfb.loadCfbRatings({ seasons: [2024, 2003] }).catch((e) => e);
      err.should.be.instanceOf(SeasonNotFoundError);
      err.message.should.match(/less than 2004/);
      t.calls.length.should.equal(0);
    });

    it('seasons must be given, and be integers', async () => {
      (await sdv.cfb.loadCfbRatings({}).catch((e) => e)).should.be.instanceOf(TypeError);
      (await sdv.cfb.loadCfbRatings({ seasons: [2024.5] }).catch((e) => e)).should.be.instanceOf(TypeError);
    });

    it('seasons with drifting columns are unioned and null-filled', async () => {
      // Two real assets with different schemas stand in for a schema drift.
      use(releasesTransport((u) => (u.includes('_2022.') ? 'ftn_charting_2022_head100.parquet' : 'cfb_ratings_2024.parquet')));
      const rows = await sdv.nfl.loadNflFtnCharting({ seasons: [2022, 2023] });
      rows.length.should.equal(234);
      const keys = Object.keys(rows[0]);
      rows.every((r) => Object.keys(r).length === keys.length).should.be.true();
      should(rows[0].team_id).be.null();
      should(rows[233].nflverse_game_id).be.null();
    });

    it('a deprecated loader forwards to its replacement with a DeprecationWarning', async () => {
      const t = releasesTransport(() => 404);
      use(t);
      const warned = new Promise((resolve) => process.once('warning', resolve));
      await sdv.nba.loadNbaStatsPbpV3({ seasons: 2024 });
      t.calls[0].url.should.equal(`${SDV}nba_stats_pbp/nba_play_by_play_2025.parquet`);
      const w = await warned;
      w.name.should.equal('DeprecationWarning');
      w.message.should.match(/load_nba_stats_pbp_v3 is deprecated; use load_nba_stats_pbp/);
    });
  });

  describe('release loaders: INT64 policy', () => {
    const raw = async () => {
      const b = fixture('cfb_ratings_2024.parquet');
      const file = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
      return parquetReadObjects({ file, compressors });
    };

    it('hyparquet decodes INT64 as BigInt; safe columns become numbers, no warning', async () => {
      const rows = await raw();
      (typeof rows[0].games).should.equal('bigint');
      applyInt64Policy(rows, 'x');
      (typeof rows[0].games).should.equal('number');
      (typeof rows[0].season).should.equal('number');
      warnings.should.eql([]);
    });

    it('a column with an unsafe value stays BigInt (exact) with one warning naming it', async () => {
      // No release carries an id >= 2^53, so the unsafe branch needs one bumped value.
      const rows = await raw();
      rows[5].games = 2n ** 60n;
      applyInt64Policy(rows, 'load_cfb_ratings');
      rows.every((r) => typeof r.games === 'bigint').should.be.true();
      rows[5].games.should.equal(2n ** 60n);
      (typeof rows[0].net_rank).should.equal('number'); // other INT64 columns still convert
      warnings.should.eql([
        'load_cfb_ratings: column "games" holds integers beyond Number.MAX_SAFE_INTEGER; left as BigInt',
      ]);
    });

    it('applies inside lists / structs too', () => {
      const rows = [{ ids: [1n, 2n], s: { a: 3n } }];
      applyInt64Policy(rows, 'x');
      rows[0].should.eql({ ids: [1, 2], s: { a: 3 } });
    });

    it('id_int64 (sdv-py _cast_ids_int64): canonical integer strings convert, anything else is left alone', () => {
      const ok = [{ id: '2306' }, { id: null }, { id: '-7' }];
      castIdInt64(ok, 'id');
      ok.map((r) => r.id).should.eql([2306n, null, -7n]);
      for (const bad of ['007', '1.5', 'abc', '9223372036854775808']) {
        const rows = [{ id: '1' }, { id: bad }];
        castIdInt64(rows, 'id');
        rows.map((r) => r.id).should.eql(['1', bad]);
      }
    });
  });
});

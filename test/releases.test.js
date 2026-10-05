import should from 'should';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getHeapStatistics } from 'node:v8';
import { parse, stringify } from 'yaml';
import { parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
import sdv, {
  configure,
  resetConfig,
  SdvError,
  AssetFetchError,
  NoDataError,
  SeasonNotFoundError,
  RELEASES_FAMILY,
} from '../dist/index.js';
import { _timer } from '../dist/core/request.js';
import {
  _decode,
  _warn,
  applyInt64Policy,
  castIdInt64,
  defaultMaxCells,
  releaseUrl,
} from '../dist/core/releases.js';
import { _int64Warned } from '../dist/core/int64.js';
import { loadReleaseLoaders } from '../tools/codegen/render-loaders.mjs';

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

    it('codegen fails closed on a stub entry and on a pbp loader without example columns', () => {
      const dir = mkdtempSync(join(tmpdir(), 'sdv-releases-'));
      const write = (ld) =>
        writeFileSync(join(dir, 'releases.yaml'), stringify({ bases: { b: 'https://x/' }, loaders: [ld] }));
      try {
        write({ fn: 'load_x_stuff', league: 'x', base: 'b', url: 'a.parquet', tag: 't', stub: true });
        (() => loadReleaseLoaders(dir)).should.throw(/is a stub/);
        write({ fn: 'load_x_pbp', league: 'x', base: 'b', url: 'a_{season}.parquet', tag: 't' });
        (() => loadReleaseLoaders(dir)).should.throw(/needs an EXAMPLE_COLUMNS entry/);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it('fills {season} and {season + N} like sdv-py spec.render_url', () => {
      releaseUrl('a/pbp_{season}.parquet', 2024).should.equal('a/pbp_2024.parquet');
      releaseUrl('a/sched_{season + 1}.parquet', 2024).should.equal('a/sched_2025.parquet');
    });
  });

  describe('release loaders: real fixtures', () => {
    it('loads cfb_ratings 2024 (ZSTD) through the releases family, ids pinned to decimal strings', async () => {
      const t = releasesTransport(() => 'cfb_ratings_2024.parquet');
      use(t);
      const rows = await sdv.cfb.loadCfbRatings({ seasons: 2024 });
      t.calls.length.should.equal(1);
      t.calls[0].url.should.equal(`${SDV}cfb_ratings/cfb_ratings_2024.parquet`);
      t.calls[0].responseType.should.equal('arraybuffer');
      rows.length.should.equal(134);
      Object.keys(rows[0]).length.should.equal(18);
      // INT64 `season` / `games` -> number; STRING `team_id` (id_int64 -> Int64, an id) -> decimal string.
      rows.every((r) => r.season === 2024).should.be.true();
      rows.every((r) => Number.isInteger(r.games) && /^\d+$/.test(r.team_id)).should.be.true();
      rows.find((r) => r.team_id === '2306').should.be.ok();
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

    it('on_missing: raise -> a 404 season throws NoDataError (sdv-py hand-written nfl loaders), no skip', async () => {
      use(releasesTransport(() => 404));
      const err = await sdv.nfl.loadNflUsagePlayers({ seasons: 2024 }).catch((e) => e);
      err.should.be.instanceOf(NoDataError);
      (err instanceof AssetFetchError).should.be.false();
      err.status.should.equal(404);
      err.message.should.match(/load_nfl_usage_players: no published asset for season 2024/);
      warnings.should.eql([]);
    });

    it('on_missing: raise -> a present season loads; a missing one in the list throws', async () => {
      use(releasesTransport((u) => (u.includes('_2022.') ? 'ftn_charting_2022_head100.parquet' : 404)));
      (await sdv.nfl.loadNflFtnCharting({ seasons: 2022 })).length.should.equal(100);
      (await sdv.nfl.loadNflFtnCharting({ seasons: [2022, 2023] }).catch((e) => e)).should.be.instanceOf(NoDataError);
    });

    it('on_missing: raise -> a failed fetch is still AssetFetchError, never NoDataError', async () => {
      use(releasesTransport(() => 503));
      const err = await sdv.nfl.loadNflUsagePlayers({ seasons: 2024 }).catch((e) => e);
      err.should.be.instanceOf(AssetFetchError);
      (err instanceof NoDataError).should.be.false();
    });

    it('on_missing: the generated defs raise exactly where releases.yaml says (others skip)', () => {
      const raise = MANIFEST.loaders.filter((ld) => ld.on_missing === 'raise').map((ld) => ld.fn).sort();
      raise.length.should.equal(25);
      raise.should.containEql('load_nfl_usage_players');
      raise.should.containEql('load_nfl_coach_tendencies');
      const views = loadReleaseLoaders(new URL('../tools/codegen/endpoints/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
      views.filter((v) => v.raiseOnMissing).map((v) => v.fn).sort().should.eql(raise);
      const nfl = readFileSync(new URL('../src/generated/loaders/nfl.ts', import.meta.url), 'utf8');
      (nfl.match(/"onMissing":"raise"/g) ?? []).length.should.equal(raise.length);
    });

    it('codegen fails closed on an unknown on_missing value', () => {
      const dir = mkdtempSync(join(tmpdir(), 'sdv-releases-'));
      try {
        writeFileSync(
          join(dir, 'releases.yaml'),
          stringify({ bases: { b: 'https://x/' }, loaders: [{ fn: 'load_x_stuff', league: 'x', base: 'b', url: 'a.parquet', tag: 't', on_missing: 'ignore' }] })
        );
        (() => loadReleaseLoaders(dir)).should.throw(/on_missing must be 'skip' or 'raise'/);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
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
      const t = releasesTransport(() => 'cfb_ratings_2024.parquet');
      use(t);
      const missing = await sdv.cfb.loadCfbRatings({}).catch((e) => e);
      missing.should.be.instanceOf(SdvError);
      missing.message.should.match(/`seasons` is required/);
      (await sdv.cfb.loadCfbRatings({ seasons: [2024.5] }).catch((e) => e)).should.be.instanceOf(SdvError);
      t.calls.length.should.equal(0);
    });

    it('rejects values Number() would coerce (null, "", true, …) instead of fetching season 0 / 1', async () => {
      // Number(null) === 0, Number('') === 0, Number(true) === 1: without the check these
      // "seasons" passed validation; a loader with no floor would fetch them, 404, and skip.
      const t = releasesTransport(() => 'cfb_ratings_2024.parquet');
      use(t);
      const bad = [[null], '', [''], true, [false], ' 2024', '20x4', '24', [2024, null], NaN, Infinity, 2024n, [{}]];
      for (const seasons of bad) {
        const err = await sdv.cfb.loadCfbRatings({ seasons }).catch((e) => e);
        err.should.be.instanceOf(SdvError);
        err.message.should.match(/each season must be an integer or a 4-digit year string, got /);
      }
      (await sdv.cfb.loadCfbRatings({ seasons: [null] }).catch((e) => e)).message.should.endWith('got null');
      (await sdv.cfb.loadCfbRatings({ seasons: '' }).catch((e) => e)).message.should.endWith('got ""');
      (await sdv.cfb.loadCfbRatings({ seasons: 2024n }).catch((e) => e)).message.should.endWith('got 2024n');
      t.calls.length.should.equal(0); // nothing fetched for any of them
    });

    it('accepts integers and 4-digit year strings', async () => {
      const t = releasesTransport(() => 'cfb_ratings_2024.parquet');
      use(t);
      (await sdv.cfb.loadCfbRatings({ seasons: '2024' })).length.should.equal(134);
      (await sdv.cfb.loadCfbRatings({ seasons: [2024, '2024'] })).length.should.equal(268);
      t.calls.map((c) => c.url.endsWith('cfb_ratings_2024.parquet')).should.eql([true, true, true]);
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

  describe('release loaders: size guard (maxCells)', () => {
    // cfb_ratings_2024: 134 rows × 18 leaf columns = 2,412 cells.
    it('refuses before decoding with a catchable SdvError naming the escape hatches', async () => {
      const t = releasesTransport(() => 'cfb_ratings_2024.parquet');
      use(t);
      const err = await sdv.cfb.loadCfbRatings({ seasons: 2024, maxCells: 1000 }).catch((e) => e);
      err.should.be.instanceOf(SdvError);
      (err instanceof AssetFetchError).should.be.false();
      err.message.should.match(/134 rows × 18 columns \(2,412 cells\)/);
      err.message.should.match(/`columns`/);
      err.message.should.match(/format: "columns"/);
      err.message.should.match(/--max-old-space-size/);
      err.message.should.match(/maxCells: Infinity/);
    });

    /** Record fetches and decodes in order (the decode seam is spied, then restored). */
    function trace(route) {
      const events = [];
      const t = releasesTransport((u) => {
        events.push(`fetch ${u.match(/_(\d{4})\./)[1]}`);
        return route(u);
      });
      const real = { ..._decode };
      for (const k of ['rows', 'columns']) {
        _decode[k] = (def, asset) => {
          events.push(`decode ${asset.url.match(/_(\d{4})\./)[1]}`);
          return real[k](def, asset);
        };
      }
      return { t, events, restore: () => Object.assign(_decode, real) };
    }

    it('a running total over the seasons: the season that crosses is refused before it is decoded', async () => {
      const { t, events, restore } = trace(() => 'cfb_ratings_2024.parquet');
      use(t);
      try {
        const err = await sdv.cfb
          .loadCfbRatings({ seasons: [2022, 2023, 2024], maxCells: 2 * 2412 - 1 })
          .catch((e) => e);
        err.should.be.instanceOf(SdvError);
        err.message.should.match(
          /season 2023 \(134 rows × 18 columns\) brings the running total to 4,824 cells, which is over the 4,823-cell limit/
        );
        events.should.eql(['fetch 2022', 'decode 2022', 'fetch 2023']); // 2023 never decoded, 2024 never fetched
      } finally {
        restore();
      }
    });

    it('seasons are fetched and decoded one at a time (one download held at once), both formats', async () => {
      for (const format of ['rows', 'columns']) {
        const { t, events, restore } = trace(() => 'cfb_ratings_2024.parquet');
        use(t);
        try {
          await sdv.cfb.loadCfbRatings({ seasons: [2022, 2023, 2024], format });
          events.should.eql(['fetch 2022', 'decode 2022', 'fetch 2023', 'decode 2023', 'fetch 2024', 'decode 2024']);
        } finally {
          restore();
        }
      }
    });

    it('counts only the requested columns; Infinity disables the check', async () => {
      use(releasesTransport(() => 'cfb_ratings_2024.parquet'));
      (await sdv.cfb.loadCfbRatings({ seasons: 2024, columns: ['team_id', 'net_rank'], maxCells: 268 })).length.should.equal(134);
      (await sdv.cfb.loadCfbRatings({ seasons: 2024, maxCells: Infinity })).length.should.equal(134);
    });

    it('defaults scale with the V8 heap: limit / 100 for rows, / 30 for columns', () => {
      const limit = getHeapStatistics().heap_size_limit;
      defaultMaxCells('rows').should.equal(Math.floor(limit / 100));
      defaultMaxCells('columns').should.equal(Math.floor(limit / 30));
    });

    it('a format: "columns" read is checked against its own limit', async () => {
      use(releasesTransport(() => 'cfb_ratings_2024.parquet'));
      const err = await sdv.cfb.loadCfbRatings({ seasons: 2024, format: 'columns', maxCells: 10 }).catch((e) => e);
      err.should.be.instanceOf(SdvError);
      err.message.should.match(/limit for format "columns"/);
      err.message.should.not.match(/~4x lighter/);
    });
  });

  describe('release loaders: format "columns"', () => {
    it('returns one array per column, with the same id / INT64 handling as rows', async () => {
      use(releasesTransport(() => 'cfb_ratings_2024.parquet'));
      const cols = await sdv.cfb.loadCfbRatings({ seasons: 2024, format: 'columns' });
      Object.keys(cols).length.should.equal(18);
      Object.values(cols).every((v) => Array.isArray(v) && v.length === 134).should.be.true();
      cols.team_id.every((t) => /^\d+$/.test(t)).should.be.true(); // STRING id_int64 -> decimal strings
      cols.season.every((s) => s === 2024).should.be.true(); // INT64 -> numbers
      const rows = await sdv.cfb.loadCfbRatings({ seasons: 2024 });
      rows.map((r) => r.adj_net).should.eql(cols.adj_net);
    });

    it('decodes the SNAPPY asset and honours `columns`', async () => {
      use(releasesTransport(() => 'ftn_charting_2022_head100.parquet'));
      const cols = await sdv.nfl.loadNflFtnCharting({ seasons: 2022, format: 'columns', columns: ['date_pulled', 'is_rpo'] });
      Object.keys(cols).should.eql(['is_rpo', 'date_pulled']); // file order
      cols.date_pulled[0].should.be.instanceOf(Date);
      cols.is_rpo.length.should.equal(100);
    });

    it('single asset, absent asset, and drifting seasons', async () => {
      use(releasesTransport((u) => (u.includes('nhl_groups') ? 'nhl_groups.parquet' : u.includes('_2022.') ? 'ftn_charting_2022_head100.parquet' : u.includes('_2023.') ? 'cfb_ratings_2024.parquet' : 404)));
      (await sdv.nhl.loadNhlGroups({ format: 'columns' })).league.length.should.equal(21);
      const drift = await sdv.nfl.loadNflFtnCharting({ seasons: [2022, 2023], format: 'columns' });
      drift.team_id.length.should.equal(234);
      should(drift.team_id[0]).be.null();
      should(drift.nflverse_game_id[233]).be.null();
      (await sdv.cfb.loadCfbRatings({ seasons: 2026, format: 'columns' })).should.eql({}); // a skip loader (nfl ones raise)
    });

    it('rejects an unknown format', async () => {
      (await sdv.nhl.loadNhlGroups({ format: 'arrow' }).catch((e) => e)).should.be.instanceOf(SdvError);
    });
  });

  describe('release loaders: type drift across seasons (diagonal_relaxed supercast)', () => {
    // cfb_team_portal_2024 ships team_id INT64, cfb_ratings_2024 ships it STRING.
    // polars: pl.concat([portal, ratings], how="diagonal_relaxed") -> team_id String,
    // 370 rows, head ['2', '5', '6'], tail ['239', '66'] (fixtures README).
    const route = (u) => (u.includes('_2023.') ? 'cfb_team_portal_2024.parquet' : 'cfb_ratings_2024.parquet');

    it('int in one season + string in another -> strings for every row, "2" never "2.0"', async () => {
      use(releasesTransport(route));
      const rows = await sdv.cfb.loadCfbSchedule({ seasons: [2023, 2024] }); // no id_int64
      rows.length.should.equal(370);
      rows.every((r) => typeof r.team_id === 'string').should.be.true();
      rows.slice(0, 3).map((r) => r.team_id).should.eql(['2', '5', '6']);
      rows.slice(-2).map((r) => r.team_id).should.eql(['239', '66']);
      const cols = await sdv.cfb.loadCfbSchedule({ seasons: [2023, 2024], format: 'columns' });
      cols.team_id.should.eql(rows.map((r) => r.team_id));
    });

    it('then id_int64 pins it to Int64 (py: String supercast, then _cast_ids_int64): an id, so decimal strings', async () => {
      use(releasesTransport(route));
      const rows = await sdv.cfb.loadCfbRatings({ seasons: [2023, 2024] });
      rows.every((r) => typeof r.team_id === 'string').should.be.true();
      rows.slice(0, 3).map((r) => r.team_id).should.eql(['2', '5', '6']);
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

    // The v4 id rule (owner decision 2026-10-05): an INT64 id column is exact decimal strings,
    // every row, every call. CFB play ids are 12 digits (safe) in 2013 and 18 (beyond 2^53) in 2024.
    const pbp = (u) => (u.includes('_2013.') ? 'cfb_pbp_2013_head20.parquet' : 'cfb_pbp_2024_head20.parquet');

    it('real data: the CFB pbp play `id` is an exact decimal string in an 18-digit (2024) season, no warning', async () => {
      use(releasesTransport(pbp));
      const rows = await sdv.cfb.loadCfbPbp({ seasons: 2024 });
      rows.length.should.equal(20);
      Object.keys(rows[0]).length.should.equal(506);
      rows.every((r) => typeof r.id === 'string').should.be.true();
      rows[0].id.should.equal('401628579101849903'); // pyarrow reads the same value
      rows[0].game_id.should.equal('401628579'); // a safe INT64 id in the same file: a string too
      (typeof rows[0].period).should.equal('number'); // a non-id INT64 column: number
      rows[0].pos_team_id.should.be.a.String(); // every INT64 id column
      warnings.should.eql([]);
    });

    it('real data: ... and in a 12-digit (2013) season; a mixed 2013 + 2024 batch is all strings (rows and columns)', async () => {
      use(releasesTransport(pbp));
      const old = await sdv.cfb.loadCfbPbp({ seasons: 2013 });
      old[0].id.should.equal('332830097002'); // pyarrow: 332830097002 (safe, was a number before v4)
      old[0].game_id.should.equal('332830097');
      // polars pl.concat([2013, 2024], how="diagonal_relaxed"): id Int64, 40 rows, 506 columns
      const rows = await sdv.cfb.loadCfbPbp({ seasons: [2013, 2024] });
      rows.length.should.equal(40);
      Object.keys(rows[0]).length.should.equal(506);
      rows.every((r) => typeof r.id === 'string' && typeof r.game_id === 'string').should.be.true();
      [rows[0].id, rows[39].id].should.eql(['332830097002', '401628579101877912']); // polars head / tail
      const cols = await sdv.cfb.loadCfbPbp({ seasons: [2013, 2024], format: 'columns', columns: ['id', 'game_id', 'period'] });
      cols.id.should.eql(rows.map((r) => r.id));
      cols.game_id.should.eql(rows.map((r) => r.game_id));
      // the whole result is JSON-safe (a BigInt would throw)
      JSON.parse(JSON.stringify(rows)).length.should.equal(40);
      warnings.should.eql([]);
    });

    it('a non-id column with an unsafe value stays BigInt (exact); one SDV_INT64 warning per (loader, column) per process', async () => {
      // The same branch on the small ratings fixture, with one value bumped.
      _int64Warned.clear();
      const codes = [];
      _warn.emit = (m, code) => {
        warnings.push(m);
        codes.push(code);
      };
      for (let call = 0; call < 2; call++) {
        const rows = await raw();
        rows[5].games = 2n ** 60n;
        applyInt64Policy(rows, 'load_cfb_ratings');
        rows.every((r) => typeof r.games === 'bigint').should.be.true();
        rows[5].games.should.equal(2n ** 60n);
        (typeof rows[0].net_rank).should.equal('number'); // other INT64 columns still convert
      }
      warnings.should.eql([
        'load_cfb_ratings: column "games" holds integers beyond Number.MAX_SAFE_INTEGER; left as BigInt',
      ]); // two calls, one warning
      codes.should.eql(['SDV_INT64']);
    });

    it('applies inside lists / structs too (an id list column -> strings)', () => {
      const rows = [{ ids: [1n, 2n], s: { a: 3n }, play_ids: [401628579101849903n, 2n] }];
      applyInt64Policy(rows, 'x');
      rows[0].should.eql({ ids: [1, 2], s: { a: 3 }, play_ids: ['401628579101849903', '2'] });
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

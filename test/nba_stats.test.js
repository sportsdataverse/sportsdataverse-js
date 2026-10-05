import should from 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv, {
  configure,
  resetConfig,
  FLAT_WRAPPERS,
  AssetFetchError,
  NoDataError,
  TransportUnavailableError,
} from '../dist/index.js';
import { resolveFlat } from '../dist/core/flat.js';
import { resolveFamily } from '../dist/core/config.js';
import { _impitLoader } from '../dist/core/transport.js';
import { _timer } from '../dist/core/request.js';
import { parse_nba_stats_result_sets } from '../dist/parsers/nba_stats.js';
import { parserFor } from '../dist/parsers/_registry.js';
import { statsHeaders } from '../dist/core/nba_stats_runtime.js';

// No-network tests for the stats.nba.com / stats.wnba.com families. Parser tests
// run on REAL captures (test/fixtures/nba_stats, copied from sdv-py); the runtime
// tests drive a fake transport through request().

const here = dirname(fileURLToPath(import.meta.url));
const fix = (n) => JSON.parse(readFileSync(join(here, 'fixtures', 'nba_stats', n), 'utf8'));
const def = (api, short) => FLAT_WRAPPERS.find((w) => w.api === api && w.short === short);

describe('nba_stats / wnba_stats: surface', () => {
  it('vendors 128 + 111 wrappers onto sdv.nba / sdv.wnba', () => {
    FLAT_WRAPPERS.filter((w) => w.api === 'nba_stats').should.have.length(128);
    FLAT_WRAPPERS.filter((w) => w.api === 'wnba_stats').should.have.length(111);
    sdv.nba.nba_stats_leaguedashplayerstats.should.be.a.Function();
    sdv.nba.nbaStatsPlayercareerstats.should.be.a.Function();
    sdv.wnba.wnba_stats_leaguedashplayerstats.should.be.a.Function();
  });

  it('resolves league_id (LeagueID) for NBA / G-League / Summer / WNBA', () => {
    const q = (api, p) => resolveFlat(def(api, 'leaguedashplayerstats'), p).query.LeagueID;
    q('nba_stats', {}).should.equal('00');
    q('nba_stats', { league_id: '20' }).should.equal('20');
    q('nba_stats', { league_id: '15' }).should.equal('15');
    q('wnba_stats', {}).should.equal('10');
    resolveFlat(def('wnba_stats', 'leaguedashplayerstats'), {}).url.should.equal(
      'https://stats.wnba.com/stats/leaguedashplayerstats'
    );
  });

  it('every parser name resolves, and neither family is on the playground proxy', () => {
    for (const w of FLAT_WRAPPERS.filter((x) => /^w?nba_stats$/.test(x.api))) {
      parserFor(w.parser).should.be.a.Function();
    }
    const ep = JSON.parse(readFileSync(join(here, '..', 'docs', 'src', 'playground', 'endpoints.json'), 'utf8'));
    Object.keys(ep.flatHosts).should.not.containEql('nba_stats');
    Object.keys(ep.flatHosts).should.not.containEql('wnba_stats');
    ep.flatApis.some((w) => /^w?nba_stats$/.test(w.api)).should.be.false();
  });
});

describe('parse_nba_stats_result_sets: real captures', () => {
  for (const file of [
    'cap_leaguedashplayerstats_nba.json',
    'cap_leaguedashplayerstats_wnba.json',
    'cap_leaguedashplayerstats_gleague.json',
    'cap_leaguedashplayerstats_summer.json',
  ]) {
    it(`${file}: single set -> snake_case rows`, () => {
      const raw = fix(file);
      const out = parse_nba_stats_result_sets(raw);
      out.should.be.an.Array();
      out.should.have.length(raw.resultSets[0].rowSet.length);
      out.length.should.be.above(0);
      const keys = Object.keys(out[0]);
      keys.should.containEql('player_id');
      keys.should.containEql('player_name');
      keys.every((k) => k === k.toLowerCase()).should.be.true();
      keys.should.have.length(raw.resultSets[0].headers.length);
      out[0].player_id.should.equal(raw.resultSets[0].rowSet[0][0]);
      parse_nba_stats_result_sets(raw, 'LeagueDashPlayerStats').should.have.length(out.length);
      parse_nba_stats_result_sets(raw, 'Nope').should.eql([]);
    });
  }

  it('NBA 2023-24 leaguedashplayerstats has 572 rows', () => {
    parse_nba_stats_result_sets(fix('cap_leaguedashplayerstats_nba.json')).should.have.length(572);
  });

  it('playercareerstats: multi-set -> record keyed by set name', () => {
    const out = parse_nba_stats_result_sets(fix('cap_playercareerstats_nba.json'));
    Object.keys(out).should.have.length(14);
    out.SeasonHighs.should.have.length(1);
    out.SeasonTotalsRegularSeason.should.eql([]);
    Object.keys(out.SeasonHighs[0]).should.containEql('player_id');
  });

  it('scheduleleaguev2 (NBA + WNBA): one row per game with derived season type', () => {
    const nba = parse_nba_stats_result_sets(fix('scheduleleaguev2_2025_26.json'));
    nba.should.have.length(14);
    nba[0].should.have.properties(['game_id', 'home_team_id', 'away_team_id', 'season_type_id', 'season_type_description']);
    new Set(nba.map((r) => r.season_type_description)).size.should.be.above(1);
    const wnba = parse_nba_stats_result_sets(fix('scheduleleaguev2_2026_wnba.json'));
    wnba.length.should.be.above(0);
    wnba[0].should.have.property('league_id');
  });

  it('boxscore *v3: PlayerStats + TeamStats; summary parses', () => {
    const box = parse_nba_stats_result_sets(fix('cap_boxscoretraditionalv3_wnba.json'));
    box.should.have.properties(['PlayerStats', 'TeamStats']);
    box.TeamStats.should.have.length(2);
    box.PlayerStats.length.should.be.above(10);
    const sum = parse_nba_stats_result_sets(fix('cap_boxscoresummaryv3_wnba.json'));
    (Array.isArray(sum) ? sum : Object.keys(sum)).length.should.be.above(0);
  });

  it('shot-location 2-level headers flatten to composite columns', () => {
    const raw = {
      resultSets: {
        name: 'ShotLocations',
        headers: [
          { name: 'SHOT_CATEGORY', columnNames: ['Less Than 5 ft.', 'Mid-Range'], columnsToSkip: 1, columnSpan: 2 },
          { name: 'columns', columnNames: ['PLAYER_ID', 'FGM', 'FGA', 'FGM', 'FGA'] },
        ],
        rowSet: [[1, 2, 3, 4, 5]],
      },
    };
    const row = parse_nba_stats_result_sets(raw)[0];
    row.should.eql({
      player_id: 1,
      less_than_5_ft_fgm: 2,
      less_than_5_ft_fga: 3,
      mid_range_fgm: 4, // underscore() maps '-' to '_'
      mid_range_fga: 5,
    });
  });

  it('empty / malformed input -> [] and never throws', () => {
    for (const bad of [null, undefined, 5, 'x', [], {}, { resultSets: 'x' }, { resultSets: [null, 3] }, { resultSets: [{ name: 'A' }] }]) {
      parse_nba_stats_result_sets(bad).should.eql([]);
    }
    parse_nba_stats_result_sets({ resultSets: [{ name: 'A', headers: ['X'], rowSet: [[1], [1, 2]] }] }).should.eql([{ x: 1 }]);
  });
});

describe('nba_stats runtime (fake transport)', () => {
  const ok = { status: 200, data: JSON.stringify({ resultSets: [{ name: 'A', headers: ['PLAYER_ID'], rowSet: [[7]] }] }) };
  let calls;
  const fake = (...script) => async (req) => {
    calls.push(req);
    const step = script[Math.min(calls.length - 1, script.length - 1)];
    return { headers: {}, url: req.url, ...step };
  };
  let sleep;
  beforeEach(() => {
    calls = [];
    sleep = _timer.sleep;
    _timer.sleep = async () => {};
  });
  afterEach(() => {
    _timer.sleep = sleep;
    resetConfig();
  });

  it('sends the stats headers, sorted params and a zero-padded GameID', async () => {
    configure({ transport: { nba_stats: fake(ok) } });
    const rows = await sdv.nba.nba_stats_leaguedashplayerstats({ season: '2023-24', parsed: true });
    rows.should.eql([{ player_id: 7 }]);
    const h = calls[0].headers;
    h['x-nba-stats-token'].should.equal('true');
    h.Referer.should.equal('https://www.nba.com/');
    const keys = Object.keys(calls[0].query);
    keys.should.eql([...keys].sort());
    statsHeaders('stats.wnba.com').Origin.should.equal('https://www.wnba.com');
    calls = [];
    await sdv.nba.nba_stats_boxscoretraditionalv3({ game_id: '22300001' });
    calls[0].query.GameID.should.equal('0022300001');
  });

  it('403 is a failure, never retried; 404 is NoDataError', async () => {
    configure({ transport: { nba_stats: fake({ status: 403, data: '' }) } });
    await sdv.nba.nba_stats_leaguedashplayerstats({}).should.be.rejectedWith(AssetFetchError);
    calls.should.have.length(1);
    calls = [];
    configure({ transport: { nba_stats: fake({ status: 404, data: '' }) } });
    await sdv.nba.nba_stats_leaguedashplayerstats({}).should.be.rejectedWith(NoDataError);
  });

  it('a blank / undecodable / bare {} 200 is a fetch failure, not "no data"', async () => {
    for (const data of ['', '   ', 'not json', '{}']) {
      configure({ transport: { wnba_stats: fake({ status: 200, data }) } });
      await sdv.wnba.wnba_stats_leaguedashplayerstats({}).should.be.rejectedWith(AssetFetchError);
    }
  });

  it('a legit-empty resultSets (headers, no rows) is DATA, not a fetch failure: raw keeps the headers, parsed is []', async () => {
    const empty = { resultSets: [{ name: 'A', headers: ['PLAYER_ID', 'PTS'], rowSet: [] }] };
    configure({ transport: { nba_stats: fake({ status: 200, data: JSON.stringify(empty) }) } });
    (await sdv.nba.nba_stats_leaguedashplayerstats({})).should.eql(empty); // schema recoverable from raw
    (await sdv.nba.nba_stats_leaguedashplayerstats({ parsed: true })).should.eql([]); // rows-as-objects carry no schema
    // multi-set: the empty set keeps its key (py: zero-row frame under the same name)
    parse_nba_stats_result_sets({ resultSets: [{ name: 'A', headers: ['X'], rowSet: [] }, { name: 'B', headers: ['Y'], rowSet: [[1]] }] })
      .should.eql({ A: [], B: [{ y: 1 }] });
  });

  it('503 is retried', async () => {
    configure({ transport: { nba_stats: fake({ status: 503, data: '' }, ok) } });
    (await sdv.nba.nba_stats_leaguedashplayerstats({})).resultSets.should.have.length(1);
    calls.should.have.length(2);
  });

  it('defaults to the impersonating transport; without impit it explains how to fix it', async () => {
    resolveFamily('nba_stats').retryStatuses.should.not.containEql(403);
    const load = _impitLoader.load;
    _impitLoader.load = async () => {
      throw new Error('Cannot find package impit');
    };
    try {
      const err = await sdv.nba.nba_stats_leaguedashplayerstats({}).then(() => null, (e) => e);
      err.should.be.instanceOf(TransportUnavailableError);
      err.message.should.match(/npm install impit/);
      err.message.should.match(/datacenter/);
    } finally {
      _impitLoader.load = load;
    }
  });
});

// Live: stats.nba.com hangs (rather than errors) from cloud IPs and plain clients,
// so this has its own gate and is never set in CI. An empty result is only
// reported as "no data" next to a known-positive control in the same run.
(process.env.SDV_NBA_STATS_LIVE === '1' ? describe : describe.skip)('nba_stats live (SDV_NBA_STATS_LIVE=1)', function () {
  this.timeout(120000);
  it('NBA control + G-League + WNBA leaguedashplayerstats', async () => {
    const control = await sdv.nba.nba_stats_leaguedashplayerstats({ season: '2023-24', parsed: true });
    control.length.should.be.above(400); // known-positive control
    const g = await sdv.nba.nba_stats_leaguedashplayerstats({ league_id: '20', season: '2023-24', parsed: true });
    const w = await sdv.wnba.wnba_stats_leaguedashplayerstats({ season: '2024', parsed: true });
    console.log(`control=${control.length} gleague=${g.length} wnba=${w.length}`);
  });
});

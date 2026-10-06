import should from 'should';
import fs from 'node:fs';
import http from 'node:http';
import zlib from 'node:zlib';
import sdv, {
  configure,
  resetConfig,
  headerAuth,
  NoDataError,
  AssetFetchError,
  InvalidParameterError,
} from '../../dist/index.js';
import { _timer } from '../../dist/core/request.js';
import { get } from '../../dist/core/client.js';
import { torvikGet } from '../../dist/core/torvik_runtime.js';
import { statcastGet } from '../../dist/core/statcast_runtime.js';
import { on3Get, mlsGet, nwslGet } from '../../dist/core/keyless_runtime.js';
import { pffApiGet } from '../../dist/core/pff_api_runtime.js';
import { nbaStatsGet } from '../../dist/core/nba_stats_runtime.js';

// The error vocabulary of a final HTTP answer, for every family, through the real
// request() (owner decisions 6 + 7: a failed fetch never becomes empty data). A
// mirror of sdv-py #696 / #700 (`_check_status`, `_json_body`, `_text_body`).

const FIX = new URL('../fixtures/', import.meta.url);
const raw = (p) => {
  const b = fs.readFileSync(new URL(p, FIX));
  return (p.endsWith('.gz') ? zlib.gunzipSync(b) : b).toString('utf8');
};
const HTML = '<html><body>Checking your browser...</body></html>';

/**
 * A transport answering `status` / `ct` / `body` as axiosTransport hands it to
 * request(): JSON parsed when the request asks for JSON and the body parses, the
 * raw text otherwise. An Error rejects (a network failure).
 */
function wire(answer) {
  const t = async (req) => {
    t.calls++;
    if (answer instanceof Error) throw answer;
    const { status, ct = 'application/json', body = '' } = answer;
    let data = body;
    if ((req.responseType ?? 'json') === 'json' && body) {
      try {
        data = JSON.parse(body);
      } catch {
        // not JSON: axios hands back the text
      }
    }
    return { status, headers: { 'content-type': ct }, data, url: req.url };
  };
  t.calls = 0;
  return t;
}

/** `ok:<value>` or the error class name. */
async function outcome(call) {
  try {
    return { ok: await call() };
  } catch (err) {
    return { error: err.constructor.name };
  }
}

/** Fresh config + no backoff waits around each test of the calling describe (never a root hook). */
function isolate() {
  let realSleep;
  beforeEach(() => {
    resetConfig();
    realSleep = _timer.sleep;
    _timer.sleep = async () => {};
  });
  afterEach(() => {
    _timer.sleep = realSleep;
    resetConfig();
  });
}

describe('error vocabulary: status x family matrix through request()', () => {
  isolate();
  const U = 'https://example.test/api/v1/x';
  const synthetic = '{"data":[{"id":"1"}]}'; // no capture of this host in the repo
  // [family, call, a real captured 200 body (or `synthetic`)]
  const JSON_FAMILIES = [
    ['site_v2', () => get(U, { family: 'site_v2' }), raw('espn/scoreboard_nba.json')],
    ['core_v2', () => get(U, { family: 'core_v2' }), raw('espn/events_core_nba.json')],
    ['mlb', () => get(U, { family: 'mlb' }), raw('py/mlb/awards.json.gz')],
    ['nhl_api_web', () => get(U, { family: 'nhl_api_web' }), raw('py/nhl_api_web/club_schedule_edm_2024.json.gz')],
    ['nhl_stats_rest', () => get(U, { family: 'nhl_stats_rest' }), synthetic],
    ['cbs', () => get(U, { family: 'cbs' }), synthetic],
    ['yahoo', () => get(U, { family: 'yahoo' }), synthetic],
    ['fox', () => get(U, { family: 'fox' }), synthetic],
    ['nfl_api', () => get(U, { family: 'nfl_api' }), synthetic],
    ['odds_api', () => get(U, { family: 'odds_api' }), synthetic],
    ['recruiting', () => get(U, { family: 'recruiting' }), synthetic],
    ['asa', () => get(U, { family: 'asa' }), raw('asa/teams.json')],
    ['on3', () => on3Get(U), raw('on3/filters_status.json')],
    ['mls_api', () => mlsGet(U), raw('mls_api/dapi_seasons_query.json')],
    ['nwsl_api', () => nwslGet(U), raw('nwsl_api/sdp_competitions.json')],
    ['pff_api', () => pffApiGet(U, { family: 'pff_api', args: { api_key: 'k' } }), raw('pff_api/team_stats.json')],
    ['nba_stats', () => nbaStatsGet(U, { family: 'nba_stats' }), raw('nba_stats/cap_leaguedashplayerstats_gleague.json')],
  ];
  const STATUSES = {
    'empty 200': { status: 200 },
    '400': { status: 400, body: '{"message":"season is invalid"}' },
    '422': { status: 422, body: '{"message":"unprocessable"}' },
    '404': { status: 404 },
    '403': { status: 403, ct: 'text/html', body: HTML },
    '429': { status: 429 },
    '500': { status: 500 },
    network: new Error('ECONNRESET'),
  };
  const STATUS_EXPECT = {
    'empty 200': 'AssetFetchError',
    '400': 'InvalidParameterError',
    '422': 'InvalidParameterError',
    '404': 'NoDataError',
    '403': 'AssetFetchError',
    '429': 'AssetFetchError',
    '500': 'AssetFetchError',
    network: 'AssetFetchError',
  };

  async function run(family, call, answer) {
    const t = wire(answer);
    // nfl_api's built-in auth mints a token; this matrix is about the data call
    configure({ transport: { [family]: t }, retries: 2, auth: { nfl_api: headerAuth({}) } });
    return { ...(await outcome(call)), calls: t.calls };
  }

  it('JSON families: 200 JSON is data, 204 / 205 are {}, everything else raises its class', async () => {
    const got = {};
    const want = {};
    for (const [family, call, body] of JSON_FAMILIES) {
      const g = (got[family] = {});
      const w = (want[family] = {});
      const ok = await run(family, call, { status: 200, body });
      g['200 JSON'] = ok.error ?? (should(ok.ok).eql(JSON.parse(body)), 'data');
      w['200 JSON'] = 'data';
      for (const status of [204, 205]) {
        const r = await run(family, call, { status });
        g[status] = r.error ?? JSON.stringify(r.ok);
        // nba_stats: its own runtime reads a blank / `{}` stats reply as throttling (sdv-py too)
        w[status] = family === 'nba_stats' ? 'AssetFetchError' : '{}';
      }
      const html = await run(family, call, { status: 200, ct: 'text/html', body: HTML });
      g['HTML 200'] = html.error ?? JSON.stringify(html.ok);
      w['HTML 200'] = 'AssetFetchError';
      for (const [name, answer] of Object.entries(STATUSES)) {
        const r = await run(family, call, answer);
        g[name] = r.error ?? JSON.stringify(r.ok);
        w[name] = STATUS_EXPECT[name];
        if (['500', 'network'].includes(name)) r.calls.should.equal(3, `${family} ${name}: retried`);
      }
    }
    got.should.eql(want);
  });

  const CSV = raw('torvik/torvik_ratings.csv');
  const TEXT_CASES = {
    torvik: {
      call: () => torvikGet(U),
      cases: [
        ['200 CSV', { status: 200, ct: 'text/csv', body: CSV }, { ok: CSV }],
        // barttorvik serves one JSON endpoint as text/html: it stays text for the parser
        ['200 JSON as text/html', { status: 200, ct: 'text/html', body: raw('torvik/torvik_game_stats.json') }, { ok: raw('torvik/torvik_game_stats.json') }],
        ['200 JSON-labelled JSON', { status: 200, body: '[[1,2]]' }, { ok: '[[1,2]]' }],
        ['204', { status: 204, ct: 'text/csv' }, { ok: '' }],
        ['205', { status: 205, ct: 'text/csv' }, { ok: '' }],
        ['HTML 200', { status: 200, ct: 'text/html', body: HTML }, { ok: HTML }],
        ['empty 200 (the block page)', { status: 200, ct: 'text/html' }, { error: 'AssetFetchError' }],
        ['JSON-labelled HTML', { status: 200, body: HTML }, { error: 'AssetFetchError' }],
      ],
    },
    statcast: {
      call: () => statcastGet(U),
      cases: [
        ['200 JSON', { status: 200, body: raw('py/mlb_statcast/gamefeed.json') }, { ok: JSON.parse(raw('py/mlb_statcast/gamefeed.json')) }],
        ['200 CSV', { status: 200, ct: 'text/csv', body: raw('py/mlb_statcast/leaderboard_catcher_stance.csv') }, { ok: raw('py/mlb_statcast/leaderboard_catcher_stance.csv') }],
        ['204 JSON', { status: 204 }, { ok: {} }],
        ['205 JSON', { status: 205 }, { ok: {} }],
        ['204 CSV', { status: 204, ct: 'text/csv' }, { ok: '' }],
        ['HTML 200', { status: 200, ct: 'text/html', body: HTML }, { ok: HTML }],
        ['empty 200', { status: 200, ct: 'text/csv' }, { error: 'AssetFetchError' }],
        ['JSON-labelled HTML', { status: 200, body: HTML }, { error: 'AssetFetchError' }],
      ],
    },
  };

  for (const [family, { call, cases }] of Object.entries(TEXT_CASES)) {
    it(`${family}: CSV / HTML stay text, a JSON-labelled body must decode, an empty 200 raises, statuses as everywhere`, async () => {
      const stem = family === 'statcast' ? 'mlb_statcast' : family;
      const got = {};
      const want = {};
      for (const [name, answer, expect] of cases) {
        got[name] = await run(stem, call, answer).then(({ calls, ...o }) => o);
        want[name] = expect;
      }
      for (const [name, answer] of Object.entries(STATUSES)) {
        got[name] = await run(stem, call, answer).then(({ calls, ...o }) => o);
        want[name] = { error: STATUS_EXPECT[name] };
      }
      got.should.eql(want);
    });
  }

  it('parsed: true never turns a failed fetch into []', async () => {
    const calls = [
      ['mlb', () => sdv.mlb.mlb_schedule_postseason({ parsed: true })],
      ['nhl_api_web', () => sdv.nhl.nhl_standings_season({ parsed: true })],
      ['cbs', () => sdv.cbs.cbs_bulk({ parsed: true })],
      ['yahoo', () => sdv.yahoo.yahoo_oly_medal_count({ parsed: true })],
      ['fox', () => sdv.fox.fox_api_explore_odds({ parsed: true })],
      ['site_v2', () => sdv.nba.espn_nba_scoreboard({ parsed: true })],
      ['torvik', () => sdv.torvik.torvik_game_stats({ year: 2025, parsed: true })],
      ['mlb_statcast', () => sdv.mlb.mlb_statcast_gamefeed({ game_pk: 1, parsed: true })],
    ];
    for (const [family, call] of calls) {
      for (const answer of [{ status: 200, ct: 'text/csv' }, { status: 200, body: HTML }]) {
        const r = await run(family, call, answer);
        should(r.error).equal('AssetFetchError', `${family} ${JSON.stringify(answer)} -> ${JSON.stringify(r.ok)}`);
      }
    }
  });

  it('error messages name host, path and status, are bounded, and are redacted', async () => {
    const secretBody = `{"error":"apiKey=SyntheticKey0123456789 rejected","pad":"${'x'.repeat(500)}"}`;
    configure({ transport: { mlb: wire({ status: 400, body: secretBody }) } });
    const err = await get(U, { family: 'mlb', params: { season: 2024 } }).then(() => null, (e) => e);
    err.should.be.instanceOf(InvalidParameterError);
    err.status.should.equal(400);
    err.message.should.startWith('mlb: example.test/api/v1/x rejected the request: HTTP 400: ');
    err.message.should.not.containEql('SyntheticKey0123456789');
    err.message.should.not.containEql('season=2024'); // the query string is never quoted
    err.message.length.should.be.below(300);
    configure({ transport: { mlb: wire({ status: 200, ct: 'text/html', body: `<p>token=SyntheticTok0123456 ${'y'.repeat(500)}</p>` }) } });
    const html = await get(U, { family: 'mlb' }).then(() => null, (e) => e);
    html.should.be.instanceOf(AssetFetchError);
    html.message.should.startWith('mlb: example.test/api/v1/x answered HTTP 200 with a non-JSON body: <p>token=<redacted>');
    html.message.length.should.be.below(300);
  });
  // pro.nfl.com's empty 200 -> InvalidParameterError through classifyError: subscription_runtime.test.js
});

describe('error vocabulary: py parity (sdv-py #700 _get on the same wire answer)', () => {
  isolate();
  const oracle = JSON.parse(raw('error_vocabulary/py_oracle.json'));
  let server;
  let base;
  before(async () => {
    server = http.createServer((req, res) => {
      const c = oracle.cases[Number(req.url.split('/')[2])];
      res.writeHead(c.status, { 'content-type': c.content_type });
      res.end(c.status === 204 || c.status === 205 ? undefined : c.body);
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server.close());

  it(`every case in the sdv-py oracle (${oracle.sdv_py.slice(0, 10)}) has the same outcome over the real axios transport`, async () => {
    oracle.cases.length.should.be.above(6);
    const getters = {
      default: (url) => get(url, { family: 'mlb' }),
      torvik: (url) => torvikGet(url),
      statcast: (url) => statcastGet(url),
    };
    const got = [];
    const want = [];
    for (const [i, c] of oracle.cases.entries()) {
      const o = await outcome(() => getters[c.getter](`${base}/case/${i}`));
      const label = `${c.getter} ${c.status} ${c.content_type} ${JSON.stringify(c.body.slice(0, 24))}`;
      got.push([label, o]);
      want.push([label, 'error' in c ? { error: c.error } : { ok: c.ok }]);
    }
    got.should.eql(want);
  });
});

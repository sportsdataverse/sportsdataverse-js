import should from 'should';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import sdv, { configure, resetConfig, LEAGUES, makeLeagueModule } from '../../dist/index.js';
import {
  ESPN_ENDPOINT_PARSERS,
  SUMMARY_SECTION_PARSERS,
  parse_cdn_game,
  parse_cdn_rankings,
  parse_cdn_schedule,
  parse_cdn_scoreboard,
} from '../../dist/parsers/espn.js';

// ESPN CDN family (cdn.espn.com/core/{league}/{page}?xhr=1): a port of sdv-py's
// tests/test_espn_cdn.py on the same real captures (test/fixtures/espn/cdn/,
// sdv-py's tests/fixtures/espn/cdn/ gzipped verbatim; provenance in the README).

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const load = (name) =>
  JSON.parse(gunzipSync(readFileSync(join(here, '..', 'fixtures', 'espn', 'cdn', `${name}.json.gz`))).toString('utf8'));
const upstream = (p) => parse(readFileSync(join(root, 'tools', 'codegen', 'vendor', 'upstream', p), 'utf8'));
const columnsOf = (rows) => [...new Set(rows.flatMap((r) => Object.keys(r)))];
const JS_TYPE = { integer: 'number', numeric: 'number', character: 'string', logical: 'boolean' };

describe('parsers/espn: CDN page payloads (sdv-py real captures)', () => {
  it('a game page parses like a summary', () => {
    const frames = parse_cdn_game(load('playbyplay_nba'));
    Object.keys(frames).sort().should.eql(Object.keys(SUMMARY_SECTION_PARSERS).sort());
    frames.header.map((r) => r.id).should.eql(['401705127']);
    frames.plays.length.should.equal(441);
    frames.boxscore_player.length.should.be.above(0);
  });

  it('a football playbyplay page carries drives', () => {
    const frames = parse_cdn_game(load('playbyplay_cfb'));
    frames.drives.length.should.equal(23);
    frames.drive_plays.length.should.equal(179);
    frames.scoring_plays.length.should.equal(7);
  });

  it('a boxscore page, and one section', () => {
    const raw = load('boxscore_mlb');
    parse_cdn_game(raw).boxscore_player.length.should.equal(63);
    parse_cdn_game(raw, 'plays').length.should.equal(618);
    (() => parse_cdn_game(raw, 'not_a_section')).should.throw(/Unknown summary section/);
  });

  it('schedule flattens every day', () => {
    const rows = parse_cdn_schedule(load('schedule_nba'));
    rows.length.should.equal(51); // 2025-01-15 .. 01-21, each game once
    new Set(rows.map((r) => r.game_id)).size.should.equal(51);
    rows.map((r) => r.game_id).should.containEql('401705127');
  });

  it('scoreboard unwraps sbData (nba and soccer), with sdv-py cdn_scoreboard columns', () => {
    const nba = parse_cdn_scoreboard(load('scoreboard_nba'));
    nba.length.should.equal(11);
    nba.map((r) => r.game_id).should.containEql('401705127');
    const epl = parse_cdn_scoreboard(load('scoreboard_epl'));
    epl.length.should.equal(6);
    epl.map((r) => r.game_id).should.containEql('704518');
    const py = upstream('schemas/cdn_scoreboard.yaml').columns.map((c) => c.name);
    columnsOf(nba).sort().should.eql([...py].sort());
  });

  it('rankings: one row per poll entry, columns + types as sdv-py documents them', () => {
    const rows = parse_cdn_rankings(load('rankings_cfb'));
    rows.length.should.equal(217);
    const schema = upstream('schemas/cdn_rankings/cfb.yaml').columns;
    columnsOf(rows).should.eql(schema.map((c) => c.name)); // same names, same order
    for (const { name, type } of schema) {
      const bad = rows.map((r) => r[name]).find((v) => v !== null && typeof v !== JS_TYPE[type]);
      (bad === undefined).should.equal(true, `${name}: ${type}, JS ${typeof bad}`);
    }
    const ranked = rows.filter((r) => r.ranked === true);
    const perPoll = {};
    for (const r of ranked) perPoll[r.poll_name] = (perPoll[r.poll_name] ?? 0) + 1;
    Object.values(perPoll).should.eql([25, 25, 25, 25, 25]);
    const ap1 = ranked.find((r) => r.poll_id === 1 && r.rank === 1);
    [ap1.team_display_name, ap1.team_id].should.eql(['Texas', '251']);
    const votes = rows.filter((r) => r.ranked === false);
    votes.length.should.be.above(0);
    votes.every((r) => r.rank === null).should.be.true();
  });

  it('rankings team_id is a string, like the family ids it joins (scoreboard home_id, summary team_id)', () => {
    const rk = parse_cdn_rankings(load('rankings_cfb')).find((r) => r.team_id !== null);
    const sb = parse_cdn_scoreboard(load('scoreboard_nba'))[0];
    const box = parse_cdn_game(load('playbyplay_nba')).boxscore_player[0];
    [typeof rk.team_id, typeof sb.home_id, typeof sb.away_id, typeof box.team_id].should.eql([
      'string',
      'string',
      'string',
      'string',
    ]);
  });

  it('rankings: an all-null or absent team_url keeps the column set', () => {
    const raw = load('rankings_cfb');
    for (const poll of raw.content.data.rankings) for (const e of poll.ranks) e.team_url = null;
    let rows = parse_cdn_rankings(raw);
    rows.length.should.equal(217);
    rows.every((r) => r.team_id === null).should.be.true();
    for (const poll of raw.content.data.rankings) for (const e of poll.ranks) delete e.team_url;
    rows = parse_cdn_rankings(raw);
    Object.keys(rows[0]).slice(0, 5).should.eql(['poll_id', 'poll_name', 'poll_short_name', 'ranked', 'team_id']);
  });

  it('never throws on empty or malformed payloads', () => {
    for (const p of [null, {}, [], 'x', { content: null }, { content: { data: { rankings: 'x' } } }, { gamepackageJSON: [] }]) {
      parse_cdn_rankings(p).should.eql([]);
      parse_cdn_schedule(p).should.eql([]);
      parse_cdn_scoreboard(p).should.eql([]);
      Object.values(parse_cdn_game(p)).every((f) => f.length === 0).should.be.true();
    }
  });

  it("every CDN short is registered with its vendored YAML parser", () => {
    for (const ep of upstream('endpoints/espn_cdn.yaml').endpoints) {
      ESPN_ENDPOINT_PARSERS[ep.short].name.should.equal(ep.parser);
    }
  });
});

// sdv-py's probe matrix (2026-10-05) -> which league modules expose each page
// (endpoint YAML include_prefixes).
const EXPECTED = {
  cdn_playbyplay: ['nba', 'wnba', 'mbb', 'wbb', 'cfb', 'nfl', 'mlb', 'college_baseball', 'college_softball'],
  cdn_boxscore: ['nba', 'wnba', 'mbb', 'wbb', 'cfb', 'nfl', 'mlb', 'college_baseball', 'college_softball'],
  cdn_schedule: ['nba', 'wnba', 'mbb', 'wbb', 'cfb', 'nfl', 'mlb', 'nhl', 'college_baseball', 'college_softball', 'ufl'],
  cdn_scoreboard: ['nba', 'wnba', 'mbb', 'wbb', 'cfb', 'nfl', 'mlb', 'college_baseball', 'epl', 'mls', 'ucl'],
  cdn_rankings: ['cfb'],
};

describe('espn_cdn: generated wrappers (include_prefixes + fixed_params)', () => {
  afterEach(() => resetConfig());

  it('wrappers exist only for the probe-verified leagues (written modules and makeLeagueModule)', () => {
    for (const [short, prefixes] of Object.entries(EXPECTED)) {
      const got = LEAGUES.filter((l) => typeof sdv[l.prefix]?.[`espn_${l.prefix}_${short}`] === 'function').map((l) => l.prefix);
      got.sort().should.eql([...prefixes].sort(), short);
      const viaFactory = LEAGUES.filter((l) => `espn_${l.prefix}_${short}` in makeLeagueModule(l)).map((l) => l.prefix);
      viaFactory.sort().should.eql([...prefixes].sort(), `${short} (makeLeagueModule)`);
    }
  });

  /** A fake `cdn` transport answering one capture; records each request. */
  function capture(name) {
    const calls = [];
    configure({
      transport: {
        cdn: async (req) => {
          calls.push(req);
          return { status: 200, headers: {}, url: req.url, data: load(name) };
        },
      },
    });
    return calls;
  }

  it('playbyplay sends xhr=1 + gameId and parses like a summary', async () => {
    const calls = capture('playbyplay_nba');
    const frames = await sdv.nba.espnNbaCdnPlaybyplay({ game_id: 401705127, parsed: true });
    calls.map((c) => [c.url, c.query]).should.eql([
      ['https://cdn.espn.com/core/nba/playbyplay', { xhr: 1, gameId: 401705127 }],
    ]);
    frames.plays.length.should.equal(441);
    (await sdv.nba.espn_nba_cdn_playbyplay({ game_id: 401705127, parsed: true, section: 'plays' })).length.should.equal(441);
    (await sdv.nba.espnNbaCdnPlaybyplay({ game_id: 401705127 })).gameId.should.equal(401705127);
  });

  it('schedule drops unset params and sends `date` (not `dates`)', async () => {
    const calls = capture('schedule_nba');
    (await sdv.nba.espnNbaCdnSchedule({ date: '20250115', parsed: true })).length.should.equal(51);
    calls.map((c) => [c.url, c.query]).should.eql([['https://cdn.espn.com/core/nba/schedule', { xhr: 1, date: '20250115' }]]);
  });

  it('rankings maps season -> year, season_type -> seasontype', async () => {
    const calls = capture('rankings_cfb');
    (await sdv.cfb.espnCfbCdnRankings({ season: 2024, week: 5, season_type: 2, parsed: true })).length.should.be.above(0);
    calls.map((c) => [c.url, c.query]).should.eql([
      ['https://cdn.espn.com/core/college-football/rankings', { xhr: 1, week: 5, year: 2024, seasontype: 2 }],
    ]);
  });

  it('a soccer scoreboard uses the league slug', async () => {
    const calls = capture('scoreboard_epl');
    (await sdv.epl.espnEplCdnScoreboard({ date: '20250201', parsed: true })).length.should.equal(6);
    calls.map((c) => [c.url, c.query]).should.eql([['https://cdn.espn.com/core/eng.1/scoreboard', { xhr: 1, date: '20250201' }]]);
  });

  it('a caller param overrides a fixed one', async () => {
    const calls = capture('scoreboard_nba');
    await sdv.nba.espnNbaCdnScoreboard({ date: '20250115', xhr: 0 });
    calls[0].query.should.eql({ xhr: 0, date: '20250115' });
  });
});

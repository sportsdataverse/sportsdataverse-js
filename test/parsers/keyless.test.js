import should from 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse_on3_rdb } from '../../dist/parsers/on3.js';
import { parse_asa, parse_asa_goals_added, parse_asa_goals_added_tables } from '../../dist/parsers/asa.js';
import {
  parse_mls_api,
  parse_mls_entity,
  parse_mls_standings,
  parse_mls_standings_tables,
  parse_mls_match,
  parse_mls_match_tables,
} from '../../dist/parsers/mls_api.js';
import {
  parse_nwsl_sdp,
  parse_nwsl_standings,
  parse_nwsl_stats,
  parse_nwsl_lineups,
  parse_nwsl_lineups_tables,
} from '../../dist/parsers/nwsl_api.js';
import { parse_fpi } from '../../dist/parsers/espn.js';
import { parse_torvik_ratings } from '../../dist/parsers/torvik.js';
import { FLAT_WRAPPERS, WRAPPERS } from '../../dist/index.js';
import { PARSERS } from '../../dist/parsers/_registry.js';
import { resolveFlat } from '../../dist/core/flat.js';
import { same } from '../helpers/parity.mjs';

// Real captures copied from sdv-py (test/fixtures/{on3,asa,mls_api,nwsl_api}/README.md
// carry provenance). `py_oracle*.json` is sdv-py's own parser output (polars) on
// those same bodies, generated at the vendor pin 719de79; every JS parser here is
// compared to it cell by cell, so these are parity tests, not shape checks.
const here = dirname(fileURLToPath(import.meta.url));
const fx = (...p) => JSON.parse(readFileSync(join(here, '..', 'fixtures', ...p), 'utf8'));

function assertParity(js, py, label) {
  js.length.should.equal(py.rows.length, `${label}: row count`);
  if (py.rows.length === 0) return;
  Object.keys(js[0]).should.eql(py.columns, `${label}: columns`);
  js.forEach((row, i) => {
    for (const c of py.columns) {
      same(row[c], py.rows[i][c], c).should.equal(
        true,
        `${label}[${i}].${c}: js=${JSON.stringify(row[c])} py=${JSON.stringify(py.rows[i][c])}`
      );
    }
  });
}

const flat = (fn) => (body) => ({ js: fn(body), py: (o) => o });
// A multi-table parser through its public single-frame form: no section = the default
// (which is also the frame sdv-py's returns schema documents), else `section`.
const sec = (fn, name) => (body) => ({ js: fn(body, name), py: (o) => o[name] });
const dflt = (fn, name) => (body) => ({ js: fn(body), py: (o) => o[name] });

function suite(dir, cases) {
  const oracle = fx(dir, 'py_oracle.json');
  describe(`${dir}: JS parsers match sdv-py on the same real captures`, () => {
    for (const [key, file, pick] of cases) {
      it(key, () => {
        const py = oracle[key];
        should(py).be.ok();
        const out = pick(fx(dir, `${file}.json`));
        assertParity(out.js, out.py(py), key);
      });
    }
  });
}

suite('on3', [
  ['parse_on3_rdb:filters_status', 'filters_status', flat(parse_on3_rdb)],
  ['parse_on3_rdb:player_profile', 'player_profile', flat(parse_on3_rdb)],
  ['parse_on3_rdb:player_all_rankings', 'player_all_rankings', flat(parse_on3_rdb)],
  ['parse_on3_rdb:team_ranking_team_rankings', 'team_ranking_team_rankings', flat(parse_on3_rdb)],
]);
suite('asa', [
  ...['teams', 'players', 'games', 'players_xgoals', 'players_salaries'].map((f) => [`parse_asa:${f}`, f, flat(parse_asa)]),
  ['parse_asa_goals_added:players_goals-added', 'players_goals-added', dflt(parse_asa_goals_added, 'summary')],
  ['parse_asa_goals_added:players_goals-added', 'players_goals-added', sec(parse_asa_goals_added, 'summary')],
  ['parse_asa_goals_added:players_goals-added', 'players_goals-added', sec(parse_asa_goals_added, 'actions')],
  ['parse_asa_goals_added:teams_goals-added', 'teams_goals-added', dflt(parse_asa_goals_added, 'summary')],
  ['parse_asa_goals_added:teams_goals-added', 'teams_goals-added', sec(parse_asa_goals_added, 'actions')],
]);
suite('mls_api', [
  ['parse_mls_api:statsapi_competitions', 'statsapi_competitions', flat(parse_mls_api)],
  ['parse_mls_api:statsapi_competitions_seasons', 'statsapi_competitions_seasons', flat(parse_mls_api)],
  ['parse_mls_api:statsapi_matches_by_season', 'statsapi_matches_by_season', flat(parse_mls_api)],
  ['parse_mls_standings:statsapi_standings_conference', 'statsapi_standings_conference', dflt(parse_mls_standings, 'entries')],
  ['parse_mls_standings:statsapi_standings_conference', 'statsapi_standings_conference', sec(parse_mls_standings, 'tables')],
  ['parse_mls_match:statsapi_match_single', 'statsapi_match_single', dflt(parse_mls_match, 'match_information')],
  ...['match_information', 'environment', 'teams', 'players', 'staff', 'referees', 'last_matches'].map((n) => [
    'parse_mls_match:statsapi_match_single', 'statsapi_match_single', sec(parse_mls_match, n),
  ]),
  ['parse_mls_entity:statsapi_club_single', 'statsapi_club_single', flat(parse_mls_entity)],
  ['parse_mls_entity:sportapi_match_single', 'sportapi_match_single', flat(parse_mls_entity)],
  ['parse_mls_api:sportapi_players_byclub', 'sportapi_players_byclub', flat(parse_mls_api)],
  ['parse_mls_api:dapi_seasons_query', 'dapi_seasons_query', flat(parse_mls_api)],
]);
suite('nwsl_api', [
  ['parse_nwsl_sdp:sdp_competitions', 'sdp_competitions', flat(parse_nwsl_sdp)],
  ['parse_nwsl_sdp:sdp_teams', 'sdp_teams', flat(parse_nwsl_sdp)],
  ['parse_nwsl_sdp:sdp_stages', 'sdp_stages', flat(parse_nwsl_sdp)],
  ['parse_nwsl_standings:sdp_standings_overall', 'sdp_standings_overall', flat(parse_nwsl_standings)],
  ['parse_nwsl_stats:sdp_stats_players', 'sdp_stats_players', flat(parse_nwsl_stats)],
  ['parse_nwsl_stats:sdp_stats_teams', 'sdp_stats_teams', flat(parse_nwsl_stats)],
  ['parse_nwsl_lineups:sdp_match_lineups', 'sdp_match_lineups', dflt(parse_nwsl_lineups, 'players')],
  ...['teams', 'players', 'staff'].map((n) => [
    'parse_nwsl_lineups:sdp_match_lineups', 'sdp_match_lineups', sec(parse_nwsl_lineups, n),
  ]),
  ['parse_nwsl_sdp:sdp_multipleSeasonMatches', 'sdp_multipleSeasonMatches', flat(parse_nwsl_sdp)],
]);

describe('single-frame parsers return the sub-frame the returns schema documents', () => {
  it('defaults are the frames sdv-py documents: asa summary, mls entries / match_information, nwsl players', () => {
    const g = fx('asa', 'players_goals-added.json');
    parse_asa_goals_added(g).should.eql(parse_asa_goals_added_tables(g).summary);
    parse_asa_goals_added(g, 'actions').should.eql(parse_asa_goals_added_tables(g).actions);
    parse_asa_goals_added(g).length.should.equal(g.length);
    const st = fx('mls_api', 'statsapi_standings_conference.json');
    parse_mls_standings(st).should.eql(parse_mls_standings_tables(st).entries);
    const m = fx('mls_api', 'statsapi_match_single.json');
    parse_mls_match(m).should.eql(parse_mls_match_tables(m).match_information);
    const l = fx('nwsl_api', 'sdp_match_lineups.json');
    parse_nwsl_lineups(l).should.eql(parse_nwsl_lineups_tables(l).players);
  });
  it('an unknown section throws, naming the valid ones', () => {
    const cases = [
      [parse_asa_goals_added, fx('asa', 'players_goals-added.json')],
      [parse_mls_standings, fx('mls_api', 'statsapi_standings_conference.json')],
      [parse_mls_match, fx('mls_api', 'statsapi_match_single.json')],
      [parse_nwsl_lineups, fx('nwsl_api', 'sdp_match_lineups.json')],
    ];
    for (const [fn, body] of cases) {
      (() => fn(body, 'nope')).should.throw(/unknown section 'nope'.*Choose one of \[/);
    }
    // the message lists every valid name
    (() => parse_mls_match({}, 'nope')).should.throw(/last_matches/);
  });
  it('MULTI_TABLE_SECTIONS == the codegen metadata == the keys the _tables functions return', async () => {
    const { MULTI_TABLE_SECTIONS } = await import('../../dist/parsers/_frames.js');
    const yaml = (await import('yaml')).parse(
      readFileSync(join(here, '..', '..', 'tools', 'codegen', 'endpoints', 'flat_parser_sections.yaml'), 'utf8')
    ).parsers;
    yaml.should.eql(MULTI_TABLE_SECTIONS);
    const tables = {
      parse_asa_goals_added: parse_asa_goals_added_tables(fx('asa', 'players_goals-added.json')),
      parse_mls_standings: parse_mls_standings_tables(fx('mls_api', 'statsapi_standings_conference.json')),
      parse_mls_match: parse_mls_match_tables(fx('mls_api', 'statsapi_match_single.json')),
      parse_nwsl_lineups: parse_nwsl_lineups_tables(fx('nwsl_api', 'sdp_match_lineups.json')),
    };
    for (const [name, spec] of Object.entries(MULTI_TABLE_SECTIONS)) {
      Object.keys(tables[name]).should.eql(spec.sections, name);
      spec.sections.should.containEql(spec.default);
    }
  });
  it('the parse_*_tables functions are importable from the built package entry (sportsdataverse/parsers)', async () => {
    const pkg = await import('sportsdataverse/parsers');
    for (const n of ['parse_asa_goals_added_tables', 'parse_mls_standings_tables', 'parse_mls_match_tables', 'parse_nwsl_lineups_tables']) {
      (typeof pkg[n]).should.equal('function', n);
    }
    Object.keys(pkg.parse_mls_match_tables(fx('mls_api', 'statsapi_match_single.json'))).should.have.length(7);
  });
  it('ids stay strings (NWSL composite ids, ASA base62, MLS Sportec)', () => {
    parse_nwsl_sdp(fx('nwsl_api', 'sdp_teams.json'))[0].team_id.should.match(/^nwsl::Football_Team::/);
    parse_asa(fx('asa', 'teams.json'))[0].team_id.should.be.a.String();
    parse_mls_api(fx('mls_api', 'statsapi_competitions.json'))[0].competition_id.should.match(/^MLS-COM-/);
  });
  it('empty / malformed bodies give []', () => {
    const fns = [parse_on3_rdb, parse_asa, parse_asa_goals_added, parse_mls_api, parse_mls_entity,
      parse_mls_standings, parse_mls_match, parse_nwsl_sdp, parse_nwsl_standings, parse_nwsl_stats,
      parse_nwsl_lineups, parse_fpi];
    for (const fn of fns) for (const bad of [null, undefined, {}, [], 'x', 5]) fn(bad).should.eql([]);
  });
});

describe('espn fitt v3: parse_fpi matches sdv-py on a real CFB 2024 capture', () => {
  // test/fixtures/espn/fpi_cfb_2024.json: GET site.web.api.espn.com/apis/fitt/v3/
  // sports/football/college-football/powerindex?season=2024&limit=3, captured 2026-10-05.
  it('parity with parse_fpi', () => {
    const py = fx('espn', 'py_oracle_fpi.json')['parse_fpi:fpi_cfb_2024'];
    const js = parse_fpi(fx('espn', 'fpi_cfb_2024.json'));
    js.length.should.equal(3);
    // py flattens the nested season dict with '.', JS with '_' (the JS house style).
    const pyCols = py.columns.map((c) => c.replace(/\./g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase());
    Object.keys(js[0]).should.eql(pyCols);
    js.forEach((row, i) =>
      py.columns.forEach((c, j) => same(row[pyCols[j]], py.rows[i][c]).should.equal(true, `${i}.${c}`))
    );
    js[0].team_abbreviation.should.equal('OSU');
    js[0].fpi.should.equal(27.875);
    js[0].fpirank_resume.should.equal(1);
  });
  it('the fpi wrapper is universal-scope on the fitt_v3 host family', () => {
    const fpi = WRAPPERS.filter((w) => w.short === 'fpi');
    fpi.length.should.equal(1);
    fpi[0].family.should.equal('fitt_v3');
    fpi[0].scope.should.equal('universal');
  });
});

describe('bart_wbb: womens T-Rank', () => {
  it('parses the real /ncaaw capture exactly like sdv-py parse_torvik_csv', () => {
    const py = fx('torvik', 'py_oracle_bart_wbb.json')['parse_torvik_csv:bart_wbb_ratings_2025_head'];
    const text = readFileSync(join(here, '..', 'fixtures', 'torvik', 'bart_wbb_ratings_2025_head.csv'), 'utf8');
    // Same values, same order; only the de-duplicated names of the repeated `rank`
    // header differ (JS rank_1 vs py rank_2; con_sosremain vs con_sos_remain), which is why no py returns table is attached.
    const js = parse_torvik_ratings(text);
    const strip = (c) => c.replace(/_\d+$/, '').replace(/_/g, '');
    js.length.should.equal(py.rows.length);
    Object.keys(js[0]).map(strip).should.eql(py.columns.map(strip));
    js.forEach((row, i) =>
      Object.keys(row).forEach((c, j) =>
        same(row[c], py.rows[i][py.columns[j]]).should.equal(true, `${i}.${c}`)
      )
    );
  });
  it('resolves under /ncaaw', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'bart_wbb' && w.short === 'ratings');
    resolveFlat(def, { year: 2025 }).url.should.equal('https://barttorvik.com/ncaaw/2025_team_results.csv');
    def.parser.should.equal('parse_torvik_ratings');
  });
});

describe('keyless families: counts, hosts, URLs, parser registry', () => {
  const n = (api) => FLAT_WRAPPERS.filter((w) => w.api === api).length;
  it('endpoint counts match sdv-py at the pin', () => {
    n('on3').should.equal(78);
    n('asa').should.equal(15);
    n('mls_api').should.equal(12);
    n('nwsl_api').should.equal(9);
    n('bart_wbb').should.equal(1);
  });
  it('every parser they name is registered', () => {
    const apis = ['on3', 'asa', 'mls_api', 'nwsl_api', 'bart_wbb'];
    for (const w of FLAT_WRAPPERS.filter((x) => apis.includes(x.api))) {
      (typeof PARSERS[w.parser]).should.equal('function', `${w.api}.${w.short} -> ${w.parser}`);
    }
  });
  it('NWSL composite ids reach the URL with a literal "::" (never percent-encoded)', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'nwsl_api' && w.short === 'teams');
    const id = 'nwsl::Football_Season::0b6761e4701749f593690c0f338da74c';
    resolveFlat(def, { season_id: id }).url.should.equal(
      `https://api-sdp.nwslsoccer.com/v1/nwsl/football/seasons/${id}/teams`
    );
  });
  it('MLS endpoints carry their per-endpoint hosts', () => {
    const hosts = new Set(FLAT_WRAPPERS.filter((w) => w.api === 'mls_api').map((w) => w.host));
    [...hosts].sort().should.eql([
      'https://dapi.mlssoccer.com',
      'https://sportapi.mlssoccer.com',
      'https://stats-api.mlssoccer.com',
    ]);
  });
});

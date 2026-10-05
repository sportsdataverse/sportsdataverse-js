import should from 'should';
import { readFileSync } from 'node:fs';
import { parserFor } from '../../dist/parsers/_registry.js';
import {
  parse_pff_report,
  parse_pff_player_detail,
  parse_pff_v2_table,
  parse_pff_matrix,
  pyJsonDumps,
} from '../../dist/parsers/pff_api.js';
import { parse_nfl_pro_stats } from '../../dist/parsers/nfl_pro.js';
import { parse_kenpom_page, cleanName, flattenHeader, dedupeHeaders } from '../../dist/parsers/kenpom.js';
import { pyIdRows } from '../helpers/parity.mjs';

// Golden-master parity for the subscription-family parsers: every committed
// sdv-py fixture is parsed by the JS port and compared to sdv-py's own output on
// the same bytes (`<name>.py.json`, see each fixture dir's README) — same rows,
// same values, same column order. No network.

const fixture = (dir, name) => new URL(`../fixtures/${dir}/${name}`, import.meta.url);
const json = (dir, name) => JSON.parse(readFileSync(fixture(dir, name), 'utf8'));

/**
 * Assert `rows` equal py's `{columns, rows}` exactly, including column order; py's
 * integer ids are compared as the decimal strings sdv-js v4 returns (the INT64 id rule).
 */
function sameAsPy(rows, py) {
  rows.should.be.an.Array();
  rows.length.should.equal(py.rows.length);
  const want = pyIdRows(py.rows);
  rows.forEach((row, i) => {
    Object.keys(row).should.eql(py.columns, `column order, row ${i}`);
    row.should.eql(want[i], `row ${i}`);
  });
}

describe('pff_api parsers — parity with sdv-py on PFF spec examples', () => {
  const cases = {
    facet_passing_summary: 'parse_pff_report',
    team_summary: 'parse_pff_report',
    player_passing_concept: 'parse_pff_report',
    player_offense_pass_blocking: 'parse_pff_player_detail',
    team_directory: 'parse_pff_v2_table',
    team_stats: 'parse_pff_v2_table',
    team_roster: 'parse_pff_v2_table',
    team_leaders: 'parse_pff_v2_table',
    team_rushing_direction: 'parse_pff_v2_table',
    position_report: 'parse_pff_v2_table',
  };
  for (const [name, parser] of Object.entries(cases)) {
    it(`${parser}(${name}.json) matches sdv-py`, () => {
      sameAsPy(parserFor(parser)(json('pff_api', `${name}.json`)), json('pff_api', `${name}.py.json`));
    });
  }

  it('keeps integer ids exact (decimal strings, the v4 id rule) and the declared /v2 column order', () => {
    const rows = parse_pff_v2_table(json('pff_api', 'team_stats.json'));
    rows[0].team_id.should.be.a.String();
    rows[0].team_id.should.match(/^\d+$/);
    Object.keys(rows[0]).should.containEql('conversion_after4_rank'); // py underscore, not snakeCase
  });

  it('ignores a `restricted` block beside the /v1 envelope (metadata, not a table)', () => {
    const raw = json('pff_api', 'facet_passing_summary.json');
    const withRestricted = { ...raw, restricted: ['grades_pass'] };
    parse_pff_report(withRestricted).should.eql(parse_pff_report(raw));
  });

  it('reads the second /v2 table (teamTotals) on request', () => {
    const raw = json('pff_api', 'team_rushing_direction.json');
    const totals = parse_pff_v2_table(raw, 'teamTotals');
    totals.length.should.equal(raw.teamTotals.length);
  });

  it('matrix and multi-key bodies return a dict of tables, like py', () => {
    const facet = json('pff_api', 'facet_passing_summary.json');
    const rows = facet[Object.keys(facet)[0]];
    const matrix = parse_pff_report({ receiving_coverage_stats: { defenders: rows, receivers: [], versus: rows } });
    Object.keys(matrix).should.eql(['defenders', 'receivers', 'versus']);
    matrix.receivers.should.eql([]);
    parse_pff_matrix({ x: { defenders: [], receivers: [], versus: [] } }).should.eql({ defenders: [], receivers: [], versus: [] });
    const multi = parse_pff_report({ teams: rows, games: rows, note: 'x' });
    Object.keys(multi).should.eql(['teams', 'games']);
  });

  it('empty / malformed input returns [] (never throws)', () => {
    for (const bad of [null, undefined, 'x', [], {}, { a: 1 }]) {
      parse_pff_report(bad).should.eql([]);
      parse_pff_player_detail(bad).should.eql([]);
      parse_pff_v2_table(bad).should.eql([]);
    }
  });

  it('pyJsonDumps matches json.dumps(sort_keys=True)', () => {
    pyJsonDumps({ b: [1, 'é'], a: null }).should.equal('{"a": null, "b": [1, "\\u00e9"]}');
  });
});

describe('nfl_pro parser — parity with sdv-py on pro.nfl.com captures', () => {
  for (const name of ['players_offense_passing_season', 'team_offense_overview_season', 'fantasy_game']) {
    it(`parse_nfl_pro_stats(${name}.json) matches sdv-py`, () => {
      sameAsPy(parse_nfl_pro_stats(json('nfl_pro', `${name}.json`)), json('nfl_pro', `${name}.py.json`));
    });
  }

  it('prefers a known collection key over a longer echoed list', () => {
    const raw = json('nfl_pro', 'players_offense_passing_season.json');
    const echo = Array.from({ length: raw.passers.length + 5 }, (_, i) => ({ echoed: i }));
    parse_nfl_pro_stats({ ...raw, aaa: echo }).length.should.equal(raw.passers.length);
  });

  it('empty / malformed input returns []', () => {
    for (const bad of [null, 'x', [], {}, { positionGroup: ['QB'] }, [1, 2]]) parse_nfl_pro_stats(bad).should.eql([]);
  });
});

describe('kenpom parser — parity with sdv-py (pandas.read_html rules)', () => {
  it('parse_kenpom_page(ratings_2025.trim.html) matches sdv-py', () => {
    const html = readFileSync(fixture('kenpom', 'ratings_2025.trim.html'), 'utf8');
    const got = parse_kenpom_page(html);
    const py = json('kenpom', 'ratings_2025.trim.py.json');
    Object.keys(got).should.eql(Object.keys(py));
    for (const key of Object.keys(py)) sameAsPy(got[key], py[key]);
  });

  it('the repeated 2-row thead flattens to short, unique names with _rk twins', () => {
    const t = parse_kenpom_page(readFileSync(fixture('kenpom', 'ratings_2025.trim.html'), 'utf8')).ratings_table;
    const cols = Object.keys(t[0]);
    cols.should.containEql('strength_of_schedule_net_rtg');
    cols.should.containEql('strength_of_schedule_net_rtg_rk');
    cols.every((c) => c.length < 40).should.be.true();
    t.map((r) => r.team).should.containEql('Duke');
    t.every((r) => typeof r.ncaa_seed === 'number' || r.ncaa_seed === null).should.be.true();
  });

  // sdv-py tests/test_subscription_http.py inline pages, with sdv-py's own outputs.
  it('two-row grouped header -> rk/adj_o/adj_o_rk; small nav table dropped', () => {
    const html = `
<html><body>
<table id="ratings-table">
  <thead>
    <tr><th></th><th></th><th colspan="2">AdjO</th><th colspan="2">AdjD</th></tr>
    <tr><th>Rk</th><th>Team</th><th>AdjO</th><th></th><th>AdjD</th><th></th></tr>
  </thead>
  <tbody>
    <tr><td>1</td><td>Duke</td><td>128.1</td><td>1</td><td>91.2</td><td>4</td></tr>
    <tr><td>2</td><td>Houston</td><td>124.0</td><td>5</td><td>84.9</td><td>1</td></tr>
  </tbody>
</table>
<table id="nav"><tr><th>x</th></tr><tr><td>1</td></tr></table>
</body></html>`;
    parse_kenpom_page(html).should.eql({
      ratings_table: [
        { rk: 1, team: 'Duke', adj_o: 128.1, adj_o_rk: 1, adj_d: 91.2, adj_d_rk: 4, ncaa_seed: null },
        { rk: 2, team: 'Houston', adj_o: 124.0, adj_o_rk: 5, adj_d: 84.9, adj_d_rk: 1, ncaa_seed: null },
      ],
    });
  });

  it('team.php depth chart is recovered from the `const players` script', () => {
    const html = `
<html><body>
<table id="schedule-table">
  <tr><th>Date</th><th>Opponent</th></tr>
  <tr><td>11/4</td><td>Maine</td></tr>
  <tr><td>11/7</td><td>Kentucky</td></tr>
</table>
<script>
  var otherStuff = 1;
  const players = [{"playerID":"123","Name":"Cooper Flagg","Year":"Fr","Height":"6-9",
    "Weight":"205","PctPG":0,"PctSG":0,"PctSF":40,"PctPF":60,"PctC":0,"PctPoss":100,
    "FTA":"120","FG2A":"200","FG3A":"80"}];
  var moreStuff = 2;
</script>
</body></html>`;
    parse_kenpom_page(html).should.eql({
      schedule_table: [
        { date: '11/4', opponent: 'Maine' },
        { date: '11/7', opponent: 'Kentucky' },
      ],
      depth_chart: [
        {
          player_id: 123, name: 'Cooper Flagg', year: 'Fr', height: '6-9', weight: 205, pct_pg: 0, pct_sg: 0,
          pct_sf: 40, pct_pf: 60, pct_c: 0, pct_poss: 100, fta: 120, fg2_a: 200, fg3_a: 80,
        },
      ],
    });
    parse_kenpom_page('<script>const players = [];</script>').should.eql({ depth_chart: [] });
    parse_kenpom_page('<script>const players = [not json};</script>').should.eql({});
  });

  it('header helpers follow py (_clean_name / _flatten_header / _dedupe_headers)', () => {
    dedupeHeaders(['team', 'adj_o', '', 'adj_d', 'adj_d']).should.eql(['team', 'adj_o', 'adj_o_rk', 'adj_d', 'adj_d_rk']);
    const cleaned = ['Team', '#', 'Pts', '+/-', 'eFG%'].map(cleanName);
    cleaned.should.eql(['team', 'number', 'pts', 'plus_minus', 'e_fg_pct']);
    dedupeHeaders(cleaned).should.eql(cleaned);
    flattenHeader(['AdjO', 'AdjO']).should.equal('adj_o');
    flattenHeader(['AdjO', 'Unnamed: 3_level_1']).should.equal('');
    const out = dedupeHeaders(['a', 'a', 'a', 'a_rk', '']);
    new Set(out).size.should.equal(out.length);
  });

  it('no tables (a logged-out or empty page) -> {}', () => {
    parse_kenpom_page('<html><body>no tables</body></html>').should.eql({});
    parse_kenpom_page(null).should.eql({});
  });
});

describe('section: one table from the PFF + KenPom multi-table parsers (MULTI_TABLE_SECTIONS)', () => {
  it('PFF /v2 teamTotals, player career and a /v1 report key match sdv-py\'s table= / career= / report=', () => {
    sameAsPy(parse_pff_v2_table(json('pff_api', 'team_rushing_direction.json'), 'teamTotals'),
      json('pff_api', 'team_rushing_direction.teamTotals.py.json'));
    sameAsPy(parse_pff_player_detail(json('pff_api', 'player_offense_pass_blocking.json'), 'career'),
      json('pff_api', 'player_offense_pass_blocking.career.py.json'));
    sameAsPy(parse_pff_report(json('pff_api', 'facet_passing_summary.json'), 'passing_summary'),
      json('pff_api', 'facet_passing_summary.passing_summary.py.json'));
    // the defaults are unchanged: rows / weeks / py's own shape
    parse_pff_v2_table(json('pff_api', 'team_rushing_direction.json'), 'rows')
      .should.eql(parse_pff_v2_table(json('pff_api', 'team_rushing_direction.json')));
    parse_pff_player_detail(json('pff_api', 'player_offense_pass_blocking.json'), 'weeks')
      .should.eql(parse_pff_player_detail(json('pff_api', 'player_offense_pass_blocking.json')));
  });

  it('dict-default parsers keep py\'s dict without section and return one table with it', () => {
    const facet = json('pff_api', 'facet_passing_summary.json');
    const rows = facet[Object.keys(facet)[0]];
    const multi = { teams: rows, games: rows.slice(0, 1) };
    parse_pff_report(multi).should.have.keys('teams', 'games');
    parse_pff_report(multi, 'games').should.eql(parse_pff_report(multi).games);
    const matrix = { receiving_coverage_stats: { defenders: rows, receivers: [], versus: rows } };
    parse_pff_report(matrix, 'versus').should.eql(parse_pff_report(matrix).versus);
    const html = readFileSync(fixture('kenpom', 'ratings_2025.trim.html'), 'utf8');
    parse_kenpom_page(html, 'ratings_table').should.eql(parse_kenpom_page(html).ratings_table);
  });

  it('an unknown section throws, listing the valid names', () => {
    const html = readFileSync(fixture('kenpom', 'ratings_2025.trim.html'), 'utf8');
    (() => parse_pff_v2_table(json('pff_api', 'team_stats.json'), 'nope'))
      .should.throw(/parse_pff_v2_table: unknown section 'nope'\. Choose one of \["rows","teamTotals"\] \(default 'rows'\)/);
    (() => parse_pff_player_detail(json('pff_api', 'player_offense_pass_blocking.json'), 'nope'))
      .should.throw(/\["weeks","career"\]/);
    (() => parse_pff_report(json('pff_api', 'facet_passing_summary.json'), 'nope'))
      .should.throw(/Choose one of \["passing_summary"\] \(default: every table, as a dict\)/);
    (() => parse_kenpom_page(html, 'nope')).should.throw(/Choose one of \["ratings_table"\]/);
    // empty input stays [] (parser contract), whatever the section
    parse_kenpom_page('<p>no tables</p>', 'ratings_table').should.eql([]);
    parse_pff_report({}, 'passing_summary').should.eql([]);
  });

  it('MULTI_TABLE_SECTIONS registers the four parsers (callFlat passes `section` to them)', async () => {
    const { MULTI_TABLE_SECTIONS } = await import('../../dist/parsers/_frames.js');
    MULTI_TABLE_SECTIONS.parse_pff_v2_table.should.eql({ default: 'rows', sections: ['rows', 'teamTotals'] });
    MULTI_TABLE_SECTIONS.parse_pff_player_detail.should.eql({ default: 'weeks', sections: ['weeks', 'career'] });
    for (const p of ['parse_pff_report', 'parse_kenpom_page']) {
      should(MULTI_TABLE_SECTIONS[p].default).be.null();
      should(MULTI_TABLE_SECTIONS[p].sections).be.null();
      MULTI_TABLE_SECTIONS[p].dynamic.should.be.a.String();
    }
  });

  it('the parsers are exported from sportsdataverse/parsers; the browser barrel leaves KenPom out', async () => {
    const pkg = await import('sportsdataverse/parsers');
    for (const n of ['parse_pff_report', 'parse_pff_player_detail', 'parse_pff_v2_table', 'parse_pff_matrix', 'parse_nfl_pro_stats', 'parse_kenpom_page']) {
      (typeof pkg[n]).should.equal('function', n);
    }
    (typeof pkg.parserFor('parse_kenpom_page')).should.equal('function'); // registered on import
    const browser = await import('../../dist/parsers/browser.js');
    should(browser.parse_kenpom_page).be.undefined();
    (typeof browser.parse_pff_v2_table).should.equal('function');
  });
});

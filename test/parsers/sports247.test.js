import should from 'should';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import {
  parse_sports247_result_set,
  parse_sports247_teams,
  parse_sports247_institution_rankings,
  parse_sports247_site_page,
} from '../../dist/parsers/sports247.js';
import { FLAT_WRAPPERS } from '../../dist/index.js';
import { parserFor } from '../../dist/parsers/_registry.js';
import { isIdColumn } from '../../dist/core/int64.js';

// No-network parser tests for the vendored 247Sports families, on REAL captures
// copied from sdv-py's tests/fixtures (see the fixture READMEs). The parsers are
// declared faithful ports (`schema_compatible` in tools/codegen/vendor.yaml), so
// every capture's parsed columns are checked against the vendored sdv-py returns
// schema of the endpoint it was captured from — names AND types for every schema
// that is attached (`schema_compatible` in tools/codegen/vendor.yaml).

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const load = (dir, name) => JSON.parse(readFileSync(join(here, '..', 'fixtures', dir, name), 'utf8'));
const readSchema = (dir, stem) =>
  parse(readFileSync(join(root, 'tools', 'codegen', ...dir, `${stem}.yaml`), 'utf8')).columns;
const schemaColumns = (stem) => readSchema(['schemas'], stem).map((c) => c.name);
// sdv-py's returns-schema type labels -> the JS value kinds that satisfy them.
const TYPE_OK = {
  integer: (v) => typeof v === 'bigint' || Number.isInteger(v),
  double: (v) => typeof v === 'number',
  numeric: (v) => typeof v === 'number',
  character: (v) => typeof v === 'string',
  logical: (v) => typeof v === 'boolean',
};
/** `col: schema type vs JS value` for every non-null cell whose type disagrees. */
function typeMismatches(rows, columns) {
  const types = Object.fromEntries(columns.map((c) => [c.name, c.type]));
  const bad = new Set();
  for (const r of rows) {
    for (const [col, v] of Object.entries(r)) {
      if (v === null || v === undefined || !(col in types)) continue;
      // an id column the schema types numeric is decimal strings (the v4 INT64 id rule)
      const ok = isIdColumn(col) && ['integer', 'double', 'numeric'].includes(types[col]) ? (x) => typeof x === 'string' : TYPE_OK[types[col]];
      if (!ok || !ok(v)) bad.add(`${col}: ${types[col]} vs ${typeof v} ${JSON.stringify(String(v)).slice(0, 20)}`);
    }
  }
  return [...bad];
}
const columnsOf = (rows) => [...new Set(rows.flatMap((r) => Object.keys(r)))];
const def = (api, short) => FLAT_WRAPPERS.find((w) => w.api === api && w.short === short);

// capture -> the sports247 endpoint it came from (fixtures/sports247/README.md)
const RDB_CAPTURES = {
  'sports247_teams_football.json': 'teams',
  'sports247_institution_rankings_fb_2026.json': 'institution_rankings',
  'sports247_recruits_fb_2026.json': 'recruits',
  'sports247_transfers_fb_2026.json': 'transfers',
  'sports247_coaches_fb_2026.json': 'coaches',
  'sports247_transfer_portal_player_feed_fb_2026.json': 'transfer_portal_player_feed',
  'sports247_composite_team_ranking_feed_fb_2026.json': 'composite_team_ranking_feed',
  'sports247_transfer_portal_only_team_feed_fb_2026.json': 'transfer_portal_team_feed',
  'sports247_current_target_predictions_fb_2026.json': 'target_predictions',
  'sports247_sports_year_fb.json': 'sport_years',
  'sports247_tags_autocomplete.json': 'tags_autocomplete',
  'sports247_positions_fb_2026.json': 'positions',
};

// capture -> the sports247_site_pages endpoint it came from (each matches an
// x-example-url in sdv-internal-refs/247sports/site-pages.openapi.yaml)
const SITE_CAPTURES = {
  'coach.json': 'coach',
  'coach_almamater.json': 'coach_alma_mater',
  'coach_hometown.json': 'coach_hometown',
  'coachranking.json': 'coach_ranking',
  'coach_rankings.json': 'coach_rankings',
  'event.json': 'event',
  'institution.json': 'institution',
  'institution_list.json': 'institution_list',
  'institution_location.json': 'institution_location',
  'institution_timeline.json': 'institution_timeline_events',
  'draft_picks.json': 'league_draft_picks',
  'league_institutions.json': 'league_institutions',
  'page_feeds.json': 'page_feeds',
  'player.json': 'player',
  'player_currentinst.json': 'player_current_institution',
  'player_highschool.json': 'player_high_school',
  'player_institution.json': 'player_institution',
  'pi_evaluation.json': 'player_institution_evaluation',
  'player_primarysport.json': 'player_primary_sport',
  'player_search.json': 'player_search',
  'playersport.json': 'playersport',
  'playersport_inst.json': 'playersport_institution',
  'playersport_rankhist.json': 'playersport_rank_history',
  'position_ranks.json': 'position_rankings',
  'recruit_interest.json': 'recruit_interest',
  'recruitment_finalchoice.json': 'recruitment_final_choice',
  'recruitment_inst.json': 'recruitment_institution',
  'recruitment_interests.json': 'recruitment_interests',
  'recruitment_offers.json': 'recruitment_offers',
  'recruitment_playersport.json': 'recruitment_player_sport',
  'current_expert_pred.json': 'season_current_expert_predictions',
  'season_recruit_int_ev.json': 'season_recruit_interest_events',
  'season_recruit_ints.json': 'season_recruit_interests',
  'recruits_season.json': 'season_recruits',
  'roster_embed.json': 'season_roster_embed',
};

describe('parsers/sports247: RDB (parse_sports247_result_set + aliases)', () => {
  it('teams: one row per team with integer ids (team_id a decimal string, v4 id rule)', () => {
    const rows = parse_sports247_teams(load('sports247', 'sports247_teams_football.json'));
    rows.length.should.be.above(100);
    for (const col of ['name', 'team_id', 'institution_key', 'conference', 'conference_abbreviation', 'sport']) {
      rows[0].should.have.property(col);
    }
    rows.every((r) => /^\d+$/.test(r.team_id) && Number.isInteger(r.institution_key)).should.be.true();
  });

  it('institution_rankings: unrolls {pagination, list}; ranks ascend from 1', () => {
    const rows = parse_sports247_institution_rankings(
      load('sports247', 'sports247_institution_rankings_fb_2026.json')
    );
    rows.length.should.equal(5);
    for (const col of ['rank', 'composite_rank', 'rating', 'composite_rating', 'commits', 'five_stars',
      'composite_five_stars', 'institution_key', 'team_key']) {
      rows[0].should.have.property(col);
    }
    rows[0].rank.should.equal(1);
  });

  it('resolves every envelope shape (players / results / rankings / bare array / scalars)', () => {
    parse_sports247_result_set(load('sports247', 'sports247_recruits_fb_2026.json')).length.should.equal(3);
    parse_sports247_result_set(load('sports247', 'sports247_coaches_fb_2026.json')).length.should.equal(3);
    parse_sports247_result_set(load('sports247', 'sports247_transfer_portal_player_feed_fb_2026.json'))
      .length.should.equal(3);
    const years = parse_sports247_result_set(load('sports247', 'sports247_sports_year_fb.json'));
    years.length.should.be.above(0);
    years.every((r) => Object.keys(r).join() === 'value').should.be.true();
    // transfers nest the player under `player`: flattened with `_`
    parse_sports247_result_set(load('sports247', 'sports247_transfers_fb_2026.json'))[0].should.have.property(
      'player_key'
    );
  });

  it('a single flat object is one row; meta-only / empty / malformed payloads are []', () => {
    parse_sports247_result_set({ abbreviation: 'FL', bettingUrl: null }).length.should.equal(1);
    for (const bad of [null, undefined, {}, [], { list: [] }, { pagination: {} }, 'nope', 42]) {
      parse_sports247_result_set(bad).should.eql([]);
      parse_sports247_teams(bad).should.eql([]);
      parse_sports247_institution_rankings(bad).should.eql([]);
    }
  });

  it("every capture's columns equal its endpoint's vendored sdv-py returns schema", () => {
    for (const [file, short] of Object.entries(RDB_CAPTURES)) {
      const d = def('sports247', short);
      should.exist(d, short);
      const rows = parserFor(d.parser)(load('sports247', file));
      rows.length.should.be.above(0, file);
      columnsOf(rows).sort().should.eql(schemaColumns(d.returnsSchema).sort(), file);
    }
  });
});

describe('parsers/sports247: site pages (parse_sports247_site_page)', () => {
  it('a detail object is one row: int keys surfaced, numeric strings cast, real strings kept', () => {
    const [row, ...rest] = parse_sports247_site_page(load('sports247_site_pages', 'institution.json'));
    rest.length.should.equal(0);
    for (const col of ['key', 'location', 'state']) Number.isInteger(row[col]).should.be.true(col);
    row.latitude.should.be.a.Number(); // "0.000000" in the payload
    row.name.should.be.a.String();
    row.rankable.should.equal('True'); // string-boolean hybrid stays a string
  });

  it('an array payload flattens inline sub-objects (Recruit.Player -> player_*)', () => {
    const rows = parse_sports247_site_page(load('sports247_site_pages', 'recruits_season.json'));
    rows.length.should.be.above(1);
    for (const col of ['key', 'player_key', 'player_full_name', 'institution', 'player_sport']) {
      rows[0].should.have.property(col);
    }
    rows.every((r) => Number.isInteger(r.player_key)).should.be.true();
  });

  it('casts a column only when every value parses (ints, then floats)', () => {
    const rows = parse_sports247_site_page([
      { A: '12', B: '1.5', C: '6-5', D: '7', E: null },
      { A: '-3', B: '2', C: '6-1', D: 'x', E: '4' },
    ]);
    rows.map((r) => r.a).should.eql([12, -3]);
    rows.map((r) => r.b).should.eql([1.5, 2]);
    rows.map((r) => r.c).should.eql(['6-5', '6-1']);
    rows.map((r) => r.d).should.eql(['7', 'x']);
    should(rows[0].e).be.null();
    rows[1].e.should.equal(4);
  });

  it('an integer-string id column is its canonical decimal strings, exact past 2^53 (v4 id rule)', () => {
    const rows = parse_sports247_site_page([{ PlayerId: '007' }, { PlayerId: '9007199254740993' }, { PlayerId: null }]);
    rows.map((r) => r.player_id).should.eql(['7', '9007199254740993', null]);
  });

  it('keeps integers beyond 2^53 exact as BigInt', () => {
    const rows = parse_sports247_site_page([{ Big: '9007199254740993' }, { Big: '1' }]);
    rows[0].big.should.equal(9007199254740993n);
    rows[1].big.should.equal(1n);
  });

  it('empty / malformed payloads are []', () => {
    for (const bad of [null, undefined, {}, [], [{}], [1, 'x'], 'nope']) {
      parse_sports247_site_page(bad).should.eql([]);
    }
  });

  it("every capture's column NAMES are covered by the endpoint's attached schema", () => {
    const files = readdirSync(join(here, '..', 'fixtures', 'sports247_site_pages')).filter((f) =>
      f.endsWith('.json')
    );
    Object.keys(SITE_CAPTURES).sort().should.eql(files.filter((f) => f !== 'expert_predictions.json').sort());
    for (const [file, short] of Object.entries(SITE_CAPTURES)) {
      const d = def('sports247_site_pages', short);
      should.exist(d, short);
      const rows = parserFor(d.parser)(load('sports247_site_pages', file));
      rows.length.should.be.above(0, file);
      const known = new Set(schemaColumns(d.returnsSchema));
      columnsOf(rows).filter((c) => !known.has(c)).should.eql([], file);
    }
    // expert_predictions.json is a real empty capture (`[]`)
    parse_sports247_site_page(load('sports247_site_pages', 'expert_predictions.json')).should.eql([]);
  });
});

describe('parsers/sports247: attached returns schemas agree in NAMES and TYPES', () => {
  // Guard for `schema_compatible` in tools/codegen/vendor.yaml: every endpoint of
  // the two 247 families that carries a vendored schema must describe what the
  // parser returns on the real captures (a stale upstream type goes red here).
  const captures = [
    ['sports247', RDB_CAPTURES],
    ['sports247_site_pages', SITE_CAPTURES],
  ];

  it('both 247 families carry a schema on every endpoint', () => {
    FLAT_WRAPPERS.filter((w) => w.api === 'sports247').every((w) => w.returnsSchema).should.be.true();
    FLAT_WRAPPERS.filter((w) => w.api === 'sports247_site_pages' && !w.returnsSchema)
      .map((w) => w.short)
      .should.eql([]);
  });

  for (const [api, map] of captures) {
    it(`${api}: parsed column types match each attached schema on the real captures`, () => {
      let checked = 0;
      for (const [file, short] of Object.entries(map)) {
        const d = def(api, short);
        if (!d.returnsSchema) continue;
        const rows = parserFor(d.parser)(load(api, file));
        typeMismatches(rows, readSchema(['schemas'], d.returnsSchema)).should.eql([], `${api}:${short}`);
        checked++;
      }
      // every capture is type-checked (12 RDB, 35 site pages)
      checked.should.equal(Object.keys(map).length);
    });
  }

  it('the type check catches a mistyped column (sdv-py@719de79 typed latitude character)', () => {
    const rows = parse_sports247_site_page(load('sports247_site_pages', 'institution.json'));
    const columns = readSchema(['schemas'], def('sports247_site_pages', 'institution').returnsSchema);
    typeMismatches(rows, columns).should.eql([]);
    const stale = columns.map((c) => (c.name === 'latitude' ? { ...c, type: 'character' } : c));
    typeMismatches(rows, stale).some((m) => m.startsWith('latitude: character')).should.be.true();
  });
});

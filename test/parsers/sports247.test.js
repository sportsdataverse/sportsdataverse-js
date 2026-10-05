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

// No-network parser tests for the vendored 247Sports families, on REAL captures
// copied from sdv-py's tests/fixtures (see the fixture READMEs). The parsers are
// declared faithful ports (`schema_compatible` in tools/codegen/vendor.yaml), so
// every capture's parsed columns are checked against the vendored sdv-py returns
// schema of the endpoint it was captured from.

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const load = (dir, name) => JSON.parse(readFileSync(join(here, '..', 'fixtures', dir, name), 'utf8'));
const schemaColumns = (stem) =>
  parse(readFileSync(join(root, 'tools', 'codegen', 'schemas', `${stem}.yaml`), 'utf8')).columns.map(
    (c) => c.name
  );
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
// Columns the capture really carries that sdv-py's vendored schema lacks (an
// upstream schema gap — sdv-py's parser emits them too).
const PY_SCHEMA_GAPS = { 'institution_list.json': ['website'] };

describe('parsers/sports247: RDB (parse_sports247_result_set + aliases)', () => {
  it('teams: one row per team with integer ids', () => {
    const rows = parse_sports247_teams(load('sports247', 'sports247_teams_football.json'));
    rows.length.should.be.above(100);
    for (const col of ['name', 'team_id', 'institution_key', 'conference', 'conference_abbreviation', 'sport']) {
      rows[0].should.have.property(col);
    }
    rows.every((r) => Number.isInteger(r.team_id) && Number.isInteger(r.institution_key)).should.be.true();
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

  it("every capture's columns are covered by its endpoint's vendored sdv-py returns schema", () => {
    const files = readdirSync(join(here, '..', 'fixtures', 'sports247_site_pages')).filter((f) =>
      f.endsWith('.json')
    );
    Object.keys(SITE_CAPTURES).sort().should.eql(files.filter((f) => f !== 'expert_predictions.json').sort());
    for (const [file, short] of Object.entries(SITE_CAPTURES)) {
      const d = def('sports247_site_pages', short);
      should.exist(d, short);
      const rows = parserFor(d.parser)(load('sports247_site_pages', file));
      rows.length.should.be.above(0, file);
      const known = new Set([...schemaColumns(d.returnsSchema), ...(PY_SCHEMA_GAPS[file] ?? [])]);
      columnsOf(rows).filter((c) => !known.has(c)).should.eql([], file);
    }
    // expert_predictions.json is a real empty capture (`[]`)
    parse_sports247_site_page(load('sports247_site_pages', 'expert_predictions.json')).should.eql([]);
  });
});

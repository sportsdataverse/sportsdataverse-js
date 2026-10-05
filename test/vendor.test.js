import should from 'should';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import {
  CODEGEN_DIR,
  checkVendor,
  deriveAll,
  loadManifest,
  rewriteSchema,
  schemaFilesFor,
  transformFamily,
} from '../tools/codegen/vendor.mjs';

// Offline tests over the COMMITTED upstream copies in tools/codegen/vendor/
// upstream/ (verbatim sdv-py files at the pinned ref) — no network.
const manifest = loadManifest();
const upstream = (p) => readFileSync(join(CODEGEN_DIR, 'vendor', 'upstream', p), 'utf8');
const overlay = (f) => readFileSync(join(CODEGEN_DIR, 'overlay', `${f}.yaml`), 'utf8');
const family = (key, overlayText = null) => {
  const cfg = manifest.families[key] ?? {};
  const text = transformFamily(
    key,
    cfg,
    upstream(`endpoints/${cfg.from ?? key}.yaml`),
    overlayText,
    manifest.source
  );
  const doc = parse(text);
  return { text, doc, ep: (s) => doc.endpoints.find((e) => e.short === s) };
};

describe('vendor: transforms (offline, committed upstream copies)', () => {
  it('cbs: api stem, /napi host, JS short names, mapped parsers + schema paths', () => {
    const { doc, ep } = family('cbs');
    doc.api.should.equal('cbs');
    doc.host.should.equal('https://api.cbssports.com/napi');
    doc.endpoints.length.should.equal(82);
    should(ep('client_config')).be.undefined(); // py name mapped away
    const cc = ep('client_configuration');
    cc.path.should.equal('/resource/client/config/{client_name}');
    cc.parser.should.equal('parse_cbs_list');
    cc.returns_schema.should.equal('native/cbs/client_config'); // py schema file, JS dir
    ep('featured_game').parser.should.equal('parse_cbs_scoreboard'); // per-short override
    ep('team_standings').parser.should.equal('parse_cbs_standings'); // py name map
  });

  it('mlb: overlay appends the 14 JS-only endpoints and patches pbp', () => {
    const { doc, ep } = family('mlb', overlay('mlb'));
    doc.api.should.equal('mlb');
    doc.endpoints.length.should.equal(64 + 14);
    ep('teams').parser.should.equal('parse_mlb_teams');
    ep('attendance').path.should.equal('/api/v1/attendance');
    const timecode = ep('pbp').extra_params.find((p) => p.name === 'timecode');
    timecode.query_key.should.equal('timecode'); // upstream ships `language`
    ep('pbp').returns_schema.should.equal('native/mlb/pbp');
    ep('teams_stats').parser.should.equal('parse_mlb_person_stats');
  });

  it('yahoo: keeps the per-endpoint editorial host + rewrites the stem', () => {
    const { doc, ep } = family('yahoo');
    doc.api.should.equal('yahoo');
    doc.host.should.equal('https://graphite-secure.sports.yahoo.com/v1/query/shangrila');
    ep('editorial_boxscore').host.should.equal('https://api-secure.sports.yahoo.com/v1/editorial/s');
    ep('editorial_boxscore').parser.should.equal('parse_yahoo_scores_boxscore');
    ep('league_stats_individual').parser.should.equal('parse_yahoo_stats');
  });

  it('marks every vendored file with a do-not-edit header naming the pin', () => {
    const { text } = family('nhl_edge');
    text.should.startWith(`# VENDORED from ${manifest.source.repo}@${manifest.source.ref}`);
  });

  it('throws on a stale manifest entry instead of silently skipping it', () => {
    const cfg = { names: { no_such_short: 'x' } };
    (() =>
      transformFamily('torvik', cfg, upstream('endpoints/torvik.yaml'), null, manifest.source)
    ).should.throw(/stale entries match no endpoint: no_such_short/);
  });

  it('rewrites schema prefixes and resolves per-league schema variants', () => {
    rewriteSchema('native/mlb_api/pbp', { 'native/mlb_api/': 'native/mlb/' }).should.equal('native/mlb/pbp');
    rewriteSchema('scoreboard', { 'native/mlb_api/': 'native/mlb/' }).should.equal('scoreboard');
    schemaFilesFor('scoreboard', ['scoreboard.yaml', 'scoreboard/nba.yaml', 'scoreboard_x.yaml', 'scoreboard/a/b.yaml'])
      .should.eql(['scoreboard.yaml', 'scoreboard/nba.yaml']);
  });

  it('copies releases.yaml verbatim', () => {
    deriveAll().get('endpoints/releases.yaml').should.equal(upstream('endpoints/releases.yaml'));
  });
});

describe('vendor:check (offline drift gate)', function () {
  this.timeout(60000);
  let tmp;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'sdv-vendor-'));
    for (const d of ['vendor', 'overlay', 'endpoints', 'schemas']) {
      cpSync(join(CODEGEN_DIR, d), join(tmp, d), { recursive: true });
    }
    cpSync(join(CODEGEN_DIR, 'vendor.yaml'), join(tmp, 'vendor.yaml'));
  });
  afterEach(() => rmSync(tmp, { recursive: true, force: true }));

  it('is clean on the committed tree', () => {
    checkVendor().should.eql([]);
  });

  it('catches a hand-edit to a vendored endpoint file', () => {
    const f = join(tmp, 'endpoints', 'cbs.yaml');
    writeFileSync(f, readFileSync(f, 'utf8').replace('host: https://api.cbssports.com/napi', 'host: https://api.cbssports.com'));
    checkVendor(tmp).should.eql(['DRIFT: tools/codegen/endpoints/cbs.yaml differs from its vendored source (hand-edit?)']);
  });

  it('catches a hand-edit to a vendored schema', () => {
    const f = join(tmp, 'schemas', 'native', 'nhl_edge', 'skater_detail.yaml');
    writeFileSync(f, readFileSync(f, 'utf8') + '# local tweak\n');
    checkVendor(tmp).should.eql([
      'DRIFT: tools/codegen/schemas/native/nhl_edge/skater_detail.yaml differs from its vendored source (hand-edit?)',
    ]);
  });

  it('flags a stray schema in a vendored directory', () => {
    writeFileSync(join(tmp, 'schemas', 'native', 'cbs', 'boxscore.yaml'), 'schema: boxscore\ncolumns: []\n');
    checkVendor(tmp).should.eql(['ORPHAN: tools/codegen/schemas/native/cbs/boxscore.yaml (not vendored, not referenced)']);
  });

  it('flags a manifest pin the upstream copy was not fetched at', () => {
    const f = join(tmp, 'vendor.yaml');
    writeFileSync(f, readFileSync(f, 'utf8').replace(manifest.source.ref, 'f'.repeat(40)));
    checkVendor(tmp)[0].should.match(/vendor\/upstream is at [0-9a-f]{40} but vendor.yaml pins f{40}/);
  });
});

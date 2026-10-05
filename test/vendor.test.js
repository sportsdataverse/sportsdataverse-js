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
  const { text, schemaRefs } = transformFamily(
    key,
    cfg,
    upstream(`endpoints/${cfg.from ?? key}.yaml`),
    overlayText,
    manifest.source
  );
  const doc = parse(text);
  return { text, doc, schemaRefs, ep: (s) => doc.endpoints.find((e) => e.short === s) };
};

describe('vendor: transforms (offline, committed upstream copies)', () => {
  it('cbs: api stem, /napi host, JS short names, mapped parsers; JS keeps its schemas', () => {
    const { doc, ep, schemaRefs } = family('cbs');
    doc.api.should.equal('cbs');
    doc.host.should.equal('https://api.cbssports.com/napi');
    doc.endpoints.length.should.equal(82);
    should(ep('client_config')).be.undefined(); // py name mapped away
    const cc = ep('client_configuration');
    cc.path.should.equal('/resource/client/config/{client_name}');
    cc.parser.should.equal('parse_cbs_list');
    // schema_compatible: false -> py's schema is dropped, none copied ...
    should(cc.returns_schema).be.undefined();
    schemaRefs.should.eql([]);
    // ... and the overlay re-attaches JS's own (described) schema.
    family('cbs', overlay('cbs')).ep('client_configuration').returns_schema.should.equal('native/cbs/client_configuration');
    ep('featured_game').parser.should.equal('parse_cbs_scoreboard'); // per-short override
    ep('team_standings').parser.should.equal('parse_cbs_standings'); // py name map
  });

  it('keeps py schemas only for schema-compatible parsers', () => {
    const mlb = family('mlb');
    mlb.ep('boxscore').returns_schema.should.equal('native/mlb/boxscore'); // declared port
    should(mlb.ep('teams_stats').returns_schema).be.undefined(); // parser_overrides
    const nfl = family('nfl_api');
    nfl.ep('standings').returns_schema.should.equal('native/nfl_api/standings'); // same-name port
    should(nfl.ep('live_team_statistics').returns_schema).be.undefined(); // fallback parser
    should(family('espn_core_v2').ep('season_week_powerindex').returns_schema).be.undefined();
  });

  it('refuses an overlay that swaps a vendored parser (parser_overrides only)', () => {
    const ov = 'endpoints:\n- short: boxscore\n  parser: parse_mlb_list\n';
    (() =>
      transformFamily('mlb', manifest.families.mlb, upstream('endpoints/mlb_api.yaml'), ov, manifest.source)
    ).should.throw(/overlay\/mlb\.yaml boxscore: set its parser via vendor\.yaml parser_overrides/);
  });

  it('refuses a parser mapping that does not declare schema_compatible', () => {
    const cfg = { parsers: { parse_torvik_csv: 'parse_torvik_ratings' } };
    (() =>
      transformFamily('torvik', cfg, upstream('endpoints/torvik.yaml'), null, manifest.source)
    ).should.throw(/must be \{js: <name>, schema_compatible: <bool>\}/);
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
    family('yahoo', overlay('yahoo')).ep('editorial_boxscore').returns_schema.should.equal('native/yahoo_scores/boxscore');
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

  it('refuses to vendor a py schema over a JS-owned one an overlay attaches', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sdv-vendor-clash-'));
    try {
      for (const d of ['vendor', 'overlay']) cpSync(join(CODEGEN_DIR, d), join(tmp, d), { recursive: true });
      cpSync(join(CODEGEN_DIR, 'vendor.yaml'), join(tmp, 'vendor.yaml'));
      // An overlay pointing an mlb endpoint at a path the vendor also writes.
      const ov = join(tmp, 'overlay', 'mlb.yaml');
      writeFileSync(ov, readFileSync(ov, 'utf8') + '- short: boxscore\n  returns_schema: native/mlb/linescore\n');
      (() => deriveAll(tmp)).should.throw(
        /would overwrite JS-owned ones an overlay attaches: schemas\/native\/mlb\/linescore\.yaml/
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('rewrites schema prefixes and resolves per-league schema variants', () => {
    rewriteSchema('native/mlb_api/pbp', { 'native/mlb_api/': 'native/mlb/' }).should.equal('native/mlb/pbp');
    rewriteSchema('scoreboard', { 'native/mlb_api/': 'native/mlb/' }).should.equal('scoreboard');
    schemaFilesFor('scoreboard', ['scoreboard.yaml', 'scoreboard/nba.yaml', 'scoreboard_x.yaml', 'scoreboard/a/b.yaml'])
      .should.eql(['scoreboard.yaml', 'scoreboard/nba.yaml']);
  });

  // Policy (a returns table must describe what the JS parser returns): a py
  // schema may be attached only where the endpoint's JS parser is py's own,
  // ported under the same name, or a mapping declared schema_compatible, and no
  // parser_overrides entry swaps it. Checked on the committed endpoint files.
  it('every attached vendored schema sits on a schema-compatible parser', () => {
    const outputs = [...deriveAll().keys()];
    const vendored = (ref) =>
      outputs.some((p) => p === `schemas/${ref}.yaml` || p.startsWith(`schemas/${ref}/`));
    let checked = 0;
    for (const [key, cfg0] of Object.entries(manifest.families)) {
      const cfg = cfg0 ?? {};
      if (key === 'leagues') continue;
      const pyEps = parse(upstream(`endpoints/${cfg.from ?? key}.yaml`)).endpoints;
      const py = Object.fromEntries(pyEps.map((e) => [(cfg.names ?? {})[e.short] ?? e.short, e]));
      const js = parse(readFileSync(join(CODEGEN_DIR, 'endpoints', `${key}.yaml`), 'utf8')).endpoints;
      for (const e of js) {
        if (!e.returns_schema || !vendored(e.returns_schema)) continue;
        checked++;
        const where = `${key}.${e.short} (${e.returns_schema})`;
        should.exist(py[e.short], `${where}: a vendored schema on a JS-only endpoint`);
        const m = (cfg.parsers ?? {})[py[e.short].parser];
        const compatible =
          m === undefined ? e.parser === py[e.short].parser : m.schema_compatible === true && m.js === e.parser;
        compatible.should.be.true(`${where}: parser ${e.parser} is not declared schema-compatible`);
        should.not.exist((cfg.parser_overrides ?? {})[e.short], `${where}: parser overridden`);
      }
    }
    checked.should.be.above(100);
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
    writeFileSync(join(tmp, 'schemas', 'native', 'nhl_edge', 'stray.yaml'), 'schema: stray\ncolumns: []\n');
    checkVendor(tmp).should.eql(['ORPHAN: tools/codegen/schemas/native/nhl_edge/stray.yaml (not vendored, not referenced)']);
  });

  it('flags a manifest pin the upstream copy was not fetched at', () => {
    const f = join(tmp, 'vendor.yaml');
    writeFileSync(f, readFileSync(f, 'utf8').replace(manifest.source.ref, 'f'.repeat(40)));
    checkVendor(tmp)[0].should.match(/vendor\/upstream is at [0-9a-f]{40} but vendor.yaml pins f{40}/);
  });
});

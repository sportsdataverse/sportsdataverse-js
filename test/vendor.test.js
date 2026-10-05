import should from 'should';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import {
  CODEGEN_DIR,
  checkVendor,
  deriveAll,
  writeVendor,
  gitBlobSha,
  loadManifest,
  PY_NAMES_FILE,
  pyModuleStems,
  pyPublicNames,
  rewriteSchema,
  schemaFilesFor,
  transformFamily,
} from '../tools/codegen/vendor.mjs';

// Offline tests over the COMMITTED upstream copies in tools/codegen/vendor/
// upstream/ (verbatim sdv-py files at the pinned ref) — no network.
const manifest = loadManifest();
const upstream = (p) => readFileSync(join(CODEGEN_DIR, 'vendor', 'upstream', p), 'utf8');
const overlay = (f) => readFileSync(join(CODEGEN_DIR, 'overlay', `${f}.yaml`), 'utf8');
const transform = (key, cfg, upstreamText, overlayText = null) =>
  transformFamily(key, cfg, upstreamText, overlayText, manifest.source);
const family = (key, overlayText = null) => {
  const cfg = manifest.families[key] ?? {};
  const { text, schemaRefs, pySchemas } = transform(key, cfg, upstream(`endpoints/${cfg.from ?? key}.yaml`), overlayText);
  const doc = parse(text);
  return { text, doc, schemaRefs, pySchemas, ep: (s) => doc.endpoints.find((e) => e.short === s) };
};

describe('vendor: transforms (offline, committed upstream copies)', () => {
  it('cbs: api stem, /napi host, sdv-py short names, mapped parsers; JS keeps its schemas', () => {
    const { doc, ep, schemaRefs } = family('cbs');
    doc.api.should.equal('cbs');
    doc.host.should.equal('https://api.cbssports.com/napi');
    doc.endpoints.length.should.equal(82);
    should(ep('client_configuration')).be.undefined(); // v4: py's short, not JS's pre-v4 one
    const cc = ep('client_config');
    cc.path.should.equal('/resource/client/config/{client_name}');
    cc.parser.should.equal('parse_cbs_list');
    // schema_compatible: false -> py's schema is dropped, none copied ...
    should(cc.returns_schema).be.undefined();
    schemaRefs.should.eql([]);
    // ... and the overlay re-attaches JS's own (described) schema + the pre-v4 short.
    const ov = family('cbs', overlay('cbs')).ep('client_config');
    ov.returns_schema.should.equal('native/cbs/client_configuration');
    ov.legacy_short.should.equal('client_configuration');
    ep('game_featured').parser.should.equal('parse_cbs_scoreboard'); // per-short override
    ep('team_standings').parser.should.equal('parse_cbs_standings'); // py parser name map
  });

  it('keeps py schemas only where compatibility is declared (fail-closed)', () => {
    const mlb = family('mlb');
    mlb.ep('boxscore').returns_schema.should.equal('native/mlb/boxscore'); // declared mapping
    should(mlb.ep('teams_stats').returns_schema).be.undefined(); // parser_overrides
    const nfl = family('nfl_api');
    nfl.ep('standings').returns_schema.should.equal('native/nfl_api/standings'); // family declared
    should(nfl.ep('live_team_statistics').returns_schema).be.undefined(); // declared false
    should(family('espn_core_v2').ep('season_week_powerindex').returns_schema).be.undefined();
    // Undeclared family: a kept py parser name does NOT bring py's schema.
    should(family('espn_site_v2').ep('scoreboard').returns_schema).be.undefined();
    const edge = upstream('endpoints/nhl_edge.yaml');
    transform('nhl_edge', {}, edge).schemaRefs.should.eql([]);
    transform('nhl_edge', { schema_compatible: true }, edge).schemaRefs.length.should.be.above(0);
    (() => transform('nhl_edge', { schema_compatible: 'yes' }, edge)).should.throw(/schema_compatible must be a boolean/);
    // schema_incompatible (a parser-parity harness finding) drops py's schema per endpoint.
    const statcast = family('mlb_statcast');
    should(statcast.ep('gamefeed').returns_schema).be.undefined();
    statcast.ep('gamefeed').parser.should.equal('parse_mlb_statcast_gamefeed');
    statcast.ep('schedule').returns_schema.should.equal('native/mlb_statcast/schedule');
    // ... and a family flipped wholesale (the harness disproved its tables) keeps none.
    family('nba_stats').schemaRefs.should.eql([]);
    // pySchemas says why each py returns_schema is (not) attached.
    const why = (key, short) => family(key).pySchemas.find((e) => e.short === short).status;
    why('nhl_edge', 'skater_detail').should.equal('attached');
    why('mlb', 'teams_stats').should.equal('parser_override');
    why('mlb_statcast', 'gamefeed').should.equal('schema_incompatible');
    why('nba_stats', 'scheduleleaguev2').should.equal('declared_incompatible');
    why('espn_site_v2', 'scoreboard').should.equal('undeclared');
    (() => transform('nhl_edge', { schema_compatible: true, schema_incompatible: 'skater_detail' }, edge)).should.throw(
      /schema_incompatible must be a list/
    );
  });

  it('refuses an overlay that swaps a vendored parser (parser_overrides only)', () => {
    const ov = 'endpoints:\n- short: boxscore\n  parser: parse_mlb_list\n';
    (() => transform('mlb', manifest.families.mlb, upstream('endpoints/mlb_api.yaml'), ov)).should.throw(
      /overlay\/mlb\.yaml boxscore: set its parser via vendor\.yaml parser_overrides/
    );
  });

  it('refuses a parser mapping that does not declare schema_compatible', () => {
    const cfg = { parsers: { parse_torvik_csv: 'parse_torvik_ratings' } };
    (() => transform('torvik', cfg, upstream('endpoints/torvik.yaml'))).should.throw(
      /must be \{js: <name>, schema_compatible: <bool>\}/
    );
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

  it('throws on stale manifest entries (names, parsers, parser_overrides, schema_incompatible)', () => {
    const torvik = upstream('endpoints/torvik.yaml');
    (() => transform('torvik', { names: { no_such_short: 'x' } }, torvik)).should.throw(
      /stale entries match no endpoint: no_such_short/
    );
    (() => transform('torvik', { parser_overrides: { no_such_short: 'parse_x' } }, torvik)).should.throw(
      /stale entries match no endpoint: no_such_short/
    );
    (() => transform('torvik', { schema_incompatible: ['no_such_short'] }, torvik)).should.throw(
      /stale entries match no endpoint: no_such_short/
    );
    const parsers = { parse_gone_upstream: { js: 'parse_torvik_ratings', schema_compatible: false } };
    (() => transform('torvik', { parsers }, torvik)).should.throw(/stale entries match no endpoint: parse_gone_upstream/);
  });

  it('overlay: a patch for a short that is not vendored throws (no path-less append)', () => {
    const ov = 'endpoints:\n- short: no_such_short\n  returns_schema: native/mlb/x\n';
    (() => transform('mlb', manifest.families.mlb, upstream('endpoints/mlb_api.yaml'), ov)).should.throw(
      /overlay\/mlb\.yaml no_such_short: patches no vendored endpoint .* an addition needs a `path`/
    );
  });

  it('overlay: a patch upstream has absorbed throws (the pbp timecode fix announces itself)', () => {
    // Simulate the pin including the sdv-py fix: timecode -> query_key timecode.
    const py = upstream('endpoints/mlb_api.yaml');
    const fixed = py.replace(
      '  - name: timecode\n    query_key: language\n',
      '  - name: timecode\n    query_key: timecode\n'
    );
    fixed.should.not.equal(py); // the bug is present at the current pin
    (() => transform('mlb', manifest.families.mlb, fixed, overlay('mlb'))).should.throw(
      /overlay\/mlb\.yaml pbp\.extra_params: already equal upstream; remove it from this overlay entry/
    );
    // An addition that upstream now ships with the same path is also a no-op.
    const dup = 'endpoints:\n- short: boxscore\n  path: /api/v1/game/{game_pk}/boxscore\n';
    (() => transform('mlb', manifest.families.mlb, py, dup)).should.throw(/boxscore\.path: already equal upstream/);
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

  // Policy (a returns table must describe what the JS parser returns), fail-closed:
  // an endpoint may carry a vendored (py) schema only when its parser's
  // compatibility is DECLARED in vendor.yaml (family `schema_compatible: true`
  // for a kept py name, or a `parsers` entry with schema_compatible: true), no
  // parser_overrides entry swaps it and schema_incompatible does not drop it.
  // Checked on the committed endpoint files.
  it('a vendored schema is attached only to a declared schema-compatible parser', () => {
    const outputs = [...deriveAll().keys()];
    const vendored = (ref) => outputs.some((p) => p === `schemas/${ref}.yaml` || p.startsWith(`schemas/${ref}/`));
    let attached = 0;
    let undeclaredWithPyRef = 0;
    for (const [key, cfg0] of Object.entries(manifest.families)) {
      const cfg = cfg0 ?? {};
      if (key === 'leagues') continue;
      const pyEps = parse(upstream(`endpoints/${cfg.from ?? key}.yaml`)).endpoints;
      const py = Object.fromEntries(pyEps.map((e) => [(cfg.names ?? {})[e.short] ?? e.short, e]));
      const js = parse(readFileSync(join(CODEGEN_DIR, 'endpoints', `${key}.yaml`), 'utf8')).endpoints;
      for (const e of js) {
        const p = py[e.short];
        const fromPy = Boolean(e.returns_schema) && vendored(e.returns_schema);
        if (!p) {
          fromPy.should.be.false(`${key}.${e.short}: a vendored schema on a JS-only endpoint`);
          continue;
        }
        const m = (cfg.parsers ?? {})[p.parser];
        const declared =
          (m === undefined
            ? cfg.schema_compatible === true && e.parser === p.parser
            : m.schema_compatible === true && m.js === e.parser) &&
          !(cfg.parser_overrides ?? {})[e.short] &&
          !(cfg.schema_incompatible ?? []).includes(e.short);
        if (fromPy) {
          attached++;
          declared.should.be.true(`${key}.${e.short} (${e.returns_schema}): parser ${e.parser} is not declared schema-compatible`);
        }
        if (!declared && p.returns_schema) undeclaredWithPyRef++;
      }
    }
    attached.should.be.above(100); // the declared families do carry py schemas
    undeclaredWithPyRef.should.be.above(100); // and every undeclared one (ESPN, CBS, Yahoo, ...) doesn't
  });

  it('copies releases.yaml verbatim', () => {
    deriveAll().get('endpoints/releases.yaml').should.equal(upstream('endpoints/releases.yaml'));
  });

  it('derives sdv-py public names from a verbatim module copy per vendored family and league', () => {
    const names = JSON.parse(deriveAll().get(PY_NAMES_FILE));
    names.ref.should.equal(manifest.source.ref);
    const stems = pyModuleStems(manifest, upstream);
    Object.keys(names.modules).should.eql(stems); // exactly the modules JS must match
    stems.should.containEql('nhl_api_web');
    stems.should.containEql('mls_api');
    stems.should.containEql('nba_espn_ext');
    names.modules.nhl_api_web.path.should.equal('sportsdataverse/nhl/nhl_api_web.py');
    names.modules.nhl_api_web.names.should.containEql('nhl_web_pbp');
    pyPublicNames('def a(x):\n    def inner():\n        pass\nasync def b():\n    pass\ndef _private():\n    pass\n').should.eql(['a', 'b']);
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
    // `copy:` files that live outside the dirs above (espn_rename_map.yaml) + the
    // derived sdv-py public-names file.
    for (const c of [...(manifest.copy ?? []), PY_NAMES_FILE]) cpSync(join(CODEGEN_DIR, c), join(tmp, c));
  });
  afterEach(() => rmSync(tmp, { recursive: true, force: true }));

  const REGEN = 'regenerate with `npm run vendor -- --offline`; change JS behaviour in overlay/ or vendor.yaml, never in a vendored file';
  const REFETCH = 'upstream copies are fetched, never edited: re-fetch with `npm run vendor`';

  it('is clean on the committed tree (LOCK verified, derived files match)', () => {
    checkVendor().should.eql([]);
  });

  it('gitBlobSha is git\'s blob id', () => {
    gitBlobSha(Buffer.from('')).should.equal('e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
    gitBlobSha(Buffer.from('hello\n')).should.equal('ce013625030ba8dba906f756967f9e9ca394464a');
  });

  it('catches a hand-edit to a vendored endpoint file', () => {
    const f = join(tmp, 'endpoints', 'cbs.yaml');
    writeFileSync(f, readFileSync(f, 'utf8').replace('host: https://api.cbssports.com/napi', 'host: https://api.cbssports.com'));
    checkVendor(tmp).should.eql([`DRIFT: tools/codegen/endpoints/cbs.yaml differs from its vendored source (${REGEN})`]);
  });

  it('catches a hand-edit to a vendored schema', () => {
    const f = join(tmp, 'schemas', 'native', 'nhl_edge', 'skater_detail.yaml');
    writeFileSync(f, readFileSync(f, 'utf8') + '# local tweak\n');
    checkVendor(tmp).should.eql([
      `DRIFT: tools/codegen/schemas/native/nhl_edge/skater_detail.yaml differs from its vendored source (${REGEN})`,
    ]);
  });

  it('flags (and `npm run vendor` deletes) a stale vendored copy, by exact path', () => {
    // a py schema the declaration does not attach (nba_stats is schema_compatible: false),
    // left behind byte-identical to its upstream copy
    const rel = join('schemas', 'native', 'nba_stats', 'leaguedashplayerstats.yaml');
    writeFileSync(join(tmp, rel), readFileSync(join(tmp, 'vendor', 'upstream', rel)));
    checkVendor(tmp).should.eql([
      `ORPHAN: tools/codegen/schemas/native/nba_stats/leaguedashplayerstats.yaml is not vendored and not referenced (delete it, or ${REGEN})`,
    ]);
    writeVendor(tmp).removed.should.eql(['schemas/native/nba_stats/leaguedashplayerstats.yaml']);
    checkVendor(tmp).should.eql([]);
  });

  it('never touches a JS-authored schema, even unreferenced or in a directory the vendor writes into', () => {
    const files = {
      // a new JS-only schema in a shared directory (vendored py schemas + JS-owned overlay ones)
      [join('schemas', 'native', 'mlb', 'js_only_new.yaml')]: 'schema: js_only_new\ncolumns: []\n',
      // a JS-authored schema at a py schema's path, with its own content
      [join('schemas', 'native', 'nba_stats', 'leaguegamelog.yaml')]: 'schema: leaguegamelog\ncolumns: []\n',
      // a hand-added file in a fully vendored directory
      [join('schemas', 'native', 'nhl_edge', 'stray.yaml')]: 'schema: stray\ncolumns: []\n',
    };
    for (const [rel, body] of Object.entries(files)) writeFileSync(join(tmp, rel), body);
    checkVendor(tmp).should.eql([]);
    writeVendor(tmp).removed.should.eql([]);
    for (const [rel, body] of Object.entries(files)) readFileSync(join(tmp, rel), 'utf8').should.equal(body);
  });

  it('flags every schema a family flipped to schema_compatible: false leaves behind', () => {
    const f = join(tmp, 'vendor.yaml');
    const flipped = readFileSync(f, 'utf8').replace(
      /(\n {2}nhl_edge:\n(?: {4}#.*\n)*) {4}schema_compatible: true\n/,
      '$1    schema_compatible: false\n'
    );
    flipped.should.not.equal(readFileSync(f, 'utf8'));
    writeFileSync(f, flipped);
    const orphans = checkVendor(tmp).filter((l) => l.startsWith('ORPHAN: tools/codegen/schemas/native/nhl_edge/'));
    orphans.length.should.equal(readdirSync(join(tmp, 'schemas', 'native', 'nhl_edge')).length);
  });

  it('flags a manifest pin the upstream copy was not fetched at', () => {
    const f = join(tmp, 'vendor.yaml');
    writeFileSync(f, readFileSync(f, 'utf8').replace(manifest.source.ref, 'f'.repeat(40)));
    checkVendor(tmp)[0].should.match(/vendor\/upstream is at [0-9a-f]{40} but vendor.yaml pins f{40}/);
  });

  // Laundering: editing the upstream copy and re-deriving with --offline must
  // not pass; the LOCK (git blob shas from the pinned tree) catches it.
  it('fails when an upstream copy is edited (even after re-deriving)', () => {
    const f = join(tmp, 'vendor', 'upstream', 'endpoints', 'cbs_napi.yaml');
    writeFileSync(f, readFileSync(f, 'utf8').replace('https://api.cbssports.com/napi', 'https://api.cbssports.com'));
    // The derived file is regenerated to match, so only the LOCK can notice.
    const vendorOut = deriveAll(tmp).get('endpoints/cbs.yaml');
    writeFileSync(join(tmp, 'endpoints', 'cbs.yaml'), vendorOut);
    const problems = checkVendor(tmp);
    problems.should.eql([`UPSTREAM: vendor/upstream/endpoints/cbs_napi.yaml does not match pinned blob ${
      readFileSync(join(tmp, 'vendor', 'upstream', 'LOCK'), 'utf8').match(/^([0-9a-f]{40}) {2}endpoints\/cbs_napi\.yaml$/m)[1]
    } (${REFETCH})`]);
    problems.join('\n').should.not.match(/--offline/);
  });

  it('catches a hand-edit to the derived sdv-py public names', () => {
    const f = join(tmp, PY_NAMES_FILE);
    writeFileSync(f, readFileSync(f, 'utf8').replace('"nhl_web_pbp"', '"nhl_pbp"'));
    checkVendor(tmp).should.eql([`DRIFT: tools/codegen/${PY_NAMES_FILE} differs from its vendored source (${REGEN})`]);
  });

  it('fails when a vendored sdv-py module copy is edited (even after re-deriving)', () => {
    const rel = 'py/sportsdataverse/nhl/nhl_api_web.py';
    const f = join(tmp, 'vendor', 'upstream', ...rel.split('/'));
    writeFileSync(f, readFileSync(f, 'utf8').replace('def nhl_web_pbp(', 'def nhl_pbp('));
    writeFileSync(join(tmp, PY_NAMES_FILE), deriveAll(tmp).get(PY_NAMES_FILE));
    checkVendor(tmp).should.eql([`UPSTREAM: vendor/upstream/${rel} does not match pinned blob ${
      readFileSync(join(tmp, 'vendor', 'upstream', 'LOCK'), 'utf8').match(/^([0-9a-f]{40}) {2}py\/sportsdataverse\/nhl\/nhl_api_web\.py$/m)[1]
    } (${REFETCH})`]);
  });

  it('fails when an upstream file is deleted', () => {
    rmSync(join(tmp, 'vendor', 'upstream', 'schemas', 'native', 'nhl_edge', 'skater_detail.yaml'));
    checkVendor(tmp).should.eql([
      `UPSTREAM: vendor/upstream/schemas/native/nhl_edge/skater_detail.yaml is missing (${REFETCH})`,
    ]);
  });

  it('fails when an unlisted file appears in the upstream copy', () => {
    writeFileSync(join(tmp, 'vendor', 'upstream', 'schemas', 'extra.yaml'), 'x: 1\n');
    checkVendor(tmp).should.eql([`UPSTREAM: vendor/upstream/schemas/extra.yaml is not in LOCK (${REFETCH})`]);
  });

  it('a failed fetch leaves vendor.yaml and the upstream copy untouched', () => {
    // An empty git repo as SDV_PY_REPO: `git ls-tree <sha>` fails before any write.
    const repo = mkdtempSync(join(tmpdir(), 'sdv-vendor-repo-'));
    try {
      spawnSync('git', ['init', '-q', repo]);
      const before = [readFileSync(join(CODEGEN_DIR, 'vendor.yaml')), readFileSync(join(CODEGEN_DIR, 'vendor', 'upstream', 'LOCK'))];
      const r = spawnSync(process.execPath, [join(CODEGEN_DIR, 'vendor.mjs'), '--ref', '0'.repeat(40)], {
        env: { ...process.env, SDV_PY_REPO: repo },
        encoding: 'utf8',
      });
      r.status.should.equal(1);
      readFileSync(join(CODEGEN_DIR, 'vendor.yaml')).equals(before[0]).should.be.true();
      readFileSync(join(CODEGEN_DIR, 'vendor', 'upstream', 'LOCK')).equals(before[1]).should.be.true();
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

describe('vendor-sync.yml', () => {
  const wf = parse(readFileSync(join(CODEGEN_DIR, '..', '..', '.github', 'workflows', 'vendor-sync.yml'), 'utf8'));
  const steps = wf.jobs.sync.steps;

  it('runs the test step with pipefail so a failing `npm test | tail` fails the step', () => {
    const t = steps.find((s) => s.id === 'test');
    t.shell.should.equal('bash'); // GitHub runs `bash --noprofile --norc -eo pipefail {0}`
    t['continue-on-error'].should.be.true();
    t.run.should.match(/npm test 2>&1 \| tail/);
    // The PR body reports the step OUTCOME (failure even under continue-on-error).
    steps.find((s) => s.name === 'Build PR body').env.OUTCOME.should.equal('${{ steps.test.outcome }}');
    // pipefail is what makes the pipe report npm's failure:
    spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', 'false | tail -n 1']).status.should.equal(1);
    spawnSync('bash', ['--noprofile', '--norc', '-e', '-c', 'false | tail -n 1']).status.should.equal(0);
  });

  it('checks out without persisting the job token', () => {
    steps[0].uses.should.startWith('actions/checkout@');
    steps[0].with['persist-credentials'].should.be.false();
  });
});

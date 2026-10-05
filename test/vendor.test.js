import should from 'should';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';

// git does not track empty directories, so a fixture file may land in one a fresh checkout lacks
const put = (path, body) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
};
import {
  CODEGEN_DIR,
  checkSchemaShape,
  checkVendor,
  decodeText,
  deriveAll,
  deriveOutgoing,
  familyPatches,
  findMaskedPatches,
  githubSource,
  fetchWithRetry,
  findStaleAfterBump,
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
import { readLock, verifyLockOnline } from '../tools/codegen/vendor-lock-online.mjs';

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
    // ... and a family whose parser mapping declares incompatibility keeps none.
    family('bart_wbb').schemaRefs.should.eql([]);
    // nba_stats: py's parser-derived tables (sdv-py #683) are attached, but one
    // the harness disproves on real captures is dropped.
    family('nba_stats').schemaRefs.length.should.equal(127);
    should(family('nba_stats').ep('leaguedashptstats').returns_schema).be.undefined();
    // pySchemas says why each py returns_schema is (not) attached.
    const why = (key, short) => family(key).pySchemas.find((e) => e.short === short).status;
    why('nhl_edge', 'skater_detail').should.equal('attached');
    why('mlb', 'teams_stats').should.equal('parser_override');
    why('mlb_statcast', 'gamefeed').should.equal('schema_incompatible');
    why('nba_stats', 'scheduleleaguev2').should.equal('attached');
    why('nba_stats', 'leaguedashptstats').should.equal('schema_incompatible');
    why('bart_wbb', 'ratings').should.equal('declared_incompatible');
    why('espn_site_v2', 'scoreboard').should.equal('undeclared');
    (() => transform('nhl_edge', { schema_compatible: true, schema_incompatible: 'skater_detail' }, edge)).should.throw(
      /schema_incompatible must be a list/
    );
  });

  it('fails closed on a py returns-schema shape JS does not understand', () => {
    const col = '- name: a\n  type: integer\n  description: ""\n';
    // the shapes sdv-py ships: one table, one table per frame, unverified (no columns)
    checkSchemaShape(`schema: x\nkind: dataframe\ncolumns:\n${col}`, 'x');
    checkSchemaShape(`schema: x\nkind: frames\nframes:\n- section: S\n  columns:\n  ${col.replace(/\n(?=.)/g, '\n  ')}`, 'x');
    checkSchemaShape('schema: x\nkind: dataframe\nunverified: no capture with rows\ncolumns: []\n', 'x');
    const bad = {
      'derived_by_rule: spec\nkind: dataframe\ncolumns: []\n': /unknown top-level key\(s\) derived_by_rule/,
      'kind: table\ncolumns: []\n': /unknown kind "table"/,
      'kind: frames\nframes: []\n': /non-empty frames list/,
      'kind: frames\nframes:\n- name: S\n  columns: []\n': /each frame must be \{section, columns\}/,
      'kind: dataframe\nunverified: why\ncolumns:\n- {name: a, type: integer}\n': /must publish no columns/,
      'kind: dataframe\ncolumns:\n- {name: a, type: integer, nullable: true}\n': /column "a" must be/,
    };
    for (const [text, err] of Object.entries(bad)) (() => checkSchemaShape(text, 'x')).should.throw(err);
    // and the vendor runs the check on every schema it attaches
    let checked = 0;
    for (const f of readdirSync(join(CODEGEN_DIR, 'schemas', 'native', 'nba_stats'))) {
      checkSchemaShape(readFileSync(join(CODEGEN_DIR, 'schemas', 'native', 'nba_stats', f), 'utf8'), f);
      checked++;
    }
    checked.should.equal(127);
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

  it('mlb: overlay appends the 14 JS-only endpoints (pbp timecode now upstream)', () => {
    const { doc, ep } = family('mlb', overlay('mlb'));
    doc.api.should.equal('mlb');
    doc.endpoints.length.should.equal(64 + 14);
    ep('teams').parser.should.equal('parse_mlb_teams');
    ep('attendance').path.should.equal('/api/v1/attendance');
    const timecode = ep('pbp').extra_params.find((p) => p.name === 'timecode');
    timecode.query_key.should.equal('timecode'); // vendored as-is since sdv-py #679
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

  it('overlay: a patch upstream has absorbed throws (the pbp timecode fix announced itself)', () => {
    // The pin includes the sdv-py fix (#679: timecode -> query_key timecode), so the
    // JS patch that carried it is now a no-op and must be removed, not kept.
    const py = upstream('endpoints/mlb_api.yaml');
    py.should.containEql('  - name: timecode\n    query_key: timecode\n');
    const oldPatch =
      'endpoints:\n- short: pbp\n  extra_params:\n' +
      ['language', 'timecode', 'hydrate', 'fields']
        .map((n) => `  - name: ${n}\n    query_key: ${n}\n    type: str\n`)
        .join('');
    (() => transform('mlb', manifest.families.mlb, py, oldPatch)).should.throw(
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
    // a py schema the declaration does not attach (nba_stats leaguedashptstats is
    // schema_incompatible), left behind byte-identical to its upstream copy
    const rel = join('schemas', 'native', 'nba_stats', 'leaguedashptstats.yaml');
    put(join(tmp, rel), readFileSync(join(tmp, 'vendor', 'upstream', rel)));
    checkVendor(tmp).should.eql([
      `ORPHAN: tools/codegen/schemas/native/nba_stats/leaguedashptstats.yaml is not vendored and not referenced (delete it, or ${REGEN})`,
    ]);
    writeVendor(tmp).removed.should.eql(['schemas/native/nba_stats/leaguedashptstats.yaml']);
    checkVendor(tmp).should.eql([]);
  });

  it('never touches a JS-authored schema, even unreferenced or in a directory the vendor writes into', () => {
    const files = {
      // a new JS-only schema in a shared directory (vendored py schemas + JS-owned overlay ones)
      [join('schemas', 'native', 'mlb', 'js_only_new.yaml')]: 'schema: js_only_new\ncolumns: []\n',
      // a JS-authored schema at a py schema's path, with its own content
      [join('schemas', 'native', 'nba_stats', 'leaguedashptstats.yaml')]: 'schema: leaguedashptstats\ncolumns: []\n',
      // a hand-added file in a fully vendored directory
      [join('schemas', 'native', 'nhl_edge', 'stray.yaml')]: 'schema: stray\ncolumns: []\n',
    };
    for (const [rel, body] of Object.entries(files)) put(join(tmp, rel), body);
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

  it('a pin bump prunes a py schema the new pin dropped, but never a JS-authored file', () => {
    const rel = 'schemas/native/dropped_family/gone.yaml';
    const oldBytes = 'returns:\n  - col_name: a\n';
    const old = new Map([...deriveAll(tmp), [rel, oldBytes]]); // outgoing pin vendored it
    const incoming = deriveAll(tmp); // incoming pin no longer does
    put(join(tmp, rel), oldBytes); // byte-identical to the OLD upstream copy
    findStaleAfterBump(tmp, old, incoming).should.eql([rel]);
    put(join(tmp, rel), oldBytes + '# JS-authored edit\n');
    findStaleAfterBump(tmp, old, incoming).should.eql([]);
    // a JS-authored schema the old pin never vendored is never a candidate
    put(join(tmp, 'schemas', 'js_only', 'mine.yaml'), 'x: 1\n');
    findStaleAfterBump(tmp, deriveAll(tmp), incoming).should.eql([]);
  });

  describe('online LOCK check', () => {
    const treeOf = (lock) => async () => new Map(lock);
    it('passes when LOCK equals the upstream tree', async () => {
      (await verifyLockOnline(tmp, treeOf(readLock(tmp)))).should.eql([]);
    });

    it('fails when a copy and its LOCK line are edited together (offline check cannot see it)', async () => {
      const genuine = readLock(tmp); // what upstream really has
      const path = 'endpoints/cbs_napi.yaml';
      const f = join(tmp, 'vendor', 'upstream', path);
      const edited = Buffer.concat([readFileSync(f), Buffer.from('# tampered\n')]);
      writeFileSync(f, edited);
      const lockFile = join(tmp, 'vendor', 'upstream', 'LOCK');
      writeFileSync(lockFile, readFileSync(lockFile, 'utf8').replace(genuine.get(path), gitBlobSha(edited)));
      writeVendor(tmp); // re-derive so the offline gate is satisfied too
      checkVendor(tmp).should.eql([]);
      const problems = await verifyLockOnline(tmp, treeOf(genuine));
      problems.some((p) => /endpoints\/cbs_napi\.yaml is pinned to blob .* but upstream has /.test(p)).should.be.true();
    });

    it('fails on a LOCK path missing upstream, and rejects (never passes) when the fetch fails', async () => {
      const tree = readLock(tmp);
      tree.delete('endpoints/cbs_napi.yaml');
      (await verifyLockOnline(tmp, treeOf(tree)))[0].should.match(/endpoints\/cbs_napi\.yaml is not in /);
      await verifyLockOnline(tmp, async () => {
        throw new Error('GET https://api.github.com/... -> HTTP 403');
      }).should.be.rejectedWith(/HTTP 403/);
    });

    it('fails when a path is dropped from LOCK and its vendored copy hand-edited (completeness probe)', async () => {
      const genuine = readLock(tmp);
      const path = 'schemas/native/nhl_edge/skater_detail.yaml';
      genuine.has(path).should.be.true();
      rmSync(join(tmp, 'vendor', 'upstream', path));
      const lockFile = join(tmp, 'vendor', 'upstream', 'LOCK');
      writeFileSync(lockFile, readFileSync(lockFile, 'utf8').split('\n').filter((l) => !l.endsWith(`  ${path}`)).join('\n'));
      const vendored = join(tmp, path);
      writeFileSync(vendored, readFileSync(vendored, 'utf8') + '# hand edit\n');
      checkVendor(tmp).should.eql([]); // the offline gate cannot see it
      const problems = await verifyLockOnline(tmp, treeOf(genuine));
      problems.should.have.length(1);
      problems[0].should.match(/skater_detail\.yaml is missing from LOCK/);
    });

    it('fails on an extra LOCK path the vendor would not fetch', async () => {
      const tree = readLock(tmp);
      tree.set('schemas/native/zzz/extra.yaml', 'a'.repeat(40));
      const lockFile = join(tmp, 'vendor', 'upstream', 'LOCK');
      writeFileSync(lockFile, readFileSync(lockFile, 'utf8') + `${'a'.repeat(40)}  schemas/native/zzz/extra.yaml\n`);
      (await verifyLockOnline(tmp, treeOf(tree)))[0].should.match(/extra\.yaml is in LOCK but is not a file the vendor fetches/);
    });

    describe('fetchWithRetry', () => {
      const res = (status) => ({ ok: status < 400, status });
      const opts = (impl) => ({ fetchImpl: impl, sleep: async () => {}, attempts: 3 });
      it('retries 5xx and network errors, then succeeds', async () => {
        const seq = [() => res(502), () => { throw new Error('ECONNRESET'); }, () => res(200)];
        let n = 0;
        (await fetchWithRetry('u', {}, opts(async () => seq[n++]()))).status.should.equal(200);
        n.should.equal(3);
      });
      it('still fails when retries are exhausted', async () => {
        let n = 0;
        await fetchWithRetry('u', {}, opts(async () => (n++, res(503)))).should.be.rejectedWith(/HTTP 503/);
        n.should.equal(3);
        n = 0;
        await fetchWithRetry('u', {}, opts(async () => { n++; throw new Error('ETIMEDOUT'); })).should.be.rejectedWith(/network error: ETIMEDOUT/);
        n.should.equal(3);
      });
      it('never retries 403 / 404', async () => {
        for (const status of [403, 404]) {
          let n = 0;
          await fetchWithRetry('u', {}, opts(async () => (n++, res(status)))).should.be.rejectedWith(new RegExp(`HTTP ${status}`));
          n.should.equal(1);
        }
      });
    });
  });

  describe('pin-bump pruning through `vendor.mjs` (main)', function () {
    this.timeout(120000);
    const REF = 'native/nhl_edge/skater_detail';
    const SCHEMA = `schemas/${REF}.yaml`;
    // A two-commit stand-in for sdv-py: commit 1 = the committed upstream copy; commit 2
    // drops REF's `returns_schema:` line from the endpoint file and the schema file.
    const twoCommitRepo = () => {
      const repo = mkdtempSync(join(tmpdir(), 'sdv-vendor-repo-'));
      const git = (...a) => {
        const r = spawnSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { encoding: 'utf8' });
        r.status.should.equal(0, r.stderr);
        return r.stdout.trim();
      };
      git('init', '-q');
      const up = join(tmp, 'vendor', 'upstream');
      const walk = (d, pre = '') => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name), `${pre}${e.name}/`) : [`${pre}${e.name}`]));
      for (const p of walk(up).filter((f) => f !== 'LOCK' && f !== 'REF')) {
        put(join(repo, p.startsWith('py/') ? p.slice(3) : `tools/codegen/${p}`), readFileSync(join(up, p)));
      }
      git('add', '-A');
      git('commit', '-q', '-m', 'old');
      const sha1 = git('rev-parse', 'HEAD');
      const ep = join(repo, 'tools', 'codegen', 'endpoints', 'nhl_edge.yaml');
      const text = readFileSync(ep, 'utf8');
      text.should.match(new RegExp(`returns_schema: ${REF}\\b`));
      writeFileSync(ep, text.split('\n').filter((l) => !new RegExp(`returns_schema: ${REF}\\s*$`).test(l)).join('\n'));
      rmSync(join(repo, 'tools', 'codegen', SCHEMA));
      git('add', '-A');
      git('commit', '-q', '-m', 'new');
      return { repo, sha1, sha2: git('rev-parse', 'HEAD') };
    };
    const bump = (repo, sha) =>
      spawnSync(process.execPath, [join(CODEGEN_DIR, 'vendor.mjs'), '--ref', sha], {
        env: { ...process.env, SDV_PY_REPO: repo, SDV_VENDOR_ROOT: tmp },
        encoding: 'utf8',
      });

    it('removes a schema copy the new pin dropped', () => {
      const { repo, sha2 } = twoCommitRepo();
      try {
        readFileSync(join(tmp, SCHEMA), 'utf8'); // vendored at the old pin
        const r = bump(repo, sha2);
        r.status.should.equal(0, r.stderr);
        r.stdout.should.match(new RegExp(`removed tools/codegen/${SCHEMA}`));
        existsSync(join(tmp, SCHEMA)).should.be.false(); // gone, asserted directly (a spawned node's null status would pass `not.equal(0)`)
      } finally {
        rmSync(repo, { recursive: true, force: true });
      }
    });

    it('keeps an old-only schema a JS-owned endpoint still references', () => {
      const { repo, sha2 } = twoCommitRepo();
      try {
        put(join(tmp, 'endpoints', 'js_owned.yaml'), `endpoints:\n  - short: mine\n    path: /x\n    returns_schema: ${REF}\n`);
        const r = bump(repo, sha2);
        r.status.should.equal(0, r.stderr);
        r.stdout.should.not.match(/removed tools\/codegen\/schemas\/native\/nhl_edge\/skater_detail/);
        readFileSync(join(tmp, SCHEMA), 'utf8').should.be.a.String();
      } finally {
        rmSync(repo, { recursive: true, force: true });
      }
    });
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
      // Runs on the temp copy, never the real CODEGEN_DIR: a regression must not rewrite the repo's vendor.yaml.
      const before = [readFileSync(join(tmp, 'vendor.yaml')), readFileSync(join(tmp, 'vendor', 'upstream', 'LOCK'))];
      const r = spawnSync(process.execPath, [join(CODEGEN_DIR, 'vendor.mjs'), '--ref', '0'.repeat(40)], {
        env: { ...process.env, SDV_PY_REPO: repo, SDV_VENDOR_ROOT: tmp },
        encoding: 'utf8',
      });
      r.status.should.equal(1);
      readFileSync(join(tmp, 'vendor.yaml')).equals(before[0]).should.be.true();
      readFileSync(join(tmp, 'vendor', 'upstream', 'LOCK')).equals(before[1]).should.be.true();
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
    // pipefail is what makes the pipe report npm's failure (checked in the next test)
  });

  it('bash -o pipefail reports a failing pipe (the semantics the test step relies on)', function () {
    // A bare `bash` on Windows is often the WSL launcher, not the bash GitHub runs.
    if (process.platform === 'win32') this.skip();
    spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', 'false | tail -n 1']).status.should.equal(1);
    spawnSync('bash', ['--noprofile', '--norc', '-e', '-c', 'false | tail -n 1']).status.should.equal(0);
  });

  it('checks out without persisting the job token', () => {
    steps[0].uses.should.startWith('actions/checkout@');
    steps[0].with['persist-credentials'].should.be.false();
  });
});

describe('workflows: LOCK online check + vendor-sync failure handling', () => {
  const wfDir = join(CODEGEN_DIR, '..', '..', '.github', 'workflows');
  const sync = parse(readFileSync(join(wfDir, 'vendor-sync.yml'), 'utf8')).jobs.sync;
  const ci = parse(readFileSync(join(wfDir, 'ci.yml'), 'utf8')).jobs.build.steps;

  it('CI runs the online LOCK check', () => {
    ci.some((s) => s.run === 'npm run vendor:check:online').should.be.true();
  });

  it('GITHUB_TOKEN / GH_TOKEN appear only on the steps that need them', () => {
    (sync.env ?? {}).should.not.have.property('GITHUB_TOKEN');
    (sync.env ?? {}).should.not.have.property('GH_TOKEN');
    sync.steps.filter((s) => s.env?.GITHUB_TOKEN).map((s) => s.name).should.eql(['Vendor (fetch + online LOCK check)']);
    sync.steps.filter((s) => s.env?.GH_TOKEN).map((s) => s.name).should.eql(['Report sync failure']);
    sync.steps.find((s) => s.name === 'Vendor (fetch + online LOCK check)').run.should.match(/vendor:check:online/);
    // codegen runs in its own step, without the token
    const cg = sync.steps.find((s) => s.id === 'codegen');
    cg.run.should.equal('npm run codegen');
    (cg.env ?? {}).should.eql({});
  });

  it('a ref/vendor/codegen failure opens or updates an issue and keeps the run red', () => {
    for (const id of ['ref', 'vendor', 'codegen']) sync.steps.find((s) => s.id === id)['continue-on-error'].should.be.true();
    const issue = sync.steps.find((s) => s.name === 'Report sync failure');
    for (const id of ['ref', 'vendor', 'codegen']) issue.if.should.match(new RegExp(`steps\.${id}\.outcome == 'failure'`));
    issue.if.should.match(/^always\(\)/);
    issue.run.should.match(/gh issue create/).and.match(/gh issue comment/);
    issue.run.trimEnd().split('\n').pop().should.match(/^exit 1/); // red after reporting
    // later steps only run when everything before them succeeded
    sync.steps.find((s) => s.id === 'test').if.should.match(/steps\.codegen\.outcome == 'success'/);
  });
});

describe('vendor: fetch hardening', () => {
  const res = (status) => ({ ok: status < 400, status });
  const fast = { sleep: async () => {}, attempts: 3 };

  it('gives every attempt its own AbortSignal.timeout', async () => {
    const seen = [];
    await fetchWithRetry('u', {}, { ...fast, timeoutMs: 1234, fetchImpl: async (u, o) => (seen.push(o.signal), seen.length < 3 ? res(503) : res(200)) });
    seen.length.should.equal(3);
    new Set(seen).size.should.equal(3); // a fresh signal per attempt, not one shared deadline
    seen.every((s) => s instanceof AbortSignal).should.be.true();
  });

  it('a hung request is aborted and retried, then fails: bounded, never a hang', async () => {
    let n = 0;
    const hang = (u, { signal }) => new Promise((_, rej) => {
      n++;
      signal.addEventListener('abort', () => rej(signal.reason));
    });
    await fetchWithRetry('u', {}, { ...fast, timeoutMs: 20, fetchImpl: hang }).should.be.rejectedWith(/network error/);
    n.should.equal(3);
  });

  it('a body-phase reset is retried and names the URL when it never recovers', async () => {
    let n = 0;
    const body = async () => { n++; throw new Error('ECONNRESET'); };
    await fetchWithRetry('http://x/y', {}, { ...fast, readBody: body, fetchImpl: async () => ({ ok: true, status: 200 }) }).should.be.rejectedWith(/GET http:\/\/x\/y -> network error: ECONNRESET/);
    n.should.equal(3);
    n = 0;
    const flaky = async () => { if (++n < 3) throw new Error('reset'); return 'ok'; };
    (await fetchWithRetry('u', {}, { ...fast, readBody: flaky, fetchImpl: async () => ({ ok: true, status: 200 }) })).should.equal('ok');
  });

  it('raw.githubusercontent file fetches retry like the API ones', async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(url);
      if (url.includes('raw.githubusercontent.com') && calls.filter((c) => c === url).length < 3) return res(503);
      return { ok: true, status: 200, arrayBuffer: async () => Buffer.from('x') };
    };
    const [buf] = await githubSource('o/r', 'a'.repeat(40), { fetchImpl, sleep: async () => {}, attempts: 3 }).getMany(['endpoints/x.yaml']);
    buf.toString().should.equal('x');
    calls.filter((c) => c.startsWith('https://raw.githubusercontent.com/o/r/')).length.should.equal(3);
  });

  it('a BOM is stripped identically for fetched bytes and committed copies', function () {
    this.timeout(60000);
    const bom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('a: 1\n')]);
    decodeText(bom).should.equal('a: 1\n');
    decodeText(Buffer.from('a: 1\n')).should.equal('a: 1\n');
    // the bytes (what LOCK hashes) are left alone
    gitBlobSha(bom).should.not.equal(gitBlobSha(Buffer.from('a: 1\n')));
    // local path: deriveAll reads a BOM-prefixed upstream copy to the same output
    const tmp = mkdtempSync(join(tmpdir(), 'sdv-bom-'));
    try {
      for (const d of ['vendor', 'overlay', 'endpoints', 'schemas']) cpSync(join(CODEGEN_DIR, d), join(tmp, d), { recursive: true });
      for (const c of ['vendor.yaml', ...(manifest.copy ?? [])]) cpSync(join(CODEGEN_DIR, c), join(tmp, c));
      const want = deriveAll(tmp).get('endpoints/cbs.yaml');
      const f = join(tmp, 'vendor', 'upstream', 'endpoints', 'cbs_napi.yaml');
      writeFileSync(f, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), readFileSync(f)]));
      deriveAll(tmp).get('endpoints/cbs.yaml').should.equal(want);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('vendor: overlay vs upstream', () => {
  it('rejects an overlay addition whose path duplicates a vendored endpoint', () => {
    const ep = family('cbs').doc.endpoints.find((e) => e.path && !e.extra_params && !e.fixed_params && !e.query_params && !e.host);
    (() => family('cbs', `endpoints:\n  - short: zz_dup\n    path: ${JSON.stringify(ep.path)}\n`)).should.throw(
      /overlay\/cbs\.yaml zz_dup: path .* duplicates endpoint/
    );
  });

  it('rejects two overlay additions that share a path', () => {
    const ov = `endpoints:\n  - short: zz_a\n    path: /zz/unique\n  - short: zz_b\n    path: /zz/unique\n`;
    (() => family('cbs', ov)).should.throw(/zz_b: path .zz.unique .* duplicates endpoint zz_a/);
  });

  it('records what upstream said for a patched key, and warns when a pin bump changes it (masking)', () => {
    const cfg = manifest.families.cbs;
    const text = upstream(`endpoints/${cfg.from ?? 'cbs'}.yaml`);
    const ep = family('cbs').doc.endpoints.find((e) => e.path);
    const ov = `endpoints:\n  - short: ${ep.short}\n    path: /overridden\n`;
    const run = (t) => transformFamily('cbs', cfg, t, ov, manifest.source).patches.filter((p) => p.k === 'path');
    const oldP = run(text);
    oldP.should.have.length(1);
    oldP[0].upstream.should.equal(JSON.stringify(ep.path));
    const newP = run(text.replace(`path: ${ep.path}`, `path: ${ep.path}/v2`));
    findMaskedPatches('cbs', oldP, newP).should.have.length(1);
    findMaskedPatches('cbs', oldP, newP)[0].should.match(/overlay\/cbs\.yaml .*path replaces the whole upstream value.*MASKED/);
    findMaskedPatches('cbs', oldP, oldP).should.eql([]); // unchanged upstream: silent
    findMaskedPatches('cbs', oldP, newP)[0].should.match(/\(".*" -> ".*\/v2"\)/); // old -> new in the message
    familyPatches(CODEGEN_DIR, 'cbs').length.should.be.above(0);
  });

  it('records the RAW upstream value even where the schema policy dropped it (not all "(absent)")', () => {
    let seen = 0;
    let rows = 0;
    for (const k of Object.keys(manifest.families)) {
      if (!existsSync(join(CODEGEN_DIR, 'overlay', k + '.yaml'))) continue;
      for (const p of familyPatches(CODEGEN_DIR, k)) {
        rows++;
        if (p.k === 'returns_schema' && p.upstream !== '(absent)') seen++;
      }
    }
    rows.should.be.above(100);
    seen.should.be.above(0); // before the fix every returns_schema patch recorded (absent)
  });

  it('the duplicate-path check keys on host + path + params, so legitimate same-path endpoints pass', () => {
    const cfg = manifest.families.cbs;
    const text = upstream('endpoints/' + (cfg.from ?? 'cbs') + '.yaml');
    const ep = family('cbs').doc.endpoints.find((e) => e.path && !e.extra_params && !e.fixed_params);
    const other = 'endpoints:\n  - short: zz_other_host\n    host: https://other.example\n    path: ' + JSON.stringify(ep.path) + '\n';
    (() => transformFamily('cbs', cfg, text, other, manifest.source)).should.not.throw();
    const params = 'endpoints:\n  - short: zz_params\n    path: ' + JSON.stringify(ep.path) + '\n    extra_params:\n      - {name: zz, query_key: zz, type: str}\n';
    (() => transformFamily('cbs', cfg, text, params, manifest.source)).should.not.throw();
  });
});

describe('vendor: reserved names and the skipped-family message', () => {
  it('py_reserved lists the hand-written espn_<lg>_pbp names and no ESPN wrapper is generated under a reserved name', async () => {
    const reserved = new Set(manifest.py_reserved);
    for (const n of ['espn_nba_pbp', 'espn_wnba_pbp', 'espn_mbb_pbp', 'espn_wbb_pbp']) reserved.has(n).should.be.true(n);
    const { WRAPPERS } = await import('../dist/generated/wrappers.js');
    const generated = new Set(WRAPPERS.map((w) => w.publicShort ?? w.short));
    for (const n of [...reserved].filter((r) => r.endsWith('_pbp'))) {
      const rest = n.replace(/^espn_[a-z]+?_/, '');
      generated.has(rest).should.be.false(`a generated ESPN wrapper would take the reserved name ${n}`);
    }
  });

  it('names a family whose outgoing outputs cannot be derived, and skips only it', function () {
    this.timeout(60000);
    const tmp = mkdtempSync(join(tmpdir(), 'sdv-skip-'));
    try {
      for (const d of ['vendor', 'overlay', 'endpoints', 'schemas']) cpSync(join(CODEGEN_DIR, d), join(tmp, d), { recursive: true });
      for (const c of ['vendor.yaml', ...(manifest.copy ?? [])]) cpSync(join(CODEGEN_DIR, c), join(tmp, c));
      const f = join(tmp, 'vendor.yaml');
      writeFileSync(f, readFileSync(f, 'utf8').replace(/^families:\n/m, 'families:\n  brand_new_family: {}\n'));
      const warned = [];
      const out = deriveOutgoing(tmp, (m) => warned.push(m));
      out.skipped.should.eql(['brand_new_family']);
      warned.should.have.length(1);
      warned[0].should.match(/^vendor: prune skipped for family brand_new_family \(outgoing outputs not derivable: /);
      out.before.has('endpoints/cbs.yaml').should.be.true(); // the rest still derive
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('workflows: hardening', () => {
  const wfDir = join(CODEGEN_DIR, '..', '..', '.github', 'workflows');
  const load = (n) => parse(readFileSync(join(wfDir, n), 'utf8'));
  const files = readdirSync(wfDir).filter((f) => f.endsWith('.yml'));
  const tokenish = /secrets\.|github\.token|GITHUB_TOKEN|GH_TOKEN/;

  // The ONE allowed place for a token/secret expression is a step's env. Everything else
  // (workflow/job env, run:, with:, if:, container credentials, secrets: inherit) is a leak.
  const TOKEN_EXPR = /\$\{\{(?:(?!\}\}).)*?\b(?:secrets\b|github\s*(?:\.\s*token\b|\[\s*['"]token['"]\s*\]))/;
  const tokenLeaks = (wf) => {
    const w = structuredClone(wf);
    for (const j of Object.values(w.jobs ?? {})) for (const s of j.steps ?? []) delete s.env;
    const txt = JSON.stringify(w);
    return TOKEN_EXPR.test(txt) || /"secrets":"inherit"/.test(txt);
  };

  it('no workflow leaks a secret/token outside a step env', () => {
    for (const f of files) tokenLeaks(load(f)).should.be.false(f);
  });

  it('tokenLeaks catches every leak shape (mutated clones of a real workflow)', () => {
    const base = load('vendor-sync.yml');
    const mutate = (fn) => { const w = structuredClone(base); fn(w); return w; };
    const stepOf = (w, id) => w.jobs.sync.steps.find((s) => s.id === id);
    const cases = {
      'workflow env': (w) => { w.env = { T: '${{ secrets.X }}' }; },
      'job env': (w) => { w.jobs.sync.env = { T: '${{ github.token }}' }; },
      'run inline': (w) => { stepOf(w, 'codegen').run = 'echo ${{ secrets.NPM_TOKEN }}'; },
      'with inline': (w) => { w.jobs.sync.steps.at(-1).with = { token: '${{ secrets.PAT }}' }; },
      'toJSON(secrets)': (w) => { stepOf(w, 'codegen').run = 'echo ${{ toJSON(secrets) }}'; },
      "secrets['X']": (w) => { stepOf(w, 'codegen').run = "echo ${{ secrets['X'] }}"; },
      "github['token']": (w) => { stepOf(w, 'codegen').run = "echo ${{ github['token'] }}"; },
      'format()': (w) => { stepOf(w, 'codegen').run = "echo ${{ format('{0}', secrets.X) }}"; },
      'secrets: inherit': (w) => { w.jobs.sync.secrets = 'inherit'; },
      'container credentials': (w) => { w.jobs.sync.container = { image: 'x', credentials: { username: 'u', password: '${{ secrets.P }}' } }; },
      'if expression': (w) => { stepOf(w, 'codegen').if = "${{ secrets.X != '' }}"; },
    };
    tokenLeaks(base).should.be.false();
    for (const [name, fn] of Object.entries(cases)) tokenLeaks(mutate(fn)).should.be.true(name);
    // and a step-level env stays allowed
    tokenLeaks(mutate((w) => { stepOf(w, 'codegen').env = { GH_TOKEN: '${{ github.token }}' }; })).should.be.false();
  });

  it('every job in ci / vendor-sync / live-smoke has timeout-minutes', () => {
    for (const f of ['ci.yml', 'vendor-sync.yml', 'live-smoke.yml']) {
      for (const [name, job] of Object.entries(load(f).jobs)) {
        job['timeout-minutes'].should.be.a.Number().and.be.above(0, `${f}: ${name}`);
        job['timeout-minutes'].should.be.belowOrEqual(60, `${f}: ${name}`);
      }
    }
  });

  it('live-smoke serialises runs and labels a build failure apart from drift', () => {
    const wf = load('live-smoke.yml');
    wf.concurrency.group.should.equal('live-smoke');
    wf.concurrency['cancel-in-progress'].should.be.false();
    const steps = wf.jobs.live.steps;
    const live = steps.find((s) => s.id === 'live');
    live.run.should.match(/SDV_LIVE=1 npm test/);
    const drift = steps.find((s) => /drift issue/.test(s.name ?? ''));
    drift.if.should.equal("failure() && steps.live.outcome == 'failure'");
    drift.run.should.match(/live-tests:drift/);
    const build = steps.find((s) => /build-failure issue/.test(s.name ?? ''));
    build.if.should.equal("failure() && steps.live.outcome != 'failure'");
    build.run.should.match(/live-tests:build-failure/).and.not.match(/live-tests:drift/);
    steps.indexOf(live).should.be.above(steps.findIndex((s) => s.run === 'npm run build'));
    live['timeout-minutes'].should.be.below(wf.jobs.live['timeout-minutes']); // a hang fails the step, so the issue step still runs
    for (const s of steps.filter((x) => /gh (issue|label)/.test(x.run ?? ''))) {
      s.run.split('\n').filter((l) => /gh (issue (list|create|comment)|label create)/.test(l)).every((l) => l.includes('--repo "$GITHUB_REPOSITORY"')).should.be.true();
    }
  });

  it('vendor-sync dispatches CI from a SEPARATE job: actions: write exists nowhere else', () => {
    const ci = load('ci.yml');
    Object.keys(ci.on).should.containEql('workflow_dispatch');
    const wf = load('vendor-sync.yml');
    wf.permissions.should.eql({}); // no workflow-wide grant
    const sync = wf.jobs.sync;
    sync.permissions.should.eql({ contents: 'write', 'pull-requests': 'write', issues: 'write' });
    sync.outputs.op.should.equal('${{ steps.cpr.outputs.pull-request-operation }}');
    const cpr = sync.steps.find((s) => s.uses?.startsWith('peter-evans/create-pull-request@'));
    cpr.id.should.equal('cpr');
    cpr.with.branch.should.equal('chore/vendor-sync');
    const d = wf.jobs['dispatch-ci'];
    d.needs.should.equal('sync');
    d.if.should.match(/needs\.sync\.outputs\.op == 'created'/).and.match(/needs\.sync\.outputs\.op == 'updated'/);
    d.permissions.should.eql({ actions: 'write' });
    d['timeout-minutes'].should.be.belowOrEqual(5);
    // fresh VM, nothing of ours runs next to the token
    d.steps.should.have.length(1);
    d.steps.some((s) => /checkout|setup-node/.test(s.uses ?? '') || /\bnpm\b/.test(s.run ?? '')).should.be.false();
    d.steps[0].run.should.match(/gh workflow run ci\.yml .*--ref chore\/vendor-sync/);
    d.steps[0].env.GH_TOKEN.should.equal('${{ github.token }}');
    // actions: write on no other job or workflow level, in any workflow
    for (const f of files) {
      const w = load(f);
      JSON.stringify(w.permissions ?? {}).should.not.match(/actions/, f + ' workflow-level');
      for (const [name, job] of Object.entries(w.jobs)) {
        if (f === 'vendor-sync.yml' && name === 'dispatch-ci') continue;
        JSON.stringify(job.permissions ?? {}).should.not.match(/actions/, f + ':' + name);
      }
    }
    sync.steps.filter((s) => s.env?.GH_TOKEN).map((s) => s.name).should.eql(['Report sync failure']);
  });

  it('the vendor step has its own timeout and surfaces masked-patch warnings in the PR body', () => {
    const w = load('vendor-sync.yml');
    const steps = w.jobs.sync.steps;
    const v = steps.find((s) => s.id === 'vendor');
    v['timeout-minutes'].should.be.below(w.jobs.sync['timeout-minutes']);
    v.env.SDV_VENDOR_WARNINGS.should.equal('vendor-warnings.txt');
    const body = steps.find((s) => s.name === 'Build PR body').run;
    body.should.match(/vendor-warnings\.txt/).and.match(/GITHUB_STEP_SUMMARY/).and.match(/CI was dispatched/);
    body.should.not.match(/close\/reopen/);
  });

  it('the vendor-sync failure issue carries the resolved sdv-py sha', () => {
    const issue = load('vendor-sync.yml').jobs.sync.steps.find((s) => s.name === 'Report sync failure');
    issue.env.SHA.should.equal('${{ steps.ref.outputs.sha }}');
    issue.run.should.match(/sdv-py sha: \$\{SHA:-not resolved\}/);
  });
});

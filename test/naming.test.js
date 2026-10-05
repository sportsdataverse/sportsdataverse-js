import should from 'should';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import * as pkg from '../dist/index.js';
import { configure, resetConfig, LEAGUES, FLAT_WRAPPERS, makeLeagueModule, makeFlatModule } from '../dist/index.js';
import { ESPN_DEPRECATED_ALIASES, FLAT_DEPRECATED_ALIASES } from '../dist/generated/aliases.js';

// v4 naming: JS public names are sdv-py's (tools/codegen/generate.mjs ports
// py's emit-time rename layer); every pre-v4 name stays callable as a
// deprecated alias. All offline.

const sdv = pkg.default;
const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());
const json = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const yaml = (p) => parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const PRE_V4 = json('../tools/codegen/pre_v4_names.json');
// sdv-py's generated public names at the pin: derived by `npm run vendor` from
// the verbatim (LOCK-verified) py modules in tools/codegen/vendor/upstream/py/.
const PY_NAMES = json('../tools/codegen/py_public_names.json');
const PY = PY_NAMES.modules;
const VENDOR = yaml('../tools/codegen/vendor.yaml');
const FLAT_NS = { nhl_api_web: 'nhl', nfl_api: 'nfl', cbs: 'cbs', nba_stats: 'nba', wnba_stats: 'wnba' };
const isAlias = (fn) => typeof fn === 'function' && fn.deprecatedAliasOf !== undefined;

/** Every [namespace, old snake, new snake] alias the runtime registers. */
function aliasRows() {
  const rows = [];
  for (const [prefix, table] of Object.entries(ESPN_DEPRECATED_ALIASES)) {
    for (const [old, now] of Object.entries(table)) rows.push([prefix, old, now]);
  }
  for (const [api, table] of Object.entries(FLAT_DEPRECATED_ALIASES)) {
    const ns = FLAT_WRAPPERS.find((w) => w.api === api) && (FLAT_NS[api] ?? api);
    for (const [old, now] of Object.entries(table)) rows.push([ns, old, now]);
  }
  return rows;
}

/** Fill every required path param so a URL resolves. */
function minimalParams(def, extra = {}) {
  const params = { ...extra };
  for (const p of def.pathParams || []) if (p.required !== false && p.defaultFrom === undefined) params[p.name] = 12345;
  return params;
}

describe('v4 naming: no pre-v4 public name disappears', () => {
  it('every pre-v4 `sdv.<ns>.<name>` is still a function', () => {
    let n = 0;
    for (const [ns, names] of Object.entries(PRE_V4.namespaces)) {
      (typeof sdv[ns]).should.equal("object", `namespace sdv.${ns} disappeared`);
      for (const name of names) {
        (typeof sdv[ns][name]).should.equal('function', `sdv.${ns}.${name} disappeared`);
        n++;
      }
    }
    n.should.be.above(8000);
  });

  it('every pre-v4 package export is still exported', () => {
    for (const name of PRE_V4.exports) (name in pkg).should.be.true(`export ${name} disappeared`);
  });

  it('pre-v4 names that were renamed are exactly the deprecated aliases', () => {
    for (const [ns, names] of Object.entries(PRE_V4.namespaces)) {
      for (const name of names) {
        const fn = sdv[ns][name];
        if (!isAlias(fn)) continue;
        // an alias forwards to a v4 wrapper on the same namespace, under a new name
        fn.replacement.should.not.equal(name);
        sdv[ns][fn.replacement].should.equal(fn.deprecatedAliasOf, `sdv.${ns}.${name}`);
      }
    }
  });
});

describe('v4 naming: deprecated aliases', () => {
  const rows = aliasRows();

  it('cover the renamed ESPN + native names (both case forms)', () => {
    rows.length.should.be.above(1400);
    Object.keys(FLAT_DEPRECATED_ALIASES).sort().should.eql(['cbs', 'fox', 'nfl_api', 'nhl_api_web']);
  });

  it('each alias resolves to the same v4 wrapper, in snake_case and camelCase', () => {
    for (const [ns, old, now] of rows) {
      for (const [o, n] of [[old, now], [toCamel(old), toCamel(now)]]) {
        const alias = sdv[ns][o];
        isAlias(alias).should.be.true(`sdv.${ns}.${o} is not a deprecated alias`);
        alias.deprecatedAliasOf.should.equal(sdv[ns][n], `sdv.${ns}.${o} does not forward to ${n}`);
        alias.replacement.should.equal(n);
        alias.name.should.equal(o); // stack traces show the name the caller used
        isAlias(sdv[ns][n]).should.be.false(`sdv.${ns}.${n} (the v4 name) is itself an alias`);
      }
      sdv[ns][now].should.equal(sdv[ns][toCamel(now)], `${now} and its camelCase differ`);
    }
  });

  it('CBS defs carry their pre-v4 short as legacyShort, matching the aliases', () => {
    const legacy = FLAT_WRAPPERS.filter((w) => w.legacyShort);
    legacy.length.should.equal(16);
    for (const w of legacy) {
      w.api.should.equal('cbs');
      FLAT_DEPRECATED_ALIASES.cbs[`cbs_${w.legacyShort}`].should.equal(w.publicName ?? `cbs_${w.short}`);
    }
    FLAT_WRAPPERS.find((w) => w.api === 'cbs' && w.legacyShort === 'boxscore').short.should.equal('game_boxscore');
  });

  it('every alias is a name JS shipped before v4 (no invented names)', () => {
    for (const [ns, old] of rows) {
      const pre = new Set(PRE_V4.namespaces[ns]);
      pre.has(old).should.be.true(`sdv.${ns}.${old} was never public`);
      pre.has(toCamel(old)).should.be.true(`sdv.${ns}.${toCamel(old)} was never public`);
    }
  });

  describe('runtime behaviour', () => {
    let calls;
    beforeEach(() => {
      calls = [];
      configure({
        transport: async (req) => {
          calls.push(req.url);
          return { status: 200, headers: {}, data: { ok: true }, url: req.url };
        },
      });
    });
    afterEach(() => resetConfig());

    it('an ESPN alias builds the same request as its v4 wrapper', async () => {
      (await sdv.nba.espn_nba_athlete_bio({ athlete_id: 1966 })).should.eql({ ok: true });
      await sdv.nba.espnNbaPlayerBio({ athlete_id: 1966 });
      calls.length.should.equal(2);
      calls[0].should.equal(calls[1]);
      calls[0].should.containEql('/athletes/1966/bio');
    });

    it('a native (flat) alias builds the same request as its v4 wrapper', async () => {
      const def = FLAT_WRAPPERS.find((w) => w.api === 'cbs' && w.short === 'game_boxscore');
      await sdv.cbs.cbsBoxscore(minimalParams(def));
      await sdv.cbs.cbsGameBoxscore(minimalParams(def));
      calls.length.should.equal(2);
      calls[0].should.equal(calls[1]);
    });

    it('warns once per name per process, naming the replacement', async () => {
      const seen = [];
      const on = (w) => seen.push(w);
      process.on('warning', on);
      try {
        // Names no other test calls, so this process has not warned for them yet.
        for (let i = 0; i < 3; i++) await sdv.wch.espn_wch_athlete_overview({ athlete_id: 1 });
        await sdv.wch.espnWchAthleteOverview({ athlete_id: 1 }); // the camelCase alias is its own name
        await sdv.wch.espnWchPlayerOverview({ athlete_id: 1 }); // a v4 name never warns
        await new Promise((r) => setImmediate(r));
      } finally {
        process.off('warning', on);
      }
      const ours = seen.filter((w) => /espn_?[Ww]ch_?[Aa]thlete_?[Oo]verview/.test(w.message));
      ours.length.should.equal(2);
      ours.every((w) => w.name === 'DeprecationWarning').should.be.true();
      ours.every((w) => w.code === 'SDV_DEPRECATED_NAME').should.be.true(); // filterable
      ours[0].message.should.containEql('espn_wch_player_overview');
      ours[1].message.should.containEql('espnWchPlayerOverview');
      seen.filter((w) => /espnWchPlayerOverview\(\) is deprecated/.test(w.message)).length.should.equal(0);
    });
  });
});

describe('v4 naming: JS names equal sdv-py names at the vendor pin', () => {
  it('the sdv-py names were read at the vendor pin (`npm run vendor` regenerates them)', () => {
    PY_NAMES.ref.should.equal(VENDOR.source.ref);
  });

  // sdv-py `drop:`s these generated wrappers because a hand-written py function
  // serves the same endpoint under this name; JS has no hand-written sibling, so
  // its generated wrapper carries that name (see generate.mjs).
  const PY_HANDWRITTEN = new Set(['espn_wbb_game_officials', 'espn_wnba_game_officials']);

  it('the sdv-py drop list is the one PY_HANDWRITTEN mirrors', () => {
    yaml('../tools/codegen/espn_rename_map.yaml').drop.should.eql(['espn_wbb_event_officials', 'espn_wnba_event_officials']);
  });

  for (const league of LEAGUES) {
    it(`espn ${league.prefix}: every v4 name is sdv-py's, and every sdv-py name is here`, () => {
      const py = PY[`${league.prefix}_espn_ext`]?.names;
      Array.isArray(py).should.be.true(`no sdv-py module ${league.prefix}_espn_ext in py_public_names.json`);
      const ns = sdv[league.prefix];
      const js = Object.keys(ns).filter((k) => k.startsWith(`espn_${league.prefix}_`) && !isAlias(ns[k]));
      const pySet = new Set(py);
      js.filter((n) => !pySet.has(n) && !PY_HANDWRITTEN.has(n)).should.eql([], 'JS names sdv-py does not have');
      const jsSet = new Set(js);
      py.filter((n) => !jsSet.has(n)).should.eql([], 'sdv-py names JS lacks');
      for (const n of js) (typeof ns[toCamel(n)]).should.equal('function', `${toCamel(n)} missing`);
    });
  }

  for (const [family, cfg0] of Object.entries(VENDOR.families)) {
    const cfg = cfg0 ?? {};
    const upstream = yaml(`../tools/codegen/vendor/upstream/endpoints/${cfg.from ?? family}.yaml`);
    if (!upstream.module) continue; // ESPN families + leagues: the per-league tests above
    it(`${family}: every vendored endpoint carries sdv-py's name (${upstream.module})`, () => {
      const py = PY[upstream.module]?.names;
      Array.isArray(py).should.be.true(`no sdv-py module ${upstream.module} in py_public_names.json (re-run \`npm run vendor\`)`);
      const pyShorts = new Set(upstream.endpoints.map((e) => e.short));
      const js = FLAT_WRAPPERS.filter((w) => w.api === family && pyShorts.has(w.short)).map((w) => w.publicName ?? `${w.api}_${w.short}`);
      js.length.should.be.above(0, `no FLAT_WRAPPERS for ${family}`);
      js.slice().sort().should.eql(py.slice().sort());
    });
  }

  it('applies the ported rules (spot checks)', () => {
    const cases = {
      nba: {
        espn_nba_athlete_vs_athlete: 'espn_nba_player_vs_player',
        espn_nba_athlete_eventlog: 'espn_nba_player_eventlog', // compound token kept
        espn_nba_event_competitor_roster: 'espn_nba_game_team_roster',
        espn_nba_event_competition: 'espn_nba_game_competition',
        espn_nba_season_athletes: 'espn_nba_season_players',
        espn_nba_events: 'espn_nba_games',
        espn_nba_athlete_stats: 'espn_nba_player_stats_v3', // py hand-writes espn_nba_player_stats
      },
      epl: { espn_epl_athlete_stats: 'espn_epl_player_stats' }, // no py sibling: bare name
      cfb: { espn_cfb_season_futures: 'espn_cfb_futures' }, // py's curated espn_rename_map.yaml
    };
    for (const [prefix, map] of Object.entries(cases)) {
      for (const [old, now] of Object.entries(map)) ESPN_DEPRECATED_ALIASES[prefix][old].should.equal(now);
    }
    FLAT_DEPRECATED_ALIASES.nhl_api_web.nhl_api_web_boxscore.should.equal('nhl_boxscore');
    FLAT_DEPRECATED_ALIASES.nhl_api_web.nhl_api_web_pbp.should.equal('nhl_web_pbp'); // py hand-writes nhl_pbp
    FLAT_DEPRECATED_ALIASES.nfl_api.nfl_api_standings.should.equal('nfl_standings');
    FLAT_DEPRECATED_ALIASES.cbs.cbs_boxscore.should.equal('cbs_game_boxscore');
    Object.keys(FLAT_DEPRECATED_ALIASES.cbs).length.should.equal(16);
    FLAT_DEPRECATED_ALIASES.fox.fox_scoreboard.should.equal('fox_api_scoreboard'); // vendored from sdv-py fox_api
    Object.keys(FLAT_DEPRECATED_ALIASES.fox).length.should.equal(33); // the 5 dead routes keep their names
  });
});

describe('v4 naming: runtime factories match the composed surface', () => {
  it('makeLeagueModule(cfg) exposes the same names (and aliases) as sdv.<prefix>', () => {
    for (const cfg of LEAGUES) {
      const mod = makeLeagueModule(cfg);
      const camelPrefix = toCamel(`espn_${cfg.prefix}`);
      const composed = Object.keys(sdv[cfg.prefix]).filter(
        (k) => k.startsWith(`espn_${cfg.prefix}_`) || (k.startsWith(camelPrefix) && /[A-Z0-9]/.test(k[camelPrefix.length]))
      );
      Object.keys(mod).sort().should.eql(composed.sort(), `${cfg.prefix}: factory vs composed names`);
      for (const k of composed) isAlias(mod[k]).should.equal(isAlias(sdv[cfg.prefix][k]), `${cfg.prefix}.${k}`);
    }
  });

  it('makeFlatModule(defs) uses sdv-py names and registers the family aliases', () => {
    const mod = makeFlatModule(FLAT_WRAPPERS.filter((w) => w.api === 'nhl_api_web'));
    (typeof mod.nhlBoxscore).should.equal('function');
    (typeof mod.nhl_web_pbp).should.equal('function');
    mod.nhlApiWebBoxscore.replacement.should.equal('nhlBoxscore');
  });

  it('legacy service methods are not shadowed by a generated name', async () => {
    for (const svc of ['cfb', 'mbb', 'mlb', 'nba', 'ncaa', 'nfl', 'nhl', 'tennis', 'wbb', 'wnba']) {
      const mod = (await import(`../dist/services/${svc}.service.js`)).default;
      for (const [k, fn] of Object.entries(mod)) {
        if (typeof fn === 'function') sdv[svc][k].should.equal(fn, `sdv.${svc}.${k} was overwritten`);
      }
    }
  });
});

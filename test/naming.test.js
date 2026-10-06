import should from 'should';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import * as pkg from '../dist/index.js';
import { configure, resetConfig, LEAGUES, FLAT_WRAPPERS, makeLeagueModule, makeFlatModule } from '../dist/index.js';
import { ESPN_DEPRECATED_ALIASES, FLAT_DEPRECATED_ALIASES } from '../dist/generated/aliases.js';
import { resetWarnOnce } from '../dist/core/deprecation.js';
import { captureWarnings } from './helpers/warnings.mjs';

// v4 naming: JS public names are sdv-py's (tools/codegen/generate.mjs ports
// py's emit-time rename layer); every pre-v4 name stays callable as a
// deprecated alias. All offline.

const sdv = pkg.default;
const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());
const json = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const yaml = (p) => parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const PRE_V4 = json('../tools/codegen/pre_v4_names.json');
// The npm 3.0.0 tarball's surface (ground truth: what users installed).
const V3 = PRE_V4.published;
/** ns -> Set of every pre-v4 name (published 3.0.0 + the mid-program snapshot). */
const preV4Names = (ns) => new Set([...(V3.namespaces[ns] ?? []), ...(PRE_V4.namespaces[ns] ?? [])]);
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

describe('v4 naming: no name of the published 3.0.0 disappears', () => {
  it('the baseline is the npm 3.0.0 tarball', () => {
    V3.version.should.equal('3.0.0');
    V3.integrity.should.equal('sha512-SMbhkHzM2+783vI96WCzP/EOmROipR/TewUv0qYlwEutMq+SrJrRFB+tbqSC42J8wyJGnQI0mmLOq0hDAkqYoA==');
  });

  it('every 3.0.0 `sdv.<ns>.<name>` is still a function', () => {
    let n = 0;
    for (const [ns, names] of Object.entries(V3.namespaces)) {
      (typeof sdv[ns]).should.equal('object', `namespace sdv.${ns} disappeared`);
      for (const name of names) {
        (typeof sdv[ns][name]).should.equal('function', `sdv.${ns}.${name} disappeared`);
        n++;
      }
    }
    n.should.equal(7579);
  });

  it('every 3.0.0 export of both entry points is still exported', async () => {
    const parsers = await import('../dist/parsers/index.js');
    for (const name of V3.exports) (name in pkg).should.be.true(`export ${name} disappeared`);
    for (const name of V3.parsers_exports) (name in parsers).should.be.true(`sportsdataverse/parsers export ${name} disappeared`);
  });

  it('a renamed 3.0.0 name forwards to its v4 wrapper (same function) and warns once', async () => {
    configure({ transport: async (req) => ({ status: 200, headers: {}, data: {}, url: req.url }) });
    resetWarnOnce();
    const renamed = [];
    try {
      const seen = await captureWarnings(async () => {
        for (const [ns, names] of Object.entries(V3.namespaces)) {
          for (const name of names) {
            const fn = sdv[ns][name];
            if (!isAlias(fn)) continue;
            renamed.push([ns, name, fn]);
            for (let i = 0; i < 2; i++) {
              try {
                await fn();
              } catch {
                // the warning comes before the call; params and responses don't matter here
              }
            }
          }
        }
      });
      const warned = new Map();
      for (const w of seen.filter((w) => w.code === pkg.DEPRECATED_NAME_CODE)) {
        const name = w.message.slice(0, w.message.indexOf('('));
        warned.set(name, (warned.get(name) ?? 0) + 1);
      }
      for (const [ns, name, fn] of renamed) {
        isAlias(sdv[ns][fn.replacement]).should.be.false(`sdv.${ns}.${fn.replacement} (the v4 name) is itself an alias`);
        fn.deprecatedAliasOf.should.equal(sdv[ns][fn.replacement], `sdv.${ns}.${name}`);
        (warned.get(name) ?? 0).should.equal(1, `sdv.${ns}.${name} warned ${warned.get(name) ?? 0} times`);
      }
    } finally {
      resetConfig();
    }
    renamed.length.should.be.above(3000);
  });

  it("3.0.0's file-stem flat names call the same endpoint as their v4 names", async () => {
    const calls = [];
    configure({
      transport: async (req) => {
        calls.push(req.url);
        return { status: 200, headers: {}, data: {}, url: req.url };
      },
    });
    try {
      const cases = [
        ['mlb', 'mlb_api_teams', 'mlb_teams', '/api/v1/teams'],
        ['cbs', 'cbsNapiBoxscore', 'cbsGameBoxscore', '/resource/game/boxscore/12345'],
        ['fox', 'fox_bifrost_scorechip', 'fox_api_scorechip', '/scorechip/12345'],
        ['yahoo', 'yahooShangrilaLeagueInfo', 'yahooLeagueInfo', '/shangrila/leagueInfo'],
        ['recruiting', 'sports247_coaches', 'recruiting_coaches', '/rdb/v1/coaches'],
      ];
      await captureWarnings(async () => {
        for (const [ns, old, now, path] of cases) {
          calls.length = 0;
          const params = { game_id: 12345, chip_id: 12345, sport: 'nfl' };
          await sdv[ns][old](params);
          await sdv[ns][now](params);
          calls.length.should.equal(2, `${ns}.${old}`);
          calls[0].should.equal(calls[1]);
          calls[0].should.containEql(path);
          sdv[ns][old].replacement.should.equal(now);
        }
      });
    } finally {
      resetConfig();
    }
  });
});

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
    Object.keys(FLAT_DEPRECATED_ALIASES)
      .sort()
      .should.eql(['cbs', 'fox', 'mlb', 'nfl_api', 'nhl_api_web', 'recruiting', 'yahoo']);
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

  it('a legacyShort is never a current short of its family, nor shared by two defs (it would resolve wrongly)', () => {
    const current = new Set(FLAT_WRAPPERS.map((w) => `${w.api}:${w.short}`));
    const legacy = FLAT_WRAPPERS.filter((w) => w.legacyShort).map((w) => `${w.api}:${w.legacyShort}`);
    legacy.length.should.be.above(0);
    legacy.filter((k) => current.has(k)).should.eql([]);
    legacy.filter((k, i) => legacy.indexOf(k) !== i).should.eql([]);
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
      const pre = preV4Names(ns);
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
      await captureWarnings(async () => {
        (await sdv.nba.espn_nba_athlete_bio({ athlete_id: 1966 })).should.eql({ ok: true });
      });
      await sdv.nba.espnNbaPlayerBio({ athlete_id: 1966 });
      calls.length.should.equal(2);
      calls[0].should.equal(calls[1]);
      calls[0].should.containEql('/athletes/1966/bio');
    });

    it('a native (flat) alias builds the same request as its v4 wrapper', async () => {
      const def = FLAT_WRAPPERS.find((w) => w.api === 'cbs' && w.short === 'game_boxscore');
      await captureWarnings(() => sdv.cbs.cbsBoxscore(minimalParams(def)));
      await sdv.cbs.cbsGameBoxscore(minimalParams(def));
      calls.length.should.equal(2);
      calls[0].should.equal(calls[1]);
    });

    it('warns once per name per process, naming the replacement', async () => {
      resetWarnOnce(); // warn-once state is per process: start clean whatever ran before
      const seen = await captureWarnings(async () => {
        for (let i = 0; i < 3; i++) await sdv.wch.espn_wch_athlete_overview({ athlete_id: 1 });
        await sdv.wch.espnWchAthleteOverview({ athlete_id: 1 }); // the camelCase alias is its own name
        await sdv.wch.espnWchPlayerOverview({ athlete_id: 1 }); // a v4 name never warns
      });
      const ours = seen.filter((w) => /espn_?[Ww]ch_?[Aa]thlete_?[Oo]verview/.test(w.message));
      ours.length.should.equal(2);
      ours.every((w) => w.name === 'DeprecationWarning').should.be.true();
      pkg.DEPRECATED_NAME_CODE.should.equal('SDV_DEPRECATED_NAME'); // exported, to filter on
      pkg.DEPRECATED_ENDPOINT_CODE.should.equal('SDV_DEPRECATED_ENDPOINT');
      ours.every((w) => w.code === pkg.DEPRECATED_NAME_CODE).should.be.true();
      ours[0].message.should.containEql('espn_wch_player_overview');
      ours[1].message.should.containEql('espnWchPlayerOverview');
      seen.filter((w) => /espnWchPlayerOverview\(\) is deprecated/.test(w.message)).length.should.equal(0);
    });

    it('resetWarnOnce makes a name warn again (so warn-once tests do not depend on test order)', async () => {
      const call = () => sdv.wch.espn_wch_athlete_overview({ athlete_id: 1 });
      resetWarnOnce();
      (await captureWarnings(call)).length.should.equal(1);
      (await captureWarnings(call)).length.should.equal(0); // already warned in this process
      resetWarnOnce();
      (await captureWarnings(call)).length.should.equal(1);
    });
  });
});

// sdv-py hand-writes these in sportsdataverse/<lg>/<lg>_pbp.py (fetch the summary, trim, helper_<lg>_pbp),
// so py_public_names.json (the <lg>_espn_ext wrapper set) does not list them; JS ports them as-is.
const PY_PRODUCERS = new Set(['espn_nba_pbp', 'espn_wnba_pbp', 'espn_mbb_pbp', 'espn_wbb_pbp']);
const isProducer = (k) => PY_PRODUCERS.has(k) || PY_PRODUCERS.has(k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`));

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
      js.filter((n) => !pySet.has(n) && !PY_HANDWRITTEN.has(n) && !PY_PRODUCERS.has(n)).should.eql([], 'JS names sdv-py does not have');
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
    Object.keys(FLAT_DEPRECATED_ALIASES.cbs).length.should.equal(16 + 82); // + every 3.0.0 cbs_napi_* name
    FLAT_DEPRECATED_ALIASES.fox.fox_scoreboard.should.equal('fox_api_scoreboard'); // vendored from sdv-py fox_api
    Object.keys(FLAT_DEPRECATED_ALIASES.fox).length.should.equal(33 + 38); // the 5 dead routes keep their names; + 3.0.0 fox_bifrost_*
    // 3.0.0 named five families by their sdv-py file stem (generate.mjs PUBLISHED_API_STEMS)
    FLAT_DEPRECATED_ALIASES.cbs.cbs_napi_boxscore.should.equal('cbs_game_boxscore');
    FLAT_DEPRECATED_ALIASES.mlb.mlb_api_teams.should.equal('mlb_teams');
    FLAT_DEPRECATED_ALIASES.yahoo.yahoo_shangrila_league_info.should.equal('yahoo_league_info');
    FLAT_DEPRECATED_ALIASES.fox.fox_bifrost_scoreboard.should.equal('fox_api_scoreboard');
    FLAT_DEPRECATED_ALIASES.recruiting.sports247_coaches.should.equal('recruiting_coaches');
    for (const [api, n] of Object.entries({ mlb: 78, recruiting: 25, yahoo: 105 })) {
      Object.keys(FLAT_DEPRECATED_ALIASES[api]).length.should.equal(n, api);
    }
  });
});

describe('v4 naming: runtime factories match the composed surface', () => {
  it('makeLeagueModule(cfg) exposes the same names (and aliases) as sdv.<prefix>', () => {
    for (const cfg of LEAGUES) {
      const mod = makeLeagueModule(cfg);
      const camelPrefix = toCamel(`espn_${cfg.prefix}`);
      const composed = Object.keys(sdv[cfg.prefix]).filter(
        (k) =>
          !isProducer(k) &&
          (k.startsWith(`espn_${cfg.prefix}_`) || (k.startsWith(camelPrefix) && /[A-Z0-9]/.test(k[camelPrefix.length])))
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

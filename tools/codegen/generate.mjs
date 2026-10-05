// Codegen: render the cross-league ESPN wrapper table + league matrix from the
// vendored endpoint YAML (tools/codegen/endpoints/*.yaml) into:
//   - TypeScript under src/generated/          (the runtime wrapper/league tables)
//   - Markdown under docs/docs/reference/       (the per-league docs reference)
//   - JSON under docs/src/playground/           (metadata for the docs playground)
// `--check` fails (exit 1) if any committed output is stale.
//
//   node tools/codegen/generate.mjs           # write
//   node tools/codegen/generate.mjs --check    # drift gate (CI)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import { checkTransform } from "./param-transforms.mjs";
import { nowToggle } from "./now-toggle.mjs";
import {
  loadReleaseLoaders,
  loadersByLeague,
  registerLoaderModules,
  renderLoadersPage,
  renderLoadersIndexSection,
  renderLoaderOnlyIndex,
} from "./render-loaders.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const endpointsDir = join(here, "endpoints");
const schemasDir = join(here, "schemas");
const repoRoot = join(here, "..", "..");
const generatedDir = join(repoRoot, "src", "generated");
const generatedEspnDir = join(generatedDir, "espn");
const referenceRootDir = join(repoRoot, "docs", "docs");
const referenceDir = join(referenceRootDir, "reference");
const playgroundDir = join(repoRoot, "docs", "src", "playground");
const docsGeneratedDir = join(repoRoot, "docs", "src", "generated");

const FAMILY_FILES = ["espn_site_v2", "espn_core_v2", "espn_web_v3", "espn_fitt_v3", "espn_cdn"];

// Non-ESPN "flat API" families (one YAML each). These are absolute-host live
// APIs (no {sport}/{league} nesting) and are emitted into a SEPARATE
// FLAT_WRAPPERS table so the ESPN WRAPPERS table — and every invariant the ESPN
// contract tests assert over it ({sport} present, EspnFamily, scopes) — stays
// untouched.
const FLAT_API_FILES = [
  "mlb",
  "mlb_statcast",
  "nhl_api_web",
  "nhl_edge",
  "nhl_stats_rest",
  "nhl_records",
  "nfl_api",
  "odds_api",
  "recruiting",
  "sports247",
  "sports247_site_pages",
  "cbs",
  "fox",
  "yahoo_scores",
  "yahoo",
  "hockeytech",
  "torvik",
  // Subscription families (auth-gated): see NO_PLAYGROUND_FAMILIES.
  "pff_api",
  "nfl_pro",
  "kenpom",
  "bart_wbb",
  "on3",
  "asa",
  "mls_api",
  "nwsl_api",
  "nba_stats",
  "wnba_stats",
];

// Which namespace each flat-API family is documented on (mirrors
// FLAT_API_NAMESPACES in src/index.ts — keep the two in sync). The runtime
// merges each family's wrappers onto this namespace (`sdv.<prefix>.<wrapper>`).
// When the namespace IS a league (mlb/nhl/nfl), the docs put the "Native API —
// <family>" section on that league's reference page. When it is NOT a league
// (`odds` — the first cross-sport provider family), the family gets its OWN
// standalone reference page (see STANDALONE_FLAT_NAMESPACES + renderStandaloneFlatPage).
const FLAT_API_NAMESPACES = {
  mlb: "mlb",
  mlb_statcast: "mlb",
  nhl_api_web: "nhl",
  nhl_edge: "nhl",
  nhl_stats_rest: "nhl",
  nhl_records: "nhl",
  nfl_api: "nfl",
  odds_api: "odds",
  recruiting: "recruiting",
  // 247Sports (supersedes `recruiting`): two vendored stems on two hosts share
  // the standalone `sdv.sports247` namespace.
  sports247: "sports247",
  sports247_site_pages: "sports247",
  cbs: "cbs",
  fox: "fox",
  yahoo_scores: "yahoo",
  yahoo: "yahoo",
  // HockeyTech / LeagueStat — standalone provider namespace (`sdv.hockeytech`)
  // for the PWHL + junior/minor leagues (league chosen by a `league` param).
  hockeytech: "hockeytech",
  // BartTorvik T-Rank — standalone provider namespace (`sdv.torvik`) for men's
  // college basketball ratings / four-factors / game + player stats / schedule.
  torvik: "torvik",
  // Subscription families merge onto their league namespace.
  pff_api: "nfl",
  nfl_pro: "nfl",
  kenpom: "mbb",
  // Women's T-Rank (barttorvik.com/ncaaw) shares the `sdv.torvik` namespace.
  bart_wbb: "torvik",
  // On3 Recruit Database + American Soccer Analysis: standalone provider namespaces.
  on3: "on3",
  asa: "asa",
  // Official MLS / NWSL league APIs merge onto the league namespaces.
  mls_api: "mls",
  nwsl_api: "nwsl",
  // stats.nba.com / stats.wnba.com — merge onto the league namespaces
  // (sdv.nba.nba_stats_*, sdv.wnba.wnba_stats_*). TLS-impersonation transport.
  nba_stats: "nba",
  wnba_stats: "wnba",
};

// Flat families excluded from the docs playground (see renderEndpointsJson):
// sports247 + sports247_site_pages (247Sports needs the impersonating transport),
// stats.nba.com / stats.wnba.com (TLS impersonation + residential IP), and the
// subscription families, which need the caller's own credentials.
const NO_PLAYGROUND_FAMILIES = new Set([
  "nba_stats",
  "wnba_stats",
  "sports247",
  "sports247_site_pages",
  "pff_api",
  "nfl_pro",
  "kenpom",
]);

// Human-facing label + upstream-source blurb per flat-API family, shown in the
// section heading + intro line on the league reference page.
const FLAT_API_META = {
  mlb: { label: "MLB Stats API", source: "the official MLB Stats API" },
  mlb_statcast: {
    label: "Baseball Savant / Statcast",
    source: "Baseball Savant (Statcast)",
  },
  nhl_api_web: {
    label: "NHL api-web (game feed)",
    source: "the modern NHL game-feed API",
  },
  nhl_edge: {
    label: "NHL EDGE (player tracking)",
    source: "NHL EDGE player/team tracking",
  },
  nhl_stats_rest: {
    label: "NHL Stats REST",
    source: "the NHL Stats REST API",
  },
  nhl_records: {
    label: "NHL Records",
    source: "the NHL Records site API",
  },
  nfl_api: {
    label: "NFL.com Shield API",
    source: 'the NFL.com "Shield" data API',
  },
  odds_api: { label: "The Odds API", source: "the-odds-api.com" },
  recruiting: {
    label: "247Sports",
    source: "the 247Sports recruiting database",
    deprecated:
      "Every method is deprecated: `api.247sports.com` answers HTTP 500. Use " +
      "[`sdv.sports247`](./sports247) instead — each row below names its " +
      "replacement; the 13 routes without one need a logged-in 247Sports session.",
  },
  sports247: {
    label: "247Sports RDB",
    source: "the 247Sports Recruit Database (`ipa.247sports.com`)",
    // The guest JWT is minted by src/core/sports247_runtime.ts (sdv-py's YAML
    // carries no `auth: true`; its runtime mints there too).
    auth: true,
    note:
      "**Transport:** the host fingerprint-blocks plain HTTP clients, so this " +
      "family uses the browser-impersonating transport — `npm install impit` " +
      "(without it, calls reject with `TransportUnavailableError`).",
  },
  sports247_site_pages: {
    label: "247Sports site pages",
    source: "the 247sports.com `*.json` page models",
    note:
      "No auth. **Transport:** browser-impersonating (`npm install impit`), as " +
      "for `sports247`. Nested entities arrive as bare integer keys — walk each " +
      "through its own `.json` route.",
  },
  cbs: { label: "CBS Sports", source: "the CBS Sports API" },
  fox: { label: "Fox Sports", source: "the Fox Sports API" },
  yahoo_scores: {
    label: "Yahoo Sports (scores)",
    source: "the Yahoo Sports scoreboard/boxscore feed",
  },
  yahoo: {
    label: "Yahoo Sports",
    source: "the Yahoo Sports stats API",
  },
  hockeytech: {
    label: "HockeyTech / LeagueStat",
    source: "the HockeyTech / LeagueStat feed (PWHL + junior/minor hockey)",
    // Sport-specific standalone family: nests under the Hockey sport group
    // (covers the major PWHL + the junior/minor leagues), NOT generic Providers.
    sport: "hockey",
  },
  bart_wbb: {
    label: "BartTorvik women's (T-Rank)",
    source: "barttorvik.com/ncaaw (women's T-Rank)",
    sport: "basketball",
  },
  on3: { label: "On3 Recruit Database", source: "the On3 public Recruit Database (RDB)" },
  asa: { label: "American Soccer Analysis", source: "the American Soccer Analysis public API", sport: "soccer" },
  mls_api: { label: "MLS web API", source: "the official mlssoccer.com data APIs" },
  nwsl_api: { label: "NWSL (StatsPerform SDP)", source: "the official NWSL StatsPerform SDP API" },
  torvik: {
    label: "BartTorvik (T-Rank)",
    source: "barttorvik.com (T-Rank college basketball analytics)",
    // Sport-specific standalone family: nests under the Basketball sport group.
    sport: "basketball",
  },
  // Subscription families: `authNote` replaces the docs' auto-mint auth note,
  // `controls` documents the per-call auth/control params in the JSDoc.
  pff_api: {
    label: "PFF Developer API",
    source: "the PFF Developer API (api.pff.com; PFF Pro subscription)",
    authNote:
      "**Auth:** a PFF API key (PFF Pro) is required — `api_key` on the call, an " +
      "`Authorization` header in `headers`, or the `SDV_PFF_API_KEY` / `PFF_API_KEY` " +
      "environment variable. 400/422 throw `InvalidParameterError`; columns PFF " +
      "withholds by entitlement warn (or throw with `strict: true` / `SDV_PFF_STRICT=1`).",
    controls: {
      headers: "optional headers; an `Authorization` here wins over `api_key` and the environment.",
      api_key: "PFF API key (`ak_live_…`); falls back to `SDV_PFF_API_KEY` then `PFF_API_KEY`.",
      strict: "throw `AssetFetchError` (instead of warning) when PFF withholds columns; default `SDV_PFF_STRICT`.",
    },
  },
  nfl_pro: {
    label: "NFL Pro (Next Gen Stats)",
    source: "NFL Pro's secured Next Gen Stats API (pro.nfl.com; NFL+ Premium)",
    authNote:
      "**Auth:** a user-bound NFL Pro bearer token carrying an active NFL+ plan is " +
      "required — `token` on the call, or the `NFLPRO_TOKEN` environment variable. " +
      "Responses truncate at the page size, so the getter pages on `offset` until the " +
      "envelope's `total` is reached.",
    controls: {
      headers: "optional headers; an `Authorization` here wins over `token` and `NFLPRO_TOKEN`.",
      token: "NFL Pro bearer token; falls back to `NFLPRO_TOKEN`.",
      paginate: "follow `offset` until the envelope's `total` is reached (default `true`).",
      max_pages: "cap on the pages followed (default `40`); a capped result carries `_truncated: true` and warns.",
    },
  },
  kenpom: {
    label: "KenPom",
    source: "kenpom.com (subscription; HTML pages)",
    authNote:
      "**Auth:** a KenPom subscription login — `email` / `password` on the call, or the " +
      "`KENPOM_EMAIL` / `KENPOM_PW` environment variables (hoopR's `KP_USER` / `KP_PW` " +
      "also work). The session is logged in once and reused. The raw response is the " +
      "page HTML; `{ parsed: true }` returns every table on the page keyed by its HTML id.",
    controls: {
      email: "KenPom account e-mail; falls back to `KENPOM_EMAIL` / `KP_USER` / `SDV_KENPOM_EMAIL`.",
      password: "KenPom password; falls back to `KENPOM_PW` / `KENPOM_PASSWORD` / `KP_PW` / `SDV_KENPOM_PW`.",
    },
  },
  nba_stats: {
    label: "NBA Stats API (stats.nba.com)",
    source:
      "stats.nba.com (needs a TLS-impersonating transport and a residential IP)",
  },
  wnba_stats: {
    label: "WNBA Stats API (stats.wnba.com)",
    source:
      "stats.wnba.com (needs a TLS-impersonating transport and a residential IP)",
  },
};

// Per-standalone-namespace quick-start snippet shown on the generated
// standalone reference page (each provider namespace authenticates / is called
// differently, so the example is keyed by namespace). Fallback is a bare call.
const STANDALONE_NS_EXAMPLE = {
  odds:
    "// The Odds API uses a plain `apiKey` query param (you supply it):\n" +
    "await sdv.odds.oddsApiSports({ api_key: process.env.ODDS_API_KEY });\n",
  recruiting:
    "// DEPRECATED (api.247sports.com answers HTTP 500) — use sdv.sports247.\n" +
    "// 247Sports recruiting rankings (pass your own JWT via `headers`):\n" +
    "await sdv.recruiting.recruiting_rankings({\n" +
    "  sport_key: 'football', year: 2025,\n" +
    "  headers: { Authorization: `Bearer ${process.env.SPORTS247_TOKEN}` },\n" +
    "});\n",
  sports247:
    "// 247Sports: a free guest token is minted for you; needs `npm install impit`\n" +
    "// (both hosts block plain HTTP clients). sport_key 1 = football, 2 = basketball.\n" +
    "await sdv.sports247.sports247InstitutionRankings({ year: 2026, parsed: true });\n" +
    "await sdv.sports247.sports247SitePagesInstitution({ key: 24099, parsed: true });\n",
  cbs:
    "// CBS Sports is an anonymously-reachable public JSON API (no token):\n" +
    "await sdv.cbs.cbs_league({ league_id: 'football-nfl' });\n",
  fox:
    "// Fox Sports uses a public apikey + api-version query pair\n" +
    "// (both default out of the box — override apikey if you have your own):\n" +
    "await sdv.fox.fox_api_scoreboard({ sport: 'cfb' });\n",
  yahoo:
    "// Yahoo Sports is keyless but rejects requests without browser-y headers —\n" +
    "// pass Origin/Referer via `headers` (two hosts share the `yahoo` namespace):\n" +
    "await sdv.yahoo.yahoo_league_standings({\n" +
    "  league: 'ncaaf',\n" +
    "  headers: { Origin: 'https://sports.yahoo.com', Referer: 'https://sports.yahoo.com/' },\n" +
    "});\n",
  hockeytech:
    "// HockeyTech serves every league from one gateway — pick the league with\n" +
    "// the `league` param (pwhl | ahl | ohl | whl | qmjhl). Keys default in:\n" +
    "await sdv.hockeytech.hockeytech_schedule({ league: 'pwhl', parsed: true });\n",
  torvik:
    "// BartTorvik T-Rank is keyless (a browser User-Agent is set for you).\n" +
    "// `year` is the 4-digit season ending-year:\n" +
    "await sdv.torvik.torvik_ratings({ year: 2024, parsed: true });\n",
  on3:
    "// The On3 Recruit Database is keyless:\n" +
    "await sdv.on3.on3_player_profile({ person_key: 89617, parsed: true });\n",
  asa:
    "// American Soccer Analysis is keyless; league_slug is mls | nwsl | uslc | usl1 | mlsnp:\n" +
    "await sdv.asa.asa_teams({ league_slug: 'mls', parsed: true });\n",
};

// The set of league prefixes (filled after the leagues doc loads) — any
// FLAT_API_NAMESPACES value NOT in this set is a STANDALONE namespace (e.g.
// `odds`) that gets its own generated reference page instead of being attached
// to a league page. Computed lazily by `standaloneFlatNamespaces()`.
function standaloneFlatNamespaces(leagues) {
  const leaguePrefixes = new Set(leagues.map((l) => l.prefix));
  const seen = new Set();
  const out = [];
  for (const api of FLAT_API_FILES) {
    const ns = FLAT_API_NAMESPACES[api];
    if (!ns || leaguePrefixes.has(ns) || seen.has(ns)) continue;
    seen.add(ns);
    out.push(ns);
  }
  return out;
}

// A param `transform` (sdv-py runtime function name) rides into the def; an
// unknown name fails the codegen (tools/codegen/param-transforms.mjs).
const mapTransform = (ep, p) =>
  p.transform !== undefined
    ? { transform: checkTransform(p.transform, `${ep.short}.${p.name}`) }
    : {};

function mapPathParams(ep) {
  return (ep.path_params ?? []).map((p) => ({
    name: p.name,
    ...(p.required === false ? { required: false } : {}),
    ...(p.default !== undefined ? { default: p.default } : {}),
    ...(p.default_from !== undefined ? { defaultFrom: p.default_from } : {}),
    ...mapTransform(ep, p),
  }));
}

function mapQueryParams(ep) {
  return (ep.extra_params ?? []).map((p) => ({
    name: p.name,
    queryKey: p.query_key,
    ...(p.default !== undefined ? { default: p.default } : {}),
    ...mapTransform(ep, p),
  }));
}

// ---------------------------------------------------------------------------
// v4 public names: a port of sdv-py's emit-time rename layer
// ---------------------------------------------------------------------------
//
// Since v4 a JS public name equals sdv-py's for the same endpoint (snake_case;
// the camelCase form is its toCamel). Ported from sdv-py tools/codegen/
// generate.py at the vendor pin (`_convention_rename`, `_espn_league_views`,
// `_versioned_on_collision`, `resolve_name` / `_flat_views`). Inputs:
//   - espn_rename_map.yaml  sdv-py's curated ESPN renames (vendored verbatim)
//   - vendor.yaml py_reserved  py's hand-written names its rule treats as taken
//   - pre_v4_names.json     the frozen pre-v4 (3.x) public surface: every
//                           pre-v4 name a rename replaces stays callable as a
//                           deprecated alias (src/generated/aliases.ts).
//
// Divergence from py, by design: py's `drop:` list (a generated ESPN wrapper
// skipped because a hand-written py sibling serves the same endpoint under the
// canonical name) is not applied. JS has no hand-written sibling, so the
// generated wrapper is emitted under that canonical name, which is py's name.
const NAMING_MANIFEST = parse(readFileSync(join(here, "vendor.yaml"), "utf8"));
const PY_RESERVED = new Set(NAMING_MANIFEST.py_reserved ?? []);
const ESPN_RENAME_MAP = parse(readFileSync(join(here, "espn_rename_map.yaml"), "utf8")) ?? {};
const ESPN_RENAMES = ESPN_RENAME_MAP.rename ?? {};
// py `drop:` base names (`espn_wbb_event_officials`): JS emits these, under the
// name py's hand-written sibling holds, and documents that the two differ.
const ESPN_PY_DROPS = new Set(ESPN_RENAME_MAP.drop ?? []);
const PRE_V4_NAMES = Object.fromEntries(
  Object.entries(JSON.parse(readFileSync(join(here, "pre_v4_names.json"), "utf8")).namespaces).map(
    ([ns, names]) => [ns, new Set(names)]
  )
);

// py `_CONVENTION_TOKENS`: an athlete is a player, an event is a game.
const CONVENTION_TOKENS = { athlete: "player", athletes: "players", event: "game", events: "games" };

/**
 * py `_convention_rename`: the universal ESPN short rename (every league).
 * `event_competitor*` -> `game_team*`, `event_competition_X` -> `game_X`,
 * `event_competition` -> `game_competition`, then a per-`_`-token swap
 * (`athlete_vs_athlete` -> `player_vs_player`; compound tokens like `eventlog`
 * are kept: `athlete_eventlog` -> `player_eventlog`).
 */
function conventionRename(short) {
  if (short.startsWith("event_competitor")) short = "game_team" + short.slice("event_competitor".length);
  else if (short.startsWith("event_competition_")) short = "game_" + short.slice("event_competition_".length);
  else if (short === "event_competition") short = "game_competition";
  return short
    .split("_")
    .map((t) => CONVENTION_TOKENS[t] ?? t)
    .join("_");
}

// py `_ESPN_COLLISION_VERSIONED`: version-qualify (rather than skip) these when
// the convention name is taken (web v3 /athletes/{id}/stats is the "v3" payload).
const ESPN_COLLISION_VERSIONED = { athlete_stats: "player_stats_v3" };

/**
 * py `_espn_league_views` pass 2: `short -> public short` for one league. The
 * curated rename wins, else the convention rename; a name already taken (another
 * endpoint's base name, a py hand-written name, or one used earlier) is
 * version-qualified when py lists a versioned form, else the base name is kept
 * (py records it as a skipped rename).
 */
function espnLeagueNames(league, wrappers) {
  const full = (s) => `espn_${league.prefix}_${s}`;
  const applicable = wrappersForLeague(league, wrappers);
  const baseNames = new Set(applicable.map((w) => full(w.short)));
  const taken = (n, used) => baseNames.has(n) || PY_RESERVED.has(n) || used.has(n);
  const used = new Set();
  const out = new Map();
  for (const w of applicable) {
    const base = full(w.short);
    let name = base;
    const next = ESPN_RENAMES[base] ?? full(conventionRename(w.short));
    if (next !== base) {
      if (!taken(next, used)) name = next;
      else if (ESPN_COLLISION_VERSIONED[w.short] && !taken(full(ESPN_COLLISION_VERSIONED[w.short]), used)) {
        name = full(ESPN_COLLISION_VERSIONED[w.short]);
      }
    }
    if (!name.startsWith(full(""))) throw new Error(`espn_rename_map.yaml: ${base} -> ${name} leaves the espn_${league.prefix}_ namespace`);
    used.add(name);
    out.set(w.short, name.slice(full("").length));
  }
  return out;
}

/**
 * py `_flat_views`: `short -> public snake name` for one flat family. A family
 * without a py `name_pattern` (JS-only: fox, odds_api, recruiting, yahoo_scores)
 * keeps JS's `<api>_<short>`. With a `qualifier`, py's `resolve_name`: the clean
 * `<prefix>_<short>` unless taken, else `<prefix>_<qualifier>_<short>`.
 */
function flatFamilyNames(doc) {
  if (doc.name_pattern && doc.name_pattern.replace("{short}", "").includes("{")) {
    // e.g. `espn_{prefix}_{short}`: a league-bound family belongs in FAMILY_FILES.
    throw new Error(`${doc.api}: flat name_pattern ${doc.name_pattern} has a token other than {short}`);
  }
  const out = new Map();
  const used = new Set();
  for (const ep of doc.endpoints ?? []) {
    let name;
    if (!doc.name_pattern) name = `${doc.api}_${ep.short}`;
    else if (doc.qualifier) {
      const prefix = doc.name_pattern.split("_{", 1)[0];
      const clean = `${prefix}_${ep.short}`;
      name = PY_RESERVED.has(clean) || used.has(clean) ? `${prefix}_${doc.qualifier}_${ep.short}` : clean;
    } else name = doc.name_pattern.replace("{short}", ep.short);
    used.add(name);
    out.set(ep.short, name);
  }
  return out;
}

/** Display form of a flat family's naming rule for the docs (`nhl_<endpoint>`). */
const FLAT_NAME_RULE = {};

/** Pre-v4 short per flat endpoint, when JS shipped a different one (`<api>.<short>` -> legacy short). */
const FLAT_LEGACY_SHORT = new Map();

function loadWrappers() {
  const wrappers = [];
  for (const stem of FAMILY_FILES) {
    const doc = parse(readFileSync(join(endpointsDir, `${stem}.yaml`), "utf8"));
    const fileHost = doc.host;
    for (const ep of doc.endpoints ?? []) {
      const publicShort = conventionRename(ep.short);
      // sdv-py spec.load_espn_api: a family-level fixed_params merges into each
      // endpoint's (the endpoint's own keys win).
      const fixedParams = { ...(doc.fixed_params ?? {}), ...(ep.fixed_params ?? {}) };
      wrappers.push({
        short: ep.short,
        // League-independent sdv-py convention short; a league's curated /
        // collision overrides ride on its LeagueConfig `publicShorts`.
        ...(publicShort !== ep.short ? { publicShort } : {}),
        family: ep.host ?? fileHost, // per-endpoint host override (e.g. standings)
        scope: ep.scope ?? "universal",
        // sdv-py include_prefixes: a live-probed league allowlist on top of scope.
        ...(ep.include_prefixes?.length ? { includePrefixes: ep.include_prefixes } : {}),
        path: ep.path,
        pathParams: mapPathParams(ep),
        queryParams: mapQueryParams(ep),
        ...(Object.keys(fixedParams).length ? { fixedParams } : {}),
      });
    }
  }
  return wrappers;
}

// Family (file-level) host per flat api stem — the `flatHosts` base URL, which
// a per-endpoint `host` override (e.g. Yahoo's editorial routes) never replaces.
const FLAT_FAMILY_HOSTS = {};

/**
 * Load the flat-API wrappers (one `WrapperDef` per endpoint across every
 * FLAT_API_FILES YAML). Each carries `flat: true`, the family `api` stem, the
 * absolute `host`, and its `parser` name — threaded into FLAT_WRAPPERS in
 * src/generated/wrappers.ts.
 */
function loadFlatWrappers() {
  const wrappers = [];
  for (const stem of FLAT_API_FILES) {
    const doc = parse(readFileSync(join(endpointsDir, `${stem}.yaml`), "utf8"));
    FLAT_FAMILY_HOSTS[doc.api] = doc.host;
    // A top-level `auth: true` on the family YAML (e.g. nfl_api) flags every
    // emitted wrapper so the flat dispatch resolves a bearer-token header set
    // before fetching (see AUTH_HEADER_PROVIDERS in src/leagues/_make_flat.ts).
    const auth = doc.auth === true || FLAT_API_META[doc.api]?.auth === true;
    const names = flatFamilyNames(doc);
    FLAT_NAME_RULE[doc.api] = doc.name_pattern
      ? `\`${doc.name_pattern.replace("{short}", "<endpoint>")}\`` +
        (doc.qualifier
          ? ` (\`${doc.name_pattern.split("_{", 1)[0]}_${doc.qualifier}_<endpoint>\` where sdv-py's name is taken)`
          : "")
      : `\`${doc.api}_<endpoint>\``;
    for (const ep of doc.endpoints ?? []) {
      if (ep.legacy_short) FLAT_LEGACY_SHORT.set(`${doc.api}.${ep.short}`, ep.legacy_short);
      // An overlay addition may pin its pre-v4 name (`public_name`, see vendor.yaml).
      const publicName = ep.public_name ?? names.get(ep.short);
      wrappers.push({
        short: ep.short,
        // sdv-py's public name, when it isn't JS's pre-v4 `<api>_<short>`.
        ...(publicName !== `${doc.api}_${ep.short}` ? { publicName } : {}),
        // Pre-v4 short (CBS): lookups by short (playground share links, the
        // docs proxy) still resolve it to this def.
        ...(ep.legacy_short ? { legacyShort: ep.legacy_short } : {}),
        flat: true,
        api: doc.api,
        host: ep.host ?? doc.host, // per-endpoint host override (e.g. Yahoo editorial)
        scope: "universal",
        path: ep.path,
        // sdv-py `now_variant`/`now_toggle`: alternate path used when the
        // toggle path param is absent (NHL api-web `/now` vs dated paths).
        ...(ep.now_variant ? { nowVariant: ep.now_variant, nowToggle: nowToggle(ep) } : {}),
        pathParams: mapPathParams(ep),
        queryParams: mapQueryParams(ep),
        ...(ep.parser ? { parser: ep.parser } : {}),
        ...(ep.returns_schema ? { returnsSchema: ep.returns_schema } : {}),
        ...(auth ? { auth: true } : {}),
        ...(ep.deprecated ? { deprecated: String(ep.deprecated) } : {}),
      });
    }
  }
  return wrappers;
}

function loadLeaguesDoc() {
  return parse(readFileSync(join(endpointsDir, "leagues.yaml"), "utf8"));
}

function loadLeagues(doc) {
  return (doc.leagues ?? []).map((l) => ({
    prefix: l.prefix,
    sport: l.sport,
    league: l.league,
    scopes: l.scopes,
    ...(l.league_param ? { leagueParam: true } : {}),
  }));
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Wrappers applicable to a league = those whose scope is in the league's scopes
 * and, when the wrapper carries an `includePrefixes` allowlist, that list it.
 */
function wrappersForLeague(league, wrappers) {
  const scopes = new Set(league.scopes);
  return wrappers.filter(
    (w) => scopes.has(w.scope) && (!w.includePrefixes || w.includePrefixes.includes(league.prefix))
  );
}

const SCOPE_ORDER = ["universal", "ncaa", "football", "mlb"];
const SCOPE_LABEL = {
  universal: "Universal",
  ncaa: "NCAA",
  football: "Football",
  mlb: "MLB",
};

// Deterministic display order + human label for the sport groups in the
// generated reference sidebar (docs/src/generated/reference-sidebar.js). Any
// sport seen in leagues.yaml that ISN'T listed here is appended alphabetically
// after these — so a brand-new sport auto-surfaces with no edit here.
const SPORT_ORDER = ["basketball", "football", "baseball", "hockey", "soccer", "cricket"];
const SPORT_LABEL = {
  basketball: "Basketball",
  football: "Football",
  baseball: "Baseball",
  hockey: "Hockey",
  soccer: "Soccer",
  cricket: "Cricket",
};
const sportLabel = (s) =>
  SPORT_LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

/** Human-relative HTTP path for a league (slugs substituted; leagueParam keeps `{league}`). */
function displayPath(wrapper, league) {
  let p = wrapper.path.replace("{sport}", league.sport);
  if (!league.leagueParam) p = p.replace("{league}", league.league);
  return p;
}

// ---------------------------------------------------------------------------
// Written ESPN source modules (ALL leagues)
// ---------------------------------------------------------------------------
//
// Every ESPN league is emitted as WRITTEN, documented source: one
// `src/generated/espn/<prefix>.ts` module per league, with an explicit
// `export const` (+ rich JSDoc) per wrapper, composed in src/index.ts via the
// generated `src/generated/espn/index.ts` barrel (NOT the runtime
// makeLeagueModule factory). The written modules call the SAME
// `callWrapper(def, CFG, params)` core, so they resolve URLs identically — and
// TypeScript / TypeDoc / IDEs now see every wrapper as real source.
//
// Populated from the loaded league matrix after `leagues` is read (below), so a
// new league in leagues.yaml auto-gets a written module with no edit here.
let WRITTEN_ESPN_LEAGUES = [];

// site.api.espn.com host families — a short human label for the one-line JSDoc
// summary (e.g. "NBA — scoreboard (ESPN site.api.espn.com)").
const ESPN_FAMILY_LABEL = {
  site_v2: "ESPN site.api.espn.com",
  site_v2_alt: "ESPN site.api.espn.com (v2)",
  web_v3: "ESPN site.web.api.espn.com (web v3)",
  core_v2: "ESPN sports.core.api.espn.com (core v2)",
  fitt_v3: "ESPN site.web.api.espn.com (FPI, fitt v3)",
  cdn: "ESPN cdn.espn.com (espn.com page data)",
};

// Absolute host roots per ESPN family (mirrors HOSTS in src/core/client.ts) —
// used to render the full `GET <url>` endpoint line in each wrapper's JSDoc.
const ESPN_FAMILY_HOST = {
  site_v2: "https://site.api.espn.com/apis/site/v2/sports",
  site_v2_alt: "https://site.api.espn.com/apis/v2/sports",
  web_v3: "https://site.web.api.espn.com/apis/common/v3/sports",
  core_v2: "https://sports.core.api.espn.com/v2/sports",
  fitt_v3: "https://site.web.api.espn.com/apis/fitt/v3/sports",
  cdn: "https://cdn.espn.com/core",
};

/** The `?k=v` string of a wrapper's constant query params (the CDN's `xhr=1`), or "". */
const fixedQuery = (w) =>
  w.fixedParams ? `?${Object.entries(w.fixedParams).map(([k, v]) => `${k}=${v}`).join("&")}` : "";

// Shorts whose `parsed` result is the summary dispatcher's (they take `section`);
// mirrors SECTIONED_ENDPOINTS in src/parsers/espn.ts.
const SECTIONED_SHORTS = new Set(["summary", "cdn_playbyplay", "cdn_boxscore"]);

/** Humanize a wrapper `short` for the JSDoc summary (`athlete_gamelog` -> `athlete gamelog`). */
function humanizeShort(short) {
  return short.replace(/_/g, " ");
}

/**
 * Render one WRITTEN ESPN source module for a league (`src/generated/espn/
 * <prefix>.ts`). Every wrapper in the league's scopes becomes an explicit
 * `export const <camel>: WrapperFn` (calling the shared `callWrapper` core with
 * a module-private `CFG` + the inlined def), carrying a rich JSDoc block, plus a
 * snake_case alias `export const <snake> = <camel>`. The `CFG` const is NOT
 * exported, so `import * as m from './<prefix>.js'` yields only functions.
 */
function renderWrittenEspnModule(league, wrappers) {
  const applicable = wrappersForLeague(league, wrappers).slice().sort((a, b) =>
    a.short.localeCompare(b.short)
  );
  const prefixUpper = league.prefix.toUpperCase();
  const cfgLiteral = JSON.stringify(
    {
      prefix: league.prefix,
      sport: league.sport,
      league: league.league,
      scopes: league.scopes,
      ...(league.leagueParam ? { leagueParam: true } : {}),
      ...(league.publicShorts ? { publicShorts: league.publicShorts } : {}),
    },
    null,
    2
  );

  let body =
    "// AUTO-GENERATED by tools/codegen/generate.mjs — do not edit by hand.\n" +
    "// Run `npm run codegen` to regenerate from tools/codegen/endpoints/*.yaml.\n" +
    "//\n" +
    `// WRITTEN ESPN wrapper module for \`sdv.${league.prefix}\` (phased proof —\n` +
    "// basketball is emitted as documented source instead of being materialized at\n" +
    "// runtime by makeLeagueModule). Each export calls the shared `callWrapper`\n" +
    "// core with the module-private `CFG` below, so URLs resolve identically to the\n" +
    "// runtime-factory path. The non-basketball leagues still use the factory.\n\n" +
    'import { callWrapper } from "../../core/espn.js";\n' +
    'import type { LeagueConfig, WrapperDef, WrapperFn } from "../../core/types.js";\n\n' +
    `/** Module-private league binding for \`${league.prefix}\` (not exported). */\n` +
    `const CFG: LeagueConfig = ${cfgLiteral};\n`;

  for (const w of applicable) {
    const snake = espnSnake(league, w);
    const camel = toCamel(snake);
    const familyLabel = ESPN_FAMILY_LABEL[w.family] ?? "ESPN";
    const host = ESPN_FAMILY_HOST[w.family] ?? "";
    const httpPath = displayPath(w, league);
    const summary = `${prefixUpper} — ${humanizeShort(espnPublicShort(league, w))} (${familyLabel}).`;

    // The def is hoisted to a module-level const (allocated ONCE at module load,
    // not freshly per call) — the same object the runtime factory passes to
    // callWrapper. Const name is unique per module (shorts are unique per league).
    const defConst = `${w.short.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_DEF`;
    const defLiteral = JSON.stringify(
      {
        short: w.short,
        family: w.family,
        scope: w.scope,
        path: w.path,
        pathParams: w.pathParams,
        queryParams: w.queryParams,
        ...(w.fixedParams ? { fixedParams: w.fixedParams } : {}),
      },
      null,
      2
    );

    // The `summary` endpoint is the Site v2 dispatcher: `{ parsed: true }` yields
    // an object of all sub-frames, and `section` narrows to one named sub-frame.
    const isSummary = SECTIONED_SHORTS.has(w.short);

    // JSDoc: summary, endpoint URL, @param per path/query param (+ parsed, +
    // section for the summary dispatcher), @returns, @example.
    let jsdoc = `/**\n * ${summary}\n *\n`;
    jsdoc += ` * **Endpoint:** \`GET ${host}${httpPath}${fixedQuery(w)}\`\n`;
    const pyNote = pyHandwrittenNote(league, w);
    if (pyNote) jsdoc += ` *\n * Note: ${pyNote}\n`;
    if (league.leagueParam) {
      jsdoc +=
        ` *\n * @param params.league - ESPN league slug override ` +
        `(default \`${league.league}\`).\n`;
    } else {
      jsdoc += ` *\n`;
    }
    for (const p of w.pathParams) {
      const req = p.required === false ? " *(optional)*" : "";
      jsdoc += ` * @param params.${p.name} - path parameter${req}.\n`;
    }
    for (const p of w.queryParams) {
      const note = p.queryKey && p.queryKey !== p.name ? ` (ESPN \`${p.queryKey}\`)` : "";
      const def = p.default !== undefined ? ` — default \`${p.default}\`` : "";
      jsdoc += ` * @param params.${p.name} - query parameter${note}${def}.\n`;
    }
    jsdoc +=
      ` * @param params.parsed - when \`true\`, route the payload through this ` +
      `endpoint's tidy.js parser and return rows instead of raw JSON.\n`;
    if (isSummary) {
      jsdoc +=
        ` * @param params.section - (with \`parsed: true\`) return just one named ` +
        `sub-frame (e.g. \`boxscore\`, \`plays\`, \`winprobability\`) instead of the ` +
        `object of all summary sub-frames.\n`;
    }
    jsdoc +=
      ` * @returns Raw ESPN JSON by default; a tidy array of row objects when ` +
      `called with \`{ parsed: true }\`` +
      `${isSummary ? " (an object of sub-frames, or the chosen `section`)" : ""}.\n`;
    const exampleArgs = w.pathParams.length
      ? `{ ${w.pathParams
          .filter((p) => p.required !== false)
          .map((p) => `${p.name}: '…'`)
          .join(", ")} }`
      : "{}";
    jsdoc += ` * @example await sdv.${league.prefix}.${camel}(${exampleArgs});\n */\n`;

    body += `\nconst ${defConst}: WrapperDef = ${defLiteral};\n`;
    body += jsdoc;
    body += `export const ${camel}: WrapperFn = (params = {}) =>\n`;
    body += `  callWrapper(${defConst}, CFG, params);\n`;
    body += `/** snake_case alias of {@link ${camel}} (py/R parity). */\n`;
    body += `export const ${snake} = ${camel};\n`;
  }

  return body;
}

// ---------------------------------------------------------------------------
// TypeScript generation (runtime tables)
// ---------------------------------------------------------------------------

const TS_HEADER =
  "// AUTO-GENERATED by tools/codegen/generate.mjs — do not edit by hand.\n" +
  "// Run `npm run codegen` to regenerate from tools/codegen/endpoints/*.yaml.\n\n";

function renderTs(importType, name, data) {
  // The const is annotated, so the array's string literals are contextually
  // typed to the Scope / EspnFamily unions — no casts needed.
  return (
    TS_HEADER +
    `import type { ${importType} } from "../core/types.js";\n\n` +
    `export const ${name}: ${importType}[] = ${JSON.stringify(data, null, 2)};\n`
  );
}

// ---------------------------------------------------------------------------
// Docs reference generation (one Markdown page per league)
// ---------------------------------------------------------------------------

const DOCS_NOTE =
  "{/* AUTO-GENERATED by tools/codegen/generate.mjs — do not edit by hand. */}\n" +
  "{/* Run `npm run codegen` to regenerate from tools/codegen/endpoints/*.yaml. */}\n";

/** Render the params cell for a wrapper's path params (required marked with *). */
function pathParamsCell(wrapper) {
  if (!wrapper.pathParams.length) return "—";
  return wrapper.pathParams
    .map((p) => {
      const req = p.required === false ? "" : "\\*";
      return `\`${p.name}\`${req}`;
    })
    .join(", ");
}

/** Render the query params cell (call-name -> ESPN key shown when they differ). */
function queryParamsCell(wrapper) {
  if (!wrapper.queryParams.length) return "—";
  return wrapper.queryParams
    .map((p) =>
      p.queryKey && p.queryKey !== p.name
        ? `\`${p.name}\` → \`${p.queryKey}\``
        : `\`${p.name}\``
    )
    .join(", ");
}

/** Canonical camelCase wrapper name (espn_nba_scoreboard -> espnNbaScoreboard). */
function wrapperName(prefix, short) {
  return `espn_${prefix}_${short}`.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());
}

/** snake_case -> camelCase (e.g. `mlb_teams` -> `mlbTeams`). */
function toCamel(s) {
  return s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());
}

// prefix -> Map(short -> public short), filled by `espnLeagueNames` once the
// leagues load (before anything renders).
const ESPN_PUBLIC = new Map();
/** A wrapper's v4 public short on a league (`athlete_stats` -> `player_stats_v3`). */
const espnPublicShort = (league, w) => ESPN_PUBLIC.get(league.prefix).get(w.short);
/** A wrapper's v4 snake_case name on a league (`espn_nba_player_stats_v3`). */
const espnSnake = (league, w) => `espn_${league.prefix}_${espnPublicShort(league, w)}`;
/** A flat wrapper's v4 snake_case name (`nhl_boxscore`). */
const flatSnake = (w) => w.publicName ?? `${w.api}_${w.short}`;

// Deprecated pre-v4 names (`old snake -> new snake`), filled by `computeAliases`:
// ESPN keyed by league prefix, flat keyed by api stem.
const ALIASES = { espn: {}, flat: {} };
/** `old snake -> new snake` aliases that point at `snake` in a table. */
const aliasesOf = (table, snake) =>
  Object.entries(table ?? {})
    .filter(([, now]) => now === snake)
    .map(([old]) => old);
/** Docs line naming a wrapper's deprecated pre-v4 aliases ("" when none). */
function deprecatedNote(olds) {
  if (!olds.length) return "";
  const list = olds.map((o) => `\`${o}\` / \`${toCamel(o)}\``).join(", ");
  return `**Deprecated aliases (pre-v4 names, still callable):** ${list}\n\n`;
}
/**
 * One-line note for a wrapper py `drop:`s in favour of a hand-written py
 * function of the same name ("" otherwise): the names match, the calls don't.
 */
function pyHandwrittenNote(league, w) {
  if (!ESPN_PY_DROPS.has(`espn_${league.prefix}_${w.short}`)) return "";
  return (
    `sdv-py's \`${espnSnake(league, w)}\` is a hand-written function (its own params, a parsed frame); ` +
    `this is the generated raw ESPN wrapper for the same endpoint, so params and output differ.`
  );
}

/** Flat wrappers belonging to a given league prefix (via FLAT_API_NAMESPACES). */
function flatWrappersForLeague(prefix, flatWrappers) {
  return flatWrappers.filter((w) => FLAT_API_NAMESPACES[w.api] === prefix);
}

/** Render the parser cell for a flat wrapper (raw JSON passthrough when none). */
// Multi-table flat parsers (default sub-frame + valid `section` names), from
// endpoints/flat_parser_sections.yaml; a test keeps it equal to the runtime.
const FLAT_PARSER_SECTIONS =
  parse(readFileSync(join(endpointsDir, "flat_parser_sections.yaml"), "utf8"))?.parsers ?? {};

function flatParserCell(wrapper) {
  if (!wrapper.parser) return "*(raw)*";
  const spec = FLAT_PARSER_SECTIONS[wrapper.parser];
  if (!spec) return `\`${wrapper.parser}\``;
  // `default: null` = every table as a dict (sdv-py's shape); `sections: null` =
  // the payload names its tables (`dynamic` says how).
  const dflt = spec.default === null ? " (default: every table, as a dict)" : "";
  if (!spec.sections) return `\`${wrapper.parser}\` — multi-table${dflt}: \`section\` = ${spec.dynamic}`;
  const names = spec.sections.map((s) => (s === spec.default ? `\`${s}\` (default)` : `\`${s}\``));
  return `\`${wrapper.parser}\` — multi-table${dflt}: \`section\` = ${names.join(", ")}`;
}

// In-process cache so each `returns_schema` YAML is read + parsed at most once.
const _schemaCache = new Map();

/**
 * Load a returns-schema's `columns` for a `returns_schema` value (e.g.
 * `native/mlb/boxscore` or `autodoc/mlb/mlb_statcast_search`), resolved
 * under tools/codegen/schemas/. Returns the column list (`[{name, type,
 * description}]`) or `null` when the file is missing / has no columns. The
 * parsed result is cached so repeated lookups across pages are cheap.
 */
function loadReturnsColumns(returnsSchema) {
  if (!returnsSchema) return null;
  if (_schemaCache.has(returnsSchema)) return _schemaCache.get(returnsSchema);
  const file = join(schemasDir, `${returnsSchema}.yaml`);
  let columns = null;
  if (existsSync(file)) {
    const doc = parse(readFileSync(file, "utf8"));
    if (Array.isArray(doc?.columns) && doc.columns.length) columns = doc.columns;
  }
  _schemaCache.set(returnsSchema, columns);
  return columns;
}

/**
 * A flat endpoint's returns schema for the docs: `{ columns }` (one table),
 * `{ frames: [{ section, columns }] }` (`kind: frames`, one table per key of the
 * parser's dict), `{ unverified }` (sdv-py publishes no columns, and says why),
 * or `null` (no schema file, or no columns). vendor.mjs checkSchemaShape has
 * already refused any other shape.
 */
const _flatSchemaCache = new Map();
function loadReturnsSchema(returnsSchema) {
  if (!returnsSchema) return null;
  if (_flatSchemaCache.has(returnsSchema)) return _flatSchemaCache.get(returnsSchema);
  const file = join(schemasDir, `${returnsSchema}.yaml`);
  let out = null;
  if (existsSync(file)) {
    const doc = parse(readFileSync(file, "utf8"));
    if (typeof doc?.unverified === "string") out = { unverified: doc.unverified };
    else if (doc?.kind === "frames" && doc.frames?.some((f) => f.columns?.length)) out = { frames: doc.frames };
    else if (Array.isArray(doc?.columns) && doc.columns.length) out = { columns: doc.columns };
  }
  _flatSchemaCache.set(returnsSchema, out);
  return out;
}

/** Render a flat endpoint's `### Returns` block (one table, one per frame, or the unverified note). */
function renderFlatReturns(label, schema) {
  if (schema.columns) return renderReturnsTable(label, schema.columns);
  if (schema.unverified) {
    return `\n### Returns — ${label}\n\nNo returns table is published for this endpoint: ${escapeCell(schema.unverified).replace(/[{}<>]/g, (c) => `\\${c}`)}\n`;
  }
  let out = `\n### Returns — ${label}\n\nWith \`{ parsed: true }\`: an object of tables, one per key below.\n`;
  for (const f of schema.frames) {
    out += `\n**\`${escapeCell(f.section)}\`**${f.columns.length ? "" : " — no columns in the reference capture"}\n\n`;
    if (f.columns.length) out += renderColumnsTable(f.columns);
  }
  return out;
}

/** Escape `|` (and stray backticks-balance is left as-is) for a markdown table cell. */
function escapeCell(text) {
  return String(text ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

/**
 * Render a `### Returns — <label>` subsection: a `col_name | type | description`
 * table built from a returns-schema's columns. `label` is the wrapper's
 * display name (already backtick-wrapped by the caller). Returns "" when the
 * schema resolves to no columns (caller then skips emitting anything).
 */
function renderReturnsTable(label, columns) {
  if (!columns || !columns.length) return "";
  let out = `\n### Returns — ${label}\n\n`;
  out += `| col_name | type | description |\n`;
  out += `|---|---|---|\n`;
  for (const c of columns) {
    const desc = c.description ? escapeCell(c.description) : "";
    out += `| \`${escapeCell(c.name)}\` | ${escapeCell(c.type)} | ${desc} |\n`;
  }
  return out;
}

// Hand-written Baseball Savant / Statcast wrappers (src/leagues/
// mlb_statcast_extra.ts) — not in any endpoint YAML, so they never reach
// FLAT_WRAPPERS / the native table. We still document their returns frames from
// the committed autodoc schemas. Keyed: dual-case display name -> autodoc schema.
const STATCAST_HANDWRITTEN = [
  { snake: "mlb_statcast_search", schema: "autodoc/mlb/mlb_statcast_search" },
  { snake: "mlb_statcast_search_minors", schema: "autodoc/mlb/mlb_statcast_search_minors" },
  { snake: "mlb_statcast_search_wbc", schema: "autodoc/mlb/mlb_statcast_search_wbc" },
  { snake: "mlb_statcast_player", schema: "autodoc/mlb/mlb_statcast_player" },
];

/**
 * Render the "Native API — <family>" reference sections for a league. Each flat
 * family that maps to this league prefix gets a clearly-headed section after the
 * ESPN endpoints: an intro line (host + source + auth note) and a table of every
 * wrapper (dual-case name, absolute host + path, path/query params, parser,
 * auth). Returns "" when the league has no flat families.
 */
/**
 * Render a single "Native API — <family>" section: the intro line (host +
 * source + auth note), the wrapper table, and per-wrapper `Returns` tables.
 * `nsPrefix` is the `sdv.<prefix>` the family merges onto (a league prefix, or a
 * standalone namespace like `odds`). Shared by `renderNativeSections` (league
 * pages) and `renderStandaloneFlatPage` (the standalone `odds` page).
 */
function renderNativeFamilySection(api, rows, nsPrefix) {
  if (!rows.length) return "";
  const meta = FLAT_API_META[api] ?? { label: api, source: api };
  const host = FLAT_FAMILY_HOSTS[api] ?? rows[0].host;
  const authed = rows.some((w) => w.auth);
  let body = `\n## Native API — ${meta.label}\n\n`;
  body +=
    `Flat (non-ESPN) wrappers for ${meta.source}. ` +
    `Host: \`${host}\`. ` +
    `Each method is exposed under BOTH its snake_case name ${FLAT_NAME_RULE[api]} ` +
    `(sdv-py's name, py/R parity) and its camelCase form (canonical) on ` +
    `\`sdv.${nsPrefix}\`. Pass \`{ parsed: true }\` to run the payload ` +
    `through its tidy.js parser; omit it for the raw response.`;
  if (rows.some((w) => FLAT_PARSER_SECTIONS[w.parser])) {
    body +=
      ` Endpoints marked **multi-table** parse to several frames in sdv-py; with ` +
      `\`parsed: true\` they return the default shown in the Parser column (one sub-frame, or every table as a dict), ` +
      `and \`section: "<name>"\` selects any other (an unknown name throws, listing the valid ones).`;
  }
  if (authed) {
    body +=
      " " +
      (meta.authNote ??
        "**Auth:** this family mints a bearer token automatically before " +
          "each call (no credentials required).");
  }
  if (meta.note) body += ` ${meta.note}`;
  if (meta.deprecated) body += `\n\n:::warning Deprecated\n\n${meta.deprecated}\n\n:::`;
  body += `\n\n`;
  body += `| Method | HTTP | Path params | Query params | Parser | Auth |\n`;
  body += `|---|---|---|---|---|---|\n`;
  const sorted = rows.slice().sort((a, b) => a.short.localeCompare(b.short));
  for (const w of sorted) {
    const snake = flatSnake(w);
    const was = aliasesOf(ALIASES.flat[api], snake).map((o) => `\`${o}\``).join(", ");
    const method =
      `\`${snake}\` / \`${toCamel(snake)}\`${was ? ` *(was ${was})*` : ""}` +
      (w.deprecated ? ` — **deprecated:** ${escapeCell(w.deprecated)}` : "");
    const http = `\`${w.host}${w.path}\``;
    const auth = w.auth ? "yes" : "—";
    body += `| ${method} | ${http} | ${pathParamsCell(w)} | ${queryParamsCell(w)} | ${flatParserCell(w)} | ${auth} |\n`;
  }
  // Per-wrapper `Returns` blocks (one `### Returns — <wrapper>` per endpoint
  // whose `returns_schema` resolves to a committed schema: one table, one per
  // frame of a `kind: frames` schema, or sdv-py's `unverified` reason).
  // Endpoints with no schema (raw-JSON / generic-list passthroughs) emit none.
  for (const w of sorted) {
    const schema = loadReturnsSchema(w.returnsSchema);
    if (!schema) continue;
    const snake = flatSnake(w);
    body += renderFlatReturns(`\`${snake}\` / \`${toCamel(snake)}\``, schema);
  }
  // The Statcast family additionally exposes hand-written search / player
  // wrappers (not in the YAML); document their returns frames from autodoc.
  if (api === "mlb_statcast") {
    for (const hw of STATCAST_HANDWRITTEN) {
      const cols = loadReturnsColumns(hw.schema);
      if (!cols) continue;
      const camel = toCamel(hw.snake);
      body += renderReturnsTable(`\`${hw.snake}\` / \`${camel}\``, cols);
    }
  }
  return body;
}

/**
 * Render the "Native API — <family>" reference sections for a league. Each flat
 * family that maps to this league prefix gets a clearly-headed section after the
 * ESPN endpoints. Returns "" when the league has no flat families.
 */
function renderNativeSections(league, flatWrappers) {
  const families = FLAT_API_FILES.filter(
    (api) => FLAT_API_NAMESPACES[api] === league.prefix
  );
  let body = "";
  for (const api of families) {
    const rows = flatWrappers.filter((w) => w.api === api);
    body += renderNativeFamilySection(api, rows, league.prefix);
  }
  return body;
}

/**
 * Render a standalone reference page for a flat-API namespace that is NOT a
 * league (e.g. `odds` — The Odds API, the first cross-sport provider family).
 * Mirrors a league page's frontmatter + intro, then renders each family's
 * "Native API" section via the shared helper. Returns the full markdown page.
 */
function renderStandaloneFlatPage(ns, position, flatWrappers) {
  const families = FLAT_API_FILES.filter((api) => FLAT_API_NAMESPACES[api] === ns);
  const rowsByApi = families.map((api) => ({
    api,
    rows: flatWrappers.filter((w) => w.api === api),
  }));
  const total = rowsByApi.reduce((n, f) => n + f.rows.length, 0);
  const labels = families.map((api) => (FLAT_API_META[api] ?? { label: api }).label);
  // Sport-specific standalone families (torvik->basketball, hockeytech->hockey)
  // nest under their sport in the sidebar; cross-sport providers don't.
  const nsSport = flatNamespaceSport(ns);
  const nsKind = nsSport ? `${sportLabel(nsSport)} provider` : "cross-sport provider";

  let body =
    `---\n` +
    `title: ${ns}\n` +
    `sidebar_label: ${ns}\n` +
    `sidebar_position: ${position}\n` +
    `---\n\n` +
    DOCS_NOTE +
    `\n# \`${ns}\` — native provider reference\n\n` +
    `- **namespace:** \`sdv.${ns}\` *(standalone — not an ESPN league)*\n` +
    `- **families:** ${labels.map((l) => `${l}`).join(", ")}\n` +
    `- **wrappers:** ${total} native\n\n` +
    `\`${ns}\` is a ${nsKind} namespace (no ESPN \`{sport}\`/\`{league}\` ` +
    `nesting). Every method is exposed under BOTH its snake_case name ` +
    `(\`<family>_<endpoint>\`, py/R parity) and a camelCase canonical name ` +
    `(\`<family><Endpoint>\`) on \`sdv.${ns}\`. Pass \`{ parsed: true }\` to any ` +
    `endpoint to get tidy rows instead of raw JSON.\n\n` +
    "```js\n" +
    `import sdv from 'sportsdataverse';\n\n` +
    STANDALONE_NS_EXAMPLE[ns] +
    "```\n";

  for (const { api, rows } of rowsByApi) {
    body += renderNativeFamilySection(api, rows, ns);
  }
  return body;
}

function renderLeaguePage(league, wrappers, position, flatWrappers = []) {
  const applicable = wrappersForLeague(league, wrappers);
  const flatApplicable = flatWrappersForLeague(league.prefix, flatWrappers);
  const scoreboard = wrapperName(league.prefix, "scoreboard");
  const callExample = league.leagueParam
    ? `await sdv.${league.prefix}.${scoreboard}({ league: '${league.league}' });`
    : `await sdv.${league.prefix}.${scoreboard}({});`;
  const nativeNote = flatApplicable.length
    ? ` This league also ships **${flatApplicable.length}** native (non-ESPN) ` +
      `API wrappers — see the **Native API** sections below.`
    : "";

  let body =
    `---\n` +
    `title: ${league.prefix}\n` +
    `sidebar_label: ${league.prefix}\n` +
    `sidebar_position: ${position}\n` +
    `---\n\n` +
    DOCS_NOTE +
    `\n# \`${league.prefix}\` — ESPN reference\n\n` +
    `- **sport slug:** \`${league.sport}\`\n` +
    `- **league slug:** \`${league.league}\`${league.leagueParam ? " *(default; override with a `league` param)*" : ""}\n` +
    `- **scopes:** ${league.scopes.map((s) => `\`${s}\``).join(", ")}\n` +
    `- **wrappers:** ${applicable.length}${flatApplicable.length ? ` *(+ ${flatApplicable.length} native)*` : ""}\n\n` +
    `Every endpoint is called as \`sdv.${league.prefix}.${scoreboard.replace("Scoreboard", "<Endpoint>")}(params)\`. ` +
    `Each method is also available under its snake_case name ` +
    `(\`espn_${league.prefix}_<endpoint>\`) for parity with the Python / R packages. ` +
    `Parameters accept snake_case or camelCase. Required path params are marked \\*.` +
    `${nativeNote}\n\n` +
    "```js\n" +
    `import sdv from 'sportsdataverse';\n\n` +
    `${callExample}\n` +
    "```\n";

  for (const scope of SCOPE_ORDER) {
    if (!league.scopes.includes(scope)) continue;
    const rows = applicable.filter((w) => w.scope === scope);
    if (!rows.length) continue;
    body += `\n## ${SCOPE_LABEL[scope]} endpoints\n\n`;
    body += `| Method | HTTP | Path params | Query params |\n`;
    body += `|---|---|---|---|\n`;
    for (const w of rows.sort((a, b) => a.short.localeCompare(b.short))) {
      const method = `\`${toCamel(espnSnake(league, w))}\``;
      const http = `\`${w.family}\` \`${displayPath(w, league)}\``;
      body += `| ${method} | ${http} | ${pathParamsCell(w)} | ${queryParamsCell(w)} |\n`;
    }
  }

  // Pointer to the shared parsed-returns reference (every endpoint above accepts
  // `{ parsed: true }`; columns are parser-determined, documented once there).
  body +=
    `\n> **Parsed output:** pass \`{ parsed: true }\` to any endpoint above to get ` +
    `tidy rows instead of raw JSON. The columns are determined by each endpoint's ` +
    `parser — see [ESPN parsed returns](./espn-parsed-returns) for the full column ` +
    `reference (and the \`summary\` dispatcher's 21 sub-frames).\n`;

  // Flat (non-ESPN) "Native API — <family>" sections, after the ESPN scopes.
  body += renderNativeSections(league, flatWrappers);

  return body;
}

// ---------------------------------------------------------------------------
// Per-function reference docs (sdv-py-style per-league dir) — basketball proof
// ---------------------------------------------------------------------------
//
// For the WRITTEN_ESPN_LEAGUES (basketball), the flat `reference/<prefix>.md`
// page is replaced by a per-league directory that mirrors sdv-py:
//   docs/docs/<prefix>/index.md                — league landing page
//   docs/docs/<prefix>/reference/<family>.md   — one page per ESPN family group,
//                                                each rendering a per-function
//                                                8-section block (## `fnName`)
//   docs/docs/<prefix>/_category_.json + reference/_category_.json
//
// Endpoints are grouped: site_v2 (+ site_v2_alt) -> "site", core_v2 -> "core",
// web_v3 -> "web", and any NCAA-scope wrappers -> "additional" (mbb/wbb only),
// matching sdv-py's site/core/web/additional reference pages.

// Family-group definitions for the per-league reference pages. Order drives the
// `sidebar_position` of each generated `reference/<id>.md`.
const REFERENCE_FAMILY_GROUPS = [
  { id: "site", label: "Site API", families: ["site_v2", "site_v2_alt"], scope: "universal" },
  { id: "core", label: "Core API", families: ["core_v2"], scope: "universal" },
  { id: "web", label: "Web API", families: ["web_v3"], scope: "universal" },
  { id: "fitt", label: "FPI API (fitt v3)", families: ["fitt_v3"], scope: "universal" },
  { id: "cdn", label: "CDN (espn.com page data)", families: ["cdn"], scope: "universal" },
];
// NCAA-scope extras (mbb/wbb) get their own page, like sdv-py's `additional.md`.
const REFERENCE_NCAA_GROUP = { id: "additional", label: "NCAA additional", scope: "ncaa" };

/** Which reference-page group a wrapper belongs to (by scope + family). */
function referenceGroupFor(wrapper) {
  if (wrapper.scope === "ncaa") return REFERENCE_NCAA_GROUP.id;
  for (const g of REFERENCE_FAMILY_GROUPS) {
    if (g.families.includes(wrapper.family)) return g.id;
  }
  return "site"; // safety net (shouldn't trigger for basketball families)
}

/**
 * Render the per-function 8-section reference block for ONE wrapper, mirroring
 * sdv-py's `_reference_block.jinja`:
 *   1. `## \`fnName\`` heading        5. Returns table (or raw-JSON note)
 *   2. derived one-line summary       6. Example fenced block
 *   3. Endpoint URL line              7. snake_case alias note
 *   4. param table                    8. parsed-output pointer
 */
function renderFunctionBlock(league, wrapper, parserMap) {
  const snake = espnSnake(league, wrapper);
  const camel = toCamel(snake);
  const familyLabel = ESPN_FAMILY_LABEL[wrapper.family] ?? "ESPN";
  const host = ESPN_FAMILY_HOST[wrapper.family] ?? "";
  const httpPath = displayPath(wrapper, league);
  const summary = `${league.prefix.toUpperCase()} — ${humanizeShort(espnPublicShort(league, wrapper))} (${familyLabel}).`;

  let body = `\n## \`${camel}\`\n\n`;
  body += `${summary}\n\n`;
  body += `**Endpoint URL:** \`GET ${host}${httpPath}${fixedQuery(wrapper)}\`\n\n`;
  body += deprecatedNote(aliasesOf(ALIASES.espn[league.prefix], snake));
  const pyNote = pyHandwrittenNote(league, wrapper);
  if (pyNote) body += `> **Note:** ${pyNote}\n\n`;

  // Param table: API param | JS | required | description. Path + query params,
  // plus the universal `parsed` control param. The API-param cell is always
  // backtick-wrapped so literal `{token}` braces aren't parsed as MDX/JSX
  // expressions (a bare `{athlete_id}` in a .md table breaks the build).
  const rows = [];
  if (league.leagueParam) {
    rows.push(["`league`", "`league`", "no", `ESPN league slug override (default \`${league.league}\`)`]);
  }
  for (const p of wrapper.pathParams) {
    const req = p.required === false ? "no" : "yes";
    rows.push([`\`{${p.name}}\``, `\`${p.name}\``, req, "path parameter"]);
  }
  for (const p of wrapper.queryParams) {
    const apiName = p.queryKey || p.name;
    const def = p.default !== undefined ? ` (default \`${p.default}\`)` : "";
    rows.push([`\`${apiName}\``, `\`${p.name}\``, "no", `query parameter${def}`]);
  }
  rows.push(["—", "`parsed`", "no", "return tidy rows instead of raw JSON"]);
  if (SECTIONED_SHORTS.has(wrapper.short)) {
    rows.push([
      "—",
      "`section`",
      "no",
      "with `parsed`, return one named sub-frame (e.g. `boxscore`, `plays`, `winprobability`) instead of all",
    ]);
  }
  body += `| API param | JS | required | description |\n`;
  body += `|---|---|---|---|\n`;
  for (const [api, js, req, desc] of rows) {
    body += `| ${api} | ${js} | ${req} | ${desc} |\n`;
  }

  // Returns: reuse the returns-schema (endpoint short -> parser -> espn/<stem>)
  // when one exists; otherwise the raw-JSON note.
  const parser = parserMap[wrapper.short];
  let cols = null;
  if (parser && !SUMMARY_DISPATCH.has(parser)) {
    cols = loadReturnsColumns(`espn/${(ESPN_PARSER_SCHEMA[parser] ?? parser).replace(/^parse_/, "")}`);
  }
  if (cols) {
    body += `\n**Returns** (with \`{ parsed: true }\`, via \`${parser}\`):\n\n`;
    body += renderColumnsTable(cols);
  } else if (SUMMARY_DISPATCH.has(parser)) {
    body +=
      `\n**Returns:** raw ESPN \`Dict\` by default. With \`{ parsed: true }\` the ` +
      (parser === "parse_summary"
        ? "`summary` dispatcher returns"
        : "page's `gamepackageJSON` (a Site v2 summary) goes through the `summary` dispatcher, which returns") +
      ` an object of 21 sub-frames keyed by section ` +
      `(\`{ parsed: true, section: '<name>' }\` for one); see ` +
      `[ESPN parsed returns](../../reference/espn-parsed-returns).\n`;
  } else {
    body +=
      `\n**Returns:** raw ESPN \`Dict\` by default. With \`{ parsed: true }\` the ` +
      `payload is routed through its parser` +
      (parser ? ` (\`${parser}\`)` : ` (generic / league-variable passthrough)`) +
      `; the column set varies by league — see ` +
      `[ESPN parsed returns](../../reference/espn-parsed-returns).\n`;
  }

  // Example.
  const exampleArgs = wrapper.pathParams.length
    ? `{ ${wrapper.pathParams
        .filter((p) => p.required !== false)
        .map((p) => `${p.name}: '…'`)
        .join(", ")} }`
    : league.leagueParam
      ? `{ league: '${league.league}' }`
      : "{}";
  body += `\n**Example:**\n\n`;
  body += "```js\n";
  body += `await sdv.${league.prefix}.${camel}(${exampleArgs});\n`;
  body += `// snake_case alias (py/R parity): sdv.${league.prefix}.${snake}(...)\n`;
  body += "```\n";

  return body;
}

/** Render one `reference/<group>.md` page (per-function blocks for that group). */
function renderReferenceFamilyPage(league, group, groupRows, position, parserMap) {
  const sorted = groupRows.slice().sort((a, b) => a.short.localeCompare(b.short));
  let body =
    `---\n` +
    `title: ${group.label}\n` +
    `sidebar_label: ${group.label}\n` +
    `sidebar_position: ${position}\n` +
    `---\n\n` +
    DOCS_NOTE +
    `\n# \`${league.prefix}\` — ${group.label}\n\n` +
    `${sorted.length} endpoint${sorted.length === 1 ? "" : "s"} on \`sdv.${league.prefix}\`. ` +
    `Each is exposed under a camelCase canonical name and a snake_case alias ` +
    `(py/R parity), accepts snake_case or camelCase params, and returns raw ESPN ` +
    `JSON by default (\`{ parsed: true }\` for tidy rows).\n`;
  for (const w of sorted) body += renderFunctionBlock(league, w, parserMap);
  return body;
}

/** Render the per-league landing page (`<prefix>/index.md`). */
function renderWrittenLeagueIndex(league, wrappers, groups) {
  const applicable = wrappersForLeague(league, wrappers);
  const scoreboard = wrapperName(league.prefix, "scoreboard");
  let body =
    `---\n` +
    `title: ${league.prefix.toUpperCase()}\n` +
    `sidebar_label: Overview\n` +
    `sidebar_position: 0\n` +
    `---\n\n` +
    DOCS_NOTE +
    `\n# \`sdv.${league.prefix}\` — ESPN reference\n\n` +
    `- **namespace:** \`sdv.${league.prefix}\`\n` +
    `- **sport slug:** \`${league.sport}\`\n` +
    `- **league slug:** \`${league.league}\`\n` +
    `- **scopes:** ${league.scopes.map((s) => `\`${s}\``).join(", ")}\n` +
    `- **wrappers:** ${applicable.length}\n\n` +
    `\`sdv.${league.prefix}\` is composed from **written, documented source** ` +
    `(\`src/generated/espn/${league.prefix}.ts\`) — a phased proof of converting the ` +
    `runtime wrapper factory into reviewable modules. Every endpoint is a real ` +
    `\`export const\` with JSDoc, callable as ` +
    `\`sdv.${league.prefix}.espn${league.prefix.charAt(0).toUpperCase()}${league.prefix.slice(1)}<Endpoint>(params)\` ` +
    `and under its snake_case alias (\`espn_${league.prefix}_<endpoint>\`) for ` +
    `parity with the Python / R packages.\n\n` +
    "```js\n" +
    `import sdv from 'sportsdataverse';\n\n` +
    `await sdv.${league.prefix}.${scoreboard}({});\n` +
    "```\n\n" +
    `## Reference families\n\n` +
    `Endpoints are grouped by ESPN API family. Pick a page for its per-function ` +
    `reference (endpoint URL, params, returns, example):\n\n` +
    `| Family | endpoints |\n` +
    `|---|---:|\n`;
  for (const g of groups) {
    body += `| [${g.label}](./reference/${g.id}) | ${g.rows.length} |\n`;
  }
  body +=
    `\n> **Parsed output:** pass \`{ parsed: true }\` to any endpoint to get tidy ` +
    `rows instead of raw JSON. The columns are determined by each endpoint's ` +
    `parser — see [ESPN parsed returns](../reference/espn-parsed-returns) for the ` +
    `full column reference.\n`;
  return body;
}

/** Compute the populated reference family groups for a written-ESPN league. */
function writtenLeagueGroups(league, wrappers) {
  const applicable = wrappersForLeague(league, wrappers);
  const groups = [];
  for (const g of REFERENCE_FAMILY_GROUPS) {
    const rows = applicable.filter(
      (w) => w.scope === "universal" && g.families.includes(w.family)
    );
    if (rows.length) groups.push({ ...g, rows });
  }
  if (league.scopes.includes("ncaa")) {
    const rows = applicable.filter((w) => w.scope === "ncaa");
    if (rows.length) groups.push({ ...REFERENCE_NCAA_GROUP, rows });
  }
  return groups;
}

/**
 * Register every generated doc file for a written-ESPN league into `outputs`:
 * the `<prefix>/index.md`, the two `_category_.json`s, and one
 * `reference/<group>.md` per populated family group.
 */
function registerWrittenLeagueDocs(outputs, league, wrappers, flatWrappers, parserMap, sidebarPosition, loaders = []) {
  const leagueDir = join(referenceRootDir, league.prefix);
  const refDir = join(leagueDir, "reference");
  const groups = writtenLeagueGroups(league, wrappers);

  // Leagues with native (non-ESPN) flat families (mlb/nhl/nfl) get a "Native API"
  // reference page alongside the ESPN family pages so those docs aren't lost.
  const nativeFamilies = FLAT_API_FILES.filter((api) => FLAT_API_NAMESPACES[api] === league.prefix);
  const nativeRows = (flatWrappers ?? []).filter((w) => nativeFamilies.includes(w.api));
  const indexGroups = nativeRows.length
    ? [...groups, { id: "native", label: "Native API", rows: nativeRows }]
    : [...groups];
  // Release dataset loaders (releases.yaml) get their own reference page, last.
  if (loaders.length) {
    indexGroups.push({ id: "loaders", label: "Dataset loaders", rows: loaders });
    outputs[join(refDir, "loaders.md")] = renderLoadersPage(league.prefix, loaders, 50);
  }

  outputs[join(leagueDir, "index.md")] = renderWrittenLeagueIndex(league, wrappers, indexGroups);
  outputs[join(leagueDir, "_category_.json")] =
    JSON.stringify(
      {
        label: league.prefix.toUpperCase(),
        position: sidebarPosition,
        collapsed: true,
        link: { type: "doc", id: "index" },
      },
      null,
      2
    ) + "\n";
  outputs[join(refDir, "_category_.json")] =
    JSON.stringify({ label: "Reference", position: 1, collapsed: true }, null, 2) + "\n";

  groups.forEach((g, i) => {
    outputs[join(refDir, `${g.id}.md`)] = renderReferenceFamilyPage(
      league,
      g,
      g.rows,
      i + 1,
      parserMap
    );
  });
  if (nativeRows.length) {
    outputs[join(refDir, "native.md")] = renderWrittenLeagueNativePage(
      league,
      flatWrappers,
      groups.length + 1
    );
  }
}

/** "Native API" reference page for a written league that has flat families. */
function renderWrittenLeagueNativePage(league, flatWrappers, position) {
  return (
    `---\n` +
    `title: Native API\n` +
    `sidebar_label: Native API\n` +
    `sidebar_position: ${position}\n` +
    `---\n\n` +
    DOCS_NOTE +
    `\n# \`sdv.${league.prefix}\` — Native (non-ESPN) APIs\n\n` +
    `Beyond the ESPN surface, \`sdv.${league.prefix}\` also wraps the league's own ` +
    `live APIs. Same \`{ parsed: true }\` contract; each method is exposed under ` +
    `both snake_case and camelCase on \`sdv.${league.prefix}\`.\n` +
    renderNativeSections(league, flatWrappers)
  );
}

// ---------------------------------------------------------------------------
// ESPN parsed-returns reference (shared page)
// ---------------------------------------------------------------------------
//
// Every ESPN endpoint returns raw Dict by default; `{ parsed: true }` routes it
// through the parser registered for its short name (src/parsers/espn.ts). The
// 121 endpoints share just 22 parsers, so the returned columns are a property of
// the PARSER, not the league/endpoint — we document each parser's columns once
// here (from tools/codegen/schemas/espn/*.yaml) and point every league page at
// this page, instead of repeating 121 tables across 29 leagues.

// Display order for the per-parser sections (dedicated first, the two generics
// last; `parse_summary` is a dispatcher rendered as a pointer to the sub-frames).
// Parsers that run the summary dispatcher (an object of sub-frames, no one table).
const SUMMARY_DISPATCH = new Set(["parse_summary", "parse_cdn_game"]);
// A parser whose rows are another parser's: its returns table is that one's.
const ESPN_PARSER_SCHEMA = { parse_cdn_scoreboard: "parse_scoreboard", parse_cdn_schedule: "parse_scoreboard" };

const ESPN_PARSER_ORDER = [
  "parse_scoreboard", "parse_teams", "parse_standings", "parse_groups",
  "parse_athlete_overview", "parse_athlete_stats", "parse_athlete_gamelog", "parse_athlete_splits",
  "parse_leaders", "parse_coaches", "parse_draft",
  "parse_event_competitor_roster", "parse_event_competitor_statistics",
  "parse_event_competitor_linescores", "parse_event_plays",
  "parse_team_schedule", "parse_team_roster", "parse_news", "parse_injuries",
  "parse_summary", "parse_items", "parse_single_entity",
  "parse_cdn_game", "parse_cdn_scoreboard", "parse_cdn_schedule", "parse_cdn_rankings",
];

// The 21 summary sub-frames in dispatcher order (SUMMARY_SECTION_PARSERS).
const ESPN_SUMMARY_SECTIONS = [
  "boxscore_player", "boxscore_team", "plays", "winprobability", "leaders",
  "game_info", "officials", "header", "season_series", "against_the_spread",
  "standings", "broadcasts", "format", "pickcenter", "odds", "article",
  "injuries", "news", "drives", "drive_plays", "scoring_plays",
];

const ESPN_PARSER_DESC = {
  parse_scoreboard: "One row per game on a Site v2 scoreboard (teams, score, status, odds).",
  parse_teams: "League team catalog (Site v2 / Core v2).",
  parse_standings: "One row per team-standings entry with its stat columns.",
  parse_groups: "Conferences / groups (divisions) for the league.",
  parse_athlete_overview: "Web v3 athlete overview (bio + recent splits).",
  parse_athlete_stats: "Web v3 athlete statistics blocks.",
  parse_athlete_gamelog: "Web v3 athlete game log (one row per game).",
  parse_athlete_splits: "Web v3 athlete splits.",
  parse_leaders: "League statistical leaders (one row per leader entry).",
  parse_coaches: "Coaches catalog.",
  parse_draft: "Draft rounds / picks.",
  parse_event_competitor_roster: "Per-competitor roster on an event.",
  parse_event_competitor_statistics: "Per-competitor statistics on an event.",
  parse_event_competitor_linescores: "Per-competitor linescores on an event.",
  parse_event_plays: "Core v2 event plays.",
  parse_team_schedule: "A team's Site v2 schedule (one row per event).",
  parse_team_roster: "A team's roster (one row per athlete).",
  parse_news: "ESPN news articles (league / team / athlete scoped).",
  parse_injuries: "Injury report rows (league / team / athlete scoped).",
  parse_summary: "Site v2 game summary dispatcher — returns 21 sub-frames.",
  parse_items: "Generic Core v2 paginated list — one row per item (often a `$ref` pointer).",
  parse_single_entity: "Generic Core v2 single resource — one row for the entity.",
  parse_cdn_game:
    "CDN play-by-play / box-score page: its `gamepackageJSON` (a Site v2 summary) through the `summary` dispatcher — an object of 21 sub-frames, or one `section` (see [Summary sub-frames](#summary-sub-frames)).",
  parse_cdn_scoreboard: "CDN scoreboard page: its `sbData` (a Site v2 scoreboard), one row per game — the `parse_scoreboard` columns.",
  parse_cdn_schedule: "CDN schedule page: every day's games, one row per game — the `parse_scoreboard` columns.",
  parse_cdn_rankings: "CDN poll rankings page (cfb): one row per (poll, team), ranked teams and those receiving votes.",
};

/** Load the committed ESPN short-name -> parser fn map (drift-guarded by a test). */
function loadEspnParserMap() {
  const doc = parse(readFileSync(join(endpointsDir, "espn_parser_map.yaml"), "utf8"));
  return doc?.endpoints || {};
}

/** Render just the `col_name | type | description` table body (no heading). */
function renderColumnsTable(columns) {
  let out = `| col_name | type | description |\n|---|---|---|\n`;
  for (const c of columns) {
    const desc = c.description ? escapeCell(c.description) : "";
    out += `| \`${escapeCell(c.name)}\` | ${escapeCell(c.type)} | ${desc} |\n`;
  }
  return out;
}

/** The shared "ESPN parsed returns" reference page (one table per parser). */
function renderEspnParsedReturns() {
  const map = loadEspnParserMap();
  const byParser = {};
  for (const [short, fn] of Object.entries(map)) (byParser[fn] ??= []).push(short);
  const parserCount = Object.keys(byParser).length;

  let body =
    `---\n` +
    `title: ESPN parsed returns\n` +
    `sidebar_label: Parsed returns\n` +
    `sidebar_position: 1\n` +
    `---\n\n` +
    DOCS_NOTE +
    `\n# ESPN parsed returns\n\n` +
    `Every ESPN endpoint returns the raw ESPN \`Dict\` by default. Pass ` +
    `\`{ parsed: true }\` to route the payload through the parser registered for ` +
    `that endpoint and get a tidy array of row objects instead (the JS analogue ` +
    `of a tidy DataFrame — mirrors \`sdv-py\`'s \`return_parsed=True\`):\n\n` +
    "```js\n" +
    `const raw  = await sdv.nba.espnNbaScoreboard({});               // raw Dict\n` +
    `const rows = await sdv.nba.espnNbaScoreboard({ parsed: true }); // tidy row[]\n` +
    "```\n\n" +
    `The **${Object.keys(map).length}** ESPN endpoints route through just ` +
    `**${parserCount}** parsers, so the returned columns are determined by the ` +
    `endpoint's *parser*, not the league — the same parser yields the same shape ` +
    `across every league. Each parser's column set is documented once below; the ` +
    `**Endpoints** line under each lists the short names that use it. Columns are ` +
    `snake_cased and nested objects flattened with \`_\` (e.g. \`team.abbreviation\` ` +
    `-> \`team_abbreviation\`). Generic / league-variable passthroughs show no ` +
    `fixed table.\n`;

  for (const fn of ESPN_PARSER_ORDER) {
    const shorts = (byParser[fn] || []).slice().sort();
    if (!shorts.length) continue;
    body += `\n## \`${fn}\`\n\n`;
    if (ESPN_PARSER_DESC[fn]) body += `${ESPN_PARSER_DESC[fn]}\n\n`;
    body += `**Endpoints (${shorts.length}):** ${shorts.map((s) => `\`${s}\``).join(", ")}\n\n`;
    if (fn === "parse_cdn_game") continue; // described above; its frames are the summary's
    if (fn === "parse_summary") {
      body +=
        `\`summary\` is a dispatcher: \`{ parsed: true }\` returns an object of all ` +
        `21 sub-frames keyed by section; \`{ parsed: true, section: '<name>' }\` ` +
        `returns just that one. See [Summary sub-frames](#summary-sub-frames) below.\n`;
      continue;
    }
    const cols = loadReturnsColumns(`espn/${(ESPN_PARSER_SCHEMA[fn] ?? fn).replace(/^parse_/, "")}`);
    if (cols) body += renderColumnsTable(cols);
    else
      body +=
        `_Generic / dynamic passthrough — the column set varies by league and ` +
        `payload (e.g. Core v2 \`$ref\` items or a league-specific catalog). Call ` +
        `with \`{ parsed: true }\` to inspect the columns for a given league._\n`;
  }

  body +=
    `\n## Summary sub-frames\n\n` +
    `The \`summary\` dispatcher (\`parse_summary\`) yields these 21 sub-frames. ` +
    `Football (NFL / CFB) games additionally populate \`drives\` / \`drive_plays\` / ` +
    `\`scoring_plays\`; other sports return those as zero-row frames. Betting ` +
    `sections (\`against_the_spread\` / \`pickcenter\` / \`odds\`) are sparse in ` +
    `past-game captures.\n`;
  for (const sec of ESPN_SUMMARY_SECTIONS) {
    body += `\n### \`${sec}\`\n\n`;
    const cols = loadReturnsColumns(`espn/summary_${sec}`);
    if (cols) body += renderColumnsTable(cols);
    else
      body +=
        `_Zero rows in the reference capture (football-only or sparse-in-past-games); ` +
        `the shape populates on a live game of the relevant sport._\n`;
  }
  return body;
}

function renderReferenceIndex(leagues, wrappers, flatWrappers = [], standaloneNs = []) {
  let body =
    `---\n` +
    `title: ESPN Reference\n` +
    `sidebar_label: Overview\n` +
    `sidebar_position: 0\n` +
    `---\n\n` +
    DOCS_NOTE +
    `\n# ESPN cross-league reference\n\n` +
    `Every league below exposes the same generated \`espn<League><Endpoint>\` ` +
    `surface (e.g. \`espnNbaScoreboard\`), bound from a single YAML source of truth. ` +
    `Each method is also available under its snake_case name (\`espn_nba_scoreboard\`) ` +
    `for parity with the Python / R packages. Pick a league for its full endpoint ` +
    `table, or try any call live in the [playground](/playground).\n\n` +
    `Every endpoint also accepts \`{ parsed: true }\` to return tidy rows instead ` +
    `of raw JSON — see [**ESPN parsed returns**](./espn-parsed-returns) for the ` +
    `column reference (116 endpoints across 22 parsers).\n\n` +
    `Some leagues additionally ship **native (non-ESPN) API** wrappers — the MLB ` +
    `Stats API + Baseball Savant/Statcast (\`mlb\`), the four NHL native APIs ` +
    `(\`nhl\`), and the NFL.com Shield API (\`nfl\`). They're listed in the ` +
    `**Native API** sections of each league page; the \`native\` column below ` +
    `counts them.\n\n` +
    `| League | sport | ESPN slug | scopes | wrappers | native |\n` +
    `|---|---|---|---|---:|---:|\n`;
  for (const l of leagues) {
    const count = wrappersForLeague(l, wrappers).length;
    const native = flatWrappersForLeague(l.prefix, flatWrappers).length;
    const slug = l.leagueParam ? `${l.league} *(param)*` : l.league;
    // Written-ESPN (basketball) leagues live in their own `<prefix>/` dir as a
    // sibling of `reference/`; everyone else is the flat `reference/<prefix>.md`.
    const link = WRITTEN_ESPN_LEAGUES.includes(l.prefix)
      ? `../${l.prefix}/`
      : `./${l.prefix}`;
    body += `| [${l.prefix}](${link}) | \`${l.sport}\` | \`${slug}\` | ${l.scopes.join(", ")} | ${count} | ${native || "—"} |\n`;
  }

  // Standalone (non-league) provider namespaces — e.g. `odds` (The Odds API),
  // the first cross-sport provider family. Each gets its own reference page
  // (renderStandaloneFlatPage) rather than a "Native API" section on a league.
  if (standaloneNs.length) {
    body +=
      `\n## Standalone provider namespaces\n\n` +
      `Native providers that aren't a single ESPN league — each gets its own ` +
      `\`sdv.<namespace>\` surface and reference page. Cross-sport providers ` +
      `(odds, cbs, …) live under **Providers** in the sidebar; sport-specific ` +
      `ones (\`torvik\` → Basketball, \`hockeytech\` → Hockey) nest under their ` +
      `sport.\n\n` +
      `| Namespace | sport | provider | wrappers |\n` +
      `|---|---|---|---:|\n`;
    for (const ns of standaloneNs) {
      const families = FLAT_API_FILES.filter((api) => FLAT_API_NAMESPACES[api] === ns);
      const count = flatWrappers.filter((w) => families.includes(w.api)).length;
      const labels = families
        .map((api) => (FLAT_API_META[api] ?? { label: api }).label)
        .join(", ");
      const nsSport = flatNamespaceSport(ns);
      const sportCell = nsSport ? sportLabel(nsSport) : "*cross-sport*";
      body += `| [${ns}](./${ns}) | ${sportCell} | ${labels} | ${count} |\n`;
    }
  }

  body +=
    `\n:::tip Same call, every league\n` +
    "```js\n" +
    `await sdv.nba.espnNbaScoreboard({});\n` +
    `await sdv.nfl.espnNflScoreboard({ week: 1, seasonType: 2 });\n` +
    `await sdv.soccer.espnSoccerScoreboard({ league: 'eng.1' });\n` +
    "```\n" +
    `:::\n` +
    `\n:::tip Native (non-ESPN) APIs\n` +
    "```js\n" +
    `await sdv.mlb.mlbSchedule({ sportId: 1, date: '2024-07-01' });\n` +
    `await sdv.nhl.nhlWebPbp({ gameId: 2023030417, parsed: true });\n` +
    `await sdv.nfl.nflStandings({ season: 2024, seasonType: 'REG', week: 1 });\n` +
    "```\n" +
    `:::\n` +
    `\n:::note v4 names\n` +
    `Since v4 every wrapper carries sdv-py's name (\`athlete\` → \`player\`, ` +
    `\`event\` → \`game\`, …). Pre-v4 names still work as deprecated aliases ` +
    `(one \`DeprecationWarning\` per name) — see [Deprecated names](./deprecations).\n` +
    `:::\n`;
  return body;
}

const REFERENCE_CATEGORY = JSON.stringify(
  // position 4: after intro(1), Guides(2), Tutorials(3); API Reference is 5.
  { label: "ESPN Reference", position: 4, collapsible: true, collapsed: true },
  null,
  2
) + "\n";

// ---------------------------------------------------------------------------
// Generated reference sidebar (grouped by sport)
// ---------------------------------------------------------------------------
//
// The reference `.md` files stay FLAT on disk (docs/docs/reference/<prefix>.md)
// so their published URLs never change. This module builds an EXPLICIT sidebar
// that nests each ESPN league doc under a collapsible category named for its
// `sport` (from leagues.yaml), with the provider (standalone) namespaces under
// a "Providers" category. The Overview + Parsed returns pages sit at the top.
//
// `docs/sidebars.js` imports this array and splices it into the docs sidebar,
// so adding a league/provider (and re-running codegen) auto-places it in the
// right group — no manual sidebar edit. Drift-guarded via the `outputs` map.
// Sport classification for a STANDALONE flat namespace, if it is sport-specific
// (e.g. `torvik` -> basketball, `hockeytech` -> hockey). Cross-sport providers
// (odds, cbs, fox, recruiting, yahoo) return null and stay under "Providers".
// Declared via `sport:` in FLAT_API_META (keyed by api stem) + the api->ns map,
// so a new sport-specific provider auto-nests under its sport with no edit here.
function flatNamespaceSport(ns) {
  for (const [api, nsValue] of Object.entries(FLAT_API_NAMESPACES)) {
    if (nsValue === ns && FLAT_API_META[api] && FLAT_API_META[api].sport) {
      return FLAT_API_META[api].sport;
    }
  }
  return null;
}

// Partition standalone namespaces into sport-specific (folded into their sport's
// league list) vs cross-sport (the "Providers" bucket). Shared by the sidebar +
// the homepage coverage view so both classify identically.
function groupBySportWithFlat(leagues, standaloneNs) {
  const bySport = new Map();
  for (const l of leagues) {
    if (!bySport.has(l.sport)) bySport.set(l.sport, []);
    bySport.get(l.sport).push(l.prefix);
  }
  const crossSportNs = [];
  for (const ns of standaloneNs) {
    const sport = flatNamespaceSport(ns);
    if (sport) {
      if (!bySport.has(sport)) bySport.set(sport, []);
      bySport.get(sport).push(ns);
    } else {
      crossSportNs.push(ns);
    }
  }
  const sports = [
    ...SPORT_ORDER.filter((s) => bySport.has(s)),
    ...[...bySport.keys()].filter((s) => !SPORT_ORDER.includes(s)).sort(),
  ];
  return { bySport, crossSportNs, sports };
}

function renderReferenceSidebar(leagues, standaloneNs, loaderOnly = []) {
  // Leagues grouped by sport, plus any sport-specific standalone provider
  // namespaces (torvik->basketball, hockeytech->hockey) nested under their sport.
  const { bySport, crossSportNs, sports } = groupBySportWithFlat(leagues, standaloneNs);
  // Loader-only namespaces (`pwhl`: release loaders, no ESPN league) nest under
  // their sport as a <ns>/ docs dir, like a written league.
  for (const [ns, sport] of loaderOnly) {
    if (!bySport.has(sport)) throw new Error(`sidebar: no "${sport}" group for loader namespace ${ns}`);
    bySport.get(sport).push(ns);
  }
  const dirNs = new Set([...WRITTEN_ESPN_LEAGUES, ...loaderOnly.map(([ns]) => ns)]);

  const items = [
    { type: "doc", id: "reference/index", label: "Overview" },
    { type: "doc", id: "reference/espn-parsed-returns", label: "Parsed returns" },
    { type: "doc", id: "reference/deprecations", label: "Deprecated names (v4)" },
  ];
  for (const sport of sports) {
    const prefixes = bySport.get(sport).slice().sort((a, b) => a.localeCompare(b));
    items.push({
      type: "category",
      label: sportLabel(sport),
      collapsible: true,
      collapsed: true,
      // Written-ESPN (basketball) leagues render as sdv-py-style clickable
      // categories: the label links to the generated `<prefix>/index` landing
      // page, expanding to the autogenerated per-function reference subtree
      // (`<prefix>/reference`). Every OTHER league stays a flat
      // `reference/<prefix>` doc (the runtime-factory path is unchanged).
      items: prefixes.map((p) =>
        dirNs.has(p)
          ? {
              type: "category",
              label: p,
              link: { type: "doc", id: `${p}/index` },
              items: [{ type: "autogenerated", dirName: `${p}/reference` }],
            }
          : { type: "doc", id: `reference/${p}`, label: p }
      ),
    });
  }
  if (crossSportNs.length) {
    const ns = crossSportNs.slice().sort((a, b) => a.localeCompare(b));
    items.push({
      type: "category",
      label: "Providers",
      collapsible: true,
      collapsed: true,
      items: ns.map((n) => ({ type: "doc", id: `reference/${n}`, label: n })),
    });
  }

  return (
    `// @generated by tools/codegen/generate.mjs — do not edit by hand.\n` +
    `// Grouped ESPN reference sidebar (leagues nested by sport + a Providers\n` +
    `// category). Imported by docs/sidebars.js. Re-run \`npm run codegen\` to refresh.\n` +
    `module.exports = ${JSON.stringify(items, null, 2)};\n`
  );
}

// ---------------------------------------------------------------------------
// Homepage coverage metadata (small derived view-model)
// ---------------------------------------------------------------------------
//
// The homepage only renders a coverage grid (sport -> league prefixes, plus
// provider namespace -> wrapper count). Importing the full ~17k-line
// endpoints.json there would pull the entire endpoint catalog into the
// first-load JS bundle. This emits a purpose-built, tiny coverage.json from the
// SAME codegen pass (so it stays drift-guarded) for docs/src/pages/index.js to
// consume instead. Display labels/order live in index.js (a view concern).
function renderCoverageJson(leagues, standaloneNs, flatWrappers) {
  // Same classification as the sidebar: sport-specific standalone namespaces
  // (torvik, hockeytech) fold into their sport; only cross-sport providers list
  // separately. Each sport entry also carries a `providers` array — the subset
  // of its prefixes that are sport-specific providers — so the homepage can
  // mark those chips distinctly from ESPN leagues.
  const { bySport, crossSportNs, sports: sportOrder } = groupBySportWithFlat(
    leagues,
    standaloneNs
  );
  const leaguePrefixes = new Set(leagues.map((l) => l.prefix));
  const sports = sportOrder.map((sport) => {
    const prefixes = bySport.get(sport).slice().sort((a, b) => a.localeCompare(b));
    return {
      sport,
      prefixes,
      providers: prefixes.filter((p) => !leaguePrefixes.has(p)),
    };
  });

  const counts = {};
  for (const w of flatWrappers) {
    const ns = FLAT_API_NAMESPACES[w.api];
    if (ns) counts[ns] = (counts[ns] || 0) + 1;
  }
  const providers = crossSportNs
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .map((ns) => ({ ns, count: counts[ns] || 0 }));

  return (
    JSON.stringify(
      {
        _generated: "tools/codegen/generate.mjs — do not edit by hand",
        leagueCount: leagues.length,
        sportCount: sports.length,
        sports,
        providers,
      },
      null,
      2
    ) + "\n"
  );
}

// ---------------------------------------------------------------------------
// Playground metadata (consumed by the React component + serverless proxy)
// ---------------------------------------------------------------------------

function renderEndpointsJson(wrappers, leagues, hosts, allFlatWrappers) {
  // Families that must NEVER be reachable through the docs playground's
  // /api/run proxy (its host allowlist derives from `flatHosts`): their hosts
  // answer only a browser-impersonating TLS client (stats.nba.com /
  // stats.wnba.com also need a residential IP), so a serverless fetch would
  // only hang or be blocked; the subscription families (PFF API, KenPom, NFL
  // Pro) need the caller's own credentials. Dropped from the playground metadata.
  const flatWrappers = allFlatWrappers.filter((w) => !NO_PLAYGROUND_FAMILIES.has(w.api));
  const flatHosts = flatHostsFrom(flatWrappers);
  return (
    JSON.stringify(
      {
        _generated: "tools/codegen/generate.mjs — do not edit by hand",
        hosts,
        leagues,
        endpoints: wrappers,
        // Additive flat-API metadata — kept under its own keys so the ESPN
        // `endpoints`/`hosts`/`leagues` blocks (and the playground resolver that
        // consumes them) are byte-for-byte unchanged. `flatApis` carries the
        // full per-endpoint param metadata (api/host/path/pathParams/
        // queryParams/parser/auth); `flatHosts` is the per-family base URL; and
        // `flatLeagues` maps each family stem to the league prefix it's merged
        // onto (so the playground can group flat endpoints under their league).
        flatHosts,
        flatLeagues: Object.fromEntries(
          Object.entries(FLAT_API_NAMESPACES).filter(([api]) => !NO_PLAYGROUND_FAMILIES.has(api))
        ),
        flatApis: flatWrappers,
      },
      null,
      2
    ) + "\n"
  );
}

/** Build the per-family flat-host map ({ mlb: "https://statsapi.mlb.com" }). */
function flatHostsFrom(flatWrappers) {
  const hosts = {};
  for (const w of flatWrappers) hosts[w.api] = FLAT_FAMILY_HOSTS[w.api];
  return hosts;
}

// ---------------------------------------------------------------------------
// v4 deprecated aliases (pre-v4 names a rename replaced)
// ---------------------------------------------------------------------------

/**
 * Fill ALIASES: for every wrapper, each name JS shipped before v4 (the pre-v4
 * rule `espn_<prefix>_<short>` / `<api>_<short>`, plus a CBS `legacy_short`)
 * that is in the frozen pre-v4 surface and differs from the v4 name. Names that
 * never shipped (a family vendored after v4) get no alias.
 */
function computeAliases(leagues, wrappers, flatWrappers) {
  const add = (table, key, ns, old, now) => {
    if (old !== now && PRE_V4_NAMES[ns]?.has(old)) (table[key] ??= {})[old] = now;
  };
  for (const league of leagues) {
    for (const w of wrappersForLeague(league, wrappers)) {
      add(ALIASES.espn, league.prefix, league.prefix, `espn_${league.prefix}_${w.short}`, espnSnake(league, w));
    }
  }
  for (const w of flatWrappers) {
    const ns = FLAT_API_NAMESPACES[w.api] ?? w.api;
    const legacy = FLAT_LEGACY_SHORT.get(`${w.api}.${w.short}`);
    if (legacy && !PRE_V4_NAMES[ns]?.has(`${w.api}_${legacy}`)) {
      throw new Error(`${w.api}.${w.short}: legacy_short ${legacy} names no pre-v4 public name (${w.api}_${legacy})`);
    }
    for (const s of [w.short, legacy].filter(Boolean)) add(ALIASES.flat, w.api, ns, `${w.api}_${s}`, flatSnake(w));
  }
}

/**
 * Fail the codegen if any namespace would carry two wrappers (or a wrapper and
 * a deprecated alias) under one name, in either case form.
 */
function assertUniqueNames(leagues, wrappers, flatWrappers) {
  const seen = new Map(); // ns -> Map(name -> what)
  const claim = (ns, snake, what) => {
    const m = seen.get(ns) ?? new Map();
    seen.set(ns, m);
    for (const n of new Set([snake, toCamel(snake)])) {
      if (m.has(n)) throw new Error(`sdv.${ns}.${n} is claimed by both ${m.get(n)} and ${what}`);
      m.set(n, what);
    }
  };
  for (const league of leagues) {
    for (const w of wrappersForLeague(league, wrappers)) claim(league.prefix, espnSnake(league, w), `espn ${w.short}`);
    for (const old of Object.keys(ALIASES.espn[league.prefix] ?? {})) claim(league.prefix, old, `alias ${old}`);
  }
  for (const w of flatWrappers) claim(FLAT_API_NAMESPACES[w.api] ?? w.api, flatSnake(w), `${w.api} ${w.short}`);
  for (const [api, table] of Object.entries(ALIASES.flat)) {
    for (const old of Object.keys(table)) claim(FLAT_API_NAMESPACES[api] ?? api, old, `alias ${old}`);
  }
}

/** src/generated/aliases.ts: the deprecated-alias tables the runtime registers. */
function renderAliasesTs() {
  const sorted = (table) =>
    Object.fromEntries(
      Object.keys(table)
        .sort()
        .map((k) => [k, Object.fromEntries(Object.entries(table[k]).sort(([a], [b]) => a.localeCompare(b)))])
    );
  return (
    TS_HEADER +
    "// Deprecated pre-v4 names (snake_case) -> the v4 name they forward to. v4\n" +
    "// adopted sdv-py's public names; every pre-v4 name a rename replaced stays\n" +
    "// callable under BOTH its snake_case and camelCase form, warning once per name\n" +
    "// per process (src/core/deprecation.ts). See docs/docs/reference/deprecations.md.\n\n" +
    "/** ESPN aliases, keyed by league prefix. */\n" +
    `export const ESPN_DEPRECATED_ALIASES: Record<string, Record<string, string>> = ${JSON.stringify(sorted(ALIASES.espn), null, 2)};\n\n` +
    "/** Flat-API aliases, keyed by api stem. */\n" +
    `export const FLAT_DEPRECATED_ALIASES: Record<string, Record<string, string>> = ${JSON.stringify(sorted(ALIASES.flat), null, 2)};\n`
  );
}

/** docs/docs/reference/deprecations.md: every deprecated alias, per namespace. */
function renderDeprecationsPage(leagues) {
  const byNs = new Map();
  const push = (ns, table) => {
    for (const [old, now] of Object.entries(table ?? {})) (byNs.get(ns) ?? byNs.set(ns, []).get(ns)).push([old, now]);
  };
  for (const l of leagues) push(l.prefix, ALIASES.espn[l.prefix]);
  for (const [api, table] of Object.entries(ALIASES.flat)) push(FLAT_API_NAMESPACES[api] ?? api, table);
  const total = [...byNs.values()].reduce((n, rows) => n + rows.length, 0);
  let body =
    `---\n` +
    `title: Deprecated names (v4)\n` +
    `sidebar_label: Deprecated names (v4)\n` +
    `sidebar_position: 2\n` +
    `---\n\n` +
    DOCS_NOTE +
    `\n# Deprecated names (v4)\n\n` +
    `v4 renamed the generated wrappers to **sdv-py's names**, so the same endpoint ` +
    `has the same name in Python and JavaScript. The rules are sdv-py's ` +
    `(\`tools/codegen/generate.py\`):\n\n` +
    `- ESPN: \`athlete\` → \`player\`, \`event\` → \`game\` (and their plurals) as whole ` +
    `\`_\`-separated words; \`event_competitor*\` → \`game_team*\`; ` +
    `\`event_competition_<x>\` → \`game_<x>\`. Where that name is taken by another ` +
    `sdv-py function, \`athlete_stats\` becomes \`player_stats_v3\`. sdv-py's curated ` +
    `CFB renames apply (\`season_futures\` → \`futures\`, …).\n` +
    `- Native APIs: sdv-py's name pattern — \`nhl_<endpoint>\` for the NHL api-web ` +
    `family (\`nhl_web_<endpoint>\` where sdv-py's name is taken), \`nfl_<endpoint>\` ` +
    `for NFL.com.\n` +
    `- CBS: sdv-py's 16 short names replace the ones JS had picked.\n\n` +
    `Every pre-v4 name below still works: it forwards to the new function and ` +
    `emits one \`DeprecationWarning\` per name per process. The aliases will be ` +
    `removed in a future major release. **${total}** names are deprecated, each ` +
    `in both its snake_case and camelCase form.\n`;
  const order = [...byNs.keys()].sort((a, b) => a.localeCompare(b));
  for (const ns of order) {
    const rows = byNs.get(ns).sort(([a], [b]) => a.localeCompare(b));
    body += `\n## \`sdv.${ns}\`\n\n| Deprecated (pre-v4) | Use instead (v4) |\n|---|---|\n`;
    for (const [old, now] of rows) {
      body += `| \`${old}\` / \`${toCamel(old)}\` | \`${now}\` / \`${toCamel(now)}\` |\n`;
    }
  }
  return body;
}

// ---------------------------------------------------------------------------
// Assemble + write/check
// ---------------------------------------------------------------------------

const wrappers = loadWrappers();
const flatWrappers = loadFlatWrappers();
const leaguesDoc = loadLeaguesDoc();
const leagues = loadLeagues(leaguesDoc);
// v4 names: resolve each league's public shorts (py's rename layer), carry the
// league-specific ones on its LeagueConfig (for makeLeagueModule + the
// playground), then derive the deprecated pre-v4 aliases and check that no
// namespace ends up with two wrappers under one name.
for (const league of leagues) {
  const names = espnLeagueNames(league, wrappers);
  ESPN_PUBLIC.set(league.prefix, names);
  const overrides = {};
  for (const w of wrappersForLeague(league, wrappers)) {
    if (names.get(w.short) !== (w.publicShort ?? w.short)) overrides[w.short] = names.get(w.short);
  }
  if (Object.keys(overrides).length) league.publicShorts = overrides;
}
computeAliases(leagues, wrappers, flatWrappers);
assertUniqueNames(leagues, wrappers, flatWrappers);
// All ESPN leagues are emitted as written source (see WRITTEN_ESPN_LEAGUES above).
WRITTEN_ESPN_LEAGUES = leagues.map((l) => l.prefix);
const hosts = leaguesDoc.hosts;

// Flat-API namespaces that are NOT leagues (e.g. `odds`) get their own
// standalone reference page instead of a "Native API" section on a league page.
const standaloneNs = standaloneFlatNamespaces(leagues);

// Release dataset loaders (vendored releases.yaml): one `load*` per entry on
// its league namespace. A namespace with loaders but no ESPN league gets its
// own docs dir, nested under its sport here (a new one fails loudly).
const releaseLoaders = loadersByLeague(loadReleaseLoaders(endpointsDir));
const LOADER_ONLY = {
  pwhl: {
    sport: "hockey",
    note: "Live PWHL feeds are on [`sdv.hockeytech`](../reference/hockeytech.md) with `league: 'pwhl'`.",
  },
};
const loaderOnly = [...releaseLoaders.keys()]
  .filter((ns) => !WRITTEN_ESPN_LEAGUES.includes(ns))
  .map((ns) => {
    if (!LOADER_ONLY[ns]) {
      throw new Error(`releases.yaml: loader namespace "${ns}" has no ESPN league; add it to LOADER_ONLY`);
    }
    return [ns, LOADER_ONLY[ns].sport];
  });

// The generated wrappers module exports the ESPN `WRAPPERS` table (unchanged)
// plus a separate `FLAT_WRAPPERS` table for the non-ESPN flat APIs.
const wrappersTs =
  renderTs("WrapperDef", "WRAPPERS", wrappers) +
  `\nexport const FLAT_WRAPPERS: WrapperDef[] = ${JSON.stringify(flatWrappers, null, 2)};\n`;

const outputs = {
  [join(generatedDir, "wrappers.ts")]: wrappersTs,
  [join(generatedDir, "leagues.ts")]: renderTs("LeagueConfig", "LEAGUES", leagues),
  [join(generatedDir, "aliases.ts")]: renderAliasesTs(),
  [join(referenceDir, "deprecations.md")]: renderDeprecationsPage(leagues),
  [join(referenceDir, "index.md")]:
    renderReferenceIndex(leagues, wrappers, flatWrappers, standaloneNs) +
    renderLoadersIndexSection(releaseLoaders),
  [join(referenceDir, "espn-parsed-returns.md")]: renderEspnParsedReturns(),
  [join(referenceDir, "_category_.json")]: REFERENCE_CATEGORY,
  [join(docsGeneratedDir, "reference-sidebar.js")]: renderReferenceSidebar(leagues, standaloneNs, loaderOnly),
  [join(docsGeneratedDir, "coverage.json")]: renderCoverageJson(leagues, standaloneNs, flatWrappers),
  [join(playgroundDir, "endpoints.json")]: renderEndpointsJson(
    wrappers,
    leagues,
    hosts,
    flatWrappers
  ),
};
const writtenEspnSet = new Set(WRITTEN_ESPN_LEAGUES);
const espnParserMap = loadEspnParserMap();
leagues.forEach((league, i) => {
  // Basketball (the written-ESPN proof) gets a per-league DIRECTORY with
  // per-function reference pages (sdv-py-style) instead of the flat
  // reference/<prefix>.md page — registered separately below.
  if (writtenEspnSet.has(league.prefix)) {
    registerWrittenLeagueDocs(
      outputs,
      league,
      wrappers,
      flatWrappers,
      espnParserMap,
      i + 2,
      releaseLoaders.get(league.prefix)
    );
    return;
  }
  // +2: position 0 is the Overview index, position 1 is the shared parsed-returns
  // page, so league pages start at 2.
  outputs[join(referenceDir, `${league.prefix}.md`)] = renderLeaguePage(
    league,
    wrappers,
    i + 2,
    flatWrappers
  );
});

// Standalone (non-league) provider pages come after the league pages.
standaloneNs.forEach((ns, i) => {
  outputs[join(referenceDir, `${ns}.md`)] = renderStandaloneFlatPage(
    ns,
    leagues.length + 2 + i,
    flatWrappers
  );
});

// WRITTEN ESPN source modules — one `src/generated/espn/<prefix>.ts` per league,
// composed in src/index.ts via the generated `src/generated/espn/index.ts` barrel
// instead of makeLeagueModule(cfg).
const writtenPrefixes = [];
for (const prefix of WRITTEN_ESPN_LEAGUES) {
  const league = leagues.find((l) => l.prefix === prefix);
  if (!league) continue;
  outputs[join(generatedEspnDir, `${prefix}.ts`)] = renderWrittenEspnModule(
    league,
    wrappers
  );
  writtenPrefixes.push(prefix);
}
outputs[join(generatedEspnDir, "index.ts")] = renderWrittenEspnBarrel(writtenPrefixes);

// WRITTEN flat-API source modules — one `src/generated/flat/<api>.ts` per family,
// composed in src/index.ts via the generated barrel instead of makeFlatModule.
const generatedFlatDir = join(generatedDir, "flat");
const writtenFlatApis = [];
for (const api of FLAT_API_FILES) {
  const defs = flatWrappers.filter((w) => w.api === api);
  if (!defs.length) continue;
  outputs[join(generatedFlatDir, `${api}.ts`)] = renderWrittenFlatModule(api, defs);
  writtenFlatApis.push(api);
}
outputs[join(generatedFlatDir, "index.ts")] = renderWrittenFlatBarrel(writtenFlatApis);

// Release loader modules (src/generated/loaders/) + the docs dir of each
// loader-only namespace (written leagues got their loaders page above).
registerLoaderModules(outputs, generatedDir, releaseLoaders);
loaderOnly.forEach(([ns], i) => {
  const dir = join(referenceRootDir, ns);
  const loaders = releaseLoaders.get(ns);
  outputs[join(dir, "index.md")] = renderLoaderOnlyIndex(ns, loaders, LOADER_ONLY[ns].note);
  outputs[join(dir, "_category_.json")] =
    JSON.stringify(
      {
        label: ns.toUpperCase(),
        position: leagues.length + standaloneNs.length + 2 + i,
        collapsed: true,
        link: { type: "doc", id: "index" },
      },
      null,
      2
    ) + "\n";
  outputs[join(dir, "reference", "_category_.json")] =
    JSON.stringify({ label: "Reference", position: 1, collapsed: true }, null, 2) + "\n";
  outputs[join(dir, "reference", "loaders.md")] = renderLoadersPage(ns, loaders, 1);
});

// One WRITTEN flat-API module: each wrapper a real `export const` delegating to
// the shared `callFlat(def, params)` core (its def hoisted to a module const).
function renderWrittenFlatModule(api, defs) {
  const meta = FLAT_API_META[api] ?? { label: api, source: api };
  const ns = FLAT_API_NAMESPACES[api] ?? api;
  let body =
    "// AUTO-GENERATED by tools/codegen/generate.mjs — do not edit by hand.\n" +
    "// Run `npm run codegen` to regenerate from tools/codegen/endpoints/*.yaml.\n" +
    "//\n" +
    `// WRITTEN flat-API module for ${meta.label} (api stem \`${api}\`). Each export\n` +
    "// delegates to the shared `callFlat(def, params)` core, so TypeScript /\n" +
    "// TypeDoc / IDEs see every wrapper.\n\n" +
    'import { callFlat } from "../../leagues/_make_flat.js";\n' +
    'import type { WrapperDef, WrapperFn } from "../../core/types.js";\n';
  const sorted = defs.slice().sort((a, b) => a.short.localeCompare(b.short));
  for (const def of sorted) {
    const snake = flatSnake(def);
    const camel = toCamel(snake);
    const defConst = `${def.short.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_DEF`;
    const defLiteral = JSON.stringify(def, null, 2);
    let jsdoc = `\n/**\n * ${meta.label} — ${humanizeShort(def.short)}.\n *\n`;
    jsdoc += ` * **Endpoint:** \`GET ${def.host}${def.path}\`\n *\n`;
    for (const p of def.pathParams ?? []) {
      const req = p.required === false ? " *(optional)*" : "";
      jsdoc += ` * @param params.${p.name} - path parameter${req}.\n`;
    }
    for (const p of def.queryParams ?? []) {
      const note = p.queryKey && p.queryKey !== p.name ? ` (\`${p.queryKey}\`)` : "";
      const d = p.default !== undefined ? ` — default \`${p.default}\`` : "";
      jsdoc += ` * @param params.${p.name} - query parameter${note}${d}.\n`;
    }
    if (meta.controls) {
      for (const [name, doc] of Object.entries(meta.controls)) jsdoc += ` * @param params.${name} - ${doc}\n`;
    } else if (def.auth) {
      jsdoc += ` * @param params.headers - optional bearer headers (auto-minted if omitted).\n`;
    }
    if (def.parser) {
      jsdoc += ` * @param params.parsed - when \`true\`, route the payload through this endpoint's parser and return tidy rows instead of the raw response.\n`;
      const sec = FLAT_PARSER_SECTIONS[def.parser];
      if (sec) {
        const names = sec.sections ? sec.sections.map((s) => `\`${s}\``).join(", ") : sec.dynamic;
        const dflt = sec.default === null ? "every table, as a dict" : `\`${sec.default}\``;
        jsdoc += ` * @param params.section - (with \`parsed: true\`) the table to return: ${names}. Default: ${dflt}; an unknown name throws, listing the valid ones.\n`;
      }
      jsdoc += ` * @returns The raw response by default; a tidy array of row objects when \`{ parsed: true }\`.\n`;
    } else {
      jsdoc += ` * @param params.parsed - accepted for symmetry, but this endpoint has no registered parser, so the raw response is always returned.\n`;
      jsdoc += ` * @returns The raw response (this endpoint has no parser).\n`;
    }
    const reqPath = (def.pathParams ?? []).filter((p) => p.required !== false);
    const flatExampleArgs = reqPath.length
      ? `{ ${reqPath.map((p) => `${p.name}: '…'`).join(", ")} }`
      : "{}";
    jsdoc += ` * @example await sdv.${ns}.${camel}(${flatExampleArgs});\n`;
    if (def.deprecated) jsdoc += ` * @deprecated ${def.deprecated}\n`;
    jsdoc += ` */\n`;
    body += `\nconst ${defConst}: WrapperDef = ${defLiteral};\n`;
    body += jsdoc;
    body += `export const ${camel}: WrapperFn = (params = {}) => callFlat(${defConst}, params);\n`;
    body += def.deprecated
      ? `/**\n * snake_case alias of {@link ${camel}} (py/R parity).\n * @deprecated ${def.deprecated}\n */\n`
      : `/** snake_case alias of {@link ${camel}} (py/R parity). */\n`;
    body += `export const ${snake} = ${camel};\n`;
  }
  return body;
}

// Barrel for the WRITTEN flat-API modules: `api -> module` map for src/index.ts.
function renderWrittenFlatBarrel(apis) {
  const sorted = apis.slice().sort();
  let body =
    "// AUTO-GENERATED by tools/codegen/generate.mjs — do not edit by hand.\n" +
    "// Run `npm run codegen` to regenerate.\n//\n" +
    "// Barrel for the WRITTEN flat-API modules. src/index.ts composes the flat\n" +
    "// surface from this `api -> module` map instead of makeFlatModule(defs).\n\n" +
    'import type { WrapperFn } from "../../core/types.js";\n';
  for (const a of sorted) body += `import * as ${toCamel(a)}Flat from "./${a}.js";\n`;
  body += "\nexport const WRITTEN_FLAT: Record<string, Record<string, WrapperFn>> = {\n";
  for (const a of sorted) body += `  ${a}: ${toCamel(a)}Flat,\n`;
  body += "};\n";
  return body;
}

// Barrel: `import * as` each written module (function exports only — CFG is
// module-private) + expose a `prefix -> module` map for src/index.ts.
function renderWrittenEspnBarrel(prefixes) {
  const sorted = prefixes.slice().sort();
  let body =
    "// AUTO-GENERATED by tools/codegen/generate.mjs — do not edit by hand.\n" +
    "// Run `npm run codegen` to regenerate from tools/codegen/endpoints/*.yaml.\n" +
    "//\n" +
    "// Barrel for the WRITTEN ESPN league modules. src/index.ts composes the ESPN\n" +
    "// surface from this `prefix -> module` map instead of makeLeagueModule(cfg).\n\n" +
    'import type { WrapperFn } from "../../core/types.js";\n';
  for (const p of sorted) body += `import * as ${toCamel(p)}Espn from "./${p}.js";\n`;
  body += "\nexport const WRITTEN_ESPN: Record<string, Record<string, WrapperFn>> = {\n";
  for (const p of sorted) body += `  ${p}: ${toCamel(p)}Espn,\n`;
  body += "};\n";
  return body;
}

const check = process.argv.includes("--check");
let drift = false;
for (const [file, content] of Object.entries(outputs)) {
  if (check) {
    const current = existsSync(file) ? readFileSync(file, "utf8") : "";
    if (current !== content) {
      console.error(`DRIFT: ${file} is stale — run \`npm run codegen\``);
      drift = true;
    }
  } else {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
    console.log(`wrote ${file}`);
  }
}

console.log(
  `codegen: ${wrappers.length} wrappers across ${leagues.length} leagues ` +
    `+ ${flatWrappers.length} flat-API wrappers (${FLAT_API_FILES.length} families) ` +
    `+ ${[...releaseLoaders.values()].flat().length} release loaders ` +
    `(+ ${leagues.length + standaloneNs.length + 3} reference pages + playground metadata)`
);
if (check && drift) process.exit(1);
if (check) console.log("codegen: generated files are up to date");

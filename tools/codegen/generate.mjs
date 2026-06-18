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

const here = dirname(fileURLToPath(import.meta.url));
const endpointsDir = join(here, "endpoints");
const schemasDir = join(here, "schemas");
const repoRoot = join(here, "..", "..");
const generatedDir = join(repoRoot, "src", "generated");
const referenceDir = join(repoRoot, "docs", "docs", "reference");
const playgroundDir = join(repoRoot, "docs", "src", "playground");
const docsGeneratedDir = join(repoRoot, "docs", "src", "generated");

const FAMILY_FILES = ["espn_site_v2", "espn_core_v2", "espn_web_v3"];

// Non-ESPN "flat API" families (one YAML each). These are absolute-host live
// APIs (no {sport}/{league} nesting) and are emitted into a SEPARATE
// FLAT_WRAPPERS table so the ESPN WRAPPERS table — and every invariant the ESPN
// contract tests assert over it ({sport} present, EspnFamily, scopes) — stays
// untouched.
const FLAT_API_FILES = [
  "mlb_api",
  "mlb_statcast",
  "nhl_api_web",
  "nhl_edge",
  "nhl_stats_rest",
  "nhl_records",
  "nfl_api",
  "odds_api",
  "sports247",
  "cbs_napi",
  "fox_bifrost",
  "yahoo_editorial",
  "yahoo_shangrila",
  "hockeytech",
];

// Which namespace each flat-API family is documented on (mirrors
// FLAT_API_NAMESPACES in src/index.ts — keep the two in sync). The runtime
// merges each family's wrappers onto this namespace (`sdv.<prefix>.<wrapper>`).
// When the namespace IS a league (mlb/nhl/nfl), the docs put the "Native API —
// <family>" section on that league's reference page. When it is NOT a league
// (`odds` — the first cross-sport provider family), the family gets its OWN
// standalone reference page (see STANDALONE_FLAT_NAMESPACES + renderStandaloneFlatPage).
const FLAT_API_NAMESPACES = {
  mlb_api: "mlb",
  mlb_statcast: "mlb",
  nhl_api_web: "nhl",
  nhl_edge: "nhl",
  nhl_stats_rest: "nhl",
  nhl_records: "nhl",
  nfl_api: "nfl",
  odds_api: "odds",
  sports247: "recruiting",
  cbs_napi: "cbs",
  fox_bifrost: "fox",
  yahoo_editorial: "yahoo",
  yahoo_shangrila: "yahoo",
  // HockeyTech / LeagueStat — standalone provider namespace (`sdv.hockeytech`)
  // for the PWHL + junior/minor leagues (league chosen by a `league` param).
  hockeytech: "hockeytech",
  // BartTorvik T-Rank — standalone provider namespace (`sdv.torvik`) for men's
  // college basketball ratings / four-factors / game + player stats / schedule.
  torvik: "torvik",
};

// Human-facing label + upstream-source blurb per flat-API family, shown in the
// section heading + intro line on the league reference page.
const FLAT_API_META = {
  mlb_api: { label: "MLB Stats API", source: "the official MLB Stats API" },
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
  sports247: {
    label: "247Sports",
    source: "the 247Sports recruiting database",
  },
  cbs_napi: { label: "CBS Sports", source: "CBS Sports napi" },
  fox_bifrost: { label: "Fox Sports", source: "Fox Sports Bifrost API" },
  yahoo_editorial: {
    label: "Yahoo Sports (editorial)",
    source: "Yahoo Sports' editorial scoreboard/boxscore feed",
  },
  yahoo_shangrila: {
    label: "Yahoo Sports (shangrila)",
    source: "Yahoo Sports' shangrila stats-graph API",
  },
  hockeytech: {
    label: "HockeyTech / LeagueStat",
    source: "the HockeyTech / LeagueStat feed (PWHL + junior/minor hockey)",
  },
  torvik: {
    label: "BartTorvik (T-Rank)",
    source: "barttorvik.com (T-Rank college basketball analytics)",
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
    "// 247Sports recruiting rankings (pass your own JWT via `headers`):\n" +
    "await sdv.recruiting.sports247_rankings({\n" +
    "  sport_key: 'football', year: 2025,\n" +
    "  headers: { Authorization: `Bearer ${process.env.SPORTS247_TOKEN}` },\n" +
    "});\n",
  cbs:
    "// CBS Sports NAPI is an anonymously-reachable public JSON API (no token):\n" +
    "await sdv.cbs.cbs_napi_team({ team_id: 'football-nfl-NE' });\n",
  fox:
    "// Fox Sports Bifrost uses a public apikey + api-version query pair\n" +
    "// (both default out of the box — override apikey if you have your own):\n" +
    "await sdv.fox.fox_bifrost_scoreboard({ sport: 'cfb' });\n",
  yahoo:
    "// Yahoo Sports is keyless but rejects requests without browser-y headers —\n" +
    "// pass Origin/Referer via `headers` (two hosts share the `yahoo` namespace):\n" +
    "await sdv.yahoo.yahoo_shangrila_league_standings({\n" +
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

function mapPathParams(ep) {
  return (ep.path_params ?? []).map((p) => ({
    name: p.name,
    ...(p.required === false ? { required: false } : {}),
    ...(p.default !== undefined ? { default: p.default } : {}),
    ...(p.default_from !== undefined ? { defaultFrom: p.default_from } : {}),
  }));
}

function mapQueryParams(ep) {
  return (ep.extra_params ?? []).map((p) => ({
    name: p.name,
    queryKey: p.query_key,
    ...(p.default !== undefined ? { default: p.default } : {}),
  }));
}

function loadWrappers() {
  const wrappers = [];
  for (const stem of FAMILY_FILES) {
    const doc = parse(readFileSync(join(endpointsDir, `${stem}.yaml`), "utf8"));
    const fileHost = doc.host;
    for (const ep of doc.endpoints ?? []) {
      wrappers.push({
        short: ep.short,
        family: ep.host ?? fileHost, // per-endpoint host override (e.g. standings)
        scope: ep.scope ?? "universal",
        path: ep.path,
        pathParams: mapPathParams(ep),
        queryParams: mapQueryParams(ep),
      });
    }
  }
  return wrappers;
}

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
    // A top-level `auth: true` on the family YAML (e.g. nfl_api) flags every
    // emitted wrapper so the flat dispatch resolves a bearer-token header set
    // before fetching (see AUTH_HEADER_PROVIDERS in src/leagues/_make_flat.ts).
    const auth = doc.auth === true;
    for (const ep of doc.endpoints ?? []) {
      wrappers.push({
        short: ep.short,
        flat: true,
        api: doc.api,
        host: doc.host,
        scope: "universal",
        path: ep.path,
        pathParams: mapPathParams(ep),
        queryParams: mapQueryParams(ep),
        ...(ep.parser ? { parser: ep.parser } : {}),
        ...(ep.returns_schema ? { returnsSchema: ep.returns_schema } : {}),
        ...(auth ? { auth: true } : {}),
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

/** Wrappers applicable to a league = those whose scope is in the league's scopes. */
function wrappersForLeague(league, wrappers) {
  const scopes = new Set(league.scopes);
  return wrappers.filter((w) => scopes.has(w.scope));
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

/** snake_case -> camelCase (e.g. `mlb_api_teams` -> `mlbApiTeams`). */
function toCamel(s) {
  return s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());
}

/** Flat wrappers belonging to a given league prefix (via FLAT_API_NAMESPACES). */
function flatWrappersForLeague(prefix, flatWrappers) {
  return flatWrappers.filter((w) => FLAT_API_NAMESPACES[w.api] === prefix);
}

/** Render the parser cell for a flat wrapper (raw JSON passthrough when none). */
function flatParserCell(wrapper) {
  return wrapper.parser ? `\`${wrapper.parser}\`` : "*(raw)*";
}

// In-process cache so each `returns_schema` YAML is read + parsed at most once.
const _schemaCache = new Map();

/**
 * Load a returns-schema's `columns` for a `returns_schema` value (e.g.
 * `native/mlb_api/boxscore` or `autodoc/mlb/mlb_statcast_search`), resolved
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
  const host = rows[0].host;
  const authed = rows.some((w) => w.auth);
  let body = `\n## Native API — ${meta.label}\n\n`;
  body +=
    `Flat (non-ESPN) wrappers for ${meta.source}. ` +
    `Host: \`${host}\`. ` +
    `Each method is exposed under BOTH \`${api}_<endpoint>\` (snake_case, ` +
    `py/R parity) and \`${toCamel(api)}<Endpoint>\` (camelCase canonical) on ` +
    `\`sdv.${nsPrefix}\`. Pass \`{ parsed: true }\` to run the payload ` +
    `through its tidy.js parser; omit it for the raw response.`;
  if (authed) {
    body +=
      ` **Auth:** this family mints a bearer token automatically before ` +
      `each call (no credentials required).`;
  }
  body += `\n\n`;
  body += `| Method | HTTP | Path params | Query params | Parser | Auth |\n`;
  body += `|---|---|---|---|---|---|\n`;
  const sorted = rows.slice().sort((a, b) => a.short.localeCompare(b.short));
  for (const w of sorted) {
    const camel = toCamel(`${api}_${w.short}`);
    const method = `\`${api}_${w.short}\` / \`${camel}\``;
    const http = `\`${w.host}${w.path}\``;
    const auth = w.auth ? "yes" : "—";
    body += `| ${method} | ${http} | ${pathParamsCell(w)} | ${queryParamsCell(w)} | ${flatParserCell(w)} | ${auth} |\n`;
  }
  // Per-wrapper `Returns` tables (one `### Returns — <wrapper>` block per
  // endpoint whose `returns_schema` resolves to a committed columns file).
  // Endpoints with no schema (raw-JSON / generic-list passthroughs) emit none.
  for (const w of sorted) {
    const cols = loadReturnsColumns(w.returnsSchema);
    if (!cols) continue;
    const camel = toCamel(`${api}_${w.short}`);
    body += renderReturnsTable(`\`${api}_${w.short}\` / \`${camel}\``, cols);
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
    `\`${ns}\` is a cross-sport provider namespace (no ESPN \`{sport}\`/\`{league}\` ` +
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
      const method = `\`${wrapperName(league.prefix, w.short)}\``;
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
const ESPN_PARSER_ORDER = [
  "parse_scoreboard", "parse_teams", "parse_standings", "parse_groups",
  "parse_athlete_overview", "parse_athlete_stats", "parse_athlete_gamelog", "parse_athlete_splits",
  "parse_leaders", "parse_coaches", "parse_draft",
  "parse_event_competitor_roster", "parse_event_competitor_statistics",
  "parse_event_competitor_linescores", "parse_event_plays",
  "parse_team_schedule", "parse_team_roster", "parse_news", "parse_injuries",
  "parse_summary", "parse_items", "parse_single_entity",
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
    if (fn === "parse_summary") {
      body +=
        `\`summary\` is a dispatcher: \`{ parsed: true }\` returns an object of all ` +
        `21 sub-frames keyed by section; \`{ parsed: true, section: '<name>' }\` ` +
        `returns just that one. See [Summary sub-frames](#summary-sub-frames) below.\n`;
      continue;
    }
    const cols = loadReturnsColumns(`espn/${fn.replace(/^parse_/, "")}`);
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
    body += `| [${l.prefix}](./${l.prefix}) | \`${l.sport}\` | \`${slug}\` | ${l.scopes.join(", ")} | ${count} | ${native || "—"} |\n`;
  }

  // Standalone (non-league) provider namespaces — e.g. `odds` (The Odds API),
  // the first cross-sport provider family. Each gets its own reference page
  // (renderStandaloneFlatPage) rather than a "Native API" section on a league.
  if (standaloneNs.length) {
    body +=
      `\n## Standalone provider namespaces\n\n` +
      `Cross-sport providers that aren't tied to a single ESPN league. They get ` +
      `their own \`sdv.<namespace>\` surface and reference page.\n\n` +
      `| Namespace | provider | wrappers |\n` +
      `|---|---|---:|\n`;
    for (const ns of standaloneNs) {
      const families = FLAT_API_FILES.filter((api) => FLAT_API_NAMESPACES[api] === ns);
      const count = flatWrappers.filter((w) => families.includes(w.api)).length;
      const labels = families
        .map((api) => (FLAT_API_META[api] ?? { label: api }).label)
        .join(", ");
      body += `| [${ns}](./${ns}) | ${labels} | ${count} |\n`;
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
    `await sdv.mlb.mlbApiSchedule({ sportId: 1, date: '2024-07-01' });\n` +
    `await sdv.nhl.nhlApiWebPbp({ gameId: 2023030417, parsed: true });\n` +
    `await sdv.nfl.nflApiStandings({ season: 2024, seasonType: 'REG', week: 1 });\n` +
    "```\n" +
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
function renderReferenceSidebar(leagues, standaloneNs) {
  // Group league prefixes by sport, sorted deterministically within each group.
  const bySport = new Map();
  for (const l of leagues) {
    if (!bySport.has(l.sport)) bySport.set(l.sport, []);
    bySport.get(l.sport).push(l.prefix);
  }
  // Sport order: the curated SPORT_ORDER first, then any extra sport alphabetically.
  const sports = [
    ...SPORT_ORDER.filter((s) => bySport.has(s)),
    ...[...bySport.keys()].filter((s) => !SPORT_ORDER.includes(s)).sort(),
  ];

  const items = [
    { type: "doc", id: "reference/index", label: "Overview" },
    { type: "doc", id: "reference/espn-parsed-returns", label: "Parsed returns" },
  ];
  for (const sport of sports) {
    const prefixes = bySport.get(sport).slice().sort((a, b) => a.localeCompare(b));
    items.push({
      type: "category",
      label: sportLabel(sport),
      collapsible: true,
      collapsed: true,
      items: prefixes.map((p) => ({ type: "doc", id: `reference/${p}`, label: p })),
    });
  }
  if (standaloneNs.length) {
    const ns = standaloneNs.slice().sort((a, b) => a.localeCompare(b));
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
  const bySport = new Map();
  for (const l of leagues) {
    if (!bySport.has(l.sport)) bySport.set(l.sport, []);
    bySport.get(l.sport).push(l.prefix);
  }
  const sportOrder = [
    ...SPORT_ORDER.filter((s) => bySport.has(s)),
    ...[...bySport.keys()].filter((s) => !SPORT_ORDER.includes(s)).sort(),
  ];
  const sports = sportOrder.map((sport) => ({
    sport,
    prefixes: bySport.get(sport).slice().sort((a, b) => a.localeCompare(b)),
  }));

  const counts = {};
  for (const w of flatWrappers) {
    const ns = FLAT_API_NAMESPACES[w.api];
    if (ns) counts[ns] = (counts[ns] || 0) + 1;
  }
  const providers = standaloneNs
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

function renderEndpointsJson(wrappers, leagues, hosts, flatWrappers, flatHosts) {
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
        flatLeagues: FLAT_API_NAMESPACES,
        flatApis: flatWrappers,
      },
      null,
      2
    ) + "\n"
  );
}

/** Build the per-family flat-host map ({ mlb_api: "https://statsapi.mlb.com" }). */
function flatHostsFrom(flatWrappers) {
  const hosts = {};
  for (const w of flatWrappers) hosts[w.api] = w.host;
  return hosts;
}

// ---------------------------------------------------------------------------
// Assemble + write/check
// ---------------------------------------------------------------------------

const wrappers = loadWrappers();
const flatWrappers = loadFlatWrappers();
const flatHosts = flatHostsFrom(flatWrappers);
const leaguesDoc = loadLeaguesDoc();
const leagues = loadLeagues(leaguesDoc);
const hosts = leaguesDoc.hosts;

// Flat-API namespaces that are NOT leagues (e.g. `odds`) get their own
// standalone reference page instead of a "Native API" section on a league page.
const standaloneNs = standaloneFlatNamespaces(leagues);

// The generated wrappers module exports the ESPN `WRAPPERS` table (unchanged)
// plus a separate `FLAT_WRAPPERS` table for the non-ESPN flat APIs.
const wrappersTs =
  renderTs("WrapperDef", "WRAPPERS", wrappers) +
  `\nexport const FLAT_WRAPPERS: WrapperDef[] = ${JSON.stringify(flatWrappers, null, 2)};\n`;

const outputs = {
  [join(generatedDir, "wrappers.ts")]: wrappersTs,
  [join(generatedDir, "leagues.ts")]: renderTs("LeagueConfig", "LEAGUES", leagues),
  [join(referenceDir, "index.md")]: renderReferenceIndex(leagues, wrappers, flatWrappers, standaloneNs),
  [join(referenceDir, "espn-parsed-returns.md")]: renderEspnParsedReturns(),
  [join(referenceDir, "_category_.json")]: REFERENCE_CATEGORY,
  [join(docsGeneratedDir, "reference-sidebar.js")]: renderReferenceSidebar(leagues, standaloneNs),
  [join(docsGeneratedDir, "coverage.json")]: renderCoverageJson(leagues, standaloneNs, flatWrappers),
  [join(playgroundDir, "endpoints.json")]: renderEndpointsJson(
    wrappers,
    leagues,
    hosts,
    flatWrappers,
    flatHosts
  ),
};
leagues.forEach((league, i) => {
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
    `(+ ${leagues.length + standaloneNs.length + 3} reference pages + playground metadata)`
);
if (check && drift) process.exit(1);
if (check) console.log("codegen: generated files are up to date");

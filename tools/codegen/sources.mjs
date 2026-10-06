// Sources-first view-model: docs/src/generated/sources.json — one row per upstream
// SOURCE (ESPN as one row with its five families; each native provider; the release
// loaders), rendered by docs/src/components/SourcesCovered on the homepage, the intro,
// the Sources page and every league index. Counts, leagues, ownership, parity and
// description fill are all derived here from the same codegen pass, so the page is
// drift-guarded by `codegen:check` and never hand-maintained.

// Source table: id -> label, the family stems it groups, auth kind, and a short note.
// `auth`: none | key | subscription | impersonation (what the CALLER must bring).
const SOURCES = [
  { id: "espn", label: "ESPN", families: ["espn_site_v2", "espn_core_v2", "espn_web_v3", "espn_fitt_v3", "espn_cdn"], auth: "none", note: "Site v2 / Core v2 / Web v3 / FPI / CDN, one wrapper set bound on every league." },
  { id: "nba_stats", label: "stats.nba.com", families: ["nba_stats"], auth: "impersonation", note: "NBA, G League and Summer League by `league_id`; TLS-impersonating transport, residential IP." },
  { id: "wnba_stats", label: "stats.wnba.com", families: ["wnba_stats"], auth: "impersonation", note: "Same transport as stats.nba.com." },
  { id: "mlb", label: "MLB Stats API", families: ["mlb"], auth: "none" },
  { id: "mlb_statcast", label: "Baseball Savant (Statcast)", families: ["mlb_statcast"], auth: "none", note: "CSV / JSON / HTML leaderboards, search and game feeds." },
  { id: "nhl", label: "NHL APIs", families: ["nhl_api_web", "nhl_edge", "nhl_stats_rest", "nhl_records"], auth: "none", note: "api-web game feed, EDGE tracking, Stats REST and Records." },
  { id: "nfl_api", label: "NFL.com Shield", families: ["nfl_api"], auth: "none", note: "Bearer token minted by the runtime; nothing to configure." },
  { id: "nfl_pro", label: "NFL Pro (Next Gen Stats)", families: ["nfl_pro"], auth: "subscription" },
  { id: "pff_api", label: "PFF Developer API", families: ["pff_api"], auth: "subscription" },
  { id: "kenpom", label: "KenPom", families: ["kenpom"], auth: "subscription" },
  { id: "torvik", label: "BartTorvik (T-Rank)", families: ["torvik", "bart_wbb"], auth: "none", note: "Men's and women's T-Rank." },
  { id: "on3", label: "On3 Recruit Database", families: ["on3"], auth: "none" },
  { id: "sports247", label: "247Sports", families: ["sports247", "sports247_site_pages"], auth: "impersonation", note: "Guest JWT minted by the runtime; browser-impersonating transport (`npm install impit`)." },
  { id: "cbs", label: "CBS Sports", families: ["cbs"], auth: "none" },
  { id: "fox", label: "Fox Sports", families: ["fox"], auth: "none" },
  { id: "yahoo", label: "Yahoo Sports", families: ["yahoo", "yahoo_scores"], auth: "none", note: "Stats graph + scores." },
  { id: "odds_api", label: "The Odds API", families: ["odds_api"], auth: "key" },
  { id: "hockeytech", label: "HockeyTech / LeagueStat", families: ["hockeytech"], auth: "none", note: "PWHL + 19 junior / minor leagues by `league`; public per-league keys are built in." },
  { id: "asa", label: "American Soccer Analysis", families: ["asa"], auth: "none" },
  { id: "mls_api", label: "MLS web API", families: ["mls_api"], auth: "none" },
  { id: "nwsl_api", label: "NWSL (StatsPerform SDP)", families: ["nwsl_api"], auth: "none" },
  { id: "recruiting", label: "247Sports (legacy API)", families: ["recruiting"], auth: "none", deprecated: true, note: "`api.247sports.com` answers HTTP 500; every method is deprecated in favour of 247Sports." },
];

const ESPN_HOST_LABEL = {
  site_v2: "site.api.espn.com",
  site_v2_alt: "site.api.espn.com",
  web_v3: "site.web.api.espn.com",
  core_v2: "sports.core.api.espn.com",
  fitt_v3: "site.web.api.espn.com (FPI)",
  cdn: "cdn.espn.com",
};

const hostOf = (url) => (url ? url.replace(/^https?:\/\//, "").replace(/\/.*$/, "") : "");

/**
 * Build the sources rows from the codegen facts:
 *   leagues, wrappers (ESPN), flatWrappers, namespaces (api -> ns), hosts (api -> host url),
 *   meta (FLAT_API_META), isVendored(api), loaders (Map ns -> loaders[]), parity
 *   (parity_coverage.json), descriptions (descriptionCoverage().families), espnHosts (leagues.yaml).
 */
export function buildSources(f) {
  const leaguePrefixes = new Set(f.leagues.map((l) => l.prefix));
  const sum = (xs, k) => xs.reduce((n, x) => n + (x?.[k] ?? 0), 0);
  const rows = [];

  for (const s of SOURCES) {
    const isEspn = s.id === "espn";
    const families = s.families.map((api) => {
      if (isEspn) {
        const key = api.replace(/^espn_/, "");
        const count = f.wrappers.filter((w) => w.family === key || (key === "site_v2" && w.family === "site_v2_alt")).length;
        return { api, label: api.replace(/^espn_/, "ESPN ").replace("_", " "), host: ESPN_HOST_LABEL[key] ?? hostOf(f.espnHosts[key]), count, ownership: "vendored" };
      }
      const count = f.flatWrappers.filter((w) => w.api === api).length;
      if (!count) throw new Error(`sources: family ${api} has no wrappers`);
      return { api, label: f.meta[api]?.label ?? api, host: hostOf(f.hosts[api]), count, ownership: f.isVendored(api) ? "vendored" : "js-owned" };
    });
    const nss = isEspn ? [] : [...new Set(s.families.map((api) => f.namespaces[api] ?? api))];
    const leagues = isEspn ? f.leagues.map((l) => l.prefix) : nss.filter((ns) => leaguePrefixes.has(ns));
    const standalone = nss.filter((ns) => !leaguePrefixes.has(ns));
    const owners = [...new Set(families.map((x) => x.ownership))];
    const parityFams = s.families.map((api) => f.parity[api]).filter(Boolean);
    const descFams = (isEspn ? ["espn"] : s.families).map((api) => f.descriptions[api]).filter(Boolean);
    const docsPath = isEspn
      ? "/docs/reference/"
      : leagues.length === 1 && !standalone.length
        ? `/docs/${leagues[0]}/reference/native`
        : `/docs/reference/${standalone[0] ?? nss[0]}`;
    rows.push({
      id: s.id,
      label: s.label,
      host: [...new Set(families.map((x) => x.host))].join(", "),
      families,
      leagues,
      namespaces: isEspn ? ["<league>"] : nss,
      wrapperCount: sum(families, "count"),
      auth: s.auth,
      ownership: owners.length === 1 ? owners[0] : "mixed",
      // verified / documented tables of the parity harness; null when the source has no
      // documented py returns table (ESPN, cbs, torvik: nothing to verify against yet)
      parity: sum(parityFams, "documented") ? { verified: sum(parityFams, "verified"), total: sum(parityFams, "documented") } : null,
      descriptionFill: descFams.length ? { filled: sum(descFams, "filled"), total: sum(descFams, "total") } : null,
      docsPath,
      ...(s.deprecated ? { deprecated: true } : {}),
      ...(s.note ? { note: s.note } : {}),
    });
  }

  // Every flat family is on exactly one source.
  const covered = new Set(SOURCES.flatMap((s) => s.families));
  for (const api of new Set(f.flatWrappers.map((w) => w.api))) {
    if (!covered.has(api)) throw new Error(`sources: flat family ${api} is on no source row; add it to SOURCES in tools/codegen/sources.mjs`);
  }

  const loaderNs = [...f.loaders.keys()].sort();
  const loaderCount = [...f.loaders.values()].flat().length;
  rows.push({
    id: "releases",
    label: "sportsdataverse-data releases",
    host: "github.com/sportsdataverse/sportsdataverse-data",
    families: loaderNs.map((ns) => ({ api: `loaders:${ns}`, label: `sdv.${ns} loaders`, host: "github.com", count: f.loaders.get(ns).length, ownership: "loaders" })),
    leagues: loaderNs,
    namespaces: loaderNs,
    wrapperCount: loaderCount,
    auth: "none",
    ownership: "loaders",
    parity: null,
    descriptionFill: f.descriptions.loaders ? { filled: f.descriptions.loaders.filled, total: f.descriptions.loaders.total } : null,
    docsPath: "/docs/reference/#dataset-loaders",
    note: "Pre-built parquet datasets (`load*`) published as GitHub release assets.",
  });

  return {
    _generated: "tools/codegen/generate.mjs (tools/codegen/sources.mjs) — do not edit by hand",
    totals: {
      sources: rows.length,
      espnShorts: f.wrappers.length,
      espnLeagues: f.leagues.length,
      flatWrappers: f.flatWrappers.length,
      flatFamilies: new Set(f.flatWrappers.map((w) => w.api)).size,
      loaders: loaderCount,
    },
    sources: rows,
  };
}

export function renderSourcesJson(facts) {
  return JSON.stringify(buildSources(facts), null, 2) + "\n";
}

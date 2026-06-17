// Curated playground presets. Each preset prefills the playground (league +
// endpoint + params + parsed/section). The SAME data drives two things:
//   1. the in-app "Examples" menu (the Playground component imports `EXAMPLES`),
//   2. the "Open in playground ▶" deep-links on the recipe pages
//      (which call `playgroundUrl(preset)`).
//
// `endpoint` is the playground's selection id:
//   - ESPN endpoints:  `espn:<short>`            (e.g. `espn:scoreboard`)
//   - native (flat):   `flat:<api>:<short>`      (e.g. `flat:mlb_api:schedule`)
// Keep presets to STABLE params (no volatile per-day ids) so the links keep
// working; endpoints that need a game/event id note it in `blurb`.

/** @typedef {{ id:string, sport:string, label:string, blurb:string,
 *   league:string, endpoint:string, params?:Record<string,string|number>,
 *   parsed?:boolean, section?:string }} Example */

/** @type {Example[]} */
export const EXAMPLES = [
  // --- ESPN — the core cross-league surface ------------------------------
  {
    id: 'nba-scoreboard',
    sport: 'NBA',
    label: "NBA — today's scoreboard",
    blurb: "Every NBA game on today's slate, parsed to one tidy row per game.",
    league: 'nba',
    endpoint: 'espn:scoreboard',
    parsed: true,
  },
  {
    id: 'nba-roster',
    sport: 'NBA',
    label: 'NBA — Lakers roster',
    blurb: 'A full team roster (team_id 13 = Lakers), one row per player.',
    league: 'nba',
    endpoint: 'espn:team_roster',
    params: { team_id: 13 },
    parsed: true,
  },
  {
    id: 'nba-summary',
    sport: 'NBA',
    label: 'NBA — game summary dispatcher',
    blurb:
      'The summary endpoint returns 21 sub-frames (boxscore, plays, leaders…). ' +
      'Fill event_id from a scoreboard, then switch sections in the table view.',
    league: 'nba',
    endpoint: 'espn:summary',
    parsed: true,
    section: 'boxscore_team',
  },
  {
    id: 'wnba-scoreboard',
    sport: 'WNBA',
    label: 'WNBA — scoreboard',
    blurb: "Today's WNBA games, one row each.",
    league: 'wnba',
    endpoint: 'espn:scoreboard',
    parsed: true,
  },
  {
    id: 'nfl-scoreboard',
    sport: 'NFL',
    label: 'NFL — scoreboard',
    blurb: "Every NFL game on the current slate, one tidy row per game.",
    league: 'nfl',
    endpoint: 'espn:scoreboard',
    parsed: true,
  },
  {
    id: 'cfb-scoreboard',
    sport: 'CFB',
    label: 'CFB — scoreboard',
    blurb: 'College-football games on the current slate, parsed.',
    league: 'cfb',
    endpoint: 'espn:scoreboard',
    parsed: true,
  },
  {
    id: 'cfb-rankings',
    sport: 'CFB',
    label: 'CFB — AP poll & rankings',
    blurb: 'Current college-football rankings, parsed.',
    league: 'cfb',
    endpoint: 'espn:rankings',
    parsed: true,
  },
  {
    id: 'mbb-rankings',
    sport: 'MBB',
    label: "MBB — AP Top 25",
    blurb: "Current men's-college-basketball rankings, parsed.",
    league: 'mbb',
    endpoint: 'espn:rankings',
    parsed: true,
  },
  {
    id: 'nhl-scoreboard',
    sport: 'NHL',
    label: 'NHL — scoreboard',
    blurb: "Today's NHL games via ESPN, one tidy row per game.",
    league: 'nhl',
    endpoint: 'espn:scoreboard',
    parsed: true,
  },
  {
    id: 'epl-scoreboard',
    sport: 'Soccer',
    label: 'Soccer — EPL scoreboard',
    blurb: 'English Premier League fixtures (league slug eng.1), parsed.',
    league: 'soccer',
    endpoint: 'espn:scoreboard',
    params: { league: 'eng.1' },
    parsed: true,
  },

  // --- Native (non-ESPN) league APIs -------------------------------------
  {
    id: 'mlb-api-schedule',
    sport: 'MLB',
    label: 'MLB — Stats API schedule',
    blurb:
      "MLB's own statsapi.mlb.com schedule feed. Add a `date` (YYYY-MM-DD) or " +
      '`season` param to scope it; parsed to one row per game.',
    league: 'mlb',
    endpoint: 'flat:mlb_api:schedule',
    parsed: true,
  },
  {
    id: 'nhl-api-standings',
    sport: 'NHL',
    label: 'NHL — api-web standings',
    blurb: "The league's current full-season standings from api-web.nhle.com, parsed.",
    league: 'nhl',
    endpoint: 'flat:nhl_api_web:standings_season',
    parsed: true,
  },

  // --- New provider families ---------------------------------------------
  {
    id: 'odds-sports',
    sport: 'Odds',
    label: 'Odds — list available sports',
    blurb:
      'The Odds API requires your own key — supply it in the api_key field ' +
      '(get one free at the-odds-api.com). Lists every league it covers, parsed.',
    league: 'odds',
    endpoint: 'flat:odds_api:sports',
    params: { api_key: 'YOUR_ODDS_API_KEY' },
    parsed: true,
  },
  {
    id: 'cbs-league',
    sport: 'CBS',
    label: 'CBS — league metadata (NFL)',
    blurb:
      "CBS Sports' public NAPI league resource. The league_id is a slug like " +
      '`football-nfl` / `basketball-nba`; parsed to tidy rows.',
    league: 'cbs',
    endpoint: 'flat:cbs_napi:league',
    params: { league_id: 'football-nfl' },
    parsed: true,
  },
  {
    id: 'fox-scoreboard',
    sport: 'Fox',
    label: 'Fox — Bifrost scoreboard (CFB)',
    blurb:
      "Fox Sports' Bifrost scoreboard. The public apikey + api-version default " +
      'out of the box — just pass a `sport` (cfb / nfl / mlb / nba …). Parsed.',
    league: 'fox',
    endpoint: 'flat:fox_bifrost:scoreboard',
    params: { sport: 'cfb' },
    parsed: true,
  },
  {
    id: 'yahoo-standings',
    sport: 'Yahoo',
    label: 'Yahoo — league standings (NCAAF)',
    blurb:
      "Yahoo's shangrila stats-graph standings. Pass a `league` slug (ncaaf / " +
      'nfl / nba …); parsed to tidy rows.',
    league: 'yahoo',
    endpoint: 'flat:yahoo_shangrila:league_standings',
    params: { league: 'ncaaf' },
    parsed: true,
  },
  {
    id: 'recruiting-rankings',
    sport: '247',
    label: '247 — recruiting rankings',
    blurb:
      "247Sports' player rankings. Scope with `year` + `sport_key` " +
      '(e.g. 2025 / football); parsed.',
    league: 'recruiting',
    endpoint: 'flat:sports247:rankings',
    params: { year: 2025, sport_key: 'football' },
    parsed: true,
  },
];

/** snake_case -> camelCase, matching the playground's param aliasing. */
const enc = encodeURIComponent;

/**
 * Build a shareable, deep-linkable playground URL for a preset, e.g.
 * `/playground?l=nba&e=espn:scoreboard&parsed=1`. Params are flattened into the
 * query string; the Playground reads them back on load.
 */
export function playgroundUrl(preset) {
  const q = [`l=${enc(preset.league)}`, `e=${enc(preset.endpoint)}`];
  if (preset.parsed) q.push('parsed=1');
  if (preset.section) q.push(`section=${enc(preset.section)}`);
  for (const [k, v] of Object.entries(preset.params || {})) q.push(`${enc(k)}=${enc(v)}`);
  return `/playground?${q.join('&')}`;
}

/** Group presets by sport for menu rendering. */
export function examplesBySport() {
  const groups = {};
  for (const ex of EXAMPLES) (groups[ex.sport] ??= []).push(ex);
  return groups;
}

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
    id: 'cfb-rankings',
    sport: 'CFB',
    label: 'CFB — AP poll & rankings',
    blurb: 'Current college-football rankings, parsed.',
    league: 'cfb',
    endpoint: 'espn:rankings',
    parsed: true,
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
    id: 'epl-scoreboard',
    sport: 'Soccer',
    label: 'Soccer — EPL scoreboard',
    blurb: 'English Premier League fixtures (league slug eng.1), parsed.',
    league: 'soccer',
    endpoint: 'espn:scoreboard',
    params: { league: 'eng.1' },
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

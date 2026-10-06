// 13 — Discovering the surface: listFunctions, findTeam, and the parser registry.
//
// Shows: the runtime index of what the package exposes. `listFunctions(league)`
// returns the callable names on a namespace (camelCase canonical, with the
// snake_case twins folded away), `functionCount()` the per-namespace totals,
// `findTeam(name, league)` resolves a fuzzy team name to its ESPN team record
// (one `teams` request per league, cached), and the `sportsdataverse/parsers`
// subpath (`parseEndpoint`, `PARSERS`) exposes the parser layer so you can run a
// registered parser on JSON you already have — the same bundle the docs
// playground runs in the browser.
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/site/v2/sports/basketball/nba/teams (findTeam)
// Offline fixture: test/fixtures/espn/teams_site_nba.json (all 30 teams, 2026-10-05).

import sdv, { listFunctions, functionCount, findTeam, LEAGUES } from 'sportsdataverse';
import { parseEndpoint, PARSERS } from 'sportsdataverse/parsers';
import { readFileSync } from 'node:fs';
import { setup } from './_offline.mjs';
import { printTable } from './_util.mjs';

setup();

// 1. How big is each namespace?
const counts = await functionCount();
printTable(
  Object.entries(counts).map(([ns, n]) => ({ namespace: `sdv.${ns}`, functions: n })).sort((a, b) => b.functions - a.functions),
  ['namespace', 'functions'],
  10,
  'Largest namespaces (functionCount)'
);

// 2. Search within a league.
const nhlShots = await listFunctions('nhl', { search: 'shot' });
printTable(nhlShots.map((name) => ({ name })), ['name'], 10, `sdv.nhl functions matching "shot" (${nhlShots.length})`);

// 3. Resolve a team by (partial) name → ESPN team record.
const team = await findTeam('Celtics', 'nba');
printTable([{ id: team.id, abbreviation: team.abbreviation, displayName: team.displayName, color: team.color, slug: team.slug }], ['id', 'abbreviation', 'displayName', 'color', 'slug'], 1, "findTeam('Celtics', 'nba')");

// 4. The parser registry: run a registered parser on a payload you already hold.
const raw = JSON.parse(readFileSync(new URL('../test/fixtures/espn/scoreboard_nba.json', import.meta.url), 'utf8'));
const rows = parseEndpoint('espn', 'scoreboard', raw);
console.log(`PARSERS: ${Object.keys(PARSERS).length} flat parsers registered; parseEndpoint('espn', 'scoreboard', raw) → ${rows.length} rows, ${Object.keys(rows[0]).length} columns`);
printTable(rows, ['game_id', 'short_name', 'status_type_description', 'home_score', 'away_score'], 4, 'parseEndpoint("espn", "scoreboard", raw) on a saved payload');

// 5. The league matrix.
printTable(
  LEAGUES.map((l) => ({ prefix: l.prefix, sport: l.sport, league: l.league, scopes: l.scopes.join('+') })),
  ['prefix', 'sport', 'league', 'scopes'],
  8,
  `LEAGUES (${LEAGUES.length} entries)`
);

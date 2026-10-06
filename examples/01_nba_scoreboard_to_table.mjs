// 01 — NBA scoreboard → a tidy games table.
//
// Shows: the one pattern to learn, `{ parsed: true }`. The raw ESPN scoreboard
// nests each game under events[].competitions[0].competitors[]; the parsed call
// gives one flat row per game (home_*/away_* columns), ready for a table.
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard
// Offline fixture: test/fixtures/espn/scoreboard_nba.json (SDV_LIVE=1 for today's board).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable } from './_util.mjs';

setup();

// Raw: the provider's exact payload.
const raw = await sdv.nba.espnNbaScoreboard({});
console.log(`raw payload: ${raw.events.length} events, top-level keys = ${Object.keys(raw).join(', ')}`);

// Parsed: one row per game, snake_case, flat.
const games = await sdv.nba.espnNbaScoreboard({ parsed: true });
printTable(
  games,
  ['game_id', 'short_name', 'status_type_detail', 'home_abbreviation', 'home_score', 'away_abbreviation', 'away_score'],
  10,
  'Games (parsed scoreboard)'
);

// A derived table: margin of victory for finished games, biggest first.
const finals = games
  .filter((g) => g.status_type_completed)
  .map((g) => ({
    short_name: g.short_name,
    winner: Number(g.home_score) > Number(g.away_score) ? g.home_abbreviation : g.away_abbreviation,
    margin: Math.abs(Number(g.home_score) - Number(g.away_score)),
    venue: g.venue_full_name,
  }))
  .sort((a, b) => b.margin - a.margin);
printTable(finals, ['short_name', 'winner', 'margin', 'venue'], 5, 'Biggest margins');

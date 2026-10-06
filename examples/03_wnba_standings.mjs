// 03 — WNBA standings → conference tables.
//
// Shows: the ESPN `standings` endpoint parsed to one row per team, grouped by
// conference, plus a derived Pythagorean-expectation column. The same call works
// on every league namespace (sdv.nba / sdv.nfl / sdv.nhl / … .espn<Lg>Standings).
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/v2/sports/basketball/wnba/standings?season=2025
// Offline fixture: test/fixtures/espn/standings_wnba_2025.json (captured 2026-10-06).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const rows = await sdv.wnba.espnWnbaStandings({ season: 2025, parsed: true });
console.log(`${rows.length} teams across ${new Set(rows.map((r) => r.group_name)).size} groups`);

const table = rows.map((r) => {
  const pf = r.points_for;
  const pa = r.points_against;
  return {
    conf: r.group_abbreviation,
    team: r.team_abbreviation,
    w: r.wins,
    l: r.losses,
    win_pct: round(r.win_percent, 3),
    diff: round(r.differential, 1),
    pyth: round(pf ** 13.91 / (pf ** 13.91 + pa ** 13.91), 3), // basketball exponent
    streak: r.streak,
    seed: r.playoff_seed,
  };
});

for (const conf of ['E', 'W']) {
  printTable(
    table.filter((t) => t.conf === conf).sort((a, b) => b.win_pct - a.win_pct),
    ['team', 'w', 'l', 'win_pct', 'diff', 'pyth', 'streak', 'seed'],
    8,
    `${conf === 'E' ? 'Eastern' : 'Western'} Conference`
  );
}

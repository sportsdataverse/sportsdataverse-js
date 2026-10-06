// 11 — The Odds API: a historical odds snapshot → de-vigged win probabilities.
//
// Shows: a provider namespace (`sdv.odds.oddsApi*`, caller-supplied api_key)
// whose parsed frame unrolls bookmakers × markets × outcomes into one row per
// outcome, and the market-math helpers merged onto the same namespace
// (`probFromAmerican`, `devigMultiplicative`, `devigShin`, … — a port of sdv-py
// `wexp.market`). The lines are real: a 2020 NFL opener snapshot from the
// SportsDataverse odds-data backfill.
//
// Sources: The Odds API v4 — api.the-odds-api.com/v4/historical/sports/americanfootball_nfl/odds
// Offline fixture: test/fixtures/odds/nfl_lines_20200911T001500Z_0.json
// (sportsdataverse/odds-data `odds/nfl/lines/20200911T001500Z_0.json`, HOU @ KC 2020-09-10).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const rows = await sdv.odds.oddsApiSportsOddsHistory({
  sport_key: 'americanfootball_nfl',
  api_key: process.env.ODDS_API_KEY ?? 'offline',
  date: '2020-09-11T00:15:00Z',
  regions: 'us',
  markets: 'h2h',
  parsed: true,
});
console.log(`${rows.length} outcome rows, snapshot ${rows[0]?.timestamp}, markets: ${[...new Set(rows.map((r) => r.market_key))].join(', ')}`);

const h2h = rows.filter((r) => r.market_key === 'h2h');
printTable(h2h, ['home_team', 'away_team', 'bookmaker', 'outcomes_name', 'outcomes_price'], 6, 'h2h outcomes (one row per bookmaker × outcome)');

// Per bookmaker: raw implied probabilities, the overround, and two de-vig methods.
const byBook = new Map();
for (const r of h2h) {
  if (!byBook.has(r.bookmaker_key)) byBook.set(r.bookmaker_key, []);
  byBook.get(r.bookmaker_key).push(r);
}
const table = [];
for (const [book, outs] of byBook) {
  const home = outs.find((o) => o.outcomes_name === o.home_team);
  const away = outs.find((o) => o.outcomes_name === o.away_team);
  if (!home || !away) continue;
  const raw = [sdv.odds.probFromAmerican(home.outcomes_price), sdv.odds.probFromAmerican(away.outcomes_price)];
  const mult = sdv.odds.devigMultiplicative(raw);
  const shin = sdv.odds.devigShin(raw);
  table.push({
    bookmaker: book,
    home_price: home.outcomes_price,
    away_price: away.outcomes_price,
    overround: round(raw[0] + raw[1] - 1, 4),
    home_raw: round(raw[0], 4),
    home_mult: round(mult[0], 4),
    home_shin: round(shin[0], 4),
  });
}
printTable(table.sort((a, b) => a.overround - b.overround), ['bookmaker', 'home_price', 'away_price', 'overround', 'home_raw', 'home_mult', 'home_shin'], 10, 'Kansas City win probability by bookmaker (raw → de-vigged)');

// The consensus (median of the Shin-de-vigged home probabilities) and a spread
// cross-check. `spreadToProb(spread, sigma)` is Phi(spread / sigma) with `spread`
// the expected HOME margin (KC was a 9.5-point favourite → +9.5), sigma the
// historical NFL margin sd (~13.5).
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const consensus = med(table.map((t) => t.home_shin));
const fromSpread = sdv.odds.spreadToProb(9.5, 13.5);
printTable(
  [
    { quantity: 'consensus P(home): median Shin', value: round(consensus, 4) },
    { quantity: 'spreadToProb(+9.5, 13.5)', value: round(fromSpread, 4) },
    { quantity: 'logitBlend(consensus, spread, 0.7)', value: round(sdv.odds.logitBlend(consensus, fromSpread, 0.7), 4) },
  ],
  ['quantity', 'value'],
  3,
  'Market math helpers'
);

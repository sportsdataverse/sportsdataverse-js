// 12 — Release-dataset loaders: parquet assets → rows, with the id rule.
//
// Shows: the generated `load*` loaders (one per sportsdataverse-data /
// nflverse release asset, `tools/codegen/endpoints/releases.yaml`). They stream
// the parquet from GitHub Releases (hyparquet) and apply the v4 integer-id rule:
// a column whose NAME marks an id (`team_id`, `game_id`, `athlete_id`, …) is
// ALWAYS a decimal string, whatever width it was stored with — so
// `cfb_ratings` (stores team_id as a STRING) and `cfb_team_portal` (stores it
// as INT64) join on `===`. Non-id integers are `number`, or `BigInt` past 2^53.
//
// Sources: GitHub Releases — github.com/sportsdataverse/sportsdataverse-data/releases/download/
//   cfb_ratings/cfb_ratings_2024.parquet, cfb_team_portal/cfb_team_portal_2024.parquet, nhl_groups/nhl_groups.parquet
// Offline fixtures: test/fixtures/releases/*.parquet (verbatim release assets, 2026-10-05).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const ratings = await sdv.cfb.loadCfbRatings({ seasons: [2024] });
const portal = await sdv.cfb.loadCfbTeamPortal({ seasons: [2024] });
console.log(`cfb_ratings: ${ratings.length} rows; cfb_team_portal: ${portal.length} rows`);
console.log(`typeof team_id — ratings: ${typeof ratings[0].team_id} (parquet STRING), portal: ${typeof portal[0].team_id} (parquet INT64) → both "${ratings[0].team_id}"-style strings`);

printTable(
  ratings
    .sort((a, b) => a.net_rank - b.net_rank)
    .map((r) => ({ net_rank: r.net_rank, team_id: r.team_id, games: r.games, adj_off_epa: round(r.adj_off_epa, 3), adj_def_epa: round(r.adj_def_epa, 3), adj_net: round(r.adj_net, 3), fei_net: round(r.fei_net, 3) })),
  ['net_rank', 'team_id', 'games', 'adj_off_epa', 'adj_def_epa', 'adj_net', 'fei_net'],
  8,
  'cfb_ratings 2024, top of the net-EPA table'
);

// Join across the two releases on the (string) team_id.
const portalById = new Map(portal.map((p) => [p.team_id, p]));
const joined = ratings
  .map((r) => ({ r, p: portalById.get(r.team_id) }))
  .filter(({ p }) => p)
  .map(({ r, p }) => ({ team_id: r.team_id, net_rank: r.net_rank, roster_n: p.roster_n, transfers_in: p.transfers_in_n, transfers_out: p.transfers_out_n, net_transfer_talent: p.net_transfer_talent, portal_share: round(p.portal_share, 3) }))
  .sort((a, b) => b.net_transfer_talent - a.net_transfer_talent);
console.log(`${joined.length} of ${ratings.length} rated teams matched a portal row (string === string)`);
printTable(joined, ['team_id', 'net_rank', 'roster_n', 'transfers_in', 'transfers_out', 'net_transfer_talent', 'portal_share'], 8, 'Ratings ⋈ transfer portal, by net transfer talent');

// A single-asset loader (no season token).
const groups = await sdv.nhl.loadNhlGroups({});
printTable(groups, ['group_id', 'level', 'first_season', 'last_season'], 8, 'nhl_groups (single-asset loader)');

import should from 'should';
import sdv, { hasKenpomLogin, resolvePffApiKey } from '../dist/index.js';

// Live smoke for the subscription families. Each needs the caller's own paid
// credentials, so each has its OWN gate (never set in CI) and also skips when
// its credentials are absent:
//
//   SDV_PFF_LIVE=1     + PFF_API_KEY (or SDV_PFF_API_KEY)          npm test
//   SDV_KENPOM_LIVE=1  + KENPOM_EMAIL / KENPOM_PW (or KP_USER / KP_PW)
//   SDV_NFL_PRO_LIVE=1 + NFLPRO_TOKEN (a user-bound NFL+ Premium token)
//
// PFF's budget is 100 reads/min per ACCOUNT (shared with every client holding
// the key), so this suite makes four calls.
const on = (v) => ['1', 'true', 'yes'].includes(process.env[v]);
const gate = (flag, hasCreds) => (on(flag) && hasCreds ? describe : describe.skip);

gate('SDV_PFF_LIVE', Boolean(resolvePffApiKey()))('PFF Developer API live smoke', function () {
  this.timeout(60000);

  it('ref_leagues lists the leagues the key can read (known-positive control)', async () => {
    const rows = await sdv.nfl.pffApiRefLeagues({ parsed: true });
    rows.length.should.be.above(0);
  });

  it('a /v1 facet honours the snake_case franchise_id filter', async () => {
    const rows = await sdv.nfl.pffApiFacetPassingSummary({ league: 'nfl', season: 2022, week: 1, franchise_id: 7, parsed: true });
    rows.length.should.be.above(0);
    rows.every((r) => r.franchise_id === 7).should.be.true();
  });

  it('a /v2 table parses with integer team ids', async () => {
    const rows = await sdv.nfl.pffApiTeamStats({ league: 'nfl', season: 2022, category: 'offense-passing', parsed: true });
    rows.length.should.equal(32);
    Number.isInteger(rows[0].team_id).should.be.true();
  });

  it('an invalid season is InvalidParameterError, not an empty answer', async () => {
    const err = await sdv.nfl.pffApiPositionReport({ league: 'nfl', report: 'passing', season: 1800 }).then(() => null, (e) => e);
    should.exist(err);
    err.name.should.equal('InvalidParameterError');
  });
});

gate('SDV_KENPOM_LIVE', hasKenpomLogin())('KenPom live smoke', function () {
  this.timeout(120000);

  it('logs in and parses the 2025 ratings table (364 teams)', async () => {
    const tables = await sdv.mbb.kenpomRatings({ year: 2025, parsed: true });
    tables.ratings_table.length.should.equal(364);
    tables.ratings_table[0].should.have.properties('team', 'net_rtg', 'strength_of_schedule_net_rtg_rk', 'ncaa_seed');
  });

  it('team.php returns its tables plus the script-rendered depth chart', async () => {
    const tables = await sdv.mbb.kenpomTeam({ team: 'Duke', year: 2025, parsed: true });
    tables.should.have.properties('schedule_table', 'depth_chart');
    tables.schedule_table.length.should.be.above(0);
  });
});

gate('SDV_NFL_PRO_LIVE', Boolean((process.env.NFLPRO_TOKEN ?? '').trim()))('NFL Pro live smoke', function () {
  this.timeout(120000);

  it('passing season pages to the envelope total and parses', async () => {
    const body = await sdv.nfl.nflProPlayersOffensePassingSeason({ season: 2024, season_type: 'REG' });
    body.passers.length.should.be.above(0);
    if (body.total !== undefined) body.passers.length.should.equal(body.total);
    const rows = await sdv.nfl.nflProTeamOffenseOverviewSeason({ season: 2024, parsed: true });
    rows.length.should.equal(32);
  });
});

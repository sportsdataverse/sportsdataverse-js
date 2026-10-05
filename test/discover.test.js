import should from 'should';
import fs from 'node:fs';
import sdv, {
  listFunctions, functionCount, findTeam, findAthlete, findEvent, clearTeamCache, find_team,
} from '../dist/index.js';

const fx = (n) => JSON.parse(fs.readFileSync(new URL(`./fixtures/espn/${n}`, import.meta.url)));

// Real captured ESPN payloads (test/fixtures/espn/README.md) served through stubbed namespaces.
const nba = {
  espn_nba_teams_site: async () => fx('teams_site_nba.json'),
  espn_nba_scoreboard: async (p) => { nba.lastScoreboard = p; return fx('scoreboard_nba.json'); },
  espn_nba_team_roster: async () => fx('team_roster_nba.json'),
};
const mlb = {
  espn_mlb_teams_site: async () => ({ sports: [{ leagues: [{ teams: [{ team: { id: '10', displayName: 'New York Yankees', abbreviation: 'NYY' } }] }] }] }),
  espn_mlb_scoreboard: async () => ({ events: [] }),
  espn_mlb_team_roster: async () => fx('team_roster_mlb.json'),
};
const NS = { nba, mlb };

describe('discover: listFunctions / functionCount (real registries)', () => {
  it('lists wrappers per namespace, hiding camelCase twins', async () => {
    const nbaFns = await listFunctions('nba');
    nbaFns.should.containEql('espn_nba_scoreboard');
    nbaFns.should.not.containEql('espnNbaScoreboard');
    nbaFns.should.containEql('getPlayByPlay'); // legacy camel-only method still listed
  });
  it('search + whole-package grouping', async () => {
    const r = await listFunctions(null, { search: 'roster' });
    r.should.have.property('nba');
    r.nba.every((n) => n.toLowerCase().includes('roster')).should.be.true();
    Object.keys(r).length.should.be.above(5);
  });
  it('parsersOnly reads the parser registry; flags are exclusive', async () => {
    const p = await listFunctions(null, { parsersOnly: true });
    p.length.should.be.above(10);
    p.every((n) => n.startsWith('parse_')).should.be.true();
    await listFunctions(null, { parsersOnly: true, wrappersOnly: true }).should.be.rejectedWith(/mutually exclusive/);
  });
  it('unknown league throws; counts agree', async () => {
    await listFunctions('nope').should.be.rejectedWith(/Unknown league/);
    (await functionCount('nba')).should.equal((await listFunctions('nba')).length);
    (await functionCount()).nba.should.be.above(50);
  });
  it('covers every LEAGUES prefix', async () => {
    const { LEAGUES } = await import('../dist/index.js');
    const all = await listFunctions();
    for (const l of LEAGUES) all.should.have.property(l.prefix);
  });
});

describe('find: name -> id (real ESPN captures)', () => {
  beforeEach(() => clearTeamCache());
  it('findTeam by nickname / abbreviation / multi / miss', async () => {
    (await findTeam('lakers', 'nba', {}, NS)).id.should.equal('13');
    (await findTeam('LAL', 'nba', {}, NS)).displayName.should.equal('Los Angeles Lakers');
    (await findTeam('new york', 'nba', { multi: true }, NS)).length.should.be.above(0);
    should(await findTeam('zzzz', 'nba', {}, NS)).be.null();
    await findTeam('x', 'xyz', {}, NS).should.be.rejectedWith(/Unknown league/);
  });
  it('findAthlete: flat roster (nba) and grouped roster (mlb) with team annotation', async () => {
    const a = await findAthlete('ayton', 'nba', { team: 'lakers' }, NS);
    a.fullName.should.equal('Deandre Ayton');
    a.team_id.should.equal('13');
    const m = await findAthlete('', 'mlb', { team: 'yankees' }, NS);
    should(m).be.null(); // empty needle never matches (py parity)
    const grp = fx('team_roster_mlb.json').athletes[0].items[0];
    const g = await findAthlete(grp.lastName, 'mlb', { team: 'yankees', multi: true }, NS);
    g.length.should.be.above(0);
    g[0].should.have.property('position_group');
  });
  it('findEvent normalises dates and filters home/away', async () => {
    const ev = await findEvent('2025-10-05', 'nba', { home: 'Brooklyn' }, NS);
    ev.id.should.equal('401704871');
    nba.lastScoreboard.dates.should.equal(20251005);
    should(await findEvent('20251005', 'nba', { home: 'Orlando' }, NS)).be.null();
    (await findEvent('20251005', 'nba', { multi: true }, NS)).length.should.equal(10);
  });
  it('snake_case aliases are the same functions', () => {
    find_team.should.equal(findTeam);
    (typeof sdv.nba.espn_nba_teams_site).should.equal('function');
  });
});

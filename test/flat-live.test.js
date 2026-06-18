import should from 'should';
import sdv from '../dist/index.js';

// Live smoke for the hand-runtime flat-API families (HockeyTech + BartTorvik).
// Gated: only runs when SDV_LIVE=1 (hits the real feeds), so it never blocks the
// default CI. Use it to catch an upstream feed shape / key change.
//
//   SDV_LIVE=1 npm test
const run = ['1', 'true', 'yes'].includes(process.env.SDV_LIVE) ? describe : describe.skip;

run('HockeyTech live smoke (PWHL)', function () {
  this.timeout(30000);

  it('hockeytech_seasons returns parsed season rows', async () => {
    const rows = await sdv.hockeytech.hockeytech_seasons({ league: 'pwhl', parsed: true });
    rows.should.be.an.Array();
    rows.length.should.be.above(0);
    rows[0].should.have.property('season_id');
  });

  it('hockeytech_schedule returns parsed game rows', async () => {
    const rows = await sdv.hockeytech.hockeytech_schedule({ league: 'pwhl', parsed: true });
    rows.should.be.an.Array();
    rows.length.should.be.above(0);
    rows[0].should.have.property('id');
  });

  it('hockeytech_pbp resolves the PWHL override key and returns plays', async () => {
    // game 74 is a completed PWHL game (the fixture source).
    const rows = await sdv.hockeytech.hockeytech_pbp({ league: 'pwhl', game_id: 74, parsed: true });
    rows.should.be.an.Array();
    rows.length.should.be.above(0);
    rows.every((r) => r.event !== undefined).should.be.true();
  });

  it('hockeytech_game_summary (gc/tab=) returns goal rows', async () => {
    const rows = await sdv.hockeytech.hockeytech_game_summary({ league: 'pwhl', game_id: 74, parsed: true });
    rows.should.be.an.Array();
  });

  it('raw (no parsed) returns the JSONP-stripped SiteKit envelope', async () => {
    const raw = await sdv.hockeytech.hockeytech_seasons({ league: 'pwhl' });
    should(raw).be.an.Object();
    raw.should.have.property('SiteKit');
  });
});

run('BartTorvik live smoke (T-Rank)', function () {
  this.timeout(30000);
  const YEAR = 2024;

  it('torvik_ratings returns parsed team rows (header CSV)', async () => {
    const rows = await sdv.torvik.torvik_ratings({ year: YEAR, parsed: true });
    rows.should.be.an.Array();
    rows.length.should.be.above(0);
    rows[0].should.have.property('team');
    rows[0].should.have.property('adjoe');
  });

  it('torvik_game_stats returns parsed rows with the 31 positional columns (JSON)', async () => {
    const rows = await sdv.torvik.torvik_game_stats({ year: YEAR, parsed: true });
    rows.should.be.an.Array();
    rows.length.should.be.above(0);
    Object.keys(rows[0]).length.should.equal(31);
  });

  it('torvik_player_stats returns parsed rows with the 67 positional columns (headerless CSV)', async () => {
    const rows = await sdv.torvik.torvik_player_stats({ year: YEAR, parsed: true });
    rows.should.be.an.Array();
    rows.length.should.be.above(0);
    Object.keys(rows[0]).length.should.equal(67);
  });

  it('torvik_game_schedule returns parsed rows with the 55 positional columns (JSON)', async () => {
    const rows = await sdv.torvik.torvik_game_schedule({ year: YEAR, parsed: true });
    rows.should.be.an.Array();
    rows.length.should.be.above(0);
    Object.keys(rows[0]).length.should.equal(55);
  });

  it('raw (no parsed) returns the raw response body text', async () => {
    const raw = await sdv.torvik.torvik_ratings({ year: YEAR });
    (typeof raw).should.equal('string');
    raw.should.match(/rank/); // the CSV header
  });
});

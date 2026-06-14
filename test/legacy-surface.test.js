import should from 'should';
import sdv from '../dist/index.js';

// No-network coverage of the hand-written legacy services: every method each
// service module exports must still be callable on its merged sdv namespace
// (the generated espn_* wrappers are added ALONGSIDE these, never clobbering
// them). Data-driven from the service modules, so new legacy methods are
// covered automatically.

const SERVICES = ['cfb', 'mbb', 'mlb', 'nba', 'ncaa', 'nfl', 'nhl', 'tennis', 'wbb', 'wnba'];

describe('legacy service methods are preserved on every namespace', () => {
  for (const svc of SERVICES) {
    it(`${svc}: every exported legacy method is a function on sdv.${svc}`, async () => {
      const mod = (await import(`../dist/services/${svc}.service.js`)).default;
      const methods = Object.keys(mod).filter((k) => typeof mod[k] === 'function');
      methods.length.should.be.above(0, `${svc} service exposes no methods`);
      should(sdv[svc]).be.an.Object();
      for (const m of methods) {
        (typeof sdv[svc][m]).should.equal('function', `sdv.${svc}.${m} is missing`);
      }
    });
  }

  it('legacy methods coexist with the generated wrappers (no clobbering)', () => {
    (typeof sdv.nba.getPlayByPlay).should.equal('function');
    (typeof sdv.nba.espnNbaScoreboard).should.equal('function');
    (typeof sdv.nba.espn_nba_scoreboard).should.equal('function');
  });
});

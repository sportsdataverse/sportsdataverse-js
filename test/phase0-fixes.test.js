import should from 'should';
import sdv, { FLAT_WRAPPERS, configure, resetConfig } from '../dist/index.js';
import { resolveFlat } from '../dist/core/flat.js';
import { FLAT_HOSTS } from '../dist/core/client.js';
import { resetWarnOnce } from '../dist/core/deprecation.js';
import { captureWarnings } from './helpers/warnings.mjs';

// Offline regression tests for the Phase 0 correctness fixes (a fake transport answers every family).
describe('phase 0 fixes (offline)', () => {
  const answer = (data) => configure({ transport: async (req) => ({ status: 200, headers: {}, url: req.url, data }) });
  afterEach(() => resetConfig());

  it('CBS host carries the /napi base', () => {
    FLAT_HOSTS.cbs.should.equal('https://api.cbssports.com/napi');
    const fn = sdv.cbs.cbsGameBoxscore;
    should(fn).be.a.Function();
  });

  it('a CBS wrapper resolves under /napi/resource/', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'cbs' && w.short === 'game_boxscore');
    should(def).exist;
    resolveFlat(def, { game_id: '1' }).url.should.startWith('https://api.cbssports.com/napi/resource/');
  });

  for (const lg of ['cfb', 'mbb', 'mlb', 'nba', 'nfl', 'nhl']) {
    it(`${lg}.getPicks returns pickcenter, not winprobability`, async () => {
      answer({
        header: { id: '1', competitions: [{ competitors: [] }], season: {}, week: 1 },
        winprobability: 'WP', pickcenter: 'PC',
      });
      const r = await sdv[lg].getPicks(1);
      r.pickcenter.should.equal('PC');
      if (lg !== 'nhl') r.winProbability.should.equal('WP');
    });
  }

  it('wnba.getTeamList works with no argument', async () => {
    answer({ sports: [] });
    const r = await sdv.wnba.getTeamList();
    r.should.eql({ sports: [] });
  });

  it('ncaa stats.ncaa.org scrapers emit a one-time DeprecationWarning', async () => {
    answer('<html></html>');
    resetWarnOnce(); // warn-once state is per process: start clean whatever ran before
    const warnings = await captureWarnings(async () => {
      await sdv.ncaa.getSports();
      await sdv.ncaa.getSports();
    });
    warnings.filter((w) => w.name === 'DeprecationWarning' && /getSports/.test(w.message)).length.should.equal(1);
  });
});

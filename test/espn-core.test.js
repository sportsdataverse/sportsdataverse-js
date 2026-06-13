import should from 'should';
import sdv, { makeLeagueModule, LEAGUES, WRAPPERS } from '../dist/index.js';

// Structural (no-network) tests for the generated cross-league ESPN surface.
describe('ESPN cross-league core (generated from YAML)', () => {
    it('generates a namespace for every league in the matrix', () => {
        LEAGUES.length.should.be.above(20);
        for (const cfg of LEAGUES) {
            sdv.should.have.property(cfg.prefix);
        }
        // includes the non-core families
        sdv.should.have.properties(['epl', 'soccer', 'cricket', 'ufl', 'mch']);
    });

    it('merges espn_<prefix>_* wrappers onto legacy namespaces without clobbering them', () => {
        // legacy method preserved
        (typeof sdv.nba.getPlayByPlay).should.equal('function');
        // generated wrappers added alongside it
        (typeof sdv.nba.espn_nba_scoreboard).should.equal('function');
        (typeof sdv.nba.espn_nba_summary).should.equal('function');
        Object.keys(sdv.nba).filter((k) => k.startsWith('espn_nba_')).length.should.be.above(50);
    });

    it('applies scope tables: ncaa/football wrappers only where scoped', () => {
        // cfb carries [universal, ncaa, football] -> more wrappers than universal-only nba
        const cfbCount = Object.keys(sdv.cfb).filter((k) => k.startsWith('espn_cfb_')).length;
        const nbaCount = Object.keys(sdv.nba).filter((k) => k.startsWith('espn_nba_')).length;
        cfbCount.should.be.above(nbaCount);
        // ncaa-scope rankings on college, not on the pro league
        (typeof sdv.mbb.espn_mbb_rankings).should.equal('function');
        (typeof sdv.nba.espn_nba_rankings).should.equal('undefined');
    });

    it('makeLeagueModule binds (sport, league) and prefixes every wrapper', () => {
        const mod = makeLeagueModule({
            prefix: 'test',
            sport: 'basketball',
            league: 'nba',
            scopes: ['universal']
        });
        Object.keys(mod).length.should.be.above(0);
        Object.keys(mod).every((k) => k.startsWith('espn_test_')).should.be.true();
    });

    it('exposes the full generated wrapper table + families', () => {
        WRAPPERS.length.should.be.above(100);
        const families = new Set(WRAPPERS.map((w) => w.family));
        families.has('site_v2').should.be.true();
        families.has('core_v2').should.be.true();
        families.has('site_v2_alt').should.be.true();
    });
});

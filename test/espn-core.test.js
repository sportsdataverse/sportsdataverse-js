import should from 'should';
import sdv, { makeLeagueModule, nbaEspn } from '../dist/index.js';

// Structural (no-network) tests for the cross-league ESPN core + league binder.
describe('ESPN cross-league core (basketball vertical slice)', () => {
    it('generates espn_<prefix>_<short> wrappers for a league module', () => {
        const keys = Object.keys(nbaEspn);
        keys.should.containEql('espn_nba_scoreboard');
        keys.should.containEql('espn_nba_teams');
        keys.should.containEql('espn_nba_team_roster');
    });

    it('merges wrappers onto the legacy namespace without clobbering it', () => {
        // legacy method still present
        (typeof sdv.nba.getPlayByPlay).should.equal('function');
        // new cross-league wrapper added alongside it
        (typeof sdv.nba.espn_nba_scoreboard).should.equal('function');
    });

    it('binds (sport, league) for each basketball league', () => {
        (typeof sdv.wbb.espn_wbb_teams).should.equal('function');
        (typeof sdv.mbb.espn_mbb_standings).should.equal('function');
        (typeof sdv.wnba.espn_wnba_summary).should.equal('function');
    });

    it('makeLeagueModule produces the universal wrapper set', () => {
        const mod = makeLeagueModule({
            prefix: 'test',
            sport: 'basketball',
            league: 'nba',
            scopes: ['universal']
        });
        Object.keys(mod).length.should.be.above(0);
        Object.keys(mod).every((k) => k.startsWith('espn_test_')).should.be.true();
    });

    it('exposes core_v2 wrappers (seasons / franchises / athletes / venues)', () => {
        (typeof sdv.nba.espn_nba_seasons).should.equal('function');
        (typeof sdv.nba.espn_nba_franchises).should.equal('function');
        (typeof sdv.nba.espn_nba_athletes).should.equal('function');
        (typeof sdv.nba.espn_nba_venues).should.equal('function');
    });

    it('applies scope tables: ncaa `rankings` on college leagues only', () => {
        // mbb/wbb carry the ncaa scope -> rankings
        (typeof sdv.mbb.espn_mbb_rankings).should.equal('function');
        (typeof sdv.wbb.espn_wbb_rankings).should.equal('function');
        // nba is universal-only -> no rankings wrapper
        (typeof sdv.nba.espn_nba_rankings).should.equal('undefined');
    });
});

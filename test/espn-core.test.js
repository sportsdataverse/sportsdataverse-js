import should from 'should';
import sdv, { makeLeagueModule, LEAGUES, WRAPPERS } from '../dist/index.js';
// deep import (not part of the public API) — exercises request building w/o network
import { resolveRequest } from '../dist/core/espn.js';

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

    it('resolves params by snake_case or camelCase alias (+ default_from)', () => {
        const def = {
            short: 'event_competition',
            family: 'core_v2',
            scope: 'universal',
            path: '/{sport}/leagues/{league}/events/{event_id}/competitions/{cid}',
            pathParams: [{ name: 'event_id' }, { name: 'cid', defaultFrom: 'event_id' }],
            queryParams: [{ name: 'season_type', queryKey: 'seasontype' }],
        };
        const cfg = { prefix: 'nfl', sport: 'football', league: 'nfl', scopes: ['universal'] };

        const snake = resolveRequest(def, cfg, { event_id: 5, season_type: 2 });
        const camel = resolveRequest(def, cfg, { eventId: 5, seasonType: 2 });

        // both spellings produce the identical request
        snake.url.should.equal(camel.url);
        JSON.stringify(snake.query).should.equal(JSON.stringify(camel.query));
        // cid defaulted from event_id; query key mapped to ESPN's `seasontype`
        snake.url.should.endWith('/events/5/competitions/5');
        snake.query.seasontype.should.equal(2);
    });

    it('only honours a league override for leagueParam leagues', () => {
        const def = {
            short: 'scoreboard', family: 'site_v2', scope: 'universal',
            path: '/{sport}/{league}/scoreboard', pathParams: [], queryParams: [],
        };
        const pro = { prefix: 'nba', sport: 'basketball', league: 'nba', scopes: ['universal'] };
        const soccer = { prefix: 'soccer', sport: 'soccer', league: 'eng.1', scopes: ['universal'], leagueParam: true };

        // pro league ignores the override
        resolveRequest(def, pro, { league: 'mens-college-basketball' }).url.should.endWith('/basketball/nba/scoreboard');
        // leagueParam league honours it
        resolveRequest(def, soccer, { league: 'esp.1' }).url.should.endWith('/soccer/esp.1/scoreboard');
    });
});

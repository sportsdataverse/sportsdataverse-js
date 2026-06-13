import should from 'should';
import sdv, { LEAGUES } from '../dist/index.js';

// Live smoke across every league in the generated matrix. Gated: only runs when
// SDV_LIVE=1 (it hits ~29 real ESPN endpoints — slow + network-dependent), so it
// never blocks the default CI. Use it to catch a league/endpoint that has gone
// dead at ESPN.
//
//   SDV_LIVE=1 npm test
const run = process.env.SDV_LIVE ? describe : describe.skip;

run('ESPN live smoke (all leagues)', function () {
    this.timeout(30000);

    for (const cfg of LEAGUES) {
        // `cricket` is a league_param catch-all whose default slug (`eng.1`) is a
        // placeholder pending ESPN series-slug discovery — its scoreboard 404s.
        // Use it with a real `{ league }`; skip the default-slug smoke here.
        const test = cfg.prefix === 'cricket' ? it.skip : it;
        test(`espn_${cfg.prefix}_scoreboard returns data`, async () => {
            const fn = sdv[cfg.prefix][`espn_${cfg.prefix}_scoreboard`];
            (typeof fn).should.equal('function');
            const data = await fn({});
            should(data).be.an.Object();
            // every ESPN scoreboard payload carries a leagues block
            should(data).have.property('leagues');
        });
    }
});

import should from 'should';
import sdv, { LEAGUES } from '../dist/index.js';

// Live smoke across every league in the generated matrix. Gated: only runs when
// SDV_LIVE=1 (it hits ~29 real ESPN endpoints — slow + network-dependent), so it
// never blocks the default CI. Use it to catch a league/endpoint that has gone
// dead at ESPN.
//
//   SDV_LIVE=1 npm test
const run = ['1', 'true', 'yes'].includes(process.env.SDV_LIVE) ? describe : describe.skip;

run('ESPN live smoke (all leagues)', function () {
    this.timeout(30000);

    for (const cfg of LEAGUES) {
        // `cricket` is a league_param catch-all whose default slug (`eng.1`) is a
        // placeholder pending ESPN series-slug discovery — its scoreboard 404s.
        // Use it with a real `{ league }`; skip the default-slug smoke here.
        const test = cfg.prefix === 'cricket' ? it.skip : it;
        test(`espn_${cfg.prefix}_scoreboard returns data`, async () => {
            const ns = sdv[cfg.prefix];
            should(ns).be.an.Object();
            const fn = ns[`espn_${cfg.prefix}_scoreboard`];
            (typeof fn).should.equal('function');
            const data = await fn({});
            should(data).be.an.Object();
            // every ESPN scoreboard payload carries a leagues block
            should(data).have.property('leagues');
        });
    }
});

// Live check of the `{ parsed: true }` dispatch wired into callWrapper (the ESPN
// analogue of the native flat parsed dispatch + sdv-py's return_parsed=True).
// Omitting `parsed` returns the raw Dict; `{ parsed: true }` routes through the
// parser registered for the endpoint's short name and returns tidy rows; the
// summary dispatcher returns a dict of 21 sub-frames (or one, with `section`).
run('ESPN parsed dispatch (NBA)', function () {
    this.timeout(30000);

    it('scoreboard: raw by default, tidy rows with { parsed: true }', async () => {
        const raw = await sdv.nba.espn_nba_scoreboard({});
        should(raw).be.an.Object();
        should(raw).have.property('leagues'); // raw payload, additive
        const rows = await sdv.nba.espn_nba_scoreboard({ parsed: true });
        should(rows).be.an.Array(); // parser -> array of row objects
    });

    it('summary dispatcher: dict of sub-frames, or one frame with `section`', async () => {
        const sb = await sdv.nba.espn_nba_scoreboard({});
        const eventId = sb?.events?.[0]?.id;
        if (!eventId) return this.skip(); // no games today -> nothing to summarise
        const all = await sdv.nba.espn_nba_summary({ event_id: eventId, parsed: true });
        should(all).be.an.Object();
        should(all).not.be.an.Array(); // section omitted -> dict keyed by section
        should(all).have.property('boxscore_team');
        should(all).have.property('header');
        const one = await sdv.nba.espn_nba_summary({
            event_id: eventId,
            parsed: true,
            section: 'boxscore_team',
        });
        should(one).be.an.Array(); // a single section -> rows
    });
});

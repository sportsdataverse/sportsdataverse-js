import { live } from "./helpers/live.mjs";
import should from 'should';
import app, { NoDataError } from '../dist/index.js';

// NCAA removed the casablanca per-game JSON (gameInfo / boxscore / pbp 404 for
// every id, including ids the casablanca scoreboard still lists); the three
// methods are @deprecated and documented to surface that 404. Pin it, so a
// revival of the endpoints shows up here as drift.
live('NCAA Games (deprecated: casablanca per-game JSON removed upstream)', () => {

    var game = 5764053;
    for (const [name, file] of [['getInfo', 'gameInfo'], ['getBoxScore', 'boxscore'], ['getPlayByPlay', 'pbp']]) {
        it(`${name} surfaces the upstream 404 as NoDataError`, async () => {
            const err = await app.ncaa[name](game).then(() => null, (e) => e);
            should(err).be.instanceOf(NoDataError);
            err.message.should.containEql(`/casablanca/game/${game}/${file}.json`);
        });
    }
});

live('NCAA Scoreboard', () => {

    it('should return a promise for ncaa scoreboard data for a given date', async () => {
        const data = await app.ncaa.getScoreboard({
            sport: 'basketball-men',
            division: 'd1',
            year: 2021,
            month: 2,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});
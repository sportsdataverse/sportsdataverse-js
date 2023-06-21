'use strict';
const should = require('should');
const app = require('../app/app');

describe('NCAA Games', () => {

    var game = 5764053;
    it('should return a promise for ncaa game information for a given game', async () => {
        const data = await app.ncaa.getInfo(game)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
    it('should return a promise for ncaa game box score for a given game', async () => {
        const data = await app.ncaa.getBoxScore(game)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
    it('should return a promise for ncaa game play-by-play for a given game', async () => {
        const data = await app.ncaa.getPlayByPlay(game)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
    it('should return a promise for ncaa game team stats for a given game', async () => {
        const data = await app.ncaa.getTeamStats(game)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
    it('should return a promise for ncaa game scoring summary for a given game', async () => {
        const data = await app.ncaa.getScoringSummary(game)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

describe('NCAA Scoreboard', () => {

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
'use strict';
const should = require('should');
const app = require('../app/app');


describe('TNNS Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', async () => {
        const data = await app.tennis.getScoreboard({});
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
    it('should populate scoreboard data for the current week and year and league', async () => {
        const data = await app.tennis.getScoreboard({ league: "wta" })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate scoreboard data for the given week and year', async () => {
        const data = await app.tennis.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the current week and year', async () => {
        const data = await app.tennis.getScoreboard({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the given week and year', async () => {
        const data = await app.tennis.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});
'use strict';
const should = require('should');
const app = require('../app/app');

describe('NHL Games', () => {

    var gameId = 401272446;

    it('should populate play by play data for the given game id', async () => {
        const data = await app.nhl.getPlayByPlay(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for play by play data for the given game id', async () => {
        const data = await app.nhl.getPlayByPlay(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate box score data for the given game id', async () => {
        const data = await app.nhl.getBoxScore(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).have.property('id');
        should(data).not.be.empty;

    });

    it('should return a promise for box score data for the given game id', async () => {
        const data = await app.nhl.getBoxScore(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;
        should(data).have.property('id');

    });

    it('should return a promise for game summary data for the given game id', async () => {
        const data = await app.nhl.getSummary(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for game picks data for the given game id', async () => {
        const data = await app.nhl.getPicks(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});


describe('NHL Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', async () => {
        const data = await app.nhl.getScoreboard({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate scoreboard data for the given week and year', async () => {
        const data = await app.nhl.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the current week and year', async () => {
        const data = await app.nhl.getScoreboard({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the given week and year', async () => {
        const data = await app.nhl.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

describe('NHL Standings', () => {

    it('should populate standings for the given year', async () => {
        const data = await app.nhl.getStandings({
            year: 2020
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for standings for the given year', async () => {
        const data = await app.nhl.getStandings({
            year: 2020
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

describe('NHL Teams', () => {

    it('should populate a teams list', async () => {
        const data = await app.nhl.getTeamList({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for teams for the given team id', async () => {
        const data = await app.nhl.getTeamInfo(16)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for team players for the given team id', async () => {
        const data = await app.nhl.getTeamPlayers(16)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

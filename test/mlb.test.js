'use strict';
const should = require('should');
const app = require('../app/app');

describe('MLB Games', () => {

    var gameId = 401472105;

    it('should populate play by play data for the given game id', async () => {
        const data = await app.mlb.getPlayByPlay(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for play by play data for the given game id', async () => {
        const data = await app.mlb.getPlayByPlay(gameId)

        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate box score data for the given game id', async () => {
        const data = await app.mlb.getBoxScore(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).have.property('id');
        should(data).not.be.empty;

    });

    it('should return a promise for box score data for the given game id', async () => {
        const data = await app.mlb.getBoxScore(gameId)

        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;
        should(data).have.property('id');

    });

    it('should return a promise for game summary data for the given game id', async () => {
        const data = await app.mlb.getSummary(gameId)

        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for game picks data for the given game id', async () => {
        const data = await app.mlb.getPicks(gameId)

        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});


describe('MLB Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', async () => {
        const data = await app.mlb.getScoreboard({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate scoreboard data for the given week and year', async () => {
        const data = await app.mlb.getScoreboard({
            year: 2021,
            month: 12,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the current week and year', async () => {
        const data = await app.mlb.getScoreboard({})

        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the given week and year', async () => {
        const data = await app.mlb.getScoreboard({
            year: 2021,
            month: 12,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

describe('MLB Standings', () => {

    it('should populate standings for the given year', async () => {
        const data = await app.mlb.getStandings({
            year: 2020
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for standings for the given year', async () => {
        const data = await app.mlb.getStandings({
            year: 2020
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

describe('MLB Teams', () => {

    it('should populate a teams list', async () => {
        const data = await app.mlb.getTeamList({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for teams for the given team id', async () => {
        const data = await app.mlb.getTeamInfo(16)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for team players for the given team id', async () => {
        const data = await app.mlb.getTeamPlayers(16)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});
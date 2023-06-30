'use strict';
const should = require('should');
const app = require('../app/app');

describe('MBB Games', () => {
    var gameId = 401260281;

    it('should populate play by play data for the given game id', async () => {
        const data = await app.mbb.getPlayByPlay(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    })

    it('should return a promise for play by play data for the given game id', async () => {
        const data = await app.mbb.getPlayByPlay(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate box score data for the given game id', async () => {
        const data = await app.mbb.getBoxScore(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).have.property('id');
        should(data).not.be.empty;

    });

    it('should return a promise for box score data for the given game id', async () => {
        const data = await app.mbb.getBoxScore(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;
        should(data).have.property('id');

    });

    it('should return a promise for game summary data for the given game id', async () => {
        const data = await app.mbb.getSummary(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for game picks data for the given game id', async () => {
        const data = await app.mbb.getPicks(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

describe('MBB Rankings', () => {
    it('should populate rankings for the current week and year', async () => {
        const data = await app.mbb.getRankings({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate rankings for the given week and year', async () => {
        const data = await app.mbb.getRankings({
            year: 2020,
            week: 9
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for rankings for the current week and year', async () => {
        const data = await app.mbb.getRankings({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for rankings for the given week and year', async () => {
        const data = await app.mbb.getRankings({
            year: 2020,
            week: 9
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

describe('MBB Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', async () => {
        const data = await app.mbb.getScoreboard({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate scoreboard data for the given week and year', async () => {
        const data = await app.mbb.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the current week and year', async () => {
        const data = await app.mbb.getScoreboard({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the given week and year', async () => {
        const data = await app.mbb.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

describe('MBB Standings', () => {

    it('should populate standings for the given year', async () => {
        const data = await app.mbb.getStandings({
            year: 2020
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for standings for the given year', async () => {
        const data = await app.mbb.getStandings({
            year: 2020
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});
describe('MBB Teams', () => {

    it('should populate a teams list', async () => {
        const data = await app.mbb.getTeamList({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for teams for the given team id', async () => {
        const data = await app.mbb.getTeamInfo(52)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for team players for the given team id', async () => {
        const data = await app.mbb.getTeamPlayers(52)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});
describe('MBB Recruiting', () => {

    it('should return a promise for a list of individual rankings for the given year', async () => {
        const data = await app.mbb.getPlayerRankings({
            year: 2021
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for a list of individual rankings for the given year and position', async () => {
        const data = await app.mbb.getPlayerRankings({
            year: 2021,
            position: "C"
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for a list of individual rankings for the given year and group', async () => {
        const data = await app.mbb.getPlayerRankings({
            year: 2021,
            group: "JuniorCollege"
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for a list of school rankings for the given year', async () => {
        const data = await app.mbb.getSchoolRankings(2021)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for a school\'s commit list for a given year', async () => {
        const data = await app.mbb.getSchoolCommits('floridastate', 2021)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});
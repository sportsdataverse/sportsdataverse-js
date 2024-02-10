import should from 'should';
import app from '../app/app.js';

describe('NFL Games', () => {

    var gameId = 401220403;

    it('should populate play by play data for the given game id', async () => {
        const data = await app.nfl.getPlayByPlay(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for play by play data for the given game id', async () => {
        const data = await app.nfl.getPlayByPlay(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate box score data for the given game id', async () => {
        const data = await app.nfl.getBoxScore(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).have.property('id');
        should(data).not.be.empty;

    });

    it('should return a promise for box score data for the given game id', async () => {
        const data = await app.nfl.getBoxScore(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;
        should(data).have.property('id');

    });

    it('should return a promise for game summary data for the given game id', async () => {
        const data = await app.nfl.getSummary(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for game picks data for the given game id', async () => {
        const data = await app.nfl.getPicks(gameId)
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});


describe('NFL Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', async () => {
        const data = await app.nfl.getScoreboard({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate scoreboard data for the given week and year', async () => {
        const data = await app.nfl.getScoreboard({
            year: 2021,
            month: 12,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the current week and year', async () => {
        const data = await app.nfl.getScoreboard({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for scoreboard data for the given week and year', async () => {
        const data = await app.nfl.getScoreboard({
            year: 2021,
            month: 12,
            day: 15
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

describe('NFL Weekly Schedule', () => {

    it('should populate schedule data for the first week of regular season for the current year', async () => {
        const data = await app.nfl.getWeeklySchedule({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should populate schedule data for the given week and year and seasonType', async () => {
        const data = await app.nfl.getWeeklySchedule({
            week: 2,
            year: 2023,
            seasonType: 2
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;
    });

        it('should populate schedule data for the given week and year and default seasonType to Regular Season', async () => {
        const data = await app.nfl.getWeeklySchedule({
            week: 2,
            year: 2023,
        })
        const data2 = await app.nfl.getWeeklySchedule({
            week: 2,
            year: 2023,
            seasonType: 2
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;
        should(data).eql(data2);
    });

  
});

describe('NFL Standings', () => {

    it('should populate standings for the given year', async () => {
        const data = await app.nfl.getStandings({
            year: 2020
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for standings for the given year', async () => {
        const data = await app.nfl.getStandings({
            year: 2020
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

describe('NFL Teams', () => {

    it('should populate a teams list', async () => {
        const data = await app.nfl.getTeamList({})
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for teams for the given team id', async () => {
        const data = await app.nfl.getTeamInfo({
            id: 16
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });

    it('should return a promise for team players for the given team id', async () => {
        const data = await app.nfl.getTeamPlayers({
            id: 16
        })
        should(data).exist;
        should(data).be.json;
        should(data).not.be.empty;

    });
});

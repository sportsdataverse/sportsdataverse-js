const axios = require('axios');
/**
 * Gets the College Football game play-by-play data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.cfbGames.getPlayByPlay(401256194);
 */
exports.getPlayByPlay = async (id) => {
    const baseUrl = 'http://cdn.espn.com/core/college-football/playbyplay';
    const params = {
        gameId: id,
        xhr: 1,
        render: 'false',
        userab: 18
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return {
        teams: res.data.gamepackageJSON.header.competitions[0].competitors,
        id: res.data.gameId,
        drives: res.data.gamepackageJSON.drives,
        competitions: res.data.gamepackageJSON.header.competitions,
        season: res.data.gamepackageJSON.header.season,
        week: res.data.gamepackageJSON.header.week,
        boxScore: res.data.gamepackageJSON.boxscore,
        scoringPlays: res.data.gamepackageJSON.scoringPlays,
        standings: res.data.gamepackageJSON.standings
    };
};
/**
 * Gets the College Football game box score data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.cfbGames.getBoxScore(401256194);
 */
exports.getBoxScore = async (id) => {
    const baseUrl = 'http://cdn.espn.com/core/college-football/boxscore';
    const params = {
        gameId: id,
        xhr: 1,
        render: false,
        device: 'desktop',
        userab: 18
    };

    const res = await axios.get(baseUrl, {
        params
    });

    const game = res.data.gamepackageJSON.boxscore;
    game.id = res.data.gameId;

    return game;
};
/**
 * Gets the College Football game summary data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.cfbGames.getSummary(401256194);
 */
exports.getSummary = async (id) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/college-football/summary';
    const params = {
        event: id
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return {
        id: parseInt(res.data.header.id),
        boxScore: res.data.boxscore,
        gameInfo: res.data.gameInfo,
        drives: res.data.drives,
        leaders: res.data.leaders,
        header: res.data.header,
        teams: res.data.header.competitions[0].competitors,
        scoringPlays: res.data.scoringPlays,
        winProbability: res.data.winprobability,
        leaders: res.data.leaders,
        competitions: res.data.header.competitions,
        season: res.data.header.season,
        week: res.data.header.week,
        standings: res.data.standings
    };
};
/**
 * Gets the College Football PickCenter data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.cfbGames.getPicks(401256194);
 */
exports.getPicks = async (id) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/college-football/summary';
    const params = {
        event: id
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return {
        id: parseInt(res.data.header.id),
        gameInfo: res.data.gameInfo,
        leaders: res.data.leaders,
        header: res.data.header,
        teams: res.data.header.competitions[0].competitors,
        competitions: res.data.header.competitions,
        winProbability: res.data.winprobability,
        pickcenter: res.data.winprobability,
        againstTheSpread: res.data.againstTheSpread,
        odds: res.data.odds,
        season: res.data.header.season,
        week: res.data.header.week,
        standings: res.data.standings
    };
};
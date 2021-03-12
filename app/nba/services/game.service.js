const axios = require('axios');
/**
 * Gets the NBA game play-by-play data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.nbaGames.getPlayByPlay(401283399);
 */
exports.getPlayByPlay = async (id) => {
    const baseUrl = 'http://cdn.espn.com/core/nba/playbyplay';
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
        id: res.data.gamepackageJSON.header.id,
        plays: res.data.gamepackageJSON.plays,
        competitions: res.data.gamepackageJSON.header.competitions,
        season: res.data.gamepackageJSON.header.season,
        boxScore: res.data.gamepackageJSON.boxscore,
        seasonSeries: res.data.gamepackageJSON.seasonseries,
        standings: res.data.gamepackageJSON.standings
    };
};
/**
 * Gets the NBA game box score data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.nbaGames.getBoxScore(401283399);
 */
exports.getBoxScore = async (id) => {
    const baseUrl = 'http://cdn.espn.com/core/nba/boxscore';
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
 * Gets the NBA game summary data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.nbaGames.getSummary(401283399);
 */
exports.getSummary = async (id) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary';
    const params = {
        event: id
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return {
        boxScore: res.data.boxscore,
        gameInfo: res.data.gameInfo,
        header: res.data.header,
        teams: res.data.gamepackageJSON.header.competitions[0].competitors,
        id: res.data.gamepackageJSON.header.id,
        plays: res.data.gamepackageJSON.plays,
        winProbability: res.data.winprobability,
        leaders: res.data.leaders,
        competitions: res.data.gamepackageJSON.header.competitions,
        season: res.data.gamepackageJSON.header.season,
        seasonSeries: res.data.gamepackageJSON.seasonseries,
        standings: res.data.gamepackageJSON.standings
    };
};
/**
 * Gets the NBA game PickCenter data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.nbaGames.getPicks(401283399);
 */
exports.getPicks = async (id) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary';
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
        seasonSeries: res.data.seasonseries,
        season: res.data.header.season,
        standings: res.data.standings
    };
};
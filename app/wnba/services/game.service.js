const axios = require('axios');
/**
 * Gets the WNBA game play-by-play data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.wnbaGames.getPlayByPlay(401244185);
 */
exports.getPlayByPlay = async (id) => {
    const baseUrl = 'http://cdn.espn.com/core/wnba/playbyplay';
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
 * Gets the WNBA game box score data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.wnbaGames.getBoxScore(401244185);
 */
exports.getBoxScore = async (id) => {
    const baseUrl = 'http://cdn.espn.com/core/wnba/boxscore';
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
 * Gets the WNBA game summary data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.wnbaGames.getSummary(401244185);
 */
exports.getSummary = async (id) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/wnba/summary';
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
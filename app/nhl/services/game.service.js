const axios = require('axios');
/**
 * Gets the NHL game play-by-play data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.nhlGames.getPlayByPlay(401272446);
 */
exports.getPlayByPlay = async (id) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary';
    const params = {
        event: id
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return {
        teams: res.data.header.competitions[0].competitors,
        id: parseInt(res.data.header.id),
        plays: res.data.plays,
        onIce: res.data.onIce,
        competitions: res.data.header.competitions,
        season: res.data.header.season,
        boxScore: res.data.boxscore,
        seasonSeries: res.data.seasonseries,
        standings: res.data.standings
    };
};
/**
 * Gets the NHL game box score data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.nhlGames.getBoxScore(401272446);
 */
exports.getBoxScore = async (id) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary';
    const params = {
        event: id
    };

    const res = await axios.get(baseUrl, {
        params
    });

    const game = res.data.boxscore;
    game.id = parseInt(res.data.header.id);

    return game;
};
/**
 * Gets the NHL game summary data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.nhlGames.getSummary(401272446);
 */
exports.getSummary = async (id) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary';
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
        teams: res.data.header.competitions[0].competitors,
        id: parseInt(res.data.header.id),
        plays: res.data.plays,
        onIce: res.data.onIce,
        leaders: res.data.leaders,
        competitions: res.data.header.competitions,
        season: res.data.header.season,
        seasonSeries: res.data.seasonseries,
        standings: res.data.standings
    };
};
/**
 * Gets the NHL PickCenter data for a specified game.
 * @param {number} id - Game id.
 * @returns json
 * @example
 * const result = await sdv.nhlGames.getPicks(401272446);
 */
exports.getPicks = async (id) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary';
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
        pickcenter: res.data.winprobability,
        againstTheSpread: res.data.againstTheSpread,
        odds: res.data.odds,
        seasonSeries: res.data.seasonseries,
        season: res.data.header.season,
        standings: res.data.standings
    };
};
const axios = require('axios');
/**
 * Gets the gameId for older games whose url redirects to the current url pattern using the
 * game url fragment (relative to [https://ncaa.com](https://ncaa.com)) pulled from ncaaScoreboard
 * @param {string} url - Game url as pulled from ncaaScoreboard.getNcaaScoreboard.
 * @example
 * const result = await sdv.ncaaScoreboard.getNcaaScoreboard(
 * sport = 'basketball-men', division = 'd3', year = 2019, month = 02, day = 15
 * )
 * const urlGame = result["games"][16]["game"]["url"]
 * const gameId = await sdv.ncaaGames.getNcaaRedirectUrl(url=urlGame);
 */
exports.getNcaaRedirectUrl = async (url) => {
    const baseUrl = `https://ncaa.com/${url}`;
    const response = await axios.get(baseUrl);
    const gameUrl = response.request.res.responseUrl;
    const gameId = parseInt(gameUrl.match(/.*\/(.*)\/(.*)$/)[2]);
    return gameId;
};
/**
 * Gets the gameInfo data for a specified game.
 * @param {number} game - Game id.
 * @returns json
 * @example
 * const result = await sdv.ncaaGames.getNcaaInfo(5764053);
 */
exports.getNcaaInfo = async (game) => {
    const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/gameInfo.json`;
    const res = await axios.get(baseUrl);
    return res.data;
}
/**
 * Gets the box score data for a specified game if available.
 * @param {number} game - Game id.
 * @returns json
 * @example
 * const result = await sdv.ncaaGames.getNcaaBoxScore(5764053);
 */
exports.getNcaaBoxScore = async (game) => {
    const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/boxscore.json`;
    const res = await axios.get(baseUrl);
    return res.data;
}
/**
 * Gets the play-by-play data for a specified game if available.
 * @param {number} game - Game id.
 * @returns json
 * @example
 * const result = await sdv.ncaaGames.getNcaaPlayByPlay(5764053);
 */
exports.getNcaaPlayByPlay = async (game) => {
    const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/pbp.json`;
    const res = await axios.get(baseUrl);
    return res.data;
}

/**
 * Gets the team stats data for a specified game if available.
 * @param {number} game - Game id.
 * @returns json
 * @example
 * const result = await sdv.ncaaGames.getNcaaTeamStats(5764053);
 */
exports.getNcaaTeamStats = async (game) => {
    const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/teamStats.json`;
    const res = await axios.get(baseUrl);
    return res.data;
}

/**
 * Gets the scoring summary data for a specified game if available.
 * @param {number} game - Game id.
 * @returns json
 * @example
 * const result = await sdv.ncaaGames.getNcaaScoringSummary(5764053);
 */
exports.getNcaaScoringSummary = async (game) => {
    const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/scoringSummary.json`;
    const res = await axios.get(baseUrl);
    return res.data;
}
const axios = require('axios');
/**
 * Gets the NBA scoreboard data for a specified date if available.
 * @param {*} year - Year (YYYY)
 * @param {*} month - Month (MM)
 * @param {*} day - Day (DD)
 * @param {number} limit - Limit on the number of results @default 300
 * @example
 * const result = await sdv.nbaScoreboard.getScoreboard(
 * year = 2019, month = 11, day = 16
 * )
 */
exports.getScoreboard = async ({
    year = null,
    month = null,
    day = null,
    limit = 300
}) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
    const params = {
        limit
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
};

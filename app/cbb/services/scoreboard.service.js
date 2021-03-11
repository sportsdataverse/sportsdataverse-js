const axios = require('axios');
/**
 * Gets the Men's College Basketball scoreboard data for a specified date if available.
 * @param {*} year - Year (YYYY)
 * @param {*} month - Month (MM)
 * @param {*} day - Day (DD)
 * @param {number} group - Group is 50 for Division-I, 51 for Division-II, 52 for Division-III
 * @param {number} seasontype - Pre-Season: 1, Regular Season: 2, Postseason: 3, Off-season: 4
 * @param {number} limit - Limit on the number of results @default 300
 * @example
 * const result = await sdv.cbbScoreboard.getScoreboard(
 * year = 2021, month = 02, day = 15, group=50
 * )
 */
exports.getScoreboard = async ({
    year = null,
    month = null,
    day = null,
    group = 50,
    seasontype = 2,
    limit = 1000}) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
    const params = {
        groups: group,
        seasontype: seasontype || 2,
        limit
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
};

exports.getConferences = async () => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard/conferences';

    const res = await axios.get(baseUrl);
    return res.data;
};
const axios = require('axios');
/**
 * Gets the Women's College Basketball scoreboard data for a specified date if available.
 * @param {*} year - Year (YYYY)
 * @param {*} month - Month (MM)
 * @param {*} day - Day (DD)
 * @param {number} group - Group is 50 for Division-I, 51 for Division-II, 52 for Division-III
 * @param {number} seasontype - Pre-Season: 1, Regular Season: 2, Postseason: 3, Off-season: 4
 * @param {number} limit - Limit on the number of results @default 300
 * @returns json
 * @example
 * const result = await sdv.wbbScoreboard.getScoreboard(
 * year = 2019, month = 02, day = 15, group=50
 * )
 */
exports.getScoreboard = async ({
    year = null,
    month = null,
    day = null,
    group = 50,
    seasontype = 2,
    limit = 300
}) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
    const params = {
        groups: group,
        seasontype: seasontype,
        limit
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
};

/**
 * Gets the list of all Women's College Basketball conferences and their identification info for ESPN.
 * @example
 * get list of teams
 * const result = await sdv.wbbScoreboard.getConferences();
 */
exports.getConferences = async () => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard/conferences';

    const res = await axios.get(baseUrl);
    return res.data;
};
const axios = require('axios');
/**
 * Gets the College Football scoreboard data for a specified date if available.
 * @param {*} year - Year (YYYY)
 * @param {*} month - Month (MM)
 * @param {*} day - Day (DD)
 * @param {number} group - Group is 80 for FBS, 81 for FCS
 * @param {number} seasontype - Pre-Season: 1, Regular Season: 2, Postseason: 3, Off-season: 4
 * @param {number} limit - Limit on the number of results @default 300
 * @example
 * const result = await sdv.cfbScoreboard.getScoreboard(
 * year = 2019, month = 11, day = 16, group=80
 * )
 */
exports.getScoreboard = async ({
    year = null,
    month = null,
    day = null,
    groups = 80,
    seasontype = 2,
    limit = 300
}) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
    const params = {
        groups: groups,
        seasontype,
        limit
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
};
/**
 * Gets the list of all College Football conferences and their identification info for ESPN.
 * @example
 * get list of teams
 * const result = await sdv.cfbScoreboard.getConferences();
 */
exports.getConferences = async () => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard/conferences';

    const res = await axios.get(baseUrl);
    return res.data;
};
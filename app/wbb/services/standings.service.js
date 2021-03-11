const axios = require('axios');
/**
 * Gets the team standings for Women's College Basketball.
 * @param {number} year - Season
 * @param {number} group - Group is 50 for Division-I, 51 for Division-II, 52 for Division-III
 * @example
 * get cbb standings
 * const yr = 2020;
 * const result = await sdv.wbbStandings.getStandings(year = yr);
 */
exports.getStandings = async ({
    year = new Date().getFullYear(),
    group = 50
}) => {
    const baseUrl = `http://cdn.espn.com/core/womens-college-basketball/standings/_/season/${year}/group/${group}`;

    const params = {
        xhr: 1,
        render: false,
        device: 'desktop',
        userab: 18
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.content.standings.groups;
};
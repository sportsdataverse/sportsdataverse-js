const axios = require('axios');
/**
 * Gets the team standings for College Football.
 * @param {number} year - Season
 * @param {number} group - Group is 80 for FBS, 81 for FCS
 * @example
 * get cfb standings
 * const yr = 2016;
 * const result = await sdv.cfbStandings.getStandings(year = yr);
 */
exports.getStandings = async ({
    year = new Date().getFullYear(),
    group = 80
}) => {
    const baseUrl = `http://cdn.espn.com/core/college-football/standings/_/season/${year}/group/${group}`;

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
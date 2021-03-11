const axios = require('axios');
/**
 * Gets the WBB rankings data for a specified year and week if available.
 * @param {*} year - Year (YYYY)
 * @param {*} week - Week
 * @example
 * const result = await sdv.wbbRankings.getRankings(
 * year = 2021, week = 4
 * )
 */
exports.getRankings = async ({
    year = null,
    week = null
}) => {
    const baseUrl = 'http://cdn.espn.com/core/womens-college-basketball/rankings?';
    const qs = {};

    if (year) {
        qs.year = year;
    }

    if (week) {
        qs.week = week;
    }

    const res = await axios.get(baseUrl, {
        params: qs
    });

    return res.content.data;
};
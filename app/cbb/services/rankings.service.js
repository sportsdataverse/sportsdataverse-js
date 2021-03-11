const axios = require('axios');
/**
 * Gets the Men's College Basketball rankings data for a specified year and week if available.
 * @param {*} year - Year (YYYY)
 * @param {*} week - Week
 * @example
 * const result = await sdv.cbbRankings.getRankings(
 * year = 2020, week = 15
 * )
 */
exports.getRankings = async ({
    year = null,
    week = null
}) => {
    const baseUrl = 'http://cdn.espn.com/core/mens-college-basketball/rankings?';
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
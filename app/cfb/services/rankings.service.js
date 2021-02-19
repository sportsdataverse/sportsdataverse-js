const axios = require('axios');

exports.getRankings = async ({
    year = null,
    week = null
}) => {
    const baseUrl = 'http://cdn.espn.com/core/college-football/rankings?';
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
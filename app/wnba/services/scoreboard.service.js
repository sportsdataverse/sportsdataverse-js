const axios = require('axios');

exports.getScoreboard = async ({
    year = null,
    month = null,
    day = null,
    groups = 59,
    seasontype = 2,
    limit = 300}) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard';
    const params = {
        dates: year+""+month+""+day,
        groups,
        seasontype,
        limit
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
};

exports.getConferences = async () => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard/conferences';

    const res = await axios.get(baseUrl);
    return res.data;
};
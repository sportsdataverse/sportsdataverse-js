const axios = require('axios');

exports.getScoreboard = async ({
    year = null,
    month = null,
    day = null,
    groups = 46,
    seasontype = 2,
    limit = 300
}) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
    const params = {
        dates: year+""+month.padStart(2,'0')+""+day.padStart(2,'0'),
        groups: groups,
        seasontype,
        limit
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
};

exports.getConferences = async () => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard/conferences';

    const res = await axios.get(baseUrl);
    return res.data;
};
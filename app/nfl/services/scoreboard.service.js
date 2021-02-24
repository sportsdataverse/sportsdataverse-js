const axios = require('axios');

exports.getScoreboard = async ({
    year = null,
    month = null,
    day = null,
    group = 20,
    seasontype = 2,
    limit = 300
}) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
    const params = {
        dates: year+""+month+""+day,
        groups: group,
        seasontype,
        limit
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
};

exports.getConferences = async () => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard/conferences';

    const res = await axios.get(baseUrl);
    return res.data;
};
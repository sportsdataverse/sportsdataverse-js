const axios = require('axios');

exports.getScoreboard = async ({
    year = null,
    month = null,
    day = null,
    groups = 46,
    seasontype = 2,
    limit = 300
}) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${year}${parseInt(month) <= 9 ? "0" + month : month}${parseInt(day) <= 9 ? "0" + day : day}`;
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

exports.getConferences = async () => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard/conferences';

    const res = await axios.get(baseUrl);
    return res.data;
};
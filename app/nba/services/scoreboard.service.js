const axios = require('axios');

exports.getScoreboard = async ({
    year = null,
    month = null,
    day = null,
    limit = 300
}) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
    const params = {
        limit
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
};

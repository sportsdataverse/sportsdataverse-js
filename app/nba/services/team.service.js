const axios = require('axios');

const getTeamList = async ({
    group = 46
}) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams';
    const params = {
        group,
        limit: 1000
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
}

const getTeamInfo = async (id) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}`;

    const res = await axios.get(baseUrl);
    return res.data;
}

const getTeamPlayers = async (id) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}`;
    const params = {
        enable: "roster"
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
}

module.exports = {
    getTeamList,
    getTeamInfo,
    getTeamPlayers
}
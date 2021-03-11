const axios = require('axios');

exports.getNcaaRedirectUrl = async (url) => {
    const baseUrl = `https://ncaa.com/${url}`;
    const response = await axios.get(baseUrl);
    const gameUrl = response.request.res.responseUrl;
    const gameId = parseInt(gameUrl.match(/.*\/(.*)\/(.*)$/)[2]);
    return gameId;
};

exports.getNcaaInfo = async (game) => {
    const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/gameInfo.json`;
    const res = await axios.get(baseUrl);
    return res.data;
}

exports.getNcaaBoxScore = async (game) => {
    const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/boxscore.json`;
    const res = await axios.get(baseUrl);
    return res.data;
}

exports.getNcaaPlayByPlay = async (game) => {
    const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/pbp.json`;
    const res = await axios.get(baseUrl);
    return res.data;
}


exports.getNcaaTeamStats = async (game) => {
    const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/teamStats.json`;
    const res = await axios.get(baseUrl);
    return res.data;
}

exports.getNcaaScoringSummary = async (game) => {
    const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/scoringSummary.json`;
    const res = await axios.get(baseUrl);
    return res.data;
}
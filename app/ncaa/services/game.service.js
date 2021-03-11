const axios = require('axios');

exports.getNcaaRedirectUrl = async (url) => {
    const baseUrl = `https://ncaa.com/${url}`;
    const response = await axios.get(baseUrl);

    return response.request.res.responseUrl;
};

exports.getNcaaInfo = async ({game, gameUrl = null}) => {
    if(gameUrl != null){
        const gameId = await this.getNcaaRedirectUrl(url = gameUrl)
        const baseUrl = `https://data.ncaa.com/casablanca/game/${gameId}/gameInfo.json`;
        const res = await axios.get(baseUrl);
        return res.data
    }else{
        const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/gameInfo.json`;
        const res = await axios.get(baseUrl);
        return res.data;
    }
}

exports.getNcaaBoxScore = async ({game, gameUrl = null}) => {
    if(gameUrl != null){
        const gameId = await this.getNcaaRedirectUrl(url = gameUrl)
        const baseUrl = `https://data.ncaa.com/casablanca/game/${gameId}/boxscore.json`;
        const res = await axios.get(baseUrl);
        return res.data
    }else{
        const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/boxscore.json`;
        const res = await axios.get(baseUrl);
        return res.data;
    }
}

exports.getNcaaPlayByPlay = async ({game, gameUrl = null}) => {
    if(gameUrl != null){
        const gameId = await this.getNcaaRedirectUrl(url = gameUrl)
        const baseUrl = `https://data.ncaa.com/casablanca/game/${gameId}/pbp.json`;
        const res = await axios.get(baseUrl);
        return res.data
    }else{
        const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/pbp.json`;
        const res = await axios.get(baseUrl);
        return res.data;
    }
}


exports.getNcaaTeamStats = async ({game, gameUrl = null}) => {
    if(gameUrl != null){
        const gameId = await this.getNcaaRedirectUrl(url = gameUrl)
        const baseUrl = `https://data.ncaa.com/casablanca/game/${gameId}/teamStats.json`;
        const res = await axios.get(baseUrl);
        return res.data
    }else{
        const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/teamStats.json`;
        const res = await axios.get(baseUrl);
        return res.data;
    }
}

exports.getNcaaScoringSummary = async ({game, gameUrl = null}) => {
    if(gameUrl != null){
        const gameId = await this.getNcaaRedirectUrl(url = gameUrl)
        const baseUrl = `https://data.ncaa.com/casablanca/game/${gameId}/scoringSummary.json`;
        const res = await axios.get(baseUrl);
        return res.data
    }else{
        const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/scoringSummary.json`;
        const res = await axios.get(baseUrl);
        return res.data;
    }
}
const axios = require('axios');
// acceptable sport names:
// ['basketball-women','soccer-men','soccer-women','fieldhockey',
//  'volleyball-women','icehockey-men','icehockey-women','baseball',
//  'beach-volleyball', 'lacrosse-men','lacrosse-women', 'volleyball-men']
// must use parameter - division = 'fbs' for football
exports.getNcaaScoreboard = async (sport,division,year,month ,day) => {
    const baseUrl = `https://data.ncaa.com/casablanca/scoreboard/${sport}/${division}/${year}/${month}/${day}/scoreboard.json`;

    const res = await axios.get(baseUrl);
    return res.data;
}

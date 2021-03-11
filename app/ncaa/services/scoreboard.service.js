const axios = require('axios');
/**
 * Gets the scoreboard data for a specified date and team sport if available.
 * @param {string} sport - Sport name. Acceptable values:
 * 'football','basketball-men', 'basketball-women',
 * 'baseball', 'softball', 'soccer-men','soccer-women',
 * 'fieldhockey', 'icehockey-men','icehockey-women',
 * 'lacrosse-men','lacrosse-women',
 * 'beach-volleyball', 'volleyball-women', 'volleyball-men'
 * @param {string} division - Division of teams desired.  Acceptable values:
 * Football - ['fbs','fcs','d2','d3']
 * All others - ['d1','d2','d3']
 * @param {*} year - Year (YYYY)
 * @param {*} month - Month (MM)
 * @param {*} day - Day (DD)
 * @example
 * const result = await sdv.ncaaScoreboard.getNcaaScoreboard(
 * sport = 'basketball-men', division = 'd3', year = 2019, month = 02, day = 15
 * )
 */
exports.getNcaaScoreboard = async (sport,division,year,month ,day) => {
    const baseUrl = `https://data.ncaa.com/casablanca/scoreboard/${sport}/${division}/${year}/${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}/${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}/scoreboard.json`;

    const res = await axios.get(baseUrl);
    return res.data;
}

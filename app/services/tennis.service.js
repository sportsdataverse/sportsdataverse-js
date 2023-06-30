const axios = require('axios');
/**
 * Operations for Tennis.
 *
 * @namespace tennis
 */
module.exports = {
    /**
     * Gets the scoreboard data for a specified date and league if available.
     * @memberOf tennis
     * @async
     * @function
     * @param {string} league - Tennis league desired. Default 'atp' Acceptable values:
     * ['atp', 'wta']
     * @param {*} year - Year (YYYY)
     * @param {*} month - Month (MM)
     * @param {*} day - Day (DD)
     * @returns json
     * @example
     * const result = await sdv.tennis.getScoreboard({
     * league = 'wta', year = 2023, month = 06, day = 20
     * })
     */
    getScoreboard: async function ({ league = 'atp', year, month, day }) {
        const baseUrl = `https://site.api.espn.com/apis/site/v2/sports/tennis/${league}/scoreboard`;
        const params = {};
        if (year && month && day) {
            params.dates = `${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
        }
        const res = await axios.get(baseUrl, {
            params,
        });
        return res.data;
    }
};
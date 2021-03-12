const axios = require('axios');
/**
 * Gets the NHL schedule data for a specified date if available.
 * @param {*} year - Year (YYYY)
 * @param {*} month - Month (MM)
 * @param {*} day - Day (DD)
 * @returns json
 * @example
 * const result = await sdv.nhlSchedule.getSchedule(
 * year = 2019, month = 11, day = 17
 * )
 */
const getSchedule = async ({
    year = null,
    month = null,
    day = null
}) => {
    const baseUrl = `http://cdn.espn.com/core/nhl/schedule?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
    const params = {
        xhr: 1,
        render: false,
        device: 'desktop',
        userab: 18
    };

    const res = await axios.get(baseUrl, {
        params
    });
    return res.data.content.schedule;
}

module.exports = {
    getSchedule
}
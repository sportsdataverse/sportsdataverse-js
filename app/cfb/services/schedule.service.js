const axios = require('axios');
/**
 * Gets the College Football schedule data for a specified date if available.
 * @param {*} year - Year (YYYY)
 * @param {*} month - Month (MM)
 * @param {*} day - Day (DD)
 * @param {number} group - Group is 80 for FBS, 81 for FCS
 * @param {number} seasontype - Pre-Season: 1, Regular Season: 2, Postseason: 3, Off-season: 4
 * @example
 * const result = await sdv.cfbSchedule.getSchedule(
 * year = 2019, month = 11, day = 16, group=80
 * )
 */
const getSchedule = async ({
    year = null,
    month = null,
    day = null,
    groups = 80,
    seasontype = 2
}) => {
    const baseUrl = `http://cdn.espn.com/core/college-football/schedule?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
    const params = {
        groups: groups,
        seasontype: seasontype,
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
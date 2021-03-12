const axios = require('axios');
/**
 * Gets the Men's College Basketball schedule data for a specified date if available.
 * @param {*} year - Year (YYYY)
 * @param {*} month - Month (MM)
 * @param {*} day - Day (DD)
 * @param {number} group - Group is 50 for Division-I, 51 for Division-II, 52 for Division-III
 * @param {number} seasontype - Pre-Season: 1, Regular Season: 2, Postseason: 3, Off-season: 4
 * @returns json
 * @example
 * const result = await sdv.cbbSchedule.getSchedule(
 * year = 2021, month = 02, day = 15, group=50
 * )
 */
const getSchedule = async ({
    year = null,
    month = null,
    day = null,
    group = 50,
    seasontype = 2
}) => {
    const baseUrl = `http://cdn.espn.com/core/mens-college-basketball/schedule?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
    const params = {
        groups: group,
        seasontype: seasontype,
        xhr: 1
    };

    const res = await axios.get(baseUrl, {
        params
    });
    return res.data.content.schedule;
}

module.exports = {
    getSchedule
}
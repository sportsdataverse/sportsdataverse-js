const axios = require('axios');

const getSchedule = async ({
    year = null,
    month = null,
    day = null,
    groups = 20,
    seasontype = 2
}) => {
    const baseUrl = `http://cdn.espn.com/core/nfl/schedule?dates=${year}${parseInt(month) <= 9 ? "0" + month : month}${parseInt(day) <= 9 ? "0" + day : day}`;
    const params = {
        groups: groups,
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
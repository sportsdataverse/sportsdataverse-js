const axios = require('axios');

const getSchedule = async ({
    year = null,
    month = null,
    day = null,
    group = 50,
    seasontype = null
}) => {
    const baseUrl = 'http://cdn.espn.com/core/college-football/schedule';
    const params = {
        dates: year+""+month+""+day,
        group: group,
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
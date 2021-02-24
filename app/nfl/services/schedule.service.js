const axios = require('axios');

const getSchedule = async ({
    year = null,
    month = null,
    day = null,
    groups = 20,
    seasontype = 2
}) => {
    const baseUrl = 'http://cdn.espn.com/core/nfl/schedule';
    const params = {
        dates: year+""+month.padStart(2,'0')+""+day.padStart(2,'0'),
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
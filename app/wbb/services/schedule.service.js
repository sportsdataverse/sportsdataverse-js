const axios = require('axios');

const getSchedule = async ({
    year = null,
    month = null,
    day = null,
    groups = 50,
    seasontype = 2
}) => {
    const baseUrl = 'http://cdn.espn.com/core/womens-college-basketball/schedule';
    const params = {
        dates: year+""+month+""+day,
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
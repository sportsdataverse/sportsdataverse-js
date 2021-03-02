const axios = require('axios');

exports.getStandings = async ({
// acceptable group names: ['league','conference','division']
    year = new Date().getFullYear(),
    group = 'league'
}) => {
    const baseUrl = `http://cdn.espn.com/core/nba/standings/_/season/${year}/group/${group}`;

    const params = {
        xhr: 1,
        render: false,
        device: 'desktop',
        userab: 18
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.content.standings.groups;
};
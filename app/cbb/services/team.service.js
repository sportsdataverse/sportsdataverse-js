const axios = require('axios');
/**
 * Gets the list of all College Football teams their identification info for ESPN.
 * @param {number} group - Group is 50 for Division-I, 51 for Division-II, 52 for Division-III
 * @example
 * get list of teams
 * const result = await sdv.cbbTeams.getTeamList(group=50);
 */
const getTeamList = async ({
    group = 50
}) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams';
    const params = {
        group,
        limit: 1000
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
}
/**
 * Gets the team info for a specific College Basketball team.
 * @param {number} id - Team Id
 * @example
 * get individual team data
 * const teamId = 52;
 * const result = await sdv.cbbTeams.getTeamInfo(teamId);
 */
const getTeamInfo = async (id) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${id}`;

    const res = await axios.get(baseUrl);
    return res.data;
}
/**
 * Gets the team roster information for a specific Men's College Basketball team.
 * @param {number} id - Team Id
 * @example
 * get team roster data
 * const teamId = 52;
 * const result = await sdv.cbbTeams.getTeamPlayers(teamId);
 */
const getTeamPlayers = async (id) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${id}`;
    const params = {
        enable: "roster"
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
}

module.exports = {
    getTeamList,
    getTeamInfo,
    getTeamPlayers
}
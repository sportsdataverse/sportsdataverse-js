const axios = require('axios');
/**
 * Gets the list of all Women's College Basketball teams their identification info for ESPN.
 * @param {number} group - Group is 50 for Division I, 51 for Division II, 52 for Division III
 * @example
 * get list of teams
 * const result = await sdv.wbbTeams.getTeamList(group=50);
 */
const getTeamList = async ({
    group = 50
}) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams';
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
 * Gets the team info for a specific WBB team.
 * @param {number} id - Team Id
 * @example
 * get individual team data
 * const teamId = 52;
 * const result = await sdv.wbbTeams.getTeamInfo(teamId);
 */
const getTeamInfo = async (id) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams/${id}`;

    const res = await axios.get(baseUrl);
    return res.data;
}
/**
 * Gets the team roster information for a specific WBB team.
 * @param {number} id - Team Id
 * @example
 * get team roster data
 * const teamId = 52;
 * const result = await sdv.wbbTeams.getTeamPlayers(teamId);
 */
const getTeamPlayers = async (id) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams/${id}`;
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
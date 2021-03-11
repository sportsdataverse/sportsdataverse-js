const axios = require('axios');
/**
 * Gets the list of all College Football teams their identification info for ESPN.
 * @param {number} group - Group is 80 for FBS, 81 for FCS
 * @example
 * get list of teams
 * const result = await sdv.cfbTeams.getTeamList(group=80);
 */
const getTeamList = async ({
    group = 80
}) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/college-football/teams';
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
 * Gets the team info for a specific College Football team.
 * @param {number} id - Team Id
 * @example
 * get individual team data
 * const teamId = 52;
 * const result = await sdv.cfbTeams.getTeamInfo(teamId);
 */
const getTeamInfo = async (id) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${id}`;

    const res = await axios.get(baseUrl);
    return res.data;
}
/**
 * Gets the team roster information for a specific College Football team.
 * @param {number} id - Team Id
 * @example
 * get team roster data
 * const teamId = 52;
 * const result = await sdv.cfbTeams.getTeamPlayers(teamId);
 */
const getTeamPlayers = async (id) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${id}`;
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
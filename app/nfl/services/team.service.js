const axios = require('axios');
/**
 * Gets the list of all NFL teams their identification info for ESPN.
 * @example
 * get list of teams
 * const result = await sdv.nflTeams.getTeamList();
 */
const getTeamList = async ({
}) => {
    const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams';
    const params = {
        limit: 1000
    };

    const res = await axios.get(baseUrl, {
        params
    });

    return res.data;
}
/**
 * Gets the team info for a specific NFL team.
 * @param {number} id - Team Id
 * @example
 * get individual team data
 * const teamId = 16;
 * const result = await sdv.nflTeams.getTeamInfo(teamId);
 */
const getTeamInfo = async (id) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}`;

    const res = await axios.get(baseUrl);
    return res.data;
}
/**
 * Gets the team roster information for a specific NFL team.
 * @param {number} id - Team Id
 * @example
 * get team roster data
 * const teamId = 16;
 * const result = await sdv.nflTeams.getTeamPlayers(teamId);
 */
const getTeamPlayers = async (id) => {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}`;
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
const axios = require('axios');
/**
 * Operations for WNBA.
 *
 * @namespace wnba
 */
 module.exports = {
    /**
     * Gets the WNBA game play-by-play data for a specified game.
     * @memberOf wnba
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.wnba.getPlayByPlay(401244185);
     */
    getPlayByPlay: async function (id){
        const baseUrl = 'http://cdn.espn.com/core/wnba/playbyplay';
        const params = {
            gameId: id,
            xhr: 1,
            render: 'false',
            userab: 18
        };

        const res = await axios.get(baseUrl, {
            params
        });

        return {
            teams: res.data.gamepackageJSON.header.competitions[0].competitors,
            id: res.data.gamepackageJSON.header.id,
            plays: res.data.gamepackageJSON.plays,
            competitions: res.data.gamepackageJSON.header.competitions,
            season: res.data.gamepackageJSON.header.season,
            boxScore: res.data.gamepackageJSON.boxscore,
            seasonSeries: res.data.gamepackageJSON.seasonseries,
            standings: res.data.gamepackageJSON.standings
        };
    },
    /**
     * Gets the WNBA game box score data for a specified game.
     * @memberOf wnba
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.wnba.getBoxScore(401244185);
     */
    getBoxScore: async function (id){
        const baseUrl = 'http://cdn.espn.com/core/wnba/boxscore';
        const params = {
            gameId: id,
            xhr: 1,
            render: false,
            device: 'desktop',
            userab: 18
        };

        const res = await axios.get(baseUrl, {
            params
        });

        const game = res.data.gamepackageJSON.boxscore;
        game.id = res.data.gameId;

        return game;
    },
    /**
     * Gets the WNBA game summary data for a specified game.
     * @memberOf wnba
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.wnba.getSummary(401244185);
     */
    getSummary: async function (id){
        const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/wnba/summary';
        const params = {
            event: id
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return {
            boxScore: res.data.boxscore,
            gameInfo: res.data.gameInfo,
            header: res.data.header,
            teams: res.data.gamepackageJSON.header.competitions[0].competitors,
            id: res.data.gamepackageJSON.header.id,
            plays: res.data.gamepackageJSON.plays,
            winProbability: res.data.winprobability,
            leaders: res.data.leaders,
            competitions: res.data.gamepackageJSON.header.competitions,
            season: res.data.gamepackageJSON.header.season,
            seasonSeries: res.data.gamepackageJSON.seasonseries,
            standings: res.data.gamepackageJSON.standings
        };
    },

    /**
     * Gets the WNBA schedule data for a specified date if available.
     * @memberOf wnba
     * @async
     * @function
     * @param {*} year - Year (YYYY)
     * @param {*} month - Month (MM)
     * @param {*} day - Day (DD)
     * @returns json
     * @example
     * const result = await sdv.wnba.getSchedule(
     * year = 2019, month = 07, day = 15
     * )
     */
    getSchedule: async function ({year = null, month = null, day = null}){
        const baseUrl = `http://cdn.espn.com/core/wnba/schedule?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
        const params = {
            xhr: 1,
            render: false,
            device: 'desktop',
            userab: 18
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data.content.schedule;
    },

    /**
     * Gets the WNBA scoreboard data for a specified date if available.
     * @memberOf wnba
     * @async
     * @function
     * @param {*} year - Year (YYYY)
     * @param {*} month - Month (MM)
     * @param {*} day - Day (DD)
     * @param {number} limit - Limit on the number of results @default 300
     * @returns json
     * @example
     * const result = await sdv.wnba.getScoreboard(
     * year = 2019, month = 07, day = 15
     * )
     */
    getScoreboard: async function ({year = null, month = null, day = null, limit = 300}){
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
        const params = {
            limit
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data;
    },
    /**
     * Gets the team standings for the WNBA.
     * @memberOf wnba
     * @async
     * @function
     * @param {number} year - Season
     * @param {number} group - acceptable group names: 'league','conference','division'
     * @returns json
     * @example
     * get WNBA standings
     * const yr = 2016;
     * const result = await sdv.wnba.getStandings(year = yr);
     */
    getStandings: async function ({year = new Date().getFullYear(), group = 'league'}){
        const baseUrl = `http://cdn.espn.com/core/wnba/standings/_/season/${year}/group/${group}`;
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
    },
    /**
     * Gets the list of all WNBA teams their identification info for ESPN.
     * @memberOf wnba
     * @async
     * @function
     * @returns json
     * @example
     * get list of teams
     * const result = await sdv.wnba.getTeamList();
     */
    getTeamList: async function ({}){
        const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams';
        const params = {
            limit: 1000
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data;
    },
    /**
     * Gets the team info for a specific WNBA team.
     * @memberOf wnba
     * @async
     * @function
     * @param {number} id - Team Id
     * @returns json
     * @example
     * get individual team data
     * const teamId = 16;
     * const result = await sdv.wnba.getTeamInfo(teamId);
     */
    getTeamInfo: async function (id){
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/${id}`;

        const res = await axios.get(baseUrl);
        return res.data;
    },
    /**
     * Gets the team roster information for a specific WNBA team.
     * @memberOf wnba
     * @async
     * @function
     * @param {number} id - Team Id
     * @returns json
     * @example
     * get team roster data
     * const teamId = 16;
     * const result = await sdv.wnba.getTeamPlayers(teamId);
     */
    getTeamPlayers: async function (id){
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/${id}`;
        const params = {
            enable: "roster"
        };

        const res = await axios.get(baseUrl, {
            params
        });

        return res.data;
    }
}


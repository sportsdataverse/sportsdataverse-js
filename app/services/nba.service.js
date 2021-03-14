const axios = require('axios');
/**
 * Operations for NBA.
 *
 * @namespace nba
 */
module.exports = {
    /**
     * Gets the NBA game play-by-play data for a specified game.
     * @memberOf nba
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.nba.getPlayByPlay(401283399);
     */
    getPlayByPlay: async function (id){
        const baseUrl = 'http://cdn.espn.com/core/nba/playbyplay';
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
     * Gets the NBA game box score data for a specified game.
     * @memberOf nba
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.nba.getBoxScore(401283399);
     */
    getBoxScore: async function (id){
        const baseUrl = 'http://cdn.espn.com/core/nba/boxscore';
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
     * Gets the NBA game summary data for a specified game.
     * @memberOf nba
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.nba.getSummary(401283399);
     */
    getSummary: async function (id){
        const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary';
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
     * Gets the NBA game PickCenter data for a specified game.
     * @memberOf nba
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.nba.getPicks(401283399);
     */
    getPicks: async function (id){
        const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary';
        const params = {
            event: id
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return {
            id: parseInt(res.data.header.id),
            gameInfo: res.data.gameInfo,
            leaders: res.data.leaders,
            header: res.data.header,
            teams: res.data.header.competitions[0].competitors,
            competitions: res.data.header.competitions,
            winProbability: res.data.winprobability,
            pickcenter: res.data.winprobability,
            againstTheSpread: res.data.againstTheSpread,
            odds: res.data.odds,
            seasonSeries: res.data.seasonseries,
            season: res.data.header.season,
            standings: res.data.standings
        };
    },
    /**
     * Gets the NBA schedule data for a specified date if available.
     * @memberOf nba
     * @async
     * @function
     * @param {*} year - Year (YYYY)
     * @param {*} month - Month (MM)
     * @param {*} day - Day (DD)
     * @returns json
     * @example
     * const result = await sdv.nba.getSchedule(
     * year = 2016, month = 04, day = 15
     * )
     */
    getSchedule: async function ({year = null, month = null, day = null}){
        const baseUrl = `http://cdn.espn.com/core/nba/schedule?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
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
     * Gets the NBA scoreboard data for a specified date if available.
     * @memberOf nba
     * @async
     * @function
     * @param {*} year - Year (YYYY)
     * @param {*} month - Month (MM)
     * @param {*} day - Day (DD)
     * @param {number} limit - Limit on the number of results @default 300
     * @returns json
     * @example
     * const result = await sdv.nba.getScoreboard(
     * year = 2019, month = 11, day = 16
     * )
     */
    getScoreboard: async function ({year = null, month = null, day = null, limit = 300}){
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
        const params = {
            limit
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data;
    },
    /**
     * Gets the team standings for the NBA.
     * @memberOf nba
     * @async
     * @function
     * @param {number} year - Season
     * @param {number} group - acceptable group names: 'league','conference','division'
     * @returns json
     * @example
     * get NBA standings
     * const yr = 2016;
     * const result = await sdv.nba.getStandings(year = yr);
     */
    getStandings: async function ({year = new Date().getFullYear(), group = 'league'}){
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
    },
    /**
     * Gets the list of all NBA teams their identification info for ESPN.
     * @memberOf nba
     * @async
     * @function
     * @returns json
     * @example
     * get list of teams
     * const result = await sdv.nba.getTeamList();
     */
    getTeamList: async function (){
        const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams';
        const params = {
            limit: 1000
        };

        const res = await axios.get(baseUrl, {
            params
        });

        return res.data;
    },
    /**
     * Gets the team info for a specific NBA team.
     * @memberOf nba
     * @async
     * @function
     * @param {number} id - Team Id
     * @returns json
     * @example
     * get individual team data
     * const teamId = 16;
     * const result = await sdv.nba.getTeamInfo(teamId);
     */
    getTeamInfo: async function (id){
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}`;

        const res = await axios.get(baseUrl);
        return res.data;
    },
    /**
     * Gets the team roster information for a specific NBA team.
     * @memberOf nba
     * @async
     * @function
     * @param {number} id - Team Id
     * @returns json
     * @example
     * get team roster data
     * const teamId = 16;
     * const result = await sdv.nba.getTeamPlayers(teamId);
     */
    getTeamPlayers: async function (id){
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}`;
        const params = {
            enable: "roster"
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data;
    }
}

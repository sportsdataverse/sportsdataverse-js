const axios = require('axios');
/**
 * Operations for NFL.
 *
 * @namespace nfl
 */
module.exports = {
    /**
     * Gets the NFL game play-by-play data for a specified game.
     * @memberOf nfl
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.nfl.getPlayByPlay(401220403);
     */
    getPlayByPlay: async function (id) {
        const baseUrl = 'http://cdn.espn.com/core/nfl/playbyplay';
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
            id: res.data.gameId,
            drives: res.data.gamepackageJSON.drives,
            competitions: res.data.gamepackageJSON.header.competitions,
            season: res.data.gamepackageJSON.header.season,
            week: res.data.gamepackageJSON.header.week,
            boxScore: res.data.gamepackageJSON.boxscore,
            scoringPlays: res.data.gamepackageJSON.scoringPlays,
            standings: res.data.gamepackageJSON.standings
        };
    },
    /**
     * Gets the NFL game box score data for a specified game.
     * @memberOf nfl
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.nfl.getBoxScore(401220403);
     */
    getBoxScore: async function (id) {
        const baseUrl = 'http://cdn.espn.com/core/nfl/boxscore';
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
     * Gets the NFL game summary data for a specified game.
     * @memberOf nfl
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.nfl.getSummary(401220403);
     */
    getSummary: async function (id) {
        const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/summary';
        const params = {
            event: id
        };

        const res = await axios.get(baseUrl, {
            params
        });

        return {
            id: parseInt(res.data.header.id),
            boxScore: res.data.boxscore,
            gameInfo: res.data.gameInfo,
            drives: res.data.drives,
            leaders: res.data.leaders,
            header: res.data.header,
            teams: res.data.header.competitions[0].competitors,
            scoringPlays: res.data.scoringPlays,
            winProbability: res.data.winprobability,
            leaders: res.data.leaders,
            competitions: res.data.header.competitions,
            season: res.data.header.season,
            week: res.data.header.week,
            standings: res.data.standings
        };
    },
    /**
     * Gets the NFL PickCenter data for a specified game.
     * @memberOf nfl
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.nfl.getPicks(401220403);
     */
    getPicks: async function (id) {
        const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/summary';
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
            season: res.data.header.season,
            week: res.data.header.week,
            standings: res.data.standings
        };
    },
    /**
     * Gets the NFL schedule data for a specified date if available.
     * @memberOf nfl
     * @async
     * @function
     * @param {*} year - Year (YYYY)
     * @param {*} month - Month (MM)
     * @param {*} day - Day (DD)
     * @returns json
     * @example
     * const result = await sdv.nfl.getSchedule(
     * year = 2019, month = 11, day = 17
     * )
     */
    getSchedule: async function ({ year = null, month = null, day = null }) {
        const baseUrl = `http://cdn.espn.com/core/nfl/schedule?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
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
     * Gets the NFL Weekly Schedule data for a specified season type.
     * @memberOf nfl
     * @async
     * @function
     * @param {*} week - Week (1-17) Default is 1
     * @param {*} year - Year (YYYY) Default is current year
     * @param {*} seasonType -  Season Type (1 = Preseason, 2 = Regular Season, 3 = Postseason) Default is 2
     * @returns json
     * @example
     * const result = await sdv.nfl.getWeeklySchedule(
     * week = 1, year = 2023, seasonType = 2
     * )
     */
    getWeeklySchedule: async function ({ week = 1, year = null, seasonType = 2 }) {
        if(!year) year = new Date().getFullYear();
       const baseUrl = `http://cdn.espn.com/core/nfl/schedule/_/week/${week}/year/${year}/seasontype/${seasonType}`;
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
     * Gets the NFL scoreboard data for a specified date if available.
     * @memberOf nfl
     * @async
     * @function
     * @param {*} year - Year (YYYY)
     * @param {*} month - Month (MM)
     * @param {*} day - Day (DD)
     * @param {number} limit - Limit on the number of results @default 300
     * @returns json
     * @example
     * const result = await sdv.nfl.getScoreboard(
     * year = 2019, month = 11, day = 17
     * )
     */
    getScoreboard: async function ({ year, month, day, limit = 300 }) {
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`;

        const params = {
            limit
        };
        if (year && month && day) {
            params.dates = `${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
        }
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data;
    },
    /**
     * Gets the team standings for the NFL.
     * @memberOf nfl
     * @async
     * @function
     * @param {number} year - Season
     * @param {string} group - acceptable group names: 'league','conference','division'
     * @returns json
     * @example
     * const yr = 2021;
     * const result = await sdv.nfl.getStandings(year = yr);
     */
    getStandings: async function ({ year = new Date().getFullYear(), group = 'league' }) {
        const groupId = group === 'league' ? 1 : group === 'conference' ? 2 : 3;
        const baseUrl = `https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings`;
        const params = {
            region: 'us',
            lang: 'en',
            contentorigin: 'espn',
            season: year,
            type: 1,
            level: groupId
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data;
    },
    /**
     * Gets the list of all NFL teams their identification info for ESPN.
     * @memberOf nfl
     * @async
     * @function
     * @example
     * const result = await sdv.nfl.getTeamList();
     */
    getTeamList: async function () {
        const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams';
        const params = {
            limit: 1000
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data;
    },
    /**
     * Gets the team info for a specific NFL team.
     * @memberOf nfl
     * @async
     * @function
     * @param {number} id - Team Id
     * @returns json
     * @example
     * const teamId = 16;
     * const result = await sdv.nfl.getTeamInfo(teamId);
     */
    getTeamInfo: async function ({ id }) {
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}`;
        const res = await axios.get(baseUrl);
        return res.data;
    },
    /**
     * Gets the team roster information for a specific NFL team.
     * @memberOf nfl
     * @async
     * @function
     * @param {number} id - Team Id
     * @returns json
     * @example
     * const teamId = 16;
     * const result = await sdv.nfl.getTeamPlayers(teamId);
     */
    getTeamPlayers: async function ({ id }) {
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}`;
        const params = {
            enable: "roster"
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data;
    }
}

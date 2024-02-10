import axios from 'axios';
/**
 * Operations for WBB.
 *
 * @namespace wbb
 */
export default {
    /**
     * Gets the Women's College Basketball game play-by-play data for a specified game.
     * @memberOf wbb
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.wbb.getPlayByPlay(401260565);
     */
    getPlayByPlay: async function (id) {
        const baseUrl = 'http://cdn.espn.com/core/womens-college-basketball/playbyplay';
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
            id: res.data.gamepackageJSON.header.id,
            teams: res.data.gamepackageJSON.header.competitions[0].competitors,
            plays: res.data.gamepackageJSON.plays,
            competitions: res.data.gamepackageJSON.header.competitions,
            season: res.data.gamepackageJSON.header.season,
            boxScore: res.data.gamepackageJSON.boxscore
        };
    },
    /**
     * Gets the Women's College Basketball game box score data for a specified game.
     * @memberOf wbb
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.wbb.getBoxScore(401260565);
     */
    getBoxScore: async function (id) {
        const baseUrl = 'http://cdn.espn.com/core/womens-college-basketball/boxscore';
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
     * Gets the Women's College Basketball game summary data for a specified game.
     * @memberOf wbb
     * @async
     * @function
     * @param {number} id - Game id.
     * @returns json
     * @example
     * const result = await sdv.wbb.getSummary(401260565);
     */
    getSummary: async function (id) {
        const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/summary';
        const params = {
            event: id
        };

        const res = await axios.get(baseUrl, {
            params
        });

        return {
            boxScore: res.data.boxscore,
            gameInfo: res.data.gameInfo,
            leaders: res.data.leaders,
            winProbability: res.data.winprobability,
            header: res.data.header,
            plays: res.data.plays,
            standings: res.data.standings

        };
    },
    /**
     * Gets the Women's College Basketball schedule data for a specified date if available.
     * @memberOf wbb
     * @async
     * @function
     * @param {*} year - Year (YYYY)
     * @param {*} month - Month (MM)
     * @param {*} day - Day (DD)
     * @param {number} group - Group is 50 for Division-I, 51 for Division-II, 52 for Division-III
     * @param {number} seasontype - Pre-Season: 1, Regular Season: 2, Postseason: 3, Off-season: 4
     * @param {number} limit - Limit on the number of results @default 300
     * @returns json
     * @example
     * const result = await sdv.wbb.getSchedule(
     * year = 2021, month = 02, day = 15, group=50
     * )
     */
    getSchedule: async function ({
        year,
        month,
        day,
        groups = 50,
        seasontype = 2,
        limit = 300
    }) {
        const baseUrl = `http://cdn.espn.com/core/womens-college-basketball/schedule`;
        if (year && month && day) {
            params.dates = `${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
        }
        const params = {
            groups: groups,
            seasontype: seasontype,
            limit: limit,
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
     * Gets the Women's College Basketball scoreboard data for a specified date if available.
     * @memberOf wbb
     * @async
     * @function
     * @param {*} year - Year (YYYY)
     * @param {*} month - Month (MM)
     * @param {*} day - Day (DD)
     * @param {number} group - Group is 50 for Division-I, 51 for Division-II, 52 for Division-III
     * @param {number} seasontype - Pre-Season: 1, Regular Season: 2, Postseason: 3, Off-season: 4
     * @param {number} limit - Limit on the number of results @default 300
     * @returns json
     * @example
     * const result = await sdv.wbb.getScoreboard(
     * year = 2019, month = 02, day = 15, group=50
     * )
     */
    getScoreboard: async function ({
        year,
        month,
        day,
        group = 50,
        seasontype = 2,
        limit = 300
    }) {
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard`;
        const params = {
            groups: group,
            seasontype: seasontype,
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
     * Gets the list of all Women's College Basketball conferences and their identification info for ESPN.
     * @memberOf wbb
     * @async
     * @function
     * @param {number} year - Season
     * @param {number} group - Group is 50 for Division-I, 51 for Division-II, 52 for Division-III
     * @returns json
     * @example
     * const yr = 2021;
     * const result = await sdv.wbb.getConferences(year = yr, group = 50);
     */
    getConferences: async function ({ year = new Date().getFullYear(), group = 50 }) {
        const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard/conferences';

        const params = {
            season: year,
            group: group
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data;
    },
    /**
     * Gets the team standings for Women's College Basketball.
     * @memberOf wbb
     * @async
     * @function
     * @param {number} year - Season
     * @param {number} group - Group is 50 for Division-I, 51 for Division-II, 52 for Division-III, see wbb.getConferences() for more info
     * @returns json
     * @example
     * const yr = 2020;
     * const result = await sdv.wbb.getStandings(year = yr);
     */
    getStandings: async function ({ year = new Date().getFullYear(), group = 50 }) {
        const baseUrl = `https://site.web.api.espn.com/apis/v2/sports/basketball/womens-college-basketball/standings`;
        const params = {
            region: 'us',
            lang: 'en',
            contentorigin: 'espn',
            season: year,
            group: group,
            type: 0,
            level: 1,
            sort: 'leaguewinpercent:desc,vsconf_winpercent:desc,' +
                'vsconf_gamesbehind:asc,vsconf_playoffseed:asc,wins:desc,' +
                'losses:desc,playoffseed:asc,alpha:asc'
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data;
    },
    /**
     * Gets the list of all Women's College Basketball teams their identification info for ESPN.
     * @memberOf wbb
     * @async
     * @function
     * @param {number} group - Group is 50 for Division I, 51 for Division II, 52 for Division III
     * @returns json
     * @example
     * get list of teams
     * const result = await sdv.wbb.getTeamList(group=50);
     */
    getTeamList: async function ({ group = 50 }) {
        const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams';
        const params = {
            group,
            limit: 1000
        };
        const res = await axios.get(baseUrl, {
            params
        });
        return res.data;
    },
    /**
     * Gets the team info for a specific WBB team.
     * @memberOf wbb
     * @async
     * @function
     * @param {number} id - Team Id
     * @returns json
     * @example
     * const teamId = 52;
     * const result = await sdv.wbb.getTeamInfo(teamId);
     */
    getTeamInfo: async function (id) {
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams/${id}`;

        const res = await axios.get(baseUrl);
        return res.data;
    },
    /**
     * Gets the team roster information for a specific WBB team.
     * @memberOf wbb
     * @async
     * @function
     * @param {number} id - Team Id
     * @returns json
     * @example
     * const teamId = 52;
     * const result = await sdv.wbb.getTeamPlayers(teamId);
     */
    getTeamPlayers: async function (id) {
        const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams/${id}`;
        const params = {
            enable: "roster"
        };

        const res = await axios.get(baseUrl, {
            params
        });

        return res.data;
    }
}

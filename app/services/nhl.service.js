const axios = require('axios');
/**
 * Operations for NCAA Sports.
 *
 * @namespace ncaa
 */
const nhl = module.exports = {
    nhl: {

        /**
         * Gets the NHL game play-by-play data for a specified game.
         * @param {number} id - Game id.
         * @returns json
         * @example
         * const result = await sdv.nhlGames.getPlayByPlay(401272446);
         */
        getPlayByPlay: async (id) => {
            const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary';
            const params = {
                event: id
            };

            const res = await axios.get(baseUrl, {
                params
            });

            return {
                teams: res.data.header.competitions[0].competitors,
                id: parseInt(res.data.header.id),
                plays: res.data.plays,
                onIce: res.data.onIce,
                competitions: res.data.header.competitions,
                season: res.data.header.season,
                boxScore: res.data.boxscore,
                seasonSeries: res.data.seasonseries,
                standings: res.data.standings
            };
        },
        /**
         * Gets the NHL game box score data for a specified game.
         * @param {number} id - Game id.
         * @returns json
         * @example
         * const result = await sdv.nhlGames.getBoxScore(401272446);
         */
        getBoxScore: async (id) => {
            const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary';
            const params = {
                event: id
            };

            const res = await axios.get(baseUrl, {
                params
            });

            const game = res.data.boxscore;
            game.id = parseInt(res.data.header.id);

            return game;
        },
        /**
         * Gets the NHL game summary data for a specified game.
         * @param {number} id - Game id.
         * @returns json
         * @example
         * const result = await sdv.nhlGames.getSummary(401272446);
         */
        getSummary: async (id) => {
            const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary';
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
                teams: res.data.header.competitions[0].competitors,
                id: parseInt(res.data.header.id),
                plays: res.data.plays,
                onIce: res.data.onIce,
                leaders: res.data.leaders,
                competitions: res.data.header.competitions,
                season: res.data.header.season,
                seasonSeries: res.data.seasonseries,
                standings: res.data.standings
            };
        },
        /**
         * Gets the NHL PickCenter data for a specified game.
         * @param {number} id - Game id.
         * @returns json
         * @example
         * const result = await sdv.nhlGames.getPicks(401272446);
         */
        getPicks: async (id) => {
            const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary';
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
                pickcenter: res.data.winprobability,
                againstTheSpread: res.data.againstTheSpread,
                odds: res.data.odds,
                seasonSeries: res.data.seasonseries,
                season: res.data.header.season,
                standings: res.data.standings
            };
        },
        /**
         * Gets the NHL schedule data for a specified date if available.
         * @param {*} year - Year (YYYY)
         * @param {*} month - Month (MM)
         * @param {*} day - Day (DD)
         * @returns json
         * @example
         * const result = await sdv.nhl.getSchedule(
         * year = 2019, month = 11, day = 17
         * )
         */
        getSchedule: async ({year = null, month = null, day = null}) => {
            const baseUrl = `http://cdn.espn.com/core/nhl/schedule?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
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
         * Gets the NHL scoreboard data for a specified date if available.
         * @param {*} year - Year (YYYY)
         * @param {*} month - Month (MM)
         * @param {*} day - Day (DD)
         * @param {number} limit - Limit on the number of results @default 300
         * @returns json
         * @example
         * const result = await sdv.nhlScoreboard.getScoreboard(
         * year = 2019, month = 11, day = 16
         * )
         */
        getScoreboard: async ({year = null, month = null, day = null, limit = 300}) => {
            const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
            const params = {
                limit
            };

            const res = await axios.get(baseUrl, {
                params
            });

            return res.data;
        },
        /**
         * Gets the team standings for the NHL.
         * @param {number} year - Season
         * @param {number} group - acceptable group names: 'league','conference','division'
         * @returns json
         * @example
         * get NHL standings
         * const yr = 2016;
         * const result = await sdv.nhlStandings.getStandings(year = yr);
         */
        getStandings: async ({
            // acceptable group names: ['league','conference','division']
                year = new Date().getFullYear(),
                group = 'league'
            }) => {
                const baseUrl = `http://cdn.espn.com/nhl/standings/_/season/${year}/group/${group}`;
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
         * Gets the list of all NHL teams their identification info for ESPN.
         * @example
         * get list of teams
         * const result = await sdv.nhlTeams.getTeamList();
         */
        getTeamList: async () => {
            const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams';
            const params = {
                limit: 1000
            };

            const res = await axios.get(baseUrl, {
                params
            });

            return res.data;
        },
        /**
         * Gets the team info for a specific NHL team.
         * @param {number} id - Team Id
         * @returns json
         * @example
         * get individual team data
         * const teamId = 16;
         * const result = await sdv.nhlTeams.getTeamInfo(teamId);
         */
        getTeamInfo: async (id) => {
            const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/${id}`;

            const res = await axios.get(baseUrl);
            return res.data;
        },
        /**
         * Gets the team roster information for a specific NHL team.
         * @param {number} id - Team Id
         * @returns json
         * @example
         * get team roster data
         * const teamId = 16;
         * const result = await sdv.nhlTeams.getTeamPlayers(teamId);
         */
        getTeamPlayers: async (id) => {
            const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/${id}`;
            const params = {
                enable: "roster"
            };

            const res = await axios.get(baseUrl, {
                params
            });

            return res.data;
        }

    }
}
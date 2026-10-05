import { get } from '../core/client.js';
import { espnNbaCdnBoxscore, espnNbaCdnPlaybyplay, espnNbaCdnSchedule } from '../generated/espn/nba.js';
import { cdnDate } from './_cdn.js';
/**
 * Operations for NBA.
 *
 * > **Superseded:** these hand-written `get*` methods predate the generated
 * > cross-league ESPN surface. They remain supported for back-compat, but new
 * > code should prefer the generated `espn_nba_*` wrappers (e.g.
 * > `sdv.nba.espn_nba_scoreboard()`), which cover far more ESPN
 * > endpoints and share one maintained codegen pipeline.
 *
 * @namespace nba
 */
export default {
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
    getPlayByPlay: async function (id) {
        // via espn_nba_cdn_playbyplay (https; core request layer + error vocabulary)
        const res = { data: (await espnNbaCdnPlaybyplay({ game_id: id })) as any };
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
    getBoxScore: async function (id) {
        // via espn_nba_cdn_boxscore (https; core request layer + error vocabulary)
        const res = { data: (await espnNbaCdnBoxscore({ game_id: id })) as any };
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
    getSummary: async function (id) {
        const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary';
        const params: Record<string, any> = {
            event: id
        };
        const res = { data: await get(baseUrl, { params, family: 'site_v2' }) };
        return {
            boxScore: res.data.boxscore,
            gameInfo: res.data.gameInfo,
            header: res.data.header,
            // site v2 summaries have no gamepackageJSON (that is the CDN page wrapper): read header / top level
            teams: res.data.header?.competitions[0].competitors,
            id: res.data.header?.id,
            plays: res.data.plays,
            winProbability: res.data.winprobability,
            leaders: res.data.leaders,
            competitions: res.data.header?.competitions,
            season: res.data.header?.season,
            seasonSeries: res.data.seasonseries,
            standings: res.data.standings
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
    getPicks: async function (id) {
        const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary';
        const params: Record<string, any> = {
            event: id
        };
        const res = { data: await get(baseUrl, { params, family: 'site_v2' }) };
        return {
            id: parseInt(res.data.header.id),
            gameInfo: res.data.gameInfo,
            leaders: res.data.leaders,
            header: res.data.header,
            teams: res.data.header.competitions[0].competitors,
            competitions: res.data.header.competitions,
            winProbability: res.data.winprobability,
            pickcenter: res.data.pickcenter,
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
    getSchedule: async function ({ year = null, month = null, day = null }) {
        // espn_nba_cdn_schedule sends the CDN's `date` key (`dates` is ignored).
        const res = (await espnNbaCdnSchedule({ date: cdnDate(year, month, day) })) as any;
        return res.content.schedule;
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
    getScoreboard: async function ({ year, month, day, limit = 300 }) {
        const baseUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`;
        const params: Record<string, any> = {
            limit
        };
        if (year && month && day) {
            params.dates = `${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
        }
        const res = { data: await get(baseUrl, { params, family: 'site_v2' }) };
        return res.data;
    },
    /**
     * Gets the team standings for the NBA.
     * @memberOf nba
     * @async
     * @function
     * @param {number} year - Season
     * @param {string} group - acceptable group names: 'league','conference','division'
     * @returns json
     * @example
     * const yr = 2016;
     * const result = await sdv.nba.getStandings(year = yr);
     */
    getStandings: async function ({ year = new Date().getFullYear(), group = 'league' }) {
        const groupId = group === 'league' ? 1 : group === 'conference' ? 2 : 3;
        const baseUrl = `https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings`;
        const params: Record<string, any> = {
            region: 'us',
            lang: 'en',
            contentorigin: 'espn',
            season: year,
            type: 1,
            level: groupId
        };
        const res = { data: await get(baseUrl, { params, family: 'web_v3' }) };
        return res.data;
    },
    /**
     * Gets the list of all NBA teams their identification info for ESPN.
     * @memberOf nba
     * @async
     * @function
     * @returns json
     * @example
     * const result = await sdv.nba.getTeamList();
     */
    getTeamList: async function () {
        const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams';
        const params: Record<string, any> = {
            limit: 1000
        };

        const res = { data: await get(baseUrl, { params, family: 'site_v2' }) };

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
     * const teamId = 16;
     * const result = await sdv.nba.getTeamInfo(teamId);
     */
    getTeamInfo: async function (id) {
        const baseUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}`;

        const res = { data: await get(baseUrl, { family: 'site_v2' }) };
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
     * const teamId = 16;
     * const result = await sdv.nba.getTeamPlayers(teamId);
     */
    getTeamPlayers: async function (id) {
        const baseUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}`;
        const params: Record<string, any> = {
            enable: "roster"
        };
        const res = { data: await get(baseUrl, { params, family: 'site_v2' }) };
        return res.data;
    }
}

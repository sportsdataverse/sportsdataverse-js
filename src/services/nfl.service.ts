import { get } from '../core/client.js';
import { espnNflCdnBoxscore, espnNflCdnPlaybyplay, espnNflCdnSchedule } from '../generated/espn/nfl.js';
import { cdnDate, scoreboardDates, warnFootballDate } from './_cdn.js';
import type { CdnGamePage, CdnSchedulePage, DateArgs } from './_cdn.js';
/**
 * Operations for NFL.
 *
 * > **Superseded:** these hand-written `get*` methods predate the generated
 * > cross-league ESPN surface. They remain supported for back-compat, but new
 * > code should prefer the generated `espn_nfl_*` wrappers (e.g.
 * > `sdv.nfl.espn_nfl_scoreboard()`), which cover far more ESPN
 * > endpoints and share one maintained codegen pipeline.
 *
 * @namespace nfl
 */
export default {
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
    getPlayByPlay: async function (id: number | string) {
        // via espn_nfl_cdn_playbyplay (https; core request layer + error vocabulary)
        const res = { data: (await espnNflCdnPlaybyplay({ game_id: id })) as CdnGamePage };
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
    getBoxScore: async function (id: number | string) {
        // via espn_nfl_cdn_boxscore (https; core request layer + error vocabulary)
        const res = { data: (await espnNflCdnBoxscore({ game_id: id })) as CdnGamePage };
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
    getSummary: async function (id: number | string) {
        const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary';
        const params: Record<string, any> = {
            event: id
        };

        const res = { data: await get(baseUrl, { params, family: 'site_v2' }) };

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
    getPicks: async function (id: number | string) {
        const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary';
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
     * @param {number} week - Week number. The CDN schedule page is week-oriented and ignores a
     * date, so pass `week` (with `year` = the season) to pick a week; without it the current
     * week comes back (and a date warns once).
     * @param {number} seasontype - Pre-Season: 1, Regular Season: 2, Postseason: 3 (with `week`)
     * @returns json
     * @example
     * const result = await sdv.nfl.getSchedule({ year: 2024, week: 5, seasontype: 2 })
     */
    getSchedule: async function ({ year = null, month = null, day = null, week = null, seasontype = 2 }: DateArgs & { week?: number | string | null; seasontype?: number }) {
        // The CDN ignores a date for football: select the week (espn_nfl_cdn_schedule).
        if (week == null && cdnDate(year, month, day)) warnFootballDate("nfl");
        const res = (await espnNflCdnSchedule(
            week != null ? { week, season: year, season_type: seasontype } : { date: cdnDate(year, month, day) }
        )) as CdnSchedulePage;
        return res.content.schedule;
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
    getWeeklySchedule: async function ({ week = 1, year = null, seasonType = 2 }: { week?: number | string; year?: number | string | null; seasonType?: number }) {
        if(!year) year = new Date().getFullYear();
        // via espn_nfl_cdn_schedule (https; core request layer + error vocabulary)
        const res = (await espnNflCdnSchedule({ week, season: year, season_type: seasonType })) as CdnSchedulePage;
        return res.content.schedule;
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
    getScoreboard: async function ({ year, month, day, limit = 300 }: DateArgs & { limit?: number }) {
        const baseUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`;

        const params: Record<string, any> = {
            limit
        };
        if (year && month && day) {
            params.dates = scoreboardDates(year, month, day);
        }
        const res = { data: await get(baseUrl, { params, family: 'site_v2' }) };
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
     * Gets the list of all NFL teams their identification info for ESPN.
     * @memberOf nfl
     * @async
     * @function
     * @example
     * const result = await sdv.nfl.getTeamList();
     */
    getTeamList: async function () {
        const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams';
        const params: Record<string, any> = {
            limit: 1000
        };
        const res = { data: await get(baseUrl, { params, family: 'site_v2' }) };
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
    getTeamInfo: async function ({ id }: { id: number | string }) {
        const baseUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}`;
        const res = { data: await get(baseUrl, { family: 'site_v2' }) };
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
    getTeamPlayers: async function ({ id }: { id: number | string }) {
        const baseUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}`;
        const params: Record<string, any> = {
            enable: "roster"
        };
        const res = { data: await get(baseUrl, { params, family: 'site_v2' }) };
        return res.data;
    }
}

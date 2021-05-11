const axios = require('axios');
const cheerio = require('cheerio');
const decode = require('decode-html');
const tabletojson = require("tabletojson").Tabletojson;
/**
 * Operations for NCAA Sports.
 *
 * @namespace ncaa
 */
module.exports = {
    /**
     * Gets the gameId for older games whose url redirects to the current url pattern using the
     * game url fragment (relative to [https://ncaa.com](https://ncaa.com)) pulled from ncaaScoreboard
     * @memberOf ncaa
     * @async
     * @function
     * @param {string} url - Game url as pulled from ncaaScoreboard.getNcaaScoreboard.
     * @returns json
     * @example
     * const result = await sdv.ncaaScoreboard.getNcaaScoreboard(
     * sport = 'basketball-men', division = 'd3', year = 2019, month = 02, day = 15
     * )
     * const urlGame = result["games"][16]["game"]["url"]
     * const gameId = await sdv.ncaa.getRedirectUrl(url=urlGame);
     */
    getRedirectUrl: async function (url){
        const baseUrl = `https://ncaa.com/${url}`;
        const response = await axios.get(baseUrl);
        const gameUrl = response.request.res.responseUrl;
        const gameId = parseInt(gameUrl.match(/.*\/(.*)\/(.*)$/)[2]);
        return gameId;
    },
    /**
     * Gets the gameInfo data for a specified game.
     * @memberOf ncaa
     * @async
     * @function
     * @param {number} game - Game id.
     * @returns json
     * @example
     * const result = await sdv.ncaa.getInfo(5764053);
     */
    getInfo: async function (game){
        const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/gameInfo.json`;
        const res = await axios.get(baseUrl);
        return res.data;
    },
    /**
     * Gets the box score data for a specified game if available.
     * @memberOf ncaa
     * @async
     * @function
     * @param {number} game - Game id.
     * @returns json
     * @example
     * const result = await sdv.ncaa.getBoxScore(5764053);
     */
    getBoxScore: async function (game){
        const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/boxscore.json`;
        const res = await axios.get(baseUrl);
        return res.data;
    },
    /**
     * Gets the play-by-play data for a specified game if available.
     * @memberOf ncaa
     * @async
     * @function
     * @param {number} game - Game id.
     * @returns json
     * @example
     * const result = await sdv.ncaa.getPlayByPlay(5764053);
     */
    getPlayByPlay: async function (game){
        const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/pbp.json`;
        const res = await axios.get(baseUrl);
        return res.data;
    },
    /**
     * Gets the team stats data for a specified game if available.
     * @memberOf ncaa
     * @async
     * @function
     * @param {number} game - Game id.
     * @returns json
     * @example
     * const result = await sdv.ncaa.getTeamStats(5764053);
     */
    getTeamStats: async function (game){
        const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/teamStats.json`;
        const res = await axios.get(baseUrl);
        return res.data;
    },
    /**
     * Gets the scoring summary data for a specified game if available.
     * @memberOf ncaa
     * @async
     * @function
     * @param {number} game - Game id.
     * @returns json
     * @example
     * const result = await sdv.ncaa.getScoringSummary(5764053);
     */
    getScoringSummary: async function (game){
        const baseUrl = `https://data.ncaa.com/casablanca/game/${game}/scoringSummary.json`;
        const res = await axios.get(baseUrl);
        return res.data;
    },
    /**
     * Gets the scoreboard data for a specified date and team sport if available.
     * @memberOf ncaa
     * @async
     * @function
     * @param {string} sport - Sport name. Acceptable values:
     * 'football','basketball-men', 'basketball-women',
     * 'baseball', 'softball', 'soccer-men','soccer-women',
     * 'fieldhockey', 'icehockey-men','icehockey-women',
     * 'lacrosse-men','lacrosse-women',
     * 'beach-volleyball', 'volleyball-women', 'volleyball-men'
     * @param {string} division - Division of teams desired.  Acceptable values:
     * Football - ['fbs','fcs','d2','d3']
     * All others - ['d1','d2','d3']
     * @param {*} year - Year (YYYY)
     * @param {*} month - Month (MM)
     * @param {*} day - Day (DD)
     * @returns json
     * @example
     * const result = await sdv.ncaa.getScoreboard(
     * sport = 'basketball-men', division = 'd3', year = 2019, month = 02, day = 15
     * )
     */
    getScoreboard: async function (sport,division,year,month ,day){
        const baseUrl = `https://data.ncaa.com/casablanca/scoreboard/${sport}/${division}/${year}/${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}/${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}/scoreboard.json`;

        const res = await axios.get(baseUrl);
        return res.data;
    },
    extractSelectList: function ($, array, id) {
        var selector = '#' + id + ' option';
        $(selector).each(function () {
            var value = $(this).prop('value');
            var name = decode($(this).html());

            if (value) {
                array.push({
                    value: value,
                    name: name
                });
            }
        });
    },

    /**
     * Retrieves the set of sports and their abbreviations.
     * @memberOf ncaa
     * @returns json
     * @example
     * const result = sdv.ncaa.getSports();
     */
    getSports: async function (){
        const baseUrl = 'http://stats.ncaa.org/';

        const res = await axios.get(baseUrl)
        let data = {
            sports: []
        };

        let $ = cheerio.load(res.data);
        data.sports.push(extractSelectList($, data.sports, 'sport'));

        return data;
    },
    /**
     * Retrieves the seasons for the selected sport.
     * @memberOf ncaa
     * @async
     * @function
     * @param {string} sport - Sport abbreviation. Acceptable values:
     * 'MBA' = Baseball, 'MBB' = Men's basketball, 'MFB' = Men's Football,
     * 'MIH' = Men's Ice-hockey, 'MLA' = Men's Lacrosse',
     * 'MSO' = Men's Soccer, 'MTE' = Men's Tennis,
     * 'MVB' = Men's Volleyball, 'MWP' = Men's Water Polo,
     * 'WBB' = Women's Basketball, 'WBW' = Women's Bowling,
     * 'WFH' = Field Hockey, 'WIH' = Women's Ice-Hockey,
     * 'WLA' = Women's Lacrosse, 'WSB' = Women's Softball,
     * 'WSO' = Women's Soccer, 'WSV' = Women's Beach Volleyball,
     * 'WTE' = Women's Tennis, 'WVB' = Women's Volleyball,
     * 'WWP' = Women's Water Polo
     * @returns json
     * @example
     * const result = sdv.ncaa.getSeasons(sport='MBB');
     */
    getSeasons: async function (sport){
        if (!sport) {
            return;
        }
        const baseUrl = 'http://stats.ncaa.org/rankings/change_sport_year_div';

        const params = {
            "sport_code": sport,
            "academic_year": "",
            "division": "",
            "ranking_period": "",
            "team_individual": "",
            "game_high": "",
            "ranking_summary": "N",
            "org_id": "-1",
            "stat_seq": "",
            "conf_id": "-1",
            "region_id": "-1",
            "ncaa_custom_rank_summary_id": "-1",
            "user_custom_rank_summary_id": -1
        };
        const res = await axios.get(baseUrl, {
            params
        });
        let data = {
            seasons: []
        };

        let $ = cheerio.load(res.data);

        data.seasons.push(extractSelectList($, data.seasons, 'acadyr'));

        return data;
    },
    /**
     * Retrieves the Divisions for the selected sport and season.
     * @memberOf ncaa
     * @async
     * @function
     * @param {string} sport - Sport abbreviation. Acceptable values:
     * 'MBA' = Baseball, 'MBB' = Men's basketball, 'MFB' = Men's Football,
     * 'MIH' = Men's Ice-hockey, 'MLA' = Men's Lacrosse',
     * 'MSO' = Men's Soccer, 'MTE' = Men's Tennis,
     * 'MVB' = Men's Volleyball, 'MWP' = Men's Water Polo,
     * 'WBB' = Women's Basketball, 'WBW' = Women's Bowling,
     * 'WFH' = Field Hockey, 'WIH' = Women's Ice-Hockey,
     * 'WLA' = Women's Lacrosse, 'WSB' = Women's Softball,
     * 'WSO' = Women's Soccer, 'WSV' = Women's Beach Volleyball,
     * 'WTE' = Women's Tennis, 'WVB' = Women's Volleyball,
     * 'WWP' = Women's Water Polo
     * @param {string} season - Season for sport
     * @returns json
     * @example
     * const result = sdv.ncaa.getDivisions(sport='MBB', season='2017');
     */
    getDivisions: async function (sport, season){
        if (!sport || !season) {
            return;
        }

        const baseUrl = 'http://stats.ncaa.org/rankings/change_sport_year_div';
        const params = {
            "sport_code": sport,
            "academic_year": season,
            "division": "",
            "ranking_period": "",
            "team_individual": "",
            "game_high": "",
            "ranking_summary": "N",
            "org_id": "-1",
            "stat_seq": "",
            "conf_id": "-1",
            "region_id": "-1",
            "ncaa_custom_rank_summary_id": "-1",
            "user_custom_rank_summary_id": -1
        };
        const res = await axios.get(baseUrl, {
            params
        })
        let data = {
            divisions: []
        };

        let $ = cheerio.load(res.data);
        data.divisions.push(extractSelectList($, data.divisions, 'u_div'));

        return data;
    },
    /**
     * Request the data from the NCAA Stats website.
     * @memberOf ncaa
     * @async
     * @function
     * @param sport Sport abbreviation. Acceptable values:
     * 'MBA' = Baseball, 'MBB' = Men's basketball, 'MFB' = Men's Football,
     * 'MIH' = Men's Ice-hockey, 'MLA' = Men's Lacrosse',
     * 'MSO' = Men's Soccer, 'MTE' = Men's Tennis,
     * 'MVB' = Men's Volleyball, 'MWP' = Men's Water Polo,
     * 'WBB' = Women's Basketball, 'WBW' = Women's Bowling,
     * 'WFH' = Field Hockey, 'WIH' = Women's Ice-Hockey,
     * 'WLA' = Women's Lacrosse, 'WSB' = Women's Softball,
     * 'WSO' = Women's Soccer, 'WSV' = Women's Beach Volleyball,
     * 'WTE' = Women's Tennis, 'WVB' = Women's Volleyball,
     * 'WWP' = Women's Water Polo
     * @param season Season of query, value for 2016-2017 season would be 2017.
     * @param division Division, for college football: 11 for FBS, 12 for FCS,
     * otherwise 1 for Division-I, 2 for Division-II, 3 for Division-III.
     * @param rankingPeriod Integer value indicating the ranking period, options can be
     * found from using the @function ncaaSports.getSportDivisionData function.
     * @param type Individual or Team type of statistics
     * @param gameHigh logical, indicating whether the statistic desired is of the game-high variety
     * @param category Value for the stat category, can also be found using the @function ncaaSports.getSportDivisionData
     * @returns json
     * @example
     * const sportDivisionData = sdv.ncaa.getSportDivisionData(sport='MFB',season='2016',division=12,type='team',gameHigh=true);
     */
    getSportDivisionData: async function(sport, season, division, type, gameHigh){
        if (!sport || !season || !division) {
            return;
        }
        type = type || 'individual';
        gameHigh = gameHigh || false;

        const rankingType = (type == 'team') ? 'T' : 'I';
        const isGameHigh = (gameHigh == 'true') ? 'Y' : 'N';

        const baseUrl = 'http://stats.ncaa.org/rankings/change_sport_year_div';
        const params = {
            "sport_code": sport,
            "academic_year": season,
            "division": division,
            "ranking_period": "",
            "team_individual": rankingType,
            "game_high": isGameHigh,
            "ranking_summary": "N",
            "org_id": "-1",
            "stat_seq": "",
            "conf_id": "-1",
            "region_id": "-1",
            "ncaa_custom_rank_summary_id": "-1",
            "user_custom_rank_summary_id": -1
        };
        const res = await axios.get(baseUrl, {
            params
        })
        let data = {
            sport: sport,
            season: season,
            division: division,
            type: type,
            gameHigh: gameHigh,
            rankingsPeriods: [],
            categories: []
        };
        let $ = cheerio.load(res.data);
        data.rankingsPeriods.push(extractSelectList($, data.rankingsPeriods, 'rp'));
        data.categories.push(extractSelectList($, data.categories, 'Stats'));

        return data;
    },
    /**
     * Get the Player Data from the NCAA Stats website.
     * @memberOf ncaa
     * @async
     * @function
     * @param sport Sport abbreviation. Acceptable values:
     * 'MBA' = Baseball, 'MBB' = Men's basketball, 'MFB' = Men's Football,
     * 'MIH' = Men's Ice-hockey, 'MLA' = Men's Lacrosse',
     * 'MSO' = Men's Soccer, 'MTE' = Men's Tennis,
     * 'MVB' = Men's Volleyball, 'MWP' = Men's Water Polo,
     * 'WBB' = Women's Basketball, 'WBW' = Women's Bowling,
     * 'WFH' = Field Hockey, 'WIH' = Women's Ice-Hockey,
     * 'WLA' = Women's Lacrosse, 'WSB' = Women's Softball,
     * 'WSO' = Women's Soccer, 'WSV' = Women's Beach Volleyball,
     * 'WTE' = Women's Tennis, 'WVB' = Women's Volleyball,
     * 'WWP' = Women's Water Polo
     * @param season Season of query, value for 2016-2017 season would be 2017.
     * @param division Division, for college football: 11 for FBS, 12 for FCS,
     * otherwise 1 for Division-I, 2 for Division-II, 3 for Division-III.
     * @param rankingPeriod Integer value indicating the ranking period, options can be
     * found from using the @function ncaaSports.getSportDivisionData function.
     * @param {'Y'|'N'} gameHigh logical, indicating whether the statistic desired is of the game-high variety
     * @param category Value for the stat category, can also be found using the @function ncaaSports.getSportDivisionData
     * @returns json
     * @example
     * const players =  await sdv.ncaa.getPlayerData(sport = 'MFB', year = '2017', division = '11',rankingPeriod = '52', gameHigh='N', category = '20')
     */
    getPlayerData: async function (sport, season, division, rankingPeriod, gameHigh, category){
        const baseUrl = 'http://stats.ncaa.org/rankings/change_sport_year_div';
        const params = {
            "sport_code": sport,
            "academic_year": season || '',
            "division": division || '',
            "ranking_period": rankingPeriod || '',
            "team_individual": "I",
            "game_high": gameHigh || 'N',
            "ranking_summary": "N",
            "org_id": "-1",
            "stat_seq": category,
            "conf_id": "-1",
            "region_id": "-1",
            "ncaa_custom_rank_summary_id": "-1",
            "user_custom_rank_summary_id": -1
        };
        const res = await axios.get(baseUrl,{
            params
        });

        let data = tabletojson.convert(res.data)

        return data;
    },

    /**
     * Get the Team Data from the NCAA Stats website.
     * @memberOf ncaa
     * @async
     * @function
     * @param sport Sport abbreviation. Acceptable values:
     * 'MBA' = Baseball, 'MBB' = Men's basketball, 'MFB' = Men's Football,
     * 'MIH' = Men's Ice-hockey, 'MLA' = Men's Lacrosse',
     * 'MSO' = Men's Soccer, 'MTE' = Men's Tennis,
     * 'MVB' = Men's Volleyball, 'MWP' = Men's Water Polo,
     * 'WBB' = Women's Basketball, 'WBW' = Women's Bowling,
     * 'WFH' = Field Hockey, 'WIH' = Women's Ice-Hockey,
     * 'WLA' = Women's Lacrosse, 'WSB' = Women's Softball,
     * 'WSO' = Women's Soccer, 'WSV' = Women's Beach Volleyball,
     * 'WTE' = Women's Tennis, 'WVB' = Women's Volleyball,
     * 'WWP' = Women's Water Polo
     * @param season Season of query, value for 2016-2017 season would be 2017.
     * @param division Division, for college football: 11 for FBS, 12 for FCS,
     * otherwise 1 for Division-I, 2 for Division-II, 3 for Division-III.
     * @param rankingPeriod Integer value indicating the ranking period, options can be
     * found from using the @function ncaaSports.getSportDivisionData function.
     * @param {'Y'|'N'} gameHigh logical, indicating whether the statistic desired is of the game-high variety
     * @param category Value for the stat category, can also be found using the @function ncaaSports.getSportDivisionData
     * @returns json
     * @example
     * const teams =  await sdv.ncaa.getTeamData(sport = 'MFB', year = '2017', division = '11', rankingPeriod = '52', gameHigh='N', category = '20')
     */
    getTeamData: async function (sport, season, division, rankingPeriod, gameHigh, category){
        const baseUrl = 'http://stats.ncaa.org/rankings/change_sport_year_div';
        const params = {
            "sport_code": sport,
            "academic_year": season || '',
            "division": division || '',
            "ranking_period": rankingPeriod || '',
            "team_individual": 'T',
            "game_high": gameHigh,
            "ranking_summary": "N",
            "org_id": "-1",
            "stat_seq": category,
            "conf_id": "-1",
            "region_id": "-1",
            "ncaa_custom_rank_summary_id": "-1",
            "user_custom_rank_summary_id": -1
        };
        const res = await axios.get(baseUrl,{
            params
        });

        const data = tabletojson.convert(res.data)

        return data;
    }
}

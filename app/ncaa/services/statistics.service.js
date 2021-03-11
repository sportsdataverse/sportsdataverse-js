// var axios = require('axios');
// var cheerio = require('cheerio');
// var decode = require('decode-html');
// var tabletojson = require("tabletojson");


// /**
//  * Get the Player Data from the NCAA Stats website.
//  * @param sport Sport abbreviation.
//  * @param season Season of query, value for 2016-2017 season would be 2017.
//  * @param division Division, for college football: 11 for FBS, 12 for FCS,
//  * otherwise 1 for Division-I, 2 for Division-II, 3 for Division-III.
//  * @param rankingPeriod Integer value indicating the ranking period, options can be
//  * found from using the @function ncaaSports.getSportDivisionData function.
//  * @param {'I'|'T'} type Individual or Team type of statistics
//  * @param {'Y'|'N'} gameHigh logical, indicating whether the statistic desired is of the game-high variety
//  * @param category Value for the stat category, can also be found using the @function ncaaSports.getSportDivisionData
//  */
// exports.getPlayerData = async (sport, season, division, rankingPeriod, type, gameHigh, category) => {
//     const baseUrl = 'http://stats.ncaa.org/rankings/change_sport_year_div';
//     const params = {
//         "sport_code": sport,
//         "academic_year": season || '',
//         "division": division || '',
//         "ranking_period": rankingPeriod || '',
//         "team_individual": type || '',
//         "game_high": gameHigh,
//         "ranking_summary": "N",
//         "org_id": "-1",
//         "stat_seq": category,
//         "conf_id": "-1",
//         "region_id": "-1",
//         "ncaa_custom_rank_summary_id": "-1",
//         "user_custom_rank_summary_id": -1
//     };
//     const res = await axios.get(baseUrl,{
//         params
//     });

//     let data = {
//         players: []
//     };

//     var playerRegExp = /^(.+), (.+) \((.+)\)$/;
//     var $ = cheerio.load(res.data);

//     tabletojson.convert($)[1].forEach(function (item) {
//         var match = playerRegExp.exec(item.Player);

//         if (match && item.Ranking != '-') {
//             item.Player = match[1];
//             item.School = match[2];
//             item.Conference = match[3];

//             data.players.push(item);
//         }
//     });

//     return data;
// };
// /**
//  * Get the Team Data from the NCAA Stats website.
//  * @param sport Sport abbreviation.
//  * @param season Season of query, value for 2016-2017 season would be 2017.
//  * @param division Division, for college football: 11 for FBS, 12 for FCS,
//  * otherwise 1 for Division-I, 2 for Division-II, 3 for Division-III.
//  * @param rankingPeriod Integer value indicating the ranking period, options can be
//  * found from using the @function ncaaSports.getSportDivisionData function.
//  * @param {'I'|'T'} type Individual or Team type of statistics
//  * @param {'Y'|'N'} gameHigh logical, indicating whether the statistic desired is of the game-high variety
//  * @param category Value for the stat category, can also be found using the @function ncaaSports.getSportDivisionData
//  */
// exports.getTeamData = async (sport, season, division, rankingPeriod, type, gameHigh, category) => {
//     const baseUrl = 'http://stats.ncaa.org/rankings/change_sport_year_div';
//     const params = {
//         "sport_code": sport,
//         "academic_year": season || '',
//         "division": division || '',
//         "ranking_period": rankingPeriod || '',
//         "team_individual": type || '',
//         "game_high": gameHigh,
//         "ranking_summary": "N",
//         "org_id": "-1",
//         "stat_seq": category,
//         "conf_id": "-1",
//         "region_id": "-1",
//         "ncaa_custom_rank_summary_id": "-1",
//         "user_custom_rank_summary_id": -1
//     };
//     const res = await axios.get(baseUrl,{
//         params
//     });
//     let data = {
//         teams: []
//     };

//     var teamRegExp = /^(.+) \((.+)\)$/;
//     var $ = cheerio.load(res.data);

//     tabletojson.convert($)[1].forEach(function (item) {
//         var match = teamRegExp.exec(item.Team);

//         if (match) {
//             item.Team = match[1];
//             item.Conference = match[2];

//             data.teams.push(item);
//         }
//     });

//     return data;
// };

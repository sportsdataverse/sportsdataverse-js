const axios = require('axios');
const tabletojson = require("tabletojson").Tabletojson;


/**
 * Get the Player Data from the NCAA Stats website.
 * @param sport Sport abbreviation.
 * @param season Season of query, value for 2016-2017 season would be 2017.
 * @param division Division, for college football: 11 for FBS, 12 for FCS,
 * otherwise 1 for Division-I, 2 for Division-II, 3 for Division-III.
 * @param rankingPeriod Integer value indicating the ranking period, options can be
 * found from using the @function ncaaSports.getSportDivisionData function.
 * @param {'Y'|'N'} gameHigh logical, indicating whether the statistic desired is of the game-high variety
 * @param category Value for the stat category, can also be found using the @function ncaaSports.getSportDivisionData
 * @returns json
 * @example
 * const players =  await sdv.ncaaStatistics.getPlayerData(sport = 'MFB', year = '2017', division = '11',rankingPeriod = '52', gameHigh='N', category = '20')
 */
exports.getPlayerData = async (sport, season, division, rankingPeriod, gameHigh, category) => {
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
};

/**
 * Get the Team Data from the NCAA Stats website.
 * @param sport Sport abbreviation.
 * @param season Season of query, value for 2016-2017 season would be 2017.
 * @param division Division, for college football: 11 for FBS, 12 for FCS,
 * otherwise 1 for Division-I, 2 for Division-II, 3 for Division-III.
 * @param rankingPeriod Integer value indicating the ranking period, options can be
 * found from using the @function ncaaSports.getSportDivisionData function.
 * @param {'Y'|'N'} gameHigh logical, indicating whether the statistic desired is of the game-high variety
 * @param category Value for the stat category, can also be found using the @function ncaaSports.getSportDivisionData
 * @returns json
 * @example
 * const teams =  await sdv.ncaaStatistics.getTeamData(sport = 'MFB', year = '2017', division = '11', rankingPeriod = '52', gameHigh='N', category = '20')
 */
exports.getTeamData = async (sport, season, division, rankingPeriod, gameHigh, category) => {
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
};

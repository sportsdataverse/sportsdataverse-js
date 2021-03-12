const axios = require('axios');
const cheerio = require('cheerio');
const decode = require('decode-html');



const extractSelectList = function ($, array, id) {
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
};

/**
 * Retrieves the set of sports and their abbreviations.
 * @returns json
 * @example
 * const result = sdv.ncaaSports.getSports();
 */
exports.getSports = async () => {
    const baseUrl = 'http://stats.ncaa.org/';

    const res = await axios.get(baseUrl)
    let data = {
        sports: []
    };

    let $ = cheerio.load(res.data);
    data.sports.push(extractSelectList($, data.sports, 'sport'));

    return data;
};
/**
 * Retrieves the seasons for the selected sport.
 * @param {string} sport - Sport abbreviation.
 * @returns json
 * @example
 * const result = sdv.ncaaSports.getSeasons(sport='MBB');
 */
exports.getSeasons = async (sport) => {
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
};
/**
 * Retrieves the Divisions for the selected sport and season.
 * @param {string} sport - Sport abbreviation.
 * @param {string} season - Season for sport
 * @returns json
 * @example
 * const result = sdv.ncaaSports.getDivisions(sport='MBB', season='2017');
 */
exports.getDivisions = async (sport, season) => {
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
};
/**
 * Request the data from the NCAA Stats website.
 * @param sport Sport abbreviation.
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
 * const sportDivisionData = sdv.ncaaSports.getSportDivisionData(sport='MFB',season='2016',division=12,type='team',gameHigh=true);
 */
exports.getSportDivisionData = async(sport, season, division, type, gameHigh) => {
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
};
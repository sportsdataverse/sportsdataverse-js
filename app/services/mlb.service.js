const axios = require("axios");
/**
 * Operations for MLB.
 *
 * @namespace mlb
 */
module.exports = {
  /**
   * Gets the MLB game play-by-play data for a specified game.
   * @memberOf mlb
   * @async
   * @function
   * @param {number} id - Game id.
   * @returns json
   * @example
   * const result = await sdv.mlb.getPlayByPlay(401472105);
   */
  getPlayByPlay: async function (id) {
    const baseUrl = "http://cdn.espn.com/core/mlb/playbyplay";
    const params = {
      gameId: id,
      xhr: 1,
      render: "false",
      userab: 18,
    };
    const res = await axios.get(baseUrl, {
      params,
    });
    return {
      teams: res.data.gamepackageJSON.header.competitions[0].competitors,
      id: res.data.gamepackageJSON.header.id,
      plays: res.data.gamepackageJSON.plays,
      competitions: res.data.gamepackageJSON.header.competitions,
      season: res.data.gamepackageJSON.header.season,
      boxScore: res.data.gamepackageJSON.boxscore,
      seasonSeries: res.data.gamepackageJSON.seasonseries,
      standings: res.data.gamepackageJSON.standings,
    };
  },
  /**
   * Gets the MLB game box score data for a specified game.
   * @memberOf mlb
   * @async
   * @function
   * @param {number} id - Game id.
   * @returns json
   * @example
   * const result = await sdv.mlb.getBoxScore(401472105);
   */
  getBoxScore: async function (id) {
    const baseUrl = "http://cdn.espn.com/core/mlb/boxscore";
    const params = {
      gameId: id,
      xhr: 1,
      render: false,
      device: "desktop",
      userab: 18,
    };
    const res = await axios.get(baseUrl, {
      params,
    });
    const game = res.data.gamepackageJSON.boxscore;
    game.id = res.data.gameId;
    return game;
  },
  /**
   * Gets the MLB game summary data for a specified game.
   * @memberOf mlb
   * @async
   * @function
   * @param {number} id - Game id.
   * @returns json
   * @example
   * const result = await sdv.mlb.getSummary(401472105);
   */
  getSummary: async function (id) {
    const baseUrl =
      "http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary";
    const params = {
      event: id,
    };
    const res = await axios.get(baseUrl, {
      params,
    });
    return {
      boxScore: res.data.boxscore,
      gameInfo: res.data.gameInfo,
      header: res.data.header,
      teams: res.data.gamepackageJSON?.header.competitions[0].competitors,
      id: res.data.gamepackageJSON?.header.id,
      plays: res.data.gamepackageJSON?.plays,
      winProbability: res.data.winprobability,
      leaders: res.data.leaders,
      competitions: res.data.gamepackageJSON?.header.competitions,
      season: res.data.gamepackageJSON?.header.season,
      seasonSeries: res.data.gamepackageJSON?.seasonseries,
      standings: res.data.gamepackageJSON?.standings,
    };
  },
  /**
   * Gets the MLB game PickCenter data for a specified game.
   * @memberOf mlb
   * @async
   * @function
   * @param {number} id - Game id.
   * @returns json
   * @example
   * const result = await sdv.mlb.getPicks(401472105);
   */
  getPicks: async function (id) {
    const baseUrl =
      "http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary";
    const params = {
      event: id,
    };
    const res = await axios.get(baseUrl, {
      params,
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
      standings: res.data.standings,
    };
  },
  /**
   * Gets the MLB schedule data for a specified date if available.
   * @memberOf mlb
   * @async
   * @function
   * @param {*} year - Year (YYYY)
   * @param {*} month - Month (MM)
   * @param {*} day - Day (DD)
   * @returns json
   * @example
   * const result = await sdv.mlb.getSchedule(
   * year = 2016, month = 04, day = 15
   * )
   */
  getSchedule: async function ({ year, month, day }) {
    const baseUrl = `http://cdn.espn.com/core/mlb/schedule`;

    const params = {
      xhr: 1,
      render: false,
      device: "desktop",
      userab: 18,
    };
    if (year && month && day) {
      params.dates = `${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
    }
    const res = await axios.get(baseUrl, {
      params,
    });
    return res.data.content.schedule;
  },
  /**
   * Gets the MLB scoreboard data for a specified date if available.
   * @memberOf mlb
   * @async
   * @function
   * @param {*} year - Year (YYYY)
   * @param {*} month - Month (MM)
   * @param {*} day - Day (DD)
   * @param {number} limit - Limit on the number of results @default 300
   * @returns json
   * @example
   * const result = await sdv.mlb.getScoreboard(
   * year = 2019, month = 11, day = 16
   * )
   */
  getScoreboard: async function ({
    year,
    month,
    day,
    limit = 300,
  }) {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard`;
    const params = {
      limit,
    };
    if (year && month && day) {
      params.dates = `${year}${parseInt(month) <= 9 ? "0" + parseInt(month) : parseInt(month)}${parseInt(day) <= 9 ? "0" + parseInt(day) : parseInt(day)}`;
    }
    const res = await axios.get(baseUrl, {
      params,
    });
    return res.data;
  },
  /**
   * Gets the team standings for the MLB.
   * @memberOf mlb
   * @async
   * @function
   * @param {number} year - Season
   * @param {string} group - acceptable group names: 'league','conference','division'
   * @returns json
   * @example
   * const yr = 2016;
   * const result = await sdv.mlb.getStandings(year = yr);
   */
  getStandings: async function ({
    year = new Date().getFullYear(),
    group = "league",
  }) {
    const groupId = group === "league" ? 1 : group === "conference" ? 2 : 3;
    const baseUrl = `https://site.web.api.espn.com/apis/v2/sports/baseball/mlb/standings`;
    const params = {
      region: "us",
      lang: "en",
      contentorigin: "espn",
      season: year,
      type: 1,
      level: groupId,
    };
    const res = await axios.get(baseUrl, {
      params,
    });
    return res.data;
  },
  /**
   * Gets the list of all MLB teams their identification info for ESPN.
   * @memberOf mlb
   * @async
   * @function
   * @returns json
   * @example
   * const result = await sdv.mlb.getTeamList();
   */
  getTeamList: async function () {
    const baseUrl =
      "http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams";
    const params = {
      limit: 1000,
    };

    const res = await axios.get(baseUrl, {
      params,
    });

    return res.data;
  },
  /**
   * Gets the team info for a specific MLB team.
   * @memberOf mlb
   * @async
   * @function
   * @param {number} id - Team Id
   * @returns json
   * @example
   * const teamId = 16;
   * const result = await sdv.mlb.getTeamInfo(teamId);
   */
  getTeamInfo: async function (id) {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${id}`;

    const res = await axios.get(baseUrl);
    return res.data;
  },
  /**
   * Gets the team roster information for a specific MLB team.
   * @memberOf mlb
   * @async
   * @function
   * @param {number} id - Team Id
   * @returns json
   * @example
   * const teamId = 16;
   * const result = await sdv.mlb.getTeamPlayers(teamId);
   */
  getTeamPlayers: async function (id) {
    const baseUrl = `http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${id}`;
    const params = {
      enable: "roster",
    };
    const res = await axios.get(baseUrl, {
      params,
    });
    return res.data;
  },
};

const axios = require('axios');
const cheerio = require('cheerio');

exports.getPlayerRankings = async ({
  year,
  page = 1,
  group = "HighSchool",
  position = null,
  state = null
}) => {
  const baseUrl = `http://247sports.com/Season/${year}-Football/CompositeRecruitRankings`;
  const params = {
    InstitutionGroup: group,
    Page: page,
    Position: position,
    State: state
  };

  const res = await axios.get(baseUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
    },
    params
  });

  let $ = cheerio.load(res.data);

  let players = [];

  // Couldn't grab the rank correctly with JQuery so it's manually calculated
  let rank = 1 + 50 * (page - 1);

  $('ul.rankings-page__list > li.rankings-page__list-item:not(.rankings-page__list-item--header)').each(function (index) {
    let html = $(this);

    let metrics = html.find('.metrics').text().split('/');

    let player = {
      ranking: rank,
      name: html.find('.rankings-page__name-link').text().trim(),
      highSchool: html.find('span.meta').text().trim(),
      position: html.find('.position').text().trim(),
      height: metrics[0],
      weight: metrics[1],
      stars: html.find('.rankings-page__star-and-score > .yellow').length,
      rating: html.find('.score').text().trim().trim(),
      college: html.find('.img-link > img').attr('title') || 'uncommitted'
    };

    players.push(player);
    rank++;
  });

  return players;
};

exports.getSchoolRankings = async (year, page = 1) => {
  const baseUrl = `http://247sports.com/Season/${year}-Football/CompositeTeamRankings`;

  const res = await axios.get(baseUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
    },
    params: {
      Page: page
    }
  });

  let $ = cheerio.load(res.data);
  let schools = [];

  $('.rankings-page__list-item').each(function (index) {
    let html = $(this);

    let school = {
      rank: html.find('.rank-column .primary').text().trim(),
      school: html.find('.rankings-page__name-link').text().trim(),
      totalCommits: html.find('.total a').text().trim(),
      fiveStars: $(html.find('ul.star-commits-list > li > div')[0]).text().replace('5: ', '').trim(),
      fourStars: $(html.find('ul.star-commits-list > li > div')[1]).text().replace('4: ', '').trim(),
      threeStars: $(html.find('ul.star-commits-list > li > div')[2]).text().replace('3: ', '').trim(),
      averageRating: html.find('.avg').text().trim(),
      points: html.find('.number').text().trim()
    };

    schools.push(school);
  });

  return schools;
};

exports.getSchoolCommits = async (school, year) => {
  const baseUrl = `http://${school}.247sports.com/Season/${year}-Football/Commits`;

  const res = await axios.get(baseUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
    }
  });

  let $ = cheerio.load(res.data);

  let players = [];

  $('.ri-page__list-item').each(function (index) {
    let html = $(this);

    let metrics = html.find('.metrics').text().split('/');

    let player = {
      name: html.find('.ri-page__name-link').text().trim(),
      highSchool: html.find('span.meta').text().trim(),
      position: $(html.find('.position')).text().trim(),
      height: metrics[0],
      weight: metrics[1],
      stars: html.find('.ri-page__star-and-score .yellow').length,
      rating: html.find('span.score').clone().children().remove().end().text().trim(),
      nationalRank: html.find('.natrank').first().text().trim(),
      stateRank: html.find('.sttrank').first().text().trim(),
      positionRank: html.find('.posrank').first().text().trim()
    };

    players.push(player);
  });

  // Some empty player objects were being created.  This removes them
  const result = players.filter(
    player => player.name !== '' && player.rating !== ''
  );

  return result;
};
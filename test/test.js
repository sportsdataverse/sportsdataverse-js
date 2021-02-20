var chai = require('chai');
var app = require('../app/app');
var should = chai.should();

describe('CBB Games', function() {
    var gameId = 401260281;

    it('should populate play by play data for the given game id', function()  {
        app.cbbGames.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    })

    it('should return a promise for play by play data for the given game id', function() {
        app.cbbGames.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate box score data for the given game id', function() {
        app.cbbGames.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.cbbGames.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.cbbGames.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('CBB Rankings', () => {
    it('should populate rankings for the current week and year', function() {
        app.cbbRankings.getRankings({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate rankings for the given week and year', function() {
        app.cbbRankings.getRankings({
            year: 2020,
            week: 9
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for rankings for the current week and year', function() {
        app.cbbRankings.getRankings({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for rankings for the given week and year', function() {
        app.cbbRankings.getRankings({
                year: 2020,
                week: 9
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('CBB Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', function() {
        app.cbbScoreboard.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.cbbScoreboard.getScoreboard({
            year: 2021,
            month: 02,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.cbbScoreboard.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.cbbScoreboard.getScoreboard({
                year: 2021,
                month: 02,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('CBB Standings', () => {

    it('should populate standings for the given year', function() {
        app.cbbStandings.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.cbbStandings.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});
describe('CBB Recruiting', () => {

    it('should return a promise for a list of individual rankings for the given year', function() {
        app.cbbRecruiting.getPlayerRankings({
                year: 2021
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });

    it('should return a promise for a list of individual rankings for the given year and position', function() {
        app.cbbRecruiting.getPlayerRankings({
                year: 2021,
                position: "C"
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });

    it('should return a promise for a list of individual rankings for the given year and group', function() {
        app.cbbRecruiting.getPlayerRankings({
                year: 2021,
                group: "JuniorCollege"
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });

    it('should return a promise for a list of school rankings for the given year', function() {
        app.cbbRecruiting.getSchoolRankings(2021)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });

    it('should return a promise for a school\'s commit list for a given year', function() {
        app.cbbRecruiting.getSchoolCommits('floridastate', 2021)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });
});
describe('WBB Games', () => {
    var gameId = 401264909;

    it('should populate play by play data for the given game id', function() {
        app.wbbGames.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for play by play data for the given game id', function() {
        app.wbbGames.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate box score data for the given game id', function() {
        app.wbbGames.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.wbbGames.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.wbbGames.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('WBB Rankings', () => {

    it('should populate rankings for the current week and year', function() {
        app.wbbRankings.getRankings({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate rankings for the given week and year', function() {
        app.wbbRankings.getRankings({
            year: 2020,
            week: 9
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for rankings for the current week and year', function() {
        app.wbbRankings.getRankings({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });

    it('should return a promise for rankings for the given week and year', function() {
        app.wbbRankings.getRankings({
                year: 2020,
                week: 9
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });
});

describe('WBB Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', function() {
        app.wbbScoreboard.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.wbbScoreboard.getScoreboard({
            year: 2021,
            month: 02,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.wbbScoreboard.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.wbbScoreboard.getScoreboard({
                year: 2021,
                month: 02,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });
});

describe('WBB Standings', () => {

    it('should populate standings for the given year', function() {
        app.wbbStandings.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.wbbStandings.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });
});
describe('NCAA Games', () => {

    var game = 5764053;
    it('should return a promise for ncaa game information for a given game', function() {
            app.ncaaGames.getNcaaInfo(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;    })
        });
    it('should return a promise for ncaa game box score for a given game', function() {
            app.ncaaGames.getNcaaBoxScore(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;    })
        });
    it('should return a promise for ncaa game play-by-play for a given game', function() {
            app.ncaaGames.getNcaaPlayByPlay(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;    })
        });
    it('should return a promise for ncaa game team stats for a given game', function() {
            app.ncaaGames.getNcaaTeamStats(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;    })
        });
    it('should return a promise for ncaa game scoring summary for a given game', function() {
            app.ncaaGames.getNcaaScoringSummary(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;    })
        });
});

describe('NCAA Scoreboard', () => {

    it('should return a promise for ncaa scoreboard data for a given date', function() {
        app.ncaaScoreboard.getNcaaScoreboard({
            sport: 'basketball-men',
            division: 'd1',
            year: 2021,
            month: 02,
            day: 15
        })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });
});
describe('NBA Games', () => {

    var gameId = 401283399;

    it('should populate play by play data for the given game id', function() {
        app.nbaGames.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for play by play data for the given game id', function() {
        app.nbaGames.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });

    it('should populate box score data for the given game id', function() {
        app.nbaGames.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.nbaGames.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;    data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.nbaGames.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });
});

describe('NBA Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', function() {
        app.nbaScoreboard.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.nbaScoreboard.getScoreboard({
            year: 2021,
            month: 02,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.nbaScoreboard.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.nbaScoreboard.getScoreboard({
                year: 2021,
                month: 02,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });
});

describe('NBA Standings', () => {

    it('should populate standings for the given year', function() {
        app.nbaStandings.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.nbaStandings.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('WNBA Games', () => {

    var gameId = 401244185;

    it('should populate play by play data for the given game id', function() {
        app.wnbaGames.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for play by play data for the given game id', function() {
        app.wnbaGames.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate box score data for the given game id', function() {
        app.wnbaGames.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.wnbaGames.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.wnbaGames.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});


describe('WNBA Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', function() {
        app.wnbaScoreboard.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.wnbaScoreboard.getScoreboard({
            year: 2021,
            month: 02,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.wnbaScoreboard.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.wnbaScoreboard.getScoreboard({
                year: 2021,
                month: 02,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('WNBA Standings', () => {

    it('should populate standings for the given year', function() {
        app.wnbaStandings.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.wnbaStandings.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

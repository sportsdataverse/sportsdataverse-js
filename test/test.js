var chai = require('chai');
var app = require('../app/app');
var should = chai.should();

describe('CBB Games', function() {
    var gameId = 401260281;

    it('should populate play by play data for the given game id', function()  {
        app.cbb.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    })

    it('should return a promise for play by play data for the given game id', function() {
        app.cbb.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate box score data for the given game id', function() {
        app.cbb.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.cbb.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.cbb.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('CBB Rankings', () => {
    it('should populate rankings for the current week and year', function() {
        app.cbb.getRankings({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate rankings for the given week and year', function() {
        app.cbb.getRankings({
            year: 2020,
            week: 9
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for rankings for the current week and year', function() {
        app.cbb.getRankings({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for rankings for the given week and year', function() {
        app.cbb.getRankings({
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
        app.cbb.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.cbb.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.cbb.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.cbb.getScoreboard({
                year: 2021,
                month: 2,
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
        app.cbb.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.cbb.getStandings({
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
        app.cbb.getPlayerRankings({
                year: 2021
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });

    it('should return a promise for a list of individual rankings for the given year and position', function() {
        app.cbb.getPlayerRankings({
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
        app.cbb.getPlayerRankings({
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
        app.cbb.getSchoolRankings(2021)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });

    it('should return a promise for a school\'s commit list for a given year', function() {
        app.cbb.getSchoolCommits('floridastate', 2021)
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
        app.wbb.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for play by play data for the given game id', function() {
        app.wbb.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate box score data for the given game id', function() {
        app.wbb.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.wbb.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.wbb.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('WBB Rankings', () => {

    it('should populate rankings for the current week and year', function() {
        app.wbb.getRankings({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate rankings for the given week and year', function() {
        app.wbb.getRankings({
            year: 2020,
            week: 9
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for rankings for the current week and year', function() {
        app.wbb.getRankings({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });

    it('should return a promise for rankings for the given week and year', function() {
        app.wbb.getRankings({
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
        app.wbb.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.wbb.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.wbb.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.wbb.getScoreboard({
                year: 2021,
                month: 2,
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
        app.wbb.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.wbb.getStandings({
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
            app.ncaa.getInfo(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;    })
        });
    it('should return a promise for ncaa game box score for a given game', function() {
            app.ncaa.getBoxScore(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;    })
        });
    it('should return a promise for ncaa game play-by-play for a given game', function() {
            app.ncaa.getPlayByPlay(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;    })
        });
    it('should return a promise for ncaa game team stats for a given game', function() {
            app.ncaa.getTeamStats(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;    })
        });
    it('should return a promise for ncaa game scoring summary for a given game', function() {
            app.ncaa.getScoringSummary(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;    })
        });
});

describe('NCAA Scoreboard', () => {

    it('should return a promise for ncaa scoreboard data for a given date', function() {
        app.ncaa.getScoreboard({
            sport: 'basketball-men',
            division: 'd1',
            year: 2021,
            month: 2,
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
        app.nba.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for play by play data for the given game id', function() {
        app.nba.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });

    it('should populate box score data for the given game id', function() {
        app.nba.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.nba.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;    data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.nba.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });
});

describe('NBA Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', function() {
        app.nba.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.nba.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.nba.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;});
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.nba.getScoreboard({
                year: 2021,
                month: 2,
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
        app.nba.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.nba.getStandings({
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
        app.wnba.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for play by play data for the given game id', function() {
        app.wnba.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate box score data for the given game id', function() {
        app.wnba.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.wnba.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.wnba.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});


describe('WNBA Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', function() {
        app.wnba.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.wnba.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.wnba.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.wnba.getScoreboard({
                year: 2021,
                month: 2,
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
        app.wnba.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.wnba.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});


describe('NHL Games', () => {

    var gameId = 401272446;

    it('should populate play by play data for the given game id', function() {
        app.nhl.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for play by play data for the given game id', function() {
        app.nhl.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate box score data for the given game id', function() {
        app.nhl.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.nhl.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.nhl.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});


describe('NHL Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', function() {
        app.nhl.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.nhl.getScoreboard({
            year: 2021,
            month: 2,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.nhl.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.nhl.getScoreboard({
                year: 2021,
                month: 2,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('NHL Standings', () => {

    it('should populate standings for the given year', function() {
        app.nhl.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.nhl.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

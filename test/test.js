var chai = require('chai');
var app = require('../app/app');
var should = chai.should();

describe('MBB Games', function() {
    var gameId = 401260281;

    it('should populate play by play data for the given game id', function()  {
        app.mbb.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    })

    it('should return a promise for play by play data for the given game id', function() {
        app.mbb.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate box score data for the given game id', function() {
        app.mbb.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.mbb.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.mbb.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for game picks data for the given game id', function() {
        app.mbb.getPicks(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('MBB Rankings', () => {
    it('should populate rankings for the current week and year', function() {
        app.mbb.getRankings({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate rankings for the given week and year', function() {
        app.mbb.getRankings({
            year: 2020,
            week: 9
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for rankings for the current week and year', function() {
        app.mbb.getRankings({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for rankings for the given week and year', function() {
        app.mbb.getRankings({
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

describe('MBB Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', function() {
        app.mbb.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.mbb.getScoreboard({
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
        app.mbb.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.mbb.getScoreboard({
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

describe('MBB Standings', () => {

    it('should populate standings for the given year', function() {
        app.mbb.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.mbb.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});
describe('MBB Teams', () => {

    it('should populate a teams list', function() {
        app.mbb.getTeamList({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for teams for the given team id', function() {
        app.mbb.getTeamInfo({
                id: 52
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for team players for the given team id', function() {
        app.mbb.getTeamPlayers({
                id: 52
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});
describe('MBB Recruiting', () => {

    it('should return a promise for a list of individual rankings for the given year', function() {
        app.mbb.getPlayerRankings({
                year: 2021
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });

    it('should return a promise for a list of individual rankings for the given year and position', function() {
        app.mbb.getPlayerRankings({
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
        app.mbb.getPlayerRankings({
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
        app.mbb.getSchoolRankings(2021)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });

    it('should return a promise for a school\'s commit list for a given year', function() {
        app.mbb.getSchoolCommits('floridastate', 2021)
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
        app.wbb.getPlayByPlay(gameId)
            .then((data) => {
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
        app.wbb.getBoxScore(gameId)
            .then((data) => {
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
        app.wbb.getRankings({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate rankings for the given week and year', function() {
        app.wbb.getRankings({
                year: 2020,
                week: 9
            })
            .then((data) => {
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
describe('WBB Teams', () => {

    it('should populate a teams list', function() {
        app.wbb.getTeamList({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for teams for the given team id', function() {
        app.wbb.getTeamInfo({
                id: 52
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for team players for the given team id', function() {
        app.wbb.getTeamPlayers({
                id: 52
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
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

    it('should return a promise for game picks data for the given game id', function() {
        app.nba.getPicks(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
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

describe('NBA Teams', () => {

    it('should populate a teams list', function() {
        app.nba.getTeamList({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for teams for the given team id', function() {
        app.nba.getTeamInfo({
                id: 16
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for team players for the given team id', function() {
        app.nba.getTeamPlayers({
                id: 16
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

describe('WNBA Teams', () => {

    it('should populate a teams list', function() {
        app.wnba.getTeamList({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for teams for the given team id', function() {
        app.wnba.getTeamInfo({
                id: 16
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for team players for the given team id', function() {
        app.wnba.getTeamPlayers({
                id: 16
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

    it('should return a promise for game picks data for the given game id', function() {
        app.nhl.getPicks(gameId)
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

describe('NHL Teams', () => {

    it('should populate a teams list', function() {
        app.nhl.getTeamList({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for teams for the given team id', function() {
        app.nhl.getTeamInfo({
                id: 16
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for team players for the given team id', function() {
        app.nhl.getTeamPlayers({
                id: 16
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});


describe('NFL Games', () => {

    var gameId = 401220403;

    it('should populate play by play data for the given game id', function() {
        app.nfl.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for play by play data for the given game id', function() {
        app.nfl.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate box score data for the given game id', function() {
        app.nfl.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.nfl.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.nfl.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for game picks data for the given game id', function() {
        app.nfl.getPicks(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});


describe('NFL Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', function() {
        app.nfl.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.nfl.getScoreboard({
            year: 2021,
            month: 12,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.nfl.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.nfl.getScoreboard({
                year: 2021,
                month: 12,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('NFL Standings', () => {

    it('should populate standings for the given year', function() {
        app.nfl.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.nfl.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('NFL Teams', () => {

    it('should populate a teams list', function() {
        app.nfl.getTeamList({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for teams for the given team id', function() {
        app.nfl.getTeamInfo({
                id: 16
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for team players for the given team id', function() {
        app.nfl.getTeamPlayers({
                id: 16
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});


describe('MLB Games', () => {

    var gameId = 401472105;

    it('should populate play by play data for the given game id', function() {
        app.mlb.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for play by play data for the given game id', function() {
        app.mlb.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate box score data for the given game id', function() {
        app.mlb.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.mlb.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.mlb.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for game picks data for the given game id', function() {
        app.mlb.getPicks(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});


describe('MLB Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', function() {
        app.mlb.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.mlb.getScoreboard({
            year: 2021,
            month: 12,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.mlb.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.mlb.getScoreboard({
                year: 2021,
                month: 12,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('MLB Standings', () => {

    it('should populate standings for the given year', function() {
        app.mlb.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.mlb.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('MLB Teams', () => {

    it('should populate a teams list', function() {
        app.mlb.getTeamList({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for teams for the given team id', function() {
        app.mlb.getTeamInfo({
                id: 16
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for team players for the given team id', function() {
        app.mlb.getTeamPlayers({
                id: 16
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('CFB Games', function() {
    var gameId = 401256194;

    it('should populate play by play data for the given game id', function()  {
        app.cfb.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    })

    it('should return a promise for play by play data for the given game id', function() {
        app.cfb.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should populate box score data for the given game id', function() {
        app.cfb.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for box score data for the given game id', function() {
        app.cfb.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
            });
    });

    it('should return a promise for game summary data for the given game id', function() {
        app.cfb.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for game picks data for the given game id', function() {
        app.cfb.getPicks(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('CFB Rankings', () => {
    it('should populate rankings for the current week and year', function() {
        app.cfb.getRankings({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate rankings for the given week and year', function() {
        app.cfb.getRankings({
            year: 2020,
            week: 9
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for rankings for the current week and year', function() {
        app.cfb.getRankings({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for rankings for the given week and year', function() {
        app.cfb.getRankings({
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

describe('CFB Scoreboard', () => {

    it('should populate scoreboard data for the current week and year', function() {
        app.cfb.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should populate scoreboard data for the given week and year', function() {
        app.cfb.getScoreboard({
            year: 2021,
            month: 10,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for scoreboard data for the current week and year', function() {
        app.cfb.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for scoreboard data for the given week and year', function() {
        app.cfb.getScoreboard({
                year: 2021,
                month: 10,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});

describe('CFB Standings', () => {

    it('should populate standings for the given year', function() {
        app.cfb.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
        });
    });

    it('should return a promise for standings for the given year', function() {
        app.cfb.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});
describe('CFB Teams', () => {

    it('should populate a teams list', function() {
        app.cfb.getTeamList({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for teams for the given team id', function() {
        app.cfb.getTeamInfo({
                id: 52
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });

    it('should return a promise for team players for the given team id', function() {
        app.cfb.getTeamPlayers({
                id: 52
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            });
    });
});
describe('CFB Recruiting', () => {

    it('should return a promise for a list of individual rankings for the given year', function() {
        app.cfb.getPlayerRankings({
                year: 2021
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });

    it('should return a promise for a list of individual rankings for the given year and position', function() {
        app.cfb.getPlayerRankings({
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
        app.cfb.getPlayerRankings({
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
        app.cfb.getSchoolRankings(2021)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });

    it('should return a promise for a school\'s commit list for a given year', function() {
        app.cfb.getSchoolCommits('floridastate', 2021)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
            })
    });
});
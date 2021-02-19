var chai = require('chai');
var app = require('../app/app');
var should = chai.should();

describe('CBB Games', () => {
    var gameId = 401260281;

    it('should populate play by play data for the given game id', (done) => {
        app.cbbGames.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for play by play data for the given game id', (done) => {
        app.cbbGames.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should populate box score data for the given game id', (done) => {
        app.cbbGames.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for box score data for the given game id', (done) => {
        app.cbbGames.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
                done();
            });
    });

    it('should return a promise for game summary data for the given game id', (done) => {
        app.cbbGames.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('CBB Rankings', () => {
    it('should populate rankings for the current week and year', (done) => {
        app.cbbRankings.getRankings({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should populate rankings for the given week and year', (done) => {
        app.cbbRankings.getRankings({
            year: 2020,
            week: 9
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for rankings for the current week and year', (done) => {
        app.cbbRankings.getRankings({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should return a promise for rankings for the given week and year', (done) => {
        app.cbbRankings.getRankings({
                year: 2020,
                week: 9
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('CBB Scoreboard', () => {
    it('should populate scoreboard data for the current week and year', (done) => {
        app.cbbScoreboard.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should populate scoreboard data for the given week and year', (done) => {
        app.cbbScoreboard.getScoreboard({
            year: 2021,
            month: 02,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for scoreboard data for the current week and year', (done) => {
        app.cbbScoreboard.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should return a promise for scoreboard data for the given week and year', (done) => {
        app.cbbScoreboard.getScoreboard({
                year: 2021,
                month: 02,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('CBB Standings', () => {
    it('should populate standings for the given year', (done) => {
        app.cbbStandings.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for standings for the given year', (done) => {
        app.cbbStandings.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});
describe('CBB Recruiting', () => {
    it('should return a promise for a list of individual rankings for the given year', (done) => {
        app.cbbRecruiting.getPlayerRankings({
                year: 2021
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            })
    });

    it('should return a promise for a list of individual rankings for the given year and position', (done) => {
        app.cbbRecruiting.getPlayerRankings({
                year: 2021,
                position: "C"
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            })
    });

    it('should return a promise for a list of individual rankings for the given year and group', (done) => {
        app.cbbRecruiting.getPlayerRankings({
                year: 2021,
                group: "JuniorCollege"
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            })
    });

    it('should return a promise for a list of school rankings for the given year', (done) => {
        app.cbbRecruiting.getSchoolRankings(2021)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            })
    });

    it('should return a promise for a school\'s commit list for a given year', (done) => {
        app.cbbRecruiting.getSchoolCommits('floridastate', 2021)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            })
    });
});
describe('WBB Games', () => {
    var gameId = 401264909;

    it('should populate play by play data for the given game id', (done) => {
        app.wbbGames.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for play by play data for the given game id', (done) => {
        app.wbbGames.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should populate box score data for the given game id', (done) => {
        app.wbbGames.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for box score data for the given game id', (done) => {
        app.wbbGames.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
                done();
            });
    });

    it('should return a promise for game summary data for the given game id', (done) => {
        app.wbbGames.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('WBB Rankings', () => {
    it('should populate rankings for the current week and year', (done) => {
        app.wbbRankings.getRankings({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should populate rankings for the given week and year', (done) => {
        app.wbbRankings.getRankings({
            year: 2020,
            week: 9
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for rankings for the current week and year', (done) => {
        app.wbbRankings.getRankings({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should return a promise for rankings for the given week and year', (done) => {
        app.wbbRankings.getRankings({
                year: 2020,
                week: 9
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('WBB Scoreboard', () => {
    it('should populate scoreboard data for the current week and year', (done) => {
        app.wbbScoreboard.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should populate scoreboard data for the given week and year', (done) => {
        app.wbbScoreboard.getScoreboard({
            year: 2021,
            month: 02,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for scoreboard data for the current week and year', (done) => {
        app.wbbScoreboard.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should return a promise for scoreboard data for the given week and year', (done) => {
        app.wbbScoreboard.getScoreboard({
                year: 2021,
                month: 02,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('WBB Standings', () => {
    it('should populate standings for the given year', (done) => {
        app.wbbStandings.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for standings for the given year', (done) => {
        app.wbbStandings.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});
describe('NCAA Games', () => {
    var game = 5764053;
    it('should return a promise for ncaa game information for a given game', (done) => {
            app.ncaaGames.getNcaaInfo(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;
                    done();
                })
        });
    it('should return a promise for ncaa game box score for a given game', (done) => {
            app.ncaaGames.getNcaaBoxScore(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;
                    done();
                })
        });
    it('should return a promise for ncaa game play-by-play for a given game', (done) => {
            app.ncaaGames.getNcaaPlayByPlay(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;
                    done();
                })
        });
    it('should return a promise for ncaa game team stats for a given game', (done) => {
            app.ncaaGames.getNcaaTeamStats(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;
                    done();
                })
        });
    it('should return a promise for ncaa game scoring summary for a given game', (done) => {
            app.ncaaGames.getNcaaScoringSummary(game)
                .then((data) => {
                    data.should.exist;
                    data.should.be.json;
                    data.should.not.be.empty;
                    done();
                })
        });
});

describe('NCAA Scoreboard', () => {
    it('should return a promise for ncaa scoreboard data for a given date', (done) => {
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
                data.should.not.be.empty;
                done();
            });
    });
});
describe('NBA Games', () => {
    var gameId = 401283399;

    it('should populate play by play data for the given game id', (done) => {
        app.nbaGames.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for play by play data for the given game id', (done) => {
        app.nbaGames.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should populate box score data for the given game id', (done) => {
        app.nbaGames.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for box score data for the given game id', (done) => {
        app.nbaGames.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
                done();
            });
    });

    it('should return a promise for game summary data for the given game id', (done) => {
        app.nbaGames.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('NBA Rankings', () => {
    it('should populate rankings for the current week and year', (done) => {
        app.nbaRankings.getRankings({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should populate rankings for the given week and year', (done) => {
        app.nbaRankings.getRankings({
            year: 2020,
            week: 9
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for rankings for the current week and year', (done) => {
        app.nbaRankings.getRankings({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should return a promise for rankings for the given week and year', (done) => {
        app.nbaRankings.getRankings({
                year: 2020,
                week: 9
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('NBA Scoreboard', () => {
    it('should populate scoreboard data for the current week and year', (done) => {
        app.nbaScoreboard.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should populate scoreboard data for the given week and year', (done) => {
        app.nbaScoreboard.getScoreboard({
            year: 2021,
            month: 02,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for scoreboard data for the current week and year', (done) => {
        app.nbaScoreboard.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should return a promise for scoreboard data for the given week and year', (done) => {
        app.nbaScoreboard.getScoreboard({
                year: 2021,
                month: 02,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('NBA Standings', () => {
    it('should populate standings for the given year', (done) => {
        app.nbaStandings.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for standings for the given year', (done) => {
        app.nbaStandings.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('WNBA Games', () => {
    var gameId = 401244185;

    it('should populate play by play data for the given game id', (done) => {
        app.wnbaGames.getPlayByPlay(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for play by play data for the given game id', (done) => {
        app.wnbaGames.getPlayByPlay(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should populate box score data for the given game id', (done) => {
        app.wnbaGames.getBoxScore(gameId).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.id.should.exist;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for box score data for the given game id', (done) => {
        app.wnbaGames.getBoxScore(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                data.id.should.exist;
                done();
            });
    });

    it('should return a promise for game summary data for the given game id', (done) => {
        app.wnbaGames.getSummary(gameId)
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('WNBA Rankings', () => {
    it('should populate rankings for the current week and year', (done) => {
        app.wnbaRankings.getRankings({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should populate rankings for the given week and year', (done) => {
        app.wnbaRankings.getRankings({
            year: 2020,
            week: 9
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for rankings for the current week and year', (done) => {
        app.wnbaRankings.getRankings({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should return a promise for rankings for the given week and year', (done) => {
        app.wnbaRankings.getRankings({
                year: 2020,
                week: 9
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('WNBA Scoreboard', () => {
    it('should populate scoreboard data for the current week and year', (done) => {
        app.wnbaScoreboard.getScoreboard({}).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should populate scoreboard data for the given week and year', (done) => {
        app.wnbaScoreboard.getScoreboard({
            year: 2021,
            month: 02,
            day: 15
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for scoreboard data for the current week and year', (done) => {
        app.wnbaScoreboard.getScoreboard({})
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });

    it('should return a promise for scoreboard data for the given week and year', (done) => {
        app.wnbaScoreboard.getScoreboard({
                year: 2021,
                month: 02,
                day: 15
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

describe('WNBA Standings', () => {
    it('should populate standings for the given year', (done) => {
        app.wnbaStandings.getStandings({
            year: 2020
        }).then((data) => {
            data.should.exist;
            data.should.be.json;
            data.should.not.be.empty;
            done();
        });
    });

    it('should return a promise for standings for the given year', (done) => {
        app.wnbaStandings.getStandings({
                year: 2020
            })
            .then((data) => {
                data.should.exist;
                data.should.be.json;
                data.should.not.be.empty;
                done();
            });
    });
});

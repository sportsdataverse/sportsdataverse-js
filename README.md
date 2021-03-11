# sportsdataverse

[![npm](https://img.shields.io/npm/v/sportsdataverse?style=for-the-badge)](https://www.npmjs.com/package/sportsdataverse)  [![npm](https://img.shields.io/npm/dm/sportsdataverse?style=for-the-badge)](https://www.npmjs.com/package/sportsdataverse) <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/sportsdataverse?style=for-the-badge">

<a href='https://www.npmjs.com/package/sportsdataverse'>[![NPM](https://nodei.co/npm/sportsdataverse.png)](https://npmjs.org/package/sportsdataverse)</a>

Support for the following data from ESPN's endpoints and recruiting data from 247Sports:

- play-by-play (including shot location data when available)
- scores
- schedule
- standings
- rankings (not available for professional sports)

Recruiting data from 247Sports available for:

- men's college basketball
- college football

The following sports are available from ESPN:

- College Basketball
- Women's College Basketball
- College Football
- WNBA
- NBA
- NFL
- NHL
- All team sports on the NCAA website:
  - 'football'
  - 'basketball-men'
  - 'basketball-women'
  - 'soccer-men'
  - 'soccer-women'
  - 'fieldhockey'
  - 'volleyball-women'
  - 'icehockey-men'
  - 'icehockey-women'
  - 'baseball'
  - 'beach-volleyball'
  - 'lacrosse-men'
  - 'lacrosse-women'
  - 'volleyball-men'

## Installation

```bash
npm install sportsdataverse
```

## Usage

```js
const sdv = require('sportsdataverse');
```

## Examples

## Men's College Basketball

<details><summary> Examples </summary>

### CBB Games

```js
const gameId = 401260281;

// get detailed play-by-play data for a game
const result = await sdv.cbbGames.getPlayByPlay(gameId);

// get box score
const result = await sdv.cbbGames.getBoxScore(gameId);

// get game all game data
const summary = await sdv.cbbGames.getSummary(gameId);

// get all game pickcenter data
const picks = await sdv.cbbGames.getPicks(gameId);

```

### CBB Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};
const result = await sdv.cbbScoreboard.getScoreboard(inputs);
```

### CBB Schedules

```js
const inputs = {
    groups: 50, // all Div-I games
    year: 2020,
    month: 12,
    day: 02
};

const result = await sdv.cbbSchedule.getSchedule(inputs);
```

### CBB Conferences

```js
const results = await sdv.cbbScoreboard.getConferences();
```

## CBB Teams

```js
// get list of teams
const result = await sdv.cbbTeams.getTeamList();

// get individual team data
const teamId = 52;
const result = await sdv.cbbTeams.getTeamInfo(teamId);

// get team roster data
const result = await sdv.cbbTeams.getTeamPlayers(teamId);
```

## CBB Rankings

```js
// get rankings
const inputs = {
    year: 2020,
    week: 19
};

const result = await sdv.cbbRankings.getRankings(inputs);
```

## CBB Standings

```js
// get standings
const inputs = {
    year: 2020
};

const result = await sdv.cbbStandings.getStandings(inputs);
```

## CBB Recruiting

```js
// get recruiting data from 247Composite
// get player rankings
const result = await sdv.cbbRecruiting.getPlayerRankings({
                    year: 2016
                });

const result = await sdv.cbbRecruiting.getPlayerRankings({
                    year: 2021,
                    position: "C"
                });

const result = await sdv.cbbRecruiting.getPlayerRankings({
                    year: 2020,
                    group: "JuniorCollege"
                });

// get school rankings
const result = await sdv.cbbRecruiting.getSchoolRankings(2021);

// get a school's commit list
const result = await sdv.cbbRecruiting.getSchoolCommits('floridastate', 2020);
```

</details>

## Women's College Basketball

<details><summary> Examples </summary>

### WBB Games

```js
const gameId = 401260281;

// get detailed play-by-play data for a game
const result = await sdv.wbbGames.getPlayByPlay(gameId);

// get box score
const result = await sdv.wbbGames.getBoxScore(gameId);

// get game all game data
const summary = await sdv.wbbGames.getSummary(gameId);
```

### WBB Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};
const result = await sdv.wbbScoreboard.getScoreboard(inputs);
```

### WBB Schedules

```js
const inputs = {
    groups: 50, // all Div-I games
    year: 2020,
    month: 12,
    day: 02
};

const result = await sdv.wbbSchedule.getSchedule(inputs);
```

### WBB Conferences

```js
const results = await sdv.wbbScoreboard.getConferences();
```

### WBB Teams

```js
// get list of teams
const result = await sdv.wbbTeams.getTeamList();

// get individual team data
const teamId = 52;
const result = await sdv.wbbTeams.getTeamInfo(teamId);

// get team roster data
const result = await sdv.wbbTeams.getTeamPlayers(teamId);
```

### WBB Rankings

```js
// get rankings
const inputs = {
    year: 2020,
    week: 19
};

const result = await sdv.wbbRankings.getRankings(inputs);
```

### WBB Standings

```js
// get standings
const inputs = {
    year: 2020
};

const result = await sdv.wbbStandings.getStandings(inputs);
```

</details>

## NCAA Data

<details><summary> Examples </summary>

### NCAA Scoreboard

```js
// acceptable sport names:
// ['football' ,'basketball-men', 'basketball-women',
//  'soccer-men','soccer-women','fieldhockey',
//  'volleyball-women','beach-volleyball',
//  'icehockey-men','icehockey-women',
//  'baseball',  'volleyball-men',
//  'lacrosse-men', 'lacrosse-women']
// get ncaa scoreboard data for sport from above list
// (default: 'basketball-men')
const result = await sdv.ncaaScoreboard.getNcaaScoreboard(
    sport = 'basketball-men', division = 'd1', year = 2020, month = 02, day = 15
)
```

### NCAA Games

**update v1.0.17: can now use game url fragment (relative to [https://ncaa.com](https://ncaa.com)) pulled from ncaaScoreboard to capture redirected url for games older than the past two years with ease**

```js
// NCAA game information for a given game id
const result = await sdv.ncaaGames.getNcaaInfo(5764053);

// NCAA box score for a given game id
const result = await sdv.ncaaGames.getNcaaBoxScore(5764053);

// NCAA play-by-play for a given game id
const result = await sdv.ncaaGames.getNcaaPlayByPlay(5764053);

// NCAA game team stats for a given game (appears to only exist for football)
const result = await sdv.ncaaGames.getNcaaTeamStats(5772253);

// NCAA game scoring summary for a given game (appears to only exist for football)
const result = await sdv.ncaaGames.getNcaaScoringSummary(5772253);
```

</details>

## NBA

<details><summary> Examples </summary>

### NBA Games

```js
const gameId = 401283399;

// get detailed play-by-play data for a game
const result = await sdv.nbaGames.getPlayByPlay(gameId);

// get box score
const result = await sdv.nbaGames.getBoxScore(gameId);

// get game all game data
const summary = await sdv.nbaGames.getSummary(gameId);

// get all game pickcenter data
const picks = await sdv.nbaGames.getPicks(gameId);

```

### NBA Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};
const result = await sdv.nbaScoreboard.getScoreboard(inputs);
```

### NBA Schedules

```js
const inputs = {
    year: 2020,
    month: 12,
    day: 02
};

const result = await sdv.nbaSchedule.getSchedule(inputs);
```

### NBA Conferences

```js
const results = await sdv.nbaScoreboard.getConferences();
```

### NBA Teams

```js
// get list of teams
const result = await sdv.nbaTeams.getTeamList();

// get individual team data
const teamId = 16;
const result = await sdv.nbaTeams.getTeamInfo(teamId);

// get team roster data
const result = await sdv.nbaTeams.getTeamPlayers(teamId);
```

### NBA Standings

```js
// get standings
const inputs = {
    year: 2020,
    group: 'league'
};

const result = await sdv.nbaStandings.getStandings(inputs);
```

</details>

## WNBA

<details><summary> Examples </summary>

### WNBA Games

```js
const gameId = 401244185;

// get detailed play-by-play data for a game
const result = await sdv.wnbaGames.getPlayByPlay(gameId);

// get box score
const result = await sdv.wnbaGames.getBoxScore(gameId);

// get game all game data
const summary = await sdv.wnbaGames.getSummary(gameId);
```

### WNBA Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};
const result = await sdv.wnbaScoreboard.getScoreboard(inputs);
```

### WNBA Schedules

```js
const inputs = {
    year: 2020,
    month: 12,
    day: 02
};

const result = await sdv.wnbaSchedule.getSchedule(inputs);
```

### WNBA Teams

```js
// get list of teams
const result = await sdv.wnbaTeams.getTeamList();

// get individual team data
const teamId = 14;
const result = await sdv.wnbaTeams.getTeamInfo(teamId);

// get team roster data
const result = await sdv.wnbaTeams.getTeamPlayers(teamId);
```

### WNBA Standings

```js
// get standings
const inputs = {
    year: 2020,
    group: 'league'
};

const result = await sdv.wnbaStandings.getStandings(inputs);
```

</details>

## NFL

<details><summary> Examples </summary>

### NFL Games

```js
const gameId = 401220403;

// get detailed play-by-play data for a game
const result = await sdv.nflGames.getPlayByPlay(gameId);

// get box score
const box = await sdv.nflGames.getBoxScore(gameId);

// get all game data
const summary = await sdv.nflGames.getSummary(gameId);

// get all game pickcenter data
const picks = await sdv.nflGames.getPicks(gameId);

```

### NFL Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 07
};
const result = await sdv.nflScoreboard.getScoreboard(inputs);
```

### NFL Schedules

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 07
};

const result = await sdv.nflSchedule.getSchedule(inputs);
```

### NFL Teams

```js
// get list of teams
const result = await sdv.nflTeams.getTeamList();

// get individual team data
const teamId = 27;
const result = await sdv.nflTeams.getTeamInfo(teamId);

// get team roster data
const result = await sdv.nflTeams.getTeamPlayers(teamId);
```

### NFL Standings

```js
// get standings
// acceptable group names: ['league','conference','division']
const inputs = {
    year: 2020,
    group: 'league'
};

const result = await sdv.nflStandings.getStandings(inputs);
```

</details>

## College Football

<details><summary> Examples </summary>

### CFB Games

```js
const gameId = 401256194;

// get detailed play-by-play data for a game
const result = await sdv.cfbGames.getPlayByPlay(gameId);

// get box score
const result = await sdv.cfbGames.getBoxScore(gameId);

// get game all game data
const summary = await sdv.cfbGames.getSummary(gameId);

// get all game pickcenter data
const picks = await sdv.cfbGames.getPicks(gameId);

```

### CFB Scores

```js
const inputs = {
    groups: 80,  //FBS Group Code, 81 for FCS
    year: 2021,
    month: 12,
    day: 15
};
const result = await sdv.cfbScoreboard.getScoreboard(inputs);
```

### CFB Schedules

```js
const inputs = {
    groups: 80, // all Div-I games
    year: 2020,
    month: 12,
    day: 02
};

const result = await sdv.cfbSchedule.getSchedule(inputs);
```

### CFB Conferences

```js
const results = await sdv.cfbScoreboard.getConferences();
```

## CFB Teams

```js
// get list of teams
const result = await sdv.cfbTeams.getTeamList();

// get individual team data
const teamId = 52;
const result = await sdv.cfbTeams.getTeamInfo(teamId);

// get team roster data
const result = await sdv.cfbTeams.getTeamPlayers(teamId);
```

## CFB Rankings

```js
// get rankings
const inputs = {
    year: 2020,
    week: 12
};

const result = await sdv.cfbRankings.getRankings(inputs);
```

## CFB Standings

```js
// get standings
const inputs = {
    year: 2020
};

const result = await sdv.cfbStandings.getStandings(inputs);
```

## CFB Recruiting

```js
// get recruiting data from 247Composite
// get player rankings
const result = await sdv.cfbRecruiting.getPlayerRankings({
                    year: 2016
                });

const result = await sdv.cfbRecruiting.getPlayerRankings({
                    year: 2021,
                    position: "DT"
                });

const result = await sdv.cfbRecruiting.getPlayerRankings({
                    year: 2020,
                    group: "JuniorCollege"
                });

// get school rankings
const result = await sdv.cfbRecruiting.getSchoolRankings(2021);

// get a school's commit list
const result = await sdv.cfbRecruiting.getSchoolCommits('floridastate', 2020);
```

</details>

## NHL

<details><summary> Examples </summary>

### NHL Games

```js
const gameId = 401272446;

// get detailed play-by-play data for a game
const result = await sdv.nhlGames.getPlayByPlay(gameId);

// get box score
const box = await sdv.nhlGames.getBoxScore(gameId);

// get all game data
const summary = await sdv.nhlGames.getSummary(gameId);

// get all game pickcenter data
const picks = await sdv.nhlGames.getPicks(gameId);

```

### NHL Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};
const result = await sdv.nhlScoreboard.getScoreboard(inputs);
```

### NHL Schedules

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};

const result = await sdv.nhlSchedule.getSchedule(inputs);
```

### NHL Teams

```js
// get list of teams
const result = await sdv.nhlTeams.getTeamList();

// get individual team data
const teamId = 16;
const result = await sdv.nhlTeams.getTeamInfo(teamId);

// get team roster data
const result = await sdv.nhlTeams.getTeamPlayers(teamId);
```

### NHL Standings

```js
// get standings
const inputs = {
    year: 2020
};

const result = await sdv.nhlStandings.getStandings(inputs);
```

</details>

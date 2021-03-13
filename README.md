# sportsdataverse

[![npm](https://img.shields.io/npm/v/sportsdataverse?style=for-the-badge)](https://www.npmjs.com/package/sportsdataverse)  [![npm](https://img.shields.io/npm/dm/sportsdataverse?style=for-the-badge)](https://www.npmjs.com/package/sportsdataverse) <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/sportsdataverse?style=for-the-badge">

<a href='https://www.npmjs.com/package/sportsdataverse'>[![NPM](https://nodei.co/npm/sportsdataverse.png)](https://npmjs.org/package/sportsdataverse)</a>

<h3 align="left">Connect with me:</h3>
<p align="left"> <a href="https://twitter.com/saiemgilani" target="blank"><img src="https://img.shields.io/twitter/follow/saiemgilani?logo=twitter&style=for-the-badge" alt="saiemgilani" /></a> <a href="https://www.patreon.com/join/sportsdataverse?"><img src="https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white" /><a> </p>

View the full documentation website: [sportsdataverse node.js documentation](https://saiemgilani.github.io/sportsdataverse/)

## ChangeLog

### **V1.1.0**

The following breaking changes were made:
- submodules were just basically simplified/removed, all functions are just now {sport-league}.getXXX, eg. cfb.getTeamList() and no longer cfbTeams.getTeamList();
- support for statistics from stats.ncaa.com added, so you can get information on everything from men's ice-hockey to women's bowling.
- Documentation website created and updated

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
const result = await sdv.cbb.getPlayByPlay(gameId);

// get box score
const result = await sdv.cbb.getBoxScore(gameId);

// get game all game data
const summary = await sdv.cbb.getSummary(gameId);

// get all game pickcenter data
const picks = await sdv.cbb.getPicks(gameId);

```

### CBB Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};
const result = await sdv.cbb.getScoreboard(inputs);
```

### CBB Schedules

```js
const inputs = {
    groups: 50, // all Div-I games
    year: 2020,
    month: 12,
    day: 02
};

const result = await sdv.cbb.getSchedule(inputs);
```

### CBB Conferences

```js
const results = await sdv.cbb.getConferences();
```

## CBB Teams

```js
// get list of teams
const result = await sdv.cbb.getTeamList();

// get individual team data
const teamId = 52;
const result = await sdv.cbb.getTeamInfo(teamId);

// get team roster data
const result = await sdv.cbb.getTeamPlayers(teamId);
```

## CBB Rankings

```js
// get rankings
const inputs = {
    year: 2020,
    week: 19
};

const result = await sdv.cbb.getRankings(inputs);
```

## CBB Standings

```js
// get standings
const inputs = {
    year: 2020
};

const result = await sdv.cbb.getStandings(inputs);
```

## CBB Recruiting

```js
// get recruiting data from 247Composite
// get player rankings
const result = await sdv.cbb.getPlayerRankings({
                    year: 2016
                });

const result = await sdv.cbb.getPlayerRankings({
                    year: 2021,
                    position: "C"
                });

const result = await sdv.cbbRecruiting.getPlayerRankings({
                    year: 2020,
                    group: "JuniorCollege"
                });

// get school rankings
const result = await sdv.cbb.getSchoolRankings(2021);

// get a school's commit list
const result = await sdv.cbb.getSchoolCommits('floridastate', 2020);
```

</details>

## Women's College Basketball

<details><summary> Examples </summary>

### WBB Games

```js
const gameId = 401260565;

// get detailed play-by-play data for a game
const result = await sdv.wbb.getPlayByPlay(gameId);

// get box score
const result = await sdv.wbb.getBoxScore(gameId);

// get game all game data
const summary = await sdv.wbb.getSummary(gameId);
```

### WBB Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};
const result = await sdv.wbb.getScoreboard(inputs);
```

### WBB Schedules

```js
const inputs = {
    groups: 50, // all Div-I games
    year: 2020,
    month: 12,
    day: 02
};

const result = await sdv.wbb.getSchedule(inputs);
```

### WBB Conferences

```js
const results = await sdv.wbb.getConferences();
```

### WBB Teams

```js
// get list of teams
const result = await sdv.wbb.getTeamList();

// get individual team data
const teamId = 52;
const result = await sdv.wbb.getTeamInfo(teamId);

// get team roster data
const result = await sdv.wbb.getTeamPlayers(teamId);
```

### WBB Rankings

```js
// get rankings
const inputs = {
    year: 2020,
    week: 19
};

const result = await sdv.wbb.getRankings(inputs);
```

### WBB Standings

```js
// get standings
const inputs = {
    year: 2020
};

const result = await sdv.wbb.getStandings(inputs);
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
const result = await sdv.ncaa.getNcaaScoreboard(
    sport = 'basketball-men', division = 'd1', year = 2020, month = 02, day = 15
)
```

### NCAA Games

```js
// NCAA game information for a given game id
const result = await sdv.ncaa.getNcaaInfo(5764053);

// NCAA box score for a given game id
const result = await sdv.ncaa.getNcaaBoxScore(5764053);

// NCAA play-by-play for a given game id
const result = await sdv.ncaa.getNcaaPlayByPlay(5764053);

// NCAA game team stats for a given game (appears to only exist for football)
const result = await sdv.ncaa.getNcaaTeamStats(5772253);

// NCAA game scoring summary for a given game (appears to only exist for football)
const result = await sdv.ncaa.getNcaaScoringSummary(5772253);
```

**update v1.0.17: can now use game url fragment (relative to [https://ncaa.com](https://ncaa.com)) pulled from ncaaScoreboard to capture redirected url gameId for games older than the past two years with ease**

```js
const result = await sdv.ncaa.getNcaaScoreboard(
    sport = 'basketball-men', division = 'd3', year = 2019, month = 02, day = 15
)
const urlGame = result["games"][16]["game"]["url"]

const gameId = await sdv.ncaa.getNcaaRedirectUrl(urlGame);
console.log(gameId);
const res = await sdv.ncaa.getNcaaBoxScore(game=gameId);

```

</details>

## NBA

<details><summary> Examples </summary>

### NBA Games

```js
const gameId = 401283399;

// get detailed play-by-play data for a game
const result = await sdv.nba.getPlayByPlay(gameId);

// get box score
const result = await sdv.nba.getBoxScore(gameId);

// get game all game data
const summary = await sdv.nba.getSummary(gameId);

// get all game pickcenter data
const picks = await sdv.nba.getPicks(gameId);

```

### NBA Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};
const result = await sdv.nba.getScoreboard(inputs);
```

### NBA Schedules

```js
const inputs = {
    year: 2020,
    month: 12,
    day: 02
};

const result = await sdv.nba.getSchedule(inputs);
```

### NBA Conferences

```js
const results = await sdv.nba.getConferences();
```

### NBA Teams

```js
// get list of teams
const result = await sdv.nba.getTeamList();

// get individual team data
const teamId = 16;
const result = await sdv.nba.getTeamInfo(teamId);

// get team roster data
const result = await sdv.nba.getTeamPlayers(teamId);
```

### NBA Standings

```js
// get standings
const inputs = {
    year: 2020,
    group: 'league'
};

const result = await sdv.nba.getStandings(inputs);
```

</details>

## WNBA

<details><summary> Examples </summary>

### WNBA Games

```js
const gameId = 401244185;

// get detailed play-by-play data for a game
const result = await sdv.wnba.getPlayByPlay(gameId);

// get box score
const result = await sdv.wnba.getBoxScore(gameId);

// get game all game data
const summary = await sdv.wnba.getSummary(gameId);
```

### WNBA Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};
const result = await sdv.wnba.getScoreboard(inputs);
```

### WNBA Schedules

```js
const inputs = {
    year: 2020,
    month: 12,
    day: 02
};

const result = await sdv.wnba.getSchedule(inputs);
```

### WNBA Teams

```js
// get list of teams
const result = await sdv.wnba.getTeamList();

// get individual team data
const teamId = 14;
const result = await sdv.wnba.getTeamInfo(teamId);

// get team roster data
const result = await sdv.wnba.getTeamPlayers(teamId);
```

### WNBA Standings

```js
// get standings
const inputs = {
    year: 2020,
    group: 'league'
};

const result = await sdv.wnba.getStandings(inputs);
```

</details>

## NFL

<details><summary> Examples </summary>

### NFL Games

```js
const gameId = 401220403;

// get detailed play-by-play data for a game
const result = await sdv.nfl.getPlayByPlay(gameId);

// get box score
const box = await sdv.nfl.getBoxScore(gameId);

// get all game data
const summary = await sdv.nfl.getSummary(gameId);

// get all game pickcenter data
const picks = await sdv.nfl.getPicks(gameId);

```

### NFL Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 07
};
const result = await sdv.nfl.getScoreboard(inputs);
```

### NFL Schedules

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 07
};

const result = await sdv.nfl.getSchedule(inputs);
```

### NFL Teams

```js
// get list of teams
const result = await sdv.nfl.getTeamList();

// get individual team data
const teamId = 27;
const result = await sdv.nfl.getTeamInfo(teamId);

// get team roster data
const result = await sdv.nfl.getTeamPlayers(teamId);
```

### NFL Standings

```js
// get standings
// acceptable group names: ['league','conference','division']
const inputs = {
    year: 2020,
    group: 'league'
};

const result = await sdv.nfl.getStandings(inputs);
```

</details>

## College Football

<details><summary> Examples </summary>

### CFB Games

```js
const gameId = 401256194;

// get detailed play-by-play data for a game
const result = await sdv.cfb.getPlayByPlay(gameId);

// get box score
const result = await sdv.cfb.getBoxScore(gameId);

// get game all game data
const summary = await sdv.cfb.getSummary(gameId);

// get all game pickcenter data
const picks = await sdv.cfb.getPicks(gameId);

```

### CFB Scores

```js
const inputs = {
    groups: 80,  //FBS Group Code, 81 for FCS
    year: 2021,
    month: 12,
    day: 15
};
const result = await sdv.cfb.getScoreboard(inputs);
```

### CFB Schedules

```js
const inputs = {
    groups: 80, // all Div-I games
    year: 2020,
    month: 12,
    day: 02
};

const result = await sdv.cfb.getSchedule(inputs);
```

### CFB Conferences

```js
const results = await sdv.cfb.getConferences();
```

## CFB Teams

```js
// get list of teams
const result = await sdv.cfb.getTeamList();

// get individual team data
const teamId = 52;
const result = await sdv.cfb.getTeamInfo(teamId);

// get team roster data
const result = await sdv.cfb.getTeamPlayers(teamId);
```

## CFB Rankings

```js
// get rankings
const inputs = {
    year: 2020,
    week: 12
};

const result = await sdv.cfb.getRankings(inputs);
```

## CFB Standings

```js
// get standings
const inputs = {
    year: 2020
};

const result = await sdv.cfb.getStandings(inputs);
```

## CFB Recruiting

```js
// get recruiting data from 247Composite
// get player rankings
const result = await sdv.cfb.getPlayerRankings({
                    year: 2016
                });

const result = await sdv.cfb.getPlayerRankings({
                    year: 2021,
                    position: "DT"
                });

const result = await sdv.cfb.getPlayerRankings({
                    year: 2020,
                    group: "JuniorCollege"
                });

// get school rankings
const result = await sdv.cfb.getSchoolRankings(2021);

// get a school's commit list
const result = await sdv.cfb.getSchoolCommits('floridastate', 2020);
```

</details>

## NHL

<details><summary> Examples </summary>

### NHL Games

```js
const gameId = 401272446;

// get detailed play-by-play data for a game
const result = await sdv.nhl.getPlayByPlay(gameId);

// get box score
const box = await sdv.nhl.getBoxScore(gameId);

// get all game data
const summary = await sdv.nhl.getSummary(gameId);

// get all game pickcenter data
const picks = await sdv.nhl.getPicks(gameId);

```

### NHL Scores

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};
const result = await sdv.nhl.getScoreboard(inputs);
```

### NHL Schedules

```js
const inputs = {
    year: 2021,
    month: 02,
    day: 15
};

const result = await sdv.nhl.getSchedule(inputs);
```

### NHL Teams

```js
// get list of teams
const result = await sdv.nhl.getTeamList();

// get individual team data
const teamId = 16;
const result = await sdv.nhl.getTeamInfo(teamId);

// get team roster data
const result = await sdv.nhl.getTeamPlayers(teamId);
```

### NHL Standings

```js
// get standings
const inputs = {
    year: 2020
};

const result = await sdv.nhl.getStandings(inputs);
```

</details>

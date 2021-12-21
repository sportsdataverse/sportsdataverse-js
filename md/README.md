<!-- badges: start -->
![Lifecycle:maturing](https://img.shields.io/badge/lifecycle-maturing-blue.svg?style=for-the-badge&logo=github)
![Contributors](https://img.shields.io/github/contributors/saiemgilani/sportsdataverse?style=for-the-badge)
[![npm](https://img.shields.io/npm/v/sportsdataverse?style=for-the-badge)](https://www.npmjs.com/package/sportsdataverse)  [![npm](https://img.shields.io/npm/dm/sportsdataverse?style=for-the-badge)](https://www.npmjs.com/package/sportsdataverse) <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/sportsdataverse?style=for-the-badge">

<a href='https://www.npmjs.com/package/sportsdataverse'>[![NPM](https://nodei.co/npm/sportsdataverse.png)](https://npmjs.org/package/sportsdataverse)</a>
<h3 align="left">Connect with me:</h3>
<p align="left"> <a href="https://twitter.com/saiemgilani" target="blank"><img src="https://img.shields.io/twitter/follow/saiemgilani?logo=twitter&style=for-the-badge" alt="saiemgilani" /></a> <a href="https://www.patreon.com/join/sportsdataverse?"><img src="https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white" /><a> </p>

<!-- badges: end -->

# **sportsdataverse** <a href='https://saiemgilani.github.io/sportsdataverse/'><img src='https://raw.githubusercontent.com/saiemgilani/sportsdataverse/master/docs2/static/img/logo.png' align="right" width="20%" min-width="100px"/></a>

## **Installation**

```bash
npm install sportsdataverse
```
View the full documentation website: [sportsdataverse node.js documentation](https://saiemgilani.github.io/sportsdataverse/)

## **ChangeLog**

### **V1.1.0**

The following breaking changes were made:
- submodules were just basically simplified/removed, all functions are just now {sport-league}.getXXX, eg. cfb.getTeamList() and no longer cfbTeams.getTeamList();
- support for statistics from stats.ncaa.com added, so you can get information on everything from men's ice-hockey to women's bowling.
- Documentation website created and updated

Support for the following data from ESPN's endpoints:

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

## **API Reference**
Operations for Men's College Basketball.

**Kind**: global namespace  

* [cbb](#cbb) : <code>object</code>
    * [.getPlayByPlay(id)](#cbb.getPlayByPlay) ⇒
    * [.getBoxScore(id)](#cbb.getBoxScore) ⇒
    * [.getSummary(id)](#cbb.getSummary) ⇒
    * [.getPicks(id)](#cbb.getPicks) ⇒
    * [.getRankings(year, week)](#cbb.getRankings) ⇒
    * [.getPlayerRankings(year, page, group)](#cbb.getPlayerRankings) ⇒
    * [.getSchoolRankings(year, page)](#cbb.getSchoolRankings) ⇒
    * [.getSchoolCommits(year, school)](#cbb.getSchoolCommits) ⇒
    * [.getSchedule(year, month, day, group, seasontype)](#cbb.getSchedule) ⇒
    * [.getScoreboard(year, month, day, group, seasontype, limit)](#cbb.getScoreboard) ⇒
    * [.getConferences()](#cbb.getConferences) ⇒
    * [.getStandings(year, group)](#cbb.getStandings) ⇒
    * [.getTeamList(group)](#cbb.getTeamList) ⇒
    * [.getTeamInfo(id)](#cbb.getTeamInfo) ⇒
    * [.getTeamPlayers(id)](#cbb.getTeamPlayers) ⇒

<a name="cbb.getPlayByPlay"></a>

### cbb.getPlayByPlay(id) ⇒
Gets the Men's College Basketball game play-by-play data for a specified game.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.cbb.getPlayByPlay(401260281);
```
<a name="cbb.getBoxScore"></a>

### cbb.getBoxScore(id) ⇒
Gets the Men's College Basketball game box score data for a specified game.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.cbb.getBoxScore(401260281);
```
<a name="cbb.getSummary"></a>

### cbb.getSummary(id) ⇒
Gets the Men's College Basketball game summary data for a specified game.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.cbb.getSummary(401260281);
```
<a name="cbb.getPicks"></a>

### cbb.getPicks(id) ⇒
Gets the Men's College Basketball game PickCenter data for a specified game.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.cbb.getPicks(401260281);
```
<a name="cbb.getRankings"></a>

### cbb.getRankings(year, week) ⇒
Gets the Men's College Basketball rankings data for a specified year and week if available.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| week | <code>\*</code> | Week |

**Example**  
```js
const result = await sdv.cbb.getRankings(year = 2020, week = 15)
```
<a name="cbb.getPlayerRankings"></a>

### cbb.getPlayerRankings(year, page, group) ⇒
Gets the Men's College Basketball Player recruiting data for a specified year, page, position and institution type if available.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| page | <code>number</code> | Page (50 per page) |
| group | <code>&quot;HighSchool&quot;</code> \| <code>&quot;JuniorCollege&quot;</code> \| <code>&quot;PrepSchool&quot;</code> | Institution Type |

**Example**  
```js
const result = await sdv.cbb.getPlayerRankings({year: 2016});
```
<a name="cbb.getSchoolRankings"></a>

### cbb.getSchoolRankings(year, page) ⇒
Gets the Men's College Basketball School recruiting data for a specified year, page, position and institution type if available.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| page | <code>number</code> | Page (50 per page) |

**Example**  
```js
const result = await sdv.cbb.getSchoolRankings({year: 2016});
```
<a name="cbb.getSchoolCommits"></a>

### cbb.getSchoolCommits(year, school) ⇒
Gets the Men's College Basketball School commitment data for a specified school and year.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| school | <code>string</code> | School |

**Example**  
```js
const result = await sdv.cbb.getSchoolCommits({school: 'Clemson', year: 2016});
```
<a name="cbb.getSchedule"></a>

### cbb.getSchedule(year, month, day, group, seasontype) ⇒
Gets the Men's College Basketball schedule data for a specified date if available.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |
| group | <code>number</code> | Group is 50 for Division-I, 51 for Division-II, 52 for Division-III |
| seasontype | <code>number</code> | Pre-Season: 1, Regular Season: 2, Postseason: 3, Off-season: 4 |

**Example**  
```js
const result = await sdv.cbb.getSchedule(year = 2021, month = 02, day = 15, group=50)
```
<a name="cbb.getScoreboard"></a>

### cbb.getScoreboard(year, month, day, group, seasontype, limit) ⇒
Gets the Men's College Basketball scoreboard data for a specified date if available.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |
| group | <code>number</code> | Group is 50 for Division-I, 51 for Division-II, 52 for Division-III |
| seasontype | <code>number</code> | Pre-Season: 1, Regular Season: 2, Postseason: 3, Off-season: 4 |
| limit | <code>number</code> | Limit on the number of results @default 300 |

**Example**  
```js
const result = await sdv.cbb.getScoreboard(year = 2021, month = 02, day = 15, group=50)
```
<a name="cbb.getConferences"></a>

### cbb.getConferences() ⇒
Gets the Men's College Basketball Conferences.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  
**Example**  
```js
const result = await sdv.cbb.getConferences();
```
<a name="cbb.getStandings"></a>

### cbb.getStandings(year, group) ⇒
Gets the team standings for Men's College Basketball.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>number</code> | Group is 50 for Division-I, 51 for Division-II, 52 for Division-III |

**Example**  
```js
get cbb standingsconst yr = 2020;const result = await sdv.cbb.getStandings(year = yr);
```
<a name="cbb.getTeamList"></a>

### cbb.getTeamList(group) ⇒
Gets the list of all College Football teams their identification info for ESPN.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| group | <code>number</code> | Group is 50 for Division-I, 51 for Division-II, 52 for Division-III |

**Example**  
```js
get list of teamsconst result = await sdv.cbb.getTeamList(group=50);
```
<a name="cbb.getTeamInfo"></a>

### cbb.getTeamInfo(id) ⇒
Gets the team info for a specific College Basketball team.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
get individual team dataconst teamId = 52;const result = await sdv.cbb.getTeamInfo(teamId);
```
<a name="cbb.getTeamPlayers"></a>

### cbb.getTeamPlayers(id) ⇒
Gets the team roster information for a specific Men's College Basketball team.

**Kind**: static method of [<code>cbb</code>](#cbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
get team roster dataconst teamId = 52;const result = await sdv.cbb.getTeamPlayers(teamId);
```

ERROR, Cannot find namespace.
ERROR, Cannot find namespace.
ERROR, Cannot find namespace.
ERROR, Cannot find namespace.
ERROR, Cannot find namespace.
ERROR, Cannot find namespace.
ERROR, Cannot find namespace.
* * *

&copy; 2020-21 Saiem Gilani <saiem.gilani@gmail.com>. Documented by [jsdoc-to-markdown](https://github.com/75lb/jsdoc-to-markdown).
# **sportsdataverse** <a href='https://js.sportsdataverse.org/'><img src='https://raw.githubusercontent.com/sportsdataverse/sportsdataverse-js/main/docs/static/img/sdv-js-logo.png' align="right" width="20%" min-width="100px"/></a>

![Lifecycle:maturing](https://img.shields.io/badge/lifecycle-maturing-blue.svg?style=for-the-badge&logo=github)
![Contributors](https://img.shields.io/github/contributors/sportsdataverse/sportsdataverse-js?style=for-the-badge)
[![npm](https://img.shields.io/npm/v/sportsdataverse?style=for-the-badge)](https://www.npmjs.com/package/sportsdataverse)  [![npm](https://img.shields.io/npm/dm/sportsdataverse?style=for-the-badge)](https://www.npmjs.com/package/sportsdataverse)
[![Twitter Follow](https://img.shields.io/twitter/follow/SportsDataverse?color=blue&label=%40SportsDataverse&logo=twitter&style=for-the-badge)](https://twitter.com/SportsDataverse) [![Twitter Follow](https://img.shields.io/twitter/follow/SaiemGilani?color=blue&label=%40SaiemGilani&logo=twitter&style=for-the-badge)](https://twitter.com/SaiemGilani)
[![NPM](https://nodei.co/npm/sportsdataverse.png)](https://npmjs.org/package/sportsdataverse)


## **Installation**

```bash
npm install sportsdataverse
```
## **Documentation**

For more information on the package and function reference, please see the [sportsdataverse node.js documentation website](https://js.sportsdataverse.org/)

## **Breaking Changes**

[**Full News on Releases**](https://js.sportsdataverse.org/CHANGELOG)

## Follow the [SportsDataverse](https://twitter.com/SportsDataverse) on Twitter and star this repo

[![Twitter Follow](https://img.shields.io/twitter/follow/SportsDataverse?color=blue&label=%40SportsDataverse&logo=twitter&style=for-the-badge)](https://twitter.com/SportsDataverse)

[![GitHub stars](https://img.shields.io/github/stars/sportsdataverse/sportsdataverse-js.svg?color=eee&logo=github&style=for-the-badge&label=Star%20sportsdataverse-js&maxAge=2592000)](https://github.com/sportsdataverse/sportsdataverse-js/stargazers/)

## **Our Authors**

-   [Saiem Gilani](https://twitter.com/saiemgilani)

<a href="https://twitter.com/saiemgilani" target="blank"><img src="https://img.shields.io/twitter/follow/SaiemGilani?color=blue&label=%40SaiemGilani&logo=twitter&style=for-the-badge" alt="@SaiemGilani" /></a>
<a href="https://github.com/saiemgilani" target="blank"><img src="https://img.shields.io/github/followers/saiemgilani?color=eee&logo=Github&style=for-the-badge" alt="@saiemgilani" /></a>


## **Citations**

To cite the [**`sportsdataverse`**](https://js.sportsdataverse.org) Node.js package in publications, use:

BibTex Citation
```bibtex
@misc{gilani_2021_sportsdataverse_js,
  author = {Gilani, Saiem},
  title = {sportsdataverse-js: The SportsDataverse's Node.js Package for Sports Data.},
  url = {https://js.sportsdataverse.org},
  year = {2021}
}
```

## **Overview of Services**

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

- Men's College Basketball
- Women's College Basketball
- College Football
- WNBA
- MLB
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

Operations for College Football.

**Kind**: global namespace  

* [cfb](#cfb) : <code>object</code>
    * [.getPlayByPlay(id)](#cfb.getPlayByPlay) ⇒
    * [.getBoxScore(id)](#cfb.getBoxScore) ⇒
    * [.getSummary(id)](#cfb.getSummary) ⇒
    * [.getPicks(id)](#cfb.getPicks) ⇒
    * [.getPlayerRankings(year, page, group, state)](#cfb.getPlayerRankings) ⇒
    * [.getSchoolRankings(year, page)](#cfb.getSchoolRankings) ⇒
    * [.getSchoolCommits(year, school)](#cfb.getSchoolCommits) ⇒
    * [.getRankings(year, week)](#cfb.getRankings) ⇒
    * [.getSchedule(year, month, day, group, seasontype)](#cfb.getSchedule) ⇒
    * [.getScoreboard(year, month, day, group, seasontype, limit)](#cfb.getScoreboard) ⇒
    * [.getConferences(year, group)](#cfb.getConferences) ⇒
    * [.getStandings(year, group)](#cfb.getStandings) ⇒
    * [.getTeamList(group)](#cfb.getTeamList) ⇒
    * [.getTeamInfo(id)](#cfb.getTeamInfo) ⇒
    * [.getTeamPlayers(id)](#cfb.getTeamPlayers)

<a name="cfb.getPlayByPlay"></a>

### cfb.getPlayByPlay(id) ⇒
Gets the College Football game play-by-play data for a specified game.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.cfb.getPlayByPlay(401256194);
```
<a name="cfb.getBoxScore"></a>

### cfb.getBoxScore(id) ⇒
Gets the College Football game box score data for a specified game.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.cfb.getBoxScore(401256194);
```
<a name="cfb.getSummary"></a>

### cfb.getSummary(id) ⇒
Gets the College Football game summary data for a specified game.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.cfb.getSummary(401256194);
```
<a name="cfb.getPicks"></a>

### cfb.getPicks(id) ⇒
Gets the College Football PickCenter data for a specified game.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.cfb.getPicks(401256194);
```
<a name="cfb.getPlayerRankings"></a>

### cfb.getPlayerRankings(year, page, group, state) ⇒
Gets the College Football Player recruiting data for a specified year, page, position, state and institution type if available.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| page | <code>number</code> | Page (50 per page) |
| group | <code>&quot;HighSchool&quot;</code> \| <code>&quot;JuniorCollege&quot;</code> \| <code>&quot;PrepSchool&quot;</code> | Institution Type |
| state | <code>string</code> | State of recruit |

**Example**  
```js
const result = await sdv.cfb.getPlayerRankings({year: 2016});
```
<a name="cfb.getSchoolRankings"></a>

### cfb.getSchoolRankings(year, page) ⇒
Gets the College Football School recruiting data for a specified year and page if available.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| page | <code>number</code> | Page (50 per page) |

**Example**  
```js
const result = await sdv.cfb.getSchoolRankings({year: 2016});
```
<a name="cfb.getSchoolCommits"></a>

### cfb.getSchoolCommits(year, school) ⇒
Gets the College Football School commitment data for a specified school and year.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| school | <code>string</code> | School |

**Example**  
```js
const result = await sdv.cfb.getSchoolCommits({school: 'Florida State', year: 2021});
```
<a name="cfb.getRankings"></a>

### cfb.getRankings(year, week) ⇒
Gets the CFB rankings data for a specified year and week if available.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| week | <code>\*</code> | Week |

**Example**  
```js
const result = await sdv.cfb.getRankings(year = 2020, week = 4)
```
<a name="cfb.getSchedule"></a>

### cfb.getSchedule(year, month, day, group, seasontype) ⇒
Gets the College Football schedule data for a specified date if available.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |
| group | <code>number</code> | Group is 80 for FBS, 81 for FCS |
| seasontype | <code>number</code> | Pre-Season: 1, Regular Season: 2, Postseason: 3, Off-season: 4 |

**Example**  
```js
const result = await sdv.cfb.getSchedule(year = 2019, month = 11, day = 16, group=80)
```
<a name="cfb.getScoreboard"></a>

### cfb.getScoreboard(year, month, day, group, seasontype, limit) ⇒
Gets the College Football scoreboard data for a specified date if available.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |
| group | <code>number</code> | Group is 80 for FBS, 81 for FCS |
| seasontype | <code>number</code> | Pre-Season: 1, Regular Season: 2, Postseason: 3, Off-season: 4 |
| limit | <code>number</code> | Limit on the number of results @default 300 |

**Example**  
```js
const result = await sdv.cfb.getScoreboard(year = 2019, month = 11, day = 16, group=80)
```
<a name="cfb.getConferences"></a>

### cfb.getConferences(year, group) ⇒
Gets the list of all College Football conferences and their identification info for ESPN.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>number</code> | Group is 80 for FBS, 81 for FCS |

**Example**  
```js
const yr = 2021;const result = await sdv.cfb.getConferences(year = yr, group = 80);
```
<a name="cfb.getStandings"></a>

### cfb.getStandings(year, group) ⇒
Gets the team standings for College Football.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>number</code> | Group is 80 for FBS, 81 for FCS |

**Example**  
```js
const yr = 2020;const result = await sdv.cfb.getStandings(year = yr);
```
<a name="cfb.getTeamList"></a>

### cfb.getTeamList(group) ⇒
Gets the list of all College Football teams their identification info for ESPN.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| group | <code>number</code> | Group is 80 for FBS, 81 for FCS |

**Example**  
```js
const result = await sdv.cfb.getTeamList(group=80);
```
<a name="cfb.getTeamInfo"></a>

### cfb.getTeamInfo(id) ⇒
Gets the team info for a specific College Football team.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 52;const result = await sdv.cfb.getTeamInfo(teamId);
```
<a name="cfb.getTeamPlayers"></a>

### cfb.getTeamPlayers(id)
Gets the team roster information for a specific College Football team.

**Kind**: static method of [<code>cfb</code>](#cfb)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 52;const result = await sdv.cfb.getTeamPlayers(teamId);
```

Operations for Men's College Basketball.

**Kind**: global namespace  

* [mbb](#mbb) : <code>object</code>
    * [.getPlayByPlay(id)](#mbb.getPlayByPlay) ⇒
    * [.getBoxScore(id)](#mbb.getBoxScore) ⇒
    * [.getSummary(id)](#mbb.getSummary) ⇒
    * [.getPicks(id)](#mbb.getPicks) ⇒
    * [.getRankings(year, week)](#mbb.getRankings) ⇒
    * [.getPlayerRankings(year, page, group)](#mbb.getPlayerRankings) ⇒
    * [.getSchoolRankings(year, page)](#mbb.getSchoolRankings) ⇒
    * [.getSchoolCommits(year, school)](#mbb.getSchoolCommits) ⇒
    * [.getSchedule(year, month, day, group, seasontype)](#mbb.getSchedule) ⇒
    * [.getScoreboard(year, month, day, group, seasontype, limit)](#mbb.getScoreboard) ⇒
    * [.getConferences(year, group)](#mbb.getConferences) ⇒
    * [.getStandings(year, group)](#mbb.getStandings) ⇒
    * [.getTeamList(group)](#mbb.getTeamList) ⇒
    * [.getTeamInfo(id)](#mbb.getTeamInfo) ⇒
    * [.getTeamPlayers(id)](#mbb.getTeamPlayers) ⇒

<a name="mbb.getPlayByPlay"></a>

### mbb.getPlayByPlay(id) ⇒
Gets the Men's College Basketball game play-by-play data for a specified game.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.mbb.getPlayByPlay(401260281);
```
<a name="mbb.getBoxScore"></a>

### mbb.getBoxScore(id) ⇒
Gets the Men's College Basketball game box score data for a specified game.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.mbb.getBoxScore(401260281);
```
<a name="mbb.getSummary"></a>

### mbb.getSummary(id) ⇒
Gets the Men's College Basketball game summary data for a specified game.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.mbb.getSummary(401260281);
```
<a name="mbb.getPicks"></a>

### mbb.getPicks(id) ⇒
Gets the Men's College Basketball game PickCenter data for a specified game.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.mbb.getPicks(401260281);
```
<a name="mbb.getRankings"></a>

### mbb.getRankings(year, week) ⇒
Gets the Men's College Basketball rankings data for a specified year and week if available.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| week | <code>\*</code> | Week |

**Example**  
```js
const result = await sdv.mbb.getRankings(year = 2020, week = 15)
```
<a name="mbb.getPlayerRankings"></a>

### mbb.getPlayerRankings(year, page, group) ⇒
Gets the Men's College Basketball Player recruiting data for a specified year, page, position and institution type if available.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| page | <code>number</code> | Page (50 per page) |
| group | <code>&quot;HighSchool&quot;</code> \| <code>&quot;JuniorCollege&quot;</code> \| <code>&quot;PrepSchool&quot;</code> | Institution Type |

**Example**  
```js
const result = await sdv.mbb.getPlayerRankings({year: 2016});
```
<a name="mbb.getSchoolRankings"></a>

### mbb.getSchoolRankings(year, page) ⇒
Gets the Men's College Basketball School recruiting data for a specified year, page, position and institution type if available.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| page | <code>number</code> | Page (50 per page) |

**Example**  
```js
const result = await sdv.mbb.getSchoolRankings({year: 2016});
```
<a name="mbb.getSchoolCommits"></a>

### mbb.getSchoolCommits(year, school) ⇒
Gets the Men's College Basketball School commitment data for a specified school and year.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| school | <code>string</code> | School |

**Example**  
```js
const result = await sdv.mbb.getSchoolCommits({school: 'Clemson', year: 2016});
```
<a name="mbb.getSchedule"></a>

### mbb.getSchedule(year, month, day, group, seasontype) ⇒
Gets the Men's College Basketball schedule data for a specified date if available.

**Kind**: static method of [<code>mbb</code>](#mbb)  
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
const result = await sdv.mbb.getSchedule(year = 2021, month = 02, day = 15, group=50)
```
<a name="mbb.getScoreboard"></a>

### mbb.getScoreboard(year, month, day, group, seasontype, limit) ⇒
Gets the Men's College Basketball scoreboard data for a specified date if available.

**Kind**: static method of [<code>mbb</code>](#mbb)  
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
const result = await sdv.mbb.getScoreboard(year = 2021, month = 02, day = 15, group=50)
```
<a name="mbb.getConferences"></a>

### mbb.getConferences(year, group) ⇒
Gets the Men's College Basketball Conferences.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>number</code> | Group is 50 for Division-I, 51 for Division-II, 52 for Division-III |

**Example**  
```js
const yr = 2021;const result = await sdv.mbb.getConferences(year = yr, group = 50);
```
<a name="mbb.getStandings"></a>

### mbb.getStandings(year, group) ⇒
Gets the team standings for Men's College Basketball.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>number</code> | Group is 50 for Division-I, 51 for Division-II, 52 for Division-III, see wbb.getConferences() for more info |

**Example**  
```js
const yr = 2020;const result = await sdv.mbb.getStandings(year = yr);
```
<a name="mbb.getTeamList"></a>

### mbb.getTeamList(group) ⇒
Gets the list of all College Football teams their identification info for ESPN.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| group | <code>number</code> | Group is 50 for Division-I, 51 for Division-II, 52 for Division-III |

**Example**  
```js
const result = await sdv.mbb.getTeamList(group=50);
```
<a name="mbb.getTeamInfo"></a>

### mbb.getTeamInfo(id) ⇒
Gets the team info for a specific College Basketball team.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 52;const result = await sdv.mbb.getTeamInfo(teamId);
```
<a name="mbb.getTeamPlayers"></a>

### mbb.getTeamPlayers(id) ⇒
Gets the team roster information for a specific Men's College Basketball team.

**Kind**: static method of [<code>mbb</code>](#mbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 52;const result = await sdv.mbb.getTeamPlayers(teamId);
```

Operations for MLB.

**Kind**: global namespace  

* [mlb](#mlb) : <code>object</code>
    * [.getPlayByPlay(id)](#mlb.getPlayByPlay) ⇒
    * [.getBoxScore(id)](#mlb.getBoxScore) ⇒
    * [.getSummary(id)](#mlb.getSummary) ⇒
    * [.getPicks(id)](#mlb.getPicks) ⇒
    * [.getSchedule(year, month, day)](#mlb.getSchedule) ⇒
    * [.getScoreboard(year, month, day, limit)](#mlb.getScoreboard) ⇒
    * [.getStandings(year, group)](#mlb.getStandings) ⇒
    * [.getTeamList()](#mlb.getTeamList) ⇒
    * [.getTeamInfo(id)](#mlb.getTeamInfo) ⇒
    * [.getTeamPlayers(id)](#mlb.getTeamPlayers) ⇒

<a name="mlb.getPlayByPlay"></a>

### mlb.getPlayByPlay(id) ⇒
Gets the MLB game play-by-play data for a specified game.

**Kind**: static method of [<code>mlb</code>](#mlb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.mlb.getPlayByPlay(401472105);
```
<a name="mlb.getBoxScore"></a>

### mlb.getBoxScore(id) ⇒
Gets the MLB game box score data for a specified game.

**Kind**: static method of [<code>mlb</code>](#mlb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.mlb.getBoxScore(401472105);
```
<a name="mlb.getSummary"></a>

### mlb.getSummary(id) ⇒
Gets the MLB game summary data for a specified game.

**Kind**: static method of [<code>mlb</code>](#mlb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.mlb.getSummary(401472105);
```
<a name="mlb.getPicks"></a>

### mlb.getPicks(id) ⇒
Gets the MLB game PickCenter data for a specified game.

**Kind**: static method of [<code>mlb</code>](#mlb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.mlb.getPicks(401472105);
```
<a name="mlb.getSchedule"></a>

### mlb.getSchedule(year, month, day) ⇒
Gets the MLB schedule data for a specified date if available.

**Kind**: static method of [<code>mlb</code>](#mlb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |

**Example**  
```js
const result = await sdv.mlb.getSchedule(year = 2016, month = 04, day = 15)
```
<a name="mlb.getScoreboard"></a>

### mlb.getScoreboard(year, month, day, limit) ⇒
Gets the MLB scoreboard data for a specified date if available.

**Kind**: static method of [<code>mlb</code>](#mlb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |
| limit | <code>number</code> | Limit on the number of results @default 300 |

**Example**  
```js
const result = await sdv.mlb.getScoreboard(year = 2019, month = 11, day = 16)
```
<a name="mlb.getStandings"></a>

### mlb.getStandings(year, group) ⇒
Gets the team standings for the MLB.

**Kind**: static method of [<code>mlb</code>](#mlb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>string</code> | acceptable group names: 'league','conference','division' |

**Example**  
```js
const yr = 2016;const result = await sdv.mlb.getStandings(year = yr);
```
<a name="mlb.getTeamList"></a>

### mlb.getTeamList() ⇒
Gets the list of all MLB teams their identification info for ESPN.

**Kind**: static method of [<code>mlb</code>](#mlb)  
**Returns**: json  
**Example**  
```js
const result = await sdv.mlb.getTeamList();
```
<a name="mlb.getTeamInfo"></a>

### mlb.getTeamInfo(id) ⇒
Gets the team info for a specific MLB team.

**Kind**: static method of [<code>mlb</code>](#mlb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 16;const result = await sdv.mlb.getTeamInfo(teamId);
```
<a name="mlb.getTeamPlayers"></a>

### mlb.getTeamPlayers(id) ⇒
Gets the team roster information for a specific MLB team.

**Kind**: static method of [<code>mlb</code>](#mlb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 16;const result = await sdv.mlb.getTeamPlayers(teamId);
```

Operations for NBA.

**Kind**: global namespace  

* [nba](#nba) : <code>object</code>
    * [.getPlayByPlay(id)](#nba.getPlayByPlay) ⇒
    * [.getBoxScore(id)](#nba.getBoxScore) ⇒
    * [.getSummary(id)](#nba.getSummary) ⇒
    * [.getPicks(id)](#nba.getPicks) ⇒
    * [.getSchedule(year, month, day)](#nba.getSchedule) ⇒
    * [.getScoreboard(year, month, day, limit)](#nba.getScoreboard) ⇒
    * [.getStandings(year, group)](#nba.getStandings) ⇒
    * [.getTeamList()](#nba.getTeamList) ⇒
    * [.getTeamInfo(id)](#nba.getTeamInfo) ⇒
    * [.getTeamPlayers(id)](#nba.getTeamPlayers) ⇒

<a name="nba.getPlayByPlay"></a>

### nba.getPlayByPlay(id) ⇒
Gets the NBA game play-by-play data for a specified game.

**Kind**: static method of [<code>nba</code>](#nba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nba.getPlayByPlay(401283399);
```
<a name="nba.getBoxScore"></a>

### nba.getBoxScore(id) ⇒
Gets the NBA game box score data for a specified game.

**Kind**: static method of [<code>nba</code>](#nba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nba.getBoxScore(401283399);
```
<a name="nba.getSummary"></a>

### nba.getSummary(id) ⇒
Gets the NBA game summary data for a specified game.

**Kind**: static method of [<code>nba</code>](#nba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nba.getSummary(401283399);
```
<a name="nba.getPicks"></a>

### nba.getPicks(id) ⇒
Gets the NBA game PickCenter data for a specified game.

**Kind**: static method of [<code>nba</code>](#nba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nba.getPicks(401283399);
```
<a name="nba.getSchedule"></a>

### nba.getSchedule(year, month, day) ⇒
Gets the NBA schedule data for a specified date if available.

**Kind**: static method of [<code>nba</code>](#nba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |

**Example**  
```js
const result = await sdv.nba.getSchedule(year = 2016, month = 04, day = 15)
```
<a name="nba.getScoreboard"></a>

### nba.getScoreboard(year, month, day, limit) ⇒
Gets the NBA scoreboard data for a specified date if available.

**Kind**: static method of [<code>nba</code>](#nba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |
| limit | <code>number</code> | Limit on the number of results @default 300 |

**Example**  
```js
const result = await sdv.nba.getScoreboard(year = 2019, month = 11, day = 16)
```
<a name="nba.getStandings"></a>

### nba.getStandings(year, group) ⇒
Gets the team standings for the NBA.

**Kind**: static method of [<code>nba</code>](#nba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>string</code> | acceptable group names: 'league','conference','division' |

**Example**  
```js
const yr = 2016;const result = await sdv.nba.getStandings(year = yr);
```
<a name="nba.getTeamList"></a>

### nba.getTeamList() ⇒
Gets the list of all NBA teams their identification info for ESPN.

**Kind**: static method of [<code>nba</code>](#nba)  
**Returns**: json  
**Example**  
```js
const result = await sdv.nba.getTeamList();
```
<a name="nba.getTeamInfo"></a>

### nba.getTeamInfo(id) ⇒
Gets the team info for a specific NBA team.

**Kind**: static method of [<code>nba</code>](#nba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 16;const result = await sdv.nba.getTeamInfo(teamId);
```
<a name="nba.getTeamPlayers"></a>

### nba.getTeamPlayers(id) ⇒
Gets the team roster information for a specific NBA team.

**Kind**: static method of [<code>nba</code>](#nba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 16;const result = await sdv.nba.getTeamPlayers(teamId);
```

Operations for NCAA Sports.

**Kind**: global namespace  

* [ncaa](#ncaa) : <code>object</code>
    * [.getRedirectUrl(url)](#ncaa.getRedirectUrl) ⇒
    * [.getInfo(game)](#ncaa.getInfo) ⇒
    * [.getBoxScore(game)](#ncaa.getBoxScore) ⇒
    * [.getPlayByPlay(game)](#ncaa.getPlayByPlay) ⇒
    * [.getTeamStats(game)](#ncaa.getTeamStats) ⇒
    * [.getScoringSummary(game)](#ncaa.getScoringSummary) ⇒
    * [.getScoreboard(sport, division, year, month, day)](#ncaa.getScoreboard) ⇒
    * [.getSports()](#ncaa.getSports) ⇒
    * [.getSeasons(sport)](#ncaa.getSeasons) ⇒
    * [.getDivisions(sport, season)](#ncaa.getDivisions) ⇒
    * [.getSportDivisionData(sport, season, division, rankingPeriod, type, gameHigh, category)](#ncaa.getSportDivisionData) ⇒
    * [.getPlayerData(sport, season, division, rankingPeriod, gameHigh, category)](#ncaa.getPlayerData) ⇒
    * [.getTeamData(sport, season, division, rankingPeriod, gameHigh, category)](#ncaa.getTeamData) ⇒

<a name="ncaa.getRedirectUrl"></a>

### ncaa.getRedirectUrl(url) ⇒
Gets the gameId for older games whose url redirects to the current url pattern using thegame url fragment (relative to [https://ncaa.com](https://ncaa.com)) pulled from ncaaScoreboard

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | Game url as pulled from ncaaScoreboard.getNcaaScoreboard. |

**Example**  
```js
const result = await sdv.ncaaScoreboard.getNcaaScoreboard(sport = 'basketball-men', division = 'd3', year = 2019, month = 02, day = 15)const urlGame = result["games"][16]["game"]["url"]const gameId = await sdv.ncaa.getRedirectUrl(url=urlGame);
```
<a name="ncaa.getInfo"></a>

### ncaa.getInfo(game) ⇒
Gets the gameInfo data for a specified game.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| game | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.ncaa.getInfo(5764053);
```
<a name="ncaa.getBoxScore"></a>

### ncaa.getBoxScore(game) ⇒
Gets the box score data for a specified game if available.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| game | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.ncaa.getBoxScore(5764053);
```
<a name="ncaa.getPlayByPlay"></a>

### ncaa.getPlayByPlay(game) ⇒
Gets the play-by-play data for a specified game if available.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| game | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.ncaa.getPlayByPlay(5764053);
```
<a name="ncaa.getTeamStats"></a>

### ncaa.getTeamStats(game) ⇒
Gets the team stats data for a specified game if available.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| game | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.ncaa.getTeamStats(5764053);
```
<a name="ncaa.getScoringSummary"></a>

### ncaa.getScoringSummary(game) ⇒
Gets the scoring summary data for a specified game if available.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| game | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.ncaa.getScoringSummary(5764053);
```
<a name="ncaa.getScoreboard"></a>

### ncaa.getScoreboard(sport, division, year, month, day) ⇒
Gets the scoreboard data for a specified date and team sport if available.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| sport | <code>string</code> | Sport name. Acceptable values: 'football','basketball-men', 'basketball-women', 'baseball', 'softball', 'soccer-men','soccer-women', 'fieldhockey', 'icehockey-men','icehockey-women', 'lacrosse-men','lacrosse-women', 'beach-volleyball', 'volleyball-women', 'volleyball-men' |
| division | <code>string</code> | Division of teams desired.  Acceptable values: Football - ['fbs','fcs','d2','d3'] All others - ['d1','d2','d3'] |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |

**Example**  
```js
const result = await sdv.ncaa.getScoreboard(sport = 'basketball-men', division = 'd3', year = 2019, month = 02, day = 15)
```
<a name="ncaa.getSports"></a>

### ncaa.getSports() ⇒
Retrieves the set of sports and their abbreviations.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  
**Example**  
```js
const result = sdv.ncaa.getSports();
```
<a name="ncaa.getSeasons"></a>

### ncaa.getSeasons(sport) ⇒
Retrieves the seasons for the selected sport.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| sport | <code>string</code> | Sport abbreviation. Acceptable values: 'MBA' = Baseball, 'MBB' = Men's basketball, 'MFB' = Men's Football, 'MIH' = Men's Ice-hockey, 'MLA' = Men's Lacrosse', 'MSO' = Men's Soccer, 'MTE' = Men's Tennis, 'MVB' = Men's Volleyball, 'MWP' = Men's Water Polo, 'WBB' = Women's Basketball, 'WBW' = Women's Bowling, 'WFH' = Field Hockey, 'WIH' = Women's Ice-Hockey, 'WLA' = Women's Lacrosse, 'WSB' = Women's Softball, 'WSO' = Women's Soccer, 'WSV' = Women's Beach Volleyball, 'WTE' = Women's Tennis, 'WVB' = Women's Volleyball, 'WWP' = Women's Water Polo |

**Example**  
```js
const result = sdv.ncaa.getSeasons(sport='MBB');
```
<a name="ncaa.getDivisions"></a>

### ncaa.getDivisions(sport, season) ⇒
Retrieves the Divisions for the selected sport and season.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| sport | <code>string</code> | Sport abbreviation. Acceptable values: 'MBA' = Baseball, 'MBB' = Men's basketball, 'MFB' = Men's Football, 'MIH' = Men's Ice-hockey, 'MLA' = Men's Lacrosse', 'MSO' = Men's Soccer, 'MTE' = Men's Tennis, 'MVB' = Men's Volleyball, 'MWP' = Men's Water Polo, 'WBB' = Women's Basketball, 'WBW' = Women's Bowling, 'WFH' = Field Hockey, 'WIH' = Women's Ice-Hockey, 'WLA' = Women's Lacrosse, 'WSB' = Women's Softball, 'WSO' = Women's Soccer, 'WSV' = Women's Beach Volleyball, 'WTE' = Women's Tennis, 'WVB' = Women's Volleyball, 'WWP' = Women's Water Polo |
| season | <code>string</code> | Season for sport |

**Example**  
```js
const result = sdv.ncaa.getDivisions(sport='MBB', season='2017');
```
<a name="ncaa.getSportDivisionData"></a>

### ncaa.getSportDivisionData(sport, season, division, rankingPeriod, type, gameHigh, category) ⇒
Request the data from the NCAA Stats website.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Description |
| --- | --- |
| sport | Sport abbreviation. Acceptable values: 'MBA' = Baseball, 'MBB' = Men's basketball, 'MFB' = Men's Football, 'MIH' = Men's Ice-hockey, 'MLA' = Men's Lacrosse', 'MSO' = Men's Soccer, 'MTE' = Men's Tennis, 'MVB' = Men's Volleyball, 'MWP' = Men's Water Polo, 'WBB' = Women's Basketball, 'WBW' = Women's Bowling, 'WFH' = Field Hockey, 'WIH' = Women's Ice-Hockey, 'WLA' = Women's Lacrosse, 'WSB' = Women's Softball, 'WSO' = Women's Soccer, 'WSV' = Women's Beach Volleyball, 'WTE' = Women's Tennis, 'WVB' = Women's Volleyball, 'WWP' = Women's Water Polo |
| season | Season of query, value for 2016-2017 season would be 2017. |
| division | Division, for college football: 11 for FBS, 12 for FCS, otherwise 1 for Division-I, 2 for Division-II, 3 for Division-III. |
| rankingPeriod | Integer value indicating the ranking period, options can be found from using the @function ncaa.getSportDivisionData function. |
| type | Individual or Team type of statistics |
| gameHigh | logical, indicating whether the statistic desired is of the game-high variety |
| category | Value for the stat category, can also be found using the @function ncaa.getSportDivisionData |

**Example**  
```js
const sportDivisionData = sdv.ncaa.getSportDivisionData(sport='MFB',season='2016',division=12,type='team',gameHigh=true);
```
<a name="ncaa.getPlayerData"></a>

### ncaa.getPlayerData(sport, season, division, rankingPeriod, gameHigh, category) ⇒
Get the Player Data from the NCAA Stats website.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| sport |  | Sport abbreviation. Acceptable values: 'MBA' = Baseball, 'MBB' = Men's basketball, 'MFB' = Men's Football, 'MIH' = Men's Ice-hockey, 'MLA' = Men's Lacrosse', 'MSO' = Men's Soccer, 'MTE' = Men's Tennis, 'MVB' = Men's Volleyball, 'MWP' = Men's Water Polo, 'WBB' = Women's Basketball, 'WBW' = Women's Bowling, 'WFH' = Field Hockey, 'WIH' = Women's Ice-Hockey, 'WLA' = Women's Lacrosse, 'WSB' = Women's Softball, 'WSO' = Women's Soccer, 'WSV' = Women's Beach Volleyball, 'WTE' = Women's Tennis, 'WVB' = Women's Volleyball, 'WWP' = Women's Water Polo |
| season |  | Season of query, value for 2016-2017 season would be 2017. |
| division |  | Division, for college football: 11 for FBS, 12 for FCS, otherwise 1 for Division-I, 2 for Division-II, 3 for Division-III. |
| rankingPeriod |  | Integer value indicating the ranking period, options can be found from using the @function ncaa.getSportDivisionData function. |
| gameHigh | <code>&#x27;Y&#x27;</code> \| <code>&#x27;N&#x27;</code> | logical, indicating whether the statistic desired is of the game-high variety |
| category |  | Value for the stat category, can also be found using the @function ncaa.getSportDivisionData |

**Example**  
```js
const players =  await sdv.ncaa.getPlayerData(sport = 'MFB', year = '2017', division = '11',rankingPeriod = '52', gameHigh='N', category = '20')
```
<a name="ncaa.getTeamData"></a>

### ncaa.getTeamData(sport, season, division, rankingPeriod, gameHigh, category) ⇒
Get the Team Data from the NCAA Stats website.

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| sport |  | Sport abbreviation. Acceptable values: 'MBA' = Baseball, 'MBB' = Men's basketball, 'MFB' = Men's Football, 'MIH' = Men's Ice-hockey, 'MLA' = Men's Lacrosse', 'MSO' = Men's Soccer, 'MTE' = Men's Tennis, 'MVB' = Men's Volleyball, 'MWP' = Men's Water Polo, 'WBB' = Women's Basketball, 'WBW' = Women's Bowling, 'WFH' = Field Hockey, 'WIH' = Women's Ice-Hockey, 'WLA' = Women's Lacrosse, 'WSB' = Women's Softball, 'WSO' = Women's Soccer, 'WSV' = Women's Beach Volleyball, 'WTE' = Women's Tennis, 'WVB' = Women's Volleyball, 'WWP' = Women's Water Polo |
| season |  | Season of query, value for 2016-2017 season would be 2017. |
| division |  | Division, for college football: 11 for FBS, 12 for FCS, otherwise 1 for Division-I, 2 for Division-II, 3 for Division-III. |
| rankingPeriod |  | Integer value indicating the ranking period, options can be found from using the @function ncaaSports.getSportDivisionData function. |
| gameHigh | <code>&#x27;Y&#x27;</code> \| <code>&#x27;N&#x27;</code> | logical, indicating whether the statistic desired is of the game-high variety |
| category |  | Value for the stat category, can also be found using the @function ncaaSports.getSportDivisionData |

**Example**  
```js
const teams =  await sdv.ncaa.getTeamData(sport = 'MFB', year = '2017', division = '11', rankingPeriod = '52', gameHigh='N', category = '20')
```

Operations for NFL.

**Kind**: global namespace  

* [nfl](#nfl) : <code>object</code>
    * [.getPlayByPlay(id)](#nfl.getPlayByPlay) ⇒
    * [.getBoxScore(id)](#nfl.getBoxScore) ⇒
    * [.getSummary(id)](#nfl.getSummary) ⇒
    * [.getPicks(id)](#nfl.getPicks) ⇒
    * [.getSchedule(year, month, day)](#nfl.getSchedule) ⇒
    * [.getScoreboard(year, month, day, limit)](#nfl.getScoreboard) ⇒
    * [.getStandings(year, group)](#nfl.getStandings) ⇒
    * [.getTeamList()](#nfl.getTeamList)
    * [.getTeamInfo(id)](#nfl.getTeamInfo) ⇒
    * [.getTeamPlayers(id)](#nfl.getTeamPlayers) ⇒

<a name="nfl.getPlayByPlay"></a>

### nfl.getPlayByPlay(id) ⇒
Gets the NFL game play-by-play data for a specified game.

**Kind**: static method of [<code>nfl</code>](#nfl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nfl.getPlayByPlay(401220403);
```
<a name="nfl.getBoxScore"></a>

### nfl.getBoxScore(id) ⇒
Gets the NFL game box score data for a specified game.

**Kind**: static method of [<code>nfl</code>](#nfl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nfl.getBoxScore(401220403);
```
<a name="nfl.getSummary"></a>

### nfl.getSummary(id) ⇒
Gets the NFL game summary data for a specified game.

**Kind**: static method of [<code>nfl</code>](#nfl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nfl.getSummary(401220403);
```
<a name="nfl.getPicks"></a>

### nfl.getPicks(id) ⇒
Gets the NFL PickCenter data for a specified game.

**Kind**: static method of [<code>nfl</code>](#nfl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nfl.getPicks(401220403);
```
<a name="nfl.getSchedule"></a>

### nfl.getSchedule(year, month, day) ⇒
Gets the NFL schedule data for a specified date if available.

**Kind**: static method of [<code>nfl</code>](#nfl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |

**Example**  
```js
const result = await sdv.nfl.getSchedule(year = 2019, month = 11, day = 17)
```
<a name="nfl.getScoreboard"></a>

### nfl.getScoreboard(year, month, day, limit) ⇒
Gets the NFL scoreboard data for a specified date if available.

**Kind**: static method of [<code>nfl</code>](#nfl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |
| limit | <code>number</code> | Limit on the number of results @default 300 |

**Example**  
```js
const result = await sdv.nfl.getScoreboard(year = 2019, month = 11, day = 17)
```
<a name="nfl.getStandings"></a>

### nfl.getStandings(year, group) ⇒
Gets the team standings for the NFL.

**Kind**: static method of [<code>nfl</code>](#nfl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>string</code> | acceptable group names: 'league','conference','division' |

**Example**  
```js
const yr = 2021;const result = await sdv.nfl.getStandings(year = yr);
```
<a name="nfl.getTeamList"></a>

### nfl.getTeamList()
Gets the list of all NFL teams their identification info for ESPN.

**Kind**: static method of [<code>nfl</code>](#nfl)  
**Example**  
```js
const result = await sdv.nfl.getTeamList();
```
<a name="nfl.getTeamInfo"></a>

### nfl.getTeamInfo(id) ⇒
Gets the team info for a specific NFL team.

**Kind**: static method of [<code>nfl</code>](#nfl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 16;const result = await sdv.nfl.getTeamInfo(teamId);
```
<a name="nfl.getTeamPlayers"></a>

### nfl.getTeamPlayers(id) ⇒
Gets the team roster information for a specific NFL team.

**Kind**: static method of [<code>nfl</code>](#nfl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 16;const result = await sdv.nfl.getTeamPlayers(teamId);
```

Operations for NHL.

**Kind**: global namespace  

* [nhl](#nhl) : <code>object</code>
    * [.getPlayByPlay(id)](#nhl.getPlayByPlay) ⇒
    * [.getBoxScore(id)](#nhl.getBoxScore) ⇒
    * [.getSummary(id)](#nhl.getSummary) ⇒
    * [.getPicks(id)](#nhl.getPicks) ⇒
    * [.getSchedule(year, month, day)](#nhl.getSchedule) ⇒
    * [.getScoreboard(year, month, day, limit)](#nhl.getScoreboard) ⇒
    * [.getStandings(year, group)](#nhl.getStandings) ⇒
    * [.getTeamList()](#nhl.getTeamList)
    * [.getTeamInfo(id)](#nhl.getTeamInfo) ⇒
    * [.getTeamPlayers(id)](#nhl.getTeamPlayers) ⇒

<a name="nhl.getPlayByPlay"></a>

### nhl.getPlayByPlay(id) ⇒
Gets the NHL game play-by-play data for a specified game.

**Kind**: static method of [<code>nhl</code>](#nhl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nhl.getPlayByPlay(401272446);
```
<a name="nhl.getBoxScore"></a>

### nhl.getBoxScore(id) ⇒
Gets the NHL game box score data for a specified game.

**Kind**: static method of [<code>nhl</code>](#nhl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nhl.getBoxScore(401272446);
```
<a name="nhl.getSummary"></a>

### nhl.getSummary(id) ⇒
Gets the NHL game summary data for a specified game.

**Kind**: static method of [<code>nhl</code>](#nhl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nhl.getSummary(401272446);
```
<a name="nhl.getPicks"></a>

### nhl.getPicks(id) ⇒
Gets the NHL PickCenter data for a specified game.

**Kind**: static method of [<code>nhl</code>](#nhl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.nhl.getPicks(401272446);
```
<a name="nhl.getSchedule"></a>

### nhl.getSchedule(year, month, day) ⇒
Gets the NHL schedule data for a specified date if available.

**Kind**: static method of [<code>nhl</code>](#nhl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |

**Example**  
```js
const result = await sdv.nhl.getSchedule(year = 2019, month = 11, day = 17)
```
<a name="nhl.getScoreboard"></a>

### nhl.getScoreboard(year, month, day, limit) ⇒
Gets the NHL scoreboard data for a specified date if available.

**Kind**: static method of [<code>nhl</code>](#nhl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |
| limit | <code>number</code> | Limit on the number of results @default 300 |

**Example**  
```js
const result = await sdv.nhl.getScoreboard(year = 2019, month = 11, day = 16)
```
<a name="nhl.getStandings"></a>

### nhl.getStandings(year, group) ⇒
Gets the team standings for the NHL.

**Kind**: static method of [<code>nhl</code>](#nhl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>string</code> | acceptable group names: 'league','conference','division' |

**Example**  
```js
const yr = 2016;const result = await sdv.nhl.getStandings(year = yr);
```
<a name="nhl.getTeamList"></a>

### nhl.getTeamList()
Gets the list of all NHL teams their identification info for ESPN.

**Kind**: static method of [<code>nhl</code>](#nhl)  
**Example**  
```js
const result = await sdv.nhl.getTeamList();
```
<a name="nhl.getTeamInfo"></a>

### nhl.getTeamInfo(id) ⇒
Gets the team info for a specific NHL team.

**Kind**: static method of [<code>nhl</code>](#nhl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 16;const result = await sdv.nhl.getTeamInfo(teamId);
```
<a name="nhl.getTeamPlayers"></a>

### nhl.getTeamPlayers(id) ⇒
Gets the team roster information for a specific NHL team.

**Kind**: static method of [<code>nhl</code>](#nhl)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 16;const result = await sdv.nhl.getTeamPlayers(teamId);
```

Operations for WBB.

**Kind**: global namespace  

* [wbb](#wbb) : <code>object</code>
    * [.getPlayByPlay(id)](#wbb.getPlayByPlay) ⇒
    * [.getBoxScore(id)](#wbb.getBoxScore) ⇒
    * [.getSummary(id)](#wbb.getSummary) ⇒
    * [.getRankings(year, week)](#wbb.getRankings) ⇒
    * [.getSchedule(year, month, day, group, seasontype, limit)](#wbb.getSchedule) ⇒
    * [.getScoreboard(year, month, day, group, seasontype, limit)](#wbb.getScoreboard) ⇒
    * [.getConferences(year, group)](#wbb.getConferences) ⇒
    * [.getStandings(year, group)](#wbb.getStandings) ⇒
    * [.getTeamList(group)](#wbb.getTeamList) ⇒
    * [.getTeamInfo(id)](#wbb.getTeamInfo) ⇒
    * [.getTeamPlayers(id)](#wbb.getTeamPlayers) ⇒

<a name="wbb.getPlayByPlay"></a>

### wbb.getPlayByPlay(id) ⇒
Gets the Women's College Basketball game play-by-play data for a specified game.

**Kind**: static method of [<code>wbb</code>](#wbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.wbb.getPlayByPlay(401260565);
```
<a name="wbb.getBoxScore"></a>

### wbb.getBoxScore(id) ⇒
Gets the Women's College Basketball game box score data for a specified game.

**Kind**: static method of [<code>wbb</code>](#wbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.wbb.getBoxScore(401260565);
```
<a name="wbb.getSummary"></a>

### wbb.getSummary(id) ⇒
Gets the Women's College Basketball game summary data for a specified game.

**Kind**: static method of [<code>wbb</code>](#wbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.wbb.getSummary(401260565);
```
<a name="wbb.getRankings"></a>

### wbb.getRankings(year, week) ⇒
Gets the WBB rankings data for a specified year and week if available.

**Kind**: static method of [<code>wbb</code>](#wbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| week | <code>\*</code> | Week |

**Example**  
```js
const result = await sdv.wbb.getRankings(year = 2021, week = 4)
```
<a name="wbb.getSchedule"></a>

### wbb.getSchedule(year, month, day, group, seasontype, limit) ⇒
Gets the Women's College Basketball schedule data for a specified date if available.

**Kind**: static method of [<code>wbb</code>](#wbb)  
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
const result = await sdv.wbb.getSchedule(year = 2021, month = 02, day = 15, group=50)
```
<a name="wbb.getScoreboard"></a>

### wbb.getScoreboard(year, month, day, group, seasontype, limit) ⇒
Gets the Women's College Basketball scoreboard data for a specified date if available.

**Kind**: static method of [<code>wbb</code>](#wbb)  
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
const result = await sdv.wbb.getScoreboard(year = 2019, month = 02, day = 15, group=50)
```
<a name="wbb.getConferences"></a>

### wbb.getConferences(year, group) ⇒
Gets the list of all Women's College Basketball conferences and their identification info for ESPN.

**Kind**: static method of [<code>wbb</code>](#wbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>number</code> | Group is 50 for Division-I, 51 for Division-II, 52 for Division-III |

**Example**  
```js
const yr = 2021;const result = await sdv.wbb.getConferences(year = yr, group = 50);
```
<a name="wbb.getStandings"></a>

### wbb.getStandings(year, group) ⇒
Gets the team standings for Women's College Basketball.

**Kind**: static method of [<code>wbb</code>](#wbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>number</code> | Group is 50 for Division-I, 51 for Division-II, 52 for Division-III, see wbb.getConferences() for more info |

**Example**  
```js
const yr = 2020;const result = await sdv.wbb.getStandings(year = yr);
```
<a name="wbb.getTeamList"></a>

### wbb.getTeamList(group) ⇒
Gets the list of all Women's College Basketball teams their identification info for ESPN.

**Kind**: static method of [<code>wbb</code>](#wbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| group | <code>number</code> | Group is 50 for Division I, 51 for Division II, 52 for Division III |

**Example**  
```js
get list of teamsconst result = await sdv.wbb.getTeamList(group=50);
```
<a name="wbb.getTeamInfo"></a>

### wbb.getTeamInfo(id) ⇒
Gets the team info for a specific WBB team.

**Kind**: static method of [<code>wbb</code>](#wbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 52;const result = await sdv.wbb.getTeamInfo(teamId);
```
<a name="wbb.getTeamPlayers"></a>

### wbb.getTeamPlayers(id) ⇒
Gets the team roster information for a specific WBB team.

**Kind**: static method of [<code>wbb</code>](#wbb)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 52;const result = await sdv.wbb.getTeamPlayers(teamId);
```

Operations for WNBA.

**Kind**: global namespace  

* [wnba](#wnba) : <code>object</code>
    * [.getPlayByPlay(id)](#wnba.getPlayByPlay) ⇒
    * [.getBoxScore(id)](#wnba.getBoxScore) ⇒
    * [.getSummary(id)](#wnba.getSummary) ⇒
    * [.getSchedule(year, month, day)](#wnba.getSchedule) ⇒
    * [.getScoreboard(year, month, day, limit)](#wnba.getScoreboard) ⇒
    * [.getStandings(year, group)](#wnba.getStandings) ⇒
    * [.getTeamList()](#wnba.getTeamList) ⇒
    * [.getTeamInfo(id)](#wnba.getTeamInfo) ⇒
    * [.getTeamPlayers(id)](#wnba.getTeamPlayers) ⇒

<a name="wnba.getPlayByPlay"></a>

### wnba.getPlayByPlay(id) ⇒
Gets the WNBA game play-by-play data for a specified game.

**Kind**: static method of [<code>wnba</code>](#wnba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.wnba.getPlayByPlay(401244185);
```
<a name="wnba.getBoxScore"></a>

### wnba.getBoxScore(id) ⇒
Gets the WNBA game box score data for a specified game.

**Kind**: static method of [<code>wnba</code>](#wnba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.wnba.getBoxScore(401244185);
```
<a name="wnba.getSummary"></a>

### wnba.getSummary(id) ⇒
Gets the WNBA game summary data for a specified game.

**Kind**: static method of [<code>wnba</code>](#wnba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Game id. |

**Example**  
```js
const result = await sdv.wnba.getSummary(401244185);
```
<a name="wnba.getSchedule"></a>

### wnba.getSchedule(year, month, day) ⇒
Gets the WNBA schedule data for a specified date if available.

**Kind**: static method of [<code>wnba</code>](#wnba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |

**Example**  
```js
const result = await sdv.wnba.getSchedule(year = 2019, month = 07, day = 15)
```
<a name="wnba.getScoreboard"></a>

### wnba.getScoreboard(year, month, day, limit) ⇒
Gets the WNBA scoreboard data for a specified date if available.

**Kind**: static method of [<code>wnba</code>](#wnba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |
| limit | <code>number</code> | Limit on the number of results @default 300 |

**Example**  
```js
const result = await sdv.wnba.getScoreboard(year = 2019, month = 07, day = 15)
```
<a name="wnba.getStandings"></a>

### wnba.getStandings(year, group) ⇒
Gets the team standings for the WNBA.

**Kind**: static method of [<code>wnba</code>](#wnba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| year | <code>number</code> | Season |
| group | <code>string</code> | acceptable group names: 'league','conference' |

**Example**  
```js
const yr = 2016;const result = await sdv.wnba.getStandings(year = yr);
```
<a name="wnba.getTeamList"></a>

### wnba.getTeamList() ⇒
Gets the list of all WNBA teams their identification info for ESPN.

**Kind**: static method of [<code>wnba</code>](#wnba)  
**Returns**: json  
**Example**  
```js
const result = await sdv.wnba.getTeamList();
```
<a name="wnba.getTeamInfo"></a>

### wnba.getTeamInfo(id) ⇒
Gets the team info for a specific WNBA team.

**Kind**: static method of [<code>wnba</code>](#wnba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 16;const result = await sdv.wnba.getTeamInfo(teamId);
```
<a name="wnba.getTeamPlayers"></a>

### wnba.getTeamPlayers(id) ⇒
Gets the team roster information for a specific WNBA team.

**Kind**: static method of [<code>wnba</code>](#wnba)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Team Id |

**Example**  
```js
const teamId = 16;const result = await sdv.wnba.getTeamPlayers(teamId);
```

* * *

&copy; 2020-21 <a href="https://js.sportsdataverse.org/">sportsdataverse.js</a>, developed by <a href='https://twitter.com/saiemgilani'>Saiem Gilani</a>, part of the <a href='https://sportsdataverse.org'>SportsDataverse</a>
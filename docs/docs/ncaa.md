<a name="ncaa"></a>

## ncaa : <code>object</code>
Operations for NCAA Sports.

**Kind**: global namespace  

* [ncaa](#ncaa) : <code>object</code>
    * [.getRedirectUrl(url)](#ncaa.getRedirectUrl) ⇒
    * [.getInfo(game)](#ncaa.getInfo) ⇒
    * [.getBoxScore(game)](#ncaa.getBoxScore) ⇒
    * [.getPlayByPlay(game)](#ncaa.getPlayByPlay) ⇒
    * [.getScoreboard(sport, division, year, month, day)](#ncaa.getScoreboard) ⇒
    * [.getSports()](#ncaa.getSports) ⇒
    * [.getSeasons(sport)](#ncaa.getSeasons) ⇒
    * [.getDivisions(sport, season)](#ncaa.getDivisions) ⇒
    * [.getSportDivisionData(sport, season, division, rankingPeriod, type, gameHigh, category)](#ncaa.getSportDivisionData) ⇒
    * [.getPlayerData(sport, season, division, rankingPeriod, gameHigh, category)](#ncaa.getPlayerData) ⇒
    * [.getTeamData(sport, season, division, rankingPeriod, gameHigh, category)](#ncaa.getTeamData) ⇒

<a name="ncaa.getRedirectUrl"></a>

### ncaa.getRedirectUrl(url) ⇒
Gets the gameId for older games whose url redirects to the current url pattern using the
game url fragment (relative to [https://ncaa.com](https://ncaa.com)) pulled from ncaaScoreboard

**Kind**: static method of [<code>ncaa</code>](#ncaa)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | Game url as pulled from ncaaScoreboard.getNcaaScoreboard. |

**Example**  
```js
const result = await sdv.ncaaScoreboard.getNcaaScoreboard(
sport = 'basketball-men', division = 'd3', year = 2019, month = 02, day = 15
)
const urlGame = result["games"][16]["game"]["url"]
const gameId = await sdv.ncaa.getRedirectUrl(url=urlGame);
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
const result = await sdv.ncaa.getScoreboard(
sport = 'basketball-men', division = 'd3', year = 2019, month = 02, day = 15
)
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

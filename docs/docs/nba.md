<a name="nba"></a>

## nba : <code>object</code>
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
const result = await sdv.nba.getSchedule(
year = 2016, month = 04, day = 15
)
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
const result = await sdv.nba.getScoreboard(
year = 2019, month = 11, day = 16
)
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
const yr = 2016;
const result = await sdv.nba.getStandings(year = yr);
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
const teamId = 16;
const result = await sdv.nba.getTeamInfo(teamId);
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
const teamId = 16;
const result = await sdv.nba.getTeamPlayers(teamId);
```

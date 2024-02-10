<a name="wnba"></a>

## wnba : <code>object</code>
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
const result = await sdv.wnba.getSchedule(
year = 2019, month = 07, day = 15
)
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
const result = await sdv.wnba.getScoreboard(
year = 2019, month = 07, day = 15
)
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
const yr = 2016;
const result = await sdv.wnba.getStandings(year = yr);
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
const teamId = 16;
const result = await sdv.wnba.getTeamInfo(teamId);
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
const teamId = 16;
const result = await sdv.wnba.getTeamPlayers(teamId);
```

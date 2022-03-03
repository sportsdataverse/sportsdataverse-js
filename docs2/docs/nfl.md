<a name="nfl"></a>

## nfl : <code>object</code>
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

<a name="mlb"></a>

## mlb : <code>object</code>
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

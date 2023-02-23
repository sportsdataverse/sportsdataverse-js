<a name="nhl"></a>

## nhl : <code>object</code>
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

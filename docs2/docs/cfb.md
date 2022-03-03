<a name="cfb"></a>

## cfb : <code>object</code>
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
    * [.getConferences()](#cfb.getConferences) ⇒
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

### cfb.getConferences() ⇒
Gets the list of all College Football conferences and their identification info for ESPN.

**Kind**: static method of [<code>cfb</code>](#cfb)  
**Returns**: json  
**Example**  
```js
const result = await sdv.cfb.getConferences();
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

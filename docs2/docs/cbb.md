<a name="cbb"></a>

## cbb : <code>object</code>
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

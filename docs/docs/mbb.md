<a name="mbb"></a>

## mbb : <code>object</code>
Operations for Men's College Basketball.

**Kind**: global namespace  

* [mbb](#mbb) : <code>object</code>
    * [.getPlayByPlay(id)](#mbb.getPlayByPlay) ⇒
    * [.getBoxScore(id)](#mbb.getBoxScore) ⇒
    * [.getSummary(id)](#mbb.getSummary) ⇒
    * [.getPicks(id)](#mbb.getPicks) ⇒
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
const result = await sdv.mbb.getSchedule(
year = 2021, month = 02, day = 15, group=50
)
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
const result = await sdv.mbb.getScoreboard(
year = 2021, month = 02, day = 15, group=50
)
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
const yr = 2021;
const result = await sdv.mbb.getConferences(year = yr, group = 50);
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
const yr = 2020;
const result = await sdv.mbb.getStandings(year = yr);
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
const teamId = 52;
const result = await sdv.mbb.getTeamInfo(teamId);
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
const teamId = 52;
const result = await sdv.mbb.getTeamPlayers(teamId);
```

<a name="tnns"></a>

## tnns : <code>object</code>
Operations for Tennis.

**Kind**: global namespace  
<a name="tnns.getScoreboard"></a>

### tnns.getScoreboard(league, year, month, day) ⇒
Gets the scoreboard data for a specified date and league if available.

**Kind**: static method of [<code>tnns</code>](#tnns)  
**Returns**: json  

| Param | Type | Description |
| --- | --- | --- |
| league | <code>string</code> | Tennis league desired. Default 'atp' Acceptable values: ['atp', 'wta'] |
| year | <code>\*</code> | Year (YYYY) |
| month | <code>\*</code> | Month (MM) |
| day | <code>\*</code> | Day (DD) |

**Example**  
```js
const result = await sdv.tnns.getScoreboard({
league = 'wta', year = 2023, month = 06, day = 20
})
```

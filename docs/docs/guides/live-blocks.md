---
title: Live code blocks
sidebar_label: Live code blocks
sidebar_position: 12
description: Editable, in-page code blocks with the parser layer, the proxy fetch and a table renderer in scope.
---

# Live code blocks

Some pages carry **editable** code blocks: change the code and the result below
it re-renders. They run in your browser (react-live), so there is no `import`;
instead every block sees this scope:

| Name | What it is |
| --- | --- |
| `parseEndpoint(kind, key, raw, section?)`, `parse_summary`, `normalize`, `snakeCase`, `PARSERS`, `parserFor`, … | the whole `sportsdataverse/parsers` surface (the playground's browser bundle); also as the `parsers` namespace |
| `fetchViaProxy(request, init?)` | `POST /api/run`, the site's host-allowlisted proxy (upstreams send no CORS headers). `request` is the proxy's own shape — `{ league, endpoint, params }` for ESPN, `{ api, endpoint, params }` for a native family — not a URL. Resolves to the JSON body (or raw text for CSV/HTML) |
| `resolve.resolveUrl(def, league, params, hosts)`, `resolve.resolveFlatUrl(...)`, `resolve.findFlatDef(...)` | the request-URL resolver the playground and the proxy share; `endpoints` is its generated catalogue |
| `Table` (`rows`, `cols?`, `max?`) | the tidy-rows table RunCell renders |
| `useState`, `useEffect`, … | React |

Blocks are `noInline`: finish with `render(<Something />)`. The proxy only
exists on the deployed site, so `fetchViaProxy` fails under a local
`docusaurus start` — the parser-only blocks still work there.

## Parse a payload

The parsers take the provider's raw JSON. This is a scoreboard-shaped payload
with the handful of fields the row needs; edit a score or add a second event:

```jsx live noInline
const payload = {
  events: [
    {
      id: '401704871', uid: 's:40~l:46~e:401704871', date: '2024-12-01T20:30Z',
      name: 'Orlando Magic at Brooklyn Nets', shortName: 'ORL @ BKN',
      season: { year: 2025, type: 2 }, status: { type: { name: 'STATUS_FINAL' } },
      competitions: [{ id: '401704871', competitors: [
        { homeAway: 'home', score: '112', team: { id: '17', abbreviation: 'BKN' } },
        { homeAway: 'away', score: '98', team: { id: '19', abbreviation: 'ORL' } },
      ] }],
    },
  ],
};
const rows = parseEndpoint('espn', 'scoreboard', payload);
render(<Table rows={rows} cols={['game_id', 'short_name', 'home_score', 'away_score', 'status_type_name']} />);
```

## Fetch through the proxy and render

The same call the [Playground](/playground) makes for the NBA scoreboard, then
the rows through the parser. Change `league` to `wnba` or `endpoint` to `standings`:

```jsx live noInline
function Scoreboard() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  async function run() {
    setError(null);
    try {
      const raw = await fetchViaProxy({ league: 'nba', endpoint: 'scoreboard', params: {} });
      setRows(parseEndpoint('espn', 'scoreboard', raw));
    } catch (e) {
      setError(String(e.message || e));
    }
  }
  return (
    <div>
      <button className="button button--primary button--sm" onClick={run}>Run ▶</button>
      {error && <p>{error}</p>}
      {rows && <Table rows={rows} cols={['short_name', 'date', 'status_type_detail', 'home_score', 'away_score']} max={10} />}
    </div>
  );
}
render(<Scoreboard />);
```

## Transform the rows

Parsed rows are plain objects, so ordinary array methods are the whole toolkit.
Here, margin of victory per game and a league-wide summary from a small frame:

```jsx live noInline
const games = [
  { short_name: 'ORL @ BKN', home_score: '112', away_score: '98' },
  { short_name: 'IND @ MEM', home_score: '136', away_score: '121' },
  { short_name: 'BOS @ CLE', home_score: '115', away_score: '111' },
  { short_name: 'LAL @ UTAH', home_score: '105', away_score: '115' },
];
const withMargin = games.map((g) => ({
  ...g,
  margin: Number(g.home_score) - Number(g.away_score),
  winner: Number(g.home_score) > Number(g.away_score) ? 'home' : 'away',
}));
const homeWins = withMargin.filter((g) => g.winner === 'home').length;
const avgMargin = withMargin.reduce((s, g) => s + Math.abs(g.margin), 0) / withMargin.length;
render(
  <div>
    <p>{homeWins} of {withMargin.length} home wins; average margin {avgMargin.toFixed(1)}</p>
    <Table rows={withMargin} />
  </div>
);
```

When a block grows past a few lines, the [tutorials](/docs/tutorials/) are the
better home: each is a real script with its output frozen from committed
fixtures and an **Open in StackBlitz** button that runs it live.

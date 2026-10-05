---
title: Transport, auth & errors
sidebar_label: Transport & auth
sidebar_position: 11
---

# Transport, auth & errors

Every wrapper — ESPN and flat-API alike — fetches through one runtime core:

1. the **auth provider** for the wrapper's family decorates the request (bearer
   token, API-key header or query param, login cookies);
2. the family's **transport** sends it;
3. a `401` triggers one credential refresh and a retry; network errors and the
   family's retry statuses (by default `403`, `408`, `429`, `500`, `502`, `503`,
   `504`) are retried with exponential backoff + jitter (honouring
   `Retry-After`, default 3 retries, at most 4 of them on statuses);
   auth-gated families such as `nfl_api` never retry a `403`;
4. the outcome is classified into a small error vocabulary.

A **family** is the stem a wrapper belongs to: the ESPN URL families
`site_v2`, `site_v2_alt`, `web_v3`, `core_v2`, or a flat-API stem such as
`mlb`, `mlb_statcast`, `nhl_api_web`, `nfl_api`, `odds_api`, `recruiting`,
`cbs`, `fox`, `yahoo`, `hockeytech`, `torvik`, and the subscription families
`pff_api`, `kenpom`, `nfl_pro` (the keys of `FLAT_HOSTS`).

## Errors

```js
import sdv, { NoDataError, AssetFetchError, SdvError } from 'sportsdataverse';

try {
  const game = await sdv.nba.espnNbaSummary({ event_id: '401585601' });
} catch (err) {
  if (err instanceof NoDataError) {
    // The fetch worked and there is nothing there: HTTP 404, or ESPN's
    // 200 response with a { code: 404 } body.
  } else if (err instanceof AssetFetchError) {
    // The fetch FAILED (403, 429, 5xx, network, retries exhausted).
    // The answer is unknown. Do not record it as "no data".
    console.error(err.status, err.url, err.cause);
  }
}
```

`NoDataError` and `AssetFetchError` are siblings — neither is an instance of the
other — and both extend `SdvError`. `NoESPNDataError` is an alias of
`NoDataError`. Error messages and `err.url` never include the query string, so
keys passed as query parameters are not leaked into logs.

`InvalidParameterError` (also an `SdvError`) means the server rejected the
arguments themselves (a PFF `400` / `422`, NFL Pro's empty `200`): the call can
never succeed as made, so it is neither "no data" nor a failed fetch.

## Retries, timeout, User-Agent

```js
import { configure } from 'sportsdataverse';

configure({ retries: 5, timeoutMs: 60_000, userAgent: 'my-app/1.0' });
```

`retries` is the whole attempt budget. Network errors may use all of it; retry
statuses may use at most 4 retries (`min(retries, 4)`), so a persistent `403`
or `5xx` can't spin the full budget. A status that persists past the cap raises
`AssetFetchError`.

Which statuses are retried is per family. The default set,
`DEFAULT_RETRY_STATUSES`, matches sdv-py and includes `403` because ESPN's
Core v2 API answers `403` under load. A family whose `403` is a real
"forbidden" (an auth-gated API) narrows the set with `registerFamilyDefaults`:

```js
import { registerFamilyDefaults, DEFAULT_RETRY_STATUSES } from 'sportsdataverse';

registerFamilyDefaults('my_family', {
  retryStatuses: DEFAULT_RETRY_STATUSES.filter((s) => s !== 403),
});
```

`nfl_api` ships registered this way.

## Using a proxy

A transport is just an async function from a request to a response. It must
**resolve for every HTTP status** (classification happens in the core) and
reject only when no response arrived. To route everything through an HTTP
proxy with axios:

```js
import axios from 'axios';
import { configure } from 'sportsdataverse';

const viaProxy = async (req) => {
  const res = await axios.request({
    method: req.method,
    url: req.url,
    params: req.query,
    headers: req.headers,
    data: req.body,
    timeout: req.timeoutMs,
    responseType: req.responseType ?? 'json',
    validateStatus: () => true, // never throw on a status
    proxy: { protocol: 'http', host: '127.0.0.1', port: 8080 },
  });
  const headers = Object.fromEntries(
    Object.entries(res.headers).map(([k, v]) => [k.toLowerCase(), String(v)])
  );
  return { status: res.status, headers, data: res.data, url: req.url };
};

configure({ transport: viaProxy });                       // every family without its own registered transport
configure({ transport: { core_v2: viaProxy } });          // just ESPN Core v2
configure({ transport: { default: viaProxy, mlb: other } }); // per family + fallback
```

Transport precedence for a family:

1. your `configure` entry for that family;
2. the transport the family's runtime registers for itself
   (`registerFamilyDefaults`), when the host requires one;
3. your `default` (or bare) transport;
4. the built-in axios transport.

So a generic proxy set as `default` never silently replaces a transport a host
requires, such as the browser-impersonating transport below. To proxy such a
family, configure that family explicitly. The impersonating transport takes a
`proxyUrl`. `resetConfig()` drops everything you configured.

## Browser-impersonating transport

Some hosts (stats.nba.com, stats.wnba.com) fingerprint the TLS handshake and
silently stall non-browser clients. `createImpersonatingTransport` sends
requests with a real browser's TLS / HTTP-2 fingerprint using the optional
[`impit`](https://github.com/apify/impit) package, which ships prebuilt native
binaries for Linux, macOS and Windows (x64 + arm64). Install it alongside
sportsdataverse:

```sh
npm install impit
```

```js
import { configure, createImpersonatingTransport } from 'sportsdataverse';

configure({
  transport: {
    nba_stats: createImpersonatingTransport({ browser: 'chrome' }),
    // with a proxy (HTTP, HTTPS or SOCKS):
    wnba_stats: createImpersonatingTransport({ proxyUrl: 'socks5://127.0.0.1:1080' }),
  },
});
```

Without `impit` installed, a request through this transport rejects with
`TransportUnavailableError` (not retried) naming the install command.

## Keys and logins per family

Auth providers are configured per family. There is deliberately **no
`default` auth**: credentials are only ever sent to the family they belong to.
Values you pass on the call itself (for example a `headers` argument with your
own `Authorization`) win over the configured provider.

```js
import {
  configure, bearerAuth, headerAuth, queryAuth, tokenAuth, sessionAuth,
} from 'sportsdataverse';

// Only configure a family when its key is actually set.
const auth = {};
if (process.env.ODDS_API_KEY) {
  // A key sent as a query parameter (The Odds API's apiKey).
  auth.odds_api = queryAuth({ apiKey: process.env.ODDS_API_KEY });
}
if (process.env.SPORTS247_TOKEN) {
  // A bearer token (247Sports takes your own JWT). A getter is read per request.
  auth.recruiting = bearerAuth(() => process.env.SPORTS247_TOKEN);
}
if (process.env.MY_KEY) {
  // A key sent as a header.
  auth.my_family = headerAuth({ 'X-Api-Key': process.env.MY_KEY });
}
configure({ auth });
```

Empty credentials are never sent. If a `bearerAuth` token (or getter) yields an
empty value, or `tokenAuth`'s `mint` returns an empty token, the call throws
an `SdvError` naming the family before any request goes out. `headerAuth` and
`queryAuth` drop `undefined` or empty values.

**Failures are not retried.** `mint`, `login` and token getters **throw** on
failure. `request()` calls them once per need and never re-submits credentials
in its retry loop. If you want to ride out transient errors there, retry inside
`mint` / `login` yourself. An `SdvError` you throw reaches the caller unchanged.
Anything else becomes `AssetFetchError` with the message
`"<family>: auth failed (apply)"` (or `(refresh)`).

**Minted tokens** — `tokenAuth` calls `mint` once, caches the token in-process,
re-mints `skewSeconds` (default 60) before `expiresAt` (unix epoch **seconds**,
like a JWT `exp`), and re-mints immediately after a `401`. Concurrent requests
share one in-flight mint. `mint` receives the family's transport, which bypasses
auth, so the token call itself is not decorated:

```js
configure({
  auth: {
    my_family: tokenAuth({
      mint: async ({ transport }) => {
        const res = await transport({
          method: 'POST',
          url: 'https://auth.example.com/token',
          body: { client_id: process.env.CLIENT_ID },
        });
        return { token: res.data.access_token, expiresAt: res.data.exp };
      },
      header: 'Authorization', // default
      scheme: 'Bearer',        // default; '' sends the bare token
    }),
  },
});
```

**Logins** — `sessionAuth` logs in once, attaches the returned headers and
cookies to every request, logs in again after `expiresAt`, and re-logs-in after a
`401`. Response headers from a transport are lower-cased, and multiple
`set-cookie` values are joined with a newline:

```js
configure({
  auth: {
    my_site: sessionAuth({
      login: async ({ transport }) => {
        const res = await transport({
          method: 'POST',
          url: 'https://example.com/login',
          body: new URLSearchParams({ email: process.env.EMAIL, password: process.env.PASSWORD }).toString(),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const cookies = Object.fromEntries(
          (res.headers['set-cookie'] ?? '').split('\n').filter(Boolean).map((c) => {
            const pair = c.split(';')[0];
            const eq = pair.indexOf('=');
            return [pair.slice(0, eq), pair.slice(eq + 1)];
          })
        );
        return { cookies };
      },
    }),
  },
});
```

### NFL.com (`nfl_api`)

The `nfl_api` family ships with a registered `tokenAuth` that mints an anonymous
NFL.com web token for you. Override it with environment variables —
`NFL_ACCESS_TOKEN` (used verbatim), or `NFL_CLIENT_KEY` / `NFL_CLIENT_SECRET`
(mint with your own client credentials) — or replace it entirely with
`configure({ auth: { nfl_api: ... } })`.

### Subscription families: PFF, KenPom, NFL Pro

Three families need **your own paid credentials**. Each registers its own auth,
never retries a `403` (there it is an entitlement answer, not load), and is
never reachable from the docs playground. Credentials on the call win over the
environment; with none anywhere the call throws an `SdvError` naming the
variables to set, before any request goes out. Keys, tokens and passwords never
appear in an error message.

**PFF Developer API** (`pff_api`, `sdv.nfl.pffApi*`, 68 wrappers, `api.pff.com`)
needs a PFF Pro API key (`ak_live_…`, created at
<https://www.pff.com/account/api-keys>). The key is taken from, in order: an
`Authorization` header in `headers`, `api_key` on the call, `SDV_PFF_API_KEY`,
then `PFF_API_KEY`.

```js
import sdv, { InvalidParameterError } from 'sportsdataverse';

// PFF_API_KEY is set in the environment
const rows = await sdv.nfl.pffApiFacetPassingSummary({
  league: 'nfl', season: 2022, week: 1, franchise_id: 7, parsed: true,
});
const table = await sdv.nfl.pffApiTeamStats({
  league: 'nfl', season: 2024, category: 'offense-passing', parsed: true,
});
```

- `/v1` query keys are PFF's exact snake_case names (`franchise_id`,
  `game_id`); PFF silently ignores camelCase there. `/v2` routes take
  camelCase keys (`weekGroup`, `weekIds`) and the league in the path.
- A `400` / `422` throws `InvalidParameterError` with PFF's own message (the
  call can never succeed as made). `404` is `NoDataError`. `401` / `403` /
  `429` / `5xx` that outlive the retries are `AssetFetchError`, and so is a
  `200` whose body is not a JSON object.
- A view-only entitlement answers `200` with some columns **removed** and a
  `restricted` list naming them. By default you get the partial body plus a
  `UserWarning`. Pass `strict: true` (or set `SDV_PFF_STRICT=1`) to throw
  `AssetFetchError` instead — do this in pipelines, where a missing column must
  never read as a missing stat.
- The read budget is 100 requests a minute per **account**, shared by every
  client holding the key.

**KenPom** (`kenpom`, `sdv.mbb.kenpom*`, 30 wrappers, `kenpom.com`) logs in
with your subscription e-mail and password: `email` / `password` on the call,
else `KENPOM_EMAIL` / `KENPOM_PW` (also `KENPOM_PASSWORD`, `SDV_KENPOM_EMAIL` /
`SDV_KENPOM_PW`, and hoopR's `KP_USER` / `KP_PW`). The login runs once and the
session is reused for 30 minutes. A login that KenPom rejects throws instead of
quietly scraping the free tables. A `Cookie` in `headers` is used as-is.

```js
import sdv, { hasKenpomLogin, kenpomLogin } from 'sportsdataverse';

if (hasKenpomLogin()) {
  await kenpomLogin(); // optional: check the credentials before a long pull
  const html = await sdv.mbb.kenpomRatings({ year: 2025 });           // raw page HTML
  const tables = await sdv.mbb.kenpomTeam({ team: 'Duke', year: 2025, parsed: true });
  // { report_table: [...], schedule_table: [...], player_table: [...], depth_chart: [...] }
}
```

kenpom.com sits behind a Cloudflare check that answers `403` to Node's own TLS
fingerprint, so the family's default transport is the browser-impersonating
one: install the optional `impit` (`npm install impit`). To add a proxy, set
the family's transport yourself:
`configure({ transport: { kenpom: createImpersonatingTransport({ proxyUrl }) } })`.
`{ parsed: true }` returns every table on the page keyed by its HTML id, with
the same column names as sportsdataverse-py (and hoopR's KenPom tables).

**NFL Pro** (`nfl_pro`, `sdv.nfl.nflPro*`, 16 wrappers, `pro.nfl.com`) serves
the Next Gen Stats tables. Its secured routes need a **user-bound** token
carrying an active NFL+ Premium plan: an `Authorization` header in `headers`,
`token` on the call, or `NFLPRO_TOKEN`. The token's plan and expiry are checked
before any request (`NflProAuthError`). No token is minted for you — an
anonymous or client-credentials token is not user-bound and is refused on every
route. sportsdataverse-py can also obtain the token through a headless-browser
login; to do that in JS, plug your own `tokenAuth({ mint })` in for `nfl_pro`.

```js
// NFLPRO_TOKEN is set in the environment
const body = await sdv.nfl.nflProPlayersOffensePassingSeason({ season: 2024, season_type: 'REG' });
const rows = await sdv.nfl.nflProTeamOffenseOverviewSeason({ season: 2024, parsed: true });
```

Responses are cut off at the page size without saying so. The wrapper pages
on `offset` until it holds the envelope's own `total` rows (`paginate: false`
turns that off, `max_pages` caps it at 40 by default). A capped result carries
`_truncated: true` and emits a warning. An unsupported query parameter comes
back as an empty `200`; that throws `InvalidParameterError`. `week` is a path
scope, not a query parameter.

### stats.nba.com / stats.wnba.com (`nba_stats`, `wnba_stats`)

Both families install `createImpersonatingTransport({ browser: 'chrome' })` as
their default transport, send the stats headers (`x-nba-stats-origin`,
`x-nba-stats-token`, `Referer` / `Origin` on nba.com or wnba.com) and never retry
403. Install the optional dependency (`npm install impit`) and run from a
**residential** connection: these hosts hang (rather than error) on datacenter
and cloud IPs such as GitHub Actions or AWS. A timeout, blank body or bare `{}`
rejects with `AssetFetchError`; it is never reported as "no data". Raise
`configure({ timeoutMs })` for slow historical endpoints, and route through a
residential proxy with
`configure({ transport: { nba_stats: createImpersonatingTransport({ proxyUrl }) } })`.
Live tests: `SDV_NBA_STATS_LIVE=1 npm test` (never set in CI).

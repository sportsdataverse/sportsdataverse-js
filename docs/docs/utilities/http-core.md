---
title: HTTP core
sidebar_label: HTTP core
sidebar_position: 8
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::

# HTTP core

:::info Not data functions
These utilities never fetch a provider payload by themselves — they transform, classify, configure or look things up. The data surface (every `espn*` / native wrapper and `load*` loader) is under [ESPN Reference](/docs/reference/).
:::

Request pipeline, transports, auth providers, family auth helpers and the wrapper / loader type vocabulary.

| Export | kind | module |
|---|---|---|
| [`request`](#request) | function | `src/core/request.ts` |
| [`requestResponse`](#requestresponse) | function | `src/core/request.ts` |
| [`retryDelayMs`](#retrydelayms) | function | `src/core/request.ts` |
| [`jsonBody`](#jsonbody) | function | `src/core/request.ts` |
| [`axiosTransport`](#axiostransport) | const | `src/core/transport.ts` |
| [`createImpersonatingTransport`](#createimpersonatingtransport) | function | `src/core/transport.ts` |
| [`encodeQuery`](#encodequery) | function | `src/core/transport.ts` |
| [`Transport`](#transport) | type | `src/core/transport.ts` |
| [`TransportRequest`](#transportrequest) | type | `src/core/transport.ts` |
| [`TransportResponse`](#transportresponse) | type | `src/core/transport.ts` |
| [`bearerAuth`](#bearerauth) | function | `src/core/auth.ts` |
| [`headerAuth`](#headerauth) | function | `src/core/auth.ts` |
| [`queryAuth`](#queryauth) | function | `src/core/auth.ts` |
| [`tokenAuth`](#tokenauth) | function | `src/core/auth.ts` |
| [`sessionAuth`](#sessionauth) | function | `src/core/auth.ts` |
| [`AuthProvider`](#authprovider) | type | `src/core/auth.ts` |
| [`AuthContext`](#authcontext) | type | `src/core/auth.ts` |
| [`RELEASES_FAMILY`](#releases_family) | const | `src/core/releases.ts` |
| [`ReleaseRow`](#releaserow) | type | `src/core/releases.ts` |
| [`ReleaseColumns`](#releasecolumns) | type | `src/core/releases.ts` |
| [`ReleaseLoaderOptions`](#releaseloaderoptions) | type | `src/core/releases.ts` |
| [`SeasonLoaderOptions`](#seasonloaderoptions) | type | `src/core/releases.ts` |
| [`SeasonLoader`](#seasonloader) | type | `src/core/releases.ts` |
| [`AssetLoader`](#assetloader) | type | `src/core/releases.ts` |
| [`LeagueConfig`](#leagueconfig) | type | `src/core/types.ts` |
| [`EspnFamily`](#espnfamily) | type | `src/core/types.ts` |
| [`Scope`](#scope) | type | `src/core/types.ts` |
| [`WrapperFn`](#wrapperfn) | type | `src/core/types.ts` |
| [`WrapperDef`](#wrapperdef) | type | `src/core/types.ts` |
| [`QueryParam`](#queryparam) | type | `src/core/types.ts` |
| [`PathParam`](#pathparam) | type | `src/core/types.ts` |
| [`Row`](#row) | type | `src/core/types.ts` |
| [`ParserRow`](#parserrow) | type | `src/core/types.ts` |
| [`Wrapper`](#wrapper) | type | `src/core/types.ts` |
| [`SectionedWrapper`](#sectionedwrapper) | type | `src/core/types.ts` |
| [`WrapperParams`](#wrapperparams) | type | `src/core/types.ts` |
| [`NoParams`](#noparams) | type | `src/core/types.ts` |
| [`OptionalParams`](#optionalparams) | type | `src/core/types.ts` |
| [`RequiredParam`](#requiredparam) | type | `src/core/types.ts` |
| [`LeagueParam`](#leagueparam) | type | `src/core/types.ts` |
| [`ParamsArg`](#paramsarg) | type | `src/core/types.ts` |
| [`SnakeToCamel`](#snaketocamel) | type | `src/core/types.ts` |
| [`FLAT_HOSTS`](#flat_hosts) | const | `src/core/client.ts` |
| [`resolveFlat`](#resolveflat) | function | `src/core/client.ts` |
| [`makeLeagueModule`](#makeleaguemodule) | function | `src/core/client.ts` |
| [`makeFlatModule`](#makeflatmodule) | function | `src/core/client.ts` |
| [`nflTokenGen`](#nfltokengen) | function | `src/core/nfl_auth.ts` |
| [`nflHeadersGen`](#nflheadersgen) | function | `src/core/nfl_auth.ts` |
| [`nflClearTokenCache`](#nflcleartokencache) | function | `src/core/nfl_auth.ts` |
| [`jwtExp`](#jwtexp) | function | `src/core/nfl_auth.ts` |
| [`NFL_API_HOST`](#nfl_api_host) | const | `src/core/nfl_auth.ts` |
| [`NflTokenOptions`](#nfltokenoptions) | type | `src/core/nfl_auth.ts` |
| [`resolvePffApiKey`](#resolvepffapikey) | function | `src/core/pff_api_runtime.ts` |
| [`hasKenpomLogin`](#haskenpomlogin) | function | `src/core/pff_api_runtime.ts` |
| [`kenpomLogin`](#kenpomlogin) | function | `src/core/pff_api_runtime.ts` |
| [`kenpomClearSessionCache`](#kenpomclearsessioncache) | function | `src/core/pff_api_runtime.ts` |
| [`nflProToken`](#nflprotoken) | function | `src/core/pff_api_runtime.ts` |
| [`nflProBrowserLogin`](#nflprobrowserlogin) | function | `src/core/pff_api_runtime.ts` |
| [`nflProClearTokenCache`](#nflprocleartokencache) | function | `src/core/pff_api_runtime.ts` |
| [`NflProAuthError`](#nflproautherror) | class | `src/core/pff_api_runtime.ts` |
| [`PlaywrightLike`](#playwrightlike) | type | `src/core/pff_api_runtime.ts` |
| [`sports247ClearTokenCache`](#sports247cleartokencache) | function | `src/core/pff_api_runtime.ts` |

## `src/core/request.ts`

The one request pipeline every wrapper and loader goes through: family config -\> auth -\> transport -\> retry / backoff -\> error classification.

**Import:** `import { … } from 'sportsdataverse/dist/core/request.js'`

### `request`

Fetch through the family's transport + auth and return the body; a non-2xx after retries throws the family's error.

```ts
export async function request(family: string, req: TransportRequest): Promise<unknown>
```

### `requestResponse`

Like `request` but resolves with the whole response (status, headers, data).

```ts
export async function requestResponse( family: string, req: TransportRequest ): Promise<TransportResponse>
```

### `retryDelayMs`

The wait before retry `attempt + 1` — `Retry-After` (capped at 120s) or exponential backoff (0.5s doubling, capped at 4s, jittered).

```ts
export function retryDelayMs(attempt: number, retryAfter?: string): number
```

### `jsonBody`

Decode a JSON-labelled body (sdv-py `_json_body`) — a body that does not decode is a failed fetch.

```ts
export function jsonBody(family: string, res: TransportResponse, url: string): unknown
```


## `src/core/transport.ts`

Transports — the axios default and the browser-impersonating one — plus the query serialiser.

**Import:** `import { … } from 'sportsdataverse'`

### `axiosTransport`

The default transport (axios); never throws on an HTTP status, only on a network failure.

```ts
export const axiosTransport: Transport
```

### `createImpersonatingTransport`

A transport that impersonates a browser's TLS / HTTP-2 fingerprint (optional peer `impit`) for hosts that stall non-browser clients (stats.nba.com).

```ts
export function createImpersonatingTransport( opts: { browser?: string; proxyUrl?: string }
```

**Example:**

```js
import { configure, createImpersonatingTransport } from 'sportsdataverse';
configure({ transport: { nba_stats: createImpersonatingTransport() } });
```

### `encodeQuery`

Serialise a query map — `null` / `undefined` dropped, arrays as repeated keys, a `Date` as ISO-8601 UTC.

```ts
export function encodeQuery(query?: Record<string, unknown>): string
```

### `Transport`

`(req: TransportRequest) =\> Promise\<TransportResponse\>`.

```ts
export type Transport
```

### `TransportRequest`

What a transport receives — method, url, query, headers, body, timeout.

```ts
export interface TransportRequest
```

### `TransportResponse`

What a transport resolves — status, headers, data.

```ts
export interface TransportResponse
```


## `src/core/auth.ts`

Auth providers that decorate a request with credentials — static headers / query, a minted token, a logged-in session.

**Import:** `import { … } from 'sportsdataverse'`

### `bearerAuth`

`Authorization: Bearer \<token\>`; `token` may be an (async) getter.

```ts
export function bearerAuth( token: string | undefined | (()
```

### `headerAuth`

Fixed headers on every request.

```ts
export function headerAuth(headers: Record<string, string | undefined>): AuthProvider
```

### `queryAuth`

Fixed query params on every request (e.g. an `apiKey`).

```ts
export function queryAuth(params: Record<string, unknown>): AuthProvider
```

### `tokenAuth`

A minted token, cached in-process and re-minted before `expiresAt`; concurrent requests share one mint.

```ts
export function tokenAuth(opts:
```

### `sessionAuth`

A logged-in session whose headers and cookies ride on every request; `refresh` logs in again.

```ts
export function sessionAuth(opts:
```

### `AuthProvider`

`apply` decorates a request, `refresh` re-authenticates after a 401; both throw on failure.

```ts
export interface AuthProvider
```

### `AuthContext`

What a provider sees — the family, the request and the previous response.

```ts
export interface AuthContext
```


## `src/core/releases.ts`

The release-asset loader core behind every generated `load*` — parquet download, size guard, decode, the integer-id policy.

**Import:** `import { … } from 'sportsdataverse'`

### `RELEASES_FAMILY`

The transport family of release downloads (`"releases"`).

```ts
export const RELEASES_FAMILY
```

### `ReleaseRow`

A loaded row — `Record\<string, unknown\>`.

```ts
export type ReleaseRow
```

### `ReleaseColumns`

A dataset in column form (`format: "columns"`) for rows of type `R`.

```ts
export type ReleaseColumns<R extends object
```

### `ReleaseLoaderOptions`

`columns`, `format`, `maxCells`, `timeoutMs`.

```ts
export interface ReleaseLoaderOptions
```

### `SeasonLoaderOptions`

The options of a per-season loader — `seasons` plus `ReleaseLoaderOptions`.

```ts
export interface SeasonLoaderOptions extends ReleaseLoaderOptions
```

### `SeasonLoader`

A per-season loader of rows `R` (rows by default, column arrays with `format: "columns"`).

```ts
export interface SeasonLoader<R extends object
```

### `AssetLoader`

A single-asset loader of rows `R`.

```ts
export interface AssetLoader<R extends object
```


## `src/core/types.ts`

The wrapper type vocabulary — league / wrapper defs, the `Wrapper` / `SectionedWrapper` call signatures, params helpers and row types.

**Import:** `import { … } from 'sportsdataverse'`

### `LeagueConfig`

One ESPN league's config — sport / league slugs, prefix, scopes, public shorts.

```ts
export interface LeagueConfig
```

### `EspnFamily`

The ESPN host families — `site_v2` | `site_v2_alt` | `web_v3` | `core_v2` | `fitt_v3` | `cdn`.

```ts
export type EspnFamily
```

### `Scope`

An endpoint's league scope — `universal` | `ncaa` | `football` | `mlb`.

```ts
export type Scope
```

### `WrapperFn`

Any wrapper — `(params?) =\> Promise\<any\>`.

```ts
export type WrapperFn
```

### `WrapperDef`

A generated endpoint definition — family / host / path / params / parser.

```ts
export interface WrapperDef
```

### `QueryParam`

A query param def — name, query key, default, transform.

```ts
export interface QueryParam
```

### `PathParam`

A path param def — name, required, default.

```ts
export interface PathParam
```

### `Row`

A parsed row — `Record\<string, unknown\>`.

```ts
export type Row
```

### `ParserRow`

Alias of `Row` (what every parser returns).

```ts
export type ParserRow
```

### `Wrapper`

A one-table wrapper — the raw payload, or `P` with `parsed: true`.

```ts
export interface Wrapper<P
```

### `SectionedWrapper`

A multi-table wrapper — the raw payload, `P` with `parsed: true`, or one table with `section`.

```ts
export interface SectionedWrapper<P
```

### `WrapperParams`

The untyped params bag.

```ts
export type WrapperParams
```

### `NoParams`

An endpoint with no params.

```ts
export type NoParams
```

### `OptionalParams`

Optional params, each also under its camelCase alias.

```ts
export type OptionalParams<T>
```

### `RequiredParam`

One required param, under its snake or camelCase name.

```ts
export type RequiredParam<K extends string, V>
```

### `LeagueParam`

`\{ league?: string | null \}` — the soccer / cricket league override.

```ts
export type LeagueParam
```

### `ParamsArg`

The params argument tuple — optional when every param is.

```ts
export type ParamsArg<A>
```

### `SnakeToCamel`

`"team_id"` -\> `"teamId"` at the type level.

```ts
export type SnakeToCamel<S extends string>
```


## `src/core/client.ts`

ESPN host roots and the flat-family base URLs.

**Import:** `import { … } from 'sportsdataverse'`

### `FLAT_HOSTS`

Flat family api stem -\> host root.

```ts
export const FLAT_HOSTS: Record<string, string> =
```

### `resolveFlat`

Resolve a flat wrapper def + params to the URL and query it sends.

```ts
export function resolveFlat( def: WrapperDef, params: Record<string, any>
```

### `makeLeagueModule`

Build an ESPN league's wrapper module from a `LeagueConfig` at runtime (the written modules under src/generated/espn/ replace this for the shipped leagues).

```ts
export function makeLeagueModule( cfg: LeagueConfig ): Record<string, WrapperFn>
```

### `makeFlatModule`

Build a flat family's wrapper module from its defs at runtime.

```ts
export function makeFlatModule(defs: WrapperDef[]): Record<string, WrapperFn>
```


## `src/core/nfl_auth.ts`

NFL.com Shield API auth — the token mint behind the `nfl_api` family.

**Import:** `import { … } from 'sportsdataverse'`

### `nflTokenGen`

Mint (or reuse) an NFL.com access token.

```ts
export async function nflTokenGen(opts: NflTokenOptions
```

### `nflHeadersGen`

The authenticated request headers for the NFL.com Shield API.

```ts
export async function nflHeadersGen( token?: string ): Promise<Record<string, string>>
```

### `nflClearTokenCache`

Forget the cached NFL.com token.

```ts
export function nflClearTokenCache(): void
```

### `jwtExp`

The `exp` claim of a JWT (unix seconds), or `undefined`.

```ts
export function jwtExp(token: string): number | null
```

### `NFL_API_HOST`

The NFL.com Shield API host.

```ts
export const NFL_API_HOST
```

### `NflTokenOptions`

Options of `nflTokenGen`.

```ts
export interface NflTokenOptions
```


## `src/core/pff_api_runtime.ts`

Subscription-family helpers beyond the generated wrappers — PFF Developer API, KenPom, NFL Pro, 247Sports.

**Import:** `import { … } from 'sportsdataverse'`

### `resolvePffApiKey`

The PFF API key a call will use — `api_key`, an `Authorization` header, `SDV_PFF_API_KEY`, `PFF_API_KEY`.

```ts
export function resolvePffApiKey(apiKey?: string): string | undefined
```

### `hasKenpomLogin`

Whether KenPom credentials are available (call args or environment).

```ts
export function hasKenpomLogin(): boolean
```

### `kenpomLogin`

Log in to kenpom.com once and cache the session.

```ts
export async function kenpomLogin(opts: { email?: string; password?: string }
```

### `kenpomClearSessionCache`

Forget the cached KenPom session.

```ts
export function kenpomClearSessionCache(): void
```

### `nflProToken`

The NFL Pro bearer token a call will use (argument, `NFLPRO_TOKEN`, or a browser login).

```ts
export async function nflProToken(opts: { token?: string; email?: string; password?: string }
```

### `nflProBrowserLogin`

Log in to NFL Pro with a headless browser (optional `playwright`) and return the token.

```ts
export async function nflProBrowserLogin( email: string, password: string, opts: { playwright?: PlaywrightLike; timeoutMs?: number; deadlineMs?: number }
```

### `nflProClearTokenCache`

Forget the cached NFL Pro token.

```ts
export function nflProClearTokenCache(): void
```

### `NflProAuthError`

NFL Pro could not authenticate (no token, no plan, a failed browser login).

```ts
export class NflProAuthError extends SdvError {}
```

### `PlaywrightLike`

The minimal `playwright` surface `nflProBrowserLogin` needs.

```ts
export interface PlaywrightLike
```

### `sports247ClearTokenCache`

Forget the cached 247Sports guest token.

```ts
export function sports247ClearTokenCache(): void
```


_Generated by tools/codegen/generate.mjs from tools/codegen/utilities.yaml — see [How this library is built](/docs/architecture/hand-written)._

/**
 * Discovery + name->id lookup helpers (port of sdv-py `discover.py` / `find.py`).
 *
 * Everything runs over the JS registries: the merged `sdv` namespace map (built
 * from LEAGUES / WRAPPERS / FLAT_WRAPPERS) and the parser registry, so renamed
 * or newly generated wrappers show up here with no edits.
 *
 * The functions take an optional `ns` (the namespace map, default = the package
 * default export, imported lazily to avoid an import cycle) so they are testable
 * offline with stubbed namespaces.
 */
import { PARSERS } from './parsers/_registry.js';
import { NoDataError, SdvError } from './core/errors.js';
import { UTILITY_CATEGORIES, type UtilityCategory } from './generated/utilities.js';

type Fn = (...a: any[]) => any;
export type Namespaces = Record<string, Record<string, any>>;

/**
 * One row of `listFunctions(…, { detail: true })`: a callable's name, whether it fetches
 * data (`data`: an ESPN / native wrapper, a `load*` loader, a legacy `get*` method) or is a
 * hand-written utility (`utility`: parsers, analytics, odds math, models, producers — the
 * names tools/codegen/utilities.yaml catalogues), and the utility's category.
 */
export interface FunctionEntry {
  name: string;
  kind: 'data' | 'utility';
  category?: UtilityCategory;
}

/** Label a callable: `utility` + its category when the utilities table lists it, else `data`. */
function classify(name: string): FunctionEntry {
  const category = UTILITY_CATEGORIES[name];
  return category ? { name, kind: 'utility', category } : { name, kind: 'data' };
}

const toCamel = (s: string): string => s.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

async function defaultNs(): Promise<Namespaces> {
  return (await import('./index.js')).default as Namespaces;
}

/**
 * Function names in one namespace. Approximation: a name is hidden when it equals toCamel() of
 * a snake_case sibling (the generated twin pairs); a hand-written camelCase method that happens
 * to collide with such a name would be hidden too.
 */
function listNamespace(mod: Record<string, any>): string[] {
  const keys = Object.keys(mod).filter((k) => typeof mod[k] === 'function');
  const twins = new Set(keys.filter((k) => k.includes('_')).map(toCamel));
  return keys.filter((k) => !twins.has(k) || k.includes('_')).sort();
}

export interface ListFunctionsOptions {
  /** Case-insensitive substring filter. */
  search?: string;
  /**
   * Only parser functions. Returns the flat parser registry (`PARSERS` keys): JS parsers have no
   * league association, so `league` is ignored when this is set.
   */
  parsersOnly?: boolean;
  /** Exclude `parse_*` names. */
  wrappersOnly?: boolean;
  /**
   * Return {@link FunctionEntry} rows (`{ name, kind, category? }`) instead of bare names:
   * `kind` is `utility` for a hand-written non-data export (tools/codegen/utilities.yaml),
   * `data` for everything else.
   */
  detail?: boolean;
}

/**
 * Index of callable functions. With `league` returns a sorted name array;
 * without, an object keyed by namespace (empty namespaces omitted). With
 * `detail: true` each name is a {@link FunctionEntry} (`kind: 'data' | 'utility'` + category).
 *
 * @param league - one namespace (`'nba'`, `'odds'`, …), or `null` / omitted for every namespace.
 * @param opts - `search` (case-insensitive substring), `parsersOnly` / `wrappersOnly`, `detail`.
 * @param ns - the namespace map to index (default: the package default export; injectable for tests).
 * @returns Names (or entries) for one namespace, or an object keyed by namespace.
 * @throws Error on an unknown league, or when `parsersOnly` and `wrappersOnly` are both set.
 * @example
 * const rosterFns = await listFunctions('nba', { search: 'roster' });
 * const typed = await listFunctions('odds', { detail: true }); // [{ name: 'devig_shin', kind: 'utility', category: 'odds' }, …]
 */
export async function listFunctions(
  league: string | null | undefined,
  opts: ListFunctionsOptions & { detail: true },
  ns?: Namespaces,
): Promise<FunctionEntry[] | Record<string, FunctionEntry[]>>;
export async function listFunctions(
  league?: string | null,
  opts?: ListFunctionsOptions,
  ns?: Namespaces,
): Promise<string[] | Record<string, string[]>>;
export async function listFunctions(
  league?: string | null,
  opts: ListFunctionsOptions = {},
  ns?: Namespaces,
): Promise<string[] | Record<string, string[]> | FunctionEntry[] | Record<string, FunctionEntry[]>> {
  const { search, parsersOnly = false, wrappersOnly = false, detail = false } = opts;
  if (parsersOnly && wrappersOnly) throw new Error('parsersOnly and wrappersOnly are mutually exclusive');
  const needle = (search ?? '').toLowerCase();
  const filter = (names: string[]): string[] => {
    let out = names;
    if (needle) out = out.filter((n) => n.toLowerCase().includes(needle));
    if (parsersOnly) out = out.filter((n) => n.startsWith('parse_'));
    if (wrappersOnly) out = out.filter((n) => !n.startsWith('parse_'));
    return out;
  };
  const shape = (names: string[]): string[] | FunctionEntry[] => (detail ? names.map(classify) : names);
  if (parsersOnly) return shape(filter(Object.keys(PARSERS).sort()));
  const space = ns ?? (await defaultNs());
  if (league != null) {
    const key = league.toLowerCase();
    if (!(key in space)) {
      throw new Error(`Unknown league '${key}'. Choose one of ${Object.keys(space).sort().join(', ')}.`);
    }
    return shape(filter(listNamespace(space[key])));
  }
  const out: Record<string, string[] | FunctionEntry[]> = {};
  for (const [k, mod] of Object.entries(space)) {
    const names = filter(listNamespace(mod));
    if (names.length) out[k] = shape(names);
  }
  return out as Record<string, string[]> | Record<string, FunctionEntry[]>;
}

/** Count of callable functions per namespace, or in one namespace. */
export async function functionCount(
  league?: string | null,
  ns?: Namespaces,
): Promise<number | Record<string, number>> {
  if (league != null) return ((await listFunctions(league, {}, ns)) as string[]).length;
  const all = (await listFunctions(null, {}, ns)) as Record<string, string[]>;
  return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.length]));
}

// ---------------------------------------------------------------------------
// find_* : name -> ESPN id resolvers (raw ESPN JSON, matches py's return_parsed=False)
// ---------------------------------------------------------------------------

// Keyed by namespace identity (an injected namespace never shares a default's teams), then league.
// Holds the in-flight PROMISE so concurrent first calls share one fetch; evicted on rejection.
const TEAM_CACHE = new WeakMap<object, Map<string, Promise<any[]>>>();
const TEAM_CACHE_MAPS = new Set<WeakRef<Map<string, Promise<any[]>>>>();

function leagueFns(space: Namespaces, league: string) {
  const l = league.toLowerCase();
  const m = space[l];
  const teams = m?.[`espn_${l}_teams_site`] as Fn | undefined;
  const scoreboard = m?.[`espn_${l}_scoreboard`] as Fn | undefined;
  const roster = m?.[`espn_${l}_team_roster`] as Fn | undefined;
  if (!teams || !scoreboard || !roster) {
    const ok = Object.keys(space).filter((k) => space[k][`espn_${k}_teams_site`]).sort();
    throw new Error(`Unknown league '${l}'. Choose one of ${ok.join(', ')}.`);
  }
  return { l, teams, scoreboard, roster };
}

function matches(needle: string | undefined, ...fields: Array<string | null | undefined>): boolean {
  const n = (needle ?? '').trim().toLowerCase();
  if (!n) return false;
  return fields.some((f) => f && String(f).toLowerCase().includes(n));
}

async function listTeams(league: string, ns?: Namespaces): Promise<any[]> {
  const space = ns ?? (await defaultNs());
  const { l, teams } = leagueFns(space, league);
  let byLeague = TEAM_CACHE.get(space);
  if (!byLeague) {
    byLeague = new Map();
    TEAM_CACHE.set(space, byLeague);
    TEAM_CACHE_MAPS.add(new WeakRef(byLeague));
  }
  const hit = byLeague.get(l);
  if (hit) return hit;
  const pending = (async () => {
    const payload = await teams({});
    const raw = payload?.sports?.[0]?.leagues?.[0]?.teams ?? [];
    return raw.map((t: any) => t?.team ?? {}).filter((t: any) => Object.keys(t).length);
  })();
  byLeague.set(l, pending);
  pending.catch(() => {
    if (byLeague!.get(l) === pending) byLeague!.delete(l);
  });
  return pending;
}

/** Resolve a team name/abbreviation (case-insensitive substring) to ESPN team metadata. `multi` returns all matches. */
export async function findTeam(
  name: string,
  league: string,
  opts: { multi?: boolean } = {},
  ns?: Namespaces,
): Promise<any> {
  const teams = await listTeams(league, ns);
  const hits = teams.filter((t) =>
    matches(name, t.displayName, t.location, t.shortDisplayName, t.name, t.abbreviation, t.nickname),
  );
  return opts.multi ? hits : (hits[0] ?? null);
}

/** Resolve an athlete name via team rosters (pass `team` for one fast call). Entries gain `team_id` + `team_display_name`. */
export async function findAthlete(
  name: string,
  league: string,
  opts: { team?: string; multi?: boolean } = {},
  ns?: Namespaces,
): Promise<any> {
  const space = ns ?? (await defaultNs());
  const { l, roster } = leagueFns(space, league);
  let candidates: any[];
  if (opts.team != null) {
    const t = await findTeam(opts.team, l, {}, space);
    candidates = t ? [t] : [];
  } else candidates = await listTeams(l, space);
  const hits: any[] = [];
  for (const t of candidates) {
    if (t.id == null) continue;
    let payload: any;
    try {
      payload = await roster({ team_id: t.id });
    } catch (e) {
      // Only "no roster here" skips a team; a FAILED fetch (403/429/5xx) must surface,
      // never masquerade as "athlete not found".
      if (e instanceof NoDataError) continue;
      throw e;
    }
    const flat: any[] = [];
    for (const entry of payload?.athletes ?? []) {
      if (!entry || typeof entry !== 'object') continue;
      if (Array.isArray(entry.items)) {
        for (const p of entry.items) if (p && typeof p === 'object') flat.push({ ...p, position_group: entry.position });
      } else flat.push(entry);
    }
    for (const a of flat) {
      if (matches(name, a.fullName, a.displayName, a.shortName, a.firstName, a.lastName)) {
        const hit = { ...a, team_id: t.id, team_display_name: t.displayName };
        if (!opts.multi) return hit;
        hits.push(hit);
      }
    }
  }
  return opts.multi ? hits : (hits[0] ?? null);
}

/** Resolve a game on a date (`YYYYMMDD` or `YYYY-MM-DD`) to its ESPN event, optionally filtered by home/away team. */
export async function findEvent(
  date: string,
  league: string,
  opts: { home?: string; away?: string; multi?: boolean } = {},
  ns?: Namespaces,
): Promise<any> {
  const space = ns ?? (await defaultNs());
  const { scoreboard } = leagueFns(space, league);
  const ymd = String(date).replace(/-/g, '');
  if (!/^\d{8}$/.test(ymd)) throw new SdvError(`Invalid date '${date}': expected YYYYMMDD or YYYY-MM-DD.`);
  const payload = await scoreboard({ dates: parseInt(ymd, 10) });
  const label = (c: any) =>
    [c?.team?.displayName, c?.team?.location, c?.team?.abbreviation, c?.team?.name].filter(Boolean).join(' ');
  const hits: any[] = [];
  for (const ev of payload?.events ?? []) {
    const cs: any[] = ev?.competitions?.[0]?.competitors ?? [];
    const h = cs.find((c) => c.homeAway === 'home') ?? {};
    const a = cs.find((c) => c.homeAway === 'away') ?? {};
    if (opts.home && !matches(opts.home, label(h))) continue;
    if (opts.away && !matches(opts.away, label(a))) continue;
    if (!opts.multi) return ev;
    hits.push(ev);
  }
  return opts.multi ? hits : (hits[0] ?? null);
}

/** Reset the in-process team-list cache (one league, or all). */
export function clearTeamCache(league?: string): void {
  for (const ref of TEAM_CACHE_MAPS) {
    const m = ref.deref();
    if (!m) TEAM_CACHE_MAPS.delete(ref);
    else if (league == null) m.clear();
    else m.delete(league.toLowerCase());
  }
}

// py snake_case names
export const list_functions = listFunctions;
export const function_count = functionCount;
export const find_team = findTeam;
export const find_athlete = findAthlete;
export const find_event = findEvent;
export const clear_team_cache = clearTeamCache;

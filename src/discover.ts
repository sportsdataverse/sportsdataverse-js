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

type Fn = (...a: any[]) => any;
export type Namespaces = Record<string, Record<string, any>>;

const toCamel = (s: string): string => s.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

async function defaultNs(): Promise<Namespaces> {
  return (await import('./index.js')).default as Namespaces;
}

/** Function names in one namespace, hiding the camelCase twin of every snake_case name. */
function listNamespace(mod: Record<string, any>): string[] {
  const keys = Object.keys(mod).filter((k) => typeof mod[k] === 'function');
  const twins = new Set(keys.filter((k) => k.includes('_')).map(toCamel));
  return keys.filter((k) => !twins.has(k) || k.includes('_')).sort();
}

export interface ListFunctionsOptions {
  /** Case-insensitive substring filter. */
  search?: string;
  /** Only parser functions (`parse_*`, from the parser registry; league ignored). */
  parsersOnly?: boolean;
  /** Exclude `parse_*` names. */
  wrappersOnly?: boolean;
}

/**
 * Index of callable functions. With `league` returns a sorted name array;
 * without, an object keyed by namespace (empty namespaces omitted).
 * Throws on an unknown league or when `parsersOnly` and `wrappersOnly` are both set.
 */
export async function listFunctions(
  league?: string | null,
  opts: ListFunctionsOptions = {},
  ns?: Namespaces,
): Promise<string[] | Record<string, string[]>> {
  const { search, parsersOnly = false, wrappersOnly = false } = opts;
  if (parsersOnly && wrappersOnly) throw new Error('parsersOnly and wrappersOnly are mutually exclusive');
  const needle = (search ?? '').toLowerCase();
  const filter = (names: string[]): string[] => {
    let out = names;
    if (needle) out = out.filter((n) => n.toLowerCase().includes(needle));
    if (parsersOnly) out = out.filter((n) => n.startsWith('parse_'));
    if (wrappersOnly) out = out.filter((n) => !n.startsWith('parse_'));
    return out;
  };
  if (parsersOnly) return filter(Object.keys(PARSERS).sort());
  const space = ns ?? (await defaultNs());
  if (league != null) {
    const key = league.toLowerCase();
    if (!(key in space)) {
      throw new Error(`Unknown league '${key}'. Choose one of ${Object.keys(space).sort().join(', ')}.`);
    }
    return filter(listNamespace(space[key]));
  }
  const out: Record<string, string[]> = {};
  for (const [k, mod] of Object.entries(space)) {
    const names = filter(listNamespace(mod));
    if (names.length) out[k] = names;
  }
  return out;
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

const TEAM_CACHE = new Map<string, any[]>();

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
  if (TEAM_CACHE.has(l)) return TEAM_CACHE.get(l)!;
  const payload = await teams({});
  const raw = payload?.sports?.[0]?.leagues?.[0]?.teams ?? [];
  const flat = raw.map((t: any) => t?.team ?? {}).filter((t: any) => Object.keys(t).length);
  TEAM_CACHE.set(l, flat);
  return flat;
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
    } catch {
      continue; // py parity: a failing roster fetch skips that team
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
  const payload = await scoreboard({ dates: parseInt(String(date).replace(/-/g, ''), 10) });
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
  if (league == null) TEAM_CACHE.clear();
  else TEAM_CACHE.delete(league.toLowerCase());
}

// py snake_case names
export const list_functions = listFunctions;
export const function_count = functionCount;
export const find_team = findTeam;
export const find_athlete = findAthlete;
export const find_event = findEvent;
export const clear_team_cache = clearTeamCache;

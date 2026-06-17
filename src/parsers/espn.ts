// Parsers for the ESPN cross-league wrapper surface. A faithful TypeScript port
// of `sportsdataverse/_common_espn_parsers.py` — the dedicated + generic +
// 21-section-summary-dispatcher parser layer that turns the raw ESPN payloads
// (Site v2 / Site v2 alt / Web v3 / Core v2 / Core v3) into tidy rectangular
// rows.
//
// Same contract as the native flat-API parsers (mlb_api.ts, nhl_api_web.ts):
//
//   - every parser is `(payload: any) => Record<string, any>[]` (the JS analogue
//     of a polars frame — an array of flat row objects);
//   - empty / malformed / null payloads return `[]` instead of throwing, so
//     callers can chain without null-checks (mirrors each Python `_empty_frame`);
//   - column keys are deep-flattened (`_`) and snake_cased by funnelling the
//     extracted row list through `normalize()` (the `pd.json_normalize(sep="_")`
//     + `_snake_columns` equivalent).
//
// Each parser preserves the bespoke extraction logic of its Python original
// (which nested arrays it unrolls, the join keys it adds like `drive_id` /
// `drive_sequence`, the scalar+list hybrid columns, computed/literal columns).
// There is no `return_as_pandas` flag (JS has no pandas); the polars idioms
// (`pl.DataFrame(rows)`, `with_columns`, `pl.lit`) collapse to plain object ops.

import { normalize, snakeCase } from "./_normalize.js";
import type { ParserFn } from "./_registry.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Is `v` a scalar (string | number | boolean) or null/undefined? */
function isScalar(v: any): boolean {
  return (
    v === null ||
    v === undefined ||
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  );
}

// ===========================================================================
// 1. Scoreboard
// ===========================================================================

/** Flatten one ESPN scoreboard event into a single row keyed by game_id. */
function scoreboardEventParsing(event: any): Record<string, any> {
  const comp = (event.competitions || [{}])[0] || {};
  const competitors = comp.competitors || [];
  const home = competitors.find((c: any) => c?.homeAway === "home") || {};
  const away = competitors.find((c: any) => c?.homeAway === "away") || {};
  const status = (event.status || {}).type || {};
  const venue = comp.venue || {};
  const notes = comp.notes || [];
  const noteText = notes.length ? notes[0].headline || "" : "";

  const team = (side: any): Record<string, any> => {
    const t = side.team || {};
    const logos = t.logos;
    return {
      id: t.id,
      name: t.name,
      abbreviation: t.abbreviation,
      display_name: t.displayName,
      location: t.location,
      color: t.color,
      alternate_color: t.alternateColor,
      logo: logos && logos.length ? (logos[0] || {}).href : t.logo,
      score: side.score,
      winner: side.winner,
      home_away: side.homeAway,
      rank: (side.curatedRank || {}).current,
    };
  };

  const h = team(home);
  const a = team(away);
  const season = event.season || {};
  const eventStatus = event.status || {};
  const address = venue.address || {};
  const broadcast = (comp.broadcasts || [])
    .map((b: any) => (b.names && b.names.length ? b.names[0] : b.market || ""))
    .join(", ");

  return {
    game_id: event.id,
    uid: event.uid,
    date: event.date,
    name: event.name,
    short_name: event.shortName,
    season_year: season.year,
    season_type: season.type,
    season_slug: season.slug,
    status_type_id: status.id,
    status_type_name: status.name,
    status_type_state: status.state,
    status_type_completed: status.completed,
    status_type_description: status.description,
    status_type_detail: status.detail,
    status_type_short_detail: status.shortDetail,
    status_clock: eventStatus.clock,
    status_display_clock: eventStatus.displayClock,
    status_period: eventStatus.period,
    neutral_site: comp.neutralSite,
    conference_competition: comp.conferenceCompetition,
    attendance: comp.attendance,
    venue_id: venue.id,
    venue_full_name: venue.fullName,
    venue_city: address.city,
    venue_state: address.state,
    venue_indoor: venue.indoor,
    broadcast,
    note: noteText,
    home_id: h.id,
    home_name: h.name,
    home_abbreviation: h.abbreviation,
    home_display_name: h.display_name,
    home_location: h.location,
    home_color: h.color,
    home_alternate_color: h.alternate_color,
    home_logo: h.logo,
    home_score: h.score,
    home_winner: h.winner,
    home_rank: h.rank,
    away_id: a.id,
    away_name: a.name,
    away_abbreviation: a.abbreviation,
    away_display_name: a.display_name,
    away_location: a.location,
    away_color: a.color,
    away_alternate_color: a.alternate_color,
    away_logo: a.logo,
    away_score: a.score,
    away_winner: a.winner,
    away_rank: a.rank,
  };
}

/** Parse a scoreboard response into one row per event (from `events[]`). */
export function parse_scoreboard(payload: any): Record<string, any>[] {
  if (!payload) return [];
  const events = payload.events || [];
  if (!events.length) return [];
  return normalize(events.map((ev: any) => scoreboardEventParsing(ev)));
}

// ===========================================================================
// 2. Teams (site v2)
// ===========================================================================

/**
 * Parse a site-v2 teams response into one row per team
 * (`sports[0].leagues[0].teams[]`, with `items`/`teams` Core v2 fallbacks).
 */
export function parse_teams(payload: any): Record<string, any>[] {
  if (!payload) return [];
  try {
    const sports = payload.sports || [];
    let teamsRaw: any[];
    if (sports.length) {
      const leagues = (sports[0] || {}).leagues || [];
      teamsRaw = leagues.length ? (leagues[0] || {}).teams || [] : [];
    } else {
      teamsRaw = payload.items || payload.teams || [];
    }
    if (!teamsRaw.length) return [];

    const drop = new Set(["record", "links", "nextEvent", "standingSummary"]);
    const cleaned = teamsRaw.map((entry: any) => {
      const t = { ...(entry.team || entry) };
      for (const k of drop) delete t[k];
      return { team: t };
    });
    return normalize(cleaned);
  } catch {
    return [];
  }
}

// ===========================================================================
// 3. Standings (alt v2)
// ===========================================================================

/** Recursively flatten standings entries from a `children[]` list. */
function extractStandingEntries(
  children: any[],
  parentName = "",
  parentAbbreviation = ""
): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  for (const child of children) {
    const groupName = child.name || parentName;
    const groupAbbr = child.abbreviation || parentAbbreviation;
    const entries = (child.standings || {}).entries || [];
    if (entries.length) {
      for (const entry of entries) {
        const team = entry.team || {};
        const statsList = entry.stats || [];
        const row: Record<string, any> = {
          group_name: groupName,
          group_abbreviation: groupAbbr,
          team_id: team.id,
          team_name: team.name,
          team_abbreviation: team.abbreviation,
          team_display_name: team.displayName,
          team_location: team.location,
          team_logo: team.logo,
        };
        for (const stat of statsList) {
          const col = snakeCase(stat.name || stat.abbreviation || "");
          row[col] = stat.value;
        }
        rows.push(row);
      }
    }
    const sub = child.children || [];
    if (sub.length) {
      rows.push(...extractStandingEntries(sub, groupName, groupAbbr));
    }
  }
  return rows;
}

/** Parse a standings (alt v2) response into one row per team entry. */
export function parse_standings(payload: any): Record<string, any>[] {
  if (!payload) return [];
  let children = payload.children || [];
  if (!children.length) {
    const entries = (payload.standings || {}).entries || [];
    if (entries.length) children = [payload];
  }
  if (!children.length) return [];
  const rows = extractStandingEntries(children);
  if (!rows.length) return [];
  return normalize(rows);
}

// ===========================================================================
// 4. Groups (conferences/divisions)
// ===========================================================================

/** Recursively flatten a groups list. */
function flattenGroups(groups: any[], parentId = "", depth = 0): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  for (const g of groups) {
    const children = g.children || [];
    const groupId = g.id || g.groupId;
    const row: Record<string, any> = {
      group_id: groupId,
      name: g.name,
      abbreviation: g.abbreviation || g.abbrev,
      short_name: g.shortName,
      is_conference: g.isConference !== undefined ? g.isConference : depth === 0,
      parent_group_id: parentId || null,
      depth,
      children_count: children.length,
    };
    rows.push(row);
    if (children.length) {
      rows.push(...flattenGroups(children, (groupId || "") as string, depth + 1));
    }
  }
  return rows;
}

/** Parse a groups response into one row per group (conference/division). */
export function parse_groups(payload: any): Record<string, any>[] {
  if (!payload) return [];
  let groups: any[];
  try {
    const sports = payload.sports || [];
    if (sports.length) {
      const leagues = (sports[0] || {}).leagues || [];
      groups = leagues.length ? (leagues[0] || {}).groups || [] : [];
    } else {
      groups = payload.groups || [];
    }
  } catch {
    groups = [];
  }
  if (!groups.length) return [];
  const rows = flattenGroups(groups);
  if (!rows.length) return [];
  return normalize(rows);
}

// ===========================================================================
// 5. Athlete overview
// ===========================================================================

/** Parse an athlete overview response into one row per stats split. */
export function parse_athlete_overview(payload: any): Record<string, any>[] {
  if (!payload) return [];
  const athlete = payload.athlete || {};
  const bio = {
    athlete_id: athlete.id,
    athlete_display_name: athlete.displayName,
    athlete_short_name: athlete.shortName,
    athlete_position: (athlete.position || {}).abbreviation,
    athlete_jersey: athlete.jersey,
    athlete_team_id: (athlete.team || {}).id,
    athlete_team_abbreviation: (athlete.team || {}).abbreviation,
  };

  const statistics = payload.statistics || {};
  const splits = statistics.splits || [];

  const rows: Record<string, any>[] = [];
  for (const split of splits) {
    const labels: string[] = statistics.labels || split.labels || [];
    const names: string[] = statistics.names || split.names || labels;
    const stats: any[] = split.stats || [];
    const row: Record<string, any> = { ...bio };
    row.split_name = split.name || split.displayName;
    row.split_category = split.category;
    stats.forEach((val, i) => {
      const col = i < names.length ? snakeCase(names[i]) : `stat_${i}`;
      row[col] = val;
    });
    rows.push(row);
  }

  if (!rows.length) {
    // Fallback: flatten whatever is in the payload as a single row.
    return normalize([payload]);
  }
  return normalize(rows);
}

// ===========================================================================
// 6. Athlete stats
// ===========================================================================

/** Parse an athlete stats response into one row per (category × split). */
export function parse_athlete_stats(payload: any): Record<string, any>[] {
  if (!payload) return [];
  let categories = payload.categories || [];
  if (!categories.length) {
    const labels = payload.labels || [];
    const splits = payload.splits || [];
    if (labels.length && splits.length) {
      categories = [{ labels, splits, name: "default" }];
    }
  }
  if (!categories.length) {
    return normalize([payload]);
  }

  const rows: Record<string, any>[] = [];
  for (const cat of categories) {
    const catName = cat.name || cat.displayName || "";
    const labels: string[] = cat.labels || cat.names || [];
    const names: string[] = cat.names || labels;
    const splits = cat.splits || [];
    for (const split of splits) {
      const stats: any[] = split.stats || [];
      const row: Record<string, any> = {
        category: catName,
        split_name: split.name || split.displayName,
        split_category: split.category,
        split_value: split.value,
      };
      stats.forEach((val, i) => {
        const col = i < names.length ? snakeCase(names[i]) : `stat_${i}`;
        row[col] = val;
      });
      rows.push(row);
    }
  }
  if (!rows.length) return [];
  return normalize(rows);
}

// ===========================================================================
// 7. Athlete gamelog
// ===========================================================================

/** Parse an athlete gamelog response into one row per game. */
export function parse_athlete_gamelog(payload: any): Record<string, any>[] {
  if (!payload) return [];
  let seasonTypes = payload.seasonTypes || [];
  if (!seasonTypes.length) {
    const events = payload.events || [];
    if (events.length) {
      seasonTypes = [{ id: null, name: null, categories: [{ name: null, events }] }];
    }
  }

  const rows: Record<string, any>[] = [];
  for (const st of seasonTypes) {
    const stId = st.id;
    const stName = st.name || st.displayName;
    const categories = st.categories || [];
    for (const cat of categories) {
      const catName = cat.name || cat.displayName;
      const labels: string[] = cat.labels || cat.names || [];
      const names: string[] = cat.names || labels;
      const events = cat.events || [];
      for (const ev of events) {
        const eventRef = ev.eventId || ev.id || (ev.event || {}).id;
        const opp = ev.opponent || {};
        const row: Record<string, any> = {
          season_type_id: stId,
          season_type_name: stName,
          category: catName,
          event_id: eventRef,
          event_date: ev.date,
          home_away: ev.homeAway,
          score: ev.score,
          opponent_id: opp.id,
          opponent_abbreviation: opp.abbreviation,
          opponent_display_name: opp.displayName,
          game_result: ev.gameResult,
          game_processed: ev.gameProcessed,
        };
        const stats: any[] = ev.stats || [];
        stats.forEach((val, i) => {
          const col = i < names.length ? snakeCase(names[i]) : `stat_${i}`;
          row[col] = val;
        });
        rows.push(row);
      }
    }
  }
  if (!rows.length) return [];
  return normalize(rows);
}

// ===========================================================================
// 8. Athlete splits
// ===========================================================================

/** Parse an athlete splits response into one row per split. */
export function parse_athlete_splits(payload: any): Record<string, any>[] {
  if (!payload) return [];
  const categories = payload.categories || [];
  const rows: Record<string, any>[] = [];

  for (const cat of categories) {
    const catName = cat.name || cat.displayName || "";
    const labels: string[] = cat.labels || cat.names || [];
    const names: string[] = cat.names || labels;
    const splits = cat.splits || [];
    for (const split of splits) {
      const stats: any[] = split.stats || [];
      const row: Record<string, any> = {
        category: catName,
        split_name: split.name || split.displayName,
        split_abbreviation: split.abbreviation,
        split_category: split.category,
        split_value: split.value,
        split_description: split.description,
      };
      stats.forEach((val, i) => {
        const col = i < names.length ? snakeCase(names[i]) : `stat_${i}`;
        row[col] = val;
      });
      rows.push(row);
    }
  }

  if (!rows.length) {
    return normalize([payload]);
  }
  return normalize(rows);
}

// ===========================================================================
// 9. Leaders (statistics/byathlete)
// ===========================================================================

/** Parse a statistics-by-athlete leaderboard into one row per athlete. */
export function parse_leaders(payload: any): Record<string, any>[] {
  if (!payload) return [];

  const categories = payload.categories || [];
  const rows: Record<string, any>[] = [];

  for (const cat of categories) {
    const catName = cat.name || cat.displayName || "";
    const labels: string[] = cat.labels || cat.names || [];
    const names: string[] = cat.names || labels;
    const leaders = cat.leaders || [];
    for (const leader of leaders) {
      const athlete = leader.athlete || {};
      const team = leader.team || {};
      const row: Record<string, any> = {
        category: catName,
        rank: leader.rank,
        athlete_id: athlete.id,
        athlete_display_name: athlete.displayName,
        athlete_short_name: athlete.shortName,
        athlete_jersey: athlete.jersey,
        athlete_position: (athlete.position || {}).abbreviation,
        team_id: team.id,
        team_abbreviation: team.abbreviation,
        team_display_name: team.displayName,
      };
      const stats: any[] = leader.stats || [];
      stats.forEach((val, i) => {
        let col: string;
        if (i < names.length) col = snakeCase(names[i]);
        else if (labels.length && i < labels.length) col = snakeCase(labels[i]);
        else col = `stat_${i}`;
        row[col] = val;
      });
      rows.push(row);
    }
  }

  if (!rows.length) {
    return normalize([payload]);
  }
  return normalize(rows);
}

// ===========================================================================
// 10. Coaches (season-scoped)
// ===========================================================================

/**
 * Flatten only scalar fields + one level of nested-scalar fields from an item.
 * Mirrors the Python "scalar / one-deep dict" flattening used by several
 * Core v2 parsers (coaches, event competitor roster, linescores).
 */
function flattenScalarOneDeep(item: any): Record<string, any> {
  const row: Record<string, any> = {};
  for (const [k, v] of Object.entries(item)) {
    if (isScalar(v)) {
      row[k] = v;
    } else if (isPlainObject(v)) {
      for (const [k2, v2] of Object.entries(v as Record<string, any>)) {
        if (isScalar(v2)) row[`${k}_${k2}`] = v2;
      }
    }
  }
  return row;
}

/** Parse a season coaches response into one row per coach (from `items[]`). */
export function parse_coaches(payload: any): Record<string, any>[] {
  if (!payload) return [];
  const items = payload.items || payload.coaches || [];
  if (!items.length) return [];
  const rows = items.map((item: any) => flattenScalarOneDeep(item));
  if (!rows.length) {
    return normalize(items);
  }
  return normalize(rows);
}

// ===========================================================================
// 11. Draft
// ===========================================================================

/** Parse a draft response into one row per pick (from `rounds[].picks[]`). */
export function parse_draft(payload: any): Record<string, any>[] {
  if (!payload) return [];
  const rounds = payload.rounds || [];
  let allPicks: any[] = [];

  if (rounds.length) {
    for (const rnd of rounds) {
      const roundNum = rnd.number || rnd.round;
      const picks = rnd.picks || rnd.items || [];
      for (const pick of picks) {
        const p = { ...pick };
        if (p.round_number === undefined) p.round_number = roundNum;
        allPicks.push(p);
      }
    }
  } else {
    allPicks = payload.picks || payload.items || [];
  }

  if (!allPicks.length) return [];
  return normalize(allPicks);
}

// ===========================================================================
// 12. Event competitor roster
// ===========================================================================

/** Parse an event competitor roster into one row per athlete. */
export function parse_event_competitor_roster(payload: any): Record<string, any>[] {
  if (!payload) return [];
  const entries = payload.entries || payload.items || [];
  if (!entries.length) return [];

  const rows: Record<string, any>[] = [];
  for (const entry of entries) {
    const athlete = entry.athlete || entry;
    const row = flattenScalarOneDeep(athlete);
    // Also carry entry-level metadata (status, active, etc.) without overriding.
    for (const k of ["active", "starter", "didNotPlay", "ejected", "playingTime"]) {
      if (k in entry && !(k in row)) row[k] = entry[k];
    }
    rows.push(row);
  }

  if (!rows.length) {
    return normalize(entries);
  }
  return normalize(rows);
}

// ===========================================================================
// 13. Event competitor statistics
// ===========================================================================

/** Parse event competitor statistics into one row per stat. */
export function parse_event_competitor_statistics(payload: any): Record<string, any>[] {
  if (!payload) return [];
  let splits = payload.splits || [];
  if (!splits.length) {
    const cats = payload.categories || [];
    if (cats.length) splits = [{ name: null, categories: cats }];
  }

  const rows: Record<string, any>[] = [];
  for (const split of splits) {
    const splitName = split.name || split.displayName;
    const categories = split.categories || [];
    for (const cat of categories) {
      const catName = cat.name || cat.displayName;
      const stats = cat.stats || [];
      for (const stat of stats) {
        rows.push({
          split_name: splitName,
          category_name: catName,
          stat_name: stat.name,
          stat_abbreviation: stat.abbreviation,
          stat_value: stat.value,
          stat_display_value: stat.displayValue,
          stat_description: stat.description,
        });
      }
    }
  }

  if (!rows.length) {
    return normalize([payload]);
  }
  return normalize(rows);
}

// ===========================================================================
// 14. Event competitor linescores
// ===========================================================================

/** Parse event competitor linescores into one row per period (from `items[]`). */
export function parse_event_competitor_linescores(payload: any): Record<string, any>[] {
  if (!payload) return [];
  const items = payload.items || payload.linescores || [];
  if (!items.length) return [];

  const rows = items.map((item: any, i: number) => ({
    period: i + 1,
    ...flattenScalarOneDeep(item),
  }));
  return normalize(rows);
}

// ===========================================================================
// 15. Event plays
// ===========================================================================

/** Parse an event plays response into one row per play (from `items[]`). */
export function parse_event_plays(payload: any): Record<string, any>[] {
  if (!payload) return [];
  const items = payload.items || payload.plays || [];
  if (!items.length) return [];

  // Drop keys that are too deeply nested or too large for a flat frame.
  const skip = new Set(["participants", "athletesInvolved", "drive"]);

  const rows: Record<string, any>[] = [];
  for (const play of items) {
    const row: Record<string, any> = {};
    for (const [k, v] of Object.entries(play)) {
      if (skip.has(k)) continue;
      if (isScalar(v)) {
        row[k] = v;
      } else if (isPlainObject(v)) {
        for (const [k2, v2] of Object.entries(v as Record<string, any>)) {
          if (isScalar(v2)) {
            row[`${k}_${k2}`] = v2;
          } else if (isPlainObject(v2)) {
            for (const [k3, v3] of Object.entries(v2 as Record<string, any>)) {
              if (isScalar(v3)) row[`${k}_${k2}_${k3}`] = v3;
            }
          }
        }
      } else if (Array.isArray(v)) {
        row[k] = String(v);
      }
    }
    rows.push(row);
  }

  if (!rows.length) {
    return normalize(items);
  }
  return normalize(rows);
}

// ===========================================================================
// Generic Core v2 paginated items
// ===========================================================================

// Keys that hold the row list in ESPN paginated / list payloads. Tried in
// priority order — the first one that resolves to a non-empty list is the
// row source.
const LIST_PAYLOAD_KEYS = ["items", "entries", "events", "athletes"];

/**
 * Generic parser for any ESPN paginated / list response. Walks
 * `LIST_PAYLOAD_KEYS` in order and flattens the first key that resolves to a
 * non-empty array. Core v2 `$ref`-only items yield a frame with a single
 * `_ref` (`$ref` → snake-cased) column — this parser does NOT auto-resolve.
 */
export function parse_items(payload: any): Record<string, any>[] {
  if (!payload || !isPlainObject(payload)) return [];
  let rows: any[] | null = null;
  for (const key of LIST_PAYLOAD_KEYS) {
    const candidate = payload[key];
    if (Array.isArray(candidate) && candidate.length) {
      rows = candidate;
      break;
    }
  }
  if (rows === null) return [];
  return normalize(rows);
}

// ===========================================================================
// Team-scoped Site v2 payloads
// ===========================================================================

/** Parse a Site v2 `team/{id}/schedule` response into one row per event. */
export function parse_team_schedule(payload: any): Record<string, any>[] {
  if (!payload || !isPlainObject(payload)) return [];
  const events = payload.events;
  if (!Array.isArray(events) || !events.length) return [];
  return normalize(events);
}

/**
 * Parse a Site v2 `team/{id}/roster` response into one row per athlete.
 * Handles both the flat shape (NBA/WNBA/MBB/WBB/CFB — `athletes` is a list of
 * athlete dicts) and the position-grouped shape (MLB/NFL/NHL — `athletes` is a
 * list of `{position, items:[...]}` groups, unrolled with a `position_group`
 * column carried from the parent).
 */
export function parse_team_roster(payload: any): Record<string, any>[] {
  if (!payload || !isPlainObject(payload)) return [];
  const athletes = payload.athletes;
  if (!Array.isArray(athletes) || !athletes.length) return [];

  const first = athletes[0] || {};
  const isGrouped =
    isPlainObject(first) && "position" in first && Array.isArray(first.items);

  if (isGrouped) {
    const rows: Record<string, any>[] = [];
    for (const group of athletes) {
      if (!isPlainObject(group)) continue;
      const groupName = group.position;
      for (const player of group.items || []) {
        if (!isPlainObject(player)) continue;
        rows.push({ position_group: groupName, ...player });
      }
    }
    if (!rows.length) return [];
    return normalize(rows);
  }
  return normalize(athletes);
}

// ===========================================================================
// News / injuries (Site v2 league-wide + team / athlete scoped)
// ===========================================================================

/** Parse a Site v2 `news` response into one row per article. */
export function parse_news(payload: any): Record<string, any>[] {
  if (!payload || !isPlainObject(payload)) return [];
  const articles = payload.articles;
  if (!Array.isArray(articles) || !articles.length) return [];
  return normalize(articles);
}

/**
 * Parse a Site v2 `injuries` response into one row per team that has injuries
 * reported. The nested per-player `injuries` sub-list is stringified (kept as a
 * single column) — the outer rows are per team.
 */
export function parse_injuries(payload: any): Record<string, any>[] {
  if (!payload || !isPlainObject(payload)) return [];
  const teams = payload.injuries;
  if (!Array.isArray(teams) || !teams.length) return [];
  return normalize(teams);
}

// ===========================================================================
// Site v2 summary — multi-section dispatcher + per-section parsers
// ===========================================================================

/** Flatten a single dict to a one-row frame; `[]` on empty / non-dict. */
function singleRow(payloadDict: any): Record<string, any>[] {
  if (!isPlainObject(payloadDict) || Object.keys(payloadDict).length === 0) return [];
  return normalize([payloadDict]);
}

/** Flatten a list-of-dicts to one row per item; `[]` on empty / non-list. */
function rowPerItem(items: any): Record<string, any>[] {
  if (!Array.isArray(items) || !items.length) return [];
  return normalize(items);
}

/** Extract per-athlete boxscore stats from `boxscore.players`. */
export function parse_summary_boxscore_player(payload: any): Record<string, any>[] {
  if (!isPlainObject(payload)) return [];
  const bs = payload.boxscore || {};
  const teams = bs.players || [];
  if (!Array.isArray(teams) || !teams.length) return [];

  const rows: Record<string, any>[] = [];
  for (const entry of teams) {
    const team = (entry || {}).team || {};
    const teamRowBase = {
      team_id: team.id,
      team_abbreviation: team.abbreviation,
      team_display_name: team.displayName,
      team_location: team.location,
    };
    for (const statBlock of entry.statistics || []) {
      const keys: string[] = statBlock.keys || statBlock.names || [];
      for (const athleteRow of statBlock.athletes || []) {
        const ath = athleteRow.athlete || {};
        const row: Record<string, any> = {
          ...teamRowBase,
          athlete_id: ath.id,
          athlete_display_name: ath.displayName,
          athlete_short_name: ath.shortName,
          athlete_jersey: ath.jersey,
          athlete_position: (ath.position || {}).abbreviation,
          starter: athleteRow.starter,
          active: athleteRow.active,
          did_not_play: athleteRow.didNotPlay,
          ejected: athleteRow.ejected,
          reason: athleteRow.reason,
        };
        const stats = athleteRow.stats || [];
        const n = Math.min(keys.length, stats.length);
        for (let i = 0; i < n; i++) row[keys[i]] = stats[i];
        rows.push(row);
      }
    }
  }

  if (!rows.length) return [];
  return normalize(rows);
}

/** Extract per-team boxscore stats from `boxscore.teams`. */
export function parse_summary_boxscore_team(payload: any): Record<string, any>[] {
  if (!isPlainObject(payload)) return [];
  const bs = payload.boxscore || {};
  const teams = bs.teams || [];
  if (!Array.isArray(teams) || !teams.length) return [];

  const rows: Record<string, any>[] = [];
  for (const entry of teams) {
    const team = (entry || {}).team || {};
    const teamRowBase = {
      team_id: team.id,
      team_abbreviation: team.abbreviation,
      team_display_name: team.displayName,
      home_away: entry.homeAway,
      display_order: entry.displayOrder,
    };
    for (const stat of entry.statistics || []) {
      rows.push({
        ...teamRowBase,
        stat_name: stat.name,
        stat_label: stat.label,
        stat_display_value: stat.displayValue,
        stat_value: stat.value,
      });
    }
  }

  if (!rows.length) return [];
  return normalize(rows);
}

/** Extract the play-by-play list from `payload["plays"]`. */
export function parse_summary_plays(payload: any): Record<string, any>[] {
  if (!isPlainObject(payload)) return [];
  const plays = payload.plays;
  if (!Array.isArray(plays) || !plays.length) return [];
  return normalize(plays);
}

/** Extract win-probability over time from `payload["winprobability"]`. */
export function parse_summary_winprobability(payload: any): Record<string, any>[] {
  if (!isPlainObject(payload)) return [];
  const wp = payload.winprobability;
  if (!Array.isArray(wp) || !wp.length) return [];
  return normalize(wp);
}

/** Extract per-game stat leaders from `payload["leaders"]`. */
export function parse_summary_leaders(payload: any): Record<string, any>[] {
  if (!isPlainObject(payload)) return [];
  const teams = payload.leaders;
  if (!Array.isArray(teams) || !teams.length) return [];

  const rows: Record<string, any>[] = [];
  for (const teamEntry of teams) {
    const team = (teamEntry || {}).team || {};
    const teamRowBase = {
      team_id: team.id,
      team_abbreviation: team.abbreviation,
    };
    for (const category of teamEntry.leaders || []) {
      const catName = category.name;
      const catDisplay = category.displayName;
      for (const leader of category.leaders || []) {
        const ath = leader.athlete || {};
        rows.push({
          ...teamRowBase,
          category_name: catName,
          category_display_name: catDisplay,
          athlete_id: ath.id,
          athlete_display_name: ath.displayName,
          athlete_position: (ath.position || {}).abbreviation,
          value: leader.value,
          display_value: leader.displayValue,
          main_stat: leader.mainStat,
          summary: leader.summary,
        });
      }
    }
  }

  if (!rows.length) return [];
  return normalize(rows);
}

/** Extract venue + attendance from `payload["gameInfo"]`. */
export function parse_summary_game_info(payload: any): Record<string, any>[] {
  const info = (payload || {}).gameInfo || {};
  if (!Object.keys(info).length) return [];
  const flat: Record<string, any> = { attendance: info.attendance };
  const venue = info.venue || {};
  for (const [k, v] of Object.entries(venue)) {
    if (isScalar(v)) {
      flat[`venue_${k}`] = v;
    } else if (isPlainObject(v)) {
      for (const [k2, v2] of Object.entries(v as Record<string, any>)) {
        if (isScalar(v2)) flat[`venue_${k}_${k2}`] = v2;
      }
    }
  }
  return singleRow(flat);
}

/** Extract the per-game officials list from `gameInfo.officials`. */
export function parse_summary_officials(payload: any): Record<string, any>[] {
  const officials = ((payload || {}).gameInfo || {}).officials;
  return rowPerItem(officials);
}

/** Extract the single-row game header from `payload["header"]`. */
export function parse_summary_header(payload: any): Record<string, any>[] {
  return singleRow(isPlainObject(payload) ? payload.header : null);
}

/** Extract head-to-head season series from `payload["seasonseries"]`. */
export function parse_summary_season_series(payload: any): Record<string, any>[] {
  return rowPerItem((payload || {}).seasonseries);
}

/** Extract per-team ATS records from `payload["againstTheSpread"]`. */
export function parse_summary_against_the_spread(payload: any): Record<string, any>[] {
  const teams = (payload || {}).againstTheSpread;
  if (!Array.isArray(teams) || !teams.length) return [];
  const rows: Record<string, any>[] = [];
  for (const entry of teams) {
    const team = (entry || {}).team || {};
    const teamBase = {
      team_id: team.id,
      team_abbreviation: team.abbreviation,
      team_display_name: team.displayName,
    };
    for (const rec of entry.records || []) {
      const row: Record<string, any> = { ...teamBase };
      for (const [k, v] of Object.entries(rec || {})) {
        if (isScalar(v)) {
          row[k] = v;
        } else if (isPlainObject(v)) {
          for (const [k2, v2] of Object.entries(v as Record<string, any>)) {
            if (isScalar(v2)) row[`${k}_${k2}`] = v2;
          }
        }
      }
      rows.push(row);
    }
  }
  if (!rows.length) return [];
  return normalize(rows);
}

/** Extract a standings snapshot from `payload["standings"]`. */
export function parse_summary_standings(payload: any): Record<string, any>[] {
  const st = (payload || {}).standings || {};
  const groups = st.groups || [];
  if (!Array.isArray(groups) || !groups.length) return [];
  const rows: Record<string, any>[] = [];
  for (const grp of groups) {
    if (!isPlainObject(grp)) continue;
    const grpBase = {
      group_header: grp.header,
      conference_header: grp.conferenceHeader,
      division_header: grp.divisionHeader,
    };
    for (const entry of (grp.standings || {}).entries || []) {
      const row: Record<string, any> = { ...grpBase };
      const teamField = entry.team;
      row.team_id = entry.id;
      row.team_uid = entry.uid;
      row.team_location = typeof teamField === "string" ? teamField : null;
      if (isPlainObject(teamField)) {
        row.team_abbreviation = teamField.abbreviation;
        row.team_display_name = teamField.displayName;
      }
      for (const stat of entry.stats || []) {
        const key = stat.name || stat.type;
        if (key) row[key] = stat.displayValue !== undefined ? stat.displayValue : stat.value;
      }
      rows.push(row);
    }
  }
  if (!rows.length) return [];
  return normalize(rows);
}

/** Extract TV broadcast info from `payload["broadcasts"]`. */
export function parse_summary_broadcasts(payload: any): Record<string, any>[] {
  return rowPerItem((payload || {}).broadcasts);
}

/** Extract the game format from `payload["format"]`. */
export function parse_summary_format(payload: any): Record<string, any>[] {
  return singleRow(isPlainObject(payload) ? payload.format : null);
}

/** Extract pre-game odds / picks from `payload["pickcenter"]`. */
export function parse_summary_pickcenter(payload: any): Record<string, any>[] {
  return rowPerItem((payload || {}).pickcenter);
}

/** Extract odds entries from `payload["odds"]`. */
export function parse_summary_odds(payload: any): Record<string, any>[] {
  return rowPerItem((payload || {}).odds);
}

/** Extract the recap article metadata from `payload["article"]`. */
export function parse_summary_article(payload: any): Record<string, any>[] {
  return singleRow(isPlainObject(payload) ? payload.article : null);
}

/** Extract per-team injuries from `payload["injuries"]`. */
export function parse_summary_injuries(payload: any): Record<string, any>[] {
  return rowPerItem((payload || {}).injuries);
}

/** Extract the embedded news feed from `payload["news"].articles`. */
export function parse_summary_news(payload: any): Record<string, any>[] {
  const news = (payload || {}).news || {};
  return rowPerItem(news.articles);
}

/** Generic single-row flattener for any ESPN single-entity payload. */
export function parse_single_entity(payload: any): Record<string, any>[] {
  return singleRow(isPlainObject(payload) ? payload : null);
}

/** Extract per-drive context from `payload["drives"].previous` (NFL/CFB). */
export function parse_summary_drives(payload: any): Record<string, any>[] {
  const drives = (payload || {}).drives || {};
  const previous = isPlainObject(drives) ? drives.previous : null;
  return rowPerItem(previous);
}

/** Extract the scoring-plays summary from `payload["scoringPlays"]`. */
export function parse_summary_scoring_plays(payload: any): Record<string, any>[] {
  return rowPerItem((payload || {}).scoringPlays);
}

/** Explode NFL/CFB `drives.previous[].plays[]` into long-form rows. */
export function parse_summary_drive_plays(payload: any): Record<string, any>[] {
  const drives = (payload || {}).drives || {};
  const previous = isPlainObject(drives) ? drives.previous : null;
  if (!Array.isArray(previous) || !previous.length) return [];
  const rows: Record<string, any>[] = [];
  previous.forEach((drive: any, idx: number) => {
    if (!isPlainObject(drive)) return;
    const driveId = drive.id;
    const driveSeq = idx + 1;
    for (const play of drive.plays || []) {
      if (!isPlainObject(play)) continue;
      rows.push({ drive_id: driveId, drive_sequence: driveSeq, ...play });
    }
  });
  return rowPerItem(rows);
}

// Map summary section name -> parser. Used by parse_summary() and exposed so
// callers can introspect the section list. Keys verbatim from the Python
// `SUMMARY_SECTION_PARSERS` (21 sections).
export const SUMMARY_SECTION_PARSERS: Record<string, ParserFn> = {
  boxscore_player: parse_summary_boxscore_player,
  boxscore_team: parse_summary_boxscore_team,
  plays: parse_summary_plays,
  winprobability: parse_summary_winprobability,
  leaders: parse_summary_leaders,
  game_info: parse_summary_game_info,
  officials: parse_summary_officials,
  header: parse_summary_header,
  season_series: parse_summary_season_series,
  against_the_spread: parse_summary_against_the_spread,
  standings: parse_summary_standings,
  broadcasts: parse_summary_broadcasts,
  format: parse_summary_format,
  pickcenter: parse_summary_pickcenter,
  odds: parse_summary_odds,
  article: parse_summary_article,
  injuries: parse_summary_injuries,
  news: parse_summary_news,
  // NFL / CFB only — return zero-row frames for other sports
  drives: parse_summary_drives,
  drive_plays: parse_summary_drive_plays,
  scoring_plays: parse_summary_scoring_plays,
};

/**
 * Dispatcher: parse one section of a Site v2 summary payload.
 *
 * With `section` omitted, returns an object of every parsable sub-frame keyed
 * by section name (21 sections). With `section="<name>"`, returns just that one
 * parser's rows. An unknown section name throws.
 */
export function parse_summary(
  payload: any,
  section?: string
): Record<string, any>[] | Record<string, Record<string, any>[]> {
  if (section !== undefined) {
    if (!(section in SUMMARY_SECTION_PARSERS)) {
      const valid = Object.keys(SUMMARY_SECTION_PARSERS).sort();
      throw new Error(
        `Unknown summary section '${section}'. Choose one of ${JSON.stringify(
          valid
        )} or omit section for the full dict.`
      );
    }
    return SUMMARY_SECTION_PARSERS[section](payload);
  }
  const out: Record<string, Record<string, any>[]> = {};
  for (const [name, fn] of Object.entries(SUMMARY_SECTION_PARSERS)) {
    out[name] = fn(payload);
  }
  return out;
}

// ===========================================================================
// Endpoint -> parser registry
// ===========================================================================
//
// Maps the *short name* used in the ESPN cross-league wrapper tables to the
// parser that turns its raw payload into tidy rows. Mirrors the Python
// `ENDPOINT_PARSERS` registry verbatim (121 entries). Most short names map to
// `parse_items` (Core v2 paginated lists) or `parse_single_entity` (Core v2
// single-resource payloads); the rich Site v2 surfaces get dedicated parsers,
// and `summary` is the multi-section dispatcher.

export const ESPN_ENDPOINT_PARSERS: Record<string, ParserFn | typeof parse_summary> = {
  // Site v2 (rich nested)
  scoreboard: parse_scoreboard,
  teams_site: parse_teams,
  // summary is the dispatcher — returns an object of sub-frames by default
  summary: parse_summary,
  // Site v2 alt + Core v2 standings
  standings: parse_standings,
  standings_core: parse_standings,
  // Groups / conferences
  conferences: parse_groups,
  // Web v3 athlete deep dives
  athlete_overview: parse_athlete_overview,
  athlete_stats: parse_athlete_stats,
  athlete_gamelog: parse_athlete_gamelog,
  athlete_splits: parse_athlete_splits,
  leaders: parse_leaders,
  // Core v2 catalog (one-shot)
  teams_core: parse_teams,
  coaches: parse_coaches,
  season_coaches: parse_coaches,
  season_draft: parse_draft,
  // Event-competitor surface
  event_competitor_roster: parse_event_competitor_roster,
  event_competitor_statistics: parse_event_competitor_statistics,
  event_competitor_linescores: parse_event_competitor_linescores,
  event_plays: parse_event_plays,
  // Team-scoped Site v2
  team_schedule: parse_team_schedule,
  team_roster: parse_team_roster,
  // News (league-wide + team + athlete scoped)
  news: parse_news,
  team_news: parse_news,
  athlete_news: parse_news,
  // Injuries (league-wide + team + athlete scoped)
  injuries: parse_injuries,
  team_injuries: parse_injuries,
  athlete_injuries: parse_injuries,
  // Core v2 paginated list endpoints — parse_items returns a frame of raw items.
  venues: parse_items,
  franchises: parse_items,
  events: parse_items,
  athletes_index: parse_items,
  seasons: parse_items,
  season_types: parse_items,
  season_groups: parse_items,
  season_group_teams: parse_items,
  season_teams: parse_items,
  season_athletes: parse_items,
  season_weeks: parse_items,
  season_week_events: parse_items,
  season_awards: parse_items,
  season_recruits: parse_items,
  season_futures: parse_items,
  season_freeagents: parse_items,
  season_draft_round_picks: parse_items,
  awards: parse_items,
  tournaments: parse_items,
  positions: parse_items,
  transactions: parse_items,
  team_transactions: parse_items,
  team_record: parse_items,
  team_history: parse_items,
  athlete_career_stats: parse_items,
  athlete_statisticslog: parse_items,
  athlete_eventlog: parse_items,
  athlete_contracts: parse_items,
  athlete_awards: parse_items,
  athlete_seasons: parse_items,
  athlete_records: parse_items,
  // ---- Site v2 list payloads (calendar variants, NCAA / football extras) ----
  calendar: parse_items,
  calendar_offseason: parse_items,
  calendar_regular_season: parse_items,
  calendar_postseason: parse_items,
  calendar_ondays: parse_items,
  draft: parse_items,
  statistics_league: parse_items,
  team_depthcharts: parse_items,
  team_leaders: parse_items,
  rankings: parse_items,
  season_qbr: parse_items,
  season_qbr_week: parse_items,
  athlete_notes: parse_items,
  league_notes: parse_items,
  talentpicks: parse_items,
  // ---- Core v2 list payloads (more) ----
  leaders_core: parse_items,
  season_powerindex: parse_items,
  season_powerindex_leaders: parse_items,
  season_type_corrections: parse_items,
  season_type_leaders: parse_items,
  season_week_rankings: parse_items,
  season_group_children: parse_items,
  // ---- Event-scoped list payloads ----
  event_broadcasts: parse_items,
  event_competitors: parse_items,
  event_competitor_leaders: parse_items,
  event_leaders: parse_items,
  event_odds: parse_items,
  event_officials: parse_items,
  event_play_personnel: parse_items,
  event_probabilities: parse_items,
  event_propbets: parse_items,
  event_scoringplays: parse_items,
  // ---- Core v2 single-entity payloads (one row per call) ----
  team: parse_single_entity,
  team_core: parse_single_entity,
  venue: parse_single_entity,
  franchise: parse_single_entity,
  coach: parse_single_entity,
  coach_record: parse_single_entity,
  coach_season: parse_single_entity,
  position: parse_single_entity,
  award: parse_single_entity,
  league_root: parse_single_entity,
  athlete_core: parse_single_entity,
  athlete_info: parse_single_entity,
  athlete_bio: parse_single_entity,
  athlete_vs_athlete: parse_single_entity,
  athlete_hotzones: parse_single_entity,
  season_pointer: parse_single_entity,
  season_info: parse_single_entity,
  season_type: parse_single_entity,
  season_group: parse_single_entity,
  season_week: parse_single_entity,
  season_team: parse_single_entity,
  // ---- Event-scoped single-entity payloads ----
  event: parse_single_entity,
  event_competition: parse_single_entity,
  event_competitor: parse_single_entity,
  event_competitor_record: parse_single_entity,
  event_play: parse_single_entity,
  event_situation: parse_single_entity,
  event_status: parse_single_entity,
  event_predictor: parse_single_entity,
  event_powerindex: parse_single_entity,
  event_official_detail: parse_single_entity,
};

/**
 * Return the registered parser for an endpoint short name, or `undefined`.
 * Mirrors the Python `parser_for`.
 */
export function parserForEndpoint(
  short: string
): ParserFn | typeof parse_summary | undefined {
  return ESPN_ENDPOINT_PARSERS[short];
}

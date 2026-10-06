// Shared bits of the legacy hand-written `sdv.<league>.get*` methods. Every one
// fetches through the core request layer (src/core/request.ts): https, retries,
// and the NoDataError / AssetFetchError vocabulary — never a raw HTTP-client call.
//
// The `getSchedule({ year, month, day })` methods route through the vendored
// ESPN CDN wrappers (`espn_<league>_cdn_schedule`). The CDN's date key is
// `date`: the `dates` these methods used to send is silently ignored and
// today's page comes back (sdv-py espn_cdn.yaml, probed 2026-10-05).

import { DEFAULT_RETRY_STATUSES, registerFamilyDefaults } from '../core/config.js';
import { warnOnce } from '../core/deprecation.js';
import { request } from '../core/request.js';

// The deprecated cfb / mbb 247sports.com HTML scrapers' family (plain transport:
// the www HTML pages answer one). As for sports247 / sports247_site_pages, a 247
// 403 is the edge's block, not load, so it is never retried.
registerFamilyDefaults('sports247_html', { retryStatuses: DEFAULT_RETRY_STATUSES.filter((s) => s !== 403) });

/**
 * GET an HTML page (the deprecated 247sports.com / stats.ncaa.org scrapers)
 * through the core request layer and return its text.
 *
 * @throws NoDataError on 404; AssetFetchError on any other failed fetch.
 */
export function getHtml(
  family: string,
  url: string,
  query?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<string> {
  return request(family, { method: 'GET', url, query, headers, responseType: 'text' }) as Promise<string>;
}

/** One of the legacy `{ year, month, day }` args: a number or a numeric string. */
export type DatePart = number | string | null | undefined;

/** The legacy `{ year, month, day }` args. */
export interface DateArgs {
  year?: DatePart;
  month?: DatePart;
  day?: DatePart;
}

/** `YYYYMMDD` from the legacy `{ year, month, day }` args, or `undefined` (today's page). */
export function cdnDate(year: DatePart, month: DatePart, day: DatePart): string | undefined {
  if (!year || !month || !day) return undefined;
  const pad = (v: number | string) => String(parseInt(String(v), 10)).padStart(2, "0");
  return `${year}${pad(month)}${pad(day)}`;
}

/** The `dates` (`YYYYMMDD`) the legacy `getScoreboard` methods send, built as they always have. */
export function scoreboardDates(year: DatePart, month: DatePart, day: DatePart): string {
  const pad = (v: DatePart) => {
    const n = parseInt(String(v));
    return n <= 9 ? "0" + n : n;
  };
  return `${year}${pad(month)}${pad(day)}`;
}

/** A JSON object of an ESPN payload whose other fields the legacy methods pass through as they come. */
type EspnObject = { [field: string]: unknown };

/**
 * An espn.com CDN game page (`espn_<league>_cdn_playbyplay` / `_boxscore`), typed as
 * far as the legacy `getPlayByPlay` / `getBoxScore` methods read it. Not checked at
 * runtime: a page without these fields throws the same TypeError it always did.
 */
export interface CdnGamePage extends EspnObject {
  gameId?: string;
  gamepackageJSON: EspnObject & {
    header: EspnObject & { id: string; competitions: EspnObject[] };
    boxscore: EspnObject;
  };
}

/** An espn.com CDN schedule page (`espn_<league>_cdn_schedule`), as the legacy `getSchedule` methods read it. */
export interface CdnSchedulePage extends EspnObject {
  content: EspnObject & { schedule: unknown };
}

/** A recruit row of the deprecated 247sports.com composite / 247 rankings scrapers. */
export interface Sports247Recruit {
  ranking: number;
  name: string;
  highSchool: string;
  position: string;
  height: string;
  weight: string;
  stars: number;
  rating: string;
  college: string;
}

/** A school row of the deprecated 247sports.com team-rankings scrapers. */
export interface Sports247School {
  rank: string;
  school: string;
  totalCommits: string;
  fiveStars: string;
  fourStars: string;
  threeStars: string;
  averageRating: string;
  points: string;
}

/** A commit row of the deprecated 247sports.com school-commits scrapers. */
export interface Sports247Commit {
  name: string;
  highSchool: string;
  position: string;
  height: string;
  weight: string;
  stars: number;
  rating: string;
  nationalRank: string;
  stateRank: string;
  positionRank: string;
}

/**
 * Football (cfb, nfl) schedule pages are week-oriented: the CDN ignores a date
 * and returns the current week. Warn once per league when a caller passes one
 * without a `week`.
 */
export function warnFootballDate(league: string): void {
  warnOnce(
    `cdn-football-date:${league}`,
    `sdv.${league}.getSchedule: the espn.com ${league} schedule page is week-oriented and ignores a date ` +
      `(it returns the current week); pass { week, year, seasontype } instead.`,
    { code: "SDV_CDN_FOOTBALL_DATE" }
  );
}

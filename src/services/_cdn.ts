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

/** `YYYYMMDD` from the legacy `{ year, month, day }` args, or `undefined` (today's page). */
export function cdnDate(year: any, month: any, day: any): string | undefined {
  if (!year || !month || !day) return undefined;
  const pad = (v: any) => String(parseInt(v, 10)).padStart(2, "0");
  return `${year}${pad(month)}${pad(day)}`;
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

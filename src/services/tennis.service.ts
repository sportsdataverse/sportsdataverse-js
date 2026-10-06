import { get } from '../core/client.js';
import { scoreboardDates } from './_cdn.js';
import type { DateArgs } from './_cdn.js';
/**
 * Operations for Tennis.
 *
 * @namespace tennis
 */
export default {
    /**
     * Gets the scoreboard data for a specified date and league if available.
     * @memberOf tennis
     * @async
     * @function
     * @param {string} league - Tennis league desired. Default 'atp' Acceptable values:
     * ['atp', 'wta']
     * @param {*} year - Year (YYYY)
     * @param {*} month - Month (MM)
     * @param {*} day - Day (DD)
     * @returns json
     * @example
     * const result = await sdv.tennis.getScoreboard({
     * league = 'wta', year = 2023, month = 06, day = 20
     * })
     */
    getScoreboard: async function ({ league = 'atp', year, month, day }: DateArgs & { league?: string }) {
        const baseUrl = `https://site.api.espn.com/apis/site/v2/sports/tennis/${league}/scoreboard`;
        const params: Record<string, any> = {};
        if (year && month && day) {
            params.dates = scoreboardDates(year, month, day);
        }
        const res = { data: await get(baseUrl, { params, family: 'site_v2' }) };
        return res.data;
    }
};
import axios, { type AxiosRequestConfig } from "axios";
import type { EspnFamily } from "./types.js";

/** Base hosts for each ESPN URL family. */
export const HOSTS: Record<EspnFamily, string> = {
  site_v2: "https://site.api.espn.com/apis/site/v2/sports",
  site_v2_alt: "https://site.api.espn.com/apis/v2/sports",
  web_v3: "https://site.web.api.espn.com/apis/common/v3/sports",
  core_v2: "https://sports.core.api.espn.com/v2/sports",
};

const client = axios.create({
  timeout: 30000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; sportsdataverse-js/3.x; +https://js.sportsdataverse.org/)",
  },
});

/** Build a `{host}/{sport}/{league}{path}` URL for an ESPN family. */
export function familyUrl(
  family: EspnFamily,
  sport: string,
  league: string,
  path = ""
): string {
  return `${HOSTS[family]}/${sport}/${league}${path}`;
}

/** GET an ESPN URL and return the raw JSON body. */
export async function get(
  url: string,
  config?: AxiosRequestConfig
): Promise<any> {
  const res = await client.get(url, config);
  return res.data;
}

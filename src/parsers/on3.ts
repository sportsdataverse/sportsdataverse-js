// On3 Recruit Database (RDB) parser (`api.on3.com/public/rdb/v1`). Faithful port
// of `parse_on3_rdb` in sdv-py's `cfb/on3_parsers.py`. The RDB serves every
// endpoint in one of three envelope shapes, all handled here:
//
//   - paged         `{ relatedModel, pagination, list: [...] }`  -> rows are `list`;
//   - single object a bare object without a `list` key           -> one row;
//   - bare array    a top-level list                              -> the list.
//
// Rows are `json_normalize`-flattened and snake_cased (colliding names gain a
// `_2` suffix); list / object cells are JSON-encoded. Empty / malformed -> `[]`.
// (sdv-py's other two on3 parsers belong to the deprecated `_next/data` scrape
// shims, which are not ported.)

import { isPlainObject, rowsToFrame, type Row } from "./_frames.js";

/** Parse an On3 RDB payload into one row per record. */
export function parse_on3_rdb(raw: any): Row[] {
  let rows: any[] = [];
  if (Array.isArray(raw)) rows = raw;
  else if (isPlainObject(raw)) {
    rows = Array.isArray(raw.list) ? raw.list : Object.keys(raw).length ? [raw] : [];
  }
  return rowsToFrame(rows);
}

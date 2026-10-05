// Parser for the KenPom wrappers (`kenpom.com`, subscription HTML pages).
// Faithful port of sdv-py's `parse_kenpom_page`
// (`sportsdataverse/mbb/kenpom_runtime.py`) and the generic table reader it
// sits on (`sportsdataverse/_html_tables.py`, which leans on
// `pandas.read_html`). The pandas behaviour that decides the output — how a
// multi-row `<thead>` becomes a MultiIndex, the `Unnamed: i_level_j`
// placeholders, the `.N` suffix on a duplicate header, default NA strings,
// thousands separators, numeric inference — is ported here verbatim so the
// column names and values match py on the same page.
//
// One wrapper per URL returns EVERY table on the page, keyed by its HTML id
// (`ratings_table`, `schedule_table`, …), so the parser returns a dict of
// tables. `team.php` also gets a `depth_chart` table recovered from its
// `const players = [...]` script (KenPom renders it client-side).

import { load } from "cheerio/slim";
import { isPlainObject, underscore } from "./_normalize.js";
import { MULTI_TABLE_SECTIONS, sectionError } from "./_frames.js";
import { registerParser } from "./_registry.js";

type Row = Record<string, any>;
type Cell = string | number | null;
/** A column-ordered table (rows keyed by column name). */
interface Frame {
  columns: string[];
  rows: Row[];
}

// ---------------------------------------------------------------------------
// Header naming (py _html_tables._clean_name / _flatten_header / _dedupe_headers)
// ---------------------------------------------------------------------------

const UNNAMED = /^unnamed[:_]?\s*\d*/i;
const DUP_SUFFIX = /_\d+$/;
const SYMBOLS: Array<[string, string]> = [
  ["+/-", " plus_minus "],
  ["#", " number "],
  ["%", " pct "],
  ["+", " plus "],
];

/** snake_case one header label; pandas' `Unnamed: N` placeholders become `""`. */
export function cleanName(raw: unknown): string {
  let text = raw === null || raw === undefined ? "" : String(raw).trim();
  if (!text || UNNAMED.test(text)) return "";
  // Symbol-only headers are real labels: spell them out before the strip below,
  // or "#" would read as an unlabelled rank cell.
  for (const [symbol, word] of SYMBOLS) text = text.split(symbol).join(word);
  text = text.replace(/[^0-9a-zA-Z]+/g, "_").replace(/^_+|_+$/g, "");
  return text ? underscore(text).replace(/^_+|_+$/g, "") : "";
}

/** Flatten one pandas column label (a MultiIndex tuple, or a scalar) to a name. */
export function flattenHeader(col: string | number | string[]): string {
  if (!Array.isArray(col)) return cleanName(col);
  const parts = col.map(cleanName);
  if (!parts.length) return "";
  // a blank LAST level, or pandas' ".N" twin of a label already in the tuple,
  // is the unlabelled rank cell: report it blank (dedupeHeaders names it _rk)
  const last = parts[parts.length - 1];
  const stem = last.replace(DUP_SUFFIX, "");
  if (!last || (stem !== last && parts.slice(0, -1).includes(stem))) return "";
  // dedupe by FIRST occurrence: KenPom repeats its 2-row header block in <thead>
  const out: string[] = [];
  for (const p of parts) if (p && !out.includes(p)) out.push(p);
  return out.join("_");
}

/** A blank name, or a repeat of the previous one, becomes `<previous>_rk`; later collisions get `_2`, `_3`, …. */
export function dedupeHeaders(names: string[]): string[] {
  const out: string[] = [];
  names.forEach((name, i) => {
    let candidate = name;
    if (!candidate || (out.length && candidate === out[out.length - 1])) {
      candidate = out.length ? `${out[out.length - 1]}_rk` : `column_${i}`;
    }
    while (out.includes(candidate)) {
      let suffix = 2;
      while (out.includes(`${candidate}_${suffix}`)) suffix++;
      candidate = `${candidate}_${suffix}`;
    }
    out.push(candidate);
  });
  return out;
}

// ---------------------------------------------------------------------------
// pandas.read_html (lxml flavour) + its python-engine TextParser
// ---------------------------------------------------------------------------

/** pandas' default NA strings (`STR_NA_VALUES`). */
const NA_VALUES = new Set([
  "", "#N/A", "#N/A N/A", "#NA", "-1.#IND", "-1.#QNAN", "-NaN", "-nan", "1.#IND",
  "1.#QNAN", "<NA>", "N/A", "NA", "NULL", "NaN", "None", "n/a", "nan", "null",
]);
/** python-engine `self.num` with `thousands=","` (read_html's default). */
const THOUSANDS_NUM = /^[-+]?([0-9]+,|[0-9])*(\.[0-9]*)?([0-9]?(E|e)-?[0-9]+)?$/;
/** What pandas' `floatify` (xstrtod) accepts. */
const PD_NUMBER = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
const PD_INF = /^[-+]?inf(inity)?$/i;

/** pandas `_remove_whitespace`: strip, then collapse newlines / runs of whitespace. */
const removeWhitespace = (s: string): string => s.trim().replace(/[\r\n]+|\s{2,}/g, " ");

/** Parse a cell the way `lib.maybe_convert_numeric` would, or `undefined`. */
function pdNumber(s: string): number | undefined {
  if (PD_NUMBER.test(s)) return Number(s);
  if (PD_INF.test(s)) return s.startsWith("-") ? -Infinity : Infinity;
  return undefined;
}

type Remainder = Array<[number, string, number]>;

/**
 * pandas (3.x) `_expand_colspan_rowspan` over one section's `<tr>`s. A rowspan
 * still open at the end of a section carries into the next (`remainder`); with
 * `overflow` false the leftover rows are emitted here instead.
 */
function expandSpans(
  $: any,
  rows: any[],
  carried: Remainder = [],
  overflow = true
): { rows: string[][]; remainder: Remainder } {
  const all: string[][] = [];
  let remainder: Remainder = carried;
  for (const tr of rows) {
    const texts: string[] = [];
    const next: Remainder = [];
    let index = 0;
    $(tr)
      .children("td, th")
      .each((_i: number, td: any) => {
        while (remainder.length && remainder[0][0] <= index) {
          const [pi, pt, pr] = remainder.shift()!;
          texts.push(pt);
          if (pr > 1) next.push([pi, pt, pr - 1]);
          index++;
        }
        const text = removeWhitespace($(td).text());
        const rowspan = Number.parseInt($(td).attr("rowspan") || "1", 10) || 1;
        const colspan = Number.parseInt($(td).attr("colspan") || "1", 10);
        for (let c = 0; c < (Number.isNaN(colspan) ? 1 : colspan); c++) {
          texts.push(text);
          if (rowspan > 1) next.push([index, text, rowspan - 1]);
          index++;
        }
      });
    for (const [pi, pt, pr] of remainder) {
      texts.push(pt);
      if (pr > 1) next.push([pi, pt, pr - 1]);
    }
    all.push(texts);
    remainder = next;
  }
  if (!overflow) {
    while (remainder.length) {
      const texts: string[] = [];
      const next: Remainder = [];
      for (const [pi, pt, pr] of remainder) {
        texts.push(pt);
        if (pr > 1) next.push([pi, pt, pr - 1]);
      }
      all.push(texts);
      remainder = next;
    }
  }
  return { rows: all, remainder };
}

/** python-engine column names for a single header line (`Unnamed: i`, `.N` dedup). */
function singleHeader(line: string[]): string[] {
  const cols = line.map((c, i) => (c === "" ? `Unnamed: ${i}` : c));
  const unnamed = line.map((c, i) => (c === "" ? i : -1)).filter((i) => i >= 0);
  const order = [...cols.keys()].filter((i) => !unnamed.includes(i)).concat(unnamed);
  const counts = new Map<string, number>();
  for (const i of order) {
    let col = cols[i];
    const old = col;
    let cur = counts.get(col) ?? 0;
    while (cur > 0) {
      counts.set(old, cur + 1);
      col = `${old}.${cur}`;
      cur = cols.includes(col) ? cur + 1 : (counts.get(col) ?? 0);
    }
    cols[i] = col;
    counts.set(col, cur + 1);
  }
  return cols;
}

/** MultiIndex columns: one tuple per column, `.N` on the last level of a duplicate tuple. */
function multiHeader(levels: string[][]): string[][] {
  const width = levels[0].length;
  const names: string[][] = [];
  for (let i = 0; i < width; i++) {
    names.push(levels.map((line, level) => (line[i] === "" ? `Unnamed: ${i}_level_${level}` : line[i])));
  }
  const counts = new Map<string, number>();
  return names.map((tuple) => {
    let col = tuple;
    let cur = counts.get(JSON.stringify(col)) ?? 0;
    while (cur > 0) {
      counts.set(JSON.stringify(col), cur + 1);
      col = [...col.slice(0, -1), `${col[col.length - 1]}.${cur}`];
      cur = counts.get(JSON.stringify(col)) ?? 0;
    }
    counts.set(JSON.stringify(col), cur + 1);
    return col;
  });
}

const hidden = (style: string | undefined): boolean =>
  (style ?? "").replace(/ /g, "").includes("display:none");

/**
 * One `<table>` as pandas.read_html (lxml) + `_html_tables` would read it:
 * flattened, deduped column names and type-inferred cells. `null` when pandas
 * would find no table (hidden, no text, no rows).
 */
function readTable($: any, table: any): Frame | null {
  const $t = $(table);
  if (hidden($t.attr("style"))) return null;
  $t.find("[style]").each((_i: number, el: any) => {
    if (hidden($(el).attr("style"))) $(el).remove();
  });
  if (!/[^\n]/.test($t.text())) return null;

  const headRows = $t.find("thead tr").toArray();
  const bodyRows = [...$t.find("tbody tr").toArray(), ...$t.children("tr").toArray()];
  const footRows = $t.find("tfoot tr").toArray();
  if (!headRows.length) {
    // no <thead>: leading all-<th> rows are the header
    while (bodyRows.length && $(bodyRows[0]).children("td, th").toArray().every((c: any) => c.name === "th")) {
      headRows.push(bodyRows.shift());
    }
  }
  const head = expandSpans($, headRows);
  const body = expandSpans($, bodyRows, head.remainder, footRows.length > 0);
  const foot = expandSpans($, footRows, body.remainder, false);
  let lines = [...head.rows, ...body.rows, ...foot.rows];
  if (!lines.length) return null;
  const width = Math.max(...lines.map((l) => l.length));
  lines = lines.map((l) => l.concat(Array(width - l.length).fill("")));

  // header rows: the one head row, or every head row carrying any text
  const header =
    head.rows.length === 0 ? [] : head.rows.length === 1 ? [0] : head.rows.flatMap((r, i) => (r.some(Boolean) ? [i] : []));
  let labels: Array<string | number | string[]>;
  let data: string[][];
  if (header.length > 1) {
    labels = multiHeader(header.map((i) => lines[i]));
    data = lines.slice(header[header.length - 1] + 1);
  } else if (header.length === 1) {
    labels = singleHeader(lines[header[0]]);
    data = lines.slice(header[0] + 1);
  } else {
    labels = [...Array(width).keys()];
    data = lines;
  }
  // skip_blank_lines: a line with no cells, or one blank cell
  data = data.filter((l) => l.length > 1 || (l.length === 1 && l[0].trim() !== ""));

  const columns = dedupeHeaders(labels.map(flattenHeader));
  // thousands separators, NA strings, then all-or-nothing numeric inference per column
  const cells: Cell[][] = data.map((l) =>
    l.map((x) => (x.includes(",") && THOUSANDS_NUM.test(x.trim()) ? x.replace(/,/g, "") : x))
  );
  for (let c = 0; c < width; c++) {
    let numeric = true;
    for (const row of cells) {
      const v = row[c] as string;
      if (NA_VALUES.has(v)) row[c] = null;
      else if (pdNumber(v) === undefined) numeric = false;
    }
    if (numeric) for (const row of cells) if (row[c] !== null) row[c] = pdNumber(row[c] as string)!;
  }
  return {
    columns,
    rows: cells.map((row) => Object.fromEntries(columns.map((name, i) => [name, row[i] ?? null]))),
  };
}

/** Stable key for one `<table>`: its id, else its caption, else `table_<n>`. */
function tableKey($: any, table: any, index: number, used: Set<string>): string {
  let raw: string = $(table).attr("id") || "";
  if (!raw) {
    // BeautifulSoup get_text(strip=True): every text node stripped, then joined
    const pieces: string[] = [];
    const walk = (node: any): void => {
      if (node.type === "text") pieces.push(String(node.data).trim());
      for (const child of node.children ?? []) walk(child);
    };
    const caption = $(table).find("caption").get(0);
    if (caption) walk(caption);
    raw = pieces.join("");
  }
  let key = cleanName(raw) || `table_${index}`;
  while (used.has(key)) {
    index++;
    key = `${key}_${index}`;
  }
  return key;
}

/**
 * Every `<table>` on a page as a cleaned frame keyed by its HTML id (py
 * `_html_tables.html_tables`). Tables with fewer than `minRows` data rows are
 * dropped (KenPom renders small nav / legend tables next to the real one).
 */
function htmlTables(html: string, minRows = 1): Record<string, Frame> {
  // libxml2 never decodes a named entity missing its `;` (`&nbsp` stays text);
  // htmlparser2 would — escape those first.
  const $ = load((html || "").replace(/&([A-Za-z_:][\w.:-]*)(?![\w.:;-])/g, "&amp;$1"));
  // BeautifulSoup collapses an all-ASCII-whitespace text node to "\n" (if it
  // holds one) or " " — outside <pre> / <textarea>.
  const collapse = (node: any, keep: boolean): void => {
    for (const child of node.children ?? []) {
      if (child.type === "text" && !keep && /^[ \n\t\f\r]+$/.test(child.data)) {
        child.data = child.data.includes("\n") ? "\n" : " ";
      }
      collapse(child, keep || child.name === "pre" || child.name === "textarea");
    }
  };
  collapse($.root().get(0), false);
  // cells concatenate ALL descendant text, so strip non-tabular elements first
  $("script, style, audio, video, noscript, svg").remove();
  // pandas: every <br> reads as a newline
  $("br").after("\n");
  const out: Record<string, Frame> = {};
  $("table")
    .toArray()
    .forEach((table: any, i: number) => {
      const frame = readTable($, table);
      if (!frame || frame.rows.length < minRows) return;
      out[tableKey($, table, i, new Set(Object.keys(out)))] = frame;
    });
  return out;
}

// ---------------------------------------------------------------------------
// KenPom tidying (py kenpom_runtime)
// ---------------------------------------------------------------------------

const POLARS_FLOAT = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
const POLARS_SPECIAL = /^[-+]?(inf|infinity|nan)$/i;

/** polars `str.strip_chars().str.replace("^\+", "").cast(Float64, strict=False)`. */
function polarsFloat(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/^\+/, "");
  if (POLARS_FLOAT.test(s)) return Number(s);
  if (POLARS_SPECIAL.test(s)) return /nan/i.test(s) ? NaN : s.startsWith("-") ? -Infinity : Infinity;
  return null;
}

/** A polars Utf8 column: one holding at least one string. */
const isText = (f: Frame, c: string): boolean => f.rows.some((r) => typeof r[c] === "string");

/** Drop KenPom's in-table header repeats + blank separator rows (anchor: first ≥50%-numeric text column). */
function dropRepeatedHeaders(f: Frame): Frame {
  for (const c of f.columns) {
    if (!isText(f, c)) continue;
    const parsed = f.rows.map((r) => polarsFloat(r[c]));
    const ok = parsed.filter((p) => p !== null).length;
    if (f.rows.length && ok / f.rows.length >= 0.5) {
      return { columns: f.columns, rows: f.rows.filter((_r, i) => parsed[i] !== null) };
    }
  }
  return { columns: f.columns, rows: f.rows.filter((r) => f.columns.some((c) => r[c] !== null)) };
}

/** Split the NCAA tournament seed off the team label (`"Duke 1"` -> `team: "Duke", ncaa_seed: 1`). */
function splitNcaaSeed(f: Frame): Frame {
  if (!f.columns.includes("team") || !isText(f, "team")) return f;
  const columns = f.columns.includes("ncaa_seed") ? f.columns : [...f.columns, "ncaa_seed"];
  const rows = f.rows.map((r): Row => {
    const team = r.team;
    if (typeof team !== "string") return { ...r, ncaa_seed: null };
    const m = /\s(\d{1,2})\s*\**\s*$/.exec(team);
    return { ...r, team: team.replace(/\s*\d{1,2}\s*\**\s*$/, "").trim(), ncaa_seed: m ? Number(m[1]) : null };
  });
  return { columns, rows: rows.map((r) => Object.fromEntries(columns.map((c) => [c, r[c] ?? null]))) };
}

/** Cast every fully-numeric text column to a number (KenPom serves text; signs carry a leading `+`). */
function castNumerics(f: Frame): Frame {
  const rows = f.rows.map((r) => ({ ...r }));
  for (const c of f.columns) {
    if (!isText(f, c)) continue;
    const parsed = f.rows.map((r) => polarsFloat(r[c]));
    const nullsBefore = f.rows.filter((r) => r[c] === null || r[c] === undefined).length;
    const nullsAfter = parsed.filter((p) => p === null).length;
    if (nullsAfter !== nullsBefore || parsed.length - nullsAfter === 0) continue;
    rows.forEach((r, i) => {
      r[c] = parsed[i];
    });
  }
  return { columns: f.columns, rows };
}

/** pandas `json_normalize` (sep ".") of the depth-chart records, keys through `underscore`. */
function depthChartTable(raw: string): Frame | null {
  const match = /const players\s*=\s*(\[[\s\S]*?\]);/.exec(raw || "");
  if (!match) return null;
  let records: unknown;
  try {
    records = JSON.parse(match[1]);
  } catch {
    return null;
  }
  if (!Array.isArray(records) || !records.length) return { columns: [], rows: [] };
  const flatten = (obj: Row, prefix: string, out: Row): Row => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (isPlainObject(v)) flatten(v, key, out);
      else out[key] = v;
    }
    return out;
  };
  const flat = records.map((r) => (isPlainObject(r) ? flatten(r, "", {}) : {}));
  const keys: string[] = [];
  for (const r of flat) for (const k of Object.keys(r)) if (!keys.includes(k)) keys.push(k);
  const columns = keys.map(underscore);
  return {
    columns,
    rows: flat.map((r) => Object.fromEntries(keys.map((k, i) => [columns[i], r[k] ?? null]))),
  };
}

/**
 * Parse a KenPom page into one table per HTML `<table>`, keyed by the table's id
 * (`ratings_table`, `player_table`, `schedule_table`, …). Two-row grouped
 * headers flatten to names like `strength_of_schedule_net_rtg` with the
 * unlabelled rank twin as `…_rk`; in-table header repeats and blank rows are
 * dropped; the tournament seed is split into `ncaa_seed`; fully-numeric text
 * columns become numbers. On `team.php` a `depth_chart` table is added from the
 * page's embedded script. Returns `{}` when the page has no data table (a
 * logged-out page, or a season / team that found nothing).
 *
 * @param section One table by its id (e.g. `"ratings_table"`) instead of the
 *   dict; an id the page does not have throws, listing the ids it does have
 *   (a page with no tables gives `[]`).
 */
export function parse_kenpom_page(raw: any, section?: string): Record<string, Row[]> | Row[] {
  const tables = kenpomTables(raw);
  if (section === undefined) return tables;
  if (!Object.keys(tables).length) return [];
  if (!Object.prototype.hasOwnProperty.call(tables, section)) {
    throw sectionError("parse_kenpom_page", section, Object.keys(tables), MULTI_TABLE_SECTIONS.parse_kenpom_page.default);
  }
  return tables[section];
}

/** Every table on the page, keyed by id (`parse_kenpom_page` without `section`). */
function kenpomTables(raw: any): Record<string, Row[]> {
  const html = typeof raw === "string" ? raw : "";
  const out: Record<string, Row[]> = {};
  for (const [key, frame] of Object.entries(htmlTables(html, 2))) {
    out[key] = castNumerics(splitNcaaSeed(dropRepeatedHeaders(frame))).rows;
  }
  const depth = depthChartTable(html);
  if (depth) out.depth_chart = castNumerics(depth).rows;
  return out;
}

// Node-only (cheerio): registered on import instead of listed in the browser-safe
// registry, so the playground's parser bundle never carries an HTML parser.
registerParser("parse_kenpom_page", parse_kenpom_page);

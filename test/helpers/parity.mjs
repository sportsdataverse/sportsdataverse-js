import { MLBAM_ID_COLUMNS } from '../../dist/parsers/mlb_statcast.js';

// Cell comparison for JS-parser vs sdv-py-oracle parity tests (keyless.test.js,
// parity.test.js). py frames are polars; object-dtype columns that py
// stringified compare by string form, everything else numerically.

const MLBAM_IDS = new Set(MLBAM_ID_COLUMNS);
/** A join-key column: `id`, `*_id`, `*_ids`, `*_pk`, or an MLBAM id column (`batter`, `on_1b`, ...). */
export const isIdColumn = (col) => col === 'id' || /_(ids?|pk)$/.test(col) || MLBAM_IDS.has(col);

/**
 * Does a non-null JS value have the JS type of a polars dtype (the oracle's
 * `dtypes`)? Integers / floats -> number|bigint, String -> string, Boolean ->
 * boolean, a List / Struct (JS JSON-encodes nested cells) or temporal -> string,
 * Null -> nothing (py has no value there). An unknown dtype fails closed.
 */
export function sameType(v, dtype) {
  if (/^(U?Int\d+|Float\d+|Decimal)/.test(dtype)) return typeof v === 'number' || typeof v === 'bigint';
  if (/^(String|Utf8|Categorical|Enum)/.test(dtype)) return typeof v === 'string';
  if (dtype === 'Boolean') return typeof v === 'boolean';
  if (/^(List|Array|Struct|Date|Datetime|Time|Duration)/.test(dtype)) return typeof v === 'string';
  if (dtype === 'Null') return false;
  if (dtype === 'Object') return true;
  throw new Error(`unknown polars dtype ${dtype}`);
}

export function same(a, b, col) {
  const nil = (v) => v === null || v === undefined;
  // A nested list / object cell (never a join key, even under an `*_ids` name): JS
  // JSON-encodes it, py keeps it (a polars List / Struct) or stringifies it with
  // str() (Python repr). Same structure = same.
  if (typeof a === 'string' && /^[[{]/.test(a) && !nil(b) && (typeof b === 'object' || /^[[{(]/.test(String(b)))) {
    try {
      return deepSame(JSON.parse(a), typeof b === 'object' ? b : pyLiteral(b));
    } catch {
      // not both parseable: compare as text below
    }
  }
  // Id columns are join keys: strict. Same type, same value, no numeric coercion.
  if (col && isIdColumn(col) && !nil(a) && !nil(b)) return a === b;
  // py stringifies a missing value in a mixed object column to "nan"; JS keeps null.
  if (b === 'nan' && nil(a)) return true;
  if (nil(a) || nil(b)) return (a ?? null) === (b ?? null);
  // CSV cells arrive as text in JS; py parsed them numerically.
  if (typeof a === 'string' && typeof b === 'number' && a.trim() !== '' && !Number.isNaN(Number(a))) a = Number(a);
  if (typeof a === 'number' && typeof b === 'number') return a === b || Math.abs(a - b) < 1e-9;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function deepSame(a, b) {
  if (a === null || b === null) return a === b;
  if (typeof a === 'number' && typeof b === 'number') return a === b || Math.abs(a - b) < 1e-9;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => deepSame(x, b[i]));
  if (typeof a === 'object') {
    if (typeof b !== 'object' || Array.isArray(b)) return false;
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every((k) => k in b && deepSame(a[k], b[k]));
  }
  return a === b;
}

const PY_ESC = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"' };

/** Parse Python literal text (`str()` of a list / dict / tuple) into JSON values; nan -> null. */
export function pyLiteral(s) {
  let i = 0;
  const fail = () => {
    throw new Error(`not a Python literal at ${i}: ${s.slice(i, i + 20)}`);
  };
  const ws = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };
  const seq = (close, item) => {
    i++;
    for (ws(); s[i] !== close; ws()) {
      if (i >= s.length) fail();
      item();
      ws();
      if (s[i] === ',') i++;
    }
    i++;
  };
  const val = () => {
    ws();
    const c = s[i];
    if (c === '[' || c === '(') {
      const out = [];
      seq(c === '[' ? ']' : ')', () => out.push(val()));
      return out;
    }
    if (c === '{') {
      const out = {};
      seq('}', () => {
        const k = val();
        ws();
        if (s[i++] !== ':') fail();
        out[k] = val();
      });
      return out;
    }
    if (c === "'" || c === '"') {
      let str = '';
      for (i++; s[i] !== c; i++) {
        if (i >= s.length) fail();
        if (s[i] !== '\\') {
          str += s[i];
          continue;
        }
        const e = s[++i];
        const hex = { x: 2, u: 4, U: 8 }[e];
        if (hex) {
          str += String.fromCodePoint(parseInt(s.slice(i + 1, i + 1 + hex), 16));
          i += hex;
        } else str += PY_ESC[e] ?? `\\${e}`;
      }
      i++;
      return str;
    }
    const m = /^(True|False|None|nan|-?inf|[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?)/.exec(s.slice(i));
    if (!m) fail();
    i += m[0].length;
    const lit = { True: true, False: false, None: null, nan: null, inf: Infinity, '-inf': -Infinity };
    return m[0] in lit ? lit[m[0]] : Number(m[0]);
  };
  const out = val();
  ws();
  if (i !== s.length) fail();
  return out;
}

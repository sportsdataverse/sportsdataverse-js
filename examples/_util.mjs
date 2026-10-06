// Shared helpers for the example scripts. Deterministic output (no timestamps,
// no locale formatting) so tools/docs/inject-outputs.mjs can freeze the tables.

/**
 * Print the first `n` rows of `rows` as a markdown-ish table restricted to `cols`.
 * Plain pipes (not console.table's box drawing) so the output pastes into docs.
 */
export function printTable(rows, cols, n = 8, title) {
  if (title) console.log(`\n## ${title}`);
  const shown = (rows ?? []).slice(0, n);
  const fmt = (v) => {
    if (v == null) return '';
    if (typeof v === 'bigint') return `${v}n`;
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(3)));
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return s.length > 28 ? `${s.slice(0, 25)}…` : s;
  };
  const widths = cols.map((c) => Math.max(c.length, ...shown.map((r) => fmt(r[c]).length)));
  const line = (cells) => `| ${cells.map((s, i) => s.padEnd(widths[i])).join(' | ')} |`;
  console.log(line(cols));
  console.log(line(widths.map((w) => '-'.repeat(w))));
  for (const r of shown) console.log(line(cols.map((c) => fmt(r[c]))));
  console.log(`(${rows?.length ?? 0} rows, ${n < (rows?.length ?? 0) ? `first ${n} shown` : 'all shown'})`);
}

/** Round to `d` decimals; keeps null/undefined. */
export const round = (v, d = 2) => (v == null ? v : Math.round(v * 10 ** d) / 10 ** d);

// Returns-table rendering for the reference docs (generate.mjs), split out so the
// tests can run a real vendored returns schema through it without running codegen.

/** Escape `|` (and stray backticks-balance is left as-is) for a markdown table cell. */
export function escapeCell(text) {
  return String(text ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

/** Render just the `col_name | type | description` table body (no heading). */
export function renderColumnsTable(columns) {
  let out = `| col_name | type | description |\n|---|---|---|\n`;
  for (const c of columns) {
    // MDX: a bare `{` / `<` in prose opens an expression / a tag (test/docs-mdx.test.js).
    const desc = c.description ? escapeCell(c.description).replace(/[{}<>]/g, (ch) => `\\${ch}`) : "";
    out += `| \`${escapeCell(c.name)}\` | ${escapeCell(c.type)} | ${desc} |\n`;
  }
  return out;
}

/**
 * Render a `### Returns — <label>` subsection: a `col_name | type | description`
 * table built from a returns-schema's columns. `label` is the wrapper's
 * display name (already backtick-wrapped by the caller). Returns "" when the
 * schema resolves to no columns (caller then skips emitting anything).
 */
export function renderReturnsTable(label, columns) {
  if (!columns || !columns.length) return "";
  return `\n### Returns — ${label}\n\n${renderColumnsTable(columns)}`;
}

/**
 * A flat endpoint's parsed returns schema for the docs: `{ columns }` (one table),
 * `{ frames: [{ section, columns }] }` (`kind: frames`, one table per key of the
 * parser's dict), `{ frames, framesBy }` (`kind: frames` + `frames_by: <param>`:
 * ONE table, whose columns are the frame whose `section` equals that request
 * parameter's value), `{ unverified }` (sdv-py publishes no columns, and says why),
 * or `null` (no columns). vendor.mjs checkSchemaShape has already refused any other shape.
 */
export function flatReturnsSchema(doc) {
  if (typeof doc?.unverified === "string") return { unverified: doc.unverified };
  if (doc?.kind === "frames" && doc.frames?.some((f) => f.columns?.length)) {
    return doc.frames_by ? { frames: doc.frames, framesBy: doc.frames_by } : { frames: doc.frames };
  }
  if (Array.isArray(doc?.columns) && doc.columns.length) return { columns: doc.columns };
  return null;
}

/** Render a flat endpoint's `### Returns` block (one table, one per frame, or the unverified note). */
export function renderFlatReturns(label, schema) {
  if (schema.columns) return renderReturnsTable(label, schema.columns);
  if (schema.unverified) {
    return `\n### Returns — ${label}\n\nNo returns table is published for this endpoint: ${escapeCell(schema.unverified).replace(/[{}<>]/g, (c) => `\\${c}`)}\n`;
  }
  const by = schema.framesBy && escapeCell(schema.framesBy);
  let out = by
    ? `\n### Returns — ${label}\n\nWith \`{ parsed: true }\`: a single table, whose columns depend on \`${by}\` (one set per value below).\n`
    : `\n### Returns — ${label}\n\nWith \`{ parsed: true }\`: an object of tables, one per key below.\n`;
  for (const f of schema.frames) {
    const head = by ? `When \`${by}\` is \`${escapeCell(f.section)}\`` : `\`${escapeCell(f.section)}\``;
    out += `\n**${head}**${f.columns.length ? "" : " — no columns in the reference capture"}\n\n`;
    if (f.columns.length) out += renderColumnsTable(f.columns);
  }
  return out;
}

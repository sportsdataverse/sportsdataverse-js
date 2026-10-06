// Generated TypeScript row types for `{ parsed: true }` returns (Task 18a).
//
// A row type is emitted ONLY for an endpoint the parser-parity harness verified
// on a real sdv-py capture: `verified_endpoints` of
// test/fixtures/py/parity_coverage.json (test/parsers/parity.test.js writes it).
// Every other wrapper's parsed rows are the shared `Row` (`Record<string, unknown>`).
//
// Column type rule (one rule, every typed surface):
//   - a column listed in `unexercised_columns` (null in every capture, its type
//     unchecked) -> `unknown`;
//   - an id column (`isIdColumn`, the runtime's own predicate, ./id-columns.mjs):
//     schema `integer` -> `string`; schema `double` / `numeric` -> `string | number`
//     (a DOUBLE id past 2^53 is not an exact integer, so the runtime leaves the
//     column a number with one SDV_INT64 warning, #91);
//   - `integer` / `double` / `numeric` -> `number`; `character` -> `string`;
//     `logical` -> `boolean`;
//   - every column `| null`, and optional (`?:`): the MLB / NHL api-web / 247
//     parsers flatten nested JSON without rectangularizing, so a row can lack a
//     column the payload did not carry.
// Dates: no verified returns schema has a date type; parsers return dates as the
// payload's ISO strings (`character` -> `string`). Release loaders decode DATE /
// TIMESTAMP to `Date`; their row types come from sdv-py's loader schemas instead
// (tools/codegen/loader-types.mjs).
//
// test/types/agreement.test.js parses the GENERATED TypeScript (not this module)
// and checks every value the parsers return on the committed captures against it.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { isIdColumn } from "./id-columns.mjs";

/** test/fixtures/py/parity_coverage.json: the harness's verified endpoints. */
export function loadParityCoverage(repoRoot) {
  return JSON.parse(readFileSync(join(repoRoot, "test", "fixtures", "py", "parity_coverage.json"), "utf8"));
}

const pascal = (s) =>
  s
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");

const IDENT = /^[A-Za-z_$][\w$]*$/;
/** A property key as TypeScript source: bare when an identifier, else quoted. */
export const tsKey = (k) => (IDENT.test(k) ? k : JSON.stringify(k));

/** The TypeScript type of one returns-schema column (see the header). */
export function columnType(name, type, unexercised) {
  if (unexercised) return "unknown";
  const id = isIdColumn(name);
  switch (type) {
    case "character":
      return "string | null";
    case "logical":
      return "boolean | null";
    case "integer":
      return id ? "string | null" : "number | null";
    case "double":
    case "numeric":
      return id ? "string | number | null" : "number | null";
    default:
      throw new Error(`row types: column ${name}: no TypeScript type for schema type ${type}`);
  }
}

const doc = (text) => text.replace(/\*\//g, "*\\/").replace(/\s+/g, " ").trim();

/**
 * Row types for one flat family: `{ source, types }`, where `source` is the
 * module text (or null: no verified endpoint) and `types` maps each verified
 * short to `{ parsed, sections, names }`: the TypeScript of the parsed result
 * without `section` (`parsed`), the section map type (`sections`, or null), and
 * the interface names the flat module imports.
 *
 * `sec` is the parser's `flat_parser_sections.yaml` spec (or undefined).
 */
export function renderRowsModule(api, defs, { coverage, schemasDir, sectionsOf, snakeOf, nsOf }) {
  const verified = coverage.families[api]?.verified_endpoints ?? {};
  const types = new Map();
  const seen = new Map(); // interface name -> schema ref (collision guard)
  let source = "";
  const iface = (name, ref, jsdoc, columns, unexercised, prefix) => {
    if (seen.has(name) && seen.get(name) !== ref) throw new Error(`row types: ${name} names ${seen.get(name)} and ${ref}`);
    if (seen.has(name)) return;
    seen.set(name, ref);
    source += `\n/**\n * ${jsdoc}\n */\nexport interface ${name} {\n`;
    for (const c of columns) {
      const un = unexercised.has(prefix + c.name);
      // Every column carries a doc comment (IDE hover; and no `(undocumented)` line per
      // column in the API report): its description, then the schema type it was typed from.
      const notes = [];
      if (c.description) notes.push(doc(c.description));
      notes.push(`Schema \`${c.type}\`${isIdColumn(c.name) ? " (an id)" : ""}.`);
      if (un) notes.push("Unexercised: null in every sdv-py capture, so its type is unchecked.");
      source += `  /** ${notes.join(" ")} */\n`;
      source += `  ${tsKey(c.name)}?: ${columnType(c.name, c.type, un)};\n`;
    }
    source += "}\n";
  };
  for (const def of defs.slice().sort((a, b) => a.short.localeCompare(b.short))) {
    const v = verified[def.short];
    if (!v) continue;
    const file = join(schemasDir, `${def.returnsSchema}.yaml`);
    if (!def.returnsSchema || !existsSync(file)) throw new Error(`row types: ${api}.${def.short} is verified but has no schema`);
    const schema = parse(readFileSync(file, "utf8"));
    if (schema.frames_by) throw new Error(`row types: ${api}.${def.short}: a frames_by schema is never verified`);
    const unexercised = new Set(v.unexercised_columns);
    const ref = def.returnsSchema;
    const base = pascal(ref.split("/").slice(-2).join("_"));
    const snake = snakeOf(def);
    const call = `\`sdv.${nsOf(def)}.${snake}({ parsed: true })\``;
    const sec = sectionsOf(def);
    const where = `returns schema \`${ref}\`, verified on a real sdv-py capture`;
    if (schema.kind === "frames") {
      if (!sec?.resultSet) throw new Error(`row types: ${api}.${def.short}: kind: frames on a parser without result sets`);
      const tables = `${base}Tables`;
      const names = [tables];
      const members = [];
      for (const f of schema.frames) {
        const row = `${base}${pascal(f.section)}Row`;
        iface(row, `${ref}#${f.section}`, `One row of the \`${f.section}\` table of ${call} (${where}).`, f.columns, unexercised, `${f.section}.`);
        names.push(row);
        members.push(`  /** The \`${f.section}\` result set. */\n  ${tsKey(f.section)}: ${row}[];\n`);
      }
      source += `\n/**\n * The tables of ${call}, keyed by result set (${where}). A payload with one result\n * set returns that table itself; \`section\` picks one table.\n */\nexport interface ${tables} {\n${members.join("")}}\n`;
      seen.set(tables, ref);
      types.set(def.short, { parsed: `${tables} | Row[]`, sections: tables, names });
    } else {
      const row = `${base}Row`;
      iface(row, ref, `One row of ${call} (${where}).`, schema.columns, unexercised, "");
      // A result-set parser returns a one-set payload's table, or every table as a dict.
      const parsed = sec?.resultSet ? `${row}[] | ParsedTables` : `${row}[]`;
      const sections = sec && sec.default !== null ? `{ ${tsKey(sec.default)}: ${row}[] }` : null;
      types.set(def.short, { parsed, sections, names: [row] });
    }
  }
  if (!types.size) return { source: null, types, exports: [] };
  const header =
    "// AUTO-GENERATED by tools/codegen/generate.mjs — do not edit by hand.\n" +
    "// Run `npm run codegen` to regenerate (tools/codegen/row-types.mjs).\n" +
    "//\n" +
    `// Row types of the \`${api}\` endpoints whose returns schema the parser-parity harness\n` +
    "// verified on a real sdv-py capture (test/fixtures/py/parity_coverage.json). Ids are\n" +
    "// decimal strings; a column null in every capture is `unknown`; every column is\n" +
    "// optional and nullable (tools/codegen/row-types.mjs has the rule).\n";
  return { source: header + source, types, exports: [...seen.keys()] };
}

/**
 * The TypeScript of one flat wrapper's type: `Wrapper<P, A>` for a one-table parser,
 * `SectionedWrapper<P, S, A>` for a multi-table one (`section`), `Wrapper<unknown, A>`
 * when the endpoint has no parser (`parsed` returns the raw payload). `params` is the
 * name of its generated params type `A` (tools/codegen/param-types.mjs).
 */
export function flatWrapperType(def, sec, typed, params) {
  if (!def.parser) return `Wrapper<unknown, ${params}>`;
  if (!sec) return `Wrapper<${typed ? typed.parsed : "Row[]"}, ${params}>`;
  const parsed = typed?.parsed ?? (sec.default === null ? "Row[] | ParsedTables" : "Row[]");
  return `SectionedWrapper<${parsed}, ${typed?.sections ?? "{}"}, ${params}>`;
}

/** The barrel of every generated row type (re-exported by src/index.ts). */
export function renderRowsBarrel(byApi) {
  const nl = "\n";
  let body =
    "// AUTO-GENERATED by tools/codegen/generate.mjs — do not edit by hand." + nl +
    "// Run `npm run codegen` to regenerate (tools/codegen/row-types.mjs)." + nl + "//" + nl +
    "// Every generated row type, re-exported from the package root." + nl;
  for (const api of [...byApi.keys()].sort()) {
    body += nl + "export type {" + nl + byApi.get(api).map((n) => `  ${n},${nl}`).join("") + `} from "./${api}.js";` + nl;
  }
  return body;
}

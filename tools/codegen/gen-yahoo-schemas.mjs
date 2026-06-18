// One-shot generator for the Yahoo returns-schema YAMLs. Reads each endpoint
// YAML + its OpenAPI spec, maps every endpoint short -> its 200-response schema,
// and emits tools/codegen/schemas/native/yahoo_{editorial,shangrila}/<short>.yaml
// with snake_cased columns derived from the list-item props the parser flattens
// (deep-flattened with `_`). Untyped leaves -> `columns: []` + a note. This
// mirrors the cbs / fox returns-schema shape. Run once:
//   node tools/codegen/gen-yahoo-schemas.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");
const swaggerDir = join(repoRoot, "..", "..", "sdv-swagger");

function snakeCase(s) {
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/__+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function resolveRef(spec, ref) {
  if (typeof ref !== "string" || !ref.startsWith("#/")) return null;
  const segs = ref.slice(2).split("/").map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
  let node = spec;
  for (const seg of segs) {
    if (node && typeof node === "object" && seg in node) node = node[seg];
    else return null;
  }
  return node;
}

/** OpenAPI type -> R-ish type label used in the schema column tables. */
function typeLabel(schema) {
  const t = schema?.type;
  if (t === "integer" || t === "number") return "numeric";
  if (t === "boolean") return "logical";
  if (t === "array") return "list";
  return "character";
}

/**
 * Flatten an object schema's leaf props into snake_cased dotted column names,
 * mirroring `normalize`'s deep-flatten (`team.displayName` -> `team_display_name`).
 * Untyped leaves (`{}` / no `type`) become `character` columns (the parser will
 * stringify them). Returns `[{name, type}]`. Recurses one level into nested
 * object props; arrays/unknowns are emitted as a single column.
 */
function flattenProps(spec, schema, prefix = "", depth = 0) {
  const out = [];
  if (!schema || typeof schema !== "object") return out;
  if (schema.$ref) schema = resolveRef(spec, schema.$ref) ?? {};
  const props = schema.properties;
  if (!props || typeof props !== "object") return out;
  for (const [key, raw] of Object.entries(props)) {
    let propSchema = raw && raw.$ref ? resolveRef(spec, raw.$ref) ?? {} : raw ?? {};
    const col = prefix ? `${prefix}_${snakeCase(key)}` : snakeCase(key);
    if (
      depth < 2 &&
      propSchema &&
      propSchema.type === "object" &&
      propSchema.properties &&
      Object.keys(propSchema.properties).length
    ) {
      out.push(...flattenProps(spec, propSchema, col, depth + 1));
    } else {
      out.push({ name: col, type: typeLabel(propSchema) });
    }
  }
  return out;
}

/**
 * Walk a 200-response schema to the list-item object the parser flattens. For
 * shangrila: peel `data`, take the first array-valued root field, descend to
 * `items`. For editorial keyed maps there is no typed item, so return null.
 * Returns the item object-schema (or null when not derivable).
 */
function responseItemSchema(spec, respSchema, kind) {
  if (!respSchema) return null;
  if (respSchema.$ref) respSchema = resolveRef(spec, respSchema.$ref) ?? {};
  const props = respSchema.properties ?? {};
  if (kind === "shangrila") {
    const data = props.data?.$ref ? resolveRef(spec, props.data.$ref) : props.data;
    const dataProps = data?.properties ?? {};
    for (const v of Object.values(dataProps)) {
      const vv = v?.$ref ? resolveRef(spec, v.$ref) : v;
      if (vv?.type === "array" && vv.items) {
        return vv.items.$ref ? resolveRef(spec, vv.items.$ref) : vv.items;
      }
    }
  }
  return null;
}

function emit(api, short, columns, note) {
  const dir = join(repoRoot, "tools", "codegen", "schemas", "native", api);
  mkdirSync(dir, { recursive: true });
  const L = [];
  L.push(`# Yahoo Sports ${api === "yahoo_scores" ? "editorial" : "shangrila"} — generated returns schema.`);
  L.push(`# ${note}`);
  L.push(`schema: ${short}`);
  L.push(`kind: dataframe`);
  if (columns.length) {
    L.push(`columns:`);
    for (const c of columns) {
      L.push(`- name: ${c.name}`);
      L.push(`  type: ${c.type}`);
    }
  } else {
    L.push(`columns: []`);
  }
  writeFileSync(join(dir, `${short}.yaml`), L.join("\n") + "\n");
}

function getRespSchema(spec, op) {
  const content = op?.responses?.["200"]?.content?.["application/json"]?.schema;
  return content ?? null;
}

/** Index a spec's GET operations by path -> operation. */
function opsByPath(spec) {
  const m = new Map();
  for (const [path, ops] of Object.entries(spec.paths ?? {})) {
    if (ops?.get) m.set(path, ops.get);
  }
  return m;
}

function run(api, specFile) {
  const spec = parse(readFileSync(join(swaggerDir, specFile), "utf8"));
  const endpoints = parse(
    readFileSync(join(here, "endpoints", `${api}.yaml`), "utf8")
  ).endpoints;
  const ops = opsByPath(spec);
  const kind = api === "yahoo_scores" ? "editorial" : "shangrila";
  let typed = 0;
  let untyped = 0;
  for (const ep of endpoints) {
    // The endpoint path tokens were snake-rewritten; restore camelCase tokens to
    // match the spec path by looking up the op whose path matches ignoring token
    // casing.
    const specPath = [...ops.keys()].find(
      (p) => p.replace(/\{[^}]+\}/g, "{}") === ep.path.replace(/\{[^}]+\}/g, "{}")
    );
    const op = specPath ? ops.get(specPath) : null;
    let columns = [];
    let note;
    if (kind === "editorial") {
      // Keyed maps (game/player id -> object) have no typed item in the spec, so
      // columns aren't enumerable ahead of a live capture.
      note =
        `Parsed by parse_yahoo_scores_${ep.short === "scoreboard" || ep.short === "boxscore" ? ep.short : "list"}. ` +
        `The editorial ${ep.short} payload is a keyed map (id -> object) with no ` +
        `typed item schema; the parser unrolls + snake_cases whatever keys the ` +
        `payload ships, so columns are not enumerable ahead of a live capture.`;
    } else {
      const respSchema = getRespSchema(spec, op);
      const item = responseItemSchema(spec, respSchema, kind);
      if (item) columns = flattenProps(spec, item);
      // Drop array/object-only placeholder columns that flatten to nothing.
      columns = columns.filter((c) => c.name);
      const parser = ep.parser.replace("parse_yahoo_", "");
      if (columns.length) {
        note =
          `Parsed by ${ep.parser}. Columns derived from the spec's typed ` +
          `${parser === "stats" ? "nested stat-array" : "root-list"} item props ` +
          `(deep-flattened with \`_\`, snake_cased to match the parser output).`;
      } else {
        note =
          `Parsed by ${ep.parser}. The spec ships no typed list item for this ` +
          `query, so columns are not enumerable ahead of a live capture; the ` +
          `parser snake_cases + flattens whatever keys the payload ships.`;
      }
    }
    if (columns.length) typed++;
    else untyped++;
    emit(api, ep.short, columns, note);
  }
  console.log(`${api}: ${endpoints.length} schemas (${typed} typed, ${untyped} empty).`);
}

run("yahoo_scores", "yahoo-sports-editorial.openapi.yaml");
run("yahoo", "yahoo-sports-shangrila.openapi.yaml");

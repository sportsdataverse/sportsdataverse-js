// ---------------------------------------------------------------------------
// from-openapi.mjs — OpenAPI 3.x -> codegen flat-API endpoint-YAML transform.
//
// Reads an OpenAPI 3.x spec and emits a codegen "flat-API endpoint YAML" in the
// exact shape of tools/codegen/endpoints/odds_api.yaml / nfl_api.yaml:
//
//     api: <stem>
//     host: <bare origin>
//     [auth: true]            # only for bearer / header-token schemes
//     endpoints:
//       - short: <snake>
//         path: /base/path/{param}
//         parser: parse_<api>_<short>     # placeholder — authored on top
//         returns_schema: native/<api>/<short>
//         path_params:  [{name, required}]
//         extra_params: [{name, query_key, default}]
//
// The emitted file is a SKELETON. Authored parsers (src/parsers/<api>.ts) and
// returns schemas (tools/codegen/schemas/native/<api>/*.yaml) are layered on
// top of it by hand — the transform fills `parser:` / `returns_schema:` with
// canonical placeholder names so nothing dangles, and a human then implements
// those parsers/schemas. Hand-review the emitted YAML for awkward `short`
// names, query-key casing, and sane defaults before wiring the family in.
//
// Usage:
//     node tools/codegen/from-openapi.mjs <spec.yaml> --api <stem> \
//          --out tools/codegen/endpoints/<stem>.yaml
//
// Flags:
//     --api <stem>     family stem (e.g. sports247). REQUIRED.
//     --out <path>     output YAML path. Defaults to endpoints/<stem>.yaml.
//     --host <url>     override the host (use when the spec has no `servers`).
//     --stdout         print to stdout instead of writing a file.
//
// Mapping rules:
//   - host: from servers[0].url — split into the bare origin (host) and a base
//     path that prefixes every endpoint path. (Swagger-2 host+basePath also
//     handled.) When the spec carries neither, falls back to `--host` or a
//     clearly-flagged placeholder + a warning.
//   - short: snake_case from operationId if present, else from the path (drop
//     the shared base, drop {param} segments, join remaining segments with _).
//     Collisions de-duplicated with a numeric suffix.
//   - path_params: parameters with `in: path` -> {name: <snake>, required:true}.
//     The path template keeps its original {token}; when the snake_cased param
//     name differs from the token, a `# maps {token} -> name` comment is noted.
//   - extra_params: parameters with `in: query` -> {name: <snake>,
//     query_key: <original>, default: <schema.default if any>}.
//   - auth: an apiKey-in-query security scheme is surfaced as an `extra_params`
//     api_key entry (+ comment); only bearer / apiKey-in-header schemes set the
//     top-level `auth: true` (like nfl_api).
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- arg parsing -----------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--stdout") args.stdout = true;
    else if (a === "--api") args.api = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--host") args.host = argv[++i];
    else if (a.startsWith("--")) throw new Error(`unknown flag: ${a}`);
    else args._.push(a);
  }
  return args;
}

// --- string helpers --------------------------------------------------------

/**
 * snake_case an arbitrary token. Handles camelCase, PascalCase, kebab-case,
 * dot.separated, and runs of capitals (`sportKey` -> `sport_key`,
 * `RDBFeed` -> `rdb_feed`). Non-alphanumerics collapse to single `_`.
 */
function snakeCase(s) {
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2") // camel boundary
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2") // run-of-caps boundary
    .replace(/[^a-zA-Z0-9]+/g, "_") // separators -> _
    .replace(/__+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

/** Path-template tokens like `{sportKey}` -> ["sportKey"]. */
function pathTokens(path) {
  return [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
}

// --- host / base-path resolution -------------------------------------------

/**
 * Resolve (host, basePath) from the spec. OpenAPI 3 uses `servers[0].url`
 * (which may be a full URL or just a path); Swagger 2 uses `host` + `basePath`
 * (+ `schemes`). Returns { host, basePath, warning? }.
 */
function resolveHost(spec, override) {
  if (override) return { host: override.replace(/\/+$/, ""), basePath: "" };

  // OpenAPI 3 servers[]
  const serverUrl = spec.servers?.[0]?.url;
  if (serverUrl) {
    try {
      const u = new URL(serverUrl);
      const basePath = u.pathname.replace(/\/+$/, "");
      return { host: `${u.protocol}//${u.host}`, basePath: basePath === "/" ? "" : basePath };
    } catch {
      // servers[0].url was a bare path (no origin) — treat it as the base path.
      const basePath = serverUrl.replace(/\/+$/, "");
      return {
        host: "https://REPLACE_ME.invalid",
        basePath: basePath.startsWith("/") ? basePath : `/${basePath}`,
        warning: `servers[0].url ("${serverUrl}") has no origin — host set to a placeholder; pass --host or edit the YAML.`,
      };
    }
  }

  // Swagger 2 host + basePath
  if (spec.host) {
    const scheme = (spec.schemes && spec.schemes[0]) || "https";
    return {
      host: `${scheme}://${spec.host}`,
      basePath: (spec.basePath || "").replace(/\/+$/, ""),
    };
  }

  // Nothing — placeholder + warning.
  return {
    host: "https://REPLACE_ME.invalid",
    basePath: "",
    warning:
      "spec has no `servers` (OpenAPI 3) or `host` (Swagger 2) — host set to a placeholder; pass --host or edit the emitted YAML.",
  };
}

// --- security ---------------------------------------------------------------

/**
 * Inspect components.securitySchemes for the auth shape. Returns:
 *   { topLevelAuth: bool, queryApiKey: {name} | null, note: string | null }
 * - apiKey-in-query  -> surfaced as an extra_params entry on every endpoint
 *                       (the caller supplies the key as a query param).
 * - bearer / apiKey-in-header -> top-level `auth: true` (token machinery, like
 *                       nfl_api's WEB_DESKTOP bearer).
 */
function resolveSecurity(spec) {
  const schemes = spec.components?.securitySchemes ?? {};
  let topLevelAuth = false;
  let queryApiKey = null;
  const notes = [];
  for (const [name, s] of Object.entries(schemes)) {
    if (!s || typeof s !== "object") continue;
    const type = (s.type || "").toLowerCase();
    if (type === "http" && (s.scheme || "").toLowerCase() === "bearer") {
      topLevelAuth = true;
      notes.push(`bearer scheme "${name}" -> top-level auth: true (token minted by the flat dispatch).`);
    } else if (type === "apikey" && (s.in || "").toLowerCase() === "query") {
      queryApiKey = { name: s.name || "apiKey" };
      notes.push(`apiKey-in-query scheme "${name}" (param "${s.name}") -> caller-supplied query param.`);
    } else if (type === "apikey" && (s.in || "").toLowerCase() === "header") {
      // Header API key (e.g. JWT Authorization: Bearer). Token auth like nfl_api.
      topLevelAuth = true;
      notes.push(`apiKey-in-header scheme "${name}" (header "${s.name}") -> top-level auth: true (header token).`);
    } else if (type === "oauth2" || type === "openidconnect") {
      topLevelAuth = true;
      notes.push(`${type} scheme "${name}" -> top-level auth: true.`);
    }
  }
  return { topLevelAuth, queryApiKey, note: notes.length ? notes.join(" ") : null };
}

// --- short-name derivation --------------------------------------------------

/**
 * Derive a stable snake_case `short` for an endpoint. Prefer operationId; else
 * build from the path (drop the shared base prefix, drop {param} segments).
 */
function deriveShort(path, basePath, operationId) {
  if (operationId) {
    // Strip a leading version-y prefix (e.g. `rdb/v{version}/`) by dropping
    // {token} segments and any literal `v\d`-style version segment, then snake.
    const segs = operationId
      .split("/")
      .filter((seg) => seg && !/^\{.*\}$/.test(seg) && !/^v\{?version\}?$/i.test(seg) && !/^v\d+$/i.test(seg));
    const cleaned = segs.join("_");
    const short = snakeCase(cleaned || operationId);
    if (short) return short;
  }
  // Path-derived: drop the base prefix, drop {param} tokens, join the rest.
  let rel = path;
  if (basePath && rel.startsWith(basePath)) rel = rel.slice(basePath.length);
  const segs = rel
    .split("/")
    .filter((seg) => seg && !/^\{.*\}$/.test(seg) && !/^v\d+$/i.test(seg));
  return snakeCase(segs.join("_")) || "root";
}

// --- main transform ---------------------------------------------------------

function transform(spec, api, hostOverride) {
  const { host, basePath, warning } = resolveHost(spec, hostOverride);
  const security = resolveSecurity(spec);

  const seen = new Map(); // short -> count, for collision de-dup
  const endpoints = [];
  const paramNotes = [];

  for (const [path, ops] of Object.entries(spec.paths ?? {})) {
    const get = ops?.get;
    if (!get) continue; // only GET endpoints are flat-API wrappers

    // de-dup short names
    let short = deriveShort(path, basePath, get.operationId);
    if (seen.has(short)) {
      const n = seen.get(short) + 1;
      seen.set(short, n);
      short = `${short}_${n}`;
    } else {
      seen.set(short, 1);
    }

    const params = get.parameters ?? [];

    // Rewrite path template tokens to the snake_case param name so the codegen
    // resolver (which substitutes the token by matching `pathParam.name`) can
    // resolve them. The HTTP path is just string substitution — the token name
    // is internal — so `{sportKey}` -> `{sport_key}` changes nothing on the
    // wire. Mirrors how nfl_api keeps snake tokens (`{season_type}`).
    let outPath = path;
    const pathParams = [];
    for (const p of params.filter((x) => x.in === "path")) {
      const snake = snakeCase(p.name);
      if (snake !== p.name) {
        outPath = outPath.replace(`{${p.name}}`, `{${snake}}`);
        paramNotes.push(`${short}: path token {${p.name}} rewritten to {${snake}} to match the param name.`);
      }
      pathParams.push({ name: snake, required: true, _token: p.name });
    }

    const extraParams = [];
    // apiKey-in-query is required on EVERY endpoint — surface it first.
    if (security.queryApiKey) {
      extraParams.push({ name: "api_key", query_key: security.queryApiKey.name });
    }
    for (const p of params.filter((x) => x.in === "query")) {
      const entry = { name: snakeCase(p.name), query_key: p.name };
      const def = p.schema?.default ?? p.default;
      if (def !== undefined) entry.default = def;
      extraParams.push(entry);
    }

    endpoints.push({
      short,
      path: outPath,
      parser: `parse_${api}_${short}`,
      returns_schema: `native/${api}/${short}`,
      pathParams,
      extraParams,
    });
  }

  return { host, basePath, security, warning, endpoints, paramNotes };
}

// --- YAML emit (hand-rolled for the exact inline-flow style the repo uses) ---

function emitYaml(api, host, security, endpoints) {
  const L = [];
  L.push("# AUTO-EMITTED by tools/codegen/from-openapi.mjs from an OpenAPI 3.x spec.");
  L.push("# This is a SKELETON: `parser:` / `returns_schema:` point at canonical");
  L.push("# placeholder names that are then AUTHORED by hand:");
  L.push(`#   - parsers:  src/parsers/${api}.ts (register in src/parsers/_registry.ts)`);
  L.push(`#   - schemas:  tools/codegen/schemas/native/${api}/<short>.yaml`);
  L.push("# Hand-review the short names / query keys / defaults below before wiring up.");
  if (security.note) L.push(`# Auth: ${security.note}`);
  L.push(`api: ${api}`);
  L.push(`host: ${host}`);
  if (security.topLevelAuth) L.push("auth: true");
  L.push("endpoints:");

  for (const ep of endpoints) {
    L.push(`- short: ${ep.short}`);
    L.push(`  path: ${ep.path}`);
    L.push(`  parser: ${ep.parser}`);
    L.push(`  returns_schema: ${ep.returns_schema}`);
    if (ep.pathParams.length) {
      L.push("  path_params:");
      for (const p of ep.pathParams) {
        let line = `  - {name: ${p.name}, required: ${p.required}}`;
        if (p._token && p._token !== p.name) line += `  # template token {${p._token}}`;
        L.push(line);
      }
    }
    if (ep.extraParams.length) {
      L.push("  extra_params:");
      for (const p of ep.extraParams) {
        const parts = [`name: ${p.name}`, `query_key: ${p.query_key}`];
        if (p.default !== undefined) parts.push(`default: ${formatScalar(p.default)}`);
        L.push(`  - {${parts.join(", ")}}`);
      }
    }
  }
  return L.join("\n") + "\n";
}

function formatScalar(v) {
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  // quote strings that could be misread as YAML scalars
  if (/^[\s]|[\s]$|[:#]/.test(String(v))) return JSON.stringify(String(v));
  return String(v);
}

// --- entry ------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  const specPath = args._[0];
  if (!specPath || !args.api) {
    console.error(
      "usage: node tools/codegen/from-openapi.mjs <spec.yaml> --api <stem> [--out <path>] [--host <url>] [--stdout]"
    );
    process.exit(2);
  }

  const spec = parse(readFileSync(specPath, "utf8"));
  const { host, security, warning, endpoints, paramNotes } = transform(spec, args.api, args.host);
  const yaml = emitYaml(args.api, host, security, endpoints);

  if (args.stdout) {
    process.stdout.write(yaml);
  } else {
    const out = args.out || join(__dirname, "endpoints", `${args.api}.yaml`);
    writeFileSync(out, yaml);
    console.log(`from-openapi: wrote ${endpoints.length} endpoints -> ${out}`);
  }

  // Summary to stderr so --stdout stays clean.
  const log = args.stdout ? console.error : console.log;
  log(`from-openapi: ${endpoints.length} endpoint(s) emitted for api "${args.api}" (host ${host}).`);
  if (security.note) log(`from-openapi: auth — ${security.note}`);
  if (warning) log(`from-openapi: WARNING — ${warning}`);
  for (const n of paramNotes) log(`from-openapi: note — ${n}`);
}

main();

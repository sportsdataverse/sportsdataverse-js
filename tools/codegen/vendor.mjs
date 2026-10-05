// One-way vendor sync: sportsdataverse-py codegen YAML -> sportsdataverse-js.
//
// Reads tools/codegen/vendor.yaml (pinned sdv-py ref + per-family transforms),
// keeps a verbatim copy of every upstream file under tools/codegen/vendor/
// upstream/ (committed, with REF + a LOCK of git blob shas from the pinned tree,
// so the check is offline), and derives:
//   - tools/codegen/endpoints/<family>.yaml  (api-stem / short-name / parser /
//     returns-schema rewrites + overlay/<family>.yaml merged on top)
//   - tools/codegen/schemas/**               (the py schemas those families keep
//     under the returns-schema policy, copied verbatim to their rewritten path)
//   - the manifest's `copy:` files, verbatim (e.g. endpoints/releases.yaml)
//   - tools/codegen/py_public_names.json      (the public names sdv-py's
//     generated modules define at the pin — every vendored flat family's
//     `module` and each league's `<prefix>_espn_ext` — read from their verbatim
//     copies under vendor/upstream/py/; test/naming.test.js holds JS's names to it)
//
//   node tools/codegen/vendor.mjs [--ref <sha>]   # fetch upstream, re-derive
//   node tools/codegen/vendor.mjs --offline       # re-derive from vendor/upstream
//   node tools/codegen/vendor.mjs --check         # offline gate: LOCK + drift (exit 1)
//
// Fetch source: GitHub raw at the pinned ref by default; env SDV_PY_REPO=<path
// to an sdv-py clone> reads the same ref through `git cat-file` (never the
// clone's working tree).
import {
  appendFileSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, parseDocument } from "yaml";

// SDV_VENDOR_ROOT: test hook so a spawned `vendor.mjs` (and vendor-lock-online.mjs, which
// imports this) works on a temp copy of tools/codegen. Empty counts as unset.
export const CODEGEN_DIR = process.env.SDV_VENDOR_ROOT || dirname(fileURLToPath(import.meta.url));
const UPSTREAM = join("vendor", "upstream");
const REF_FILE = "REF";
// "<git blob sha>  <path>" per upstream file, taken from the pinned tree at fetch
// time; the offline check re-hashes every committed copy against it.
const LOCK_FILE = "LOCK";
const PY_CODEGEN = "tools/codegen/";
// Upstream subdir for verbatim sdv-py package modules (`py/sportsdataverse/...`).
const PY_UP = "py/";
const PY_PKG = "sportsdataverse";
/** Derived output: sdv-py's generated public names at the pin. */
export const PY_NAMES_FILE = "py_public_names.json";

const read = (p) => readFileSync(p, "utf8");
/**
 * Decode upstream bytes to text with a leading UTF-8 BOM stripped. The ONE decoder
 * for upstream text, used for both a fresh fetch (bytes from GitHub / git) and a
 * committed copy read back from disk, so a BOM can never make the two diverge.
 * The bytes themselves stay verbatim on disk (LOCK hashes them).
 */
export const decodeText = (buf) => buf.toString("utf8").replace(/^﻿/, "");
const readUp = (p) => decodeText(readFileSync(p));

/** sdv-py repo path of an upstream path (codegen files, or `py/<repo path>`). */
const repoPath = (p) => (p.startsWith(PY_UP) ? p.slice(PY_UP.length) : `${PY_CODEGEN}${p}`);

/**
 * Stems of the sdv-py GENERATED modules whose public names JS must match: each
 * vendored family's `module` (flat APIs) and `<prefix>_espn_ext` for every
 * league. `readUpstream(path)` returns an upstream endpoint file's text.
 */
export function pyModuleStems(manifest, readUpstream) {
  const stems = new Set();
  for (const [key, cfg] of familyEntries(manifest)) {
    const doc = parse(readUpstream(upstreamEndpointPath(key, cfg)));
    if (doc?.module) stems.add(doc.module);
    for (const l of doc?.leagues ?? []) stems.add(`${l.prefix}_espn_ext`);
  }
  return [...stems].sort();
}

/** Top-level public function names a Python module defines (sorted). */
export function pyPublicNames(source) {
  return [...source.matchAll(/^(?:async )?def ([A-Za-z]\w*)\(/gm)].map((m) => m[1]).sort();
}

/** Render py_public_names.json from the upstream `py/` copies (offline, deterministic). */
function renderPyNames(up, ref) {
  const modules = {};
  for (const p of listFiles(join(up, PY_UP)).filter((f) => f.endsWith(".py"))) {
    const stem = p.slice(p.lastIndexOf("/") + 1, -3);
    modules[stem] = { path: p, names: pyPublicNames(read(join(up, PY_UP, p))) };
  }
  const sorted = Object.fromEntries(Object.keys(modules).sort().map((k) => [k, modules[k]]));
  const body = Object.entries(sorted)
    .map(([k, v]) => `    ${JSON.stringify(k)}: { "path": ${JSON.stringify(v.path)}, "names": ${JSON.stringify(v.names)} }`)
    .join(",\n");
  return (
    `{\n  "_generated": "tools/codegen/vendor.mjs from vendor/upstream/py/ (verbatim sdv-py modules at ref) — do not edit",\n` +
    `  "ref": ${JSON.stringify(ref)},\n  "modules": {\n${body}\n  }\n}\n`
  );
}

/** Git's blob id for a file's bytes: sha1("blob <len>\0" + bytes). */
export function gitBlobSha(buf) {
  return createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
}

/** JSON with sorted object keys, for order-insensitive YAML value comparison. */
function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}
const plain = (node) => (node && typeof node.toJSON === "function" ? node.toJSON() : node);

export function loadManifest(root = CODEGEN_DIR) {
  return parse(read(join(root, "vendor.yaml")));
}

const familyEntries = (manifest) =>
  Object.entries(manifest.families ?? {}).map(([key, cfg]) => [key, cfg ?? {}]);

/** Upstream endpoint file (codegen-relative) for a family. */
const upstreamEndpointPath = (key, cfg) => `endpoints/${cfg.from ?? key}.yaml`;

/** Rewrite a returns-schema ref / schema file path by the family's prefix map. */
export function rewriteSchema(ref, prefixes = {}) {
  for (const [from, to] of Object.entries(prefixes)) {
    if (ref.startsWith(from)) return to + ref.slice(from.length);
  }
  return ref;
}

/** The `returns_schema` refs an endpoint YAML text names. */
// Memoized by text: the YAML parse dominates a check (derive + orphan scan read the
// same ~1 MB of endpoint files several times), and the result is pure in `text`.
const epsMemo = new Map();
function endpointsOf(text) {
  if (!epsMemo.has(text)) {
    const eps = parse(text)?.endpoints; // espn_parser_map.yaml's is a map, not a list
    epsMemo.set(text, Array.isArray(eps) ? eps : []);
  }
  return epsMemo.get(text);
}
export function schemaRefs(text) {
  return [...new Set(endpointsOf(text).map((e) => e?.returns_schema).filter(Boolean))];
}

/** Per endpoint of a family text using returns schema `ref`: its request (path + extra) param names. */
function requestParams(text, ref) {
  return endpointsOf(text)
    .filter((e) => e?.returns_schema === ref)
    .map((e) => [...(e.path_params ?? []), ...(e.extra_params ?? [])].map((p) => p?.name));
}

/**
 * The schema files a ref resolves to, from a list of available schema paths
 * (relative to schemas/): `<ref>.yaml` plus the per-league `<ref>/<x>.yaml`
 * variants (sdv-py resolves `schemas/<ref>/<league>.yaml` before `<ref>.yaml`).
 */
export function schemaFilesFor(ref, available) {
  const dir = `${ref}/`;
  return available.filter(
    (p) =>
      p === `${ref}.yaml` ||
      (p.startsWith(dir) && p.endsWith(".yaml") && !p.slice(dir.length).includes("/"))
  );
}

/**
 * The JS parser a py parser maps to, and whether its output is described by
 * py's returns schema. Fail-closed: compatibility must be DECLARED in
 * vendor.yaml, per parser (`parsers: {<py>: {js, schema_compatible}}`) or, for py
 * names kept as-is, per family (`schema_compatible: true`, for families whose JS
 * parsers are faithful ports of sdv-py's). Undeclared = not compatible.
 */
export function mapParser(cfg, pyParser, where) {
  if (cfg.schema_compatible !== undefined && typeof cfg.schema_compatible !== "boolean") {
    throw new Error(`vendor.yaml ${where}: schema_compatible must be a boolean`);
  }
  const m = (cfg.parsers ?? {})[pyParser];
  if (m === undefined) {
    return { js: pyParser, compatible: cfg.schema_compatible === true, declared: cfg.schema_compatible !== undefined };
  }
  if (typeof m?.js !== "string" || typeof m.schema_compatible !== "boolean") {
    throw new Error(`vendor.yaml ${where}: parsers.${pyParser} must be {js: <name>, schema_compatible: <bool>}`);
  }
  return { js: m.js, compatible: m.schema_compatible, declared: true };
}

/**
 * Transform one upstream endpoint YAML into the JS family file. Pure: same
 * inputs, same bytes. Returns `{ text, schemaRefs, jsRefs, pySchemas }`:
 * `schemaRefs` are the py returns-schema refs still attached after the merge (the
 * schemas to copy), `jsRefs` the JS-owned ones the overlay attaches, and
 * `pySchemas` one `{ short, ref, status }` per upstream endpoint carrying a py
 * `returns_schema` (`ref` = the JS-side ref when attached, else py's), where
 * `status` is why it is or is not attached: `attached`, `parser_override`,
 * `schema_incompatible`, `declared_incompatible` (a `schema_compatible: false`
 * declaration), `undeclared` (no declaration: fail-closed) or `overlay_schema`
 * (the overlay re-points it at a JS-owned schema).
 *
 * Returns-schema policy: a py `returns_schema` stays only when the endpoint's JS
 * parser is the declared equivalent of py's (see `mapParser`), no
 * `parser_overrides` entry replaces it and the short is not listed in
 * `schema_incompatible` (py's schema fails the parser-parity harness on a real
 * capture); otherwise it is dropped (no table beats a wrong one) and the overlay
 * may attach a JS-owned schema instead.
 *
 * Overlay entries: one whose `short` is vendored patches it (never its `parser`;
 * use `parser_overrides`); one with a new `short` is appended and must carry a
 * `path`. A patched key whose value already equals the vendored one throws, so a
 * patch that upstream has absorbed announces itself.
 *
 * Throws on a stale manifest entry (a `names` / `parsers` / `parser_overrides` /
 * `schema_incompatible` entry that matches no vendored endpoint) or a duplicate short.
 */
export function transformFamily(key, cfg, upstreamText, overlayText, source) {
  // Pure in its inputs, and parsing ~1 MB of endpoint YAML is the slow part of every
  // check/derive (it made the temp-tree vendor tests flaky against their timeout), so
  // identical inputs reuse the result. Callers treat the result as read-only.
  const memoKey = JSON.stringify([key, cfg, upstreamText, overlayText, source]);
  let hit = transformMemo.get(memoKey);
  if (!hit) transformMemo.set(memoKey, (hit = transformFamilyUncached(key, cfg, upstreamText, overlayText, source)));
  return hit;
}
const transformMemo = new Map();

function transformFamilyUncached(key, cfg, upstreamText, overlayText, source) {
  const doc = parseDocument(upstreamText);
  const from = cfg.from ?? key;
  const header =
    ` VENDORED from ${source.repo}@${source.ref}\n` +
    ` ${PY_CODEGEN}endpoints/${from}.yaml by tools/codegen/vendor.mjs.\n` +
    ` DO NOT EDIT: run \`npm run vendor\`. JS-only endpoints / patches go in\n` +
    ` tools/codegen/overlay/${key}.yaml; shared changes land in sdv-py first.`;
  doc.commentBefore = doc.commentBefore ? `${header}\n\n${doc.commentBefore}` : header;
  if (doc.has("api")) doc.set("api", key);

  const seq = doc.get("endpoints");
  const items = seq?.items ?? [];
  const names = cfg.names ?? {};
  const overrides = cfg.parser_overrides ?? {};
  const unusedNames = new Set(Object.keys(names));
  const unusedOverrides = new Set(Object.keys(overrides));
  const unusedParsers = new Set(Object.keys(cfg.parsers ?? {}));
  if (cfg.schema_incompatible !== undefined && !Array.isArray(cfg.schema_incompatible)) {
    throw new Error(`vendor.yaml ${key}: schema_incompatible must be a list of endpoint shorts`);
  }
  const unusedIncompatible = new Set(cfg.schema_incompatible ?? []);
  // Raw upstream endpoints BEFORE the rename/policy loop below (which deletes a
  // dropped returns_schema, renames shorts and swaps parsers): what a whole-key overlay
  // patch actually replaces.
  const rawUp = new Map(items.map((ep) => [ep, plain(ep)]));
  const pyRefs = new Map(); // endpoint node -> py returns_schema ref it keeps
  const pySchemas = new Map(); // endpoint node -> { short, ref, status } for every py returns_schema
  for (const ep of items) {
    let short = ep.get("short");
    if (names[short]) {
      unusedNames.delete(short);
      short = names[short];
      ep.set("short", short);
    }
    const pyParser = ep.get("parser");
    let compatible = false;
    let declared = false;
    if (pyParser) {
      unusedParsers.delete(pyParser);
      const m = mapParser(cfg, pyParser, key);
      ep.set("parser", m.js);
      compatible = m.compatible;
      declared = m.declared;
    }
    let status = null;
    if (overrides[short]) {
      unusedOverrides.delete(short);
      ep.set("parser", overrides[short]);
      compatible = false;
      status = "parser_override";
    }
    if (unusedIncompatible.delete(short)) {
      compatible = false;
      status ??= "schema_incompatible";
    }
    const rs = ep.get("returns_schema");
    if (rs && compatible) {
      ep.set("returns_schema", rewriteSchema(rs, cfg.schemas));
      pyRefs.set(ep, rs);
      pySchemas.set(ep, { short, ref: rewriteSchema(rs, cfg.schemas), status: "attached" });
    } else if (rs) {
      ep.delete("returns_schema");
      pySchemas.set(ep, { short, ref: rs, status: status ?? (declared ? "declared_incompatible" : "undeclared") });
    }
  }

  const patches = [];
  if (overlayText) {
    const ovSeq = parseDocument(overlayText).get("endpoints");
    // A comment above the first overlay entry parses onto the sequence; keep it
    // with that entry so it survives the merge.
    if (ovSeq?.commentBefore && ovSeq.items[0]) {
      const first = ovSeq.items[0];
      first.commentBefore = [ovSeq.commentBefore, first.commentBefore].filter(Boolean).join("\n");
    }
    const vendored = [...items]; // overlay additions never become patch targets
    // Endpoint identity = host + path + fixed/extra params (upstream ships legitimate
    // same-path pairs: on3 nil_100 / nil_100_v2 on different hosts, kenpom /history.php
    // with different query keys), so a bare path would false-positive.
    const famHost = plain(doc.get("host"));
    const sig = (ep) => {
      const o = plain(ep);
      return stable([o.host ?? famHost ?? null, o.path, o.fixed_params ?? null, o.extra_params ?? null, o.query_params ?? null]);
    };
    const taken = new Map(); // signature -> short, upstream first then overlay additions
    for (const ep of items) if (ep.get("path") !== undefined) taken.set(sig(ep), ep.get("short"));
    for (const oep of ovSeq?.items ?? []) {
      const short = oep.get("short");
      const target = vendored.find((ep) => ep.get("short") === short);
      if (!target) {
        if (!oep.has("path")) {
          throw new Error(
            `overlay/${key}.yaml ${short}: patches no vendored endpoint (renamed or dropped upstream?); an addition needs a \`path\``
          );
        }
        const addPath = String(oep.get("path"));
        const addSig = sig(oep);
        if (taken.has(addSig)) {
          throw new Error(
            `overlay/${key}.yaml ${short}: path ${addPath} (same host and params) duplicates endpoint ${taken.get(addSig)} (upstream or an earlier overlay addition); patch that endpoint instead`
          );
        }
        taken.set(addSig, short);
        seq.add(oep);
        continue;
      }
      for (const pair of oep.items) {
        const k = pair.key.value;
        if (k === "short") continue;
        if (k === "parser") {
          // One way to swap a vendored parser, so the schema policy sees it.
          throw new Error(`overlay/${key}.yaml ${short}: set its parser via vendor.yaml parser_overrides`);
        }
        if (stable(plain(target.get(k, true))) === stable(plain(pair.value))) {
          throw new Error(
            `overlay/${key}.yaml ${short}.${k}: already equal upstream; remove it from this overlay entry`
          );
        }
        // Remember what upstream said, so a pin bump can tell when a whole-key patch
        // is now masking a changed upstream value (findMaskedPatches).
        const rawVal = rawUp.get(target)?.[k];
        patches.push({ short, k, upstream: rawVal === undefined ? "(absent)" : stable(rawVal) });
        target.set(k, pair.value);
        if (k === "returns_schema") {
          pyRefs.delete(target); // JS-owned now
          // an attached py table the overlay replaces; any other status keeps its reason
          if (pySchemas.get(target)?.status === "attached") pySchemas.get(target).status = "overlay_schema";
        }
      }
      if (oep.commentBefore) {
        target.commentBefore = [target.commentBefore, oep.commentBefore]
          .filter(Boolean)
          .join("\n");
      }
    }
  }

  if (unusedNames.size || unusedOverrides.size || unusedParsers.size || unusedIncompatible.size) {
    throw new Error(
      `vendor.yaml ${key}: stale entries match no endpoint: ` +
        [...unusedNames, ...unusedParsers, ...unusedOverrides, ...unusedIncompatible].join(", ")
    );
  }
  const shorts = (seq?.items ?? []).map((ep) => ep.get("short"));
  const dupes = shorts.filter((s, i) => shorts.indexOf(s) !== i);
  if (dupes.length) throw new Error(`${key}: duplicate shorts ${dupes.join(", ")}`);
  const jsRefs = (seq?.items ?? [])
    .filter((ep) => ep.get("returns_schema") && !pyRefs.has(ep))
    .map((ep) => ep.get("returns_schema"));
  return {
    text: doc.toString({ lineWidth: 0, indentSeq: false }),
    schemaRefs: [...new Set(pyRefs.values())],
    jsRefs: [...new Set(jsRefs)],
    pySchemas: [...pySchemas.values()],
    patches,
  };
}

/**
 * Whole-key overlay patches whose upstream value changed between two derivations
 * (`familyPatches` before and after a pin bump). The overlay replaces the key
 * wholesale, so the upstream change is invisible in the output: warn a human.
 * Returns human-readable warnings.
 */
export function findMaskedPatches(family, oldPatches, newPatches) {
  const old = new Map(oldPatches.map((p) => [`${p.short}.${p.k}`, p.upstream]));
  return newPatches
    .filter((p) => old.has(`${p.short}.${p.k}`) && old.get(`${p.short}.${p.k}`) !== p.upstream)
    .map((p) => {
      const was = old.get(`${p.short}.${p.k}`);
      const cut = (s) => (s.length > 120 ? `${s.slice(0, 117)}...` : s);
      return `overlay/${family}.yaml ${p.short}.${p.k} replaces the whole upstream value, and sdv-py changed that value in this bump (${cut(was)} -> ${cut(p.upstream)}): the change is MASKED by the overlay; review whether the patch still applies`;
    });
}

/** The whole-key overlay patches a family currently applies (see findMaskedPatches). */
export function familyPatches(root, key) {
  const manifest = loadManifest(root);
  const cfg = manifest.families[key] ?? {};
  const up = join(root, UPSTREAM);
  const ovPath = join(root, "overlay", `${key}.yaml`);
  const text = readUp(join(up, upstreamEndpointPath(key, cfg)));
  return transformFamily(key, cfg, text, existsSync(ovPath) ? read(ovPath) : null, manifest.source).patches;
}

/** Recursively list `*.yaml` under `dir`, as `/`-joined paths relative to it. */
function listYaml(dir, prefix = "") {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix + e.name;
    if (e.isDirectory()) out.push(...listYaml(join(dir, e.name), `${rel}/`));
    else if (e.name.endsWith(".yaml")) out.push(rel);
  }
  return out.sort();
}

// The returns-schema shapes the JS generator and the parity harness understand
// (sdv-py tools/codegen/spec §3.5). Anything else fails the vendor closed.
const SCHEMA_KEYS = new Set(["schema", "kind", "columns", "frames", "frames_by", "description", "note", "unverified"]);
const FRAME_KEYS = new Set(["section", "columns"]);
const COLUMN_KEYS = new Set(["name", "type", "description"]);

/**
 * Throw unless a vendored py returns schema has a shape JS understands:
 * `kind: dataframe` with `columns`, or `kind: frames` with `frames:
 * [{section, columns}]` (one table per key of the parser's dict). `kind: frames`
 * may add `frames_by: <request param>`: then it is ONE table, whose columns are
 * the frame whose `section` equals that param's value (sdv-py generate.py
 * `_returns_dict`); `endpointParams` (one request-param-name list per endpoint
 * using the schema) is then required and must each name it. Optional
 * `schema` / `description` / `note`, and `unverified: <reason>`, which must
 * publish no columns (sdv-py had no capture the parser emits rows for). Each
 * column is `{name, type, description?}`. An unknown key anywhere fails closed:
 * an upstream shape JS silently mis-renders is worse than a red vendor.
 */
// Schema text -> its frames_by, for texts already checked (deriveAll runs once per temp tree in the tests).
const shapeChecked = new Map();

export function checkSchemaShape(text, where, endpointParams = null) {
  if (!shapeChecked.has(text)) shapeChecked.set(text, checkShape(text, where));
  const by = shapeChecked.get(text);
  if (by === undefined) return;
  if (!endpointParams) {
    // fail closed: a frames_by schema checked without its endpoints' params is unchecked
    throw new Error(`${where}: frames_by ${JSON.stringify(by)} needs the request params of the endpoints using this schema`);
  }
  if (!endpointParams.length || endpointParams.some((ps) => !ps.includes(by))) {
    throw new Error(
      `${where}: frames_by ${JSON.stringify(by)} is not a request parameter of every endpoint using this schema ` +
        `(${endpointParams.map((ps) => ps.join(", ") || "no params").join(" | ") || "no endpoint"})`
    );
  }
}

/** The shape check of checkSchemaShape; returns the schema's `frames_by` (undefined when absent). */
function checkShape(text, where) {
  const fail = (msg) => {
    throw new Error(
      `${where}: ${msg}. This returns-schema shape is unknown to sdv-js: teach tools/codegen/generate.mjs and ` +
        `test/parsers/parity.test.js the new shape, then accept it in vendor.mjs checkSchemaShape`
    );
  };
  const doc = parse(text);
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) fail("not a mapping");
  const unknown = Object.keys(doc).filter((k) => !SCHEMA_KEYS.has(k));
  if (unknown.length) fail(`unknown top-level key(s) ${unknown.join(", ")}`);
  const columns = (list, at) => {
    if (!Array.isArray(list)) fail(`${at}columns is not a list`);
    for (const c of list) {
      const extra = Object.keys(c ?? {}).filter((k) => !COLUMN_KEYS.has(k));
      // a bare-number name (`2015`) is a YAML number; it is still a column name
      if (extra.length || !/^(string|number)$/.test(typeof c?.name) || typeof c?.type !== "string") {
        fail(`${at}column ${JSON.stringify(c?.name)} must be {name, type, description?}`);
      }
    }
  };
  if (doc.kind === "dataframe") {
    if (doc.frames !== undefined) fail("kind dataframe carries frames");
    if (doc.frames_by !== undefined) fail("kind dataframe carries frames_by");
    columns(doc.columns, "");
  } else if (doc.kind === "frames") {
    if (doc.columns !== undefined) fail("kind frames carries top-level columns");
    if (doc.frames_by !== undefined && (typeof doc.frames_by !== "string" || !doc.frames_by.trim())) {
      fail("frames_by must be a request parameter name");
    }
    if (!Array.isArray(doc.frames) || !doc.frames.length) fail("kind frames needs a non-empty frames list");
    for (const f of doc.frames) {
      const extra = Object.keys(f ?? {}).filter((k) => !FRAME_KEYS.has(k));
      if (extra.length || typeof f?.section !== "string") fail("each frame must be {section, columns}");
      columns(f.columns, `frame ${f.section}: `);
    }
  } else {
    fail(`unknown kind ${JSON.stringify(doc.kind)}`);
  }
  if (doc.unverified !== undefined) {
    if (typeof doc.unverified !== "string" || !doc.unverified.trim()) fail("unverified must be a reason string");
    if (doc.kind !== "dataframe" || doc.columns.length) fail("an unverified schema must publish no columns");
  }
  return doc.frames_by;
}

/**
 * Derive every vendored output (codegen-relative path -> content) from the
 * committed upstream copy + manifest + overlays. Offline and deterministic.
 * `only` (a family key) derives just that family's endpoint + schema outputs.
 */
export function deriveAll(root = CODEGEN_DIR, only = null) {
  const manifest = loadManifest(root);
  const up = join(root, UPSTREAM);
  const upSchemas = listYaml(join(up, "schemas"));
  const out = new Map();
  const jsOwned = new Set(); // schema files overlays attach (never vendored over)
  if (!only) {
    for (const c of manifest.copy ?? []) out.set(c, readUp(join(up, c)));
    const refFile = join(up, REF_FILE);
    out.set(PY_NAMES_FILE, renderPyNames(up, existsSync(refFile) ? read(refFile).trim() : "(missing)"));
  }
  for (const [key, cfg] of familyEntries(manifest)) {
    if (only && key !== only) continue;
    const text = readUp(join(up, upstreamEndpointPath(key, cfg)));
    const ovPath = join(root, "overlay", `${key}.yaml`);
    const overlay = existsSync(ovPath) ? read(ovPath) : null;
    const fam = transformFamily(key, cfg, text, overlay, manifest.source);
    out.set(`endpoints/${key}.yaml`, fam.text);
    for (const ref of fam.jsRefs) jsOwned.add(`schemas/${ref}.yaml`);
    for (const ref of fam.schemaRefs) {
      for (const f of schemaFilesFor(ref, upSchemas)) {
        const text = readUp(join(up, "schemas", f));
        checkSchemaShape(
          text,
          `vendor/upstream/schemas/${f} (family ${key})`,
          requestParams(fam.text, rewriteSchema(ref, cfg.schemas))
        );
        out.set(`schemas/${rewriteSchema(f, cfg.schemas)}`, text);
      }
    }
  }
  const clash = [...jsOwned].filter((p) => out.has(p));
  if (clash.length) {
    throw new Error(`vendored schemas would overwrite JS-owned ones an overlay attaches: ${clash.join(", ")}`);
  }
  return out;
}

/** Predicate: is a schema path (relative to schemas/) named by any endpoint YAML, vendored or JS-owned? */
function referencedBy(root, outputs) {
  const referenced = new Set();
  const endpointsDir = join(root, "endpoints");
  const endpointTexts = new Map(
    readdirSync(endpointsDir)
      .filter((f) => f.endsWith(".yaml"))
      .map((f) => [`endpoints/${f}`, read(join(endpointsDir, f))])
  );
  for (const [p, t] of outputs) if (p.startsWith("endpoints/")) endpointTexts.set(p, t);
  for (const t of endpointTexts.values()) for (const r of schemaRefs(t)) referenced.add(r);
  return (rel) => {
    const ref = rel.replace(/\.yaml$/, "");
    return referenced.has(ref) || (ref.includes("/") && referenced.has(ref.slice(0, ref.lastIndexOf("/"))));
  };
}

const lf = (t) => t.replace(/\r\n/g, "\n");

/**
 * Copies a pin bump leaves behind. `fetchUpstream` replaces vendor/upstream before
 * the re-derive, so `findOrphans` (which compares against the NEW upstream) cannot
 * see a py schema the bump renamed or dropped. Compare the outgoing derived outputs
 * (`oldOutputs`, derived from the OLD upstream before the fetch) with the incoming
 * ones: a schema path only the old pin vendored, whose file is byte-identical to the
 * old copy and not referenced, is stale. A JS-authored file (different bytes, or never
 * vendored) never qualifies.
 */
export function findStaleAfterBump(root, oldOutputs, outputs) {
  const isReferenced = referencedBy(root, outputs);
  const stale = [];
  for (const [p, content] of oldOutputs) {
    if (!p.startsWith("schemas/") || outputs.has(p)) continue;
    const file = join(root, p);
    if (!existsSync(file) || isReferenced(p.slice("schemas/".length))) continue;
    if (lf(read(file)) === lf(content)) stale.push(p);
  }
  return stale.sort();
}

/**
 * py schema copies the vendor wrote and no longer attaches (a declaration stopped
 * attaching it, say; it cannot see a schema upstream dropped): an exact py schema
 * path, byte-identical to the upstream copy, not vendored now and not referenced
 * by any endpoint YAML (vendored or JS-owned). A JS-authored file never qualifies.
 * (Across a pin bump the old upstream is gone: see `findStaleAfterBump`.)
 */
export function findOrphans(root, outputs) {
  const isReferenced = referencedBy(root, outputs);
  // Only exact paths of py schema copies the vendor wrote and no longer attaches:
  // a file at a py schema's (rewritten) path, byte-identical to the upstream copy,
  // not produced now and not referenced. Never a whole directory, so a JS-authored
  // schema (not yet referenced, or at a py path with its own content) is never touched.
  const up = join(root, UPSTREAM);
  const upSchemas = listYaml(join(up, "schemas"));
  const orphans = new Set();
  for (const [key, cfg] of familyEntries(loadManifest(root))) {
    const upFile = join(up, upstreamEndpointPath(key, cfg));
    for (const ref of existsSync(upFile) ? schemaRefs(read(upFile)) : []) {
      for (const f of schemaFilesFor(ref, upSchemas)) {
        const p = `schemas/${rewriteSchema(f, cfg.schemas)}`;
        const file = join(root, p);
        if (outputs.has(p) || !existsSync(file) || isReferenced(p.slice("schemas/".length))) continue;
        if (lf(read(file)) === lf(read(join(up, "schemas", f)))) orphans.add(p);
      }
    }
  }
  return [...orphans].sort();
}

/** Every file under `dir` (recursive), as `/`-joined paths relative to it. */
function listFiles(dir, prefix = "") {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix + e.name;
    if (e.isDirectory()) out.push(...listFiles(join(dir, e.name), `${rel}/`));
    else out.push(rel);
  }
  return out.sort();
}

const REFETCH = "upstream copies are fetched, never edited: re-fetch with `npm run vendor`";

/**
 * Verify vendor/upstream/ against LOCK: every listed file present with its pinned
 * git blob sha, and no unlisted file. Offline.
 */
function checkUpstreamLock(up) {
  const lockFile = join(up, LOCK_FILE);
  if (!existsSync(lockFile)) return [`UPSTREAM: vendor/upstream/${LOCK_FILE} is missing (${REFETCH})`];
  const problems = [];
  const lock = new Map(
    read(lockFile)
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const [sha, path] = l.split(/ {2}/);
        return [path, sha];
      })
  );
  const present = new Set(listFiles(up).filter((p) => p !== LOCK_FILE && p !== REF_FILE));
  for (const [p, sha] of lock) {
    if (!present.has(p)) problems.push(`UPSTREAM: vendor/upstream/${p} is missing (${REFETCH})`);
    else if (gitBlobSha(readFileSync(join(up, p))) !== sha) {
      problems.push(`UPSTREAM: vendor/upstream/${p} does not match pinned blob ${sha} (${REFETCH})`);
    }
  }
  for (const p of present) {
    if (!lock.has(p)) problems.push(`UPSTREAM: vendor/upstream/${p} is not in ${LOCK_FILE} (${REFETCH})`);
  }
  return problems;
}

/** Offline drift check. Returns a list of human-readable problems ([] = clean). */
export function checkVendor(root = CODEGEN_DIR) {
  const problems = [];
  const manifest = loadManifest(root);
  const up = join(root, UPSTREAM);
  const refFile = join(up, REF_FILE);
  const stamped = existsSync(refFile) ? read(refFile).trim() : "(missing)";
  if (stamped !== manifest.source.ref) {
    problems.push(
      `UPSTREAM: vendor/upstream is at ${stamped} but vendor.yaml pins ${manifest.source.ref} (re-fetch with \`npm run vendor\`)`
    );
  }
  problems.push(...checkUpstreamLock(up));
  if (problems.length) return problems; // derive only from a verified upstream copy
  const outputs = deriveAll(root);
  const regen = "regenerate with `npm run vendor -- --offline`; change JS behaviour in overlay/ or vendor.yaml, never in a vendored file";
  for (const [p, content] of outputs) {
    const file = join(root, p);
    if (!existsSync(file)) problems.push(`MISSING: tools/codegen/${p} (${regen})`);
    else if (read(file) !== content) problems.push(`DRIFT: tools/codegen/${p} differs from its vendored source (${regen})`);
  }
  for (const o of findOrphans(root, outputs)) {
    problems.push(`ORPHAN: tools/codegen/${o} is not vendored and not referenced (delete it, or ${regen})`);
  }
  return problems;
}

/** Write every derived output and delete orphans. */
export function writeVendor(root = CODEGEN_DIR) {
  const outputs = deriveAll(root);
  for (const [p, content] of outputs) {
    const file = join(root, p);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  const orphans = findOrphans(root, outputs);
  for (const o of orphans) rmSync(join(root, o));
  return { written: outputs.size, removed: orphans };
}

// ---------------------------------------------------------------------------
// Fetch (network or local git) — not used by the check.
// ---------------------------------------------------------------------------

// Each source exposes `tree(extra)` -> Map(upstream path -> git blob sha) for the
// pinned endpoints/ + schemas/ trees, the `extra` files (`copy:` entries outside
// those dirs) and the sdv-py package (as `py/sportsdataverse/...`), and
// `getMany(paths)` -> Buffers.

function gitSource(repo, ref) {
  const git = (args, input) => {
    const r = spawnSync("git", ["-C", repo, ...args], { input, maxBuffer: 1 << 30 });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
    return r.stdout;
  };
  return {
    async tree(extra = []) {
      const out = new Map();
      const paths = ["endpoints", "schemas", ...extra].map((p) => `${PY_CODEGEN}${p}`);
      const ls = (args) => git(["ls-tree", "-r", ref, "--", ...args]).toString("utf8").split("\n").filter(Boolean);
      for (const line of [...ls(paths), ...ls([PY_PKG])]) {
        const [meta, path] = line.split("\t"); // "<mode> blob <sha>\t<path>"
        const [, type, sha] = meta.split(" ");
        if (type !== "blob") continue;
        out.set(path.startsWith(PY_CODEGEN) ? path.slice(PY_CODEGEN.length) : PY_UP + path, sha);
      }
      return out;
    },
    async getMany(paths) {
      // One `git cat-file --batch` round trip: "<sha> blob <size>\n<bytes>\n".
      const buf = git(["cat-file", "--batch"], paths.map((p) => `${ref}:${repoPath(p)}`).join("\n") + "\n");
      const out = [];
      let i = 0;
      for (const p of paths) {
        const nl = buf.indexOf(10, i);
        const head = buf.toString("utf8", i, nl);
        i = nl + 1;
        if (head.endsWith(" missing")) throw new Error(`${p} not found at ${ref} in ${repo}`);
        const size = Number(head.split(" ")[2]);
        out.push(Buffer.from(buf.subarray(i, i + size)));
        i += size + 1;
      }
      return out;
    },
  };
}

/**
 * GET with a bounded retry (default 3 attempts, exponential backoff) on network
 * errors, per-attempt timeouts and HTTP 5xx only. Each attempt gets its own
 * `AbortSignal.timeout(timeoutMs)` (default 30 s); the signal stays attached while
 * the body streams, and with `readBody` (`res => Promise`) the body is read INSIDE
 * the attempt, so a body timeout or reset is retried and the error names the URL.
 * Worst case per URL: `attempts * timeoutMs + backoff` = 3 * 30 s + 0.5 s + 1 s = 91.5 s.
 * Any other status (403 rate limit/entitlement, 404, ...) fails at once, and exhausted
 * retries still throw: this never turns a failure into a pass. `fetchImpl` / `sleep`
 * are injectable for tests.
 */
export async function fetchWithRetry(
  url,
  opts = {},
  { fetchImpl = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), attempts = 3, baseMs = 500, timeoutMs = 30_000, readBody = null } = {}
) {
  let last;
  for (let i = 0; i < attempts; i++) {
    if (i) await sleep(baseMs * 2 ** (i - 1));
    let res;
    try {
      res = await fetchImpl(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok && readBody) return await readBody(res); // body timeouts/resets retry too, naming the URL
    } catch (e) {
      last = new Error(`GET ${url} -> network error: ${e.message ?? e}`);
      continue;
    }
    if (res.ok) return res;
    last = new Error(`GET ${url} -> HTTP ${res.status}`);
    if (res.status < 500) throw last;
  }
  throw last;
}

export function githubSource(repoSlug, ref, retryOpts = {}) {
  const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  const get = (url, opts = {}, readBody) => fetchWithRetry(url, opts, { ...retryOpts, readBody }); // API and raw.githubusercontent alike
  return {
    async tree(extra = []) {
      const url = `https://api.github.com/repos/${repoSlug}/git/trees/${ref}:${PY_CODEGEN.slice(0, -1)}?recursive=1`;
      const j = await get(url, { headers }, (r) => r.json());
      if (j.truncated) throw new Error(`tree listing truncated: ${url}`);
      const pkgUrl = `https://api.github.com/repos/${repoSlug}/git/trees/${ref}:${PY_PKG}?recursive=1`;
      const pkg = await get(pkgUrl, { headers }, (r) => r.json());
      if (pkg.truncated) throw new Error(`tree listing truncated: ${pkgUrl}`);
      return new Map([
        ...j.tree
          .filter((t) => t.type === "blob" && (/^(endpoints|schemas)\//.test(t.path) || extra.includes(t.path)))
          .map((t) => [t.path, t.sha]),
        ...pkg.tree.filter((t) => t.type === "blob").map((t) => [`${PY_UP}${PY_PKG}/${t.path}`, t.sha]),
      ]);
    },
    async getMany(paths) {
      const out = new Array(paths.length);
      let next = 0;
      const worker = async () => {
        while (next < paths.length) {
          const i = next++;
          const url = `https://raw.githubusercontent.com/${repoSlug}/${ref}/${repoPath(paths[i])}`;
          out[i] = await get(url, {}, async (r) => Buffer.from(await r.arrayBuffer()));
        }
      };
      await Promise.all(Array.from({ length: 8 }, worker));
      return out;
    },
  };
}

/** Upstream endpoint-level paths the vendor fetches: each family's endpoint YAML + the `copy:` files. */
export function endpointPathsOf(manifest) {
  return [
    ...new Set([...familyEntries(manifest).map(([k, c]) => upstreamEndpointPath(k, c)), ...(manifest.copy ?? [])]),
  ];
}

/**
 * The schema + sdv-py module paths the vendor fetches, derived from the upstream
 * tree (`Map(path -> blob sha)`) and the endpoint YAML texts (`endpointText(path)`).
 * ONE definition, shared by `fetchUpstream` (what to fetch + LOCK) and the online
 * LOCK check (what LOCK must contain), so a path dropped from LOCK cannot go unnoticed.
 * Returns `{ schemaList, pyList, dangling }` (sorted / unique where it matters).
 */
export function selectUpstreamPaths(manifest, tree, endpointText, ref = manifest.source.ref) {
  const available = [...tree.keys()].filter((p) => p.startsWith("schemas/")).map((p) => p.slice("schemas/".length));
  const schemaPaths = new Set();
  const dangling = [];
  for (const p of endpointPathsOf(manifest)) {
    if ((manifest.copy ?? []).includes(p)) continue;
    for (const ref_ of schemaRefs(endpointText(p))) {
      const files = schemaFilesFor(ref_, available);
      if (!files.length) dangling.push(ref_);
      files.forEach((f) => schemaPaths.add(`schemas/${f}`));
    }
  }
  // The generated sdv-py modules whose public names JS must match (one per
  // vendored flat family + one per league), located by file name in the package.
  const pyList = pyModuleStems(manifest, endpointText).map((stem) => {
    const hits = [...tree.keys()].filter((p) => p.startsWith(PY_UP) && p.endsWith(`/${stem}.py`));
    if (hits.length !== 1) throw new Error(`${stem}.py: ${hits.length} matches under ${PY_PKG}/ at ${ref}`);
    return hits[0];
  });
  return { schemaList: [...schemaPaths].sort(), pyList, dangling: [...new Set(dangling)].sort() };
}

/**
 * Fetch the upstream files at `ref` (default: the manifest pin) into
 * vendor/upstream/ (replacing it), each verified against the pinned tree's blob
 * sha, and write REF + LOCK. All network reads finish before anything is written.
 */
export async function fetchUpstream(root = CODEGEN_DIR, ref = loadManifest(root).source.ref) {
  const manifest = loadManifest(root);
  const { repo } = manifest.source;
  const src = process.env.SDV_PY_REPO ? gitSource(process.env.SDV_PY_REPO, ref) : githubSource(repo, ref);

  const tree = await src.tree(manifest.copy ?? []);
  const endpointPaths = endpointPathsOf(manifest);
  for (const p of endpointPaths) if (!tree.has(p)) throw new Error(`${PY_CODEGEN}${p} not found at ${ref}`);
  const endpointBufs = await src.getMany(endpointPaths);
  const fetched = new Map(endpointPaths.map((p, i) => [p, decodeText(endpointBufs[i])]));
  const { schemaList, pyList, dangling } = selectUpstreamPaths(manifest, tree, (p) => fetched.get(p), ref);
  const schemaBufs = await src.getMany(schemaList);
  const pyBufs = await src.getMany(pyList);

  const files = [
    ...endpointPaths.map((p, i) => [p, endpointBufs[i]]),
    ...schemaList.map((p, i) => [p, schemaBufs[i]]),
    ...pyList.map((p, i) => [p, pyBufs[i]]),
  ];
  for (const [p, buf] of files) {
    if (gitBlobSha(buf) !== tree.get(p)) throw new Error(`${p}: fetched bytes do not match blob ${tree.get(p)} at ${ref}`);
  }
  const up = join(root, UPSTREAM);
  rmSync(up, { recursive: true, force: true });
  for (const [p, buf] of files) {
    mkdirSync(dirname(join(up, p)), { recursive: true });
    writeFileSync(join(up, p), buf);
  }
  writeFileSync(join(up, REF_FILE), `${ref}\n`);
  const lock = files.map(([p]) => `${tree.get(p)}  ${p}`).sort((a, b) => a.slice(42).localeCompare(b.slice(42)));
  writeFileSync(join(up, LOCK_FILE), `${lock.join("\n")}\n`);
  return { files: files.length, dangling };
}

/** Rewrite `source.ref` in vendor.yaml in place (keeps its comments). */
function bumpRef(root, sha) {
  const file = join(root, "vendor.yaml");
  const text = read(file);
  const next = text.replace(/^(\s+ref:\s*).*$/m, `$1${sha}`);
  if (next === text && !text.includes(sha)) throw new Error("could not find `ref:` in vendor.yaml");
  writeFileSync(file, next);
}

/**
 * Derive the OUTGOING outputs (and overlay patches) per family from the committed
 * upstream copy, before a fetch replaces it. A family that cannot derive (newly added
 * to vendor.yaml, say) is named via `warn` and listed in `skipped`, without disabling
 * pruning for the rest.
 */
export function deriveOutgoing(root = CODEGEN_DIR, warn = console.warn) {
  const before = new Map();
  const oldPatches = new Map();
  const skipped = [];
  for (const [key] of familyEntries(loadManifest(root))) {
    try {
      for (const [p, c] of deriveAll(root, key)) before.set(p, c);
      oldPatches.set(key, familyPatches(root, key));
    } catch (e) {
      skipped.push(key);
      warn(`vendor: prune skipped for family ${key} (outgoing outputs not derivable: ${e.message})`);
    }
  }
  return { before, oldPatches, skipped };
}

async function main(argv) {
  if (argv.includes("--check")) {
    const problems = checkVendor();
    for (const p of problems) console.error(p);
    if (problems.length) {
      console.error(`vendor:check: ${problems.length} problem(s); each line above says how to fix it`);
      process.exit(1);
    }
    console.log("vendor:check: vendor/upstream matches LOCK and the vendored files match vendor/upstream");
    return;
  }
  const refIdx = argv.indexOf("--ref");
  let sha;
  if (refIdx !== -1) {
    sha = argv[refIdx + 1];
    if (!/^[0-9a-f]{40}$/.test(sha ?? "")) throw new Error("--ref needs a full 40-char commit sha");
    if (argv.includes("--offline")) throw new Error("--ref fetches; it can't be combined with --offline");
  }
  let before = null;
  const skippedPrune = [];
  const oldPatches = new Map();
  if (!argv.includes("--offline")) {
    // Fetch first: a failed fetch leaves vendor.yaml (and vendor/upstream) untouched.
    const ref = sha ?? loadManifest().source.ref;
    // Derive the OUTGOING outputs per family before the fetch replaces vendor/upstream,
    // so a py schema the new pin renamed/dropped can be recognised (findStaleAfterBump).
    // A family that cannot derive (newly added to vendor.yaml, say) is named and skipped
    // without disabling pruning for the rest.
    const out = deriveOutgoing();
    before = out.before;
    out.oldPatches.forEach((v, k) => oldPatches.set(k, v));
    skippedPrune.push(...out.skipped);
    const { files, dangling } = await fetchUpstream(CODEGEN_DIR, ref);
    if (sha) bumpRef(CODEGEN_DIR, sha);
    console.log(`vendor: fetched ${files} upstream files at ${ref}`);
    if (dangling.length) console.warn(`vendor: upstream names schemas it does not ship: ${dangling.join(", ")}`);
  }
  for (const [key, old] of oldPatches) {
    for (const w of findMaskedPatches(key, old, familyPatches(CODEGEN_DIR, key))) {
      console.warn(`vendor: WARNING ${w}`);
      // CI sets this so the sync PR body and the step summary can show the warning.
      if (process.env.SDV_VENDOR_WARNINGS) appendFileSync(process.env.SDV_VENDOR_WARNINGS, `- ${w}
`);
    }
  }
  const { written, removed } = writeVendor();
  if (before) for (const r of findStaleAfterBump(CODEGEN_DIR, before, deriveAll())) {
    rmSync(join(CODEGEN_DIR, r));
    removed.push(r);
  }
  console.log(`vendor: wrote ${written} files${removed.length ? `, removed ${removed.length} orphans` : ""}`);
  if (skippedPrune.length) console.log(`vendor: pin-bump prune skipped for: ${skippedPrune.join(", ")}`);
  for (const r of removed) console.log(`  removed tools/codegen/${r}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}

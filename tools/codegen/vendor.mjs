// One-way vendor sync: sportsdataverse-py codegen YAML -> sportsdataverse-js.
//
// Reads tools/codegen/vendor.yaml (pinned sdv-py ref + per-family transforms),
// keeps a verbatim copy of every upstream file under tools/codegen/vendor/
// upstream/ (committed, so the check is offline), and derives:
//   - tools/codegen/endpoints/<family>.yaml  (api-stem / short-name / parser /
//     returns-schema rewrites + overlay/<family>.yaml merged on top)
//   - tools/codegen/schemas/**               (every schema those families
//     reference, copied verbatim to its rewritten path)
//   - the manifest's `copy:` files, verbatim (e.g. endpoints/releases.yaml)
//
//   node tools/codegen/vendor.mjs [--ref <sha>]   # fetch upstream, re-derive
//   node tools/codegen/vendor.mjs --offline       # re-derive from vendor/upstream
//   node tools/codegen/vendor.mjs --check         # offline drift gate (exit 1)
//
// Fetch source: GitHub raw at the pinned ref by default; env SDV_PY_REPO=<path
// to an sdv-py clone> reads the same ref through `git cat-file` (never the
// clone's working tree).
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, parseDocument, isMap } from "yaml";

export const CODEGEN_DIR = dirname(fileURLToPath(import.meta.url));
const UPSTREAM = join("vendor", "upstream");
const REF_FILE = "REF";
const PY_CODEGEN = "tools/codegen/";

const read = (p) => readFileSync(p, "utf8");

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
export function schemaRefs(text) {
  const eps = parse(text)?.endpoints; // espn_parser_map.yaml's is a map, not a list
  return Array.isArray(eps) ? [...new Set(eps.map((e) => e?.returns_schema).filter(Boolean))] : [];
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
 * py's returns schema. A py name with no `parsers` entry is the same parser
 * ported to JS under py's name (schema-compatible). A mapped name must say so
 * explicitly: `{js: <name>, schema_compatible: <bool>}`.
 */
export function mapParser(cfg, pyParser, where) {
  const m = (cfg.parsers ?? {})[pyParser];
  if (m === undefined) return { js: pyParser, compatible: true };
  if (typeof m?.js !== "string" || typeof m.schema_compatible !== "boolean") {
    throw new Error(`vendor.yaml ${where}: parsers.${pyParser} must be {js: <name>, schema_compatible: <bool>}`);
  }
  return { js: m.js, compatible: m.schema_compatible };
}

/**
 * Transform one upstream endpoint YAML into the JS family file. Pure: same
 * inputs, same bytes. Returns `{ text, schemaRefs, jsRefs }`: `schemaRefs` are the
 * py returns-schema refs still attached after the merge (the schemas to copy),
 * `jsRefs` the JS-owned ones the overlay attaches.
 *
 * Returns-schema policy: a py `returns_schema` stays only when the endpoint's JS
 * parser is the declared equivalent of py's (see `mapParser`) and no
 * `parser_overrides` entry replaces it; otherwise it is dropped (no table beats
 * a wrong one) and the overlay may attach a JS-owned schema instead.
 *
 * Throws on a stale manifest entry (a `names` / `parser_overrides` key that
 * matches no vendored endpoint) or a duplicate short.
 */
export function transformFamily(key, cfg, upstreamText, overlayText, source) {
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
  const pyRefs = new Map(); // endpoint node -> py returns_schema ref it keeps
  for (const ep of items) {
    let short = ep.get("short");
    if (names[short]) {
      unusedNames.delete(short);
      short = names[short];
      ep.set("short", short);
    }
    const pyParser = ep.get("parser");
    let compatible = false;
    if (pyParser) {
      const m = mapParser(cfg, pyParser, key);
      ep.set("parser", m.js);
      compatible = m.compatible;
    }
    if (overrides[short]) {
      unusedOverrides.delete(short);
      ep.set("parser", overrides[short]);
      compatible = false;
    }
    const rs = ep.get("returns_schema");
    if (rs && compatible) {
      ep.set("returns_schema", rewriteSchema(rs, cfg.schemas));
      pyRefs.set(ep, rs);
    } else if (rs) {
      ep.delete("returns_schema");
    }
  }

  if (overlayText) {
    const ovSeq = parseDocument(overlayText).get("endpoints");
    // A comment above the first overlay entry parses onto the sequence; keep it
    // with that entry so it survives the merge.
    if (ovSeq?.commentBefore && ovSeq.items[0]) {
      const first = ovSeq.items[0];
      first.commentBefore = [ovSeq.commentBefore, first.commentBefore].filter(Boolean).join("\n");
    }
    for (const oep of ovSeq?.items ?? []) {
      const short = oep.get("short");
      const target = items.find((ep) => ep.get("short") === short);
      if (!target) {
        seq.add(oep);
        continue;
      }
      for (const pair of oep.items) {
        if (pair.key.value === "short") continue;
        if (pair.key.value === "parser") {
          // One way to swap a vendored parser, so the schema policy sees it.
          throw new Error(`overlay/${key}.yaml ${short}: set its parser via vendor.yaml parser_overrides`);
        }
        target.set(pair.key.value, pair.value);
        if (pair.key.value === "returns_schema") pyRefs.delete(target); // JS-owned now
      }
      if (oep.commentBefore) {
        target.commentBefore = [target.commentBefore, oep.commentBefore]
          .filter(Boolean)
          .join("\n");
      }
    }
  }

  if (unusedNames.size || unusedOverrides.size) {
    throw new Error(
      `vendor.yaml ${key}: stale entries match no endpoint: ` +
        [...unusedNames, ...unusedOverrides].join(", ")
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
  };
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

/**
 * Derive every vendored output (codegen-relative path -> content) from the
 * committed upstream copy + manifest + overlays. Offline and deterministic.
 */
export function deriveAll(root = CODEGEN_DIR) {
  const manifest = loadManifest(root);
  const up = join(root, UPSTREAM);
  const upSchemas = listYaml(join(up, "schemas"));
  const out = new Map();
  const jsOwned = new Set(); // schema files overlays attach (never vendored over)
  for (const c of manifest.copy ?? []) out.set(c, read(join(up, c)));
  for (const [key, cfg] of familyEntries(manifest)) {
    const text = read(join(up, upstreamEndpointPath(key, cfg)));
    const ovPath = join(root, "overlay", `${key}.yaml`);
    const overlay = existsSync(ovPath) ? read(ovPath) : null;
    const fam = transformFamily(key, cfg, text, overlay, manifest.source);
    out.set(`endpoints/${key}.yaml`, fam.text);
    for (const ref of fam.jsRefs) jsOwned.add(`schemas/${ref}.yaml`);
    for (const ref of fam.schemaRefs) {
      for (const f of schemaFilesFor(ref, upSchemas)) {
        out.set(`schemas/${rewriteSchema(f, cfg.schemas)}`, read(join(up, "schemas", f)));
      }
    }
  }
  const clash = [...jsOwned].filter((p) => out.has(p));
  if (clash.length) {
    throw new Error(`vendored schemas would overwrite JS-owned ones an overlay attaches: ${clash.join(", ")}`);
  }
  return out;
}

/**
 * Schema files left behind in a directory the vendor writes into: not vendored
 * and not referenced by any endpoint YAML (vendored or JS-owned). These are
 * stale copies of a schema upstream renamed/dropped (or a hand-added file).
 */
export function findOrphans(root, outputs) {
  const referenced = new Set();
  const endpointsDir = join(root, "endpoints");
  const endpointTexts = new Map(
    readdirSync(endpointsDir)
      .filter((f) => f.endsWith(".yaml"))
      .map((f) => [`endpoints/${f}`, read(join(endpointsDir, f))])
  );
  for (const [p, t] of outputs) if (p.startsWith("endpoints/")) endpointTexts.set(p, t);
  for (const t of endpointTexts.values()) for (const r of schemaRefs(t)) referenced.add(r);
  const isReferenced = (rel) => {
    const ref = rel.replace(/\.yaml$/, "");
    return referenced.has(ref) || (ref.includes("/") && referenced.has(ref.slice(0, ref.lastIndexOf("/"))));
  };
  const dirs = new Set(
    [...outputs.keys()]
      .filter((p) => p.startsWith("schemas/"))
      .map((p) => p.slice(0, p.lastIndexOf("/")))
  );
  const orphans = [];
  for (const d of dirs) {
    for (const e of readdirSync(join(root, d), { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isFile() && e.name.endsWith(".yaml") && !outputs.has(p) && !isReferenced(p.slice("schemas/".length))) {
        orphans.push(p);
      }
    }
  }
  return orphans.sort();
}

/** Offline drift check. Returns a list of human-readable problems ([] = clean). */
export function checkVendor(root = CODEGEN_DIR) {
  const problems = [];
  const manifest = loadManifest(root);
  const refFile = join(root, UPSTREAM, REF_FILE);
  const stamped = existsSync(refFile) ? read(refFile).trim() : "(missing)";
  if (stamped !== manifest.source.ref) {
    problems.push(
      `vendor/upstream is at ${stamped} but vendor.yaml pins ${manifest.source.ref} — run \`npm run vendor\``
    );
  }
  const outputs = deriveAll(root);
  for (const [p, content] of outputs) {
    const file = join(root, p);
    if (!existsSync(file)) problems.push(`MISSING: tools/codegen/${p}`);
    else if (read(file) !== content) problems.push(`DRIFT: tools/codegen/${p} differs from its vendored source (hand-edit?)`);
  }
  for (const o of findOrphans(root, outputs)) problems.push(`ORPHAN: tools/codegen/${o} (not vendored, not referenced)`);
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

function gitSource(repo, ref) {
  const git = (args, input) => {
    const r = spawnSync("git", ["-C", repo, ...args], { input, maxBuffer: 1 << 30 });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
    return r.stdout;
  };
  return {
    async list() {
      return git(["ls-tree", "-r", "--name-only", ref, "--", `${PY_CODEGEN}schemas`])
        .toString("utf8")
        .split("\n")
        .filter(Boolean);
    },
    async getMany(paths) {
      // One `git cat-file --batch` round trip: "<sha> blob <size>\n<bytes>\n".
      const buf = git(["cat-file", "--batch"], paths.map((p) => `${ref}:${p}`).join("\n") + "\n");
      const out = [];
      let i = 0;
      for (const p of paths) {
        const nl = buf.indexOf(10, i);
        const head = buf.toString("utf8", i, nl);
        i = nl + 1;
        if (head.endsWith(" missing")) throw new Error(`${p} not found at ${ref} in ${repo}`);
        const size = Number(head.split(" ")[2]);
        out.push(buf.toString("utf8", i, i + size));
        i += size + 1;
      }
      return out;
    },
  };
}

function githubSource(repoSlug, ref) {
  const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  const get = async (url, opts = {}) => {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
    return res;
  };
  return {
    async list() {
      const url = `https://api.github.com/repos/${repoSlug}/git/trees/${ref}:${PY_CODEGEN}schemas?recursive=1`;
      const j = await (await get(url, { headers })).json();
      if (j.truncated) throw new Error(`tree listing truncated: ${url}`);
      return j.tree.filter((t) => t.type === "blob").map((t) => `${PY_CODEGEN}schemas/${t.path}`);
    },
    async getMany(paths) {
      const out = new Array(paths.length);
      let next = 0;
      const worker = async () => {
        while (next < paths.length) {
          const i = next++;
          const url = `https://raw.githubusercontent.com/${repoSlug}/${ref}/${paths[i]}`;
          out[i] = await (await get(url)).text();
        }
      };
      await Promise.all(Array.from({ length: 8 }, worker));
      return out;
    },
  };
}

/** Fetch the pinned upstream files into vendor/upstream/ (replacing it). */
export async function fetchUpstream(root = CODEGEN_DIR) {
  const manifest = loadManifest(root);
  const { repo, ref } = manifest.source;
  const src = process.env.SDV_PY_REPO ? gitSource(process.env.SDV_PY_REPO, ref) : githubSource(repo, ref);

  const endpointPaths = [
    ...new Set([
      ...familyEntries(manifest).map(([k, c]) => upstreamEndpointPath(k, c)),
      ...(manifest.copy ?? []),
    ]),
  ];
  const endpointTexts = await src.getMany(endpointPaths.map((p) => PY_CODEGEN + p));
  const available = (await src.list()).map((p) => p.slice(`${PY_CODEGEN}schemas/`.length));
  const schemaPaths = new Set();
  const dangling = [];
  endpointPaths.forEach((p, i) => {
    if (!p.startsWith("endpoints/") || (manifest.copy ?? []).includes(p)) return;
    for (const ref_ of schemaRefs(endpointTexts[i])) {
      const files = schemaFilesFor(ref_, available);
      if (!files.length) dangling.push(ref_);
      files.forEach((f) => schemaPaths.add(`schemas/${f}`));
    }
  });
  const schemaList = [...schemaPaths].sort();
  const schemaTexts = await src.getMany(schemaList.map((p) => PY_CODEGEN + p));

  const up = join(root, UPSTREAM);
  rmSync(up, { recursive: true, force: true });
  const files = [
    ...endpointPaths.map((p, i) => [p, endpointTexts[i]]),
    ...schemaList.map((p, i) => [p, schemaTexts[i]]),
  ];
  for (const [p, text] of files) {
    mkdirSync(dirname(join(up, p)), { recursive: true });
    writeFileSync(join(up, p), text);
  }
  writeFileSync(join(up, REF_FILE), `${ref}\n`);
  return { files: files.length, dangling: [...new Set(dangling)].sort() };
}

/** Rewrite `source.ref` in vendor.yaml in place (keeps its comments). */
function bumpRef(root, sha) {
  const file = join(root, "vendor.yaml");
  const text = read(file);
  const next = text.replace(/^(\s+ref:\s*).*$/m, `$1${sha}`);
  if (next === text && !text.includes(sha)) throw new Error("could not find `ref:` in vendor.yaml");
  writeFileSync(file, next);
}

async function main(argv) {
  if (argv.includes("--check")) {
    const problems = checkVendor();
    for (const p of problems) console.error(p);
    if (problems.length) {
      console.error(`vendor:check: ${problems.length} problem(s) — run \`npm run vendor -- --offline\` (or edit overlay/, not the vendored files)`);
      process.exit(1);
    }
    console.log("vendor:check: vendored files match tools/codegen/vendor/upstream");
    return;
  }
  const refIdx = argv.indexOf("--ref");
  if (refIdx !== -1) {
    const sha = argv[refIdx + 1];
    if (!/^[0-9a-f]{40}$/.test(sha ?? "")) throw new Error("--ref needs a full 40-char commit sha");
    bumpRef(CODEGEN_DIR, sha);
  }
  if (!argv.includes("--offline")) {
    const { files, dangling } = await fetchUpstream();
    console.log(`vendor: fetched ${files} upstream files at ${loadManifest().source.ref}`);
    if (dangling.length) console.warn(`vendor: upstream names schemas it does not ship: ${dangling.join(", ")}`);
  }
  const { written, removed } = writeVendor();
  console.log(`vendor: wrote ${written} files${removed.length ? `, removed ${removed.length} orphans` : ""}`);
  for (const r of removed) console.log(`  removed tools/codegen/${r}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}

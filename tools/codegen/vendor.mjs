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
//
//   node tools/codegen/vendor.mjs [--ref <sha>]   # fetch upstream, re-derive
//   node tools/codegen/vendor.mjs --offline       # re-derive from vendor/upstream
//   node tools/codegen/vendor.mjs --check         # offline gate: LOCK + drift (exit 1)
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
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, parseDocument } from "yaml";

export const CODEGEN_DIR = dirname(fileURLToPath(import.meta.url));
const UPSTREAM = join("vendor", "upstream");
const REF_FILE = "REF";
// "<git blob sha>  <path>" per upstream file, taken from the pinned tree at fetch
// time; the offline check re-hashes every committed copy against it.
const LOCK_FILE = "LOCK";
const PY_CODEGEN = "tools/codegen/";

const read = (p) => readFileSync(p, "utf8");

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
  if (m === undefined) return { js: pyParser, compatible: cfg.schema_compatible === true };
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
 * Overlay entries: one whose `short` is vendored patches it (never its `parser`;
 * use `parser_overrides`); one with a new `short` is appended and must carry a
 * `path`. A patched key whose value already equals the vendored one throws, so a
 * patch that upstream has absorbed announces itself.
 *
 * Throws on a stale manifest entry (a `names` / `parsers` / `parser_overrides`
 * key that matches no vendored endpoint) or a duplicate short.
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
  const unusedParsers = new Set(Object.keys(cfg.parsers ?? {}));
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
      unusedParsers.delete(pyParser);
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
    const vendored = [...items]; // overlay additions never become patch targets
    for (const oep of ovSeq?.items ?? []) {
      const short = oep.get("short");
      const target = vendored.find((ep) => ep.get("short") === short);
      if (!target) {
        if (!oep.has("path")) {
          throw new Error(
            `overlay/${key}.yaml ${short}: patches no vendored endpoint (renamed or dropped upstream?); an addition needs a \`path\``
          );
        }
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
        target.set(k, pair.value);
        if (k === "returns_schema") pyRefs.delete(target); // JS-owned now
      }
      if (oep.commentBefore) {
        target.commentBefore = [target.commentBefore, oep.commentBefore]
          .filter(Boolean)
          .join("\n");
      }
    }
  }

  if (unusedNames.size || unusedOverrides.size || unusedParsers.size) {
    throw new Error(
      `vendor.yaml ${key}: stale entries match no endpoint: ` +
        [...unusedNames, ...unusedParsers, ...unusedOverrides].join(", ")
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

// Each source exposes `tree(extra)` -> Map(codegen-relative path -> git blob sha)
// for the pinned endpoints/ + schemas/ trees plus the `extra` files (`copy:`
// entries outside those dirs), and `getMany(paths)` -> Buffers.

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
      const ls = git(["ls-tree", "-r", ref, "--", ...paths]);
      for (const line of ls.toString("utf8").split("\n").filter(Boolean)) {
        const [meta, path] = line.split("\t"); // "<mode> blob <sha>\t<path>"
        const [, type, sha] = meta.split(" ");
        if (type === "blob") out.set(path.slice(PY_CODEGEN.length), sha);
      }
      return out;
    },
    async getMany(paths) {
      // One `git cat-file --batch` round trip: "<sha> blob <size>\n<bytes>\n".
      const buf = git(["cat-file", "--batch"], paths.map((p) => `${ref}:${PY_CODEGEN}${p}`).join("\n") + "\n");
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

function githubSource(repoSlug, ref) {
  const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  const get = async (url, opts = {}) => {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
    return res;
  };
  return {
    async tree(extra = []) {
      const url = `https://api.github.com/repos/${repoSlug}/git/trees/${ref}:${PY_CODEGEN.slice(0, -1)}?recursive=1`;
      const j = await (await get(url, { headers })).json();
      if (j.truncated) throw new Error(`tree listing truncated: ${url}`);
      return new Map(
        j.tree
          .filter((t) => t.type === "blob" && (/^(endpoints|schemas)\//.test(t.path) || extra.includes(t.path)))
          .map((t) => [t.path, t.sha])
      );
    },
    async getMany(paths) {
      const out = new Array(paths.length);
      let next = 0;
      const worker = async () => {
        while (next < paths.length) {
          const i = next++;
          const url = `https://raw.githubusercontent.com/${repoSlug}/${ref}/${PY_CODEGEN}${paths[i]}`;
          out[i] = Buffer.from(await (await get(url)).arrayBuffer());
        }
      };
      await Promise.all(Array.from({ length: 8 }, worker));
      return out;
    },
  };
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
  const endpointPaths = [
    ...new Set([
      ...familyEntries(manifest).map(([k, c]) => upstreamEndpointPath(k, c)),
      ...(manifest.copy ?? []),
    ]),
  ];
  for (const p of endpointPaths) if (!tree.has(p)) throw new Error(`${PY_CODEGEN}${p} not found at ${ref}`);
  const endpointBufs = await src.getMany(endpointPaths);
  const available = [...tree.keys()].filter((p) => p.startsWith("schemas/")).map((p) => p.slice("schemas/".length));
  const schemaPaths = new Set();
  const dangling = [];
  endpointPaths.forEach((p, i) => {
    if ((manifest.copy ?? []).includes(p)) return;
    for (const ref_ of schemaRefs(endpointBufs[i].toString("utf8"))) {
      const files = schemaFilesFor(ref_, available);
      if (!files.length) dangling.push(ref_);
      files.forEach((f) => schemaPaths.add(`schemas/${f}`));
    }
  });
  const schemaList = [...schemaPaths].sort();
  const schemaBufs = await src.getMany(schemaList);

  const files = [
    ...endpointPaths.map((p, i) => [p, endpointBufs[i]]),
    ...schemaList.map((p, i) => [p, schemaBufs[i]]),
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
  if (!argv.includes("--offline")) {
    // Fetch first: a failed fetch leaves vendor.yaml (and vendor/upstream) untouched.
    const ref = sha ?? loadManifest().source.ref;
    const { files, dangling } = await fetchUpstream(CODEGEN_DIR, ref);
    if (sha) bumpRef(CODEGEN_DIR, sha);
    console.log(`vendor: fetched ${files} upstream files at ${ref}`);
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

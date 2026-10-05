// Online integrity check for tools/codegen/vendor/upstream/LOCK.
//
// `npm run vendor:check` is offline: it proves the committed copies match LOCK, but
// a change that edits a copy AND its LOCK line together passes it. This check closes
// that gap: every LOCK blob sha must equal the blob sha GitHub reports for the same
// path in sdv-py's tree at the pinned ref (git/trees/<ref>, unauthenticated or with
// GITHUB_TOKEN), and LOCK must list exactly the files the vendor fetches (so a
// path dropped from LOCK is caught too).
//
//   node tools/codegen/vendor-lock-online.mjs      # npm run vendor:check:online
//
// Failing to reach GitHub is a failure to verify, never a pass (exit 1).
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CODEGEN_DIR, decodeText, endpointPathsOf, githubSource, gitBlobSha, loadManifest, selectUpstreamPaths } from "./vendor.mjs";

const LOCK = join("vendor", "upstream", "LOCK");

/** Parse LOCK ("<sha>  <path>" per line) into Map(path -> sha). */
export function readLock(root = CODEGEN_DIR) {
  return new Map(
    readFileSync(join(root, LOCK), "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const [sha, path] = l.split(/ {2}/);
        return [path, sha];
      })
  );
}

/**
 * Compare LOCK with the upstream tree. `fetchTree(manifest)` resolves to
 * Map(path -> blob sha) for the pinned ref (rejects on any network error, which
 * propagates: no verdict is not a pass). Two checks:
 *   1. every LOCK entry's sha equals the tree's sha for that path;
 *   2. LOCK's path SET equals the one `fetchUpstream` would write, computed by the
 *      shared `selectUpstreamPaths` from the tree and the endpoint YAML copies
 *      (each hashed against the tree first). A path dropped from LOCK, or an extra
 *      one, is an error: dropping a line and editing the vendored copy must not pass.
 * Returns problems ([] = verified).
 */
export async function verifyLockOnline(root = CODEGEN_DIR, fetchTree = defaultFetchTree) {
  const manifest = loadManifest(root);
  const { repo, ref } = manifest.source;
  const lock = readLock(root);
  if (!lock.size) return [`LOCK is empty: nothing to verify`];
  const tree = await fetchTree(manifest);
  const problems = [];
  for (const [path, sha] of lock) {
    const upstream = tree.get(path);
    if (upstream === undefined) problems.push(`LOCK: ${path} is not in ${repo}@${ref}`);
    else if (upstream !== sha) problems.push(`LOCK: ${path} is pinned to blob ${sha} but upstream has ${upstream} at ${ref}`);
  }
  // Expected path set. Endpoint texts come from the committed copies, trusted only
  // once their bytes hash to the upstream tree's sha.
  const endpoints = new Map();
  for (const p of endpointPathsOf(manifest)) {
    const file = join(root, "vendor", "upstream", p);
    if (!tree.has(p)) problems.push(`LOCK: expected ${p} is not in ${repo}@${ref}`);
    else if (!existsSync(file)) problems.push(`LOCK: expected ${p} is missing from vendor/upstream`);
    else {
      const buf = readFileSync(file); // hash and decode the same bytes
      if (gitBlobSha(buf) !== tree.get(p)) problems.push(`LOCK: vendor/upstream/${p} does not match upstream blob ${tree.get(p)}`);
      else endpoints.set(p, decodeText(buf));
    }
  }
  if (problems.length) return problems;
  let expected;
  try {
    const { schemaList, pyList } = selectUpstreamPaths(manifest, tree, (p) => endpoints.get(p));
    expected = new Set([...endpoints.keys(), ...schemaList, ...pyList]);
  } catch (e) {
    return [`LOCK: cannot compute the expected path set: ${e.message}`];
  }
  for (const p of expected) if (!lock.has(p)) problems.push(`LOCK: ${p} is missing from LOCK (a vendored file must be pinned)`);
  for (const p of lock.keys()) if (!expected.has(p)) problems.push(`LOCK: ${p} is in LOCK but is not a file the vendor fetches`);
  return problems.sort();
}

const defaultFetchTree = (manifest) =>
  githubSource(manifest.source.repo, manifest.source.ref).tree(manifest.copy ?? []);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyLockOnline().then(
    (problems) => {
      for (const p of problems) console.error(p);
      if (problems.length) {
        console.error(
          `vendor:check:online: ${problems.length} problem(s): the vendored copies/LOCK do not match sdv-py at the pin; re-fetch with \`npm run vendor\``
        );
        process.exit(1);
      }
      console.log("vendor:check:online: LOCK lists exactly the fetched files and every blob sha matches sdv-py's tree at the pinned ref");
    },
    (e) => {
      console.error(`vendor:check:online: could not verify (${e.message ?? e}); a failure to verify is a failure`);
      process.exit(1);
    }
  );
}

// Online integrity check for tools/codegen/vendor/upstream/LOCK.
//
// `npm run vendor:check` is offline: it proves the committed copies match LOCK, but
// a change that edits a copy AND its LOCK line together passes it. This check closes
// that gap: every LOCK blob sha must equal the blob sha GitHub reports for the same
// path in sdv-py's tree at the pinned ref (git/trees/<ref>, unauthenticated or with
// GITHUB_TOKEN).
//
//   node tools/codegen/vendor-lock-online.mjs      # npm run vendor:check:online
//
// Failing to reach GitHub is a failure to verify, never a pass (exit 1).
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CODEGEN_DIR, githubSource, loadManifest } from "./vendor.mjs";

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
 * propagates: no verdict is not a pass). Returns problems ([] = verified).
 */
export async function verifyLockOnline(root = CODEGEN_DIR, fetchTree = defaultFetchTree) {
  const manifest = loadManifest(root);
  const lock = readLock(root);
  if (!lock.size) return [`LOCK is empty: nothing to verify`];
  const tree = await fetchTree(manifest);
  const problems = [];
  for (const [path, sha] of lock) {
    const upstream = tree.get(path);
    if (upstream === undefined) {
      problems.push(`LOCK: ${path} is not in ${manifest.source.repo}@${manifest.source.ref}`);
    } else if (upstream !== sha) {
      problems.push(`LOCK: ${path} is pinned to blob ${sha} but upstream has ${upstream} at ${manifest.source.ref}`);
    }
  }
  return problems;
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
      console.log("vendor:check:online: every LOCK blob sha matches sdv-py's tree at the pinned ref");
    },
    (e) => {
      console.error(`vendor:check:online: could not verify (${e.message ?? e}); a failure to verify is a failure`);
      process.exit(1);
    }
  );
}

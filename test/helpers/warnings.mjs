// For tests that trigger a process warning on purpose (a deprecated name, endpoint or
// scraper): capture the warnings instead of letting Node print them into the test output.
// Node's own printer is a 'warning' listener; it is detached for the call only and then
// restored, so a warning nobody expected still prints.

/**
 * Run `fn`, returning every process warning it emitted (Node delivers them on the next
 * tick, so this waits one turn before restoring the printer).
 */
export async function captureWarnings(fn) {
  const printers = process.listeners('warning');
  const seen = [];
  const capture = (w) => seen.push(w);
  process.removeAllListeners('warning');
  process.on('warning', capture);
  try {
    await fn();
    await new Promise((r) => setImmediate(r));
  } finally {
    process.off('warning', capture);
    for (const p of printers) process.on('warning', p);
  }
  return seen;
}

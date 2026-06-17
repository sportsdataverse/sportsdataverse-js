import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// Pin the npm package RunKit cells require(). RunKit runs the PUBLISHED package,
// not this repo's working tree — so these cells light up once sportsdataverse
// v3 ships to npm. Until then RunKit resolves the latest published major (v2),
// which uses the older `sdv.<league>.getX()` surface; the v3 `espn*`/provider
// methods below activate on publish. We pin a `^3` preamble so the moment v3 is
// on npm the cells pick it up with no doc edits.
const PINNED_RANGE = '^3';

/** Lazy-load the RunKit embed script exactly once. */
function loadRunKit() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.RunKit) return Promise.resolve(window.RunKit);
  if (window.__runkitLoading) return window.__runkitLoading;

  window.__runkitLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-runkit]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.RunKit));
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://embed.runkit.com';
    s.async = true;
    s.dataset.runkit = 'true';
    s.addEventListener('load', () => resolve(window.RunKit));
    s.addEventListener('error', reject);
    document.head.appendChild(s);
  });
  return window.__runkitLoading;
}

function RunKitInner({ source, title, nodeVersion, minHeight }) {
  const hostRef = React.useRef(null);
  const [status, setStatus] = React.useState('loading'); // loading | ready | error

  React.useEffect(() => {
    let cancelled = false;
    let notebook = null;

    loadRunKit()
      .then((RunKit) => {
        if (cancelled || !RunKit || !hostRef.current) return;
        // A `require('sportsdataverse')` in `source` resolves to whatever the
        // preamble pins; RunKit installs it before the cell evaluates.
        notebook = RunKit.createNotebook({
          element: hostRef.current,
          source,
          preamble: `// sportsdataverse pinned to ${PINNED_RANGE} (published npm package)`,
          packageVersionOverrides: { sportsdataverse: PINNED_RANGE },
          nodeVersion: nodeVersion || '18.x.x',
          onLoad: () => !cancelled && setStatus('ready'),
        });
      })
      .catch(() => !cancelled && setStatus('error'));

    return () => {
      cancelled = true;
      try {
        if (notebook && typeof notebook.destroy === 'function') notebook.destroy();
      } catch {
        /* embed teardown is best-effort */
      }
    };
  }, [source, nodeVersion]);

  return (
    <div className="runkit-cell" style={{ margin: '1rem 0' }}>
      {title ? (
        <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>{title}</div>
      ) : null}
      <div
        style={{
          fontSize: '0.8rem',
          opacity: 0.75,
          marginBottom: '0.5rem',
        }}
      >
        Live cell — runs the <strong>published</strong> npm package{' '}
        <code>sportsdataverse@{PINNED_RANGE}</code>. The v3 method surface shown
        here activates once v3 is on npm; until then RunKit may load v2.
      </div>
      <div
        ref={hostRef}
        style={{ minHeight: minHeight || 96 }}
        aria-busy={status === 'loading'}
      />
      {status === 'error' ? (
        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
          The live RunKit embed could not load (offline or blocked). You can copy
          the snippet above and run it in Node, or try{' '}
          <a href="https://runkit.com" target="_blank" rel="noreferrer">
            runkit.com
          </a>{' '}
          directly.
        </div>
      ) : null}
    </div>
  );
}

/**
 * <RunKit source={`...`} /> — an SSR-safe, lazily-mounted RunKit embed.
 *
 * Props:
 *   - source       (string, required) the JS the cell runs. Top-level await ok.
 *   - title        (string)  optional heading above the cell.
 *   - nodeVersion  (string)  RunKit node runtime (default 18.x.x).
 *   - minHeight    (number)  reserved height before the embed paints.
 */
export default function RunKit(props) {
  return (
    <BrowserOnly
      fallback={
        <pre style={{ margin: '1rem 0' }}>
          <code>{props.source}</code>
        </pre>
      }
    >
      {() => <RunKitInner {...props} />}
    </BrowserOnly>
  );
}

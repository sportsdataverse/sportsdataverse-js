import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
// One row per upstream source, written by tools/codegen/generate.mjs
// (tools/codegen/sources.mjs) and drift-guarded by `npm run codegen:check`.
import data from '@site/src/generated/sources.json';
import styles from './styles.module.css';

const AUTH = {
  none: { label: 'no auth', tone: 'success', title: 'Nothing to configure' },
  key: { label: 'API key', tone: 'warning', title: 'Bring your own API key' },
  subscription: { label: 'subscription', tone: 'danger', title: 'Needs a paid subscription login' },
  impersonation: { label: 'impersonation', tone: 'info', title: 'Browser-impersonating transport (optional peer dependency)' },
};
const OWNERSHIP = {
  vendored: { label: 'vendored', title: 'Endpoint YAML vendored from sportsdataverse-py at the pin' },
  'js-owned': { label: 'JS-owned', title: 'Endpoint YAML maintained in this repo' },
  mixed: { label: 'vendored + JS-owned', title: 'One family vendored from sdv-py, one maintained here' },
  loaders: { label: 'loaders', title: 'Release-asset loaders generated from sdv-py releases.yaml' },
  'hand-written': { label: 'hand-written', title: 'TypeScript under src/' },
};

const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : null);

function Badge({ tone, title, children }) {
  return (
    <span className={clsx(styles.badge, tone && styles[`badge_${tone}`])} title={title}>
      {children}
    </span>
  );
}

function SourceCard({ s, league }) {
  const auth = AUTH[s.auth] ?? { label: s.auth };
  const own = OWNERSHIP[s.ownership] ?? { label: s.ownership };
  const leagueLine =
    s.id === 'espn'
      ? `${s.leagues.length} leagues`
      : s.leagues.length
        ? s.leagues.map((l) => `sdv.${l}`).join(', ')
        : `sdv.${s.namespaces[0]}`;
  return (
    <article className={clsx(styles.card, s.deprecated && styles.cardDeprecated)}>
      <header className={styles.cardHead}>
        <Link className={styles.title} to={s.docsPath}>
          {s.label}
        </Link>
        <span className={styles.badges}>
          {s.deprecated && <Badge tone="danger" title="Deprecated">deprecated</Badge>}
          <Badge tone={auth.tone} title={auth.title}>{auth.label}</Badge>
          <Badge title={own.title}>{own.label}</Badge>
        </span>
      </header>
      <div className={styles.host} title={s.host}>{s.host}</div>
      <ul className={styles.families}>
        {s.families.map((f) => (
          <li key={f.api} className={styles.family} title={`${f.host} · ${f.ownership}`}>
            {f.label} <b>{f.count}</b>
          </li>
        ))}
      </ul>
      <dl className={styles.stats}>
        <div>
          <dt>{s.id === 'releases' ? 'loaders' : 'wrappers'}</dt>
          <dd>{s.wrapperCount}</dd>
        </div>
        <div>
          <dt>{league && s.id !== 'espn' ? 'namespace' : 'leagues'}</dt>
          <dd>{leagueLine}</dd>
        </div>
        <div title="Returns tables checked against a real sportsdataverse-py capture">
          <dt>parity</dt>
          <dd>{s.parity ? `${s.parity.verified}/${s.parity.total}` : '—'}</dd>
        </div>
        <div title="Returns-table columns with a description">
          <dt>described</dt>
          <dd>{s.descriptionFill ? pct(s.descriptionFill.filled, s.descriptionFill.total) : '—'}</dd>
        </div>
      </dl>
      {s.note && <p className={styles.note}>{s.note}</p>}
    </article>
  );
}

/**
 * The sources grid. `<SourcesCovered/>` lists every source on the site;
 * `<SourcesCovered league="nba"/>` only the sources that touch that league
 * (ESPN, the native families merged onto `sdv.nba`, the loaders).
 */
export default function SourcesCovered({ league, totals = !league }) {
  const rows = league ? data.sources.filter((s) => s.leagues.includes(league)) : data.sources;
  const t = data.totals;
  return (
    <section className={styles.wrap}>
      {totals && (
        <p className={styles.totals}>
          <b>{t.sources}</b> sources · ESPN <b>{t.espnShorts}</b> endpoints × <b>{t.espnLeagues}</b> leagues ·{' '}
          <b>{t.flatWrappers}</b> native wrappers across <b>{t.flatFamilies}</b> families · <b>{t.loaders}</b> dataset loaders
        </p>
      )}
      <div className={styles.grid}>
        {rows.map((s) => (
          <SourceCard key={s.id} s={s} league={league} />
        ))}
      </div>
    </section>
  );
}

/** Legend for the badges and the two coverage figures (the Sources page). */
export function SourcesLegend() {
  return (
    <div className={styles.legend}>
      <p>
        <b>Auth</b> — what the caller brings:{' '}
        {Object.entries(AUTH).map(([k, v]) => (
          <span key={k} className={styles.legendItem}>
            <Badge tone={v.tone}>{v.label}</Badge> {v.title}
          </span>
        ))}
      </p>
      <p>
        <b>Ownership</b> — where the endpoint definitions live:{' '}
        {Object.entries(OWNERSHIP).map(([k, v]) => (
          <span key={k} className={styles.legendItem}>
            <Badge>{v.label}</Badge> {v.title}
          </span>
        ))}
      </p>
      <p>
        <b>parity</b> — returns tables verified on a real sportsdataverse-py capture / tables documented
        (<code>test/fixtures/py/parity_coverage.json</code>); <b>described</b> — share of returns-table
        columns with a description (<code>docs/src/generated/description_coverage.json</code>). A dash
        means the source has nothing to measure yet.
      </p>
    </div>
  );
}

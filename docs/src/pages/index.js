import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';
// Generated league/provider metadata (tools/codegen/generate.mjs). Imported
// statically so the coverage grid below is data-driven AND SSR-safe — adding a
// sport/league/provider (then re-running codegen) updates this page with no
// hand edit here.
import endpoints from '@site/src/playground/endpoints.json';

const FeatureList = [
  {
    title: "Men's College Basketball",
    description: (
      <>
        It provides users with the capability to access the ESPN API’s
        men's college basketball game play-by-plays,
        box scores, and schedules.
      </>
    ),
  },
  {
    title: "College Football",
    description: (
      <>
        It provides users with the capability to access the ESPN API’s
        college football game play-by-plays,
        box scores, and schedules to analyze the data for themselves.
      </>
    ),
  },
  {
    title: 'EPA and WPA',
    description: (
      <>
        It provides users with the capability to access the cfbfastR team's
        expected points added and win probability metrics.
      </>
    ),
  },
  {
    title: 'NFL',
    description: (
      <>
        It provides users with the capability to access the nflfastR team's
        game play-by-plays, box scores, and schedules. Additionally, the
        package provides users with functions to access the ESPN NFL API
        endpoints during live game-play.
      </>
    ),
  },
  {
    title: 'NHL',
    description: (
      <>
        It provides users with the capability to access ESPN's NHL endpoints for
        game play-by-plays, box scores, and schedules.
      </>
    ),
  },
];

// Display order + label for the sport groups (mirrors the codegen SPORT_ORDER).
// Any sport present in the metadata but not listed here is appended after.
const SPORT_ORDER = ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'cricket'];
const SPORT_LABEL = {
  basketball: 'Basketball',
  football: 'Football',
  baseball: 'Baseball',
  hockey: 'Hockey',
  soccer: 'Soccer',
  cricket: 'Cricket',
};
const sportLabel = (s) =>
  SPORT_LABEL[s] || s.charAt(0).toUpperCase() + s.slice(1);

// Friendly labels for the standalone provider namespaces (fallback: the
// namespace itself). Kept tiny + data-derived so a new provider still appears.
const PROVIDER_LABEL = {
  odds: 'The Odds API',
  recruiting: '247Sports',
  cbs: 'CBS Sports',
  fox: 'Fox Sports',
  yahoo: 'Yahoo Sports',
};

/** Build the sport -> [league prefixes] map from the generated metadata. */
function leaguesBySport() {
  const groups = new Map();
  for (const l of endpoints.leagues || []) {
    if (!groups.has(l.sport)) groups.set(l.sport, []);
    groups.get(l.sport).push(l.prefix);
  }
  const sports = [
    ...SPORT_ORDER.filter((s) => groups.has(s)),
    ...[...groups.keys()].filter((s) => !SPORT_ORDER.includes(s)).sort(),
  ];
  return sports.map((sport) => ({
    sport,
    prefixes: groups.get(sport).slice().sort((a, b) => a.localeCompare(b)),
  }));
}

/**
 * Provider namespaces (cross-sport native APIs) that aren't a single ESPN
 * league — derived from flatLeagues (api stem -> namespace) minus the league
 * prefixes. Counts come from flatApis.
 */
function providerNamespaces() {
  const leaguePrefixes = new Set((endpoints.leagues || []).map((l) => l.prefix));
  const flatLeagues = endpoints.flatLeagues || {};
  const counts = {};
  for (const w of endpoints.flatApis || []) {
    const ns = flatLeagues[w.api];
    if (ns) counts[ns] = (counts[ns] || 0) + 1;
  }
  const standalone = [...new Set(Object.values(flatLeagues))].filter(
    (ns) => !leaguePrefixes.has(ns)
  );
  return standalone
    .sort((a, b) => a.localeCompare(b))
    .map((ns) => ({ ns, label: PROVIDER_LABEL[ns] || ns, count: counts[ns] || 0 }));
}

function Feature({ imageUrl, title, description }) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx('col col--4', styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Getting Started
          </Link>
          &nbsp;&nbsp;
          <Link
            className="button button--outline button--secondary button--lg"
            to="/playground">
            Try the Playground
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * Data-driven coverage grid: ESPN leagues grouped by sport + the native
 * (non-ESPN) provider namespaces. Everything maps over the generated
 * endpoints.json, so new sports/leagues/providers surface automatically.
 */
function CoverageSection() {
  const sportGroups = leaguesBySport();
  const providers = providerNamespaces();
  return (
    <section className={styles.coverage}>
      <div className="container">
        <h2 className="text--center">Every league, one mental model</h2>
        <p className="text--center">
          {endpoints.leagues?.length} ESPN leagues across {sportGroups.length}{' '}
          sports, plus {providers.length} native provider APIs — each call is a
          tidy <code>sdv.&lt;league&gt;.*</code> wrapper. Pick a league for its
          full endpoint table.
        </p>
        <div className="row">
          {sportGroups.map(({sport, prefixes}) => (
            <div key={sport} className={clsx('col col--4', styles.coverageCol)}>
              <h3 className={styles.coverageHeading}>{sportLabel(sport)}</h3>
              <div className={styles.chipRow}>
                {prefixes.map((p) => (
                  <Link
                    key={p}
                    className={styles.chip}
                    to={`/docs/reference/${p}`}>
                    {p}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <h3 className={clsx('text--center', styles.coverageHeading)}>
          Native provider APIs
        </h3>
        <div className={clsx(styles.chipRow, styles.chipRowCenter)}>
          {providers.map(({ns, label, count}) => (
            <Link key={ns} className={styles.chip} to={`/docs/reference/${ns}`}>
              {label} <span className={styles.chipCount}>{count}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="The SportsDataverse's Node.js Package for Sports Data.">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
        <CoverageSection />
      </main>
    </Layout>
  );
}

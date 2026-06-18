import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';
// Small, codegen-derived coverage view-model (sport -> league prefixes +
// provider namespace counts), built by tools/codegen/generate.mjs. Purpose-built
// so the homepage stays data-driven AND SSR-safe WITHOUT pulling the full
// ~17k-line endpoints.json catalog into the first-load bundle. Adding a
// sport/league/provider (then re-running codegen) updates this page with no hand
// edit here.
import coverage from '@site/src/generated/coverage.json';

// Basketball leagues are documented as WRITTEN source (phased proof): their
// reference lives in a per-league dir (`/docs/<prefix>/`) instead of the flat
// `/docs/reference/<prefix>` page every other league uses.
const WRITTEN_ESPN_PREFIXES = new Set(['nba', 'wnba', 'mbb', 'wbb']);
const leagueDocPath = (p) =>
  WRITTEN_ESPN_PREFIXES.has(p) ? `/docs/${p}/` : `/docs/reference/${p}`;

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

// Display labels for the sport groups (the ordering + grouping is already done
// by the codegen and baked into coverage.json).
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

// coverage.json arrives already grouped-by-sport + ordered + sorted, so the
// homepage just applies display labels (no client-side derivation).
const sportGroups = coverage.sports || [];
const providers = (coverage.providers || []).map(({ns, count}) => ({
  ns,
  label: PROVIDER_LABEL[ns] || ns,
  count,
}));

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
  return (
    <section className={styles.coverage}>
      <div className="container">
        <h2 className="text--center">Every league, one mental model</h2>
        <p className="text--center">
          {coverage.leagueCount} ESPN leagues across {sportGroups.length}{' '}
          sports — plus sport-specific providers (BartTorvik, HockeyTech) nested
          under their sport, and {providers.length} cross-sport provider APIs.
          Each call is a tidy <code>sdv.&lt;namespace&gt;.*</code> wrapper.
        </p>
        <div className="row">
          {sportGroups.map(({sport, prefixes, providers: sportProviders = []}) => (
            <div key={sport} className={clsx('col col--4', styles.coverageCol)}>
              <h3 className={styles.coverageHeading}>{sportLabel(sport)}</h3>
              <div className={styles.chipRow}>
                {prefixes.map((p) => {
                  const isProvider = sportProviders.includes(p);
                  return (
                    <Link
                      key={p}
                      className={clsx(styles.chip, isProvider && styles.chipProvider)}
                      to={leagueDocPath(p)}
                      title={
                        isProvider
                          ? `${PROVIDER_LABEL[p] || p} — native provider (not an ESPN league)`
                          : undefined
                      }>
                      {p}
                    </Link>
                  );
                })}
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

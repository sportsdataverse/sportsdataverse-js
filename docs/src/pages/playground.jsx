import React from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function PlaygroundPage() {
  return (
    <Layout
      title="Playground"
      description="Run live sportsdataverse-js calls — ESPN and every native API family — in your browser, raw or parsed."
    >
      <main className="container margin-vert--lg">
        <h1>Playground</h1>
        <p>
          Pick a league or provider and an endpoint, fill in any parameters, and run the
          call live — ESPN for every league, plus the native families (MLB Stats, Statcast,
          NHL, NFL.com, HockeyTech, The Odds API, CBS, Fox, Yahoo, 247Sports, …). Every option
          maps to a real <code>sdv.&lt;league&gt;.&lt;method&gt;()</code> call — the request URL
          shown is exactly what <code>sportsdataverse</code> builds. Flip <em>Parsed</em> to see
          the tidy rows <code>{'{ parsed: true }'}</code> returns, and copy the share link.
        </p>
        <p>
          <small>
            The upstream APIs send no CORS headers, so each call is proxied through a small
            serverless function on this site, allow-listed to the hosts of every playground
            family. Looking for a worked example instead? See the{' '}
            <a href="/docs/tutorials/">tutorials</a> (each script opens in StackBlitz) or the{' '}
            <a href="/docs/guides/live-blocks">live code blocks</a> guide.
          </small>
        </p>
        <BrowserOnly fallback={<div>Loading playground…</div>}>
          {() => {
            const Playground = require('@site/src/components/Playground').default;
            return <Playground />;
          }}
        </BrowserOnly>
      </main>
    </Layout>
  );
}

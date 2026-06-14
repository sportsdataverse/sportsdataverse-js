import React from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function PlaygroundPage() {
  return (
    <Layout
      title="Playground"
      description="Run live ESPN API calls from sportsdataverse-js in your browser."
    >
      <main className="container margin-vert--lg">
        <h1>Playground</h1>
        <p>
          Pick a league and an endpoint, fill in any parameters, and run the call
          against ESPN live. Every option here maps to a real{' '}
          <code>sdv.&lt;league&gt;.espn_&lt;league&gt;_&lt;endpoint&gt;()</code> method —
          the request URL shown is exactly what <code>sportsdataverse</code> builds.
        </p>
        <p>
          <small>
            ESPN's API sends no CORS headers, so the call is proxied through a small
            serverless function on this site (locked to ESPN hosts). Responses are
            raw ESPN JSON.
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

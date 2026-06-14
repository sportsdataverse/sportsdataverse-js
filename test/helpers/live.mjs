// Gate for live-network test suites. They hit the real ESPN API (slow, flaky,
// dependent on specific game ids staying alive), so they only run when
// SDV_LIVE is set — keeping the default `npm test` deterministic and CI-safe.
//
//   SDV_LIVE=1 npm test
//
// `describe` is a Mocha global, available by the time a spec file imports this.
export const live = ['1', 'true', 'yes'].includes(process.env.SDV_LIVE)
  ? describe
  : describe.skip;

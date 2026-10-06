---
title: Hand-written modules
sidebar_label: Hand-written
sidebar_position: 4
---

# Hand-written modules

**Source of truth:** TypeScript under `src/` that is not `src/generated/`: the parser layer
(`src/parsers/`), the HTTP core (`src/core/` — request pipeline, transports, auth, errors,
config, the release-loader core), the HockeyTech analytics (`src/analytics/`), odds math
(`src/odds/`), the cricket win-probability model (`src/models/`), the ESPN basketball producers
(`src/producers/`), discovery (`src/discover.ts`), and the family runtimes. These are the
functions that **do not fetch data** by themselves. `tools/codegen/utilities.yaml` catalogues
their public exports by category.

<!-- gen:status -->
| Category | exports | modules |
|---|---:|---:|
| [parsers](/docs/utilities/parsers) | 26 | 1 |
| [analytics](/docs/utilities/analytics) | 26 | 2 |
| [odds](/docs/utilities/odds) | 13 | 1 |
| [models](/docs/utilities/models) | 13 | 1 |
| [producers](/docs/utilities/producers) | 29 | 2 |
| [discovery](/docs/utilities/discovery) | 9 | 1 |
| [transforms](/docs/utilities/transforms) | 12 | 2 |
| [http-core](/docs/utilities/http-core) | 62 | 8 |
| [errors](/docs/utilities/errors) | 8 | 1 |
| [config](/docs/utilities/config) | 10 | 1 |

208 exports in 20 modules (tools/codegen/utilities.yaml).
<!-- /gen:status -->

**Generator step:** `generate.mjs` reads `utilities.yaml`, looks each export's signature up in
its TypeScript source (a listed name the source does not declare fails the codegen), and
renders `docs/docs/utilities/` (an index of category cards + one page per category),
`src/generated/utilities.ts` (the name → category table `listFunctions(…, { detail: true })`
labels utilities with) and the "Utilities" sidebar group. TypeDoc (`docs/docusaurus.config.js`)
also renders these modules' TSDoc into `docs/docs/api/` at build time.

**Where output lands:** `docs/docs/utilities/`, `src/generated/utilities.ts`,
`docs/src/generated/coverage.json` (`utilities` block), `docs/docs/api/` (TypeDoc, build time).

**CI drift gate:** `npm run codegen:check`; `test/utilities-catalogue.test.js` (every public
export of `src/index.ts` that is not a namespace, a loader or generated is catalogued, and every
catalogued name exists); `npm run api:check` (`etc/sportsdataverse.api.md`, the API Extractor
report of the whole public surface); `npm run typecheck:strict`.

**How to change it:** edit the TypeScript (with complete TSDoc: `@param`, `@returns`,
`@throws`, an `@example`), add or update the export's entry in `utilities.yaml`, run
`npm run codegen` and `npm run api:report` to re-baseline the API report.

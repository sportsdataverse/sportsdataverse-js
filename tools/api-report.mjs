// Public-API reports (API Extractor) for the two package entry points.
//
//   node tools/api-report.mjs          rewrite etc/*.api.md from dist/*.d.ts
//   node tools/api-report.mjs --check  fail if a committed report is stale (CI)
//
// Both npm scripts (`api:report`, `api:check`) build first, so dist/ is never stale.
import { mkdirSync } from 'node:fs';
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';

const check = process.argv.includes('--check');
const CONFIGS = ['api-extractor.json', 'api-extractor.parsers.json'];

if (!check) mkdirSync('etc', { recursive: true }); // API Extractor will not create it
let failed = false;
for (const file of CONFIGS) {
  const config = ExtractorConfig.loadFileAndPrepare(file);
  const result = Extractor.invoke(config, {
    localBuild: !check,
    printApiReportDiff: check,
    messageCallback(msg) {
      // Replaced by the clearer message below.
      if (msg.messageId === 'console-api-report-not-copied') msg.handled = true;
    },
  });
  if (check && result.apiReportChanged) {
    console.error(
      `\nPublic API changed: etc/${config.reportConfigs[0].fileName} is out of date.\n` +
        'Run `npm run api:report` and commit the updated etc/*.api.md file(s).\n',
    );
    failed = true;
  } else if (!result.succeeded) {
    failed = true;
  }
}
process.exit(failed ? 1 : 0);

import 'should';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { parserFor } from '../../dist/parsers/_registry.js';
import { MULTI_TABLE_SECTIONS } from '../../dist/parsers/_frames.js';
import { isIdColumn } from '../../dist/core/int64.js';
import { CAPTURE_FAMILIES, STALE_NO_CAPTURE, captureMap, familyEndpoints, valueType } from '../../tools/codegen/regen-capture-schemas.mjs';

// The JS-owned returns schemas of the fox / cbs / yahoo / yahoo_scores families
// (sdv-py's returns tables do not describe these parsers' output, so the parity
// harness cannot) are held to the parsers on the committed real captures: the
// union of the row keys across an endpoint's captures IS the schema's column set,
// every value is of its column's type (an id column of integers a decimal string),
// and an endpoint with no capture publishes no columns (`unverified`).

const root = fileURLToPath(new URL('../..', import.meta.url));
const schemasDir = join(root, 'tools', 'codegen', 'schemas');
const fixtures = join(root, 'test', 'fixtures');
const map = captureMap();

const TYPE_OK = {
  integer: (v) => typeof v === 'number' || typeof v === 'bigint',
  double: (v) => typeof v === 'number' || typeof v === 'bigint',
  numeric: (v) => typeof v === 'number' || typeof v === 'bigint',
  character: (v) => typeof v === 'string',
  logical: (v) => typeof v === 'boolean',
};

describe('capture-derived returns schemas agree with the parsers (fox / cbs / yahoo / yahoo_scores)', () => {
  for (const family of CAPTURE_FAMILIES) {
    for (const ep of familyEndpoints(family)) {
      if (!ep.ref || !ep.parser) continue;
      const doc = parse(readFileSync(join(schemasDir, `${ep.ref}.yaml`), 'utf8')) ?? {};
      const files = map[family]?.[ep.short] ?? [];
      if (!files.length) {
        // written for the pre-port parser output: the docs must say so (the spec-derived
        // parse_yahoo_list schemas and the empty ones are not in the list)
        if (STALE_NO_CAPTURE[family]?.includes(ep.short)) {
          it(`${family}.${ep.short}: no capture -> marked unverified (pre-port columns are not published as a table)`, () => {
            (typeof doc.unverified).should.equal('string', `${ep.ref} is not marked unverified`);
          });
        }
        continue;
      }
      it(`${family}.${ep.short}: the column set and types are the parser's on ${files.join(', ')}`, () => {
        const fn = parserFor(ep.parser);
        const schemaCols = new Map((doc.columns ?? []).map((c) => [c.name, c.type]));
        const seen = new Set();
        for (const f of files) {
          const raw = JSON.parse(readFileSync(join(fixtures, f), 'utf8'));
          const rows = ep.parser in MULTI_TABLE_SECTIONS ? fn(raw, undefined) : fn(raw);
          Array.isArray(rows).should.be.true();
          for (const row of rows) {
            for (const [k, v] of Object.entries(row)) {
              seen.add(k);
              schemaCols.has(k).should.be.true(`${ep.ref}: column ${k} is not in the schema`);
              if (v === null || v === undefined) continue;
              const type = schemaCols.get(k);
              if (isIdColumn(k) && (type === 'integer' || type === 'double')) {
                (typeof v).should.equal('string', `${ep.ref}.${k}: id column holds a ${typeof v}`);
              } else if (type === 'character' && valueType(v) !== 'character') {
                // a column widened to character by a mixed capture still accepts the raw scalar
                ['number', 'bigint', 'boolean', 'string'].should.containEql(typeof v);
              } else {
                TYPE_OK[type](v).should.be.true(`${ep.ref}.${k}: ${JSON.stringify(v)} is not ${type}`);
              }
            }
          }
        }
        [...schemaCols.keys()].filter((c) => !seen.has(c)).should.eql([], `${ep.ref}: schema columns no capture row carries`);
        (doc.unverified === undefined).should.be.true(`${ep.ref} is marked unverified but has captures`);
      });
    }
  }
});

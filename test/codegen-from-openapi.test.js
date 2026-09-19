import should from 'should';
import { parse } from 'yaml';
import { transform, emitYaml } from '../tools/codegen/from-openapi.mjs';

// No-network test for the OpenAPI -> endpoint-YAML generator (#55): a spec whose
// servers[0].url carries a path prefix must keep it on the emitted `host`, the
// same way the hand-written nhl_api family ships `host: https://api.nhle.com/stats/rest`.
// Before the fix the prefix was computed and then dropped, so every generated
// endpoint 404'd at runtime.
const MIN_SPEC = `
openapi: 3.1.0
info: { title: Demo, version: "1" }
servers:
  - url: https://api.example.com/api/public/v1
paths:
  /health:
    get:
      summary: Liveness
      operationId: health
      responses: { "200": { description: OK } }
`;

describe('codegen from-openapi (#55 basePath)', function () {
  it('transform() resolves host and basePath separately', function () {
    const t = transform(parse(MIN_SPEC), 'demo');
    t.host.should.equal('https://api.example.com');
    t.basePath.should.equal('/api/public/v1');
    t.endpoints.length.should.equal(1);
  });

  it('emitYaml() keeps the base path on host so endpoint paths resolve', function () {
    const t = transform(parse(MIN_SPEC), 'demo');
    const yaml = emitYaml('demo', t.host, t.basePath, t.security, t.endpoints);
    yaml.should.match(/^host: https:\/\/api\.example\.com\/api\/public\/v1$/m);
    yaml.should.match(/path: \/health/);
  });

  it('a server URL with no path prefix emits a bare host', function () {
    const spec = parse(MIN_SPEC.replace('https://api.example.com/api/public/v1', 'https://api.example.com'));
    const t = transform(spec, 'demo');
    t.basePath.should.equal('');
    emitYaml('demo', t.host, t.basePath, t.security, t.endpoints).should.match(/^host: https:\/\/api\.example\.com$/m);
  });
});

import should from 'should';
import http from 'node:http';
import { get } from '../../dist/core/client.js';

// Offline: a local server captures the default User-Agent. ESPN's site.api
// returns HTTP 403 for any UA containing a `+http(s)://` URL token, so the
// default must not carry one (regression for the 2026-10-05 live-smoke failure).
describe('core/client: default User-Agent', () => {
  it('has no +http token', async () => {
    let ua;
    const srv = http.createServer((req, res) => {
      ua = req.headers['user-agent'];
      res.setHeader('content-type', 'application/json');
      res.end('{}');
    });
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    try {
      await get(`http://127.0.0.1:${srv.address().port}/`, { family: 'site_v2' });
    } finally {
      srv.close();
    }
    ua.should.match(/sportsdataverse-js/);
    ua.should.not.match(/\+http/);
  });
});

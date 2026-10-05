import should from 'should';
import http from 'node:http';
import sdv from '../../dist/index.js';
import { configure, resetConfig } from '../../dist/core/config.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NoDataError, AssetFetchError } from '../../dist/core/errors.js';

const fixture = (...p) =>
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', ...p), 'utf8');

// Offline: a local server stands in for the host, so we can see exactly what the
// keyless getters send (browser UA; site Referer for MLS / NWSL; no key anywhere)
// and what reaches the wire for NWSL composite ids.
describe('keyless runtime getters (on3, mls_api, nwsl_api)', () => {
  let srv;
  let seen;
  let status = 200;
  let reply = null; // overrides the default body
  let ctype = 'application/json';
  before(async () => {
    srv = http.createServer((req, res) => {
      seen = { url: req.url, headers: req.headers };
      res.statusCode = status;
      res.setHeader('content-type', ctype);
      res.end(reply ?? (status === 200 ? '{"teams":[{"teamId":"nwsl::Football_Team::abc"}]}' : '{}'));
    });
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${srv.address().port}`;
    // Route every family at the local server through a transport that rewrites the host.
    const { axiosTransport } = await import('../../dist/core/transport.js');
    const local = (req) => axiosTransport({ ...req, url: req.url.replace(/^https:\/\/[^/]+/, base) });
    configure({ transport: local, retries: 0 });
  });
  after(() => {
    srv.close();
    resetConfig();
  });

  it('mls: Referer + browser UA, no credentials', async () => {
    status = 200;
    await sdv.mls.mls_api_competitions({});
    seen.headers.referer.should.equal('https://www.mlssoccer.com/');
    seen.headers['user-agent'].should.match(/Chrome/);
    should(seen.headers.authorization).be.undefined();
  });

  it('nwsl: Referer + UA, and "::" is on the wire literally', async () => {
    status = 200;
    const id = 'nwsl::Football_Season::0b6761e4701749f593690c0f338da74c';
    const rows = await sdv.nwsl.nwsl_api_teams({ season_id: id, parsed: true });
    seen.headers.referer.should.equal('https://www.nwslsoccer.com/');
    seen.url.should.containEql(`/seasons/${id}/teams`);
    rows[0].team_id.should.equal('nwsl::Football_Team::abc');
  });

  it('on3: browser UA; a 404 is NoDataError (not an empty frame)', async () => {
    status = 200;
    await sdv.on3.on3_filters_status({});
    seen.headers['user-agent'].should.match(/Chrome/);
    status = 404;
    await sdv.on3.on3_filters_status({}).should.be.rejectedWith(NoDataError);
  });

  it('a 2xx non-JSON body (HTML bot block) is an AssetFetchError, never an empty result', async () => {
    status = 200;
    ctype = 'text/html';
    reply = '<!doctype html><html><body>Access denied</body></html>';
    try {
      await sdv.on3.on3_filters_status({}).should.be.rejectedWith(AssetFetchError);
      await sdv.mls.mls_api_competitions({ parsed: true }).should.be.rejectedWith(AssetFetchError);
      await sdv.nwsl.nwsl_api_competitions({ parsed: true }).should.be.rejectedWith(AssetFetchError);
    } finally {
      ctype = 'application/json';
      reply = null;
    }
  });

  it('a genuinely empty JSON body ([] / {}) is data, not an error', async () => {
    status = 200;
    try {
      reply = '[]';
      (await sdv.on3.on3_filters_status({})).should.eql([]);
      (await sdv.on3.on3_filters_status({ parsed: true })).should.eql([]);
      reply = '{}';
      (await sdv.nwsl.nwsl_api_competitions({})).should.eql({});
      (await sdv.nwsl.nwsl_api_competitions({ parsed: true })).should.eql([]);
    } finally {
      reply = null;
    }
  });

  it('parsed:true returns the default sub-frame; section selects the others; bad section throws', async () => {
    status = 200;
    try {
      reply = fixture('mls_api', 'statsapi_match_single.json');
      const m = { match_id: 'MLS-MAT-0009H8', parsed: true };
      (await sdv.mls.mls_api_match(m)).should.have.length(1); // match_information
      (await sdv.mls.mls_api_match({ ...m, section: 'players' })).length.should.be.above(1);
      (await sdv.mls.mls_api_match({ ...m, section: 'referees' })).length.should.be.above(0);
      await sdv.mls.mls_api_match({ ...m, section: 'nope' }).should.be.rejectedWith(/unknown section 'nope'/);
      reply = fixture('asa', 'players_goals-added.json');
      const g = { league_slug: 'mls', parsed: true };
      const summary = await sdv.asa.asa_players_goals_added(g);
      const actions = await sdv.asa.asa_players_goals_added({ ...g, section: 'actions' });
      Object.keys(summary[0]).should.not.containEql('action_type');
      Object.keys(actions[0]).should.containEql('action_type');
    } finally {
      reply = null;
    }
  });

  it('merges onto the documented namespaces', () => {
    for (const [ns, fn] of [['mls', 'mls_api_club'], ['nwsl', 'nwsl_api_standings'], ['on3', 'on3_player_profile'],
      ['asa', 'asa_games'], ['torvik', 'bart_wbb_ratings']]) {
      (typeof sdv[ns][fn]).should.equal('function', `${ns}.${fn}`);
    }
    (typeof sdv.nba.espn_nba_fpi).should.equal('function');
    (typeof sdv.cfb.espn_cfb_fpi).should.equal('function');
  });
});

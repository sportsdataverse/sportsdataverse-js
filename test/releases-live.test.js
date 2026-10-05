import should from 'should';
import sdv from '../dist/index.js';
import { _warn } from '../dist/core/releases.js';
import { live } from './helpers/live.mjs';

// Gated live check of the release loaders (SDV_LIVE=1): downloads one real,
// small release asset (cfb_ratings 2024, ~18 KB) from GitHub. The 2099 season
// is a known-absent asset, checked in the same call as the known-present 2024
// so an empty result can't pass as "no data".
//
//   SDV_LIVE=1 npm test
live('release loaders (live)', function () {
  this.timeout(120000);

  it('loadCfbRatings: 2024 loads, 2099 (absent) is skipped with a warning', async () => {
    const warnings = [];
    const realEmit = _warn.emit;
    _warn.emit = (m) => warnings.push(m);
    let rows;
    try {
      rows = await sdv.cfb.loadCfbRatings({ seasons: [2024, 2099] });
    } finally {
      _warn.emit = realEmit;
    }
    rows.length.should.be.above(100);
    rows.every((r) => r.season === 2024 && Number.isInteger(r.team_id)).should.be.true();
    should(rows[0].adj_net).be.a.Number();
    warnings.should.eql(['load_cfb_ratings: no data for season(s) 2099 (skipped)']);
  });
});

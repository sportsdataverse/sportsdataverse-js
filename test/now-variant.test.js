import should from 'should';
import { FLAT_WRAPPERS } from '../dist/index.js';
import { resolveFlat } from '../dist/core/flat.js';
import { resolveFlat as resolveFlatPlayground } from '../docs/src/playground/resolve.mjs';

// sdv-py `now_variant`: when the `now_toggle` path param is absent the wrapper
// uses the `/now` path (only its own tokens); otherwise the dated path.
const withNow = FLAT_WRAPPERS.filter((w) => w.nowVariant);
const fill = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (_m, k) => vals[k]);

describe('now_variant routing (nhl_api_web / nhl_edge / nhl_records)', () => {
  it('is declared on every vendored endpoint that has a variant', () => {
    new Set(withNow.map((w) => w.api)).should.containEql('nhl_api_web');
    for (const w of withNow) should(w.nowToggle).be.a.String();
  });

  for (const w of withNow) {
    // Plain values; the toggle is the only thing that varies between routes.
    const base = {};
    for (const p of w.pathParams) base[p.name] = p.name === 'season' ? '20242025' : `v_${p.name}`;
    const { [w.nowToggle]: _t, ...noToggle } = base;

    it(`${w.api}.${w.short}: absent ${w.nowToggle} -> now path`, () => {
      const expected = fill(w.nowVariant, base);
      for (const params of [noToggle, { ...noToggle, [w.nowToggle]: null }, { ...noToggle, [w.nowToggle]: '' }]) {
        resolveFlat(w, params).url.should.equal(`${w.host}${expected}`);
        resolveFlatPlayground(w, params).url.should.equal(`${w.host}${expected}`);
      }
    });

    it(`${w.api}.${w.short}: given ${w.nowToggle} -> dated path`, () => {
      const { url } = resolveFlat(w, base);
      url.should.startWith(w.host);
      url.should.not.match(/\/now(\/|$)/);
      url.should.not.match(/[{}]/);
      resolveFlatPlayground(w, base).url.should.equal(url);
    });
  }

  it('NHL season arg: club_schedule_season', () => {
    const w = FLAT_WRAPPERS.find((x) => x.api === 'nhl_api_web' && x.short === 'club_schedule_season');
    resolveFlat(w, { team: 'BOS' }).url.should.equal('https://api-web.nhle.com/v1/club-schedule-season/BOS/now');
    resolveFlat(w, { team: 'BOS', season: 20242025 }).url.should.equal(
      'https://api-web.nhle.com/v1/club-schedule-season/BOS/20242025'
    );
  });
});

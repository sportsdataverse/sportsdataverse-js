import should from 'should';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { nowToggle } from '../tools/codegen/now-toggle.mjs';
import { FLAT_WRAPPERS } from '../dist/index.js';
import { resolveFlat } from '../dist/core/flat.js';
import { resolveFlat as resolveFlatPlayground } from '../docs/src/playground/resolve.mjs';

// sdv-py `now_variant`: when the `now_toggle` path param is absent the wrapper
// uses the `/now` path (only its own tokens); otherwise the dated path.
const withNow = FLAT_WRAPPERS.filter((w) => w.nowVariant);
const fill = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (_m, k) => vals[k]);

describe('now_variant routing (nhl_api_web / nhl_edge / nhl_records)', () => {
  it('generated defs carry nowVariant for exactly the YAML now_variant entries (12/35/5 today)', () => {
    for (const api of ['nhl_api_web', 'nhl_edge', 'nhl_records']) {
      const doc = parse(readFileSync(new URL(`../tools/codegen/endpoints/${api}.yaml`, import.meta.url), 'utf8'));
      const want = (doc.endpoints ?? []).filter((e) => e.now_variant).map((e) => e.short).sort();
      want.length.should.be.above(0);
      withNow.filter((w) => w.api === api).map((w) => w.short).sort().should.eql(want);
    }
    for (const w of withNow) should(w.nowToggle).be.a.String();
  });

  it('toggle fallback (py generate.py): explicit > first optional no-default > last path param', () => {
    nowToggle({ now_toggle: 'x', path_params: [{ name: 'a' }] }).should.equal('x');
    nowToggle({ path_params: [{ name: 'a' }, { name: 'b', required: false }, { name: 'c', required: false }] }).should.equal('b');
    nowToggle({ path_params: [{ name: 'a', required: false, default: 1 }, { name: 'z' }] }).should.equal('z');
    nowToggle({ path_params: [{ name: 'a', required: false, default: null }, { name: 'z' }] }).should.equal('a');
    should(nowToggle({})).be.undefined();
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
      url.should.equal(`${w.host}${fill(w.path, base)}`);
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

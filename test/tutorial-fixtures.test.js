import 'should';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import sdv, { configure, axiosTransport } from '../dist/index.js';
import { capture, isThree, OUT, spotsFromShots } from '../tools/snapshots/nba-league-shots.mjs';

// The two snapshots behind the sdvplot tutorials (examples/94 and 97), re-derived
// from their raw captures. Provenance: test/fixtures/releases/README.md and
// test/fixtures/espn/README.md.

const fixture = (p) => new URL(`./fixtures/${p}`, import.meta.url);
const live = ['1', 'true', 'yes'].includes(process.env.SDV_LIVE);

describe('tutorial snapshot: 2023-24 NBA league shots per ESPN spot', function () {
  const snap = JSON.parse(readFileSync(OUT, 'utf8'));
  const summary = JSON.parse(readFileSync(fixture('espn/summary_nba.json'), 'utf8'));
  // game 401585607's field-goal attempts, from an independent capture (the ESPN summary)
  const game = summary.plays.filter((p) => p.shootingPlay && p.coordinate?.x > -100 && !/free throw/i.test(p.text));

  it('carries its provenance and adds up to it', () => {
    snap.provenance.source.should.equal('https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_shots/shots_2024.parquet');
    snap.provenance.sha256.should.match(/^[0-9a-f]{64}$/);
    snap.provenance.columns.should.eql(['x', 'y', 'value', 'attempts', 'makes']);
    snap.spots.reduce((n, s) => n + s[3], 0).should.equal(snap.provenance.field_goal_attempts);
    snap.spots.reduce((n, s) => n + s[4], 0).should.equal(snap.provenance.makes);
    for (const [x, y, value, attempts, makes] of snap.spots) {
      Number.isInteger(x).should.be.true();
      Number.isInteger(y).should.be.true();
      [2, 3].should.containEql(value);
      makes.should.be.belowOrEqual(attempts);
    }
  });

  it('labels threes by a rule that matches the scorer on every attempt of game 401585607', () => {
    game.length.should.equal(169);
    for (const p of game) isThree(p.coordinate.x, p.coordinate.y).should.equal(p.pointsAttempted === 3, p.text);
  });

  it('contains every attempt of game 401585607 at its ESPN spot', () => {
    const league = new Map(snap.spots.map(([x, y, v, n]) => [`${x},${y},${v}`, n]));
    const counts = new Map();
    for (const p of game) {
      const k = `${p.coordinate.x},${p.coordinate.y},${p.pointsAttempted}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    for (const [k, n] of counts) (league.get(k) ?? 0).should.be.aboveOrEqual(n, `spot ${k}`);
  });

  (live ? describe : describe.skip)('re-derived from the release asset (SDV_LIVE=1)', function () {
    this.timeout(180_000);
    after(() => configure({ transport: axiosTransport }));
    it('the asset hashes to the recorded sha256 and re-derives to the committed spots', async () => {
      const { rows, sha256 } = await capture(sdv, configure);
      sha256.should.equal(snap.provenance.sha256);
      rows.length.should.equal(snap.provenance.rows);
      spotsFromShots(rows).should.eql(snap.spots);
      rows.filter((r) => r.game_id === '401585607' && !/free throw/i.test(r.type_text)).length.should.equal(169);
    });
  });
});

describe('tutorial fixture: LeBron James 2023-24 ESPN game log', () => {
  const bytes = gunzipSync(readFileSync(fixture('espn/athlete_gamelog_nba_1966_2024.json.gz')));
  const raw = JSON.parse(bytes.toString('utf8'));

  it('is the recorded capture', () => {
    createHash('sha256').update(bytes).digest('hex').should.equal('a71cffd3cb45f6fcaadb6522abe396a10998842018092129d382b47152464695');
  });

  it("re-derives LeBron's official 2023-24 regular season (71 games, 1822 points)", () => {
    const pts = raw.names.indexOf('points');
    pts.should.equal(13);
    const block = raw.seasonTypes.find((s) => s.displayName === '2023-24 Regular Season');
    const logged = block.categories.filter((c) => c.type === 'event').flatMap((c) => c.events);
    logged.length.should.equal(73);
    for (const e of logged) (typeof e.eventId).should.equal('string');
    const notes = logged.map((e) => raw.events[e.eventId].eventNote ?? '');
    const counted = logged.filter((_, i) => !/All-Star Game|In-Season Tournament Championship/.test(notes[i]));
    counted.length.should.equal(71);
    counted.reduce((s, e) => s + Number(e.stats[pts]), 0).should.equal(1822); // 25.7 a game, as NBA.com lists it
  });
});

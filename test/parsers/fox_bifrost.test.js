import { readFileSync } from 'node:fs';
import should from 'should';
import {
  parse_fox_list,
  parse_fox_scoreboard,
  parse_fox_standings,
  parse_fox_event,
  parse_fox_team_roster,
  parse_fox_search,
} from '../../dist/parsers/fox.js';
import { isIdColumn } from '../../dist/core/int64.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';
import sdv, { FLAT_WRAPPERS, configure, resetConfig } from '../../dist/index.js';
import { FLAT_HOSTS } from '../../dist/core/client.js';
import { captureWarnings } from '../helpers/warnings.mjs';

// Unit tests for the Fox Sports Bifrost parsers (a port of sdv-py's
// fox/fox_api_parsers.py + _fox_layout.py row builders). Every parser runs on a
// REAL capture from test/fixtures/fox/ (byte-identical copies of sdv-py's
// tests/fixtures/fox{,_api}/ blobs; see that README for route + capture date)
// and asserts the per-entity rows sdv-py emits on the same bytes (the exact
// cell-by-cell gate is test/parsers/parity.test.js against py/oracle/fox.json.gz;
// this file asserts concrete values read off the capture: row counts, game /
// team / player names, scores, snake_cased keys, id columns as decimal strings).
// Inline synthetic payloads survive only for the malformed / empty edge cases,
// in one describe at the end. Also covers the registry wiring and a
// flat-contract metadata block asserting the family registers correctly on
// api.foxsports.com with no auth and a resolvable parser per endpoint.

const load = (name) => JSON.parse(readFileSync(new URL(`../fixtures/fox/${name}`, import.meta.url), 'utf8'));

/** Every key snake_case; every id column (`isIdColumn`) a decimal string, never a number. */
function assertTidy(rows) {
  rows.length.should.be.above(0);
  for (const r of rows) {
    for (const [k, v] of Object.entries(r)) {
      k.should.match(/^[a-z0-9_]+$/, `non-snake key ${k}`);
      if (isIdColumn(k) && v != null) (typeof v).should.equal('string', `id column ${k} is ${typeof v}: ${v}`);
    }
  }
}

/** Count rows per value of `key`. */
const tally = (rows, key) => rows.reduce((a, r) => ((a[r[key]] = (a[r[key]] ?? 0) + 1), a), {});

const EVENT_COLUMNS = [
  'segment_id', 'section_id', 'section_title', 'game_id', 'chip_id', 'league', 'date', 'event_status', 'status',
  'tv_station', 'headline', 'odds_line', 'over_under_line', 'home_team', 'home_team_id', 'home_score', 'home_record',
  'away_team', 'away_team_id', 'away_score', 'away_record',
];

describe('parsers/fox: parse_fox_scoreboard (real captures)', () => {
  it('nfl/league/scores-segment/2026-3-1: one row per game, 16 games across THU/SUN/MON', () => {
    const rows = parse_fox_scoreboard(load('nfl_league_scores_segment.json'));
    assertTidy(rows);
    rows.length.should.equal(16);
    for (const r of rows) Object.keys(r).should.eql(EVENT_COLUMNS);
    tally(rows, 'section_id').should.eql({ '2026-3-1thu': 1, '2026-3-1sun': 14, '2026-3-1mon': 1 });
    rows[0].should.eql({
      segment_id: null, // sdv-py's parse_fox_api_events stamps no segment id
      section_id: '2026-3-1thu',
      section_title: 'Week 3',
      game_id: '11195',
      chip_id: 'nfl11195',
      league: 'NFL',
      date: '2026-09-25T00:15:00Z',
      event_status: 3,
      status: 'FINAL',
      tv_station: null,
      headline: 'Robinson rumbles for 194 yards, scores 2 TDs as Falcons handle Packers',
      odds_line: 'ATL +4.5',
      over_under_line: 'OVER 43.5',
      home_team: 'Green Bay Packers',
      home_team_id: '22',
      home_score: 14,
      home_record: '1-2',
      away_team: 'Atlanta Falcons',
      away_team_id: '25',
      away_score: 35,
      away_record: '1-2',
    });
    // home / away resolved from the entity link's homeUri / awayUri tokens, not top/bottom
    const kcMia = rows[1];
    kcMia.game_id.should.equal('11196');
    kcMia.home_team.should.equal('Miami Dolphins');
    kcMia.home_team_id.should.equal('3');
    kcMia.home_score.should.equal(10);
    kcMia.away_team.should.equal('Kansas City Chiefs');
    kcMia.away_team_id.should.equal('11');
    kcMia.away_score.should.equal(24);
    kcMia.date.should.equal('2026-09-27T17:00:00Z');
    rows[15].game_id.should.equal('11209');
    rows[15].home_team.should.equal('Chicago Bears');
    rows[15].away_team.should.equal('Philadelphia Eagles');
  });

  it('topevents/scoreboard/segment/1: 12 upcoming games across NFL / MLB / SOCCER / NHL; the favorites section has none', () => {
    const rows = parse_fox_scoreboard(load('topevents_segment.json'));
    assertTidy(rows);
    rows.length.should.equal(12);
    tally(rows, 'section_id').should.eql({ sport_NFL: 1, sport_MLB: 2, sport_SOCCER: 6, sport_NHL: 3 });
    rows.map((r) => r.section_title).should.eql(['NFL', 'MLB', 'MLB', ...Array(6).fill('SOCCER'), 'NHL', 'NHL', 'NHL']);
    rows[0].game_id.should.equal('11224');
    rows[0].chip_id.should.equal('nfl11224');
    rows[0].event_status.should.equal(2); // pregame: no status line, no scores
    should(rows[0].status).be.null();
    should(rows[0].home_score).be.null();
    rows[0].tv_station.should.equal('ESPN');
    rows[0].home_team.should.equal('New Orleans Saints');
    rows[0].home_team_id.should.equal('27');
    rows[0].away_team.should.equal('Atlanta Falcons');
    rows[0].odds_line.should.equal('NO -1.5');
    rows[11].league.should.equal('NHL');
    rows[11].home_team.should.equal('Dallas Stars');
    rows[11].away_team.should.equal('San Jose Sharks');
    rows[11].away_record.should.equal('2-0-0');
  });
});

describe('parsers/fox: parse_fox_standings (real captures)', () => {
  it('nfl/league/standings: 96 team rows (32 per DIVISION / CONFERENCE / PRESEASON section), widened by header', () => {
    const rows = parse_fox_standings(load('nfl_league_standings.json'));
    assertTidy(rows);
    rows.length.should.equal(96);
    tally(rows, 'section').should.eql({ DIVISION: 32, CONFERENCE: 32, PRESEASON: 32 });
    // the first header is the table title (rank column); the blank team header is `v1`
    rows[0].should.eql({
      section: 'DIVISION',
      afc_east: '1',
      v1: 'Bills',
      w_l_t: '3-1',
      pct: '.750',
      pf: '127',
      pa: '107',
      home: '2-1',
      away: '1-0',
      conf: '2-1',
      div: '0-1',
      strk: 'L1',
      entity_id: '1',
    });
    rows[32].section.should.equal('CONFERENCE');
    rows[32].american_football_conference.should.equal('1');
    rows[32].v1.should.equal('Chiefs');
    rows[32].w_l_t.should.equal('4-0');
    rows[32].entity_id.should.equal('11');
    const titles = [...new Set(rows.slice(0, 32).map((r) => Object.keys(r)[1]))];
    titles.should.eql(['afc_east', 'afc_north', 'afc_south', 'afc_west', 'nfc_east', 'nfc_north', 'nfc_south', 'nfc_west']);
  });

  it('cbk/league/polls: 75 ranked-team rows (AP / Coaches / RPI x 25) with team + signed rank_change', () => {
    const rows = parse_fox_standings(load('cbk_league_polls.json'));
    assertTidy(rows);
    rows.length.should.equal(75);
    tally(rows, 'section').should.eql({ 'ASSOCIATED PRESS': 25, 'USA TODAY COACHES POLL': 25, 'RPI RANKINGS': 25 });
    // AP: rank, change (v1), team (v2, with first-place votes), pts
    rows[0].should.eql({
      section: 'ASSOCIATED PRESS',
      ranking: '1',
      v1: '2',
      v2: 'Michigan (57)',
      pts: '1425',
      entity_id: '87',
      team: 'Michigan (57)',
      rank_change: 2,
    });
    rows.slice(0, 5).map((r) => r.rank_change).should.eql([2, 5, -1, -3, 8]); // `up` positive, `down` negative
    rows[1].team.should.equal('UConn');
    rows[1].entity_id.should.equal('54');
    rows.filter((r) => r.rank_change !== null).length.should.equal(41);
    // RPI has no change column: rank_change null, team from the entity cell
    const rpi = rows[50];
    rpi.section.should.equal('RPI RANKINGS');
    rpi.ranking.should.equal('1');
    rpi.v1.should.equal('Michigan');
    rpi.team.should.equal('Michigan');
    rpi.rpi.should.equal('.6808');
    rpi.home.should.equal('14-1');
    rpi.entity_id.should.equal('87');
    should(rpi.rank_change).be.null();
    rows.slice(50).every((r) => r.rank_change === null).should.be.true();
  });
});

describe('parsers/fox: parse_fox_event (real captures; sdv-py parse_fox_api generic flattener)', () => {
  it('nfl/event/11195/matchup: the largest record list is the 9 featured-player news items', () => {
    const raw = load('nfl_event_matchup.json');
    raw.template.should.equal('matchupv2');
    const rows = parse_fox_event(raw);
    assertTidy(rows);
    rows.length.should.equal(9);
    rows.map((r) => r.entity_link_title).should.eql([
      'BIJAN ROBINSON', 'DRAKE LONDON', 'JORDAN LOVE', 'JORDAN LOVE', 'DRAKE LONDON',
      'BIJAN ROBINSON', 'DRAKE LONDON', 'DRAKE LONDON', 'MATTHEW GOLDEN',
    ]);
    rows.map((r) => r.title).should.eql([
      'STAT HIGH', 'STAT HIGH', 'MILESTONE', 'STAT HIGH', 'MILESTONE', 'STAT HIGH', 'MILESTONE', 'STAT HIGH', 'STAT HIGH',
    ]);
    Object.keys(rows[0]).length.should.equal(21); // nested entityLink / entityImage deep-flattened with `_`
    rows[0].entity_link_layout_tokens_id.should.equal('326923');
    rows[0].entity_link_content_uri.should.equal('football/nfl/athletes/326923');
    rows[0].entity_image_type.should.equal('image-headshot');
    rows[0].text.should.equal(
      'Bijan Robinson has set his season high with 194 rushing yards. His previous season high was 83 rushing yards.'
    );
  });

  it('cbk/event/262052/data (pbp-only trim): 158 play rows of the 1ST HALF group', () => {
    const rows = parse_fox_event(load('cbk_event_data_pbp_first_half.json'));
    assertTidy(rows);
    rows.length.should.equal(158);
    rows[0].should.eql({
      id: '1',
      play_description: 'Rueben Chinyelu vs. Malachi Moreno (Boogie Fland gains possession)',
      left_team_score_change: false,
      right_team_score_change: false,
      time_of_play: '20:00',
    });
    rows[1].play_description.should.equal('Rueben Chinyelu makes two point layup (Alex Condon assists)');
    rows[1].left_team_score_change.should.be.true();
    rows[1].left_team_score.should.equal('2');
    rows[1].right_team_score.should.equal('0');
    rows[1].left_team_abbr.should.equal('FLA');
    rows[1].right_team_abbr.should.equal('UK');
    rows[1].entity_link_title.should.equal('FLORIDA GATORS');
    rows[1].entity_link_layout_tokens_id.should.equal('237');
    rows[157].id.should.equal('158');
    rows[157].play_description.should.equal('End of 1st Half.');
    rows[157].time_of_play.should.equal('0:00');
  });
});

describe('parsers/fox: parse_fox_team_roster (real capture)', () => {
  it('nfl/team/25/roster: one row per athlete (80 Falcons), the PLAYER COUNT summary row dropped', () => {
    const raw = load('nfl_team_roster.json');
    raw.title.should.equal('2026 Atlanta Falcons Roster');
    const rows = parse_fox_team_roster(raw);
    assertTidy(rows);
    rows.length.should.equal(80);
    tally(rows, 'position_group').should.eql({ OFFENSE: 38, DEFENSE: 39, 'SPECIAL TEAMS': 3 });
    for (const r of rows) Object.keys(r).should.eql(['position_group', 'player', 'pos', 'age', 'ht', 'wt', 'college', 'athlete_id']);
    rows[0].should.eql({
      position_group: 'OFFENSE',
      player: 'Vinny Anthony II',
      pos: 'WR',
      age: '23',
      ht: `6'0"`,
      wt: '190 lbs',
      college: 'Wisconsin',
      athlete_id: '329734',
    });
    rows[1].player.should.equal('Matthew Bergeron');
    rows[1].athlete_id.should.equal('326956');
    rows[79].should.eql({
      position_group: 'SPECIAL TEAMS',
      player: 'Liam McCullough',
      pos: 'LS',
      age: '29',
      ht: `6'2"`,
      wt: '245 lbs',
      college: 'Ohio State',
      athlete_id: '22081',
    });
  });
});

describe('parsers/fox: parse_fox_search (real captures)', () => {
  it('search/content?text=mahomes: one row per hit, 60 across six result buckets', () => {
    const rows = parse_fox_search(load('search_content.json'));
    assertTidy(rows);
    rows.length.should.equal(60);
    tally(rows, 'group').should.eql({ PLAYERS: 13, 'LEAGUES & CONFERENCES': 1, TEAMS: 15, TOPICS: 1, VIDEOS: 11, STORIES: 19 });
    rows[0].should.eql({
      group: 'PLAYERS',
      type: 'entity',
      entity_id: '13107',
      title: 'Patrick Mahomes',
      subtitle: 'KANSAS CITY CHIEFS',
      content_type: 'athlete',
      content_uri: 'football/nfl/athletes/13107',
      web_url: '/nfl/patrick-mahomes-ii-player',
      analytics_name: 'patrick-mahomes',
      image_url: 'https://b.fssta.com/uploads/application/nfl/headshots/13107.vresize.140.170.medium.3.png',
    });
    const chiefs = rows.find((r) => r.group === 'TEAMS');
    chiefs.title.should.equal('Kansas City Chiefs');
    chiefs.entity_id.should.equal('11');
    chiefs.content_type.should.equal('team');
    // a content hit has no entity uri: entity_id / content_uri null, web_url still set
    const video = rows.find((r) => r.group === 'VIDEOS');
    video.type.should.equal('content');
    should(video.entity_id).be.null();
    video.content_type.should.equal('external_media_cloud');
    video.web_url.should.equal('/watch/fmc-4ipt0u2wi742m8gy');
  });

  it('search/entities?text=chiefs: 30 entity hits in one untitled bucket (group null)', () => {
    const rows = parse_fox_search(load('search_entities.json'));
    assertTidy(rows);
    rows.length.should.equal(30);
    rows.every((r) => r.group === null && r.type === 'entity').should.be.true();
    [...new Set(rows.map((r) => r.content_type))].should.eql(['team', 'league', 'athlete']);
    rows[0].title.should.equal('Kansas City Chiefs');
    rows[0].entity_id.should.equal('11');
    rows[0].content_uri.should.equal('football/nfl/teams/11');
    rows[0].analytics_name.should.equal('kansas-city-chiefs');
    rows[1].title.should.equal('Kaizer Chiefs');
    rows[1].entity_id.should.equal('2486');
    rows[1].subtitle.should.equal('SOCCER');
  });

  it('search/popular: the same results[].components[] shape (py parse_fox_api_search), one row per hit, wired on the wrapper', () => {
    const rows = parse_fox_search(load('search_popular.json'));
    assertTidy(rows);
    rows.length.should.equal(6);
    rows.every((r) => r.group === null && r.type === 'entity').should.be.true();
    rows[0].title.should.equal('National Football League');
    rows[0].entity_id.should.equal('1');
    rows[0].content_uri.should.equal('football/nfl/league/1');
    FLAT_WRAPPERS.find((w) => w.api === 'fox' && w.short === 'search_popular').parser.should.equal('parse_fox_search');
  });
});

describe('parsers/fox: parse_fox_list (header / nav / trending builders, real captures)', () => {
  it('nfl/league/header: an entity-header shell -> one descriptive row with the joined details line', () => {
    const raw = load('nfl_league_header.json');
    raw.title.should.equal('NATIONAL FOOTBALL LEAGUE');
    const rows = parse_fox_list(raw);
    assertTidy(rows);
    rows.should.eql([
      {
        template: 'entity-header',
        title: 'NATIONAL FOOTBALL LEAGUE',
        entity_id: '1',
        content_uri: 'football/nfl/league/1',
        content_type: 'league',
        color: '1, 8, 31, 87',
        logo_url: 'https://b.fssta.com/uploads/application/leagues/logos/NFL.vresize.200.200.medium.0.png',
        image_alt_text: 'National Football League',
        rank: null,
        details: 'WEEK 4: OCT 1 - OCT 5 ',
      },
    ]);
  });

  it('cbk/league/conferences: groups[].items -> one row per conference (33), fox_id from the group uri', () => {
    const rows = parse_fox_list(load('cbk_league_conferences.json'));
    assertTidy(rows);
    rows.length.should.equal(33);
    rows[0].should.eql({
      group: null, // the conferences group carries no header title
      fox_id: '11',
      abbreviation: 'Atlantic Coast',
      name: 'ATLANTIC COAST BASKETBALL',
      content_uri: 'basketball/cbk/groups/11',
      content_type: 'league',
      web_url: '/college-basketball/acc',
      color: '1, 0, 61, 166',
      logo_url: 'https://b.fssta.com/uploads/application/college/conference-logos/AtlanticCoast.vresize.80.80.medium.0.png',
    });
    rows[32].abbreviation.should.equal('Western Athletic');
    rows[32].fox_id.should.equal('40');
    rows[32].web_url.should.equal('/college-basketball/western-athletic');
  });

  it('general/trending/videos: feed envelope -> one row per CMS item (5, sliced by sdv-py from 12)', () => {
    const rows = parse_fox_list(load('trending_videos.json'));
    assertTidy(rows);
    rows.length.should.equal(5);
    rows[0].should.eql({
      id: 'efb292c5-25c7-5a5c-b070-56535e13542a',
      spark_id: 'efb292c5-25c7-5a5c-b070-56535e13542a',
      title: 'Jackson Chourio hits walk-off two-run single, helping Brewers defeat Padres, 4-3',
      description:
        'Jackson Chourio hit a walk-off two-run single to help the Milwaukee Brewers defeat the San Diego Padres 4-3 in Game 2. ',
      content_type: 'external_media_cloud',
      component_type: 'video',
      publication_date: '2026-10-04T23:29:48Z',
      last_published_date: '2026-10-04T23:29:48+00:00',
      canonical_url: 'foxsports.com/watch/fmc-aq9a9t0fhor66y10',
      thumbnail_url: 'https://static-media.fox.com/fmc/prod/sports/4696f425-9d37-4e04-96d7-bfc12f959054/o6hvdfi5gznuflz5.jpg',
      playback_url: 'https://d3ayhwgrwyc4j8.cloudfront.net/mcvod/fmc-aq9a9t0fhor66y10_VX-17072173--647846/hls/v1_2/index.m3u8',
    });
    rows.every((r) => r.component_type === 'video' && r.playback_url.endsWith('.m3u8')).should.be.true();
    rows[4].title.should.equal("Packers' run game and defense step up to defeat Bucs and set up BIG Week 5 showdown vs Bears");
  });
});

describe('parsers/fox: malformed / empty payloads (synthetic edge cases)', () => {
  it('parse_fox_list', () => {
    parse_fox_list({}).should.eql([]);
    parse_fox_list(null).should.eql([]);
    parse_fox_list('nope').should.eql([]);
  });

  it('parse_fox_scoreboard', () => {
    parse_fox_scoreboard({ selectionGroupList: [] }).should.eql([]);
    parse_fox_scoreboard(null).should.eql([]);
  });

  it('parse_fox_standings', () => {
    parse_fox_standings({ standingsSections: [] }).should.eql([]);
    parse_fox_standings(null).should.eql([]);
  });

  it('parse_fox_event', () => {
    parse_fox_event({}).should.eql([]);
    parse_fox_event(null).should.eql([]);
  });

  it('parse_fox_team_roster', () => {
    parse_fox_team_roster({ groups: [] }).should.eql([]);
    parse_fox_team_roster(null).should.eql([]);
  });

  it('parse_fox_search', () => {
    parse_fox_search({ results: [] }).should.eql([]);
    parse_fox_search(null).should.eql([]);
  });
});

describe('parsers/fox: registry wiring', () => {
  it('registers all six fox parsers by name', () => {
    for (const name of [
      'parse_fox_list',
      'parse_fox_scoreboard',
      'parse_fox_standings',
      'parse_fox_event',
      'parse_fox_team_roster',
      'parse_fox_search',
    ]) {
      (typeof PARSERS[name]).should.equal('function', `missing ${name}`);
      should(parserFor(name)).equal(PARSERS[name]);
    }
  });
});

describe('fox flat-API family metadata (flat-contract style)', () => {
  const family = () => FLAT_WRAPPERS.filter((w) => w.api === 'fox');

  it('registers the fox family (38 endpoints) on https://api.foxsports.com', () => {
    const rows = family();
    rows.length.should.equal(38);
    FLAT_HOSTS.fox.should.equal('https://api.foxsports.com');
    for (const w of rows) w.host.should.equal('https://api.foxsports.com');
  });

  it('every fox wrapper names a registered parser, none auth', () => {
    for (const w of family()) {
      (typeof w.parser).should.equal('string', `parser missing on ${w.short}`);
      w.parser.should.startWith('parse_fox_');
      (typeof parserFor(w.parser)).should.equal('function', `parser ${w.parser} not registered`);
      should(w.auth).not.be.true(`unexpected auth flag on fox_${w.short}`);
    }
  });

  it('every wrapper carries the public apikey query param with a default', () => {
    for (const w of family()) {
      const apikey = w.queryParams.find((q) => q.queryKey === 'apikey');
      should.exist(apikey, `apikey missing on ${w.short}`);
      // default present so calls work out of the box (no account/token needed)
      should.exist(apikey.default, `apikey default missing on ${w.short}`);
    }
  });

  it('carries the api-version query param (defaulted) on every endpoint the spec declares it', () => {
    // foxpolls is the lone spec endpoint with no api-version param, and scorechip
    // 400s when it is sent (sdv-py fox_api probe 2026-10-05); all others pin it
    // (default 1.1) so the bifrost data tier resolves out of the box.
    for (const w of family().filter((w) => !['foxpolls', 'scorechip'].includes(w.short))) {
      const apiVersion = w.queryParams.find((q) => q.queryKey === 'api-version');
      should.exist(apiVersion, `api-version missing on ${w.short}`);
      apiVersion.default.should.equal('1.1', `api-version default wrong on ${w.short}`);
    }
  });

  it('scorechip sends no api-version (the route 400s with it)', () => {
    family().find((w) => w.short === 'scorechip').queryParams.map((q) => q.queryKey).should.eql(['apikey']);
  });

  it('is vendored from sdv-py fox_api: py names, pre-v4 fox_* names as aliases, 5 dead routes deprecated', () => {
    const rows = family();
    rows.filter((w) => !w.deprecated).every((w) => w.publicName === `fox_api_${w.short}`).should.be.true();
    const dead = rows.filter((w) => w.deprecated);
    dead.map((w) => w.short).sort().should.eql(['explore_favorite', 'fs_feed', 'fs_images', 'fs_layouts', 'fs_videos']);
    for (const w of dead) {
      should(w.publicName).be.undefined(); // keeps its pre-v4 fox_<short> name, no new name invented
      w.deprecated.should.match(/fox_api.yaml/); // points at sdv-py's probe record
    }
  });

  it('a dead route warns once with code SDV_DEPRECATED_ENDPOINT, then still calls through', async () => {
    const calls = [];
    configure({
      transport: {
        fox: async (req) => {
          calls.push(req.url);
          return { status: 200, headers: {}, url: req.url, data: { ok: true } };
        },
      },
    });
    let seen;
    try {
      seen = await captureWarnings(async () => {
        (await sdv.fox.fox_fs_videos()).should.eql({ ok: true });
        await sdv.fox.foxFsVideos(); // same wrapper: warns once per process
      });
    } finally {
      resetConfig();
    }
    seen.length.should.equal(1, seen.map((w) => w.message).join(' | ')); // nothing else warned
    seen = seen.filter((w) => /fox_fs_videos/.test(w.message));
    calls.should.eql(['https://api.foxsports.com/fs/videos', 'https://api.foxsports.com/fs/videos']);
    seen.length.should.equal(1);
    seen[0].name.should.equal('DeprecationWarning');
    seen[0].code.should.equal('SDV_DEPRECATED_ENDPOINT');
    seen[0].message.should.match(/fox_api.yaml/);
  });

  it('uses the generic list parser as the default for most endpoints', () => {
    const rows = family();
    const generic = rows.filter((w) => w.parser === 'parse_fox_list').length;
    generic.should.be.above(rows.length / 2);
  });
});

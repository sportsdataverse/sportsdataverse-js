// 05 — College football: AP poll + one game's drives and scoring plays.
//
// Shows: the ESPN CDN family (cdn.espn.com/core, the pages espn.com itself
// renders): `cdn_rankings` gives one row per poll entry across every poll, and
// `cdn_playbyplay` is a sectioned dispatcher like `summary` — football ships
// drives[] + scoringPlays[] instead of flat plays[], so ask for `drives`,
// `drive_plays` (plays unrolled with drive_id / drive_sequence) or `scoring_plays`.
//
// Sources: ESPN CDN — cdn.espn.com/core/college-football/rankings?xhr=1&week=5
//                     cdn.espn.com/core/college-football/playbyplay?xhr=1&gameId=401628551
// Offline fixtures: test/fixtures/espn/cdn/rankings_cfb.json.gz, playbyplay_cfb.json.gz
// (sdv-py captures, 2024 week 5 / Wisconsin at Oregon 2024-11-16).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable } from './_util.mjs';

setup();

const polls = await sdv.cfb.espnCfbCdnRankings({ week: 5, parsed: true });
console.log(`${polls.length} poll entries across polls: ${[...new Set(polls.map((p) => p.poll_name))].join(' | ')}`);
printTable(
  polls.filter((p) => p.poll_name === 'AP Top 25'),
  ['rank', 'team_abbreviation', 'team_display_name', 'formatted_record', 'points', 'first_place_votes', 'trend'],
  10,
  'AP Top 25'
);

const GAME_ID = 401628551;
const drives = await sdv.cfb.espnCfbCdnPlaybyplay({ game_id: GAME_ID, parsed: true, section: 'drives' });
const scoring = await sdv.cfb.espnCfbCdnPlaybyplay({ game_id: GAME_ID, parsed: true, section: 'scoring_plays' });
const plays = await sdv.cfb.espnCfbCdnPlaybyplay({ game_id: GAME_ID, parsed: true, section: 'drive_plays' });
console.log(`${drives.length} drives, ${plays.length} plays, ${scoring.length} scoring plays`);

printTable(
  drives.map((d) => ({
    seq: d.id.slice(-2),
    offense: d.team_abbreviation,
    start: d.start_text,
    plays: d.offensive_plays,
    yards: d.yards,
    time: d.time_elapsed_display_value,
    result: d.display_result,
  })),
  ['seq', 'offense', 'start', 'plays', 'yards', 'time', 'result'],
  8,
  'Drives'
);

printTable(
  scoring.map((s) => ({ q: s.period_number, clock: s.clock_display_value, team: s.team_abbreviation, type: s.scoring_type_abbreviation, score: `${s.away_score}-${s.home_score}`, text: s.text.trim() })),
  ['q', 'clock', 'team', 'type', 'score', 'text'],
  8,
  'Scoring plays'
);

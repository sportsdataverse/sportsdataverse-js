# Live captures 2026-10-05 (HockeyTech analytics, fix round 2)

Raw response bodies exactly as served (HTTP 200), fetched sequentially (1.5 s apart) from
`lscluster.hockeytech.com/feed/index.php` with each league's public key via
`buildHockeytechUrl`. Not trimmed (all < 50 KB).

| file | league / game | feed | what it shows |
|---|---|---|---|
| mjhl_pbp_7301.txt | MJHL 7301 | statviewfeed/gameCenterPlayByPlay | JSONP list; goals/penalties/goalie changes only (no shots, no coordinates) |
| mjhl_shifts_7301.txt | MJHL 7301 | modulekit/gameshifts | valid envelope, `Gameshifts: {home: [], visitor: []}` |
| mjhl_summary_7301.txt | MJHL 7301 | gc/gamesummary | PLAIN TEXT `Feed type access denied.` (no gamecenter access) |
| ushl_pbp_13506.txt | USHL 13506 | gameCenterPlayByPlay | goals/penalties/goalie changes only (29 events) |
| ushl_shifts_13506.txt | USHL 13506 | gameshifts | valid envelope, empty |
| ushl_summary_13506.txt | USHL 13506 | gc/gamesummary | full `GC.Gamesummary` |
| ohl_shifts_29044.txt | OHL 29044 | gameshifts | valid envelope, empty (shift chart absent for juniors) |

Positive control in the same run (not committed, 225 KB): PWHL 349 returned pbp 95,723 B,
shifts 99,386 B (populated), summary 31,338 B. Offline positive control: PWHL game 42 fixtures.
sdv-py oracle for these: `oracle.json` cases `live_*` (tools/oracle/hockeytech_analytics_oracle.py).

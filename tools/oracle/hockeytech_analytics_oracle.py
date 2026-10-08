"""Generate the sdv-py oracle for the sdv-js HockeyTech analytics port (Task 22a).

Run ONCE from a throwaway sdv-py worktree checked out at HOCKEYTECH_PIN (tools/sdv_py_pin.py;
the shared guard refuses any other checkout, a dirty one, or another installed copy):

    git -C <sdv-py> worktree add --detach <scratch>/pyoracle <HOCKEYTECH_PIN>
    cd <scratch>/pyoracle && uv sync --frozen --extra tests
    uv run python <sdv-js>/tools/oracle/hockeytech_analytics_oracle.py

It reads the committed REAL HockeyTech captures from
``<sdv-js>/test/fixtures/hockeytech/analytics/`` (copied byte-for-byte from sdv-py
``tests/fixtures/hockeytech/`` at the pin), runs the real sdv-py code (with the HTTP
client patched to serve those captures) and writes
``<sdv-js>/test/fixtures/hockeytech/analytics/oracle.json``.

Provenance: sdv-py at HOCKEYTECH_PIN, polars as locked there.
The ``synthetic_*`` cases are small hand-built frames that exercise edge cases the two
captured games do not contain (goal-instant epsilon clamp, pulled goalie, line-change
boundary, overlapping penalties); they are labelled as such and run through the same
py functions.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import polars as pl

import sportsdataverse.hockeytech._family as F
from sportsdataverse.hockeytech import _analytics as A
from sportsdataverse.hockeytech import _parsers as P

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from sdv_py_pin import HOCKEYTECH_PIN, pinned_checkout  # noqa: E402

PIN, _ = pinned_checkout(HOCKEYTECH_PIN)
FIX = ROOT / "test" / "fixtures" / "hockeytech" / "analytics"


def load(stem):
    return json.loads((FIX / f"{stem}.json").read_text(encoding="utf-8"))


def clean(v):
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return {"__float__": str(v)}
    return v


def frame(df):
    return {
        "columns": df.columns,
        "dtypes": [str(t) for t in df.dtypes],
        "rows": [{k: clean(v) for k, v in r.items()} for r in df.to_dicts()],
    }


shifts42 = load("pwhl_gameshifts_42")
pbp42 = load("pwhl_pbp_42")
meta42 = load("pwhl_game_summary_42")
ohl_pbp = load("ohl_pbp_27225")

out = {
    "provenance": {
        "sdv_py_pin": PIN,
        "generator": "tools/oracle/hockeytech_analytics_oracle.py",
        "fixtures": "test/fixtures/hockeytech/analytics/*.json (sdv-py tests/fixtures/hockeytech at the pin)",
    },
    "cases": {},
}
C = out["cases"]

# --- parsers ---------------------------------------------------------------
shifts = P.parse_shifts(shifts42, game_id=42)
pbp_a = P.parse_pbp(pbp42, pbp_style="hockeytech_a", game_id=42)
pbp_b = P.parse_pbp(ohl_pbp, pbp_style="hockeytech_b", game_id=27225)
C["pwhl_shifts"] = frame(shifts)
C["pwhl_pbp_parsed"] = frame(pbp_a)
C["ohl_pbp_parsed"] = frame(pbp_b)

# --- enrich ----------------------------------------------------------------
enriched = A.enrich_pbp(pbp_a, "pwhl", 42, meta_payload=meta42, shifts_payload=shifts42)
C["pwhl_pbp_enriched"] = frame(enriched)
ohl_enriched = A.enrich_pbp(pbp_b, "ohl", 27225, meta_payload={}, shifts_payload={})
C["ohl_pbp_enriched_no_meta_no_shifts"] = frame(ohl_enriched)

# --- analytics on the real enriched game ----------------------------------
C["pwhl_player_toi"] = frame(A.player_toi(shifts))
# corsi_fenwick builds its team rows from an unordered `unique()` (a random order per run):
# sort them so the oracle is byte-stable (the JS test compares these frames sorted by team).
C["pwhl_corsi_fenwick_team"] = frame(A.corsi_fenwick(enriched).sort("team_id"))
C["pwhl_corsi_fenwick_on_ice"] = frame(A.corsi_fenwick_on_ice(enriched))
goalies = sorted({str(g) for g in enriched["goalie_id"].drop_nulls().to_list()})
C["pwhl_strength_state"] = {
    "goalie_ids": goalies,
    "out": frame(A.add_strength_state(enriched, goalie_ids=goalies)),
}
C["pwhl_strength_state_no_goalies"] = frame(A.add_strength_state(enriched))

# --- public per-league functions, HTTP patched to serve the captures -------
SERVE = {
    ("modulekit", "gameshifts"): shifts42,
    ("statviewfeed", "gameCenterPlayByPlay"): pbp42,
    ("gc", "gamesummary"): meta42,
}


def fake_api(league, feed, view, params=None, **kw):
    if league == "ohl":
        return {("statviewfeed", "gameCenterPlayByPlay"): ohl_pbp}.get((feed, view), {})
    return SERVE[(feed, view)]


F.hockeytech_api = fake_api
fam = F.build_family("pwhl")
C["pwhl_family_game_shifts"] = frame(fam["pwhl_game_shifts"](42))
C["pwhl_family_player_toi"] = frame(fam["pwhl_player_toi"](42))
C["pwhl_family_game_corsi"] = frame(fam["pwhl_game_corsi"](42))
C["pwhl_family_pbp"] = frame(fam["pwhl_pbp"](42))
ofam = F.build_family("ohl")
C["ohl_family_game_shifts_empty"] = frame(ofam["ohl_game_shifts"](27225))
C["ohl_family_player_toi_empty"] = frame(ofam["ohl_player_toi"](27225))
try:
    C["ohl_family_game_corsi_no_shifts"] = frame(ofam["ohl_game_corsi"](27225))
except Exception as e:  # recorded so the JS port can mirror it
    C["ohl_family_game_corsi_no_shifts"] = {"error": f"{type(e).__name__}: {e}"}

# --- live captures 2026-10-05 (fix round 2): MJHL (summary access denied), USHL (partial pbp) ---
LIVE = FIX / "live-2026-10-05"


def live_payload(name):
    text = (LIVE / f"{name}.txt").read_text(encoding="utf-8")
    try:
        return json.loads(F_client_strip(text))
    except Exception:  # plain-text "Feed type access denied." -> hockeytech_api returns None
        return None


from sportsdataverse.hockeytech._client import _strip_jsonp as F_client_strip  # noqa: E402

LIVE_GAMES = {
    "mjhl": 7301,
    "ushl": 13506,
}
for lg, gid in LIVE_GAMES.items():
    served = {
        ("statviewfeed", "gameCenterPlayByPlay"): live_payload(f"{lg}_pbp_{gid}"),
        ("modulekit", "gameshifts"): live_payload(f"{lg}_shifts_{gid}"),
        ("gc", "gamesummary"): live_payload(f"{lg}_summary_{gid}"),
    }
    F.hockeytech_api = lambda league, feed, view, params=None, _s=served, **kw: _s[(feed, view)]
    fam_lg = F.build_family(lg)
    C[f"live_{lg}_pbp"] = frame(fam_lg[f"{lg}_pbp"](gid))
    C[f"live_{lg}_game_shifts"] = frame(fam_lg[f"{lg}_game_shifts"](gid))
    C[f"live_{lg}_player_toi"] = frame(fam_lg[f"{lg}_player_toi"](gid))
    C[f"live_{lg}_game_corsi"] = frame(fam_lg[f"{lg}_game_corsi"](gid))

# --- synthetic edge cases ---------------------------------------------------
SH_SCHEMA = {
    "player_id": pl.Int64,
    "home": pl.Int64,
    "period": pl.Int64,
    "start_s": pl.Int64,
    "end_s": pl.Int64,
}
sh_rows = [
    # period 1: home line A 1200->1190 (leaves exactly when line B arrives), B 1190->1150
    dict(player_id=11, home=1, period=1, start_s=1200, end_s=1190),
    dict(player_id=12, home=1, period=1, start_s=1200, end_s=1190),
    dict(player_id=21, home=1, period=1, start_s=1190, end_s=1150),
    dict(player_id=22, home=1, period=1, start_s=1190, end_s=1150),
    dict(
        player_id=9, home=1, period=1, start_s=1200, end_s=900
    ),  # goalie, 10 > 9 string-sort probe
    dict(player_id=101, home=0, period=1, start_s=1200, end_s=1100),
    dict(player_id=102, home=0, period=1, start_s=1200, end_s=1100),
    dict(player_id=100, home=0, period=1, start_s=1200, end_s=900),  # away goalie
    # period 3 (OT-style short period): only start_s up to 300
    dict(player_id=11, home=1, period=3, start_s=300, end_s=200),
    dict(player_id=101, home=0, period=3, start_s=300, end_s=200),
]
PB_SCHEMA = {"event": pl.Utf8, "period_of_game": pl.Int64, "time_s": pl.Int64}
pb_rows = [
    dict(
        event="shot", period_of_game=1, time_s=1190
    ),  # line-change instant -> incoming line only
    dict(event="shot", period_of_game=1, time_s=1195),  # outgoing line
    dict(
        event="goal", period_of_game=1, time_s=1199
    ),  # goal clamp to period start (1200)
    dict(event="goal", period_of_game=1, time_s=1160),  # goal eps looks 2s earlier
    dict(event="blocked_shot", period_of_game=1, time_s=950),
    dict(event="faceoff", period_of_game=2, time_s=600),  # period with no shifts
    dict(event="goal", period_of_game=3, time_s=299),  # clamp to 300
    dict(event="goal", period_of_game=1, time_s=None),  # null time goal
    dict(event=None, period_of_game=1, time_s=1100),
]
sh = pl.DataFrame(sh_rows, schema=SH_SCHEMA)
pb = pl.DataFrame(pb_rows, schema=PB_SCHEMA)
C["synthetic_build_on_ice"] = {
    "shifts": sh_rows,
    "pbp": pb_rows,
    "default_eps": frame(A.build_on_ice(pb, sh)),
    "eps0": frame(A.build_on_ice(pb, sh, goal_epsilon_s=0)),
    "eps5": frame(A.build_on_ice(pb, sh, goal_epsilon_s=5)),
    "no_shifts": frame(A.build_on_ice(pb, sh.head(0))),
}

oi = pl.DataFrame(
    {
        "on_ice_home": [
            "1,2,3,4,5,9",
            "1,2,3,4,5,6",
            "1,2,3,4,5",
            None,
            "1,2,9",
            "1,2,3,4,5,6,9",
        ],
        "on_ice_away": [
            "6,7,8,10,11,100",
            "6,7,8,10,100",
            "6,7,8,10",
            "6,7",
            "6,7,100",
            "6,7,8,10,100",
        ],
    }
)
C["synthetic_strength_state"] = {
    "rows": oi.to_dicts(),
    "goalie_ids": ["9", "100", 777],
    "with_goalies": frame(A.add_strength_state(oi, goalie_ids=["9", "100", 777])),
    "no_goalies": frame(A.add_strength_state(oi)),
    "empty_goalie_list": frame(A.add_strength_state(oi, goalie_ids=[])),
}

clock_in = pl.DataFrame(
    {
        "time_of_period": [
            "0:00",
            "0:01",
            "5:07",
            "19:59",
            "20:00",
            None,
            "5:xx",
            "10:00",
            "0:30",
        ],
        "period_of_game": ["1", "2", "3", "4", "5", "1", "2", "6", None],
    }
)
C["synthetic_clock"] = {
    "rows": clock_in.to_dicts(),
    "out": frame(A.add_clock_columns(clock_in)),
}

coord_in = pl.DataFrame(
    {
        "x_coord": [300.0, 0.0, 850.0, None, 425.5, 100.0],
        "y_coord": [150.0, 0.0, 400.0, 20.0, None, 75.0],
        "team_id": ["1", "2", "1", None, "2", "1"],
        "home_team_id": ["1", "1", "1", "1", "1", None],
    }
)
C["synthetic_coords"] = {
    "rows": coord_in.to_dicts(),
    "out": frame(A.add_coord_transforms(coord_in)),
}

geo_in = pl.DataFrame(
    {
        "event": ["shot", "goal", "blocked_shot", "faceoff", None, "shot"],
        "x_coord": [80.0, -85.0, 60.0, 89.0, 70.0, None],
        "y_coord": [5.0, -10.0, 20.0, 0.0, 3.0, 4.0],
    }
)
C["synthetic_shot_geometry"] = {
    "rows": geo_in.to_dicts(),
    "out": frame(A.scoring_chances(A.add_shot_distance_angle(geo_in))),
    "out_goalx80": frame(
        A.scoring_chances(
            A.add_shot_distance_angle(geo_in, goal_x=80.0), threshold_ft=15.0
        )
    ),
}

pp_in = pl.DataFrame(
    {
        "event": [
            "penalty",
            "faceoff",
            "shot",
            "goal",
            "shot",
            "penalty",
            "faceoff",
            "shot",
            "shot",
        ],
        "sec_from_start": [100, 105, 110, 130, 140, 400, 410, 700, None],
        "power_play": ["1", "0", "0", "1", "0", "1", "0", "0", "0"],
        "short_handed": [None, "0", "0", None, "0", None, "0", "0", "0"],
        "penalty_length": ["2", None, None, None, None, "2", None, None, None],
        "team_id": ["1", "2", "1", "2", "1", "2", "1", "2", "1"],
        "home_team_id": ["1"] * 9,
        "away_team_id": ["2"] * 9,
    }
)
C["synthetic_backfill_power_play"] = {
    "rows": pp_in.to_dicts(),
    "out": frame(A.backfill_power_play(pp_in)),
}

cf_in = pl.DataFrame(
    {
        "event": ["shot", "blocked_shot", "goal", "shot", "faceoff", "shot", "goal"],
        "team_id": ["1", "2", "1", None, "1", "2", "2"],
        "home_team_id": ["1"] * 7,
        "on_ice_home": ["1,2,3", "1,2,3", "1,2,4", "1,2,3", "1,2,3", None, "1,2,3"],
        "on_ice_away": ["7,8,9", "7,8,9", "7,8,9", "7,8,9", "7,8,9", "7,8,9", "7,8,10"],
    }
)
C["synthetic_corsi"] = {
    "rows": cf_in.to_dicts(),
    "team": frame(A.corsi_fenwick(cf_in).sort("team_id")),  # unordered in py, as above
    "on_ice": frame(A.corsi_fenwick_on_ice(cf_in)),
}

toi_in = pl.DataFrame(
    {
        "player_id": [1, 1, 2, 3, 3],
        "first_name": ["A", "A", "B", "C", "C"],
        "last_name": ["x", "x", "y", "z", "z"],
        "start_s": [1200, 900, 1200, 600, 300],
        "end_s": [1100, 800, 1190, 600, None],
    }
)
C["synthetic_toi"] = {"rows": toi_in.to_dicts(), "out": frame(A.player_toi(toi_in))}

out["provenance"]["py_head"] = PIN  # the guard checked HEAD == PIN

dest = FIX / "oracle.json"
dest.write_text(
    json.dumps(out, indent=None, separators=(",", ":")), encoding="utf-8", newline="\n"
)
print("wrote", dest, dest.stat().st_size, "bytes;", len(C), "cases")

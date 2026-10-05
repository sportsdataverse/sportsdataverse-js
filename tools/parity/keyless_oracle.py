"""Regenerate the six sdv-py oracles test/parsers/keyless.test.js compares the keyless
parsers to: test/fixtures/{on3,asa,mls_api,nwsl_api}/py_oracle.json,
test/fixtures/espn/py_oracle_fpi.json and test/fixtures/torvik/py_oracle_bart_wbb.json.

Each is sdv-py's OWN parser output on the committed real capture next to it, keyed
``<py parser>:<capture stem>``; a multi-table parser's value is ``{section: frame}``.
A frame is ``{"columns", "schema" (polars dtypes), "rows" (every row)}``. Run it from
sdv-py checked out at PORT_PIN (tools/sdv_py_pin.py; the shared guard refuses any other
checkout, a dirty one, or another installed copy):

    git -C <sdv-py> worktree add --detach <scratch> <PORT_PIN>
    cd <scratch> && uv sync --extra tests
    uv run python <sdv-js>/tools/parity/keyless_oracle.py
"""

from __future__ import annotations

import importlib
import json
import sys
from pathlib import Path

JS = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(JS / "tools"))
from sdv_py_pin import PORT_PIN, pinned_checkout  # noqa: E402

FIX = JS / "test" / "fixtures"

# oracle file -> (sdv-py parser module, [(parser, capture stem)]) in the committed key order
ORACLES = {
    "on3/py_oracle.json": (
        "cfb.on3_parsers",
        [
            ("parse_on3_rdb", s)
            for s in (
                "filters_status",
                "player_profile",
                "player_all_rankings",
                "team_ranking_team_rankings",
            )
        ],
    ),
    "asa/py_oracle.json": (
        "soccer.asa_parsers",
        [
            ("parse_asa", s)
            for s in ("teams", "players", "games", "players_xgoals", "players_salaries")
        ]
        + [
            ("parse_asa_goals_added", s)
            for s in ("players_goals-added", "teams_goals-added")
        ],
    ),
    "mls_api/py_oracle.json": (
        "soccer.mls.mls_api_parsers",
        [
            ("parse_mls_api", "statsapi_competitions"),
            ("parse_mls_api", "statsapi_competitions_seasons"),
            ("parse_mls_api", "statsapi_matches_by_season"),
            ("parse_mls_standings", "statsapi_standings_conference"),
            ("parse_mls_match", "statsapi_match_single"),
            ("parse_mls_entity", "statsapi_club_single"),
            ("parse_mls_entity", "sportapi_match_single"),
            ("parse_mls_api", "sportapi_players_byclub"),
            ("parse_mls_api", "dapi_seasons_query"),
        ],
    ),
    "nwsl_api/py_oracle.json": (
        "soccer.nwsl.nwsl_api_parsers",
        [
            ("parse_nwsl_sdp", "sdp_competitions"),
            ("parse_nwsl_sdp", "sdp_teams"),
            ("parse_nwsl_sdp", "sdp_stages"),
            ("parse_nwsl_standings", "sdp_standings_overall"),
            ("parse_nwsl_stats", "sdp_stats_players"),
            ("parse_nwsl_stats", "sdp_stats_teams"),
            ("parse_nwsl_lineups", "sdp_match_lineups"),
            ("parse_nwsl_sdp", "sdp_multipleSeasonMatches"),
        ],
    ),
    "espn/py_oracle_fpi.json": (
        "_common_espn_parsers",
        [("parse_fpi", "fpi_cfb_2024")],
    ),
    "torvik/py_oracle_bart_wbb.json": (
        "mbb.torvik_parsers",
        [("parse_torvik_csv", "bart_wbb_ratings_2025_head")],
    ),
}


def frame(df):
    return {
        "columns": df.columns,
        "schema": {c: str(t) for c, t in df.schema.items()},
        "rows": df.to_dicts(),
    }


def main() -> None:
    pinned_checkout(PORT_PIN)
    for name, (module, cases) in ORACLES.items():
        mod = importlib.import_module(f"sportsdataverse.{module}")
        out = {}
        for parser, stem in cases:
            (capture,) = [
                p
                for p in (FIX / name).parent.glob(f"{stem}.*")
                if p.suffix in (".json", ".csv")
            ]
            text = capture.read_text(encoding="utf-8")
            res = getattr(mod, parser)(
                text if capture.suffix == ".csv" else json.loads(text)
            )
            out[f"{parser}:{stem}"] = (
                {k: frame(v) for k, v in res.items()}
                if isinstance(res, dict)
                else frame(res)
            )
        (FIX / name).write_text(
            json.dumps(out, default=str), encoding="utf-8", newline="\n"
        )
        print(f"{name}: {len(cases)} captures")


if __name__ == "__main__":
    main()

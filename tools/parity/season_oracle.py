"""Regenerate test/fixtures/py/oracle/nba_stats_latest_season.json: sdv-py's OWN
``nba_stats_runtime._latest_season`` on every day of 1999, 2008 and 2026, for each
league x endpoint class x SeasonType. test/transforms.test.js compares the JS port
(src/core/transforms.ts ``latestSeason``) day by day. Run it from sdv-py checked out
at the vendor pin (tools/codegen/vendor.yaml ``source.ref``; the shared guard
tools/sdv_py_pin.py refuses any other checkout):

    git -C <sdv-py> worktree add --detach <scratch> <source.ref>
    cd <scratch> && uv sync
    uv run python <sdv-js>/tools/parity/season_oracle.py

Each case maps to its label changes, ``[[first day, label], ...]``, in day order.
"""

from __future__ import annotations

import json
import sys
from datetime import date, timedelta
from pathlib import Path

JS = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(JS / "tools"))
from sdv_py_pin import pinned_checkout, vendor_pin  # noqa: E402

YEARS = (1999, 2008, 2026)
LEAGUES = ("00", "20", "15", "10")
# One endpoint per rule class: regular, playoffs, combine, draft.
ENDPOINTS = ("leaguedashplayerstats", "commonplayoffseries", "draftcombinestats", "drafthistory")
SEASON_TYPES = (None, "Regular Season", "Playoffs", "PlayIn", "All Star")


def main() -> None:
    ref, _ = pinned_checkout(vendor_pin())
    from sportsdataverse.nba.nba_stats_runtime import _latest_season

    cases = {}
    for league in LEAGUES:
        for endpoint in ENDPOINTS:
            for season_type in SEASON_TYPES:
                runs, last = [], None
                for year in YEARS:
                    day = date(year, 1, 1)
                    while day.year == year:
                        label = _latest_season(league, endpoint, today=day, season_type=season_type)
                        if label != last or day == date(year, 1, 1):
                            runs.append([day.isoformat(), label])
                            last = label
                        day += timedelta(days=1)
                cases[f"{league}|{endpoint}|{season_type or ''}"] = runs
    out = {
        "_provenance": f"sportsdataverse-py@{ref} nba_stats_runtime._latest_season; tools/parity/season_oracle.py",
        "years": list(YEARS),
        "cases": cases,
    }
    path = JS / "test/fixtures/py/oracle/nba_stats_latest_season.json"
    path.write_text(json.dumps(out, indent=1, allow_nan=False) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(cases)} cases x {sum(366 if y % 4 == 0 else 365 for y in YEARS)} days")


if __name__ == "__main__":
    main()

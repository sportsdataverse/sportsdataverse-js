"""Regenerate test/fixtures/espn/basketball_box/oracle.json.gz: sdv-py's OWN ESPN
basketball box producers (``helper_<lg>_player_box`` / ``helper_<lg>_team_box``,
lg = nba / wnba / mbb / wbb) on every REAL committed capture, plus a few labelled
derived payloads that reach gate branches no capture reaches.

test/producers/espn_basketball_box.test.js compares src/producers/espn_basketball_box.ts
to this cell by cell (column names, order, dtypes, values). Run it from sdv-py checked
out at PORT_PIN (tools/sdv_py_pin.py: the pin the producers were ported from and this
oracle was generated at), never a working tree; the shared guard refuses anything else:

    git -C <sdv-py> worktree add --detach <scratch> <PORT_PIN>
    cd <scratch> && uv sync
    uv run python <sdv-js>/tools/parity/espn_basketball_box_oracle.py

Every helper runs on every payload: the four team helpers share one core, and the
four player helpers differ only in plus_minus / the both-teams gate / MBB's
``active``-last order, so each payload shows those league facts side by side.
"""

from __future__ import annotations

import copy
import datetime as dt
import gzip
import importlib
import json
import math
import sys
from pathlib import Path

JS = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(JS / "tools"))
from sdv_py_pin import PORT_PIN, pinned_checkout  # noqa: E402
DIR = JS / "test" / "fixtures" / "espn" / "basketball_box"
# Real captures: every *.json.gz in DIR, plus the existing NBA summary capture.
EXTRA = [JS / "test" / "fixtures" / "espn" / "summary_nba.json"]
OUT = DIR / "oracle.json.gz"
LEAGUES = ("nba", "wnba", "mbb", "wbb")


def read(path: Path):
    data = path.read_bytes()
    return json.loads(gzip.decompress(data) if path.suffix == ".gz" else data)


def clean(v):
    if isinstance(v, dt.datetime | dt.date):
        return v.isoformat()
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return {"__float__": str(v)}
    return v


def helpers():
    out = {}
    for lg in LEAGUES:
        for kind in ("player_box", "team_box"):
            name = f"helper_{lg}_{kind}"
            out[name] = getattr(importlib.import_module(f"sportsdataverse.{lg}.{lg}_{kind}"), name)
    return out


def run_all(payload, fns):
    res = {}
    for name, fn in fns.items():
        try:
            df = fn(payload)
        except Exception as exc:  # the JS port must throw on the same payloads
            res[name] = {"raises": type(exc).__name__}
            continue
        res[name] = {
            "columns": df.columns,
            "dtypes": [str(t) for t in df.dtypes],
            "rows": [{k: clean(v) for k, v in r.items()} for r in df.to_dicts()],
        }
    return res


def strip_links(o):
    """Drop ESPN `links` arrays (never read by the helpers) to keep derived inputs small."""
    if isinstance(o, dict):
        return {k: strip_links(v) for k, v in o.items() if k != "links"}
    if isinstance(o, list):
        return [strip_links(v) for v in o]
    return o


def derived(captures):
    """(name, source capture, mutation, mutate(payload)) -- payload = {header, boxscore}."""

    def aths(p, block):
        return p["boxscore"]["players"][block]["statistics"][0]["athletes"]

    def comps(p):
        return p["header"]["competitions"][0]["competitors"]

    def set_(fn):
        def go(p):
            fn(p)
            return p

        return go

    def first_dnp(p, block):
        return next(a for a in aths(p, block) if a.get("didNotPlay"))

    def first_played(p, block):
        return next(a for a in aths(p, block) if not a.get("didNotPlay"))

    def drop_stat(p, name, teams=(0, 1)):
        for t in teams:
            st = p["boxscore"]["teams"][t]["statistics"]
            st[:] = [s for s in st if s.get("name") != name]

    cases = [
        (
            "second_team_no_athletes",
            "summary_mbb.json.gz",
            "players[1] athletes emptied (strict gate -> [], lax gate -> team-1 rows)",
            set_(lambda p: aths(p, 1).clear()),
        ),
        (
            "one_players_block",
            "summary_wbb.json.gz",
            "boxscore.players[1] removed",
            set_(lambda p: p["boxscore"]["players"].pop()),
        ),
        (
            "no_competitions",
            "summary_wbb.json.gz",
            "header.competitions emptied",
            set_(lambda p: p["header"]["competitions"].clear()),
        ),
        (
            "first_stats_short",
            "summary_wbb.json.gz",
            "first athlete's stats cut to one entry",
            set_(lambda p: aths(p, 0)[0].update(stats=aths(p, 0)[0]["stats"][:1])),
        ),
        (
            "ragged_stats",
            "summary_wbb.json.gz",
            "second athlete's stats vector one entry short",
            set_(lambda p: aths(p, 0)[1].update(stats=aths(p, 0)[1]["stats"][:-1])),
        ),
        (
            "played_count_mismatch",
            "summary_wbb.json.gz",
            "a played athlete flagged didNotPlay=true (stats kept)",
            set_(lambda p: first_played(p, 1).update(didNotPlay=True)),
        ),
        (
            "no_stat_keys",
            "summary_wbb.json.gz",
            "players[0].statistics[0].keys emptied",
            set_(lambda p: p["boxscore"]["players"][0]["statistics"][0].update(keys=[])),
        ),
        (
            "didnotplay_absent",
            "summary_nba.json",
            "didNotPlay key removed from a DNP athlete (neither played nor dnp -> dropped)",
            set_(lambda p: first_dnp(p, 0).pop("didNotPlay")),
        ),
        (
            "unparseable_team_id",
            "summary_wnba.json.gz",
            "players[0].team.id and boxscore.teams[0].team.id set to 'abc'",
            set_(
                lambda p: (
                    p["boxscore"]["players"][0]["team"].update(id="abc"),
                    p["boxscore"]["teams"][0]["team"].update(id="abc"),
                )
            ),
        ),
        (
            "home_away_absent",
            "summary_nba.json",
            "homeAway removed from competitor 0 (null sorts last)",
            set_(lambda p: comps(p)[0].pop("homeAway")),
        ),
        (
            "cast_edges",
            "summary_wnba.json.gz",
            "scores ' 8_0 ' / '6.1e1', season.year '2024', first played athlete's stats edited to polars cast edge strings",
            set_(
                lambda p: (
                    comps(p)[0].update(score=" 8_0 "),
                    comps(p)[1].update(score="6.1e1"),
                    p["header"]["season"].update(year="2024"),
                    first_played(p, 0).update(
                        stats=[
                            " 34",
                            "+5",
                            "3-5-7",
                            "-",
                            "4-",
                            "05",
                            "-0",
                            "1e1",
                            "2147483648",
                            "x",
                            "",
                            "1",
                            "-2147483648",
                            "+16",
                        ]
                    ),
                )
            ),
        ),
        (
            "minutes_float_edges",
            "summary_wnba.json.gz",
            "first played athlete's minutes '34.' then second's '.5e1'",
            set_(
                lambda p: (
                    first_played(p, 0)["stats"].__setitem__(0, "34."),
                    aths(p, 0)[1]["stats"].__setitem__(0, ".5e1"),
                )
            ),
        ),
        (
            "int32_whitespace",
            "summary_wnba.json.gz",
            "first played athlete's points ' 5' and rebounds '5 ' (Int32 cast -> null)",
            set_(
                lambda p: (
                    first_played(p, 0)["stats"].__setitem__(1, " 5"),
                    first_played(p, 0)["stats"].__setitem__(5, "5 "),
                )
            ),
        ),
        (
            "date_with_seconds",
            "summary_wbb.json.gz",
            "competition date '2024-03-10T07:30:00Z' (second strptime format; just after the spring-forward)",
            set_(lambda p: p["header"]["competitions"][0].update(date="2024-03-10T07:30:00Z")),
        ),
        (
            "date_standard_time",
            "summary_mbb.json.gz",
            "competition date '2024-01-02T04:59Z' (EST, local date one day earlier)",
            set_(lambda p: p["header"]["competitions"][0].update(date="2024-01-02T04:59Z")),
        ),
        (
            "date_single_digit_fields",
            "summary_mbb.json.gz",
            "competition date '2024-4-9T1:5Z' (strptime takes one-digit month / day / hour / minute)",
            set_(lambda p: p["header"]["competitions"][0].update(date="2024-4-9T1:5Z")),
        ),
        (
            "date_unparseable",
            "summary_mbb.json.gz",
            "competition date 'April 8' (py raises ValueError)",
            set_(lambda p: p["header"]["competitions"][0].update(date="April 8")),
        ),
        (
            "team_dup_stat_names",
            "summary_mbb.json.gz",
            "teams[0] gets a duplicate of its first statistic",
            set_(
                lambda p: p["boxscore"]["teams"][0]["statistics"].append(
                    dict(p["boxscore"]["teams"][0]["statistics"][0])
                )
            ),
        ),
        (
            "team_no_winner",
            "summary_mbb.json.gz",
            "winner key removed from both competitors",
            set_(lambda p: [c.pop("winner") for c in comps(p)]),
        ),
        (
            "team_second_no_stats",
            "summary_mbb.json.gz",
            "boxscore.teams[1].statistics emptied",
            set_(lambda p: p["boxscore"]["teams"][1]["statistics"].clear()),
        ),
        (
            "team_first_no_stats",
            "summary_mbb.json.gz",
            "boxscore.teams[0].statistics emptied (teams[1] keeps its statistics)",
            set_(lambda p: p["boxscore"]["teams"][0]["statistics"].clear()),
        ),
        (
            "team_split_absent_both",
            "summary_wbb.json.gz",
            "freeThrowsMade-freeThrowsAttempted removed from both teams",
            set_(lambda p: drop_stat(p, "freeThrowsMade-freeThrowsAttempted")),
        ),
        (
            "team_split_absent_one",
            "summary_wbb.json.gz",
            "freeThrowsMade-freeThrowsAttempted removed from teams[1] only",
            set_(lambda p: drop_stat(p, "freeThrowsMade-freeThrowsAttempted", teams=(1,))),
        ),
        (
            "team_stat_second_only",
            "summary_wbb.json.gz",
            "a 'zoneDefense' stat added to teams[1] only (row-2-only column appended last)",
            set_(
                lambda p: p["boxscore"]["teams"][1]["statistics"].append({"name": "zoneDefense", "displayValue": "7"})
            ),
        ),
    ]
    out = {}
    for name, src, mutation, fn in cases:
        payload = strip_links({k: copy.deepcopy(captures[src][k]) for k in ("header", "boxscore")})
        out[name] = {"from": src, "mutation": mutation, "input": fn(payload)}
    return out


def main() -> None:
    ref, _ = pinned_checkout(PORT_PIN)
    fns = helpers()
    # never read our own output back in as a capture
    paths = sorted(p for p in DIR.glob("*.json.gz") if p.name != OUT.name) + EXTRA
    captures = {p.name: read(p) for p in paths}
    result = {
        "_provenance": f"sportsdataverse-py@{ref} helper_<lg>_player_box / helper_<lg>_team_box output; "
        "tools/parity/espn_basketball_box_oracle.py",
        "captures": {name: run_all(payload, fns) for name, payload in captures.items()},
        "derived": {},
    }
    for name, case in derived(captures).items():
        case["out"] = run_all(case["input"], fns)
        result["derived"][name] = case
    text = json.dumps(result, indent=1, ensure_ascii=False) + "\n"
    OUT.write_bytes(gzip.compress(text.encode("utf-8"), compresslevel=9, mtime=0))
    for name, res in {
        **result["captures"],
        **{f"derived:{k}": v["out"] for k, v in result["derived"].items()},
    }.items():
        shape = {h: ("raises " + r["raises"]) if "raises" in r else len(r["rows"]) for h, r in res.items()}
        print(name, shape)


if __name__ == "__main__":
    main()

"""Regenerate test/fixtures/espn/basketball_pbp/oracle.json.gz: sdv-py's OWN ESPN basketball
PBP producers (``espn_<lg>_pbp`` -> ``helper_<lg>_pbp`` and its stages ``helper_<lg>_pickcenter``
/ ``helper_<lg>_game_data`` / ``helper_<lg>_pbp_features``, lg = nba / wnba / mbb / wbb) on every
REAL committed capture, plus labelled derived payloads that reach league-fact branches no
capture reaches.

test/producers/espn_basketball_pbp.test.js compares src/producers/espn_basketball_pbp.ts to
this cell by cell. Run it from sdv-py checked out at PORT_PIN (tools/sdv_py_pin.py, the pin the
producers were ported from), never a working tree (the shared guard refuses anything else):

    git -C <sdv-py> worktree add --detach <scratch> <PORT_PIN>
    cd <scratch> && uv sync
    uv run python <sdv-js>/tools/parity/espn_basketball_pbp_oracle.py

Each payload goes through py's real entry point ``espn_<lg>_pbp(game_id)`` with ``download``
stubbed to return the capture, so py's own key trimming runs too; ``raw=True`` is recorded as
well. Every league runs on every payload, so one game shows the four leagues' facts (quarters vs
halves, the seconds ladders, the timeout split, MBB's Int32 clock) side by side.

Recorded per (payload, league):
  raw   ``espn_<lg>_pbp(game_id, raw=True)``: key order + each value (SAME = the capture's own).
  out   ``espn_<lg>_pbp(game_id)``: key order, ``gameId``, ``plays`` (columns, polars dtypes, rows
        as value lists), ``timeouts`` as [team_id, {"1": ids, "2": ids}] pairs (py int keys, in
        order), every other key (SAME = the capture's own value) -- or ``{"raises": <py type>}``.
  init  ``helper_<lg>_game_data``'s returned init (spread fields + home / away) and the scalar
        fields it sets on pbp_txt -- or ``{"raises": ...}`` when py fails before it returns.
Ints beyond 2**53 are {"__int__": "<digits>"}; NaN / inf floats are {"__float__": "nan"|...}.
"""

from __future__ import annotations

import copy
import gzip
import importlib
import json
import math

import numpy as np
from espn_basketball_box_oracle import JS, PORT_PIN, pinned_checkout, read

ESPN = JS / "test" / "fixtures" / "espn"
BOX = ESPN / "basketball_box"
DIR = ESPN / "basketball_pbp"
OUT = DIR / "oracle.json.gz"
BOX_ORACLE = BOX / "oracle.json.gz"
EXTRA = [ESPN / "summary_nba.json"]
LEAGUES = ("nba", "wnba", "mbb", "wbb")
SAME = {"__same__": True}
SAFE = 2**53 - 1
GAME_DATA_FIELDS = (
    "playByPlaySource",
    "boxscoreSource",
    "gameSpreadAvailable",
    "gameSpread",
    "homeFavorite",
    "homeTeamSpread",
    "overUnder",
)


def clean(v):
    if isinstance(v, np.ndarray):
        return clean(v.tolist())
    if isinstance(v, np.generic):
        return clean(v.item())
    if isinstance(v, bool) or v is None or isinstance(v, str):
        return v
    if isinstance(v, int):
        return {"__int__": str(v)} if abs(v) > SAFE else v
    if isinstance(v, float):
        return {"__float__": str(v)} if math.isnan(v) or math.isinf(v) else v
    if isinstance(v, dict):
        return {str(k): clean(x) for k, x in v.items()}
    if isinstance(v, list | tuple):
        return [clean(x) for x in v]
    raise TypeError(f"unexpected {type(v)}")


def same_or(value, capture, key):
    return SAME if key in capture and value == capture[key] else clean(value)


class Recorder:
    """Patch one league module: stub ``download``, record game_data's init and the plays dtypes."""

    def __init__(self, lg):
        self.lg = lg
        self.m = importlib.import_module(f"sportsdataverse.{lg}.{lg}_pbp")
        game_data = getattr(self.m, f"helper_{lg}_game_data")
        features = getattr(self.m, f"helper_{lg}_pbp_features")

        def rec_game_data(pbp_txt, init):
            pbp_txt, init = game_data(pbp_txt, init)
            self.init = {
                "init": clean(copy.deepcopy(init)),
                "pbp_txt": {
                    k: clean(copy.deepcopy(pbp_txt[k])) for k in GAME_DATA_FIELDS
                },
            }
            return pbp_txt, init

        def rec_features(game_id, pbp_txt, init):
            pbp_txt = features(game_id, pbp_txt, init)
            self.dtypes = [str(t) for t in pbp_txt["plays"].dtypes]
            return pbp_txt

        setattr(self.m, f"helper_{lg}_game_data", rec_game_data)
        setattr(self.m, f"helper_{lg}_pbp_features", rec_features)

    def run(self, payload, game_id):
        self.m.download = lambda url, **kw: type(
            "R", (), {"json": lambda _self: copy.deepcopy(payload)}
        )()
        entry = getattr(self.m, f"espn_{self.lg}_pbp")
        raw = entry(game_id, raw=True)
        res = {
            "raw": {
                "keys": list(raw),
                "values": {k: same_or(v, payload, k) for k, v in raw.items()},
            }
        }
        self.init, self.dtypes = None, []
        try:
            out = entry(game_id)
        except Exception as exc:  # the JS port must throw on the same payloads
            res["out"] = {"raises": type(exc).__name__}
        else:
            plays = out["plays"]
            cols = list(plays[0]) if plays else []
            res["out"] = {
                "keys": list(out),
                "gameId": clean(out["gameId"]),
                "plays": {
                    "columns": cols,
                    "dtypes": self.dtypes if plays else [],
                    "rows": [[clean(r[c]) for c in cols] for r in plays],
                },
                "timeouts": [[clean(k), clean(v)] for k, v in out["timeouts"].items()],
                "pass": {
                    k: same_or(v, payload, k)
                    for k, v in out.items()
                    if k not in ("gameId", "plays", "timeouts")
                },
            }
        res["init"] = self.init or res["out"]
        return res


def strip_links(o):
    """Drop ESPN `links` arrays (never read by the helpers) to keep derived inputs small."""
    if isinstance(o, dict):
        return {k: strip_links(v) for k, v in o.items() if k != "links"}
    if isinstance(o, list):
        return [strip_links(v) for v in o]
    return o


def derived(captures):
    """(name, source, mutation, mutate(payload)[, game_id]) -- payload = header/format/plays/pickcenter."""

    def drop(key):
        return lambda p: p.pop(key)

    def setp(fn):
        def go(p):
            fn(p)
            return p

        return go

    def plays(p):
        return p["plays"]

    nba_pc = "nba_summary_401360428.json.gz"
    cases = [
        (
            "format_absent_2003",
            "wnba_summary_230614002.json.gz",
            "`format` removed: WNBA / WBB fall back to the season year (2003 -> halves)",
            setp(drop("format")),
        ),
        (
            "format_absent_2024",
            "summary_wnba.json.gz",
            "`format` removed: season year 2024 -> quarters for WNBA / WBB",
            setp(drop("format")),
        ),
        (
            "format_quarters_2015",
            "wbb_summary_400787556.json.gz",
            "format.regulation.periods set to 4 on a 2015 game: the format wins over the year",
            setp(lambda p: p["format"]["regulation"].update(periods=4)),
        ),
        (
            "format_regulation_null",
            "wbb_summary_400787556.json.gz",
            "format.regulation set to null (`or {}` -> year fallback)",
            setp(lambda p: p["format"].update(regulation=None)),
        ),
        # The halves cutoffs pinned on both sides (format absent, so the season year decides):
        # WNBA 2005 halves / 2006 quarters; WBB 2015 halves (format_regulation_null) / 2016 quarters.
        (
            "format_absent_2005",
            "wnba_summary_230614002.json.gz",
            "`format` removed and header.season.year 2005 (last WNBA halves year)",
            setp(lambda p: (p.pop("format"), p["header"]["season"].update(year=2005))),
        ),
        (
            "format_absent_2006",
            "wnba_summary_230614002.json.gz",
            "`format` removed and header.season.year 2006 (first WNBA quarters year)",
            setp(lambda p: (p.pop("format"), p["header"]["season"].update(year=2006))),
        ),
        (
            "format_absent_2016",
            "wbb_summary_400787556.json.gz",
            "`format` removed and header.season.year 2016 (first WBB quarters year)",
            setp(lambda p: (p.pop("format"), p["header"]["season"].update(year=2016))),
        ),
        (
            "pickcenter_favorite_false",
            nba_pc,
            "homeTeamOdds.favorite false on every provider (homeTeamSpread = -spread)",
            setp(
                lambda p: [
                    e["homeTeamOdds"].update(favorite=False) for e in p["pickcenter"]
                ]
            ),
        ),
        (
            "pickcenter_no_spread",
            nba_pc,
            "`spread` removed from every provider (column absent -> 2.5)",
            setp(lambda p: [e.pop("spread") for e in p["pickcenter"]]),
        ),
        (
            "pickcenter_null_spread",
            nba_pc,
            "`spread` null on every provider (py IndexError)",
            setp(lambda p: [e.update(spread=None) for e in p["pickcenter"]]),
        ),
        (
            "pickcenter_no_provider_id",
            nba_pc,
            "`provider` removed from every entry (py KeyError on the sort)",
            setp(lambda p: [e.pop("provider") for e in p["pickcenter"]]),
        ),
        (
            "pickcenter_string_spread",
            nba_pc,
            "spreads as strings (float() parses for the plays; abs() raises in game_data)",
            setp(
                lambda p: [e.update(spread=str(e["spread"])) for e in p["pickcenter"]]
            ),
        ),
        (
            "season_year_string",
            "summary_mbb.json.gz",
            "header.season.year '2024' (NBA / WNBA cast it to Int32; MBB / WBB keep the string)",
            setp(lambda p: p["header"]["season"].update(year="2024")),
        ),
        (
            "pbp_source_none",
            "summary_nba.json",
            "playByPlaySource 'none' with plays present (empty plays, empty timeouts)",
            setp(
                lambda p: p["header"]["competitions"][0].update(playByPlaySource="none")
            ),
        ),
        (
            "mbb_integer_clock",
            "summary_mbb.json.gz",
            "one clock '5' (no colon): MBB -> minutes 5, seconds null; the others prefix '0:'",
            setp(lambda p: plays(p)[3]["clock"].update(displayValue="5")),
        ),
        (
            "clock_empty_string",
            "summary_wbb.json.gz",
            "one clock '' (py's Float32 / Int32 cast raises)",
            setp(lambda p: plays(p)[3]["clock"].update(displayValue="")),
        ),
        (
            "clock_null",
            "summary_wbb.json.gz",
            "one clock null (null seconds remaining, no raise)",
            setp(lambda p: plays(p)[3]["clock"].update(displayValue=None)),
        ),
        (
            "play_id_whitespace",
            "summary_wnba.json.gz",
            "one play id ' 401726992' (py's Int64 cast raises)",
            setp(lambda p: plays(p)[0].update(id=" " + plays(p)[0]["id"])),
        ),
        (
            "mixed_type_column",
            "summary_wnba.json.gz",
            "one play's awayScore as a string (pandas -> polars raises)",
            setp(lambda p: plays(p)[5].update(awayScore=str(plays(p)[5]["awayScore"]))),
        ),
        (
            "period_null",
            "summary_wbb.json.gz",
            "one play's period.number null (half 2, null lag / ladder conditions)",
            setp(lambda p: plays(p)[40]["period"].update(number=None)),
        ),
        (
            "no_plays_key_list",
            "summary_wbb.json.gz",
            "plays emptied with playByPlaySource 'full' (py ColumnNotFoundError)",
            setp(lambda p: plays(p).clear()),
        ),
        (
            "home_away_swapped",
            "summary_nba.json",
            "competitors[0].homeAway 'away' (home = competitors[1])",
            setp(
                lambda p: p["header"]["competitions"][0]["competitors"][0].update(
                    homeAway="away"
                )
            ),
        ),
        (
            "game_id_string",
            "summary_nba.json",
            "game_id passed as a string (NBA / WNBA echo it; MBB / WBB int() it)",
            setp(lambda p: None),
            "401585607",
        ),
        (
            "timeout_texts",
            "mbb_summary_401600379.json.gz",
            "three ShortTimeOut texts name a team only by its alt name ('Ohio St.'), mascot "
            "('Terrapins') or abbreviation ('MD') -- each regex pattern on its own",
            setp(
                lambda p: [
                    plays(p)[i].update(text=t)
                    for i, t in (
                        (37, "Ohio St. Timeout"),
                        (140, "Terrapins Timeout"),
                        (256, "MD Timeout"),
                    )
                ]
            ),
        ),
        (
            "clock_float32_association",
            "summary_nba.json",
            "one first-quarter clock '1:00.0018': NBA's ((720 + 60m) + s) and WNBA's "
            "600 + (60m + s) round differently in Float32",
            setp(lambda p: plays(p)[5]["clock"].update(displayValue="1:00.0018")),
        ),
    ]
    out = {}
    for name, src, mutation, fn, *gid in cases:
        cap = captures[src]
        payload = strip_links(
            {
                k: copy.deepcopy(cap[k])
                for k in ("header", "format", "plays", "pickcenter")
                if k in cap
            }
        )
        payload = fn(payload)
        out[name] = {
            "from": src,
            "mutation": mutation,
            "game_id": gid[0] if gid else int(cap["header"]["id"]),
            "input": payload,
        }
    return out


def main() -> None:
    ref, _ = pinned_checkout(PORT_PIN)
    recorders = [Recorder(lg) for lg in LEAGUES]
    # never read an oracle (ours or the box one) back in as a capture
    paths = (
        sorted(
            p
            for d in (BOX, DIR)
            for p in d.glob("*.json.gz")
            if p not in (OUT, BOX_ORACLE)
        )
        + EXTRA
    )
    captures = {p.name: read(p) for p in paths}

    def run_all(payload, game_id):
        return {r.lg: r.run(payload, game_id) for r in recorders}

    result = {
        "_provenance": f"sportsdataverse-py@{ref} espn_<lg>_pbp / helper_<lg>_pbp output; "
        "tools/parity/espn_basketball_pbp_oracle.py",
        "captures": {},
        "derived": {},
    }
    for name, payload in captures.items():
        game_id = int(payload["header"]["id"])
        result["captures"][name] = {"game_id": game_id, **run_all(payload, game_id)}
    for name, case in derived(captures).items():
        case["out"] = run_all(case["input"], case["game_id"])
        result["derived"][name] = case
    text = json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n"
    OUT.write_bytes(gzip.compress(text.encode("utf-8"), compresslevel=9, mtime=0))
    for name, res in {
        **result["captures"],
        **{f"derived:{k}": v["out"] for k, v in result["derived"].items()},
    }.items():
        shape = {
            lg: ("raises " + r["out"]["raises"])
            if "raises" in r["out"]
            else len(r["out"]["plays"]["rows"])
            for lg, r in res.items()
            if lg in LEAGUES
        }
        print(name, shape)


if __name__ == "__main__":
    main()

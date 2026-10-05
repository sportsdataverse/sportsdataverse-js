"""Generate the odds-math parity oracle from sdv-py `sportsdataverse.wexp.market`.

Provenance: sdv-py pin 719de79edb685b89c524f8b4c0c146fea0b53855. Run with the
pin on PYTHONPATH (scratch `git worktree add <dir> <pin>`):

  PYTHONPATH=<scratch> <sdv-py venv python> tools/oracle/odds_math_oracle.py \
      [--build-fixture <odds-data/odds dir>]

--build-fixture re-extracts test/fixtures/odds/h2h_rows.json from real The Odds
API historical captures (oddsapiR-dev/odds-data/odds/{nfl,soccer_epl}/lines).
Writes test/fixtures/odds/odds_math_oracle.json. Non-finite numbers are encoded
as the strings "NaN" / "Infinity" / "-Infinity"; raised errors as {"error": <type>}.
"""
import json, math, os, sys, warnings
from pathlib import Path
import sportsdataverse.wexp.market as m

HERE = Path(__file__).resolve().parents[2]
FIX = HERE / "test" / "fixtures" / "odds"
PIN = "719de79edb685b89c524f8b4c0c146fea0b53855"


def enc(x):
    if isinstance(x, float):
        if math.isnan(x): return "NaN"
        if math.isinf(x): return "Infinity" if x > 0 else "-Infinity"
    if isinstance(x, (list, tuple)): return [enc(i) for i in x]
    if isinstance(x, dict): return {k: enc(v) for k, v in x.items()}
    return x


def call(fn, *args, **kw):
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        try:
            out = {"value": enc(fn(*args, **kw))}
        except Exception as e:  # noqa: BLE001
            out = {"error": type(e).__name__}
        if any("Shin solver failed" in str(i.message) for i in w):
            out["warned"] = True
        return out


def build_fixture(root):
    rows = []
    for sport, nfiles in (("nfl", 6), ("soccer_epl", 4)):
        d = Path(root) / sport / "lines"
        files = sorted(os.listdir(d))
        step = max(1, len(files) // nfiles)
        for f in files[::step][:nfiles]:
            j = json.load(open(d / f))
            for ev in (j["data"] if isinstance(j, dict) else j):
                for bk in ev.get("bookmakers", []):
                    for mk in bk["markets"]:
                        if mk["key"] == "h2h":
                            rows.append({"src": f"{sport}/lines/{f}", "home": ev["home_team"], "away": ev["away_team"],
                                         "bookmaker": bk["key"], "outcomes": mk["outcomes"]})
    doc = {"provenance": f"The Odds API historical h2h captures (oddsapiR-dev/odds-data/odds), American prices; extracted by tools/oracle/odds_math_oracle.py", "rows": rows}
    json.dump(doc, open(FIX / "h2h_rows.json", "w"), indent=0)


def main():
    if "--build-fixture" in sys.argv:
        build_fixture(sys.argv[sys.argv.index("--build-fixture") + 1])
    rows = json.load(open(FIX / "h2h_rows.json"))["rows"]
    nan, inf = float("nan"), float("inf")
    cases = {"prob_from_american": [], "prob_from_decimal": [], "devig_multiplicative": [], "devig_shin": [],
             "spread_to_prob": [], "logit_blend": [], "moneyline_pair_prob": []}
    am = [-100, 100, 0, -110, 110, -105, 105, -150, 130, -1000, 1000, -10000, 10000, 1, -1, 99, -99, 150.5, -150.5, 1e9, -1e9, nan, inf, -inf]
    am += sorted({o["price"] for r in rows for o in r["outcomes"]})
    for p in am: cases["prob_from_american"].append({"args": [enc(p)], **call(m.prob_from_american, p)})
    for p in [2.0, 1.91, 1.0, 0.5, 0, -2, 1.0000001, 1.01, 10, 101, 1e9, nan, inf, -inf, 3.5, 1.5]:
        cases["prob_from_decimal"].append({"args": [enc(p)], **call(m.prob_from_decimal, p)})
    sets = [[0.5238, 0.5238], [0.5, 0.5], [0.85, 0.25], [0.4, 0.4], [0.3, 0.3, 0.3], [0.5], [1.0], [0.6, 0.6, 0.2], [0.9, 0.9], [0.99, 0.2],
            [0.999, 0.999], [0.5, 0.5, 0.5, 0.5], [0.1, 0.2, 0.3, 0.55], [0.7, 0.4], [0.0, 0.0], [0.0, 0.6], [], [nan, 0.5], [0.5, 1.2], [2.0, 3.0], [1.0, 1.0], [0.95, 0.15, 0.05],
            # P4: cancellation-prone sums (py>=3.12 compensated), NaN/inf inputs, extreme books
            [0.1] * 10, [0.1] * 11, [0.7, 0.1, 0.1, 0.1], [1e-17, 1.0, 1e-17, 1e-17], [1.0, 1e-16, 1e-16, 1e-16, 1e-16],
            [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7], [0.3333333333333333] * 3, [0.3333333333333333] * 4, [1e300, 1e300], [inf, 0.5],
            [0.9, nan], [nan, nan], [-0.0], [0.5, 1e-300], [1e-10, 1.0 + 1e-10], [0.51, 0.52, 0.53, 0.54, 0.55]]
    for r in rows:
        try:
            raw = [m.prob_from_american(o["price"]) for o in r["outcomes"]]
        except Exception:
            continue
        sets.append(raw)
    for s in sets:
        for k, fn in (("devig_multiplicative", m.devig_multiplicative), ("devig_shin", m.devig_shin)):
            cases[k].append({"args": [enc(s)], **call(fn, s)})
    for sp in [0, 7, -7, 3.5, -3.5, 14, -21, 0.5, 100, -100, nan, inf, -inf]:
        for sg in [13.45, 1, 10, 0, -13.45, 17.0, inf, nan]:
            cases["spread_to_prob"].append({"args": [enc(sp), enc(sg)], **call(m.spread_to_prob, sp, sg)})
    ps = [0.5, 0.61, 0.64, 0.01, 0.99, 0.0, 1.0, -0.1, 1.2, nan, 0.3, 0.7, 1e-300, 0.9999999999]
    for a in ps:
        for b in [0.5, 0.64, 0.2, 0.0, 1.0, nan]:
            cases["logit_blend"].append({"args": [enc(a), enc(b)], **call(m.logit_blend, a, b)})
    for a, b, w in [(0.61, 0.64, 0.7), (0.61, 0.64, 0.0), (0.61, 0.64, 1.0), (0.61, 0.64, 0.3), (0.6, 0.4, 0.5), (0.61, 0.64, 2.0), (0.61, 0.64, -1.0), (0.61, 0.64, nan)]:
        cases["logit_blend"].append({"args": [a, b, w], **call(m.logit_blend, a, b, w)})
    pairs = [(-150, 130), (-110, -110), (100, 100), (-100, -100), (-100, 100), (0, -110), (-110, 0), (300, -400), (-5000, 1500), (5000, -9000), (nan, -110), (200, 200)]
    for r in rows:
        if len(r["outcomes"]) == 2:
            pairs.append((r["outcomes"][0]["price"], r["outcomes"][1]["price"]))
    for h, a in pairs:
        for meth in ("multiplicative", "shin", "power", ""):
            cases["moneyline_pair_prob"].append({"args": [enc(h), enc(a), meth], **call(m.moneyline_pair_prob, h, a, meth)})
    json.dump(enc({"provenance": {"sdv_py_pin": PIN, "module": "sportsdataverse.wexp.market", "module_file": m.__file__.replace("\\", "/").split("sportsdataverse/")[-1]}, "cases": cases}),
              open(FIX / "odds_math_oracle.json", "w"), indent=0)
    print({k: len(v) for k, v in cases.items()})


main()

"""Regenerate test/fixtures/py/oracle/<family>.json.gz: sdv-py's OWN parser output
on every real capture listed in test/fixtures/py/manifest.yaml.

test/parsers/parity.test.js compares each JS parser to these cell by cell, so
run this with sportsdataverse-py checked out at the vendor pin
(tools/codegen/vendor.yaml `source.ref`), never its working tree (the shared guard
tools/sdv_py_pin.py refuses anything else):

    git -C <sdv-py> worktree add --detach <scratch> <source.ref>
    cd <scratch> && uv sync
    uv run python <sdv-js>/tools/parity/py_oracle.py

The py parser for an endpoint is the one sdv-py's generated wrapper calls,
read from the vendored upstream endpoint YAML (tools/codegen/vendor/upstream/),
and is called the way that wrapper calls it: `parser(raw)`.
"""

from __future__ import annotations

import gzip
import importlib
import json
import math
import sys
from pathlib import Path

import yaml

JS = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(JS / "tools"))
from sdv_py_pin import pinned_checkout, vendor_pin  # noqa: E402
FIX = JS / "test" / "fixtures"
ROWS = 20  # rows kept per frame; row counts are always compared in full


def read(path: Path):
    data = (
        gzip.decompress(path.read_bytes())
        if path.suffix == ".gz"
        else path.read_bytes()
    )
    text = data.decode("utf-8")
    stem = path.name.removesuffix(".gz")
    # CSV / HTML bodies reach the parser as text (mlb_statcast_runtime._get).
    return text if stem.endswith((".csv", ".html")) else json.loads(text)


def clean(v):
    # JSON has no NaN / inf: write the marker test/helpers/parity.mjs decodes
    # (pyOracleReviver), the one the basketball / hockeytech oracles use.
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return {"__float__": str(v)}
    return v


def frame(out):
    if isinstance(out, dict):  # multi-table parser: {section: frame}
        return {k: frame(v) for k, v in out.items()}
    return {
        "columns": out.columns,
        "dtypes": [str(d) for d in out.dtypes],
        "n_rows": out.height,
        "rows": [
            {k: clean(v) for k, v in r.items()} for r in out.head(ROWS).to_dicts()
        ],
    }


def main() -> None:
    vendor = yaml.safe_load(
        (JS / "tools/codegen/vendor.yaml").read_text(encoding="utf-8")
    )
    ref, _ = pinned_checkout(vendor_pin())
    manifest = yaml.safe_load((FIX / "py/manifest.yaml").read_text(encoding="utf-8"))
    out_dir = FIX / "py/oracle"
    out_dir.mkdir(exist_ok=True)
    for family, fixtures in manifest.items():
        cfg = vendor["families"][family] or {}
        stem = cfg.get("from", family)
        doc = yaml.safe_load(
            (JS / f"tools/codegen/vendor/upstream/endpoints/{stem}.yaml").read_text(
                encoding="utf-8"
            )
        )
        module = importlib.import_module(f"sportsdataverse.{doc['parser_module']}")
        js_to_py = {v: k for k, v in (cfg.get("names") or {}).items()}
        by_short = {ep["short"]: ep.get("parser") for ep in doc["endpoints"]}
        result = {
            "_provenance": f"sportsdataverse-py@{ref} parser output; tools/parity/py_oracle.py"
        }
        for path, short in fixtures.items():
            parser = by_short[js_to_py.get(short, short)]
            out = getattr(module, parser)(read(FIX / path))
            result[path] = {"parser": parser, "out": frame(out)}
        text = json.dumps(result, indent=1, ensure_ascii=False, default=str) + "\n"
        # gzip with mtime 0 (same bytes every run): wide frames make the JSON large.
        (out_dir / f"{family}.json.gz").write_bytes(
            gzip.compress(text.encode("utf-8"), compresslevel=9, mtime=0)
        )
        print(f"{family}: {len(fixtures)} fixtures")


if __name__ == "__main__":
    main()

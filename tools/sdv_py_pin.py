"""The one guard every sdv-py oracle generator (tools/parity/*.py, tools/oracle/*.py)
runs before it writes a fixture: an oracle must come from sdv-py exactly as committed
at a known pin, never from a working tree or from another installed copy.

``pinned_checkout(pin)`` imports ``sportsdataverse``, finds the git checkout it was
imported from, and exits unless that checkout's own package is the one imported, its
HEAD is ``pin`` and it has no local changes. It returns ``(pin, root)``; a generator
reads sdv-py files (fixtures, model tables) from ``root``. It does not depend on the
working directory, so ``uv run --project <sdv-py>`` from the sdv-js root works too.

Two pins:

* ``vendor_pin()`` -- ``tools/codegen/vendor.yaml`` ``source.ref``. The vendored
  parsers' oracle (tools/parity/py_oracle.py) tracks the vendor pin.
* ``PORT_PIN`` -- the sdv-py commit the hand-ported modules (the ESPN basketball
  producers, HockeyTech analytics, cricket win probability, odds math) were ported
  from; their committed oracles were generated there. Moving them to a newer pin is
  a deliberate change: bump ``PORT_PIN``, regenerate, re-check the JS ports.
"""

from __future__ import annotations

import importlib
import subprocess
from pathlib import Path

import yaml

JS = Path(__file__).resolve().parents[1]
PORT_PIN = "719de79edb685b89c524f8b4c0c146fea0b53855"


def vendor_pin() -> str:
    vendor = yaml.safe_load(
        (JS / "tools/codegen/vendor.yaml").read_text(encoding="utf-8")
    )
    return vendor["source"]["ref"]


def pinned_checkout(pin: str) -> tuple[str, Path]:
    pkg = Path(importlib.import_module("sportsdataverse").__file__).resolve()

    def git(*args: str) -> str:
        r = subprocess.run(
            ["git", "-C", str(pkg.parent), *args], capture_output=True, text=True
        )
        if r.returncode:
            raise SystemExit(
                f"sportsdataverse is imported from {pkg}, which is not in a git checkout of sdv-py"
            )
        return r.stdout.strip()

    root = Path(git("rev-parse", "--show-toplevel")).resolve()
    if pkg != root / "sportsdataverse" / "__init__.py":
        raise SystemExit(
            f"sportsdataverse is imported from {pkg}, not from the checkout's own package under {root}"
        )
    head = git("rev-parse", "HEAD")
    if head != pin:
        raise SystemExit(f"the sdv-py checkout {root} is at {head}, the pin is {pin}")
    if git("status", "--porcelain"):
        raise SystemExit(
            f"the sdv-py checkout {root} has local changes; the oracle must come from the pin as committed"
        )
    return pin, root

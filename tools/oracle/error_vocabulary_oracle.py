"""Regenerate test/fixtures/error_vocabulary/py_oracle.json: what sdv-py's flat-API
getters do with one final HTTP answer, for test/core/error_vocabulary.test.js to
hold sdv-js's ``request()`` (and the torvik / statcast getters) to.

Each case is ``(getter, status, content-type, body)``. ``download`` is replaced by a
stub that returns that answer, so the case runs sdv-py's own ``_check_status`` /
``_json_body`` / ``_text_body`` path (``_codegen_runtime._get``,
``mbb.torvik_runtime._get``, ``mlb.mlb_statcast_runtime._get``) with nothing else
in the way. The outcome is ``{"ok": <returned value>}`` or ``{"error": <class>}``,
with py's ``ValueError`` written as sdv-js's ``InvalidParameterError``. Run it from
sdv-py checked out at ERROR_VOCAB_PIN (sdv-py #700; the shared guard in
tools/sdv_py_pin.py refuses any other checkout, a dirty one, or another copy):

    git -C <sdv-py> worktree add --detach <scratch> <ERROR_VOCAB_PIN>
    cd <scratch> && uv sync --extra tests
    uv run python <sdv-js>/tools/oracle/error_vocabulary_oracle.py
"""

from __future__ import annotations

import importlib
import json
import sys
from pathlib import Path

JS = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(JS / "tools"))
from sdv_py_pin import ERROR_VOCAB_PIN, pinned_checkout  # noqa: E402

GETTERS = {
    "default": "sportsdataverse._codegen_runtime",
    "torvik": "sportsdataverse.mbb.torvik_runtime",
    "statcast": "sportsdataverse.mlb.mlb_statcast_runtime",
}
JSON_CT = "application/json"
HTML = "<html><body>Checking your browser...</body></html>"
CASES = [
    ("default", 200, JSON_CT, '{"teams": [{"id": 1}]}'),
    ("default", 200, JSON_CT, "[]"),
    ("default", 204, JSON_CT, ""),
    ("default", 205, JSON_CT, ""),
    ("default", 200, JSON_CT, ""),
    ("default", 200, "text/html", HTML),
    ("default", 400, JSON_CT, '{"message": "season is invalid"}'),
    ("default", 422, JSON_CT, '{"message": "unprocessable"}'),
    ("default", 404, JSON_CT, ""),
    ("default", 403, "text/html", HTML),
    ("default", 500, JSON_CT, ""),
    ("torvik", 200, "text/csv", "team,adj_o\nHouston,118.2\n"),
    ("torvik", 200, "text/html", HTML),
    ("torvik", 200, JSON_CT, HTML),
    ("torvik", 200, "text/csv", ""),
    ("torvik", 204, "text/csv", ""),
    ("torvik", 400, "text/html", ""),
    ("statcast", 200, JSON_CT, '{"game_status": "F"}'),
    ("statcast", 200, "text/csv", "pitch_type,velo\nFF,95.1\n"),
    ("statcast", 200, "text/html", HTML),
    ("statcast", 200, JSON_CT, HTML),
    ("statcast", 200, JSON_CT, ""),
    ("statcast", 204, JSON_CT, ""),
    ("statcast", 204, "text/csv", ""),
    ("statcast", 422, JSON_CT, '{"error": "bad"}'),
]


class _Resp:
    def __init__(self, status: int, ctype: str, text: str) -> None:
        self.status_code = status
        self.headers = {"content-type": ctype}
        self.text = text
        self.content = text.encode()

    def json(self):
        return json.loads(self.text)


def main() -> None:
    pin, _root = pinned_checkout(ERROR_VOCAB_PIN)
    errors = importlib.import_module("sportsdataverse.errors")
    out = []
    for getter, status, ctype, body in CASES:
        mod = importlib.import_module(GETTERS[getter])
        mod.download = lambda *a, _r=_Resp(status, ctype, body), **k: _r
        try:
            outcome = {"ok": mod._get("https://example.test/api/x", {})}
        except (errors.NoDataError, errors.AssetFetchError) as exc:
            outcome = {"error": type(exc).__name__}
        except ValueError:
            outcome = {"error": "InvalidParameterError"}
        out.append(
            {
                "getter": getter,
                "status": status,
                "content_type": ctype,
                "body": body,
                **outcome,
            }
        )
    dest = JS / "test" / "fixtures" / "error_vocabulary" / "py_oracle.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "sdv_py": pin,
        "generator": "tools/oracle/error_vocabulary_oracle.py",
        "cases": out,
    }
    dest.write_text(
        json.dumps(payload, indent=1) + "\n", encoding="utf-8", newline="\n"
    )
    print(f"wrote {len(out)} cases to {dest}")


if __name__ == "__main__":
    main()

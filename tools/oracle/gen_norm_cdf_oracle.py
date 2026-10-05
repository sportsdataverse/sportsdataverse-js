"""Generate test/fixtures/cricket/norm_cdf_oracle.json: rows [x, truth, scipy].

scipy.stats.norm.cdf (scipy 1.18) plus a 60-digit Decimal continued-fraction truth for x <= -1.5
(null elsewhere). Run with any python that has numpy + scipy.
"""
import json
from decimal import Decimal as D, getcontext
from pathlib import Path

import numpy as np
from scipy.stats import norm

getcontext().prec = 60
PI = D("3.14159265358979323846264338327950288419716939937510582097494")


def truth(x):
    z = D(-x) / D(2).sqrt()
    f = z
    for k in range(3000, 0, -1):
        f = z + D(k) / 2 / f
    return float((-z * z).exp() / PI.sqrt() / f / 2)


xs = [-40, -38.5, -37.5, -30, -20, -12, -10, -8.5, -8, -7, -6, -5, -4, -3.5, -3, -2.9, -2.83, -2.8, -2.5, -2, -1.5, -1, -0.5,
      -1e-9, 0, 1e-9, 0.5, 1, 2, 2.8, 3, 5, 8, 10, 20, 40] + [float(v) for v in np.linspace(-12, 12, 481)]
out = [[x, truth(x) if x <= -1.5 else None, float(norm.cdf(x))] for x in xs]
json.dump(out, open(Path(__file__).resolve().parents[2] / "test/fixtures/cricket/norm_cdf_oracle.json", "w"))

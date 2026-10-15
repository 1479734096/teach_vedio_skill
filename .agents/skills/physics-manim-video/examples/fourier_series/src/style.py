from components import *
"""Style and mathematical models for Fourier Series Explainer (Test 2).
"""
from manim import *
import numpy as np
from qa_runtime import audit_model
from qa_plot import audit_graph
from pathlib import Path
import json
P=json.loads((Path(__file__).resolve().parents[1]/"physics_config.json").read_text(encoding="utf-8"))["parameters"]

# ── Semantic Color Palette ──────────────────────────────────────────────────
COLOR_CIRCLE = "#3A4556"
COLOR_FUNDAMENTAL = "#58C4DD"  # BLUE_C: 1st harmonic (k=1, freq=1)
COLOR_H3 = "#FC6255"           # RED_C: 3rd harmonic (k=2, freq=3)
COLOR_H5 = "#83C167"           # GREEN_C: 5th harmonic (k=3, freq=5)
COLOR_SUM = "#FFFF00"          # PURE_YELLOW: Synthesized output wave
COLOR_TRACE = "#FFD700"        # Pen trace color
COLOR_LEAD = "#5CD0B3"         # TEAL_C: Connecting indicator line

# ── Typography Scale ────────────────────────────────────────────────────────

# ── Fourier Parameters (SSOT) ──────────────────────────────────────────────
OMEGA_0 = TAU/P["period"]  # Base angular frequency
HARMONICS = [
    {"n": 1, "radius": 4.0*P["amplitude"] / (np.pi * 1), "speed": 1 * OMEGA_0, "color": COLOR_FUNDAMENTAL},
    {"n": 3, "radius": 4.0*P["amplitude"] / (np.pi * 3), "speed": 3 * OMEGA_0, "color": COLOR_H3},
    {"n": 5, "radius": 4.0*P["amplitude"] / (np.pi * 5), "speed": 5 * OMEGA_0, "color": COLOR_H5},
]

@audit_model("get_epicycle_points")
def get_epicycle_points(center, t, harmonics=HARMONICS):
    """Compute the chain of centers and vector tips for the epicycles at time t."""
    points = [np.array(center, dtype=float)]
    curr = np.array(center, dtype=float)
    for h in harmonics:
        r = h["radius"]
        w = h["speed"]
        dx = r * np.cos(w * t)
        dy = r * np.sin(w * t)
        curr = curr + np.array([dx, dy, 0])
        points.append(curr.copy())
    return points

@audit_model("fourier_square_wave")
def fourier_square_wave(t, n_terms=3):
    """Analytic Fourier partial sum value at time t."""
    val = 0.0
    for k in range(1, n_terms + 1):
        n = 2 * k - 1
        val += (4.0*P["amplitude"] / (np.pi * n)) * np.sin(n * OMEGA_0 * t)
    return val

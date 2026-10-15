from components import *
"""Style and mathematical models for Convolution Explainer (Test 3).
"""
from manim import *
import numpy as np
from qa_runtime import audit_model
from qa_plot import audit_graph
from pathlib import Path
import json
P=json.loads((Path(__file__).resolve().parents[1]/"physics_config.json").read_text(encoding="utf-8"))["parameters"]

# ── Semantic Color Palette ──────────────────────────────────────────────────
COLOR_F = "#58C4DD"           # BLUE_C: Stationary pulse f(tau)
COLOR_G = "#FC6255"           # RED_C: Sliding flipped pulse g(t - tau)
COLOR_OVERLAP = "#83C167"     # GREEN_C: Multiplied overlap area
COLOR_CONV = "#FFFF00"        # PURE_YELLOW: Resulting convolution signal (f * g)(t)

# ── Typography Scale ────────────────────────────────────────────────────────

# ── Convolution Parameters (SSOT) ──────────────────────────────────────────
PULSE_WIDTH = P["pulse_width"]  # Width of each rect pulse (tau in [-1, 1])
PULSE_HEIGHT = P["pulse_height"]

def rect_pulse(tau, center=0.0, width=PULSE_WIDTH, height=PULSE_HEIGHT):
    """Rectangular pulse centered at 'center' with given width and height."""
    half = width / 2.0
    return height if abs(tau - center) <= half else 0.0

def convolution_rect_rect(t, width=PULSE_WIDTH, height=PULSE_HEIGHT):
    """Analytical convolution of two rectangular pulses: a triangle of base 2*width and peak width*height^2."""
    overlap_w = max(0.0, width - abs(t))
    return overlap_w * (height * height)

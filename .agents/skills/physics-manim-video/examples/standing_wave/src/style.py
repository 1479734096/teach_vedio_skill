from components import *
"""Style constants and physical functions for Standing Wave Regression Test.
"""
from manim import *
import numpy as np
from qa_runtime import audit_model
from qa_plot import audit_graph
from pathlib import Path
import json
P=json.loads((Path(__file__).resolve().parents[1]/"physics_config.json").read_text(encoding="utf-8"))["parameters"]

# ── Semantic Color Palette ──────────────────────────────────────────────────
COLOR_INCIDENT = "#58C4DD"    # BLUE_C: Incident wave
COLOR_REFLECTED = "#FC6255"   # RED_C: Reflected wave
COLOR_STANDING = "#FFFF00"    # PURE_YELLOW: Resulting standing wave
COLOR_ENVELOPE = "#5CD0B3"    # TEAL_C: Space amplitude envelope
COLOR_ANTINODE = "#83C167"    # GREEN_C: Voltage antinode
COLOR_NODE = "#FF8C00"        # ORANGE: Voltage node

# ── Typography Scale ────────────────────────────────────────────────────────

# ── Physical Transmission Line Parameters (SSOT) ───────────────────────────
X_TERM = P["x_term"]
X_SOURCE = P["x_source"]
WAVELENGTH = P["wavelength"]
BETA = TAU / WAVELENGTH       # beta = 2*pi / lambda = pi / 3
PERIOD = P["period"]                  # Oscillation period
OMEGA = TAU / PERIOD          # omega = 2*pi / T = pi
AMPLITUDE = P["amplitude"]

def phys_x(screen_x):
    return screen_x - X_TERM

@audit_model("incident_wave")
def incident_wave(screen_x, t):
    x = phys_x(screen_x)
    return AMPLITUDE * np.cos(OMEGA * t - BETA * x)

@audit_model("reflected_wave")
def reflected_wave(screen_x, t):
    x = phys_x(screen_x)
    return AMPLITUDE * np.cos(OMEGA * t + BETA * x)

@audit_model("standing_wave")
def standing_wave(screen_x, t):
    x = phys_x(screen_x)
    return 2 * AMPLITUDE * np.cos(BETA * x) * np.cos(OMEGA * t)

def envelope_upper(screen_x):
    x = phys_x(screen_x)
    return 2 * AMPLITUDE * np.abs(np.cos(BETA * x))

def envelope_lower(screen_x):
    x = phys_x(screen_x)
    return -2 * AMPLITUDE * np.abs(np.cos(BETA * x))

def make_transmission_line(y_offset=0.0, wire_sep=2.4, x_source=X_SOURCE, x_term=X_TERM):
    y_top = y_offset + wire_sep / 2
    y_bot = y_offset - wire_sep / 2
    
    wire_top = Line([x_source, y_top, 0], [x_term, y_top, 0], color=COLOR_LINE, stroke_width=2.8)
    wire_bot = Line([x_source, y_bot, 0], [x_term, y_bot, 0], color=COLOR_LINE, stroke_width=2.8)
    baseline = DashedLine([x_source, y_offset, 0], [x_term, y_offset, 0], color=COLOR_AXIS, stroke_width=1.5, dash_length=0.15)
    
    term_top = Circle(radius=0.09, color=COLOR_LINE, stroke_width=2.2).move_to([x_term, y_top, 0])
    term_bot = Circle(radius=0.09, color=COLOR_LINE, stroke_width=2.2).move_to([x_term, y_bot, 0])
    term_line = DashedLine([x_term, y_bot - 0.45, 0], [x_term, y_top + 0.45, 0], color=GREY_A, stroke_width=1.8)
    term_tag = Text("开路终端\nx = 0", font="Microsoft YaHei", font_size=FS_TAG, color=WHITE).next_to(term_line, RIGHT, buff=0.20)
    
    return VGroup(wire_top, wire_bot, baseline, term_top, term_bot, term_line, term_tag)

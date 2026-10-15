"""Unified 3Blue1Brown visual style constants, color palettes, and typography scale.
Template for physics-manim-video.
"""
from manim import *
import numpy as np
from qa_runtime import attach_audit
attach_audit()

# ── Semantic Color Palette ──────────────────────────────────────────────────
COLOR_BG = "#0c0d11"          # 3b1b dark background
COLOR_LINE = "#E0E0E0"        # High contrast mechanical / wire framework
COLOR_AXIS = "#707070"        # Coordinate axes & grid
COLOR_PRIMARY = "#58C4DD"     # BLUE_C: Primary physical signal / input
COLOR_SECONDARY = "#FC6255"   # RED_C: Secondary signal / response / reflection
COLOR_HIGHLIGHT = "#FFFF00"   # PURE_YELLOW: Core synthesis / hero state
COLOR_ENVELOPE = "#5CD0B3"    # TEAL_C: Geometric boundary / envelope
COLOR_ACCENT_1 = "#83C167"    # GREEN_C: Constructive feature / antinode / peak
COLOR_ACCENT_2 = "#FF8C00"    # ORANGE: Destructive feature / node / null

# ── Unified Typography Scale ────────────────────────────────────────────────
FS_TITLE = 34
FS_SUBTITLE = 22
FS_FORMULA_HERO = 36
FS_FORMULA_MAIN = 30
FS_FORMULA_SEC = 24
FS_BODY_LARGE = 22
FS_BODY_NORMAL = 20
FS_TAG = 18

def safe_chinese_text(text, font_size=FS_BODY_NORMAL, color=WHITE):
    """Render Chinese text safely with Microsoft YaHei."""
    return Text(text, font="Microsoft YaHei", font_size=font_size, color=color)

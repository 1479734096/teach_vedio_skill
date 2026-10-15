"""Scene Template for physics-manim-video.
Duration: 10.0s
"""
from manim import *
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(__file__))
from style import *

class Scene1_Introduction(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG

        # ── 1. Title (0.0s - 1.0s) ──────────────────────────────────
        title = Text("教学场景标题", font="Microsoft YaHei", font_size=FS_TITLE, color=WHITE)
        title.to_edge(UP, buff=0.35)
        self.play(FadeIn(title, shift=DOWN*0.2), run_time=1.0)

        # ── 2. Parameter-Driven Dynamic Evolution (1.0s - 7.0s) ─────
        t_tracker = ValueTracker(0.0)

        # Dynamically redrawn curve strictly bound to t_tracker
        wave_curve = always_redraw(lambda: FunctionGraph(
            lambda x: np.sin(x - t_tracker.get_value()),
            x_range=[-5.0, 5.0, 0.05],
            color=COLOR_PRIMARY,
            stroke_width=3.5
        ))

        self.play(Create(wave_curve), run_time=1.0)
        self.play(t_tracker.animate.set_value(5.0), run_time=5.0, rate_func=linear)

        # ── 3. Pedagogical Takeaway Hold (7.0s - 10.0s) ─────────────
        formula = MathTex(r"f(x, t) = \sin(kx - \omega t)", font_size=FS_FORMULA_MAIN, color=COLOR_HIGHLIGHT)
        formula.shift(DOWN*2.2)
        self.play(Write(formula), run_time=1.5)
        self.wait(1.5)
        # Total duration = 1.0 + 1.0 + 5.0 + 1.5 + 1.5 = 10.0s!

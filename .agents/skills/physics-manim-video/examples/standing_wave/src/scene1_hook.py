"""Scene 1: Hook & Traveling Wave Reflection (Standing Wave Regression)
Duration: 10.0s
"""
from manim import *
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(__file__))
from style import *

class Scene1_Hook(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG

        # ── 1. Title & Header (0.0s - 1.5s) ──────────────────────────
        title = title_label("《传输线中的驻波是如何形成的？》", font="Microsoft YaHei", font_size=FS_TITLE, color=WHITE)
        title.to_edge(UP, buff=0.35)
        subtitle = title_label("——从行波干涉到时空解耦", font="Microsoft YaHei", font_size=FS_SUBTITLE, color=GREY_B)
        subtitle.next_to(title, DOWN, buff=0.15)

        self.play(FadeIn(title, shift=DOWN*0.2), FadeIn(subtitle, shift=DOWN*0.2), run_time=1.2)

        # ── 2. Transmission Line Model (1.2s - 2.5s) ─────────────────
        y_center = -0.15
        t_line = make_transmission_line(y_offset=y_center, wire_sep=2.4)
        
        gamma_badge = MathTex(r"\Gamma_L = +1", font_size=FS_FORMULA_MAIN, color=YELLOW)
        gamma_badge.next_to(t_line[6], DOWN, buff=0.18)

        self.play(
            Create(t_line[0]), Create(t_line[1]), Create(t_line[2]),
            FadeIn(t_line[3]), FadeIn(t_line[4]), Create(t_line[5]),
            FadeIn(t_line[6]), FadeIn(gamma_badge),
            run_time=1.3
        )
        # Total so far: 2.5s

        # ── 3. Incident Traveling Wave (2.5s - 5.5s) ──────────────────
        t_tracker = ValueTracker(0.0)

        label_inc = MathTex(r"u_i(x, t) = A \cos(\omega t - \beta x)", font_size=FS_FORMULA_MAIN, color=COLOR_INCIDENT)
        label_inc.to_corner(UL, buff=0.8).shift(DOWN*0.5)

        curve_i = always_redraw(lambda: FunctionGraph(
            lambda x: y_center + incident_wave(x, t_tracker.get_value()) * 0.75,
            x_range=[X_SOURCE, X_TERM, 0.04],
            color=COLOR_INCIDENT,
            stroke_width=3.6
        ))
        audit_graph(curve_i, 'incident', t_tracker, kind='curve')

        self.play(FadeIn(label_inc), Create(curve_i), run_time=0.8)
        self.play(t_tracker.animate.set_value(2.2), run_time=2.2, rate_func=linear)
        # Total so far: 5.5s

        # ── 4. Reflected Traveling Wave (5.5s - 8.0s) ─────────────────
        label_ref = MathTex(r"u_r(x, t) = A \cos(\omega t + \beta x)", font_size=FS_FORMULA_MAIN, color=COLOR_REFLECTED)
        label_ref.to_corner(UR, buff=0.8).shift(DOWN*0.5)

        curve_r = always_redraw(lambda: FunctionGraph(
            lambda x: y_center + reflected_wave(x, t_tracker.get_value()) * 0.75,
            x_range=[X_SOURCE, X_TERM, 0.04],
            color=COLOR_REFLECTED,
            stroke_width=3.2
        ))
        audit_graph(curve_r, 'reflected', t_tracker, kind='curve')

        self.play(FadeIn(label_ref), Create(curve_r), run_time=0.7)
        self.play(t_tracker.animate.set_value(4.0), run_time=1.8, rate_func=linear)
        # Total so far: 8.0s

        # ── 5. Hook Question (8.0s - 10.0s) ───────────────────────────
        hook_box = RoundedRectangle(width=9.2, height=0.85, corner_radius=0.12, color=YELLOW, fill_color=BLACK, fill_opacity=0.92, stroke_width=2.0)
        hook_box.move_to([0, -2.5, 0])
        hook_text = Text("当两列等幅、反向行波叠加，波形将呈现怎样的状态？", font="Microsoft YaHei", font_size=FS_BODY_LARGE, color=YELLOW)
        hook_text.move_to(hook_box)
        hook_grp = VGroup(hook_box, hook_text)

        self.play(FadeIn(hook_grp, shift=UP*0.2), t_tracker.animate.set_value(5.5), run_time=1.5, rate_func=linear)
        self.wait(0.5)
        # Total duration = 1.2 + 1.3 + 0.8 + 2.2 + 0.7 + 1.8 + 1.5 + 0.5 = 10.0s!

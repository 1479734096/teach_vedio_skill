"""Scene 2: Dynamic Flip, Slide, and Area Integration Demonstration (Test 3)
Duration: 14.0s
"""
from manim import *
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(__file__))
from style import *

class Scene2_FlipSlide(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG

        # ── 1. Title (0.0s - 0.8s) ──────────────────────────────────
        title = title_label("几何演化：滑移相乘与重叠面积积分", font="Microsoft YaHei", font_size=FS_TITLE, color=WHITE)
        title.to_edge(UP, buff=0.35)
        self.play(FadeIn(title, shift=DOWN*0.2), run_time=0.8)

        # ── 2. Upper Track: Tau Axis & Dual Pulses (0.8s - 3.5s) ───────
        y_top = 1.3
        x_min, x_max = -4.5, 4.5
        tau_axis = Line([x_min, y_top, 0], [x_max, y_top, 0], color=COLOR_AXIS, stroke_width=1.8)
        tau_tag = Text("τ 积分轴", font="Microsoft YaHei", font_size=FS_TAG, color=GREY_A).next_to([x_max, y_top, 0], RIGHT, buff=0.15)

        # Stationary Pulse f(tau) centered at 0, width 2.0, height 1.2
        f_box = Rectangle(width=2.0, height=1.2, color=COLOR_F, fill_color=COLOR_F, fill_opacity=0.35, stroke_width=2.2)
        audit_graph(f_box, 'f', None, kind='pulse')
        f_box.move_to([0, y_top + 0.6, 0])
        f_label = MathTex(r"f(\tau)", font_size=FS_FORMULA_SEC, color=COLOR_F).next_to(f_box, UP, buff=0.1)

        # ValueTracker for t (sliding parameter)
        t_tracker = ValueTracker(-3.0)

        # Dynamic Sliding Pulse g(t - tau) centered at t
        def get_g_box():
            t = t_tracker.get_value()
            box = Rectangle(width=2.0, height=1.2, color=COLOR_G, fill_color=COLOR_G, fill_opacity=0.35, stroke_width=2.2)
            box.move_to([t, y_top + 0.6, 0])
            lbl = MathTex(r"g(t - \tau)", font_size=FS_FORMULA_SEC, color=COLOR_G).next_to(box, DOWN, buff=0.15)
            return VGroup(box, lbl)

        g_group = always_redraw(get_g_box)
        audit_graph(g_group, 'g', t_tracker, kind='pulse')

        # Dynamic Overlap Shading
        def get_overlap():
            t = t_tracker.get_value()
            left = max(-1.0, t - 1.0)
            right = min(1.0, t + 1.0)
            if right > left:
                w = right - left
                mid = (left + right) / 2.0
                ov = Rectangle(width=w, height=1.2, color=COLOR_OVERLAP, fill_color=COLOR_OVERLAP, fill_opacity=0.7, stroke_width=0)
                ov.move_to([mid, y_top + 0.6, 0])
                return ov
            return VMobject()

        overlap_rect = always_redraw(get_overlap)

        # ── 3. Lower Track: Time t Axis & Output Convolution (0.8s - 3.5s) ───
        y_bot = -1.8
        t_axis = Line([x_min, y_bot, 0], [x_max, y_bot, 0], color=COLOR_AXIS, stroke_width=1.8)
        t_tag = Text("t 时间轴", font="Microsoft YaHei", font_size=FS_TAG, color=YELLOW).next_to([x_max, y_bot, 0], RIGHT, buff=0.15)

        # Convolution Triangle: from t=-2 to t=+2, peak at t=0 with height 1.2
        # Points: (-2, y_bot), (0, y_bot + 1.2), (2, y_bot)
        conv_triangle = Polygon(
            [-2.0, y_bot, 0],
            [0.0, y_bot + 1.2, 0],
            [2.0, y_bot, 0],
            color=COLOR_CONV, fill_color=COLOR_CONV, fill_opacity=0.25, stroke_width=2.8
        )
        audit_graph(conv_triangle, 'triangle', None, kind='curve')
        conv_math = MathTex(r"(f * g)(t)", font_size=FS_FORMULA_SEC, color=COLOR_CONV)
        conv_txt = Text("(三角脉冲)", font="Microsoft YaHei", font_size=FS_TAG, color=COLOR_CONV)
        conv_label = VGroup(conv_math, conv_txt).arrange(RIGHT, buff=0.1).next_to(conv_triangle, UP, buff=0.12)

        # Dynamic Tracer Dot on Convolution Curve
        def get_tracer():
            t = t_tracker.get_value()
            val = max(0.0, 2.0 - abs(t)) * (1.2 / 2.0)  # scale to match height
            pt = [t, y_bot + val, 0]
            dot = Dot(pt, radius=0.09, color=COLOR_CONV)
            # Connecting dashed line between top moving pulse and bottom tracer
            line = DashedLine([t, y_top, 0], pt, color=GREY_B, stroke_width=1.5, dash_length=0.1)
            return VGroup(line, dot)

        tracer_group = always_redraw(get_tracer)
        audit_graph(tracer_group, 'output', t_tracker, kind='point')

        self.play(
            Create(tau_axis), FadeIn(tau_tag), Create(f_box), FadeIn(f_label),
            Create(t_axis), FadeIn(t_tag), Create(conv_triangle), FadeIn(conv_label),
            Create(g_group), Create(overlap_rect), Create(tracer_group),
            run_time=2.7
        )
        # Total so far: 3.5s

        # ── 4. Slide Parameter t Across Pulse (3.5s - 11.5s) ───────────
        # Slide from t = -3.0 to t = 0.0 (entry and peak overlap)
        self.play(t_tracker.animate.set_value(0.0), run_time=4.0, rate_func=linear)
        # Total so far: 7.5s

        # Callout card at peak
        callout_box = RoundedRectangle(width=8.0, height=0.68, corner_radius=0.1, color=COLOR_OVERLAP, fill_color="#0e1512", fill_opacity=0.95, stroke_width=2.0)
        callout_box.shift(UP*0.35)
        callout_txt = Text("t = 0 完全重叠：相乘面积达到最大峰值 2.0！", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=COLOR_OVERLAP)
        callout_txt.move_to(callout_box)
        callout_grp = VGroup(callout_box, callout_txt)

        self.play(FadeIn(callout_grp, shift=UP*0.1), run_time=1.0)
        self.wait(1.0)
        # Total so far: 9.5s

        # Slide from t = 0.0 to t = +3.0 (exit overlap)
        self.play(
            FadeOut(callout_grp),
            t_tracker.animate.set_value(3.0),
            run_time=4.5,
            rate_func=linear
        )
        # Total duration = 0.8 + 2.7 + 4.0 + 1.0 + 1.0 + 4.5 = 14.0s!

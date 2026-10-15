"""Scene 2: Rotating Epicycles & Real-Time Waveform Synthesis
Duration: 14.0s
"""
from manim import *
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(__file__))
from style import *

class Scene2_Epicycles(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG

        # ── 1. Title (0.0s - 0.8s) ──────────────────────────────────
        title = title_label("向量几何：三个旋转分量的链式叠加", font="Microsoft YaHei", font_size=FS_TITLE, color=WHITE)
        title.to_edge(UP, buff=0.35)
        self.play(FadeIn(title, shift=DOWN*0.2), run_time=0.8)

        # ── 2. Epicycle Setup (0.8s - 3.0s) ─────────────────────────
        center_x = -4.0
        center_y = 0.0
        center = np.array([center_x, center_y, 0])

        t_tracker = ValueTracker(0.0)

        # Axis on the right for waveform display
        x_wave_start = -1.2
        x_wave_end = 5.8
        wave_axis = Line([x_wave_start, 0, 0], [x_wave_end, 0, 0], color=COLOR_AXIS, stroke_width=1.8)
        axis_label = Text("时间轴 t ->", font="Microsoft YaHei", font_size=FS_TAG, color=GREY_A).next_to([x_wave_end, 0, 0], DOWN, buff=0.15)

        # Legend on top
        leg1 = Text("● n=1 基波", font="Microsoft YaHei", font_size=FS_TAG, color=COLOR_FUNDAMENTAL)
        leg2 = Text("● n=3 三次", font="Microsoft YaHei", font_size=FS_TAG, color=COLOR_H3)
        leg3 = Text("● n=5 五次", font="Microsoft YaHei", font_size=FS_TAG, color=COLOR_H5)
        legend_grp = VGroup(leg1, leg2, leg3).arrange(RIGHT, buff=0.4).shift(UP*2.7 + RIGHT*1.5)

        # Dynamic Epicycles (Circles + Vectors)
        def get_epicycle_mobjects():
            t = t_tracker.get_value()
            pts = get_epicycle_points(center, t)
            
            c1 = Circle(radius=HARMONICS[0]["radius"], color=COLOR_CIRCLE, stroke_width=1.5).move_to(pts[0])
            v1 = Arrow(pts[0], pts[1], buff=0, color=COLOR_FUNDAMENTAL, stroke_width=2.8, max_tip_length_to_length_ratio=0.25)
            
            c2 = Circle(radius=HARMONICS[1]["radius"], color=COLOR_CIRCLE, stroke_width=1.2).move_to(pts[1])
            v2 = Arrow(pts[1], pts[2], buff=0, color=COLOR_H3, stroke_width=2.4, max_tip_length_to_length_ratio=0.25)
            
            c3 = Circle(radius=HARMONICS[2]["radius"], color=COLOR_CIRCLE, stroke_width=1.0).move_to(pts[2])
            v3 = Arrow(pts[2], pts[3], buff=0, color=COLOR_H5, stroke_width=2.0, max_tip_length_to_length_ratio=0.25)
            
            pen_dot = Dot(pts[3], radius=0.08, color=COLOR_SUM)
            
            # Lead line from pen to wave start
            lead_line = DashedLine(pts[3], [x_wave_start, pts[3][1], 0], color=COLOR_LEAD, stroke_width=1.5, dash_length=0.1)
            lead_dot = Dot([x_wave_start, pts[3][1], 0], radius=0.06, color=COLOR_LEAD)

            return VGroup(c1, v1, c2, v2, c3, v3, pen_dot, lead_line, lead_dot)

        epicycles = always_redraw(get_epicycle_mobjects)
        audit_graph(epicycles, 'epicycles', t_tracker, kind='vectors')

        # Dynamic Synthesized Waveform (moving horizontally to the right)
        def get_wave_curve():
            t = t_tracker.get_value()
            # Plot y as function of screen x: phase is (t - (x - x_wave_start)*speed)
            curve = FunctionGraph(
                lambda x: fourier_square_wave(t - (x - x_wave_start) * 1.5, n_terms=3),
                x_range=[x_wave_start, x_wave_end, 0.04],
                color=COLOR_SUM,
                stroke_width=3.6
            )
            return curve

        wave_curve = always_redraw(get_wave_curve)
        audit_graph(wave_curve, 'fourier', t_tracker, kind='curve')

        self.play(
            Create(wave_axis), FadeIn(axis_label), FadeIn(legend_grp),
            Create(epicycles), Create(wave_curve),
            run_time=2.2
        )
        # Total so far: 3.0s

        # ── 3. Continuous Harmonic Motion (3.0s - 10.5s) ───────────────
        self.play(t_tracker.animate.set_value(5.0), run_time=5.0, rate_func=linear)
        # Total so far: 8.0s

        # Callout card explaining constructive sharpening of edges
        callout_card = RoundedRectangle(width=6.6, height=0.72, corner_radius=0.1, color=COLOR_SUM, fill_color="#0e131d", fill_opacity=0.95, stroke_width=2.0)
        callout_card.move_to([2.2, -2.6, 0])
        callout_txt = Text("高频谐波快速旋转：拉直平台，陡峭边沿！", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=YELLOW)
        callout_txt.move_to(callout_card)
        callout_grp = VGroup(callout_card, callout_txt)

        self.play(FadeIn(callout_grp, shift=UP*0.15), t_tracker.animate.set_value(7.5), run_time=2.5, rate_func=linear)
        # Total so far: 10.5s

        # ── 4. Final Evolution & Stabilize (10.5s - 14.0s) ─────────────
        self.play(t_tracker.animate.set_value(11.0), run_time=3.5, rate_func=linear)
        # Total duration = 0.8 + 2.2 + 5.0 + 2.5 + 3.5 = 14.0s!

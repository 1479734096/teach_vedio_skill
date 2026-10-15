"""Scene 2: Mathematical Derivation & Spatial-Temporal Decoupling (Standing Wave Regression)
Duration: 12.0s
"""
from manim import *
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(__file__))
from style import *

class Scene2_Derivation(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG

        # ── 1. Title (0.0s - 0.8s) ──────────────────────────────────
        title = title_label("数学本质：三角和差化积与时空解耦", font="Microsoft YaHei", font_size=FS_TITLE, color=WHITE)
        title.to_edge(UP, buff=0.35)
        self.play(FadeIn(title, shift=DOWN*0.2), run_time=0.8)

        # ── 2. Traveling Waves & Superposition (0.8s - 3.5s) ──────────
        eq1 = MathTex(r"u_i = A \cos(\omega t - \beta x)", font_size=FS_FORMULA_MAIN, color=COLOR_INCIDENT)
        eq2 = MathTex(r"u_r = A \cos(\omega t + \beta x)", font_size=FS_FORMULA_MAIN, color=COLOR_REFLECTED)
        eq_pair = VGroup(eq1, eq2).arrange(RIGHT, buff=1.0).shift(UP*2.5)

        self.play(FadeIn(eq1, shift=RIGHT*0.2), FadeIn(eq2, shift=LEFT*0.2), run_time=1.0)

        eq_sum = MathTex(
            r"u(x, t) = u_i + u_r = A \cos(\omega t - \beta x) + A \cos(\omega t + \beta x)",
            font_size=FS_FORMULA_SEC + 4
        ).shift(UP*1.7)
        eq_sum.set_color_by_tex(r"u_i", COLOR_INCIDENT)
        eq_sum.set_color_by_tex(r"u_r", COLOR_REFLECTED)

        self.play(Write(eq_sum), run_time=1.7)
        # Total so far: 3.5s

        # ── 3. Trig Identity & Clean Replacement (3.5s - 6.0s) ───────
        trig_box = RoundedRectangle(width=9.2, height=0.65, corner_radius=0.1, color=GREY_B, fill_color=BLACK, fill_opacity=0.9, stroke_width=1.5).shift(UP*0.92)
        trig_text = Text("和差化积公式: ", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=WHITE)
        trig_math = MathTex(r"\cos(\alpha - \delta) + \cos(\alpha + \delta) = 2 \cos\delta \cos\alpha", font_size=FS_FORMULA_SEC + 2, color=YELLOW)
        trig_grp = VGroup(trig_box, VGroup(trig_text, trig_math).arrange(RIGHT, buff=0.15).move_to(trig_box))

        self.play(FadeIn(trig_grp, shift=UP*0.1), run_time=0.8)

        # Hero Standing Wave Formula at UP*0.12
        eq_standing = MathTex(
            r"u(x, t) =",
            r"2A \cos(\beta x)",
            r"\cos(\omega t)",
            font_size=FS_FORMULA_HERO
        ).shift(UP*0.12)
        eq_standing[0].set_color(COLOR_STANDING)
        eq_standing[1].set_color(COLOR_ENVELOPE)
        eq_standing[2].set_color(YELLOW)

        self.play(
            FadeOut(eq_sum, shift=DOWN*0.1),
            Write(eq_standing),
            run_time=1.7
        )
        # Total so far: 6.0s

        # ── 4. Spatial-Temporal Decoupling Boxes (6.0s - 8.5s) ─────────
        box_space = SurroundingRectangle(eq_standing[1], color=COLOR_ENVELOPE, buff=0.08, stroke_width=2.0)
        label_space = Text("空间振幅因子 (决定包络)", font="Microsoft YaHei", font_size=FS_TAG, color=COLOR_ENVELOPE).next_to(box_space, DOWN, buff=0.25).shift(LEFT*0.9)

        box_time = SurroundingRectangle(eq_standing[2], color=YELLOW, buff=0.08, stroke_width=2.0)
        label_time = Text("时间振荡因子 (整体同步)", font="Microsoft YaHei", font_size=FS_TAG, color=YELLOW).next_to(box_time, DOWN, buff=0.25).shift(RIGHT*0.9)

        self.play(
            Create(box_space), FadeIn(label_space),
            Create(box_time), FadeIn(label_time),
            run_time=1.3
        )

        insight_box = RoundedRectangle(width=9.6, height=0.62, corner_radius=0.1, color=GREEN_C, fill_color="#0a1a12", fill_opacity=0.95, stroke_width=2).shift(DOWN*1.36)
        insight_txt = Text("空间因子与时间因子彻底解耦 —— 驻波！", font="Microsoft YaHei", font_size=FS_BODY_LARGE - 2, color=WHITE).move_to(insight_box)
        self.play(FadeIn(VGroup(insight_box, insight_txt), shift=UP*0.15), run_time=1.2)
        # Total so far: 8.5s

        # ── 5. Live Mini Standing Wave Verification (8.5s - 12.0s) ────
        t_tracker = ValueTracker(0.0)
        y_mini = -2.85
        mini_axis = Line([-4.5, y_mini, 0], [X_TERM, y_mini, 0], color=COLOR_AXIS, stroke_width=1.5)
        mini_term = Text("开路端 x=0", font="Microsoft YaHei", font_size=FS_TAG, color=WHITE).next_to([X_TERM, y_mini, 0], RIGHT, buff=0.15)
        
        mini_wave = always_redraw(lambda: FunctionGraph(
            lambda x: y_mini + standing_wave(x, t_tracker.get_value()) * 0.22,
            x_range=[-4.5, X_TERM, 0.04],
            color=COLOR_STANDING,
            stroke_width=3.0
        ))
        audit_graph(mini_wave, 'standing_mini', t_tracker, kind='curve')

        self.play(Create(mini_axis), FadeIn(mini_term), Create(mini_wave), run_time=0.8)
        self.play(t_tracker.animate.set_value(2.7), run_time=2.7, rate_func=linear)
        # Total duration = 0.8 + 1.0 + 1.7 + 0.8 + 1.7 + 1.3 + 1.2 + 0.8 + 2.7 = 12.0s!

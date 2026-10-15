"""Scene 1: Convolution Mathematical Definition & 4-Step Intuition (Test 3)
Duration: 8.0s
"""
from manim import *
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(__file__))
from style import *

class Scene1_Definition(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG

        # ── 1. Title (0.0s - 1.2s) ──────────────────────────────────
        title = title_label("《卷积的物理与几何本质》", font="Microsoft YaHei", font_size=FS_TITLE, color=WHITE)
        title.to_edge(UP, buff=0.38)
        subtitle = title_label("——翻转、平移、逐点相乘与面积积分", font="Microsoft YaHei", font_size=FS_SUBTITLE, color=GREY_B)
        subtitle.next_to(title, DOWN, buff=0.15)

        self.play(FadeIn(title, shift=DOWN*0.2), FadeIn(subtitle, shift=DOWN*0.2), run_time=1.2)

        # ── 2. Hero Formula (1.2s - 4.2s) ───────────────────────────
        formula = MathTex(
            r"(f * g)(t) = \int_{-\infty}^{\infty}",
            r"f(\tau)",
            r"g(t - \tau)",
            r"d\tau",
            font_size=FS_FORMULA_HERO
        ).shift(UP*1.2)
        formula[0].set_color(COLOR_CONV)
        formula[1].set_color(COLOR_F)
        formula[2].set_color(COLOR_G)

        self.play(Write(formula), run_time=2.0)
        self.wait(1.0)
        # Total so far: 4.2s

        # ── 3. Four Core Steps Breakdown (4.2s - 8.0s) ───────────────
        steps_card = RoundedRectangle(width=10.6, height=1.6, corner_radius=0.15, color=COLOR_LINE, fill_color="#0e131d", fill_opacity=0.92, stroke_width=1.8).shift(DOWN*1.1)

        s1 = Text("① 换元：以 τ 为积分变量", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=WHITE)
        s2 = Text("② 翻转：将 g(τ) 左右镜像为 g(-τ)", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=COLOR_G)
        s3 = Text("③ 平移：向右平移 t 距离得到 g(t - τ)", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=COLOR_G)
        s4 = Text("④ 积分：计算两信号重叠乘积的面积", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=COLOR_OVERLAP)

        grid = VGroup(
            VGroup(s1, s2).arrange(RIGHT, buff=0.8),
            VGroup(s3, s4).arrange(RIGHT, buff=0.8)
        ).arrange(DOWN, buff=0.25).move_to(steps_card)

        self.play(Create(steps_card), FadeIn(grid, shift=UP*0.1), run_time=1.8)
        self.wait(2.0)
        # Total duration = 1.2 + 2.0 + 1.0 + 1.8 + 2.0 = 8.0s!

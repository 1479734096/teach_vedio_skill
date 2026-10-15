"""Scene 1: Fourier Series Mathematical Concept & Harmonic Expansion
Duration: 8.0s
"""
from manim import *
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(__file__))
from style import *

class Scene1_Concept(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG

        # ── 1. Title (0.0s - 1.2s) ──────────────────────────────────
        title = title_label("《傅里叶级数：旋转向量如何合成方波？》", font="Microsoft YaHei", font_size=FS_TITLE, color=WHITE)
        title.to_edge(UP, buff=0.38)
        subtitle = title_label("——正弦分量的几何叠加与周期信号合成", font="Microsoft YaHei", font_size=FS_SUBTITLE, color=GREY_B)
        subtitle.next_to(title, DOWN, buff=0.15)

        self.play(FadeIn(title, shift=DOWN*0.2), FadeIn(subtitle, shift=DOWN*0.2), run_time=1.2)

        # ── 2. Target Square Wave & Problem Statement (1.2s - 4.0s) ───
        target_box = RoundedRectangle(width=9.6, height=1.0, corner_radius=0.12, color=COLOR_SUM, fill_color="#0f141d", fill_opacity=0.9, stroke_width=2.0)
        target_box.shift(UP*1.4)
        target_txt = Text("目标：能否仅用纯正弦波，完美拼接出一个棱角分明的方波？", font="Microsoft YaHei", font_size=FS_BODY_LARGE, color=YELLOW)
        target_txt.move_to(target_box)
        target_grp = VGroup(target_box, target_txt)

        self.play(FadeIn(target_grp, shift=UP*0.2), run_time=1.3)
        self.wait(1.5)
        # Total so far: 4.0s

        # ── 3. Harmonic Series Formula (4.0s - 8.0s) ─────────────────
        formula_hero = MathTex(
            r"f(t) = \frac{4}{\pi} \left[ ",
            r"\sin(\omega_0 t)",
            r" + \frac{1}{3}\sin(3\omega_0 t)",
            r" + \frac{1}{5}\sin(5\omega_0 t)",
            r" + \dots \right]",
            font_size=FS_FORMULA_MAIN
        ).shift(DOWN*0.4)
        
        formula_hero[1].set_color(COLOR_FUNDAMENTAL)  # 基波 蓝
        formula_hero[2].set_color(COLOR_H3)           # 3次谐波 红
        formula_hero[3].set_color(COLOR_H5)           # 5次谐波 绿

        formula_tag = Text("奇次谐波幅度按 1/n 衰减，频率按奇数倍递增", font="Microsoft YaHei", font_size=FS_TAG + 1, color=GREY_A)
        formula_tag.next_to(formula_hero, DOWN, buff=0.35)

        self.play(Write(formula_hero), run_time=2.2)
        self.play(FadeIn(formula_tag), run_time=0.8)
        self.wait(1.0)
        # Total duration = 1.2 + 1.3 + 1.5 + 2.2 + 0.8 + 1.0 = 8.0s!

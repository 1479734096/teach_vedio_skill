"""Scene 3: Fourier Series Physical Takeaway & Summary (Test 2)
Duration: 8.0s
"""
from manim import *
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(__file__))
from style import *

class Scene3_Summary(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG

        # ── 1. Live Background Wave ──────────────────────────────────
        t_tracker = ValueTracker(0.0)
        bg_wave = always_redraw(lambda: FunctionGraph(
            lambda x: fourier_square_wave(x + t_tracker.get_value(), n_terms=3) * 0.45,
            x_range=[-6.5, 6.5, 0.05],
            color=COLOR_SUM,
            stroke_width=2.2,
            stroke_opacity=0.28
        ))
        audit_graph(bg_wave, 'background', t_tracker, kind='curve')
        self.add(bg_wave)

        # Title
        title = title_label("傅里叶级数核心本质总结", font="Microsoft YaHei", font_size=FS_TITLE, color=WHITE)
        title.to_edge(UP, buff=0.38)
        self.play(FadeIn(title, shift=DOWN*0.2), run_time=0.8)

        # ── 2. Summary Card (0.8s - 5.5s) ─────────────────────────────
        card = RoundedRectangle(
            width=11.2, height=4.2, corner_radius=0.18,
            color=COLOR_FUNDAMENTAL, fill_color="#0a0d14", fill_opacity=0.94, stroke_width=2.2
        ).shift(DOWN*0.25)

        item1 = VGroup(
            Dot(color=COLOR_FUNDAMENTAL, radius=0.09),
            Text("基底正交性：不同频率正弦波彼此正交，频域各谱线独立互不干扰", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=WHITE)
        ).arrange(RIGHT, buff=0.15)

        item2 = VGroup(
            Dot(color=COLOR_H3, radius=0.09),
            Text("能量集中性 (Parseval 定理)：仅前 3 项奇次谐波即已捕获方波 93.3% 的总能量", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=WHITE)
        ).arrange(RIGHT, buff=0.15)

        item3 = VGroup(
            Dot(color=COLOR_H5, radius=0.09),
            Text("几何本质：时域的任意复杂周期信号，在频域均等价于旋转向量的链式叠加", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=WHITE)
        ).arrange(RIGHT, buff=0.15)

        items_grp = VGroup(item1, item2, item3).arrange(DOWN, buff=0.45, aligned_edge=LEFT).move_to(card)

        self.play(Create(card), t_tracker.animate.set_value(1.2), run_time=1.2)
        self.play(
            LaggedStart(
                FadeIn(item1, shift=RIGHT*0.2),
                FadeIn(item2, shift=RIGHT*0.2),
                FadeIn(item3, shift=RIGHT*0.2),
                lag_ratio=0.3
            ),
            t_tracker.animate.set_value(4.2),
            run_time=3.5,
            rate_func=linear
        )
        # Total so far: 5.5s

        # ── 3. Final Hold & Smooth Rotation (5.5s - 8.0s) ─────────────
        footer = Text("3Blue1Brown Style Math Explainer • Fourier Analysis", font_size=FS_TAG, color=GREY_B)
        footer.to_edge(DOWN, buff=0.8)
        self.play(FadeIn(footer), t_tracker.animate.set_value(6.7), run_time=2.5, rate_func=linear)
        # Total duration = 0.8 + 1.2 + 3.5 + 2.5 = 8.0s!

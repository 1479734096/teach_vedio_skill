"""Scene 3: Convolution Properties & Takeaways Summary (Test 3)
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

        # ── 1. Live Background Convolution Pulse ─────────────────────
        t_tracker = ValueTracker(0.0)
        bg_tri = always_redraw(lambda: Polygon(
            [-2.5 + 0.3*np.sin(t_tracker.get_value()), -0.2, 0],
            [0.0 + 0.3*np.sin(t_tracker.get_value()), 1.8, 0],
            [2.5 + 0.3*np.sin(t_tracker.get_value()), -0.2, 0],
            color=COLOR_CONV, fill_color=COLOR_CONV, fill_opacity=0.15, stroke_width=2.0
        ))
        self.add(bg_tri)

        # Title
        title = title_label("卷积运算核心物理性质总结", font="Microsoft YaHei", font_size=FS_TITLE, color=WHITE)
        title.to_edge(UP, buff=0.38)
        self.play(FadeIn(title, shift=DOWN*0.2), run_time=0.8)

        # ── 2. Summary Card (0.8s - 5.5s) ─────────────────────────────
        card = RoundedRectangle(
            width=11.2, height=4.2, corner_radius=0.18,
            color=COLOR_F, fill_color="#0a0d14", fill_opacity=0.94, stroke_width=2.2
        ).shift(DOWN*0.25)

        item1 = VGroup(
            Dot(color=COLOR_F, radius=0.09),
            Text("代数交换律：f * g = g * f，无论是翻转滑移 f 还是 g，输出曲线绝对完全重合", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=WHITE)
        ).arrange(RIGHT, buff=0.15)

        item2 = VGroup(
            Dot(color=COLOR_OVERLAP, radius=0.09),
            Text("总面积乘积性：输出信号总面积严格等于输入两信号面积的乘积 (2 × 2 = 4)", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=WHITE)
        ).arrange(RIGHT, buff=0.15)

        item3 = VGroup(
            Dot(color=COLOR_CONV, radius=0.09),
            Text("物理系统意义：任何 LTI 系统的输出，本质上都是输入激励对系统冲激响应的加权叠加", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=WHITE)
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

        # ── 3. Final Hold & Footer (5.5s - 8.0s) ──────────────────────
        footer = Text("3Blue1Brown Style Math Explainer • Convolution & LTI Systems", font_size=FS_TAG, color=GREY_B)
        footer.to_edge(DOWN, buff=0.8)
        self.play(FadeIn(footer), t_tracker.animate.set_value(6.7), run_time=2.5, rate_func=linear)
        # Total duration = 0.8 + 1.2 + 3.5 + 2.5 = 8.0s!

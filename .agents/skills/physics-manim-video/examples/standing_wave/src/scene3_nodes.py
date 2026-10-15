"""Scene 3: Voltage Nodes, Antinodes & Physical Summary (Standing Wave Regression)
Duration: 10.0s
"""
from manim import *
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(__file__))
from style import *

class Scene3_Nodes(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG

        # ── 1. Title (0.0s - 0.8s) ──────────────────────────────────
        title = title_label("驻波的空间分布：波腹、波节与特征边界", font="Microsoft YaHei", font_size=FS_TITLE, color=WHITE)
        title.to_edge(UP, buff=0.35)
        self.play(FadeIn(title, shift=DOWN*0.2), run_time=0.8)

        # ── 2. Transmission Line Model & Pulsating Wave (0.8s - 4.5s) ───
        y_base = -0.55
        t_line = make_transmission_line(y_offset=y_base, wire_sep=2.8)
        
        t_tracker = ValueTracker(0.0)
        wave_scale = 0.58

        env_up = DashedVMobject(FunctionGraph(
            lambda x: y_base + envelope_upper(x) * wave_scale,
            x_range=[X_SOURCE, X_TERM, 0.04], color=COLOR_ENVELOPE, stroke_width=2.0
        ), num_dashes=50)
        audit_graph(env_up, 'upper', t_tracker, kind='curve')

        env_dn = DashedVMobject(FunctionGraph(
            lambda x: y_base + envelope_lower(x) * wave_scale,
            x_range=[X_SOURCE, X_TERM, 0.04], color=COLOR_ENVELOPE, stroke_width=2.0
        ), num_dashes=50)
        audit_graph(env_dn, 'lower', t_tracker, kind='curve')

        standing_wave_obj = always_redraw(lambda: FunctionGraph(
            lambda x: y_base + standing_wave(x, t_tracker.get_value()) * wave_scale,
            x_range=[X_SOURCE, X_TERM, 0.04], color=COLOR_STANDING, stroke_width=3.6
        ))
        audit_graph(standing_wave_obj, 'standing', t_tracker, kind='curve')

        self.play(Create(t_line), Create(env_up), Create(env_dn), Create(standing_wave_obj), run_time=1.5)
        self.play(t_tracker.animate.set_value(2.2), run_time=2.2, rate_func=linear)
        # Total so far: 4.5s

        # ── 3. Antinode (x=0) & Node (x=-lambda/4) Markers (4.5s - 7.5s) ───
        dot_anti = Dot([X_TERM, y_base, 0], radius=0.12, color=COLOR_ANTINODE)
        audit_graph(dot_anti, 'antinode_marker', t_tracker, kind='point')
        ring_anti = Circle(radius=0.25, color=COLOR_ANTINODE, stroke_width=2.0).move_to(dot_anti)
        label_anti = Text("开路端 x=0: 电压波腹 (2A), 电流波节 (0)", font="Microsoft YaHei", font_size=FS_TAG, color=COLOR_ANTINODE)
        label_anti.move_to([2.4, 1.55, 0])
        arrow_anti = Arrow(label_anti.get_bottom(), dot_anti.get_top(), buff=0.08, color=COLOR_ANTINODE, stroke_width=2.0)

        x_node = X_TERM - WAVELENGTH / 4 # 4.2 - 1.5 = 2.7
        dot_node = Dot([x_node, y_base, 0], radius=0.12, color=COLOR_NODE)
        audit_graph(dot_node, 'node_marker', t_tracker, kind='point')
        ring_node = Circle(radius=0.25, color=COLOR_NODE, stroke_width=2.0).move_to(dot_node)
        label_node = Text("距终端 λ/4: 电压波节 (0 死寂点)", font="Microsoft YaHei", font_size=FS_TAG, color=COLOR_NODE)
        label_node.move_to([-2.2, 1.55, 0])
        arrow_node = Arrow(label_node.get_bottom(), dot_node.get_top(), buff=0.08, color=COLOR_NODE, stroke_width=2.0)

        self.play(
            FadeIn(dot_anti), Create(ring_anti), FadeIn(label_anti), GrowArrow(arrow_anti),
            FadeIn(dot_node), Create(ring_node), FadeIn(label_node), GrowArrow(arrow_node),
            t_tracker.animate.set_value(3.7),
            run_time=1.5,
            rate_func=linear
        )
        self.play(t_tracker.animate.set_value(5.2), run_time=1.5, rate_func=linear)
        # Total so far: 7.5s

        # ── 4. Summary Takeaway Card (7.5s - 10.0s) ───────────────────
        summary_card = RoundedRectangle(width=10.0, height=0.68, corner_radius=0.12, color=COLOR_STANDING, fill_color=BLACK, fill_opacity=0.92, stroke_width=2.2)
        summary_card.to_edge(DOWN, buff=0.8)
        summary_txt = Text("驻波本质：时空解耦，电场能与磁场能在各段就地来回转换，无定向净能量传输！", font="Microsoft YaHei", font_size=FS_BODY_NORMAL, color=COLOR_STANDING)
        summary_txt.move_to(summary_card)
        summary_grp = VGroup(summary_card, summary_txt)

        self.play(FadeIn(summary_grp, shift=UP*0.15), t_tracker.animate.set_value(7.7), run_time=2.5, rate_func=linear)
        # Total duration = 0.8 + 1.5 + 2.2 + 1.5 + 1.5 + 2.5 = 10.0s!

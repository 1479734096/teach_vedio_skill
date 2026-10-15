"""AM 真实测量短探针，不替代 90 秒制作或四档全片验收。"""
from manim import *
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from am_style import *
class AMTeach(Scene):
    def construct(self):
        clock=ValueTracker(0);clock.add_updater(lambda q,dt:q.set_value(self.renderer.time));self.add(clock)
        self.add(equation(STD,24).move_to([0,2.7,0]),equation(ENV,22).move_to([0,2.15,0]))
        for role in ('carrier','signal','upper','lower'):
            obj=always_redraw(lambda role=role:curve(role,clock.get_value(),1.2));audit_graph(obj,role,clock,parameters={'m':1.2});self.add(obj)
        stems=always_redraw(lambda:spectrum(1.2));audit_graph(stems,'spectrum',clock,kind='stems',parameters={'m':1.2});self.add(stems)
        self.wait(2)

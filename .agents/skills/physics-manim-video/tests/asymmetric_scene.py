"""非对称核真实绘图探针，数值输出使用独立密网格积分。"""
from manim import *
import numpy as np
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from qa_runtime import attach_audit
from qa_plot import audit_graph
attach_audit()

F=[[-1,1,1]]
G=[[0,.5,1],[.5,2,.3]]
OMIT_FLIP=False
OUTPUT_ERROR=0.0

def curve(segments,baseline):
    points=[]
    for left,right,height in sorted(segments):
        if not points:points.append([left,baseline,0])
        points.extend([[left,baseline+.8*height,0],[right,baseline+.8*height,0]])
    points.append([sorted(segments)[-1][1],baseline,0])
    return VMobject(stroke_width=3).set_points_as_corners(points)

def value(x,segments):
    return sum(h*((x>=l)&(x<=r)) for l,r,h in segments)

class Scene2_FlipSlide(Scene):
    def construct(self):
        self.camera.background_color='#0c0d11'
        title=Text('非对称核：翻转、平移与实际积分',font='Microsoft YaHei',font_size=30).move_to([0,3.1,0])
        labels=VGroup(MathTex(r'f(\tau)',color=BLUE_C).move_to([-2.5,2.2,0]),MathTex(r'g(t-\tau)',color=RED_C).move_to([2.5,2.2,0]),MathTex(r'(f*g)(t)',color=YELLOW).move_to([3,-2.5,0]))
        clock=ValueTracker(-1)
        fixed=curve(F,1).set_color(BLUE_C);audit_graph(fixed,'f')
        def sliding():
            t=clock.get_value()
            segments=[[t+l,t+r,h] if OMIT_FLIP else [t-r,t-l,h] for l,r,h in G]
            return curve(segments,1).set_color(RED_C)
        moving=always_redraw(sliding);audit_graph(moving,'g',clock)
        def output():
            t=clock.get_value();u=np.linspace(-5,5,20001)
            integral=np.trapezoid(value(u,F)*value(t-u,G),u)+OUTPUT_ERROR
            return Dot([t,-1.8+.7*integral,0],color=YELLOW,radius=.08)
        point=always_redraw(output);audit_graph(point,'output',clock,kind='point')
        self.add(title,labels,Line([-3.5,1,0],[4,1,0],color=GRAY),Line([-3.5,-1.8,0],[4,-1.8,0],color=GRAY),fixed,moving,point)
        self.play(clock.animate.set_value(2.5),run_time=2,rate_func=linear)


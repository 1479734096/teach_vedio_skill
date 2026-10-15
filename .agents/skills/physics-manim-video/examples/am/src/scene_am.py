"""90 秒独立 AM 教学首稿：表达式、推导、调制度与单边余弦幅度谱。"""
from manim import *
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from am_style import *
class AMTeach(Scene):
    def construct(self):
        self.camera.background_color=COLOR_BG
        clock=ValueTracker(0);mod=ValueTracker(0)
        clock.add_updater(lambda q,dt:q.set_value(self.renderer.time))
        self.add(clock,mod)
        title=title_label('调幅 AM：从乘法表达式到载波与边带',font_size=F('title')).to_edge(UP,buff=.35)
        params=Text('Ac = 1 V   fc = 1 kHz   fm = 100 Hz   慢放：每视频秒 = 1 ms 仿真',font=FONT,font_size=F('body')).move_to([0,2.62,0])
        self.play(FadeIn(title),run_time=1.2);self.play(FadeIn(params),run_time=.8)
        form=equation(STD).move_to([0,1.88,0]);envform=equation(ENV,F('formula_secondary')).move_to([0,1.35,0])
        waves=VGroup()
        for role in ('carrier','signal','upper','lower'):
            mob=always_redraw(lambda role=role:curve(role,clock.get_value(),mod.get_value()))
            audit_graph(mob,role,clock,parameters={'m':mod});waves.add(mob)
        axis=Line([-5,-.6,0],[5,-.6,0],color=GRAY,stroke_width=1)
        legend=Text('蓝：载波   黄：AM 信号   青：包络上下边界 ±Eenv',font=FONT,font_size=F('legend')).move_to([0,.94,0])
        xlabels=Text('时间窗 10 ms；窗口随仿真时间移动',font=FONT,font_size=F('body'),color=GRAY_B).move_to([0,-2.13,0])
        indicator=always_redraw(lambda:Text(f'm = {mod.get_value():.2f}',font=FONT,font_size=F('indicator'),color=ORANGE).move_to([5.3,1.35,0]))
        self.add(indicator)
        self.play(Create(axis),Create(waves),Write(form),Write(envform),FadeIn(legend),FadeIn(xlabels),run_time=2)
        self.wait(12)
        self.play(FadeOut(form),run_time=.5)
        product=equation(r's(t)=A_c\cos(2\pi f_c t)+m A_c\cos(2\pi f_m t)\cos(2\pi f_c t)',F('formula_step')).move_to([0,1.88,0])
        self.play(Write(product),run_time=1.5);self.wait(6)
        self.play(FadeOut(product),run_time=.5)
        identity=equation(r'\cos(\alpha)\cos(\beta)=\frac{1}{2}[\cos(\alpha+\beta)+\cos(\alpha-\beta)]',F('formula_step')).move_to([0,1.88,0])
        self.play(Write(identity),run_time=1.5);self.wait(3)
        self.play(FadeOut(identity),run_time=.5)
        expanded=equation(EXP,F('formula_expanded')).move_to([0,1.88,0]);self.play(Write(expanded),run_time=1.5);self.wait(3)
        self.play(FadeOut(expanded),run_time=.5);form=equation(STD).move_to([0,1.88,0]);self.play(Write(form),run_time=1.5)
        for level,hold in ((.6,8),(1,8),(1.2,6)):
            self.play(mod.animate.set_value(level),run_time=2,rate_func=linear);self.wait(hold)
        phase=Text('m > 1：因子可负；实际包络取绝对值，载波相位反转 π',font=FONT,font_size=F('body'),color=ORANGE).move_to([0,-2.68,0])
        self.play(FadeIn(phase),run_time=1);self.wait(3)
        self.play(FadeOut(VGroup(waves,axis,legend,xlabels,phase,form,envform)),run_time=1)
        spec_title=Text('单边余弦幅度谱 · 固定 m 的稳态示例',font=FONT,font_size=F('section'),color=WHITE).move_to([0,1.85,0])
        stems=always_redraw(lambda:spectrum(mod.get_value()));audit_graph(stems,'spectrum',clock,kind='stems',parameters={'m':mod})
        baseline=Line([-4.5,-1.5,0],[4.5,-1.5,0],color=GRAY)
        freq_labels=VGroup(*[Text(f'{f:g} Hz',font=FONT,font_size=F('body')).move_to([x,-1.85,0]) for f,x in ((FC-FM,-2),(FC,0),(FC+FM,2))])
        amp_labels=always_redraw(lambda:VGroup(*[Text(f'{a:.2f} V',font=FONT,font_size=F('body'),color=c).move_to([x,-1.5+1.5*a+.2,0]) for a,x,c in ((mod.get_value()*AC/2,-2,RED_C),(AC,0,BLUE_C),(mod.get_value()*AC/2,2,GREEN_C))]))
        rule=Text('载波 Ac；两边带各 mAc/2。档位切换用于演示，谱对应固定 m。',font=FONT,font_size=F('body'),color=GRAY_B).move_to([0,-2.6,0])
        spectrum_group=VGroup(stems,baseline,freq_labels,amp_labels,spec_title,rule)
        self.play(Create(stems),Create(baseline),FadeIn(freq_labels),FadeIn(amp_labels),FadeIn(spec_title),FadeIn(rule),run_time=1);self.wait(7)
        for level in (0,.6,1,1.2):self.play(mod.animate.set_value(level),run_time=1,rate_func=linear);self.wait(1)
        self.play(FadeOut(spectrum_group),run_time=.5)
        summary=VGroup(equation(STD,F('formula_summary_main')),equation(ENV,F('formula_summary_secondary')),Text('过调制改变包络与载波相位；理想线性 AM 仍只有载波和两条边带',font=FONT,font_size=F('summary'),color=YELLOW)).arrange(DOWN,buff=.65).move_to([0,0,0])
        self.play(Write(summary),run_time=1.5);self.wait(3)

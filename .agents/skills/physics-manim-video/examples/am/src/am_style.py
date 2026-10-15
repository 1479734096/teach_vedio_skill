"""AM 的实际生产函数和复用组件；单位为秒、伏特、赫兹。"""
from manim import *
import numpy as np,json
from pathlib import Path
from components import *
from typography import F
from qa_runtime import audit_model,attach_audit
from qa_plot import audit_graph
attach_audit()
CFG=json.loads((Path(__file__).resolve().parents[1]/'physics_config.json').read_text(encoding='utf-8'))
P=CFG['parameters'];B=CFG['drawing_bindings']['AMTeach'];AC=P['carrier_amplitude_v'];FC=P['carrier_frequency_hz'];FM=P['message_frequency_hz']
STD=r's(t)=A_c[1+m\cos(2\pi f_m t)]\cos(2\pi f_c t)'
EXP=r's(t)=A_c\cos(2\pi f_c t)+\frac{m A_c}{2}\cos(2\pi(f_c+f_m)t)+\frac{m A_c}{2}\cos(2\pi(f_c-f_m)t)'
ENV=r'E_{\rm env}=A_c|1+m\cos(2\pi f_m t)|'

def factor(time,m):return 1+m*np.cos(2*np.pi*FM*time)
@audit_model('am_signal')
def signal(time,m):return AC*factor(time,m)*np.cos(2*np.pi*FC*time)
def envelope(time,m):return AC*np.abs(factor(time,m))

def curve(role,video_t,m):
    b=B[role];x=np.linspace(-5,5,401);u=video_t*.001+(x-b['x_origin'])*b['time_per_x']
    y=signal(u,m) if role=='signal' else AC*np.cos(2*np.pi*FC*u) if role=='carrier' else envelope(u,m)*(1 if role=='upper' else -1)
    color={'signal':YELLOW,'carrier':BLUE_C,'upper':TEAL_C,'lower':TEAL_C}[role]
    return VMobject(stroke_width=3.6 if role=='signal' else 2,color=color).set_points_as_corners(np.column_stack([x,b['baseline']+b['y_scale']*y,np.zeros_like(x)]))

def spectrum(m):
    b=B['spectrum'];freqs=[FC-FM,FC,FC+FM];amplitudes=[m*AC/2,AC,m*AC/2];lines=[]
    for f,a,col in zip(freqs,amplitudes,[RED_C,BLUE_C,GREEN_C]):
        x=b['x_origin']+(f-b['frequency_origin_hz'])*b['x_scale'];lines.append(Line([x,b['baseline'],0],[x,b['baseline']+b['y_scale']*a,0],color=col,stroke_width=5))
    return VGroup(*lines)

def equation(tex,scale=None):
    scale=F("formula_main") if scale is None else scale
    # 分式保持完整 TeX，避免拆分变量破坏分子和分母的排版。
    isolate=[] if r'\frac' in tex else ['A_c','f_c','f_m']
    obj=MathTex(tex,font_size=scale,substrings_to_isolate=isolate)
    if isolate:
        obj.set_color_by_tex('A_c',BLUE_C);obj.set_color_by_tex('f_c',BLUE_C);obj.set_color_by_tex('f_m',GREEN_C)
    return obj

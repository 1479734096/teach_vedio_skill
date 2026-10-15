"""Manim 项目侧逐帧采集，不修改安装目录，不以源码字符串代替可见对象。"""
from pathlib import Path
from functools import wraps
import json
import os
import inspect
import numpy as np
from manim import Scene, Mobject, VMobject, ValueTracker, Text, Tex, MathTex
from manim.renderer.cairo_renderer import CairoRenderer
from qa_plot import collect_plot

_installed = False
_scene = None
_trackers = []
_reads = {}
_stack = []
_samples = []
_counts = {}
_frame_count = 0
_file = None
_errors = []

def serial(value):
    if isinstance(value, np.ndarray): return value.tolist()
    if isinstance(value, np.generic): return value.item()
    if isinstance(value, (tuple,list)): return [serial(v) for v in value]
    if isinstance(value, dict): return {k:serial(v) for k,v in value.items()}
    return value

def audit_model(name):
    """记录生产函数真实调用的输入和返回值，不重新计算正确答案。"""
    def decorate(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            result = fn(*args, **kwargs)
            if _counts.get(name,0)<256:
                _samples.append({'function':name,'args':serial(args),'kwargs':serial(kwargs),'value':serial(result)})
                _counts[name]=_counts.get(name,0)+1
            return result
        return wrapped
    return decorate

def opacity(mob):
    # ValueTracker 是控制对象，不参与 Cairo 的矢量绘制。
    if not isinstance(mob, VMobject): return 0.0
    vals=[]
    for method in ('get_fill_opacity','get_stroke_opacity'):
        if hasattr(mob,method):
            value=np.asarray(getattr(mob,method)(),dtype=float)
            if value.size: vals.append(float(value.max()))
    return max(vals,default=0.0)

def capture(renderer, scene):
    global _frame_count, _file
    camera=renderer.camera
    boxes=[]; objects=[]; visible=set(); visited=set(); plots=[]; unbound=[]
    center=np.array(camera.frame_center)
    def pixels(points):
        return np.column_stack([(points[:,0]-center[0])/camera.frame_width*camera.pixel_width+camera.pixel_width/2,(center[1]-points[:,1])/camera.frame_height*camera.pixel_height+camera.pixel_height/2])
    def walk(mob, family_parent=None, plot_parent=False):
        if id(mob) in visited: return
        visited.add(id(mob))
        pts=mob.get_all_points()
        if len(pts) and any(opacity(child)>0.05 for child in mob.get_family() if child.has_points()):
            screen=pixels(pts)
            box=[float(screen[:,0].min()),float(screen[:,1].min()),float(screen[:,0].max()),float(screen[:,1].max())]
            if box[2]>0 and box[0]<camera.pixel_width and box[3]>0 and box[1]<camera.pixel_height:
                visible.add(str(id(mob)))
                spec=getattr(mob,'_qa_plot',None)
                changing=any(type(a).__name__ in ('Create','Write','FadeIn','FadeOut') and (a.mobject is mob or mob in a.mobject.get_family()) for a in getattr(scene,'animations',[]) if a.mobject is not None)
                if spec and not changing: plots.append(collect_plot(mob,spec))
                if type(mob).__name__=='FunctionGraph' and spec is None and not plot_parent: unbound.append(str(id(mob)))
                objects.append({'id':str(id(mob)),'type':type(mob).__name__,'bbox':box,'points_sample':pts[::max(1,len(pts)//24)][:24,:2].tolist(),'parent':family_parent})
                if isinstance(mob,(Text,Tex,MathTex)):
                    boxes.append({'id':str(id(mob)),'text':getattr(mob,'text',getattr(mob,'tex_string','')),'bbox':box,'type':type(mob).__name__})
                    return
        for child in mob.submobjects: walk(child,str(id(mob)),plot_parent or bool(getattr(mob,'_qa_plot',None)))
    for mob in scene.mobjects: walk(mob)
    trackers=[]
    for tracker in _trackers:
        owners=_reads.get(str(id(tracker)),set())
        trackers.append({'id':str(id(tracker)),'value':float(_original_get(tracker)),'origin':tracker._qa_origin,'updater_owners':sorted(owners),'visible_owners':sorted(owners & visible)})
    animations=[{'type':type(a).__name__,'object_id':str(id(a.mobject)) if a.mobject is not None else None,'target_id':str(id(a.target_mobject)) if hasattr(a,'target_mobject') else None} for a in getattr(scene,'animations',[])]
    frame={'frame_index':_frame_count,'t':_frame_count/camera.frame_rate,'scene':type(scene).__name__,'camera':{'width_units':camera.frame_width,'height_units':camera.frame_height,'center':center.tolist(),'pixel_width':camera.pixel_width,'pixel_height':camera.pixel_height},'text_boxes':boxes,'objects':objects,'trackers':trackers,'physics':list(_samples),'animations':animations,'capture_errors':list(_errors),'plot_samples':plots,'unbound_plots':unbound}
    _frame_count+=1
    if _file is None:
        dest=Path(os.environ['QA_SCENE_TELEMETRY'])
        dest.parent.mkdir(parents=True,exist_ok=True)
        _file=dest.open('w',encoding='utf-8')
    _file.write(json.dumps(frame,ensure_ascii=False,allow_nan=False)+'\n')
    _file.flush()

_original_get=ValueTracker.get_value

def attach_audit():
    global _installed
    if _installed or not os.environ.get('QA_SCENE_TELEMETRY'): return
    _installed=True
    original_init=ValueTracker.__init__
    def init(self,*args,**kwargs):
        origin=inspect.currentframe().f_back
        self._qa_origin={'file':origin.f_code.co_filename,'line':origin.f_lineno}
        original_init(self,*args,**kwargs); _trackers.append(self)
    def get(self):
        if _stack: _reads.setdefault(str(id(self)),set()).add(str(id(_stack[-1])))
        return _original_get(self)
    ValueTracker.__init__=init; ValueTracker.get_value=get
    original_update=Mobject.update
    def update(self,*args,**kwargs):
        _stack.append(self)
        try: return original_update(self,*args,**kwargs)
        finally: _stack.pop()
    Mobject.update=update
    original_scene_update=Scene.update_mobjects
    def update_mobjects(self,dt):
        _reads.clear(); _samples.clear(); _counts.clear()
        return original_scene_update(self,dt)
    Scene.update_mobjects=update_mobjects
    original_update_frame=CairoRenderer.update_frame
    def update_frame(self,scene,*args,**kwargs):
        self._audit_scene=scene
        return original_update_frame(self,scene,*args,**kwargs)
    CairoRenderer.update_frame=update_frame
    original_add=CairoRenderer.add_frame
    def add(self,frame,num_frames=1):
        if not self.skip_animations:
            for _ in range(num_frames): capture(self,self._audit_scene)
        return original_add(self,frame,num_frames)
    CairoRenderer.add_frame=add

attach_audit()

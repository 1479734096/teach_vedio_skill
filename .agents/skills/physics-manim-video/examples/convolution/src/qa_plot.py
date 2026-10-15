"""给真实 Manim 对象标注模型身份，坐标由编码帧独立读取。"""
from manim import Arrow, Line, Dot, VMobject, Rectangle
import numpy as np

def audit_graph(obj, role, tracker=None, kind='curve', parameters=None):
    obj._qa_plot={'role':role,'tracker':tracker,'kind':kind,'parameters':parameters or {}}
    return obj

def collect_plot(obj, spec):
    clock=spec['tracker']
    t=float(clock.get_value()) if clock is not None else 0.0
    result={'object_id':str(id(obj)),'role':spec['role'],'kind':spec['kind'],'sim_t':t,'parameters':{k:float(v.get_value()) if hasattr(v,'get_value') else float(v) for k,v in spec.get('parameters',{}).items()}}
    if spec['kind'] in ('vectors','stems'):
        result['vectors']=[{'start':m.get_start()[:2].tolist(),'end':m.get_end()[:2].tolist()} for m in obj.get_family() if isinstance(m,Line if spec['kind']=='stems' else Arrow)]
    elif spec['kind']=='point':
        dots=[m for m in obj.get_family() if isinstance(m,Dot)]
        result['points']=[m.get_center()[:2].tolist() for m in dots]
    else:
        anchors=[np.asarray(m.get_anchors(),dtype=float)[:,:2] for m in obj.get_family() if isinstance(m,Rectangle if spec['kind']=='pulse' else VMobject) and m.has_points()]
        result['points']=np.concatenate(anchors).tolist() if anchors else []
    return result

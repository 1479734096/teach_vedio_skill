"""从实际阶梯曲线读出分段常数信号，独立检验非对称核翻转与积分。"""
import numpy as np
from qa_evidence import read_json,numeric,MissingEvidence

def actual_segments(record,binding):
    xy=numeric(record['points'],8);out=[];scale=binding['y_scale'];base=binding['baseline']
    for a,b in zip(xy,xy[1:]):
        if b[0]>a[0]+1e-9 and abs(b[1]-a[1])<1e-9 and abs(a[1]-base)>1e-9:
            out.append([float(a[0]),float(b[0]),float((a[1]-base)/scale)])
    if not out:raise MissingEvidence('实际阶梯曲线没有非零水平区间')
    return sorted(out)

def exact_integral(a,b):
    return sum(max(0,min(x[1],y[1])-max(x[0],y[0]))*x[2]*y[2] for x in a for y in b)

def check_d_profiles(gate):
    from screen_checks import project_points,multiply_matrix
    cfg=gate.cfg;bindings=cfg['drawing_bindings'];profiles=cfg['input_profiles'];frames=[];mapping=[]
    for f in gate.inputs():
        records=[]
        for shape in f.get('plot_shapes',[]):
            role=shape['role']
            if role not in bindings:raise ValueError('非对称核存在未知实际对象：'+role)
            b=bindings[role];local=numeric([shape['center']] if role=='output' else shape['local_points'],2)
            desired=project_points(local,multiply_matrix(shape['outer_to_screen'],shape['base_to_canvas']));actual=project_points(local,shape['to_screen'])
            error=float(np.max(np.linalg.norm(actual-desired,axis=1)))
            if error>2:mapping.append({'t':f['t'],'role':role,'pixel_error':error})
            points=np.column_stack(((local[:,0]-b['origin'][0])/b['x_scale'],(b['origin'][1]-local[:,1])/b['y_scale']))
            records.append({'role':role,'points':points.tolist(),'sim_t':shape.get('sim_t',0)})
        frames.append({'scene':'profile','t':f['t'],'plot_samples':records})
    # 重用同一个数学积分器；输入是 Canvas 真实路径换算后的物理坐标。
    class Proxy:
        project_dir=gate.project_dir
        def inputs(self):return frames
        def log(self,key,title,status,detail='',evidence=None):
            gate.log(key.replace('GATE-10','Suite I.profile'),title,status,detail,evidence)
    check_profiles(Proxy(),config={'input_profiles':profiles,'drawing_bindings':{'profile':{k:{'baseline':0,'y_scale':1} for k in ('f','g','output')}}})
    gate.log('Suite I.profile.mapping','非对称核真实路径与最终合成矩阵',not mapping,evidence={'source':'实际路径和实际 drawImage 变换','tolerance_px':2,'events':mapping[:20]})

def check_profiles(gate,config=None):
    cfg=config or read_json(gate.project_dir/'physics_config.json');profiles=cfg['input_profiles'];bindings=cfg['drawing_bindings'];flip_events=[];output_events=[];samples=0;maximum=0;refinement=0
    for name in ('f','g'):
        array=numeric(profiles[name],3)
        if array.ndim!=2 or array.shape[1]!=3 or any(x[0]>=x[1] for x in array):raise ValueError('非对称输入的分段声明非法')
    norm=sum(abs(x[2])*(x[1]-x[0]) for x in profiles['f'])*max(abs(x[2]) for x in profiles['g'])
    if norm<=0:raise ValueError('积分归一化尺度无效')
    for frame in gate.inputs():
        spec=bindings.get(frame['scene'])
        if not spec:continue
        records={r['role']:r for r in frame.get('plot_samples',[])}
        if not all(k in records for k in ('f','g','output')):continue
        f=actual_segments(records['f'],spec['f']);g=actual_segments(records['g'],spec['g']);t=records['g']['sim_t'];numeric([t])
        wanted_f=sorted(profiles['f']);wanted_g=sorted([[t-r,t-l,h] for l,r,h in profiles['g']])
        shape_error=float('inf') if len(f)!=len(wanted_f) or len(g)!=len(wanted_g) else float(max(np.max(abs(np.asarray(f)-wanted_f)),np.max(abs(np.asarray(g)-wanted_g))))
        if shape_error>1e-6:flip_events.append({'t':frame['t'],'actual_f':f,'actual_g':g,'expected_g':wanted_g,'reason':'实际输入或翻转平移后的区间/高度不符'})
        integral=exact_integral(f,g);dots=numeric(records['output']['points'],2);actual=(dots[-1,1]-spec['output']['baseline'])/spec['output']['y_scale'];error=abs(actual-integral)/norm;maximum=max(maximum,error);samples+=1
        if error>.01:output_events.append({'t':frame['t'],'actual_output':float(actual),'actual_curve_integral':integral,'normalized_error':error})
        # 独立的实际分段信号同时用两个网格积分，验证离散误差不会掩盖阈值。
        estimates=[]
        lo=min(x[0] for x in f+g);hi=max(x[1] for x in f+g)
        for n in (4096,8192):
            x=np.linspace(lo,hi,n);fv=sum(h*((x>l)&(x<r)) for l,r,h in f);gv=sum(h*((x>l)&(x<r)) for l,r,h in g);estimates.append(float(np.trapezoid(fv*gv,x)))
        refinement=max(refinement,abs(estimates[1]-estimates[0])/norm,abs(estimates[1]-integral)/norm)
    if samples<20:raise MissingEvidence('非对称核实际同帧采样不足20帧')
    if refinement>.01:raise MissingEvidence('实际信号积分网格加密误差超过1%')
    gate.log('GATE-10.flip','实际非对称核 g(t−τ) 的翻转和平移',not flip_events,evidence={'source':'真实阶梯曲线水平区间；独立配置中的原始非对称核','samples':samples,'threshold_normalized':1e-6,'events':flip_events[:20]})
    gate.log('GATE-10.actual','从实际输入曲线积分并比较实际输出点',not output_events,evidence={'source':'同帧实际曲线顶点与实际 Dot 中心','samples':samples,'max_normalized_integral_error':maximum,'grid_refinement_error':refinement,'threshold':.01,'events':output_events[:20]})


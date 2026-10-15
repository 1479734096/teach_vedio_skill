"""独立参考与实际对象顶点/向量比较；不调用生产模型函数。"""
import math
import numpy as np
from qa_evidence import MissingEvidence,numeric,read_json

def check_a_plots(gate):
    cfg=read_json(gate.project_dir/'physics_config.json');bindings=cfg.get('drawing_bindings')
    if not bindings:raise MissingEvidence('缺少经布局声明的实际对象映射')
    p=cfg['parameters'];events=[];observed=set();count=0;max_error=0.0;max_px=0.0
    for frame in gate.inputs():
        scene=frame['scene'];specs=bindings.get(scene,{})
        if frame.get('unbound_plots'):raise MissingEvidence('存在未绑定物理身份的可见曲线：'+scene)
        for actual in frame.get('plot_samples',[]):
            role=actual['role'];spec=specs.get(role)
            if not spec:raise ValueError('实际绘图对象未在配置声明：'+scene+'/'+role)
            observed.add((scene,role));t=numeric([actual['sim_t']])[0]
            if actual['kind']=='vectors':
                vectors=actual.get('vectors',[])
                if len(vectors)!=p['n_harmonics']:raise MissingEvidence('实际旋转向量数量不足')
                center=np.asarray(spec['center'],float);e=[]
                for k,v in enumerate(vectors,1):
                    n=2*k-1;r=4*p['amplitude']/(math.pi*n);angle=n*2*math.pi/p['period']*t
                    endpoint=center+r*np.array([math.cos(angle),math.sin(angle)])
                    e.extend((np.asarray(v['start'])-center).tolist());e.extend((np.asarray(v['end'])-endpoint).tolist());center=endpoint
                error=max(abs(numeric(e)))/p['amplitude'];px=error*p['amplitude']*frame['camera']['pixel_height']/frame['camera']['height_units']
            elif actual['kind']=='point' and spec['model'] in ('node_marker','antinode_marker'):
                xy=numeric(actual.get('points',[]),2)
                if xy.shape!=(1,2):raise MissingEvidence('节点/波腹缺少唯一实际中心')
                wanted=np.array([p['x_term']-(p['wavelength']/4 if spec['model']=='node_marker' else 0),spec['baseline']]);delta=xy[0]-wanted
                px=float(np.linalg.norm(delta*np.array([frame['camera']['pixel_width']/frame['camera']['width_units'],frame['camera']['pixel_height']/frame['camera']['height_units']])));error=float(np.max(abs(delta))/p['wavelength'])
            elif actual['kind']=='pulse':
                xy=numeric(actual.get('points',[]),8)
                if xy.ndim!=2 or xy.shape[1]!=2:raise ValueError('实际脉冲顶点错误')
                center=0.0 if spec['model']=='conv_f' else t
                wanted=np.array([center-p['pulse_width']/2,spec['baseline'],center+p['pulse_width']/2,spec['baseline']+spec['y_scale']*p['pulse_height']])
                box=np.array([xy[:,0].min(),xy[:,1].min(),xy[:,0].max(),xy[:,1].max()]);delta=abs(box-wanted)
                px=float(max(delta[[0,2]])*frame['camera']['pixel_width']/frame['camera']['width_units']);px=max(px,float(max(delta[[1,3]])*frame['camera']['pixel_height']/frame['camera']['height_units']))
                error=float(max(delta))/p['pulse_width']
            else:
                xy=numeric(actual.get('points',[]),2)
                if xy.ndim!=2 or xy.shape[1]!=2:raise ValueError('实际绘图点形状错误')
                x,y=xy[:,0],xy[:,1];model=spec['model'];baseline=spec.get('baseline',0);scale=spec.get('y_scale',1)
                if not math.isfinite(scale) or scale<=0:raise ValueError('模型纵向单位映射无效')
                if model in ('incident','reflected','standing','envelope_upper','envelope_lower'):
                    phase=2*math.pi/p['wavelength']*(x-p['x_term']);angle=2*math.pi/p['period']*t;A=p['amplitude']
                    expected=A*np.cos(angle-phase) if model=='incident' else A*np.cos(angle+phase) if model=='reflected' else 2*A*np.cos(phase)*math.cos(angle) if model=='standing' else (1 if model=='envelope_upper' else -1)*2*A*np.abs(np.cos(phase))
                    normalization=2*A
                elif model=='fourier':
                    u=t-(x-spec['x_start'])*spec['time_per_x'];N=spec.get('n_terms',p['n_harmonics']);omega=2*math.pi/p['period']
                    expected=sum(4*p['amplitude']/(math.pi*(2*k-1))*np.sin((2*k-1)*omega*u) for k in range(1,N+1));normalization=2*p['amplitude']
                elif model=='conv_output':
                    expected=np.maximum(0,p['pulse_width']-np.abs(x))*p['pulse_height']**2;normalization=p['pulse_width']*p['pulse_height']**2
                else:raise MissingEvidence('未实现的绘图映射：'+model)
                if len(x)<(1 if actual['kind']=='point' else 3):raise MissingEvidence('实际曲线点不足')
                residual=y-(baseline+scale*expected);error=float(np.max(np.abs(residual))/(scale*normalization));px=float(np.max(np.abs(residual))*frame['camera']['pixel_height']/frame['camera']['height_units'])
            count+=1;max_error=max(max_error,float(error));max_px=max(max_px,float(px))
            # 渲染曲线含 Bézier 插值与虚线分段，位置检查采用既定 2px；生产浮点模型另按 1e-6 检验。
            if px>2:events.append({'t':frame['t'],'role':role,'normalized_error':float(error),'pixel_error':float(px)})
    required={(scene,role) for scene,specs in bindings.items() for role in specs if scene in {s['id'] for s in gate.manifest['timeline']}}
    if not required or required-observed:raise MissingEvidence('实际映射未覆盖声明对象：'+str(sorted(required-observed)))
    gate.log('GATE-10.mapping','实际可见曲线/向量与独立模型及像素映射',not events,evidence={'source':'同一编码帧的真实 Manim 锚点、向量端点和相机；配置只声明单位映射','frames_objects_checked':count,'roles':sorted(observed),'max_normalized_position_error':max_error,'max_pixel_error':max_px,'tolerance_px':2,'events':events[:20],'event_count':len(events)})

def check_a_pulses(gate):
    cfg=read_json(gate.project_dir/'physics_config.json');bindings=cfg.get('drawing_bindings') or {};p=cfg['parameters'];events=[];count=0;maximum=0.0
    for f in gate.inputs():
        if f['scene']!='Scene2_FlipSlide':continue
        records={r['role']:r for r in f.get('plot_samples',[])}
        if not all(k in records for k in ('f','g','output')):continue
        spec=bindings[f['scene']];segments=[]
        for key in ('f','g'):
            xy=numeric(records[key]['points'],8);baseline=spec[key]['baseline'];scale=spec[key]['y_scale']
            segments.append((float(xy[:,0].min()),float(xy[:,0].max()),float((xy[:,1].max()-baseline)/scale)))
        a,b=segments;integral=max(0,min(a[1],b[1])-max(a[0],b[0]))*a[2]*b[2]
        dots=numeric(records['output']['points'],2);actual=(dots[-1,1]-spec['output']['baseline'])/spec['output']['y_scale']
        error=abs(actual-integral)/(p['pulse_width']*p['pulse_height']**2);maximum=max(maximum,error);count+=1
        if error>.01:events.append({'t':f['t'],'actual_output':float(actual),'actual_input_integral':integral,'normalized_error':error})
    if count<20:raise MissingEvidence('实际脉冲与输出点同帧采样不足20帧')
    gate.log('GATE-10.flip','实际 g(t−τ) 支撑与逐时刻实际输入积分',not events,'当前矩形核对称，形状不能证明翻转动作；非对称核由独立真实渲染用例检验',{'source':'同帧实际 f/g 矩形顶点与输出 Dot；分段常数精确积分','samples':count,'max_normalized_integral_error':maximum,'threshold':.01,'events':events[:20]})

def project_points(points,matrix):
    pts=numeric(points,2);T=numeric(matrix,6)
    if pts.ndim!=2 or pts.shape[1]!=2 or T.shape!=(6,):raise ValueError('实际路径或仿射矩阵形状错误')
    return pts@np.array([[T[0],T[1]],[T[2],T[3]]])+T[4:6]

def check_d_plots(gate):
    p=gate.cfg['parameters'];bindings=gate.cfg.get('drawing_bindings')
    if not bindings:raise MissingEvidence('缺少当前主题的实际路径绑定声明')
    events=[];seen=set();count=0;maximum=0.0
    for frame in gate.inputs():
        if 'plot_shapes' not in frame:raise MissingEvidence('缺少与编码帧同次的最终合成路径')
        states=[r for r in frame.get('physics',[]) if r.get('kind')=='lc_state']
        for shape in frame['plot_shapes']:
            role=shape['role'];model=shape.get('model');seen.add(role)
            if role not in bindings:raise ValueError('未声明的绘图身份：'+role)
            actual=numeric(shape['screen_points'],2);local=numeric(shape['local_points'],2);T=numeric(shape['to_screen'],6)
            projected=project_points(local,T)
            if actual.shape!=projected.shape:raise ValueError('最终路径点数量不一致')
            chain_error=float(np.max(np.linalg.norm(actual-projected,axis=1)))
            origin=numeric(shape.get('origin',[]),2);expected=local.copy()
            if model in ('lc_q_curve','lc_i_curve'):
                xscale=numeric([shape['x_scale']])[0]
                if xscale<=0:raise ValueError('时间轴映射必须为正')
                u=(local[:,0]-origin[0])/xscale;omega=1/math.sqrt(p['inductance_L_h']*p['capacitance_C_f'])
                expected[:,1]=origin[1]-(p['charge_amplitude_px']*np.cos(omega*u) if model=='lc_q_curve' else p['current_amplitude_px']*np.sin(omega*u))
            elif model in ('lc_q_dot','lc_i_dot'):
                center=numeric(shape.get('center') or [],2);t=numeric([shape['sim_t']])[0];omega=1/math.sqrt(p['inductance_L_h']*p['capacitance_C_f'])
                wanted=[origin[0]+shape['x_scale']*t,origin[1]-(p['charge_amplitude_px']*math.cos(omega*t) if model=='lc_q_dot' else p['current_amplitude_px']*math.sin(omega*t))]
                actual=project_points([center],T);expected=np.asarray([wanted])
            elif model in ('lc_gauge_e','lc_gauge_m'):
                t=numeric([shape['sim_t']])[0];matching=[r for r in states if abs(r['sim_t']-t)<1e-6]
                if not matching:raise MissingEvidence('实际能量条没有同帧同仿真时间的绘制电荷/电流')
                state=matching[-1];Q=p['initial_charge_Q0_c'];L=p['inductance_L_h'];C=p['capacitance_C_f'];I=Q/math.sqrt(L*C);E0=Q*Q/(2*C)
                q=state['q_px']/p['charge_amplitude_px']*Q;i=state['i_px']/p['current_amplitude_px']*I
                ratio=q*q/(2*C)/E0 if model=='lc_gauge_e' else L*i*i/2/E0
                width=float(np.max(local[:,0])-np.min(local[:,0]));wanted=shape['total_width']*ratio
                px=abs(width-wanted)*math.hypot(T[0],T[1]);count+=1;maximum=max(maximum,px,chain_error)
                if px>2 or chain_error>1e-9:events.append({'t':frame['t'],'role':role,'pixel_error':px,'affine_residual':chain_error})
                continue
            else:raise MissingEvidence('未实现的实际路径模型：'+str(model))
            desired=project_points(expected,T);px=float(np.max(np.linalg.norm(actual-desired,axis=1)))
            count+=1;maximum=max(maximum,px,chain_error)
            if px>2 or chain_error>1e-9:events.append({'t':frame['t'],'role':role,'pixel_error':px,'affine_residual':chain_error})
    if not count or set(bindings)-seen:raise MissingEvidence('实际路径未覆盖声明身份：'+str(sorted(set(bindings)-seen)))
    gate.log('Suite I.screen_mapping','实际路径沿相机/离屏/合成链到最终画布及模型位置',not events,evidence={'source':'实际 Canvas stroke/fill 路径、drawImage 仿射链；LC能量条独立读取实际q/i','path_instances':count,'roles':sorted(seen),'max_pixel_error':maximum,'tolerance_px':2,'events':events[:20],'event_count':len(events)})

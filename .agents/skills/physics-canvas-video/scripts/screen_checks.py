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

def multiply_matrix(a,b):
    a=numeric(a,6);b=numeric(b,6)
    A=np.array([[a[0],a[2],a[4]],[a[1],a[3],a[5]],[0,0,1]])
    B=np.array([[b[0],b[2],b[4]],[b[1],b[3],b[5]],[0,0,1]])
    c=A@B
    return [c[0,0],c[1,0],c[0,1],c[1,1],c[0,2],c[1,2]]

def check_d_plots(gate):
    p=gate.cfg['parameters'];bindings=gate.cfg.get('drawing_bindings')
    if not bindings:raise MissingEvidence('缺少当前主题的实际路径绑定声明')
    events=[];seen=set();count=0;maximum=0.0
    for frame in gate.inputs():
        if 'plot_shapes' not in frame:raise MissingEvidence('缺少与编码帧同次的最终合成路径')
        states=[r for r in frame.get('physics',[]) if r.get('kind')=='lc_state']
        for shape in frame['plot_shapes']:
            role=shape['role'];model=shape.get('model')
            if 'visible_point_count' not in shape:raise MissingEvidence('缺少最终裁剪可见性观测')
            count_visible=numeric([shape['visible_point_count']])[0]
            if count_visible<0 or count_visible!=int(count_visible):raise ValueError('最终可见采样计数无效')
            if count_visible==0:continue
            numeric(shape.get('visible_screen_points',[]),2)
            seen.add(role)
            if role not in bindings:raise ValueError('未声明的绘图身份：'+role)
            actual=numeric(shape['screen_points'],2);local=numeric(shape['local_points'],2);T=numeric(shape['to_screen'],6)
            projected=project_points(local,T)
            if actual.shape!=projected.shape:raise ValueError('最终路径点数量不一致')
            chain_error=float(np.max(np.linalg.norm(actual-projected,axis=1)))
            origin=numeric(shape.get('origin',[]),2);expected=local.copy()
            if 'base_to_canvas' not in shape or 'outer_to_screen' not in shape:raise MissingEvidence('路径缺少相机与合成阶段分开的矩阵')
            desired_T=multiply_matrix(shape['outer_to_screen'],shape['base_to_canvas'])
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
                px=abs(width*math.hypot(T[0],T[1])-wanted*math.hypot(desired_T[0],desired_T[1]));count+=1;maximum=max(maximum,px,chain_error)
                if px>2 or chain_error>1e-9:events.append({'t':frame['t'],'role':role,'pixel_error':px,'affine_residual':chain_error})
                continue
            elif model=='rc_wire':
                if len(local)!=2:raise ValueError('实际电路导线应有两个端点')
            elif model.startswith('wave_'):
                dot=model.endswith('_dot');kind=model[5:-4] if dot else model[5:]
                if dot:
                    center=numeric(shape.get('center') or [],2);local=np.asarray([center]);actual=project_points(local,T);expected=local.copy()
                x=local[:,0]-origin[0];omega=2*math.pi/p['period_T_s'];beta=2*math.pi/p['wavelength_lambda_px'];A=p['amplitude_A_px'];t=shape.get('sim_t',0)
                numeric([t]);gain=shape.get('gain',1.0);numeric([gain])
                y=np.zeros_like(x) if kind=='node' else A*np.cos(omega*t-beta*x) if kind=='incident' else A*np.cos(omega*t+beta*x) if kind=='reflected' else 2*A*np.cos(beta*x)*math.cos(omega*t) if kind=='standing' else (1 if kind=='upper' else -1)*2*A*np.abs(np.cos(beta*x)) if kind in ('upper','lower') else None
                if y is None:raise MissingEvidence('未知波形绘图身份：'+kind)
                expected[:,1]=origin[1]-gain*y
                if kind=='node':expected[:,0]=origin[0]-p['wavelength_lambda_px']/4+np.rint((x+p['wavelength_lambda_px']/4)/(p['wavelength_lambda_px']/2))*(p['wavelength_lambda_px']/2)
            elif model in ('conv_f','conv_g','conv_flip'):
                xs=(local[:,0]-origin[0])/1.5;width=p['pulse_width_px'];height=p['pulse_height_px'];t=shape.get('sim_t',0)
                left,right=(-width/2,width/2) if model=='conv_f' else (t-width,t) if model=='conv_g' else (0,width)
                ys=np.where((xs>left)&(xs<right),height,0.0)
                for j,x in enumerate(xs):
                    if abs(x-left)<1e-8 or abs(x-right)<1e-8:ys[j]=min((0.0,height),key=lambda v:abs((origin[1]-local[j,1])-v))
                expected[:,1]=origin[1]-ys
                if np.max(origin[1]-local[:,1])<height-2:events.append({'t':frame['t'],'role':role,'reason':'实际脉冲缺少声明的高度'})
                if model=='conv_flip':
                    progress=numeric([shape['progress']])[0];flip=1-2*progress
                    desired_T=multiply_matrix(desired_T,[flip,0,0,1,origin[0]*(1-flip),0])
            elif model in ('conv_curve','conv_dot'):
                if model=='conv_dot':local=np.asarray([numeric(shape.get('center') or [],2)]);actual=project_points(local,T);expected=local.copy()
                x=(local[:,0]-origin[0])/1.5;w=p['pulse_width_px'];h=p['pulse_height_px']
                overlap=np.maximum(0,np.minimum(w/2,x)-np.maximum(-w/2,x-w));expected[:,1]=origin[1]-overlap/w*h
            elif model in ('rc_v_curve','rc_i_curve','rc_v_dot'):
                if model=='rc_v_dot':local=np.asarray([numeric(shape.get('center') or [],2)]);actual=project_points(local,T);expected=local.copy()
                u=(local[:,0]-origin[0])/shape['x_scale'];tau=p['resistance_R_ohm']*p['capacitance_C_f'];fraction=np.exp(-u/tau) if model=='rc_i_curve' else 1-np.exp(-u/tau)
                expected[:,1]=origin[1]-shape['axis_height']*fraction
            else:raise MissingEvidence('未实现的实际路径模型：'+str(model))
            desired=project_points(expected,desired_T);px=float(np.max(np.linalg.norm(actual-desired,axis=1)))
            count+=1;maximum=max(maximum,px,chain_error)
            if px>2 or chain_error>1e-9:events.append({'t':frame['t'],'role':role,'pixel_error':px,'affine_residual':chain_error})
    if not count or set(bindings)-seen:raise MissingEvidence('实际路径未覆盖声明身份：'+str(sorted(set(bindings)-seen)))
    gate.log('Suite I.screen_mapping','实际路径沿相机/离屏/合成链到最终画布及模型位置',not events,evidence={'source':'实际 Canvas stroke/fill 路径、drawImage 仿射链；LC能量条独立读取实际q/i','path_instances':count,'roles':sorted(seen),'max_pixel_error':maximum,'tolerance_px':2,'events':events[:20],'event_count':len(events)})

def check_d_geometry(gate):
    count=0;events=[]
    for f in gate.inputs():
        if 'graphics' not in f:raise MissingEvidence('缺少实际路径几何边界')
        transitioning=any(isinstance(s.get('transition'),dict) and 0<=f['t']-s['start']<s['transition'].get('dur',0)+s['transition'].get('delay',0) for s in gate.manifest['timeline'])
        for g in f['graphics']:
            box=numeric(g['bbox'],4);count+=1
            if not g.get('role') or transitioning:continue
            if box[0]<-2 or box[1]<-2 or box[2]>1922 or box[3]>1082:events.append({'t':f['t'],'role':g['role'],'bbox':box.tolist()})
    if not count:raise MissingEvidence('实际图形路径为空')
    gate.log('Suite C.graphics','已注册模型图形的实际路径边界',not events,'曲线、卡片遮挡的可读性由实际视觉验收承担；这里仅声明边界测量',{'source':'真实路径控制点包围框及离屏变换；保守边界不冒充像素分割','paths_checked':count,'tolerance_px':2,'events':events[:20],'event_count':len(events)})

def check_d_alignment(gate):
    rules=gate.cfg.get('continuity_rules')
    if not rules:raise MissingEvidence('跨镜头缺少独立连续性声明')
    frames=gate.inputs();events=[];pairs=0
    for rule in rules:
        source=next((s for s in gate.manifest['timeline'] if s['id']==rule['source']),None);target=next((s for s in gate.manifest['timeline'] if s['id']==rule['target']),None)
        if not source or not target:continue
        def anchors(shot):
            result=[]
            for f in frames:
                if not shot['start']<=f['t']<shot['end']:continue
                rows=[x for x in f.get('plot_shapes',[]) if x['role']==rule['role'] and ('instance_index' not in rule or x.get('wire_index')==rule['instance_index'])]
                if rows:result.append((f['t'],rows[-1]))
            return result
        a,b=anchors(source),anchors(target)
        if not a or not b:raise MissingEvidence('跨镜头共同对象没有实际采样：'+rule['role'])
        first,second=a[-1][1],b[0][1]
        index=rule.get('point_index',0)
        delta=np.asarray(second['local_points'][index])-np.asarray(first['local_points'][index]);wanted=np.asarray(rule['world_origin_delta'])
        for axis in (0,1):
            if axis not in rule.get('axes',[0,1]):delta[axis]=0;wanted[axis]=0
        difference=delta-wanted;T=multiply_matrix(second['outer_to_screen'],second['base_to_canvas']);error=math.hypot(T[0]*difference[0]+T[2]*difference[1],T[1]*difference[0]+T[3]*difference[1]);pairs+=1
        if error>2:events.append({'t':b[0][0],'role':rule['role'],'source':rule['source'],'target':rule['target'],'pixel_error':error})
    if not pairs:raise MissingEvidence('当前短片未覆盖跨镜头声明的镜头对')
    gate.log('Suite H.align','已声明共同对象的跨镜头世界锚点映射',not events,'镜头相机变化与物理锚点分别处理；转场可读性另外人工审阅',{'source':'实际绘图角色/原点与配置独立声明的镜头间位移；最终像素误差','pairs_checked':pairs,'events':events[:20],'tolerance_px':2})

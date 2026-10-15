"""检查已声明的图外说明区和公式卡片，不以文字互不碰撞代替布局归属。"""
import re,numpy as np
from qa_evidence import numeric,MissingEvidence,read_json
def check_a_labels(gate):
    cfg=read_json(gate.project_dir/'physics_config.json');rules=cfg.get('plot_exclusion_regions')
    if not rules:return
    gate.inputs()
    if not set(rules).intersection(s['id'] for s in gate.manifest['timeline']):return
    samples=0;events=[]
    for f in gate.inputs():
        spec=rules.get(f['scene'])
        if not spec:continue
        camera=f['camera'];W,H=camera['pixel_width'],camera['pixel_height'];unit_x=W/camera['width_units'];unit_y=H/camera['height_units'];center=camera.get('center',[0,0])
        x0,y0,x1,y1=spec['plot_box'];plot=np.array([W/2+(x0-center[0])*unit_x,H/2-(y1-center[1])*unit_y,W/2+(x1-center[0])*unit_x,H/2-(y0-center[1])*unit_y])
        for b in f['text_boxes']:
            if not any(b['text'].replace(' ','').startswith(s.replace(' ','')) for s in spec['text_prefixes']):continue
            box=numeric(b['bbox'],4);samples+=1
            overlap=np.minimum(box[2:],plot[2:])-np.maximum(box[:2],plot[:2])
            if min(overlap)>2:events.append({'t':f['t'],'text':b['text'],'bbox':box.tolist(),'plot_box':plot.tolist()})
    if samples==0:raise MissingEvidence('图外说明文字没有实际可见边界')
    gate.log('GATE-01.labels','驻波说明位于声明图形区域之外',not events,evidence={'source':'真实 Text 边界与独立配置中的图形区域','samples':samples,'tolerance_px':2,'events':events[:20]})

def check_d_panels(gate):
    rules=gate.cfg.get('text_containers')
    if not rules:return
    samples=0;events=[]
    for f in gate.inputs():
        scenes={s['id'] for s in gate.manifest['timeline'] if s['start']<=f['t']<s['end']};groups={}
        for b in f['text_boxes']:
            if b.get('group'):groups.setdefault(b['group'],[]).append(b)
        for group in groups.values():
            text=''.join(b['text'] for b in group).replace(' ','')
            for rule in rules:
                if rule['scene'] not in scenes or not re.search(rule['pattern'],text):continue
                samples+=1;box=np.array([min(b['bbox'][0] for b in group),min(b['bbox'][1] for b in group),max(b['bbox'][2] for b in group),max(b['bbox'][3] for b in group)]);container=numeric(rule['bbox'],4)
                if box[0]<container[0]-2 or box[1]<container[1]-2 or box[2]>container[2]+2 or box[3]>container[3]+2:events.append({'t':f['t'],'text':text,'bbox':box.tolist(),'container':container.tolist()})
    ids={s['id'] for s in gate.manifest['timeline']}
    if any(r['scene'] in ids for r in rules) and samples==0:raise MissingEvidence('公式卡片没有匹配的实际文字采样')
    if samples:gate.log('Suite C.panels','实际公式完整位于所属卡片内',not events,evidence={'source':'实际 typesetMath 字形边界及独立卡片声明','samples':samples,'tolerance_px':2,'events':events[:20]})

def check_d_labels(gate):
    rules=gate.cfg.get('plot_label_rules')
    if not rules:return
    samples=0;events=[]
    for f in gate.inputs():
        if any(isinstance(s.get('transition'),dict) and 0<=f['t']-s['start']<s['transition'].get('dur',0) for s in gate.manifest['timeline']):continue
        graphs=[r for r in f.get('plot_shapes',[]) if r.get('scene') in rules and r['role'] in rules[r['scene']]['roles'] and r.get('visible_point_count',0)>0]
        for text in f['text_boxes']:
            if not any(text['text'].startswith(prefix) for rule in rules.values() for prefix in rule['prefixes']):continue
            a=numeric(text['bbox'],4);samples+=1
            for g in graphs:
                xy=numeric(g['screen_points'],2);b=np.r_[xy.min(axis=0),xy.max(axis=0)];overlap=np.minimum(a[2:],b[2:])-np.maximum(a[:2],b[:2])
                if min(overlap)>2:events.append({'t':f['t'],'text':text['text'],'role':g['role'],'bbox':a.tolist(),'plot_bbox':b.tolist()})
    if not samples:raise MissingEvidence('图外说明规则缺少实际文字采样')
    gate.log('Suite C.labels','稳定时段图例与注册曲线区域避让',not events,'转场可读性另由实际视觉验收承担',{'source':'最终画布实际文字框与实际曲线路径包围框','samples':samples,'tolerance_px':2,'events':events[:20]})

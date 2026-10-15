"""AM 发布排版测量：配置、实际字体/字形观测和实际图文净距分别检查。"""
from pathlib import Path
import argparse,copy,json,math,re,sys,uuid
import numpy as np
SKILL=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(SKILL/'scripts'))
from qa_evidence import validate_build,numeric,MissingEvidence,read_json,write_json

BASE_PT={'title':34,'body':18,'legend':16,'indicator':20,'section':24,'summary':22,'formula_main':28,'formula_secondary':24,'formula_step':26,'formula_expanded':23,'formula_summary_main':30,'formula_summary_secondary':28}
TEXT_PX={18:34.8324371053,20:38.718135,22:42.5760655263,24:46.4340031579,25:48.3768521053,26:50.3196939474,28:54.1776315789,30:58.0633223684,32:61.9490131579,36:69.6648813158}
A_HEIGHT={18:33.09081525,20:36.78222825,36:66.18163725}
MATH_FALLBACK_PX=[42.3100875*.9,36.6687425*.9]

def evaluate(cfg,frames,is_d,timeline):
    p=cfg['presentation'];rows=[]
    def add(id,status,evidence):rows.append({'id':id,'status':status,'evidence':evidence})
    desired={k:v+2 for k,v in BASE_PT.items()}
    add('typography.points','PASS' if p['font_pt']==desired and p['min_plot_text_gap_px']==24 else 'FAIL',{'actual':p['font_pt'],'expected':desired,'source':'配置与独立A基准字阶；不是实际字体读取'})
    if not frames:raise MissingEvidence('字体/间距没有同次编码帧观测')
    gaps=[];events=[];font_events=[];font_n=0;gap_n=0;observed=set();font_sizes=set();text_heights={}
    for f in frames:
        if is_d and any(isinstance(s.get('transition'),dict) and 0<=f['t']-s['start']<s['transition']['dur'] for s in timeline):continue
        if not is_d and any(a['type'] in ('Write','Create','FadeIn','FadeOut') for a in f.get('animations',[])):continue
        shapes=f.get('plot_shapes',[]) if is_d else f.get('plot_samples',[]);bounds=[]
        for g in shapes:
            if g['role'] not in ('signal','upper','lower','carrier','message','factor'):continue
            xy=numeric(g['screen_points'] if is_d else g['points'],2)
            if not is_d:
                c=f['camera'];center=c['center'];xy=np.column_stack([c['pixel_width']/2+(xy[:,0]-center[0])*c['pixel_width']/c['width_units'],c['pixel_height']/2-(xy[:,1]-center[1])*c['pixel_height']/c['height_units']])
            bounds.append((g['role'],np.r_[xy.min(axis=0),xy.max(axis=0)]))
        for b in f['text_boxes']:
            text=b['text'].replace(' ','');box=numeric(b['bbox'],4)
            if is_d and 'PuHui-' in b.get('font',''):
                size=float(re.search(r'([0-9.]+)px',b['font']).group(1));font_n+=1;font_sizes.add(size)
                expected=MATH_FALLBACK_PX if b.get('group') and 'NotoSansSC-500' in b['font'] else list(TEXT_PX.values())
                if min(abs(size-v) for v in expected)>.001:font_events.append({'t':f['t'],'font':b['font'],'actual_formula_group':b.get('group')})
            if not is_d:
                pt=36 if text.startswith('调幅AM：') else 20 if text.startswith('Ac=1V') or text.startswith('时间窗10ms') else 18 if text.startswith('蓝：载波') else None
                if pt is not None:
                    font_n+=1;observed.add(pt);text_heights.setdefault(pt,[]).append(float(box[3]-box[1]));error=abs(box[3]-box[1]-A_HEIGHT[pt])
                    if error>2:font_events.append({'t':f['t'],'text':text,'height_px':float(box[3]-box[1]),'expected_reference_height_px':A_HEIGHT[pt]})
            label=(text.startswith(('黄：','青：','载波（','归一化调制','幅度因子（','m=')) if is_d else text.startswith(('蓝：载波','时间窗10ms')))
            if not label:continue
            for role,g in bounds:
                # 只比较横向相交的整块图文；点位标注不纳入图区净距。
                if min(box[2],g[2])-max(box[0],g[0])<=0:continue
                gap=max(g[1]-box[3],box[1]-g[3]);gap_n+=1;gaps.append(float(gap))
                if gap<24:events.append({'t':f['t'],'role':role,'text':text,'gap_px':float(gap)})
    if font_n<20 or gap_n<20:raise MissingEvidence('字体或图文净距不足20个实际样本')
    if not is_d and observed!={18,20,36}:raise MissingEvidence('未覆盖AM标题/正文/图例的实际字形')
    add('typography.observed','FAIL' if font_events else 'PASS',{'samples':font_n,'events':font_events[:15],'observed_canvas_font_px':sorted(font_sizes),'observed_a_text_heights_px':{str(pt):[min(values),max(values)] for pt,values in text_heights.items()},'source':'D同帧Canvas真实font；A稳定期真实Text边界及独立Pango参考高度','tolerance':'D字号0.001px；A字形高度2px'})
    add('typography.gap','FAIL' if events else 'PASS',{'samples':gap_n,'min_gap_px':min(gaps),'threshold_px':24,'events':events[:15],'source':'同次编码帧的实际文字边界与实际曲线边界；显式转场/入退场另审'})
    return rows

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--project',required=True);ap.add_argument('--out',required=True);a=ap.parse_args();project=Path(a.project).resolve();manifest,frames,_=validate_build(project);cfg=read_json(project/'physics_config.json');is_d=(project/'qa/qa_gate.py').exists();folder=Path(a.out).resolve()/('typography_'+uuid.uuid4().hex[:10]);folder.mkdir(parents=True);cases=[]
    for label,bad,target,expected in [('真实AM逻辑字阶',None,'typography.points','PASS'),('真实AM字体观测',None,'typography.observed','PASS'),('真实AM图文净距',None,'typography.gap','PASS'),('错误逻辑字号','small','typography.points','FAIL'),('错误实际字体观测','font','typography.observed','FAIL'),('错误图文间距','gap','typography.gap','FAIL'),('空排版观测','empty','typography.input','NOT_RUN')]:
        config=copy.deepcopy(cfg);selected=frames
        if bad=='small':config['presentation']['font_pt']['body']-=2
        if bad in ('font','gap'):
            selected=list(frames);selected[300]=copy.deepcopy(frames[300]);boxes=selected[300]['text_boxes']
            b=boxes[0] if bad=='font' else next(b for b in boxes if b['text'].replace(' ','').startswith('青：' if is_d else '蓝：载波'))
            if bad=='font':
                if is_d:b['font']='24px "PuHui-Medium",sans-serif'
                else:b['bbox'][3]=b['bbox'][1]+(b['bbox'][3]-b['bbox'][1])/2
            else:b['bbox'][1]+=180;b['bbox'][3]+=180
        try:rows=evaluate(config,[] if bad=='empty' else selected,is_d,manifest['timeline'])
        except MissingEvidence as e:rows=[{'id':'typography.input','status':'NOT_RUN','detail':str(e)}]
        except Exception as e:rows=[{'id':'typography.error','status':'FAIL','detail':str(e)}]
        actual=next((r for r in rows if r['id']==target),{'status':'MISSING'})
        cases.append({'case':label,'scope':'typography','passed':actual['status']==expected,'run_id':manifest['run_id'],'expected':expected,'target':target,'actual':actual,'level':'合法全片真实观测；错误字号/空输入为测量器数据注入，非真实重渲染负例'})
    write_json(folder/'report.json',{'cases':cases,'source_project':str(project),'run_id':manifest['run_id']});print([(r['case'],r['passed']) for r in cases],flush=True);return 0 if all(r['passed'] for r in cases) else 1

if __name__=='__main__':raise SystemExit(main())

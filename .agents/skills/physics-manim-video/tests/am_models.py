"""AM 生产验证器计算层正负例；数据夹具不冒充实际成片观测。"""
from pathlib import Path
import copy,json,sys,uuid,numpy as np
import argparse
SKILL=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(SKILL/'scripts'))
from qa_evidence import Gate,read_json,write_json
from am_checks import check_am,formula_proof
ap=argparse.ArgumentParser();ap.add_argument('--out',required=True);args=ap.parse_args()
cfg=read_json(SKILL/'topics/am/physics_config.json');cfg.pop('modulation_schedule',None);cfg['drawing_bindings']={'AMTeach':{r:{'x_origin':-5,'time_per_x':.001,'baseline':-.6,'y_scale':.55} for r in ('carrier','signal','upper','lower')}};cfg['drawing_bindings']['AMTeach']['spectrum']={'frequency_origin_hz':800,'x_origin':-4,'x_scale':.02,'baseline':-1.5,'y_scale':1.5};folder=Path(args.out).resolve()/('am_models_'+uuid.uuid4().hex[:10]);folder.mkdir(parents=True);write_json(folder/'physics_config.json',cfg);frames=[]
std=r's(t)=A_c[1+m\cos(2\pi f_m t)]\cos(2\pi f_c t)';env=r'E_{\rm env}=A_c|1+m\cos(2\pi f_m t)|'
for i in range(120):
    video_t=i/30;m=[0,.6,1,1.2][i//30];x=np.linspace(-5,5,601);u=video_t*.001+(x+5)*.001;factor=1+m*np.cos(2*np.pi*100*u);sig=factor*np.cos(2*np.pi*1000*u);plots=[]
    for role,y in [('carrier',np.cos(2*np.pi*1000*u)),('signal',sig),('upper',abs(factor)),('lower',-abs(factor))]:plots.append({'role':role,'kind':'curve','sim_t':video_t,'parameters':{'m':m},'points':np.column_stack([x,-.6+.55*y]).tolist()})
    plots.append({'role':'spectrum','kind':'stems','sim_t':video_t,'parameters':{'m':m},'vectors':[{'start':[x,-1.5],'end':[x,-1.5+1.5*a]} for x,a in [(-2,m/2),(0,1),(2,m/2)]]});frames.append({'frame_index':i,'t':video_t,'scene':'AMTeach','plot_samples':plots,'text_boxes':[{'text':std,'type':'MathTex'},{'text':env,'type':'MathTex'}]})
rows=[]
for name,bad,target,expected in [('合法四档',None,'GATE-10.am.signal','PASS'),('合法包络',None,'GATE-10.am.envelope','PASS'),('合法频谱',None,'GATE-10.am.spectrum','PASS'),('合法实际积分',None,'GATE-10.am.integral','PASS'),('错误包络','envelope','GATE-10.am.envelope','FAIL'),('错误边带位置','frequency','GATE-10.am.spectrum','FAIL'),('错误边带幅度','amplitude','GATE-10.am.spectrum','FAIL'),('错误时间映射','time','GATE-10.am.time','FAIL'),('空采样','empty','GATE-10.am.signal','NOT_RUN'),('非有限采样','nan','GATE-10.am.error','FAIL')]:
    g=Gate(folder/name);g.project_dir.mkdir();write_json(g.project_dir/'physics_config.json',cfg);g.frames=copy.deepcopy(frames);g.manifest={'run_id':'计算夹具','timeline':[{'id':'AMTeach'}]}
    if bad=='envelope':
        for f in g.frames[90:]:
            r=next(r for r in f['plot_samples'] if r['role']=='upper');xy=np.asarray(r['points']);u=f['t']*.001+(xy[:,0]+5)*.001;xy[:,1]=-.6+.55*(1+1.2*np.cos(2*np.pi*100*u));r['points']=xy.tolist()
    elif bad in ('frequency','amplitude'):
        for f in g.frames:
            r=f['plot_samples'][-1]['vectors'][0]
            if bad=='frequency':r['start'][0]+=.8;r['end'][0]+=.8
            else:r['end'][1]=r['start'][1]+(r['end'][1]-r['start'][1])*1.5
    elif bad=='time':
        for f in g.frames:
            for r in f['plot_samples']:r['sim_t']*=2
    elif bad=='empty':g.frames=[]
    elif bad=='nan':g.frames[-1]['plot_samples'][0]['points'][0][1]=float('nan')
    g.invoke('GATE-10.am',lambda:check_am(g));matches=[r for r in g.results if r['id']==target];r=matches[-1] if matches else {};rows.append({'case':name,'target':target,'passed':r.get('status')==expected,'expected':expected,'evidence':r,'level':'生产数学检查器计算层输入，不代表视频或首稿验收'});print(name+'：'+str(rows[-1]['passed']),flush=True)
write_json(folder/'report.json',{'cases':rows,'passed':sum(r['passed'] for r in rows),'total':len(rows)});print(folder/'report.json');raise SystemExit(0 if all(r['passed'] for r in rows) else 1)

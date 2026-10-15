"""AM 真实短探针正负例；不把缺少四档的探针作为完整教学验收。"""
from pathlib import Path
import argparse,json,subprocess,sys,uuid
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out',required=True);a=ap.parse_args();skill=Path(__file__).resolve().parents[1];is_d=(skill/'scripts/engine').is_dir();folder=Path(a.out).resolve()/('am_rendered_'+uuid.uuid4().hex[:10]);folder.mkdir(parents=True);rows=[];prefix='Suite I.am' if is_d else 'GATE-10.am'
    for case,bad,expected in [('合法真实AM探针',None,{prefix+'.signal':'PASS',prefix+'.envelope':'PASS',prefix+'.spectrum':'PASS',prefix+'.time':'PASS',prefix+'.formulas':'PASS'}),('错误包络','envelope',{prefix+'.signal':'PASS',prefix+'.envelope':'FAIL'}),('错误边带位置','frequency',{prefix+'.signal':'PASS',prefix+'.spectrum':'FAIL'}),('错误边带幅度','amplitude',{prefix+'.signal':'PASS',prefix+'.spectrum':'FAIL'})]:
        project=folder/case;subprocess.run([sys.executable,str(skill/'scripts/init_project.py'),'--target',str(project),'--topic','am'],check=True,capture_output=True);cfg=json.loads((project/'physics_config.json').read_text(encoding='utf-8'))
        if is_d:
            b=cfg['drawing_bindings']['shot4'];b.update({r:{'x_origin':150,'time_per_x':.01/1620,'baseline':480,'y_scale':50} for r in ('signal','upper','lower')});b['anchor']={'start':[150,480],'end':[1770,480]};b['spectrum']={'frequency_origin_hz':800,'x_origin':1000,'x_scale':2,'baseline':780,'y_scale':90}
            (project/'src/eras.js').write_text("window.SCENE_LIBS=['scenes/physics_common.js','scenes/am_common.js'];window.ERAS=[{id:'shot4',dur:2}];",encoding='utf-8');(project/'src/scenes/shot4.js').write_text("SCENES.shot4={draw(c,lt,gt){AM.draw(c,lt,gt,'shot4',1.2);AM.spectrum(c,'shot4',gt*.001,1.2);}};",encoding='utf-8');source=project/'src/scenes/am_common.js';code=source.read_text(encoding='utf-8');changes={'envelope':('AC*Math.abs(factor(t,m))','AC*factor(t,m)'),'frequency':('freqs=[FC-FM,FC,FC+FM]','freqs=[FC-FM+40,FC,FC+FM]'),'amplitude':('m*AC/2','m*AC/3')};render=[sys.executable,str(project/'src/render.py'),'--out',str(project/'final.mp4')]
        else:
            cfg['drawing_bindings']['AMTeach']['spectrum'].update(baseline=-2.7,y_scale=.3);cfg['modulation_schedule']=[{'start':0,'end':2,'from':1.2,'to':1.2}];(project/'src/scene_am.py').write_bytes((skill/'tests/am_probe.py').read_bytes());source=project/'src/am_style.py';code=source.read_text(encoding='utf-8');changes={'envelope':('AC*np.abs(factor(time,m))','AC*factor(time,m)'),'frequency':('freqs=[FC-FM,FC,FC+FM]','freqs=[FC-FM+40,FC,FC+FM]'),'amplitude':('m*AC/2','m*AC/3')};render=[sys.executable,str(project/'scripts/build_video.py'),'--project-dir',str(project),'--quality','high']
        if bad:
            if changes[bad][0] not in code:raise ValueError('AM 故障注入位置不存在：'+bad)
            code=code.replace(*changes[bad]);source.write_text(code,encoding='utf-8')
        (project/'physics_config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2),encoding='utf-8')
        if is_d:
            (project/'src/physics_config.json').write_text(json.dumps(cfg),encoding='utf-8');(project/'src/physics_config.js').write_text('window.PHYSICS_CONFIG='+json.dumps(cfg)+';',encoding='utf-8');spec=json.loads((project/'animation_spec.json').read_text(encoding='utf-8'));spec['physics']=cfg;(project/'animation_spec.json').write_text(json.dumps(spec),encoding='utf-8')
        logs=project/'qa/am_test_logs';logs.mkdir();print('AM 真实渲染：'+case,flush=True)
        with (logs/'render.log').open('w',encoding='utf-8') as f:r=subprocess.run(render,stdout=f,stderr=subprocess.STDOUT)
        with (logs/'gate.log').open('w',encoding='utf-8') as f:q=subprocess.run([sys.executable,str(project/('qa/qa_gate.py' if is_d else 'scripts/qa_gate.py')),'--project-dir',str(project)],stdout=f,stderr=subprocess.STDOUT)
        data=json.loads((project/'qa/qa_result.json').read_text(encoding='utf-8'));items={r['id']:r for r in data['results']};passed=r.returncode==0 and all(items.get(k,{}).get('status')==v for k,v in expected.items()) and (q.returncode==1 if bad else True)
        rows.append({'case':case,'passed':passed,'run_id':data['run_id'],'render_exit':r.returncode,'qa_exit':q.returncode,'expected':expected,'evidence':{k:items.get(k) for k in expected},'project':str(project),'scope':'真实模型短探针，只对指定目标断言；缺少四档/跨镜头时总体不完整并保留非零'})
        (folder/'report.json').write_text(json.dumps({'cases':rows,'passed':sum(r['passed'] for r in rows),'total':len(rows)},ensure_ascii=False,indent=2),encoding='utf-8');print(case+'：'+str(passed),flush=True)
    return 0 if rows and all(r['passed'] for r in rows) else 1
if __name__=='__main__':raise SystemExit(main())

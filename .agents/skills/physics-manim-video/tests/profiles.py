"""两个包各自真实渲染非对称卷积正负例；记录限定检查能力。"""
from pathlib import Path
import argparse,json,subprocess,sys,uuid
def main():
    p=argparse.ArgumentParser();p.add_argument('--out',required=True);a=p.parse_args();skill=Path(__file__).resolve().parents[1];is_d=(skill/'scripts/engine').is_dir();folder=Path(a.out).resolve()/('profiles_'+uuid.uuid4().hex[:10]);folder.mkdir(parents=True);rows=[]
    prefix='Suite I.profile' if is_d else 'GATE-10'
    for case,bad,expected in [('合法非对称核',None,{prefix+'.flip':'PASS',prefix+'.actual':'PASS'}),('漏翻转','flip',{prefix+'.flip':'FAIL'}),('逐点输出错误','output',{prefix+'.flip':'PASS',prefix+'.actual':'FAIL'})]:
        project=folder/case;subprocess.run([sys.executable,str(skill/'scripts/init_project.py'),'--target',str(project),'--topic','convolution'],check=True,capture_output=True)
        cfg=json.loads((project/'physics_config.json').read_text(encoding='utf-8'));cfg['input_profiles']={'f':[[-1,1,1]],'g':[[0,.5,1],[.5,2,.3]]}
        if is_d:
            cfg['drawing_bindings']={k:{'origin':[960,780 if k=='output' else 400],'x_scale':150,'y_scale':130} for k in ('f','g','output')};code=(skill/'tests/asymmetric_scene.js').read_text(encoding='utf-8');code=code.replace('OMIT_FLIP=false','OMIT_FLIP=true') if bad=='flip' else code.replace('OUTPUT_ERROR=0','OUTPUT_ERROR=.25') if bad=='output' else code
            (project/'src/scenes/profile.js').write_text(code,encoding='utf-8');(project/'src/eras.js').write_text("window.SCENE_LIBS=[];window.ERAS=[{id:'profile',dur:2}];",encoding='utf-8')
            spec=json.loads((project/'animation_spec.json').read_text(encoding='utf-8'));spec['physics']=cfg;(project/'animation_spec.json').write_text(json.dumps(spec),encoding='utf-8');(project/'src/physics_config.json').write_text(json.dumps(cfg),encoding='utf-8');(project/'src/physics_config.js').write_text('window.PHYSICS_CONFIG='+json.dumps(cfg)+';',encoding='utf-8')
            render=[sys.executable,str(project/'src/render.py'),'--out',str(project/'final.mp4')]
        else:
            cfg['drawing_bindings']={'Scene2_FlipSlide':{'f':{'baseline':1,'y_scale':.8},'g':{'baseline':1,'y_scale':.8},'output':{'baseline':-1.8,'y_scale':.7}}};code=(skill/'tests/asymmetric_scene.py').read_text(encoding='utf-8');code=code.replace('OMIT_FLIP=False','OMIT_FLIP=True') if bad=='flip' else code.replace('OUTPUT_ERROR=0.0','OUTPUT_ERROR=.25') if bad=='output' else code
            (project/'src/scene0_profile.py').write_text(code,encoding='utf-8');(project/'src/scene2_flip_slide.py').rename(project/'qa/original_scene2_flip_slide.py');render=[sys.executable,str(project/'scripts/build_video.py'),'--project-dir',str(project),'--scene','Scene2_FlipSlide','--quality','high']
        (project/'physics_config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2),encoding='utf-8');logs=project/'qa/profile_logs';logs.mkdir()
        print('非对称核真实渲染：'+case,flush=True)
        with (logs/'render.log').open('w',encoding='utf-8') as f:r=subprocess.run(render,stdout=f,stderr=subprocess.STDOUT)
        with (logs/'qa.log').open('w',encoding='utf-8') as f:q=subprocess.run([sys.executable,str(project/('qa/qa_gate.py' if is_d else 'scripts/qa_gate.py')),'--project-dir',str(project)],stdout=f,stderr=subprocess.STDOUT)
        data=json.loads((project/'qa/qa_result.json').read_text(encoding='utf-8'));items={r['id']:r for r in data['results']};passed=r.returncode==0 and all(items.get(k,{}).get('status')==v for k,v in expected.items()) and (q.returncode==1 if bad else True)
        rows.append({'case':case,'passed':passed,'run_id':data['run_id'],'render_exit':r.returncode,'qa_exit':q.returncode,'overall':data['overall_status'],'expected':expected,'evidence':{k:items.get(k) for k in expected},'project':str(project),'scope':'只证明实际非对称核模型检查；探针没有跨镜头和完整教学分镜'})
        (folder/'report.json').write_text(json.dumps({'cases':rows,'passed':sum(x['passed'] for x in rows),'total':len(rows)},ensure_ascii=False,indent=2),encoding='utf-8');print(case+'：'+str(passed),flush=True)
    return 0 if all(x['passed'] for x in rows) else 1
if __name__=='__main__':raise SystemExit(main())

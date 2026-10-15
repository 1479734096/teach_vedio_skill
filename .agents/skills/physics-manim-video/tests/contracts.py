"""包内配置、来源、汇总、公开入口和控制器回归；每例保留独立工程证据。"""
from pathlib import Path
import argparse,copy,json,subprocess,sys,uuid,shutil
from unittest.mock import patch
SKILL=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(SKILL/'scripts'))
import qa_gate as production
from qa_evidence import Gate,MissingEvidence,read_json,write_json,validate_build

def clone(source,target):
    m=read_json(source/'qa/build_manifest.json');target.mkdir(parents=True)
    for rel in m['inputs']:
        for src in (source/rel,source/'qa/build_inputs'/m['run_id']/rel):
            dst=target/src.relative_to(source);dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
    for rel in ('final.mp4','qa/build_manifest.json','qa/telemetry.json','qa/runtime.json'):
        dst=target/rel;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source/rel,dst)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--project',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
    source=Path(a.project).resolve();folder=Path(a.out).resolve()/('contracts_'+uuid.uuid4().hex[:10]);folder.mkdir(parents=True);rows=[];is_d=hasattr(production,'QAGate')
    def record(case,passed,**evidence):
        rows.append({'case':case,'passed':bool(passed),'evidence':evidence});print(case+'：'+str(bool(passed)),flush=True)
    def mutate_json(p,rel,fn):
        data=read_json(p/rel);fn(data);(p/rel).write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')
    mutations=[('合法来源',None,'PASS'),('旧遥测',lambda p:mutate_json(p,'qa/telemetry.json',lambda d:d.update(run_id=uuid.uuid4().hex)),'FAIL'),('空遥测',lambda p:mutate_json(p,'qa/telemetry.json',lambda d:d.update(frames=[])),'NOT_RUN'),('NaN时间',lambda p:mutate_json(p,'qa/telemetry.json',lambda d:d['frames'][10].update(t=float('nan'))),'FAIL'),('视频规格来源被改',lambda p:mutate_json(p,'qa/build_manifest.json',lambda d:d['video'].update(fps=15)),'FAIL'),('源码变化',lambda p:next((p/'src').glob('scenes/shot*.js' if is_d else 'scene*.py')).write_text('// changed\n' if is_d else '# changed\n',encoding='utf-8'),'FAIL'),('缺失视频',lambda p:(p/'final.mp4').unlink(),'NOT_RUN')]
    for case,mutation,expected in mutations:
        p=folder/case;clone(source,p)
        if mutation:mutation(p)
        try:validate_build(p);status='PASS';detail='同次构建匹配'
        except MissingEvidence as e:status='NOT_RUN';detail=str(e)
        except Exception as e:status='FAIL';detail=str(e)
        record(case,status==expected,status=status,expected=expected,detail=detail,project=str(p))
        if case!='合法来源':
            r=subprocess.run([sys.executable,str(SKILL/'scripts/qa_gate.py'),'--project-dir',str(p)],capture_output=True,encoding='utf-8',errors='replace')
            result=read_json(p/'qa/qa_result.json');record(case+'公开门禁非零',r.returncode!=0 and result['overall_status']!='PASS',exit_code=r.returncode,overall=result['overall_status'])
    if is_d:
        for name,bad,expected in [('合法可见采样',None,'PASS'),('可见采样计数NaN','nan','FAIL'),('空可见采样证据','empty','NOT_RUN')]:
            g=production.QAGate(source);g.cfg=read_json(source/'physics_config.json');g.inputs();g.frames=copy.deepcopy(g.frames)
            if bad:
                shape=next(r for f in g.frames for r in f['plot_shapes'] if r.get('visible_point_count',0)>0)
                if bad=='nan':shape['visible_point_count']=float('nan')
                else:shape['visible_screen_points']=[]
            g.invoke('guard',lambda:production.check_d_plots(g));status=g.results[-1]['status'];record(name,status==expected,status=status,expected=expected,evidence=g.results[-1])
    with patch('qa_evidence.tool',side_effect=MissingEvidence('模拟ffprobe不可用')):
        try:validate_build(source);status='PASS'
        except MissingEvidence:status='NOT_RUN'
    record('生产工具查找失败',status=='NOT_RUN',status=status)
    for label,status,critical,applicable,expected in [('关键未运行','NOT_RUN',True,True,'INCOMPLETE'),('适用失败','FAIL',True,True,'FAIL'),('明确不适用','NOT_RUN',True,False,'PASS')]:
        g=Gate(folder/label);g.project_dir.mkdir();g.log('test',label,status,critical=critical,applicable=applicable);passed=g.report();d=read_json(g.project_dir/'qa/qa_result.json');record(label,d['overall_status']==expected and passed==(expected=='PASS'),result=d)
    # 空主题、NaN、未知主题不得取得配置级数学通过。
    if not is_d:
        for name,cfg,expected in [('合法配置',read_json(source/'physics_config.json'),'PASS'),('未知模型',{'topic':'unregistered','parameters':{'value':1}},'INCOMPLETE'),('空参数',{'topic':'standing_wave','parameters':{}},'FAIL'),('NaN参数',{'topic':'convolution','parameters':{'pulse_width':float('nan'),'pulse_height':1}},'FAIL')]:
            config=folder/(name+'.json');config.write_text(json.dumps(cfg),encoding='utf-8');out=folder/(name+'_result.json');r=subprocess.run([sys.executable,str(SKILL/'scripts/verify_physics.py'),'--config',str(config),'--output',str(out)],capture_output=True);d=read_json(out);record(name,d['overall_status']==expected and r.returncode==(0 if expected=='PASS' else 1),status=d['overall_status'],exit_code=r.returncode)
        for case,tex,expected in [('正确恒等式',r'\cos(\alpha-\delta)+\cos(\alpha+\delta)=2\cos\delta\cos\alpha',True),('错误恒等式',r'\cos(\alpha-\delta)+\cos(\alpha+\delta)=\cos\delta\cos\alpha',False)]:
            result=production.trig_relation(tex);record(case,result[0]==expected,residuals=result[1])
        p=folder/'无效Tracker';(p/'src').mkdir(parents=True);(p/'src/scene1.py').write_text('from manim import *\nclass S(Scene):\n def construct(self):\n  t=ValueTracker(0)\n  t.get_value()\n  self.play(t.animate.set_value(2))\n',encoding='utf-8');g=production.QAEvaluator(p);g.invoke('GATE-04',g.check_gate_04_tracker_binding);r=next(r for r in g.results if r['id']=='GATE-04.ast');record('AST拒绝游离get_value',r['status']=='FAIL',result=r)
        p=folder/'语法错误';(p/'src').mkdir(parents=True);(p/'src/scene1.py').write_text('class S(:\n',encoding='utf-8');r=subprocess.run([sys.executable,str(SKILL/'scripts/qa_gate.py'),'--project-dir',str(p)],capture_output=True);d=read_json(p/'qa/qa_result.json');record('语法错误仍有结构化报告',r.returncode!=0 and any(x['status']=='FAIL' for x in d['results']),exit_code=r.returncode,report=str(p/'qa/qa_result.json'))
    if not is_d:
        p=folder/'未实现反射';(p/'src').mkdir(parents=True);write_json(p/'physics_config.json',{'topic':'standing_wave','parameters':{'wavelength':6,'period':2,'amplitude':1,'reflection_coeff':.5,'x_term':4.2}});g=production.QAEvaluator(p);g.invoke('GATE-10',g.check_gate_10_math_model);r=g.results[-1];record('未实现反射边界阻断',r['id']=='GATE-10.input' and r['status']=='NOT_RUN' and '反射边界' in r['detail'],result=r)
        p=folder/'缺少数学模型';(p/'src').mkdir(parents=True);g=production.QAEvaluator(p);g.invoke('GATE-10',g.check_gate_10_math_model);r=g.results[-1];record('缺少数学模型阻断',r['status']=='FAIL',result=r)
    else:
        g=production.QAGate(source);g.cfg={'topic':'unregistered','parameters':{'value':1}};g.invoke('Suite I',g.check_suite_i);r=g.results[-1];record('未知实际模型阻断',r['id']=='Suite I.input' and r['status']=='NOT_RUN',result=r)
        p=folder/'other.mp4';r=subprocess.run([sys.executable,str(SKILL/'scripts/engine/render.py'),'--out',str(p)],capture_output=True,encoding='utf-8',errors='replace');record('拒绝混用其他输出视频',r.returncode!=0 and not p.exists() and '拒绝把旧 final.mp4' in r.stdout+r.stderr,exit_code=r.returncode,output_created=p.exists())
    for topic in sorted(x.name for x in (SKILL/'topics').iterdir() if x.is_dir()):
        p=folder/('init_'+topic);cmd=[sys.executable,str(SKILL/'scripts/init_project.py'),'--target',str(p),'--topic',topic];r=subprocess.run(cmd,capture_output=True);record('初始化完整主题_'+topic,r.returncode==0 and any((p/'src').glob('scenes/shot*.js' if is_d else 'scene*.py')),exit_code=r.returncode,project=str(p));before=(p/'physics_config.json').read_bytes();r=subprocess.run(cmd,capture_output=True);record('拒绝非空覆盖_'+topic,r.returncode!=0 and before==(p/'physics_config.json').read_bytes(),exit_code=r.returncode)
    if is_d:
        import auto_fix
        try:auto_fix.auto_fix_loop(folder/'越过修复上限',4);blocked=False
        except ValueError:blocked=True
        record('修复上限不可越过',blocked)
        p=folder/'旧PASS';(p/'qa').mkdir(parents=True);(p/'qa/qa_gate.py').write_text('raise SystemExit(0)\n',encoding='utf-8');write_json(p/'qa/qa_result.json',{'is_all_pass':True,'overall_status':'PASS'});passed,_,d=auto_fix.run_qa_round(p);record('修复控制器拒绝旧PASS',not passed and d['overall_status']=='INCOMPLETE',result=d)
        p=folder/'修复无动作';subprocess.run([sys.executable,str(SKILL/'scripts/init_project.py'),'--target',str(p),'--topic','standing_wave'],check=True,capture_output=True);before=(p/'physics_config.json').read_bytes();r=subprocess.run([sys.executable,str(SKILL/'scripts/auto_fix.py'),'--project',str(p)],capture_output=True);d=read_json(p/'qa/fix_logs/final_review.json');record('无动作停止并保留最终复核',r.returncode==1 and len(d['history'])==1 and not d['passed'] and before==(p/'physics_config.json').read_bytes(),result=d)
    write_json(folder/'report.json',{'cases':rows,'passed':sum(x['passed'] for x in rows),'total':len(rows),'source_run_id':read_json(source/'qa/build_manifest.json')['run_id']});print(str(folder/'report.json'),flush=True)
    return 0 if rows and all(r['passed'] for r in rows) else 1

if __name__=='__main__':raise SystemExit(main())

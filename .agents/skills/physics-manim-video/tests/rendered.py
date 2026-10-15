"""包内真实渲染回归，始终从完整主题创建新工程。"""
from pathlib import Path
import argparse,json,subprocess,sys,uuid

A_SCENES=[
('无效Tracker','''from manim import *
from qa_runtime import attach_audit
attach_audit()
class Probe(Scene):
 def construct(self):
  clock=ValueTracker(0);self.add(Rectangle());clock.get_value()
  self.play(clock.animate.set_value(2),run_time=2,rate_func=linear)
''',{'GATE-04.ast':'FAIL','GATE-04.runtime':'FAIL'}),
('中途公式碰撞','''from manim import *
from qa_runtime import attach_audit
attach_audit()
class Probe(Scene):
 def construct(self):
  a=MathTex('x=1').shift(LEFT*2);b=MathTex('y=2');self.add(a,b)
  self.play(a.animate.shift(RIGHT*4),run_time=2,rate_func=linear)
''',{'GATE-01.collision':'FAIL','GATE-09.transforms':'FAIL'}),
('错误恒等式','''from manim import *
from qa_runtime import attach_audit
attach_audit()
class Probe(Scene):
 def construct(self):
  self.add(MathTex(r'\\cos(\\alpha-\\delta)+\\cos(\\alpha+\\delta)=\\cos\\delta\\cos\\alpha'));self.wait(2)
''',{'GATE-10.formulas':'FAIL'}),
('复制残影','''from manim import *
from qa_runtime import attach_audit
attach_audit()
class Probe(Scene):
 def construct(self):
  a=MathTex('x=1');b=MathTex('x=2');self.add(a)
  self.play(TransformMatchingShapes(a.copy(),b),run_time=2);self.wait(.2)
''',{'GATE-01.collision':'FAIL'}),
('字幕越界','''from manim import *
from qa_runtime import attach_audit
attach_audit()
class Probe(Scene):
 def construct(self):
  self.add(MathTex('x=1').shift(DOWN*3.6));self.wait(2)
''',{'GATE-02.boundary':'FAIL'}),
('合法复制','''from manim import *
from qa_runtime import attach_audit
attach_audit()
class Probe(Scene):
 def construct(self):
  a=MathTex('x=1').shift(LEFT*2);b=MathTex('x=1').shift(RIGHT*2);self.add(a)
  self.play(TransformFromCopy(a,b),run_time=2);self.wait(.2)
''',{'GATE-01.collision':'PASS','GATE-09.transforms':'PASS'}),
]

def main():
    p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('--only');a=p.parse_args()
    skill=Path(__file__).resolve().parents[1];route='D' if (skill/'scripts/engine').is_dir() else 'A';folder=Path(a.out).resolve()/('rendered_'+uuid.uuid4().hex[:10]);folder.mkdir(parents=True);rows=[]
    definitions=[]
    if route=='A':
        definitions=[(name,'standing_wave',None,None,source,expected,'Probe',None) for name,source,expected in A_SCENES]
        definitions += [('生产模型错误','standing_wave','src/style.py',('return 2 * AMPLITUDE * np.cos(BETA * x) * np.cos(OMEGA * t)','return 2.6 * AMPLITUDE * np.cos(BETA * x) * np.cos(OMEGA * t)'),None,{'GATE-10.actual':'FAIL'},'Scene2_Derivation',None),('正确模型错误绘图','standing_wave','src/scene2_derivation.py',('standing_wave(x, t_tracker.get_value()) * 0.22','standing_wave(x, t_tracker.get_value()) * 0.32'),None,{'GATE-10.actual':'PASS','GATE-10.mapping':'FAIL'},'Scene2_Derivation',None)]
    else:
        definitions=[
        ('波速错误','standing_wave','src/scenes/wave_common.js',('const ui = (x, t) => A * Math.cos(OMEGA * t - BETA * x);','const ui = (x, t) => A * Math.cos(1.2 * OMEGA * t - BETA * x);'),None,{'Suite I.velocity_incident':'FAIL'},None,['--to','6']),
        ('方向错误','standing_wave','src/scenes/wave_common.js',('const ui = (x, t) => A * Math.cos(OMEGA * t - BETA * x);','const ui = (x, t) => A * Math.cos(OMEGA * t + BETA * x);'),None,{'Suite I.velocity_incident':'FAIL'},None,['--to','6']),
        ('LC能量错误','lc_circuit','src/scenes/lc_common.js',('const qVal = t => CHARGE_AMPLITUDE * Math.cos(OMEGA0 * t);','const qVal = t => 1.3 * CHARGE_AMPLITUDE * Math.cos(OMEGA0 * t);'),None,{'Suite I.lc_energy':'FAIL'},None,None),
        ('正确LC模型错误绘图','lc_circuit','src/scenes/shot4.js',('const sy = oy - W.qVal(curT);','const sy = oy - 1.3 * W.qVal(curT);'),None,{'Suite I.lc_model':'PASS','Suite I.screen_mapping':'FAIL'},None,None),
        ('LC屏上电流公式错误','lc_circuit','src/scenes/shot2.js',("{ s: '+', gap: 4 },","{ s: '−', gap: 4 },"),None,{'Suite I.lc_model':'PASS','Suite I.lc_formula_quarter':'FAIL'},None,None),
        ('LC屏上KVL错误','lc_circuit','src/scenes/shot5.js',("{ s: '−', col: TEXT_MAIN, gap: 8 },","{ s: '+', col: TEXT_MAIN, gap: 8 },"),None,{'Suite I.lc_model':'PASS','Suite I.lc_formula_kvl':'FAIL'},None,None),
        ('卷积漏翻转','convolution','src/scenes/shot2.js',('const flipScale = lerp(1.0, -1.0, flipP);','const flipScale = 1.0;'),None,{'Suite I.conv_flip':'FAIL','Suite I.screen_mapping':'FAIL'},None,None),
        ('RC时间常数错误','rc_circuit','src/scenes/rc_common.js',('V0 * (1 - Math.exp(-t / TAU))','V0 * (1 - Math.exp(-t / (1.5 * TAU)))'),None,{'Suite I.rc_fit_charge':'FAIL'},None,None),
        ('实际节点标记漂移','standing_wave','src/scenes/shot4.js',('const sx = W.toScrX(nx);','const sx = W.toScrX(nx) + 10;'),None,{'Suite I.nodes':'PASS','Suite I.screen_mapping':'FAIL'},None,None),
        ('错误帧率','standing_wave',None,None,None,{'Suite F.stream':'FAIL'},None,['--to','6','--fps','15'])]
    if route=='A':
        definitions += [
        ('图内说明','standing_wave','src/scene3_nodes.py',('label_anti.move_to([2.4, 1.55, 0])','label_anti.next_to(dot_anti, UP, buff=0.8).shift(LEFT*1.8)'),None,{'GATE-01.labels':'FAIL','GATE-10.mapping':'PASS'},'Scene3_Nodes',None),
        ('单帧可见曲线瞬移','standing_wave','src/scene2_derivation.py',('standing_wave(x, t_tracker.get_value()) * 0.22','standing_wave(x, t_tracker.get_value()) * 0.22 + (0.2 if abs(t_tracker.get_value()-1.5)<.01 else 0)'),None,{'GATE-10.actual':'PASS','GATE-10.mapping':'FAIL'},'Scene2_Derivation',None)]
    else:
        definitions += [
        ('公式超出所属卡片','rc_circuit','src/scenes/shot5.js',("{ s: '令时间常数', col: TEXT_MUTED, gap: 10 },","{ s: '令时间常数（错误地把过长解释与时间常数反复挤入同一行，导致公式越过卡片边界）', col: TEXT_MUTED, gap: 10 },"),None,{'Suite C.panels':'FAIL','Suite I.rc_fit_charge':'PASS'},None,None),
        ('单帧可见曲线瞬移','lc_circuit','src/scenes/shot4.js',('const sy = oy - W.qVal(curT);','const sy = oy - W.qVal(curT) + (Math.abs(gt-19)<.01 ? 20 : 0);'),None,{'Suite I.lc_model':'PASS','Suite I.screen_mapping':'FAIL'},None,None)]
    if route=='A':
        definitions.append(('实际节点标记漂移','standing_wave','src/scene3_nodes.py',('x_node = X_TERM - WAVELENGTH / 4','x_node = X_TERM - WAVELENGTH / 4 + .3'),None,{'GATE-10.actual':'PASS','GATE-10.mapping':'FAIL'},'Scene3_Nodes',None))
    for name,topic,file,change,source,expected,scene,options in definitions:
        if a.only and name not in a.only.split(','):continue
        project=folder/name;subprocess.run([sys.executable,str(skill/'scripts/init_project.py'),'--target',str(project),'--topic',topic],check=True,capture_output=True)
        if file:
            path=project/file;code=path.read_text(encoding='utf-8')
            if change[0] not in code:raise RuntimeError('实际注入位置缺失：'+name)
            path.write_text(code.replace(*change),encoding='utf-8')
        if source:(project/'src/scene0_probe.py').write_text(source,encoding='utf-8')
        render=[sys.executable,str(project/'src/render.py'),'--out',str(project/'final.mp4')]+(options or []) if route=='D' else [sys.executable,str(project/'scripts/build_video.py'),'--project-dir',str(project),'--scene',scene,'--quality','high']
        logs=project/'qa/test_logs';logs.mkdir()
        print('实际渲染回归：'+name,flush=True)
        with (logs/'render.log').open('w',encoding='utf-8') as f:r=subprocess.run(render,stdout=f,stderr=subprocess.STDOUT)
        gate=project/('qa/qa_gate.py' if route=='D' else 'scripts/qa_gate.py')
        with (logs/'gate.log').open('w',encoding='utf-8') as f:q=subprocess.run([sys.executable,str(gate),'--project-dir',str(project)],stdout=f,stderr=subprocess.STDOUT)
        data=json.loads((project/'qa/qa_result.json').read_text(encoding='utf-8'));items={x['id']:x for x in data['results']}
        passed=r.returncode==0 and all(items.get(k,{}).get('status')==v for k,v in expected.items()) and (q.returncode==1 if 'FAIL' in expected.values() else True)
        rows.append({'case':name,'passed':passed,'run_id':data['run_id'],'project':str(project),'render_exit':r.returncode,'qa_exit':q.returncode,'expected':expected,'failure_times_s':sorted({t for item in data['results'] if item['status']=='FAIL' for t in item.get('failure_times_s',[])}),'evidence':{k:items.get(k) for k in expected}})
        (folder/'report.json').write_text(json.dumps({'cases':rows,'passed':sum(x['passed'] for x in rows),'total':len(rows)},ensure_ascii=False,indent=2),encoding='utf-8');print(name+'：'+str(passed),flush=True)
    return 0 if rows and all(r['passed'] for r in rows) else 1

if __name__=='__main__':raise SystemExit(main())

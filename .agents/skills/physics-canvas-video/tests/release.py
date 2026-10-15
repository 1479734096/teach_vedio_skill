"""发布门禁回归使用已获真实用户审阅的构建副本；测试矩阵仅用作接口夹具。"""
from pathlib import Path
import argparse,copy,json,subprocess,sys,uuid,shutil
SKILL=Path(__file__).resolve().parents[1];sys.path.insert(0,str(SKILL/'scripts'))
from qa_evidence import read_json,write_json
from contracts import clone
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--project',required=True);ap.add_argument('--out',required=True);a=ap.parse_args();source=Path(a.project).resolve();folder=Path(a.out).resolve()/('release_'+uuid.uuid4().hex[:10]);folder.mkdir(parents=True);is_d=(SKILL/'scripts/engine').is_dir();base=folder/'合法来源';clone(source,base);helpers=base/('qa' if is_d else 'scripts');helpers.mkdir(exist_ok=True)
    for p in (SKILL/'scripts').glob('*.py'):shutil.copy2(p,helpers/p.name)
    for name in ('visual_review.json','visual_origin.json','visual_equivalence.json'):
        p=source/'qa'/name
        if p.is_file():shutil.copy2(p,base/'qa'/name)
    production=subprocess.run([sys.executable,str(helpers/'qa_gate.py'),'--project-dir',str(base)],capture_output=True,encoding='utf-8',errors='replace');data=read_json(base/'qa/qa_result.json')
    if production.returncode!=0 or data['overall_status']!='PASS':raise ValueError('合法发布夹具未通过生产 QA，禁止以其他失败项冒充拦截')
    scopes=['contracts','rendered','profiles','video','release','portability','production_topics','first_draft']+(['calculation','capture'] if is_d else []);matrix={'cases':[{'case':x,'scope':x,'passed':True,'level':'仅用于验证发布门禁输入结构的测试矩阵；不声明这些项目已经在此夹具执行'} for x in scopes],'positive_run_ids':[data['run_id']]};rows=[]
    cases=[('合法完整输入',None,'PASS',False),('用户尚未审阅','pending','INCOMPLETE',False),('视觉失败','visual_fail','FAIL',False),('视觉来自旧构建','stale_visual','FAIL',False),('Agent不能代签','agent','FAIL',False),('关键自动项未运行','not_run','INCOMPLETE',False),('自动项失败','qa_fail','FAIL',False),('检查结果为空','empty','FAIL',False),('生产检查组缺失','missing_group','FAIL',False),('回归失败','reg_fail','FAIL',False),('回归范围遗漏','scope_missing','FAIL',False),('回归不覆盖当前构建','stale_reg','FAIL',False),('回归未提供',None,'INCOMPLETE',True),('检测器改动后旧QA','checker_changed','FAIL',False)]
    for name,mutation,expected,no_reg in cases:
        p=folder/name
        if p==base:p=folder/'合法完整输入工程'
        shutil.copytree(base,p);qa=read_json(p/'qa/qa_result.json');review=read_json(p/'qa/visual_review.json');reg=copy.deepcopy(matrix)
        if mutation=='pending':review['reviewer']=None;review['continuous_playback_reviewed']=False;[r.update(status='NOT_RUN',detail='尚未审阅') for r in review['results']];review.pop('source_review_run_id',None)
        elif mutation=='visual_fail':review['results'][-1].update(status='FAIL',detail='测试夹具注入视觉失败')
        elif mutation=='stale_visual':review['run_id']=uuid.uuid4().hex
        elif mutation=='agent':review['reviewer_kind']='agent'
        elif mutation=='not_run':qa['results'][0].update(status='NOT_RUN',critical=True,applicable=True)
        elif mutation=='qa_fail':qa['results'][0]['status']='FAIL'
        elif mutation=='empty':qa['results']=[]
        elif mutation=='missing_group':qa['results']=[r for r in qa['results'] if not r['id'].startswith('Suite F' if is_d else 'GATE-08')]
        elif mutation=='reg_fail':reg['cases'][0]['passed']=False
        elif mutation=='scope_missing':reg['cases']=[r for r in reg['cases'] if r['scope']!='rendered']
        elif mutation=='stale_reg':reg['positive_run_ids']=[]
        elif mutation=='checker_changed':q=p/('qa' if is_d else 'scripts')/'qa_gate.py';q.write_text(q.read_text(encoding='utf-8')+'\n# 测试用检测器版本变更\n',encoding='utf-8')
        write_json(p/'qa/qa_result.json',qa);write_json(p/'qa/visual_review.json',review);write_json(p/'qa/test_matrix.json',reg);cmd=[sys.executable,str(p/('qa' if is_d else 'scripts')/'release_gate.py'),'--project-dir',str(p)]
        if not no_reg:cmd+=['--regression',str(p/'qa/test_matrix.json')]
        result=subprocess.run(cmd,capture_output=True,encoding='utf-8',errors='replace');report=read_json(p/'qa/release_result.json');passed=report['overall_status']==expected and result.returncode==(0 if expected=='PASS' else 1);rows.append({'case':name,'passed':passed,'expected':expected,'actual':report['overall_status'],'exit_code':result.returncode,'evidence':report,'project':str(p),'level':'生产发布门禁接口回归；不用于实际发布放行'});print(name+'：'+str(passed),flush=True);write_json(folder/'report.json',{'cases':rows,'passed':sum(r['passed'] for r in rows),'total':len(rows)})
    return 0 if all(r['passed'] for r in rows) else 1
if __name__=='__main__':raise SystemExit(main())

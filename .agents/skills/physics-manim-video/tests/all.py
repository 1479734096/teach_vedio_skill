"""包内全部回归入口，分开记录子程序、生产门禁与具体断言。"""
from pathlib import Path
import argparse,json,subprocess,sys,uuid
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--project',required=True);ap.add_argument('--out',required=True);ap.add_argument('--am-project');a=ap.parse_args();skill=Path(__file__).resolve().parents[1];folder=Path(a.out).resolve()/('all_'+uuid.uuid4().hex[:10]);folder.mkdir(parents=True);stages=['contracts','rendered','profiles','video','am_models','am_rendered','release']
    if a.am_project:stages+=['typography']
    if (skill/'scripts/engine').is_dir():stages=['calculation','capture']+stages
    rows=[]
    for stage in stages:
        output=folder/stage;output.mkdir();args=[sys.executable,str(skill/'tests'/ (stage+'.py'))]
        args+=['--out',str(output)]
        if stage=='typography':args+=['--project',str(Path(a.am_project).resolve())]
        if stage in ('contracts','release'):args+=['--project',str(Path(a.project).resolve())]
        print('全部回归阶段：'+stage,flush=True)
        with (output/'execution.log').open('w',encoding='utf-8') as f:r=subprocess.run(args,stdout=f,stderr=subprocess.STDOUT)
        candidates=list(output.glob('*/report.json'));reports=[json.loads(p.read_text(encoding='utf-8')) for p in candidates if p.is_file()];cases=[x for d in reports for x in d.get('cases',[])];passed=r.returncode==0 and bool(cases) and all(x.get('passed',x.get('intercepted')) is True for x in cases)
        rows.append({'case':stage,'scope':stage,'passed':passed,'execution_exit':r.returncode,'assertions':len(cases),'reports':[str(p) for p in candidates],'cases':cases});(folder/'report.json').write_text(json.dumps({'cases':rows,'passed':sum(r['passed'] for r in rows),'total':len(rows)},ensure_ascii=False,indent=2),encoding='utf-8');print(stage+'：'+str(passed),flush=True)
    return 0 if rows and all(r['passed'] for r in rows) else 1
if __name__=='__main__':raise SystemExit(main())

"""保留自动修复入口；没有已验证的定向规则时停止，绝不伪造修复成功。"""
import argparse
import subprocess
import sys
from pathlib import Path
from qa_evidence import read_json, write_json

def run_qa_round(project_dir):
    project=Path(project_dir).resolve()
    gate=project/'qa'/'qa_gate.py'
    if not gate.exists(): gate=Path(__file__).with_name('qa_gate.py')
    path=project/'qa'/'qa_result.json'
    before=path.stat().st_mtime_ns if path.exists() else None
    result=subprocess.run([sys.executable,str(gate),'--project-dir',str(project)],cwd=project,capture_output=True,encoding='utf-8',errors='replace')
    fresh=path.exists() and path.stat().st_mtime_ns!=before
    try: data=read_json(path) if fresh else {}
    except (ValueError,OSError): data={}
    if not data or (result.returncode!=0 and data.get('is_all_pass') is True):
        data={'overall_status':'INCOMPLETE','is_all_pass':False,'reason':'子进程未生成有效新结果或退出码与报告矛盾，禁止复用旧报告'}
    return result.returncode==0 and data.get('is_all_pass') is True, result.stdout+'\n'+result.stderr, data

def apply_targeted_repairs(project_dir,structured_data):
    # 当前检查器尚未提供能由实测复核的自动修复规则，保留人工修复边界。
    return []

def auto_fix_loop(project_dir,max_rounds=3):
    if not 1<=max_rounds<=3: raise ValueError('自动修复最多三轮')
    project=Path(project_dir).resolve(); logs=project/'qa'/'fix_logs'; logs.mkdir(parents=True,exist_ok=True)
    history=[]
    for number in range(1,max_rounds+1):
        passed,output,data=run_qa_round(project)
        (logs/f'round_{number}.log').write_text(output,encoding='utf-8')
        actions=[] if passed else apply_targeted_repairs(project,data)
        history.append({'round':number,'overall_status':data.get('overall_status','INCOMPLETE'),'actions':actions})
        if passed or not actions:
            write_json(logs/'final_review.json',{'passed':passed,'history':history,'final_result':data,'reason':'门禁通过' if passed else '没有已验证的自动修复规则；失败或关键 NOT_RUN 保持阻断'})
            print('最终门禁：'+data.get('overall_status','INCOMPLETE'))
            return passed
    passed,output,data=run_qa_round(project)
    (logs/'final.log').write_text(output,encoding='utf-8')
    write_json(logs/'final_review.json',{'passed':passed,'history':history,'final_result':data})
    return passed

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--project',default='.'); parser.add_argument('--max-rounds',type=int,choices=(1,2,3),default=3)
    args=parser.parse_args(); raise SystemExit(0 if auto_fix_loop(args.project,args.max_rounds) else 1)

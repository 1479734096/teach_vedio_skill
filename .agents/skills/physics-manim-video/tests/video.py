"""真实编码合法稀疏画面与单帧黑场，调用生产视频子门禁。"""
from pathlib import Path
import argparse,subprocess,sys,uuid,numpy as np
SKILL=Path(__file__).resolve().parents[1];sys.path.insert(0,str(SKILL/'scripts'))
from qa_evidence import begin_build,finish_build,tool,write_json
import qa_gate
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out',required=True);a=ap.parse_args();folder=Path(a.out).resolve()/('video_'+uuid.uuid4().hex[:10]);folder.mkdir(parents=True);rows=[];is_d=hasattr(qa_gate,'QAGate')
    for name,bad,expected in [('合法稀疏画面',False,'PASS'),('单帧黑场',True,'FAIL'),('仅帧率错误',False,'FAIL')]:
        project=folder/name;(project/'src').mkdir(parents=True);(project/'src/synthetic_producer.py').write_bytes(Path(__file__).read_bytes());m=begin_build(project,[sys.executable,str(Path(__file__).resolve()),name]);wrong_fps=name=='仅帧率错误';w,h,fps=(1920,1080,15) if wrong_fps else (480,270,30);process=subprocess.Popen([tool('ffmpeg'),'-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',str(w)+'x'+str(h),'-r',str(fps),'-i','-','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',str(project/'final.mp4')],stdin=subprocess.PIPE)
        for i in range(60):
            frame=np.zeros((h,w,3),dtype=np.uint8)
            if not (bad and i==30):frame[129:141,234:246]=255
            process.stdin.write(frame.tobytes())
        process.stdin.close()
        if process.wait()!=0:raise RuntimeError('单帧视频探针编码失败')
        finish_build(project,m,[{'frame_index':i,'t':i/fps,'physics':[]} for i in range(60)],[{'id':'probe','start':0,'end':60/fps}])
        gate=qa_gate.QAGate(project) if is_d else qa_gate.QAEvaluator(project);target=('Suite F.stream' if is_d else 'GATE-08.stream') if wrong_fps else 'Suite E.blank' if is_d else 'GATE-07.frames';method=(gate.check_suite_f if is_d else gate.check_gate_08_stream_specs) if wrong_fps else gate.check_suite_e if is_d else gate.check_gate_07_scene_transitions;gate.invoke(target.split('.')[0],method);row=next(r for r in gate.results if r['id']==target);rows.append({'case':name,'passed':row['status']==expected and (not wrong_fps or m['video']['fps']==15 and m['video']['width']==1920 and m['video']['height']==1080),'run_id':m['run_id'],'target':target,'expected':expected,'evidence':row,'scope':'实际视频子门禁；错误帧率保持1080p/H.264/yuv420p，其余两例为480×270稀疏画面'})
    write_json(folder/'report.json',{'cases':rows,'passed':sum(r['passed'] for r in rows),'total':len(rows)});print([(r['case'],r['passed']) for r in rows]);print(folder/'report.json');return 0 if all(r['passed'] for r in rows) else 1
if __name__=='__main__':raise SystemExit(main())

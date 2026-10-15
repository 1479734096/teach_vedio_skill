"""沿用 ManimCE 的渲染/拼接入口，强制本次构建证据与输出一致。"""
from pathlib import Path
import argparse
import ast
import json
import os
import sys
import subprocess
from qa_evidence import begin_build, finish_build, command, probe, tool

def ensure_toolchain_paths():
    tex_path = r"D:\latex\texlive\2025\bin\windows"
    if os.path.exists(tex_path) and tex_path not in os.environ.get("PATH", ""):
        os.environ["PATH"] = tex_path + os.pathsep + os.environ.get("PATH", "")
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    if local_app_data:
        winget_bins = list(Path(local_app_data).glob("Microsoft/WinGet/Packages/Gyan.FFmpeg*/**/bin"))
        if winget_bins and str(winget_bins[0]) not in os.environ.get("PATH", ""):
            os.environ["PATH"] = str(winget_bins[0]) + os.pathsep + os.environ.get("PATH", "")

ensure_toolchain_paths()

def discover_scenes(src_dir):
    result=[]
    for f in sorted(Path(src_dir).glob('scene*.py')):
        tree=ast.parse(f.read_text(encoding='utf-8'))
        for node in tree.body:
            if isinstance(node,ast.ClassDef) and any(isinstance(b,ast.Name) and b.id in ('Scene','MovingCameraScene','ThreeDScene') for b in node.bases): result.append((f,node.name))
    return result

def main():
    p=argparse.ArgumentParser(description='带真实逐帧证据的 Manim 构建')
    p.add_argument('--project-dir',default='.')
    p.add_argument('--quality',choices=['low','high'],default='high')
    p.add_argument('--scene')
    p.add_argument('--skip-render',action='store_true')
    a=p.parse_args(); root=Path(a.project_dir).resolve()
    if a.skip_render:
        raise SystemExit('跳过渲染不能建立新的同次构建证据；请直接检查已有 manifest')
    scenes=discover_scenes(root/'src')
    if a.scene: scenes=[s for s in scenes if a.scene in (s[1],s[0].stem)]
    if not scenes: raise SystemExit('未找到所选 Scene，拒绝伪成功')
    manifest=begin_build(root,sys.argv)
    videos=[]; frames=[]; timeline=[]; offset=0; fps=30 if a.quality=='high' else 15
    logs=root/'qa'/'render_logs'/manifest['run_id']; logs.mkdir(parents=True)
    for source,name in scenes:
        trace=logs/(name+'.jsonl')
        env=os.environ.copy(); env['QA_SCENE_TELEMETRY']=str(trace); env['QA_RUN_ID']=manifest['run_id']; env['PYTHONIOENCODING']='utf-8'
        # 禁用缓存，旧场景输出不能代替当前构建。
        media=root/'media'/manifest['run_id']
        args=[sys.executable,'-m','manim','--disable_caching','-r','1920,1080' if a.quality=='high' else '854,480','--fps',str(fps),'--media_dir',str(media),str(source),name]
        print('正在渲染 '+name,flush=True)
        try:
            res=command(args,env=env,cwd=root)
        except subprocess.CalledProcessError as e:
            (logs/(name+'.log')).write_text((e.stdout or '')+'\n'+(e.stderr or ''),encoding='utf-8')
            print((e.stderr or '')[-6000:],flush=True)
            raise
        (logs/(name+'.log')).write_text(res.stdout+'\n'+res.stderr,encoding='utf-8')
        candidates=list(media.glob('videos/'+source.stem+'/*/'+name+'.mp4'))
        if len(candidates)!=1: raise RuntimeError('本次场景视频定位不唯一: '+name)
        video=candidates[0]; count=int(next(s for s in probe(video)['streams'] if s['codec_type']=='video')['nb_frames'])
        sampled=[json.loads(line) for line in trace.read_text(encoding='utf-8').splitlines()]
        if len(sampled)!=count: raise RuntimeError(f'{name}: 遥测 {len(sampled)} / 视频 {count} 帧不符')
        for f in sampled:
            f['local_t']=f['t']; f['frame_index']=len(frames); f['t']=len(frames)/fps; frames.append(f)
        timeline.append({'id':name,'start':offset,'end':offset+count/fps,'transition':'scene_cut','source':str(source.relative_to(root))})
        offset+=count/fps; videos.append(video)
    concat=logs/'concat.txt'
    concat.write_text('\n'.join("file '"+v.as_posix()+"'" for v in videos),encoding='utf-8')
    command([tool('ffmpeg'),'-y','-v','error','-f','concat','-safe','0','-i',concat,'-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-r',str(fps),root/'final.mp4'])
    finish_build(root,manifest,frames,timeline,{'renderer':'ManimCE Cairo','capture_errors':[e for f in frames for e in f['capture_errors']]})
    print('构建完成：'+str(root/'final.mp4'),flush=True)
    return 0

if __name__=='__main__':
    raise SystemExit(main())

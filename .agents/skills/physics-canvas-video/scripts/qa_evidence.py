"""构建来源、三态结果和视频实测；不使用哈希，不推断未运行的检查。"""
from pathlib import Path
from datetime import datetime, timezone
from fractions import Fraction
import json
import os
import shutil
import subprocess
import sys
import uuid
import importlib.metadata
import cv2
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

class MissingEvidence(Exception):
    """必要证据缺失，调用方必须返回 NOT_RUN。"""

def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))

def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')

def tool(name):
    exe_name = name + '.exe' if os.name == 'nt' else name
    candidate = Path(sys.executable).parent / exe_name
    if candidate.is_file():
        return str(candidate)
    val = shutil.which(name)
    if val:
        return val
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    if local_app_data:
        winget_bins = list(Path(local_app_data).glob("Microsoft/WinGet/Packages/Gyan.FFmpeg*/**/bin/" + exe_name))
        if winget_bins:
            bin_dir = str(winget_bins[0].parent)
            if bin_dir not in os.environ.get("PATH", ""):
                os.environ["PATH"] = bin_dir + os.pathsep + os.environ.get("PATH", "")
            return str(winget_bins[0])
    raise MissingEvidence(f'缺少工具 {name}')

def command(args, **kwargs):
    return subprocess.run([str(x) for x in args], check=True, capture_output=True, encoding='utf-8', errors='replace', **kwargs)

def probe(path):
    return json.loads(command([tool('ffprobe'), '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]).stdout)

def source_files(project):
    project = Path(project)
    files = []
    for folder in ('src', 'scripts'):
        root = project / folder
        if not root.exists():
            continue
        for current, dirs, names in os.walk(root):
            dirs[:] = [d for d in dirs if d not in ('__pycache__', 'node_modules', 'media')]
            files.extend(Path(current) / n for n in names if not n.endswith('.pyc') and (folder != 'scripts' or n in ('build_video.py', 'qa_evidence.py')))
    for name in ('physics_config.json', 'animation_spec.json', 'storyboard.md'):
        f = project / name
        if f.is_file():
            files.append(f)
    return sorted(set(files))

def begin_build(project, args):
    project = Path(project).resolve()
    prior = project / 'qa' / 'build_manifest.json'
    if prior.is_file():
        old = read_json(prior)
        archive = project / 'qa' / 'history' / old['run_id']
        archive.mkdir(parents=True, exist_ok=True)
        for name in ('build_manifest.json', 'telemetry.json', 'runtime.json', 'qa_result.json'):
            f = project / 'qa' / name
            if f.is_file() and not (archive / name).exists(): shutil.copy2(f, archive / name)
    run_id = uuid.uuid4().hex
    snapshot = project / 'qa' / 'build_inputs' / run_id
    entries = []
    for f in source_files(project):
        rel = f.relative_to(project)
        dst = snapshot / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dst)
        entries.append(str(rel).replace('\\', '/'))
    versions = {'python': sys.version.split()[0]}
    for package in ('manim','playwright','numpy','sympy','Pillow'):
        try: versions[package+'_metadata']=importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError: versions[package+'_metadata']='未登记'
    for name in ('ffmpeg', 'ffprobe'):
        versions[name] = command([tool(name), '-version']).stdout.splitlines()[0]
    manifest = {'run_id': run_id, 'started_utc': datetime.now(timezone.utc).isoformat(), 'command': [str(a) for a in args], 'inputs': entries, 'versions': versions, 'complete': False}
    write_json(project / 'qa' / 'build_manifest.json', manifest)
    first = project / 'qa' / 'first_draft.json'
    if not first.exists():
        write_json(first, {'run_id': run_id, 'snapshot': str(snapshot.relative_to(project)), 'started_utc': manifest['started_utc'], 'scope': '本工程首次构建输入；主题首稿与修复轮次另在发布矩阵记录'})
    history = project / 'qa' / 'build_history.json'
    records = read_json(history) if history.exists() else []
    records.append({'run_id': run_id, 'started_utc': manifest['started_utc'], 'snapshot': str(snapshot.relative_to(project)), 'first_draft': first.exists() and read_json(first)['run_id']==run_id})
    write_json(history, records)
    return manifest

def finish_build(project, manifest, frames, timeline=None, diagnostics=None):
    project = Path(project)
    video = project / 'final.mp4'
    tagged = project / 'qa' / ('tagged_' + manifest['run_id'] + '.mp4')
    command([tool('ffmpeg'), '-y', '-v', 'error', '-i', video, '-map', '0', '-c', 'copy', '-metadata', 'comment=qa_run_id:' + manifest['run_id'], tagged])
    # 此处只替换本次任务刚生成的候选视频。
    tagged.replace(video)
    data = probe(video)
    stream = next(s for s in data['streams'] if s['codec_type'] == 'video')
    manifest.update({'complete': True, 'finished_utc': datetime.now(timezone.utc).isoformat(), 'timeline': timeline or [], 'video': {'bytes': video.stat().st_size, 'mtime_ns': video.stat().st_mtime_ns, 'width': stream['width'], 'height': stream['height'], 'fps': float(Fraction(stream['r_frame_rate'])), 'frame_count': int(stream['nb_frames']), 'duration': float(data['format']['duration'])}})
    for scene in manifest['timeline']:
        scene['end']=min(scene['end'],manifest['video']['duration'])
    manifest['timeline']=[s for s in manifest['timeline'] if 0<=s['start']<s['end']]
    write_json(project / 'qa' / 'telemetry.json', {'run_id': manifest['run_id'], 'frames': frames})
    write_json(project / 'qa' / 'runtime.json', {'run_id': manifest['run_id'], **(diagnostics or {})})
    write_json(project / 'qa' / 'build_manifest.json', manifest)
    return manifest

def validate_build(project):
    project = Path(project)
    path = project / 'qa' / 'build_manifest.json'
    if not path.is_file():
        raise MissingEvidence('缺少同次构建 manifest，旧产物不能代替当前证据')
    manifest = read_json(path)
    if not manifest.get('complete'):
        raise MissingEvidence('构建未完成')
    run_id = manifest['run_id']
    current = {str(f.relative_to(project)).replace('\\', '/') for f in source_files(project)}
    if current != set(manifest['inputs']):
        raise ValueError('构建后输入文件集合发生变化')
    for name in manifest['inputs']:
        snap = project / 'qa' / 'build_inputs' / run_id / name
        src = project / name
        if not snap.is_file() or src.read_bytes() != snap.read_bytes():
            raise ValueError('构建后输入内容发生变化: ' + name)
    video = project / 'final.mp4'
    if not video.is_file():
        raise MissingEvidence('缺少 final.mp4')
    if video.stat().st_size != manifest['video']['bytes'] or video.stat().st_mtime_ns != manifest['video']['mtime_ns']:
        raise ValueError('MP4 文件状态与构建记录不符')
    meta = probe(video)
    if meta['format'].get('tags', {}).get('comment') != 'qa_run_id:' + run_id:
        raise ValueError('MP4 内部 run_id 与构建记录不符')
    stream=next(s for s in meta['streams'] if s['codec_type']=='video')
    actual={'width':stream['width'],'height':stream['height'],'fps':float(Fraction(stream['r_frame_rate'])),'frame_count':int(stream['nb_frames']),'duration':float(meta['format']['duration'])}
    for key,value in actual.items():
        declared=numeric([manifest['video'][key]])[0]
        if abs(declared-value)>1e-6: raise ValueError('MP4 实际规格与 manifest 不符：'+key)
    telem = read_json(project / 'qa' / 'telemetry.json')
    runtime = read_json(project / 'qa' / 'runtime.json')
    if telem.get('run_id') != run_id or runtime.get('run_id') != run_id:
        raise ValueError('遥测或运行记录来自其他构建')
    frames = telem.get('frames')
    if not isinstance(frames, list) or not frames:
        raise MissingEvidence('遥测没有有效帧')
    if len(frames) != manifest['video']['frame_count']:
        raise ValueError(f"遥测/MP4 帧数不符: {len(frames)} vs {manifest['video']['frame_count']}")
    fps = manifest['video']['fps']
    for i, f in enumerate(frames):
        stamp=numeric([f.get('t',float('inf'))])[0]
        if f.get('frame_index') != i or abs(stamp - i / fps) > 1e-6:
            raise ValueError(f'帧索引或时间戳不符: {i}')
    return manifest, frames, runtime

def numeric(values, minimum=1):
    arr = np.asarray(values, dtype=float)
    if arr.size < minimum:
        raise MissingEvidence(f'采样不足，至少需要 {minimum} 个数值')
    if not np.isfinite(arr).all():
        raise ValueError('数据含 NaN 或 Infinity')
    return arr

def relative_error(actual, expected, scale):
    actual, expected = numeric(actual), numeric(expected)
    if actual.shape != expected.shape or not np.isfinite(scale) or scale <= 0:
        raise ValueError('误差计算尺寸或尺度无效')
    return float(np.max(np.abs(actual - expected)) / scale)

def video_scan(project):
    project = Path(project)
    cap = cv2.VideoCapture(str(project / 'final.mp4'))
    if not cap.isOpened():
        raise ValueError('无法解码 MP4')
    count, blank, white, metrics, spikes = 0, [], [], [], []
    prev, prev_diff = None, None
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        gray = cv2.cvtColor(cv2.resize(frame, (480, 270)), cv2.COLOR_BGR2GRAY).astype(np.float32)
        mean = float(gray.mean())
        metrics.append(mean)
        if float(gray.max()) <= 2:
            blank.append(count)
        if float(gray.min()) >= 253:
            white.append(count)
        if prev is not None:
            diff = float(np.abs(gray - prev).mean())
            if prev_diff is not None and diff > 10 and diff > prev_diff * 6:
                spikes.append({'frame': count, 'mean_pixel_delta': diff})
            prev_diff = diff
        prev = gray
        count += 1
    cap.release()
    if not count:
        raise ValueError('MP4 没有可解码帧')
    return {'decoded_frames': count, 'black_frames': blank, 'white_frames': white, 'luminance_min': min(metrics), 'luminance_max': max(metrics), 'pixel_change_candidates': spikes}

class Result:
    def __init__(self, key, title, status, detail='', evidence=None, critical=True, applicable=True):
        if status not in ('PASS', 'FAIL', 'NOT_RUN'):
            raise ValueError('非法检查状态')
        self.data = {'id': key, 'suite': key.split('.')[0], 'gate_id': key.split('.')[0], 'title': title, 'name': title, 'status': status, 'detail': detail, 'evidence': evidence or {}, 'critical': critical, 'applicable': applicable}
        ev=self.data['evidence']
        times=[row['t'] for row in ev.get('events',[]) if isinstance(row,dict) and 't' in row]
        times+=ev.get('bad_times',[])+ev.get('black_times',[])+ev.get('white_times',[])
        self.data.update({'source':ev.get('source',detail or '检查项所列输入；未采集独立来源字段'), 'measurements':{k:v for k,v in ev.items() if k not in ('source','events') and not k.startswith('threshold')}, 'thresholds':{k:v for k,v in ev.items() if k.startswith('threshold') or k.startswith('tolerance')}, 'failure_times_s':sorted(set(times)) if status=='FAIL' else [], 'time_evidence': '已记录具体帧时间' if times else '此项为构建/配置级检查，或当前测量仅保留最大误差；未定位失败帧'})

class Gate:
    def __init__(self, project):
        self.project_dir = Path(project).resolve()
        self.results = []
        self.manifest = self.frames = self.runtime = None
        self.scan = None

    def log(self, key, title, status, detail='', evidence=None, critical=True, applicable=True):
        if isinstance(status, (bool, np.bool_)):
            status = 'PASS' if status else 'FAIL'
        r = Result(key, title, status, detail, evidence, critical, applicable)
        self.results.append(r.data)
        print(f'[{status}] {key} {title}: {detail}', flush=True)
        return r.data

    def inputs(self):
        if self.frames is None:
            self.manifest, self.frames, self.runtime = validate_build(self.project_dir)
        return self.frames

    def video(self):
        self.inputs()
        if self.scan is None:
            self.scan = video_scan(self.project_dir)
        return self.scan

    def invoke(self, key, fn):
        try:
            fn()
        except (MissingEvidence, FileNotFoundError) as e:
            self.log(key + '.input', '检测证据可用性', 'NOT_RUN', str(e))
        except Exception as e:
            self.log(key + '.error', '检测失败', 'FAIL', f'{type(e).__name__}: {e}')

    def report(self, output=None):
        fail = [r for r in self.results if r['status'] == 'FAIL']
        missing = [r for r in self.results if r['status'] == 'NOT_RUN' and r['critical'] and r['applicable']]
        status = 'FAIL' if fail else ('INCOMPLETE' if missing else 'PASS')
        data = {'project': self.project_dir.name, 'run_id': self.manifest['run_id'] if self.manifest else None, 'overall_status': status, 'final_status': status, 'is_all_pass': status == 'PASS', 'summary': {s: sum(r['status'] == s for r in self.results) for s in ('PASS', 'FAIL', 'NOT_RUN')}, 'failures': fail, 'not_runs': [r for r in self.results if r['status'] == 'NOT_RUN'], 'results': self.results}
        write_json(self.project_dir / 'qa' / 'qa_result.json', data)
        # 检测器属于本次审查的版本证据，不属于视频的渲染输入。
        checker = Path(sys.argv[0])
        if checker.is_file():
            review_dir = self.project_dir / 'qa' / 'checker_inputs' / (data['run_id'] or 'without_build')
            review_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(checker, review_dir / checker.name)
            shutil.copy2(Path(__file__), review_dir / 'qa_evidence.py')
        lines = ['# 候选版自动 QA 实测报告', '', f"构建：`{data['run_id']}`；总体：**{status}**；统计：`{data['summary']}`。", '', 'PASS 仅表示该行明确描述的计算成立，不代表教学效果或全部视觉质量。', '', '| 检查 | 状态 | 适用/关键 | 说明与证据 |', '|---|---|---|---|']
        for r in self.results:
            ev = json.dumps(r['evidence'], ensure_ascii=False).replace('|', '\\|')
            detail = r['detail'].replace('|', '\\|').replace('\n', ' ')
            lines.append(f"| {r['id']} {r['title']} | {r['status']} | {r['applicable']}/{r['critical']} | {detail}；`{ev}` |")
        path = Path(output) if output else self.project_dir / 'qa_report.md'
        path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
        return status == 'PASS'

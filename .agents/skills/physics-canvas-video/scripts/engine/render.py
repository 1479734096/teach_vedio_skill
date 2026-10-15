#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
physics-canvas-video: 逐帧渲染器 (Playwright Chromium + FFmpeg 管道)
自动探测系统环境（Chrome/Edge/Playwright 内置浏览器，以及系统 PATH/.venv 内部的 FFmpeg）。
"""
import argparse, base64, functools, http.server, json, os, shutil, socketserver, subprocess, sys, threading, time, urllib.parse
from pathlib import Path

# 智能工具查找
def find_tool(name):
    # 1. 解释器同级目录
    c1 = Path(sys.executable).parent / name
    if c1.exists(): return str(c1)
    # 2. 项目与上级目录的 .venv/Scripts
    curr = Path(__file__).resolve()
    for parent in [curr.parent, curr.parents[1], curr.parents[2], curr.parents[3]]:
        c2 = parent / ".venv" / "Scripts" / name
        if c2.exists(): return str(c2)
    # 3. 系统 PATH
    w = shutil.which(name)
    if w: return w
    # 4. Windows 常见 winget 安装路径
    if sys.platform == "win32":
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        if local_app_data:
            winget_glob = list(Path(local_app_data).glob("Microsoft/WinGet/Packages/Gyan.FFmpeg*/**/bin/" + name))
            if winget_glob: return str(winget_glob[0])
    return name

FFMPEG_BIN = find_tool("ffmpeg.exe" if sys.platform == "win32" else "ffmpeg")
FFPROBE_BIN = find_tool("ffprobe.exe" if sys.platform == "win32" else "ffprobe")

# 将 ffmpeg 所在目录临时注入环境变量 PATH，确保子进程顺利执行
ffmpeg_dir = str(Path(FFMPEG_BIN).parent)
if os.path.isdir(ffmpeg_dir) and ffmpeg_dir not in os.environ.get("PATH", ""):
    os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")

sys.path.insert(0, str(Path(__file__).parent))
import spec_assets
from qa_evidence import begin_build, finish_build
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser(description="Physics Canvas Video Frame Renderer")
ap.add_argument('--out', required=True)
ap.add_argument('--audio')
ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--from', dest='t0', type=float, default=0)
ap.add_argument('--to', dest='t1', type=float, default=None, help='默认读取段落总时长')
ap.add_argument('--stills', help='逗号分隔秒数：只导出这些时刻的 png 到 --out 目录')
ap.add_argument('--solo', help='只渲单段（时间为本段局部时间）')
ap.add_argument('--film', default='', help='片子名：读 eras_<名>.js（默认 eras.js）')
ap.add_argument('--no-counter', action='store_true', help='--solo 时不画角标')
ap.add_argument('--crf', type=int, default=14)
ap.add_argument('--spec', help='参数化片段 spec.json')
ap.add_argument('--alpha', action='store_true', help='导出带透明通道视频')
ap.add_argument('--telemetry', help='导出运行时的动态对象遥测数据到 JSON 文件')
ap.add_argument('--width', type=int, help='画布宽')
ap.add_argument('--height', type=int, help='画布高')
a = ap.parse_args()

root = Path(__file__).parent
if not a.stills and Path(a.out).resolve() != (root.parent / 'final.mp4').resolve():
    raise SystemExit('可信构建必须输出工程根目录 final.mp4；拒绝把旧 final.mp4 与本次其他输出的遥测混用。')
spec, ALLOWED = None, set()
if a.spec:
    sp = Path(a.spec).resolve()
    spec = json.loads(sp.read_text(encoding='utf-8'))
    try:
        spec_assets.localize(spec, sp.parent, ALLOWED)
    except FileNotFoundError as e:
        raise SystemExit(str(e))
    if a.alpha: spec['alpha'] = True
    if a.width or a.height:
        spec['width'] = a.width or spec.get('width', 1920)
        spec['height'] = a.height or spec.get('height', 1080)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
    def translate_path(self, path):
        if path.startswith('/__file__/'):
            f = urllib.parse.unquote(path[len('/__file__/'):].split('?')[0])
            return f if spec and f in ALLOWED else '/nonexistent'
        return super().translate_path(path)

class LocalServer(socketserver.ThreadingTCPServer):
    request_queue_size = 128
    daemon_threads = True

srv = LocalServer(('127.0.0.1', 0), functools.partial(Q, directory=str(root)))
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

def find_browser():
    candidates = [
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
    ]
    for c in candidates:
        if Path(c).is_file():
            return c
    return None

manifest = begin_build(root.parent, sys.argv) if not a.stills else None
with sync_playwright() as p:
    browser_exe = find_browser()
    launch_kwargs = {
        'args': ['--disable-web-security', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']
    }
    if browser_exe:
        launch_kwargs['executable_path'] = browser_exe
    b = p.chromium.launch(**launch_kwargs)
    pg = b.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
    errors = []
    pg.add_init_script((root / 'audit_capture.js').read_text(encoding='utf-8'))
    
    def on_console(m):
        if 'favicon.ico' in m.text or 'favicon.ico' in str(m.location): return
        if m.type in ('error', 'warning'): print('[page]', m.text)
        if m.type == 'error': errors.append(m.text)
        
    pg.on('console', on_console)
    pg.on('response', lambda resp: print('[resp 404]', resp.url) if resp.status == 404 else None)
    pg.on('pageerror', lambda e: (print('[pageerror]', e), errors.append(str(e))))

    if spec:
        pg.set_viewport_size({'width': spec.get('width', 1920), 'height': spec.get('height', 1080)})
        pg.add_init_script('window.CLIP_SPEC = ' + json.dumps(spec, ensure_ascii=False) + ';')
        pg.goto(f'http://127.0.0.1:{port}/clip.html?render=1')
    else:
        if a.width or a.height:
            if not (a.width and a.height): raise SystemExit('--width 和 --height 要一起写')
            pg.set_viewport_size({'width': a.width, 'height': a.height})
        pg.goto(f'http://127.0.0.1:{port}/index.html?render=1' + (f'&film={a.film}' if a.film else '') + (f'&w={a.width}&h={a.height}' if a.width else ''))

    pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=120000)
    bf = pg.evaluate('window.__bootFailed || null')
    if bf: raise SystemExit('场景加载失败，拒绝渲染：\n' + bf)

    if a.t1 is None: a.t1 = pg.evaluate('window.__total')
    if spec:
        a.fps = spec.get('fps', 30)
        a.t0 = 0
        a.t1 = spec['duration']

    pg.evaluate('window.enableTelemetry(true)')
    grab = '''async (t)=>{ window.auditBegin(t); await window.prepare(t); window.renderFrame(t); window.auditEnd(); return window.__canvas.toDataURL('image/png').split(',')[1]; }'''
    if a.solo:
        grab = '''async (t)=>{ window.renderSolo(%s, t, {counter: %s}); return window.__canvas.toDataURL('image/png').split(',')[1]; }''' % (repr(a.solo), 'false' if a.no_counter else 'true')

    if a.stills:
        out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
        for s in a.stills.split(','):
            (out / f't{float(s):06.2f}.png').write_bytes(base64.b64decode(pg.evaluate(grab, float(s))))
        print('stills ->', out)
    else:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        vid = a.out if not a.audio else a.out + '.noaudio.mp4'
        enc = ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16'] if (spec and a.alpha) else \
              ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(a.crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
        
        ff = subprocess.Popen([FFMPEG_BIN, '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', str(a.fps), '-c:v', 'png', '-i', '-'] + enc + [vid],
                              stdin=subprocess.PIPE)
        n0, n1 = round(a.t0 * a.fps), round(a.t1 * a.fps)
        st = time.time()
        for i in range(n0, n1):
            ff.stdin.write(base64.b64decode(pg.evaluate(grab, i / a.fps)))
            if (i - n0) % 60 == 0:
                print(f'{i}/{n1}  {time.time()-st:.0f}s', flush=True)
        ff.stdin.close()
        code = ff.wait()
        if code != 0: raise RuntimeError(f'FFmpeg 编码失败: {code}')

        if a.audio:
            subprocess.run([FFMPEG_BIN, '-y', '-v', 'error', '-i', vid, '-ss', str(a.t0), '-t', str(a.t1 - a.t0), '-i', a.audio,
                            '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', a.out], check=True)
            Path(vid).unlink(missing_ok=True)
        print('done ->', a.out)

    if manifest:
        frames = []
        total = pg.evaluate('window.auditFrames.length')
        for first in range(0,total,30):
            frames.extend(pg.evaluate('([first,last])=>window.auditFrames.slice(first,last)',[first,first+30]))
        repeat = []
        timeline = pg.evaluate("ERAS.map(e=>({id:e.id,start:e.t0,end:e.t1,transition:e.transition || null}))")
        for shot in timeline:
            if shot['start']>=a.t1 or shot['end']<=a.t0: continue
            shot['end']=min(shot['end'],a.t1)
            for offset in (0.5, 2.5, 5.5):
                stamp = min(shot['end'] - 1/30, shot['start'] + offset)
                diff = pg.evaluate("""async(t)=>{
                    await window.prepare(t); window.renderFrame(t);
                    const a=window.__canvas.getContext('2d').getImageData(0,0,1920,1080).data.slice();
                    await window.prepare(t); window.renderFrame(t);
                    const b=window.__canvas.getContext('2d').getImageData(0,0,1920,1080).data;
                    let max=0; for(let i=0;i<a.length;i++)max=Math.max(max,Math.abs(a[i]-b[i])); return max;
                }""", stamp)
                repeat.append({'shot':shot['id'],'t':stamp,'max_pixel_diff':diff})
        fonts = pg.evaluate("Array.from(document.fonts).map(f=>({family:f.family,status:f.status}))")
        finish_build(root.parent, manifest, frames, timeline, {'page_errors':errors,'repeatability':repeat,'fonts':fonts,'browser_version':b.version})

    b.close()

srv.shutdown()
srv.server_close()
if errors:
    raise SystemExit(f'❌ 页面报错 {len(errors)} 条（见上方 [page]/[pageerror]）')

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check_env.py: 运行环境与依赖完整性自检工具
检查 Python、浏览器引擎、FFmpeg/FFprobe、离线字体与核心库。
"""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def find_tool(name):
    c1 = Path(sys.executable).parent / name
    if c1.exists(): return str(c1)
    curr = Path(__file__).resolve()
    for parent in [curr.parent, curr.parents[1], curr.parents[2], curr.parents[3]]:
        c2 = parent / ".venv" / "Scripts" / name
        if c2.exists(): return str(c2)
    w = shutil.which(name)
    if w: return w
    if sys.platform == "win32":
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        if local_app_data:
            winget_glob = list(Path(local_app_data).glob("Microsoft/WinGet/Packages/Gyan.FFmpeg*/**/bin/" + name))
            if winget_glob: return str(winget_glob[0])
    return name

def check_environment():
    print("=================================================================")
    print("  physics-canvas-video: 环境与依赖自检 (Windows / Cross-Platform)")
    print("=================================================================")
    all_ok = True

    # 1. Python 版本
    py_ver = sys.version_info
    py_ok = (py_ver.major == 3 and py_ver.minor >= 10)
    print(f"[{'PASS' if py_ok else 'FAIL'}] Python 运行环境: {sys.version.split()[0]} ({sys.executable})")
    if not py_ok: all_ok = False

    # 2. Python 依赖库
    libs = [("playwright", "playwright"), ("numpy", "numpy"), ("PIL", "pillow")]
    for mod, pkg in libs:
        try:
            __import__(mod)
            print(f"[PASS] Python 库: {pkg} 已安装")
        except ImportError:
            print(f"[FAIL] Python 库: {pkg} 缺失 (请运行 pip install {pkg})")
            all_ok = False

    # 3. 浏览器引擎
    browser_candidates = [
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
    ]
    found_browser = next((c for c in browser_candidates if Path(c).is_file()), None)
    if found_browser:
        print(f"[PASS] 浏览器引擎: 发现系统浏览器 -> {found_browser}")
    else:
        # 尝试 playwright chromium
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                b = p.chromium.launch(headless=True)
                b.close()
            print("[PASS] 浏览器引擎: Playwright 内置 Chromium 可用")
        except Exception as e:
            print(f"[WARN] 浏览器引擎: 未找到外部 Chrome/Edge，且 Playwright Chromium 启动失败: {e}")
            all_ok = False

    # 4. FFmpeg 与 FFprobe
    ffmpeg_bin = find_tool("ffmpeg.exe" if sys.platform == "win32" else "ffmpeg")
    ffprobe_bin = find_tool("ffprobe.exe" if sys.platform == "win32" else "ffprobe")
    
    try:
        res = subprocess.run([ffmpeg_bin, "-version"], capture_output=True, text=True)
        ff_ok = (res.returncode == 0)
        ff_ver = res.stdout.splitlines()[0] if res.stdout else "unknown"
        print(f"[{'PASS' if ff_ok else 'FAIL'}] FFmpeg: {ffmpeg_bin} ({ff_ver[:40]}...)")
    except Exception as e:
        print(f"[FAIL] FFmpeg: 未找到或无法执行 -> {e}")
        all_ok = False

    try:
        res = subprocess.run([ffprobe_bin, "-version"], capture_output=True, text=True)
        p_ok = (res.returncode == 0)
        print(f"[{'PASS' if p_ok else 'FAIL'}] FFprobe: {ffprobe_bin}")
    except Exception as e:
        print(f"[FAIL] FFprobe: 未找到或无法执行 -> {e}")
        all_ok = False

    # 5. 核心字体库
    skill_dir = Path(__file__).resolve().parent.parent
    font_dir = skill_dir / "scripts" / "engine" / "lib" / "fonts"
    fonts = ["NotoSansSC-500.woff", "NotoSansSC-700.woff", "cmunrm.woff", "cmunti.woff", "LXGWWenKai-500.woff"]
    font_missing = [f for f in fonts if not (font_dir / f).exists()]
    if font_missing:
        print(f"[FAIL] 离线字体缺失: {font_missing}")
        all_ok = False
    else:
        print(f"[PASS] 离线字体库: 5 类核心中英数字体完整 ({font_dir})")

    print("=================================================================")
    print(f"  自检总结: {'【环境就绪，可正常渲染】' if all_ok else '【存在缺失项，请先补全依赖】'}")
    print("=================================================================")
    return all_ok

if __name__ == "__main__":
    ok = check_environment()
    sys.exit(0 if ok else 1)

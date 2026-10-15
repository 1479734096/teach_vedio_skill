#!/usr/bin/env python
"""Environment and toolchain diagnostic script for physics-manim-video.
Checks Python version, ManimCE, LaTeX, dvisvgm, FFmpeg, FFprobe, SymPy, NumPy, and system fonts.
"""
import sys
import os
import shutil
import subprocess
import json

def check_command(cmd, args=["--version"]):
    path = shutil.which(cmd)
    if not path:
        # Check current python Scripts folder
        py_scripts = os.path.dirname(sys.executable)
        candidate = os.path.join(py_scripts, f"{cmd}.exe") if os.name == "nt" else os.path.join(py_scripts, cmd)
        if os.path.exists(candidate):
            path = candidate
    if not path:
        return False, "Not found"
    try:
        res = subprocess.run([path] + args, capture_output=True, text=True, timeout=5)
        output = (res.stdout or res.stderr).splitlines()
        first_line = output[0] if output else "OK"
        return True, f"{path} ({first_line.strip()})"
    except Exception as e:
        return False, f"Execution failed: {e}"

def check_python_package(pkg_name):
    try:
        mod = __import__(pkg_name)
        ver = getattr(mod, "__version__", "unknown")
        return True, f"v{ver}"
    except ImportError:
        return False, "Not installed"

def check_fonts():
    # Common Chinese fonts on Windows
    font_candidates = [
        ("Microsoft YaHei", [r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\msyhbd.ttc"]),
        ("SimHei", [r"C:\Windows\Fonts\simhei.ttf"]),
        ("SimSun", [r"C:\Windows\Fonts\simsun.ttc"]),
    ]
    results = {}
    for name, paths in font_candidates:
        found = any(os.path.exists(p) for p in paths)
        results[name] = found
    return results

def main():
    print("=" * 60)
    print("  physics-manim-video Environment & Toolchain Diagnostics")
    print("=" * 60)
    
    print(f"\n[Python]")
    print(f"  Executable: {sys.executable}")
    print(f"  Version:    {sys.version.split()[0]}")

    print(f"\n[Core CLI Binaries]")
    tools = [
        ("manim", ["--version"]),
        ("ffmpeg", ["-version"]),
        ("ffprobe", ["-version"]),
        ("latex", ["--version"]),
        ("dvisvgm", ["--version"]),
    ]
    all_tools_ok = True
    for tool, args in tools:
        ok, detail = check_command(tool, args)
        status = "[PASS]" if ok else "[FAIL]"
        print(f"  {status} {tool:10s} : {detail}")
        if not ok:
            all_tools_ok = False

    print(f"\n[Python Packages]")
    packages = ["manim", "sympy", "numpy", "PIL", "cv2"]
    all_pkgs_ok = True
    for pkg in packages:
        ok, detail = check_python_package(pkg)
        status = "[PASS]" if ok else "[FAIL]"
        print(f"  {status} {pkg:10s} : {detail}")
        if not ok:
            all_pkgs_ok = False

    print(f"\n[System Fonts (Chinese Text Support)]")
    fonts = check_fonts()
    for font_name, found in fonts.items():
        status = "[PASS]" if found else "[WARN]"
        print(f"  {status} {font_name:18s} : {'Found' if found else 'Missing'}")

    print("\n" + "=" * 60)
    if all_tools_ok and all_pkgs_ok:
        print("  RESULT: All core prerequisites are satisfied! Ready for production.")
        print("=" * 60)
        return 0
    else:
        print("  RESULT: Some prerequisites are missing. Please inspect items above.")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())

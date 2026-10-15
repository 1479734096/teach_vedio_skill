# Windows 环境与多重回退解析指南 (07-windows-environment.md)

## 一、Windows 环境特殊性与根因应对

在 Windows 操作系统下运行由 Python、Playwright、Headless Chromium 与 FFmpeg 构成的渲染管线时，极易因环境变量缺失或路径硬编码产生如下问题：

1. **FFmpeg/FFprobe 找不到**：
   - 根因：Windows 下二进制文件名为 `ffmpeg.exe`，且可能安装在虚拟环境 `.venv/Scripts/`、WinGet 包目录或特定用户目录下，系统全局 PATH 未配置。
   - 解决：使用内置的 `find_tool()` 引擎，按照：
     ① 解释器目录 (`sys.executable`) 同级；
     ② 项目或多层上级目录的 `.venv/Scripts/`；
     ③ Windows WinGet 包目录 (`%LOCALAPPDATA%/Microsoft/WinGet/Packages/Gyan.FFmpeg*/**/bin/`)；
     ④ 系统 `PATH` 动态搜索，并自动将其注入当前子进程环境变量。
2. **Playwright Chromium 缺失**：
   - 根因：Playwright 内置 chromium-headless-shell 未通过 `playwright install` 下载。
   - 解决：内置的 `find_browser()` 自动探测 Windows 现存系统浏览器（`C:\Program Files\Google\Chrome\Application\chrome.exe` 或 `Microsoft\Edge\Application\msedge.exe`），无缝复用现有 Chrome/Edge，无需重复下载 150MB 的浏览器内核。
3. **终端编码乱码 (cp936/GBK vs UTF-8)**：
   - 根因：Windows 默认控制台代码页为 GBK/CP936，输出中文与数学符号（如 $\lambda, \beta, \omega$）会报错或乱码。
   - 解决：所有 Python 脚本入口统一设置：
     ```python
     if hasattr(sys.stdout, "reconfigure"):
         sys.stdout.reconfigure(encoding="utf-8", errors="replace")
     ```
4. **字体加载机制**：
   - 所有数理字体（`cmunrm.woff`, `cmunti.woff`）与中文字体（`NotoSansSC`, `LXGWWenKai`）均内置在 `src/lib/fonts/`，以相对路径通过 Web 字体加载 API 直接光栅化，不依赖 Windows 系统字体安装。

---

## 二、一键环境诊断

在开工或排查故障时，直接运行：
```powershell
python .agents/skills/physics-canvas-video/scripts/check_env.py
```
若全部显示 `[PASS]`，则代表系统已具备完整的无头渲染与出片能力。

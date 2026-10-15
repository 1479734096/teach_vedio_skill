# 工程独立性与环境自适应规范 (06-project-independence.md)

本规范规定了基于本 Skill 创建的任何教学动画项目必须具备的工程独立性、路径无关性与环境自适应发现机制。

---

## 一、零硬编码与路径无关性原则 (Zero Hardcoding Rule)

任何基于 `physics-manim-video` 初始化的新工程必须满足以下要求：

1. **严禁依赖 A_3b1b_final 的绝对路径**：
   - 脚本中禁止出现类似 `r"D:\diy\try\teachvedio\experiments\A_3b1b_final"` 的硬编码；
   - 所有文件读写、素材加载、配置读取必须基于当前运行目录或脚本相对路径解析：
     ```python
     PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
     ```
2. **严禁复制旧工程作为初始源码**：
   - 初始化新项目时，通过脚手架生成针对新主题的干净骨架；
   - 物理常量、分镜和推导公式必须根据新知识点重新设计，禁止简单拷贝驻波 Scene 进行文字替换。

---

## 二、工具链动态发现机制 (Toolchain Discovery)

为了保证脚本在不同开发设备或虚拟环境下均能稳定运行，采用多层回退动态发现策略：

```python
def find_tool(tool_name: str) -> str:
    """按优先级动态定位工具可执行文件：
    1. 当前运行 Python 解释器同级目录 (Scripts/)
    2. 项目根目录 .venv/Scripts/
    3. 系统环境变量 PATH
    """
```

1. **Python 与 Manim 发现**：
   - 优先使用当前 Python 解释器 `sys.executable`；
   - Manim 调用优先查找同目录下的 `manim.exe` 或使用 `python -m manim`。
2. **FFmpeg / FFprobe 发现**：
   - 检查 `sys.executable` 所在目录、环境变量 PATH、以及项目本地 `.venv/Scripts`。
3. **LaTeX / dvisvgm 发现**：
   - 通过 `shutil.which("latex")` 与 `shutil.which("dvisvgm")` 进行跨平台自检。

---

## 三、工程目录标准化结构

通过 `init_project.py` 生成的独立工程标准结构如下：

```
<project_root>/
├── physics_config.json       # 物理与数学参数单一真实来源 (SSOT)
├── storyboard.md             # 教学分镜与时间轴设计表
├── src/
│   ├── style.py              # 本项目的语义色板、字阶、通用辅助组件
│   ├── scene1_hook.py        # 镜头 1 源码
│   ├── scene2_core.py        # 镜头 2 源码
│   └── ...
├── scripts/
│   ├── build_video.py        # 编译渲染、拼接与关键帧抽样
│   ├── verify_physics.py     # 数理原理双重校验
│   └── qa_gate.py            # 10 大维度质量门禁
├── qa/
│   ├── keyframes/            # 全局抽帧画册
│   └── qa_report.md          # 自动生成的门禁报告
└── final.mp4                 # 交付成品视频
```

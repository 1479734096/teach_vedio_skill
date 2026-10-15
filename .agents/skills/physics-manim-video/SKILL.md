---
name: physics-manim-video
description: "通用理科课程教学动画创作系统（ManimCE / 3Blue1Brown 风格）：支持基础物理、高等数学、电子信息等理工科课程的动态几何演化、公式推导、微积分与信号可视化。内置 Quick 极速出片与 Standard 深度教学双模式，提供统一排版字阶与组件库、轻量三层质检门禁与关键帧画册长图预览。"
metadata:
  version: "1.0.0"
  engine: "ManimCE 0.22+"
  style: "3Blue1Brown"
---

# physics-manim-video · 理科教学动画创作系统

本 Skill 基于 ManimCE 引擎与 3Blue1Brown 教学设计哲学，面向基础物理（力/热/光/电）、高等数学（微积分/线代/几何）及电子信息（信号与系统/电磁场）等理工科课程，提供高质量动态教学视频创作能力。

---

## 一、工作流路由与模式选择

在开始任务前，读取并遵循 [`workflows/routing.md`](workflows/routing.md) 确定执行模式：

| 模式 | 触发条件 | 执行路径 | 交付目标 |
|---|---|---|---|
| **Quick 模式** | 用户要求“快速制作”、“即时出片”、演示特定公式/概念动效 | [`workflows/quick-generate.md`](workflows/quick-generate.md) | 1~2 步全自动分镜、编码与渲染，输出 1080p 成片与关键帧长图画册 |
| **Standard 模式** | 正式课程、多镜头系统推导、用户要求确认分镜脚本 | [`workflows/standard-generate.md`](workflows/standard-generate.md) | 遵循 Plan → Do → Check → Act 闭环；先确认 `lesson_spec.md` 再分步实现与三层质检 |

---

## 二、核心命令与工程使用

从当前工作区内快速初始化理科教学工程（支持工作区内任意子目录，如 `projects/<topic_name>`）：

```bash
# 1. 初始化新工程（支持任意数理课题，如 damped_oscillation、fourier_transform）
python scripts/init_project.py --target projects/<topic_name> --title "<课程标题>"

# 2. 进入工程目录并渲染视频（高清 1080p30）
python scripts/build_video.py --project-dir . --quality high

# 3. 运行轻量三层通用质检
python scripts/qa_gate.py --project-dir .

# 4. 提取关键帧拼版长图
python scripts/extract_keyframes.py --video final.mp4 --out qa/keyframes_preview.jpg
```

---

## 三、通用理科教学规范与排版纪律

1. **几何直觉先行 (Geometry & Intuition First)**：
   - 优先通过动态几何图像建立心理模型，再引入严格代数公式。
   - 核心公式得出后预留 **2.0 ~ 3.5 秒** 的呼吸定格时间（参考 [`references/01-pedagogical-design-workflow.md`](references/01-pedagogical-design-workflow.md)）。
2. **统一字阶与垂直安全区**：
   - 标题 `FS_TITLE = 34`，主角公式 `FS_FORMULA_HERO = 36`，一级公式 `FS_FORMULA_MAIN = 30`，中文最低字号不得低于 `FS_TAG = 18`。
   - 底部 $Y \le -3.3$ 预留为播放器字幕安全区，禁止图文侵占（参考 [`references/03-layout-typography-and-color.md`](references/03-layout-typography-and-color.md)）。
3. **教学布局与组件库**：
   - 推荐使用 `scripts/components.py` 中的标准组件：标题栏 `create_header`、公式卡片 `formula_card`、参数看板 `parameter_hud`、左右分屏 `split_screen_layout` 与要点总结 `takeaway_card`。
   - Agent 可根据具体数理课题自由组合、微调或编写专属动效。
4. **轻量三层质检原则**：
   - Level 1: 静态 AST 解析与通用参数有限性（无 NaN/Inf、无除零奇异点）。
   - Level 2: 屏幕几何 AABB 碰撞检测与安全边距。
   - Level 3: 自动生成多镜头关键帧长图画册，快速视觉审阅。
   - 彻底废除形式主义 JSON 登记与逐像素零容差比对（参考 [`references/QA_CONTRACT.md`](references/QA_CONTRACT.md)）。

---

## 四、参考示例库

历史经典教学工程已归档至 `examples/`，可作为特定物理/工程模式的实现参考：
- `examples/standing_wave/`：波动叠加与驻波形成（波动学典型）
- `examples/fourier_series/`：方波谐波分解与本轮旋转（级数与几何变换典型）
- `examples/convolution/`：翻转滑动与面积积分（信号与系统典型）
- `examples/am/`：载波调制、包络检波与双边带频谱（电子通信典型）

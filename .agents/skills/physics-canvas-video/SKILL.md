---
name: physics-canvas-video
description: "通用理科课程教学动画创作系统（HTML5 Canvas 黑板仿真风格）：支持物理场、电子电路（LC/RC/RLC）、波动连续演化与多体粒子系统的动态仿真动画。内置 Quick 极速出片与 Standard 深度教学双模式，提供高帧率黑板引擎、轻量三层质检与关键帧长图画册预览。"
metadata:
  version: "1.0.0"
  engine: "HTML5 Canvas + Playwright Chromium"
  style: "Blackboard Simulation"
---

# physics-canvas-video · Canvas 黑板理科教学系统

本 Skill 基于 HTML5 Canvas 与离线黑板物理引擎，面向连续物理场、电子电路（LC/RC/RLC）、波动演化与信号分析等理科课程，提供直观的黑板手绘感与物理仿真动画创作能力。

---

## 一、工作流路由与模式选择

在开始任务前，读取并遵循 [`workflows/routing.md`](workflows/routing.md) 确定执行模式：

| 模式 | 触发条件 | 执行路径 | 交付目标 |
|---|---|---|---|
| **Quick 模式** | 用户要求“快速制作”、“即时出片”、演示特定电路/场仿真动效 | [`workflows/quick-generate.md`](workflows/quick-generate.md) | 1~2 步全自动配置、编写与渲染，输出 1080p 成片与关键帧长图画册 |
| **Standard 模式** | 正式课程、多镜头系统推导、用户要求确认分镜脚本 | [`workflows/standard-generate.md`](workflows/standard-generate.md) | 遵循 Plan → Do → Check → Act 闭环；先确认 `lesson_spec.md` 再分步实现与三层质检 |

---

## 二、核心命令与工程使用

从当前工作区内快速初始化理科教学工程（支持工作区内任意子目录，如 `projects/<topic_name>`）：

```bash
# 1. 初始化新工程（支持任意数理/电路课题，如 rlc_circuit、wave_packet）
python scripts/init_project.py --target projects/<topic_name> --title "<课程标题>"

# 2. 渲染视频（高清 1080p30）
python src/render.py --out final.mp4

# 3. 运行轻量三层通用质检
python qa/qa_gate.py --project-dir .

# 4. 提取关键帧长图画册
python qa/extract_keyframes.py --video final.mp4 --out qa/keyframes_preview.jpg
```

---

## 三、通用理科教学规范与排版纪律

1. **黑板草图感与动态演化 (Blackboard Simulation)**：
   - 保留深色黑板底色（暗灰/墨绿）与粉笔线条质感。
   - 物理量演化依托真实数值积分循环（Euler/Verlet/RK4），呈现连续平滑的波形与电荷/粒子流动。
2. **轻量三层质检原则**：
   - Level 1: 物理参数有限性校验（无 NaN/Inf、无除零奇异点）。
   - Level 2: 屏幕几何安全（坐标图表、指示器、说明文字无重叠穿模）。
   - Level 3: 自动导出代表性关键帧长图画册，快速视觉审阅。
   - 彻底废除形式主义 JSON 登记与逐像素零容差比对。

---

## 四、参考示例库

历史经典范例已归档至 `examples/`，可作为特定电路/物理系统的实现参考：
- `examples/lc_circuit/`：LC 自由振荡回路与电磁能量转换
- `examples/rc_circuit/`：RC 充放电瞬态过程与时间常数 $\tau$
- `examples/standing_wave/`：传输线行波与反射驻波形成
- `examples/convolution/`：连续信号卷积积分动画
- `examples/am/`：幅度调制信号生成与检波

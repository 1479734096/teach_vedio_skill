---
description: Standard 模式执行规范（严谨理科课程制作）
---

# Standard Generate Workflow

Standard 模式遵循 Plan → Do → Check → Act 闭环，适用于系统性大学/高中理科课程动画制作、具有严密推导链条的视频或用户明确要求审查分镜的场景。

---

## 阶段一：Plan（教学设计与数理确认）

### Step 1: 教学解构与 Storyboard 编写
- 初始化工程（工作区内子目录如 `projects/<topic_name>`）：
  ```bash
  python scripts/init_project.py --target projects/<topic_name> --title "<课程标题>"
  ```
- 编写 `lesson_spec.md`：
  1. **教学目标与 Aha! Moment**：说明希望学习者顿悟的核心规律。
  2. **常见误区**：提前设计对抗视觉（如对比正确与错误反例）。
  3. **分幕表格**：
     | 幕次 | 预估时长 | 景别构图 | 视觉动态主体 | 数学公式 / 说明卡片 | 教学目标 |
     |---|---|---|---|---|---|
- **⛔ BLOCKING GATE 1**：向用户展示分镜设计要点，等待用户确认或微调。

### Step 2: 数理模型固化与检验
- 将所有物理常数、时空尺度、微分方程更新规则写入 `physics_config.json`。
- 运行通用数理验证：
  ```bash
  python scripts/verify_physics.py --config physics_config.json
  ```
- 确保符号恒等式闭合、无奇点/除零风险、物理单位一致。

---

## 阶段二：Do（场景编写与低清预览）

### Step 3: 编写模块化 Scene 脚本
- 在 `src/` 目录下按镜头编写 `scene1_hook.py`, `scene2_derivation.py`, `scene3_summary.py`。
- 采用通用组件库 `scripts/components.py`（如分屏对比、参数看板、推导展开折叠）。
- 保持严格的颜色语义（如输入蓝、响应红、合成黄、包络青）。

### Step 4: 快速低清预览与排版初查
- 快速渲染单镜头进行低清验证（854x480 / 15fps）：
  ```bash
  python scripts/build_video.py --project-dir . --quality low --scene Scene1_Hook
  ```
- 确认动画时间节奏与转场连贯性。

---

## 阶段三：Check（三层通用质检）

### Step 5: 高清生产渲染
- 渲染最终高清全片（1920x1080 / 30fps）：
  ```bash
  python scripts/build_video.py --project-dir . --quality high
  ```

### Step 6: 自动化三层质量门禁
- 运行通用质检工具：
  ```bash
  python scripts/qa_gate.py --project-dir .
  python scripts/extract_keyframes.py --video final.mp4 --out qa/keyframes_preview.jpg
  ```
- 检验三大硬指标：
  1. **数理与数值**：参数有限、无 NaN/Inf、动态函数运算正常。
  2. **几何安全**：MathTex/Text 之间无重叠穿模（AABB 碰撞检测），字幕区域与画面边缘留白合规。
  3. **视觉画册**：自动输出长图画册供用户直接审阅。

---

## 阶段四：Act（针对性微调与交付）

### Step 7: 定向修复与交付
- 若质检报告 `qa/qa_report.md` 指出碰撞或超限问题，定向调整对应场景中的 `.shift()` / `.next_to()` 坐标参数或缩短文字，重新快速渲染。
- 交付最终成片 [final.mp4](file:///...) 与画册长图 [keyframes_preview.jpg](file:///...)。

---
description: Quick 模式执行规范（敏捷端到端出片）
---

# Quick Generate Workflow

Quick 模式适用于快速探索、即时出片或验证单一理科概念。该模式旨在以最少的交互轮次交付高质量教学视频。

---

## 执行步骤

### Step 1: 自主解析与分镜构建
- 分析用户理科教学诉求（如微积分极限、波动方程、RLC电路谐振、开普勒定律等）。
- 自主规划 2~4 个镜头（约 20~60 秒）：
  - **Hook / 直觉**：几何与物理动态呈现。
  - **Core / 推导**：核心公式与参数演化（ValueTracker）。
  - **Takeaway / 总结**：结论定格与结构化要点。
- 确定数理参数与时间映射（在当前工程内生成或直接在脚本中定义）。

### Step 2: 编写 Manim 场景代码
- 使用模块化场景结构（可单文件多场景，或各镜头独立 `scene1.py`, `scene2.py`）。
- 遵循 3b1b 视觉与排版守则：
  - 严格绑定动态更新对象（`always_redraw` / `add_updater`）。
  - 公式与文字使用标准字阶（`style.py`），预留顶部标题与底部字幕安全边距（`SAFE_BOTTOM_UNITS = 3.3`）。
  - 核心公式得出后预留 2.0 ~ 3.5 秒定格呼吸时间。

### Step 3: 执行构建与渲染
- 运行构建脚本：
  ```bash
  python scripts/build_video.py --project-dir <工程目录> --quality high
  ```
- 自动拼接生成根目录 `final.mp4`（1080p30 / H.264 / yuv420p）。

### Step 4: 自动化轻量三层质检与画册生成
- 运行轻量通用质检：
  ```bash
  python scripts/qa_gate.py --project-dir <工程目录>
  python scripts/extract_keyframes.py --video <工程目录>/final.mp4 --out <工程目录>/qa/keyframes_preview.jpg
  ```
- 若发生文字/公式严重重叠或越界，在当前代码中自动微调坐标并重跑；若无硬性缺陷直接放行。

### Step 5: 交付成果
- 交付最终视频路径 [final.mp4](file:///...) 与关键帧预览长图，并简述数理亮点与教学设计。

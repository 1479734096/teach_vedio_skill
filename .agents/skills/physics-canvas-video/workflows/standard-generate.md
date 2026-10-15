---
description: Canvas Standard 模式执行规范（系统性理科课程）
---

# Standard Generate Workflow (Canvas)

Standard 模式遵循 Plan → Do → Check → Act 闭环，适用于复杂理科仿真实验、电路动态演化或需要严格分镜审查的教学场景。

---

## 阶段一：Plan（教学设计与数理确认）

### Step 1: 初始化与分镜规划
- 在工作区内初始化工程（如 `projects/<topic_name>`）：
  ```bash
  python scripts/init_project.py --target projects/<topic_name> --title "<课程标题>"
  ```
- 编写 `lesson_spec.md`：明确教学目标、认知误区、各分段 Shot 的时间分配与仿真重点。
- **⛔ BLOCKING GATE 1**：向用户展示分镜与仿真规划，获取用户确认。

### Step 2: 固化物理参数
- 编写 `physics_config.json`，确保微分方程步长、时间缩放及物理量在有限范围内。

---

## 阶段二：Do（场景实现与预览）

### Step 3: 编写 Canvas 渲染层
- 在 `src/` 中配置黑板背景、网格比例尺、动态更新循环（`requestAnimationFrame`）。
- 保持经典黑板粉笔质感与清晰的物理量语义配色。

---

## 阶段三：Check（三层通用质检）

### Step 4: 渲染高清视频
- 运行：
  ```bash
  python src/render.py --out final.mp4
  ```

### Step 5: 通用三层质检与画册生成
- 运行：
  ```bash
  python qa/qa_gate.py --project-dir .
  python qa/extract_keyframes.py --video final.mp4 --out qa/keyframes_preview.jpg
  ```
- 检查参数无 NaN/Inf、图文无重叠碰撞、视频规格完整合规。

---

## 阶段四：Act（微调与交付）

### Step 6: 定向微调与交付
- 若质检报告提示文字遮挡或间距过窄，调整 CSS/Canvas 坐标后快速重渲。
- 交付最终视频 [final.mp4](file:///...) 与画册长图 [keyframes_preview.jpg](file:///...)。

---
description: Canvas Quick 模式执行规范（敏捷出片）
---

# Quick Generate Workflow (Canvas)

Quick 模式适用于快速探索、即时出片或验证单一理科仿真概念。以最少交互轮次交付高质量 Canvas 动态视频。

---

## 执行步骤

### Step 1: 概念与仿真模型构建
- 解析用户课题需求（如 LC/RC 充放电回路、波动传播、多粒子场、连续信号频谱等）。
- 配置参数并在场景脚本 `src/scenes/` 中编写动画逻辑或直接使用通用物理画布。

### Step 2: 渲染视频
- 运行无头浏览器导出 MP4：
  ```bash
  python src/render.py --out final.mp4
  ```

### Step 3: 自动化质检与画册生成
- 运行通用质检与长图画册生成：
  ```bash
  python qa/qa_gate.py --project-dir .
  python qa/extract_keyframes.py --video final.mp4 --out qa/keyframes_preview.jpg
  ```

### Step 4: 交付成果
- 交付最终视频 [final.mp4](file:///...) 与关键帧长图画册 [keyframes_preview.jpg](file:///...)。

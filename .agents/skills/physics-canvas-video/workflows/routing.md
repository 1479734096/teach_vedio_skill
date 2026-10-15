---
description: Canvas 教学动画工作流路由规则（Quick 极速模式 vs Standard 标准模式）
---

# Routing Rules (Canvas 引擎)

Canvas 教学动画工作流路由控制中心。用于决定采用快速敏捷出片还是标准严谨课程制作。

---

## 1. 路由矩阵

| 模式 | 适用场景 | 执行特征 | 交付产物 |
|---|---|---|---|
| **Quick 模式** (`quick-generate`) | 用户仅给出课题、需要快速验证黑板动效、电路或连续物理场原型 | 1-2 步直接生成配置与场景脚本，无头浏览器快速渲染成片，输出关键帧长图 | `final.mp4`、`qa/keyframes_preview.jpg`、简明结果 |
| **Standard 模式** (`standard-generate`) | 正式课程、多镜头物理仿真、复杂电路/电磁场动态演示 | 遵循 Plan → Do → Check → Act 闭环；先确认 `lesson_spec.md` 与分镜，分步微调 Canvas 绘制层与时间轴 | `lesson_spec.md`、`src/` 场景实现、`final.mp4`、`qa/qa_report.md`、关键帧画册 |

---

## 2. 纪律与约束

1. **零官僚门禁**：废除旧版多轮登记文件（`first_draft.json`、`checker_version.json`、逐像素零容差对比），聚焦于真实的画面几何碰撞与参数无奇异点。
2. **轻量三层质检**：
   - Level 1: 物理参数有限性与无 NaN/Inf。
   - Level 2: 屏幕几何安全（坐标图表、指示器、说明文字无重叠穿模）。
   - Level 3: 自动导出代表性关键帧长图画册。

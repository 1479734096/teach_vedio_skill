# physics-canvas-video · Canvas 黑板理科教学系统

面向连续物理场、电子电路（LC/RC/RLC）、波动连续演化与多体粒子系统的动态仿真动画系统。基于 HTML5 Canvas 与离线黑板物理引擎。

---

## 快速上手

### 1. 初始化新课题工程
支持在工作区任意子目录下创建工程：
```bash
python scripts/init_project.py --target projects/rlc_circuit --title "RLC 二阶电路阻尼振荡"
```

### 2. 视频渲染
```bash
# 进入工程目录
cd projects/rlc_circuit

# 运行渲染器导出视频 (1080p30)
python src/render.py --out final.mp4
```

### 3. 三层通用质检与画册生成
```bash
# 运行通用质检门禁 (几何 AABB 碰撞、安全边距、参数有效性)
python qa/qa_gate.py --project-dir .

# 自动生成代表性关键帧拼版长图
python qa/extract_keyframes.py --video final.mp4 --out qa/keyframes_preview.jpg
```

---

## 工作流模式

- **Quick 极速模式**：直接由课题一站式生成分镜与场景仿真代码，自动渲染导出并截取关键帧画册，1~2 轮交互交付。
- **Standard 深度模式**：Plan → Do → Check → Act 闭环，先由 `lesson_spec.md` 确认分镜与物理模型，再分步实现、数值微调与三层质检。

---

## 目录结构
```
physics-canvas-video/
├── workflows/               # 工作流定义 (routing, quick-generate, standard-generate)
├── references/              # 黑板风格规范、视口网格与物理引擎说明
├── scripts/                 # 通用初始化、质检、关键帧提取与核心黑板引擎
└── examples/                # 经典范例 (LC振荡、RC充放电、驻波、卷积、AM)
```

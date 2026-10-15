# physics-manim-video · 理科课程教学动画制作系统

面向基础物理、高等数学与电子信息工程的通用动态教学动画系统。基于 ManimCE 0.22+，采用 3Blue1Brown 教学设计哲学。

---

## 快速上手

### 1. 初始化新课题工程
支持在工作区任意子目录下创建工程：
```bash
python scripts/init_project.py --target projects/damped_oscillation --title "阻尼振动与相空间轨迹"
```

### 2. 视频渲染
```bash
# 进入工程目录
cd projects/damped_oscillation

# 高清渲染 1080p30 (最终成片)
python scripts/build_video.py --project-dir . --quality high

# 快速低清预览 480p15 (迭代调试)
python scripts/build_video.py --project-dir . --quality low --scene Scene1_Introduction
```

### 3. 三层通用质检与画册生成
```bash
# 运行通用质检门禁 (几何 AABB 碰撞、安全边距、参数有效性)
python scripts/qa_gate.py --project-dir .

# 自动生成代表性关键帧拼版长图
python scripts/extract_keyframes.py --video final.mp4 --out qa/keyframes_preview.jpg
```

---

## 工作流模式

- **Quick 极速模式**：由主题/概念直接一站式生成分镜脚本与代码，自动渲染成片并提取关键帧画册，1~2 轮交互交付。
- **Standard 深度模式**：Plan → Do → Check → Act 闭环，先由 `lesson_spec.md` 确认分镜与核心顿悟点，再分步实现、低清预览与三层质检。

---

## 目录结构
```
physics-manim-video/
├── workflows/               # 工作流定义 (routing, quick-generate, standard-generate)
├── references/              # 教学设计、排版字阶、调色板与质检契约
├── templates/               # 通用工程脚手架模板 (lesson_spec, scene, style)
├── scripts/                 # 核心构建、质检、关键帧提取与组件库
└── examples/                # 历史经典范例 (驻波、傅里叶级数、卷积、幅度调制)
```

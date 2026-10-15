# 理科课程教学动画创作系统 (STEM Teaching Video Studio)

本项目提供两套面向理科教学（基础物理、高等数学、电子信息工程等）的高质量动态动画制作 Skill。吸取了早期版本过度特化与流程臃肿的教训，深度参考了 [hugohe3/ppt-master](https://github.com/hugohe3/ppt-master) 的分层路由体系、状态机与组件化设计思想，全面实现了通用化升级。

---

## 两套核心 Skill 对比与选型

| Skill | 渲染引擎与风格 | 最适合教学场景 | 目录位置 |
|---|---|---|---|
| **`physics-manim-video`** | ManimCE 0.22+ / 3Blue1Brown 经典矢量风格 | 符号公式推导、几何直觉、微积分、坐标变换与代数演化 | [.agents/skills/physics-manim-video](.agents/skills/physics-manim-video) |
| **`physics-canvas-video`** | HTML5 Canvas + Playwright / 手绘黑板物理仿真风格 | 连续场域、电子电路（LC/RC/RLC）、瞬态动态响应、波动传播与粒子多体交互 | [.agents/skills/physics-canvas-video](.agents/skills/physics-canvas-video) |

---

## 智能体调用：通用提示词模板 (Prompt Template)

向 AI 助手下达理科动画制作任务时，可直接复制以下通用模板，按需填写插槽：

```markdown
请使用技能 [physics-manim-video | physics-canvas-video]（[Quick 极速出片模式 | Standard 深度教学模式]），为我制作理科教学动画：

1. 课题主题：[课题名称与学科，例如：高数“傅里叶级数方波逼近” / 物理“带电粒子在磁场中的辐射圆”]
2. 目标工程：projects/[目录英文名，例如：fourier_approx]
3. 核心数理与动态：
   - 核心规律/公式：[输入核心公式；若环境无完整 LaTeX，先询问是否允许配置 LaTeX 环境，允许则配置并使用 MathTex，否则降级为 Unicode/纯文本符号排版]
   - 动态视觉焦点：[描述核心动态演化，如轨迹族、辅助圆、能量流动、波形叠加等]
4. 交付与质检：
   - 遵守排版安全区（Manim 预留底部 Y <= -3.3 字幕区），完成 1080p 视频渲染与三层质检。
   - 输出 final.mp4 并提取关键帧画册长图 qa/keyframes_preview.jpg 供直观验收。
```

> **选型与模式速查**：
> - **引擎选择**：符号公式推导、几何轨迹、空间变换选 `physics-manim-video`；电路瞬态、波动传播、多体粒子数值仿真选 `physics-canvas-video`。
> - **模式选择**：单点动效快速验证选 `Quick 极速模式`（一步全自动出片）；系统课件与完整多幕推导选 `Standard 深度模式`（先审阅分镜再制作）。

---

## 架构演进与教训吸取 (参考 ppt-master)

1. **双模式路由（Quick 极速出片 vs Standard 深度课程）**：
   - **Quick 模式**：1~2 步由概念直接生成代码与视频，自动输出关键帧画册，彻底解决以往“确认轮次过多、流程冗长”的问题。
   - **Standard 模式**：严谨的 Plan → Do → Check → Act 闭环，先确认 `lesson_spec.md` 教学分镜与数理模型，再分步实现、低清预览与质检。
2. **彻底解耦具体学科主题**：
   - 移除原先硬编码的 5 个主题限制（AM、驻波等），全部归档为 `examples/` 参考示范库。
   - 核心脚本支持任意物理、数学与工科公式、微分方程与参数配置。
3. **轻量实用的三层质检（告别官僚仪式）**：
   - 彻底废除 `first_draft.json`、`build_history.json`、`checker_version.json` 与逐像素零容差比对等形式主义门禁。
   - 建立三层硬核质检：静态语法与数理参数有限性（无 NaN/Inf） $\rightarrow$ 屏幕几何 AABB 碰撞与安全边距检测 $\rightarrow$ 多镜头代表性关键帧拼版画册直观审阅。
4. **工作区友好**：
   - 允许在当前工作区内自由创建工程（如 `projects/<topic_name>`），不再要求强制外部空目录。

---

## 快速使用

### 方式 A：ManimCE 矢量数理动画
```bash
# 1. 初始化新工程（课题名自定）
python .agents/skills/physics-manim-video/scripts/init_project.py --target projects/damped_oscillation --title "阻尼振动与相空间"

# 2. 渲染视频 (1080p30)
python projects/damped_oscillation/scripts/build_video.py --project-dir projects/damped_oscillation --quality high

# 3. 运行通用质检与长图画册生成
python projects/damped_oscillation/scripts/qa_gate.py --project-dir projects/damped_oscillation
python projects/damped_oscillation/scripts/extract_keyframes.py --video projects/damped_oscillation/final.mp4 --out projects/damped_oscillation/qa/keyframes_preview.jpg
```

### 方式 B：Canvas 黑板仿真动画
```bash
# 1. 初始化新工程
python .agents/skills/physics-canvas-video/scripts/init_project.py --target projects/rlc_resonance --title "RLC 交流电路串联谐振"

# 2. 运行渲染器
python projects/rlc_resonance/src/render.py --out projects/rlc_resonance/final.mp4

# 3. 运行通用质检与长图画册生成
python projects/rlc_resonance/qa/qa_gate.py --project-dir projects/rlc_resonance
python projects/rlc_resonance/qa/extract_keyframes.py --video projects/rlc_resonance/final.mp4 --out projects/rlc_resonance/qa/keyframes_preview.jpg
```

---

## 资产说明
- [vedios/](vedios/)：收录 13 部高质量教学正片（1080p30 / H.264）：
  - 历史经典模型（9 部）：驻波（`A_standing_wave`, `D_standing_wave`）、LC振荡（`D_lc_circuit`）、RC充放电（`D_rc_circuit`）、傅里叶级数（`A_fourier_series`）、卷积积分（`A_convolution`, `D_convolution`）、幅度调制（`A_am`, `D_am`）。
  - 通用化实测模型（4 部）：高中物理带电粒子在圆形磁场里的辐射圆（`A_radiation_circle` 深度版、`A_radiation_quick` 极速版、`D_radiation_circle` 深度版、`D_radiation_quick` 极速版）。
- [HISTORY.md](HISTORY.md)：记录项目开发演进、教训吸取、通用化重构与归档历史。

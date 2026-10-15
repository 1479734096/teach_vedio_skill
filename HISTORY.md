# 开发演进与重构历史

## 2026-10-15: 通用化重构与 ppt-master 架构引入

### 1. 历史教训与问题复盘
在早期的自动化演进过程中，Codex 对两个 Skill（A: ManimCE 与 D: Canvas）实施了极度严格的静态回归与门禁约束，导致了严重的负面后果：
1. **具体主题严重特化**：
   - 强行硬编码了 5 个固定主题（`standing_wave`、`am`、`lc_circuit`、`rc_circuit`、`convolution`），初始化脚本遇新课题直接崩溃。
   - 在 QA 门禁中硬编码了特定主题公式（如驻波和差化积的符号正则替换、AM 载波 1kHz/调制度 0.6 的特定断言），无法支持任意理科教学。
2. **流程官僚化与确认轮次过多**：
   - 堆砌了 `first_draft.json`、`build_history.json`、`checker_version.json`、`visual_equivalence.json` 等大量僵化 JSON 文件，甚至要求伪造用户审阅者字符串以及逐像素零容差比对。
   - 创作动画蜕化为了沉重的形式主义发版泥潭，阻塞了实际教学内容的敏捷迭代。
3. **两套 Skill 割裂冗余**：
   - Manim 与 Canvas 两条路线完全隔离，各自拷贝了一套杂乱的负例脚本与特化检查。

### 2. 深度参考 ppt-master 的通用化改造
引入 [hugohe3/ppt-master](https://github.com/hugohe3/ppt-master) 的分层路由体系、状态机与组件化思想，完成全面升级：
1. **保留双 Skill 独立性，统一设计哲学**：
   - `physics-manim-video`：专注于矢量数学、几何顿悟、代数推导与微积分可视化。
   - `physics-canvas-video`：专注于黑板仿真、连续物理场、电路波形与多体粒子演化。
2. **引入 Quick / Standard 双模式路由**：
   - **Quick 模式**：1~2 步由概念直接生成代码与成片，自动输出关键帧画册长图，解决“轮次太多”的痛点。
   - **Standard 模式**：遵循 Plan → Do → Check → Act 闭环，先确认 `lesson_spec.md` 教学分镜与数理模型，再分步实现与三层质检。
3. **彻底解耦具体学科主题**：
   - 原 5 个主题归档为 `examples/` 示范库。
   - 核心脚本全面支持任意物理、数学与工科公式、微分方程与时空映射。
4. **轻量实用的三层质检**：
   - Level 1: 静态 AST 解析与数理参数有限性校验（无 NaN/Inf、无除零）。
   - Level 2: 屏幕几何安全检测（公式/文字 AABB 碰撞检测、字幕安全区留白）。
   - Level 3: 自动导出代表性关键帧拼版长图（Contact Sheet），一目了然直观审阅。
5. **工作区友好**：
   - 允许在当前工作区内自由创建工程（如 `projects/<topic_name>`），不再要求外部空目录。

---

## 成果归档与工作区纯净清理记录 (2026-10-15)

1. **测试成果归档**：
   - 4 个子 Agent 针对全新高中物理课题『带电粒子在圆形磁场里的辐射圆』制作的 4 部高质量成片已全部通过三层通用质检，并归档至 [vedios/](vedios/)：
     - `A_radiation_circle.mp4`（Manim 深度版 37.0s / 1110 帧 / 2.28MB）
     - `A_radiation_quick.mp4`（Manim 极速版 16.7s / 501 帧 / 1.27MB）
     - `D_radiation_circle.mp4`（Canvas 深度版 30.0s / 900 帧 / 3.89MB）
     - `D_radiation_quick.mp4`（Canvas 极速版 18.0s / 540 帧 / 2.42MB）
   - 连同历史 9 部正片，`vedios/` 目录现有 13 部成片作为黄金教学参照成果。
2. **工作区纯净清理**：
   - 移除 `projects/` 下 4 个测试工程。
   - 移除渲染过程生成的根目录 `media/`、`qa/` 缓存与所有 `__pycache__` 临时文件。
   - 工作区根目录严格恢复为纯净的 4 项：`.agents/`、`vedios/`、`README.md`、`HISTORY.md`。

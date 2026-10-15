# 自动化质量门禁与高频抽帧审查规范 (05-qa-gate-and-frame-inspection.md)

本规范定义了 ManimCE 教学动画的 10 大维度自动化质量门禁 (QA Gate) 与高频抽帧复核体系，确保交付视频在数学真实性、视觉排版、动画连续性及成片编码层面达到工业级高品质。

---

## 一、10 大维度质量门禁体系 (The 10 QA Gates)

每项门禁检查必须产出量化指标与判定结论（`PASS`、`FAIL` 或 `NOT_RUN`），并严禁伪造结果。

| 门禁代号 | 维度名称 | 检测手段与核心判定条件 | 状态标准 |
|---|---|---|---|
| **GATE-01** | **公式重叠与碰撞检测**<br>(Formula Collision) | 静态 AST 解析与关键帧 ROI 像素差检测。公式进入场景前，原有重叠区域旧公式必须显式淡出。无字符交叉重叠。 | `PASS`: 无重叠<br>`FAIL`: 出现重叠残影 |
| **GATE-02** | **边界与字幕安全带**<br>(Boundary & Safety) | 检查所有 mobject 坐标与外接盒 AABB。$X \in [-6.8, 6.8]$，$Y \in [-3.6, 3.6]$。底部 $Y \le -3.3$ 严禁放置主卡片。 | `PASS`: 均在安全区<br>`FAIL`: 发生越界溢出 |
| **GATE-03** | **遗留源对象与副本检测**<br>(Orphaned Objects) | 静态检测 `TransformMatchingShapes` / `copy()`。变换后源对象未移除且依然可见将触发报警 (DEF-01)。 | `PASS`: 无遗留副本<br>`FAIL`: 源对象残留 |
| **GATE-04** | **ValueTracker 绑定检测**<br>(Tracker Binding) | 静态解析 Scene 源码，检查所有 `ValueTracker` 实例是否被 `always_redraw` 或 `add_updater` 的可见对象引用 (DEF-02)。 | `PASS`: 100% 绑定<br>`FAIL`: 存在空转 Tracker |
| **GATE-05** | **画面异常静止检测**<br>(Abnormal Freeze) | 计算成片相邻帧像素差直方图。除显式设定的教学定格区间外，动态区间相邻帧差不得连续低于阈值。 | `PASS`: 动态节奏健康<br>`FAIL`: 异常卡死空转 |
| **GATE-06** | **字体完备性与 LaTeX 健康**<br>(Font & LaTeX Health) | 验证系统中安装的中文字体（如思源黑体、微软雅黑），检查 LaTeX 编译器 (`dvisvgm`, `latex`) 状态。 | `PASS`: 字体完全就绪<br>`FAIL`: 缺字乱码/报错 |
| **GATE-07** | **分镜转场与黑场检测**<br>(Scene Transition) | 提取场景拼接前后各 5 帧图像。检查是否存在非预期的纯黑或闪白黑屏帧。 | `PASS`: 转场平滑连接<br>`FAIL`: 出现意外黑闪 |
| **GATE-08** | **视频编码与流规格**<br>(Stream Specs) | 调用 `ffprobe` 提取音视频元数据：分辨率严格为 1920x1080、帧率 30.0 fps、编码 H.264 (High)、像素格式 yuv420p。 | `PASS`: 规格 100% 达标<br>`FAIL`: 编码参数偏差 |
| **GATE-09** | **关键变形高频抽帧**<br>(High-Freq Sampling) | 对数学公式变形或物理转折的核心时间窗口（如 $\pm 1.5$ 秒），执行每 0.1~0.2 秒高频抽帧，审查渐变平滑度。 | `PASS`: 抽帧平滑无撕裂<br>`FAIL`: 变形中间态畸变 |
| **GATE-10** | **数理模型匹配性**<br>(Model Consistency) | 校验成片是否关联有效的 `physics_config.json` 且已通过 `verify_physics.py` 的基准检验。 | `PASS`: 数理验证通过<br>`FAIL`: 无数理支持或失败 |

---

## 二、高频抽帧复核规范 (Dense Keyframe Inspection)

在代数推导或复杂波动演化过程中，仅检查粗粒度关键帧容易遗漏持续时间仅 0.2 秒的“中间态字符撕裂”或“飞字穿模”：

1. **高频抽样策略**：
   - 在公式重写/替换窗口（例如 $t \in [t_{start} - 0.5s, t_{end} + 0.5s]$），以 **$5 \sim 10\text{ fps}$** 的频率密集提取序列帧；
   - 检查图像中心区域的灰度梯度与文字轮廓连续性。
2. **抽帧产物命名与存档**：
   - 提取帧统一存放于 `qa/keyframes/dense_s3/` 目录下；
   - 命名格式：`frame_{seq:03d}_{timestamp:05.2f}s.png`。

---

## 三、三轮定向修复闭环 (Auto-Fix Protocol)

当 QA 门禁返回 `FAIL` 时，系统依据确诊证据启动定向修复，最多执行 3 轮：

- **Round 1：排版与边界修复**
  - 若 `GATE-02` 越界：自动根据超出距离调整 `buff` 或分区基准线 `shift`；
  - 若 `GATE-01` 局部拥挤：增加纵向垂直呼吸间距（扩大 $\Delta y \ge 0.2$）。
- **Round 2：生命周期与 Tracker 绑定修复**
  - 若 `GATE-03` 源对象残留：将 `Transform(A.copy(), B)` 替换为 `FadeOut(A)` + `Write(B)`；
  - 若 `GATE-04` Tracker 空转：在 `construct()` 中为 Tracker 添加微缩物理曲线或相位动态指示点。
- **Round 3：时序与编码重新生成**
  - 若 `GATE-05` 异常静止：微调 `play(..., run_time=...)` 与 `rate_func`；
  - 重新运行 `build_video.py`，复核 10 大门禁直至全绿。

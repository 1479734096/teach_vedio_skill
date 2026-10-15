# 系统架构与上游关系说明 (02-architecture-and-upstream.md)

## 一、与上游 huashu-art-motion 的关系

1. **技术渊源**：
   - 本 Skill 基于开源项目 [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion)（MIT License，作者：花叔 · 花生）底层 Canvas 2D 动效渲染循环与离线字体加载架构。
   - 上游项目专注于艺术风格复刻（35 种艺术风格画派）及通用解说视频语法（8 种 YouTube 语法）。
2. **本 Skill 的专门定位**：
   - 物理与数学教学视频对“数学严谨性”、“物理规律真实自洽”、“坐标与公式精确排版”、“零跳变动态连续性”具有严苛的要求。
   - `physics-canvas-video` 将 D V3 迭代中积累的工业级技术资产抽象提炼，专门服务于理工科知识点的高质量可视化。
3. **架构解耦与非侵入式设计**：
   - 本 Skill 将核心依赖内置于 `scripts/engine/`，新建独立项目时完全自包含，不修改上游 `huashu-art-motion/` 的任何代码；
   - 严禁向项目根目录或全局 Codex 目录写入专属缓存或修改全局配置；
   - 遵循 MIT 许可证，完整保留上游版权与授权声明。

---

## 二、三层软件架构

```
┌────────────────────────────────────────────────────────┐
│ 业务层 (Domain Scenes)                                 │
│ shot1.js, shot2.js, ..., physics_config.json           │
├────────────────────────────────────────────────────────┤
│ 通用教学组件层 (Physics Canvas Kit)                    │
│ physics_common.js, layout.js (AABB/Math), 字体预热     │
├────────────────────────────────────────────────────────┤
│ 基础驱动层 (Core Engine & Runtime)                     │
│ engine.js, transitions.js, Playwright, FFmpeg, Canvas2D│
└────────────────────────────────────────────────────────┘
```

1. **基础驱动层**：
   - `engine.js`：提供基于微秒时间戳的确定性渲染主循环与转场管理；
   - `render.py`：通过 Playwright Headless 浏览器按帧抽取 Canvas 图像流，并无损管道输入 FFmpeg 生成 H.264 视频；
   - `lib/fonts/`：提供离线 NotoSansSC、Computer Modern 与霞鹜文楷字体，杜绝云端拉取失败。
2. **通用教学组件层**：
   - `physics_common.js`：提供通用坐标系 `drawCoordinateSystem`、函数曲线 `drawContinuousCurve`、电位采样点 `drawDiscreteProbes`、绝对锚定微流箭头 `drawHarmonicFlow`、标准顶底卡片及 RSA 高对比马克笔板书手绘；
   - `layout.js`：提供标准 1080p 屏幕安全区域（ZONES）、AABB 包围盒防遮挡检测与公式排版引擎 `typesetMath`。
3. **业务层**：
   - 针对具体物理或数学主题编写的独立配置与分镜代码，实现具体物理公式与动画行为。

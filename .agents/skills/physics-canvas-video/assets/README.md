# physics-canvas-video 资源资产规范 (assets/README.md)

本目录与 `scripts/engine/lib/` 共同管理教学动画的静态视觉与字体资产：

## 1. 离线数理与中文字体库 (`lib/fonts/`)
- `NotoSansSC-500.woff`, `NotoSansSC-700.woff`: 思源黑体，用于中文大标题、镜头角标与教学卡片解说；
- `LXGWWenKai-500.woff`: 霞鹜文楷，用于 RSA 黑板板书、手绘公式说明；
- `cmunrm.woff`, `cmunti.woff`: Computer Modern 正体与斜体，经典 LaTeX 风格数学物理公式专用字体；
- 字体均采用合法开源许可证（SIL OFL / Apache 2.0），内嵌于项目中，保障离线与跨平台环境 100% 渲染一致。

## 2. 视觉素材规范
- 默认鼓励纯代码 Canvas 2D 矢量与数学函数实时生成，确保无限放大清晰度与极高渲染效率；
- 如需导入外部实验仪器实物图、示波器波形截图，请放置于项目工程的 `assets/` 目录中，并通过相对路径引用。

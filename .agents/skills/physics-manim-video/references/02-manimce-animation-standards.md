# ManimCE 动画规范与生命周期管线 (02-manimce-animation-standards.md)

本规范基于 Manim Community Edition (ManimCE v0.22.0+) 架构，沉淀了 `experiments/A_3b1b/`、`A_3b1b_v2/`、`A_3b1b_v3/` 以及 `A_3b1b_final/` 的工程教训，为物理与数学动画提供确定性、高品质的代码实现标准。

---

## 一、Scene 架构与模块化规范

1. **场景独立性 (Self-Contained Scenes)**：
   - 每个 Scene 必须是一个独立的 Python 类（继承自 `Scene` 或 `MovingCameraScene`）；
   - 每个 Scene 源码只包含自身的动画编排逻辑，通用的样式、物理计算与常量提取至 `style.py`；
   - 场景之间禁止出现全局状态污染或隐式变量传递。

2. **时间轴预算与显式计时 (Explicit Timing Budget)**：
   - 每个 Scene 开头应在文档注释中明确标注预期时长（如 `Duration: 14.0s`）；
   - 代码末尾必须包含时间总和检查注释：
     ```python
     # Total duration = 0.8 + 1.2 + 1.8 + 1.0 + 1.7 + 1.5 + 1.5 + 1.0 + 3.5 = 14.0s!
     ```
   - 杜绝随意漂移的 `self.wait()`，每次等待必须有明确的教学观察目的。

---

## 二、Mobject 对象生命周期铁律 (The Lifecycle Rules)

在 Manim 动画中，对象生命周期管理不当是导致“字符重叠”、“飞字穿模”和“幽灵残影”的最主要根源。

### 1. 废除危险的 `mobject.copy()` 跨层变换 (DEF-01 的教训)
- **V1 典型错误**：
  ```python
  # 错误做法：TransformMatchingShapes 保留了 eq_sum，同时复制出副本跨越中间卡片
  self.play(TransformMatchingShapes(eq_sum.copy(), eq_standing))
  ```
  - **严重后果**：原公式 `eq_sum` 仍然残留在上方屏幕，而其副本在下移变形过程中与中间的和差化积卡片发生视觉重叠穿透，造成严重的字符撕裂与重影。
- **Final 黄金实践**：采用显式淡出与新位置重写：
  ```python
  # 正确做法：旧公式平滑淡出，目标公式在独立预留空间正式写入
  self.play(
      FadeOut(eq_sum, shift=DOWN*0.1),
      Write(eq_standing),
      run_time=1.7
  )
  ```

### 2. 变换动画的选型决策树
- **何时使用 `ReplacementTransform(A, B)`**：
  - 当且仅当 $A$ 与 $B$ 具有**一对一的几何或物理对应关系**（例如单个圆变形为椭圆，或同一物理量的符号从 $x(t)$ 演化为 $X(\omega)$）；
  - 执行后 $A$ 被彻底从场景移除，变量 $B$ 正式进入场景。
- **何时使用 `TransformMatchingTex(eq1, eq2)`**：
  - 当且仅当两个公式具有大量相同的 LaTeX 切片，且变换能够增强数学理解（例如移项、因式分解展开）；
  - 切片必须以列表显式声明：
    ```python
    eq1 = MathTex("a^2", "+", "b^2")
    eq2 = MathTex("a^2", "+", "2ab", "+", "b^2")
    self.play(TransformMatchingTex(eq1, eq2))
    ```
- **何时严禁使用变形动画 (V3 的严重教训)**：
  - **伪形变红线**：严禁为了追求所谓“炫酷流畅的形变感”，将不具备数学因果映射的两个项强行拉扯变形！
  - *V3 负面案例*：将入射波 $A\cos(\omega t - \beta x)$ 变形为空间项 $2A\cos(\beta x)$，将反射波 $A\cos(\omega t + \beta x)$ 变形为时间项 $\cos(\omega t)$。
  - *数学批判*：这严重误导了学生，让学生以为“入射波变成了空间包络，反射波变成了时间振荡”。实际上，空间因子和时间因子是两列波通过三角恒等式相加后的共同产物！
  - *规范准则*：当数学变换涉及“和差化积”、“傅里叶积分”、“卷积翻转”等非平凡代数飞跃时，**必须以静态恒等式卡片作为逻辑中介，使用 `FadeOut` + `Write` 清晰书写，保持数学敬畏**。

---

## 三、ValueTracker 与 Updater 规范 (防空转与防瞬移)

1. **ValueTracker 必须连接可见对象 (DEF-02 的教训)**：
   - **V1 典型错误**：代码中定义了 `t_tracker = ValueTracker(0.0)` 并播放 `self.play(t_tracker.animate.set_value(2.5), run_time=2.5)`，但画面中没有任何 mobject 关联该 tracker，导致视频画面僵死静止整整 2.5 秒！
   - **黄金准则**：在创建 `ValueTracker` 后，必须紧接着定义至少一个绑定的动态对象：
     ```python
     t_tracker = ValueTracker(0.0)
     wave_curve = always_redraw(lambda: FunctionGraph(
         lambda x: standing_wave(x, t_tracker.get_value()),
         x_range=[X_MIN, X_MAX, 0.04],
         color=COLOR_STANDING
     ))
     self.add(wave_curve)
     ```
   - 我们的 QA 门禁会静态扫描代码，一旦发现未连接 updaters 的 tracker 运行，将直接拦截报错。

2. **`always_redraw` vs `add_updater` 选择**：
   - 对于拓扑结构或顶点数量随时间变化的对象（如波形曲线 `FunctionGraph`、包含动态数值的 `MathTex`、大括号 `Brace`），使用 `always_redraw(lambda: ...)`；
   - 对于仅更新固定坐标、颜色或旋转角度的对象（如点 `Dot`、指示箭头 `Arrow`），使用 `add_updater`：
     ```python
     dot.add_updater(lambda d: d.move_to([x_pos, wave_func(x_pos, t_tracker.get_value()), 0]))
     ```
   - 在场景退出前或需要定格时，记得通过 `dot.clear_updaters()` 释放资源，防止内存泄漏或跨幕污染。

3. **动态连续性与防瞬移**：
   - 严禁在波形或相位箭头中使用 `((t * v) % L)` 造成单帧撕裂瞬移；
   - 所有动态流动必须锚定在全局世界坐标系，或采用连续平滑的正余弦相位调制。

---

## 四、排版、字阶与多语言渲染

1. **文字与公式分立 (Separation of Concerns)**：
   - 中文解释性文字必须使用 `Text(..., font="Microsoft YaHei")`；
   - 数学公式必须使用纯 LaTeX `MathTex(r"...")`；
   - 严禁在 `MathTex` 中混排未经 `\text{...}` 保护的中文字符，避免渲染失败或乱码。

2. **坐标系与物理构图边界匹配 (DEF-04 的教训)**：
   - 导线间距、坐标轴跨度必须与物理波形的最大振幅建立数学关联；
   - 例如：当驻波峰值振幅为 $2A = 1.2$ 时，传输线导线间距必须设为 $2.4$ 以上（使导线位于 $y = \pm 1.2$ 外侧的 $\pm 1.4$），确保波形在物理边界内优美舒展，不发生构图穿透。

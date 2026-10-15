# 数学与物理原理验证规范 (04-math-and-physics-verification.md)

本规范规定了教学视频在进入动画编程之前必须完成的“单一真实来源 (SSOT)”建立与“符号/数值双重验证”流程。

---

## 一、单一真实来源 (Single Source of Truth, SSOT)

物理和数学教学动画绝不能“边写代码边拍脑袋定参数”。所有的物理常数、几何比例、时钟周期和解析方程必须统一在项目的 `physics_config.json` 中定义。

### `physics_config.json` 标准结构
```json
{
  "project_name": "standing_wave_explainer",
  "topic": "standing_wave",
  "version": "1.0.0",
  "parameters": {
    "wavelength": 6.0,
    "period": 2.0,
    "amplitude": 1.0,
    "reflection_coeff": 1.0,
    "x_term": 4.2,
    "x_source": -5.8
  },
  "derived": {
    "beta": "2 * pi / wavelength",
    "omega": "2 * pi / period",
    "phase_velocity": "omega / beta"
  },
  "checkpoints": [
    {
      "name": "open_terminal_voltage",
      "x": 4.2,
      "t": 0.0,
      "expected_value": 2.0
    },
    {
      "name": "quarter_wave_node",
      "x": 2.7,
      "t": 0.5,
      "expected_value": 0.0
    }
  ],
  "verification_suites": [
    "identities",
    "boundary_conditions",
    "numerical_residuals",
    "dynamic_consistency"
  ]
}
```

---

## 二、双重验证机制 (Dual Verification Engine)

验证引擎 `verify_physics.py` 结合 **SymPy (符号推导)** 与 **NumPy (高精度数值采样)**：

### 1. 符号数学恒等式验证 (SymPy Symbolic Check)
- 验证推导过程中引用的数学恒等式是否在代数上严格成立；
- 例如：
  - 和差化积恒等式：$\cos(\alpha - \delta) + \cos(\alpha + \delta) - 2\cos\delta\cos\alpha \equiv 0$
  - 傅里叶三角正交系：$\int_0^{2\pi} \sin(mx)\cos(nx)dx = 0$
  - 卷积时移性质：$\mathcal{F}\{f(t - t_0)\} = e^{-j\omega t_0} F(\omega)$
- SymPy 必须化简 (`trigsimp`, `simplify`) 并断言符号差严格为零。

### 2. 边界条件与守恒量验证 (Boundary & Conservation Check)
- 终端阻抗与反射系数：$\Gamma_L = \frac{Z_L - Z_0}{Z_L + Z_0}$，当 $Z_L \to \infty$ 时极限定值 $+1$；
- 边界电压/电流值：计算 $u(x_{term}, t)$ 与 $i(x_{term}, t)$，断言电压同相相长，电流恒零；
- 守恒量（如能量守恒、总概率积分、面积守恒）。

### 3. 数值残差与离散采样验证 (Numerical Residual Check)
- 在定义的物理空间范围内均匀采样 $N \ge 1000$ 个网格点，在 $[0, 2T]$ 时间段内随机采样 $M \ge 50$ 个时刻；
- 检验动画中实际渲染的波动曲线 $f_{render}(x, t)$ 与理论闭式解 $f_{exact}(x, t)$ 的最大绝对误差：
  $$\text{Residual} = \max_{x, t} |f_{render}(x, t) - f_{exact}(x, t)| < 10^{-6}$$

### 4. 动态图象与数学模型一致性
- 验证代码中 `ValueTracker` 推进速率与波动角频率 $\omega$ 是否满足物理时间缩放比例；
- 验证动画呈现的相速度方向与波前运动方向无逆行。

---

## 三、可扩展验证接口规范与 NOT_RUN 准则

针对不同数理主题，验证引擎通过可插拔的 `TopicVerifier` 基类进行扩展：

```python
class BaseVerifier:
    def verify_identities(self) -> dict: ...
    def verify_boundary_conditions(self) -> dict: ...
    def verify_numerical_residuals(self) -> dict: ...
    def verify_dynamic_model(self) -> dict: ...
```

### 严禁虚假 PASS (The NOT_RUN Ironclad Rule)
- 每一项检验必须返回标准三态之一：
  1. `PASS`：检验已执行且绝对误差低于容差门槛，提供实测残差值作为证据；
  2. `FAIL`：检验已执行但残差超标或符号恒等式不成立，提供失败详情；
  3. `NOT_RUN`：当前物理主题不包含该检验项（例如在卷积动画中没有“终端开路反射边界条件”，在纯几何证明中没有“时间偏导波动方程”）。
- **红线**：严禁为了让报告看起来“全绿”而对未执行的项目伪造 `PASS`！不适用的项目必须明确标示 `NOT_RUN`，并附带不适用原因说明。

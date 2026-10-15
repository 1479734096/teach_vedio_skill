# 物理参数单一真实来源 (SSOT) 规范 (05-single-source-of-truth.md)

## 一、为什么需要单一真相来源？

教学动画最严重的缺陷是“数字打架”：
- 画面上的文字写着“波长 500px”，但 Canvas 代码里却画成了 400px；
- 底部卡片写着“周期 2.0s”，但公式中角频率却用了 $\omega = 4\pi$；
- 质检脚本用一套硬编码参数核算，工程代码又用了另一套参数。

为确保数学与物理严格自洽，本 Skill 强制建立**单一真实来源 (Single Source of Truth, SSOT)**。

---

## 二、`physics_config.json` 架构规范

每个动画工程的根目录下必须维护 `physics_config.json`，结构如下：

```json
{
  "title": "两列相反方向的波如何产生驻波？——传输线电压驻波机制",
  "topic": "standing_wave",
  "domain_note": "纵向波形为无耗传输线电压分布，非材料机械横向振动；沿线点为空间电位采样点。",
  "parameters": {
    "amplitude_A_px": 75,
    "standing_amplitude_2A_px": 150,
    "wavelength_lambda_px": 500,
    "period_T_s": 2.0,
    "omega_rad_s": 3.141592653589793,
    "beta_rad_px": 0.012566370614359173,
    "phase_velocity_px_s": 250,
    "reflection_coefficient_gamma": 1.0
  },
  "coordinates": {
    "screen_origin_X0": 1500,
    "screen_baseline_Y0": 550,
    "x_min_px": -1050,
    "x_max_px": 40
  },
  "equations": {
    "incident_wave": "u_i = A * cos(omega * t - beta * x)",
    "reflected_wave": "u_r = A * cos(omega * t + beta * x)",
    "standing_wave": "u = 2 * A * cos(beta * x) * cos(omega * t)"
  },
  "checkpoints": [
    { "name": "node_1", "type": "node", "x": -125, "expected_value": 0.0 },
    { "name": "antinode_0", "type": "antinode", "x": 0, "expected_value": 150.0 }
  ]
}
```

---

## 三、同步与绑定机制

1. **与 `animation_spec.json` 的自动同步**：
   - `animation_spec.json` 中的 `"physics"` 字段必须直接映射此配置；
   - 门禁 `Suite A` 会逐字段对比两者，差异即报警。
2. **场景脚本中的常量引用**：
   - 场景代码 `scenes/*.js` 或 `physics_common.js` 中定义的物理常量名（如 `LAMBDA`, `A`, `T`, `V`）数值必须与 `physics_config.json` 100% 吻合；
   - 禁止在场景中临时写死未备案的 magic number。
3. **质检门禁的数据驱动**：
   - `qa_gate.py` 直接读取 `physics_config.json` 中的参数执行数值积分、相速度测定、波节残差验证，实现纯数据驱动质检。

// 镜头 1 (0.0s - 6.0s)：呈现 RC 串联回路与初始合闸，电容电压为 0，初始电流最大
(() => {
  const W = window.RC;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot1'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 0 ~ 1.5s 开关断开 (off)；1.5s 时合闸接通触点 1 开始充电
      const isClosed = lt >= 1.5;
      const simT = isClosed ? (lt - 1.5) * 0.4 : 0.0;
      const mode = isClosed ? 'charge' : 'off';

      const cam = CAM.track({ x: 960, y: 520, z: 1.0 }, [], lt);

      CAM.with(c, cam, c => {
        // 绘制 RC 闭合回路电路示意图
        W.drawRCCircuit(c, 960, 480, 880, 420, lt, { mode: mode, simT: simT });
      });

      // 屏幕固定 UI 层：初始状态说明与公式
      c.save();
      const textAlpha = MO.smooth(clamp(lt / 0.8));
      c.globalAlpha = textAlpha;

      c.font = `600 24px "PuHui-Medium", sans-serif`;
      c.fillStyle = W.PAL.blue;
      c.textAlign = 'left';
      c.fillText('第一阶段：零状态初始条件 (t = 0⁻ 开路 ⟶ t = 0⁺ 合闸涌流)', 100, 150);

      if (!isClosed) {
        L.typesetMath(c, [
          { s: '合闸前:', col: W.PAL.greyB, gap: 10 },
          { s: 'v', it: true, sub: 'C', col: W.PAL.blue },
          { s: '(', gap: 2 },
          { s: '0', col: W.PAL.yellow },
          { s: '⁻', col: W.PAL.yellow, gap: 2 },
          { s: ')', gap: 6 },
          { s: '=', gap: 6 },
          { s: '0 V', col: W.PAL.blue, gap: 20 },
          { s: 'i', it: true, col: W.PAL.red },
          { s: '(', gap: 2 },
          { s: '0', col: W.PAL.yellow },
          { s: '⁻', col: W.PAL.yellow, gap: 2 },
          { s: ')', gap: 6 },
          { s: '=', gap: 6 },
          { s: '0 A', col: W.PAL.red, gap: 16 },
          { s: '极板无净电荷，回路处于断路静止态', col: W.PAL.greyC }
        ], 100, 205, 36, { align: 'left', col: W.PAL.white });
      } else {
        L.typesetMath(c, [
          { s: '合闸瞬间:', col: W.PAL.yellow, gap: 10 },
          { s: 'v', it: true, sub: 'C', col: W.PAL.blue },
          { s: '(', gap: 2 },
          { s: '0', col: W.PAL.yellow },
          { s: '⁺', col: W.PAL.yellow, gap: 2 },
          { s: ')', gap: 6 },
          { s: '=', gap: 6 },
          { s: '0 V', col: W.PAL.blue, gap: 16 },
          { s: '(', col: W.PAL.greyB },
          { s: '电容电压不可突变', col: W.PAL.blue },
          { s: ')', col: W.PAL.greyB, gap: 20 },
          { s: 'i', it: true, col: W.PAL.red },
          { s: '(', gap: 2 },
          { s: '0', col: W.PAL.yellow },
          { s: '⁺', col: W.PAL.yellow, gap: 2 },
          { s: ')', gap: 6 },
          { s: '=', gap: 6 },
          { s: 'V₀/R', it: true, col: W.PAL.red, gap: 6 },
          { s: '=', gap: 6 },
          { s: '10 mA (最大涌流)', col: W.PAL.red }
        ], 100, 205, 36, { align: 'left', col: W.PAL.white });
      }
      c.restore();

      // 顶栏与底栏
      W.drawHeader(c, '镜头 1/5 · 初始合闸零状态', 'RC 电路充放电过程——时间常数与能量动态转换');
      W.drawBottomCard(
        c,
        '合闸瞬间 (t = 0⁺)：电容器极板未积累电荷，两端电压为零，瞬时等效为短路',
        '电源全部电压 10 V 瞬时降落在电阻 R 上，产生峰值初始充电电流 I₀ = V₀ / R = 10 mA'
      );
    }
  };
})();

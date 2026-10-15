// 镜头 4 (18.0s - 24.0s)：第三与四步 重叠相乘与面积积分累积，实时生成输出 y(t)
(() => {
  const W = window.CONV;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot4'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 时间平移演化：t 从 -150 扫掠至 +250 (涵盖进入、峰值重合、滑出的完整过程)
      const scanP = MO.smooth(clamp(lt / 5.5));
      const simT = -150 + Math.min(lt, 5.0) * 100;

      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [], lt);

      CAM.with(c, cam, c => {
        // 上屏：哑变量 tau 坐标系、滑动信号与黄色重叠相乘区域
        W.drawTauSystem(c, simT);

        // 下屏：输出时间 t 坐标系与实时累积的卷积响应曲线 y(t)
        W.drawOutputSystem(c, simT);
      });

      // 屏幕固定 UI 层：卷积积分定义式
      c.save();
      c.font = `600 24px "PuHui-Medium", sans-serif`;
      c.fillStyle = W.PAL.yellow;
      c.textAlign = 'left';
      c.fillText('第三与第四步：重叠相乘与时域面积积分累积', 100, 160);

      L.typesetMath(c, [
        { s: 'y', it: true, col: W.PAL.green },
        { s: '(', gap: 2 },
        { s: 't', it: true, gap: 2 },
        { s: ')', gap: 10 },
        { s: '=', gap: 10 },
        { s: '(', col: W.PAL.white, gap: 4 },
        { s: 'f', it: true, col: W.PAL.blue, gap: 4 },
        { s: '∗', col: W.PAL.yellow, gap: 4 },
        { s: 'g', it: true, col: W.PAL.red, gap: 4 },
        { s: ')', col: W.PAL.white, gap: 4 },
        { s: '(', gap: 2 },
        { s: 't', it: true, gap: 2 },
        { s: ')', gap: 10 },
        { s: '=', gap: 10 },
        { s: '∫', col: W.PAL.yellow, gap: 4 },
        { s: 'f', it: true, col: W.PAL.blue },
        { s: '(', gap: 2 },
        { s: 'τ', it: true, gap: 2 },
        { s: ')', gap: 8 },
        { s: 'g', it: true, col: W.PAL.red },
        { s: '(', gap: 2 },
        { s: 't', it: true, col: W.PAL.green, gap: 4 },
        { s: '−', col: W.PAL.red, gap: 4 },
        { s: 'τ', it: true, col: W.PAL.red, gap: 2 },
        { s: ')', gap: 8 },
        { s: 'dτ', it: true, col: W.PAL.yellow }
      ], 100, 225, 38, { align: 'left', col: W.PAL.white });
      c.restore();

      // 顶栏与底栏
      W.drawHeader(c, '镜头 4/5 · 相乘与面积累积', '卷积的翻转与平移——连续时间卷积积分机制');
      W.drawBottomCard(
        c,
        '上屏黄色区域为瞬时重叠相乘积 f(τ)·g(t−τ)；该重叠区域的面积值即为当前时刻 t 的卷积输出 y(t)',
        '两方波相卷积，随着重叠面积由线性增加到完全重合再到滑出，在下屏平滑累积出经典的梯形/三角响应曲线'
      );
    }
  };
})();

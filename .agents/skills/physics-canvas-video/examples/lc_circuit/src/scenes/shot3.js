// 镜头 3 (12.0s - 18.0s)：自感电动势维持电流，反向充饱电容器 (t: T/4 -> T/2)
(() => {
  const W = window.LC;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot3'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 时间演化：T/4 -> T/2
      const phaseP = MO.smooth(clamp(lt / 5.5));
      const simT = (W.T / 4) + phaseP * (W.T / 4);

      // 相机动作：横移聚焦极板反向极化过程
      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [
        { at: 1.2, kind: 'glide', x: 860, y: 480, dur: 0.9 },
        { at: 4.2, kind: 'to', x: 960, y: 540, z: 1.0, dur: 1.0 }
      ], lt);

      CAM.with(c, cam, c => {
        W.drawCircuitDiagram(c, 960, 480, 850, 420, simT);
      });

      // 动态能量状态条
      W.drawEnergyGauges(c, 260, 720, 1400, 50, simT);

      // 屏幕固定 UI 层：公式排版
      const formAlpha = MO.smooth(MO.seg(lt, 0.3, 1.2));
      if (formAlpha > 0) {
        c.save();
        c.globalAlpha = formAlpha;

        c.font = `600 24px "PuHui-Medium", sans-serif`;
        c.fillStyle = W.PAL.green;
        c.textAlign = 'left';
        c.fillText('反向充电阶段 (T/4 < t ≤ T/2)：自感电动势抵抗电流衰减', 100, 160);

        // 核心公式: E_L = -L di/dt, q(T/2) = -Q0, i(T/2) = 0
        L.typesetMath(c, [
          { s: 'E', it: true, sub: 'L', col: W.PAL.red },
          { s: '=', gap: 10 },
          { s: '−', gap: 4 },
          { s: 'L', it: true, gap: 4 },
          { s: 'di/dt', it: true, col: W.PAL.red, gap: 20 },
          { s: ',', gap: 16 },
          { s: 'q', it: true, col: W.PAL.blue },
          { s: '(', gap: 3 },
          { s: 'T/2', gap: 3 },
          { s: ')', gap: 10 },
          { s: '=', gap: 10 },
          { s: '−', gap: 4 },
          { s: 'Q', it: true, sub: '0', col: W.PAL.blue, gap: 20 },
          { s: ',', gap: 16 },
          { s: 'i', it: true, col: W.PAL.red },
          { s: '(', gap: 3 },
          { s: 'T/2', gap: 3 },
          { s: ')', gap: 10 },
          { s: '=', gap: 10 },
          { s: '0' }
        ], 100, 225, 38, { align: 'left', col: W.PAL.white });

        c.restore();
      }

      // 顶栏与底栏
      W.drawHeader(c, '镜头 3/5 · 反向极化充饱', 'LC 振荡电路中的能量交换与电磁振荡机制');
      W.drawBottomCard(
        c,
        '电感线圈磁场坍缩产生自感电动势，阻止电流减小，维持电荷继续向电容器下极板堆积',
        '在 t = T/2 时刻磁场能完全归零，电容器下极板充为正、上极板充为负，反向电场储能达 100%'
      );
    }
  };
})();

// 镜头 2 (6.0s - 12.0s)：电容放电，电流增长，电感磁场建立 (t: 0 -> T/4)
(() => {
  const W = window.LC;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot2'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 时间演化：0.0s -> 1.0s (即 0 -> T/4)
      const phaseP = MO.smooth(clamp(lt / 5.5));
      const simT = phaseP * (W.T / 4);

      // 相机动作：缓推聚焦电感线圈磁场建立
      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [
        { at: 1.2, kind: 'push', k: 0.16, dur: 0.9, x: 1120, y: 480 },
        { at: 4.2, kind: 'pull', z: 1.0, dur: 1.0, x: 960, y: 540 }
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
        c.fillStyle = W.PAL.red;
        c.textAlign = 'left';
        c.fillText('放电阶段 (0 < t ≤ T/4)：电场能连续转化为磁场能', 100, 160);

        // 核心公式: q(t) -> 0, |i(t)| -> I0, Em = 1/2 L i^2
        L.typesetMath(c, [
          { s: 'q', it: true, col: W.PAL.blue },
          { s: '(', gap: 3 },
          { s: 'T/4', gap: 3 },
          { s: ')', gap: 10 },
          { s: '=', gap: 10 },
          { s: '0', col: W.PAL.blue, gap: 20 },
          { s: ',', gap: 16 },
          { s: 'i', it: true, col: W.PAL.red },
          { s: '(', gap: 3 },
          { s: 'T/4', gap: 3 },
          { s: ')', gap: 10 },
          { s: '=', gap: 10 },
          { s: '+', gap: 4 },
          { s: 'I', it: true, sub: '0', col: W.PAL.red, gap: 20 },
          { s: ',', gap: 16 },
          { s: 'E', it: true, sub: 'm', col: W.PAL.red },
          { s: '=', gap: 10 },
          { s: '1/2', gap: 8 },
          { s: 'L', it: true, gap: 4 },
          { s: 'I', it: true, sub: '0', sup: '2', col: W.PAL.red }
        ], 100, 225, 38, { align: 'left', col: W.PAL.white });

        c.restore();
      }

      // 顶栏与底栏
      W.drawHeader(c, '镜头 2/5 · 电场转为磁场', 'LC 振荡电路中的能量交换与电磁振荡机制');
      W.drawBottomCard(
        c,
        '电容器放电驱动电荷流动，电场减弱，电感线圈产生自感磁场与磁通聚集',
        '在 t = T/4 时刻极板净电荷降为 0，回路电流达到峰值 I₀，全部能量转化为磁场能：Em = 100%'
      );
    }
  };
})();

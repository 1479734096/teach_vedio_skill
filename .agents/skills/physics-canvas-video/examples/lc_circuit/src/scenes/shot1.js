// 镜头 1 (0.0s - 6.0s)：呈现 LC 回路初始态，电容充饱电荷 Q=Q0，电场能 Ee=100%
(() => {
  const W = window.LC;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot1'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 相机动作：1.5s 缓推聚焦电容器极板电场，4.2s 回正
      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [
        { at: 1.5, kind: 'push', k: 0.16, dur: 0.9, x: 800, y: 480 },
        { at: 4.2, kind: 'pull', z: 1.0, dur: 1.0, x: 960, y: 540 }
      ], lt);

      CAM.with(c, cam, c => {
        // 初始态 t = 0，电容充饱，电流为 0
        const t = 0.0;
        W.drawCircuitDiagram(c, 960, 480, 850, 420, t);
      });

      // 动态能量状态条
      W.drawEnergyGauges(c, 260, 720, 1400, 50, 0.0);

      // 屏幕固定 UI 层：公式排版
      const formAlpha = MO.smooth(MO.seg(lt, 0.4, 1.4));
      if (formAlpha > 0) {
        c.save();
        c.globalAlpha = formAlpha;

        c.font = `600 24px "PuHui-Medium", sans-serif`;
        c.fillStyle = W.PAL.blue;
        c.textAlign = 'left';
        c.fillText('初始态 (t = 0)：静电场储能达峰值', 100, 160);

        // 核心公式: q(0) = Q0, i(0) = 0, Ee = Q0^2 / (2C)
        L.typesetMath(c, [
          { s: 'q', it: true, col: W.PAL.blue },
          { s: '(', gap: 3 },
          { s: '0', gap: 3 },
          { s: ')', gap: 10 },
          { s: '=', gap: 10 },
          { s: 'Q', it: true, sub: '0', col: W.PAL.blue, gap: 20 },
          { s: ',', gap: 16 },
          { s: 'i', it: true, col: W.PAL.red },
          { s: '(', gap: 3 },
          { s: '0', gap: 3 },
          { s: ')', gap: 10 },
          { s: '=', gap: 10 },
          { s: '0', gap: 20 },
          { s: ',', gap: 16 },
          { s: 'E', it: true, sub: 'e', col: W.PAL.blue },
          { s: '=', gap: 10 },
          { s: '1/2', gap: 8 },
          { s: 'Q', it: true, sub: '0', sup: '2', gap: 4 },
          { s: '/', gap: 4 },
          { s: 'C', it: true }
        ], 100, 225, 38, { align: 'left', col: W.PAL.white });

        c.restore();
      }

      // 顶栏与底栏
      W.drawHeader(c, '镜头 1/5 · 初始电场储能', 'LC 振荡电路中的能量交换与电磁振荡机制');
      W.drawBottomCard(
        c,
        '初始态电容器充饱电荷 Q = Q₀，极板间建立高能静电场；回路电流为 0，磁场储能为 0',
        '全部电磁能量均集中储存于电容器极板间的静电场中：Ee(0) = E_total = 100%'
      );
    }
  };
})();

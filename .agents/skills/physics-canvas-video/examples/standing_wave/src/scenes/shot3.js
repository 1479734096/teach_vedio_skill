// 镜头 3 (12.0s - 18.0s)：两列行波瞬时电压叠加，和差化积得到绿色驻波
(() => {
  const W = window.WAVE;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot3'] = {
    draw(c, lt, gt) {
      const t = lt + 12.0; // 连续物理时间
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 相机动作表：1.5s 缓推看清 2A 峰值合成，4.3s 平滑拉远精确回正至 z=1.0 全局
      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [
        { at: 1.5, kind: 'push', k: 0.18, dur: 0.9, x: 960, y: 540 },
        { at: 4.3, kind: 'pull', z: 1.0, dur: 1.0, x: 960, y: 540 }
      ], lt);

      // 叠加出场进度 (0.0 - 1.2s 平滑过渡显现)
      const superP = MO.smooth(clamp(lt / 1.2));
      const sumWave=(x,tt)=>(W.ui(x,tt)+W.ur(x,tt))*superP;sumWave.qaSignal='standing';sumWave.qaGain=superP;

      // 相机世界层：坐标系、两列原行波及绿色合成波
      CAM.with(c, cam, c => {
        // 绘制坐标系
        W.drawCoordinateSystem(c);

        // 1. 蓝色入射波与红色反射波退居辅助虚线 (高对比度半透明参考)
        W.drawWaveCurve(c, W.ui, t, W.PAL.blue, 2.5, [6, 6], 0.38, 0);
        W.drawWaveCurve(c, W.ur, t, W.PAL.red, 2.5, [6, 6], 0.38, 0);

        // 2. 绿色合成波 (线性叠加得到的驻波，带翠绿半透明电压场阴影)
        W.drawWaveCurve(c, sumWave, t, W.PAL.green, 5.5, null, 1.0, 0, 'rgba(46, 213, 115, 0.22)');

        // 3. 沿传输线离散电位采样指示点
        if (superP > 0.3) {
          W.drawVoltageIndicators(c, sumWave, t, W.PAL.green, 16, 0);
        }

        // 4. 在若干关键点绘制瞬时电位代数和辅助线 (体现 u = u_i + u_r)
        const sampleXs = [0, -W.LAMBDA * 0.25, -W.LAMBDA * 0.5, -W.LAMBDA * 0.75, -W.LAMBDA];
        sampleXs.forEach(sx => {
          const valI = W.ui(sx, t);
          const valR = W.ur(sx, t);
          const valTot = (valI + valR) * superP;

          const screenX = W.toScrX(sx);
          const y0 = W.toScrY(0);
          const yTot = W.toScrY(valTot);

          c.save();
          c.setLineDash([3, 3]);
          c.lineWidth = 1.5;
          c.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          c.beginPath();
          c.moveTo(screenX, y0);
          c.lineTo(screenX, yTot);
          c.stroke();

          // 采样指示核
          DG.neuron(c, screenX, yTot, 6.5, 1.0, { fill: W.PAL.green, stroke: W.PAL.white, lw: 1.5 });
          c.restore();
        });
      });

      // 屏幕固定 UI 层：数学推导排版
      const formFade = MO.smooth(MO.seg(lt, 0.2, 1.2));
      if (formFade > 0) {
        c.save();
        c.globalAlpha = formFade;

        // 标题：线性叠加原理
        c.font = `600 24px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
        c.fillStyle = W.PAL.green;
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        c.fillText('波动方程线性叠加 (Superposition Principle)', 100, 155);

        // 展开公式: u = u_i + u_r = A cos(...) + A cos(...)
        L.typesetMath(c, [
          { s: 'u', it: true, col: W.PAL.green },
          { s: '=', gap: 10 },
          { s: 'u', it: true, sub: 'i', col: W.PAL.blue, gap: 8 },
          { s: '+', gap: 8 },
          { s: 'u', it: true, sub: 'r', col: W.PAL.red, gap: 12 },
          { s: '=', gap: 12 },
          { s: 'A', it: true, gap: 6 },
          { s: 'cos', gap: 4 },
          { s: '(', gap: 4 },
          { s: 'ωt', it: true, gap: 4 },
          { s: '−', gap: 4 },
          { s: 'βx', it: true, gap: 4 },
          { s: ')', gap: 8 },
          { s: '+', gap: 8 },
          { s: 'A', it: true, gap: 6 },
          { s: 'cos', gap: 4 },
          { s: '(', gap: 4 },
          { s: 'ωt', it: true, gap: 4 },
          { s: '+', gap: 4 },
          { s: 'βx', it: true, gap: 4 },
          { s: ')' }
        ], 100, 208, 36, { align: 'left', col: W.PAL.white });

        // 和差化积化简公式: u = 2A cos(beta*x) cos(omega*t)
        const resultFade = MO.smooth(MO.seg(lt, 1.5, 2.5));
        if (resultFade > 0) {
          c.globalAlpha = resultFade;
          L.typesetMath(c, [
            { s: 'u', it: true, col: W.PAL.green, gap: 10 },
            { s: '=', gap: 12 },
            { s: '2', gap: 2 },
            { s: 'A', it: true, gap: 12 },
            { s: 'cos', col: W.PAL.yellow, gap: 4 },
            { s: '(', col: W.PAL.yellow, gap: 4 },
            { s: 'β', it: true, col: W.PAL.yellow, gap: 4 },
            { s: 'x', it: true, col: W.PAL.yellow, gap: 4 },
            { s: ')', col: W.PAL.yellow, gap: 12 },
            { s: 'cos', col: W.PAL.green, gap: 4 },
            { s: '(', col: W.PAL.green, gap: 4 },
            { s: 'ω', it: true, col: W.PAL.green, gap: 4 },
            { s: 't', it: true, col: W.PAL.green, gap: 4 },
            { s: ')', col: W.PAL.green }
          ], 100, 262, 42, { align: 'left', col: W.PAL.white });

          // 变量分离精简注释
          c.font = `600 19px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
          c.fillStyle = W.PAL.yellow;
          c.fillText('↑ 空间振幅包络 2A|cos(βx)|', 100, 298);
          c.fillStyle = W.PAL.green;
          c.fillText('↑ 全线时间周期谐振 cos(ωt)', 380, 298);
        }
        c.restore();
      }

      // 顶栏信息与角标
      W.drawHeader(c, '镜头 3/5 · 电压线性叠加', '两列相反方向的波如何产生驻波？', W.PAL.white);

      // 底部教学说明卡片 (安全区 y < 910)
      W.drawBottomCard(
        c,
        '瞬时电压线性叠加：由三角函数和差化积公式，得到空间与时间完全分离的驻波形式',
        '空间位置 x 决定了该点的最大电压振幅 2A|cos(βx)|，时间 t 驱动全线同步按 cos(ωt) 振动'
      );
    }
  };
})();

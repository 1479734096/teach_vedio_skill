// 镜头 4 (18.0s - 24.0s)：时域动态响应曲线、时间常数几何切线与特征点
(() => {
  const W = window.RC;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot4'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 扫描时间从 t = 0 扫掠至 4.5 tau
      const scanP = MO.smooth(clamp(lt / 5.5));
      const simT = lerp(0.0, 4.5, scanP);

      const cam = CAM.track({ x: 960, y: 520, z: 1.0 }, [
        { at: 1.2, kind: 'pull', z: 0.96, dur: 1.2, x: 960, y: 510 }
      ], lt);

      CAM.with(c, cam, c => {
        // 绘制双轴时域波形坐标系
        W.drawDualWaveforms(c, 960, 490, 1100, 420, lt, { simT: simT, maxT: 5.0 });

        // 绘制 t = 0 处初始斜率切线几何延伸 (交于 (tau, V0))
        c.save();
        const xStart = 960 - 550;
        const xEnd = 960 + 550;
        const yAxis = 490 + 210 - 40;
        const yPeak = 490 - 210 + 40;
        const xTau = xStart + (1.0 / 5.0) * (xEnd - xStart);

        c.setLineDash([5, 4]);
        c.strokeStyle = W.PAL.orange;
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(xStart, yAxis);
        c.lineTo(xTau, yPeak);
        c.stroke();
        c.setLineDash([]);

        // 切线与渐近线交点标志
        DG.neuron(c, xTau, yPeak, 6, 1.0, { fill: W.PAL.orange, stroke: W.PAL.white, lw: 2 });
        c.font = '600 17px "PuHui-Medium", sans-serif';
        c.fillStyle = W.PAL.orange;
        c.textAlign = 'left';
        c.fillText('初始切线交点 (τ, V₀)', xTau + 12, yPeak + 18);
        c.restore();
      });

      // 屏幕固定 UI 层：切线斜率与时间常数定义
      c.save();
      c.font = `600 24px "PuHui-Medium", sans-serif`;
      c.fillStyle = W.PAL.yellow;
      c.textAlign = 'left';
      c.fillText('第四阶段：时间常数 τ 的几何本质与过渡尺度', 100, 150);

      L.typesetMath(c, [
        { s: '初始切线斜率:', col: W.PAL.white, gap: 10 },
        { s: 'dv_C/dt|', it: true, sub: 't=0', col: W.PAL.blue },
        { s: '=', gap: 6 },
        { s: 'V₀ / τ', it: true, col: W.PAL.yellow, gap: 20 },
        { s: '几何意义:', col: W.PAL.orange, gap: 10 },
        { s: '若电容始终以初始最大速率充电，充饱所需时间恰好为 1 个时间常数 τ = 1.0 s', col: W.PAL.greyB }
      ], 100, 205, 36, { align: 'left', col: W.PAL.white });
      c.restore();

      // 顶栏与底栏
      W.drawHeader(c, '镜头 4/5 · 响应曲线与几何本质', 'RC 电路充放电过程——时间常数与能量动态转换');
      W.drawBottomCard(
        c,
        '指数响应的重要几何特征：t = 0 处的初始切线延伸与终态渐近线交点的横坐标恰好等于 τ',
        '实际充电过程中反电势逐步阻碍电荷流入；经过 3τ 达到 95.0%，经过 4τ 达到 98.2%，工程上通常以 3~5τ 视为稳态'
      );
    }
  };
})();

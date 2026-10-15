// 镜头 4 (18.0s - 24.0s)：正交正弦波形与全周期能量守恒互补柱状图
(() => {
  const W = window.LC;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot4'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 连续运行时间 (两个全周期 0 -> 2T)
      const t = lt + 18.0;
      const simT = (lt / 6.0) * (2 * W.T);

      // 相机动作：全景静态稳定
      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [], lt);

      CAM.with(c, cam, c => {
        // 1. 示波器坐标系 (时间轴 t 从 0 到 2T，横坐标 800px)
        const ox = 960;
        const oy = 460;
        const axisW = 1200;
        const xStart = ox - axisW / 2;
        const xEnd = ox + axisW / 2;

        c.save();
        // 水平时间轴
        c.strokeStyle = '#555555';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(xStart - 20, oy);
        c.lineTo(xEnd + 30, oy);
        c.stroke();

        // 箭头
        c.fillStyle = '#555555';
        c.beginPath();
        c.moveTo(xEnd + 38, oy);
        c.lineTo(xEnd + 22, oy - 6);
        c.lineTo(xEnd + 22, oy + 6);
        c.closePath();
        c.fill();

        // 时间刻度与文字 (0, T/4, T/2, 3T/4, T, 5T/4, 3T/2, 7T/4, 2T)
        const tTicks = [
          { val: 0, label: '0' },
          { val: W.T * 0.25, label: 'T/4' },
          { val: W.T * 0.5, label: 'T/2' },
          { val: W.T * 0.75, label: '3T/4' },
          { val: W.T, label: 'T' },
          { val: W.T * 1.25, label: '5T/4' },
          { val: W.T * 1.5, label: '3T/2' },
          { val: W.T * 1.75, label: '7T/4' },
          { val: W.T * 2, label: '2T' }
        ];

        tTicks.forEach(tk => {
          const sx = xStart + (tk.val / (2 * W.T)) * axisW;
          c.strokeStyle = '#444444';
          c.beginPath();
          c.moveTo(sx, oy - 5);
          c.lineTo(sx, oy + 5);
          c.stroke();

          // 垂直网格虚线
          c.setLineDash([3, 5]);
          c.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          c.beginPath();
          c.moveTo(sx, oy - 140);
          c.lineTo(sx, oy + 140);
          c.stroke();
          c.setLineDash([]);

          c.font = '17px "CMU-rm", sans-serif';
          c.fillStyle = W.PAL.greyB;
          c.textAlign = 'center';
          c.textBaseline = 'top';
          c.fillText(tk.label, sx, oy + 10);
        });

        // 纵轴
        c.beginPath();
        c.moveTo(xStart, oy - 140);
        c.lineTo(xStart, oy + 140);
        c.stroke();

        // 轴名称
        c.font = 'italic 20px "CMU-it", serif';
        c.fillStyle = W.PAL.white;
        c.textAlign = 'left';
        c.fillText('t (时间)', xEnd + 45, oy + 5);

        // 2. 绘制连续曲线
        // 蓝色电荷曲线 q(t) = Q0 * cos(omega0 * t)
        window.auditTag(c,'lc.q_curve',{model:'lc_q_curve',origin:[xStart,oy],x_scale:axisW/(2*W.T)});
        c.strokeStyle = W.PAL.blue;
        c.lineWidth = 3.5;
        c.beginPath();
        for (let i = 0; i <= 300; i++) {
          const curT = (i / 300) * (2 * W.T);
          const sx = xStart + (curT / (2 * W.T)) * axisW;
          const sy = oy - W.qVal(curT);
          if (i === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
        }
        c.stroke();

        window.auditTag(c,null);
        // 红色电流曲线 i(t) = I0 * sin(omega0 * t)，对应 dq/dt = -i
        window.auditTag(c,'lc.i_curve',{model:'lc_i_curve',origin:[xStart,oy],x_scale:axisW/(2*W.T)});
        c.strokeStyle = W.PAL.red;
        c.lineWidth = 3.5;
        c.setLineDash([8, 4]);
        c.beginPath();
        for (let i = 0; i <= 300; i++) {
          const curT = (i / 300) * (2 * W.T);
          const sx = xStart + (curT / (2 * W.T)) * axisW;
          const sy = oy - W.iVal(curT);
          if (i === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
        }
        c.stroke();
        c.setLineDash([]);

        window.auditTag(c,null);
        // 当前演化时间指示光标
        const curScrX = xStart + (simT / (2 * W.T)) * axisW;
        c.strokeStyle = W.PAL.yellow;
        c.lineWidth = 2;
        c.setLineDash([2, 3]);
        c.beginPath();
        c.moveTo(curScrX, oy - 140);
        c.lineTo(curScrX, oy + 140);
        c.stroke();
        c.setLineDash([]);

        // 当前点采样核，状态记录来自实际采样点的绘制值。
        const drawnQ=W.qVal(simT),drawnI=W.iVal(simT);
        window.auditPhysics('lc_state',{sim_t:simT,q_px:drawnQ,i_px:drawnI,q_scale:W.CHARGE_AMPLITUDE/W.Q0,i_scale:W.CURRENT_AMPLITUDE/(W.Q0*W.OMEGA0)});
        window.auditTag(c,'lc.q_dot',{model:'lc_q_dot',origin:[xStart,oy],x_scale:axisW/(2*W.T),sim_t:simT});
        DG.neuron(c, curScrX, oy - drawnQ, 6, 1.0, { fill: W.PAL.blue, stroke: '#FFFFFF', lw: 1.5 });
        window.auditTag(c,'lc.i_dot',{model:'lc_i_dot',origin:[xStart,oy],x_scale:axisW/(2*W.T),sim_t:simT});
        DG.neuron(c, curScrX, oy - drawnI, 6, 1.0, { fill: W.PAL.red, stroke: '#FFFFFF', lw: 1.5 });

        window.auditTag(c,null);
        // 图例 (右上角)
        c.font = '600 20px "PuHui-Medium", sans-serif';
        c.fillStyle = W.PAL.blue;
        c.textAlign = 'left';
        c.fillText('— 电荷 q(t) = Q₀ cos(ω₀t)', ox + 220, oy - 190);
        c.fillStyle = W.PAL.red;
        c.fillText('- - 电流 i(t) = I₀ sin(ω₀t)  (相位滞后 90°)', ox + 220, oy - 155);

        c.restore();
      });

      // 3. 动态能量互补条 (随 simT 连续演化)
      W.drawEnergyGauges(c, 260, 715, 1400, 52, simT);

      // 4. 屏幕固定 UI 层：能量守恒定理
      c.save();
      c.font = `600 24px "PuHui-Medium", sans-serif`;
      c.fillStyle = W.PAL.green;
      c.textAlign = 'left';
      c.fillText('全时段电磁能量严格守恒定律：', 100, 160);

      L.typesetMath(c, [
        { s: 'E', it: true, sub: 'total', col: W.PAL.green },
        { s: '=', gap: 10 },
        { s: 'E', it: true, sub: 'e', col: W.PAL.blue },
        { s: '(', gap: 2 },
        { s: 't', it: true, gap: 2 },
        { s: ')', gap: 6 },
        { s: '+', gap: 8 },
        { s: 'E', it: true, sub: 'm', col: W.PAL.red },
        { s: '(', gap: 2 },
        { s: 't', it: true, gap: 2 },
        { s: ')', gap: 10 },
        { s: '=', gap: 10 },
        { s: '1/2', gap: 6 },
        { s: 'q', it: true, sup: '2', col: W.PAL.blue, gap: 2 },
        { s: '/', gap: 2 },
        { s: 'C', it: true, gap: 8 },
        { s: '+', gap: 8 },
        { s: '1/2', gap: 6 },
        { s: 'L', it: true, gap: 2 },
        { s: 'i', it: true, sup: '2', col: W.PAL.red, gap: 10 },
        { s: '≡', col: W.PAL.green, gap: 10 },
        { s: 'E', it: true, sub: '0', col: W.PAL.green, gap: 8 },
        { s: '(恒定守恒)' }
      ], 100, 225, 38, { align: 'left', col: W.PAL.white });
      c.restore();

      // 顶栏与底栏
      W.drawHeader(c, '镜头 4/5 · 总电磁能守恒', 'LC 振荡电路中的能量交换与电磁振荡机制');
      W.drawBottomCard(
        c,
        '电荷 q(t) 与电流 i(t) 呈现完美的 90° (π/2) 正交相位差，构筑了持续自洽的电磁谐振',
        '全时段内电场储能与磁场储能完全局域互换，系统总电磁能量 E_total 严格守恒恒等于 100%'
      );
    }
  };
})();

// =========================================================================
// lc_common.js: LC 振荡电路物理动画共用底层引擎
// 严格对齐 physics_config.json 中的单一真实来源 (SSOT)
// =========================================================================
(() => {
  const { clamp, lerp } = U;
  const C = DG.MANIM;
  const L = window.LAYOUT;

  // 1. 物理参数单一真实来源 (与 physics_config.json 严格一致)
  const L_VAL = window.PHYSICS_CONFIG.parameters.inductance_L_h;                      // 电感 L = 1.0 H
  const C_VAL = window.PHYSICS_CONFIG.parameters.capacitance_C_f;                      // 电容 C = 1.0 F
  const Q0 = window.PHYSICS_CONFIG.parameters.initial_charge_Q0_c;                         // 初始电荷 Q0 = 1.0 C
  const CHARGE_AMPLITUDE = window.PHYSICS_CONFIG.parameters.charge_amplitude_px;           // 初始电荷峰值振幅 (像素)
  const CURRENT_AMPLITUDE = window.PHYSICS_CONFIG.parameters.current_amplitude_px;          // 初始电流峰值振幅 (像素)
  const I0 = 120;                         // 兼容别名
  const OMEGA0 = 1/Math.sqrt(L_VAL*C_VAL);                     // 固有角频率 omega0 = 1/sqrt(LC) = 1.0 rad/s
  const T = 2*Math.PI/OMEGA0;                  // 振荡周期 T = 2*pi s (~6.2831853 s)
  const E0_VAL = Q0*Q0/(2*C_VAL);                     // 真实物理能量 E0 = Q0^2 / (2C) = 0.5 J

  // 坐标系基准
  const X0 = 960;
  const Y0 = 550;

  // 2. 状态方程 (电流参考方向为顺时针流向电感，dq/dt = -i(t))
  // 电荷量 q(t) = CHARGE_AMPLITUDE * cos(omega0 * t)
  const qVal = t => CHARGE_AMPLITUDE * Math.cos(OMEGA0 * t);
  // 电流 i(t) = -dq/dt = CURRENT_AMPLITUDE * omega0 * sin(omega0 * t)
  const iVal = t => CURRENT_AMPLITUDE * Math.sin(OMEGA0 * t);
  // 电场储能比例 Ee = cos^2(omega0 * t)
  const eeRatio = t => Math.pow(Math.cos(OMEGA0 * t), 2);
  // 磁场储能比例 Em = sin^2(omega0 * t)
  const emRatio = t => Math.pow(Math.sin(OMEGA0 * t), 2);

  // 3. 配色方案
  const PAL = {
    bg: '#0F141D',
    cardBg: 'rgba(23, 31, 45, 0.90)',
    cardBorder: 'rgba(255, 255, 255, 0.18)',
    blue: '#58C4DD',        // 电荷 / 电场能 Ee
    red: '#FC6255',         // 电流 / 磁场能 Em
    green: '#2ED573',       // 总能量 / 闭合回路
    yellow: '#FFFF00',      // 关键极值 / 采样指示
    orange: '#FF9F43',      // 板书手绘 / 重点公式
    white: '#FFFFFF',
    greyA: '#DDDDDD',
    greyB: '#BBBBBB',
    greyC: '#888888',
    greyD: '#444444',
    wire: '#718096'
  };

  // 4. 绘制 LC 闭合回路电路示意图
  function drawCircuitDiagram(ctx, cx, cy, w, h, t, opt = {}) {
    ctx.save();
    const halfW = w / 2;
    const halfH = h / 2;
    const xLeft = cx - halfW;
    const xRight = cx + halfW;
    const yTop = cy - halfH;
    const yBottom = cy + halfH;

    const q = qVal(t);
    const i = iVal(t);
    if(window.auditPhysics) window.auditPhysics('lc_state', {sim_t:t,q_px:q,i_px:i,q_scale:CHARGE_AMPLITUDE/Q0,i_scale:CURRENT_AMPLITUDE/(Q0*OMEGA0)});
    const qNorm = q / CHARGE_AMPLITUDE;   // [-1, 1]
    const iNorm = i / CURRENT_AMPLITUDE;   // [-1, 1]

    // (1) 导线回路底线
    ctx.strokeStyle = PAL.wire;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 顶线（电容上极板至电感上端）
    ctx.beginPath();
    ctx.moveTo(xLeft, yTop + 35);
    ctx.lineTo(xLeft, yTop);
    ctx.lineTo(xRight, yTop);
    ctx.lineTo(xRight, cy - 60);
    ctx.stroke();

    // 底线（电容下极板至电感下端）
    ctx.beginPath();
    ctx.moveTo(xLeft, yBottom - 35);
    ctx.lineTo(xLeft, yBottom);
    ctx.lineTo(xRight, yBottom);
    ctx.lineTo(xRight, cy + 60);
    ctx.stroke();

    // (2) 左侧电容器 (Capacitor C)
    const capY1 = cy - 20;
    const capY2 = cy + 20;
    const capWidth = 100;

    // 连接线到极板
    ctx.beginPath();
    ctx.moveTo(xLeft, yTop);
    ctx.lineTo(xLeft, capY1);
    ctx.moveTo(xLeft, capY2);
    ctx.lineTo(xLeft, yBottom);
    ctx.stroke();

    // 上极板
    ctx.strokeStyle = PAL.blue;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(xLeft - capWidth / 2, capY1);
    ctx.lineTo(xLeft + capWidth / 2, capY1);
    ctx.stroke();

    // 下极板
    ctx.strokeStyle = PAL.blue;
    ctx.beginPath();
    ctx.moveTo(xLeft - capWidth / 2, capY2);
    ctx.lineTo(xLeft + capWidth / 2, capY2);
    ctx.stroke();

    // 极板电荷符号 (+ / -)
    ctx.font = 'bold 20px "CMU-rm", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (Math.abs(qNorm) > 0.05) {
      const topSign = qNorm > 0 ? '+' : '−';
      const botSign = qNorm > 0 ? '−' : '+';
      ctx.fillStyle = PAL.yellow;
      for (let k = -2; k <= 2; k++) {
        ctx.fillText(topSign, xLeft + k * 18, capY1 - 16);
        ctx.fillText(botSign, xLeft + k * 18, capY2 + 16);
      }
    }

    // 极板间电场线 (Electric Field E)
    if (Math.abs(qNorm) > 0.08) {
      ctx.save();
      ctx.strokeStyle = 'rgba(88, 196, 221, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([3, 3]);
      const dirE = qNorm > 0 ? 1 : -1;
      for (let k = -2; k <= 2; k++) {
        const lx = xLeft + k * 18;
        ctx.beginPath();
        ctx.moveTo(lx, capY1 + 4);
        ctx.lineTo(lx, capY2 - 4);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 电容器标签
    ctx.font = '600 22px "PuHui-Medium", sans-serif';
    ctx.fillStyle = PAL.blue;
    ctx.textAlign = 'right';
    ctx.fillText('电容器 C', xLeft - capWidth / 2 - 15, cy - 5);
    ctx.font = '18px "CMU-it", serif';
    ctx.fillStyle = PAL.greyB;
    ctx.fillText(`q(t) = ${(qNorm).toFixed(2)} Q₀`, xLeft - capWidth / 2 - 15, cy + 22);

    // (3) 右侧电感线圈 (Inductor L)
    const coilX = xRight;
    const coilYTop = cy - 60;
    const coilYBot = cy + 60;
    const numLoops = 4;
    const loopH = (coilYBot - coilYTop) / numLoops;

    ctx.save();
    ctx.strokeStyle = PAL.red;
    ctx.lineWidth = 5;
    for (let k = 0; k < numLoops; k++) {
      const ly = coilYTop + k * loopH;
      ctx.beginPath();
      ctx.arc(coilX, ly + loopH / 2, loopH / 2, -Math.PI / 2, Math.PI / 2, false);
      ctx.stroke();
    }
    ctx.restore();

    // 电感磁场线 (Magnetic Field B)
    if (Math.abs(iNorm) > 0.08) {
      ctx.save();
      ctx.strokeStyle = 'rgba(252, 98, 85, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.ellipse(coilX - 10, cy, 30 + r * 16, 75 + r * 12, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 电感器标签
    ctx.font = '600 22px "PuHui-Medium", sans-serif';
    ctx.fillStyle = PAL.red;
    ctx.textAlign = 'left';
    ctx.fillText('电感线圈 L', coilX + 35, cy - 5);
    ctx.font = '18px "CMU-it", serif';
    ctx.fillStyle = PAL.greyB;
    ctx.fillText(`i(t) = ${(iNorm).toFixed(2)} I₀`, coilX + 35, cy + 22);

    // (4) 闭合回路电流流动箭头 (世界锚定 + 零瞬移)
    if (Math.abs(iNorm) > 0.05) {
      const flowDir = iNorm > 0 ? 1 : -1; // 1: 顺时针, -1: 逆时针
      ctx.save();
      ctx.fillStyle = PAL.red;
      ctx.strokeStyle = PAL.red;
      ctx.lineWidth = 3;

      // 顶导线箭头 (世界固定 X 坐标)
      const arrowX = cx;
      const arrowY = yTop;
      const aDir = flowDir; // 顺时针时顶线向右 (+x)
      ctx.beginPath();
      ctx.moveTo(arrowX - aDir * 18, arrowY);
      ctx.lineTo(arrowX + aDir * 18, arrowY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowX + aDir * 18, arrowY);
      ctx.lineTo(arrowX + aDir * 8, arrowY - 5);
      ctx.lineTo(arrowX + aDir * 8, arrowY + 5);
      ctx.closePath();
      ctx.fill();

      // 底导线箭头
      const bDir = -flowDir; // 顺时针时底线向左 (-x)
      ctx.beginPath();
      ctx.moveTo(arrowX - bDir * 18, yBottom);
      ctx.lineTo(arrowX + bDir * 18, yBottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowX + bDir * 18, yBottom);
      ctx.lineTo(arrowX + bDir * 8, yBottom - 5);
      ctx.lineTo(arrowX + bDir * 8, yBottom + 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 遥测上报
      if (window.recordTelemetryFrame && window.__telemetry && window.__telemetry.currentFrame) {
        window.__telemetry.currentFrame.physics_state = {
          topic: 'lc_circuit',
          t: t,
          q: q,
          i: i,
          Ee: eeRatio(t) * E0_VAL,
          Em: emRatio(t) * E0_VAL,
          Etot: E0_VAL,
          L: L_VAL,
          C: C_VAL,
          omega0: OMEGA0
        };
        window.__telemetry.currentFrame.tracked_objects.push({
          id: 'wire_top_arrow',
          type: 'current_arrow',
          t: t,
          screen_x: cx,
          screen_y: yTop,
          world_x: cx,
          world_y: yTop,
          vx: 0,
          vy: 0,
          flow_dir: flowDir
        });
      }
    }

    ctx.restore();
  }

  // 5. 动态能量状态条 (电场储能 Ee + 磁场储能 Em 实时互补至 100%)
  function drawEnergyGauges(ctx, x, y, w, h, t) {
    ctx.save();
    const ee = eeRatio(t);
    const em = emRatio(t);
    const total = ee + em; // 严格恒等于 1.0

    // 背景底框
    ctx.fillStyle = 'rgba(16, 22, 34, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    // 标题
    ctx.font = '600 20px "PuHui-Medium", sans-serif';
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'left';
    ctx.fillText('实时电磁能量互换：', x + 20, y + 28);

    const barX = x + 220;
    const barY = y + 14;
    const barW = w - 440;
    const barH = 20;

    // 底槽
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    // 蓝色电场能量 Ee
    const eeW = Math.round(barW * ee);
    if (eeW > 2) {
      ctx.fillStyle = PAL.blue;
      ctx.beginPath();
      window.auditTag(ctx,'lc.energy.e',{model:'lc_gauge_e',sim_t:t,origin:[barX,barY],total_width:barW});
      ctx.roundRect(barX, barY, eeW, barH, [4, 0, 0, 4]);
      ctx.fill();
    }

    // 红色磁场能量 Em
    const emW = barW - eeW;
    if (emW > 2) {
      ctx.fillStyle = PAL.red;
      ctx.beginPath();
      window.auditTag(ctx,'lc.energy.m',{model:'lc_gauge_m',sim_t:t,origin:[barX+eeW,barY],total_width:barW});
      ctx.roundRect(barX + eeW, barY, emW, barH, [0, 4, 4, 0]);
      ctx.fill();
    }

    window.auditTag(ctx,null);
    if(window.auditPhysics) window.auditPhysics('lc_gauge', {sim_t:t,ee_width:eeW,em_width:emW,total_width:barW});
    // 数值指示
    ctx.font = '600 17px "CMU-rm", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = PAL.blue;
    ctx.fillText(`Ee: ${(ee * 100).toFixed(0)}%`, barX + barW + 20, y + 28);

    ctx.fillStyle = PAL.red;
    ctx.fillText(`Em: ${(em * 100).toFixed(0)}%`, barX + barW + 110, y + 28);

    ctx.restore();
  }

  // 6. 顶栏与底栏
  function drawHeader(ctx, badge, titleText) {
    ctx.save();
    ctx.font = `600 24px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
    ctx.fillStyle = PAL.greyB;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(badge, 1840, 72);

    ctx.font = `700 40px "PuHui-Bold", "NotoSansSC-700", sans-serif`;
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(titleText, 80, 75);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.moveTo(80, 102);
    ctx.lineTo(1840, 102);
    ctx.stroke();
    ctx.restore();
  }

  function drawBottomCard(ctx, note, sub = '') {
    ctx.save();
    const boxX = 200, boxY = 815, boxW = 1520, boxH = 92;
    ctx.fillStyle = PAL.cardBg;
    ctx.strokeStyle = PAL.cardBorder;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = `600 24px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(note, 960, boxY + 34);

    if (sub) {
      ctx.font = `18px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
      ctx.fillStyle = PAL.greyA;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sub, 960, boxY + 68);
    }
    ctx.restore();
  }

  window.LC = {
    L_VAL, C_VAL, Q0, I0, T, OMEGA0, E0_VAL, X0, Y0, PAL, CHARGE_AMPLITUDE, CURRENT_AMPLITUDE,
    qVal, iVal, eeRatio, emRatio,
    drawCircuitDiagram, drawEnergyGauges, drawHeader, drawBottomCard
  };
})();

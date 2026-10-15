// =========================================================================
// conv_common.js: 连续时间卷积教学动画共用底层引擎
// 严格对齐 physics_config.json 中的单一真实来源 (SSOT)
// =========================================================================
(() => {
  const { clamp, lerp } = U;
  const C = DG.MANIM;
  const L = window.LAYOUT;

  // 1. 卷积参数单一真实来源 (与 physics_config.json 严格一致)
  const PULSE_WIDTH_PX = window.PHYSICS_CONFIG.parameters.pulse_width_px;             // 脉冲宽度 200px
  const PULSE_HEIGHT_PX = window.PHYSICS_CONFIG.parameters.pulse_height_px;            // 脉冲高度 120px
  const PULSE_W = PULSE_WIDTH_PX;         // 兼容别名
  const PULSE_H = PULSE_HEIGHT_PX;        // 兼容别名
  const SLIDE_SPEED_PX_S = window.PHYSICS_CONFIG.parameters.slide_speed_px_s;           // 滑动速度 100px/s
  const AREA_F = 1.0;                     // 归一化面积 1.0
  const AREA_G = 1.0;                     // 归一化面积 1.0
  const X0 = 960;                         // 屏幕对称中心
  const Y_TAU = 410;                      // 哑变量 tau 轴基准线 (上屏)
  const Y_OUT = 670;                      // 卷积输出 y(t) 轴基准线 (下屏)

  // 2. 信号定义
  // 固定门信号 f(tau): 位于 tau \in [-100, 100]
  const fVal = tau => (tau >= -100 && tau <= 100) ? PULSE_H : 0;

  // 原始信号 g(tau): 位于 tau \in [0, 200]
  const gVal = tau => (tau >= 0 && tau <= 200) ? PULSE_H : 0;

  // 翻转信号 g(-tau): 位于 tau \in [-200, 0]
  const gFlipVal = tau => (tau >= -200 && tau <= 0) ? PULSE_H : 0;

  // 平移滑动信号 g(t - tau): 位于 tau \in [t - 200, t]
  const gShiftVal = (tau, t) => {
    const tauRel = t - tau;
    return (tauRel >= 0 && tauRel <= 200) ? PULSE_H : 0;
  };

  // 重叠乘积 w(tau, t) = f(tau) * g(t - tau)
  const overlapWidth = t => {
    const left = Math.max(-100, t - 200);
    const right = Math.min(100, t);
    return Math.max(0, right - left);
  };

  // 真实卷积积分输出 y(t) = \int f(tau) g(t - tau) dtau
  // 归一化高度: 最大重叠 200px 时输出高度为 PULSE_H
  const convOutVal = t => {
    const ow = overlapWidth(t);
    return (ow / PULSE_W) * PULSE_H;
  };

  // 3. 配色方案
  const PAL = {
    bg: '#0F141D',
    cardBg: 'rgba(23, 31, 45, 0.90)',
    cardBorder: 'rgba(255, 255, 255, 0.18)',
    blue: '#58C4DD',        // 固定信号 f(tau)
    red: '#FC6255',         // 翻转平移信号 g(t - tau)
    green: '#2ED573',       // 卷积结果 y(t)
    yellow: '#FFFF00',      // 重叠相乘积分区域
    orange: '#FF9F43',      // 核心公式与手绘高亮
    white: '#FFFFFF',
    greyA: '#DDDDDD',
    greyB: '#BBBBBB',
    greyC: '#888888',
    greyD: '#444444',
    axis: '#777777',
    grid: 'rgba(255, 255, 255, 0.08)'
  };

  // 4. 绘制 tau 坐标轴与信号波形
  function drawTauSystem(ctx, t, opt = {}) {
    ctx.save();
    const axisW = 1200;
    const xStart = X0 - axisW / 2;
    const xEnd = X0 + axisW / 2;

    // (1) tau 轴
    ctx.strokeStyle = PAL.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xStart - 20, Y_TAU);
    ctx.lineTo(xEnd + 25, Y_TAU);
    ctx.stroke();

    // 箭头
    ctx.fillStyle = PAL.axis;
    ctx.beginPath();
    ctx.moveTo(xEnd + 35, Y_TAU);
    ctx.lineTo(xEnd + 18, Y_TAU - 6);
    ctx.lineTo(xEnd + 18, Y_TAU + 6);
    ctx.closePath();
    ctx.fill();

    // tau 轴标签
    ctx.font = 'italic 22px "CMU-it", serif';
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('τ (哑变量)', xEnd + 42, Y_TAU);

    // 刻度线 (-300, -200, -100, 0, 100, 200, 300)
    const ticks = [-300, -200, -100, 0, 100, 200, 300];
    ticks.forEach(tk => {
      const sx = X0 + tk * 1.5;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = PAL.greyC;
      ctx.beginPath();
      ctx.moveTo(sx, Y_TAU - 5);
      ctx.lineTo(sx, Y_TAU + 5);
      ctx.stroke();

      ctx.font = '17px "CMU-rm", sans-serif';
      ctx.fillStyle = PAL.greyB;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(String(tk), sx, Y_TAU + 10);
    });

    // (2) 固定信号 f(tau): 蓝色方波 [-100, 100]
    if (opt.showF !== false) {
      const fLeft = X0 - 100 * 1.5;
      const fRight = X0 + 100 * 1.5;
      const fTop = Y_TAU - PULSE_H;

      if(window.auditPhysics) window.auditPhysics('conv_f', {left:(fLeft-X0)/1.5,right:(fRight-X0)/1.5,height:Y_TAU-fTop});
      // 面积阴影
      ctx.fillStyle = 'rgba(88, 196, 221, 0.20)';
      ctx.fillRect(fLeft, fTop, fRight - fLeft, PULSE_H);

      window.auditTag(ctx,'conv.f',{model:'conv_f',origin:[X0,Y_TAU]});
      // 描边
      ctx.strokeStyle = PAL.blue;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(xStart, Y_TAU);
      ctx.lineTo(fLeft, Y_TAU);
      ctx.lineTo(fLeft, fTop);
      ctx.lineTo(fRight, fTop);
      ctx.lineTo(fRight, Y_TAU);
      ctx.lineTo(xEnd, Y_TAU);
      ctx.stroke();

      window.auditTag(ctx,null);
      // 标签
      ctx.font = '600 20px "PuHui-Medium", sans-serif';
      ctx.fillStyle = PAL.blue;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('固定信号 f(τ)', X0, fTop - 5);
    }

    // (3) 平移滑动信号 g(t - tau): 红色方波 [t - 200, t]
    if (opt.showGShift !== false) {
      const gLeft = X0 + (t - 200) * 1.5;
      const gRight = X0 + t * 1.5;
      const gTop = Y_TAU - PULSE_H;

      // 面积阴影
      ctx.fillStyle = 'rgba(252, 98, 85, 0.20)';
      ctx.fillRect(gLeft, gTop, gRight - gLeft, PULSE_H);

      if(window.auditPhysics) window.auditPhysics('conv_shift', {sim_t:t,left:(gLeft-X0)/1.5,right:(gRight-X0)/1.5,height:Y_TAU-gTop});
      window.auditTag(ctx,'conv.g',{model:'conv_g',origin:[X0,Y_TAU],sim_t:t});
      // 虚线描边
      ctx.strokeStyle = PAL.red;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(gLeft, Y_TAU);
      ctx.lineTo(gLeft, gTop);
      ctx.lineTo(gRight, gTop);
      ctx.lineTo(gRight, Y_TAU);
      ctx.stroke();
      ctx.setLineDash([]);

      window.auditTag(ctx,null);
      // 标签与滑动箭头
      ctx.font = '600 20px "PuHui-Medium", sans-serif';
      ctx.fillStyle = PAL.red;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`滑动信号 g(t − τ) [t = ${t.toFixed(0)}]`, (gLeft + gRight) / 2, gTop - 35);

      // 注册动态遥测数据
      if (window.recordTelemetryFrame && window.__telemetry && window.__telemetry.currentFrame) {
        window.__telemetry.currentFrame.physics_state = {
          sliding_t: t,
          overlap_width: overlapWidth(t),
          conv_output: convOutVal(t)
        };
        window.__telemetry.currentFrame.tracked_objects.push({
          id: 'sliding_window_g',
          world_x: (gLeft + gRight) / 2,
          world_y: gTop,
          screen_x: (gLeft + gRight) / 2,
          screen_y: gTop,
          vx: 100,
          vy: 0,
          physics_params: { pulse_width: PULSE_WIDTH_PX, speed: SLIDE_SPEED_PX_S }
        });
      }

      // (4) 重叠相乘区域 (高亮黄色条纹阴影)
      const ow = overlapWidth(t);
      if (ow > 2) {
        const oLeft = X0 + Math.max(-100, t - 200) * 1.5;
        const oRight = X0 + Math.min(100, t) * 1.5;
        const oW = oRight - oLeft;

        ctx.fillStyle = 'rgba(255, 255, 0, 0.38)';
        ctx.fillRect(oLeft, gTop, oW, PULSE_H);

        ctx.strokeStyle = PAL.yellow;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(oLeft, gTop, oW, PULSE_H);

        ctx.font = 'bold 16px "PuHui-Bold", sans-serif';
        ctx.fillStyle = PAL.yellow;
        ctx.textAlign = 'center';
        ctx.fillText(`重叠积: ${(ow / PULSE_W * 100).toFixed(0)}%`, (oLeft + oRight) / 2, gTop + PULSE_H / 2);
      }
    }

    ctx.restore();
  }

  // 5. 绘制卷积输出 y(t) 时间轴与实时积分结果
  function drawOutputSystem(ctx, currentT, opt = {}) {
    ctx.save();
    const axisW = 1200;
    const xStart = X0 - axisW / 2;
    const xEnd = X0 + axisW / 2;

    // t 轴
    ctx.strokeStyle = PAL.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xStart - 20, Y_OUT);
    ctx.lineTo(xEnd + 25, Y_OUT);
    ctx.stroke();

    // 箭头
    ctx.fillStyle = PAL.axis;
    ctx.beginPath();
    ctx.moveTo(xEnd + 35, Y_OUT);
    ctx.lineTo(xEnd + 18, Y_OUT - 6);
    ctx.lineTo(xEnd + 18, Y_OUT + 6);
    ctx.closePath();
    ctx.fill();

    window.auditTag(ctx,null);
      // 标签
    ctx.font = 'italic 22px "CMU-it", serif';
    ctx.fillStyle = PAL.green;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('t (输出时间)', xEnd + 42, Y_OUT);

    // 刻度线
    const ticks = [-300, -200, -100, 0, 100, 200, 300];
    ticks.forEach(tk => {
      const sx = X0 + tk * 1.5;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = PAL.greyC;
      ctx.beginPath();
      ctx.moveTo(sx, Y_OUT - 5);
      ctx.lineTo(sx, Y_OUT + 5);
      ctx.stroke();

      ctx.font = '17px "CMU-rm", sans-serif';
      ctx.fillStyle = PAL.greyB;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(String(tk), sx, Y_OUT + 10);
    });

    window.auditTag(ctx,'conv.curve',{model:'conv_curve',origin:[X0,Y_OUT]});
    // 绘制已累积的卷积输出波形 (三角形卷积响应)
    ctx.strokeStyle = PAL.green;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(xStart, Y_OUT);

    for (let simT = -300; simT <= currentT; simT += 2) {
      const sx = X0 + simT * 1.5;
      const sy = Y_OUT - convOutVal(simT);
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    window.auditTag(ctx,null);
    // 绿色面积填充
    ctx.fillStyle = 'rgba(46, 213, 115, 0.22)';
    ctx.beginPath();
    ctx.moveTo(xStart, Y_OUT);
    for (let simT = -300; simT <= currentT; simT += 2) {
      const sx = X0 + simT * 1.5;
      const sy = Y_OUT - convOutVal(simT);
      ctx.lineTo(sx, sy);
    }
    const curX = X0 + currentT * 1.5;
    ctx.lineTo(curX, Y_OUT);
    ctx.closePath();
    ctx.fill();

    // 当前时间采样核
    const curY = Y_OUT - convOutVal(currentT);
    if(window.auditPhysics) window.auditPhysics('conv_output', {sim_t:currentT,value_px:Y_OUT-curY,x_px:curX,baseline:Y_OUT});
    window.auditTag(ctx,'conv.dot',{model:'conv_dot',origin:[X0,Y_OUT],sim_t:currentT});
    DG.neuron(ctx, curX, curY, 7, 1.0, { fill: PAL.green, stroke: '#FFFFFF', lw: 2 });

    window.auditTag(ctx,null);
    // 当前值引线
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(curX, Y_OUT);
    ctx.lineTo(curX, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 输出标签
    ctx.font = '600 20px "PuHui-Medium", sans-serif';
    ctx.fillStyle = PAL.green;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`卷积输出 y(t) = (f ∗ g)(t) = ${(convOutVal(currentT) / PULSE_H).toFixed(2)}`, curX + 15, curY - 20);

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

  window.CONV = {
    PULSE_W, PULSE_H, X0, Y_TAU, Y_OUT, PAL,
    fVal, gVal, gFlipVal, gShiftVal, overlapWidth, convOutVal,
    drawTauSystem, drawOutputSystem, drawHeader, drawBottomCard
  };
})();

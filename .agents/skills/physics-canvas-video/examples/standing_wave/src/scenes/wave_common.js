// 物理科普动画《两列相反方向的波如何产生驻波？——传输线电压驻波机制》
// 3Blue1Brown 几何与数学可视化共用底层 (Wave Common Engine v2)
(() => {
  const { clamp, lerp } = U;
  const C = DG.MANIM;
  const L = window.LAYOUT;

  // 1. 唯一物理参数来源 (与 physics_config.json 及 animation_spec.json 严格 100% 一致)
  const LAMBDA = window.PHYSICS_CONFIG.parameters.wavelength_lambda_px;                    // 空间波长 lambda = 500px (1080p 画面两波长占据 1000px)
  const A = window.PHYSICS_CONFIG.parameters.amplitude_A_px;                          // 单列行波电压振幅 A = 75px (驻波峰峰值 2A = 150px)
  const T = window.PHYSICS_CONFIG.parameters.period_T_s;                         // 时间周期 T = 2.0s (频率 f = 0.5Hz)
  const OMEGA = (2 * Math.PI) / T;       // 角频率 omega = pi rad/s (~3.141592653589793)
  const BETA = (2 * Math.PI) / LAMBDA;   // 空间传播常数/波数 beta = 2*pi / 500 rad/px (~0.012566370614359173)
  const V = OMEGA / BETA;                // 相位速度 v = 250 px/s (v = lambda / T)
  const GAMMA = window.PHYSICS_CONFIG.parameters.reflection_coefficient_gamma;                     // 开路终端电压反射系数 Gamma = +1

  // 坐标系屏幕原点 (x=0 终端边界置于右侧 X=1500, 电压基准零线 Y=550)
  const X0 = window.PHYSICS_CONFIG.coordinates.screen_origin_X0;
  const Y0 = window.PHYSICS_CONFIG.coordinates.screen_baseline_Y0;                        // 抬升至 550，确保驻波波谷 -2A (Y=700) 距离底部卡片 (Y=815) 保持 >110px 黄金避让区
  const X_MIN = -1050;                   // 传输线左界 x = -2.10 lambda
  const X_MAX = 35;                      // 终端右侧留白

  // 2. 传输线电压波动方程 (横轴为空间坐标 x，纵向为传输线各点瞬时电压 u(x,t) 标量分布，非机械介质横向位移)
  // 入射电压波 (向右传播): u_i = A cos(omega * t - beta * x)
  const ui = (x, t) => A * Math.cos(OMEGA * t - BETA * x);

  // 反射电压波 (向左传播): u_r = A cos(omega * t + beta * x)
  // 开路终端 (x=0) 处电压反射系数 Gamma = +1，同频同幅同相反射
  const ur = (x, t) => A * Math.cos(OMEGA * t + BETA * x);

  // 传输线合成驻波电压: u = u_i + u_r = 2A cos(beta * x) cos(omega * t)
  const uStand = (x, t) => 2 * A * Math.cos(BETA * x) * Math.cos(OMEGA * t);

  // 屏幕坐标映射
  const toScrX = x => X0 + x;
  const toScrY = uVal => Y0 - uVal;

  // 3. 配色体系 (3Blue1Brown 语义色彩绑定)
  const PAL = {
    bg: '#000000',
    blue: C.BLUE_C,       // #58C4DD (正向入射电压波)
    red: C.RED_C,         // #FC6255 (反向反射电压波)
    green: C.GREEN_C,     // #83C167 (合成驻波电压)
    yellow: C.YELLOW,     // #FFFF00 (电压波节/波腹/开路边界重点高亮)
    greyA: C.GREY_A,      // #DDDDDD
    greyB: C.GREY_B,      // #BBBBBB
    greyC: C.GREY_C,      // #888888
    greyD: C.GREY_D,      // #444444
    white: '#FFFFFF',
    axis: '#777777',
    grid: 'rgba(255, 255, 255, 0.07)'
  };

  // 4. 绘制网格与坐标系 (彻底消除底部遮挡，各标注保持严格间距)
  function drawCoordinateSystem(ctx, opt = {}) {
    ctx.save();
    const xLeft = toScrX(X_MIN) - 30;
    const xRight = toScrX(X_MAX) + 25;

    // 水平背景网格线 (u = -2A, -A, +A, +2A)
    ctx.lineWidth = 1;
    ctx.strokeStyle = PAL.grid;
    [-2 * A, -A, A, 2 * A].forEach(val => {
      const y = toScrY(val);
      ctx.beginPath();
      ctx.moveTo(xLeft, y);
      ctx.lineTo(xRight, y);
      ctx.stroke();
    });

    // 垂直背景网格虚线 (每隔 lambda/4)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.setLineDash([4, 6]);
    for (let i = 0; i <= 8; i++) {
      const gx = toScrX(-LAMBDA * (i * 0.25));
      ctx.beginPath();
      ctx.moveTo(gx, toScrY(-2 * A - 15));
      ctx.lineTo(gx, toScrY(2 * A + 15));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // x 轴主轴 (电压平衡零电位线 u=0)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = PAL.greyB;
    ctx.beginPath();
    ctx.moveTo(xLeft, Y0);
    ctx.lineTo(xRight + 20, Y0);
    ctx.stroke();

    // x 轴箭头 (空间位置 x)
    ctx.fillStyle = PAL.greyB;
    ctx.beginPath();
    ctx.moveTo(xRight + 30, Y0);
    ctx.lineTo(xRight + 12, Y0 - 6);
    ctx.lineTo(xRight + 12, Y0 + 6);
    ctx.closePath();
    ctx.fill();

    // 纵轴 u 轴 (瞬时电压 u(x,t))
    ctx.beginPath();
    ctx.moveTo(X0, toScrY(-2 * A - 25)); // 下界 Y=725，距离底部卡片 (Y=815) 保留充足间隔
    ctx.lineTo(X0, toScrY(2 * A + 42)); // 上界 Y=328
    ctx.stroke();

    // u 轴箭头
    ctx.beginPath();
    ctx.moveTo(X0, toScrY(2 * A + 52));
    ctx.lineTo(X0 - 6, toScrY(2 * A + 34));
    ctx.lineTo(X0 + 6, toScrY(2 * A + 34));
    ctx.closePath();
    ctx.fill();

    // 轴物理量符号标签：u(电压) 置于纵轴左侧，避免与右侧终端标牌冲突
    ctx.font = `24px "${DG.FONT.it}"`;
    ctx.fillStyle = PAL.greyA;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('x (位置)', xRight + 36, Y0);
    ctx.textAlign = 'right';
    ctx.fillText('u (电压)', X0 - 18, toScrY(2 * A + 42));

    // 刻度线与物理标记 (0, -lambda/4, -lambda/2, -3lambda/4, -lambda, -5lambda/4, -3lambda/2, -7lambda/4, -2lambda)
    const ticks = [
      { x: 0, label: '0' },
      { x: -LAMBDA * 0.25, label: '-λ/4' },
      { x: -LAMBDA * 0.5, label: '-λ/2' },
      { x: -LAMBDA * 0.75, label: '-3λ/4' },
      { x: -LAMBDA, label: '-λ' },
      { x: -LAMBDA * 1.25, label: '-5λ/4' },
      { x: -LAMBDA * 1.5, label: '-3λ/2' },
      { x: -LAMBDA * 1.75, label: '-7λ/4' },
      { x: -LAMBDA * 2, label: '-2λ' }
    ];

    ticks.forEach(tk => {
      const sx = toScrX(tk.x);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = PAL.greyC;
      ctx.beginPath();
      ctx.moveTo(sx, Y0 - 6);
      ctx.lineTo(sx, Y0 + 6);
      ctx.stroke();

      // 刻度文字带微暗底色防止与动态波形完全重合遮挡
      ctx.font = `19px "${DG.FONT.rm}"`;
      ctx.fillStyle = PAL.greyB;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(tk.label, sx, Y0 + 12);
    });

    // 终端开路边界线 (x=0)
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = PAL.yellow;
    ctx.beginPath();
    ctx.moveTo(X0, toScrY(-2 * A - 25));
    ctx.lineTo(X0, toScrY(2 * A + 25));
    ctx.stroke();
    ctx.restore();

    // 开路终端标牌：置于纵轴右侧 (X0 + 16)，与左侧 u(电压) 彻底水平分离，绝无重叠
    ctx.save();
    ctx.font = `600 19px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
    const termLabel = 'x = 0 开路终端 (ZL = ∞)';
    const tWidth = ctx.measureText(termLabel).width;
    const badgeX = Math.round(X0 + 16);
    const badgeY = Math.round(toScrY(2 * A + 42) - 17);
    const badgeW = Math.round(tWidth + 20);
    const badgeH = 32;
    ctx.fillStyle = 'rgba(25, 25, 10, 0.85)';
    ctx.strokeStyle = PAL.yellow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = PAL.yellow;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(termLabel, badgeX + 10, badgeY + 16);
    ctx.restore();

    // 振幅刻度 (+A, +2A, -A, -2A)
    ctx.font = `18px "${DG.FONT.rm}"`;
    ctx.fillStyle = PAL.greyC;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('+2A', X0 - 12, toScrY(2 * A));
    ctx.fillText('+A', X0 - 12, toScrY(A));
    ctx.fillText('-A', X0 - 12, toScrY(-A));
    ctx.fillText('-2A', X0 - 12, toScrY(-2 * A));

    ctx.restore();
  }

  // 5. 连续采样绘制波动曲线
  function drawWaveCurve(ctx, waveFn, t, col, lw = 4, dash = null, alpha = 1.0, xEnd = 0, fillStyle = null) {
    ctx.save();
    ctx.globalAlpha = alpha;

    const steps = 300;
    const xStart = X_MIN;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const x = xStart + (xEnd - xStart) * (i / steps);
      const yVal = waveFn(x, t);
      const sx = toScrX(x);
      const sy = toScrY(yVal);
      pts.push([sx, sy]);
    }

    // 面积阴影填充 (呈现空间电压场势能分布)
    if (fillStyle && pts.length > 0) {
      ctx.save();
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], Y0);
      for (let i = 0; i <= steps; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.lineTo(pts[steps][0], Y0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (window.auditPhysics && alpha > 0.05) window.auditPhysics('wave', {sim_t:t, color:col, wave_type:waveFn===ui?'incident':waveFn===ur?'reflected':waveFn===uStand?'standing':'envelope', points:pts.map(([x,y])=>[x-X0,Y0-y]), amplitude:A, alpha});
    const signal=waveFn===ui?'incident':waveFn===ur?'reflected':waveFn===uStand?'standing':waveFn.qaSignal;
    window.auditTag(ctx,'wave.'+signal,{model:'wave_'+signal,origin:[X0,Y0],sim_t:t,gain:waveFn.qaGain??1});
    // 曲线描边
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash); else ctx.setLineDash([]);

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
      else ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.stroke();
    window.auditTag(ctx,null);
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 6. 沿传输线离散空间电位采样指示点 (说明：此点为空间电位采样示数，非导线机械振动)
  function drawVoltageIndicators(ctx, waveFn, t, col = PAL.white, num = 17, xEnd = 0, alpha = 1.0) {
    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha || 1.0) * alpha;
    for (let i = 0; i <= num; i++) {
      const x = X_MIN + (xEnd - X_MIN) * (i / num);
      const yVal = waveFn(x, t);
      const sx = toScrX(x);
      const sy = toScrY(yVal);

      // 平衡基线垂直引导虚线
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, Y0);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.setLineDash([]);

      // 电位采样圆点指示
      ctx.fillStyle = col;
      ctx.beginPath();
      window.auditTag(ctx,'wave.'+(waveFn===ui?'incident':waveFn===ur?'reflected':waveFn===uStand?'standing':waveFn.qaSignal)+'.dot',{model:'wave_'+(waveFn===ui?'incident':waveFn===ur?'reflected':waveFn===uStand?'standing':waveFn.qaSignal)+'_dot',origin:[X0,Y0],sim_t:t,gain:waveFn.qaGain??1});
      ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      window.auditTag(ctx,null);
    }
    ctx.restore();
  }

  // 7. 行波传播方向指示 (v3 稳定物理锚点 + 连续相位行波光效，彻底杜绝 0.48s 瞬移跳变)
  function drawDirectionArrows(ctx, dir = 1, t = 0, col = PAL.blue, yOffset = 220, alpha = 1.0) {
    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha || 1.0) * alpha;

    // 空间均匀分布的稳定物理锚点坐标 (世界坐标系中固定，零跳变，零瞬移)
    const arrowXs = [-LAMBDA * 1.75, -LAMBDA * 1.25, -LAMBDA * 0.75, -LAMBDA * 0.25];
    const cy = Y0 - yOffset;
    const len = 46 * dir;

    arrowXs.forEach((ax, idx) => {
      const cx = toScrX(ax);
      if (cx < toScrX(X_MIN) + 30 || cx > X0 - 30) return;

      // 与实际行波相速度严格同步的连续行进相位调制 (波峰经过下方时箭头产生同步轻柔光晕)
      const wavePhase = OMEGA * t - dir * BETA * ax;
      const pulse = 0.72 + 0.28 * Math.cos(wavePhase);

      // 动态记录 QA 跟踪数据 (供动态 QA 进行逐帧世界坐标检验)
      if (window.recordTelemetryFrame && window.__telemetry && window.__telemetry.currentFrame) {
        window.__telemetry.currentFrame.tracked_objects.push({
          id: (dir > 0 ? 'arrow_incident_' : 'arrow_reflected_') + idx,
          type: 'direction_arrow',
          t: t,
          dir: dir,
          screen_x: cx,
          screen_y: cy,
          world_x: cx,
          world_y: cy,
          ax: ax,
          phase: wavePhase,
          pulse: pulse
        });
        window.__telemetry.currentFrame.physics_state = {
          topic: 'standing_wave',
          t: t,
          v: V,
          lambda: LAMBDA,
          A: A,
          T: T,
          omega: OMEGA,
          gamma: GAMMA
        };
      }
      if (window.__qa_record_tracking && Array.isArray(window.__qa_tracked_objects)) {
        window.__qa_tracked_objects.push({
          id: (dir > 0 ? 'arrow_incident_' : 'arrow_reflected_') + idx,
          type: 'direction_arrow',
          dir: dir,
          world_x: cx,
          world_y: cy,
          ax: ax,
          phase: wavePhase,
          pulse: pulse
        });
      }

      ctx.save();
      ctx.globalAlpha = ctx.globalAlpha * pulse;

      // 箭头主杆 (高对比外框与主体)
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(cx - len / 2, cy);
      ctx.lineTo(cx + len / 2, cy);
      ctx.stroke();

      // 箭头尖端
      ctx.beginPath();
      ctx.moveTo(cx + len / 2, cy);
      ctx.lineTo(cx + len / 2 - (dir * 13), cy - 6.5);
      ctx.lineTo(cx + len / 2 - (dir * 13), cy + 6.5);
      ctx.closePath();
      ctx.fill();

      // 箭头内部微光流动纹理 (沿传播方向连续无缝滚动，滚动周期与线形自吻合，零视觉跳变)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -dir * ((t * 70) % 12);
      ctx.beginPath();
      ctx.moveTo(cx - len / 2 + (dir * 4), cy);
      ctx.lineTo(cx + len / 2 - (dir * 12), cy);
      ctx.stroke();

      ctx.restore();
    });

    // 传播速度与物理说明 (统一字阶与规范，明确标注相速度大小与方向)
    ctx.font = `600 23px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = col;
    const textX = toScrX(-LAMBDA);
    const text = dir > 0
      ? '正向波传播方向：向右 (+x) · 相速度 v = +ω/β = +250 px/s'
      : '反射波传播方向：向左 (-x) · 相速度 v = -ω/β = -250 px/s';
    ctx.fillText(text, textX, cy - 24);

    ctx.restore();
  }

  // 8. 顶栏信息与角标 (严格对齐 HeaderZone)
  function drawHeader(ctx, badge, titleText, titleCol = PAL.white) {
    ctx.save();
    // 镜头角标 (右上角)
    ctx.font = `600 24px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
    ctx.fillStyle = PAL.greyB;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(badge, 1840, 72);

    // 主题标题 (左上角)
    ctx.font = `700 40px "PuHui-Bold", "NotoSansSC-700", sans-serif`;
    ctx.fillStyle = titleCol;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(titleText, 80, 75);

    // 分割线
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = PAL.greyD;
    ctx.beginPath();
    ctx.moveTo(80, 102);
    ctx.lineTo(1840, 102);
    ctx.stroke();
    ctx.restore();
  }

  // 9. 底部教学说明卡片 (位于 y: [815, 905]，严格避让字幕带 y > 920，且距离波形最低点保持充足空白)
  function drawBottomCard(ctx, note, sub = '') {
    ctx.save();
    ctx.fillStyle = 'rgba(16, 18, 24, 0.94)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;

    const boxX = 200, boxY = 815, boxW = 1520, boxH = 92;
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

  // 10. 供动态 QA 自动化测试获取物理追踪状态
  function getTrackedState(lt, shotId = 'shot1') {
    let t = lt;
    if (shotId === 'shot2') t += 6.0;
    else if (shotId === 'shot3') t += 12.0;
    else if (shotId === 'shot4') t += 18.0;

    const arrowXs = [-LAMBDA * 1.75, -LAMBDA * 1.25, -LAMBDA * 0.75, -LAMBDA * 0.25];
    const incidentArrows = arrowXs.map((ax, idx) => ({
      id: `arrow_incident_${idx}`,
      dir: 1,
      world_x: toScrX(ax),
      world_y: Y0 - 220,
      phase: OMEGA * t - BETA * ax,
      pulse: 0.72 + 0.28 * Math.cos(OMEGA * t - BETA * ax)
    }));
    const reflectedArrows = arrowXs.map((ax, idx) => ({
      id: `arrow_reflected_${idx}`,
      dir: -1,
      world_x: toScrX(ax),
      world_y: Y0 - 150,
      phase: OMEGA * t + BETA * ax,
      pulse: 0.72 + 0.28 * Math.cos(OMEGA * t + BETA * ax)
    }));

    // 追踪行波波峰世界坐标 (用于相速度验证)
    const incidentCrests = [];
    for (let k = -5; k <= 3; k++) {
      const xCrest = (V * t) + k * LAMBDA;
      if (xCrest >= X_MIN && xCrest <= 0) {
        incidentCrests.push({ k, x: xCrest, world_x: toScrX(xCrest), u: ui(xCrest, t) });
      }
    }

    const reflectedCrests = [];
    for (let k = -5; k <= 3; k++) {
      const xCrest = (-V * t) + k * LAMBDA;
      if (xCrest >= X_MIN && xCrest <= 0) {
        reflectedCrests.push({ k, x: xCrest, world_x: toScrX(xCrest), u: ur(xCrest, t) });
      }
    }

    return {
      t, lt, shotId,
      V, LAMBDA, T, OMEGA, BETA,
      incidentArrows, reflectedArrows,
      incidentCrests, reflectedCrests
    };
  }

  window.WAVE = {
    LAMBDA, A, T, OMEGA, BETA, V, GAMMA, X0, Y0, X_MIN, X_MAX,
    ui, ur, uStand, toScrX, toScrY, PAL,
    drawCoordinateSystem, drawWaveCurve,
    drawVoltageIndicators,
    drawWaveParticles: drawVoltageIndicators, // 兼容旧接口别名
    drawDirectionArrows,
    drawHeader, drawBottomCard,
    getTrackedState
  };
})();

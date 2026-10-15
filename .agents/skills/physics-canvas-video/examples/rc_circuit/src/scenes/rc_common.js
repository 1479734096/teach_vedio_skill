// =========================================================================
// rc_common.js: RC 电路充放电过程物理动画共用底层引擎
// 严格对齐 physics_config.json 中的单一真实来源 (SSOT)
// =========================================================================
(() => {
  const { clamp, lerp } = U;
  const C = DG.MANIM;
  const L = window.LAYOUT;

  // 1. 物理参数单一真实来源 (与 physics_config.json 严格一致)
  const RESISTANCE_R_OHM = window.PHYSICS_CONFIG.parameters.resistance_R_ohm;        // 电阻阻值 R = 1000 Ohm (1 kOhm)
  const CAPACITANCE_C_F = window.PHYSICS_CONFIG.parameters.capacitance_C_f;          // 电容容量 C = 0.001 F (1000 uF)
  const VOLTAGE_V0_V = window.PHYSICS_CONFIG.parameters.voltage_V0_v;              // 电源电压 V0 = 10.0 V
  const INITIAL_CURRENT_I0_A = VOLTAGE_V0_V/RESISTANCE_R_OHM;      // 初始充电电流 I0 = V0 / R = 10 mA
  const TIME_CONSTANT_TAU_S = RESISTANCE_R_OHM*CAPACITANCE_C_F;        // 时间常数 tau = R * C = 1.0 s
  const TOTAL_SOURCE_ENERGY_J = 0.1;      // 电源总输出能量 E_source = C * V0^2 = 0.10 J
  const CAPACITOR_ENERGY_J = 0.05;        // 电容储能 E_C = 0.5 * C * V0^2 = 0.05 J (50%)
  const RESISTOR_HEAT_ENERGY_J = 0.05;    // 电阻焦耳热 E_R = 0.05 J (50%)
  const VOLTAGE_AMPLITUDE_PX = 140;       // 电压波形显示峰值振幅 (px)
  const CURRENT_AMPLITUDE_PX = 120;       // 电流波形显示峰值振幅 (px)

  // 别名方便引用
  const R = RESISTANCE_R_OHM;
  const C_VAL = CAPACITANCE_C_F;
  const V0 = VOLTAGE_V0_V;
  const I0 = INITIAL_CURRENT_I0_A;
  const TAU = TIME_CONSTANT_TAU_S;

  // 屏幕坐标系基准
  const X0 = 960;
  const Y0 = 550;

  // 2. 状态方程与瞬时物理量计算
  // 充电过程 (t >= 0, 单位: 秒)
  const vCharge = t => t <= 0 ? 0 : V0 * (1 - Math.exp(-t / TAU));
  const iCharge = t => t < 0 ? 0 : I0 * Math.exp(-t / TAU);
  const vrCharge = t => V0 - vCharge(t);

  // 放电过程 (t >= 0, 初始充满 V0)
  const vDischarge = t => t <= 0 ? V0 : V0 * Math.exp(-t / TAU);
  const iDischarge = t => t < 0 ? 0 : -I0 * Math.exp(-t / TAU);

  // 3. 配色方案
  const PAL = {
    bg: '#0F141D',
    cardBg: 'rgba(23, 31, 45, 0.90)',
    cardBorder: 'rgba(255, 255, 255, 0.18)',
    blue: '#58C4DD',        // 电容电压 v_C / 电场储能
    red: '#FC6255',         // 回路电流 i(t) / 焦耳热消耗
    green: '#2ED573',       // 时间常数 tau / 稳态
    yellow: '#FFFF00',      // 采样光标 / 特征点 / 切线
    orange: '#FF9F43',      // 重点公式 / 批注
    white: '#FFFFFF',
    greyA: '#DDDDDD',
    greyB: '#BBBBBB',
    greyC: '#888888',
    greyD: '#444444',
    wire: '#718096',
    plate: '#E2E8F0'
  };

  // 4. 绘制 RC 回路示意图 (包含电源 V0、双掷开关 K、电阻 R、电容 C、电压表与载流子)
  function drawRCCircuit(ctx, cx, cy, w, h, t, opt = {}) {
    ctx.save();
    const halfW = w / 2;
    const halfH = h / 2;
    const xLeft = cx - halfW;
    const xRight = cx + halfW;
    const yTop = cy - halfH;
    const yBottom = cy + halfH;
    const swX = xLeft + 65, swY = yTop;
    const wireSegments = [];
    function drawWire(x1,y1,x2,y2) {
      window.auditTag(ctx,'rc.wire',{model:'rc_wire',origin:[x1,y1],wire_index:wireSegments.length});
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();window.auditTag(ctx,null);
      wireSegments.push([[x1,y1],[x2,y2]]);
    }

    const mode = opt.mode || 'charge'; // 'off' | 'charge' | 'discharge'
    const curSimT = opt.simT != null ? opt.simT : t;
    const vc = mode === 'charge' ? vCharge(curSimT) : (mode === 'discharge' ? vDischarge(curSimT) : 0);
    const curI = mode === 'charge' ? iCharge(curSimT) : (mode === 'discharge' ? iDischarge(curSimT) : 0);
    const iRatio = Math.abs(curI) / I0;

    // (1) 基础导线外框
    ctx.strokeStyle = PAL.wire;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 底部水平地线 (由左侧电源负极连接至右侧电容下端)
    drawWire(xLeft,yBottom,swX-25,yBottom);
    drawWire(swX-25,yBottom,xRight,yBottom);

    // 顶部导线 (中间串联电阻 R)
    const rLeft = cx - 90;
    const rRight = cx + 90;
    // 开关两触点之间保持断口，避免背景导线绕过刀闸。
    drawWire(xLeft,yTop,swX-25,swY);
    drawWire(swX+25,swY,rLeft,yTop);
    drawWire(swX-25,swY+22,swX-25,yBottom);

    ctx.beginPath();
    ctx.moveTo(rRight, yTop);
    ctx.lineTo(xRight, yTop);
    ctx.stroke();

    // 右侧垂直导线 (连接电容器)
    const capYMid = cy + 20;
    const capGap = 26;
    ctx.beginPath();
    ctx.moveTo(xRight, yTop);
    ctx.lineTo(xRight, capYMid - capGap / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xRight, capYMid + capGap / 2);
    ctx.lineTo(xRight, yBottom);
    ctx.stroke();

    // (2) 绘制直流电源 V0 (左侧垂直支路)
    const vYMid = cy;
    ctx.beginPath();
    ctx.moveTo(xLeft, yTop);
    ctx.lineTo(xLeft, vYMid - 35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xLeft, vYMid + 35);
    ctx.lineTo(xLeft, yBottom);
    ctx.stroke();

    // 电源长短极板
    ctx.lineWidth = 5;
    ctx.strokeStyle = PAL.white;
    // 正极 (长板)
    ctx.beginPath();
    ctx.moveTo(xLeft - 32, vYMid - 16);
    ctx.lineTo(xLeft + 32, vYMid - 16);
    ctx.stroke();

    // 负极 (短板、厚)
    ctx.lineWidth = 7;
    ctx.strokeStyle = PAL.greyB;
    ctx.beginPath();
    ctx.moveTo(xLeft - 18, vYMid + 16);
    ctx.lineTo(xLeft + 18, vYMid + 16);
    ctx.stroke();

    // 电源标号
    ctx.font = 'bold 22px "CMU-rm", sans-serif';
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('V₀ = 10 V', xLeft - 45, vYMid);

    // 正负极极性标注
    ctx.font = '18px "CMU-rm", sans-serif';
    ctx.fillStyle = PAL.red;
    ctx.fillText('+', xLeft - 36, vYMid - 28);
    ctx.fillStyle = PAL.blue;
    ctx.fillText('−', xLeft - 36, vYMid + 28);

    // (3) 绘制电阻器 R (顶端中间，IEC 精准矩形箱体 + 色环手绘质感)
    const rWidth = rRight - rLeft;
    const rHeight = 36;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
    ctx.strokeStyle = PAL.orange;
    ctx.lineWidth = 3;
    ctx.fillRect(rLeft, yTop - rHeight / 2, rWidth, rHeight);
    ctx.strokeRect(rLeft, yTop - rHeight / 2, rWidth, rHeight);

    // 内部三道色环装饰
    ctx.fillStyle = PAL.orange;
    ctx.fillRect(rLeft + 35, yTop - rHeight / 2 + 3, 10, rHeight - 6);
    ctx.fillRect(rLeft + 75, yTop - rHeight / 2 + 3, 10, rHeight - 6);
    ctx.fillRect(rLeft + 115, yTop - rHeight / 2 + 3, 10, rHeight - 6);

    // 电阻文字标签
    ctx.font = '600 22px "PuHui-Medium", sans-serif';
    ctx.fillStyle = PAL.orange;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('电阻 R = 1.0 kΩ', cx, yTop - rHeight / 2 - 8);

    // (4) 绘制电容器 C (右侧水平平行极板)
    const plateLen = 70;
    ctx.lineWidth = 6;
    ctx.strokeStyle = PAL.blue;
    ctx.lineCap = 'butt';

    // 上极板
    const p1Y = capYMid - capGap / 2;
    ctx.beginPath();
    ctx.moveTo(xRight - plateLen / 2, p1Y);
    ctx.lineTo(xRight + plateLen / 2, p1Y);
    ctx.stroke();

    // 下极板
    const p2Y = capYMid + capGap / 2;
    ctx.strokeStyle = PAL.blue;
    ctx.beginPath();
    ctx.moveTo(xRight - plateLen / 2, p2Y);
    ctx.lineTo(xRight + plateLen / 2, p2Y);
    ctx.stroke();

    // 极板电荷累积与电场线 (随 vc 动态呈现)
    const chargePct = Math.min(1.0, vc / V0);
    const chargeCount = Math.round(chargePct * 5);
    ctx.font = 'bold 15px "CMU-rm", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let k = 0; k < chargeCount; k++) {
      const qx = (xRight - plateLen / 2 + 6) + (k / 4) * (plateLen - 12);
      // 上极板正电荷
      ctx.fillStyle = PAL.red;
      ctx.fillText('+', qx, p1Y - 14);
      // 下极板负电荷
      ctx.fillStyle = PAL.blue;
      ctx.fillText('−', qx, p2Y + 14);

      // 板间电场箭头 (向下)
      if (k % 2 === 1) {
        ctx.strokeStyle = 'rgba(88, 196, 221, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(qx, p1Y + 3);
        ctx.lineTo(qx, p2Y - 3);
        ctx.stroke();
      }
    }

    // 电容标签与电压读数
    ctx.font = '600 22px "PuHui-Medium", sans-serif';
    ctx.fillStyle = PAL.blue;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('电容 C = 1000 μF', xRight + 45, capYMid - 16);
    ctx.font = 'bold 20px "CMU-rm", sans-serif';
    ctx.fillStyle = PAL.yellow;
    ctx.fillText(`v_C(t) = ${vc.toFixed(2)} V (${(chargePct * 100).toFixed(1)}%)`, xRight + 45, capYMid + 16);

    // (5) 绘制单刀双掷开关 K (Single-Pole Double-Throw Switch)
    // 开关端点与基础导线使用同一组坐标。

    // 触点 1 (充电接通): 连到电源 V0
    ctx.fillStyle = PAL.white;
    ctx.beginPath();
    ctx.arc(swX - 25, swY, 5, 0, Math.PI * 2);
    ctx.arc(swX + 25, swY, 5, 0, Math.PI * 2);
    ctx.fill();

    // 触点标号
    ctx.font = '16px "CMU-rm", sans-serif';
    ctx.fillStyle = PAL.greyB;
    ctx.fillText('1 (充)', swX - 25, swY - 15);
    ctx.fillText('2 (放)', swX - 25, swY + 35);

    // 触点 2 (放电接通): 连回地线
    ctx.beginPath();
    ctx.arc(swX - 25, swY + 22, 5, 0, Math.PI * 2);
    ctx.fill();

    // 刀闸动触点
    ctx.lineWidth = 4;
    ctx.strokeStyle = PAL.yellow;
    if (mode === 'charge') {
      drawWire(swX+25,swY,swX-25,swY);
    } else if (mode === 'discharge') {
      drawWire(swX+25,swY,swX-25,swY+22);
    } else {
      drawWire(swX+25,swY,swX-10,swY-24);
    }
    window.auditPhysics?.('rc_topology', {mode, segments:wireSegments, ports:{common:[swX+25,swY],source:[xLeft,yTop],return:[xLeft,yBottom]}});

    // (6) 动态载流子沿回路流动动画
    if (iRatio > 0.02) {
      const dir = mode === 'discharge' ? -1 : 1;
      const speed = iRatio * 220;
      const step = (t * speed) % 60;
      ctx.fillStyle = PAL.red;

      // 顶部导线流动电子
      for (let x = xLeft + 120; x <= xRight - 40; x += 60) {
        const curPx = dir === 1 ? x + step : x - step;
        if (curPx >= xLeft + 100 && curPx <= xRight - 20) {
          ctx.beginPath();
          ctx.arc(curPx, yTop, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 电流方向指示箭头
      ctx.save();
      const arrX = cx;
      const arrY = yTop + 36;
      ctx.fillStyle = PAL.red;
      ctx.strokeStyle = PAL.red;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (dir === 1) {
        ctx.moveTo(arrX - 25, arrY);
        ctx.lineTo(arrX + 25, arrY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arrX + 25, arrY);
        ctx.lineTo(arrX + 15, arrY - 5);
        ctx.lineTo(arrX + 15, arrY + 5);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.moveTo(arrX + 25, arrY);
        ctx.lineTo(arrX - 25, arrY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arrX - 25, arrY);
        ctx.lineTo(arrX - 15, arrY - 5);
        ctx.lineTo(arrX - 15, arrY + 5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.font = '600 18px "PuHui-Medium", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`回路电流 i(t) = ${(curI * 1000).toFixed(2)} mA`, arrX, arrY + 22);
      ctx.restore();
    }

    if(window.auditPhysics) window.auditPhysics('rc_state',{mode,sim_t:curSimT,vc,i:curI});
    // 动态遥测注册
    if (window.recordTelemetryFrame && window.__telemetry && window.__telemetry.currentFrame) {
      window.__telemetry.currentFrame.physics_state = {
        mode: mode,
        sim_t: curSimT,
        v_C: vc,
        i_A: curI,
        v_R: mode === 'discharge' ? -vc : V0 - vc,
        tau: TAU,
        vc_ratio: vc / V0
      };
      window.__telemetry.currentFrame.tracked_objects.push({
        id: 'circuit_switch_knife',
        world_x: swX,
        world_y: swY,
        screen_x: swX,
        screen_y: swY,
        vx: 0,
        vy: 0,
        physics_params: { R: R, C: C_VAL, V0: V0, tau: TAU }
      });
      window.__telemetry.currentFrame.tracked_objects.push({
        id: 'capacitor_probe',
        world_x: xRight,
        world_y: capYMid,
        screen_x: xRight,
        screen_y: capYMid,
        vx: 0,
        vy: 0,
        physics_params: { vc: vc, i: curI }
      });
    }

    ctx.restore();
  }

  // 5. 绘制充电与放电实时曲线坐标系 (双轴对比)
  function drawDualWaveforms(ctx, cx, cy, w, h, t, opt = {}) {
    ctx.save();
    const halfW = w / 2;
    const halfH = h / 2;
    const xStart = cx - halfW;
    const xEnd = cx + halfW;
    const yAxis = cy + halfH - 40;
    const yPeak = cy - halfH + 40;
    const axisH = yAxis - yPeak;

    const maxT = opt.maxT || 5.0; // 展示 [0, 5 tau]
    const curSimT = Math.min(maxT, Math.max(0, opt.simT != null ? opt.simT : t));

    // (1) 坐标轴
    ctx.strokeStyle = PAL.greyC;
    ctx.lineWidth = 2;
    // 水平时间 t 轴
    ctx.beginPath();
    ctx.moveTo(xStart - 10, yAxis);
    ctx.lineTo(xEnd + 25, yAxis);
    ctx.stroke();
    // 垂直电压 v 轴
    ctx.beginPath();
    ctx.moveTo(xStart, yAxis + 10);
    ctx.lineTo(xStart, yPeak - 25);
    ctx.stroke();

    // 轴箭头
    ctx.fillStyle = PAL.greyC;
    ctx.beginPath();
    ctx.moveTo(xEnd + 35, yAxis);
    ctx.lineTo(xEnd + 20, yAxis - 6);
    ctx.lineTo(xEnd + 20, yAxis + 6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(xStart, yPeak - 35);
    ctx.lineTo(xStart - 6, yPeak - 20);
    ctx.lineTo(xStart + 6, yPeak - 20);
    ctx.closePath();
    ctx.fill();

    // 轴名称
    ctx.font = 'italic 20px "CMU-it", serif';
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('t (时间 / 秒)', xEnd + 42, yAxis);
    ctx.fillText('v(t), i(t)', xStart - 35, yPeak - 45);

    // 时间刻度与 tau 分度线 (0, tau, 2tau, 3tau, 4tau, 5tau)
    for (let k = 0; k <= 5; k++) {
      const tx = xStart + (k / maxT) * (xEnd - xStart);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, yAxis);
      ctx.lineTo(tx, yPeak);
      ctx.stroke();

      ctx.font = '17px "CMU-rm", sans-serif';
      ctx.fillStyle = k === 1 ? PAL.yellow : PAL.greyB;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(k === 0 ? '0' : (k === 1 ? 'τ = 1s' : `${k}τ`), tx, yAxis + 8);
    }

    // 渐近线 V0
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xStart, yPeak);
    ctx.lineTo(xEnd, yPeak);
    ctx.stroke();
    ctx.restore();

    ctx.font = '600 18px "CMU-rm", sans-serif';
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'right';
    ctx.fillText('V₀ = 10 V (100%)', xStart - 12, yPeak + 5);

    // 绘制 63.2% 标线
    const y632 = yAxis - 0.63212 * axisH;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(46, 213, 115, 0.4)';
    ctx.beginPath();
    ctx.moveTo(xStart, y632);
    ctx.lineTo(xStart + (1.0 / maxT) * (xEnd - xStart), y632);
    ctx.stroke();
    ctx.restore();

    ctx.font = '600 17px "CMU-rm", sans-serif';
    ctx.fillStyle = PAL.green;
    ctx.textAlign = 'right';
    ctx.fillText('63.2% (6.32 V)', xStart - 12, y632 + 5);

    window.auditTag(ctx,'rc.v',{model:'rc_v_curve',origin:[xStart,yAxis],x_scale:(xEnd-xStart)/maxT,axis_height:axisH});
    // (2) 连续绘制充电波形 v_C(t)
    ctx.strokeStyle = PAL.blue;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let simT = 0; simT <= curSimT; simT += 0.02) {
      const px = xStart + (simT / maxT) * (xEnd - xStart);
      const py = yAxis - (vCharge(simT) / V0) * axisH;
      if (simT === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    window.auditTag(ctx,'rc.i',{model:'rc_i_curve',origin:[xStart,yAxis],x_scale:(xEnd-xStart)/maxT,axis_height:axisH});
    // (3) 连续绘制电流衰减波形 i(t)
    ctx.strokeStyle = PAL.red;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    for (let simT = 0; simT <= curSimT; simT += 0.02) {
      const px = xStart + (simT / maxT) * (xEnd - xStart);
      const py = yAxis - (iCharge(simT) / I0) * axisH;
      if (simT === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    window.auditTag(ctx,null);
    // (4) 当前扫描指示光标
    const curPx = xStart + (curSimT / maxT) * (xEnd - xStart);
    const curPy = yAxis - (vCharge(curSimT) / V0) * axisH;

    ctx.strokeStyle = PAL.yellow;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(curPx, yAxis);
    ctx.lineTo(curPx, yPeak);
    ctx.stroke();
    ctx.setLineDash([]);

    // 采样光斑
    window.auditTag(ctx,'rc.dot',{model:'rc_v_dot',origin:[xStart,yAxis],x_scale:(xEnd-xStart)/maxT,axis_height:axisH});
    DG.neuron(ctx, curPx, curPy, 7, 1.0, { fill: PAL.yellow, stroke: PAL.white, lw: 2 });

    window.auditTag(ctx,null);
    // 图例
    ctx.font = '600 20px "PuHui-Medium", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = PAL.blue;
    L.typesetMath(ctx,[{s:'— 电容电压 '},{s:'v',it:true,sub:'C'},{s:'(t) = V',sub:'0'},{s:'(1 − '},{s:'e',it:true,sup:'−t/τ'},{s:')'}],xStart+40,yPeak-65,20,{align:'left',col:PAL.blue});
    ctx.fillStyle = PAL.red;
    L.typesetMath(ctx,[{s:'-- 回路电流 '},{s:'i',it:true},{s:'(t) = I',sub:'0'},{s:'e',it:true,sup:'−t/τ'}],xStart+40,yPeak-30,20,{align:'left',col:PAL.red});

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
    ctx.roundRect(boxX, boxY, boxW, boxH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.font = `600 24px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(note, 960, sub ? boxY + 34 : boxY + 46);

    if (sub) {
      ctx.font = `18px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
      ctx.fillStyle = PAL.greyB;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sub, 960, boxY + 66);
    }
    ctx.restore();
  }

  window.RC = {
    RESISTANCE_R_OHM, CAPACITANCE_C_F, VOLTAGE_V0_V, INITIAL_CURRENT_I0_A,
    TIME_CONSTANT_TAU_S, TOTAL_SOURCE_ENERGY_J, CAPACITOR_ENERGY_J, RESISTOR_HEAT_ENERGY_J,
    VOLTAGE_AMPLITUDE_PX, CURRENT_AMPLITUDE_PX,
    R, C_VAL, V0, I0, TAU, X0, Y0, PAL,
    vCharge, iCharge, vrCharge, vDischarge, iDischarge,
    drawRCCircuit, drawDualWaveforms, drawHeader, drawBottomCard
  };
})();

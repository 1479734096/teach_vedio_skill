// 镜头 5 (24.0s - 30.0s)：总结大板书——一阶常微分方程求解与电容充电 50% 能量定理
(() => {
  const W = window.RC;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  const FONT_TITLE = 'PuHui-Bold';
  const FONT_BODY = 'PuHui-Medium';
  const BLUE = '#58C4DD';
  const RED = '#FC6255';
  const GREEN = '#2ED573';
  const YELLOW = '#FFFF00';
  const ORANGE = '#FF9F43';
  const TEXT_MAIN = '#FFFFFF';
  const TEXT_MUTED = '#94A3B8';
  const CARD_BG = 'rgba(23, 31, 45, 0.92)';
  const CARD_BORDER = 'rgba(255, 255, 255, 0.16)';

  SCENES['shot5'] = {
    draw(c, lt, gt) {
      c.fillStyle = '#0F141D';
      c.fillRect(0, 0, 1920, 1080);

      // 顶栏
      W.drawHeader(c, '镜头 5/5 · 理论总结与能量定理', 'RC 电路充放电过程——时间常数与能量动态转换');

      // ================= 第一层次 (0.4s - 2.2s)：左侧栏 一阶常微分方程 =================
      const leftP = MO.smooth(MO.seg(lt, 0.4, 1.8));
      if (leftP > 0) {
        c.save();
        c.globalAlpha = leftP;

        c.fillStyle = CARD_BG;
        c.strokeStyle = CARD_BORDER;
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(120, 135, 780, 515, 16);
        c.fill();
        c.stroke();

        c.font = `700 26px "${FONT_TITLE}", "NotoSansSC-700", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        c.fillText('【基尔霍夫电压定律与微分方程】', 140, 185);

        // 1. KVL 方程
        c.font = `600 22px "${FONT_BODY}", sans-serif`;
        c.fillStyle = BLUE;
        c.fillText('1. 回路基尔霍夫电压定律 (KVL)：', 140, 235);

        L.typesetMath(c, [
          { s: 'V₀', it: true, col: TEXT_MAIN },
          { s: '=', col: TEXT_MAIN, gap: 10 },
          { s: 'v', it: true, sub: 'R', col: RED },
          { s: '+', col: TEXT_MAIN, gap: 8 },
          { s: 'v', it: true, sub: 'C', col: BLUE, gap: 12 },
          { s: '=', col: TEXT_MAIN, gap: 12 },
          { s: 'R · i(t)', it: true, col: RED, gap: 8 },
          { s: '+', col: TEXT_MAIN, gap: 8 },
          { s: 'v', sub: 'C', it: true, col: BLUE },
          { s: '(t)', it: true, col: BLUE }
        ], 160, 280, 36, { align: 'left', col: TEXT_MAIN });

        // 2. 一阶非齐次常微分方程
        c.font = `600 22px "${FONT_BODY}", sans-serif`;
        c.fillStyle = GREEN;
        c.fillText('2. 标准一阶常微分方程：', 140, 345);

        // 重点方程高亮框
        c.save();
        c.strokeStyle = ORANGE;
        c.fillStyle = 'rgba(255, 159, 67, 0.08)';
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(140, 365, 740, 102, 10);
        c.fill();
        c.stroke();
        c.restore();

        L.typesetMath(c, [
          { s: 'RC', it: true, col: ORANGE, gap: 8 },
          { s: 'dv', sub: 'C', it: true, col: BLUE },
          { s: '/dt', it: true, col: BLUE, gap: 10 },
          { s: '+', col: TEXT_MAIN, gap: 10 },
          { s: 'v', sub: 'C', it: true, col: BLUE, gap: 12 },
          { s: '=', col: TEXT_MAIN, gap: 12 },
          { s: 'V₀', it: true, col: TEXT_MAIN }
        ], 160, 405, 36, { align: 'left', col: TEXT_MAIN });
        L.typesetMath(c, [
          { s: '令时间常数', col: TEXT_MUTED, gap: 10 },
          { s: 'τ = RC = 1.0 s', col: YELLOW }
        ], 160, 450, 26, { align: 'left', col: TEXT_MAIN });

        // 3. 通解与响应分解
        c.font = `600 22px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('3. 三要素法通用解 (充电与放电)：', 140, 495);

        L.typesetMath(c, [
          { s: 'v', it: true, sub: 'C', col: BLUE },
          { s: '(', gap: 2 },
          { s: 't', it: true, gap: 2 },
          { s: ')', gap: 8 },
          { s: '=', col: TEXT_MAIN, gap: 8 },
          { s: 'v', sub: 'C', it: true, col: TEXT_MAIN },
          { s: '(∞)', col: TEXT_MAIN, gap: 6 },
          { s: '+', col: TEXT_MAIN, gap: 6 },
          { s: '[v', sub: 'C', it: true, col: GREEN },
          { s: '(0⁺) − v', sub: 'C', it: true, col: GREEN },
          { s: '(∞)] · ', col: GREEN },
          { s: 'e', sup: '−t/τ', it: true, col: GREEN }
        ], 160, 545, 36, { align: 'left', col: TEXT_MAIN });

        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MUTED;
        c.fillText('充放电速率仅由时间常数 τ 决定，与起始状态幅值无关', 140, 605);
        c.restore();
      }

      // ================= 第二层次 (1.8s - 3.8s)：右侧栏 三条物理本质深度解析 =================
      const notesP = MO.smooth(MO.seg(lt, 1.8, 3.4));
      if (notesP > 0) {
        c.save();
        c.globalAlpha = notesP;

        c.fillStyle = CARD_BG;
        c.strokeStyle = CARD_BORDER;
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(930, 135, 890, 515, 16);
        c.fill();
        c.stroke();

        c.font = `700 26px "${FONT_TITLE}", "NotoSansSC-700", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        c.fillText('【物理机制与 50% 能量耗散定理】', 970, 185);

        // 要点 1
        c.font = `700 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('① 零状态与零输入响应的对偶互补', 970, 235);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• 充电过程为零状态响应，电容电压由 0 上升至 V₀ (渐近线)', 1000, 270);
        c.fillText('• 放电过程为零输入响应，电容器静电场释放，电压指数衰减至 0', 1000, 302);

        // 要点 2: 著名的电容充电 50% 能量定理
        c.font = `700 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('② 著名的「充电 50% 能量耗散定理」', 970, 360);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• 电源供给总能量: E_source = ∫ V₀ i dt = C V₀² = 0.10 J', 1000, 395);
        c.fillText('• 电容器静电场储能: E_C = ½ C V₀² = 0.05 J (严格占据恰好 50%)', 1000, 427);
        c.fillText('• 电阻焦耳热损耗: E_R = ∫ i² R dt = 0.05 J (恒定占据 50%，与 R 无关!)', 1000, 459);

        // 要点 3
        c.font = `700 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('③ 高速集成电路与数字芯片中的应用', 970, 515);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• CMOS 门电路每次高低电平翻转，均伴随充放电造成的 ½ C V_DD² 动态功耗', 1000, 550);
        c.fillText('• 降低导线寄生电容 C 与供电电压 V_DD 是微处理器降耗提频的关键物理法则', 1000, 582);

        c.restore();
      }

      // ================= 第三层次 (3.4s - 5.8s)：底部核心结论框 =================
      const sumP = MO.smooth(MO.seg(lt, 3.4, 4.6));
      if (sumP > 0) {
        c.save();
        c.globalAlpha = sumP;

        c.fillStyle = 'rgba(23, 31, 45, 0.95)';
        c.strokeStyle = '#2ED573';
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(120, 680, 1700, 180, 16);
        c.fill();
        c.stroke();

        c.font = `700 25px "${FONT_TITLE}", sans-serif`;
        c.fillStyle = '#2ED573';
        c.textAlign = 'left';
        c.fillText('【核心物理结论】', 160, 725);

        c.font = `600 22px "${FONT_BODY}", "NotoSansSC-500", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('1. 时间常数 τ = RC 是线性一阶电路过渡过程的自然时间标尺，每经历 1τ 未完成变化量缩小为 1/e ≈ 36.8%。', 160, 765);
        c.fillText('2. 恒压源向电容充电过程中，无论回路电阻 R 阻值如何微小，电阻上累积的焦耳热损耗恒等于电容器最终储能量 (各占 50%)。', 160, 805);
        c.fillText('3. 这一能量损耗定理深刻揭示了不可逆热力学耗散与信息电平建立的内在物理羁绊。', 160, 842);

        c.restore();
      }

      // ================= 第四层次 (3.6s - 5.8s)：象牙白板书手绘笔批注 =================
      const handT = lt;
      if (handT >= 3.6 && handT <= 5.8) {
        const penPhase = MO.smooth(clamp((handT - 3.6) / 1.8));
        const penX = lerp(160, 1400, penPhase);
        const penY = 808;

        // 在核心结论下方绘制下划波浪线
        c.save();
        c.strokeStyle = ORANGE;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(160, 815);
        c.lineTo(penX, 815);
        c.stroke();
        c.restore();

        // 象牙白手绘马克笔
        if (window.PhysicsCanvasKit && window.PhysicsCanvasKit.drawMarkerHand) {
          window.PhysicsCanvasKit.drawMarkerHand(c, penX, penY, { t: handT, angle: 0.15 });
        }
      }
    }
  };
})();

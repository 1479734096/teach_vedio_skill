// 镜头 5 (24.0s - 30.0s)：白板手绘呈现卷积核心数学定义、频域对偶定理与 LTI 系统物理本质
(() => {
  const W = window.CONV;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  const BOARD = '#0F141D';
  const CARD_BG = 'rgba(23, 31, 45, 0.90)';
  const CARD_BORDER = 'rgba(255, 255, 255, 0.16)';
  const TEXT_MAIN = '#EDEDED';
  const TEXT_MUTED = '#A0AEC0';
  const ORANGE = '#FF9F43';
  const BLUE = '#58C4DD';
  const RED = '#FC6255';
  const GREEN = '#2ED573';
  const FONT_TITLE = 'PuHui-Bold';
  const FONT_BODY = 'LXGWWenKai-500';

  SCENES['shot5'] = {
    draw(c, lt, gt) {
      c.fillStyle = BOARD;
      c.fillRect(0, 0, 1920, 1080);

      // 相机动作：收尾拉远 (0.89x) 展现全板总结
      const pullP = MO.smooth(MO.seg(lt, 4.4, 6.0));
      const camZ = lerp(1.0, 0.89, pullP);
      c.save();
      c.translate(960, 540);
      c.scale(camZ, camZ);
      c.translate(-960, -540);

      // 1. 顶部大标题
      const t1 = MO.smooth(MO.seg(lt, 0.1, 0.9));
      c.save();
      c.globalAlpha = clamp(t1 * 1.5);
      c.font = `700 42px "${FONT_TITLE}", "NotoSansSC-700", sans-serif`;
      c.fillStyle = TEXT_MAIN;
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.fillText('数学总结 · 连续时间卷积的代数机制与物理本质', 100, 85);

      c.font = `600 24px "${FONT_BODY}", "NotoSansSC-500", sans-serif`;
      c.fillStyle = ORANGE;
      c.textAlign = 'right';
      c.fillText('镜头 5/5 · 卷积本质总结', 1820, 85);

      // 装饰下划线
      c.strokeStyle = ORANGE;
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(100, 105);
      c.lineTo(100 + 880 * t1, 105);
      c.stroke();
      c.restore();

      // ================= 第一层次 (0.4s - 2.2s)：左侧栏 核心积分与对偶定理 =================
      const formP = MO.smooth(MO.seg(lt, 0.4, 1.8));
      if (formP > 0) {
        c.save();
        c.globalAlpha = formP;

        // 底板
        c.fillStyle = CARD_BG;
        c.strokeStyle = CARD_BORDER;
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(100, 135, 800, 515, 16);
        c.fill();
        c.stroke();

        c.font = `700 26px "${FONT_TITLE}", "NotoSansSC-700", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        c.fillText('【卷积积分定义与代数性质】', 140, 185);

        // 1. 核心定义式
        c.font = `600 22px "${FONT_BODY}", sans-serif`;
        c.fillStyle = GREEN;
        c.fillText('1. 连续时间卷积积分核心定义：', 140, 235);

        // 重点公式外框
        c.save();
        c.strokeStyle = ORANGE;
        c.fillStyle = 'rgba(255, 159, 67, 0.08)';
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(140, 255, 720, 75, 10);
        c.fill();
        c.stroke();
        c.restore();

        L.typesetMath(c, [
          { s: '(', col: TEXT_MAIN, gap: 2 },
          { s: 'f', it: true, col: BLUE, gap: 4 },
          { s: '∗', col: ORANGE, gap: 4 },
          { s: 'g', it: true, col: RED, gap: 4 },
          { s: ')', col: TEXT_MAIN, gap: 2 },
          { s: '(', gap: 2 },
          { s: 't', it: true, gap: 2 },
          { s: ')', gap: 10 },
          { s: '=', col: TEXT_MAIN, gap: 10 },
          { s: '∫', col: ORANGE, gap: 4 },
          { s: 'f', it: true, col: BLUE },
          { s: '(', gap: 2 },
          { s: 'τ', it: true, gap: 2 },
          { s: ')', gap: 6 },
          { s: 'g', it: true, col: RED },
          { s: '(', gap: 2 },
          { s: 't', it: true, col: GREEN, gap: 4 },
          { s: '−', col: RED, gap: 4 },
          { s: 'τ', it: true, col: RED, gap: 2 },
          { s: ')', gap: 6 },
          { s: 'dτ', it: true, col: ORANGE }
        ], 160, 305, 36, { align: 'left', col: TEXT_MAIN });

        // 2. 交换律与线性
        c.font = `600 22px "${FONT_BODY}", sans-serif`;
        c.fillStyle = BLUE;
        c.fillText('2. 代数对称性：交换律与分配律', 140, 375);

        L.typesetMath(c, [
          { s: 'f', it: true, col: BLUE, gap: 4 },
          { s: '∗', col: ORANGE, gap: 4 },
          { s: 'g', it: true, col: RED, gap: 10 },
          { s: '=', col: TEXT_MAIN, gap: 10 },
          { s: 'g', it: true, col: RED, gap: 4 },
          { s: '∗', col: ORANGE, gap: 4 },
          { s: 'f', it: true, col: BLUE, gap: 25 },
          { s: '(谁翻转谁平移完全等价)', col: TEXT_MUTED }
        ], 160, 415, 34, { align: 'left', col: TEXT_MAIN });

        // 3. 频域卷积定理
        c.font = `600 22px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('3. 傅里叶变换时频对偶定理：', 140, 485);

        L.typesetMath(c, [
          { s: 'F', it: true, col: TEXT_MAIN },
          { s: '{', col: TEXT_MAIN, gap: 4 },
          { s: 'f', it: true, col: BLUE, gap: 4 },
          { s: '∗', col: ORANGE, gap: 4 },
          { s: 'g', it: true, col: RED, gap: 4 },
          { s: '}', col: TEXT_MAIN, gap: 10 },
          { s: '=', col: TEXT_MAIN, gap: 10 },
          { s: 'F', it: true, col: BLUE },
          { s: '(', gap: 2 },
          { s: 'ω', it: true, gap: 2 },
          { s: ')', gap: 8 },
          { s: '·', col: TEXT_MAIN, gap: 8 },
          { s: 'G', it: true, col: RED },
          { s: '(', gap: 2 },
          { s: 'ω', it: true, gap: 2 },
          { s: ')' }
        ], 160, 526, 36, { align: 'left', col: TEXT_MAIN });

        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MUTED;
        c.fillText('时域繁复的微积分卷积，在频域转化为简单的代数相乘', 140, 605);
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
        c.fillText('【工科与物理机制深度解析】', 970, 185);

        // 要点 1
        c.font = `700 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('① 线性时不变系统 (LTI) 的响应基石', 970, 235);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• 任意输入信号 x(t) 均可分解为无限连续的加权平移狄拉克冲击 δ(t−τ)', 1000, 270);
        c.fillText('• 系统响应即为各加权冲击响应 h(t−τ) 的连续叠加：y(t) = x(t) ∗ h(t)', 1000, 302);

        // 要点 2
        c.font = `700 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('② 几何直观：滑动加权平均与平滑滤波器', 970, 360);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• 卷积核 g(t−τ) 充当移动测量窗口，每个时刻的输出是局域重叠的加权积分', 1000, 395);
        c.fillText('• 方波与方波卷积平滑为梯形/三角形，体现了系统对高频突变的低通滤波', 1000, 427);

        // 要点 3
        c.font = `700 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('③ 概率论与统计学中的独立随机变量和', 970, 485);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• 两个独立连续随机变量之和 Z = X + Y 的概率密度函数，即为各自 PDF 的卷积', 1000, 520);
        c.fillText('• 中心极限定理的本质即是独立分布无限次卷积逼近高斯正态分布', 1000, 552);

        c.restore();
      }

      // ================= 第三层次 (3.4s - 5.8s)：底部核心结论框 =================
      const sumP = MO.smooth(MO.seg(lt, 3.4, 4.6));
      if (sumP > 0) {
        c.save();
        c.globalAlpha = sumP;
        c.fillStyle = 'rgba(255, 159, 67, 0.09)';
        c.strokeStyle = ORANGE;
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(100, 680, 1720, 175, 14);
        c.fill();
        c.stroke();

        c.font = `700 25px "${FONT_TITLE}", sans-serif`;
        c.fillStyle = ORANGE;
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        c.fillText('核心结论：', 140, 725);

        c.font = `600 22px "${FONT_BODY}", "NotoSansSC-500", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('「翻转」确立了因果记忆的时序方向，「平移」代表了当前时刻的时间推进，「乘积累加」实现了记忆响应的总和。', 140, 768);
        c.fillText('从声学混响、图像模糊处理到深度卷积神经网络 (CNN)，翻转与平移的卷积积分为时空特征提取提供了普适语言。', 140, 810);
        c.restore();
      }

      // ================= 白板手绘马克笔动效 =================
      const handT = lt;
      if (handT > 0.4 && handT < 2.9) {
        let penX = 140, penY = 255;
        if (handT < 1.3) {
          const q = MO.smooth((handT - 0.4) / 0.9);
          penX = lerp(140, 860, q);
          penY = lerp(255, 255, q);
        } else if (handT < 2.1) {
          const q = MO.smooth((handT - 1.3) / 0.8);
          penX = lerp(860, 140, q);
          penY = lerp(330, 330, q);
        } else {
          const q = MO.smooth((handT - 2.1) / 0.8);
          penX = lerp(140, -220, q);
          penY = lerp(330, 1180, q);
        }

        drawWhiteboardHand(c, penX, penY);
      }

      c.restore();
    }
  };

  // 象牙白马克笔
  function drawWhiteboardHand(ctx, penX, penY) {
    ctx.save();
    ctx.translate(penX, penY);
    ctx.rotate(0.38);

    ctx.fillStyle = '#CBD5E1';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, 26);
    ctx.lineTo(6, 26);
    ctx.lineTo(5, 18);
    ctx.lineTo(-5, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-5, 18);
    ctx.lineTo(5, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(-8, 26, 16, 92, 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(148, 163, 184, 0.40)';
    ctx.fillRect(2, 26, 6, 92);
    ctx.fillStyle = ORANGE;
    ctx.fillRect(-8, 52, 16, 14);
    ctx.strokeRect(-8, 52, 16, 14);

    ctx.fillStyle = '#E2AC96';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(8, 72, 24, 18, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(18, 82);
    ctx.lineTo(145, 245);
    ctx.lineTo(82, 275);
    ctx.lineTo(-6, 96);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
})();

// 镜头 5 (24.0s - 30.0s)：白板手绘呈现二阶齐次微分方程与电磁对偶性物理本质 (RSA / 经典黑板手绘语法)
(() => {
  const W = window.LC;
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

      // 相机动作：收尾拉远 (0.89x)，展现整板完整物理总结
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
      c.fillText('物理总结 · LC 电磁振荡的数学方程与能量机制', 100, 85);

      c.font = `600 24px "${FONT_BODY}", "NotoSansSC-500", sans-serif`;
      c.fillStyle = ORANGE;
      c.textAlign = 'right';
      c.fillText('镜头 5/5 · 振荡微分方程', 1820, 85);

      // 装饰下划线
      c.strokeStyle = ORANGE;
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(100, 105);
      c.lineTo(100 + 880 * t1, 105);
      c.stroke();
      c.restore();

      // ================= 第一层次 (0.4s - 2.2s)：左侧栏 二阶齐次微分方程 =================
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
        c.fillText('【基尔霍夫定律与谐振方程】', 140, 185);

        // 1. 回路电压方程
        c.font = `600 22px "${FONT_BODY}", sans-serif`;
        c.fillStyle = BLUE;
        c.fillText('1. KVL（电感电压按电流方向）：', 140, 235);

        L.typesetMath(c, [
          { s: 'u', it: true, sub: 'C', col: BLUE },
          { s: '−', col: TEXT_MAIN, gap: 8 },
          { s: 'u', it: true, sub: 'L', col: RED, gap: 12 },
          { s: '=', col: TEXT_MAIN, gap: 12 },
          { s: 'q/C', it: true, col: BLUE, gap: 8 },
          { s: '−', col: TEXT_MAIN, gap: 8 },
          { s: 'L', it: true, gap: 4 },
          { s: 'di/dt', it: true, col: RED, gap: 12 },
          { s: '=', col: TEXT_MAIN, gap: 12 },
          { s: '0', col: TEXT_MAIN }
        ], 160, 280, 36, { align: 'left', col: TEXT_MAIN });

        // 2. 齐次微分方程标准型
        c.font = `600 22px "${FONT_BODY}", sans-serif`;
        c.fillStyle = GREEN;
        c.fillText('2. 标准简谐振动微分方程：', 140, 345);

        // 高亮外框
        c.save();
        c.strokeStyle = ORANGE;
        c.fillStyle = 'rgba(255, 159, 67, 0.08)';
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(140, 365, 720, 75, 10);
        c.fill();
        c.stroke();
        c.restore();

        L.typesetMath(c, [
          { s: 'd²q/dt²', it: true, col: BLUE, gap: 10 },
          { s: '+', col: TEXT_MAIN, gap: 10 },
          { s: 'ω', it: true, sub: '0', sup: '2', col: ORANGE, gap: 4 },
          { s: 'q', it: true, col: BLUE, gap: 12 },
          { s: '=', col: TEXT_MAIN, gap: 12 },
          { s: '0', col: TEXT_MAIN, gap: 20 },
          { s: '其中', col: TEXT_MUTED, gap: 12 },
          { s: 'ω', it: true, sub: '0', col: ORANGE, gap: 8 },
          { s: '=', col: TEXT_MAIN, gap: 8 },
          { s: '1 / √(LC)', it: true, col: ORANGE }
        ], 160, 415, 36, { align: 'left', col: TEXT_MAIN });

        // 3. 固有谐振周期
        c.font = `600 22px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('3. 汤姆孙固有振荡周期公式：', 140, 480);

        L.typesetMath(c, [
          { s: 'T', it: true, col: GREEN, gap: 10 },
          { s: '=', col: TEXT_MAIN, gap: 10 },
          { s: '2π / ω₀', col: TEXT_MAIN, gap: 10 },
          { s: '=', col: TEXT_MAIN, gap: 10 },
          { s: '2π √(LC)', it: true, col: GREEN }
        ], 160, 526, 36, { align: 'left', col: TEXT_MAIN });

        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MUTED;
        c.fillText('电感阻碍电流变化、电容阻碍电压突变，构筑系统固有频率', 140, 605);
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
        c.fillText('【电磁物理机制深度解析】', 970, 185);

        // 要点 1
        c.font = `700 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('① 电场能与磁场能完全等价对偶', 970, 235);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• 电容器极板存储电场能 (q²/2C)，相当于机械振动中弹簧的弹性势能', 1000, 270);
        c.fillText('• 电感线圈存储磁场能 (Li²/2)，相当于机械振动中质点的动能', 1000, 302);

        // 要点 2
        c.font = `700 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('② 零耗散下的完全周期能量守恒', 970, 360);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• 无电阻理想回路中，任一时刻电场能与磁场能之和恒等于初始储能 E₀', 1000, 395);
        c.fillText('• 能量在电容器与电感器之间以 2ω₀ 频率进行双倍速局域交换', 1000, 427);

        // 要点 3
        c.font = `700 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('③ 无线电波发射与微波技术的基石', 970, 485);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• 当将 LC 闭合回路两极板拉开成为偶极子天线时，局域振荡转化为行波辐射', 1000, 520);
        c.fillText('• 赫兹由此在实验上证实了麦克斯韦预言的电磁波真实存在', 1000, 552);

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
        c.fillText('LC 回路通过电荷位移与自感磁通的交替耦合，将静电储能与动态磁储能连接为完美的连续谐振系统。', 140, 768);
        c.fillText('电荷与电流 90° 相位差保证了能量的无损局域转换，这是所有模拟电路调谐、滤波与电磁辐射的原点。', 140, 810);
        c.restore();
      }

      // ================= 白板手绘马克笔动效 (专注于左侧重点框，零遮挡右侧解析) =================
      const handT = lt;
      if (handT > 0.4 && handT < 2.9) {
        let penX = 140, penY = 365;
        if (handT < 1.3) {
          const q = MO.smooth((handT - 0.4) / 0.9);
          penX = lerp(140, 860, q);
          penY = lerp(365, 365, q);
        } else if (handT < 2.1) {
          const q = MO.smooth((handT - 1.3) / 0.8);
          penX = lerp(860, 140, q);
          penY = lerp(440, 440, q);
        } else {
          const q = MO.smooth((handT - 2.1) / 0.8);
          penX = lerp(140, -220, q);
          penY = lerp(440, 1180, q);
        }

        drawWhiteboardHand(c, penX, penY);
      }

      c.restore();
    }
  };

  // 高对比度象牙白马克笔
  function drawWhiteboardHand(ctx, penX, penY) {
    ctx.save();
    ctx.translate(penX, penY);
    ctx.rotate(0.38);

    // 笔尖套箍
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

    // 亮橙色墨水笔尖
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-5, 18);
    ctx.lineTo(5, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 笔身主体 (象牙白 #F8FAFC)
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(-8, 26, 16, 92, 2);
    ctx.fill();
    ctx.stroke();

    // 侧阴影与色环
    ctx.fillStyle = 'rgba(148, 163, 184, 0.40)';
    ctx.fillRect(2, 26, 6, 92);
    ctx.fillStyle = ORANGE;
    ctx.fillRect(-8, 52, 16, 14);
    ctx.strokeRect(-8, 52, 16, 14);

    // 人手轮廓
    ctx.fillStyle = '#E2AC96';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(8, 72, 24, 18, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 前臂
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

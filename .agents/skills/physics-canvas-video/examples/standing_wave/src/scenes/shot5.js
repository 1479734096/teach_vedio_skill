// 镜头 5 (24.0s - 30.0s)：白板手绘笔迹呈现最终公式，分时多层次解析物理本质 (RSA / 经典黑板手绘语法)
(() => {
  const W = window.WAVE;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  // 风格调色：暗调深灰讲义板 (消除白底刺眼跳跃，与前四镜 3b1b 保持高级视觉连续性)
  const BOARD = '#0F141D';
  const CARD_BG = 'rgba(23, 31, 45, 0.88)';
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

      // 相机动作：收尾拉远 (0.88x)，展现整板完整物理总结 (RSA 经典收束)
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
      c.fillText('物理总结 · 驻波的数学与电磁物理机制', 100, 85);

      // 镜头徽标
      c.font = `600 24px "${FONT_BODY}", "NotoSansSC-500", sans-serif`;
      c.fillStyle = ORANGE;
      c.textAlign = 'right';
      c.fillText('镜头 5/5 · 驻波合成公式', 1820, 85);

      // 装饰下划线
      c.strokeStyle = ORANGE;
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(100, 105);
      c.lineTo(100 + 820 * t1, 105);
      c.stroke();
      c.restore();

      // ================= 第一层次 (0.4s - 2.2s)：左侧栏 三列核心公式 =================
      const formP = MO.smooth(MO.seg(lt, 0.4, 1.8));
      if (formP > 0) {
        c.save();
        c.globalAlpha = formP;

        // 卡片底板
        c.fillStyle = CARD_BG;
        c.strokeStyle = CARD_BORDER;
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(100, 135, 800, 515, 16);
        c.fill();
        c.stroke();

        // 卡片标题
        c.font = `700 26px "${FONT_TITLE}", "NotoSansSC-700", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        c.fillText('【波动方程与和差化积合成】', 140, 185);

        // 1. 正向入射行波
        c.font = `600 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = BLUE;
        c.fillText('1. 正向入射电压波：', 140, 235);

        L.typesetMath(c, [
          { s: 'u', it: true, sub: 'i', col: BLUE },
          { s: '(', col: TEXT_MAIN, gap: 2 },
          { s: 'x', it: true, col: TEXT_MAIN, gap: 2 },
          { s: ',', col: TEXT_MAIN, gap: 4 },
          { s: 't', it: true, col: TEXT_MAIN, gap: 2 },
          { s: ')', col: TEXT_MAIN, gap: 10 },
          { s: '=', col: TEXT_MAIN, gap: 10 },
          { s: 'A', it: true, col: TEXT_MAIN, gap: 8 },
          { s: 'cos', col: TEXT_MAIN, gap: 4 },
          { s: '(', col: TEXT_MAIN, gap: 4 },
          { s: 'ωt', it: true, col: TEXT_MAIN, gap: 6 },
          { s: '−', col: TEXT_MAIN, gap: 6 },
          { s: 'βx', it: true, col: TEXT_MAIN, gap: 4 },
          { s: ')', col: TEXT_MAIN }
        ], 160, 280, 36, { align: 'left', col: TEXT_MAIN });

        // 2. 反向反射行波
        c.font = `600 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = RED;
        c.fillText('2. 反向反射电压波：', 140, 345);

        L.typesetMath(c, [
          { s: 'u', it: true, sub: 'r', col: RED },
          { s: '(', col: TEXT_MAIN, gap: 2 },
          { s: 'x', it: true, col: TEXT_MAIN, gap: 2 },
          { s: ',', col: TEXT_MAIN, gap: 4 },
          { s: 't', it: true, col: TEXT_MAIN, gap: 2 },
          { s: ')', col: TEXT_MAIN, gap: 10 },
          { s: '=', col: TEXT_MAIN, gap: 10 },
          { s: 'A', it: true, col: TEXT_MAIN, gap: 8 },
          { s: 'cos', col: TEXT_MAIN, gap: 4 },
          { s: '(', col: TEXT_MAIN, gap: 4 },
          { s: 'ωt', it: true, col: TEXT_MAIN, gap: 6 },
          { s: '+', col: TEXT_MAIN, gap: 6 },
          { s: 'βx', it: true, col: TEXT_MAIN, gap: 4 },
          { s: ')', col: TEXT_MAIN }
        ], 160, 390, 36, { align: 'left', col: TEXT_MAIN });

        // 3. 线性叠加合成驻波
        c.font = `700 25px "${FONT_BODY}", sans-serif`;
        c.fillStyle = GREEN;
        c.fillText('3. 线性叠加合成驻波电压：', 140, 460);

        // 重点公式外框
        c.save();
        c.strokeStyle = ORANGE;
        c.fillStyle = 'rgba(255, 159, 67, 0.08)';
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(140, 480, 680, 70, 10);
        c.fill();
        c.stroke();
        c.restore();

        L.typesetMath(c, [
          { s: 'u', it: true, col: GREEN, gap: 8 },
          { s: '=', col: TEXT_MAIN, gap: 10 },
          { s: '2', col: TEXT_MAIN, gap: 2 },
          { s: 'A', it: true, col: TEXT_MAIN, gap: 10 },
          { s: 'cos', col: ORANGE, gap: 4 },
          { s: '(', col: ORANGE, gap: 4 },
          { s: 'βx', it: true, col: ORANGE, gap: 4 },
          { s: ')', col: ORANGE, gap: 10 },
          { s: 'cos', col: GREEN, gap: 4 },
          { s: '(', col: GREEN, gap: 4 },
          { s: 'ωt', it: true, col: GREEN, gap: 4 },
          { s: ')', col: GREEN }
        ], 160, 526, 40, { align: 'left', col: TEXT_MAIN });

        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MUTED;
        c.fillText('开路终端约束：x = 0 处电压同相全反射 (Γ = +1, 电压波腹)', 140, 605);
        c.restore();
      }

      // ================= 第二层次 (1.8s - 3.8s)：右侧栏 三条物理本质深度解析 =================
      const notesP = MO.smooth(MO.seg(lt, 1.8, 3.4));
      if (notesP > 0) {
        c.save();
        c.globalAlpha = notesP;

        // 卡片底板
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
        c.fillText('① 空间与时间变量完全分离', 970, 235);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• 空间位置 x 锁定振幅分布 2A |cos(βx)|，波形不再沿线平移推进', 1000, 270);
        c.fillText('• 时间 t 驱动全线电压同步以固有角频率 ω 原位简谐谐振', 1000, 302);

        // 要点 2
        c.font = `700 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('② 无净功率定向传播 (能量局域原位转换)', 970, 360);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• 反向两波能流大小相等、方向相反，时间积分平均净能流恒为 0', 1000, 395);
        c.fillText('• 电场储能 (电压波腹) 与磁场储能 (电压波节/电流波腹) 局域互换', 1000, 427);

        // 要点 3
        c.font = `700 23px "${FONT_BODY}", sans-serif`;
        c.fillStyle = ORANGE;
        c.fillText('③ 终端边界决定驻波模式', 970, 485);
        c.font = `500 20px "${FONT_BODY}", sans-serif`;
        c.fillStyle = TEXT_MAIN;
        c.fillText('• x = 0 开路终端电流全截止，电压同相叠加恒为最大值「波腹」', 1000, 520);
        c.fillText('• 距终端奇数倍 λ/4 处电压反相完全相消，恒为静止「波节」', 1000, 552);

        c.restore();
      }

      // ================= 第三层次 (3.4s - 5.8s)：底部全景核心结论框 =================
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
        c.fillText('两列振幅、频率相同，传播方向相反的相干行波相遇叠加，行波的时间平移对称性转化为空间的驻立振动。', 140, 768);
        c.fillText('波腹电压振幅加倍至 2A，波节电压恒等于 0，这是传输线谐振、微波驻波管与量子定态波函数的物理基石。', 140, 810);
        c.restore();
      }

      // ================= 白板手绘马克笔动效 (专注于左侧核心公式边框，绝不跨区遮挡右侧解析) =================
      const handT = lt;
      if (handT > 0.4 && handT < 2.9) {
        let penX = 100, penY = 440;
        if (handT < 1.3) {
          // 阶段一：引导左侧驻波核心公式书写与高亮
          const q = MO.smooth((handT - 0.4) / 0.9);
          penX = lerp(120, 720, q);
          penY = lerp(460, 475, q);
        } else if (handT < 2.1) {
          // 阶段二：围绕核心公式绘制亮橙色强调边框下沿
          const q = MO.smooth((handT - 1.3) / 0.8);
          penX = lerp(720, 160, q);
          penY = lerp(510, 510, q);
        } else {
          // 阶段三：书写完毕，手臂平滑自然滑向画外左下方，右侧深度解析区完全零遮挡呈现
          const q = MO.smooth((handT - 2.1) / 0.8);
          penX = lerp(160, -220, q);
          penY = lerp(510, 1180, q);
        }

        drawWhiteboardHand(c, penX, penY);
      }

      c.restore(); // restore camera scale
    }
  };

  // 科技黑板手绘高对比度白板笔/板书马克笔 (材质逻辑与高对比度重构，彻底根治深底隐形)
  function drawWhiteboardHand(ctx, penX, penY) {
    ctx.save();
    ctx.translate(penX, penY);
    ctx.rotate(0.38); // 手持自然倾角

    // 1. 马克笔笔尖 (鲜亮橙色彩色板书墨水笔头，与正在绘制的亮橙色强调框材质 100% 对应)
    // 笔尖金属套箍
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

    // 鲜亮橙色笔尖
    ctx.fillStyle = ORANGE; // #FF9F43 鲜亮板书马克笔墨水色
    ctx.beginPath();
    ctx.moveTo(0, 0);       // 书写接触点
    ctx.lineTo(-5, 18);
    ctx.lineTo(5, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 笔尖高光细线
    ctx.strokeStyle = '#FFE8CC';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(3, 17);
    ctx.stroke();

    // 2. 马克笔笔身 (极具辨识度的象牙白/银白高对比度笔身，对比度 >10:1，彻底根治深底隐形)
    // 笔杆主体
    ctx.fillStyle = '#F8FAFC'; // 极浅灰白
    ctx.strokeStyle = '#0F172A'; // 深色轮廓
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(-8, 26, 16, 92, 2);
    ctx.fill();
    ctx.stroke();

    // 笔杆金属质感侧阴影
    ctx.fillStyle = 'rgba(148, 163, 184, 0.40)';
    ctx.fillRect(2, 26, 6, 92);

    // 马克笔橙色醒目标识色环 (与墨水同色识别环)
    ctx.fillStyle = ORANGE;
    ctx.fillRect(-8, 52, 16, 14);
    ctx.strokeRect(-8, 52, 16, 14);

    // 3. 人物手臂与手掌 (自然肉色、高对比轮廓)
    ctx.fillStyle = '#E2AC96';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.5;

    // 拇指与食指压笔持握部
    ctx.beginPath();
    ctx.ellipse(8, 72, 24, 18, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 持笔高光细节
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(4, 68, 7, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // 前臂向右下自然延伸
    ctx.fillStyle = '#E2AC96';
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

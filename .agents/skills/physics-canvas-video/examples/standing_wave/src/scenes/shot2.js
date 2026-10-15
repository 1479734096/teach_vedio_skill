// 镜头 2 (6.0s - 12.0s)：加入向左传播的反向反射电压波，建立开路终端相位约定
(() => {
  const W = window.WAVE;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot2'] = {
    draw(c, lt, gt) {
      const t = lt + 6.0; // 连续物理时间
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 相机动作表：1.2s 横移关注 x=0 终端，2.2s 缓推看清同相振动，4.5s 回归 z=1.0 全局
      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [
        { at: 1.2, kind: 'glide', x: 1040, y: 540, dur: 0.8 },
        { at: 2.2, kind: 'push', k: 0.16, dur: 0.9, x: 1040, y: 540 },
        { at: 4.5, kind: 'to', x: 960, y: 540, z: 1.0, dur: 1.0 }
      ], lt);

      // 相机世界层：坐标系、两列波与终端特征
      CAM.with(c, cam, c => {
        // 绘制坐标系
        W.drawCoordinateSystem(c);

        // 蓝色正向行波继续向右传播 (带半透明位移场阴影)
        W.drawWaveCurve(c, W.ui, t, W.PAL.blue, 4.0, null, 0.95, 0, 'rgba(88, 196, 221, 0.18)');

        // 红色反向波自 x=0 终端产生并平滑显现 (0.0 - 1.0s 全线平滑渐入，相速度严格为 -250px/s，杜绝波前假象)
        const redAlpha = MO.smooth(clamp(lt / 1.0));

        // 绘制红色反向正弦波曲线 u_r(x,t) (采用 [16, 8] 虚线，使两波重叠时红蓝相间清晰可见)
        W.drawWaveCurve(c, W.ur, t, W.PAL.red, 4.5, [16, 8], redAlpha * 0.95, 0, 'rgba(252, 98, 85, 0.16)');

        // 离散电位指示圆点 (蓝波与红波指示，红波指示随透明度平滑显现)
        W.drawVoltageIndicators(c, W.ui, t, W.PAL.blue, 16, 0, 1.0);
        if (redAlpha > 0.05) {
          W.drawVoltageIndicators(c, W.ur, t, W.PAL.red, 16, 0, redAlpha);
        }

        // 双向传播箭头：蓝色向右 (yOffset=220 与镜头1严格同一高度，零跳变)、红色向左 (yOffset=150)
        W.drawDirectionArrows(c, 1, t, W.PAL.blue, 220, 1.0);
        if (redAlpha > 0.1) {
          W.drawDirectionArrows(c, -1, t, W.PAL.red, 150, redAlpha);
        }

        // 终端 x=0 相位约定高亮：两列波在 x=0 处严格同相位 (u_i = u_r = A cos(omega*t))
        const yBoundary = W.ui(0, t); // x=0 处的瞬时电压
        const syTerm = W.toScrY(yBoundary);

        // 终端采样指示核 (同相共振)
        c.save();
        const halo = DG.indicate(MO.seg(lt, 0.5, 2.0));
        DG.neuron(c, W.X0, syTerm, 13 * halo.s, 1.0, {
          fill: W.PAL.yellow,
          stroke: W.PAL.white,
          lw: 3
        });

        // 相位约定说明气泡 (避开波形最高点，置于 X0 - 190, Y=260)
        ctxBubble(c, W.X0 - 190, 260, 'x=0 开路同相反射: Δφ = 0 (Γ = +1)');
        c.restore();
      });

      // 屏幕固定 UI 层：数学公式对比排版
      const formAlpha = MO.smooth(MO.seg(lt, 0.3, 1.0));
      if (formAlpha > 0) {
        c.save();
        c.globalAlpha = formAlpha;

        c.font = `600 24px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
        c.fillStyle = W.PAL.greyA;
        c.textAlign = 'left';
        c.fillText('两列反向行波电压方程对比：', 100, 160);

        // 蓝色公式 u_i
        L.typesetMath(c, [
          { s: 'u', it: true, sub: 'i', col: W.PAL.blue },
          { s: '=', gap: 10 },
          { s: 'A', it: true, gap: 8 },
          { s: 'cos', gap: 6 },
          { s: '(', gap: 4 },
          { s: 'ω', it: true, gap: 4 },
          { s: 't', it: true, gap: 8 },
          { s: '−', gap: 8 },
          { s: 'β', it: true, gap: 4 },
          { s: 'x', it: true },
          { s: ')' }
        ], 100, 215, 38, { align: 'left', col: W.PAL.white });

        // 红色公式 u_r
        L.typesetMath(c, [
          { s: 'u', it: true, sub: 'r', col: W.PAL.red },
          { s: '=', gap: 10 },
          { s: 'A', it: true, gap: 8 },
          { s: 'cos', gap: 6 },
          { s: '(', gap: 4 },
          { s: 'ω', it: true, gap: 4 },
          { s: 't', it: true, gap: 8 },
          { s: '+', gap: 8 },
          { s: 'β', it: true, gap: 4 },
          { s: 'x', it: true },
          { s: ')' }
        ], 100, 268, 38, { align: 'left', col: W.PAL.white });

        c.restore();
      }

      // 顶栏信息与角标
      W.drawHeader(c, '镜头 2/5 · 反向波与相位', '两列相反方向的波如何产生驻波？', W.PAL.white);

      // 底部教学说明卡片 (安全区 y < 910)
      W.drawBottomCard(
        c,
        '引入反向传播的反射电压波：振幅 A 与角频率 ω 相同，传播符号变为 +βx',
        '开路终端 (x=0) 产生同相全反射 (Γ = +1)，反射波以相速度 v = -ω/β = -250px/s 向左回传'
      );
    }
  };

  function ctxBubble(ctx, x, y, text) {
    ctx.save();
    ctx.font = `600 20px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(25, 25, 10, 0.88)';
    ctx.strokeStyle = W.PAL.yellow;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - tw / 2 - 12, y - 18, tw + 24, 36, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = W.PAL.yellow;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }
})();

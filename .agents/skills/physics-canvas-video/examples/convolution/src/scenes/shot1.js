// 镜头 1 (0.0s - 6.0s)：展示哑变量 tau 坐标系与两列原始输入信号 f(tau) 与 g(tau)
(() => {
  const W = window.CONV;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot1'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 相机动作：1.5s 缓推聚焦波形，4.2s 回正
      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [
        { at: 1.5, kind: 'push', k: 0.16, dur: 0.9, x: 960, y: 450 },
        { at: 4.2, kind: 'pull', z: 1.0, dur: 1.0, x: 960, y: 540 }
      ], lt);

      CAM.with(c, cam, c => {
        // 绘制哑变量 tau 系统 (此时仅展示原始信号，不滑动)
        W.drawTauSystem(c, -300, { showGShift: false });

        // 绘制原始 g(tau) [0, 200]
        const gLeft = W.X0 + 0 * 1.5;
        const gRight = W.X0 + 200 * 1.5;
        const gTop = W.Y_TAU - W.PULSE_H;

        c.save();
        c.fillStyle = 'rgba(252, 98, 85, 0.20)';
        c.fillRect(gLeft, gTop, gRight - gLeft, W.PULSE_H);

        c.strokeStyle = W.PAL.red;
        c.lineWidth = 3.5;
        c.beginPath();
        c.moveTo(W.X0 - 400, W.Y_TAU);
        c.lineTo(gLeft, W.Y_TAU);
        c.lineTo(gLeft, gTop);
        c.lineTo(gRight, gTop);
        c.lineTo(gRight, W.Y_TAU);
        c.lineTo(W.X0 + 400, W.Y_TAU);
        c.stroke();

        c.font = '600 20px "PuHui-Medium", sans-serif';
        c.fillStyle = W.PAL.red;
        c.textAlign = 'center';
        c.fillText('待卷积信号 g(τ)', (gLeft + gRight) / 2, gTop - 15);
        c.restore();
      });

      // 屏幕固定 UI 层：数学公式
      const formAlpha = MO.smooth(MO.seg(lt, 0.4, 1.4));
      if (formAlpha > 0) {
        c.save();
        c.globalAlpha = formAlpha;

        c.font = `600 24px "PuHui-Medium", sans-serif`;
        c.fillStyle = W.PAL.blue;
        c.textAlign = 'left';
        c.fillText('准备工作：引入时域积分哑变量 τ (Dummy Variable)', 100, 160);

        L.typesetMath(c, [
          { s: 'f', it: true, col: W.PAL.blue },
          { s: '(', gap: 2 },
          { s: 'τ', it: true, gap: 2 },
          { s: ')', gap: 10 },
          { s: ':', col: W.PAL.white, gap: 10 },
          { s: 'τ', it: true, gap: 4 },
          { s: '∈', gap: 4 },
          { s: '[−100, 100]', gap: 30 },
          { s: 'g', it: true, col: W.PAL.red },
          { s: '(', gap: 2 },
          { s: 'τ', it: true, gap: 2 },
          { s: ')', gap: 10 },
          { s: ':', col: W.PAL.white, gap: 10 },
          { s: 'τ', it: true, gap: 4 },
          { s: '∈', gap: 4 },
          { s: '[0, 200]' }
        ], 100, 225, 38, { align: 'left', col: W.PAL.white });

        c.restore();
      }

      // 顶栏与底栏
      W.drawHeader(c, '镜头 1/5 · 原始信号与哑变量', '卷积的翻转与平移——连续时间卷积积分机制');
      W.drawBottomCard(
        c,
        '为计算连续卷积积分 (f ∗ g)(t) = ∫ f(τ) g(t − τ) dτ，必须首先将时间变量转换为积分哑变量 τ',
        '在 τ 轴上建立基准参考系，待卷积函数 f(τ) 保持不动，作为后续滑动窗口截取的固定核'
      );
    }
  };
})();

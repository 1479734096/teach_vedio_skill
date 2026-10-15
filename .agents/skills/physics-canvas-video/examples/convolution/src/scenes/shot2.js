// 镜头 2 (6.0s - 12.0s)：第一步 镜像翻转 g(tau) -> g(-tau)
(() => {
  const W = window.CONV;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot2'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 翻转动效进度 (0.8s 内完成翻转)
      const flipP = MO.smooth(clamp(lt / 1.5));
      const flipScale = lerp(1.0, -1.0, flipP);

      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [
        { at: 1.0, kind: 'push', k: 0.16, dur: 0.9, x: 960, y: 440 },
        { at: 4.2, kind: 'pull', z: 1.0, dur: 1.0, x: 960, y: 540 }
      ], lt);

      CAM.with(c, cam, c => {
        // 固定信号 f(tau)
        W.drawTauSystem(c, -300, { showGShift: false });

        // 翻转中的信号 g(flipScale * tau)
        c.save();
        window.auditTag(c,'conv.flip',{model:'conv_flip',origin:[W.X0,W.Y_TAU],progress:flipP});
        c.translate(W.X0, W.Y_TAU);
        c.scale(flipScale, 1.0);
        c.translate(-W.X0, -W.Y_TAU);

        const gLeft = W.X0 + 0 * 1.5;
        const gRight = W.X0 + 200 * 1.5;
        const gTop = W.Y_TAU - W.PULSE_H;

        if(window.auditPhysics) window.auditPhysics('conv_flip',{progress:flipP,left:(gLeft-W.X0)/1.5*flipScale,right:(gRight-W.X0)/1.5*flipScale,height:W.Y_TAU-gTop});
        c.fillStyle = 'rgba(252, 98, 85, 0.22)';
        c.fillRect(gLeft, gTop, gRight - gLeft, W.PULSE_H);

        c.strokeStyle = W.PAL.red;
        c.lineWidth = 3.5;
        c.beginPath();
        c.moveTo(gLeft, W.Y_TAU);
        c.lineTo(gLeft, gTop);
        c.lineTo(gRight, gTop);
        c.lineTo(gRight, W.Y_TAU);
        c.stroke();
        window.auditTag(c,null);
        c.restore();

        // 镜像对称中心轴线 (tau = 0)
        c.save();
        c.setLineDash([4, 4]);
        c.strokeStyle = W.PAL.yellow;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(W.X0, W.Y_TAU - W.PULSE_H - 40);
        c.lineTo(W.X0, W.Y_TAU + 40);
        c.stroke();

        c.font = '600 18px "PuHui-Medium", sans-serif';
        c.fillStyle = W.PAL.yellow;
        c.textAlign = 'center';
        c.fillText('翻转镜像轴 (τ = 0)', W.X0, W.Y_TAU - W.PULSE_H - 50);
        c.restore();
      });

      // 屏幕固定 UI 层
      const formAlpha = MO.smooth(MO.seg(lt, 0.3, 1.2));
      if (formAlpha > 0) {
        c.save();
        c.globalAlpha = formAlpha;

        c.font = `600 24px "PuHui-Medium", sans-serif`;
        c.fillStyle = W.PAL.red;
        c.textAlign = 'left';
        c.fillText('第一步：时间反转 (Time Reversal / Mirror)', 100, 160);

        L.typesetMath(c, [
          { s: 'g', it: true, col: W.PAL.red },
          { s: '(', gap: 2 },
          { s: 'τ', it: true, gap: 2 },
          { s: ')', gap: 10 },
          { s: '⟶', col: W.PAL.yellow, gap: 14 },
          { s: 'g', it: true, col: W.PAL.red },
          { s: '(', gap: 2 },
          { s: '−', col: W.PAL.red, gap: 2 },
          { s: 'τ', it: true, col: W.PAL.red, gap: 2 },
          { s: ')', gap: 20 },
          { s: '翻转后区间:', col: W.PAL.white, gap: 10 },
          { s: 'τ', it: true, gap: 4 },
          { s: '∈', gap: 4 },
          { s: '[−200, 0]' }
        ], 100, 225, 38, { align: 'left', col: W.PAL.white });

        c.restore();
      }

      // 顶栏与底栏
      W.drawHeader(c, '镜头 2/5 · 时间反转镜像', '卷积的翻转与平移——连续时间卷积积分机制');
      W.drawBottomCard(
        c,
        '卷积定义第一步：将核函数 g(τ) 沿 τ = 0 纵轴进行左右镜像翻转，得到 g(−τ)',
        '翻转后原先在正轴 [0, 200] 的波形被严格反射至负半轴 [−200, 0]，为接下来的滑动做准备'
      );
    }
  };
})();

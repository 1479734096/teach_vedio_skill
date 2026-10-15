// 镜头 3 (12.0s - 18.0s)：第二步 时间平移 g(t - tau)，滑动窗口自左向右推进
(() => {
  const W = window.CONV;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot3'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 时间平移演化：t 从 -250 平移至 -150 (平滑过渡至 shot4 卷积扫描起始点)
      const slideP = MO.smooth(clamp(lt / 5.5));
      const simT = -250 + Math.min(lt, 1.0) * 100;

      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [
        { at: 1.2, kind: 'glide', x: 880, y: 440, dur: 0.9 },
        { at: 4.2, kind: 'to', x: 960, y: 540, z: 1.0, dur: 1.0 }
      ], lt);

      CAM.with(c, cam, c => {
        W.drawTauSystem(c, simT);

        // 绘制平移方向指示箭头 (置于 tau 轴下方净空区，彻底消除与上方公式的碰撞)
        c.save();
        const arrowX = W.X0 + (simT - 100) * 1.5;
        const arrowY = W.Y_TAU + 50;
        c.fillStyle = W.PAL.green;
        c.strokeStyle = W.PAL.green;
        c.lineWidth = 3;

        c.beginPath();
        c.moveTo(arrowX - 40, arrowY);
        c.lineTo(arrowX + 40, arrowY);
        c.stroke();

        c.beginPath();
        c.moveTo(arrowX + 40, arrowY);
        c.lineTo(arrowX + 26, arrowY - 6);
        c.lineTo(arrowX + 26, arrowY + 6);
        c.closePath();
        c.fill();

        c.font = '600 18px "PuHui-Medium", sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'top';
        c.fillText('平移推进方向 (+t)', arrowX, arrowY + 12);
        c.restore();
      });

      // 屏幕固定 UI 层
      const formAlpha = MO.smooth(MO.seg(lt, 0.3, 1.2));
      if (formAlpha > 0) {
        c.save();
        c.globalAlpha = formAlpha;

        c.font = `600 24px "PuHui-Medium", sans-serif`;
        c.fillStyle = W.PAL.green;
        c.textAlign = 'left';
        c.fillText('第二步：时间平移 (Time Shift / Sliding Window)', 100, 160);

        L.typesetMath(c, [
          { s: 'g', it: true, col: W.PAL.red },
          { s: '(', gap: 2 },
          { s: '−', col: W.PAL.red, gap: 2 },
          { s: 'τ', it: true, col: W.PAL.red, gap: 2 },
          { s: ')', gap: 10 },
          { s: '⟶', col: W.PAL.yellow, gap: 14 },
          { s: 'g', it: true, col: W.PAL.red },
          { s: '(', gap: 2 },
          { s: 't', it: true, col: W.PAL.green, gap: 4 },
          { s: '−', col: W.PAL.red, gap: 4 },
          { s: 'τ', it: true, col: W.PAL.red, gap: 2 },
          { s: ')', gap: 20 },
          { s: '滑动窗口前沿:', col: W.PAL.white, gap: 10 },
          { s: 'τ', it: true, gap: 4 },
          { s: '=', gap: 4 },
          { s: 't', it: true, col: W.PAL.green }
        ], 100, 225, 38, { align: 'left', col: W.PAL.white });

        c.restore();
      }

      // 顶栏与底栏
      W.drawHeader(c, '镜头 3/5 · 滑动窗口平移', '卷积的翻转与平移——连续时间卷积积分机制');
      W.drawBottomCard(
        c,
        '卷积定义第二步：引入时间参量 t，将翻转后的信号 g(−τ) 沿 τ 轴向右刚性平移 t，得到 g(t − τ)',
        '随着 t 从负无穷向正无穷增加，滑动窗口如探测器一般从左至右扫描固定信号 f(τ)'
      );
    }
  };
})();

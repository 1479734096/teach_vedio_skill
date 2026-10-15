// 镜头 1 (0.0s - 6.0s)：显示一列沿传输线向右传播的正向入射电压波
(() => {
  const W = window.WAVE;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot1'] = {
    draw(c, lt, gt) {
      const t = lt;
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 相机动作表：1.5s 缓推看清波峰细节，4.2s 平滑拉远精确回正至 z=1.0 全局
      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [
        { at: 1.5, kind: 'push', k: 0.16, dur: 0.9, x: 960, y: 540 },
        { at: 4.2, kind: 'pull', z: 1.0, dur: 1.0, x: 960, y: 540 }
      ], lt);

      // 相机世界层：坐标系、连续波形与电位采样指示点
      CAM.with(c, cam, c => {
        // 绘制坐标系
        W.drawCoordinateSystem(c);

        // 0.0 - 0.9s 稳态正向电压波全场平滑渐入 (波峰始终严格以相速度 v = +250px/s 连续推进，杜绝波前速度误解)
        const introAlpha = MO.smooth(clamp(lt / 0.9));

        // 绘制蓝色正向行波曲线与半透明电压场能量阴影 (无缝覆盖传输线全域 [X_MIN, 0])
        W.drawWaveCurve(c, W.ui, t, W.PAL.blue, 4.5, null, introAlpha, 0, 'rgba(88, 196, 221, 0.22)');

        // 沿传输线离散电位采样指示点 (展示空间各点瞬时电位示数，随波形同步显现)
        if (introAlpha > 0.05) {
          W.drawVoltageIndicators(c, W.ui, t, W.PAL.white, 16, 0, introAlpha);
        }

        // 稳定传播方向箭头与相速度指示 (Y 轴避让统一至 yOffset = 220，与镜头 2 严格一致，带平滑显现)
        if (introAlpha > 0.1) {
          W.drawDirectionArrows(c, 1, t, W.PAL.blue, 220, introAlpha);
        }
      });

      // 屏幕固定 UI 层：数学公式与解说信息 (布局于 FORMULA 区域)
      const formAlpha = MO.smooth(MO.seg(lt, 0.4, 1.4));
      if (formAlpha > 0) {
        c.save();
        c.globalAlpha = formAlpha;

        // 行波特征标签
        c.font = `600 25px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
        c.fillStyle = W.PAL.blue;
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        c.fillText('正向入射电压波 (Incident Voltage Wave)', 100, 165);

        // 数学公式: u_i(x, t) = A cos(omega*t - beta*x)
        L.typesetMath(c, [
          { s: 'u', it: true, sub: 'i', col: W.PAL.blue },
          { s: '(', gap: 4 },
          { s: 'x', it: true, gap: 4 },
          { s: ',', gap: 6 },
          { s: 't', it: true, gap: 4 },
          { s: ')', gap: 14 },
          { s: '=', gap: 14 },
          { s: 'A', it: true, gap: 10 },
          { s: 'cos', gap: 6 },
          { s: '(', gap: 4 },
          { s: 'ω', it: true, gap: 4 },
          { s: 't', it: true, gap: 8 },
          { s: '−', gap: 8 },
          { s: 'β', it: true, gap: 4 },
          { s: 'x', it: true },
          { s: ')' }
        ], 100, 235, 46, { align: 'left', col: W.PAL.white });

        c.restore();
      }

      // 顶栏信息与角标
      W.drawHeader(c, '镜头 1/5 · 正向行波传播', '两列相反方向的波如何产生驻波？', W.PAL.white);

      // 底部教学说明卡片 (安全区 y < 910)
      W.drawBottomCard(
        c,
        '正向电压波沿传输线 (+x) 传播：稳态空间波长 λ = 500px，时间周期 T = 2.0s',
        '等相位面满足 ωt - βx = 常数，波峰以相速度 v = +ω/β = 250px/s 向右连续推进'
      );
    }
  };
})();

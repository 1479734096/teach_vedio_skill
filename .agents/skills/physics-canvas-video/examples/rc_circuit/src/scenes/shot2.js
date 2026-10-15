// 镜头 2 (6.0s - 12.0s)：充电动态演化与时间常数 tau (达到 63.2% 关键特征点)
(() => {
  const W = window.RC;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot2'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 演化时间：从 t = 0.2s 演化至 t = 2.5s (平滑跨越 t = tau = 1.0s 处)
      const chargeP = MO.smooth(clamp(lt / 5.5));
      const simT = lerp(0.2, 2.5, chargeP);

      const cam = CAM.track({ x: 960, y: 520, z: 1.0 }, [
        { at: 1.0, kind: 'push', k: 0.12, dur: 1.2, x: 1040, y: 500 },
        { at: 4.5, kind: 'pull', z: 1.0, dur: 1.0, x: 960, y: 520 }
      ], lt);

      CAM.with(c, cam, c => {
        // 绘制充电中回路
        W.drawRCCircuit(c, 960, 480, 880, 420, lt, { mode: 'charge', simT: simT });
      });

      // 屏幕固定 UI 层：当前动态数值表与 KVL 守恒等式
      const curVc = W.vCharge(simT);
      const curVr = W.vrCharge(simT);
      const curI = W.iCharge(simT);

      c.save();
      c.font = `600 24px "PuHui-Medium", sans-serif`;
      c.fillStyle = W.PAL.green;
      c.textAlign = 'left';
      c.fillText('第二阶段：电容器充电过渡过程与时间常数 τ = RC', 100, 150);

      // KVL 动态恒等式展示
      L.typesetMath(c, [
        { s: 'KVL 电压守恒:', col: W.PAL.white, gap: 10 },
        { s: 'v', it: true, sub: 'R', col: W.PAL.red },
        { s: '(', gap: 2 },
        { s: 't', it: true, gap: 2 },
        { s: ')', gap: 6 },
        { s: '+', gap: 6 },
        { s: 'v', it: true, sub: 'C', col: W.PAL.blue },
        { s: '(', gap: 2 },
        { s: 't', it: true, gap: 2 },
        { s: ')', gap: 6 },
        { s: '≡', col: W.PAL.yellow, gap: 6 },
        { s: 'V₀ = 10 V', col: W.PAL.white, gap: 20 },
        { s: `[实测: ${curVr.toFixed(2)}V + ${curVc.toFixed(2)}V = 10.00V]`, col: W.PAL.green, gap: 20 },
        { s: 'τ = R·C = 1.0 s', col: W.PAL.yellow }
      ], 100, 205, 36, { align: 'left', col: W.PAL.white });
      c.restore();

      // 顶栏与底栏
      W.drawHeader(c, '镜头 2/5 · 充电过渡与时间常数', 'RC 电路充放电过程——时间常数与能量动态转换');
      W.drawBottomCard(
        c,
        '充电过程遵循自然指数律：v_C(t) = V₀(1 − e^{−t/τ})，极板电荷累积减缓后续充电速率',
        '当 t = τ = 1.0 s 时，电容电压恰好上升至 V₀(1 − 1/e) ≈ 63.2% (6.32 V)，电流衰减至 36.8%'
      );
    }
  };
})();

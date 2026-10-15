// 镜头 3 (12.0s - 18.0s)：开关切换至触点 2，电源旁路，电容器零输入放电
(() => {
  const W = window.RC;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot3'] = {
    draw(c, lt, gt) {
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 放电演化时间：从 t = 0.0s 演化至 t = 3.0s
      const disP = MO.smooth(clamp(lt / 5.5));
      const simT = lerp(0.0, 3.0, disP);

      const cam = CAM.track({ x: 960, y: 520, z: 1.0 }, [
        { at: 1.0, kind: 'glide', x: 880, y: 490, dur: 1.0 },
        { at: 4.5, kind: 'to', x: 960, y: 520, z: 1.0, dur: 1.0 }
      ], lt);

      CAM.with(c, cam, c => {
        // 绘制放电中回路 (mode = 'discharge')
        W.drawRCCircuit(c, 960, 480, 880, 420, lt, { mode: 'discharge', simT: simT });
      });

      // 屏幕固定 UI 层：放电方程与反向电流
      const curVc = W.vDischarge(simT);
      const curI = W.iDischarge(simT);

      c.save();
      c.font = `600 24px "PuHui-Medium", sans-serif`;
      c.fillStyle = W.PAL.orange;
      c.textAlign = 'left';
      c.fillText('第三阶段：双掷开关切换 ⟶ 零输入放电响应 (Zero-Input Response)', 100, 150);

      L.typesetMath(c, [
        { s: '放电状态方程:', col: W.PAL.white, gap: 10 },
        { s: 'v', it: true, sub: 'C', col: W.PAL.blue },
        { s: '(', gap: 2 },
        { s: 't', it: true, gap: 2 },
        { s: ')', gap: 6 },
        { s: '=', gap: 6 },
        { s: 'V₀ · ', it: true, col: W.PAL.blue },
        { s: 'e', sup: '−t/τ', it: true, col: W.PAL.blue, gap: 20 },
        { s: 'i', it: true, col: W.PAL.red },
        { s: '(', gap: 2 },
        { s: 't', it: true, gap: 2 },
        { s: ')', gap: 6 },
        { s: '=', gap: 6 },
        { s: 'C d', it: true },
        { s: 'v', sub: 'C', it: true },
        { s: '/dt', it: true, gap: 6 },
        { s: '=', gap: 6 },
        { s: '−(V₀/R) · ', it: true, col: W.PAL.red },
        { s: 'e', sup: '−t/τ', it: true, col: W.PAL.red, gap: 20 },
        { s: '电流逆向流出极板', col: W.PAL.yellow }
      ], 100, 205, 36, { align: 'left', col: W.PAL.white });
      c.restore();

      // 顶栏与底栏
      W.drawHeader(c, '镜头 3/5 · 开关切换与反向放电', 'RC 电路充放电过程——时间常数与能量动态转换');
      W.drawBottomCard(
        c,
        '开关切至触点 2：直流电源被隔离，电容器作为独立储能元件向电阻 R 释放全部静电场能',
        '回路电流方向发生反向翻转；电场能量以焦耳热形式在电阻 R 上平滑耗散，电压电流均指数衰减至零'
      );
    }
  };
})();

// 镜头 4 (18.0s - 24.0s)：驻波持续振动，突出电压波节恒零、波腹 2A 周期振荡与能量局域化
(() => {
  const W = window.WAVE;
  const L = window.LAYOUT;
  const { clamp, lerp } = U;

  SCENES['shot4'] = {
    draw(c, lt, gt) {
      const t = lt + 18.0; // 连续物理时间
      c.fillStyle = W.PAL.bg;
      c.fillRect(0, 0, 1920, 1080);

      // 相机动作表：1.0s 横移观察波腹，2.5s 横移观察波节，4.5s 恢复全貌 (z=1.0)
      const cam = CAM.track({ x: 960, y: 540, z: 1.0 }, [
        { at: 1.0, kind: 'glide', x: 1040, y: 540, dur: 0.8 },
        { at: 2.5, kind: 'glide', x: 880, y: 540, dur: 0.8 },
        { at: 4.5, kind: 'to', x: 960, y: 540, z: 1.0, dur: 0.9 }
      ], lt);

      // 相机世界层：坐标系、包络线、驻波曲线、波节与波腹
      CAM.with(c, cam, c => {
        // 绘制坐标系
        W.drawCoordinateSystem(c);

        // 绘制空间包络线 (正负振幅包络 +/- 2A |cos(beta*x)|，永不随时间移动)
        c.save();
        c.setLineDash([5, 5]);
        c.lineWidth = 1.8;
        c.strokeStyle = 'rgba(131, 193, 103, 0.55)';

        window.auditTag(c,'wave.upper',{model:'wave_upper',origin:[W.X0,W.Y0]});
        // 上包络
        c.beginPath();
        for (let i = 0; i <= 300; i++) {
          const x = W.X_MIN + (0 - W.X_MIN) * (i / 300);
          const envY = 2 * W.A * Math.abs(Math.cos(W.BETA * x));
          const sx = W.toScrX(x);
          const sy = W.toScrY(envY);
          if (i === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
        }
        c.stroke();

        window.auditTag(c,'wave.lower',{model:'wave_lower',origin:[W.X0,W.Y0]});
        // 下包络
        c.beginPath();
        for (let i = 0; i <= 300; i++) {
          const x = W.X_MIN + (0 - W.X_MIN) * (i / 300);
          const envY = -2 * W.A * Math.abs(Math.cos(W.BETA * x));
          const sx = W.toScrX(x);
          const sy = W.toScrY(envY);
          if (i === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
        }
        c.stroke();
        window.auditTag(c,null);
        c.restore();

        // 绘制绿色驻波实时振动曲线 (带半透明绿色电压场阴影)
        W.drawWaveCurve(c, W.uStand, t, W.PAL.green, 5.5, null, 1.0, 0, 'rgba(46, 213, 115, 0.22)');

        // 沿线电位采样指示点
        W.drawVoltageIndicators(c, W.uStand, t, W.PAL.green, 20, 0);

        // 突出电压波节 (Nodes): 瞬时电压恒为0
        // 条件: cos(beta * x) = 0 => x = -lambda/4, -3lambda/4, -5lambda/4, -7lambda/4
        const nodes = [-W.LAMBDA * 0.25, -W.LAMBDA * 0.75, -W.LAMBDA * 1.25, -W.LAMBDA * 1.75];
        nodes.forEach((nx, idx) => {
          const sx = W.toScrX(nx);
          const sy = W.toScrY(0);

          // 黄色实心小圆圈 + 警戒光圈
          window.auditTag(c,'wave.node',{model:'wave_node_dot',origin:[W.X0,W.Y0]});
          DG.neuron(c, sx, sy, 9, 1.0, {
            fill: W.PAL.yellow,
            stroke: '#FFFFFF',
            lw: 2.2
          });
          window.auditTag(c,null);

          // 标注仅在最靠近终端的第一个波节处清晰引出，严格避让坐标轴刻度与 +A
          if (idx === 0) {
            c.save();
            c.font = `600 20px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
            const badgeTxt = '电压波节 u ≡ 0 (完全相消)';
            const bWidth = c.measureText(badgeTxt).width;
            const bX = sx - 15;
            const bY = sy - 48;

            c.fillStyle = 'rgba(25, 25, 10, 0.88)';
            c.strokeStyle = W.PAL.yellow;
            c.lineWidth = 1.5;
            c.beginPath();
            c.roundRect(bX - bWidth / 2 - 10, bY - 16, bWidth + 20, 32, 6);
            c.fill();
            c.stroke();

            c.fillStyle = W.PAL.yellow;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText(badgeTxt, bX, bY);

            // 指向折线
            c.strokeStyle = W.PAL.yellow;
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(bX, bY + 16);
            c.lineTo(sx, sy - 11);
            c.stroke();
            c.restore();
          }
        });

        // 突出电压波腹 (Antinodes): 振荡最大点
        // 条件: |cos(beta * x)| = 1 => x = 0, -lambda/2, -lambda, -3lambda/2, -2lambda
        const antinodes = [0, -W.LAMBDA * 0.5, -W.LAMBDA, -W.LAMBDA * 1.5, -W.LAMBDA * 2.0];
        antinodes.forEach((ax, idx) => {
          const sx = W.toScrX(ax);
          const curU = W.uStand(ax, t);
          const sy = W.toScrY(curU);

          // 绿色高亮电位核
          DG.neuron(c, sx, sy, 8, 1.0, {
            fill: W.PAL.green,
            stroke: '#FFFFFF',
            lw: 2.0
          });

          // 垂直振幅范围双向测量箭头 (在 x = -lambda 处标明 2A 振幅)
          if (idx === 2) {
            c.save();
            c.strokeStyle = W.PAL.green;
            c.lineWidth = 2.5;
            const yTop = W.toScrY(2 * W.A);
            const yBot = W.toScrY(-2 * W.A);

            c.beginPath();
            c.moveTo(sx - 45, yTop);
            c.lineTo(sx - 45, yBot);
            c.stroke();

            // 上下箭头尖
            c.fillStyle = W.PAL.green;
            c.beginPath();
            c.moveTo(sx - 45, yTop - 4); c.lineTo(sx - 51, yTop + 10); c.lineTo(sx - 39, yTop + 10); c.fill();
            c.beginPath();
            c.moveTo(sx - 45, yBot + 4); c.lineTo(sx - 51, yBot - 10); c.lineTo(sx - 39, yBot - 10); c.fill();

            // 标注卡片保持与包络的充足间隙
            c.font = `600 20px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
            c.fillStyle = W.PAL.green;
            c.textAlign = 'right';
            c.textBaseline = 'middle';
            c.fillText('波腹电压振幅 2A', sx - 58, W.Y0 - 45);
            c.restore();
          }
        });
      }); // end CAM.with

      // 屏幕固定 UI 层：顶栏公式与解说
      c.save();
      // 公式
      L.typesetMath(c, [
        { s: 'u', it: true, col: W.PAL.green },
        { s: '=', gap: 10 },
        { s: '2', gap: 2 },
        { s: 'A', it: true, gap: 12 },
        { s: 'cos', col: W.PAL.yellow, gap: 4 },
        { s: '(', col: W.PAL.yellow, gap: 4 },
        { s: 'β', it: true, col: W.PAL.yellow, gap: 4 },
        { s: 'x', it: true, col: W.PAL.yellow, gap: 4 },
        { s: ')', col: W.PAL.yellow, gap: 12 },
        { s: 'cos', col: W.PAL.green, gap: 4 },
        { s: '(', col: W.PAL.green, gap: 4 },
        { s: 'ω', it: true, col: W.PAL.green, gap: 4 },
        { s: 't', it: true, col: W.PAL.green, gap: 4 },
        { s: ')', col: W.PAL.green }
      ], 100, 220, 42, { align: 'left', col: W.PAL.white });

      // 驻波特质对比标签
      c.font = `600 22px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
      c.fillStyle = W.PAL.yellow;
      c.fillText('● 电压波节 (Nodes)：cos(βx) = 0 处瞬时电压恒为 0，能量转换为纯磁能 (电流极大)', 100, 160);
      c.fillStyle = W.PAL.green;
      c.fillText('● 电压波腹 (Antinodes)：cos(βx) = ±1 处以峰值 2A 周期振荡，能量转换为纯电能 (电流为0)', 100, 280);
      c.restore();

      // 顶栏信息与角标
      W.drawHeader(c, '镜头 4/5 · 节点静止波腹', '两列相反方向的波如何产生驻波？', W.PAL.white);

      // 底部教学说明卡片 (安全区 y < 910)
      W.drawBottomCard(
        c,
        '驻波最显著的电磁特征：波形不再沿空间推进，能量被局域在相邻波节之间',
        '波节处两列波反相完全相消；波腹处两列波同相叠加；全线呈现原位呼吸谐振与能量无损交换'
      );
    }
  };
})();

// =========================================================================
// physics_common.js: 通用物理与数学 Canvas 2D 教学动画组件库
// 规范：1920x1080 空间基准、单一物理真实来源、AABB 区域避让、零跳变动态指示
// =========================================================================
(() => {
  const { clamp, lerp } = U || {
    clamp: (v, min = 0, max = 1) => Math.min(Math.max(v, min), max),
    lerp: (a, b, t) => a + (b - a) * t
  };
  const DG_REF = window.DG || {};
  const LAYOUT = window.LAYOUT || {};

  // 默认经典调色体系 (3Blue1Brown 语义色彩 + 高对比度深色黑板底)
  const DEFAULT_PALETTE = {
    bg: '#0F141D',          // 科技黑板深灰蓝底
    cardBg: 'rgba(23, 31, 45, 0.90)',
    cardBorder: 'rgba(255, 255, 255, 0.18)',
    axis: '#888888',
    grid: 'rgba(255, 255, 255, 0.08)',
    textMain: '#FFFFFF',
    textMuted: '#A0AEC0',
    blue: '#58C4DD',        // 正向/电场/原函数
    red: '#FC6255',         // 反向/磁场/翻转函数
    green: '#2ED573',       // 叠加/总能量/卷积结果
    yellow: '#FFFF00',      // 关键特征/波节/波腹/重合区
    orange: '#FF9F43'       // 核心公式外框/高亮板书笔迹
  };

  // 全局物理遥测系统
  window.__telemetry = window.__telemetry || {
    enabled: true,
    currentFrame: null,
    frames: []
  };

  window.enableTelemetry = function(enable = true) {
    window.__telemetry.enabled = enable;
    if (enable) window.__telemetry.frames = [];
  };

  window.recordTelemetryFrame = function(t) {
    if (!window.__telemetry || !window.__telemetry.enabled) return;
    const frame = {
      t: t,
      tracked_objects: [],
      text_boxes: [],
      physics_state: {}
    };
    window.__telemetry.currentFrame = frame;
    window.__telemetry.frames.push(frame);
    return frame;
  };

  window.getTelemetryData = function() {
    return window.__telemetry ? window.__telemetry.frames : [];
  };

  class PhysicsCanvasKit {
    constructor(config = {}) {
      this.cfg = config;
      this.pal = Object.assign({}, DEFAULT_PALETTE, config.palette || {});
      this.X0 = config.originX || 960;
      this.Y0 = config.originY || 540;
      this.scaleX = config.scaleX || 1.0;
      this.scaleY = config.scaleY || 1.0;
    }

    // 遥测数据上报助手
    recordObject(obj) {
      if (window.__telemetry && window.__telemetry.enabled && window.__telemetry.currentFrame) {
        window.__telemetry.currentFrame.tracked_objects.push(obj);
      }
    }

    recordTextBox(box) {
      if (window.__telemetry && window.__telemetry.enabled && window.__telemetry.currentFrame) {
        window.__telemetry.currentFrame.text_boxes.push(box);
      }
    }

    recordPhysicsState(state) {
      if (window.__telemetry && window.__telemetry.enabled && window.__telemetry.currentFrame) {
        Object.assign(window.__telemetry.currentFrame.physics_state, state);
      }
    }

    // 坐标映射
    toScrX(x) { return this.X0 + x * this.scaleX; }
    toScrY(y) { return this.Y0 - y * this.scaleY; }
    toWorldX(sx) { return (sx - this.X0) / this.scaleX; }
    toWorldY(sy) { return (this.Y0 - sy) / this.scaleY; }

    // 1. 通用坐标系绘制
    drawCoordinateSystem(ctx, opt = {}) {
      ctx.save();
      const xMin = opt.xMin != null ? opt.xMin : -800;
      const xMax = opt.xMax != null ? opt.xMax : 800;
      const yMin = opt.yMin != null ? opt.yMin : -250;
      const yMax = opt.yMax != null ? opt.yMax : 250;
      const xLabel = opt.xLabel || 'x';
      const yLabel = opt.yLabel || 'y';

      const sxMin = this.toScrX(xMin);
      const sxMax = this.toScrX(xMax);
      const syMin = this.toScrY(yMin);
      const syMax = this.toScrY(yMax);

      // 背景网格线 (水平)
      if (opt.yTicks) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.pal.grid;
        opt.yTicks.forEach(tk => {
          const sy = this.toScrY(tk.val);
          ctx.beginPath();
          ctx.moveTo(sxMin - 15, sy);
          ctx.lineTo(sxMax + 15, sy);
          ctx.stroke();
        });
      }

      // 背景网格虚线 (垂直)
      if (opt.xTicks) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.setLineDash([4, 6]);
        opt.xTicks.forEach(tk => {
          const sx = this.toScrX(tk.val);
          ctx.beginPath();
          ctx.moveTo(sx, syMin);
          ctx.lineTo(sx, syMax);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }

      // X 轴基线
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = this.pal.axis;
      ctx.beginPath();
      ctx.moveTo(sxMin - 20, this.Y0);
      ctx.lineTo(sxMax + 25, this.Y0);
      ctx.stroke();

      // X 轴箭头
      ctx.fillStyle = this.pal.axis;
      ctx.beginPath();
      ctx.moveTo(sxMax + 35, this.Y0);
      ctx.lineTo(sxMax + 18, this.Y0 - 6);
      ctx.lineTo(sxMax + 18, this.Y0 + 6);
      ctx.closePath();
      ctx.fill();

      // Y 轴基线
      ctx.beginPath();
      ctx.moveTo(this.X0, syMin + 20);
      ctx.lineTo(this.X0, syMax - 25);
      ctx.stroke();

      // Y 轴箭头
      ctx.beginPath();
      ctx.moveTo(this.X0, syMax - 35);
      ctx.lineTo(this.X0 - 6, syMax - 18);
      ctx.lineTo(this.X0 + 6, syMax - 18);
      ctx.closePath();
      ctx.fill();

      // 轴标签
      ctx.font = `italic 22px "CMU-it", "Times New Roman", serif`;
      ctx.fillStyle = this.pal.textMain;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(xLabel, sxMax + 42, this.Y0);
      ctx.textAlign = 'right';
      ctx.fillText(yLabel, this.X0 - 15, syMax - 28);

      // X 刻度线与文字
      if (opt.xTicks) {
        opt.xTicks.forEach(tk => {
          const sx = this.toScrX(tk.val);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = this.pal.axis;
          ctx.beginPath();
          ctx.moveTo(sx, this.Y0 - 5);
          ctx.lineTo(sx, this.Y0 + 5);
          ctx.stroke();

          ctx.font = `18px "CMU-rm", "Times New Roman", serif`;
          ctx.fillStyle = this.pal.textMuted;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(tk.label != null ? tk.label : String(tk.val), sx, this.Y0 + 10);
        });
      }

      // Y 刻度线与文字
      if (opt.yTicks) {
        opt.yTicks.forEach(tk => {
          const sy = this.toScrY(tk.val);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = this.pal.axis;
          ctx.beginPath();
          ctx.moveTo(this.X0 - 5, sy);
          ctx.lineTo(this.X0 + 5, sy);
          ctx.stroke();

          ctx.font = `18px "CMU-rm", "Times New Roman", serif`;
          ctx.fillStyle = this.pal.textMuted;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(tk.label != null ? tk.label : String(tk.val), this.X0 - 10, sy);
        });
      }

      ctx.restore();
    }

    // 2. 连续采样数学函数曲线
    drawContinuousCurve(ctx, fn, opt = {}) {
      const xStart = opt.xStart != null ? opt.xStart : -800;
      const xEnd = opt.xEnd != null ? opt.xEnd : 800;
      const steps = opt.steps || 300;
      const col = opt.color || this.pal.blue;
      const lw = opt.lineWidth || 3.5;
      const dash = opt.dash || null;
      const alpha = opt.alpha != null ? opt.alpha : 1.0;
      const fillStyle = opt.fillStyle || null;

      if (alpha <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = (ctx.globalAlpha || 1.0) * alpha;

      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const x = xStart + (xEnd - xStart) * (i / steps);
        const yVal = fn(x);
        pts.push([this.toScrX(x), this.toScrY(yVal)]);
      }

      // 面积阴影填充 (体现积分/势能/电荷分布)
      if (fillStyle && pts.length > 0) {
        ctx.save();
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], this.Y0);
        for (let i = 0; i <= steps; i++) {
          ctx.lineTo(pts[i][0], pts[i][1]);
        }
        ctx.lineTo(pts[steps][0], this.Y0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 曲线描边
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (dash) ctx.setLineDash(dash); else ctx.setLineDash([]);

      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
        else ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 3. 沿轴离散电位/场强采样指示点 (避免机械介质质点误解)
    drawDiscreteProbes(ctx, fn, opt = {}) {
      const xStart = opt.xStart != null ? opt.xStart : -800;
      const xEnd = opt.xEnd != null ? opt.xEnd : 800;
      const num = opt.num || 16;
      const col = opt.color || '#FFFFFF';
      const alpha = opt.alpha != null ? opt.alpha : 1.0;
      const radius = opt.radius || 5.0;

      if (alpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = (ctx.globalAlpha || 1.0) * alpha;

      for (let i = 0; i <= num; i++) {
        const x = xStart + (xEnd - xStart) * (i / num);
        const yVal = fn(x);
        const sx = this.toScrX(x);
        const sy = this.toScrY(yVal);

        // 垂直参考引导线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(sx, this.Y0);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.setLineDash([]);

        // 采样点圆核
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. 世界坐标绝对锚定的谐振流动指示箭头 (彻底消除取模瞬移跳变)
    drawHarmonicFlow(ctx, anchors, opt = {}) {
      const dir = opt.dir != null ? opt.dir : 1;
      const t = opt.t || 0;
      const col = opt.color || this.pal.blue;
      const yOffset = opt.yOffset || 180;
      const alpha = opt.alpha != null ? opt.alpha : 1.0;
      const len = (opt.length || 46) * dir;
      const cy = this.Y0 - yOffset;
      const omega = opt.omega || Math.PI;
      const beta = opt.beta || (2 * Math.PI / 500);

      if (alpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = (ctx.globalAlpha || 1.0) * alpha;

      anchors.forEach((ax, idx) => {
        const cx = this.toScrX(ax);

        // 连续相位谐振呼吸
        const phase = omega * t - dir * beta * ax;
        const pulse = 0.72 + 0.28 * Math.cos(phase);

        // 遥测对象跟踪
        this.recordObject({
          id: (opt.idPrefix || 'flow_arrow_') + idx,
          type: 'arrow',
          t: t,
          screen_x: cx,
          screen_y: cy,
          world_x: ax,
          world_y: -yOffset,
          vx: 0,
          vy: 0,
          phase: phase,
          pulse: pulse
        });

        // 兼容原有的跟踪接口
        if (window.__qa_record_tracking && Array.isArray(window.__qa_tracked_objects)) {
          window.__qa_tracked_objects.push({
            id: (opt.idPrefix || 'flow_arrow_') + idx,
            world_x: cx,
            world_y: cy,
            ax: ax,
            phase: phase,
            pulse: pulse
          });
        }

        ctx.save();
        ctx.globalAlpha = ctx.globalAlpha * pulse;

        // 箭头主杆
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - len / 2, cy);
        ctx.lineTo(cx + len / 2, cy);
        ctx.stroke();

        // 箭头尖端
        ctx.beginPath();
        ctx.moveTo(cx + len / 2, cy);
        ctx.lineTo(cx + len / 2 - dir * 12, cy - 6);
        ctx.lineTo(cx + len / 2 - dir * 12, cy + 6);
        ctx.closePath();
        ctx.fill();

        // 内部连续平滑微纹理 (滚动周期自封闭)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([7, 5]);
        ctx.lineDashOffset = -dir * ((t * 70) % 12);
        ctx.beginPath();
        ctx.moveTo(cx - len / 2 + dir * 4, cy);
        ctx.lineTo(cx + len / 2 - dir * 11, cy);
        ctx.stroke();

        ctx.restore();
      });

      if (opt.label) {
        ctx.font = `600 22px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = col;
        const lx = opt.labelX != null ? this.toScrX(opt.labelX) : 960;
        ctx.fillText(opt.label, lx, cy - 20);
        this.recordTextBox({
          id: (opt.idPrefix || 'flow_arrow_') + 'label',
          text: opt.label,
          zone: 'ANNOTATION',
          bbox: [lx - 100, cy - 40, lx + 100, cy - 5]
        });
      }

      ctx.restore();
    }

    // 5. 顶栏信息与镜头角标 (对齐 HeaderZone)
    drawHeader(ctx, badge, titleText, titleCol = null) {
      this.recordTextBox({
        id: 'header_badge',
        text: badge,
        zone: 'HEADER',
        bbox: [1600, 48, 1840, 80]
      });
      this.recordTextBox({
        id: 'header_title',
        text: titleText,
        zone: 'HEADER',
        bbox: [80, 40, 1500, 85]
      });

      ctx.save();
      // 右上角镜头角标
      ctx.font = `600 24px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
      ctx.fillStyle = this.pal.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(badge, 1840, 72);

      // 左上角主题标题
      ctx.font = `700 38px "PuHui-Bold", "NotoSansSC-700", sans-serif`;
      ctx.fillStyle = titleCol || this.pal.textMain;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(titleText, 80, 75);

      // 分割线
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.beginPath();
      ctx.moveTo(80, 102);
      ctx.lineTo(1840, 102);
      ctx.stroke();
      ctx.restore();
    }

    // 6. 底部教学说明卡片 (位于 y: [815, 907]，严格避让字幕带 y > 920，且留足图形余量)
    drawBottomCard(ctx, note, sub = '') {
      const boxX = 200, boxY = 815, boxW = 1520, boxH = 92;
      this.recordTextBox({
        id: 'bottom_card_box',
        text: note + (sub ? ' | ' + sub : ''),
        zone: 'BOTTOM_CARD',
        bbox: [boxX, boxY, boxX + boxW, boxY + boxH]
      });

      ctx.save();
      ctx.fillStyle = this.pal.cardBg;
      ctx.strokeStyle = this.pal.cardBorder;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = `600 24px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
      ctx.fillStyle = this.pal.textMain;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note, 960, boxY + 32);

      if (sub) {
        ctx.font = `18px "PuHui-Medium", "NotoSansSC-500", sans-serif`;
        ctx.fillStyle = this.pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sub, 960, boxY + 66);
      }
      ctx.restore();
    }

    // 7. 高对比度白板/板书手绘马克笔 (象牙白高对比度笔身 + 亮色墨水笔尖)
    drawMarkerHand(ctx, penX, penY, opt = {}) {
      const inkColor = opt.inkColor || this.pal.orange;
      const angle = opt.angle != null ? opt.angle : 0.38;

      this.recordObject({
        id: opt.id || 'marker_hand',
        type: 'marker_hand',
        screen_x: penX,
        screen_y: penY,
        inkColor: inkColor,
        penBodyColor: '#F8FAFC'
      });

      ctx.save();
      ctx.translate(penX, penY);
      ctx.rotate(angle);

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

      // 鲜亮彩色笔尖
      ctx.fillStyle = inkColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
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

      // 笔身主体 (象牙白，对比度 >10:1)
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.roundRect(-8, 26, 16, 92, 2);
      ctx.fill();
      ctx.stroke();

      // 笔身金属阴影
      ctx.fillStyle = 'rgba(148, 163, 184, 0.40)';
      ctx.fillRect(2, 26, 6, 92);

      // 色彩识别环
      ctx.fillStyle = inkColor;
      ctx.fillRect(-8, 52, 16, 14);
      ctx.strokeRect(-8, 52, 16, 14);

      // 手掌与手臂
      ctx.fillStyle = '#E2AC96';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.ellipse(8, 72, 24, 18, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(4, 68, 7, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // 前臂延伸
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
  }

  window.PhysicsCanvasKit = PhysicsCanvasKit;
})();

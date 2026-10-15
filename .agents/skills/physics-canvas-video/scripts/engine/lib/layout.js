// Canvas 2D 自动化布局与排版避让引擎 (Layout & Typography Engine)
// 为物理科普动画提供真实字体度量、多层区域规划、公式基线排版与防遮挡检测
(() => {
  const LAYOUT = window.LAYOUT = {};

  // 1. 标准屏幕区域划分 (1920x1080)
  LAYOUT.ZONES = {
    HEADER: { x: 80, y: 20, w: 1760, h: 90, name: '标题区' },
    FORMULA: { x: 80, y: 125, w: 820, h: 220, name: '公式区' },
    ANNOTATION: { x: 920, y: 125, w: 920, h: 220, name: '说明区' },
    GRAPH: { x: 60, y: 350, w: 1800, h: 440, name: '图形波形区' },
    BOTTOM_CARD: { x: 200, y: 810, w: 1520, h: 95, name: '底部说明区' },
    SUBTITLE_SAFE: { x: 0, y: 920, w: 1920, h: 160, name: '字幕保留安全带' }
  };

  // 2. 真实文字与几何包围盒计算 (AABB)
  class AABB {
    constructor(x0, y0, x1, y1) {
      this.x0 = Math.min(x0, x1);
      this.y0 = Math.min(y0, y1);
      this.x1 = Math.max(x0, x1);
      this.y1 = Math.max(y0, y1);
    }
    get x() { return this.x0; }
    get y() { return this.y0; }
    get w() { return Math.max(0, this.x1 - this.x0); }
    get h() { return Math.max(0, this.y1 - this.y0); }

    intersects(other, pad = 0) {
      return !(
        this.x1 + pad <= other.x0 - pad ||
        this.x0 - pad >= other.x1 + pad ||
        this.y1 + pad <= other.y0 - pad ||
        this.y0 - pad >= other.y1 + pad
      );
    }

    intersectionArea(other) {
      const ix0 = Math.max(this.x0, other.x0);
      const iy0 = Math.max(this.y0, other.y0);
      const ix1 = Math.min(this.x1, other.x1);
      const iy1 = Math.min(this.y1, other.y1);
      if (ix1 <= ix0 || iy1 <= iy0) return 0;
      return (ix1 - ix0) * (iy1 - iy0);
    }

    pad(px, py = px) {
      return new AABB(this.x0 - px, this.y0 - py, this.x1 + px, this.y1 + py);
    }
  }
  LAYOUT.AABB = AABB;

  // 3. 字体加载与字符预热 (确保度量精准且首帧冷渲染/热渲染 100% 确定性)
  let fontsReadyPromise = null;
  LAYOUT.ensureFontsReady = async function () {
    if (fontsReadyPromise) return fontsReadyPromise;
    fontsReadyPromise = (async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      // 预热常用汉字与符号光栅化缓存，彻底消除 Chromium 首帧冷启动字形未光栅化导致的确定性 DIFF
      const cv = document.createElement('canvas');
      cv.width = 128; cv.height = 128;
      const ctx = cv.getContext('2d');
      const warmGlyphs = '0123456789+-=λμβωπΓΔφcosuiurx2At正向入射波反射波合成驻波开路终端节点波腹振幅周期速度能量局域';
      const testFonts = [
        '24px "NotoSansSC-500", "PuHui-Medium", sans-serif',
        '24px "LXGWWenKai-500", sans-serif',
        '36px "CMU-rm", "CMU-it", serif'
      ];
      for (const f of testFonts) {
        ctx.font = f;
        ctx.fillText(warmGlyphs, 0, 50);
      }
    })();
    return fontsReadyPromise;
  };

  // 4. 高精度文本测量 (包含真实的实际边界上下伸出)
  LAYOUT.measureTextBounds = function (ctx, text, x, y, font, align = 'left', baseline = 'alphabetic') {
    ctx.save();
    if (font) ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    const m = ctx.measureText(text);

    let x0, x1, y0, y1;
    // 使用 actualBoundingBox，如果浏览器不支持则按字号近似
    if (m.actualBoundingBoxAscent != null && m.actualBoundingBoxDescent != null) {
      if (align === 'center') {
        const half = m.width / 2;
        x0 = x - half;
        x1 = x + half;
      } else if (align === 'right') {
        x0 = x - m.width;
        x1 = x;
      } else {
        x0 = x;
        x1 = x + m.width;
      }
      y0 = y - m.actualBoundingBoxAscent;
      y1 = y + m.actualBoundingBoxDescent;
    } else {
      const fontSize = parseFloat(ctx.font) || 20;
      x0 = align === 'center' ? x - m.width / 2 : align === 'right' ? x - m.width : x;
      x1 = x0 + m.width;
      y0 = y - fontSize * 0.85;
      y1 = y + fontSize * 0.25;
    }
    ctx.restore();
    return new AABB(x0, y0, x1, y1);
  };

  // 5. 自动换行多行文本排版与边界计算
  LAYOUT.wrapText = function (ctx, text, maxWidth, font) {
    ctx.save();
    if (font) ctx.font = font;
    const lines = [];
    let currentLine = '';

    const chars = [...text];
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === '\n') {
        lines.push(currentLine);
        currentLine = '';
        continue;
      }
      const testLine = currentLine + ch;
      const w = ctx.measureText(testLine).width;
      if (w > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = ch;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    ctx.restore();
    return lines;
  };

  // 6. 多行文本卡片渲染与边界返回
  LAYOUT.drawTextBox = function (ctx, opt) {
    const {
      text, x, y, maxWidth, lineHeight, font, color,
      align = 'left', baseline = 'top', alpha = 1.0
    } = opt;

    ctx.save();
    ctx.globalAlpha = alpha;
    if (font) ctx.font = font;
    if (color) ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    const lines = Array.isArray(text) ? text : LAYOUT.wrapText(ctx, text, maxWidth, font);
    const lh = lineHeight || (parseFloat(font) * 1.38 || 28);

    let minX = Infinity, maxX = -Infinity;
    let minY = y, maxY = y + lines.length * lh;

    lines.forEach((line, idx) => {
      const curY = y + idx * lh;
      ctx.fillText(line, x, curY);
      const b = LAYOUT.measureTextBounds(ctx, line, x, curY, font, align, baseline);
      minX = Math.min(minX, b.x0);
      maxX = Math.max(maxX, b.x1);
    });

    ctx.restore();
    return new AABB(minX, minY, maxX, maxY);
  };

  // 7. 相机空间到屏幕空间的实际几何投影
  LAYOUT.worldToScreenBox = function (cam, worldAABB) {
    if (!window.CAM) return worldAABB;
    const p1 = CAM.toScreen(cam, worldAABB.x0, worldAABB.y0);
    const p2 = CAM.toScreen(cam, worldAABB.x1, worldAABB.y0);
    const p3 = CAM.toScreen(cam, worldAABB.x0, worldAABB.y1);
    const p4 = CAM.toScreen(cam, worldAABB.x1, worldAABB.y1);
    const xs = [p1[0], p2[0], p3[0], p4[0]];
    const ys = [p1[1], p2[1], p3[1], p4[1]];
    return new AABB(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
  };

  // 8. 避让重排器 (Collision Avoidance Resolver)
  // 当 candidate 与已有障碍物发生重叠时，按照预设避让方向（优先上下、其次左右）移动，而非缩放字号
  LAYOUT.avoid = function (candidate, obstacles, preference = 'up', step = 15, maxSteps = 12) {
    let cur = new AABB(candidate.x0, candidate.y0, candidate.x1, candidate.y1);
    let steps = 0;
    while (steps < maxSteps) {
      const hit = obstacles.find(obs => cur.intersects(obs, 4));
      if (!hit) return cur;
      if (preference === 'up') cur = new AABB(cur.x0, cur.y0 - step, cur.x1, cur.y1 - step);
      else if (preference === 'down') cur = new AABB(cur.x0, cur.y0 + step, cur.x1, cur.y1 + step);
      else if (preference === 'right') cur = new AABB(cur.x0 + step, cur.y0, cur.x1 + step, cur.y1);
      else cur = new AABB(cur.x0 - step, cur.y0, cur.x1 - step, cur.y1);
      steps++;
    }
    return cur;
  };

  // 9. 独立数学公式排版系统 (支持 Greek、基线对齐、字形回退与上下标)
  LAYOUT.typesetMath = function (ctx, tokens, x, y, size, opt = {}) {
    const {
      align = 'left', col = '#FFFFFF', alpha = 1.0,
      greekCol = null, varCol = null
    } = opt;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    // 字体配置
    const mainFont = `${size}px "CMU-rm", "Times New Roman", serif`;
    const itFont = `italic ${size}px "CMU-it", "Times New Roman", serif`;
    const zhFont = `${size * 0.9}px "NotoSansSC-500", "PuHui-Medium", sans-serif`;
    const subFont = `${size * 0.62}px "CMU-rm", "Times New Roman", serif`;

    // 预计算总宽度
    let totalW = 0;
    const layouts = tokens.map(tk => {
      const isZh = /[^\x00-\x7f]/.test(tk.s);
      ctx.font = isZh ? zhFont : tk.it ? itFont : mainFont;
      const mw = ctx.measureText(tk.s).width;
      let subW = 0, supW = 0;
      if (tk.sub) {
        ctx.font = subFont;
        subW = ctx.measureText(tk.sub).width + size * 0.04;
      }
      if (tk.sup) {
        ctx.font = subFont;
        supW = ctx.measureText(tk.sup).width + size * 0.04;
      }
      const tokenW = mw + Math.max(subW, supW);
      const gap = tk.gap != null ? tk.gap : (size * 0.06);
      const res = { tk, mw, subW, supW, tokenW, xOffset: totalW, isZh };
      totalW += tokenW + gap;
      return res;
    });

    const startX = align === 'center' ? x - totalW / 2 : align === 'right' ? x - totalW : x;

    // 渲染每个 token
    layouts.forEach(l => {
      const curX = startX + l.xOffset;
      const tk = l.tk;
      const itemCol = tk.col || (/[α-ωΑ-Ω]/.test(tk.s) && greekCol ? greekCol : tk.it && varCol ? varCol : col);
      ctx.fillStyle = itemCol;

      ctx.font = l.isZh ? zhFont : tk.it ? itFont : mainFont;
      ctx.fillText(tk.s, curX, y);

      if (tk.sub) {
        ctx.font = subFont;
        ctx.fillStyle = tk.subCol || itemCol;
        ctx.fillText(tk.sub, curX + l.mw + size * 0.02, y + size * 0.22);
      }
      if (tk.sup) {
        ctx.font = subFont;
        ctx.fillStyle = tk.supCol || itemCol;
        ctx.fillText(tk.sup, curX + l.mw + size * 0.02, y - size * 0.42);
      }
    });

    ctx.restore();
    return new AABB(startX, y - size * 0.88, startX + totalW, y + size * 0.32);
  };

  // 10. 白板机械手与笔身包围盒计算与动态遮挡检测
  LAYOUT.getHandAABB = function (penX, penY, angle = 0.35) {
    // 根据马克笔手柄与手臂几何推导屏幕 AABB
    // 笔尖在 (penX, penY)，手掌与前臂沿斜向延伸
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const pts = [
      [0, 0],
      [-12, 114],
      [14, 114],
      [24, 70],
      [140, 240],
      [80, 270],
      [-10, 95]
    ].map(([px, py]) => [
      penX + px * cosA - py * sinA,
      penY + px * sinA + py * cosA
    ]);
    const xs = pts.map(p => p[0]);
    const ys = pts.map(p => p[1]);
    return new AABB(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
  };

  // 检测笔与手是否遮挡了指定的核心文本区域
  LAYOUT.isHandOccluding = function (penX, penY, targetAABBs) {
    const handBox = LAYOUT.getHandAABB(penX, penY);
    for (const box of targetAABBs) {
      if (handBox.intersects(box, 8)) {
        return { occluded: true, handBox, targetBox: box };
      }
    }
    return { occluded: false, handBox };
  };

})();

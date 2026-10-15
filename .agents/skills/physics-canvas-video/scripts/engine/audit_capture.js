// 在实际绘制调用中收集证据，离屏文字随 drawImage 的仿射变换传入主画布。
(() => {
  window.auditFrames = [];
  let active = false, current = null;
  let textGroup = null, groupSerial = 0;
  const proto = CanvasRenderingContext2D.prototype;
  const point = (T, x, y) => [T.a*x + T.c*y + T.e, T.b*x + T.d*y + T.f];
  window.auditBegin = t => {
    if (window.LAYOUT && !window.LAYOUT.__auditGrouped) {
      const typeset = window.LAYOUT.typesetMath;
      window.LAYOUT.typesetMath = function(...args) {
        const prior = textGroup; textGroup = 'formula_' + (++groupSerial);
        try { return typeset.apply(this,args); } finally { textGroup = prior; }
      };
      window.LAYOUT.__auditGrouped = true;
    }
    active = true;
    current = {t, frame_index: window.auditFrames.length, physics: [], primitives: []};
    window.auditFrames.push(current);
  };
  window.auditPhysics = (kind, data) => {
    if (active && current) current.physics.push({kind, ...data});
  };
  window.auditEnd = () => {
    const boxes = window.__canvas.__auditBoxes || [];
    current.text_boxes = boxes.filter(b => b.alpha > 0.05);
    current.legacy = window.__telemetry?.currentFrame || {};
    active = false;
  };
  const clear = proto.clearRect, fillRect = proto.fillRect;
  proto.clearRect = function(...args) { this.canvas.__auditBoxes = []; return clear.apply(this, args); };
  proto.fillRect = function(x,y,w,h) {
    if (x === 0 && y === 0 && w >= this.canvas.width && h >= this.canvas.height) this.canvas.__auditBoxes = [];
    return fillRect.apply(this, arguments);
  };
  for (const key of ['fillText', 'strokeText']) {
    const original = proto[key];
    proto[key] = function(text, x, y, maxWidth) {
      const metrics = this.measureText(text), T = this.getTransform();
      const left = x - metrics.actualBoundingBoxLeft, right = x + metrics.actualBoundingBoxRight;
      const top = y - metrics.actualBoundingBoxAscent, bottom = y + metrics.actualBoundingBoxDescent;
      const scale = maxWidth && metrics.width > maxWidth ? maxWidth / metrics.width : 1;
      const points = [[left,top],[right,top],[right,bottom],[left,bottom]].map(([a,b]) => point(T, x + (a-x)*scale, b));
      const list = this.canvas.__auditBoxes ||= [];
      list.push({text: String(text), group:textGroup, font: this.font, points, bbox:[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))], alpha: this.globalAlpha, layer: key});
      return original.apply(this, arguments);
    };
  }
  const image = proto.drawImage;
  proto.drawImage = function(src, ...args) {
    const source = src.__auditBoxes || [];
    if (source.length) {
      let sx=0,sy=0,sw=src.width,sh=src.height,dx,dy,dw,dh;
      if(args.length===2) [dx,dy]=args,dw=sw,dh=sh;
      else if(args.length===4) [dx,dy,dw,dh]=args;
      else [sx,sy,sw,sh,dx,dy,dw,dh]=args;
      const T=this.getTransform(), list=this.canvas.__auditBoxes ||= [];
      for(const b of source) {
        const points=b.points.map(([x,y])=>point(T, dx+(x-sx)*dw/sw,dy+(y-sy)*dh/sh));
        list.push({...b, points, alpha:b.alpha*this.globalAlpha, bbox:[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]});
      }
    }
    return image.apply(this,[src,...args]);
  };
})();

// 记录实际 Canvas 路径，并沿离屏 drawImage 链传播到最终画布。
(() => {
  const P=CanvasRenderingContext2D.prototype;
  const matrix=T=>[T.a,T.b,T.c,T.d,T.e,T.f];
  const point=(T,x,y)=>[T[0]*x+T[2]*y+T[4],T[1]*x+T[3]*y+T[5]];
  const multiply=(A,B)=>[A[0]*B[0]+A[2]*B[1],A[1]*B[0]+A[3]*B[1],A[0]*B[2]+A[2]*B[3],A[1]*B[2]+A[3]*B[3],A[0]*B[4]+A[2]*B[5]+A[4],A[1]*B[4]+A[3]*B[5]+A[5]];
  let active=false;
  window.auditTag=(ctx,role,data={})=>{ctx.__qaRole=role?{role,base_to_canvas:matrix(ctx.getTransform()),...data}:null;};
  const begin=window.auditBegin,end=window.auditEnd;
  window.auditBegin=t=>{begin(t);active=true;};
  window.auditEnd=()=>{end();const f=window.auditFrames.at(-1);f.plot_shapes=(window.__canvas.__qaShapes||[]).filter(x=>x.alpha>.05);f.graphics=(window.__canvas.__qaGraphics||[]).filter(x=>x.alpha>.05);active=false;};
  function reset(canvas){canvas.__qaShapes=[];canvas.__qaGraphics=[];}
  if(P.reset){const original=P.reset;P.reset=function(){reset(this.canvas);this.__qaPath=[];this.__qaCenter=null;this.__qaRole=null;return original.apply(this,arguments);};}
  for(const name of ['clearRect','fillRect']){
    const original=P[name];P[name]=function(x,y,w,h){if(x===0&&y===0&&w>=this.canvas.width&&h>=this.canvas.height)reset(this.canvas);return original.apply(this,arguments);};
  }
  const beginPath=P.beginPath;P.beginPath=function(){this.__qaPath=[];this.__qaCenter=null;return beginPath.apply(this,arguments);};
  for(const name of ['moveTo','lineTo']){const fn=P[name];P[name]=function(x,y){(this.__qaPath||=[]).push([x,y]);return fn.apply(this,arguments);};}
  for(const name of ['rect','roundRect']){const fn=P[name];P[name]=function(x,y,w,h){(this.__qaPath||=[]).push([x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]);return fn.apply(this,arguments);};}
  for(const name of ['arc','ellipse']){const fn=P[name];P[name]=function(...args){const[x,y,rx]=args;const ry=name==='arc'?rx:args[3];for(let k=0;k<24;k++)(this.__qaPath||=[]).push([x+rx*Math.cos(k*Math.PI/12),y+ry*Math.sin(k*Math.PI/12)]);this.__qaCenter=[x,y];return fn.apply(this,args);};}
  for(const name of ['bezierCurveTo','quadraticCurveTo']){const fn=P[name];P[name]=function(...args){for(let i=0;i<args.length;i+=2)(this.__qaPath||=[]).push([args[i],args[i+1]]);return fn.apply(this,args);};}
  function record(ctx,points,operation){
    if(!active||points.length<2)return;
    const T=matrix(ctx.getTransform()),screen=points.map(([x,y])=>point(T,x,y));
    const bbox=[Math.min(...screen.map(x=>x[0])),Math.min(...screen.map(x=>x[1])),Math.max(...screen.map(x=>x[0])),Math.max(...screen.map(x=>x[1]))];
    (ctx.canvas.__qaGraphics||=[]).push({bbox,alpha:ctx.globalAlpha,operation,role:ctx.__qaRole?.role||null});
    if(ctx.__qaRole)(ctx.canvas.__qaShapes||=[]).push({...ctx.__qaRole,local_points:points.map(x=>x.slice()),screen_points:screen,to_screen:T,outer_to_screen:[1,0,0,1,0,0],center:ctx.__qaCenter||null,alpha:ctx.globalAlpha,operation});
  }
  for(const name of ['stroke','fill']){const fn=P[name];P[name]=function(){record(this,this.__qaPath||[],name);return fn.apply(this,arguments);};}
  const rect=P.fillRect;P.fillRect=function(x,y,w,h){if(!(x===0&&y===0&&w>=this.canvas.width&&h>=this.canvas.height))record(this,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],'fillRect');return rect.apply(this,arguments);};
  const image=P.drawImage;P.drawImage=function(src,...args){
    if(active){
      let sx=0,sy=0,sw=src.width,sh=src.height,dx,dy,dw,dh;
      if(args.length===2){[dx,dy]=args;dw=sw;dh=sh;}else if(args.length===4){[dx,dy,dw,dh]=args;}else [sx,sy,sw,sh,dx,dy,dw,dh]=args;
      const T=multiply(matrix(this.getTransform()),[dw/sw,0,0,dh/sh,dx-sx*dw/sw,dy-sy*dh/sh]);
      for(const s of (src.__qaShapes||[]).slice()){const total=multiply(T,s.to_screen);(this.canvas.__qaShapes||=[]).push({...s,to_screen:total,outer_to_screen:multiply(T,s.outer_to_screen),screen_points:s.local_points.map(([x,y])=>point(total,x,y)),alpha:s.alpha*this.globalAlpha});}
      for(const g of (src.__qaGraphics||[]).slice()){const[x0,y0,x1,y1]=g.bbox,pts=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([x,y])=>point(T,x,y));(this.canvas.__qaGraphics||=[]).push({...g,bbox:[Math.min(...pts.map(x=>x[0])),Math.min(...pts.map(x=>x[1])),Math.max(...pts.map(x=>x[0])),Math.max(...pts.map(x=>x[1]))],alpha:g.alpha*this.globalAlpha});}
    }
    return image.apply(this,[src,...args]);
  };
})();

// 用浏览器原生路径包含测试记录裁剪后的可见采样；不把被裁掉的路径当成可见证据。
(() => {
 const P=CanvasRenderingContext2D.prototype,mask=document.createElement('canvas').getContext('2d');
 const transform=(T,p)=>[T.a*p[0]+T.c*p[1]+T.e,T.b*p[0]+T.d*p[1]+T.f];
 const visible=(ctx,p)=>p[0]>=0&&p[1]>=0&&p[0]<ctx.canvas.width&&p[1]<ctx.canvas.height&&(ctx.__qaClips||[]).every(path=>mask.isPointInPath(path,p[0],p[1]));
 function samples(points){const out=[];points.forEach((p,i)=>{out.push(p);if(i)out.push([(p[0]+points[i-1][0])/2,(p[1]+points[i-1][1])/2]);});return out;}
 for(const name of ['save','restore']){const original=P[name];P[name]=function(){if(name==='save')(this.__qaClipStack||=[]).push((this.__qaClips||[]).slice());else this.__qaClips=(this.__qaClipStack||[]).pop()||[];return original.apply(this,arguments);};}
 if(P.reset){const original=P.reset;P.reset=function(){this.__qaClips=[];this.__qaClipStack=[];this.__qaNativePath=new Path2D();return original.apply(this,arguments);};}
 const begin=P.beginPath;P.beginPath=function(){this.__qaNativePath=new Path2D();return begin.apply(this,arguments);};
 for(const name of ['moveTo','lineTo','bezierCurveTo','quadraticCurveTo']){const original=P[name];P[name]=function(...args){const path=this.__qaNativePath||=new Path2D(),T=this.getTransform(),coords=[];for(let i=0;i<args.length;i+=2)coords.push(...transform(T,[args[i],args[i+1]]));path[name](...coords);return original.apply(this,args);};}
 for(const name of ['rect','roundRect','arc','ellipse']){const original=P[name];P[name]=function(...args){const path=this.__qaNativePath||=new Path2D(),part=new Path2D();part[name](...args);path.addPath(part,this.getTransform());return original.apply(this,args);};}
 const close=P.closePath;P.closePath=function(){this.__qaNativePath?.closePath();return close.apply(this,arguments);};
 const clip=P.clip;P.clip=function(...args){let path;if(args[0] instanceof Path2D){path=new Path2D();path.addPath(args[0],this.getTransform());}else path=new Path2D(this.__qaNativePath);(this.__qaClips||=[]).push(path);return clip.apply(this,args);};
 function store(s,points){Object.defineProperty(s,'__qaVisible',{value:points,configurable:true});s.visible_screen_points=points.filter((_,i)=>i%Math.max(1,Math.ceil(points.length/8))===0);s.visible_point_count=points.length;}
 function decorate(ctx,start){for(const s of (ctx.canvas.__qaShapes||[]).slice(start)){store(s,samples(s.screen_points).filter(p=>visible(ctx,p)));s.clip_count=(ctx.__qaClips||[]).length;}}
 for(const name of ['stroke','fill','fillRect']){const original=P[name];P[name]=function(...args){const n=(this.canvas.__qaShapes||[]).length,result=original.apply(this,args);decorate(this,n);return result;};}
 const image=P.drawImage;P.drawImage=function(src,...args){const n=(this.canvas.__qaShapes||[]).length,result=image.apply(this,[src,...args]);let sx=0,sy=0,sw=src.width,sh=src.height,dx,dy,dw,dh;
   if(args.length===2){[dx,dy]=args;dw=sw;dh=sh;}else if(args.length===4){[dx,dy,dw,dh]=args;}else [sx,sy,sw,sh,dx,dy,dw,dh]=args;
   const source=(src.__qaShapes||[]).slice(),added=(this.canvas.__qaShapes||[]).slice(n),T=this.getTransform();
   added.forEach((shape,i)=>{const from=source[i];if(!from)throw new Error('离屏形状传播数量不一致');store(shape,(from.__qaVisible||from.visible_screen_points||[]).filter(([x,y])=>x>=sx&&x<=sx+sw&&y>=sy&&y<=sy+sh).map(([x,y])=>transform(T,[dx+(x-sx)*dw/sw,dy+(y-sy)*dh/sh])).filter(p=>visible(this,p)));shape.clip_count=from.clip_count+(this.__qaClips||[]).length;shape.source_crop=[sx,sy,sw,sh];});return result;
 };
})();

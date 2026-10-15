// AM 统一字阶由配置给出；Canvas px 已按 Manim 的实际字形高度校准。
(() => {
 const P=window.PHYSICS_CONFIG.presentation;
 const px=(role,math=false)=>P.canvas_font_px[math?'math':'text'][String(P.font_pt[role])];
 function text(c,value,x,y,role='body',color='#FFFFFF',align='left'){
  c.font=px(role)+'px "PuHui-Medium",sans-serif';c.fillStyle=color;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(value,x,y);c.textAlign='left';
 }
 function header(c,scene){
  text(c,'调幅 AM：信号形成、动态包络与过调制',80,100,'title');
  text(c,'AM · '+scene,1840,95,'body','#94A3B8','right');
  c.strokeStyle='rgba(255,255,255,.16)';c.lineWidth=1.5;c.beginPath();c.moveTo(80,132);c.lineTo(1840,132);c.stroke();
 }
 function footer(c,note){
  c.fillStyle='#17212D';c.strokeStyle='rgba(255,255,255,.15)';c.lineWidth=1.5;c.beginPath();c.roundRect(80,845,1760,71,10);c.fill();c.stroke();
  text(c,note,960,889,'body','#FFFFFF','center');
 }
 window.AM_TYPE={px,text,header,footer};
})();

// 理想线性 AM：字号与净距采用独立的 AM 公共排版配置。
(() => {
 const CFG=window.PHYSICS_CONFIG,P=CFG.parameters,AC=P.carrier_amplitude_v,FC=P.carrier_frequency_hz,FM=P.message_frequency_hz,KIT=new PhysicsCanvasKit(),L=LAYOUT,T=AM_TYPE;
 const factor=(t,m)=>1+m*Math.cos(2*Math.PI*FM*t);
 const signal=(t,m)=>AC*factor(t,m)*Math.cos(2*Math.PI*FC*t);
 const envelope=(t,m)=>AC*Math.abs(factor(t,m));
 function tag(c,role,scene,t,m,extra={}){auditTag(c,role,{model:'am',scene,sim_t:t,m,...extra});}
 function curve(c,role,scene,t,m){
  const b=CFG.drawing_bindings[scene][role];tag(c,role,scene,t,m);c.strokeStyle=role==='signal'?'#FFFF00':role==='carrier'?'#58C4DD':role==='message'?'#2ED573':role==='factor'?'#FF9F43':'#5CD0B3';c.lineWidth=role==='signal'?3.5:2;
  c.setLineDash(role==='upper'||role==='lower'?[8,6]:[]);c.beginPath();
  for(let j=0;j<=600;j++){const x=b.x_origin+((b.x_end||1770)-b.x_origin)*j/600,u=t+(x-b.x_origin)*b.time_per_x,value=role==='signal'?signal(u,m):role==='carrier'?AC*Math.cos(2*Math.PI*FC*u):role==='message'?Math.cos(2*Math.PI*FM*u):role==='factor'?factor(u,m):envelope(u,m)*(role==='upper'?1:-1);const y=b.baseline-b.y_scale*value;j?c.lineTo(x,y):c.moveTo(x,y);}
  c.stroke();c.setLineDash([]);auditTag(c,null);
 }
 function anchor(c,scene,t,m){const b=CFG.drawing_bindings[scene].anchor;tag(c,'anchor',scene,t,m);c.strokeStyle='#707070';c.lineWidth=1.5;c.beginPath();c.moveTo(...b.start);c.lineTo(...b.end);c.stroke();auditTag(c,null);KIT.recordObject({id:'am_probe_'+scene,world_x:b.start[0],world_y:b.start[1]});}
 function formula(c){
  L.typesetMath(c,[{s:'s(t)='},{s:'A',sub:'c',it:true,col:'#58C4DD'},{s:'[1+'},{s:'m',it:true,col:'#FF9F43'},{s:'cos(2π'},{s:'f',sub:'m',it:true,col:'#2ED573'},{s:'t)]cos(2π'},{s:'f',sub:'c',it:true,col:'#58C4DD'},{s:'t)'}],100,260,T.px('formula_main',true));
  L.typesetMath(c,[{s:'E',sub:'env',it:true,col:'#5CD0B3'},{s:'='},{s:'A',sub:'c',it:true,col:'#58C4DD'},{s:'|1+'},{s:'m',it:true,col:'#FF9F43'},{s:'cos(2π'},{s:'f',sub:'m',it:true,col:'#2ED573'},{s:'t)|'}],100,324,T.px('formula_secondary',true));
 }
 function spectrum(c,scene,t,m){
  const b=CFG.drawing_bindings[scene].spectrum,freqs=[FC-FM,FC,FC+FM],amplitudes=[m*AC/2,AC,m*AC/2],colors=['#FC6255','#58C4DD','#83C167'];
  c.strokeStyle='#707070';c.lineWidth=1.5;c.beginPath();c.moveTo(1000,b.baseline);c.lineTo(1800,b.baseline);c.stroke();
  for(let j=0;j<3;j++){const x=b.x_origin+(freqs[j]-b.frequency_origin_hz)*b.x_scale,y=b.baseline-b.y_scale*amplitudes[j];tag(c,'spectrum',scene,t,m,{band:j});c.strokeStyle=colors[j];c.lineWidth=5;c.beginPath();c.moveTo(x,b.baseline);c.lineTo(x,y);c.stroke();auditTag(c,null);c.fillStyle=colors[j];c.beginPath();c.arc(x,y,5,0,2*Math.PI);c.fill();T.text(c,amplitudes[j].toFixed(2)+' V',x,y-26,'body',colors[j],'center');T.text(c,freqs[j]+' Hz',x,b.baseline+60,'body','#FFFFFF','center');}
 }
 function draw(c,lt,gt,scene,m){
  const t=gt*P.video_second_to_sim_second;c.fillStyle='#0F141D';c.fillRect(0,0,1920,1080);T.header(c,scene);
  T.text(c,'Ac = 1 V   fc = 1 kHz   fm = 100 Hz   慢放：1 视频秒 = 1 ms 仿真   窗宽 10 ms',100,192);
  T.text(c,'m = '+m.toFixed(2)+'   t = '+(t*1000).toFixed(2)+' ms',1260,260,'indicator','#FF9F43');formula(c);
  if(scene==='shot5'){
   T.text(c,'单边余弦幅度谱 · 固定 m',980,337,'section');spectrum(c,scene,t,m);
   T.text(c,'载波：fc，幅度 Ac',130,390,'body','#58C4DD');T.text(c,'下边带：fc − fm，幅度 mAc / 2',130,450,'body','#FC6255');T.text(c,'上边带：fc + fm，幅度 mAc / 2',130,510,'body','#83C167');
   T.text(c,'m = 0、0.6、1、1.2：改变边带幅度',130,590);T.text(c,'理想线性 AM 的过调制',130,650);T.text(c,'不会自动产生额外边带',130,710);
   KIT.recordObject({id:'am_probe_spectrum',world_x:1000,world_y:620});T.footer(c,'三条稳态谱线：载波 Ac，两边带各 mAc/2；档位切换用于教学演示。');return;
  }
  anchor(c,scene,t,m);
  if(scene==='shot1'){
   curve(c,'carrier',scene,t,m);curve(c,'message',scene,t,m);T.text(c,'载波（V）',150,388,'legend','#58C4DD');T.text(c,'归一化调制信号（无量纲）',1060,388,'legend','#2ED573');
  }
  if(scene==='shot4'){curve(c,'factor',scene,t,m);T.text(c,'幅度因子（可为负）',1080,324,'legend','#FF9F43');}
  curve(c,'signal',scene,t,m);curve(c,'upper',scene,t,m);curve(c,'lower',scene,t,m);
  T.text(c,'黄：AM 信号',150,scene==='shot1'?560:470,'legend','#FFFF00');T.text(c,'青：上下边界 ±Eenv，实际包络 Eenv ≥ 0',650,scene==='shot1'?560:470,'legend','#5CD0B3');
  const notes={shot1:'m = 0：调制信号已存在，但乘法因子为 1，输出只剩载波。',shot2:'m = 0.6：幅度因子保持为正；包络最大 1.6 V，最小 0.4 V。',shot3:'m = 1：包络刚好触零；零幅度处相位未定义，无 π 相位反转。',shot4:'m = 1.2：负因子使载波反相，包络取绝对值；理想 AM 仍为三条谱线。'};T.footer(c,notes[scene]);
 }
 window.AM={draw,curve,spectrum,factor,signal,envelope};
})();

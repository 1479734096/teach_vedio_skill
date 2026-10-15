// 非对称核实际 Canvas 探针；输出由独立密网格计算，不调用检测器。
(() => {
 const F=[[-1,1,1]],G=[[0,.5,1],[.5,2,.3]],OMIT_FLIP=false,OUTPUT_ERROR=0;
 const value=(x,s)=>s.reduce((v,[l,r,h])=>v+(x>=l&&x<=r?h:0),0);
 const integral=t=>{let total=0;const dx=10/20000;for(let k=0;k<20000;k++){const x=-5+(k+.5)*dx;total+=value(x,F)*value(t-x,G)*dx;}return total;};
 SCENES.profile={draw(c,lt){
   c.fillStyle='#0F141D';c.fillRect(0,0,1920,1080);c.fillStyle='#FFFFFF';c.font='28px "PuHui-Medium", sans-serif';c.fillText('非对称核：实际曲线翻转、平移和积分',100,100);
   const t=-1+lt/2*3.5;
   function curve(s,role,color){
     auditTag(c,role,{model:'profile',sim_t:t});c.strokeStyle=color;c.lineWidth=4;c.beginPath();const segments=s.slice().sort((a,b)=>a[0]-b[0]);
     segments.forEach(([l,r,h],i)=>{if(i===0)c.moveTo(960+150*l,400);c.lineTo(960+150*l,400-130*h);c.lineTo(960+150*r,400-130*h);});c.lineTo(960+150*segments.at(-1)[1],400);c.stroke();auditTag(c,null);
   }
   curve(F,'f','#4BC5E9');curve(G.map(([l,r,h])=>OMIT_FLIP?[t+l,t+r,h]:[t-r,t-l,h]),'g','#ED6B5B');
   auditTag(c,'output',{model:'profile',sim_t:t});c.fillStyle='#F4D35E';c.beginPath();c.arc(960+150*t,780-130*(integral(t)+OUTPUT_ERROR),7,0,2*Math.PI);c.fill();auditTag(c,null);
 }};
})();

// LC 振荡电路 30 秒 5 镜头段落编排表 (eras.js)
window.PUNCH = 0;
window.SCENE_LIBS = ['scenes/physics_common.js', 'scenes/lc_common.js'];
window.SCENE_DIR = 'scenes';

window.ERAS = [
  // 镜头 1 (0.0s - 6.0s)：初始电场储能 (Q=Q0, I=0)
  { id: 'shot1', dur: 6.0 },

  // 镜头 2 (6.0s - 12.0s)：电场向磁场转换 (Q->0, I->I0)
  { id: 'shot2', dur: 6.0, transition: { type: 'same', dur: 0.6 } },

  // 镜头 3 (12.0s - 18.0s)：自感电动势反向充饱 (Q->-Q0, I->0)
  { id: 'shot3', dur: 6.0, transition: { type: 'same', dur: 0.6 } },

  // 镜头 4 (18.0s - 24.0s)：正交正弦曲线与动态能量互补柱状图
  { id: 'shot4', dur: 6.0, transition: { type: 'same', dur: 0.6 } },

  // 镜头 5 (24.0s - 30.0s)：RSA 科技黑板板书总结二阶微分方程与能量守恒
  { id: 'shot5', dur: 6.0, transition: { type: 'fadeShift', dur: 0.8, bg: '#0F141D', shift: 60 } }
];

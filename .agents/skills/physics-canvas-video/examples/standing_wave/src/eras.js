// 物理科普动画《两列相反方向的波如何产生驻波？》
// 30 秒 5 镜头整片段落编排表 (eras.js)
window.PUNCH = 0;
window.SCENE_LIBS = ['scenes/wave_common.js'];
window.SCENE_DIR = 'scenes';

window.ERAS = [
  // 镜头 1 (0.0s - 6.0s)：显示一列向右传播的蓝色正弦波 u_i = A cos(omega*t - beta*x)
  { id: 'shot1', dur: 6.0 },

  // 镜头 2 (6.0s - 12.0s)：加入向左传播的红色正弦波 u_r = A cos(omega*t + beta*x)，建立 x=0 同相约定
  { id: 'shot2', dur: 6.0, transition: { type: 'same', dur: 0.6 } },

  // 镜头 3 (12.0s - 18.0s)：两列行波瞬时位移叠加，得到绿色驻波 u = 2A cos(beta*x) cos(omega*t)
  { id: 'shot3', dur: 6.0, transition: { type: 'same', dur: 0.6 } },

  // 镜头 4 (18.0s - 24.0s)：驻波持续振动，突出波节不动、波腹周期变化的性质
  { id: 'shot4', dur: 6.0, transition: { type: 'same', dur: 0.6 } },

  // 镜头 5 (24.0s - 30.0s)：用手绘板书笔迹呈现最终公式并分层解析电磁物理本质
  { id: 'shot5', dur: 6.0, transition: { type: 'fadeShift', dur: 0.8, bg: '#0F141D', shift: 60 } },
];

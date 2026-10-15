// 连续时间卷积 30 秒 5 镜头段落编排表 (eras.js)
window.PUNCH = 0;
window.SCENE_LIBS = ['scenes/physics_common.js', 'scenes/conv_common.js'];
window.SCENE_DIR = 'scenes';

window.ERAS = [
  // 镜头 1 (0.0s - 6.0s)：原始信号与哑变量 tau 建立
  { id: 'shot1', dur: 6.0 },

  // 镜头 2 (6.0s - 12.0s)：第一步 镜像翻转 g(tau) -> g(-tau)
  { id: 'shot2', dur: 6.0, transition: { type: 'same', dur: 0.6 } },

  // 镜头 3 (12.0s - 18.0s)：第二步 滑动窗口平移 g(t - tau)
  { id: 'shot3', dur: 6.0, transition: { type: 'same', dur: 0.6 } },

  // 镜头 4 (18.0s - 24.0s)：第三与四步 重叠相乘与面积积分累积
  { id: 'shot4', dur: 6.0, transition: { type: 'same', dur: 0.6 } },

  // 镜头 5 (24.0s - 30.0s)：RSA 白板板书总结卷积数学定理与 LTI 物理本质
  { id: 'shot5', dur: 6.0, transition: { type: 'fadeShift', dur: 0.8, bg: '#0F141D', shift: 60 } }
];

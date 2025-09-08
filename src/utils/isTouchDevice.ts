// 触屏设备检测(首选交互 触摸)
export const isTouchDevice = () => {
  return (
    window.matchMedia('(pointer: coarse)').matches, //
    'ontouchstart' in window
  );
};

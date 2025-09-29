import type { Signature } from '@/utils';

type PickerEls = {
  sizeEl: HTMLInputElement;
  colorEl: HTMLInputElement;
  bgColorEl: HTMLInputElement;
};

export const bindStylePickers = (signature: Signature, pickerEls: PickerEls) => {
  const {
    sizeEl, //
    colorEl,
    bgColorEl,
  } = pickerEls;

  function setSize() {
    signature.setCtx((ctx) => {
      ctx.lineWidth = sizeEl.valueAsNumber;
    });
  }

  function setColor() {
    signature.setCtx((ctx) => {
      ctx.strokeStyle = colorEl.value;
    });
  }

  function setBgColor() {
    signature.setCtx((ctx) => {
      const { width, height } = signature.canvas;

      const imgData = ctx.getImageData(0, 0, width, height);

      ctx.fillStyle = bgColorEl.value;
      ctx.fillRect(0, 0, width, height);

      ctx.putImageData(imgData, 0, 0);
    });
  }

  function bind() {
    setSize();
    setColor();
    setBgColor();
  }

  function unbind() {
    sizeEl.removeEventListener('input', setSize);
    colorEl.removeEventListener('input', setColor);
    bgColorEl.removeEventListener('input', setBgColor);
  }

  bind();

  sizeEl.addEventListener('input', setSize);
  colorEl.addEventListener('input', setColor);
  bgColorEl.addEventListener('input', setBgColor);

  return {
    rebind: bind,
    unbind, //
  };
};

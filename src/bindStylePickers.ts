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
      ctx.fillStyle = bgColorEl.value;
    });
  }

  function toBind() {
    setSize();
    setColor();
    setBgColor();
  }

  function toUnbind() {
    sizeEl.removeEventListener('input', setSize);
    colorEl.removeEventListener('input', setColor);
    bgColorEl.removeEventListener('input', setBgColor);
  }

  sizeEl.addEventListener('input', setSize);
  colorEl.addEventListener('input', setColor);
  bgColorEl.addEventListener('input', setBgColor);

  const controller = {
    bind: () => {
      toBind();
      return controller; // 返回自身实现链式调用
    },
    unbind: toUnbind,
  };

  return controller;
};

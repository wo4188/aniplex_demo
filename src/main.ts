import './styles/index.css';

import { Signature, isTouchDevice } from './utils';
import { bindStylePickers } from './bindStylePickers';

console.log('hello 判断为触摸设备', isTouchDevice());

const canvasEl: HTMLCanvasElement = document.querySelector('.signature-canvas')!;
const saveBtnEl = document.querySelector('.save-btn')!;
const resetBtnEl = document.querySelector('.reset-btn')!;

const { clientWidth, clientHeight } = canvasEl.parentElement!;
canvasEl.width = clientWidth;
canvasEl.height = clientHeight;
const signature = new Signature(canvasEl, isTouchDevice());

saveBtnEl.addEventListener('click', doSave);
resetBtnEl.addEventListener('click', doReset);

const sizePickerEl: HTMLInputElement = document.querySelector('#size-picker')!;
const colorPickerEl: HTMLInputElement = document.querySelector('#color-picker')!;
const bgColorPickerEl: HTMLInputElement = document.querySelector('#bg-color-picker')!;
const { unbind: unbindPickers } = bindStylePickers(signature, {
  sizeEl: sizePickerEl,
  colorEl: colorPickerEl,
  bgColorEl: bgColorPickerEl,
});

window.addEventListener('beforeunload', () => {
  saveBtnEl.removeEventListener('click', doSave);
  resetBtnEl.removeEventListener('click', doReset);

  unbindPickers();
  signature.destroy();
});

function doSave() {
  canvasEl.toBlob((blob) => {
    const dateStr = Date.now().toString();
    const link = document.createElement('a');
    link.download = `${dateStr}.png`;
    link.href = URL.createObjectURL(blob!);
    link.click();
    link.remove();
  });
}

function doReset() {
  signature.clear();
}

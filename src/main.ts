import './styles/index.css';

import {
  Signature, //
  isTouchDevice,
  addResizeObserver,
} from './utils';
import { bindStylePickers } from './bindStylePickers';

console.log('hello 判断为触摸设备', isTouchDevice());

const canvasEl: HTMLCanvasElement = document.querySelector('.signature-canvas')!;
const saveBtnEl = document.querySelector('.save-btn')!;
const resetBtnEl = document.querySelector('.reset-btn')!;
const sizePickerEl: HTMLInputElement = document.querySelector('#size-picker')!;
const colorPickerEl: HTMLInputElement = document.querySelector('#color-picker')!;
const bgColorPickerEl: HTMLInputElement = document.querySelector('#bg-color-picker')!;

const signature = new Signature(canvasEl, isTouchDevice());

const removeResizeOb = addResizeObserver(
  canvasEl.parentElement!,
  (boxSize) => {
    const { innerWidth, innerHeight } = boxSize;
    signature.resize(innerWidth, innerHeight);
  },
  {
    enableRAF: true,
  }
);

const { unbind: unbindPickers } = bindStylePickers(signature, {
  sizeEl: sizePickerEl,
  colorEl: colorPickerEl,
  bgColorEl: bgColorPickerEl,
});

saveBtnEl.addEventListener('click', doSave);
resetBtnEl.addEventListener('click', doReset);

window.addEventListener('beforeunload', () => {
  saveBtnEl.removeEventListener('click', doSave);
  resetBtnEl.removeEventListener('click', doReset);

  removeResizeOb();
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

import './styles/index.css';

import { debounce } from 'lodash-es';

import {
  Signature, //
  isTouchDevice,
  addResizeObserver,
} from './utils';
import { bindStylePickers } from './bindStylePickers';

console.log('hello 判断为触摸设备', isTouchDevice());

const canvasEl: HTMLCanvasElement = document.querySelector('.signature-canvas')!;
const sizePickerEl: HTMLInputElement = document.querySelector('#size-picker')!;
const colorPickerEl: HTMLInputElement = document.querySelector('#color-picker')!;
const bgColorPickerEl: HTMLInputElement = document.querySelector('#bg-color-picker')!;
const saveBtnEl = document.querySelector('.save-btn')!;
const resetBtnEl = document.querySelector('.reset-btn')!;

const signature = new Signature(canvasEl, isTouchDevice());

const { rebind, unbind: unbindPickers } = bindStylePickers(signature, {
  sizeEl: sizePickerEl,
  colorEl: colorPickerEl,
  bgColorEl: bgColorPickerEl,
});

const removeResizeOb = addResizeObserver(
  canvasEl.parentElement!,
  debounce((boxSize) => {
    const { innerWidth, innerHeight } = boxSize;
    console.log('🚀 ~ innerWidth, innerHeight 👉', innerWidth, innerHeight);

    signature.resize(innerWidth, innerHeight);
    rebind(); // TODO 先暂时重新绑定一下
  }, 400)
);

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

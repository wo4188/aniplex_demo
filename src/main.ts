import './styles/index.css';

import { Signature, isTouchDevice } from './utils';

console.log('hello 判断为触摸设备', isTouchDevice());

const canvasEl: HTMLCanvasElement | null = document.querySelector('.signature-canvas');
const saveBtnEl = document.querySelector('.save-btn');
const resetBtnEl = document.querySelector('.reset-btn');

const signature = new Signature(canvasEl!, isTouchDevice());

saveBtnEl?.addEventListener('click', doSave);
resetBtnEl?.addEventListener('click', doReset);

function doSave() {
  canvasEl?.toBlob((blob) => {
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

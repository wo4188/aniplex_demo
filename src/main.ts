import './styles/index.css';

import { Signature } from './utils';

console.log('hello');

const canvasEl: HTMLCanvasElement | null = document.querySelector('.signature-canvas');
const saveBtnEl = document.querySelector('.save-btn');
const resetBtnEl = document.querySelector('.reset-btn');

const signature = new Signature(canvasEl!);

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

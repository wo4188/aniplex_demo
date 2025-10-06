import { throttle } from 'lodash-es';

interface InputStrategy {
  init(): void;
  destroy(): void;
}

type InputCallback = (pos: { x: number; y: number }, type: 'start' | 'move' | 'end') => void;

function assertNever(x: never): never {
  throw new Error(`未处理的类型: ${x}`);
}

class MouseInputStrategy implements InputStrategy {
  #signature: Signature;

  #eventMap: Map<keyof HTMLElementEventMap, EventListener>;

  constructor(signature: Signature) {
    this.#signature = signature;

    this.#eventMap = new Map([
      ['mousedown', this.#doMouseStart],
      ['mousemove', this.#doMouseMove],
      ['mouseup', this.#doMouseEnd],
      ['mouseleave', this.#doMouseEnd],
    ]);
  }

  #getPos = (e: Event) => {
    const _e = e as MouseEvent;
    const { dpr, canvas } = this.#signature;
    const rect = canvas.getBoundingClientRect();

    return {
      x: (_e.clientX - rect.x) / dpr,
      y: (_e.clientY - rect.y) / dpr,
    };
  };

  #doMouseStart = (e: Event) => {
    this.#signature.inputCb(this.#getPos(e), 'start');
  };

  #doMouseMove = throttle((e: Event) => {
    this.#signature.inputCb(this.#getPos(e), 'move');
  }, 16);

  #doMouseEnd = (e: Event) => {
    this.#signature.inputCb({ x: 0, y: 0 }, 'end');
  };

  init = () => {
    for (const [event, handler] of this.#eventMap) {
      this.#signature.canvas.addEventListener(event, handler);
    }
  };

  destroy = () => {
    for (const [event, handler] of this.#eventMap) {
      this.#signature.canvas.removeEventListener(event, handler);
    }
  };
}

// 只识别处理1个触点
class TouchInputStrategy implements InputStrategy {
  #signature: Signature;

  #eventMap: Map<keyof HTMLElementEventMap, EventListener>;

  constructor(signature: Signature) {
    this.#signature = signature;

    this.#eventMap = new Map([
      ['touchstart', this.#doTouchStart],
      ['touchmove', this.#doTouchMove],
      ['touchend', this.#doTouchEnd],
      ['touchcancel', this.#doTouchEnd],
    ]);
  }

  #getPos = (e: Event) => {
    const _e = e as TouchEvent;
    const { dpr, canvas } = this.#signature;
    const rect = canvas.getBoundingClientRect();

    return {
      x: (_e.touches[0].clientX - rect.x) / dpr,
      y: (_e.touches[0].clientY - rect.y) / dpr,
    };
  };

  #doTouchStart = (e: Event) => {
    this.#signature.inputCb(this.#getPos(e), 'start');
  };

  #doTouchMove = throttle((e: Event) => {
    this.#signature.inputCb(this.#getPos(e), 'move');
  }, 16);

  #doTouchEnd = (e: Event) => {
    this.#signature.inputCb({ x: 0, y: 0 }, 'end');
  };

  init = () => {
    for (const [event, handler] of this.#eventMap) {
      this.#signature.canvas.addEventListener(event, handler);
    }
  };

  destroy = () => {
    for (const [event, handler] of this.#eventMap) {
      this.#signature.canvas.removeEventListener(event, handler);
    }
  };
}

export class Signature {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  dpr: number;
  isDrawing = false;
  #x = 0;
  #y = 0;

  #strategy: InputStrategy;

  constructor(canvas: HTMLCanvasElement, isTouchDevice: boolean) {
    if (!canvas?.parentElement) throw new Error('canvas 的父元素不能为空');
    if (!canvas) throw new Error('canvas 画布元素不能为空');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('无法获取该元素的 2D 渲染上下文');

    this.dpr = window.devicePixelRatio || 1;
    this.canvas = canvas;
    this.ctx = ctx;
    this.container = canvas.parentElement;

    if (isTouchDevice) {
      this.#strategy = new TouchInputStrategy(this);
    } else {
      this.#strategy = new MouseInputStrategy(this);
    }

    const { clientWidth, clientHeight } = this.container;
    this.#adjustCanvas(clientWidth, clientHeight);
    this.#initDefaultStyle();
    this.init();
  }

  inputCb: InputCallback = (pos, type) => {
    switch (type) {
      case 'start':
        // 设置坐标起点，准备绘制
        this.isDrawing = true;
        this.setPos(pos.x, pos.y);
        this.ctx.beginPath();
        break;
      case 'move':
        if (!this.isDrawing) break;

        // // 更新坐标的移动，连续绘制
        this.setPos(pos.x, pos.y);
        this.drawLine();
        break;
      case 'end':
        this.isDrawing = false;
        this.ctx.closePath();
        break;
      default:
        assertNever(type);
    }
  };

  #adjustCanvas = (cssW: number, cssH: number) => {
    // 计算物理像素尺寸(CSS像素 × 设备像素比)
    this.canvas.width = cssW * this.dpr;
    this.canvas.height = cssH * this.dpr;

    // 统一设置坐标系的缩放转换
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  #initDefaultStyle = () => {
    const { clientWidth, clientHeight } = this.container;

    // 设置初始样式
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#fff';
    this.ctx.fillStyle = '#000';

    // 填充背景
    this.ctx.fillRect(0, 0, clientWidth, clientHeight);
  };

  setPos = (currX: number, currY: number) => {
    [this.#x, this.#y] = [currX, currY];
  };

  drawLine = () => {
    this.ctx.lineTo(this.#x, this.#y);
    this.ctx.stroke();
  };

  resize = (cssW: number, cssH: number, reload?: () => void) => {
    const { ctx, canvas, dpr } = this;
    const { width, height } = canvas;
    const physW = cssW * dpr;
    const physH = cssH * dpr;

    const imgData = ctx.getImageData(0, 0, width, height);

    const ratio = Math.min(
      physW / width, // 新尺寸 : 原尺寸
      physH / height
    );

    this.#adjustCanvas(cssW, cssH);

    ctx.resetTransform();
    reload?.();
    this.clear();

    // const dx = (physW - width * ratio) / 2;
    // const dy = (physH - height * ratio) / 2;
    // ctx.setTransform(ratio, 0, 0, ratio, dx, dy);

    // TODO
    // 尺寸改变后，重绘的内容 没有自适应缩放，多次重绘后，部分内容可能丢失
    // 考虑 单独的背景图层？手动存储/恢复绘制路径？
    // drawImage/putImageData 选择？
    ctx.putImageData(imgData, 0, 0);
  };

  init = () => {
    this.#strategy.init();
  };

  destroy = () => {
    this.#strategy.destroy();
  };

  clear = () => {
    const { ctx, canvas } = this;
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);
    ctx.fillRect(0, 0, width, height);
  };

  setCtx = (
    cb: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void //
  ) => {
    cb(this.ctx, this.canvas);

    return this;
  };
}

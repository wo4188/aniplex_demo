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
      x: _e.clientX - rect.x,
      y: _e.clientY - rect.y,
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
      x: _e.touches[0].clientX - rect.x,
      y: _e.touches[0].clientY - rect.y,
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

  backupCanvas!: HTMLCanvasElement;
  backupCtx!: CanvasRenderingContext2D;

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

    this.backupCanvas = document.createElement('canvas');
    this.backupCtx = this.backupCanvas.getContext('2d', { willReadFrequently: true })!;

    if (isTouchDevice) {
      this.#strategy = new TouchInputStrategy(this);
    } else {
      this.#strategy = new MouseInputStrategy(this);
    }

    const { clientWidth, clientHeight } = this.container;
    this.#adjustCanvas(clientWidth, clientHeight);
    this.#adjustBackupCanvas(clientWidth, clientHeight);
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
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;

    // 计算物理像素尺寸(CSS逻辑像素 × 设备像素比)
    this.canvas.width = cssW * this.dpr;
    this.canvas.height = cssH * this.dpr;

    // 统一设置坐标系的缩放转换
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  #adjustBackupCanvas = (cssW: number, cssH: number) => {
    this.backupCanvas.width = cssW * this.dpr;
    this.backupCanvas.height = cssH * this.dpr;
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

    this.#adjustBackupCanvas(width, height);
    this.backupCtx.drawImage(canvas, 0, 0);

    this.#adjustCanvas(cssW, cssH);

    reload?.();
    this.clear();

    ctx.drawImage(this.backupCanvas, 0, 0, physW, physH);
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

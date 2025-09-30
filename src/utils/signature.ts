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
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });

    if (!canvas) throw new Error('canvas 画布元素不能为空');
    if (!ctx) throw new Error('无法获取该元素的 2D 渲染上下文');

    this.container = canvas.parentElement!;
    this.canvas = canvas;
    this.canvas.width = this.container.clientWidth * devicePixelRatio;
    this.canvas.height = this.container.clientHeight * devicePixelRatio;
    this.ctx = ctx;
    this.dpr = devicePixelRatio || 1;

    if (isTouchDevice) {
      this.#strategy = new TouchInputStrategy(this);
    } else {
      this.#strategy = new MouseInputStrategy(this);
    }

    this.#initStyle();
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

  #initStyle = () => {
    const { dpr, container } = this;
    const { clientWidth, clientHeight } = container;

    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#fff';
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, clientWidth * dpr, clientHeight * dpr); // TODO  是覆盖上去的，而不是单独的背景图层
    this.ctx.scale(dpr, dpr);
  };

  setPos = (currX: number, currY: number) => {
    [this.#x, this.#y] = [currX, currY];
  };

  drawLine = () => {
    this.ctx.lineTo(this.#x, this.#y);
    this.ctx.stroke();
  };

  resize = (w: number, h: number) => {
    const { dpr, ctx, canvas } = this;

    const prevImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    canvas.width = w * dpr;
    canvas.height = h * dpr;

    ctx.scale(dpr, dpr);

    ctx.putImageData(prevImageData, 0, 0); // TODO 尺寸改变后，重绘的内容 没有跟随缩放
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

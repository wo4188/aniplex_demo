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
    const rect = this.#signature.canvas.getBoundingClientRect();

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
    const rect = this.#signature.canvas.getBoundingClientRect();

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
  readonly canvas;
  readonly ctx;
  isDrawing = false;
  #x = 0;
  #y = 0;

  #strategy: InputStrategy;

  constructor(canvas: HTMLCanvasElement, isTouchDevice: boolean) {
    const ctx = canvas?.getContext('2d');

    if (!canvas) throw new Error('canvas 画布元素不能为空');
    if (!ctx) throw new Error('无法获取该元素的 2D 渲染上下文');

    this.canvas = canvas;
    this.ctx = ctx;

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
    const { width, height } = this.canvas;

    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#fff';
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, width, height);
  };

  setPos = (curX: number, curY: number) => {
    [this.#x, this.#y] = [curX, curY];
  };

  drawLine = () => {
    this.ctx.lineTo(this.#x, this.#y);
    this.ctx.stroke();
  };

  resize = (w: number, h: number) => {
    const dpr = devicePixelRatio;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.scale(dpr, dpr);
  };

  init = () => {
    this.#strategy.init();
  };

  destroy = () => {
    this.#strategy.destroy();
  };

  clear = () => {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillRect(0, 0, width, height);
  };

  setCtx = (
    cb: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void //
  ) => {
    cb(this.ctx, this.canvas);

    return this;
  };
}

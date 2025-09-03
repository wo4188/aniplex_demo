import { throttle } from 'lodash-es';

export class Signature {
  readonly #canvas;
  readonly #ctx;
  #isDrawing = false;
  #x = 0;
  #y = 0;

  #eventMap: Map<keyof HTMLElementEventMap, EventListener>;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas?.getContext('2d');

    if (!canvas) throw new Error('canvas 画布元素不能为空');
    if (!ctx) throw new Error('无法获取该元素的 2D 渲染上下文');

    this.#canvas = canvas;
    this.#ctx = ctx;

    this.#eventMap = new Map([
      ['mousedown', this.#doMouseStart],
      ['mousemove', this.#doMouseMove],
      ['mouseup', this.#doMouseEnd],
      ['mouseleave', this.#doMouseEnd],
    ]);

    this.#initStyle();
    this.#initEvents();
  }

  #initStyle = () => {
    const { width, height } = this.#canvas;

    this.#ctx.lineWidth = 4;
    this.#ctx.strokeStyle = '#fff';
    this.#ctx.fillStyle = '#000';
    this.#ctx.fillRect(0, 0, width, height);
  };

  #initEvents = () => {
    for (const [event, handler] of this.#eventMap) {
      this.#canvas.addEventListener(event, handler);
    }
  };

  #doMouseStart = (e: Event) => {
    // 设置坐标起点，准备绘制
    const pos = this.#getPos(e as MouseEvent);
    this.#setPos(pos.x, pos.y);

    this.#isDrawing = true;
    this.#ctx.beginPath();
  };

  #doMouseMove = throttle((e: Event) => {
    if (!this.#isDrawing) return;

    // 更新坐标移动，连续绘制
    const pos = this.#getPos(e as MouseEvent);
    this.#setPos(pos.x, pos.y);
    this.#drawLine();
  }, 16);

  #doMouseEnd = (e: Event) => {
    this.#ctx.closePath();
    this.#isDrawing = false;
  };

  #getPos = (e: MouseEvent) => {
    const rect = this.#canvas.getBoundingClientRect();

    return {
      x: e.clientX - rect.x, //
      y: e.clientY - rect.y,
    };
  };

  #setPos = (curX: number, curY: number) => {
    [this.#x, this.#y] = [curX, curY];
  };

  #drawLine = () => {
    this.#ctx.lineTo(this.#x, this.#y);
    this.#ctx.stroke();
  };

  destroy = () => {
    for (const [event, handler] of this.#eventMap) {
      this.#canvas.removeEventListener(event, handler);
    }
  };

  clear = () => {
    const { width, height } = this.#canvas;
    this.#ctx.clearRect(0, 0, width, height);
    this.#ctx.fillRect(0, 0, width, height);
  };

  setCtx = (
    cb: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void //
  ) => {
    cb(this.#ctx, this.#canvas);

    return this;
  };
}

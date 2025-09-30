type BoxSize = {
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
};

type EntryOpts = {
  /**
   * 启用RAF优化
   * @default true
   */
  enableRAF?: boolean;

  /**
   * 允许通知 初次的尺寸变化
   * @default false
   */
  allowFirstNotify?: boolean;
};

type EntryCtx = {
  notify: (boxSize: BoxSize) => void;
  opts: EntryOpts;
  rafId?: number;

  /**
   * 已观测过的标识
   * @default false
   */
  _isObserved: boolean;
};

const map = new WeakMap<Element, EntryCtx>();

const ob = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const entryCtx = map.get(entry.target);

    if (!entryCtx) continue;

    const { notify, opts } = entryCtx;
    const { enableRAF, allowFirstNotify } = opts;

    // 人为控制是否要 向外通知 初次的尺寸变化
    if (!allowFirstNotify && !entryCtx._isObserved) {
      entryCtx._isObserved = true; // 标记 已观测
      continue;
    }

    if (!entryCtx._isObserved) {
      entryCtx._isObserved = true; // 标记 已观测
    }

    const payload = {
      innerWidth: entry.contentBoxSize[0].inlineSize,
      innerHeight: entry.contentBoxSize[0].blockSize,
      outerWidth: entry.borderBoxSize[0].inlineSize,
      outerHeight: entry.borderBoxSize[0].blockSize,
    };

    if (!enableRAF) {
      notify(payload);
      continue;
    }

    // 只关心(一帧内)最终变化
    if (entryCtx.rafId) {
      cancelAnimationFrame(entryCtx.rafId);
    }
    entryCtx.rafId = requestAnimationFrame(() => {
      entryCtx.rafId = void 0;
      notify(payload);
    });
  }
});

export const addResizeObserver = (
  target: Element, //
  notify: EntryCtx['notify'],
  opts?: EntryOpts
) => {
  const _opts = {
    enableRAF: true, //
    allowFirstNotify: false,
    ...opts,
  };

  map.set(target, {
    notify, //
    opts: _opts,
    _isObserved: false,
  });

  ob.observe(target);

  return () => {
    const entryCtx = map.get(target);
    if (entryCtx?.rafId) {
      cancelAnimationFrame(entryCtx.rafId);
    }

    ob.unobserve(target);
  };
};

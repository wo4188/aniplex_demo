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
};

type EntryCtx = {
  notify: (boxSize: BoxSize) => void;
  opts: EntryOpts;
  rafId?: number;
};

const map = new WeakMap<Element, EntryCtx>();

const ob = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const entryCtx = map.get(entry.target);
    if (!entryCtx) continue;

    const { notify, opts } = entryCtx;

    const payload = {
      innerWidth: entry.contentBoxSize[0].inlineSize,
      innerHeight: entry.contentBoxSize[0].blockSize,
      outerWidth: entry.borderBoxSize[0].inlineSize,
      outerHeight: entry.borderBoxSize[0].blockSize,
    };

    if (!opts.enableRAF) {
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
    ...opts,
  };

  map.set(target, { notify, opts: _opts });
  ob.observe(target);

  return () => {
    const entryCtx = map.get(target);
    if (entryCtx?.rafId) {
      cancelAnimationFrame(entryCtx.rafId);
    }

    ob.unobserve(target);
  };
};

import type { Config } from 'postcss-load-config';
import postcssImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
// import cssnano from 'cssnano';

export default {
  plugins: [
    postcssImport(), //
    postcssPresetEnv(),
    // cssnano(), // 优先使用 vite 的 cssMinify
  ],
} satisfies Config;

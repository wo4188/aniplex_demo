import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // open: '/e-signature.html',
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      // input: resolve(__dirname, 'e-signature.html'),
    },
    // cssMinify: false,
  },
});

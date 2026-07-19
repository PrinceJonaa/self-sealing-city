import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        tower: resolve(import.meta.dirname, 'index.html'),
        city: resolve(import.meta.dirname, 'city.html'),
      },
    },
  },
});

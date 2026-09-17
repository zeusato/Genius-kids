import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  root, base: './', publicDir: false, envDir: root, envPrefix: 'FARM_LAB_',
  plugins: [react()], css: { postcss: { plugins: [] } },
  server: { host: '127.0.0.1', port: 4328, strictPort: true, watch: { awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 30 } } },
  build: { outDir: '.build', emptyOutDir: true, sourcemap: true },
  cacheDir: '.vite-cache',
});

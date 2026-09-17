import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: { include: ['tests/**/*.check.ts'], environment: 'node' },
  cacheDir: '.vite-cache/tests',
});

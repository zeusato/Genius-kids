import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({ root: fileURLToPath(new URL('.', import.meta.url)), cacheDir: '.vitest-cache', test: { include: ['**/*.test.ts'], exclude: ['.build/**'], environment: 'node', maxWorkers: 2, testTimeout: 120000 } });

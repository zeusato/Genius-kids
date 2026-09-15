import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const directory = new URL('../.bench/', import.meta.url);
await mkdir(directory, { recursive: true });
const out = new URL('runner.mjs', directory);
await build({ entryPoints: [fileURLToPath(new URL('benchmark.ts', import.meta.url))], outfile: fileURLToPath(out), platform: 'node', target: 'node22', format: 'esm', bundle: true, logLevel: 'silent' });
await import(out.href);

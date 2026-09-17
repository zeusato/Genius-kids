import { build } from 'esbuild';
// Bundle in memory to run the same TypeScript engine, with no generated source files.
const result = await build({ entryPoints: ['games/Caro/benchmark.ts'], bundle: true, write: false, platform: 'node', format: 'cjs' });
new Function(result.outputFiles[0].text)();

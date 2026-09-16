// Same pre-generated Google TTS workflow as generate-preschool-audio.mjs.
// All output stays in public/audio/vi, which the existing PWA precaches.
import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
const bundle = await build({ entryPoints: ['src/components/preschool/counting/voiceLines.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { VOICE_LINES } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
for (const [text, { file, lang }] of Object.entries(VOICE_LINES)) {
    const target = `public/audio/vi/${file}.mp3`;
    if (existsSync(target)) continue;
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${lang}&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) });
    if (!response.ok || !response.headers.get('content-type')?.includes('audio')) throw new Error(`Audio generation failed: ${file}, ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 100) throw new Error(`Empty audio: ${file}`);
    await writeFile(target, bytes);
    console.log(`${file}: ${bytes.length} bytes`);
}

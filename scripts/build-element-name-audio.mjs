// Tải sẵn giọng đọc tên nguyên tố (giọng online Google Translate TTS, nữ) thành MP3 local:
//   public/audio/en/elements/<slug>.mp3   — 105 tên IUPAC đọc tiếng Anh (hydrogen, oxygen…)
//   public/audio/vi/elements/<slug>.mp3   — 13 tên Việt theo SGK (sắt, vàng, natri…)
//   src/data/periodic/nameAudio.json      — danh sách slug đã có file (trang chỉ phát file có thật)
// Chạy lại an toàn: file đã có thì bỏ qua. node scripts/build-element-name-audio.mjs [--force]
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const load = (rel) => {
    const out = esbuild.transformSync(readFileSync(path.join(ROOT, rel), 'utf8'), { loader: 'ts', format: 'cjs' });
    const m = { exports: {} };
    new Function('module', 'exports', 'require', out.code)(m, m.exports, require);
    return m.exports;
};
const { ELEMENTS_DATA } = load('src/data/elementsData.ts');
const { VIET_NAMES, IUPAC_SPELLING } = load('src/data/periodic/names.ts');

export const slug = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const force = process.argv.includes('--force');
const jobs = ELEMENTS_DATA.map(e => {
    const z = e.atomicNumber;
    const viet = VIET_NAMES[z];
    const name = viet ?? IUPAC_SPELLING[z] ?? e.nameEn;
    return { z, name, lang: viet ? 'vi' : 'en' };
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const manifest = { en: [], vi: [] };
let fetched = 0, skipped = 0, failed = [];
for (const j of jobs) {
    const dir = path.join(ROOT, 'public', 'audio', j.lang, 'elements');
    mkdirSync(dir, { recursive: true });
    const s = slug(j.name), file = path.join(dir, `${s}.mp3`);
    if (!force && existsSync(file) && statSync(file).size > 1000) { manifest[j.lang].push(s); skipped++; continue; }
    const text = j.lang === 'vi' ? j.name.toLowerCase() : j.name;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${j.lang}&q=${encodeURIComponent(text)}`;
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        try {
            const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Referer: 'https://translate.google.com/' } });
            if (r.ok) {
                const buf = Buffer.from(await r.arrayBuffer());
                if (buf.length > 1000) { writeFileSync(file, buf); ok = true; }
            }
        } catch { /* thử lại */ }
        if (!ok) await sleep(1500 * (attempt + 1));
    }
    if (ok) { manifest[j.lang].push(s); fetched++; } else failed.push(`${j.z} ${j.name}`);
    await sleep(250);   // nhẹ tay với dịch vụ
}
manifest.en.sort(); manifest.vi.sort();
writeFileSync(path.join(ROOT, 'src', 'data', 'periodic', 'nameAudio.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`tải ${fetched}, có sẵn ${skipped}, lỗi ${failed.length}${failed.length ? ': ' + failed.join(', ') : ''}`);

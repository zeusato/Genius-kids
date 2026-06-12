// Sinh sẵn audio đọc tiếng Việt cho mục "Tìm hiểu Hệ Mặt Trời" bằng Google
// Translate TTS (miễn phí, không cần key).
//
// Vì sao phải tạo sẵn: browser hiện đại CHẶN gọi translate_tts trực tiếp từ
// trang web (ORB chặn thẻ <audio> cross-origin, fetch thì không có CORS header),
// nhưng gọi từ Node/server thì bình thường. Nội dung đọc là text tĩnh trong
// src/data nên tạo audio một lần lúc dev, commit vào public/audio/vi/ — runtime
// phát file same-origin (không bị chặn), service worker precache (chạy offline).
//
// Chạy lại khi sửa lời thoại trong solarData.ts / solarTour.ts:
//   node scripts/generate-solar-audio.mjs            (chỉ tạo file còn thiếu)
//   node scripts/generate-solar-audio.mjs --force    (tạo lại tất cả)

import { build } from 'esbuild';
import { mkdir, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'vi');
const FORCE = process.argv.includes('--force');

const TTS_MAX_CHARS = 180;
const TTS_URL = (chunk) =>
    `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=vi&ttsspeed=1&q=${encodeURIComponent(chunk)}`;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/148.0 Safari/537.36';

// Tách văn bản thành các đoạn <= TTS_MAX_CHARS, ưu tiên cắt theo câu
function splitIntoChunks(text) {
    const sentences = text.match(/[^.!?…]+[.!?…]*/g) ?? [text];
    const chunks = [];
    let current = '';
    const flush = () => { if (current) { chunks.push(current); current = ''; } };
    for (const raw of sentences) {
        let s = raw.trim();
        if (!s) continue;
        while (s.length > TTS_MAX_CHARS) {
            let cut = s.lastIndexOf(' ', TTS_MAX_CHARS);
            if (cut <= 0) cut = TTS_MAX_CHARS;
            flush();
            chunks.push(s.slice(0, cut).trim());
            s = s.slice(cut).trim();
        }
        if (!s) continue;
        if (current && current.length + 1 + s.length <= TTS_MAX_CHARS) current += ' ' + s;
        else { flush(); current = s; }
    }
    flush();
    return chunks;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchChunk(chunk, attempt = 1) {
    const res = await fetch(TTS_URL(chunk), { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('audio')) {
        if (attempt < 3) {
            await sleep(1000 * attempt);
            return fetchChunk(chunk, attempt + 1);
        }
        throw new Error(`TTS fail (${res.status} ${res.headers.get('content-type')}) cho: "${chunk.slice(0, 50)}..."`);
    }
    return Buffer.from(await res.arrayBuffer());
}

async function main() {
    // Bundle data TS -> mjs tạm để import (data là nguồn sự thật duy nhất)
    const tmp = path.join(ROOT, '.tmp-solar-data.mjs');
    await build({
        stdin: {
            contents: `export * from './src/data/solarData'; export * from './src/data/solarTour';`,
            resolveDir: ROOT,
            loader: 'ts'
        },
        bundle: true,
        format: 'esm',
        platform: 'node',
        outfile: tmp
    });
    const data = await import(pathToFileURL(tmp).href);
    await rm(tmp);

    // Danh sách cần đọc - text của body PHẢI khớp công thức trong SpeakButton.tsx
    const bodies = [
        data.SUN_DATA,
        ...data.SOLAR_SYSTEM_DATA,
        data.ASTEROID_BELT_DATA,
        ...data.MOON_DATA,
        data.PLUTO_INFO,
        data.COMET_INFO
    ];
    const items = bodies.map(b => ({
        file: `body-${b.id}.mp3`,
        text: `${b.name}. ${b.description} Sự thật thú vị: ${b.facts.join('. ')}`
    }));
    data.SOLAR_TOUR.forEach((stop, i) => items.push({ file: `tour-${i}.mp3`, text: stop.narration }));

    await mkdir(OUT_DIR, { recursive: true });

    let made = 0, skipped = 0, totalBytes = 0;
    for (const item of items) {
        const outPath = path.join(OUT_DIR, item.file);
        if (!FORCE && existsSync(outPath)) { skipped++; continue; }

        const chunks = splitIntoChunks(item.text);
        const buffers = [];
        for (const chunk of chunks) {
            buffers.push(await fetchChunk(chunk));
            await sleep(150); // lịch sự với endpoint miễn phí
        }
        const merged = Buffer.concat(buffers); // các stream MPEG nối thẳng được, browser phát bình thường
        await writeFile(outPath, merged);
        totalBytes += merged.length;
        made++;
        console.log(`✓ ${item.file} (${chunks.length} đoạn, ${(merged.length / 1024).toFixed(0)} KB)`);
    }

    console.log(`\nXong: tạo ${made}, bỏ qua ${skipped} (đã có), tổng mới ${(totalBytes / 1024 / 1024).toFixed(2)} MB -> ${path.relative(ROOT, OUT_DIR)}`);
}

main().catch(err => { console.error(err); process.exit(1); });

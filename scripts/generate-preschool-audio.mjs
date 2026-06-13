// Sinh sẵn audio đọc tiếng Việt cho các từ vựng và câu lệnh mục "Mầm non"
// bằng Google Translate TTS (gọi từ Node.js không bị chặn bởi trình duyệt).
//
// Cách chạy:
//   node scripts/generate-preschool-audio.mjs            (chỉ tạo file còn thiếu)
//   node scripts/generate-preschool-audio.mjs --force    (tạo lại tất cả)

import { build } from 'esbuild';
import { mkdir, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'vi');
const FORCE = process.argv.includes('--force');

const TTS_URL = (text) =>
    `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=vi&q=${encodeURIComponent(text)}`;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/148.0 Safari/537.36';

function getAudioSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '') // Chỉ giữ chữ, số, khoảng trắng, gạch ngang
        .trim()
        .replace(/\s+/g, '-');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchAudio(text, attempt = 1) {
    try {
        const res = await fetch(TTS_URL(text), { headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok || !(res.headers.get('content-type') || '').includes('audio')) {
            if (attempt < 3) {
                await sleep(1000 * attempt);
                return fetchAudio(text, attempt + 1);
            }
            throw new Error(`TTS fail (${res.status} ${res.headers.get('content-type')}) cho: "${text}"`);
        }
        return Buffer.from(await res.arrayBuffer());
    } catch (e) {
        if (attempt < 3) {
            await sleep(1000 * attempt);
            return fetchAudio(text, attempt + 1);
        }
        throw e;
    }
}

async function main() {
    // Bundle dữ liệu TS sang mjs tạm để import vào Node.js
    const tmp = path.join(ROOT, '.tmp-preschool-data.mjs');
    await build({
        stdin: {
            contents: `
                export { ALPHABET_DATA } from './src/data/alphabetData';
                export { COLORS_DATA } from './src/data/colorsData';
                export { COUNTING_DATA } from './src/data/countingData';
            `,
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

    const texts = new Set();

    // 1. Alphabet
    data.ALPHABET_DATA.forEach(l => {
        texts.add(`Chữ ${l.upper}`);
        texts.add(`chữ ${l.upper}`);
        texts.add(l.exampleVi); // ví dụ: "Quả táo"
    });

    // 2. Colors
    data.COLORS_DATA.forEach(c => {
        texts.add(`màu ${c.viName}`);
        texts.add(`Đây là màu ${c.viName}. Thử lại nhé!`);
    });

    // 3. Counting
    data.COUNTING_DATA.forEach(n => {
        texts.add(n.viName);
    });

    // 4. Shapes & Coloring commands
    const SHAPES = [
        { viName: 'quả bóng bay' },
        { viName: 'ngôi sao' },
        { viName: 'trái tim' },
        { viName: 'con cá' }
    ];
    SHAPES.forEach(s => {
        data.COLORS_DATA.forEach(c => {
            texts.add(`Hãy tô ${s.viName} màu ${c.viName}!`);
        });
    });

    // 5. Static commands
    texts.add("Hãy chọn chữ");
    texts.add("Hãy chọn màu");
    texts.add("Hãy chọn số");
    texts.add("Thử lại nhé!");
    texts.add("Hãy ghép chữ hoa với chữ thường!");
    texts.add("Đẹp quá!");

    await mkdir(OUT_DIR, { recursive: true });

    let made = 0, skipped = 0, totalBytes = 0;
    const slugs = [];

    // Chuyển set sang array để xử lý tuần tự
    const items = Array.from(texts).map(text => {
        const slug = getAudioSlug(text);
        slugs.push(slug);
        return { text, file: `${slug}.mp3` };
    });

    console.log(`Bắt đầu tạo ${items.length} file âm thanh tiếng Việt mầm non...\n`);

    for (const item of items) {
        const outPath = path.join(OUT_DIR, item.file);
        if (!FORCE && existsSync(outPath)) {
            skipped++;
            continue;
        }

        try {
            const buf = await fetchAudio(item.text);
            await writeFile(outPath, buf);
            totalBytes += buf.length;
            made++;
            console.log(`✓ ${item.file} -> "${item.text}" (${(buf.length / 1024).toFixed(1)} KB)`);
            await sleep(150); // lịch sự với endpoint Google
        } catch (e) {
            console.error(`✗ Lỗi khi tạo file ${item.file} cho "${item.text}":`, e.message);
        }
    }

    // Lưu file JSON danh sách các slugs được tạo sẵn vào thư mục data
    const slugsPath = path.join(ROOT, 'src', 'data', 'pregeneratedSlugs.json');
    await writeFile(slugsPath, JSON.stringify(slugs.sort(), null, 2));

    console.log(`\nHoàn thành!`);
    console.log(`- Tạo mới: ${made} file`);
    console.log(`- Bỏ qua: ${skipped} file (đã tồn tại)`);
    console.log(`- Tổng dung lượng mới: ${(totalBytes / 1024).toFixed(1)} KB`);
    console.log(`- Danh sách slugs đã lưu tại: ${path.relative(ROOT, slugsPath)}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

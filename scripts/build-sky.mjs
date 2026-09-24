/**
 * Sky pipeline: bầu trời THẬT cho scene Hệ Mặt Trời.
 *
 *  1. Sao: Yale Bright Star Catalogue 5th ed. (Hoffleit & Warren 1991, NASA ADC) — ~9.100 sao sáng
 *     hơn cấp 6,5. Nguồn tải: mirror Harvard TDC http://tdc-www.harvard.edu/catalogs/bsc5.dat.gz
 *     (cùng định dạng CDS V/50). Dữ liệu khoa học công bố tự do; ghi công trong UI.
 *     → public/sky/stars.bin: mỗi sao 8 byte = Int16×3 hướng (khung scene) + Uint8 cấp sáng + Uint8 B–V.
 *  2. Chòm sao: đường nối theo ký hiệu Bayer, tra trong catalog → public/sky/constellations.json.
 *  3. Dải Ngân Hà: ảnh 8K của Solar System Scope (CC BY 4.0), lọc trung vị để BỎ SAO (sao đã vẽ
 *     bằng điểm), làm mờ, kéo giãn mức sáng (chống banding khi nén) → public/textures/milkyway.webp.
 *
 * Khung toạ độ scene: mặt phẳng quỹ đạo XZ = mặt phẳng HOÀNG ĐẠO thật, +X = điểm xuân phân,
 * +Y = cực bắc hoàng đạo, kinh độ hoàng đạo tăng ngược chiều kim đồng hồ nhìn từ +Y (+X → −Z).
 * Nhờ vậy các chòm sao hoàng đạo nằm đúng dọc theo quỹ đạo các hành tinh, dải Ngân Hà cắt
 * hoàng đạo ~60° như bầu trời thật.
 *
 * Usage: node scripts/build-sky.mjs
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(root, '.texture-src');
const SKY_DIR = path.join(root, 'public', 'sky');
const TEX_DIR = path.join(root, 'public', 'textures');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const BSC_URL = 'http://tdc-www.harvard.edu/catalogs/bsc5.dat.gz';
const MW_URL = 'https://www.solarsystemscope.com/textures/download/8k_stars_milky_way.jpg';

async function fetchTo(url, dest, minBytes) {
    if (existsSync(dest)) return;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < minBytes) throw new Error(`${url} quá nhỏ (${buf.length} B) — có thể là trang chặn bot`);
    await writeFile(dest, buf);
    console.log(`downloaded ${path.basename(dest)} (${(buf.length / 1024).toFixed(0)} KB)`);
}

// ---------- Toán toạ độ ----------
const DEG = Math.PI / 180;
const OBLIQUITY = 23.4392911 * DEG; // J2000
// Xích đạo J2000 → thiên hà (IAU, Hipparcos)
const EQ_TO_GAL = [
    [-0.0548755604, -0.8734370902, -0.4838350155],
    [+0.4941094279, -0.4448296300, +0.7469822445],
    [-0.8676661490, -0.1980763734, +0.4559837762]
];
const mulMV = (m, v) => [0, 1, 2].map((i) => m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2]);
const transpose = (m) => m[0].map((_, j) => m.map((r) => r[j]));
const mulMM = (a, b) => a.map((r) => b[0].map((_, j) => r.reduce((s, x, k) => s + x * b[k][j], 0)));

// xích đạo → hoàng đạo (quay quanh X một góc ε)
const EQ_TO_ECL = [
    [1, 0, 0],
    [0, Math.cos(OBLIQUITY), Math.sin(OBLIQUITY)],
    [0, -Math.sin(OBLIQUITY), Math.cos(OBLIQUITY)]
];
// hoàng đạo → scene: (x, y, z)_scene = (xe, ze, −ye)
const ECL_TO_SCENE = [
    [1, 0, 0],
    [0, 0, 1],
    [0, -1, 0]
];
const EQ_TO_SCENE = mulMM(ECL_TO_SCENE, EQ_TO_ECL);
const SCENE_TO_GAL = mulMM(EQ_TO_GAL, transpose(EQ_TO_SCENE));

const eqVec = (raRad, decRad) => [Math.cos(decRad) * Math.cos(raRad), Math.cos(decRad) * Math.sin(raRad), Math.sin(decRad)];

// ---------- Đọc catalog ----------
function parseCatalog(text) {
    const stars = [];
    for (const line of text.split('\n')) {
        if (line.length < 114) continue;
        const rah = line.slice(75, 77).trim();
        const vmag = line.slice(102, 107).trim();
        if (!rah || !vmag) continue; // 14 mục là sao mới/thiên hà — không có toạ độ
        const ra = (parseInt(rah) + parseInt(line.slice(77, 79)) / 60 + parseFloat(line.slice(79, 83)) / 3600) * 15 * DEG;
        const sign = line[83] === '-' ? -1 : 1;
        const dec = sign * (parseInt(line.slice(84, 86)) + parseInt(line.slice(86, 88)) / 60 + parseInt(line.slice(88, 90)) / 3600) * DEG;
        const bvStr = line.slice(109, 114).trim();
        stars.push({
            hr: parseInt(line.slice(0, 4)),
            bayer: line.slice(7, 10).trim(),
            sup: line.slice(10, 11).trim(),
            con: line.slice(11, 14).trim(),
            ra,
            dec,
            glon: parseFloat(line.slice(90, 96)),
            glat: parseFloat(line.slice(96, 102)),
            vmag: parseFloat(vmag),
            bv: bvStr ? parseFloat(bvStr) : 0.6
        });
    }
    return stars;
}

// ---------- Chòm sao (đường nối theo Bayer) — tên tiếng Việt ----------
const CONSTELLATIONS = [
    { con: 'Ori', name: 'Thợ Săn (Lạp Hộ)', lines: [['Alp', 'Gam'], ['Alp', 'Zet'], ['Gam', 'Del'], ['Del', 'Eps'], ['Eps', 'Zet'], ['Zet', 'Kap'], ['Del', 'Bet'], ['Alp', 'Lam'], ['Gam', 'Lam']] },
    { con: 'UMa', name: 'Gấu Lớn (Bắc Đẩu)', lines: [['Alp', 'Bet'], ['Bet', 'Gam'], ['Gam', 'Del'], ['Del', 'Alp'], ['Del', 'Eps'], ['Eps', 'Zet'], ['Zet', 'Eta']] },
    { con: 'Cas', name: 'Tiên Hậu', lines: [['Bet', 'Alp'], ['Alp', 'Gam'], ['Gam', 'Del'], ['Del', 'Eps']] },
    { con: 'Cru', name: 'Nam Thập Tự', lines: [['Alp', 'Gam'], ['Bet', 'Del']] },
    { con: 'Sco', name: 'Bọ Cạp (Thiên Yết)', lines: [['Bet', 'Del'], ['Del', 'Pi'], ['Del', 'Sig'], ['Sig', 'Alp'], ['Alp', 'Tau'], ['Tau', 'Eps'], ['Eps', 'Mu'], ['Mu', 'Zet'], ['Zet', 'Eta'], ['Eta', 'The'], ['The', 'Iot'], ['Iot', 'Kap'], ['Kap', 'Lam']] },
    { con: 'Cyg', name: 'Thiên Nga', lines: [['Alp', 'Gam'], ['Gam', 'Eta'], ['Eta', 'Bet'], ['Del', 'Gam'], ['Gam', 'Eps']] },
    { con: 'Leo', name: 'Sư Tử', lines: [['Alp', 'Eta'], ['Eta', 'Gam'], ['Gam', 'Zet'], ['Zet', 'Mu'], ['Mu', 'Eps'], ['Gam', 'Del'], ['Del', 'Bet'], ['Bet', 'The'], ['The', 'Alp']] },
    { con: 'Lyr', name: 'Thiên Cầm', lines: [['Alp', 'Eps'], ['Alp', 'Zet'], ['Zet', 'Del'], ['Del', 'Gam'], ['Gam', 'Bet'], ['Bet', 'Zet']] }
];

function findStar(stars, con, bayer) {
    const c = stars.filter((s) => s.con === con && s.bayer === bayer);
    if (!c.length) throw new Error(`Không tìm thấy ${bayer} ${con} trong catalog`);
    return c.reduce((a, b) => (b.vmag < a.vmag ? b : a)); // nhiều thành phần (Alp1/Alp2) → lấy sao sáng nhất
}

async function main() {
    await mkdir(SRC_DIR, { recursive: true });
    await mkdir(SKY_DIR, { recursive: true });
    const bscPath = path.join(SRC_DIR, 'bsc5.dat.gz');
    const mwPath = path.join(SRC_DIR, '8k_stars_milky_way.jpg');
    await fetchTo(BSC_URL, bscPath, 200 * 1024);
    await fetchTo(MW_URL, mwPath, 500 * 1024);

    const stars = parseCatalog(zlib.gunzipSync(await readFile(bscPath)).toString('latin1'));
    console.log(`catalog: ${stars.length} sao`);

    // Kiểm tra ma trận: toạ độ thiên hà tự tính vs cột GLON/GLAT của catalog
    let errSum = 0, errMax = 0;
    for (const s of stars) {
        const g = mulMV(EQ_TO_GAL, eqVec(s.ra, s.dec));
        const l = ((Math.atan2(g[1], g[0]) / DEG) + 360) % 360;
        const b = Math.asin(g[2]) / DEG;
        const a1 = [Math.cos(b * DEG) * Math.cos(l * DEG), Math.cos(b * DEG) * Math.sin(l * DEG), Math.sin(b * DEG)];
        const a2 = [Math.cos(s.glat * DEG) * Math.cos(s.glon * DEG), Math.cos(s.glat * DEG) * Math.sin(s.glon * DEG), Math.sin(s.glat * DEG)];
        const err = Math.acos(Math.min(1, a1[0] * a2[0] + a1[1] * a2[1] + a1[2] * a2[2])) / DEG;
        errSum += err;
        errMax = Math.max(errMax, err);
    }
    console.log(`kiểm tra ma trận xích đạo→thiên hà: sai số TB ${(errSum / stars.length).toFixed(3)}°, max ${errMax.toFixed(3)}°`);
    if (errSum / stars.length > 0.2) throw new Error('Ma trận toạ độ sai!');

    // Ảnh Ngân Hà: DÒ quy ước toạ độ của ảnh (chiều kinh độ, gốc kinh độ, lật dọc) bằng cách đo
    // độ nổi của điểm ảnh tại vị trí ~150 sao sáng nhất (điểm ảnh trừ nền xung quanh để dải Ngân Hà
    // không gây nhiễu). Quy ước đúng cho đỉnh vượt hẳn (đo 09/2026: 227 vs ≤12) — ảnh SSS là
    // u = 0,5 − l/360 và LẬT DỌC (bắc thiên hà ở dưới). Không dò thì dán bầu trời bị ngược.
    const { data: raw, info } = await sharp(mwPath, { limitInputPixels: false }).greyscale().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const bright = stars.filter((s) => s.vmag < 3.0);
    const px = (x, y) => raw[Math.min(H - 1, Math.max(0, y)) * W + ((x % W) + W) % W];
    const score = (sign, offset, latSign) => {
        let sum = 0;
        for (const s of bright) {
            const u = 0.5 + offset + (sign * s.glon) / 360;
            const x = Math.floor((((u % 1) + 1) % 1) * W);
            const y = Math.floor((0.5 - (latSign * s.glat) / 180) * H);
            let peak = 0, bg = 0, n = 0;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) peak = Math.max(peak, px(x + dx, y + dy));
            for (let dy = -12; dy <= 12; dy += 6) for (let dx = -12; dx <= 12; dx += 6) { bg += px(x + dx, y + dy); n++; }
            sum += peak - bg / n;
        }
        return sum / bright.length;
    };
    const options = [];
    for (const latSign of [1, -1]) for (const sign of [1, -1]) for (let k = 0; k < 720; k++) {
        options.push({ sign, offset: k / 720, latSign, score: score(sign, k / 720, latSign) });
    }
    options.sort((a, b) => b.score - a.score);
    const conv = options[0];
    console.log(`quy ước ảnh Ngân Hà: sign=${conv.sign} offset=${conv.offset.toFixed(4)} latSign=${conv.latSign} → ${conv.score.toFixed(1)} (hạng 2: ${options[1].score.toFixed(1)})`);
    if (conv.score < options[1].score * 3) throw new Error('Không dò được quy ước ảnh Ngân Hà — kiểm tra bằng mắt!');

    // stars.bin
    const buf = Buffer.alloc(stars.length * 8);
    stars.forEach((s, i) => {
        const d = mulMV(EQ_TO_SCENE, eqVec(s.ra, s.dec));
        buf.writeInt16LE(Math.round(d[0] * 32767), i * 8);
        buf.writeInt16LE(Math.round(d[1] * 32767), i * 8 + 2);
        buf.writeInt16LE(Math.round(d[2] * 32767), i * 8 + 4);
        buf.writeUInt8(Math.max(0, Math.min(255, Math.round((s.vmag + 2) * 25))), i * 8 + 6);
        buf.writeUInt8(Math.max(0, Math.min(255, Math.round((s.bv + 0.5) * 85))), i * 8 + 7);
    });
    await writeFile(path.join(SKY_DIR, 'stars.bin'), buf);
    console.log(`stars.bin: ${stars.length} sao, ${(buf.length / 1024).toFixed(0)} KB`);

    // constellations.json — đoạn thẳng theo chỉ số sao trong stars.bin
    const indexOf = new Map(stars.map((s, i) => [s, i]));
    const cons = CONSTELLATIONS.map((c) => {
        const segs = c.lines.map(([a, b]) => [indexOf.get(findStar(stars, c.con, a)), indexOf.get(findStar(stars, c.con, b))]);
        return { id: c.con, name: c.name, segments: segs };
    });
    await writeFile(path.join(SKY_DIR, 'constellations.json'), JSON.stringify(cons));
    console.log(`constellations.json: ${cons.length} chòm, ${cons.reduce((a, c) => a + c.segments.length, 0)} đoạn`);

    // Ngân Hà: bỏ sao (median), làm mờ, kéo giãn mức sáng
    const MW_W = 1024, MW_H = 512;
    // Ảnh gốc gần đen chỉ có ~25 mức sáng → kéo giãn TRƯỚC rồi mới làm mờ, để phép mờ tạo
    // mức trung gian (làm mờ trước rồi kéo giãn sẽ ra các bậc phân tầng rõ rệt)
    const small = await sharp(mwPath, { limitInputPixels: false })
        .resize(2048, 1024, { fit: 'fill' })
        .median(7)
        .removeAlpha()
        .raw()
        .toBuffer();
    const sorted = Uint8Array.from(small).sort();
    const p999 = Math.max(8, sorted[Math.floor(sorted.length * 0.999)]);
    const gain = Math.min(12, 250 / p999);
    const stretched = await sharp(small, { raw: { width: 2048, height: 1024, channels: 3 } })
        .linear(gain, 0)
        .raw()
        .toBuffer();
    await sharp(stretched, { raw: { width: 2048, height: 1024, channels: 3 } })
        .blur(6)
        .resize(MW_W, MW_H, { fit: 'fill' })
        .webp({ quality: 92, smartSubsample: true })
        .toFile(path.join(TEX_DIR, 'milkyway.webp'));
    console.log(`milkyway.webp: ${MW_W}x${MW_H}, gain ×${gain.toFixed(2)}`);

    const meta = {
        source: 'Yale Bright Star Catalogue 5th ed. (Hoffleit & Warren 1991, NASA ADC); Milky Way: Solar System Scope (CC BY 4.0)',
        starCount: stars.length,
        magEncoding: 'vmag = byte/25 - 2',
        bvEncoding: 'bv = byte/85 - 0.5',
        // u = 0.5 + lonOffset + lonSign·l/360 ; hàng ảnh (từ trên) = 0.5 − latSign·b/180
        milkyWay: { gain, lonSign: conv.sign, lonOffset: conv.offset, latSign: conv.latSign },
        // hàng-chính (row-major) 3×3: hướng scene → hướng thiên hà
        sceneToGalactic: SCENE_TO_GAL.flat().map((x) => +x.toFixed(9))
    };
    await writeFile(path.join(SKY_DIR, 'sky-meta.json'), JSON.stringify(meta, null, 2));
    console.log('sky-meta.json ok');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

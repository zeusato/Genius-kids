#!/usr/bin/env node
// Atlas hình bóng sinh vật cho Cây Tiến Hóa (docs/evolution-tree-wow/data-spec.md mục K).
//   npm run evo-art            dùng scripts/evo-art/chosen.json nếu có (tái lập được)
//   npm run evo-art -- --refresh   tra lại PhyloPic từ đầu
// Nguồn: PhyloPic API v2 — CHỈ nhận CC0 / Public Domain Mark / CC BY 3.0 / 4.0 (tự kiểm URL giấy phép,
// không tin mù bộ lọc: `filter_license_nc=false` mới là LOẠI ảnh NC). Vi khuẩn/cổ khuẩn + dự phòng: glyph vẽ bằng code.
// Đầu ra: public/evolution/{atlas.webp, atlas.json, credits.json} + scripts/evo-art/contact-sheet.png (để duyệt).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT = path.join(ROOT, 'public/evolution');
const WORK = path.join(ROOT, 'scripts/evo-art');
const CACHE = path.join(WORK, 'cache');
const REFRESH = process.argv.includes('--refresh');
const API = 'https://api.phylopic.org';
const OK_LICENSES = [
    'creativecommons.org/publicdomain/zero/1.0',
    'creativecommons.org/publicdomain/mark/1.0',
    'creativecommons.org/licenses/by/3.0',
    'creativecommons.org/licenses/by/4.0',
];
const CELL = 128, COLS = 16, SIZE = CELL * COLS, PAD = 8;

// ---- ánh xạ id → nguồn hình (data-spec K3). 'glyph:x' = vẽ bằng code ----
const G = (g) => `glyph:${g}`;
const TAXA = {
    // vi khuẩn & cổ khuẩn
    rhizobium_example: [G('rod')], ecoli_example: [G('rod-flagella')], salmonella_example: [G('rod-flagella')],
    pseudomonas_example: [G('rod-polar')], beta_proteobacteria: [G('coccobacillus')], delta_epsilon_proteobacteria: [G('vibrio')],
    lactobacillus_example: [G('rod-chain')], bacillus_example: [G('rod-spore')], clostridium_example: [G('rod-spore-end')],
    anabaena_example: [G('filament')], streptomyces_example: [G('hyphae')], bacteroides_example: [G('rod')],
    borrelia_example: [G('spirochete')], methanobrevibacter_example: [G('coccobacillus')], methanosarcina_example: [G('coccus-cluster')],
    halobacterium_example: [G('rod')], sulfolobus_example: [G('lobed')], thermoproteus_example: [G('rod-thin')],
    nitrosopumilus_example: [G('rod-thin')], lokiarchaeum_example: [G('tentacled')],
    // nguyên sinh
    amoeba_example: ['amoeba proteus', 'amoebozoa', G('amoeba')], physarum_example: ['physarum polycephalum', G('amoeba')],
    kelp_example: ['macrocystis', 'laminariales'], diatom_example: ['bacillariophyta', G('diatom')],
    phytophthora_example: ['phytophthora', 'oomycota', G('hyphae')], paramecium_example: ['paramecium'],
    plasmodium_example: ['plasmodium falciparum', 'plasmodium'], euglena_example: ['euglena'],
    red_algae_example: ['rhodophyta'], chlamydomonas_example: ['chlamydomonas'],
    green_algae_plants: ['chara', 'charophyta', 'zygnematophyceae'],
    // nấm
    chytrid_example: ['batrachochytrium', 'chytridiomycota', G('chytrid')], rhizopus_example: ['rhizopus', 'mucorales', G('sporangia')],
    blue_mold_example: ['penicillium', G('conidiophore')], truffle_example: ['tuber', 'pezizales', G('truffle')],
    baker_yeast_example: ['saccharomyces cerevisiae'], agaricus_example: ['amanita muscaria', 'boletus edulis', G('mushroom')],
    polypore_example: ['trametes', 'polyporales'], puffball_detail_example: ['calvatia gigantea', 'lycoperdon', G('puffball')],
    // thực vật
    mosses: ['bryophyta', 'polytrichum'], ferns: ['polypodiopsida'], pine_spruce_fir_examples: ['pinus', 'pinaceae'],
    flowering_plants_monocots: ['oryza sativa', 'zea mays', 'poaceae'], flowering_plants_dicots: ['helianthus annuus', 'rosa', 'eudicotyledons'],
    // không xương sống
    calcarea: ['calcarea'], demospongiae: ['demospongiae'], hexactinellida: ['euplectella', 'hexactinellida'], homoscleromorpha: ['homoscleromorpha'],
    hydrozoa: ['hydra', 'hydrozoa'], scyphozoa: ['aurelia aurita', 'scyphozoa'], anthozoa: ['actiniaria', 'anthozoa'], cubozoa: ['cubozoa'],
    planarians: ['tricladida'], tapeworms: ['taenia', 'cestoda'], flukes: ['fasciola hepatica', 'trematoda'],
    earthworms: ['lumbricus terrestris', 'lumbricidae'], leeches: ['hirudo medicinalis', 'hirudinea'], polychaetes: ['nereididae', 'polychaeta'],
    snails: ['cornu aspersum', 'helix pomatia', 'stylommatophora'], slugs: ['arion', 'limax'], clams_oysters: ['mytilus', 'cardiidae', 'veneridae', 'bivalvia'],
    octopuses: ['octopus vulgaris', 'octopus'], squids: ['loligo', 'teuthida'], nautilus: ['nautilus pompilius', 'nautilus'], ammonites: ['ammonoidea'],
    pinworms: ['enterobius vermicularis', 'nematoda'], hookworms: ['ancylostoma', 'nematoda'],
    trilobites: ['trilobita'], spiders_scorpions_ticks: ['araneae', 'arachnida'], centipedes_millipedes: ['scolopendra', 'chilopoda'],
    crabs_shrimps_lobsters: ['brachyura', 'decapoda'], butterflies_beetles_bees: ['apis mellifera', 'papilionoidea', 'insecta'],
    sea_stars: ['asteroidea'], sea_urchins: ['echinoidea'], sea_cucumbers: ['holothuroidea'], brittle_stars: ['ophiuroidea'],
    // có xương sống
    jawless_fish: ['petromyzon marinus', 'petromyzontiformes'], cartilaginous_fish: ['carcharodon carcharias', 'selachimorpha'],
    ray_finned_fish: ['salmo salar', 'actinopterygii'], coelacanths: ['latimeria chalumnae'], lungfish: ['protopterus', 'neoceratodus forsteri', 'dipnoi'],
    frogs_toads: ['rana', 'anura'], salamanders_newts: ['salamandra salamandra', 'caudata'], caecilians: ['gymnophiona'],
    early_synapsids: ['dimetrodon'], dicynodonts: ['lystrosaurus', 'dicynodontia'], monotremes: ['ornithorhynchus anatinus'],
    marsupials: ['macropus giganteus', 'phascolarctos cinereus', 'vombatus ursinus'], african_elephant: ['loxodonta africana'], asian_elephant: ['elephas maximus'],
    mammoth: ['mammuthus primigenius'], lemurs: ['lemur catta', 'lemuriformes'], new_world_monkeys: ['ateles', 'platyrrhini'],
    old_world_monkeys: ['macaca', 'cercopithecidae'], orangutans: ['pongo'], gorillas: ['gorilla gorilla', 'gorilla'],
    chimpanzees: ['pan troglodytes'], humans: ['homo sapiens'], rodents: ['mus musculus', 'rodentia'], bats: ['pteropus', 'chiroptera'],
    carnivores: ['vulpes vulpes', 'canis lupus', 'carnivora'], odd_toed: ['equus', 'perissodactyla'], cows_deer: ['bos taurus', 'cervus', 'ruminantia'],
    pigs: ['sus scrofa'], hippos: ['hippopotamus amphibius'], whales_dolphins: ['megaptera novaeangliae', 'tursiops truncatus', 'cetacea'],
    turtles: ['chelonia mydas', 'testudines'], tuatara: ['sphenodon punctatus'], lizards_snakes: ['varanus', 'squamata'],
    crocodilians: ['crocodylus', 'crocodylia'], ornithischia: ['triceratops', 'stegosaurus', 'ornithischia'],
    sauropods: ['brachiosaurus', 'diplodocus', 'sauropoda'], trex: ['tyrannosaurus rex'], flightless_birds: ['struthio camelus', 'palaeognathae'],
    birds_of_prey: ['aquila chrysaetos', 'accipitridae'], songbirds: ['passer domesticus', 'passeriformes'],
    // node trong có glyph riêng
    eukarya: [G('eukaryote-cell')],
};
// node trong mượn hình của một ngọn (nhìn xa)
const REP_ICON = {
    bacteria: 'ecoli_example', archaea: 'sulfolobus_example', amoebozoa: 'amoeba_example', fungi_simple: 'agaricus_example',
    animalia: 'carnivores', porifera: 'hexactinellida', cnidaria: 'scyphozoa', arthropoda: 'butterflies_beetles_bees', mollusca: 'octopuses',
    echinodermata: 'sea_stars', vertebrates: 'ray_finned_fish', tetrapods: 'frogs_toads', mammals: 'african_elephant', primates: 'chimpanzees',
    dinosaurs: 'trex', birds: 'songbirds', archaeplastida: 'red_algae_example', plantae_simple: 'flowering_plants_dicots', land_plants: 'ferns',
    seed_plants: 'pine_spruce_fir_examples', sar: 'kelp_example', stramenopiles: 'diatom_example', alveolates: 'paramecium_example',
};

// ---- glyph SVG (trắng, khung 128) ----
const wav = (x0, y0, len, amp, turns, ang = 0) => {
    const pts = [];
    for (let k = 0; k <= 24; k++) { const s = k / 24; const x = s * len, y = Math.sin(s * turns * Math.PI * 2) * amp; pts.push([x0 + x * Math.cos(ang) - y * Math.sin(ang), y0 + x * Math.sin(ang) + y * Math.cos(ang)]); }
    return `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L')}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
};
const rod = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#fff"/>`;
const GLYPHS = {
    rod: () => rod(29, 50, 70, 28),
    'rod-flagella': () => rod(34, 50, 60, 28) + [[34, 56, Math.PI * 0.9], [34, 72, Math.PI * 1.1], [94, 56, -0.1], [94, 72, 0.15], [58, 50, -Math.PI / 2], [72, 78, Math.PI / 2]].map(([x, y, a]) => wav(x, y, 28, 3, 1.5, a)).join(''),
    'rod-polar': () => rod(24, 52, 56, 24) + wav(80, 64, 40, 5, 1.8, 0),
    'rod-chain': () => [16, 50, 84].map(x => rod(x, 54, 30, 20)).join(''),
    'rod-spore': () => rod(26, 48, 76, 32) + `<ellipse cx="64" cy="64" rx="12" ry="9" fill="#000" fill-opacity="0.55"/>`,
    'rod-spore-end': () => rod(22, 52, 66, 24) + `<circle cx="96" cy="64" r="15" fill="#fff"/><circle cx="96" cy="64" r="8" fill="#000" fill-opacity="0.5"/>`,
    'rod-thin': () => rod(18, 57, 92, 14),
    coccobacillus: () => `<ellipse cx="64" cy="64" rx="26" ry="19" fill="#fff"/>`,
    'coccus-cluster': () => [0, 1, 2].flatMap(r => [0, 1, 2].map(c => `<circle cx="${40 + c * 24}" cy="${40 + r * 24}" r="11" fill="#fff"/>`)).join(''),
    filament: () => [0, 1, 2, 3, 4, 5, 6].map(k => `<circle cx="${14 + k * 16.5}" cy="${64 + Math.sin(k * 0.9) * 8}" r="${k === 3 ? 10.5 : 7.5}" fill="#fff"/>`).join(''),
    hyphae: () => `<path d="M64 112 L64 70 L40 40 M64 70 L90 44 M52 55 L34 60 M78 57 L100 64 M40 40 L30 22 M40 40 L52 22 M90 44 L84 22 M90 44 L106 30" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` + [[30, 18], [52, 18], [84, 18], [108, 26], [30, 60], [102, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff"/>`).join(''),
    spirochete: () => wav(10, 64, 108, 12, 5, 0).replace('stroke-width="3"', 'stroke-width="8"'),
    vibrio: () => `<path d="M34 76 Q64 34 94 60" fill="none" stroke="#fff" stroke-width="20" stroke-linecap="round"/>` + wav(94, 60, 26, 3, 1.5, -0.3),
    lobed: () => `<path d="M64 26 C80 26 84 38 94 40 C108 44 104 60 100 66 C106 80 96 94 82 92 C74 104 58 104 50 94 C34 98 24 86 28 74 C18 64 24 48 36 46 C40 32 52 26 64 26 Z" fill="#fff"/>`,
    tentacled: () => `<circle cx="64" cy="64" r="20" fill="#fff"/>` + [0, 1, 2, 3, 4, 5, 6].map(k => { const a = k / 7 * Math.PI * 2; const x1 = 64 + Math.cos(a) * 18, y1 = 64 + Math.sin(a) * 18, x2 = 64 + Math.cos(a + 0.25) * 52, y2 = 64 + Math.sin(a + 0.25) * 52; return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q${(64 + Math.cos(a) * 40).toFixed(1)} ${(64 + Math.sin(a) * 40).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`; }).join(''),
    amoeba: () => `<path d="M60 30 C74 22 84 40 80 50 C96 44 110 58 98 70 C112 84 92 100 80 88 C76 104 54 106 52 92 C36 102 18 88 30 76 C14 70 18 52 34 54 C30 40 46 30 60 30 Z" fill="#fff"/><circle cx="62" cy="66" r="9" fill="#000" fill-opacity="0.5"/>`,
    diatom: () => `<ellipse cx="64" cy="64" rx="48" ry="18" fill="#fff"/>` + [-36, -24, -12, 0, 12, 24, 36].map(x => `<line x1="${64 + x}" y1="50" x2="${64 + x}" y2="78" stroke="#000" stroke-opacity="0.45" stroke-width="2.5"/>`).join('') + `<line x1="20" y1="64" x2="108" y2="64" stroke="#000" stroke-opacity="0.45" stroke-width="2"/>`,
    chytrid: () => `<circle cx="58" cy="52" r="22" fill="#fff"/><path d="M50 72 L40 100 M58 74 L60 106 M66 72 L78 98" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>` + wav(78, 40, 34, 4, 1.5, -0.5),
    sporangia: () => [[40, 112, 36, 34], [64, 112, 64, 22], [88, 112, 92, 38]].map(([x0, y0, x1, y1]) => `<path d="M${x0} ${y0} Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + 8} ${x1} ${y1}" stroke="#fff" stroke-width="4" fill="none"/><circle cx="${x1}" cy="${y1 - 8}" r="12" fill="#fff"/>`).join(''),
    conidiophore: () => `<path d="M64 114 L64 58 M64 58 L46 40 M64 58 L64 36 M64 58 L82 40" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>` + [[46, 40], [64, 36], [82, 40]].flatMap(([x, y]) => [0, 1, 2, 3].map(k => `<circle cx="${x}" cy="${y - k * 8}" r="4" fill="#fff"/>`)).join(''),
    truffle: () => `<circle cx="64" cy="64" r="36" fill="#fff"/>` + Array.from({ length: 14 }, (_, k) => { const a = k * 2.4, r = 10 + (k % 3) * 9; return `<circle cx="${(64 + Math.cos(a) * r).toFixed(1)}" cy="${(64 + Math.sin(a) * r).toFixed(1)}" r="3.2" fill="#000" fill-opacity="0.4"/>`; }).join(''),
    mushroom: () => `<path d='M14 66 C14 30 114 30 114 66 Z' fill='#fff'/><rect x='52' y='64' width='24' height='44' rx='10' fill='#fff'/>`.replace(/'/g, '"'),
    puffball: () => `<ellipse cx='64' cy='66' rx='40' ry='34' fill='#fff'/><rect x='54' y='92' width='20' height='16' rx='6' fill='#fff'/>`.replace(/'/g, '"') + Array.from({ length: 10 }, (_, k) => `<circle cx="${(40 + (k % 5) * 12)}" cy="${50 + Math.floor(k / 5) * 14}" r="3" fill="#000" fill-opacity="0.35"/>`).join(''),
    'eukaryote-cell': () => `<circle cx="64" cy="64" r="44" fill="none" stroke="#fff" stroke-width="6"/><circle cx="58" cy="58" r="16" fill="#fff"/><ellipse cx="86" cy="82" rx="13" ry="7" transform="rotate(-30 86 82)" fill="#fff"/>`,
};
const glyphSvg = (g) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="512" height="512">${GLYPHS[g]()}</svg>`;

// ---- PhyloPic ----
async function getJson(url) {
    const key = path.join(CACHE, encodeURIComponent(url).slice(0, 180) + '.json');
    if (existsSync(key)) return JSON.parse(await readFile(key, 'utf8'));
    const res = await fetch(url, { headers: { accept: 'application/vnd.phylopic.v2+json' } });
    const j = await res.json();
    await writeFile(key, JSON.stringify(j));
    return j;
}
async function getBuffer(url) {
    const key = path.join(CACHE, encodeURIComponent(url).slice(-180));
    if (existsSync(key)) return readFile(key);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const b = Buffer.from(await res.arrayBuffer());
    await writeFile(key, b);
    return b;
}
async function buildNumber() {
    const res = await fetch(`${API}/`, { redirect: 'manual' });
    const loc = res.headers.get('location') ?? '';
    const m = /build=(\d+)/.exec(loc);
    if (m) return Number(m[1]);
    const j = await (await fetch(`${API}/nodes?page=0`)).json(); // lỗi thiếu build vẫn trả build hiện tại
    return j.build;
}
const licenseOk = (href = '') => OK_LICENSES.some(l => href.includes(l));
const licenseRank = (href = '') => href.includes('publicdomain') ? 0 : href.includes('by/4.0') ? 1 : 2;

async function findImage(build, name) {
    const nodes = await getJson(`${API}/nodes?build=${build}&filter_name=${encodeURIComponent(name)}&page=0`);
    const href = nodes?._links?.items?.[0]?.href;
    if (!href) return null;
    const uuid = href.split('/nodes/')[1].split('?')[0];
    const imgs = await getJson(`${API}/images?build=${build}&filter_clade=${uuid}&filter_license_nc=false&filter_license_sa=false&embed_items=true&page=0`);
    const items = (imgs?._embedded?.items ?? []).filter(i => licenseOk(i._links?.license?.href));
    if (!items.length) return null;
    items.sort((a, b) => {
        const ea = (a._links.specificNode?.title ?? '').toLowerCase() === name ? 0 : 1;
        const eb = (b._links.specificNode?.title ?? '').toLowerCase() === name ? 0 : 1;
        return ea - eb || licenseRank(a._links.license.href) - licenseRank(b._links.license.href);
    });
    return items[0];
}

async function silhouetteCell(svgOrPng) {
    // vẽ vào ô CELL, căn giữa, rồi đổi thành trắng giữ alpha
    const inner = CELL - PAD * 2;
    // SVG PhyloPic có viewBox rất lớn: chọn mật độ để cạnh dài ≈ 512 px (density cố định 300 vượt giới hạn pixel)
    const meta = await sharp(svgOrPng, { limitInputPixels: false }).metadata();
    const density = meta.format === 'svg' ? Math.min(600, Math.max(4, 72 * 512 / Math.max(meta.width ?? 512, meta.height ?? 512))) : 72;
    const { data, info } = await sharp(svgOrPng, { density, limitInputPixels: false }).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const out = Buffer.alloc(CELL * CELL * 4);
    const ox = Math.floor((CELL - info.width) / 2), oy = Math.floor((CELL - info.height) / 2);
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
        const s = (y * info.width + x) * 4, d = ((y + oy) * CELL + (x + ox)) * 4;
        const a = data[s + 3];
        // glyph trắng có chi tiết tối (nhân, bào tử) → giữ độ sáng làm "độ đậm" alpha
        const lum = (data[s] + data[s + 1] + data[s + 2]) / 3;
        out[d] = out[d + 1] = out[d + 2] = 255;
        out[d + 3] = svgOrPng.__glyph ? Math.round(a * (0.35 + 0.65 * lum / 255)) : a;
    }
    // hình hỏng (SVG có nền đặc → ô gần như trắng kín) thì loại
    let filled = 0; for (let k = 3; k < out.length; k += 4) if (out[k] > 128) filled++;
    if (!svgOrPng.__glyph && filled > CELL * CELL * 0.62) throw new Error('hình quá đặc (có nền?)');
    return { buf: out, aspect: info.width / info.height };
}

async function main() {
    await mkdir(OUT, { recursive: true });
    await mkdir(CACHE, { recursive: true });
    const chosenPath = path.join(WORK, 'chosen.json');
    const overridesPath = path.join(WORK, 'overrides.json');
    const chosen = !REFRESH && existsSync(chosenPath) ? JSON.parse(await readFile(chosenPath, 'utf8')) : {};
    const overrides = existsSync(overridesPath) ? JSON.parse(await readFile(overridesPath, 'utf8')) : {};
    const build = await buildNumber();
    console.log(`PhyloPic build ${build}`);

    const atlas = Buffer.alloc(SIZE * SIZE * 4);
    const items = {};
    const credits = [];
    const report = { phylopic: 0, glyph: 0, fallback: [] };
    let cell = 0;
    const place = (buf) => {
        const cx = (cell % COLS) * CELL, cy = Math.floor(cell / COLS) * CELL;
        for (let y = 0; y < CELL; y++) buf.copy(atlas, ((cy + y) * SIZE + cx) * 4, y * CELL * 4, (y + 1) * CELL * 4);
        return cell++;
    };

    for (const [id, sources] of Object.entries(TAXA)) {
        let done = false;
        for (const src of sources) {
            if (src.startsWith('glyph:')) {
                const g = src.slice(6);
                const svg = Buffer.from(glyphSvg(g)); svg.__glyph = true;
                const { buf, aspect } = await silhouetteCell(svg);
                items[id] = { i: place(buf), aspect };
                credits.push({ id, source: 'procedural', glyph: g });
                report.glyph++;
                if (sources[0] !== src) report.fallback.push(id);
                done = true; break;
            }
            try {
                let img;
                const pinned = overrides[id] ?? chosen[id]?.uuid;
                if (pinned) img = (await getJson(`${API}/images/${pinned}?build=${build}`));
                else img = await findImage(build, src);
                if (!img || !licenseOk(img._links?.license?.href)) continue;
                const vec = img._links.vectorFile?.href;
                const raster = img._links.rasterFiles?.find(r => r.sizes.startsWith('512'))?.href ?? img._links.rasterFiles?.[0]?.href;
                const buf0 = await getBuffer(vec ?? raster);
                const { buf, aspect } = await silhouetteCell(buf0);
                items[id] = { i: place(buf), aspect };
                chosen[id] = { uuid: img.uuid, taxon: img._links.specificNode?.title ?? src };
                credits.push({
                    id, source: 'phylopic', uuid: img.uuid, taxon: img._links.specificNode?.title ?? src,
                    attribution: img.attribution ?? img._links.contributor?.title ?? 'PhyloPic',
                    license: licenseName(img._links.license.href), licenseUrl: img._links.license.href,
                    pageUrl: `https://www.phylopic.org/images/${img.uuid}`,
                });
                report.phylopic++;
                if (sources[0] !== src) report.fallback.push(`${id}←${src}`);
                done = true; break;
            } catch (e) {
                console.warn(`  ! ${id} (${src}): ${e.message}`);
            }
        }
        if (!done) console.warn(`  ✗ ${id}: không có hình nào dùng được`);
        process.stdout.write('.');
    }
    for (const [id, rep] of Object.entries(REP_ICON)) if (items[rep]) items[id] = { ...items[rep], rep };

    await sharp(atlas, { raw: { width: SIZE, height: SIZE, channels: 4 } }).webp({ lossless: true, effort: 6 }).toFile(path.join(OUT, 'atlas.webp'));
    await writeFile(path.join(OUT, 'atlas.json'), JSON.stringify({ size: SIZE, cell: CELL, cols: COLS, items }, null, 1));
    await writeFile(path.join(OUT, 'credits.json'), JSON.stringify(credits, null, 1));
    await writeFile(chosenPath, JSON.stringify(chosen, null, 1));
    // bảng duyệt: atlas trên nền tối + id
    const rows = Math.ceil(cell / COLS);
    const labels = Object.entries(items).filter(([, v]) => !v.rep).map(([id, v]) =>
        `<text x="${(v.i % COLS) * CELL + 4}" y="${Math.floor(v.i / COLS) * CELL + CELL - 4}" font-size="11" fill="#fde68a" font-family="Arial">${id.slice(0, 20)}</text>`).join('');
    await sharp({ create: { width: SIZE, height: rows * CELL, channels: 4, background: '#0b1324' } })
        .composite([{ input: await sharp(atlas, { raw: { width: SIZE, height: SIZE, channels: 4 } }).extract({ left: 0, top: 0, width: SIZE, height: rows * CELL }).png().toBuffer() },
            { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${rows * CELL}">${labels}</svg>`) }])
        .png().toFile(path.join(WORK, 'contact-sheet.png'));
    console.log(`\nXong: ${cell} ô (${report.phylopic} PhyloPic, ${report.glyph} glyph). Dự phòng: ${report.fallback.join(', ') || 'không'}`);
}
function licenseName(href) {
    if (href.includes('zero')) return 'CC0 1.0';
    if (href.includes('mark')) return 'Public Domain Mark';
    if (href.includes('by/4.0')) return 'CC BY 4.0';
    return 'CC BY 3.0';
}
main().catch(e => { console.error(e); process.exit(1); });

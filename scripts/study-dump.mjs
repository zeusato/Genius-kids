// Lấy mẫu đề Ôn Luyện ngay trong Node (không cần trình duyệt).
//   node scripts/study-dump.mjs <all|g3|mn|topicId|skillId> [n=8] [--raw] [--stats]
// --raw   : gọi thẳng generator/template, KHÔNG qua bộ lọc của generateQuestions
// --stats : chỉ in bảng thống kê (số câu khác nhau / 300 lượt, % bị lọc, phân bố hạng đáp án)
import * as esbuild from 'esbuild';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const outDir = path.join(root, 'node_modules', '.cache', 'study-dump');
mkdirSync(outDir, { recursive: true });
const entry = path.join(outDir, 'entry.ts');
const out = path.join(outDir, 'entry.mjs');

const entrySrc = `
import * as engine from '@/services/mathEngine';
export { engine };
let registry: any = null;
try { registry = await import('@/services/study/registry'); } catch {}
export { registry };
`;
(await import('node:fs')).writeFileSync(entry, entrySrc);

await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error',
    alias: { '@': root },
    plugins: [{
        name: 'expose-generators', setup(b) {
            b.onLoad({ filter: /mathEngine\.ts$/ }, a => ({
                contents: readFileSync(a.path, 'utf8').replace('const generators:', 'export const generators:'),
                loader: 'ts', resolveDir: path.dirname(a.path),
            }));
        },
    }],
});

const { engine, registry } = await import(pathToFileURL(out).href);
const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--') && !/^\d+$/.test(a)) || 'all';
const n = Number(args.find(a => /^\d+$/.test(a)) || 8);
const raw = args.includes('--raw');
const statsOnly = args.includes('--stats');
const htmlOut = (() => { const i = args.indexOf('--html'); return i >= 0 ? args[i + 1] : null; })();
const htmlParts = [];

const topics = engine.TOPICS.filter(t => !t.id.includes('typing'));
const gradeOf = t => (t.grade === 0 ? 'mn' : 'g' + t.grade);
const skills = registry?.SKILL_IDS ? registry.SKILL_IDS() : [];
let units; // [{label, gen: () => q}]
if (skills.includes(target)) {
    units = [{ label: target, gen: () => registry.generate(target) }];
} else {
    const picked = topics.filter(t => target === 'all' || gradeOf(t) === target || t.id === target);
    if (!picked.length) { console.error('Không tìm thấy:', target); process.exit(1); }
    units = picked.map(t => ({
        label: t.id,
        gen: raw ? () => engine.generators[t.id]() : null,
        topic: t.id,
    }));
}

const numVal = s => {
    if (typeof s !== 'string') return null;
    const v = s.replace(/[\s ]/g, '').replace(/[^\d,./-]/g, '').replace(',', '.');
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    const f = v.match(/^(\d+)\/(\d+)$/); return f ? Number(f[1]) / Number(f[2]) : null;
};
const rows = [];
const esc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
for (const u of units) {
    const sample = u.gen ? Array.from({ length: n }, () => u.gen()) : engine.generateQuestions([u.topic], n);
    // thống kê trên 300 lượt
    const many = u.gen ? Array.from({ length: 300 }, () => u.gen()) : engine.generateQuestions([u.topic], 300);
    const uniq = new Set(many.map(q => `${q.questionText}|${(q.options || []).join('|')}|${q.correctAnswer}`)).size;
    let dropped = 0;
    if (engine.generators[u.topic]) {
        for (let i = 0; i < 300; i++) { const q = engine.generators[u.topic](); if (q.options && (q.type === 'single' || q.type === 'wrong') && new Set(q.options).size < q.options.length) dropped++; }
    }
    const rank = [0, 0, 0, 0];
    for (const q of many) {
        if (!q.options || q.options.length < 3) continue;
        const vals = q.options.map(numVal); if (vals.some(v => v === null)) continue;
        const c = numVal(q.correctAnswer); const r = vals.filter(v => v < c).length; if (r < 4) rank[r]++;
    }
    rows.push({ unit: u.label, uniq, dupOptPct: Math.round(dropped / 3), rank: rank.join('/') });
    if (htmlOut) htmlParts.push(`<h2>${u.label}</h2>` + sample.map(q => `<div class=q><b>[${q.skillId || q.type} M${q.level || ''}]</b> ${esc(q.questionText)}<div class=v>${q.visualSvg || ''}</div><div class=o>${(q.options || []).map(o => `<span${o === q.correctAnswer || (q.correctAnswers || []).includes(o) ? ' class=c' : ''}>${esc(o)}</span>`).join('')}${q.type === 'input' ? `<span class=c>${esc(q.correctAnswer)}</span>` : ''}</div><small>${esc(q.explanation)}${q.speech ? ' · 🔊 ' + esc(q.speech) : ''}</small></div>`).join(''));
    if (!statsOnly) {
        console.log(`\n### ${u.label}`);
        for (const q of sample) {
            console.log(` [${q.type}${q.skillId ? ' ' + q.skillId + ' M' + q.level : ''}${q.visualSvg || q.visual ? ' 🖼' : ''}] ${q.questionText.replace(/\n/g, ' ⏎ ')}`);
            if (q.options) console.log(`    ${q.options.join('  |  ')}`);
            console.log(`    ✔ ${JSON.stringify(q.correctAnswer ?? q.correctAnswers)}${q.accept ? ' (accept ' + q.accept.join(', ') + ')' : ''}`);
            console.log(`    💡 ${q.explanation}${q.steps ? ' | ' + q.steps.join(' → ') : ''}${q.hint ? ' | gợi ý: ' + q.hint : ''}`);
        }
    }
}
console.log('\n'); console.table(rows);
if (htmlOut) {
    const css = 'body{font-family:Nunito,Segoe UI,sans-serif;background:#faf8f0;margin:16px}.q{display:inline-block;vertical-align:top;width:300px;margin:6px;padding:10px;background:#fff;border-radius:12px;border:1px solid #dfe3d4;font-size:14px}.v svg{max-width:100%!important}.o span{display:inline-block;border:1px solid #ccc;border-radius:8px;padding:2px 8px;margin:2px}.o .c{background:#d9f2df;border-color:#2f8f5b}small{color:#60776c}';
    (await import('node:fs')).writeFileSync(htmlOut, `<!doctype html><meta charset=utf-8><style>${css}</style>${htmlParts.join('')}`);
    console.log('HTML:', htmlOut);
}

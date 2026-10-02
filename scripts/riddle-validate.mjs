// Kiểm chuẩn nội dung Đố Vui v2 (mục 5.2 docs/riddle-remake-plan.md).
// Dùng: node scripts/riddle-validate.mjs <file.json> [file2.json ...]
// Mỗi file là mảng Riddle v2; bản ghi { id, keep:false, dropReason } được bỏ qua khi kiểm.
import fs from 'node:fs';

const GATES = ['animals', 'plants', 'objects', 'nature', 'vietnam', 'words', 'tricks', 'world'];
const KINDS = ['object', 'wordplay', 'logic', 'math'];
const SOURCES = ['dân gian', 'sưu tầm', 'biên soạn'];
const CLASSIFIERS = new Set(['con', 'cái', 'chiếc', 'quả', 'trái', 'cây', 'củ', 'hoa', 'bông', 'đôi', 'cặp', 'tấm', 'viên', 'ngọn', 'cục', 'tờ', 'quyển', 'cuốn', 'bức', 'the', 'a', 'an']);
const META = /(tránh câu|đã dùng|sửa lại|câu đố này|biên soạn|watermelon|turtle đã|TODO|lưu ý:)/i;
const EMOJI = /^\p{Extended_Pictographic}/u;

export function norm(s, strip = false) {
    let t = String(s).normalize('NFC').toLowerCase().replace(/[.,!?;:"'“”‘’()…\-–]/g, ' ').replace(/\s+/g, ' ').trim();
    if (strip) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    const w = t.split(' ');
    while (w.length > 1 && CLASSIFIERS.has(w[0])) w.shift();
    return w.join(' ');
}

export function validate(list) {
    const errors = [];
    const ids = new Set(), texts = new Map();
    const err = (id, m) => errors.push(`${id}: ${m}`);
    for (const r of list) {
        if (!r || typeof r.id !== 'string') { errors.push('bản ghi thiếu id'); continue; }
        if (ids.has(r.id)) err(r.id, 'trùng id');
        ids.add(r.id);
        if (r.keep === false) { if (!r.dropReason) err(r.id, 'loại nhưng thiếu dropReason'); continue; }
        const id = r.id;
        if (!['vi', 'en'].includes(r.lang)) err(id, 'lang');
        if (!KINDS.includes(r.kind)) err(id, 'kind');
        if (!GATES.includes(r.gate)) err(id, 'gate');
        if (r.lang === 'en' && r.gate !== 'world') err(id, 'câu tiếng Anh phải ở cổng world');
        if (r.lang === 'vi' && r.gate === 'world') err(id, 'câu tiếng Việt không ở cổng world');
        if (![1, 2, 3].includes(r.level)) err(id, 'level 1–3');
        if (!SOURCES.includes(r.source)) err(id, 'source');
        if (typeof r.text !== 'string' || r.text.trim().length < 8) err(id, 'text');
        const key = norm(r.text || '', true);
        if (texts.has(key)) err(id, `trùng câu hỏi với ${texts.get(key)}`); else texts.set(key, id);
        if (typeof r.answer !== 'string' || !r.answer.trim()) err(id, 'answer');
        const accept = new Set([r.answer, ...(r.accept || [])].map(a => norm(a)));
        const acceptStrip = new Set([...accept].map(a => norm(a, true)));
        if (!Array.isArray(r.accept)) err(id, 'accept phải là mảng');
        if (r.close && !Array.isArray(r.close)) err(id, 'close phải là mảng');
        for (const c of r.close || []) if (accept.has(norm(c))) err(id, `close "${c}" trùng accept`);
        if (!Array.isArray(r.hints) || r.hints.length !== 2 || r.hints.some(h => typeof h !== 'string' || h.length < 6)) err(id, 'hints phải có đúng 2 câu');
        else for (const h of r.hints) if (r.kind !== 'wordplay' && norm(h).includes(norm(r.answer)) && norm(r.answer).length > 2) err(id, `gợi ý lộ đáp án: "${h}"`);
        if (!Array.isArray(r.choices) || r.choices.length !== 3) err(id, 'choices phải có 3 đáp án nhiễu');
        else {
            const seen = new Set();
            for (const c of r.choices) {
                if (!c || typeof c.text !== 'string' || !c.text.trim()) { err(id, 'choice thiếu text'); continue; }
                const n = norm(c.text);
                if (accept.has(n) || acceptStrip.has(norm(c.text, true))) err(id, `đáp án nhiễu "${c.text}" lại là đáp án đúng`);
                if (seen.has(n)) err(id, `đáp án nhiễu trùng "${c.text}"`);
                seen.add(n);
                if (c.emoji && !EMOJI.test(c.emoji)) err(id, `emoji nhiễu không hợp lệ "${c.emoji}"`);
            }
        }
        if (r.emoji && !EMOJI.test(r.emoji)) err(id, `emoji không hợp lệ "${r.emoji}"`);
        if (r.choices && r.emoji && r.choices.some(c => c.emoji === r.emoji)) err(id, 'emoji nhiễu trùng emoji đáp án');
        if (r.clues && !Array.isArray(r.clues)) err(id, 'clues phải là mảng');
        for (const c of r.clues || []) {
            if (!c.quote || !r.text.includes(c.quote)) err(id, `manh mối "${c.quote}" không nằm nguyên văn trong câu đố`);
            if (!c.means || c.means.length < 6) err(id, 'manh mối thiếu giải nghĩa');
        }
        if (!r.clues || r.clues.length < 1) err(id, 'cần ít nhất 1 manh mối');
        if (typeof r.explain !== 'string' || r.explain.length < 10) err(id, 'explain');
        for (const f of ['explain', 'text', ...(r.hints || []).map((_, i) => `hints.${i}`)]) {
            const v = f.startsWith('hints') ? r.hints[+f.split('.')[1]] : r[f];
            if (META.test(v || '')) err(id, `lộ ghi chú biên soạn ở ${f}`);
        }
        if (r.lang === 'en') {
            if (!r.vi || r.vi.length < 8) err(id, 'câu tiếng Anh thiếu bản dịch vi');
            if (!r.answerVi) err(id, 'câu tiếng Anh thiếu answerVi');
        }
        if (r.kind === 'math' && !/^\d+$/.test(r.answer.trim())) err(id, 'đố toán: answer là số nguyên');
    }
    return errors;
}

if (process.argv[1] && process.argv[1].endsWith('riddle-validate.mjs')) {
    const files = process.argv.slice(2);
    let all = [];
    for (const f of files) all = all.concat(JSON.parse(fs.readFileSync(f, 'utf8')));
    const errors = validate(all);
    const kept = all.filter(r => r.keep !== false);
    console.log(`${all.length} bản ghi · giữ ${kept.length} · loại ${all.length - kept.length} · lỗi ${errors.length}`);
    for (const e of errors.slice(0, 200)) console.log('  ✗ ' + e);
    process.exit(errors.length ? 1 : 0);
}

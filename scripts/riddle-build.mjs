// Gộp các lô biên tập (.riddle-work/out/*.json) thành kho v2 trong src/riddle/content/. Đã dùng một lần lúc làm lại 02/10/2026;
// từ đó src/riddle/content/riddles.*.json là nguồn chính: sửa trực tiếp rồi chạy `node scripts/riddle-validate.mjs src/riddle/content/riddles.vi.json src/riddle/content/riddles.en.json`.
import fs from 'node:fs';
import path from 'node:path';
import { validate } from './riddle-validate.mjs';

const dir = '.riddle-work/out';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
let all = [];
for (const f of files) all = all.concat(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const errors = validate(all);
if (errors.length) { console.error(`${errors.length} lỗi:\n` + errors.slice(0, 80).join('\n')); process.exit(1); }
const FIELDS = ['id', 'lang', 'kind', 'gate', 'level', 'text', 'answer', 'accept', 'close', 'hints', 'choices', 'emoji', 'clues', 'explain', 'vi', 'answerVi', 'source'];
const tidy = r => Object.fromEntries(FIELDS.filter(k => r[k] !== undefined && !(Array.isArray(r[k]) && !r[k].length && k === 'close')).map(k => [k, r[k]]));
const kept = all.filter(r => r.keep !== false).map(tidy);
const byNum = (a, b) => a.id.localeCompare(b.id, 'en', { numeric: true });
const vi = kept.filter(r => r.lang === 'vi').sort(byNum), en = kept.filter(r => r.lang === 'en').sort(byNum);
fs.writeFileSync('src/riddle/content/riddles.vi.json', JSON.stringify(vi, null, 1) + '\n');
fs.writeFileSync('src/riddle/content/riddles.en.json', JSON.stringify(en, null, 1) + '\n');
const dropped = all.filter(r => r.keep === false);
const count = (list, key) => list.reduce((m, r) => ((m[r[key]] = (m[r[key]] || 0) + 1), m), {});
console.log(`giữ ${kept.length} (vi ${vi.length}, en ${en.length}) · loại ${dropped.length}`);
console.log('theo cổng', count(kept, 'gate'));
console.log('theo mức', count(kept, 'level'));
console.log('có emoji', kept.filter(r => r.emoji).length);
fs.writeFileSync('docs/riddle-wow/dropped.json', JSON.stringify(dropped.map(r => ({ id: r.id, reason: r.dropReason })), null, 1) + '\n');

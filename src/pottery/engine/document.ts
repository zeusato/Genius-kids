import { CLAYS, GLAZES, STAMPS, PATTERNS, clone, type ArtworkDoc, type Scope } from '../model';
import { initialShape, validShape } from './profile';
import { CHALLENGES, LESSONS } from '../content/catalog';
export const MAX_POINTS = 60000, MAX_STROKES = 1500, MAX_BACKUP_BYTES = 8 * 1024 * 1024;
export function newArtwork(scope: Scope): ArtworkDoc {
  const now = new Date().toISOString();
  return { ...scope, version: 1, id: crypto.randomUUID(), revision: 0, name: 'Tác phẩm nhỏ của em', stage: 'shaping', shape: initialShape(), clay: 'terra', glaze: 'gloss', decoration: { color: '#66a895', insideColor: '#e9dfc8', coverage: 1, strokes: [] }, seed: Math.floor(Math.random() * 2147483647), materialVersion: 1, createdAt: now, updatedAt: now, skills: [] };
}
const color = (v: unknown) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const short = (v: unknown, max = 128): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
export function validateArtwork(value: unknown): ArtworkDoc {
  const a = value as ArtworkDoc;
  if (!a || a.version !== 1 || a.materialVersion !== 1 || !short(a.id) || !short(a.account) || !short(a.student) || !short(a.name, 80) || !Number.isSafeInteger(a.revision) || a.revision < 0 || !Number.isSafeInteger(a.seed) || a.seed < 0 || a.seed > 2147483647 || !Number.isFinite(Date.parse(a.createdAt)) || !Number.isFinite(Date.parse(a.updatedAt)) || !['shaping','preparing','decorating','firing','reveal','finished'].includes(a.stage) || !validShape(a.shape) || !CLAYS.some(c => c.id === a.clay) || !GLAZES.some(g => g.id === a.glaze) || !Array.isArray(a.skills) || a.skills.length > 20 || a.skills.some(s => !['height','shape','open','smooth','pinch','brush','erase','stamp','band'].includes(s)) || (a.challenge !== undefined && !CHALLENGES.some(c => c.id === a.challenge)) || (a.lesson !== undefined && !LESSONS.some(l => l.id === a.lesson)) || (a.parentId !== undefined && !short(a.parentId)) || (a.imported !== undefined && typeof a.imported !== 'boolean')) throw Error('Bản gốm không hợp lệ hoặc thuộc phiên bản chưa hỗ trợ.');
  const d = a.decoration;
  if (!d || !color(d.color) || !color(d.insideColor) || !Number.isFinite(d.coverage) || d.coverage < 0 || d.coverage > 1 || !Array.isArray(d.strokes) || d.strokes.length > MAX_STROKES) throw Error('Lớp trang trí không hợp lệ.');
  let points = 0;
  for (const s of d.strokes) {
    if (!s || !['brush','erase','stamp','band'].includes(s.kind) || !color(s.color) || !Number.isFinite(s.size) || s.size < .015 || s.size > .3 || !Number.isFinite(s.opacity) || s.opacity < .1 || s.opacity > 1 || !STAMPS.some(p => p.id === s.stamp) || !PATTERNS.some(p => p.id === s.pattern) || !Array.isArray(s.points)) throw Error('Nét vẽ không hợp lệ.');
    points += s.points.length;
    if(s.brushStyle!==undefined&&(s.kind!=='brush'||s.brushStyle!=='bristle-v1'))throw Error('Kiểu cọ chưa được hỗ trợ.');
    if(s.points.some(p=>p?.pressure!==undefined&&(!Number.isFinite(p.pressure)||p.pressure<0||p.pressure>1)))throw Error('Lực nhấn cọ không hợp lệ.');
    if (points > MAX_POINTS || s.points.some(p => !p || ![p.u,p.v,p.radius].every(Number.isFinite) || p.u < 0 || p.u > 1 || p.v < 0 || p.v > 1 || p.radius < .1 || p.radius > 2)) throw Error('Nét vẽ vượt giới hạn an toàn.');
  }
  return a;
}
export function forkArtwork(source: ArtworkDoc, scope: Scope, stage: 'shaping' | 'decorating' = 'shaping'): ArtworkDoc {
  const a = { ...clone(source), ...scope, id: crypto.randomUUID(), revision: 0, parentId: source.id, stage, name: source.name.slice(0, 68) + ' · bản mới', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), skills: [], challenge: undefined, lesson: undefined };
  return a;
}
export function exportBackup(art: ArtworkDoc) { validateArtwork(art); return JSON.stringify({ format: 'genius-pottery', version: 1, artwork: art }); }
export function importBackup(text: string, scope: Scope) {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) throw Error('Bản sao lớn hơn 8 MB.');
  const file = JSON.parse(text);
  if (file.format !== 'genius-pottery' || file.version !== 1) throw Error('Hãy chọn bản sao từ Xưởng Gốm.');
  const source = validateArtwork(file.artwork), art = forkArtwork(source, scope, source.stage === 'shaping' ? 'shaping' : 'decorating');
  art.imported = true; art.name = source.name; return art;
}
export function rewardKeys(art: ArtworkDoc): string[] {
  if (art.imported || art.parentId || !['reveal','finished'].includes(art.stage)) return [];
  const keys = ['first'];
  if (['height','shape','open'].every(k => art.skills.includes(k))) keys.push('hands');
  const lesson = LESSONS.find(l => l.id === art.lesson);
  if (lesson && lesson.skills.every(k => art.skills.includes(k))) keys.push('lesson:' + lesson.id);
  return keys;
}
export function random(seed: number) { let state = seed >>> 0; return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; }; }

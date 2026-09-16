export const ACTIVITIES = ['learn', 'count', 'pick', 'add', 'compare'] as const;
export type Activity = typeof ACTIVITIES[number];
export type Level = 1 | 2 | 3;
export type CompareKind = 'count' | 'number' | 'length' | 'height' | 'size';
export interface Round { id: string; value: number; a: number; b: number; kind: CompareKind; direction: 'more' | 'less' | 'equal'; options: number[]; answer: number; object: string }
export interface Outcome { id: string; value: number; independent: boolean }
export interface Session {
    version: 1; id: string; owner: string; activity: Activity; level: Level; seed: number;
    rounds: Round[]; index: number; outcomes: Outcome[]; collected: number[]; merged: boolean;
    mistakes: number; assisted: boolean; trace: { stroke: number; point: number }; seconds: number;
    phase: 'playing' | 'feedback' | 'complete';
    learningStep?: 'count' | 'trace';
    storySteps?: number[];
}
export interface Skill { independent: number; recent: boolean[]; sessions: string[] }
export interface Progress { version: 1; skills: Partial<Record<Activity, Record<string, Skill>>>; stickers: number[]; drafts: Partial<Record<Activity, Session>>; lastLevel: Partial<Record<Activity, Level>> }
export const NUMBERS = Array.from({ length: 10 }, (_, i) => i + 1);
export const VI = ['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín','mười'];
export const EN = ['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
export const TOYS = ['apple','ball','cat','dog','elephant','fish','goat','hat','ice-cream','juice','cake','orange'];
export const THEMES = ['Vườn táo nhỏ','Sân bóng vui','Nhà mèo ấm','Sân của Cún','Vườn Voi con','Hồ cá xanh','Đồi dê nhỏ','Xưởng mũ xinh','Xe kem mát','Dã ngoại ngọt'];
export const COPY: Record<Activity, { title: string; subtitle: string; guide: string; scene: string }> = {
    learn: { title: 'Mười hòn đảo nhỏ', subtitle: 'KHÁM PHÁ • ĐẾM • TẬP TÔ', guide: 'Mỗi con số có một trò chơi riêng. Chơi và đếm xong, chạm Tập tô số khi bé sẵn sàng nhé.', scene: 'island' },
    count: { title: 'Vườn thu hoạch', subtitle: 'MỖI LẦN CHẠM, MỘT QUẢ', guide: 'Chạm từng đồ vật để bỏ vào giỏ. Đếm xong, chọn số đồ vật trong giỏ nhé.', scene: 'orchard' },
    pick: { title: 'Bến thuyền âm thanh', subtitle: 'NGHE SỐ • TÌM THUYỀN', guide: 'Nghe tên số, rồi chạm chiếc thuyền có số vừa nghe nhé.', scene: 'harbor' },
    add: { title: 'Tiệm bánh của Thỏ', subtitle: 'GỘP HAI NHÓM THÀNH MỘT', guide: 'Chạm mũi tên để gộp hai khay. Đếm tất cả bánh rồi chọn số nhé.', scene: 'bakery' },
    compare: { title: 'Sân chơi so sánh', subtitle: 'NHÌN KỸ • TÌM ĐIỀU KHÁC NHAU', guide: 'Nghe xem cần tìm bên nào. Chạm bên trái hoặc bên phải. Nếu bằng nhau, chạm dấu bằng.', scene: 'playground' },
};
export const emptyProgress = (): Progress => ({ version: 1, skills: {}, stickers: [], drafts: {}, lastLevel: {} });
const integer = (x: unknown, min: number, max: number): x is number => Number.isInteger(x) && Number(x) >= min && Number(x) <= max;
export function validSession(s: unknown, owner?: string): s is Session {
    if (!s || typeof s !== 'object') return false;
    const v = s as Session;
    return v.version === 1 && typeof v.id === 'string' && v.id.length > 0 && typeof v.owner === 'string' && (!owner || owner === v.owner)
        && ACTIVITIES.includes(v.activity) && [1,2,3].includes(v.level) && Number.isInteger(v.seed)
        && Array.isArray(v.rounds) && v.rounds.length === (v.activity === 'learn' ? 1 : 6)
        && v.rounds.every(r => r && typeof r.id === 'string' && integer(r.value,1,10) && integer(r.a,0,10) && integer(r.b,0,10) && integer(r.answer,0,10) && ['count','number','length','height','size'].includes(r.kind) && ['more','less','equal'].includes(r.direction) && TOYS.includes(r.object) && Array.isArray(r.options) && r.options.includes(r.answer) && new Set(r.options).size === r.options.length && r.options.every(n => integer(n,0,10)))
        && new Set(v.rounds.map(r => r.id)).size === v.rounds.length
        && v.rounds.every(r => v.activity==='compare' ? r.answer===(r.a===r.b?2:(r.direction==='more'?r.a>r.b:r.a<r.b)?0:1) : r.answer===r.value && (v.activity!=='add'||r.a+r.b===r.value))
        && integer(v.index,0,v.rounds.length - 1) && Array.isArray(v.outcomes) && v.outcomes.length === v.index + (v.phase === 'playing' ? 0 : 1)
        && v.outcomes.every((o,i) => o && o.id === v.rounds[i].id && o.value === v.rounds[i].value && typeof o.independent === 'boolean')
        && Array.isArray(v.collected) && new Set(v.collected).size === v.collected.length && v.collected.every(n => integer(n,0,v.rounds[v.index].value-1))
        && integer(v.mistakes,0,1000) && typeof v.assisted === 'boolean' && typeof v.merged === 'boolean'
        && !!v.trace && integer(v.trace.stroke,0,8) && integer(v.trace.point,0,1000) && Number.isFinite(v.seconds) && v.seconds >= 0
        && (v.learningStep===undefined || ['count','trace'].includes(v.learningStep))
        && (v.learningStep!=='trace' || v.activity==='learn' && v.collected.length===v.rounds[v.index].value)
        && (v.storySteps===undefined || Array.isArray(v.storySteps) && v.storySteps.length===v.rounds[v.index].value && v.storySteps.every(n=>integer(n,0,3)))
        && ['playing','feedback','complete'].includes(v.phase) && (v.phase !== 'complete' || v.outcomes.length === v.rounds.length);
}
export function readProgress(raw: unknown, owner?: string): Progress {
    const p = emptyProgress();
    if (!raw || typeof raw !== 'object' || (raw as Progress).version !== 1) return p;
    const r = raw as Progress;
    p.stickers = Array.isArray(r.stickers) ? [...new Set(r.stickers.filter(n => integer(n,1,10)))] : [];
    for (const a of ACTIVITIES) {
        const group: Record<string, Skill> = {};
        for (const n of NUMBERS) {
            const s = r.skills?.[a]?.[n];
            if (s && Number.isFinite(s.independent) && Array.isArray(s.recent) && Array.isArray(s.sessions)) group[n] = { independent: Math.max(0,Math.floor(s.independent)), recent: s.recent.filter(x => typeof x === 'boolean').slice(-5), sessions: [...new Set(s.sessions.filter(x => typeof x === 'string'))].slice(-20) };
        }
        p.skills[a] = group;
        if (validSession(r.drafts?.[a], owner)) p.drafts[a] = r.drafts[a];
        const level=r.lastLevel?.[a]; if (level && [1,2,3].includes(level)) p.lastLevel[a] = level;
    }
    return p;
}
export const mastered = (skill?: Skill) => !!skill && skill.independent >= 3 && skill.sessions.length >= 2 && skill.recent.length >= 2 && skill.recent.slice(-2).every(Boolean);
export function rng(seed: number) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let n = Math.imul(t ^ t >>> 15, t | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; }; }
export function shuffle<T>(values: T[], random: () => number): T[] { const a = [...values]; for(let i=a.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
export function makeSession(owner: string, activity: Activity, level: Level, seed: number, progress: Progress, fixed = 0, review = false): Session {
    const random = rng(seed), max = level === 1 ? 3 : level === 2 ? 5 : 10;
    const pool = NUMBERS.filter(n => n <= (fixed || activity === 'learn' ? 10 : max) && (activity!=='add' || level===3 || n>=2));
    const chosen: number[] = [];
    for (let i=0; i<(activity === 'learn' ? 1 : 6); i++) {
        const candidates = pool.filter(n => n !== chosen.at(-1) && chosen.filter(x => x===n).length < 2);
        const ranked = (candidates.length ? candidates : pool).map(n => {
            const skill = progress.skills[activity]?.[n];
            const weight = skill?.recent.some(x => !x) ? (review ? 8 : 4) : mastered(skill) ? 1 : 2;
            return { n, rank: Math.pow(random(),1/weight) };
        }).sort((a,b) => b.rank-a.rank);
        chosen.push(fixed || ranked[0].n);
    }
    const id = `numbers-${owner}-${activity}-${seed}-${Date.now().toString(36)}`;
    const directionOffset = random()<.5 ? 0 : 1;
    const rounds = chosen.map((value,i): Round => {
        let a = value, b = 1 + Math.floor(random()*max);
        const kind: CompareKind = level === 1 ? 'count' : (['count','number','length','height','size'] as const)[i%5];
        const direction = activity === 'compare' && level === 3 && i === 5 ? 'equal' : (i+directionOffset)%2 ? 'less' : 'more';
        if (activity === 'add') { const total = value; a = total===1 || level === 3 && i%3 === 0 ? 0 : 1+Math.floor(random()*(total-1)); b = total-a; }
        if (activity === 'compare') { if (direction === 'equal') b=a; else if (a === b) b=a===max ? 1 : a+1; }
        const answer = activity === 'compare' ? (a===b ? 2 : (direction === 'more' ? a>b : a<b) ? 0 : 1) : value;
        const options = activity === 'compare' ? [0,1,2] : shuffle([answer,...shuffle(NUMBERS.filter(n => n!==answer && n<=Math.max(max,fixed)),random).slice(0,level===1?1:level===2?2:3)],random);
        return { id: `${id}-${i}`, value, a, b, kind, direction, options, answer, object: activity==='add' ? 'cake' : activity==='count' ? i%2?'orange':'apple' : TOYS[(value-1)%10] };
    });
    return { version:1,id,owner,activity,level,seed,rounds,index:0,outcomes:[],collected:[],merged:false,mistakes:0,assisted:false,trace:{stroke:0,point:0},seconds:0,phase:'playing' };
}
export function answerSession(s: Session, answer: number, heard = false): Session {
    if (s.phase !== 'playing' || s.activity === 'pick' && !heard) return s;
    const r=s.rounds[s.index];
    if (answer !== r.answer) return { ...s, mistakes:Math.min(1000,s.mistakes+1) };
    return { ...s,phase:'feedback',outcomes:[...s.outcomes,{id:r.id,value:r.value,independent:!s.assisted && s.mistakes===0}] };
}
export function nextRound(s: Session): Session {
    if (s.phase !== 'feedback') return s;
    return s.index===s.rounds.length-1 ? { ...s,phase:'complete' } : { ...s,index:s.index+1,phase:'playing',collected:[],merged:false,mistakes:0,assisted:false,trace:{stroke:0,point:0} };
}
export function comparePrompt(r: Round) {
    if (r.direction==='equal') return 'Hai bên có bằng nhau không? Chạm dấu bằng nhé.';
    const terms = {count:['nhiều đồ vật hơn','ít đồ vật hơn'],number:['số lớn hơn','số nhỏ hơn'],length:['dài hơn','ngắn hơn'],height:['cao hơn','thấp hơn'],size:['to hơn','nhỏ hơn']};
    return `Chạm bên ${terms[r.kind][r.direction==='more'?0:1]} nhé.`;
}

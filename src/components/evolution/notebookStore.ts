// "Sổ tay hạt giống" của Cây Tiến Hóa: nhóm đã xem, bí ẩn đã giải, hành trình đã đi — lưu theo hồ sơ
// học sinh trong localStorage (dữ liệu phụ). Huy hiệu thật nằm ở StudentProfile.evoBadges (qua updateStudent).

export interface EvoNotebook { seen: string[]; keySolved: string[]; journeys: string[] }

const key = (studentId?: string) => `evo_notebook_v1_${studentId || 'guest'}`;
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export function loadEvoNotebook(studentId?: string): EvoNotebook {
    try {
        const raw = localStorage.getItem(key(studentId));
        if (!raw) return { seen: [], keySolved: [], journeys: [] };
        const p = JSON.parse(raw) as Partial<EvoNotebook>;
        return { seen: arr(p.seen), keySolved: arr(p.keySolved), journeys: arr(p.journeys) };
    } catch {
        return { seen: [], keySolved: [], journeys: [] };
    }
}

function save(nb: EvoNotebook, studentId?: string) {
    try { localStorage.setItem(key(studentId), JSON.stringify(nb)); } catch { /* chế độ riêng tư — bỏ qua */ }
}

export function addTo(nb: EvoNotebook, field: keyof EvoNotebook, id: string, studentId?: string): EvoNotebook {
    if (nb[field].includes(id)) return nb;
    const next = { ...nb, [field]: [...nb[field], id] };
    save(next, studentId);
    return next;
}

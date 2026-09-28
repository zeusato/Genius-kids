import type { CellId } from '../../data/cellStory';

// "Sổ tay khám phá": bào quan bé đã mở xem, lưu theo hồ sơ học sinh trong localStorage.
// Dữ liệu phụ (không ảnh hưởng tiến độ học) nên lưu cục bộ là đủ; huy hiệu thật nằm ở
// StudentProfile.cellBadges (qua updateStudent) như Hệ Mặt Trời.

export type Notebook = Record<CellId, string[]>;

const EMPTY: Notebook = { animal: [], plant: [], bacteria: [] };
const key = (studentId?: string) => `cell_notebook_v1_${studentId || 'guest'}`;

export function loadNotebook(studentId?: string): Notebook {
    try {
        const raw = localStorage.getItem(key(studentId));
        if (!raw) return { ...EMPTY };
        const parsed = JSON.parse(raw) as Partial<Notebook>;
        return {
            animal: Array.isArray(parsed.animal) ? parsed.animal : [],
            plant: Array.isArray(parsed.plant) ? parsed.plant : [],
            bacteria: Array.isArray(parsed.bacteria) ? parsed.bacteria : []
        };
    } catch {
        return { ...EMPTY };
    }
}

export function markSeen(nb: Notebook, cellId: CellId, organelleId: string, studentId?: string): Notebook {
    if (nb[cellId].includes(organelleId)) return nb;
    const next: Notebook = { ...nb, [cellId]: [...nb[cellId], organelleId] };
    try {
        localStorage.setItem(key(studentId), JSON.stringify(next));
    } catch { /* chế độ riêng tư / hết chỗ — bỏ qua, chỉ mất tiến độ phụ */ }
    return next;
}

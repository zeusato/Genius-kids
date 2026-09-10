import { simulate } from '../engine/simulate';
import { teethToRadius } from '../engine/constants';
import { distance } from '../engine/graph';
import type { GearLayout } from '../engine/types';
import type { Design, Mission, Evaluation, Check } from './model';
export function layoutOf(m: Mission, d: Design): GearLayout {
    return { gears: m.sockets.flatMap(s => { const teeth = s.locked ? s.teeth : d.gears[s.id]; return teeth ? [{ id: s.id, x: s.x, y: s.y, teeth, radius: teethToRadius(teeth), role: s.role || 'gear', fixed: !!s.locked }] : []; }), belts: d.belts };
}
export function designError(m: Mission, d: Design): string | null {
    if (!d || typeof d.gears !== 'object' || !d.gears || Array.isArray(d.gears) || !Array.isArray(d.belts) || typeof d.guesses !== 'object' || !d.guesses || Array.isArray(d.guesses)) return 'Bản thiết kế chưa đọc được.';
    if (d.belts.length > m.belts) return 'Đã dùng hết dây đai cho nhiệm vụ này.';
    if (Object.keys(d.gears).length + d.belts.length > m.maxParts) return 'Vượt số linh kiện cho phép. Tháo một món hoặc hoàn tác nhé.';
    const used: Record<number, number> = {};
    for (const [id, teeth] of Object.entries(d.gears)) {
        const slot = m.sockets.find(s => s.id === id);
        if (!slot || slot.locked || !Number.isInteger(teeth) || !m.stock[teeth]) return 'Linh kiện hoặc vị trí đặt không hợp lệ.';
        used[teeth] = (used[teeth] || 0) + 1; if (used[teeth] > m.stock[teeth]) return `Không còn bánh ${teeth} răng trong khay.`;
    }
    const layout = layoutOf(m, d), pairs = new Set<string>(), ids = new Set<string>();
    for (let i = 0; i < layout.gears.length; i++) for (let j = i + 1; j < layout.gears.length; j++) {
        const a = layout.gears[i], b = layout.gears[j];
        if (distance(a, b) < a.radius + b.radius - 1) return 'Bánh này quá lớn, chồng vào bánh bên cạnh. Thử cỡ nhỏ hơn nhé.';
    }
    for (const b of d.belts) {
        if (!b || typeof b !== 'object') return 'Dây đai chưa đọc được.';
        const a = layout.gears.find(g => g.id === b.a), z = layout.gears.find(g => g.id === b.b), key = [b.a, b.b].sort().join(':');
        if (!a || !z || a.id === z.id || !['belt', 'belt-crossed'].includes(b.kind) || typeof b.id !== 'string' || !b.id || ids.has(b.id)) return 'Dây đai cần nối hai bánh đã được lắp.';
        if (!m.sockets.find(s => s.id === a.id)?.pulley || !m.sockets.find(s => s.id === z.id)?.pulley) return 'Chỉ các trục có vòng puli mới nối được dây đai.';
        if (pairs.has(key)) return 'Hai trục này đã có dây đai. Tháo dây cũ trước nhé.';
        if (distance(a, z) > m.maxBeltLength) return 'Hai trục quá xa để nối dây đai này.';
        pairs.add(key); ids.add(b.id);
    }
    for (const [id, dir] of Object.entries(d.guesses)) if (!m.predictions.some(g => g.id === id) || ![1, -1, 0].includes(dir)) return 'Dự đoán không hợp lệ.';
    return null;
}
export function evaluate(m: Mission, d: Design): Evaluation {
    const error = designError(m, d), layout = error ? layoutOf(m, m.initial) : layoutOf(m, d);
    if (error) d = m.initial;
    const sim = simulate(layout, { id: 'motor', dir: 1, speed: 1 }), used = Object.keys(d.gears).length + d.belts.length;
    const checks: Check[] = [{ id: 'parts', label: `Linh kiện ${used}/${m.maxParts}`, ok: !error, detail: error || 'Đúng kho linh kiện và giới hạn của bài.' }, { id: 'jam', label: 'Máy không bị kẹt', ok: !sim.jammed, detail: sim.jammed ? 'Có hai đường truyền ép máy quay ngược nhau. Xem các trục đánh dấu đỏ.' : 'Các đường truyền không mâu thuẫn.', focus: sim.jammedEdges[0]?.[1] }];
    for (const g of m.goals) {
        const rt = sim.runtime.get(g.id), connected = rt?.state === 'driven';
        checks.push({ id: `${g.id}:drive`, label: `${g.label} nhận được chuyển động`, ok: connected, detail: connected ? 'Đã nối thông từ Nguồn.' : sim.jammed ? 'Cụm đang kẹt, cần sửa đường truyền.' : 'Chưa nối được từ Nguồn tới đầu ra này.', focus: g.id });
        if (m.mode === 'guess') checks.push({ id: `${g.id}:guess`, label: `Dự đoán ${g.label.toLowerCase()}`, ok: d.guesses[g.id] === rt?.dir, detail: d.guesses[g.id] === undefined ? 'Chọn một chiều trước khi chạy thử.' : d.guesses[g.id] === rt?.dir ? 'Em đã lần đúng đường truyền!' : `Chiều thật là ${rt?.dir === 1 ? '↻' : rt?.dir === -1 ? '↺' : 'đứng yên'}. Mỗi cặp bánh ăn khớp lại đảo chiều.`, focus: g.id });
        else {
            checks.push({ id: `${g.id}:dir`, label: `${g.label} quay ${g.dir === 1 ? '↻' : '↺'}`, ok: connected && rt?.dir === g.dir, detail: connected && rt?.dir === g.dir ? 'Chiều quay đúng yêu cầu.' : `Cần ${g.dir === 1 ? 'cùng' : 'ngược'} chiều kim đồng hồ. Kiểm tra bánh trung gian và loại đai.`, focus: g.id });
            if (g.speed) checks.push({ id: `${g.id}:speed`, label: `${g.label}: tốc độ ×${g.speed}`, ok: connected && Math.abs(rt!.speed - g.speed) < .001, detail: connected ? `Hiện tại ×${Number(rt!.speed.toFixed(2))}; cần ×${g.speed}. Đổi cỡ bánh đầu ra để đổi tốc độ.` : 'Nối nguồn trước khi kiểm tra tốc độ.', focus: g.id });
        }
    }
    const success = !error && checks.every(c => c.ok), predicted = m.predictions.every(g => d.guesses[g.id] === sim.runtime.get(g.id)?.dir);
    return { valid: !error, success, checks, sim, layout, used, stars: success ? 1 + Number(used <= m.par) + Number(predicted) : 0 };
}
export function placeGear(m: Mission, d: Design, id: string, teeth: number) {
    const next = structuredClone(d); next.gears[id] = teeth; return { design: next, error: designError(m, next) };
}
export function removePart(m: Mission, d: Design, id: string): Design {
    if (m.sockets.find(s => s.id === id)?.locked) return d;
    const next = structuredClone(d); delete next.gears[id]; next.belts = next.belts.filter(b => b.a !== id && b.b !== id); return next;
}

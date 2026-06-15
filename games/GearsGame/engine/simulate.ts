// ============================================================================
//  GIẢI mạng bánh răng — hàm THUẦN, TẤT ĐỊNH (cùng input → cùng output).
//
//  Quy trình (tách hẳn "tô màu" khỏi "kiểm tra", sửa lỗi cũ chỉ kiểm chiều khi
//  gặp lại đỉnh đã thăm và bỏ sót xung đột TỐC ĐỘ):
//   1) Tô màu từ motor: gán chiều (parity), tốc độ (tích tỉ số theo BÁN KÍNH),
//      và pha ăn khớp răng cho từng bánh trong cụm nối tới motor.
//   2) Kiểm tra MỌI cạnh: lệch chiều  → xung đột; lệch tốc độ (quá-ràng-buộc)
//      → xung đột; cặp vừa ăn-khớp vừa nối-đai mâu thuẫn → xung đột.
//   3) Nếu cụm-motor có xung đột → CẢ CỤM kẹt cứng (state 'jammed'), KHÔNG
//      đụng tới các cụm độc lập khác (chúng vẫn 'idle'). Sửa lỗi cũ zero hoá
//      toàn bộ bảng và lẫn lộn 'kẹt' với 'chưa nối'.
// ============================================================================

import { DEG_PER_SPEED, SPEED_EPS } from './constants';
import { buildGraph } from './graph';
import { GearLayout, GearRuntime, MotorConfig, SimResult } from './types';

const norm360 = (deg: number) => ((deg % 360) + 360) % 360;

/** Pha (độ) để răng của `child` ăn khớp răng của `parent` tại điểm tiếp xúc. */
const meshPhaseDeg = (
    parent: { x: number; y: number; teeth: number },
    child: { x: number; y: number; teeth: number },
    parentPhaseDeg: number
): number => {
    const alphaDeg = (Math.atan2(child.y - parent.y, child.x - parent.x) * 180) / Math.PI;
    const stepP = 360 / parent.teeth;
    const stepC = 360 / child.teeth;
    // childPhase = (α+180) - stepC*[ (α - parentPhase)/stepP + 0.5 ]
    const fracP = (alphaDeg - parentPhaseDeg) / stepP;
    return norm360(alphaDeg + 180 - stepC * (fracP + 0.5));
};

export const simulate = (layout: GearLayout, motor: MotorConfig): SimResult => {
    const { gears, adj } = buildGraph(layout);

    const runtime = new Map<string, GearRuntime>();
    for (const g of layout.gears) {
        runtime.set(g.id, { state: 'idle', dir: 0, speed: 0, phaseDeg: 0 });
    }

    const empty: SimResult = { runtime, jammed: false, jammedGearIds: new Set(), jammedEdges: [] };
    if (!gears.has(motor.id)) return empty;

    // ---- 1) Tô màu (BFS) từ motor trong cụm liên thông ----
    const reachable = new Set<string>([motor.id]);
    runtime.set(motor.id, { state: 'driven', dir: motor.dir, speed: motor.speed, phaseDeg: 0 });

    const queue: string[] = [motor.id];
    while (queue.length) {
        const id = queue.shift()!;
        const cur = runtime.get(id)!;
        const curGear = gears.get(id)!;
        for (const edge of adj.get(id) ?? []) {
            if (reachable.has(edge.to)) continue;
            const childGear = gears.get(edge.to)!;
            const dir = (edge.sign * cur.dir) as -1 | 0 | 1;
            const speed = cur.speed * (curGear.radius / childGear.radius);
            const phaseDeg =
                edge.kind === 'mesh'
                    ? meshPhaseDeg(curGear, childGear, cur.phaseDeg)
                    : cur.phaseDeg; // dây đai: không cần căn răng
            runtime.set(edge.to, { state: 'driven', dir, speed, phaseDeg });
            reachable.add(edge.to);
            queue.push(edge.to);
        }
    }

    // ---- 2) Kiểm tra mọi cạnh trong cụm-motor ----
    const jammedEdges: Array<[string, string]> = [];
    for (const [a, edges] of adj) {
        if (!reachable.has(a)) continue;
        const ra = runtime.get(a)!;
        const ga = gears.get(a)!;
        for (const edge of edges) {
            if (a >= edge.to) continue; // mỗi cạnh vô hướng xét 1 lần
            const rb = runtime.get(edge.to)!;
            const gb = gears.get(edge.to)!;
            const expectDir = edge.sign * ra.dir;
            const expectSpeed = ra.speed * (ga.radius / gb.radius);
            const dirBad = rb.dir !== expectDir;
            const speedBad = Math.abs(rb.speed - expectSpeed) > SPEED_EPS;
            if (dirBad || speedBad) jammedEdges.push([a, edge.to]);
        }
    }

    // ---- 3) Áp trạng thái ----
    if (jammedEdges.length > 0) {
        // Cả cụm nối tới motor bị kẹt cứng; cụm khác giữ nguyên 'idle'.
        for (const id of reachable) {
            runtime.set(id, { state: 'jammed', dir: 0, speed: 0, phaseDeg: runtime.get(id)!.phaseDeg });
        }
        return { runtime, jammed: true, jammedGearIds: reachable, jammedEdges };
    }

    return { runtime, jammed: false, jammedGearIds: new Set(), jammedEdges: [] };
};

/** Đổi (chiều, tốc độ, pha, thời gian) → góc xoay hiển thị (độ). Dùng ở renderer. */
export const rotationDeg = (rt: GearRuntime, elapsedSec: number): number => {
    if (rt.state !== 'driven' || rt.speed === 0) return rt.phaseDeg;
    return rt.phaseDeg + rt.dir * rt.speed * DEG_PER_SPEED * elapsedSec;
};

/** Chu kỳ một vòng quay (giây) — tiện cho hiệu ứng phụ. */
export const revPeriodSec = (speed: number): number => (speed > 0 ? 360 / (speed * DEG_PER_SPEED) : 0);

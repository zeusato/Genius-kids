import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { BodyRegistry } from './core';
import { CutUniforms } from './shell';
import { playBlip } from '../../solar/sfx';

export interface LabelSpec {
    id: string;
    name: string;
    emoji?: string;
    color: string;
    priority: number; // cao = ưu tiên giữ lại khi chồng nhau
}

interface CellLabelsProps {
    specs: LabelSpec[];
    registry: React.MutableRefObject<BodyRegistry>;
    cellGroup: React.RefObject<THREE.Object3D | null>;
    cut: CutUniforms;
    focusedId: string | null;
    hidden: boolean;
    onSelect: (id: string) => void;
}

interface Rect { x0: number; y0: number; x1: number; y1: number }

const _w = new THREE.Vector3();
const _ndc = new THREE.Vector3();
const _cam = new THREE.Vector3();
const _p = new THREE.Vector3();

// Tia camera → điểm neo có đi vào tế bào qua MÀNG (ngoài cửa sổ cắt) không? Xấp xỉ vỏ bằng elip
// cutHalf, toạ độ local của tế bào. Có → bào quan đang bị màng che → ẩn nhãn (khỏi "nói dối" vị trí).
function occludedByShell(camLocal: THREE.Vector3, pLocal: THREE.Vector3, cut: CutUniforms): boolean {
    const h = cut.uCutHalf.value;
    const ox = camLocal.x / h.x, oy = camLocal.y / h.y, oz = camLocal.z / h.z;
    const oo = ox * ox + oy * oy + oz * oz;
    if (oo <= 1) return false; // camera đang ở trong tế bào
    let vx = pLocal.x / h.x - ox, vy = pLocal.y / h.y - oy, vz = pLocal.z / h.z - oz;
    const len = Math.hypot(vx, vy, vz) || 1;
    vx /= len; vy /= len; vz /= len;
    const b = ox * vx + oy * vy + oz * vz;
    const disc = b * b - (oo - 1);
    if (disc < 0) return false;
    const t0 = -b - Math.sqrt(disc);
    if (t0 < 0 || t0 > len) return false; // điểm neo nằm ngoài tế bào
    if (cut.uCutCos.value >= 1) return true; // cửa sổ đóng → màng che hết
    const ex = ox + vx * t0, ey = oy + vy * t0, ez = oz + vz * t0;
    const el = Math.hypot(ex, ey, ez) || 1;
    const a = cut.uCutAxis.value;
    return (ex * a.x + ey * a.y + ez * a.z) / el <= cut.uCutCos.value;
}

// Nhãn tên bào quan (Html) — biểu tượng cho bé chưa đọc được, tự ẩn khi: đang chọn một bào quan,
// bị màng che, chồng lên nhãn ưu tiên hơn. Ghi thẳng style mỗi frame, không setState.
// Vị trí thử khi nhãn chồng nhau: tại chỗ → lệch lên → lệch xuống → sang phải → sang trái
const NUDGES: [number, number][] = [[0, 0], [0, -1], [0, 1], [0.62, 0], [-0.62, 0]];

export const CellLabels: React.FC<CellLabelsProps> = ({ specs, registry, cellGroup, cut, focusedId, hidden, onSelect }) => {
    const groups = useRef<Record<string, THREE.Group | null>>({});
    const els = useRef<Record<string, HTMLDivElement | null>>({});
    const shown = useRef(new Map<string, string>());   // id → trạng thái đã ghi ("hidden" | "dx,dy")
    const lastNudge = useRef(new Map<string, number>()); // giữ vị trí lệch cũ nếu còn hợp lệ (đỡ nhảy)
    const order = useMemo(() => [...specs].sort((a, b) => b.priority - a.priority), [specs]);

    useFrame(({ camera, size }) => {
        const cell = cellGroup.current;
        if (!cell) return;
        _cam.copy(camera.position);
        cell.worldToLocal(_cam);
        const placed: Rect[] = [];
        for (const spec of order) {
            const entry = registry.current[spec.id];
            const g = groups.current[spec.id];
            const el = els.current[spec.id];
            if (!g || !el) continue;
            let visible = !hidden && !focusedId && !!entry;
            if (entry) {
                (entry.label ?? entry.object).getWorldPosition(_w);
                g.parent ? g.position.copy(g.parent.worldToLocal(_p.copy(_w))) : g.position.copy(_w);
            }
            if (visible && entry && !entry.shell) {
                _p.copy(_w);
                cell.worldToLocal(_p);
                if (occludedByShell(_cam, _p, cut)) visible = false;
            }
            let dx = 0, dy = 0;
            if (visible) {
                _ndc.copy(_w).project(camera);
                if (_ndc.z > 1 || Math.abs(_ndc.x) > 1.1 || Math.abs(_ndc.y) > 1.1) visible = false;
                const cx = (_ndc.x * 0.5 + 0.5) * size.width;
                const cy = (-_ndc.y * 0.5 + 0.5) * size.height;
                const w = (el.offsetWidth || 90) + 6, h = (el.offsetHeight || 30) + 4;
                const fits = (k: number): Rect | null => {
                    const ox = NUDGES[k][0] * w, oy = NUDGES[k][1] * h;
                    const r = { x0: cx + ox - w / 2, y0: cy + oy - h / 2, x1: cx + ox + w / 2, y1: cy + oy + h / 2 };
                    // chừa vùng header (nút quay lại, tiêu đề) trên cùng
                    if (r.y0 < 64 || r.y1 > size.height - 30 || r.x0 < 4 || r.x1 > size.width - 4) return null;
                    return placed.some((p) => r.x0 < p.x1 && r.x1 > p.x0 && r.y0 < p.y1 && r.y1 > p.y0) ? null : r;
                };
                if (visible) {
                    const prev = lastNudge.current.get(spec.id) ?? 0;
                    let chosen = -1;
                    let rect = fits(prev);
                    if (rect) chosen = prev;
                    for (let k = 0; k < NUDGES.length && chosen < 0; k++) {
                        rect = fits(k);
                        if (rect) chosen = k;
                    }
                    if (chosen < 0 || !rect) visible = false;
                    else {
                        placed.push(rect);
                        lastNudge.current.set(spec.id, chosen);
                        dx = NUDGES[chosen][0] * w;
                        dy = NUDGES[chosen][1] * h;
                    }
                }
            }
            const key = visible ? `${Math.round(dx)},${Math.round(dy)}` : 'hidden';
            if (shown.current.get(spec.id) !== key) {
                shown.current.set(spec.id, key);
                el.style.opacity = visible ? '1' : '0';
                el.style.pointerEvents = visible ? 'auto' : 'none';
                el.style.transform = visible ? `translate(${dx}px, ${dy}px) scale(1)` : 'scale(0.85)';
            }
        }
    });

    return (
        <>
            {specs.map((spec) => (
                <group key={spec.id} ref={(g) => { groups.current[spec.id] = g; }}>
                    <Html center zIndexRange={[20, 0]} wrapperClass="pointer-events-none">
                        <div
                            ref={(el) => { els.current[spec.id] = el; }}
                            style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.25s, transform 0.25s' }}
                            className="p-1.5"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); playBlip(); onSelect(spec.id); }}
                                className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-slate-950/70 hover:bg-slate-900/95 border border-white/20 text-white text-[11px] sm:text-xs font-bold whitespace-nowrap shadow-lg shadow-black/40 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
                            >
                                <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[12px] leading-none"
                                    style={{ background: `${spec.color}55`, boxShadow: `0 0 10px ${spec.color}aa`, border: `1px solid ${spec.color}` }}
                                >
                                    {spec.emoji ?? ''}
                                </span>
                                {spec.name}
                            </button>
                        </div>
                    </Html>
                </group>
            ))}
        </>
    );
};

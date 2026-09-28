import React, { useEffect, useRef } from 'react';
import type { EvoWorld } from '../scene/world';
import type { CameraApi } from '../scene/CameraRig';
import { SECTOR_COLOR } from '../../../data/evolution/sectors';
import { LAYOUT } from '../engine/layout';

const W = 184, H = 116;

// Bản đồ nhỏ: canvas 2D vẽ sẵn các cành (1 lần / mỗi lần đổi hình học), khung nhìn camera cập nhật 10 Hz.
// Chạm/kéo trên bản đồ → dời camera tới đó (giữ độ zoom).
export const MiniMap: React.FC<{ world: EvoWorld; camera: React.MutableRefObject<CameraApi | null>; className?: string }> = ({ world, camera, className = '' }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const dragging = useRef(false);

    useEffect(() => {
        const cv = ref.current!;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = W * dpr; cv.height = H * dpr;
        const ctx = cv.getContext('2d')!;
        const base = document.createElement('canvas');
        base.width = cv.width; base.height = cv.height;
        let baseVer = -1;
        const map = () => {
            const [x0, y0, x1, y1] = world.bounds();
            const s = Math.min((W - 8) / (x1 - x0), (H - 8) / (y1 - y0));
            const ox = (W - (x1 - x0) * s) / 2, oy = (H - (y1 - y0) * s) / 2;
            return { s, toPx: (x: number, y: number) => [ox + (x - x0) * s, H - oy - (y - y0) * s] as const, x0, y0, ox, oy };
        };
        const drawBase = () => {
            const b = base.getContext('2d')!;
            b.setTransform(dpr, 0, 0, dpr, 0, 0);
            b.clearRect(0, 0, W, H);
            const m = map();
            const S = LAYOUT.SAMPLES + 1;
            b.lineCap = 'round';
            world.polar.branches.forEach((br, bi) => {
                const n = world.tree.nodes[br.node];
                b.strokeStyle = SECTOR_COLOR[n.sector];
                b.globalAlpha = n.extinct ? 0.35 : 0.8;
                b.lineWidth = Math.max(0.6, Math.sqrt(n.leafCount) * 0.35);
                b.beginPath();
                for (let k = 0; k < S; k += 2) {
                    const j = bi * S + Math.min(k, S - 1);
                    const [px, py] = m.toPx(world.pr.sampleXY[j * 2], world.pr.sampleXY[j * 2 + 1]);
                    if (k === 0) b.moveTo(px, py); else b.lineTo(px, py);
                }
                b.stroke();
            });
            b.globalAlpha = 1;
            baseVer = world.geometryVersion;
        };
        const tick = () => {
            if (baseVer !== world.geometryVersion) drawBase();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, cv.width, cv.height);
            ctx.drawImage(base, 0, 0);
            const v = camera.current?.view();
            if (v) {
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                const m = map();
                const [ax, ay] = m.toPx(v.cx - v.halfW, v.cy + v.halfH);
                const w = v.halfW * 2 * m.s, h = v.halfH * 2 * m.s;
                ctx.fillStyle = 'rgba(253,230,138,0.10)';
                ctx.strokeStyle = 'rgba(253,230,138,0.95)';
                ctx.lineWidth = 1.5;
                const cx = Math.max(1, Math.min(W - 3, ax)), cy = Math.max(1, Math.min(H - 3, ay));
                ctx.fillRect(cx, cy, Math.min(w, W - cx - 1), Math.min(h, H - cy - 1));
                ctx.strokeRect(cx, cy, Math.min(w, W - cx - 1), Math.min(h, H - cy - 1));
            }
        };
        tick();
        const id = window.setInterval(tick, 100);
        (cv as any).__map = map;
        return () => window.clearInterval(id);
    }, [world, camera]);

    const moveTo = (e: React.PointerEvent, animate: boolean) => {
        const cv = ref.current!;
        const r = cv.getBoundingClientRect();
        const m = (cv as any).__map();
        const px = (e.clientX - r.left) * (W / r.width), py = (e.clientY - r.top) * (H / r.height);
        const x = m.x0 + (px - m.ox) / m.s;
        const y = m.y0 + (H - m.oy - py) / m.s;
        camera.current?.panTo(x, y, animate);
    };

    return (
        <div className={`rounded-2xl overflow-hidden border border-white/15 bg-slate-950/70 backdrop-blur-md shadow-xl ${className}`} onPointerDown={e => e.stopPropagation()}>
            <canvas ref={ref} style={{ width: W, height: H, display: 'block', touchAction: 'none', cursor: 'crosshair' }}
                aria-label="Bản đồ nhỏ: chạm để di chuyển tới vùng đó"
                onPointerDown={e => { dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); moveTo(e, true); }}
                onPointerMove={e => { if (dragging.current) moveTo(e, false); }}
                onPointerUp={() => { dragging.current = false; }} />
        </div>
    );
};

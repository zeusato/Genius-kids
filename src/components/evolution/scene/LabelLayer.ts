// Nhãn DOM dạng pool (không React): vị trí cập nhật mỗi frame qua style.transform, tập nhãn tính lại ≤ 4 lần/giây.
import * as THREE from 'three';
import type { EvoWorld } from './world';
import { LOD, labelBudget, labelPriority, placeLabels, LabelCand } from '../engine/lod';
import { ERA_BANDS, fracEras } from '../engine/timeScale';
import { LAYOUT, rotate } from '../engine/layout';

const POOL = 40;

export class LabelLayer {
    private root: HTMLDivElement;
    private nodeEls: HTMLButtonElement[] = [];
    private eraEls: HTMLDivElement[] = [];
    private pin: HTMLDivElement;
    private placed: { i: number; x: number; y: number; side: string; dx: number; dy: number }[] = [];
    private lastPlace = 0;
    private v = new THREE.Vector3();
    hidden = false;
    onPick: ((i: number) => void) | null = null;

    constructor(container: HTMLDivElement, avatarHtml: string) {
        this.root = document.createElement('div');
        this.root.className = 'evo-labels';
        container.appendChild(this.root);
        for (let k = 0; k < POOL; k++) {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'evo-label';
            el.style.display = 'none';
            el.addEventListener('click', (e) => { e.stopPropagation(); const i = Number(el.dataset.i); if (!Number.isNaN(i)) this.onPick?.(i); });
            this.root.appendChild(el);
            this.nodeEls.push(el);
        }
        for (const b of ERA_BANDS) {
            const el = document.createElement('div');
            el.className = 'evo-era-label';
            el.textContent = b.name;
            this.root.appendChild(el);
            this.eraEls.push(el);
        }
        this.pin = document.createElement('div');
        this.pin.className = 'evo-pin';
        this.pin.innerHTML = `<span class="evo-pin-avatar">${avatarHtml}</span><span class="evo-pin-text">Bạn ở đây</span>`;
        this.pin.addEventListener('click', (e) => { e.stopPropagation(); this.onPick?.(-2); });
        this.root.appendChild(this.pin);
    }

    dispose() { this.root.remove(); }

    private toScreen(world: EvoWorld, group: THREE.Object3D, camera: THREE.Camera, x: number, y: number, w: number, h: number) {
        this.v.set(x, y, 0);
        group.localToWorld(this.v);
        this.v.project(camera);
        return [(this.v.x * 0.5 + 0.5) * w, (-this.v.y * 0.5 + 0.5) * h, this.v.z] as const;
    }

    update(world: EvoWorld, group: THREE.Object3D, camera: THREE.Camera, w: number, h: number, now: number) {
        this.root.style.display = this.hidden ? 'none' : '';
        if (this.hidden) return;
        const ppu = world.uniforms.uPxPerUnit.value;
        const t = world.tree;
        if (now - this.lastPlace > 250) {
            this.lastPlace = now;
            const cands: LabelCand[] = [];
            for (const n of t.nodes) {
                const i = n.i;
                if (!world.isVisibleNode(i) || i === 0) continue;
                const [sx, sy] = this.toScreen(world, group, camera, world.nodePos[i * 2], world.nodePos[i * 2 + 1], w, h);
                if (sx < -40 || sy < -40 || sx > w + 40 || sy > h + 40) continue;
                const tipPx = world.tipR[i] * ppu;
                const selected = world.selected === i;
                let eligible = selected || i === world.youAreHere;
                if (!eligible) {
                    if (n.isLeaf) eligible = tipPx >= LOD.NAME_PX / 2;
                    else {
                        const spanPx = world.polar.leafSpan[i] * LAYOUT.R * world.pr.nodeFrac[i] * ppu;
                        eligible = labelPriority(n, { selected: world.selected, youAreHere: world.youAreHere, approx: !!world.times.approx[i] }) >= 100
                            ? true : spanPx > 70 && n.leafCount >= 2;
                    }
                }
                if (!eligible) continue;
                const label = n.data.label.replace(/\s*\(.*?\)\s*/g, ' ').trim();
                const cw = Math.min(210, label.length * 7.4 + 18);
                cands.push({ i, x: sx, y: sy, w: cw, h: 24, prio: labelPriority(n, { selected: world.selected, youAreHere: world.youAreHere, approx: !!world.times.approx[i] }) - (world.isDimmed(i) ? 50 : 0), gap: Math.max(6, tipPx + 4) });
            }
            const placed = placeLabels(cands, labelBudget(w), w, h);
            this.placed = placed.map(p => {
                const c = cands.find(q => q.i === p.i)!;
                return { i: p.i, x: p.x, y: p.y, side: p.side, dx: p.x - c.x, dy: p.y - c.y };
            });
            this.nodeEls.forEach((el, k) => {
                const p = this.placed[k];
                if (!p) { el.style.display = 'none'; el.dataset.i = ''; return; }
                const n = t.nodes[p.i];
                if (el.dataset.i !== String(p.i)) {
                    el.dataset.i = String(p.i);
                    el.textContent = n.data.label.replace(/\s*\(.*?\)\s*/g, ' ').trim();
                    el.title = n.data.englishLabel ?? '';
                }
                el.classList.toggle('is-major', !n.isLeaf && n.leafCount >= 10);
                el.classList.toggle('is-selected', world.selected === p.i);
                el.classList.toggle('is-extinct', n.extinct);
                el.classList.toggle('is-dim', world.isDimmed(p.i));
                el.style.display = '';
            });
        }
        // bám vị trí mỗi frame (camera trôi mượt)
        this.placed.forEach((p, k) => {
            const el = this.nodeEls[k];
            const [sx, sy] = this.toScreen(world, group, camera, world.nodePos[p.i * 2], world.nodePos[p.i * 2 + 1], w, h);
            el.style.transform = `translate3d(${(sx + p.dx).toFixed(1)}px, ${(sy + p.dy).toFixed(1)}px, 0)`;
        });
        // tên các vòng đại dọc mép trái của quạt
        let lastX = -1e9, lastY = -1e9, lastLen = 0;
        ERA_BANDS.forEach((b, k) => {
            const f = (fracEras(b.fromMa) + fracEras(b.toMa)) / 2;
            const r = LAYOUT.R * world.fracOf(maMid(b.fromMa, b.toMa));
            const [x, y] = rotate(world.orientation, -r * Math.cos(0.012), r * Math.sin(0.012) - 18);
            const [sx, sy] = this.toScreen(world, group, camera, x, y, w, h);
            const el = this.eraEls[k];
            const tooClose = Math.abs(sx - lastX) < (b.name.length + lastLen) * 4.2 + 18 && Math.abs(sy - lastY) < 18;
            const show = !tooClose && sx > 4 && sx < w - 60 && sy > 4 && sy < h - 10 && world.fracOf(b.toMa) <= Math.max(world.uniforms.uNowFrac.value, 0) + 0.2 && f >= 0;
            el.style.display = show ? '' : 'none';
            if (show) { lastX = sx; lastY = sy; lastLen = b.name.length; }
            el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
        });
        // ghim "Bạn ở đây"
        const hi = world.youAreHere;
        const vis = world.isVisibleNode(hi) && world.nowMa <= 0.3;
        this.pin.style.display = vis ? '' : 'none';
        if (vis) {
            const [sx, sy] = this.toScreen(world, group, camera, world.nodePos[hi * 2], world.nodePos[hi * 2 + 1], w, h);
            const lift = world.tipR[hi] * ppu + 6;
            this.pin.style.transform = `translate3d(${sx.toFixed(1)}px, ${(sy - lift).toFixed(1)}px, 0) translate(-50%, -100%)`;
        }
    }
}

function maMid(a: number, b: number) {
    // giữa dải theo bán kính (thang đại)
    const f = (fracEras(a) + fracEras(b)) / 2;
    // tìm ma có fracEras = f bằng chia đôi đơn giản
    let lo = b, hi = a;
    for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (fracEras(m) > f) lo = m; else hi = m; }
    return (lo + hi) / 2;
}

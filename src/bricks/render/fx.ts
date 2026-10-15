// Hiệu ứng phản hồi (plan mục 7.5): "tách" khi lắp (mảnh sáng lên rơi về chỗ, hơi bẹp) và "bụp" khi tháo (hạt văng).
// Toạ độ LDraw (LDU, Y xuống) — group này nằm trong lớp phủ đã đổi trục. Giảm chuyển động: không tạo hiệu ứng.
import * as THREE from 'three';
import type { V3 } from '../engine/types';

const SETTLE_MS = 120, POP_MS = 380, DROP = 6;   // 6 LDU ≈ 0,3 đơn vị three (1 núm = 20 LDU)

interface Anim { start: number; ms: number; step(t: number): void; done(): void }

export class Fx {
  readonly group = new THREE.Group();
  private anims: Anim[] = [];
  private raf = 0;
  private cube = new THREE.BoxGeometry(4, 4, 4);

  constructor(private invalidate: () => void, private reduced: boolean) { this.group.userData.keep = true; }

  /** Lắp: bản sao sáng của mảnh rơi DROP LDU về đúng chỗ, cuối hành trình hơi bẹp rồi biến mất. */
  settle(piece: THREE.Object3D, matrix: THREE.Matrix4) {
    if (this.reduced) return;
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.45, depthWrite: false });
    piece.traverse(o => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = mat; });
    const holder = new THREE.Group(); holder.matrixAutoUpdate = false; holder.add(piece);
    this.group.add(holder);
    const base = matrix.clone(), tmp = new THREE.Matrix4();
    this.add(SETTLE_MS, t => {
      const ease = 1 - (1 - t) * (1 - t);
      const squash = t > 0.7 ? 1 - 0.06 * Math.sin(((t - 0.7) / 0.3) * Math.PI) : 1;
      holder.matrix.copy(tmp.makeTranslation(0, -DROP * (1 - ease), 0)).multiply(base).multiply(new THREE.Matrix4().makeScale(1, squash, 1));
      mat.opacity = 0.45 * (1 - t);
    }, () => { this.group.remove(holder); mat.dispose(); });
  }

  /** Tháo: vài hạt cùng màu văng ra từ tâm mảnh, rơi theo trọng lực, mờ dần. */
  pop(center: V3, color: THREE.Color) {
    if (this.reduced) return;
    const mat = new THREE.MeshStandardMaterial({ color, transparent: true, roughness: 0.4 });
    const bits = Array.from({ length: 10 }, (_, i) => {
      const m = new THREE.Mesh(this.cube, mat), a = (i / 10) * Math.PI * 2;
      this.group.add(m);
      return { m, v: new THREE.Vector3(Math.cos(a) * 60, -90 - (i % 3) * 25, Math.sin(a) * 60) };   // LDU/s, Y âm = lên
    });
    this.add(POP_MS, t => {
      const s = t * POP_MS / 1000;
      for (const b of bits) { b.m.position.set(center[0] + b.v.x * s, center[1] + b.v.y * s + 260 * s * s, center[2] + b.v.z * s); b.m.rotation.set(t * 4, t * 3, 0); }
      mat.opacity = 1 - t;
    }, () => { for (const b of bits) this.group.remove(b.m); mat.dispose(); });
  }

  private add(ms: number, step: (t: number) => void, done: () => void) {
    this.anims.push({ start: performance.now(), ms, step, done });
    step(0);
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = 0;
    this.anims = this.anims.filter(a => {
      const t = Math.min(1, (now - a.start) / a.ms);
      a.step(t);
      if (t >= 1) { a.done(); return false; }
      return true;
    });
    this.invalidate();
    if (this.anims.length) this.raf = requestAnimationFrame(this.tick);
  };

  dispose() { cancelAnimationFrame(this.raf); for (const a of this.anims) a.done(); this.anims = []; this.cube.dispose(); }
}

// Mặt nạ cắt (plan mục 6.1): vẽ Sheet bằng Canvas 2D vào texture, shader bỏ pixel ngoài giấy.
// Kênh G = giấy (alphaMap của three đọc kênh G). Kênh R = vết nếp (sau GĐ0).
import * as THREE from 'three';
import type { Shape } from '../engine/poly';

export interface MaskFrame { x0: number; y0: number; w: number; h: number }

export class CutMask {
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;

  constructor(readonly frame: MaskFrame, readonly size = 2048) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.NoColorSpace;
    this.texture.anisotropy = 8;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
  }

  /** Vẽ lại toàn bộ Sheet; trả ms để báo cáo spike. */
  draw(sheet: Shape): number {
    const t0 = performance.now(), { ctx, size } = this, { x0, y0, w, h } = this.frame;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    // UV v = (y − y0)/h, CanvasTexture lật Y nên hàng trên cùng của canvas ứng với y lớn nhất.
    ctx.setTransform(size / w, 0, 0, -size / h, -x0 * size / w, (y0 + h) * size / h);
    ctx.beginPath();
    for (const ring of sheet) {
      ring.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
    }
    ctx.fillStyle = '#0f0';
    ctx.fill('nonzero');
    this.texture.needsUpdate = true;
    return performance.now() - t0;
  }

  dispose() { this.texture.dispose(); }
}

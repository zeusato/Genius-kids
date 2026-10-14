// Vật liệu nhựa (plan mục 8.1). Màu theo bảng palette của catalog; màu cố định (phần in, kính, lốp) lấy từ fixedColors.
import * as THREE from 'three';
import type { Catalog } from '../engine/types';

export type Quality = 'high' | 'mid' | 'low';
export type Bucket = 'opaque' | 'trans' | 'shiny';

/**
 * Mức chất lượng mặc định theo máy (plan mục 8.3): ít nhân/ít RAM hoặc màn nhỏ cảm ứng → thấp hơn.
 * Người dùng vẫn đổi được; lựa chọn được nhớ trong localStorage `bricks-quality`.
 */
export function detectQuality(): Quality {
  try { const saved = localStorage.getItem('bricks-quality'); if (saved === 'high' || saved === 'mid' || saved === 'low') return saved; } catch { /* bỏ qua */ }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 4, mem = nav.deviceMemory ?? 4, touch = matchMedia?.('(pointer: coarse)').matches;
  if (cores <= 2 || mem <= 2) return 'low';
  if (touch && (cores <= 6 || mem <= 4)) return 'mid';
  return 'high';
}

export class Materials {
  private fixed = new Map<number, THREE.Material>();
  readonly bucket: Record<Bucket, THREE.Material>;
  readonly ghostOk: THREE.MeshStandardMaterial;
  readonly ghostBad: THREE.MeshStandardMaterial;
  readonly xray: THREE.MeshBasicMaterial;
  readonly highlight: THREE.MeshBasicMaterial;
  readonly floatMark: THREE.MeshBasicMaterial;
  readonly hint: THREE.MeshStandardMaterial;
  private colorOf = new Map<string, { color: THREE.Color; bucket: Bucket }>();

  constructor(private catalog: Catalog, readonly quality: Quality) {
    const plastic = quality === 'low'
      ? new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0 })
      : new THREE.MeshPhysicalMaterial({ roughness: 0.28, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.15 });
    this.bucket = {
      opaque: plastic,
      trans: new THREE.MeshPhysicalMaterial({ roughness: 0.05, metalness: 0, transparent: true, opacity: 0.55, depthWrite: false }),
      shiny: new THREE.MeshStandardMaterial({ roughness: 0.22, metalness: 0.85 }),
    };
    this.ghostOk = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.55, depthWrite: false, roughness: 0.4 });
    this.ghostBad = new THREE.MeshStandardMaterial({ color: '#ff5a5a', transparent: true, opacity: 0.5, depthWrite: false, roughness: 0.4 });
    this.xray = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, depthTest: false, depthWrite: false });
    this.highlight = new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0.35, depthWrite: false });
    this.floatMark = new THREE.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0.35, depthWrite: false });
    this.hint = new THREE.MeshStandardMaterial({ color: '#2d8cff', transparent: true, opacity: 0.38, depthWrite: false, roughness: 0.5 });
    for (const c of catalog.palette) {
      this.colorOf.set(c.key, { color: new THREE.Color(c.hex), bucket: c.kind === 'trans' ? 'trans' : c.kind === 'shiny' ? 'shiny' : 'opaque' });
    }
  }
  color(key: string) { return this.colorOf.get(key) ?? { color: new THREE.Color('#999999'), bucket: 'opaque' as Bucket }; }
  /** Vật liệu cho nhóm màu cố định (mã LDraw). */
  fixedMaterial(code: number): THREE.Material {
    let m = this.fixed.get(code);
    if (!m) {
      const f = this.catalog.fixedColors[String(code)];
      const color = new THREE.Color(f?.hex ?? '#888888');
      if (f && f.alpha < 255) m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.05, transparent: true, opacity: 0.5, depthWrite: false });
      else if (f && (f.material === 'chrome' || f.material === 'metal' || f.material === 'pearl')) m = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.8 });
      else if (f?.material === 'rubber') m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 });
      else m = this.quality === 'low' ? new THREE.MeshStandardMaterial({ color, roughness: 0.35 }) : new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, clearcoat: 0.3, clearcoatRoughness: 0.15 });
      this.fixed.set(code, m);
    }
    return m;
  }
  dispose() {
    for (const m of [...Object.values(this.bucket), ...this.fixed.values(), this.ghostOk, this.ghostBad, this.xray, this.highlight, this.floatMark, this.hint]) m.dispose();
  }
}

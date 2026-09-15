import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { glyph, NAMES } from './model';
export const point = (square: number): [number, number, number] => [square % 9 - 4, .24, 4.5 - Math.floor(square / 9)];
export function slab(width: number, height: number, depth: number, radius = .18) {
  const x = -width / 2, y = -height / 2, s = new T.Shape();
  s.moveTo(x + radius, y); s.lineTo(x + width - radius, y); s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + height - radius); s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  s.lineTo(x + radius, y + height); s.quadraticCurveTo(x, y + height, x, y + height - radius);
  s.lineTo(x, y + radius); s.quadraticCurveTo(x, y, x + radius, y);
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 2, curveSegments: 8, steps: 1 });
  g.rotateX(-Math.PI / 2); return g;
}
function canvas(width: number, height: number) { const c = document.createElement('canvas'); c.width = width; c.height = height; return { c, ctx: c.getContext('2d')! }; }
const texture = (c: HTMLCanvasElement) => { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; };
export function boardTexture(vietnamese: boolean) {
  const { c, ctx } = canvas(1024, 1130), w = c.width, h = c.height;
  const gradient = ctx.createLinearGradient(0, 0, w, h); gradient.addColorStop(0, '#e4c590'); gradient.addColorStop(.5, '#edcf9b'); gradient.addColorStop(1, '#d6b37c'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 210; i++) { ctx.strokeStyle = `rgba(100,61,30,${.014 + i % 5 * .004})`; ctx.lineWidth = .5 + i % 3; ctx.beginPath(); for (let x = 0; x <= w; x += 16) { const y = i * 5.5 + Math.sin(x * .013 + i * .6) * 7 + Math.sin(x * .031 + i) * 2; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  const px = (file: number) => (file + .8) / 9.6 * w, py = (rank: number) => (9 - rank + .8) / 10.6 * h;
  const line = (x1: number, y1: number, x2: number, y2: number) => { ctx.beginPath(); ctx.moveTo(px(x1), py(y1)); ctx.lineTo(px(x2), py(y2)); ctx.stroke(); };
  ctx.strokeStyle = '#805433'; ctx.lineWidth = 2;
  for (let r = 0; r < 10; r++) line(0, r, 8, r);
  for (let f = 0; f < 9; f++) { if (!f || f === 8) line(f, 0, f, 9); else { line(f, 0, f, 4); line(f, 5, f, 9); } }
  for (const r of [0, 7]) { line(3, r, 5, r + 2); line(5, r, 3, r + 2); }
  for (const [f, r] of [[1, 2], [7, 2], [1, 7], [7, 7], ...[0, 2, 4, 6, 8].flatMap(f => [[f, 3], [f, 6]])]) {
    for (const dx of [-1, 1]) for (const dy of [-1, 1]) { if ((f === 0 && dx < 0) || (f === 8 && dx > 0)) continue;
      ctx.beginPath(); ctx.moveTo(px(f) + dx * 6, py(r) + dy * 16); ctx.lineTo(px(f) + dx * 6, py(r) + dy * 6); ctx.lineTo(px(f) + dx * 16, py(r) + dy * 6); ctx.stroke();
    }
  }
  ctx.strokeStyle = '#9d7348'; ctx.lineWidth = 4; ctx.strokeRect(px(0) - 9, py(9) - 9, px(8) - px(0) + 18, py(0) - py(9) + 18);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#805b39'; ctx.font = vietnamese ? '600 25px KyVien' : '600 39px XiangqiPieces';
  ctx.fillText(vietnamese ? 'S Ô N G  S Ở' : '楚 河', px(2), h / 2); ctx.fillText(vietnamese ? 'B Ờ  H Á N' : '漢 界', px(6), h / 2);
  ctx.font = '15px KyVien'; ctx.fillStyle = '#906c49'; for (let f = 0; f < 9; f++) { ctx.fillText('abcdefghi'[f], px(f), h - 28); ctx.fillText('ihgfedcba'[f], px(f), 28); }
  return texture(c);
}
export function faceTexture(piece: number, vietnamese: boolean) {
  const { c, ctx } = canvas(256, 256), ink = piece > 0 ? '#a7352c' : '#293e34';
  const gradient = ctx.createRadialGradient(94, 76, 8, 128, 128, 125); gradient.addColorStop(0, '#fff2d4'); gradient.addColorStop(.85, '#efdab0'); gradient.addColorStop(1, '#c8a470');
  ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(128, 128, 127, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b9925b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(128, 128, 117, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(128, 128, 105, 0, Math.PI * 2); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = ink;
  ctx.font = vietnamese ? `800 ${NAMES[Math.abs(piece)].length > 4 ? 44 : 51}px KyVien` : '600 156px XiangqiPieces';
  ctx.fillText(vietnamese ? NAMES[Math.abs(piece)] : glyph(piece), 128, vietnamese ? 129 : 140);
  return texture(c);
}
/** Baked geometry keeps the garden to a single draw call. */
export function gardenGeometry() {
  const parts: T.BufferGeometry[] = [];
  const add = (geometry: T.BufferGeometry, color: string, pos: number[], scale = [1, 1, 1], rotation = [0, 0, 0]) => {
    geometry.scale(...scale as [number, number, number]); geometry.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...rotation as [number, number, number]))); geometry.translate(...pos as [number, number, number]);
    const g = geometry.index ? geometry.toNonIndexed() : geometry; if (g !== geometry) geometry.dispose(); const c = new T.Color(color), colors = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < colors.length; i += 3) { colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b; } g.setAttribute('color', new T.BufferAttribute(colors, 3)); parts.push(g);
  };
  for (let x = -9; x <= 9; x++) for (let z = -9; z <= 9; z++) add(new T.BoxGeometry(.94, .04, .94), ['#b8bea3', '#b1baa0', '#c1c5af'][(x + z + 18) % 3], [x, -.99, z]);
  for (const side of [-1, 1]) {
    const x = side * 6.7, z = -3.6;
    add(new T.CylinderGeometry(.73, .53, .75, 20), side === -1 ? '#ac7650' : '#648575', [x, -.55, z]);
    add(new T.CylinderGeometry(.66, .66, .08, 20), '#413f2d', [x, -.15, z]);
    add(new T.CylinderGeometry(.08, .2, 1.8, 10), '#795b3a', [x, .72, z], [1, 1, 1], [0, 0, side * -.2]);
    for (let i = 0; i < 8; i++) { const angle = i * 2.4; add(new T.IcosahedronGeometry(1, 2), ['#536e43', '#658651', '#78965e'][i % 3], [x + Math.cos(angle) * .7, 1.7 + i % 3 * .28, z + Math.sin(angle) * .7], [.86, .4, .8]); }
    for (let i = 0; i < 5; i++) { const bx = side * (7.2 + i * .24), bz = 2.5 + i % 2 * .5; add(new T.CylinderGeometry(.035, .065, 3.2, 6), '#778753', [bx, .6, bz]);
      for (let leaf = 0; leaf < 5; leaf++) add(new T.SphereGeometry(1, 6, 4), leaf % 2 ? '#68894d' : '#809659', [bx + Math.sin(leaf * 2) * .45, leaf * .48, bz], [.55, .02, .16], [0, leaf, .35]);
    }
  }
  // Small glazed tea set beside the board.
  add(new T.CylinderGeometry(.5, .57, .1, 24), '#9b754f', [6.05, -.43, .4], [1.7, 1, 1.3]);
  add(new T.SphereGeometry(.33, 16, 10), '#668176', [6.1, -.22, .28], [1, .8, 1]);
  add(new T.CylinderGeometry(.15, .2, .06, 16), '#a9b5a0', [6.1, .02, .28]);
  add(new T.SphereGeometry(.06, 8, 6), '#668176', [6.1, .08, .28]);
  add(new T.ConeGeometry(.1, .4, 12), '#668176', [5.73, -.14, .28], [1, 1, 1], [0, 0, 1.1]);
  add(new T.TorusGeometry(.22, .045, 6, 16), '#668176', [6.39, -.15, .28], [1, 1, 1], [0, Math.PI / 2, 0]);
  for (const z of [.8, -.3]) { add(new T.CylinderGeometry(.12, .085, .16, 16), '#ccd1b4', [6.05, -.31, z]); add(new T.CircleGeometry(.09, 16), '#705439', [6.05, -.225, z], [1, 1, 1], [-Math.PI / 2, 0, 0]); }
  const merged = mergeGeometries(parts); parts.forEach(g => g.dispose()); return merged;
}

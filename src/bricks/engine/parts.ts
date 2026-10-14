// Chuẩn bị dữ liệu mảnh theo từng hướng (cache), và lớp đối xứng của hướng.
import { ORIENTS, rot, rotBox } from './orient';
import type { Box, CatalogPart, Conn, ConnKind, V3 } from './types';

export interface OrientedPart { conns: Conn[]; boxes: Box[]; bbox: Box; studs: { p: V3; a: V3; k: ConnKind }[] }
export interface PartDef { key: string; src: CatalogPart; oriented: (o: number) => OrientedPart; symClass: number[] }

const round = (v: number) => Math.round(v * 8) / 8;
const rv = (v: V3): V3 => [round(v[0]), round(v[1]), round(v[2])];

export function preparePart(key: string, src: CatalogPart): PartDef {
  const cache: OrientedPart[] = [];
  const oriented = (o: number) => {
    if (cache[o]) return cache[o];
    const m = ORIENTS[o];
    const conns = src.conns.map(c => ({ k: c.k, p: rv(rot(m, c.p)), a: rv(rot(m, c.a)) }));
    const boxes = src.boxes.map(b => rotBox(m, b));
    const bb = rotBox(m, [...src.bbox[0], ...src.bbox[1]] as Box);
    return (cache[o] = { conns, boxes, bbox: bb, studs: conns.filter(c => c.k === 's' || c.k === 'p') });
  };
  // Hai hướng tương đương khi tập hộp + điểm nối trùng nhau hoàn toàn (không dịch).
  const sig = (o: number) => {
    const p = oriented(o);
    return [...p.boxes.map(b => 'b' + b.join(',')).sort(), ...p.conns.map(c => c.k + c.p.join(',') + '/' + c.a.join(',')).sort()].join('|');
  };
  const seen = new Map<string, number>();
  // Mảnh in hoa văn: hình in không đối xứng dù khối hình đối xứng → mọi hướng đều khác nhau.
  const symClass = src.print ? ORIENTS.map((_, o) => o) : ORIENTS.map((_, o) => { const s = sig(o); if (!seen.has(s)) seen.set(s, o); return seen.get(s)!; });
  return { key, src, oriented, symClass };
}

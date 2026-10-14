// Kiểu dữ liệu catalog (sinh bởi scripts/bricks-parts.mjs) và mô hình. Toạ độ LDraw: LDU, trục Y hướng xuống.
export type V3 = [number, number, number];
export type Box = [number, number, number, number, number, number]; // x0 y0 z0 x1 y1 z1

/** s = núm, a = lỗ nhận núm, p = chốt/thanh r4, h = lỗ chốt r4 */
export type ConnKind = 's' | 'a' | 'p' | 'h';
export interface Conn { k: ConnKind; p: V3; a: V3 }

export interface MeshRef { vc: number; i32: boolean; pos: [number, number]; nrm: [number, number]; idx: [number, number]; groups: { color: number; start: number; count: number }[] }
export interface StudInst { k: 's' | 'h'; m: number[]; c: number }
export interface BomItem { ldraw: string; color: 'self' | number; qty: number; name?: string; nameVi?: string; m?: number[] }

export interface CatalogPart {
  name: string; group: string; ldraw: string | null; rb: string | null;
  print?: boolean; kit?: boolean; lite?: boolean; faces: number;
  bbox: [V3, V3]; mesh: MeshRef; boxes: Box[]; conns: Conn[]; studs: StudInst[]; bom: BomItem[];
  colors: string[] | null;
}
export interface PaletteColor { key: string; ldraw: number; rb: number; nameVi: string; nameEn: string; kind: 'basic' | 'trans' | 'shiny'; hex: string; alpha: number; material: string }
export interface Catalog {
  version: 1; generated: string; posScale: number;
  groups: { id: string; nameVi: string; parts: string[]; bin: string }[];
  palette: PaletteColor[]; preschoolColors: string[];
  fixedColors: Record<string, { hex: string; alpha: number; material: string; name: string }>;
  studs: Record<'s' | 'h', { faces: number; mesh: MeshRef }>; studBin: string;
  parts: Record<string, CatalogPart>;
  credits: Record<string, unknown>;
}

/** Một mảnh đã lắp. `o` = chỉ số hướng trong bảng 24 phép xoay (orient.ts). */
export interface Piece { id: number; part: string; color: string; pos: V3; o: number }

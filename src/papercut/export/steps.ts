// Từ lịch sử thao tác tới các bước tài liệu (plan mục 7.1):
// bỏ nếp nháp (gấp rồi mở ngay, không cắt gì), gộp các nhát cắt liền nhau ở cùng trạng thái gấp,
// gộp các lần mở liên tiếp ở cuối thành một bước "Mở ra".
import type { FoldEntry, Op, PaperSpec } from '../model';
import { describeFold } from '../engine/describe';
import type { Facet } from '../engine/fold';
import type { Vec } from '../engine/geom';
import { area, union, type Shape } from '../engine/poly';
import { applyOp, initialState, type StudioState } from '../engine/recipe';

export interface CutMark { stroke: Vec[]; closed: boolean; punch: boolean }

export type Step =
  | { kind: 'paper'; spec: PaperSpec; text: string }
  | { kind: 'fold'; entry: FoldEntry; before: Facet[]; after: Facet[]; text: string }
  | { kind: 'cut'; before: Facet[]; after: Facet[]; marks: CutMark[]; gone: Shape; punches: number; text: string }
  | { kind: 'unfold'; before: Facet[]; after: Facet[]; text: string }
  | { kind: 'result'; sheet: Shape; spec: PaperSpec; pieces: number; text: string };

const SHAPE_NAME: Record<PaperSpec['shape'], string> = { square: 'vuông', rect: 'chữ nhật', strip: 'dải dài', circle: 'tròn', hexagon: 'lục giác' };

export function paperText(spec: PaperSpec): string {
  const size = spec.shape === 'hexagon' || spec.shape === 'circle' ? `rộng ${fmt(spec.w)} cm` : spec.w === spec.h ? `cạnh ${fmt(spec.w)} cm` : `${fmt(spec.w)} × ${fmt(spec.h)} cm`;
  return `Chuẩn bị một tờ giấy thủ công ${SHAPE_NAME[spec.shape]} ${size}, một cây kéo đầu tròn và bút chì.`;
}
const fmt = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 });

/** Lớp ngoài cùng: các thao tác đã rút gọn (bỏ nếp nháp), mỗi op kèm trạng thái trước và sau. */
interface Played { op: Op; before: StudioState; after: StudioState; gone?: Shape }

function play(spec: PaperSpec, ops: readonly Op[]): Played[] {
  const out: Played[] = [];
  let s = initialState(spec);
  for (const op of ops) {
    const next = applyOp(s, op);
    if (op.kind === 'unfold') {
      const last = out[out.length - 1];
      // nếp nháp: gấp rồi mở ngay → bỏ cả hai
      if (last && (last.op.kind === 'fold' || last.op.kind === 'flip') && s.entries.length && s.entries[s.entries.length - 1] === last.op) { out.pop(); s = next; continue; }
    }
    if (op.kind === 'cut' && next.sheet === s.sheet) { s = next; continue; } // cắt trượt: không đổi gì
    const gone = op.kind === 'cut' ? union(op.region, ...(next.dropped ?? [])) : undefined;
    out.push({ op, before: s, after: next, gone });
    s = next;
  }
  return out;
}

export function buildSteps(spec: PaperSpec, ops: readonly Op[]): Step[] {
  const played = play(spec, ops);
  const steps: Step[] = [{ kind: 'paper', spec, text: paperText(spec) }];
  let last: StudioState = initialState(spec);
  for (let i = 0; i < played.length; i++) {
    const { op, before, after, gone } = played[i];
    last = after;
    if (op.kind === 'fold' || op.kind === 'flip') { steps.push({ kind: 'fold', entry: op, before: before.facets, after: after.facets, text: describeFold(before.facets, op) }); continue; }
    if (op.kind === 'cut') {
      const mark: CutMark = { stroke: op.stroke ?? op.region[0] ?? [], closed: op.closed ?? !op.stroke, punch: op.tool === 'punch' };
      const prev = steps[steps.length - 1];
      if (prev.kind === 'cut') {
        prev.marks.push(mark); prev.after = after.facets; prev.gone = union(prev.gone, gone!); if (mark.punch) prev.punches++;
      } else steps.push({ kind: 'cut', before: before.facets, after: after.facets, marks: [mark], gone: gone!, punches: mark.punch ? 1 : 0, text: '' });
      continue;
    }
    // mở nếp: các lần mở liên tiếp gộp lại
    const prev = steps[steps.length - 1];
    if (prev.kind === 'unfold') prev.after = after.facets;
    else steps.push({ kind: 'unfold', before: before.facets, after: after.facets, text: '' });
  }
  for (const s of steps) {
    if (s.kind === 'cut') {
      const cuts = s.marks.length - s.punches;
      s.text = [cuts ? `Vẽ ${cuts > 1 ? 'các nét' : 'nét'} theo hình rồi cắt bỏ phần tô xám. Đừng cắt đứt hết đường gấp nhé!` : '', s.punches ? `Đục ${s.punches} lỗ ở chỗ đánh dấu.` : ''].filter(Boolean).join(' ');
    }
    if (s.kind === 'unfold') s.text = s.after.length === 1 && s === steps[steps.length - 1] ? 'Mở nhẹ từng nếp gấp ra.' : 'Mở nếp vừa gấp ra.';
  }
  const pieces = last.sheet.filter(r => ringArea(r) > 0).length;
  const sheetArea = area(last.sheet);
  steps.push({ kind: 'result', sheet: last.sheet, spec, pieces, text: pieces > 1 ? `Xong rồi! Giấy tách thành ${pieces} mảnh.` : last.entries.length ? 'Xong! Mở ra để xem hoa văn.' : sheetArea > 0 ? 'Xong rồi! Ngắm tác phẩm của em nhé.' : '' });
  return steps;
}

function ringArea(r: Vec[]) { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.y - q.x * p.y; } return a / 2; }

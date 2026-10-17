// Chặn vòng lặp vô hạn của clipper2-ts 2.0.1-18 (bản mới nhất lúc 15/10/2026).
//
// Bẫy: với vài cấu hình cạnh ngang sau khi làm tròn lưới, `doHorizontalClosed` lặp mãi ở
// `while (horz.vertexTop !== vertexMax) updateEdgeIntoAEL(horz)` (fuzz seq 33 và 55). Một lượt quét đúng
// chỉ đẩy mỗi cạnh qua mỗi đỉnh một lần, nên số lần gọi `updateEdgeIntoAEL` ≤ số đỉnh đầu vào.
// Ta cấp ngân sách 4·đỉnh + 1024 mỗi lần quét; vượt thì ném lỗi — `execute()` của Clipper tự bắt lỗi
// và trả `false`, khi đó `poly.ts` thử lại ở lưới khác (tất định).
import { ClipperBase } from 'clipper2-ts';

interface VertexLike { next: VertexLike | null }
interface Guarded { vertexList: VertexLike[]; __budget?: number }

let installed = false;

export function installClipperGuard() {
  if (installed) return;
  installed = true;
  const proto = ClipperBase.prototype as unknown as {
    reset(this: Guarded): void;
    updateEdgeIntoAEL(this: Guarded, ae: unknown): void;
  };
  const reset = proto.reset, update = proto.updateEdgeIntoAEL;
  proto.reset = function (this: Guarded) {
    let n = 0;
    for (const head of this.vertexList) {
      let v: VertexLike | null = head;
      do { n++; v = v!.next; } while (v && v !== head && n < 1e8);
    }
    this.__budget = 4 * n + 1024;
    reset.call(this);
  };
  proto.updateEdgeIntoAEL = function (this: Guarded, ae: unknown) {
    if (this.__budget !== undefined && --this.__budget < 0) throw new Error('clipper2-ts: horizontal edge loop');
    update.call(this, ae);
  };
}

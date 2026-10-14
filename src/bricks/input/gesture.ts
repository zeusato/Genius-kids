// Máy trạng thái nhận chạm (plan mục 7.3). Chỉ máy này nghe pointer trên khung 3D; camera nhận lệnh từ đây.
// Thuần TypeScript: nhận sự kiện (id, x, y, loại) và gọi các hàm phản hồi.

export interface GestureCallbacks {
  /** Có trúng bóng mờ (đã nới vùng chạm) không. */
  hitsGhost(x: number, y: number): boolean;
  orbit(dx: number, dy: number): void;
  /** Hai ngón: hệ số thu phóng (>1 = phóng to) và độ dời tâm (px). */
  pinch(scale: number, dx: number, dy: number): void;
  tap(x: number, y: number, mouse: boolean): void;
  /** Kéo bóng mờ hoặc kéo từ khay: (x, y) đã trừ độ lệch ngón. */
  dragMove(x: number, y: number): void;
  dragEnd(x: number, y: number): void;
  dragCancel(): void;
  /** Chuột di (không bấm) — xem trước theo con trỏ. */
  hover?(x: number, y: number): void;
}

type State = 'idle' | 'pending' | 'orbit' | 'pinch' | 'dragGhost' | 'dragTray';
interface Pt { x: number; y: number; sx: number; sy: number; type: string }

export const TAP_SLOP = 8;        // px: di quá ngưỡng thì thành xoay camera
export const TRAY_SLOP = 12;      // px: kéo thẻ ra khỏi khay

export class GestureMachine {
  state: State = 'idle';
  private pts = new Map<number, Pt>();
  private lastPinch: { d: number; cx: number; cy: number } | null = null;
  /** Độ lệch ngón khi kéo trên cảm ứng (A/B ở GĐ1). */
  fingerOffset = 40;

  constructor(private cb: GestureCallbacks) {}

  private offset(p: Pt) { return p.type === 'touch' ? this.fingerOffset : 0; }

  down(id: number, x: number, y: number, type = 'touch') {
    this.pts.set(id, { x, y, sx: x, sy: y, type });
    if (this.pts.size >= 2) {
      if (this.state === 'dragGhost' || this.state === 'dragTray') this.cb.dragCancel();
      this.state = 'pinch';
      this.lastPinch = this.pinchInfo();
      return;
    }
    if (this.state === 'dragTray') return; // khay đã bắt đầu kéo, ngón này là chính nó
    this.state = this.cb.hitsGhost(x, y) ? 'dragGhost' : 'pending';
  }

  /** Khay gọi khi thẻ mảnh bị kéo ra khỏi khay. */
  beginTrayDrag(id: number, x: number, y: number, type = 'touch') {
    this.pts.set(id, { x, y, sx: x, sy: y, type });
    this.state = 'dragTray';
    const p = this.pts.get(id)!;
    this.cb.dragMove(x, y - this.offset(p));
  }

  move(id: number, x: number, y: number) {
    const p = this.pts.get(id);
    if (!p) { if (this.state === 'idle') this.cb.hover?.(x, y); return; }
    const px = p.x, py = p.y;
    p.x = x; p.y = y;
    switch (this.state) {
      case 'pending':
        if (Math.hypot(x - p.sx, y - p.sy) > TAP_SLOP) { this.state = 'orbit'; this.cb.orbit(x - p.sx, y - p.sy); }
        else if (p.type === 'mouse') this.cb.hover?.(x, y);
        break;
      case 'orbit': this.cb.orbit(x - px, y - py); break;
      case 'dragGhost': case 'dragTray': this.cb.dragMove(x, y - this.offset(p)); break;
      case 'pinch': {
        const info = this.pinchInfo();
        if (info && this.lastPinch && this.lastPinch.d > 0) this.cb.pinch(info.d / this.lastPinch.d, info.cx - this.lastPinch.cx, info.cy - this.lastPinch.cy);
        this.lastPinch = info;
        break;
      }
    }
  }

  up(id: number, x: number, y: number) {
    const p = this.pts.get(id);
    if (!p) return;
    this.pts.delete(id);
    switch (this.state) {
      case 'pending': this.state = 'idle'; this.cb.tap(x, y, p.type === 'mouse'); break;
      case 'orbit': this.state = 'idle'; break;
      case 'dragGhost': case 'dragTray': this.state = 'idle'; this.cb.dragEnd(x, y - this.offset(p)); break;
      case 'pinch': if (this.pts.size === 0) { this.state = 'idle'; this.lastPinch = null; } else this.lastPinch = this.pinchInfo(); break;
    }
  }

  /** pointercancel, mất focus, tab ẩn → huỷ mọi thao tác dở. */
  cancel() {
    if (this.state === 'dragGhost' || this.state === 'dragTray') this.cb.dragCancel();
    this.pts.clear(); this.state = 'idle'; this.lastPinch = null;
  }

  private pinchInfo() {
    const [a, b] = [...this.pts.values()];
    if (!a || !b) return null;
    return { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  }
}

// Máy trạng thái nhận chạm (plan mục 7.3). Chỉ máy này nghe pointer trên khung 3D; camera nhận lệnh từ đây.
// Thuần TypeScript: nhận sự kiện (id, x, y, loại) và gọi các hàm phản hồi.

export interface GestureCallbacks {
  /** Có trúng bóng mờ (đã nới vùng chạm) không. */
  hitsGhost(x: number, y: number): boolean;
  orbit(dx: number, dy: number): void;
  /** Hai ngón: hệ số thu phóng (>1 = phóng to) và độ dời tâm (px). */
  pinch(scale: number, dx: number, dy: number): void;
  /** Hai ngón vặn: góc quay (radian, dương = theo chiều kim đồng hồ trên màn hình). Không có = tắt (chế độ bé). */
  twist?(angle: number): void;
  /** `double`: chạm thứ hai liên tiếp, cùng chỗ (≤ DOUBLE_MS, ≤ DOUBLE_SLOP). */
  tap(x: number, y: number, mouse: boolean, double: boolean): void;
  /** Kéo bóng mờ hoặc kéo từ khay: (x, y) đã trừ độ lệch ngón. */
  dragMove(x: number, y: number): void;
  dragEnd(x: number, y: number): void;
  dragCancel(): void;
  /** Chuột di (không bấm) — xem trước theo con trỏ. */
  hover?(x: number, y: number): void;
  /** Một ngón xoay xong: quãng đường lớn nhất tính từ chỗ đặt ngón (px) — để đo "định chạm mà thành xoay". */
  orbitEnd?(distance: number, type: string): void;
}

type State = 'idle' | 'pending' | 'orbit' | 'pan' | 'pinch' | 'dragGhost' | 'dragTray';
interface Pt { x: number; y: number; sx: number; sy: number; type: string; far?: number }

export const TAP_SLOP = 8;        // px: di quá ngưỡng thì thành xoay camera
export const TRAY_SLOP = 12;      // px: kéo thẻ ra khỏi khay
/** Vùng tiếp xúc lớn hơn ngưỡng (px, cạnh dài) = lòng bàn tay / cạnh bàn tay tì lên màn hình → bỏ qua cả chuỗi. */
export const PALM_SIZE = 40;
export const DOUBLE_MS = 320, DOUBLE_SLOP = 24;
/** Vặn hai ngón phải quá ngưỡng này (rad ≈ 10°) mới bắt đầu xoay — chụm/dời bình thường hay lệch góc vài độ. */
export const TWIST_START = 0.17;

const wrap = (a: number) => (a > Math.PI ? a - 2 * Math.PI : a < -Math.PI ? a + 2 * Math.PI : a);

export class GestureMachine {
  state: State = 'idle';
  private pts = new Map<number, Pt>();
  /** Pointer bị coi là lòng bàn tay: bỏ qua tới khi nhấc. */
  private palms = new Set<number>();
  private lastPinch: { d: number; cx: number; cy: number; a: number } | null = null;
  private twistAcc = 0;
  private twisting = false;
  private lastTap: { t: number; x: number; y: number } | null = null;
  /** Độ lệch ngón khi kéo trên cảm ứng (A/B ở GĐ1). */
  fingerOffset = 40;

  constructor(private cb: GestureCallbacks, private now: () => number = () => performance.now()) {}

  private offset(p: Pt) { return p.type === 'touch' ? this.fingerOffset : 0; }

  /**
   * `button` (chuột): 0 trái = như cảm ứng (bấm lắp/xem trước, kéo bóng mờ, kéo chỗ trống xoay);
   * 2 phải = luôn xoay camera, kể cả khi bắt đầu trên mảnh/bóng mờ, không bao giờ thành bấm; 1 giữa = dời khung.
   * `size` (cảm ứng): cạnh dài vùng tiếp xúc (PointerEvent width/height) — lớn = lòng bàn tay, bỏ qua.
   */
  down(id: number, x: number, y: number, type = 'touch', button = 0, size = 0) {
    if (type === 'touch' && size > PALM_SIZE) { this.palms.add(id); return; }
    this.pts.set(id, { x, y, sx: x, sy: y, type });
    if (type === 'mouse' && (button === 1 || button === 2)) { this.state = button === 2 ? 'orbit' : 'pan'; return; }
    if (this.pts.size >= 2) {
      if (this.state === 'dragGhost' || this.state === 'dragTray') this.cb.dragCancel();
      this.state = 'pinch';
      this.lastPinch = this.pinchInfo();
      this.twistAcc = 0; this.twisting = false;
      return;
    }
    if (this.state === 'dragTray' || this.state === 'dragGhost') return; // khay/tay nắm đã bắt đầu kéo, ngón này là chính nó
    this.state = this.cb.hitsGhost(x, y) ? 'dragGhost' : 'pending';
  }

  /** Khay gọi khi thẻ mảnh bị kéo ra khỏi khay. */
  beginTrayDrag(id: number, x: number, y: number, type = 'touch') {
    this.pts.set(id, { x, y, sx: x, sy: y, type });
    this.state = 'dragTray';
    const p = this.pts.get(id)!;
    this.cb.dragMove(x, y - this.offset(p));
  }

  /** Tay nắm ✥ cạnh bóng mờ: kéo ngay, không cần trúng hình chiếu bóng mờ. Chưa di thì chưa dời bóng. */
  beginGhostDrag(id: number, x: number, y: number, type = 'touch') {
    if (this.pts.size) return;
    this.pts.set(id, { x, y, sx: x, sy: y, type });
    this.state = 'dragGhost';
  }

  move(id: number, x: number, y: number) {
    if (this.palms.has(id)) return;
    const p = this.pts.get(id);
    if (!p) { if (this.state === 'idle') this.cb.hover?.(x, y); return; }
    const px = p.x, py = p.y;
    p.x = x; p.y = y; p.far = Math.max(p.far ?? 0, Math.hypot(x - p.sx, y - p.sy));
    switch (this.state) {
      case 'pending':
        if (Math.hypot(x - p.sx, y - p.sy) > TAP_SLOP) { this.state = 'orbit'; this.cb.orbit(x - p.sx, y - p.sy); }
        else if (p.type === 'mouse') this.cb.hover?.(x, y);
        break;
      case 'orbit': this.cb.orbit(x - px, y - py); break;
      case 'pan': this.cb.pinch(1, x - px, y - py); break;
      case 'dragGhost': case 'dragTray': this.cb.dragMove(x, y - this.offset(p)); break;
      case 'pinch': {
        const info = this.pinchInfo();
        if (info && this.lastPinch && this.lastPinch.d > 0) {
          this.cb.pinch(info.d / this.lastPinch.d, info.cx - this.lastPinch.cx, info.cy - this.lastPinch.cy);
          if (this.cb.twist) {
            const da = wrap(info.a - this.lastPinch.a);
            if (this.twisting) this.cb.twist(da);
            else if (Math.abs(this.twistAcc += da) > TWIST_START) { this.twisting = true; this.cb.twist(this.twistAcc); }
          }
        }
        this.lastPinch = info;
        break;
      }
    }
  }

  up(id: number, x: number, y: number) {
    if (this.palms.delete(id)) return;
    const p = this.pts.get(id);
    if (!p) return;
    this.pts.delete(id);
    switch (this.state) {
      case 'pending': {
        this.state = 'idle';
        const t = this.now(), last = this.lastTap;
        const double = !!last && t - last.t <= DOUBLE_MS && Math.hypot(x - last.x, y - last.y) <= DOUBLE_SLOP;
        this.lastTap = double ? null : { t, x, y };   // chạm thứ ba bắt đầu cặp mới
        this.cb.tap(x, y, p.type === 'mouse', double);
        break;
      }
      // xoay/chụm/kéo xen giữa hai lần chạm thì không tính là chạm đúp
      case 'orbit': case 'pan': if (this.state === 'orbit') this.cb.orbitEnd?.(p.far ?? 0, p.type); this.state = 'idle'; this.lastTap = null; break;
      case 'dragGhost': case 'dragTray': this.state = 'idle'; this.lastTap = null; this.cb.dragEnd(x, y - this.offset(p)); break;
      case 'pinch': this.lastTap = null; if (this.pts.size === 0) { this.state = 'idle'; this.lastPinch = null; } else this.lastPinch = this.pinchInfo(); break;
    }
  }

  /** pointercancel, mất focus, tab ẩn → huỷ mọi thao tác dở. */
  cancel() {
    if (this.state === 'dragGhost' || this.state === 'dragTray') this.cb.dragCancel();
    this.pts.clear(); this.palms.clear(); this.state = 'idle'; this.lastPinch = null; this.lastTap = null;
  }

  private pinchInfo() {
    const [a, b] = [...this.pts.values()];
    if (!a || !b) return null;
    return { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, a: Math.atan2(b.y - a.y, b.x - a.x) };
  }
}

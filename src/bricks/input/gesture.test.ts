import { describe, expect, it, vi } from 'vitest';
import { GestureMachine, type GestureCallbacks } from './gesture';

function setup(ghostAt?: [number, number], opts: { twist?: boolean } = {}) {
  const clock = { t: 1000 };
  const cb = {
    hitsGhost: vi.fn((x: number, y: number) => !!ghostAt && Math.hypot(x - ghostAt[0], y - ghostAt[1]) < 30),
    orbit: vi.fn(), pinch: vi.fn(), tap: vi.fn(), dragMove: vi.fn(), dragEnd: vi.fn(), dragCancel: vi.fn(), hover: vi.fn(),
    ...(opts.twist === false ? {} : { twist: vi.fn() }),
  } satisfies GestureCallbacks;
  return { g: new GestureMachine(cb, () => clock.t), cb: cb as typeof cb & { twist: ReturnType<typeof vi.fn> }, clock };
}

describe('máy trạng thái chạm', () => {
  it('chạm nhẹ = tap, không xoay', () => {
    const { g, cb } = setup();
    g.down(1, 100, 100); g.move(1, 103, 102); g.up(1, 103, 102);
    expect(cb.tap).toHaveBeenCalledWith(103, 102, false, false);
    expect(cb.orbit).not.toHaveBeenCalled();
  });
  it('giữ lâu không di vẫn là tap (không có hành động nhấn giữ)', () => {
    const { g, cb } = setup();
    g.down(1, 100, 100); g.up(1, 100, 100);
    expect(cb.tap).toHaveBeenCalledTimes(1);
  });
  it('kéo quá ngưỡng = xoay camera, nhấc tay không tap', () => {
    const { g, cb } = setup();
    g.down(1, 100, 100); g.move(1, 120, 100); g.move(1, 130, 105); g.up(1, 130, 105);
    expect(cb.orbit).toHaveBeenCalledTimes(2);
    expect(cb.orbit).toHaveBeenLastCalledWith(10, 5);
    expect(cb.tap).not.toHaveBeenCalled();
  });
  it('kéo trên bóng mờ = dời bóng (lệch ngón 40px trên cảm ứng), nhấc = lắp', () => {
    const { g, cb } = setup([200, 200]);
    g.down(1, 200, 200); g.move(1, 220, 210); g.up(1, 220, 210);
    expect(cb.orbit).not.toHaveBeenCalled();
    expect(cb.dragMove).toHaveBeenCalledWith(220, 170);
    expect(cb.dragEnd).toHaveBeenCalledWith(220, 170);
  });
  it('chuột không lệch ngón; di chuột rảnh tay = hover', () => {
    const { g, cb } = setup([200, 200]);
    g.move(9, 50, 60);
    expect(cb.hover).toHaveBeenCalledWith(50, 60);
    g.down(1, 200, 200, 'mouse'); g.move(1, 210, 200); g.up(1, 210, 200);
    expect(cb.dragEnd).toHaveBeenCalledWith(210, 200);
  });
  it('chuột phải: bấm = xoay mảnh đang cầm; kéo = xoay camera (kể cả trên bóng mờ); không bao giờ lắp; chuột giữa = dời khung', () => {
    const { g, cb } = setup([200, 200]);
    const rightTap = vi.fn(); (cb as GestureCallbacks).rightTap = rightTap;
    g.down(1, 200, 200, 'mouse', 2); g.move(1, 203, 201); g.move(1, 240, 220); g.up(1, 240, 220);
    expect(cb.orbit.mock.calls).toEqual([[40, 20]]);   // quá ngưỡng 8 px mới xoay camera, tính từ chỗ bấm
    expect(rightTap).not.toHaveBeenCalled();
    expect(cb.tap).not.toHaveBeenCalled(); expect(cb.dragMove).not.toHaveBeenCalled(); expect(cb.dragEnd).not.toHaveBeenCalled();
    g.down(2, 200, 200, 'mouse', 2); g.move(2, 203, 202); g.up(2, 203, 202);   // bấm phải (rung tay < 8 px) trên bóng mờ: xoay mảnh, không lắp
    expect(rightTap).toHaveBeenCalledWith(203, 202);
    expect(cb.tap).not.toHaveBeenCalled(); expect(cb.dragEnd).not.toHaveBeenCalled();
    g.down(3, 50, 50, 'mouse', 1); g.move(3, 60, 45); g.up(3, 60, 45);
    expect(cb.pinch).toHaveBeenCalledWith(1, 10, -5);
    expect(g.state).toBe('idle');
    g.move(9, 70, 70); expect(cb.hover).toHaveBeenCalledWith(70, 70);   // nhả nút: lại xem trước theo con trỏ
  });
  it('lòng bàn tay (vùng chạm lớn) bị bỏ qua cả chuỗi; ngón thật cùng lúc vẫn chạm/xoay bình thường', () => {
    const { g, cb } = setup();
    g.down(5, 300, 300, 'touch', 0, 70);            // bàn tay tì xuống
    g.move(5, 340, 330); g.up(5, 340, 330);
    expect(cb.orbit).not.toHaveBeenCalled(); expect(cb.tap).not.toHaveBeenCalled();
    g.down(5, 300, 300, 'touch', 0, 70);            // tì lại, giữ nguyên
    g.down(1, 100, 100, 'touch', 0, 12);            // ngón thật: không thành chụm
    g.move(1, 130, 100);
    expect(g.state).toBe('orbit'); expect(cb.pinch).not.toHaveBeenCalled();
    g.up(1, 130, 100); g.up(5, 300, 300);
    expect(g.state).toBe('idle');
  });
  it('chạm đúp: cùng chỗ trong 320 ms; chậm, xa, hoặc có xoay xen giữa thì không', () => {
    const { g, cb, clock } = setup();
    const tap = (x: number, y: number, dt: number) => { clock.t += dt; g.down(1, x, y); g.up(1, x, y); };
    tap(100, 100, 0); tap(110, 104, 200);
    expect(cb.tap.mock.calls.map(c => c[3])).toEqual([false, true]);
    tap(110, 104, 100);                              // chạm thứ ba bắt đầu cặp mới
    expect(cb.tap.mock.calls[2][3]).toBe(false);
    tap(110, 104, 400);                              // quá chậm
    expect(cb.tap.mock.calls[3][3]).toBe(false);
    tap(200, 200, 100);                              // quá xa
    expect(cb.tap.mock.calls[4][3]).toBe(false);
    clock.t += 50; g.down(1, 200, 200); g.move(1, 240, 200); g.up(1, 240, 200);   // xoay xen giữa
    tap(200, 200, 50);
    expect(cb.tap.mock.calls[5][3]).toBe(false);
  });
  it('vặn hai ngón: dưới 10° chỉ chụm; vượt ngưỡng thì xoay theo góc vặn; không có callback (chế độ bé) thì không xoay', () => {
    const { g, cb } = setup();
    const at = (deg: number) => [100 + 200 * Math.cos(deg * Math.PI / 180), 200 + 200 * Math.sin(deg * Math.PI / 180)] as const;  // ngón 2 quay quanh ngón 1
    g.down(1, 100, 200); g.down(2, ...at(0));
    g.move(2, ...at(5));                              // chụm/dời hơi lệch góc: chưa xoay
    expect(cb.twist).not.toHaveBeenCalled();
    g.move(2, ...at(15));                             // vượt ngưỡng: xoay nguyên phần đã tích luỹ
    g.move(2, ...at(25));
    const total = cb.twist.mock.calls.reduce((a, c) => a + c[0], 0);
    expect(cb.twist).toHaveBeenCalledTimes(2);
    expect(total).toBeGreaterThan(0.1);               // theo chiều kim đồng hồ trên màn hình = dương
    expect(cb.pinch).toHaveBeenCalled();
    g.up(2, ...at(25)); g.up(1, 100, 200);
    const kid = setup(undefined, { twist: false });
    kid.g.down(1, 100, 200); kid.g.down(2, ...at(0)); kid.g.move(2, ...at(40));
    expect(kid.cb.pinch).toHaveBeenCalled(); expect(kid.g.state).toBe('pinch');
  });
  it('tay nắm ✥: kéo dời bóng mờ dù bắt đầu ngoài hình chiếu bóng; nhấc = lắp; không chạm đúp, không xoay', () => {
    const { g, cb } = setup([200, 200]);
    g.beginGhostDrag(1, 400, 300, 'touch');
    g.down(1, 400, 300, 'touch');                     // sự kiện down của chính ngón đó tới sau: bỏ qua
    expect(cb.dragMove).not.toHaveBeenCalled();       // chưa di thì chưa dời bóng
    g.move(1, 380, 290); g.up(1, 380, 290);
    expect(cb.dragMove).toHaveBeenCalledWith(380, 250);
    expect(cb.dragEnd).toHaveBeenCalledWith(380, 250);
    expect(cb.orbit).not.toHaveBeenCalled(); expect(cb.tap).not.toHaveBeenCalled();
  });
  it('ngón thứ hai = chụm: huỷ kéo dở, không tap, ở yên chụm tới khi nhấc hết', () => {
    const { g, cb } = setup([200, 200]);
    g.down(1, 200, 200); g.move(1, 215, 200);
    g.down(2, 300, 200);
    expect(cb.dragCancel).toHaveBeenCalled();
    g.move(2, 330, 200);
    expect(cb.pinch).toHaveBeenCalled();
    expect(cb.pinch.mock.calls[0][0]).toBeGreaterThan(1);
    g.up(2, 330, 200);
    g.move(1, 260, 260); // còn một ngón: không được thành xoay
    expect(cb.orbit).not.toHaveBeenCalled();
    g.up(1, 260, 260);
    expect(cb.tap).not.toHaveBeenCalled();
    expect(g.state).toBe('idle');
  });
  it('kéo từ khay: thả = lắp, huỷ khi pointercancel', () => {
    const { g, cb } = setup();
    g.beginTrayDrag(1, 500, 700);
    g.move(1, 400, 400); g.up(1, 400, 400);
    expect(cb.dragEnd).toHaveBeenCalledWith(400, 360);
    g.beginTrayDrag(2, 500, 700); g.cancel();
    expect(cb.dragCancel).toHaveBeenCalledTimes(1);
    expect(g.state).toBe('idle');
  });
});

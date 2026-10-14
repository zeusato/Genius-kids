import { describe, expect, it, vi } from 'vitest';
import { GestureMachine, type GestureCallbacks } from './gesture';

function setup(ghostAt?: [number, number]) {
  const cb = {
    hitsGhost: vi.fn((x: number, y: number) => !!ghostAt && Math.hypot(x - ghostAt[0], y - ghostAt[1]) < 30),
    orbit: vi.fn(), pinch: vi.fn(), tap: vi.fn(), dragMove: vi.fn(), dragEnd: vi.fn(), dragCancel: vi.fn(), hover: vi.fn(),
  } satisfies GestureCallbacks;
  return { g: new GestureMachine(cb), cb };
}

describe('máy trạng thái chạm', () => {
  it('chạm nhẹ = tap, không xoay', () => {
    const { g, cb } = setup();
    g.down(1, 100, 100); g.move(1, 103, 102); g.up(1, 103, 102);
    expect(cb.tap).toHaveBeenCalledWith(103, 102, false);
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

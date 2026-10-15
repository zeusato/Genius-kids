// Tiện ích cho test engine (chỉ test import; không dùng trong app).
import { overlap, type World } from './world';

/** Các cặp mảnh có hộp va chạm chồng lấn. Gom lại rồi `expect` một lần: gọi `expect` cho từng cặp hộp làm test chậm hàng trăm lần. */
export function overlaps(world: World): string[] {
  const list = [...world.pieces.values()], bad: string[] = [];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    if (!overlap(list[i].bbox, list[j].bbox)) continue;
    if (list[i].boxes.some(a => list[j].boxes.some(b => overlap(a, b)))) bad.push(`${list[i].id}×${list[j].id}`);
  }
  return bad;
}

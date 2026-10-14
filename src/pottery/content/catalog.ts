import type { ArtworkDoc } from '../model';
import { referenceShape } from '../engine/profile';
export const LESSONS = [
  { id: 'first-cup', name: 'Chiếc cốc đầu tiên', text: 'Kéo đỉnh lên, kéo thân ra hoặc vào, rồi mở miệng cốc.', skills: ['height', 'shape', 'open'] },
  { id: 'vase-neck', name: 'Cổ bình và bụng bình', text: 'Chạm giữ để thắt cổ. Kéo phần bụng ra cho rộng, rồi dùng bọt biển làm mịn.', skills: ['pinch', 'shape', 'smooth'] },
  { id: 'color-ring', name: 'Vòng màu quanh bát', text: 'Mở miệng, sang Trang trí, chọn Vòng màu rồi chạm vào thân bát.', skills: ['open', 'band'] },
];
export const FACTS = ['Đất ẩm mềm nên có thể nắn thành nhiều hình.', 'Bàn xoay giúp tạo những món đồ tròn đều quanh một trục.', 'Bình có thành và đáy đủ dày sẽ giữ được hình dáng.', 'Đồ gốm cần khô trước khi đưa vào lò.', 'Lớp men thay đổi khi nung và tạo bề mặt mới cho gốm.', 'Đồ gốm cần nguội trước khi lấy ra khỏi lò. Trong xưởng này, thời gian được tua nhanh.'];
export interface Challenge { id: string; name: string; text: string; shape?: string; color?: string; decoration?: 'band' | 'stamp' | 'brush'; glaze?: ArtworkDoc['glaze'] }
export const CHALLENGES: Challenge[] = [
  { id: 'c1', name: 'Cốc của Gấu', text: 'Một chiếc cốc thẳng, cao vừa phải.', shape: 'cup' },
  { id: 'c2', name: 'Bát ăn cơm', text: 'Một chiếc bát thấp, miệng rộng.', shape: 'bowl' },
  { id: 'c3', name: 'Bình đón nắng', text: 'Bình cao, phần cổ hẹp hơn bụng.', shape: 'vase' },
  { id: 'c4', name: 'Bụng tròn xinh', text: 'Nặn một chiếc bình bụng tròn.', shape: 'round' },
  { id: 'c5', name: 'Sắc ngọc', text: 'Phủ men xanh ngọc cho tác phẩm.', color: '#66a895' },
  { id: 'c6', name: 'Một vòng nắng', text: 'Vẽ một vòng màu quanh thân.', decoration: 'band' },
  { id: 'c7', name: 'Dấu ấn của em', text: 'Đặt một con dấu lên tác phẩm.', decoration: 'stamp' },
  { id: 'c8', name: 'Nét cọ nhỏ', text: 'Tự tay vẽ lên tác phẩm.', decoration: 'brush' },
  { id: 'c9', name: 'Cốc lam', text: 'Cốc thẳng phủ màu lam.', shape: 'cup', color: '#304d78' },
  { id: 'c10', name: 'Bát hoa', text: 'Bát miệng rộng có con dấu trang trí.', shape: 'bowl', decoration: 'stamp' },
  { id: 'c11', name: 'Bình men lì', text: 'Bình cổ cao với lớp men lì.', shape: 'vase', glaze: 'matte' },
  { id: 'c12', name: 'Chậu có vòng', text: 'Chậu cây có dải vòng quanh thân.', shape: 'planter', decoration: 'band' },
];
export function evaluate(art: ArtworkDoc, challenge: Challenge) {
  const hints: string[] = [];
  if (art.shape.depth <= 0) hints.push('Mở lòng tác phẩm trước nhé.');
  if (challenge.shape) {
    const target = referenceShape(challenge.shape), error = target.radii.reduce((sum, r, i) => sum + Math.abs(r - art.shape.radii[i]), 0) / 64;
    if (Math.abs(target.height - art.shape.height) > .48) hints.push(target.height > art.shape.height ? 'Kéo tác phẩm cao thêm một chút.' : 'Ấn tác phẩm thấp xuống một chút.');
    if (error > .23) hints.push('Nắn thân gần với đường mẫu hơn một chút.');
  }
  if (challenge.color && (art.decoration.color !== challenge.color || art.decoration.coverage < .8)) hints.push('Chọn màu men trong yêu cầu và phủ gần hết thân.');
  if (challenge.glaze && art.glaze !== challenge.glaze) hints.push('Chọn loại men trong yêu cầu.');
  if (challenge.decoration && !art.decoration.strokes.some(s => s.kind === challenge.decoration && s.points.length > 0)) hints.push('Thêm nét trang trí trong yêu cầu.');
  return { pass: hints.length === 0, hints };
}

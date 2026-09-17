import { useState } from 'react';
import { PROFESSIONS, PROJECTS, professionRank, PIPE_SHAPES, type Profession } from '../core/activities';
import { homeLevel } from '../core/progression';
import type { FarmState, FarmCommand } from '../core/types';
import { Goods } from './shared';
import type { Confirmation } from './Panels';
export function Activities({ s, act, confirm }: {
    s: FarmState;
    act: (c: FarmCommand) => Promise<boolean>;
    confirm: (c: Confirmation) => void;
}) {
    const [pipes, setPipes] = useState([1, 1, 0, 3, 1, 1, 2, 1, 1]), [notice, setNotice] = useState('');
    return <>
 <details className="farm-card"><summary>Chuyên môn nghề · ba nhánh</summary><p>Học thêm nghề vẫn giữ thành quả cũ. Mỗi bậc rút 5% thời gian mẻ mới trong nhánh, tối đa 15%; không sửa mẻ đã đặt.</p>
 {(Object.keys(PROFESSIONS) as Profession[]).map(id => { const rank = professionRank(s, id), p = PROFESSIONS[id]; return <section className="farm-recipe" key={id}><h3>{p.name} · {rank}/3</h3>{rank < 3 ? <><small>Cần Nhà chính {[10, 18, 25][rank]}; tự làm rồi nộp:</small><Goods items={p.items[rank]} state={s}/><button disabled={homeLevel(s) < [10, 18, 25][rank]} onClick={() => confirm({ title: `Học ${p.name} bậc ${rank + 1}`, body: 'Nộp số hàng đã ghi; nhận lợi ích nghề vĩnh viễn và phiếu 10 phút.', command: { type: 'specialize', profession: id } })}>Học bậc tiếp theo</button></> : <p>Đã thành thạo · mẻ mới nhanh 15%.</p>}</section>; })}</details>
 <details className="farm-card"><summary>Dự án khu vườn · ba chặng</summary><p>Đóng góp theo chặng, nhận trang trí miễn phí trong Kho hàng và phiếu 30 phút. Trang trí có thể đặt, cất và di chuyển.</p>{PROJECTS.map((p, i) => <section key={p.name}><h3>{i + 1}. {p.name}</h3><Goods items={p.need} state={s}/><button disabled={s.claimed.includes(`project:${i}`) || homeLevel(s) < p.home || i > 0 && !s.claimed.includes(`project:${i - 1}`)} onClick={() => confirm({ title: p.name, body: 'Nộp vật liệu và nhận trang trí cùng phiếu 30 phút. Mỗi chặng nhận một lần.', command: { type: 'project', stage: i } })}>{s.claimed.includes(`project:${i}`) ? 'Đã hoàn tất' : `Đóng góp · Nhà chính ${p.home}`}</button></section>)}</details>
 <details className="farm-card"><summary>Ghép ống tưới · trò xoay ô</summary><p>Nguồn ở trái ô trên cùng. Chạm để xoay, nối qua chín ô rồi ra bên phải ô cuối. Nhận một phiếu 5 phút mỗi kỳ chợ; mở từ Nhà chính 3.</p><div className="farm-pipes">{pipes.map((r, i) => <button key={i} aria-label={`Ống ${i + 1}, xoay ${r * 90} độ`} onClick={() => { setPipes(p => p.map((v, j) => j === i ? (v + 1) % 4 : v)); setNotice(''); }}><svg viewBox="0 0 60 60" aria-hidden="true"><path transform={`rotate(${r * 90} 30 30)`} d={PIPE_SHAPES[i] === 'straight' ? 'M0 30H60' : 'M60 30H30V60'} fill="none" stroke="#72a9a3" strokeWidth="9"/><circle cx="30" cy="30" r="6" fill="#e9dcbb"/></svg>{i === 0 && <small>VÀO →</small>}{i === 8 && <small>RA →</small>}</button>)}</div><button disabled={homeLevel(s) < 3} onClick={async () => setNotice(await act({ type: 'irrigation', rotations: pipes, epoch: s.market.epoch }) ? 'Đã nối thành công. Phần thưởng mỗi kỳ chỉ nhận một lần.' : 'Đường ống chưa thông. Kiểm tra hướng và các chỗ nối.')}>Mở nước</button><p role="status">{notice}</p></details>
 </>;
}

import type { FarmState } from '../core/types';
import { CHAPTER_TITLES, chapterReady } from '../core/progression';
import { Dialog } from './shared';
import { Icon } from './Icon';
const illustration = new URL('../assets/ui/welcome-v1.webp', import.meta.url).href;

export function Welcome({ state, onClose, onStart }: { state: FarmState; onClose: () => void; onStart: () => void }) {
    const chapter = Array.from({ length: 25 }, (_, i) => i + 1).find(n => !state.claimed.includes(`chapter:${n}`));
    const first = chapter === 1;
    return <Dialog title={first ? 'Chào bạn đến Làng Mầm!' : 'Mừng bạn về với khu vườn!'} onClose={onClose} className="farm-welcome">
        <div className="farm-welcome-hero"><img className="farm-welcome-art" src={illustration} alt="Gia đình chào đón bạn bên căn nhà và những luống rau"/>
        <p className="farm-welcome-intro">Một mảnh đất nhỏ, những mùa vui lớn.<br/><br/>Cùng chăm khu vườn theo nhịp của bạn.</p></div>
        <ul className="farm-welcome-controls">
            <li><Icon name="eye"/><span><b>Chạm để khám phá</b>Chọn cây, đá hoặc công trình để thao tác.</span></li>
            <li><Icon name="move"/><span><b>Kéo để ngắm vườn</b>Kéo đất trống; cuộn hoặc chụm hai ngón để zoom.</span></li>
            <li><Icon name="sprout"/><span><b>Gieo và gặt theo luống</b>Chọn dụng cụ rồi kéo qua nhiều luống.</span></li>
        </ul>
        <div className="farm-welcome-mission"><Icon name="book"/><div><small>{first ? 'NHIỆM VỤ ĐẦU TIÊN' : chapter ? `CHƯƠNG ${chapter}` : 'HÀNH TRÌNH CỦA BẠN'}</small><b>{chapter ? CHAPTER_TITLES[chapter - 1] : 'Trang trại của những mùa vui'}</b><p>{first ? chapterReady(state, 1) ? 'Bạn đã hoàn thành! Mở Nhiệm vụ để nhận thưởng.' : `Thu hoạch 3 luống đầu tiên (${Math.min(3, state.stats.harvest)}/3) để nhận 120 xu và phiếu tăng tốc.` : chapter ? 'Mở nhiệm vụ và chạm mục tiêu để đến đúng công trình.' : 'Bạn đã hoàn thành 25 chương. Tiếp tục khám phá và trang trí nhé.'}</p></div></div>
        <button className="farm-primary" onClick={onStart}>{first && !chapterReady(state, 1) ? 'Bắt đầu thu hoạch' : 'Xem nhiệm vụ'}<Icon name="next" size={17}/></button>
        <button className="farm-link" onClick={onClose}>Tự khám phá khu vườn</button>
    </Dialog>;
}

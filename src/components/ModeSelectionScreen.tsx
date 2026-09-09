import React from 'react';
import { Compass, Sparkles } from 'lucide-react';
import type { StudentProfile } from '../../types';
import { HubShell, HubIntro } from './hub/HubShell';
import { HubCard } from './hub/HubCard';
import { modesFor, type ModeId } from './hub/catalog';

export type SelectableMode = ModeId | 'profile' | 'shop';
interface ModeSelectionScreenProps {
    student: StudentProfile;
    onSelectMode: (mode: SelectableMode) => void;
    onLogout: () => void;
}
export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({ student, onSelectMode, onLogout }) => (
    <HubShell student={student} section="Sảnh khám phá" onProfile={() => onSelectMode('profile')} onShop={() => onSelectMode('shop')} onLogout={onLogout}>
        <main className="hub-main">
            <HubIntro eyebrow="MỖI NGÀY MỘT ĐIỀU KỲ DIỆU" title="Hôm nay mình khám phá gì?" description={'Chào ' + student.name + '! Chọn một thế giới và bắt đầu nhé.'}>
                <span className="hub-intro-note"><Sparkles size={25}/><span>Một chút tò mò.<br/>Thật nhiều khám phá.</span></span>
            </HubIntro>
            <div className="hub-grid" aria-label="Các chế độ khám phá">
                {modesFor(student.grade).map((entry, i) => <HubCard key={entry.id} entry={entry} variant="mode" onSelect={onSelectMode} eager={i < 3}/>)}
            </div>
            <footer className="hub-footer"><span><Compass size={14}/>Điều thú vị bắt đầu từ một câu hỏi.</span><span>HỌC VUI · CHƠI KHÉO · LỚN KHÔN</span></footer>
        </main>
    </HubShell>
);

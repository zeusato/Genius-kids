import React from 'react';
import { Compass, Orbit } from 'lucide-react';
import type { StudentProfile } from '../../types';
import { HubShell, HubIntro } from './hub/HubShell';
import { HubCard } from './hub/HubCard';
import { scienceFor, type ScienceId } from './hub/catalog';

interface Props {
    student?: StudentProfile | null;
    onSelect: (id: ScienceId) => void;
    onBack: () => void;
    onProfile: () => void;
    onShop: () => void;
    onLogout: () => void;
}

export function ScienceMenuScreen({ student, onSelect, ...navigation }: Props) {
    const items = scienceFor(student?.grade);
    return <HubShell student={student} section="Khoa học" backLabel="Về khám phá" {...navigation}>
        <main className="hub-main hub-science">
            <HubIntro eyebrow="KHOA HỌC · BẮT ĐẦU TỪ TÒ MÒ" title="Hôm nay em muốn tìm hiểu gì?" description="Từ những tế bào tí hon đến các vì sao. Chọn một chủ đề và tự mình khám phá nhé.">
                <span className="hub-intro-note"><Orbit size={28}/><span>Nhìn gần hơn.<br/>Hiểu thêm một điều.</span></span>
            </HubIntro>
            <div className="hub-grid" aria-label="Các chủ đề khoa học">
                {items.map((entry, i) => <HubCard key={entry.id} entry={entry} variant="mode" onSelect={onSelect} eager={i < 3}/>)}
            </div>
            <footer className="hub-footer"><span><Compass size={14}/>Mỗi câu hỏi mở ra một điều mới.</span><span>{items.length} CHỦ ĐỀ ĐỂ KHÁM PHÁ</span></footer>
        </main>
    </HubShell>;
}

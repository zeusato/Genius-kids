import React from 'react';
import { Palette } from 'lucide-react';
import type { StudentProfile } from '../../types';
import { HubShell, HubIntro } from './hub/HubShell';
import { HubCard } from './hub/HubCard';
import { CRAFT_CATALOG, type CraftId } from './hub/catalog';
import './hub/crafts.css';

interface Props {
    student?: StudentProfile | null;
    onSelect: (id: CraftId) => void;
    onBack: () => void;
    onProfile: () => void;
    onShop: () => void;
    onLogout: () => void;
}

export function CraftMenuScreen({ student, onSelect, ...navigation }: Props) {
    return <HubShell student={student} section="Góc Thủ Công" {...navigation}>
        <main className="hub-main crafts-main">
            <HubIntro eyebrow="ĐÔI TAY NHỎ · TRÍ TƯỞNG TƯỢNG LỚN" title="Góc Thủ Công" description="Một hộp màu, một chút đất mềm. Hôm nay em muốn làm gì?">
                <img className="crafts-welcome-art" src={`${import.meta.env.BASE_URL}crafts/cover.webp`} srcSet={`${import.meta.env.BASE_URL}crafts/cover-sm.webp 400w, ${import.meta.env.BASE_URL}crafts/cover.webp 1200w`} sizes="(max-width:600px) calc(100vw - 32px), 340px" width={1200} height={800} alt="" decoding="async"/>
            </HubIntro>
            <div className="hub-grid crafts-grid" aria-label="Các xưởng thủ công">
                {CRAFT_CATALOG.map(entry => <HubCard key={entry.id} entry={entry} onSelect={onSelect} eager/>)}
            </div>
            <footer className="hub-footer"><span><Palette size={16}/>Mỗi tác phẩm đều mang một chút của em.</span><span>TỰ TAY LÀM · THỎA SỨC SÁNG TẠO</span></footer>
        </main>
    </HubShell>;
}

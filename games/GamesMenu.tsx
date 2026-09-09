import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import type { Grade } from '../types';
import { useStudent, useStudentActions } from '../src/contexts/StudentContext';
import { isPreschool } from '../src/utils/grade';
import { HubShell, HubIntro, HubDialog } from '../src/components/hub/HubShell';
import { HubCard } from '../src/components/hub/HubCard';
import { gamesFor, GEAR_CATALOG, resolveEntry, gameTitle, type GameId, type Level } from '../src/components/hub/catalog';
import { GameLauncher, type LegacyComplete } from './GameLauncher';

interface GamesMenuProps { grade?: Grade; onBack: () => void; onGameComplete: LegacyComplete }
const flags = { memory: import.meta.env.VITE_MEMORY_V2 === 'false', sound: import.meta.env.VITE_SOUND_V2 === 'false', dragon: import.meta.env.VITE_DRAGON_V2 === 'false' };

export const GamesMenu: React.FC<GamesMenuProps> = ({ grade, onBack, onGameComplete }) => {
    const { currentStudent } = useStudent();
    const { setStudent } = useStudentActions();
    const navigate = useNavigate();
    const location = useLocation();
    const [params, setParams] = useSearchParams();
    const entry = resolveEntry(params, grade, flags);
    const [level, setLevel] = useState<Level>('easy');
    const positions = useRef<Record<string, { y: number; id: GameId }>>({});
    const gearList = entry?.id.startsWith('gears-');
    const listKey = gearList ? 'gears' : 'menu';
    const showList = !entry || entry.id === 'gears-menu' || entry.needsSetup;

    useEffect(() => {
        if (!showList) return;
        // Run after the app's route scroll effect; returning restores the selected card.
        const frame = requestAnimationFrame(() => {
            const saved = positions.current[listKey];
            if (!saved) return;
            window.scrollTo({ top: saved.y, behavior: 'instant' });
            if (!entry?.needsSetup) document.querySelector<HTMLButtonElement>('[data-hub-card="' + saved.id + '"]')?.focus({ preventScroll: true });
        });
        return () => cancelAnimationFrame(frame);
    }, [location.key, showList, listKey, entry?.needsSetup]);

    const openGame = (id: GameId) => {
        positions.current[listKey] = { y: window.scrollY, id };
        setLevel('easy');
        setParams({ play: id }, { state: { hubParent: location.search, hubOwner: currentStudent?.id } });
    };
    const leave = () => {
        const parent = entry?.id.startsWith('gears-') && entry.id !== 'gears-menu' ? '?play=gears-menu' : '';
        if (location.state?.hubParent === parent && location.state?.hubOwner === currentStudent?.id) navigate(-1);
        else navigate({ search: parent }, { replace: true });
    };
    const classic = () => {
        const next = new URLSearchParams(params);
        next.set('edition', 'classic'); next.delete('level'); setLevel('easy');
        setParams(next, { replace: true, state: location.state });
    };
    const start = () => {
        const next = new URLSearchParams(params); next.set('level', level);
        setParams(next, { replace: true, state: location.state });
    };
    if (!showList && entry) return <GameLauncher key={currentStudent?.id} entry={entry} onBack={leave} onLegacy={classic} onComplete={onGameComplete}/>;

    const cards = gearList ? GEAR_CATALOG : gamesFor(grade);
    return <HubShell student={currentStudent} section={gearList ? 'Xưởng máy sáng tạo' : 'Bộ sưu tập trò chơi'} onBack={gearList ? leave : onBack} backLabel={gearList ? 'Về danh sách trò chơi' : 'Về khám phá'} onProfile={() => navigate('/profile')} onShop={() => navigate('/shop')} onLogout={() => { setStudent(null); navigate('/'); }}>
        <main className="hub-main">
            <HubIntro eyebrow={gearList ? 'KỸ SƯ MÁY MÓC' : 'CHƠI VUI · HỌC ĐIỀU MỚI'} title={gearList ? 'Cỗ máy đang chờ bàn tay em.' : 'Hôm nay em muốn chơi gì?'} description={gearList ? 'Lắp ráp hoặc thử tài đoán chuyển động. Chọn cách khám phá của em nhé.' : 'Mỗi trò chơi là một thế giới. Chọn cuộc khám phá của riêng em.'}>
                <span className="hub-intro-note"><Sparkles size={25}/><span>Thử một chút.<br/>Giỏi thêm từng ngày.</span></span>
            </HubIntro>
            <div className={'hub-grid ' + (cards.length <= 2 ? 'hub-grid-few' : '')} aria-label={gearList ? 'Các hoạt động máy móc' : 'Danh sách trò chơi'}>
                {cards.map((card, i) => <HubCard key={card.id} entry={card} onSelect={openGame} eager={i < 3}/>)}
            </div>
            <footer className="hub-footer"><span><Compass size={14}/>Cứ tò mò, cứ thử. Em sẽ tìm ra!</span><span>{cards.length} THẾ GIỚI ĐỂ KHÁM PHÁ</span></footer>
        </main>
        {entry?.needsSetup && <HubDialog title={gameTitle(entry.id)} onClose={leave}>
            <p>Chọn mức thử thách phù hợp. Khi sẵn sàng, mình bắt đầu nhé!</p>
            <div className="hub-levels" role="radiogroup" aria-label="Độ khó">
                {(['easy', 'medium', 'hard'] as const).filter(value => !(isPreschool(grade) && value === 'hard')).map(value => <label key={value}><input type="radio" name="hub-level" value={value} checked={level === value} onChange={() => setLevel(value)}/>{value === 'easy' ? 'Dễ' : value === 'medium' ? 'Trung bình' : 'Khó'}</label>)}
            </div>
            <button className="hub-primary" onClick={start}>Bắt đầu chơi<ArrowRight size={18}/></button>
        </HubDialog>}
    </HubShell>;
};

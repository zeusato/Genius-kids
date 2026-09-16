// DEV-only visual fixture. Student choices stay in memory; profile storage is not mounted.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { MusicProvider } from '../../contexts/MusicContext';
import { ModeSelectionScreen } from '../ModeSelectionScreen';
import { ScienceMenuScreen } from '../ScienceMenuScreen';
import { HubShell, HubIntro } from './HubShell';
import { HubCard } from './HubCard';
import { gamesFor, boardGamesFor, SCIENCE_CATALOG } from './catalog';
import type { StudentProfile, Grade } from '../../../types';
import '../../index.css';

const base: StudentProfile = { id:'hub-dev-preview', name:'Minh Anh', age:8, grade:3, avatarId:0, currentAvatarId:'avatar_01', currentThemeId:'theme_classic', stars:128, ownedAvatarIds:[], ownedThemeIds:[], ownedImageIds:[], history:[], gameHistory:[], shopDailyPhotos:[] };
function Preview() {
    const initialScreen = new URLSearchParams(window.location.search).get('screen');
    const [student, setStudent] = useState(base), [screen, setScreen] = useState(initialScreen && ['science', 'games', 'board-games'].includes(initialScreen) ? initialScreen : 'mode'), [last, setLast] = useState('');
    return <>
        <details style={{ font:'12px system-ui', padding:'7px 16px', background:'#193e43', color:'#f2f3df' }}>
            <summary>DEV · Kiểm tra đồ họa · hồ sơ trong bộ nhớ</summary>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', padding:12 }}>
                <label>Lớp <select aria-label="Lớp kiểm thử" value={student.grade} onChange={e => setStudent(s => ({ ...s, grade:Number(e.target.value) as Grade }))}><option value={0}>Mầm non</option><option value={3}>Lớp 3</option></select></label>
                <label>Theme <select aria-label="Theme kiểm thử" value={student.currentThemeId} onChange={e => setStudent(s => ({ ...s, currentThemeId:e.target.value }))}>{['classic','ocean','forest','sunset','galaxy'].map(t => <option key={t} value={'theme_' + t}>{t}</option>)}</select></label>
                <label>Tên <input aria-label="Tên kiểm thử" value={student.name} onChange={e => setStudent(s => ({ ...s, name:e.target.value }))}/></label>
                <label>Màn <select aria-label="Màn kiểm thử" value={screen} onChange={e => setScreen(e.target.value)}><option value="mode">Khám phá</option><option value="games">Trò chơi</option><option value="science">Khoa học</option><option value="board-games">Board games</option></select></label><output>{last}</output>
            </div>
        </details>
        {screen === 'mode' ? <ModeSelectionScreen student={student} onLogout={() => setLast('Đổi học sinh')} onSelectMode={mode => { setLast(mode); if (mode === 'game') setScreen('games'); if (mode === 'science') setScreen('science'); }}/>
        : screen === 'science' ? <ScienceMenuScreen student={student} onSelect={id => setLast(SCIENCE_CATALOG.find(item => item.id === id)!.route)} onBack={() => setScreen('mode')} onProfile={() => setLast('profile')} onShop={() => setLast('shop')} onLogout={() => setLast('logout')}/>
        : <HubShell student={student} section={screen === 'board-games' ? 'Board games' : 'Bộ sưu tập trò chơi'} onBack={() => setScreen(screen === 'board-games' ? 'games' : 'mode')} onProfile={() => setLast('profile')} onShop={() => setLast('shop')} onLogout={() => setLast('logout')}><main className="hub-main"><HubIntro eyebrow="CHƠI VUI · HỌC ĐIỀU MỚI" title={screen === 'board-games' ? 'Cùng ngồi vào bàn nhé!' : 'Hôm nay em muốn chơi gì?'} description="Mỗi trò chơi là một thế giới. Chọn cuộc khám phá của riêng em."/><div className={'hub-grid ' + (student.grade === 0 ? 'hub-grid-few' : '')}>{(screen === 'board-games' ? boardGamesFor(student.grade) : gamesFor(student.grade)).map(entry => <HubCard key={entry.id} entry={entry} onSelect={id => { setLast(id); if (id === 'board-games') setScreen(id); }}/>)}</div></main></HubShell>}
    </>;
}
if (import.meta.env.DEV) {
    const root = import.meta.hot?.data.root || createRoot(document.getElementById('root')!);
    if (import.meta.hot) import.meta.hot.data.root = root;
    root.render(<MemoryRouter><MusicProvider><Preview/></MusicProvider></MemoryRouter>);
}

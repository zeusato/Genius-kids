import React from 'react';
import { ArrowLeft, Check, Leaf, LockKeyhole, Volume2 } from 'lucide-react';
import { SpeakButton } from '../../shared/SpeakButton';
import { GAME_COPY, LETTER_IDS, sceneUrl } from './content';
import { LEVELS, type AlphabetActivity, type AlphabetLevel } from './types';

export function ActivityIntro({ activity, level, fixed, progress, onLevel, onFixed, onStart }: {
    activity: AlphabetActivity; level: AlphabetLevel; fixed: string; progress: number; onLevel: (level: AlphabetLevel) => void; onFixed: (id: string) => void; onStart: () => void;
}) {
    const copy = GAME_COPY[activity];
    return <section className={'ap-intro ap-theme-' + activity} aria-labelledby="ap-intro-title">
        <div className="ap-intro-art" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}preschool/alphabet-games/fox-guide.webp`} alt=""/><IntroActionDemo activity={activity}/><i/><i/><i/></div>
        <div className="ap-intro-copy"><span className="ap-eyebrow"><Leaf size={13}/>{copy.eyebrow}</span><h2 id="ap-intro-title">{copy.title}</h2><p>{copy.intro}</p>
            <SpeakButton text={copy.intro} title="Nghe Cáo hướng dẫn" size={21}/>
            <fieldset className="ap-levels"><legend>Chọn mức chơi</legend>{LEVELS.map(item => <button key={item.id} type="button" aria-pressed={level === item.id} onClick={() => onLevel(item.id)}><b>{item.title}</b><span>{item.caption}</span>{level === item.id && <Check size={15}/>}</button>)}</fieldset>
            <label className="ap-letter-select"><span>Luyện cả bảng hoặc chọn riêng một chữ</span><select value={fixed} onChange={event => onFixed(event.target.value)}><option value="">Chuyến ngẫu nhiên A–Z</option>{LETTER_IDS.map(id => <option value={id} key={id}>Chữ {id.toUpperCase()} – {id}</option>)}</select></label>
            <button className="ap-primary ap-start" onClick={onStart}>Chơi nào <span aria-hidden="true">→</span></button>
            <p className="ap-skill-progress"><LockKeyhole size={14}/>{progress}/26 chữ đã tự làm được ở hoạt động này</p>
        </div>
    </section>;
}

function IntroActionDemo({ activity }: { activity: AlphabetActivity }) {
    if (activity === 'match') return <div className="ap-intro-demo ap-intro-demo-match"><span>A</span><b>→</b><em>a</em></div>;
    if (activity === 'word') return <div className="ap-intro-demo ap-intro-demo-word"><img src={`${import.meta.env.BASE_URL}preschool/alphabet-games/objects/apple.webp`} alt=""/><b>↓</b><em/></div>;
    return <div className="ap-intro-demo ap-intro-demo-pick"><span>🔊</span><b>→</b><em>A</em></div>;
}

export function GameStage({ activity, seed, round, total, children, status }: { activity: AlphabetActivity; seed: number; round: number; total: number; children: React.ReactNode; status: string }) {
    const copy = GAME_COPY[activity];
    return <section className={'ap-stage ap-theme-' + activity} style={{ '--ap-scene': `url("${sceneUrl(activity, seed)}")` } as React.CSSProperties} aria-label={copy.title}>
        <header className="ap-stage-head"><div><span className="ap-eyebrow">{copy.eyebrow}</span><h2>{copy.title}</h2></div><div className="ap-round-progress" aria-label={`Câu ${round} trên ${total}`}><span>{round}/{total}</span><div><i style={{ width: `${round / total * 100}%` }}/></div></div></header>
        <div className="ap-status" aria-live="polite">{status}</div>{children}
    </section>;
}

export function GameComplete({ earned, saved, onReplay, onBack }: { earned: number; saved: boolean; onReplay: () => void; onBack: () => void }) {
    return <section className="ap-complete" role="status"><div className="ap-finale" aria-hidden="true">🎉</div><span className="ap-eyebrow">HOÀN THÀNH CHUYẾN ĐI</span><h2>Giỏi quá, bé đã làm xong!</h2><div className="ap-stars" aria-label={`${earned} sao`}>{[0,1,2].map(i => <span key={i} className={i < earned ? 'earned' : ''}>★</span>)}</div><p>{saved ? `Đã lưu tiến bộ và nhận ${earned} sao.` : 'Chưa lưu được tiến bộ. Hãy về menu rồi thử lại nhé.'}</p><div><button className="ap-primary" onClick={onReplay}>Chơi chuyến mới</button><button className="ap-secondary" onClick={onBack}><ArrowLeft size={17}/>Về Bảng Chữ Cái</button></div></section>;
}

export function AudioPrompt({ text, onHear }: { text: string; onHear?: () => void }) {
    return <button className="ap-hear" onClick={onHear} aria-label="Nghe lại tên chữ"><Volume2 size={23}/><span>{text}</span></button>;
}

import React, { useEffect, useState } from 'react';
import { ArrowRight, Gift, Home, RotateCcw, Star } from 'lucide-react';
import type { GateId, Riddle } from '../content/types';
import { GATE_MAP } from '../content/gates';
import { roundSeals, type RoundState } from '../engine/round';
import type { RiddleOutcome } from '../progress/progress';
import { GateArch } from './GateArch';
import { Seals } from './ClueReveal';
import { Sphinx } from './Sphinx';
import { chime, useVoice } from './voice';

export function Summary({ round, outcome, riddles, stones, onNext, onAgain, onHome, onGift, autoRead }: {
    round: RoundState; outcome: RiddleOutcome | null; riddles: Map<string, Riddle>; stones: (g: GateId) => number;
    onNext: () => void; onAgain: (() => void) | null; onHome: () => void; onGift: (() => void) | null; autoRead: boolean;
}) {
    const solved = round.items.filter(x => x.done && !x.revealed).length;
    const gateId = (round.gate ?? riddles.get(round.items[0].id)?.gate) as GateId;
    const gate = GATE_MAP.get(gateId)!;
    const fresh = outcome?.firstTime.filter(id => riddles.get(id)?.gate === gateId).length ?? 0;
    const opened = outcome?.gatesOpened.includes(gateId) ?? false;
    const [stars, setStars] = useState(0);
    const voice = useVoice();
    const earned = outcome?.earned ?? 0;
    useEffect(() => {
        chime(opened ? 'gate' : 'stone');
        if (!earned) return;
        let n = 0;
        const t = window.setInterval(() => { n++; setStars(n); if (n >= earned) clearInterval(t); }, 140);
        return () => clearInterval(t);
    }, [earned, opened]);
    const line = opened ? `Cổng ${gate.title.replace(/^Cổng /, '')} đã mở! Em giỏi quá!` : solved === round.items.length ? 'Trọn vẹn cả chặng! Tuyệt vời!' : solved ? `Em giải được ${solved} câu. Giỏi lắm!` : 'Mỗi câu đố là một bài học. Ta cùng đi tiếp nhé!';
    useEffect(() => { if (autoRead) voice.say([{ text: line }]); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <div className="rd-summary" style={{ ['--gate' as string]: gate.accent, ['--stone' as string]: gate.stone }}>
            <div className="rd-summary-card">
                <div className="rd-summary-art">
                    <GateArch stone={gate.stone} accent={gate.accent} lit={stones(gateId)} fresh={fresh} open={opened || stones(gateId) >= 10} glyph={gate.glyph} size={190} />
                    <Sphinx mood={solved ? 'cheer' : 'comfort'} size={170} talking={voice.speaking} />
                </div>
                <h1>{line}</h1>
                <div className="rd-summary-stats">
                    <div><span>Câu đã giải</span><strong>{solved}/{round.items.length}</strong></div>
                    <div><span>Dấu ấn</span><strong><Seals n={Math.min(3, roundSeals(round))} total={3} animate={false} /> {roundSeals(round)}</strong></div>
                    <div className="is-stars"><span>Sao nhận được</span><strong><Star size={22} fill="currentColor" /> +{stars}</strong></div>
                </div>
                {outcome && outcome.dailyBonus > 0 && <p className="rd-summary-note">Có cả {outcome.dailyBonus} sao thưởng của Câu đố hôm nay!</p>}
                {outcome && outcome.firstTime.length > 0 && (
                    <div className="rd-summary-new"><span>Trang mới trong Sổ Đố</span>
                        <ul>{outcome.firstTime.map(id => { const r = riddles.get(id)!; return <li key={id}><b aria-hidden="true">{r.emoji ?? GATE_MAP.get(r.gate)!.glyph}</b>{r.answer}</li>; })}</ul>
                    </div>
                )}
                {!outcome && <p className="rd-summary-note">Chưa lưu được kết quả trên máy này. Em vẫn có thể chơi tiếp.</p>}
                <div className="rd-summary-actions">
                    {onGift && <button className="rd-btn rd-btn-gift" onClick={onGift}><Gift size={20} />Mở quà của cổng</button>}
                    <button className="rd-btn rd-btn-primary" onClick={onNext}>Đi tiếp<ArrowRight size={20} /></button>
                    {onAgain && <button className="rd-btn rd-btn-soft" onClick={onAgain}><RotateCcw size={18} />Chơi thêm cổng này</button>}
                    <button className="rd-btn rd-btn-soft" onClick={onHome}><Home size={18} />Về ốc đảo</button>
                </div>
            </div>
        </div>
    );
}

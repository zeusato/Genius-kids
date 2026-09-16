import React, { useEffect, useMemo, useState } from 'react';
import { HelpCircle, Volume2 } from 'lucide-react';
import { speak } from '../../../utils/speech';
import { soundManager } from '../../../../utils/sound';
import { buildListenRounds } from './sequence';
import type { AlphabetLevel, AlphabetOutcome } from './types';
import { GameStage } from './AlphabetActivityFrame';
import { useToyDrag } from './useToyDrag';

const passengerFiles = [
    'avatar_02_kitten_1763891424934.png', 'avatar_01_puppy_1763891407938.png',
    'avatar_03_panda_1763891438752.png', 'avatar_05_bear_1763891465009.png',
    'avatar_04_bunny_1763891452217.png', 'avatar_07_lion_1763891528246.png',
];
export function LetterTrainGame({ seed, level, fixed, onFinish }: { seed: number; level: AlphabetLevel; fixed: string; onFinish: (outcomes: AlphabetOutcome[]) => void }) {
    const rounds = useMemo(() => buildListenRounds(seed, level, fixed || undefined), [seed, level, fixed]);
    const [index, setIndex] = useState(0), [selected, setSelected] = useState<string | null>(null), [mistakes, setMistakes] = useState(0), [helped, setHelped] = useState(false), [feedback, setFeedback] = useState(''), [heard, setHeard] = useState(false), [outcomes, setOutcomes] = useState<AlphabetOutcome[]>([]);
    const round = rounds[index], solved = outcomes.length > index;
    const hear = () => { const ok = speak(round.letterId.toUpperCase(), { lang: 'en-US', rate: .72, pitch: 1.02, onError: () => setFeedback('Cáo chưa đọc được. Bé chạm nút nghe lại nhé.') }); setHeard(ok); if (!ok) setFeedback('Cáo chưa đọc được. Bé chạm nút nghe lại nhé.'); };
    useEffect(() => { const timer = window.setTimeout(hear, 350); return () => window.clearTimeout(timer); }, [index]);
    const validate = (letter = selected) => {
        if (!letter || solved || !heard) { if (!heard) setFeedback('Bé nghe tên chữ trước nhé.'); return; }
        if (letter !== round.letterId) { setMistakes(v => v + 1); setFeedback('Vé này chưa đúng. Nghe lại rồi thử nhé!'); soundManager.playWrong(); return; }
        const next = [...outcomes, { roundId: round.id, letterId: round.letterId, correct: true, firstTry: mistakes === 0, assisted: helped }]; setOutcomes(next); setSelected(null); setFeedback('Đúng rồi! Một bạn nhỏ đã lên tàu.'); soundManager.playCorrect();
    };
    const drag = useToyDrag(validate);
    useEffect(() => { if (!solved) return; const timer = window.setTimeout(() => { if (index + 1 === rounds.length) onFinish(outcomes); else { setIndex(v => v + 1); setSelected(null); setMistakes(0); setHelped(false); setFeedback(''); setHeard(false); } }, 850); return () => window.clearTimeout(timer); }, [solved]);
    return <GameStage activity="pick" seed={seed} round={index + 1} total={rounds.length} status={feedback || 'Nghe Cáo đọc, chọn một chiếc vé rồi đưa vào khe soát vé.'}>
        <div className="ap-train-scene"><div className="ap-train" aria-label={`${outcomes.length} hành khách trên tàu`}><span className="ap-engine"><i/><b/><small/></span>{passengerFiles.map((file, i) => <span className={'ap-carriage ' + (i < outcomes.length ? 'filled' : '')} key={file}>{i < outcomes.length ? <img src={`${import.meta.env.BASE_URL}avatars/${file}`} alt=""/> : <i/>}</span>)}</div>
            <button className="ap-hear" onClick={hear}><Volume2 size={23}/><span>Nghe lại tên chữ</span></button>
            <div className="ap-tickets">{round.options.map(letter => <button key={letter} className={'ap-ticket ' + (selected === letter ? 'selected ' : '') + (helped && letter === round.letterId ? 'helped' : '')} aria-pressed={selected === letter} onClick={() => setSelected(selected === letter ? null : letter)} {...drag.bind(letter)}><span>{round.letterCase === 'upper' ? letter.toUpperCase() : letter}</span><small>Vé chữ</small></button>)}</div>
            <button className={'ap-ticket-slot ' + (selected ? 'ready' : '')} data-alphabet-drop="ticket" onClick={() => validate()}><span/><b>SOÁT VÉ</b><small>{selected ? 'Chạm để đưa vé vào' : 'Chọn một chiếc vé'}</small></button>
            {mistakes >= 2 && !helped && <button className="ap-help" onClick={() => { setHelped(true); setFeedback('Cáo đã đánh dấu nhẹ chiếc vé cần tìm.'); }}><HelpCircle size={17}/>Cáo giúp bé</button>}
        </div>
    </GameStage>;
}

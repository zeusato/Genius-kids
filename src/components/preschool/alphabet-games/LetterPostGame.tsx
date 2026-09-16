import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { speakSequence } from '../../../utils/speech';
import { soundManager } from '../../../../utils/sound';
import { buildMatchBoards, mulberry32, shuffle } from './sequence';
import type { AlphabetLevel, AlphabetOutcome } from './types';
import { GameStage } from './AlphabetActivityFrame';
import { useToyDrag } from './useToyDrag';

export function LetterPostGame({ seed, level, fixed, onFinish }: { seed: number; level: AlphabetLevel; fixed: string; onFinish: (outcomes: AlphabetOutcome[]) => void }) {
    const boards = useMemo(() => buildMatchBoards(seed, level, fixed || undefined), [seed, level, fixed]);
    const [index, setIndex] = useState(0), [selected, setSelected] = useState<string | null>(null), [matched, setMatched] = useState<string[]>([]), [feedback, setFeedback] = useState('');
    const mistakes = useRef<Record<string, number>>({}), outcomes = useRef<AlphabetOutcome[]>([]), board = boards[index], complete = matched.length === board.letterIds.length;
    const letters = useMemo(() => shuffle(board.letterIds, mulberry32(seed + index * 97)), [board, seed, index]);
    useEffect(() => {
        const timer = window.setTimeout(() => speakSequence([{ text: 'Chọn lá thư chữ hoa, rồi chạm ngôi nhà có chữ thường giống nó.', lang: 'vi-VN' }]), 260);
        return () => window.clearTimeout(timer);
    }, [board.id]);
    const deliver = (house: string, letter = selected) => {
        if (!letter || matched.includes(letter) || complete) return;
        if (letter !== house) { mistakes.current[letter] = (mistakes.current[letter] || 0) + 1; setFeedback('Ngôi nhà này chưa đúng. Lá thư vẫn ở khay nhé!'); soundManager.playWrong(); return; }
        setMatched(value => [...value, letter]); setSelected(null); setFeedback(`Đúng rồi! ${letter.toUpperCase()} đã về nhà ${letter}.`); soundManager.playCorrect(); speakSequence([{ text: letter.toUpperCase(), lang: 'en-US' }, { text: letter, lang: 'en-US' }]);
        outcomes.current.push({ roundId: `${board.id}-${letter}`, letterId: letter, correct: true, firstTry: !mistakes.current[letter], assisted: false });
    };
    const drag = useToyDrag((id, target) => deliver(target.dataset.letter || '', id));
    useEffect(() => { if (!complete) return; const timer = window.setTimeout(() => { if (index + 1 === boards.length) onFinish(outcomes.current); else { setIndex(v => v + 1); setSelected(null); setMatched([]); setFeedback(''); mistakes.current = {}; } }, 900); return () => window.clearTimeout(timer); }, [complete]);
    return <GameStage activity="match" seed={seed} round={index + 1} total={boards.length} status={feedback || 'Chọn thư chữ hoa, rồi chạm ngôi nhà chữ thường tương ứng.'}>
        <div className="ap-post-scene">
            <div className="ap-houses">{letters.map((letter, n) => <button key={letter} className={'ap-house ' + (matched.includes(letter) ? 'received' : '')} data-alphabet-drop="house" data-letter={letter} onClick={() => deliver(letter)}><span className="ap-roof"/><span className="ap-door">{letter}</span><i>{matched.includes(letter) ? <Check size={18}/> : n + 1}</i><small>{matched.includes(letter) ? 'Đã nhận thư' : 'Nhà chữ ' + letter}</small></button>)}</div>
            <div className="ap-mail-tray" aria-label="Khay thư">{board.letterIds.map(letter => <button key={letter} disabled={matched.includes(letter)} aria-pressed={selected === letter} className={'ap-envelope ' + (selected === letter ? 'selected' : '')} onClick={() => setSelected(selected === letter ? null : letter)} {...drag.bind(letter)}><span>{letter.toUpperCase()}</span><i/><small>{matched.includes(letter) ? 'Đã gửi' : 'Thư ' + letter.toUpperCase()}</small></button>)}</div>
        </div>
        <p className="ap-counter">Đã giao {matched.length}/{board.letterIds.length} lá thư</p>
    </GameStage>;
}

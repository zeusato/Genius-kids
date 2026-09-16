import React, { useEffect, useMemo, useState } from 'react';
import { Check, Volume2 } from 'lucide-react';
import { speakSequence } from '../../../utils/speech';
import { soundManager } from '../../../../utils/sound';
import { buildWordRounds } from './sequence';
import type { AlphabetLevel, AlphabetOutcome, AlphabetWord } from './types';
import { GameStage } from './AlphabetActivityFrame';
import { useToyDrag } from './useToyDrag';

export function WordBasketGame({ seed, level, fixed, onFinish }: { seed: number; level: AlphabetLevel; fixed: string; onFinish: (outcomes: AlphabetOutcome[]) => void }) {
    const rounds = useMemo(() => buildWordRounds(seed, level, fixed || undefined), [seed, level, fixed]);
    const [index, setIndex] = useState(0), [selected, setSelected] = useState<string | null>(null), [basket, setBasket] = useState<string[]>([]), [mistakes, setMistakes] = useState(0), [feedback, setFeedback] = useState('');
    const [outcomes, setOutcomes] = useState<AlphabetOutcome[]>([]), round = rounds[index], solved = round.correctIds.every(id => basket.includes(id));
    const prompt = round.mode === 'odd' ? `Tìm vật KHÔNG bắt đầu bằng chữ ${round.letterId.toUpperCase()}` : round.mode === 'many' ? `Tìm ${round.correctIds.length} vật bắt đầu bằng chữ ${round.letterId.toUpperCase()}` : `Tìm vật bắt đầu bằng chữ ${round.letterId.toUpperCase()}`;
    useEffect(() => {
        const timer = window.setTimeout(() => speakSequence([{ text: round.letterId.toUpperCase(), lang: 'en-US' }, { text: prompt, lang: 'vi-VN' }]), 260);
        return () => window.clearTimeout(timer);
    }, [round.id]);
    const put = (id: string) => {
        if (solved || basket.includes(id)) return;
        if (!round.correctIds.includes(id)) { setMistakes(v => v + 1); setFeedback('Vật này chưa đúng. Bé thử vật khác nhé!'); soundManager.playWrong(); return; }
        const next = [...basket, id]; setBasket(next); setSelected(null); soundManager.playCorrect();
        const word = round.options.find(item => item.id === id)!; speakSequence([{ text: word.wordEn, lang: 'en-US' }, { text: word.wordVi, lang: 'vi-VN' }]);
        setFeedback(next.length === round.correctIds.length ? 'Đúng rồi! Đồ vật đã vào giỏ.' : `Đúng rồi! Còn ${round.correctIds.length - next.length} vật nữa.`);
    };
    const drag = useToyDrag(put);
    useEffect(() => {
        if (!solved) return;
        const outcome = { roundId: round.id, letterId: round.letterId, correct: true, firstTry: mistakes === 0, assisted: false };
        const next = [...outcomes, outcome]; const timer = window.setTimeout(() => { if (index + 1 === rounds.length) onFinish(next); else { setOutcomes(next); setIndex(v => v + 1); setSelected(null); setBasket([]); setMistakes(0); setFeedback(''); } }, 800); return () => window.clearTimeout(timer);
    }, [solved]);
    return <GameStage activity="word" seed={seed} round={index + 1} total={rounds.length} status={feedback || prompt}>
        <div className="ap-word-prompt"><span>{round.letterId.toUpperCase()}</span><small>{round.letterId}</small><b>{prompt}</b></div>
        <div className={'ap-object-grid count-' + round.options.length}>{round.options.map(word => <WordToy word={word} key={word.id} selected={selected === word.id} collected={basket.includes(word.id)} onSelect={() => setSelected(selected === word.id ? null : word.id)} drag={drag.bind(word.id)}/>)}</div>
        <button className={'ap-basket ' + (selected ? 'ready' : '')} data-alphabet-drop="basket" onClick={() => selected && put(selected)}><span className="ap-basket-back"/><span className="ap-basket-items">{basket.map(id => <img key={id} src={round.options.find(w => w.id === id)?.art} alt=""/>)}</span><span className="ap-basket-front"/><b>{basket.length}/{round.correctIds.length}</b><small>{selected ? 'Chạm để đặt vào giỏ' : 'Giỏ của bé'}</small></button>
    </GameStage>;
}

function WordToy({ word, selected, collected, onSelect, drag }: { word: AlphabetWord; selected: boolean; collected: boolean; onSelect: () => void; drag: any }) {
    return <article className={'ap-object ' + (selected ? 'selected ' : '') + (collected ? 'collected' : '')}>
        <button className="ap-object-pick" onClick={onSelect} disabled={collected} aria-pressed={selected} aria-label={`${word.wordEn}, ${word.wordVi}`} {...drag}><img src={word.art} alt="" draggable={false}/>{collected && <Check size={24}/>}</button>
        <div><span><b>{word.wordEn}</b><small>{word.wordVi}</small></span><button className="ap-object-hear" aria-label={'Nghe tên ' + word.wordEn} onClick={() => speakSequence([{ text: word.wordEn, lang: 'en-US' }, { text: word.wordVi, lang: 'vi-VN' }])}><Volume2 size={17}/></button></div>
    </article>;
}

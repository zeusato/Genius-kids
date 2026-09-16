import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Flower2, Hand, Leaf, RotateCcw, Sparkles, Sticker } from 'lucide-react';
import { ALPHABET_DATA, type AlphabetLetter } from '../../data/alphabetData';
import { useStudent, useStudentActions } from '../../contexts/StudentContext';
import { cancelSpeech, speak, speakSequence } from '../../utils/speech';
import { soundManager } from '../../../utils/sound';
import { SpeakButton } from '../shared/SpeakButton';
import { GardenToy } from './GardenToy';
import { GardenActivityGame } from './GardenActivityGame';
import { LetterTracing } from './LetterTracing';
import type { TraceState } from './letterTracingModel';
import { GARDEN_ACTIVITIES } from './gardenActivities';
import { GARDEN_SCENES } from './alphabetGardenScenes';
import { answerGardenLetter, exploreGardenLetter, finishGardenTracing, gardenComplete, readGardenProgress, type AlphabetGardenProgress } from './alphabetGardenProgress';
import './alphabet-garden.css';

const art = (scene: string) => `${import.meta.env.BASE_URL}preschool/garden/${scene}.webp`;

function LetterRound({ letter, earned, onExplore, onMatch, onWin, onNext }: {
    letter: AlphabetLetter; earned: boolean; onExplore: () => void; onMatch: (answer: string) => void; onWin: (trace: TraceState) => void; onNext: () => void;
}) {
    const [touched, setTouched] = useState<number[]>([]);
    const [bounces, setBounces] = useState(0);
    const [discovered, setDiscovered] = useState(false);
    const [won, setWon] = useState(false);
    const [matched, setMatched] = useState(false);
    const [writing, setWriting] = useState(false);
    const [hint, setHint] = useState('');
    const [attempt, setAttempt] = useState<string | null>(null);
    const [replay, setReplay] = useState(0);
    const alreadyEarned = useRef(earned);
    const exploredRef = useRef(false);
    const wonRef = useRef(false);
    const matchedRef = useRef(false);
    const scene = GARDEN_SCENES[letter.id];
    const instruction = GARDEN_ACTIVITIES[letter.id]?.instruction ?? scene.instruction;
    const speechParts = [
        { text: letter.upper, lang: 'en-US' as const },
        { text: letter.exampleEn, lang: 'en-US' as const },
        { text: letter.exampleVi, lang: 'vi-VN' as const },
        { text: instruction, lang: 'vi-VN' as const },
    ];
    const index = ALPHABET_DATA.findIndex(item => item.id === letter.id);
    const choices = [letter, ALPHABET_DATA[(index + 1) % 26], ALPHABET_DATA[(index + 2) % 26]];
    // Vary the correct position between letters; do not put the answer first every time.
    const offset = (index + 1) % 3;
    const orderedChoices = [...choices.slice(offset), ...choices.slice(0, offset)];
    useEffect(() => () => cancelSpeech(), []);

    const discover = () => {
        if (exploredRef.current) return;
        exploredRef.current = true;
        setDiscovered(true);
        setHint('Tìm chữ thường đi cùng chữ ' + letter.upper + ' nhé!');
        onExplore();
    };
    const narrateObject = () => speakSequence([
        { text: letter.exampleEn, lang: 'en-US' }, { text: letter.exampleVi, lang: 'vi-VN' },
    ]);
    const touchApple = (number: number) => {
        if (touched.includes(number)) return;
        const next = [...touched, number];
        setTouched(next);
        soundManager.playClick();
        narrateObject();
        if (next.length === 3) discover();
    };
    const bounceBall = () => {
        setBounces(count => count + 1);
        soundManager.playNote(420 + Math.min(bounces, 5) * 70, .16);
        if (bounces === 0 || bounces === 2) narrateObject();
        if (bounces >= 2) discover();
    };
    const openBush = (number: number) => {
        if (touched.includes(number)) return;
        setTouched([...touched, number]);
        soundManager.playClick();
        if (number === 1) { narrateObject(); discover(); }
        else {
            const message = 'Một bạn bướm! Thử bụi cây khác nhé.';
            setHint(message);
            speak(message, { lang: 'vi-VN' });
        }
    };
    const choose = (answer: string) => {
        if (matchedRef.current || !discovered) return;
        setAttempt(answer);
        if (answer !== letter.lower) {
            const message = 'Gần đúng rồi. Bé tìm chữ ' + letter.lower + ' giống mẫu nhé!';
            setHint(message);
            speakSequence([{ text: 'Thử lại nhé. Tìm chữ', lang: 'vi-VN' }, { text: letter.upper, lang: 'en-US' }]);
            return;
        }
        matchedRef.current = true;
        cancelSpeech();
        setMatched(true); setWriting(true); setHint('Bé ghép đúng rồi! Cùng tập tô chữ nhé.');
        soundManager.playNote(659.25, .25);
        onMatch(answer);
    };
    const finishTracing = (trace: TraceState) => {
        if (wonRef.current || !matchedRef.current) return;
        wonRef.current = true; setWon(true);
        setHint('Bé đã khám phá, ghép chữ và tập tô xong rồi!');
        onWin(trace);
    };
    const reset = () => {
        cancelSpeech();
        setTouched([]); setBounces(0); setDiscovered(false); setWon(false); setMatched(false); setWriting(false); setHint(''); setAttempt(null);
        exploredRef.current = false; wonRef.current = false; matchedRef.current = false; setReplay(value => value + 1);
        alreadyEarned.current = earned;
    };

    return <>
        {writing && <LetterTracing letter={letter} scene={art(scene.art)} earned={alreadyEarned.current} onComplete={finishTracing} onBack={() => setWriting(false)} onNext={onNext}/>}
        <div className={'ag-adventure ag-scene-' + scene.art} hidden={writing}>
            <div className="ag-letter-card">
                <span className="ag-eyebrow">NGƯỜI BẠN HÔM NAY</span>
                <div className="ag-letter-pair" aria-label={'Chữ ' + letter.upper + ' và chữ thường ' + letter.lower}><span>{letter.upper}</span><span>{letter.lower}</span></div>
                <div className="ag-word"><strong lang="en">{letter.exampleEn}</strong><span>{letter.exampleVi}</span></div>
                <div className="ag-listen"><SpeakButton parts={speechParts} autoPlay={!writing && !matched} autoPlayKey={letter.id + replay + writing} title={'Nghe chữ ' + letter.upper + ' và hướng dẫn'} size={24}/><span>Nghe cùng Cáo</span></div>
                <div className="ag-letter-task">
                    {!discovered ? <><span className="ag-task-icon"><Hand size={24}/></span><p>Chơi và khám phá<br/> cùng bạn Cáo!</p></> : won ? <div className="ag-reward" role="status">
                        <span className="ag-earned-toy">{letter.id === 'a' || letter.id === 'b' || letter.id === 'c' ? <GardenToy kind={letter.id === 'a' ? 'apple' : letter.id === 'b' ? 'ball' : 'cat'}/> : letter.emoji}<i><Check size={13}/></i></span>
                        <strong>{alreadyEarned.current ? 'Bé làm tốt lắm!' : 'Sticker của bé!'}</strong>
                        <button className="ag-primary" onClick={onNext}>Khám phá tiếp <ArrowRight size={17}/></button>
                    </div> : matched ? <div className="ag-reward"><Check size={25}/><strong>Bé ghép đúng rồi!</strong><button className="ag-primary" onClick={() => setWriting(true)}>Tập tô chữ {letter.upper}<ArrowRight size={17}/></button></div> : <div className="ag-match">
                        <span className="ag-eyebrow">TÌM BẠN CHO {letter.upper}</span><p>Chữ thường nào đi cùng <b>{letter.upper}</b>?</p>
                        <div className="ag-answers">{orderedChoices.map(choice => <button key={choice.id} aria-label={'Chữ thường ' + choice.lower} className={attempt === choice.id ? 'ag-try-again' : ''} onClick={() => choose(choice.id)}>{choice.lower}</button>)}</div>
                        {attempt && <small>Nhìn mẫu <b>{letter.lower}</b> ở trên nhé.</small>}
                    </div>}
                </div>
            </div>
            <div className="ag-scene-wrap">
                <div className="ag-scene" role="group" aria-label={'Khu vườn chữ ' + letter.upper}>
                    <img className="ag-background" src={art(scene.art)} width={1376} height={768} alt="" draggable={false}/>
                    <div className="ag-scene-label"><Leaf size={14}/>{scene.title}</div>
                    {letter.id === 'a' && <>{[0, 1, 2].map(number => <button key={number} className={`ag-toy ag-apple ag-apple-${number}${touched.includes(number) ? ' ag-picked' : ''}`} disabled={touched.includes(number)} onClick={() => touchApple(number)} aria-label={'Hái quả táo ' + (number + 1)}><GardenToy kind="apple"/></button>)}<div className="ag-scene-count">{touched.length}/3 quả táo</div></>}
                    {letter.id === 'b' && <><button className="ag-toy ag-ball" onClick={bounceBall} aria-label="Chạm cho bóng nảy"><span key={bounces} className={bounces ? 'ag-bouncing' : ''}><GardenToy kind="ball"/></span></button><div className="ag-scene-count">{Math.min(bounces, 3)}/3 lần chơi bóng</div></>}
                    {letter.id === 'c' && <>{[0, 1, 2].map(number => <button key={number} className={`ag-toy ag-hiding ag-hiding-${number}${touched.includes(number) ? ' ag-opened' : ''}`} onClick={() => openBush(number)} disabled={touched.includes(number)} aria-label={'Tìm sau bụi cây ' + (number + 1)}><span className="ag-hidden-friend">{number === 1 ? <GardenToy kind="cat"/> : '🦋'}</span><span className="ag-bush"><GardenToy kind="bush"/></span></button>)}</>}
                    {GARDEN_ACTIVITIES[letter.id] && <GardenActivityGame key={letter.id + replay} letter={letter.id} onFeedback={setHint} onComplete={() => { narrateObject(); discover(); }}/>}
                    {won && <div className="ag-sparkles" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(n => <Sparkles key={n} style={{ left: `${18 + n * 13}%`, top: `${18 + n % 3 * 19}%`, animationDelay: `${n * .09}s` }}/>)}</div>}
                </div>
                <div className="ag-guide"><div className="ag-guide-icon" aria-hidden="true">{won ? <Flower2 size={22}/> : <Hand size={22}/>}</div><p aria-live="polite">{hint || instruction}</p><SpeakButton text={hint || instruction} parts={discovered && !matched ? [{ text: 'Tìm chữ thường đi cùng chữ', lang: 'vi-VN' }, { text: letter.upper, lang: 'en-US' }] : undefined} title="Nghe gợi ý của Cáo" size={20}/></div>
            </div>
        </div>
        <div className="ag-round-footer"><ol aria-label="Các bước khám phá"><li className="active"><span>{discovered ? <Check size={12}/> : 1}</span>Khám phá</li><li className={discovered ? 'active' : ''}><span>{matched ? <Check size={12}/> : 2}</span>Ghép chữ</li><li className={matched ? 'active' : ''}><span>{won ? <Check size={12}/> : 3}</span>Tập tô</li><li className={won ? 'active' : ''}><span>{won ? <Check size={12}/> : 4}</span>Sticker</li></ol><button className="ag-replay" onClick={reset}><RotateCcw size={15}/>Chơi lại chữ {letter.upper}</button></div>
    </>;
}

function GardenForStudent({ onBack }: { onBack: () => void }) {
    const { currentStudent } = useStudent();
    const { updateStudent } = useStudentActions();
    const [index, setIndex] = useState(0);
    const headerRef = useRef<HTMLElement>(null);
    const progress = readGardenProgress(currentStudent?.alphabetGarden);
    const progressRef = useRef(progress);
    progressRef.current = progress;
    const letter = ALPHABET_DATA[index];
    const save = (next: AlphabetGardenProgress) => {
        progressRef.current = next;
        if (currentStudent) updateStudent({ ...currentStudent, alphabetGarden: next });
    };
    const go = (next: number) => {
        cancelSpeech(); soundManager.playClick(); setIndex(next);
        headerRef.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    };
    return <section className="alphabet-garden" aria-label="Vườn chữ cái">
        <header className="ag-header" ref={headerRef}><div><span className="ag-eyebrow"><Leaf size={13}/> CHƠI CÙNG BẠN CÁO</span><h2>Vườn chữ cái</h2></div><a className="ag-collection-link" href="#garden-stickers"><Sticker size={19}/><span><b>{progress.stickers.length}/26</b> sticker</span></a></header>
        <LetterRound key={letter.id} letter={letter} earned={progress.stickers.includes(letter.id)} onExplore={() => save(exploreGardenLetter(progressRef.current, letter.id))} onMatch={answer => save(answerGardenLetter(progressRef.current, letter.id, answer))} onWin={trace => save(finishGardenTracing(progressRef.current, letter.id, trace))} onNext={() => go((index + 1) % 26)}/>
        <div className="ag-navigation"><button onClick={() => go(index - 1)} disabled={index === 0}><ArrowLeft size={17}/>Chữ trước</button><span><b>{letter.upper}</b> · {index + 1} / 26</span><button onClick={() => go(index + 1)} disabled={index === 25}>Chữ tiếp<ArrowRight size={17}/></button></div>
        <section className="ag-alphabet" aria-label="Chọn chữ cái"><div className="ag-section-heading"><h3>Mỗi chữ, một người bạn</h3><span>{progress.explored.length}/26 chữ đã khám phá</span></div><div className="ag-letter-grid">{ALPHABET_DATA.map((item, n) => <button key={item.id} aria-label={'Khám phá chữ ' + item.upper + (progress.stickers.includes(item.id) ? ', đã có sticker' : '')} aria-pressed={n === index} className={progress.stickers.includes(item.id) ? 'ag-collected' : ''} onClick={() => go(n)}>{item.upper}{progress.stickers.includes(item.id) && <Check size={11}/>}</button>)}</div></section>
        <section className="ag-album" id="garden-stickers" aria-labelledby="garden-stickers-title"><div className="ag-section-heading"><div><span className="ag-eyebrow">NHỮNG KHÁM PHÁ CỦA BÉ</span><h3 id="garden-stickers-title">Khu vườn sticker</h3></div><Flower2 size={25}/></div><p>Khám phá, ghép chữ và tập tô để thêm một người bạn vào vườn.</p><div className="ag-sticker-grid">{ALPHABET_DATA.map((item, n) => <button key={item.id} className={progress.stickers.includes(item.id) ? 'ag-sticker-owned' : ''} aria-label={'Sticker ' + item.upper + ': ' + (progress.stickers.includes(item.id) ? item.exampleVi : 'chưa sưu tầm') + '. Khám phá chữ ' + item.upper} onClick={() => go(n)}><span aria-hidden="true">{progress.stickers.includes(item.id) ? item.emoji : <Flower2 size={22}/>}</span><b>{item.upper}</b></button>)}</div>{gardenComplete(progress) && <div className="ag-complete" role="status"><Sparkles size={22}/><strong>Khu vườn đã đủ 26 người bạn!</strong><button className="ag-primary" onClick={onBack}>Về Bảng Chữ Cái<ArrowRight size={17}/></button></div>}</section>
        <p className="ag-note"><Leaf size={13}/>Cứ thong thả. Bé có thể nghe lại, tập tô và chơi lại bất cứ lúc nào.</p>
    </section>;
}

export function AlphabetGarden({ onBack }: { onBack: () => void }) {
    const { currentStudent } = useStudent();
    return <GardenForStudent key={currentStudent?.id ?? 'guest'} onBack={onBack}/>;
}

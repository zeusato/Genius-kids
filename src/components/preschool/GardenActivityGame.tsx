import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Hand, Music2, Sparkles } from 'lucide-react';
import { soundManager } from '../../../utils/sound';
import { ActivityToy } from './ActivityToy';
import { GardenToy } from './GardenToy';
import { GARDEN_ACTIVITIES, GARDEN_COLORS, advanceActivity, activityFinished, closestTarget, initialActivityState, pointInTarget, type ActivityAction } from './gardenActivities';
import './garden-activities.css';

const KITE_POINTS: [number, number][] = [[38, 38], [65, 21], [81, 48]];
const PLANT_POINTS: [number, number][] = [[44, 75], [64, 78], [84, 75]];
const MUD_POINTS: [number, number][] = [[63, 54], [76, 57], [72, 70]];
const PATH_POINTS: [number, number][] = [[39, 85], [57, 80], [76, 86]];
const CLOUD_POINTS: [number, number][] = [[55, 31], [68, 26], [77, 39]];
const positionsFor = (letter: string, compact: boolean): [number, number][] => compact ? ({
    h: [[48, 50], [68, 46], [82, 65]], i: [[47, 36], [69, 28], [81, 50]],
    q: [[45, 35], [67, 24], [83, 46]], z: [[52, 45], [78, 55], [59, 72]],
}[letter] as [number, number][]) ?? [[43, 45], [65, 45], [82, 65]] : ({
    h: [[55, 59], [66, 58], [77, 60]], i: [[60, 27], [70, 24], [76, 36]],
    q: [[55, 22], [66, 17], [77, 22]], z: [[67, 48], [76, 55], [67, 68]],
}[letter] as [number, number][]) ?? [[55, 55], [67, 55], [79, 55]];

export function GardenActivityGame({ letter, onComplete, onFeedback }: {
    letter: string; onComplete: () => void; onFeedback: (message: string) => void;
}) {
    const activity = GARDEN_ACTIVITIES[letter];
    const [state, setState] = useState(initialActivityState);
    const stateRef = useRef(state);
    const root = useRef<HTMLDivElement>(null);
    const [compact, setCompact] = useState(false);
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 380));
        if (root.current) observer.observe(root.current);
        return () => observer.disconnect();
    }, []);
    const [drag, setDrag] = useState<{ item: number; x: number; y: number } | null>(null);
    const gesture = useRef<{ item: number; x: number; y: number; moved: boolean } | null>(null);
    const suppressClick = useRef(false);
    const [kite, setKite] = useState<[number, number]>([22, 69]);
    const [brush, setBrush] = useState<[number, number] | null>(null);
    const [flying, setFlying] = useState(false);
    const busy = useRef(false);
    const completion = useRef(false);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const callbacks = useRef({ onComplete, onFeedback });
    callbacks.current = { onComplete, onFeedback };
    useEffect(() => () => timers.current.forEach(clearTimeout), []);
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const schedule = (fn: () => void, delay: number) => { timers.current.push(setTimeout(fn, reduced() ? 40 : delay)); };
    const done = activityFinished(activity, state);
    const targets: [number, number][] = activity.kind === 'water' ? PLANT_POINTS : activity.kind === 'decorate' ? positionsFor(letter, compact)
        : [[67, letter === 'm' || letter === 'n' ? 55 : 64]];
    const mudPoints: [number, number][] = compact ? [[51, 49], [78, 51], [66, 74]] : MUD_POINTS;
    const cloudPoints: [number, number][] = compact ? [[38, 32], [62, 46], [85, 31]] : CLOUD_POINTS;
    const kitePoints: [number, number][] = compact ? [[38, 40], [65, 28], [83, 59]] : KITE_POINTS;

    const act = (action: ActivityAction) => {
        const before = stateRef.current;
        const next = advanceActivity(activity, before, action);
        stateRef.current = next;
        setState(next);
        if (next.feedback === 'retry') callbacks.current.onFeedback(activity.kind === 'decorate'
            ? 'Thử ô cùng màu hoặc cùng số với món đồ bé chọn nhé!'
            : 'Thử bước đang sáng nhé. Bé vẫn giữ những bước đã làm được.');
        if (next.done.length > before.done.length) {
            soundManager.playNote([523.25, 659.25, 783.99][(next.done.length - 1) % 3], .25);
            callbacks.current.onFeedback(activity.instruction);
            if (activityFinished(activity, next) && !completion.current) {
                completion.current = true;
                schedule(() => callbacks.current.onComplete(), 700);
            }
        }
    };
    const point = (event: React.PointerEvent): [number, number] => {
        const bounds = root.current!.getBoundingClientRect();
        return [Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)), Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100))];
    };
    const startDrag = (event: React.PointerEvent<HTMLButtonElement>, item: number) => {
        if (event.button !== 0) return;
        const [x, y] = point(event);
        gesture.current = { item, x, y, moved: false };
        suppressClick.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!gesture.current) return;
        const [x, y] = point(event), current = gesture.current;
        if (Math.hypot(x - current.x, y - current.y) > 2) current.moved = true;
        if (current.moved) setDrag({ item: current.item, x, y });
        if (activity.kind === 'kite') {
            setKite([x, y]);
            const next = stateRef.current.done.length;
            if (next < 3 && pointInTarget(x, y, kitePoints[next], 13)) act({ type: 'hit', item: next });
        }
    };
    const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
        const current = gesture.current;
        if (!current) return;
        const [x, y] = point(event);
        suppressClick.current = current.moved;
        if (current.moved) {
            if (activity.kind === 'clouds') {
                if (Math.hypot(x - current.x, y - current.y) > 14) act({ type: 'hit', item: current.item });
            } else if (['feed', 'water', 'decorate'].includes(activity.kind)) {
                const target = closestTarget(x, y, targets, activity.kind === 'feed' ? 23 : 13);
                if (target >= 0) act({ type: 'drop', item: current.item, target });
            }
        }
        gesture.current = null; setDrag(null);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };
    const cancelDrag = () => { gesture.current = null; setDrag(null); suppressClick.current = true; };
    const clickSource = (item: number) => {
        if (suppressClick.current) { suppressClick.current = false; return; }
        act({ type: activity.kind === 'clouds' ? 'hit' : 'select', item });
    };
    const playFetch = () => {
        if (busy.current || done) return;
        busy.current = true; setFlying(true); soundManager.playClick();
        schedule(() => {
            setFlying(false); busy.current = false;
            act({ type: 'hit', item: stateRef.current.done.length });
        }, 1000);
    };
    const cleanAt = (event: React.PointerEvent) => {
        const p = point(event); setBrush(p);
        mudPoints.forEach((target, item) => { if (pointInTarget(p[0], p[1], target, 10)) act({ type: 'hit', item }); });
    };
    const sourcePositions: [number, number][] = [[15, 81], [34, 81], [53, 81]];
    const axisNext = activity.kind === 'shelter' ? [15, 50, 85][state.done.length] : state.done.length % 2 === 0 ? 100 : 0;
    const displayCount = activity.kind === 'yoyo' ? Math.floor(state.done.length / 2) : state.done.length;

    return <div ref={root} className={'ga-game ga-' + activity.kind + (done ? ' ga-finished' : '')} aria-label={'Hoạt động chữ ' + letter.toUpperCase()}>
        <div className="ga-progress" role="status"><span>{done ? <Check size={13}/> : <Sparkles size={13}/>}</span>{displayCount}/3 {activity.goal}</div>

        {['feed', 'decorate', 'water'].includes(activity.kind) && <>
            {targets.map(([x, y], target) => <button key={target} data-drop-index={target} className={'ga-drop ga-drop-' + activity.kind + (state.selected !== null ? ' ga-awaiting' : '') + (activity.kind !== 'feed' && state.done.includes(target) ? ' ga-filled' : '')} style={{ left: `${x}%`, top: `${y}%`, '--toy-color': GARDEN_COLORS[target] } as React.CSSProperties}
                aria-label={(activity.kind === 'feed' ? 'Đưa vào ' + activity.target : activity.kind === 'water' ? 'Tưới ' + activity.target + ' ' + (target + 1) : 'Gắn vào ô ' + (target + 1))}
                disabled={activity.kind !== 'feed' && state.done.includes(target)} onClick={() => act({ type: 'drop', target })}>
                {activity.kind === 'water' ? <ActivityToy kind={letter === 'o' ? 'orange-tree' : 'flower'} variant={target} grown={state.done.includes(target)}/>
                    : activity.kind === 'decorate' ? <span className="ga-slot-number">{state.done.includes(target) ? <Check size={16}/> : target + 1}</span>
                    : <><span className="ga-feed-hand"><Hand size={24}/></span>{state.done.length > 0 && <span key={state.done.length} className="ga-happy">{letter === 'n' && done ? '🐣' : '♥'}</span>}</>}
            </button>)}
            {(activity.kind === 'water' ? [0] : [0, 1, 2]).map(item => {
                const placed = activity.kind !== 'water' && state.done.includes(item);
                const location = drag?.item === item ? [drag.x, drag.y] : placed ? targets[activity.kind === 'decorate' ? item : 0] : sourcePositions[item];
                return <button key={item} className={'ga-token' + (placed ? ' ga-placed' : '') + (state.selected === item ? ' ga-selected' : '') + (drag?.item === item ? ' ga-dragging' : '')} style={{ left: location[0] + '%', top: location[1] + '%', '--toy-color': GARDEN_COLORS[item] } as React.CSSProperties}
                    aria-label={(activity.kind === 'water' ? 'Chọn giọt nước' : 'Chọn ' + activity.goal + ' ' + (item + 1))} aria-pressed={state.selected === item} disabled={placed || done}
                    onPointerDown={e => startDrag(e, item)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={cancelDrag} onClick={() => clickSource(item)}>
                    <ActivityToy kind={activity.item!} variant={item} grown={letter === 'n' && done}/>{!placed && activity.kind === 'decorate' && <small>{item + 1}</small>}
                </button>;
            })}
            {activity.kind === 'water' && state.done.map(item => <svg key={item} className="ga-water-arc" viewBox="0 0 100 100" preserveAspectRatio="none"><path d={`M18 81Q27 24 ${targets[item][0]} ${targets[item][1] - 7}`} fill="none" stroke="#a2dcea" strokeWidth="1.1" strokeLinecap="round" strokeDasharray="1 5"/></svg>)}
            {letter === 'n' && <div className="ga-nest-eggs" aria-hidden="true">{state.done.map(item => <span key={item}><ActivityToy kind="egg" variant={item} grown={done}/></span>)}</div>}
            {!done && <div className="ga-action-hint">{state.selected === null ? 'Kéo đồ vật · hoặc chạm để chọn' : 'Chạm nơi muốn đặt vào'}</div>}
        </>}

        {activity.kind === 'fetch' && <><button className={'ga-fetch-ball' + (flying ? ' ga-in-flight' : '')} onClick={playFetch} disabled={flying || done} aria-label="Ném bóng cho Chó"><GardenToy kind="ball"/></button><div className="ga-action-hint">{done ? 'Chó đã đón đủ 3 lần!' : flying ? 'Chó đón được rồi! Bóng đang lăn về…' : 'Chạm bóng để ném'}</div>{done && <span className="ga-animal-heart">♥</span>}</>}

        {activity.kind === 'kite' && <>{kitePoints.map(([x, y], item) => <button key={item} className={'ga-wind-ring' + (state.done.includes(item) ? ' ga-ring-done' : '') + (state.done.length === item ? ' ga-ring-next' : '')} style={{ left: x + '%', top: y + '%' }} aria-label={'Bay qua vòng ' + (item + 1)} disabled={state.done.includes(item)} onClick={() => { if (state.done.length === item) setKite([x, y]); act({ type: 'hit', item }); }}>{state.done.includes(item) ? <Check size={22}/> : item + 1}</button>)}<button className="ga-kite-toy" style={{ left: kite[0] + '%', top: kite[1] + '%' }} onPointerDown={e => startDrag(e, 0)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={cancelDrag} aria-label="Kéo diều qua các vòng gió"><ActivityToy kind="kite"/></button></>}

        {activity.kind === 'clouds' && <>{cloudPoints.map(([x, y], item) => <button key={item} className={'ga-cloud' + (state.done.includes(item) ? ' ga-cloud-away' : '')} style={{ left: (drag?.item === item ? drag.x : x) + '%', top: (drag?.item === item ? drag.y : y) + '%', '--cloud-direction': item === 0 ? '-150%' : '170%' } as React.CSSProperties} disabled={state.done.includes(item)} aria-label={'Thổi đám mây ' + (item + 1)} onPointerDown={e => startDrag(e, item)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={cancelDrag} onClick={() => clickSource(item)}><ActivityToy kind="cloud"/></button>)}{done && <div className="ga-sunshine"/>}</>}

        {activity.kind === 'wash' && <><div className="ga-wash-area" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); cleanAt(e); }} onPointerMove={e => { if (e.buttons) cleanAt(e); }} onPointerUp={() => setBrush(null)} onPointerCancel={() => setBrush(null)}>{mudPoints.map(([x, y], item) => <button key={item} className={'ga-mud' + (state.done.includes(item) ? ' ga-clean' : '')} style={{ left: x + '%', top: y + '%' }} disabled={state.done.includes(item)} aria-label={'Chà vết bùn ' + (item + 1)} onClick={() => act({ type: 'hit', item })}>{state.done.includes(item) ? '✧' : <span/>}</button>)}</div>{brush && <span className="ga-brush" style={{ left: brush[0] + '%', top: brush[1] + '%' }}><ActivityToy kind="brush"/></span>}{done && <span className="ga-animal-heart">♥</span>}</>}

        {activity.kind === 'path' && <>{PATH_POINTS.map(([x, y], item) => <button key={item} className={'ga-paw' + (state.done.includes(item) ? ' ga-stepped' : '')} style={{ left: x + '%', top: y + '%' }} disabled={state.done.includes(item)} aria-label={'Bước chân ' + (item + 1)} onClick={() => act({ type: 'hit', item })}><ActivityToy kind="paw" variant={item}/><b>{item + 1}</b></button>)}{state.done.length > 0 && <span className="ga-jumping-paw" style={{ left: PATH_POINTS[state.done.length - 1][0] + '%', top: '67%' }}><ActivityToy kind="paw"/></span>}</>}

        {activity.kind === 'melody' && <><div className="ga-melody-score" aria-label="Dãy màu cần chơi">{activity.order!.map((note, index) => <span key={index} className={state.done.length === index ? 'ga-current-note' : ''} style={{ background: GARDEN_COLORS[note] }}>{state.done.length > index ? <Check size={15}/> : note + 1}</span>)}</div><div className={'ga-keys ' + (letter === 'l' ? 'ga-drums' : '')}>{[0, 1, 2].map(note => <button key={note} style={{ '--toy-color': GARDEN_COLORS[note] } as React.CSSProperties} aria-label={(letter === 'l' ? 'Trống ' : 'Phím đàn ') + (note + 1)} onClick={() => { soundManager.playNote([523.25, 659.25, 783.99][note], .5); act({ type: 'hit', item: note }); }}>{letter === 'l' ? <ActivityToy kind="drum" variant={note}/> : <Music2 size={27}/>}<b>{note + 1}</b></button>)}</div>{state.done.length > 0 && <span key={state.done.length} className="ga-flying-note">♪</span>}</>}

        {['squeeze', 'shelter', 'bow', 'slice', 'yoyo'].includes(activity.kind) && <>
            {activity.kind === 'squeeze' && <><span className="ga-orange-press" style={{ transform: `translate(-50%,-50%) scaleY(${1 - state.axis / 180})` }}><ActivityToy kind="orange"/></span><svg className="ga-juice-glass" viewBox="0 0 100 140" aria-hidden="true"><path d="M17 8L83 8L75 125Q50 135 25 125Z" fill="#fff8d7bb" stroke="#fff6c8" strokeWidth="5"/><path d={`M22 ${117 - state.done.length * 27}H78L74 122Q50 130 26 122Z`} fill="#edac4e"/><path d="M65 77L65 0L86 0" fill="none" stroke="#76a49a" strokeWidth="5"/></svg>{state.axis > 15 && <span className="ga-juice-stream"/>}</>}
            {activity.kind === 'shelter' && <><div className="ga-rain"/>{[15, 50, 85].map((x, item) => <span key={x} className={'ga-rain-flower' + (state.done.includes(item) ? ' ga-protected' : '')} style={{ left: (19 + x * .62) + '%' }}><ActivityToy kind="flower" variant={item} grown={state.done.includes(item)}/>{state.done.includes(item) && <Check size={17}/>}</span>)}<span className="ga-moving-umbrella" style={{ left: (19 + state.axis * .62) + '%' }}><ActivityToy kind="umbrella"/></span></>}
            {activity.kind === 'bow' && <><span className="ga-violin-bow" style={{ left: (46 + state.axis * .32) + '%' }}/>{state.done.length > 0 && <span key={state.done.length} className="ga-flying-note">♫</span>}</>}
            {activity.kind === 'slice' && <><span className="ga-slice-guide" style={{ left: (51 + state.axis * .31) + '%' }}>✧</span>{state.done.map((item) => <span key={item} className="ga-melon-slice" style={{ left: (15 + item * 14) + '%' }}><ActivityToy kind="melon"/></span>)}</>}
            {activity.kind === 'yoyo' && <><span className="ga-yoyo-string" style={{ height: (13 + state.axis * .38) + '%' }}/><span className="ga-yoyo-toy" style={{ top: (30 + state.axis * .38) + '%', rotate: state.axis * 7 + 'deg' }}><ActivityToy kind="yoyo"/></span></>}
            <div className={'ga-slider-box' + (activity.kind === 'yoyo' ? ' ga-slider-vertical' : '')}>
                <label htmlFor={'garden-control-' + letter}>{done ? 'Hoàn thành!' : activity.kind === 'shelter' ? ['Sang trái', 'Vào giữa', 'Sang phải'][state.done.length] : activity.kind === 'yoyo' ? axisNext === 100 ? 'Kéo xuống ↓' : 'Kéo lên ↑' : axisNext === 100 ? 'Kéo sang phải →' : '← Kéo sang trái'}</label>
                <div>{activity.kind !== 'yoyo' && <ArrowLeft size={15}/>}<input id={'garden-control-' + letter} type="range" min={0} max={100} step={1} value={state.axis} disabled={done} aria-label={activity.instruction} aria-orientation={activity.kind === 'yoyo' ? 'vertical' : 'horizontal'} onChange={e => act({ type: 'axis', value: Number(e.target.value) })}/>{activity.kind !== 'yoyo' && <ArrowRight size={15}/>}</div>
            </div>
        </>}
    </div>;
}

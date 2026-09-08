import { useCallback, useEffect, useRef, useState } from 'react';
import { Mission, ProgramNode, initialWorld } from '../engine/model';
import { evaluate } from '../engine/runtime';

export function useExecution(mission: Mission, program: ProgramNode[], speed: number) {
    const [run, setRun] = useState<ReturnType<typeof evaluate> | null>(null), [cursor, setCursor] = useState(0), [playing, setPlaying] = useState(false), [preview, setPreview] = useState(0);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null), programAtRun = useRef<ProgramNode[]>([]);
    const stopTimer = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = null; }, []);
    const frames = run ? (() => {
        const out: (typeof run.runs[number]['frames'][number] & { scenario: number })[] = [];
        for (let i = 0; i < run.runs.length; i++) { out.push(...run.runs[i].frames.map(f => ({ ...f, scenario: i }))); if (!run.runs[i].success) break; }
        return out;
    })() : [];
    const finished = !!run && cursor >= frames.length - 1;
    const frame = frames[cursor] || { world: initialWorld(mission.boards[preview]), kind: 'start' as const, message: 'Xếp lệnh để rover bắt đầu chuyến đi.', context: '', nodeId: null, scenario: preview };
    const reset = useCallback(() => { stopTimer(); setPlaying(false); setRun(null); setCursor(0); }, [stopTimer]);
    function start(single = false) {
        stopTimer();
        if (run && !finished) { if (single) setCursor(c => Math.min(c + 1, frames.length - 1)); setPlaying(!single); return; }
        const result = evaluate(mission, program); programAtRun.current = structuredClone(program); setRun(result); setCursor(single ? 1 : 0); setPlaying(!single);
    }
    useEffect(() => {
        if (!playing || !run || finished) { stopTimer(); return; }
        timer.current = setTimeout(() => setCursor(c => c + 1), (frame.kind === 'control' ? 430 : 600) / speed);
        return stopTimer;
    }, [playing, run, finished, cursor, speed, stopTimer]);
    useEffect(() => {
        const hide = () => { if (document.hidden) { stopTimer(); setPlaying(false); } };
        document.addEventListener('visibilitychange', hide); return () => { document.removeEventListener('visibilitychange', hide); stopTimer(); };
    }, [stopTimer]);
    return { run, frame, cursor, total: frames.length, playing: playing && !finished, finished, executedProgram: programAtRun.current,
        play: () => start(false), step: () => { setPlaying(false); start(true); }, pause: () => { stopTimer(); setPlaying(false); },
        back: () => { stopTimer(); setPlaying(false); setCursor(c => Math.max(0,c-1)); }, reset,
        preview: (index: number) => { reset(); setPreview(index); } };
}

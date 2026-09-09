import { useEffect, useRef } from 'react';
import type { Session } from './model';
export function useArcadeSound(s: Session | null, enabled: boolean) {
    const context = useRef<AudioContext | null>(null), nodes = useRef(new Set<OscillatorNode>()), last = useRef('');
    useEffect(() => { const unlock = () => { try {
        context.current ||= new AudioContext();
        void context.current.resume().catch(() => { });
    }
    catch { } }; document.addEventListener('pointerdown', unlock); document.addEventListener('keydown', unlock); return () => { document.removeEventListener('pointerdown', unlock); document.removeEventListener('keydown', unlock); nodes.current.forEach(n => { try {
        n.stop();
    }
    catch { } }); nodes.current.clear(); void context.current?.close(); context.current = null; }; }, []);
    useEffect(() => {
        const id = s ? `${s.id}:${s.fx}` : '';
        const changed = id !== last.current;
        last.current = id;
        if (!enabled || s?.paused || s?.listening) {
            nodes.current.forEach(n => { try {
                n.stop();
            }
            catch { } });
            nodes.current.clear();
            return;
        }
        const ctx = context.current;
        if (!s || !s.fx || !changed || !ctx || ctx.state !== 'running')
            return;
        const complete = s.phase === 'finished' || s.phase === 'between' || s.phase === 'boardDone';
        const notes = complete ? [523, 659, 784, 1047] : s.lastCorrect ? [660 + Math.min(s.combo, 8) * 35, 990] : [230, 180];
        notes.forEach((hz, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), at = ctx.currentTime + i * .085; o.type = 'sine'; o.frequency.value = hz; g.gain.setValueAtTime(.001, at); g.gain.linearRampToValueAtTime(.045, at + .015); g.gain.exponentialRampToValueAtTime(.001, at + .22); o.connect(g); g.connect(ctx.destination); nodes.current.add(o); o.onended = () => { nodes.current.delete(o); o.disconnect(); g.disconnect(); }; o.start(at); o.stop(at + .24); });
    }, [s?.id, s?.fx, s?.paused, s?.listening, enabled]);
}

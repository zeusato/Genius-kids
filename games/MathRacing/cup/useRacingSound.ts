import { useEffect, useRef } from 'react';
import type { Session } from './model';
export function useRacingSound(s: Session | null, enabled: boolean) {
    const audio = useRef<AudioContext | null>(null), engine = useRef<{ o: OscillatorNode; g: GainNode } | null>(null), last = useRef(''), notes = useRef(new Set<OscillatorNode>());
    useEffect(() => {
        const unlock = () => { try { audio.current ||= new AudioContext(); void audio.current.resume().catch(() => {});
            if (!engine.current) { const ctx = audio.current, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 65; g.gain.value = 0; o.connect(g); g.connect(ctx.destination); o.start(); engine.current = { o, g }; }
        } catch { /* Playing remains possible without audio. */ } };
        window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
        return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); notes.current.forEach(o => { try { o.stop(); } catch {} }); engine.current?.o.stop(); engine.current = null; void audio.current?.close(); audio.current = null; };
    }, []);
    useEffect(() => {
        const ctx = audio.current, active = enabled && s?.phase === 'racing' && !s.paused;
        if (engine.current && ctx) { engine.current.g.gain.setTargetAtTime(active ? .012 : 0, ctx.currentTime, .08); engine.current.o.frequency.setTargetAtTime(s?.racers[0].boost ? 112 : 66, ctx.currentTime, .1); }
        if (!active) { notes.current.forEach(o => { try { o.stop(); } catch {} }); notes.current.clear(); }
        const id = s ? `${s.id}:${s.fx}` : ''; if (last.current === id) return; last.current = id;
        if (!ctx || ctx.state !== 'running' || !enabled || !s?.fx || s.paused) return;
        const pitches = s.phase === 'finished' ? [523, 659, 784, 1047] : s.lastCorrect === false ? [250, 210] : s.lastCorrect === true ? [660, 880] : [440, 660];
        pitches.forEach((hz, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), at = ctx.currentTime + i * .09; o.frequency.value = hz; g.gain.setValueAtTime(.001, at); g.gain.linearRampToValueAtTime(.055, at + .015); g.gain.exponentialRampToValueAtTime(.001, at + .2); o.connect(g); g.connect(ctx.destination); notes.current.add(o); o.onended = () => { notes.current.delete(o); o.disconnect(); g.disconnect(); }; o.start(at); o.stop(at + .21); });
    }, [s?.id, s?.fx, s?.paused, s?.phase, s?.racers[0].boost > 0, enabled]);
}

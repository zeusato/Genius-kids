import { musicManager } from '@/services/musicManager';

// Hiệu ứng âm thanh tổng hợp bằng Web Audio API (không cần file mp3).
// Tôn trọng nút tắt tiếng (soundEnabled) sẵn có trong app.

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

function soundOn(): boolean {
    try {
        return musicManager.getMusicState().soundEnabled;
    } catch {
        return true;
    }
}

function tone(c: AudioContext, freqFrom: number, freqTo: number, start: number, dur: number, peak: number) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freqFrom, c.currentTime + start);
    o.frequency.exponentialRampToValueAtTime(freqTo, c.currentTime + start + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(peak, c.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.02);
}

// Tiếng "blip" nhẹ khi chạm chọn thiên thể
export function playBlip(): void {
    if (!soundOn()) return;
    const c = audioCtx();
    if (!c) return;
    tone(c, 620, 940, 0, 0.16, 0.1);
}

// Tiếng "xoẹt" khi cắt hành tinh — nhiễu trắng qua bandpass quét xuống
export function playSlice(): void {
    if (!soundOn()) return;
    const c = audioCtx();
    if (!c) return;
    const dur = 0.28;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(3200, c.currentTime);
    bp.frequency.exponentialRampToValueAtTime(500, c.currentTime + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.14, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    src.connect(bp).connect(g).connect(c.destination);
    src.start();
    src.stop(c.currentTime + dur + 0.02);
}

// Chuỗi nốt vui khi trả lời đúng / nhận huy hiệu
export function playSuccess(): void {
    if (!soundOn()) return;
    const c = audioCtx();
    if (!c) return;
    [523, 659, 784].forEach((f, i) => tone(c, f, f, i * 0.1, 0.16, 0.09));
}

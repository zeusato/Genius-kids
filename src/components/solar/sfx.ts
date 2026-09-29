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

// Tiếng "vút" khi camera bay tới thiên thể — nhiễu hồng qua lowpass quét lên rồi xuống, rất nhẹ
export function playWhoosh(): void {
    if (!soundOn()) return;
    const c = audioCtx();
    if (!c) return;
    const dur = 0.9;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
        last = last * 0.96 + (Math.random() * 2 - 1) * 0.04; // lọc thấp → tiếng gió mềm
        data[i] = last * 6;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 3;
    lp.frequency.setValueAtTime(300, c.currentTime);
    lp.frequency.exponentialRampToValueAtTime(1800, c.currentTime + dur * 0.45);
    lp.frequency.exponentialRampToValueAtTime(260, c.currentTime + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.09, c.currentTime + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    src.connect(lp).connect(g).connect(c.destination);
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

// Tiếng "bùm" trầm khi thiên thạch 66 triệu năm (Cây Tiến Hóa): nhiễu qua lowpass + sóng sin tụt 45→30 Hz, nhẹ nhàng
export function playImpact(): void {
    if (!soundOn()) return;
    const c = audioCtx();
    if (!c) return;
    const dur = 1.2;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) { last = last * 0.985 + (Math.random() * 2 - 1) * 0.015; data[i] = last * 10; }
    const src = c.createBufferSource();
    src.buffer = buf;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, c.currentTime);
    lp.frequency.exponentialRampToValueAtTime(120, c.currentTime + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.22, c.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    src.connect(lp).connect(g).connect(c.destination);
    src.start();
    src.stop(c.currentTime + dur + 0.02);
    const o = c.createOscillator();
    const og = c.createGain();
    o.frequency.setValueAtTime(45, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(30, c.currentTime + dur);
    og.gain.setValueAtTime(0.0001, c.currentTime);
    og.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.04);
    og.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(og).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
}

// ---------------------------------------------------------------- Bảng tuần hoàn
function noiseBurst(c: AudioContext, dur: number, peak: number, filter: BiquadFilterType, f0: number, f1: number, start = 0, q = 1) {
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = filter; f.Q.value = q;
    const t = c.currentTime + start;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
}

/** Sủi bọt xèo xèo (kim loại kiềm gặp nước). power 0..5 */
export function playFizz(power = 1): void {
    if (!soundOn()) return;
    const c = audioCtx(); if (!c) return;
    noiseBurst(c, 0.9 + power * 0.2, 0.04 + power * 0.02, 'highpass', 3000, 5000, 0, 0.7);
}

/** Tiếng "bụp" (hydrogen cháy, bong bóng vỡ). */
export function playPop(): void {
    if (!soundOn()) return;
    const c = audioCtx(); if (!c) return;
    noiseBurst(c, 0.18, 0.25, 'lowpass', 2400, 300);
    tone(c, 220, 60, 0, 0.16, 0.12);
}

/** Tia điện lách tách khi bật ống phóng điện. */
export function playZap(): void {
    if (!soundOn()) return;
    const c = audioCtx(); if (!c) return;
    for (let i = 0; i < 4; i++) noiseBurst(c, 0.05, 0.06, 'bandpass', 5000, 3000, i * 0.04, 4);
    tone(c, 120, 120, 0, 0.5, 0.03);
}

/** Pháo hoa: tiếng rít khi bay lên. */
export function playLaunch(): void {
    if (!soundOn()) return;
    const c = audioCtx(); if (!c) return;
    tone(c, 700, 1900, 0, 0.9, 0.035);
}

/** Pháo hoa: tiếng nổ trầm + lách tách. */
export function playBoom(crackle = true): void {
    if (!soundOn()) return;
    const c = audioCtx(); if (!c) return;
    noiseBurst(c, 1.1, 0.24, 'lowpass', 1400, 90);
    tone(c, 70, 38, 0, 0.8, 0.14);
    if (crackle) for (let i = 0; i < 14; i++) noiseBurst(c, 0.03, 0.03 + Math.random() * 0.03, 'highpass', 4000, 6000, 0.35 + Math.random() * 0.9, 1);
}

/** Chuông nhỏ khi một ô sáng lên (mở màn); step làm cao độ tăng dần. */
export function playChime(step = 0): void {
    if (!soundOn()) return;
    const c = audioCtx(); if (!c) return;
    const f = 523 * Math.pow(2, (step % 24) / 12);
    tone(c, f, f, 0, 0.35, 0.03);
}

/** Một tiếng "tách" của máy đếm Geiger. */
export function playGeigerClick(): void {
    if (!soundOn()) return;
    const c = audioCtx(); if (!c) return;
    noiseBurst(c, 0.012, 0.18, 'highpass', 2000, 2500, 0, 1);
}

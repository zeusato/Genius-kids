// Âm thanh tổng hợp bằng WebAudio (không tải file): "tích" khi bóng mờ nhảy ô, "tách" khi lắp, "bụp" khi tháo.
let ctx: AudioContext | null = null;
let muted = false;
export const setMuted = (m: boolean) => { muted = m; };

function ac() {
  if (muted || typeof window === 'undefined') return null;
  try { ctx ||= new (window.AudioContext || (window as any).webkitAudioContext)(); if (ctx.state === 'suspended') void ctx.resume(); return ctx; }
  catch { return null; }
}
function click(freq: number, dur: number, gain: number, noise = 0.6) {
  const a = ac(); if (!a) return;
  const t = a.currentTime, g = a.createGain();
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(a.destination);
  const o = a.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + dur);
  o.connect(g); o.start(t); o.stop(t + dur);
  if (noise > 0) {
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const n = a.createBufferSource(), ng = a.createGain(), f = a.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 1800; ng.gain.value = gain * noise;
    n.buffer = buf; n.connect(f); f.connect(ng); ng.connect(a.destination); n.start(t);
  }
}
export const sfx = {
  tick: () => click(1800, 0.03, 0.05, 0.2),
  snap: () => click(900, 0.08, 0.22, 0.9),
  pop: () => click(420, 0.12, 0.18, 0.5),
  bad: () => click(180, 0.12, 0.12, 0),
};
export function haptic(ms = 8) { try { if ('vibrate' in navigator) navigator.vibrate(ms); } catch { /* iOS không có */ } }

// Âm thanh Xưởng Cắt Giấy (plan mục 6.6): 4 file CC0 trong public/papercut/audio (nguồn ở README ở đó).
// Mỗi file được dò "điểm bắt đầu tiếng" theo năng lượng để phát từng đoạn ngắn ngẫu nhiên — không cần cắt file sẵn.
// Tôn trọng nút tắt tiếng (soundEnabled) của app, giống src/components/solar/sfx.ts.
import { musicManager } from '@/services/musicManager';
import { findOnsets } from './onsets';

export type Sfx = 'fold' | 'crease' | 'scissors' | 'scraps' | 'reveal';
const FILE: Record<Sfx, string> = { fold: 'fold', crease: 'fold', scissors: 'scissors', scraps: 'scraps', reveal: 'reveal' };
/** Độ dài đoạn phát (s) và âm lượng. `whole` = phát cả file. */
const PLAY: Record<Sfx, { dur: number; gain: number; whole?: boolean }> = {
  fold: { dur: 0.55, gain: 0.8 }, crease: { dur: 0.22, gain: 0.7 }, scissors: { dur: 0.32, gain: 0.85 },
  scraps: { dur: 1.2, gain: 0.55, whole: true }, reveal: { dur: 1.1, gain: 0.5, whole: true },
};

let ctx: AudioContext | null = null;
const buffers = new Map<string, Promise<{ buf: AudioBuffer; onsets: number[] } | null>>();

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ||= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
function soundOn() { try { return musicManager.getMusicState().soundEnabled; } catch { return true; } }

function load(name: string) {
  let p = buffers.get(name);
  if (!p) {
    const c = audio();
    p = !c ? Promise.resolve(null) : fetch(`${import.meta.env.BASE_URL}papercut/audio/${name}.mp3`)
      .then(r => r.arrayBuffer()).then(a => c.decodeAudioData(a))
      .then(buf => ({ buf, onsets: findOnsets(buf.getChannelData(0), buf.sampleRate) }))
      .catch(() => null);
    buffers.set(name, p);
  }
  return p;
}

/** Nạp sẵn (gọi khi vào xưởng) để lần chạm đầu có tiếng ngay. */
export function preloadSfx() { for (const f of new Set(Object.values(FILE))) void load(f); }

export function playSfx(kind: Sfx, opts: { rate?: number; volume?: number } = {}) {
  if (!soundOn()) return;
  const c = audio(); if (!c) return;
  void load(FILE[kind]).then(a => {
    if (!a) return;
    const cfg = PLAY[kind], src = c.createBufferSource(), g = c.createGain(), t = c.currentTime;
    src.buffer = a.buf; src.playbackRate.value = opts.rate ?? 0.92 + Math.random() * 0.16;
    // `whole`: phát từ tiếng đầu tiên (bỏ khoảng lặng đầu file); còn lại: một cú "xoẹt" ngẫu nhiên
    const at = cfg.whole ? a.onsets[0] : a.onsets[Math.floor(Math.random() * a.onsets.length)];
    const dur = Math.min(cfg.dur, a.buf.duration - at);
    const vol = cfg.gain * (opts.volume ?? 1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + Math.max(0.02, dur - 0.08)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(g).connect(c.destination);
    src.start(t, at, dur + 0.02);
  });
}

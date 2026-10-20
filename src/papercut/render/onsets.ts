// Dò điểm bắt đầu tiếng trong một đoạn âm thanh (thuần, test được) — dùng cho sfx.ts.
/** Điểm bắt đầu các cú "xoẹt": cửa sổ 20 ms vượt ngưỡng sau một đoạn yên. */
export function findOnsets(data: Float32Array, rate: number): number[] {
  const win = Math.round(rate * 0.02), rms: number[] = [];
  for (let i = 0; i + win <= data.length; i += win) { let s = 0; for (let j = i; j < i + win; j++) s += data[j] * data[j]; rms.push(Math.sqrt(s / win)); }
  const peak = Math.max(...rms, 1e-9), on = peak * 0.35, off = peak * 0.12, out: number[] = [];
  let quiet = true;
  rms.forEach((r, i) => { if (quiet && r > on) { out.push(Math.max(0, (i - 1) * 0.02)); quiet = false; } else if (!quiet && r < off) quiet = true; });
  return out.length ? out : [0];
}

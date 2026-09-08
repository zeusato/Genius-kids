export const PITCHES = [261.6256, 293.6648, 329.6276, 391.9954, 440];
export const NOTE_NAMES = ['Đô', 'Rê', 'Mi', 'Sol', 'La'];
export const TIMBRES = ['wood', 'bell', 'keys'] as const;
export type Timbre = typeof TIMBRES[number];
export type Voice = Timbre | 'kick' | 'clap' | 'tick';
export const TIMBRE_NAMES: Record<Timbre, string> = { wood: 'Đàn gỗ', bell: 'Chuông ngân', keys: 'Phím mềm' };

/** Original deterministic instrument patches, rendered once at the device sample rate. */
export function renderVoice(voice: Voice, note: number, sampleRate: number): Float32Array {
    const duration = voice === 'bell' ? 1.75 : voice === 'keys' ? 1.4 : voice === 'wood' ? 1.05 : voice === 'kick' ? .38 : .22;
    const pcm = new Float32Array(Math.ceil(duration * sampleRate));
    const f = PITCHES[Math.max(0, Math.min(4, Math.floor(note)))] || PITCHES[0];
    let seed = 197503, lowNoise = 0;
    for (let i = 0; i < pcm.length; i++) {
        const t = i / sampleRate, attack = Math.min(1, t / .006), tail = Math.min(1, (duration - t) / .05);
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
        const noise = (seed >>> 0) / 2147483648 - 1;
        lowNoise += .16 * (noise - lowNoise);
        let x = 0;
        if (voice === 'wood') {
            x = Math.sin(2 * Math.PI * f * t) * Math.exp(-5.8 * t)
                + .28 * Math.sin(2 * Math.PI * f * 3 * t) * Math.exp(-15 * t)
                + .09 * Math.sin(2 * Math.PI * f * 7 * t) * Math.exp(-28 * t)
                + .08 * lowNoise * Math.exp(-65 * t);
        } else if (voice === 'bell') {
            x = .75 * Math.sin(2 * Math.PI * f * t) * Math.exp(-3.8 * t)
                + .24 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-5 * t)
                + .13 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-7 * t)
                + .07 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-12 * t);
        } else if (voice === 'keys') {
            x = .7 * Math.sin(2 * Math.PI * f * t) * Math.exp(-3.5 * t)
                + .22 * Math.sin(2 * Math.PI * f * 1.003 * t) * Math.exp(-4 * t)
                + .18 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-7 * t)
                + .06 * Math.sin(2 * Math.PI * f * 3 * t) * Math.exp(-12 * t);
        } else if (voice === 'kick') {
            x = Math.sin(2 * Math.PI * (58 * t + 55 * .025 * (1 - Math.exp(-t / .025)))) * Math.exp(-13 * t);
        } else if (voice === 'clap') {
            const burst = Math.exp(-55 * t) + (t > .025 ? .7 * Math.exp(-65 * (t - .025)) : 0) + (t > .05 ? .5 * Math.exp(-50 * (t - .05)) : 0);
            x = (noise - lowNoise) * burst * .65;
        } else x = Math.sin(2 * Math.PI * 1100 * t) * Math.exp(-60 * t) * .38;
        pcm[i] = x * attack * tail * .42;
    }
    pcm[pcm.length - 1] = 0;
    return pcm;
}

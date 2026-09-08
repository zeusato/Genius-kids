/** Shared live/offline output graph. A transparent shoulder catches polyphonic peaks. */
export function createOutput(ctx: BaseAudioContext, volume: number) {
    const master = ctx.createGain(), compressor = ctx.createDynamicsCompressor(), limiter = ctx.createWaveShaper();
    master.gain.value = volume;
    compressor.threshold.value = -12; compressor.knee.value = 14; compressor.ratio.value = 4;
    compressor.attack.value = .004; compressor.release.value = .12;
    const curve = new Float32Array(2049);
    for (let i = 0; i < curve.length; i++) { const x = i * 2 / (curve.length - 1) - 1, a = Math.abs(x); curve[i] = Math.sign(x) * (a <= .72 ? a : .72 + .18 * (1 - Math.exp(-(a - .72) / .18))); }
    limiter.curve = curve; limiter.oversample = '2x';
    master.connect(compressor); compressor.connect(limiter); limiter.connect(ctx.destination);
    return master;
}

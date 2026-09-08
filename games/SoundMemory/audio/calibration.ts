/** Reject erratic tapping rather than persisting a misleading compensation. */
export function calibrationOffset(samples: number[]): number | null {
    if (samples.length < 6 || samples.some(n => !Number.isFinite(n))) return null;
    const sorted = [...samples].sort((a, b) => a - b), middle = sorted[Math.floor(sorted.length / 2)];
    const deviations = sorted.map(n => Math.abs(n - middle)).sort((a, b) => a - b);
    if (Math.abs(middle) > 250 || deviations[Math.floor(deviations.length / 2)] > 65) return null;
    return Math.round(middle / 5) * 5;
}

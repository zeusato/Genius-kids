export class GameAudio {
  private context: AudioContext | null = null;
  play(kind: 'select' | 'move' | 'capture' | 'check' | 'finish') {
    try {
      this.context ??= new AudioContext(); const ctx = this.context; void ctx.resume();
      const frequencies = kind === 'finish' ? [523.25, 659.25, 783.99] : kind === 'check' ? [392, 523] : kind === 'capture' ? [150, 95] : kind === 'move' ? [240] : [520];
      frequencies.forEach((frequency, i) => { const osc = ctx.createOscillator(), gain = ctx.createGain(), t = ctx.currentTime + i * .105; osc.type = kind === 'move' || kind === 'capture' ? 'triangle' : 'sine'; osc.frequency.setValueAtTime(frequency, t); osc.frequency.exponentialRampToValueAtTime(frequency * .75, t + .12); gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.085, t + .006); gain.gain.exponentialRampToValueAtTime(.0001, t + .2); osc.connect(gain); gain.connect(ctx.destination); osc.start(t); osc.stop(t + .22); osc.onended = () => { osc.disconnect(); gain.disconnect(); }; });
    } catch { /* Audio is decorative; interaction still works if blocked. */ }
  }
  dispose() { void this.context?.close(); this.context = null; }
}

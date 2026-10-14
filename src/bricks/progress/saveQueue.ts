import type { BrickModel } from '../engine/model';

/** Serialize saves from timers, pagehide and Back; retain edits after failed writes. */
export class ModelSaveQueue {
  private pending?: BrickModel;
  private flight?: Promise<void>;
  constructor(public saved: BrickModel, private write: (model: BrickModel, revision: number) => Promise<number>) {}
  get latest() { return this.pending ?? this.saved; }
  get dirty() { return !!this.pending; }
  update(model: BrickModel) { this.pending = model; }
  flush(): Promise<void> {
    if (this.flight) return this.flight;
    this.flight = this.drain().finally(() => { this.flight = undefined; });
    return this.flight;
  }
  private async drain() {
    while (this.pending) {
      const candidate = this.pending;
      const next = { ...candidate, revision: this.saved.revision };
      const revision = await this.write(next, this.saved.revision);
      this.saved = { ...next, revision };
      if (this.pending === candidate) this.pending = undefined;
    }
  }
}

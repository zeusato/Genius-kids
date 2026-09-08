export type EditScope = 'globe' | 'region' | 'town';
/** One chronological undo cursor across both scenes; each engine owns its payload. */
export class EditTimeline {
    undo: EditScope[] = []; redo: EditScope[] = [];
    record(scope: EditScope, retained: Partial<Record<EditScope, number>>) {
        this.undo.push(scope); this.redo = [];
        for (const kind of ['globe', 'region', 'town'] as const) {
            let excess = this.undo.filter(v => v === kind).length - (retained[kind] ?? 0);
            while (excess-- > 0) {
                const index = this.undo.indexOf(kind);
                // Earlier terrain diffs cannot cross a discarded whole-town boundary.
                if (kind === 'town') this.undo.splice(0, index + 1); else this.undo.splice(index, 1);
            }
        }
    }
    travel(redo = false) { const from = redo ? this.redo : this.undo, to = redo ? this.undo : this.redo, scope = from.pop(); if (scope) to.push(scope); return scope; }
}

export type EditScope = 'globe' | 'region';
/** One chronological undo cursor across both scenes; each engine owns its payload. */
export class EditTimeline {
    undo: EditScope[] = []; redo: EditScope[] = [];
    record(scope: EditScope, retained: Record<EditScope, number>) {
        this.undo.push(scope); this.redo = [];
        for (const kind of ['globe', 'region'] as const) { let excess = this.undo.filter(v => v === kind).length - retained[kind]; while (excess-- > 0) this.undo.splice(this.undo.indexOf(kind), 1); }
    }
    travel(redo = false) { const from = redo ? this.redo : this.undo, to = redo ? this.undo : this.redo, scope = from.pop(); if (scope) to.push(scope); return scope; }
}

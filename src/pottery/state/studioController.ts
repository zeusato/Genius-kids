import { clone, type ArtworkDoc, type Tool, type Stamp, type Pattern, type PaintPoint, type PaintStroke } from '../model';
import { MAX_POINTS, MAX_STROKES } from '../engine/document';
import { openVessel } from '../engine/profile';
import { saveArtwork } from '../persistence/repository';
type Edit = Pick<ArtworkDoc, 'shape' | 'clay' | 'glaze' | 'decoration' | 'skills'>;
const edit = (a: ArtworkDoc): Edit => clone({ shape: a.shape, clay: a.clay, glaze: a.glaze, decoration: a.decoration, skills: a.skills });
export class StudioController {
  doc: ArtworkDoc;
  tool: Tool = 'shape'; color = '#304d78'; size = .09; opacity = 1; stamp: Stamp = 'flower'; pattern: Pattern = 'plain';
  spinning = true; muted = true; reduced = false; preview = true; assistance: 'easy' | 'normal' | 'precise' = 'normal';
  cameraView: 'outside' | 'inside' = 'outside';
  shapeVersion = 0; paintVersion = 0; busy = false; dirty = false;
  status = 'Đã mở bản trên máy'; error = ''; notice = '';
  private listeners = new Set<() => void>(); private serial = 0;
  private before?: Edit; private past: Edit[] = []; private future: Edit[] = [];
  private timer?: ReturnType<typeof setTimeout>; private saveChain: Promise<boolean> = Promise.resolve(true);
  private generation = 0; private disposed = false; private historyBytes = 0;
  private view = { serial: 0 };
  activeStroke?: PaintStroke;
  constructor(art: ArtworkDoc) { this.doc = clone(art); this.spinning = art.stage === 'shaping'; this.tool = art.stage === 'shaping' ? 'shape' : 'brush'; }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  snapshot = () => this.view;
  emit() { this.view = { serial: ++this.serial }; if (!this.disposed) this.listeners.forEach(fn => fn()); }
  get canUndo() { return this.past.length > 0; } get canRedo() { return this.future.length > 0; }
  get editing() { return !!this.before; }
  begin() { if (!this.before) this.before = edit(this.doc); }
  changed(shape = false) { this.dirty = true; this.generation++; this.paintVersion++; if (shape) this.shapeVersion++; }
  skill(name: string) { if (!this.doc.skills.includes(name)) this.doc.skills.push(name); }
  end() {
    this.activeStroke = undefined;
    if (!this.before) return;
    const previous = this.before; this.before = undefined;
    if (JSON.stringify(previous) !== JSON.stringify(edit(this.doc))) {
      this.past.push(previous); this.historyBytes += JSON.stringify(previous).length * 2; this.future = [];
      while (this.past.length > 50 || (this.historyBytes > 16 * 1024 * 1024 && this.past.length > 1)) this.historyBytes -= JSON.stringify(this.past.shift()).length * 2;
      this.changed(); this.schedule();
    }
    this.emit();
  }
  mutate(action: (a: ArtworkDoc) => void, shape = false) { this.end(); this.begin(); action(this.doc); this.changed(shape); this.end(); }
  undo(redo = false) {
    this.end(); const from = redo ? this.future : this.past, to = redo ? this.past : this.future, value = from.pop();
    if (!value) return; to.push(edit(this.doc)); Object.assign(this.doc, value);
    this.historyBytes = this.past.reduce((n,v) => n + JSON.stringify(v).length * 2, 0);
    this.changed(true); this.schedule(); this.emit();
  }
  selectTool(tool: Tool) { this.end(); this.tool = tool; if (tool === 'open') this.cameraView = 'inside'; else if (tool !== 'view') this.cameraView = 'outside'; if (tool === 'brush' || tool === 'stamp' || tool === 'erase') this.spinning = false; this.emit(); }
  inspectInside() { this.end(); this.cameraView = this.cameraView === 'inside' ? 'outside' : 'inside'; this.tool = 'view'; this.emit(); }
  open() { this.cameraView = 'inside'; this.mutate(a => { openVessel(a.shape); this.skill('open'); }, true); }
  schedule() { clearTimeout(this.timer); this.status = 'Đang lưu…'; this.timer = setTimeout(() => { void this.flush(); }, 650); }
  flush(checkpoint = false): Promise<boolean> {
    clearTimeout(this.timer);
    this.saveChain = this.saveChain.then(async () => {
      if (!this.dirty && this.doc.revision > 0 && !checkpoint) return true;
      const at = this.generation, saved = clone(this.doc); this.status = 'Đang lưu…'; this.emit();
      try {
        const rev = await saveArtwork(saved, this.doc.revision, checkpoint);
        this.doc.revision = rev; this.dirty = this.generation !== at; this.error = ''; this.status = this.dirty ? 'Đang lưu…' : 'Đã lưu trên máy'; this.emit(); return true;
      } catch (error) { this.error = error instanceof Error ? error.message : 'Chưa lưu được. Hãy xuất bản sao để giữ tác phẩm.'; this.status = 'Chưa lưu được'; this.emit(); return false; }
    });
    return this.saveChain;
  }
  async stage(stage: ArtworkDoc['stage']) {
    if (this.busy) return false;
    const next: Record<ArtworkDoc['stage'], ArtworkDoc['stage'][]> = {
      shaping: ['preparing'], preparing: ['decorating'], decorating: ['firing'],
      firing: ['reveal'], reveal: ['finished'], finished: ['finished'],
    };
    if (!next[this.doc.stage].includes(stage)) return false;
    this.end(); this.busy = true; const old = this.doc.stage, before = edit(this.doc);
    if (stage === 'preparing' && this.doc.shape.depth <= .01) { openVessel(this.doc.shape); this.shapeVersion++; }
    this.doc.stage = stage; this.changed(); this.emit();
    const ok = await this.flush(true);
    if (!ok) { this.doc.stage = old; Object.assign(this.doc,before); this.changed(true); }
    else { this.past = []; this.future = []; this.historyBytes = 0; this.spinning = stage === 'shaping'; this.tool = stage === 'shaping' ? 'shape' : 'brush'; this.cameraView = 'outside'; }
    this.busy = false; this.emit(); return ok;
  }
  point(point: PaintPoint, start = false) {
    const strokes = this.doc.decoration.strokes;
    const count = strokes.reduce((n,s) => n + s.points.length, 0);
    if (count >= MAX_POINTS || ((start || !this.activeStroke) && strokes.length >= MAX_STROKES)) { this.notice = 'Tác phẩm đã có rất nhiều nét. Hãy hoàn thiện hoặc tạo một bản mới nhé.'; this.emit(); return; }
    if (start || !this.activeStroke) {
      this.activeStroke = { kind: this.tool as PaintStroke['kind'], color: this.color, size: this.size, opacity: this.opacity, stamp: this.stamp, pattern: this.pattern, points: [] };
      strokes.push(this.activeStroke);
    }
    const points = this.activeStroke.points, last = points[points.length - 1];
    if (last && Math.hypot(Math.min(Math.abs(last.u-point.u),1-Math.abs(last.u-point.u)),last.v-point.v) < .002) return;
    points.push(point); this.skill(this.tool); this.changed();
  }
  dispose() { this.end(); void this.flush(); this.disposed = true; clearTimeout(this.timer); this.listeners.clear(); }
}

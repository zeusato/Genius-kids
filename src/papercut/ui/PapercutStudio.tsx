// Màn chính Xưởng Cắt Giấy (plan mục 3–8): bàn làm việc 3D, dụng cụ, mẫu, Sổ Cắt Giấy, chia sẻ cách làm.
// Linh hoạt: không thứ tự bắt buộc; mẫu chỉ gấp giúp và vẽ nét chấm, bé cắt khác vẫn được.
// `dev` hiện bảng số đo và móc `window.__papercut` cho kiểm thử.
import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ArrowLeft, BookOpen, CircleDot, FilePlus2, FoldHorizontal, FoldVertical, Hand, Magnet, Save, Scissors, Share2, Sparkles, Triangle, Undo2, Wand2 } from 'lucide-react';
import type { FoldEntry, Op, PapercutArtwork, PaperSpec, Scope } from '../model';
import { outline } from '../engine/fold';
import { add, norm, perp, scale, sub, v } from '../engine/geom';
import { bounds, components, kerf } from '../engine/poly';
import { templatePlan, type Template } from '../content/templates';
import { saveArtwork, saveThumbnail } from '../persistence/repository';
import type { PapercutEvent } from '../progress/progress';
import { Bench, KERF } from '../state/bench';
import { WorkbenchScene, type Tool } from '../render/WorkbenchScene';
import { playSfx, preloadSfx } from '../render/sfx';
import { ExportSheet } from './ExportSheet';
import { Notebook } from './Notebook';
import { TemplatePicker } from './TemplatePicker';

const SHAPES = {
  square: { label: 'Vuông', w: 15, h: 15 },
  hexagon: { label: 'Lục giác', w: 15, h: 15 },
  strip: { label: 'Dải dài', w: 28, h: 7 },
} as const;
type ShapeId = keyof typeof SHAPES;
const COLORS = [['Đỏ', '#e53935'], ['Cam', '#fb8c00'], ['Vàng', '#fdd835'], ['Xanh lá', '#43a047'], ['Xanh dương', '#1e88e5'], ['Tím', '#8e24aa'], ['Hồng', '#ec407a']] as const;
const BACK = '#fff6e6';
const paperOf = (shape: ShapeId, front: string): PaperSpec => ({ shape, w: SHAPES[shape].w, h: SHAPES[shape].h, front, back: BACK });

interface Current { id: string; revision: number; name: string; createdAt: string; templateId?: string }
type Panel = null | 'templates' | 'notebook' | { kind: 'export'; spec: PaperSpec; ops: Op[]; name: string; hero: HTMLCanvasElement | null };
type Pending = null | { kind: 'template'; t: Template } | { kind: 'load'; art: PapercutArtwork; guide?: boolean };

export interface StudioProps {
  scope: Scope; dev?: boolean; preschool?: boolean;
  onExit: () => void;
  onReward: (e: PapercutEvent) => { earned: number; badges: string[] };
}

export function PapercutStudio({ scope, dev = false, preschool = false, onExit, onReward }: StudioProps) {
  const [spec, setSpec] = useState<PaperSpec>(() => paperOf('square', COLORS[0][1]));
  const bench = useMemo(() => new Bench(spec), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [pending, setPending] = useState<Pending>(null);
  const [tool, setTool] = useState<Tool>('fold');
  const [mountain, setMountain] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [current, setCurrent] = useState<Current | null>(null);
  const [guided, setGuided] = useState<Template | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, setTick] = useState(0);
  useEffect(() => { const f = () => setTick(t => t + 1); bench.listeners.add(f); return () => { bench.listeners.delete(f); }; }, [bench]);
  useEffect(() => { bench.sound = playSfx; preloadSfx(); return () => { bench.sound = () => {}; }; }, [bench]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);

  // Đổi giấy → tờ mới; nếu đang mở mẫu/tác phẩm thì làm tiếp phần đó sau khi bàn đã sẵn.
  useEffect(() => {
    bench.reset(spec);
    const p = pending; setPending(null);
    if (p?.kind === 'load') { bench.load(spec, p.art.ops); if (p.guide) openExport(p.art.spec, p.art.ops, p.art.name); }
    if (p?.kind === 'template') {
      const plan = templatePlan(p.t);
      setTool('fold');
      bench.foldSequence(plan.folds, () => {
        bench.guide = plan.cuts.map(c => (c.kind === 'cut' && c.stroke ? (c.closed ? [...c.stroke, c.stroke[0]] : c.stroke) : [])).filter(s => s.length > 1);
        bench.guideDirty = true; setTool('cut'); bench.notify();
      });
    }
  }, [bench, spec]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dev) return;
    const w = window as unknown as { __papercut?: unknown };
    w.__papercut = {
      bench, fold: (px: number, py: number, fx: number, fy: number, valley = true) => bench.foldAnimated({ kind: 'fold', p: scale(add(v(px, py), v(fx, fy)), 0.5), n: norm(sub(v(px, py), v(fx, fy))), valley }),
      cut: (pts: [number, number][]) => { const stroke = pts.map(([x, y]) => v(x, y)); bench.push({ kind: 'cut', region: kerf(stroke, KERF), tool: 'free', stroke }); },
      unfoldAll: () => bench.unfoldAll(),
    };
    return () => { delete w.__papercut; };
  }, [bench, dev]);

  const newPaper = (next: PaperSpec) => { setCurrent(null); setGuided(null); setSpec({ ...next }); };
  const quick = (kind: 'v' | 'h' | 'd') => {
    if (bench.busy) return;
    const b = bounds(outline(bench.s.facets)), c = v((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
    const n = kind === 'v' ? v(1, 0) : kind === 'h' ? v(0, 1) : norm(perp(v(b.x1 - b.x0, b.y1 - b.y0)));
    bench.foldAnimated({ kind: 'fold', p: c, n, valley: true } as FoldEntry);
  };
  const helpCut = () => {
    if (!guided || bench.busy) return;
    for (const op of templatePlan(guided).cuts) bench.push(op);
    bench.guide = []; bench.guideDirty = true; bench.notify();
  };
  const unfolded = (then: () => void) => (bench.s.entries.length ? bench.unfoldAll(then) : then());
  const nameFor = () => current?.name ?? (guided ? guided.name : 'Hoa giấy của em');

  function openExport(s: PaperSpec, ops: Op[], name: string) {
    // chụp khung hình sau một nhịp để cảnh kịp vẽ tờ giấy vừa tải
    requestAnimationFrame(() => requestAnimationFrame(() => setPanel({ kind: 'export', spec: s, ops, name, hero: bench.capture?.(1200, 800) ?? null })));
  }

  const save = () => unfolded(async () => {
    if (!bench.ops.length) return;
    const now = new Date().toISOString(), id = current?.id ?? crypto.randomUUID(), name = nameFor();
    const art: PapercutArtwork = { ...scope, id, name, spec: bench.spec, ops: [...bench.ops], templateId: current?.templateId ?? guided?.id, createdAt: current?.createdAt ?? now, updatedAt: now, revision: current?.revision ?? 0 };
    try {
      const revision = await saveArtwork(art, current?.revision ?? 0);
      setCurrent({ id, revision, name, createdAt: art.createdAt, templateId: art.templateId });
      const thumb = bench.capture?.(480, 320);
      if (thumb) thumb.toBlob(b => { if (b) void saveThumbnail(scope, id, revision, b); }, 'image/webp', 0.85);
      const r = onReward({ kind: 'save', id, pieces: components(bench.s.sheet).length, maxLayers: bench.maxLayersCut });
      setToast(['Đã cất vào sổ!', r.earned ? `+${r.earned} ⭐` : '', ...r.badges.map(b => `Huy hiệu mới: ${b}`)].filter(Boolean).join(' '));
    } catch (e) { setToast(e instanceof Error ? e.message : 'Chưa lưu được tác phẩm.'); }
  });
  const share = () => unfolded(() => openExport(bench.spec, [...bench.ops], nameFor()));

  const pickTemplate = (t: Template) => { setPanel(null); setCurrent(null); setGuided(t); setPending({ kind: 'template', t }); setSpec({ ...t.spec }); };
  const openArt = (art: PapercutArtwork, guide = false) => {
    setPanel(null); setGuided(null);
    setCurrent({ id: art.id, revision: art.revision, name: art.name, createdAt: art.createdAt, templateId: art.templateId });
    setPending({ kind: 'load', art, guide }); setSpec({ ...art.spec });
  };

  const s = bench.stats, folded = s.folds > 0, fresh = s.ops === 0, busy = bench.busy;
  const shapeKeys = (Object.keys(SHAPES) as ShapeId[]).filter(k => !preschool || k !== 'strip');
  const hint = bench.guide.length ? 'Cắt theo nét chấm — hoặc bấm “Cắt giúp em”' : tool === 'fold' ? 'Chạm vào giấy rồi kéo để gấp' : tool === 'cut' ? 'Vẽ đường cắt bằng ngón tay' : 'Chạm lên giấy để đục lỗ tròn';

  return <div className="pc-studio">
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 24, 13], fov: 42, near: 0.1, far: 300 }} onCreated={({ camera }) => camera.lookAt(0, 0, 0.5)} gl={{ antialias: true }}>
      <color attach="background" args={['#3b2f26']} />
      <WorkbenchScene key={`${spec.shape}${spec.front}${spec.w}`} bench={bench} tool={tool} mountain={mountain} preschool={preschool} />
    </Canvas>
    <div className="pc-top">
      <button className="pc-btn pc-round" onClick={onExit} aria-label="Về Góc Thủ Công"><ArrowLeft size={22} /></button>
      <div className="pc-group" role="group" aria-label="Kiểu giấy">
        {shapeKeys.map(k => <button key={k} className={`pc-btn${spec.shape === k ? ' on' : ''}`} onClick={() => newPaper(paperOf(k, spec.front))}>{SHAPES[k].label}</button>)}
      </div>
      <div className="pc-group pc-colors" role="group" aria-label="Màu giấy">
        {COLORS.map(([name, c]) => <button key={c} className={`pc-swatch${spec.front === c ? ' on' : ''}`} style={{ background: c }} onClick={() => newPaper({ ...spec, front: c })} aria-label={`Giấy ${name}`} title={name} />)}
      </div>
      <div className="pc-group pc-right">
        <button className="pc-btn" onClick={() => setPanel('templates')}><Sparkles size={20} /> Mẫu</button>
        <button className="pc-btn" onClick={() => setPanel('notebook')}><BookOpen size={20} /> Sổ</button>
        <button className="pc-btn" onClick={save} disabled={fresh || busy}><Save size={20} /> Cất vào sổ</button>
        <button className="pc-btn" onClick={share} disabled={fresh || busy}><Share2 size={20} /> Chia sẻ cách làm</button>
      </div>
    </div>
    {bench.snapLabel && <div className="pc-snap" aria-live="polite"><Magnet size={18} /> {bench.snapLabel}</div>}
    <div className="pc-tools" role="toolbar" aria-label="Dụng cụ">
      <button className={`pc-tool${tool === 'fold' ? ' on' : ''}`} onClick={() => setTool('fold')}><Hand size={26} /><span>Gấp</span></button>
      <button className={`pc-tool${tool === 'cut' ? ' on' : ''}`} onClick={() => setTool('cut')}><Scissors size={26} /><span>Kéo cắt</span></button>
      <button className={`pc-tool${tool === 'punch' ? ' on' : ''}`} onClick={() => setTool('punch')}><CircleDot size={26} /><span>Đục lỗ</span></button>
      <hr />
      <button className="pc-tool" onClick={() => quick('v')} disabled={busy}><FoldHorizontal size={26} /><span>Gấp dọc</span></button>
      <button className="pc-tool" onClick={() => quick('h')} disabled={busy}><FoldVertical size={26} /><span>Gấp ngang</span></button>
      <button className="pc-tool" onClick={() => quick('d')} disabled={busy}><Triangle size={26} /><span>Gấp chéo</span></button>
      {tool === 'fold' && !preschool && <label className="pc-check"><input type="checkbox" checked={mountain} onChange={e => setMountain(e.target.checked)} /> Gấp ra sau</label>}
    </div>
    {toast && <div className="pc-toast" role="status">{toast}</div>}
    <div className="pc-bottom">
      <span className="pc-hint">{hint}</span>
      {bench.guide.length > 0 && <button className="pc-btn" onClick={helpCut} disabled={busy}><Wand2 size={20} /> Cắt giúp em</button>}
      <button className="pc-btn" onClick={() => bench.undo()} disabled={fresh || busy}><Undo2 size={20} /> Hoàn tác</button>
      <button className="pc-btn" onClick={() => newPaper(spec)} disabled={fresh || busy}><FilePlus2 size={20} /> Giấy mới</button>
      {!preschool && <button className="pc-btn" onClick={() => bench.unfoldOne()} disabled={!folded || busy}>Mở một nếp</button>}
      <button className="pc-btn pc-primary" onClick={() => bench.unfoldAll()} disabled={!folded || busy}><Sparkles size={20} /> Mở ra!</button>
    </div>
    {dev && <pre className="pc-dev-stats">{`fps ${s.fps.toFixed(0)} · biến dạng ${s.deformMs.toFixed(2)} ms · mặt nạ ${s.maskMs.toFixed(1)} ms · cắt ${s.cutMs.toFixed(1)} ms\n${s.folds} nếp · ${s.facets} facet · ${s.ops} thao tác`}</pre>}
    {panel === 'templates' && <TemplatePicker preschool={preschool} onPick={pickTemplate} onClose={() => setPanel(null)} />}
    {panel === 'notebook' && <Notebook scope={scope} onOpen={a => openArt(a)} onGuide={a => openArt(a, true)} onClose={() => setPanel(null)} />}
    {panel && typeof panel === 'object' && <ExportSheet spec={panel.spec} ops={panel.ops} name={panel.name} hero={panel.hero} onClose={() => setPanel(null)} onExported={() => { const r = onReward({ kind: 'guide' }); if (r.earned) setToast(`+${r.earned} ⭐ ${r.badges.map(b => `Huy hiệu mới: ${b}`).join(' ')}`); }} />}
  </div>;
}

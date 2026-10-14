import { BADGES, type BricksProgress, type BricksEvent } from '../progress/progress';
// Xưởng Lắp Ghép: Tủ Mô Hình ↔ màn lắp, tự lưu (plan mục 10, GĐ3).
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Copy, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { World } from '../engine/world';
import { decodeInto } from '../engine/model';
import { buildSteps, type Step } from '../export/steps';
import { Editor } from './Editor';
import { type BrickModel } from '../engine/model';
import { listModels, newModel, readModel, removeModel, saveModel, type ModelSummary } from '../progress/modelRepo';
import { IDEAS, ideasOfDay } from '../content/ideas';
import { SAMPLES, sampleModel, type Sample } from '../content/samples';
import type { Catalog } from '../engine/types';

let catalogPromise: Promise<Catalog> | null = null;
const loadCatalog = () => (catalogPromise ||= fetch(`${import.meta.env.BASE_URL}bricks/catalog.json`).then(r => { if (!r.ok) throw Error('Không tải được danh mục mảnh ghép.'); return r.json(); }).catch(e => { catalogPromise = null; throw e; }));
import './bricks.css';

const msg = (e: unknown) => (e instanceof Error ? e.message : 'Có lỗi khi lưu mô hình.');

function Thumb({ blob }: { blob?: Blob }) {
  const [url, setUrl] = useState('');
  useEffect(() => { if (!blob) { setUrl(''); return; } const u = URL.createObjectURL(blob); setUrl(u); return () => URL.revokeObjectURL(u); }, [blob]);
  return url ? <img src={url} alt="" /> : <div className="bk-thumb-ph">🧱</div>;
}

export interface BrickStudioProps { ownerId: string; preschool?: boolean; onExit: () => void; onModelSaved?: (count: number) => void; author?: string; progress?: BricksProgress; onProgress?: (event: BricksEvent) => void }

export function BrickStudio({ ownerId, preschool = false, onExit, onModelSaved, author, progress, onProgress }: BrickStudioProps) {
  const [list, setList] = useState<ModelSummary[] | null>(null);
  const [active, setActive] = useState<BrickModel | null>(null);
  const [guide, setGuide] = useState<{ source: World; steps: Step[] } | null>(null);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<ModelSummary | null>(null);

  const refresh = useCallback(async () => { try { const models = await listModels(ownerId); setList(models); onProgress?.({ type: 'models', count: models.length }); setError(''); } catch (e) { setError(msg(e)); setList([]); } }, [ownerId]);
  useEffect(() => { void refresh(); }, [refresh]);

  const create = async (name = 'Mô hình mới', idea?: string) => {
    try { const m = newModel(ownerId, name, idea); m.revision = await saveModel(m, 0); setActive(m); }
    catch (e) { setError(msg(e)); }
  };
  const open = async (id: string) => { try { const m = await readModel(ownerId, id); if (m) setActive(m); } catch (e) { setError(msg(e)); } };
  const duplicate = async (s: ModelSummary) => {
    try {
      const src = await readModel(ownerId, s.id); if (!src) return;
      const copy = { ...newModel(ownerId, (src.name + ' (bản sao)').slice(0, 40)), parts: src.parts, colors: src.colors, b: src.b, stats: src.stats };
      await saveModel(copy, 0); await refresh();
    } catch (e) { setError(msg(e)); }
  };
  const rename = async (s: ModelSummary) => {
    const name = window.prompt('Tên mô hình', s.name)?.trim().slice(0, 40);
    if (!name) return;
    try { const m = await readModel(ownerId, s.id); if (!m) return; await saveModel({ ...m, name, updated: Date.now() }, m.revision); await refresh(); } catch (e) { setError(msg(e)); }
  };
  /** "Lắp lại cho riêng em": chép mẫu thành mô hình của bé rồi mở luôn. */
  const fromSample = async (sm: Sample) => {
    try { const m = sampleModel(await loadCatalog(), sm, ownerId, crypto.randomUUID()); m.revision = await saveModel(m, 0); setActive(m); }
    catch (e) { setError(msg(e)); }
  };
  /** Lắp theo hướng dẫn: mô hình mới trống + các bước của mô hình nguồn (mẫu hoặc mô hình trong tủ). */
  const guided = async (src: BrickModel, label: string) => {
    try {
      const source = new World(await loadCatalog());
      decodeInto(source, src);
      const m = newModel(ownerId, (label + ' (theo hướng dẫn)').slice(0, 40), src.idea);
      m.revision = await saveModel(m, 0);
      setGuide({ source, steps: buildSteps(source) }); setActive(m);
    } catch (e) { setError(msg(e)); }
  };
  const guidedFromSample = async (sm: Sample) => guided(sampleModel(await loadCatalog(), sm, ownerId, 'tmp'), sm.name);
  const guidedFromModel = async (s: ModelSummary) => { const m = await readModel(ownerId, s.id); if (m) await guided(m, s.name); };
  const remove = async (s: ModelSummary) => { try { await removeModel(ownerId, s.id); setConfirmDelete(null); await refresh(); } catch (e) { setError(msg(e)); } };

  if (active) return <Editor key={active.id} model={active} onPlaced={event => onProgress?.(event)} preschool={preschool} author={author} guide={guide ?? undefined} onBack={() => { setActive(null); setGuide(null); void refresh(); }} onSaved={onModelSaved} />;

  const ideas = ideasOfDay(new Date(), 3);
  return (
    <div className="bk-cabinet">
      <div className="bk-cab-head">
        <button className="bk-btn" onClick={onExit} aria-label="Về Góc Thủ Công"><ArrowLeft size={22} /></button>
        <div><h1>Tủ Mô Hình</h1><p>Lắp ghép tự do — mỗi mô hình được tự lưu và đồng bộ theo tài khoản.</p></div>
        <button className="bk-btn bk-primary" onClick={() => create()}><Plus size={20} /> Mô hình mới</button>
      </div>
      {error && <div className="bk-cab-error" role="alert">{error}</div>}
      <section className="bk-ideas" aria-label="Ý tưởng hôm nay">
        <h2>Ý tưởng hôm nay</h2>
        <div>{ideas.map(i => <button key={i.id} className="bk-idea" onClick={() => create(i.name, i.id)}><span>{i.icon}</span>{i.name}</button>)}</div>
      </section>
      <section className="bk-samples" aria-label="Mô hình mẫu">
        <h2>Mẫu để lắp lại</h2>
        <div>{SAMPLES.map(sm => (
          <button key={sm.id} className="bk-sample" onClick={() => fromSample(sm)} aria-label={`Lắp lại ${sm.name} cho riêng em`}>
            <img src={`${import.meta.env.BASE_URL}bricks/samples/${sm.id}.webp`} alt="" loading="lazy" />
            <strong>{sm.name}</strong><small>Lắp lại cho riêng em</small>
          </button>))}</div>
        {false && <div className="bk-guided">{SAMPLES.map(sm => <button key={sm.id} className="bk-idea" onClick={() => guidedFromSample(sm)}><BookOpen size={18} /> {sm.name}: theo hướng dẫn</button>)}</div>}
      </section>
      <div className="bk-badges" aria-label="Huy hiệu lắp ghép">{progress?.badges.map(b => <span key={b}>🏅 {BADGES[b]}</span>)}</div>
      <h2 className="bk-shelf-title">Mô hình của em</h2>
      <section className="bk-shelf" aria-label="Mô hình của em">
        {list === null ? <p className="bk-muted">Đang mở tủ…</p> : !list.length ? <p className="bk-muted">Tủ còn trống. Bấm “Mô hình mới” hoặc chọn một ý tưởng để bắt đầu nhé!</p> :
          list.map(s => (
            <article key={s.id} className="bk-card">
              <button className="bk-card-open" onClick={() => open(s.id)} aria-label={`Mở ${s.name}`}>
                <Thumb blob={s.thumb} />
                <strong>{s.name}</strong>
                <small>{s.count} mảnh · {new Date(s.updated).toLocaleDateString('vi-VN')}</small>
              </button>
              <div className="bk-card-tools">
                <button className="bk-btn" onClick={() => rename(s)} aria-label="Đổi tên"><Pencil size={18} /></button>
                <button className="bk-btn" onClick={() => duplicate(s)} aria-label="Nhân bản"><Copy size={18} /></button>
                {false && <button className="bk-btn" onClick={() => guidedFromModel(s)} aria-label="Lắp lại theo hướng dẫn" title="Lắp lại theo hướng dẫn"><BookOpen size={18} /></button>}
                <button className="bk-btn" onClick={() => setConfirmDelete(s)} aria-label="Xoá"><Trash2 size={18} /></button>
              </div>
            </article>))}
      </section>
      {confirmDelete && (
        <div className="bk-dialog" role="dialog" aria-modal="true">
          <div>
            <p>Xoá mô hình <b>{confirmDelete.name}</b>? Không lấy lại được trên máy này.</p>
            <div className="bk-dialog-row"><button className="bk-btn" onClick={() => setConfirmDelete(null)}>Giữ lại</button><button className="bk-btn bk-danger" onClick={() => remove(confirmDelete)}>Xoá</button></div>
          </div>
        </div>)}
    </div>
  );
}

export { IDEAS };

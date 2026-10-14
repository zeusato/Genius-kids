import type { BricksEvent } from '../progress/progress';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { encodeWorld, type BrickModel } from '../engine/model';
import type { World } from '../engine/world';
import type { Step } from '../export/steps';
import { saveModel, saveThumb } from '../progress/modelRepo';
import { ModelSaveQueue } from '../progress/saveQueue';
import { Workbench, type WorkbenchControl } from './Workbench';
import { ExportSheet } from './ExportSheet';

export function Editor({ model, preschool, onBack, onSaved, author, guide, onPlaced }: { model: BrickModel; preschool: boolean; onBack: () => void; onSaved?: (count: number) => void; author?: string; onPlaced?: (event: BricksEvent) => void; guide?: { source: World; steps: Step[] } }) {
  const [exporting, setExporting] = useState(false);
  const control = useRef<WorkbenchControl | null>(null);
  const queue = useRef<ModelSaveQueue>(null!);
  if (!queue.current) queue.current = new ModelSaveQueue(model, saveModel);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const onSavedRef = useRef(onSaved); onSavedRef.current = onSaved;
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [name, setName] = useState(model.name);
  const nameRef = useRef(name); nameRef.current = name;
  const [error, setError] = useState('');
  const lastThumb = useRef(0);

  const flush = useCallback(async (withThumb = false) => {
    clearTimeout(timer.current); timer.current = undefined;
    const q = queue.current;
    if (mounted.current) setStatus('saving');
    try {
      await q.flush();
      if (mounted.current) { setStatus('saved'); setError(''); }
      onSavedRef.current?.(q.saved.stats.count);
    } catch (e) {
      if (mounted.current) { setStatus('error'); setError(e instanceof Error ? e.message : 'Chưa lưu được mô hình.'); }
      return false;
    }
    // A failed thumbnail must never turn a successful model save into a failed save.
    const c = control.current, saved = q.saved;
    if (c && (withThumb || Date.now() - lastThumb.current > 10000)) {
      lastThumb.current = Date.now();
      try { const blob = await c.thumbnail(); if (blob) await saveThumb(saved.ownerId, saved.id, saved.revision, blob); } catch { /* Recreate the preview on the next save. */ }
    }
    return true;
  }, []);

  const changed = useCallback(() => {
    const c = control.current; if (!c) return;
    const base = queue.current.latest;
    queue.current.update(encodeWorld(c.world, { ...base, name: nameRef.current.trim().slice(0, 40) || 'Mô hình mới', updated: Date.now() }));
    setStatus('saving');
    // Fixed maximum interval, rather than postponing forever during continuous building.
    if (timer.current === undefined) timer.current = setTimeout(() => void flush(), 1500);
  }, [flush]);

  useEffect(() => {
    mounted.current = true;
    const hide = () => { if (document.hidden) void flush(); };
    const leave = () => { void flush(); };
    const warn = (e: BeforeUnloadEvent) => { if (queue.current.dirty) { e.preventDefault(); e.returnValue = ''; void flush(); } };
    document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', leave); window.addEventListener('beforeunload', warn);
    return () => { mounted.current = false; document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', leave); window.removeEventListener('beforeunload', warn); clearTimeout(timer.current); void queue.current.flush().catch(() => {}); };
  }, [flush]);

  const backup = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(queue.current.latest)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'mo-hinh-chua-luu.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const back = async () => { changed(); if (await flush(true)) onBack(); };
  const header = <>
    <button className="bk-btn" onClick={() => void back()} aria-label="Về Tủ Mô Hình"><ArrowLeft size={22}/></button>
    <input className="bk-name" value={name} maxLength={40} onChange={e => { nameRef.current = e.target.value; setName(e.target.value); changed(); }} onBlur={() => setName(nameRef.current.trim() || 'Mô hình mới')} aria-label="Tên mô hình"/>
    <span className={`bk-save ${status}`} role="status">{status === 'saving' ? '● Đang lưu…' : status === 'error' ? '● Chưa lưu được' : '● Đã lưu'}</span>
    <button className="bk-btn bk-export-btn" onClick={async () => { changed(); if (await flush(true)) setExporting(true); }} aria-label="Xuất tài liệu lắp ghép"><FileText size={20}/> Xuất</button>
  </>;
  return <>
    <Workbench onPlaced={onPlaced} preschool={preschool} initial={model} header={header} control={control} coachKey={`bricks-coach-v1:${model.ownerId}`} guide={guide} onChange={changed}/>
    {error && <div className="bk-save-error" role="alert"><p>{error}</p><button onClick={() => void flush()}>Thử lưu lại</button><button onClick={backup}>Tải bản sao dự phòng</button></div>}
    {exporting && control.current && <ExportSheet world={control.current.world} lib={control.current.lib} name={queue.current.saved.name} author={author} onClose={() => setExporting(false)}/>}
  </>;
}

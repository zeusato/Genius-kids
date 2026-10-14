// Hộp thoại Xuất tài liệu lắp ghép (plan mục 11): PDF, ảnh trang, file cho người lớn.
import React, { useEffect, useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import type { World } from '../engine/world';
import type { PartLibrary } from '../render/loader';
import { buildDocument, type DocOutput } from '../export/pages';
import { toLdraw, toRebrickableCsv } from '../export/files';

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const safe = (s: string) => s.trim().replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) || 'mo-hinh';

export function ExportSheet({ world, lib, name, author, onClose }: { world: World; lib: PartLibrary; name: string; author?: string; onClose: () => void }) {
  const [progress, setProgress] = useState<[number, number]>([0, 1]);
  const [doc, setDoc] = useState<DocOutput | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    let alive = true; const abort = new AbortController();
    if (!world.pieces.size) { setError('Mô hình chưa có mảnh nào.'); return; }
    buildDocument({ world, lib, name, author, signal: abort.signal, onProgress: (d, t) => alive && setProgress([d, t]) })
      .then(d => { if (!alive) return; setDoc(d); setPreviews(d.pages.slice(0, 12).map(p => p.toDataURL('image/jpeg', 0.6))); })
      .catch(e => alive && setError(e instanceof Error ? e.message : 'Không tạo được tài liệu.'));
    return () => { alive = false; abort.abort(); };
  }, [world, lib, name, author]);

  const pdf = async () => { if (!doc) return; setBusy(true); try { save(await doc.pdf(), `${safe(name)}.pdf`); } catch { setError('Chưa tải được PDF. Hãy thử lại.'); } finally { setBusy(false); } };
  const pngs = async () => {
    if (!doc || busy) return;
    setBusy(true);
    try { for (let i = 0; i < doc.pages.length; i++) {
      const b = await new Promise<Blob | null>(r => doc.pages[i].toBlob(r, 'image/png'));
      if (b) save(b, `${safe(name)}-trang-${i + 1}.png`);
    } } catch { setError('Chưa lưu được ảnh trang.'); } finally { setBusy(false); }
  };
  const text = (s: string, file: string, type: string) => save(new Blob([s], { type }), file);

  return (
    <div className="bk-dialog bk-export" role="dialog" aria-modal="true" aria-label="Xuất tài liệu lắp ghép">
      <div>
        <div className="bk-export-head"><FileText size={22} /><strong>Tài liệu lắp ghép</strong><button className="bk-btn" onClick={onClose} aria-label="Đóng"><X size={20} /></button></div>
        {error ? <p className="bk-cab-error">{error}</p> : !doc ? (
          <div className="bk-progress"><span>Đang chụp hình và dựng trang… {Math.round((progress[0] / progress[1]) * 100)}%</span><i style={{ width: `${(progress[0] / progress[1]) * 100}%` }} /></div>
        ) : (
          <>
            <p className="bk-muted">{doc.pages.length} trang · {doc.bom.reduce((a, r) => a + r.qty, 0)} mảnh · {doc.steps.length} bước lắp{doc.bom.some(r => r.rare) ? ' · có màu hiếm (đánh dấu ⚠)' : ''}</p>
            <div className="bk-pages">{previews.map((u, i) => <img key={i} src={u} alt={`Trang ${i + 1}`} />)}</div>
            <div className="bk-dialog-row">
              <button className="bk-btn bk-primary" disabled={busy} onClick={pdf}><Download size={18} /> Tải PDF</button>
              <button className="bk-btn" disabled={busy} onClick={pngs}>Lưu ảnh từng trang</button>
            </div>
            <details className="bk-adult">
              <summary>Cho người lớn: file mua hàng và 3D</summary>
              <div className="bk-dialog-row">
                <button className="bk-btn" onClick={() => text(toLdraw(world, name, doc.steps), `${safe(name)}.ldr`, 'text/plain')}>LDraw (.ldr)</button>
                <button className="bk-btn" disabled={doc.bom.some(r => !r.rb || r.rbColor === null)} onClick={() => text(toRebrickableCsv(doc.bom), `${safe(name)}-rebrickable.csv`, 'text/csv')}>Rebrickable CSV</button>
              </div>
              <p className="bk-muted">File mua hàng chỉ khả dụng khi đã có đủ mã mảnh và màu được đối chiếu.</p>
            </details>
          </>
        )}
      </div>
    </div>
  );
}

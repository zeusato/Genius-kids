// Hộp thoại "Chia sẻ cách làm" (plan mục 7.4): PDF A4, ảnh thẻ PNG, Web Share khi có. Không in tên bé.
import { useEffect, useState } from 'react';
import { Download, FileText, Image as ImageIcon, Share2, X } from 'lucide-react';
import type { Op, PaperSpec } from '../model';
import { buildDocument, type DocOutput } from '../export/pages';

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const safe = (s: string) => s.trim().replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) || 'cat-giay';
const toBlob = (c: HTMLCanvasElement, type = 'image/png') => new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(Error('Không tạo được ảnh.'))), type, 0.92));

export function ExportSheet({ spec, ops, name, hero, onClose, onExported }: { spec: PaperSpec; ops: readonly Op[]; name: string; hero: HTMLCanvasElement | null; onClose: () => void; onExported: () => void }) {
  const [doc, setDoc] = useState<DocOutput | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true; const abort = new AbortController();
    buildDocument({ spec, ops, name, hero, signal: abort.signal })
      .then(d => { if (!alive) return; setDoc(d); setPreviews(d.pages.map(p => { const c = document.createElement('canvas'); c.width = 248; c.height = 351; c.getContext('2d')!.drawImage(p, 0, 0, 248, 351); return c.toDataURL('image/jpeg', 0.7); })); })
      .catch(e => alive && (e as Error)?.name !== 'AbortError' && setError(e instanceof Error ? e.message : 'Không tạo được tài liệu.'));
    return () => { alive = false; abort.abort(); };
  }, [spec, ops, name, hero]);

  const run = async (f: () => Promise<void>) => { if (!doc || busy) return; setBusy(true); setError(''); try { await f(); onExported(); } catch (e) { if ((e as Error)?.name !== 'AbortError') setError('Chưa làm được. Em thử lại nhé.'); } finally { setBusy(false); } };
  const pdfFile = () => new File([doc!.pdf()], `${safe(name)}.pdf`, { type: 'application/pdf' });
  const canShare = typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] });

  return <div className="pc-modal" role="dialog" aria-modal="true" aria-label="Chia sẻ cách làm" onPointerDown={e => e.target === e.currentTarget && onClose()}>
    <div className="pc-sheet">
      <header><h2><FileText size={22} /> Chia sẻ cách làm</h2><button className="pc-btn pc-round" onClick={onClose} aria-label="Đóng"><X size={20} /></button></header>
      <p className="pc-sub">Tài liệu có các bước gấp, cắt và mẫu in đúng kích thước thật để bạn em làm theo.</p>
      {error && <p className="pc-error">{error}</p>}
      {!doc && !error && <p className="pc-sub">Đang chuẩn bị tài liệu…</p>}
      {doc && <>
        <div className="pc-pages">{previews.map((src, i) => <img key={i} src={src} alt={`Trang ${i + 1}`} />)}</div>
        <div className="pc-actions">
          <button className="pc-btn pc-primary" disabled={busy} onClick={() => run(async () => save(pdfFile(), `${safe(name)}.pdf`))}><Download size={20} /> Tải PDF</button>
          <button className="pc-btn" disabled={busy} onClick={() => run(async () => save(await toBlob(doc.card()), `${safe(name)}.png`))}><ImageIcon size={20} /> Tải ảnh</button>
          {canShare && <button className="pc-btn" disabled={busy} onClick={() => run(async () => { await navigator.share({ files: [pdfFile()], title: name }); })}><Share2 size={20} /> Chia sẻ</button>}
        </div>
      </>}
    </div>
  </div>;
}

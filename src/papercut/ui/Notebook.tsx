// Sổ Cắt Giấy (plan mục 3 "Những lần quay lại"): lưới tác phẩm đã cất; mở làm tiếp, chia sẻ cách làm, xoá.
import { useEffect, useState } from 'react';
import { BookOpen, FileText, Pencil, Trash2, X } from 'lucide-react';
import type { ArtworkSummary, PapercutArtwork, Scope } from '../model';
import { listArtworks, readArtwork, removeArtwork } from '../persistence/repository';

export function Notebook({ scope, onOpen, onGuide, onClose }: { scope: Scope; onOpen: (a: PapercutArtwork) => void; onGuide: (a: PapercutArtwork) => void; onClose: () => void }) {
  const [items, setItems] = useState<ArtworkSummary[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');

  const refresh = () => listArtworks(scope).then(setItems).catch(() => { setItems([]); setError('Chưa mở được sổ.'); });
  useEffect(() => { void refresh(); }, [scope.account, scope.student]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const it of items ?? []) if (it.thumb) map[it.id] = URL.createObjectURL(it.thumb);
    setUrls(map);
    return () => Object.values(map).forEach(URL.revokeObjectURL);
  }, [items]);

  const open = async (id: string, then: (a: PapercutArtwork) => void) => {
    try { const a = await readArtwork(scope, id); if (a) then(a); } catch { setError('Tác phẩm này bị hỏng, không mở được.'); }
  };
  const remove = async (id: string) => { if (confirm !== id) { setConfirm(id); return; } setConfirm(null); await removeArtwork(scope, id).catch(() => setError('Chưa xoá được.')); void refresh(); };

  return <div className="pc-modal" role="dialog" aria-modal="true" aria-label="Sổ Cắt Giấy" onPointerDown={e => e.target === e.currentTarget && onClose()}>
    <div className="pc-sheet pc-wide">
      <header><h2><BookOpen size={22} /> Sổ Cắt Giấy</h2><button className="pc-btn pc-round" onClick={onClose} aria-label="Đóng"><X size={20} /></button></header>
      {error && <p className="pc-error">{error}</p>}
      {items === null && <p className="pc-sub">Đang mở sổ…</p>}
      {items?.length === 0 && <p className="pc-sub">Sổ còn trống. Cắt xong một tác phẩm rồi bấm “Cất vào sổ” nhé!</p>}
      <div className="pc-grid">
        {items?.map(it => <article key={it.id} className="pc-card">
          {urls[it.id] ? <img src={urls[it.id]} alt="" /> : <div className="pc-noimg" />}
          <strong>{it.name}</strong>
          <span className="pc-sub">{new Date(it.updatedAt).toLocaleDateString('vi-VN')}</span>
          <div className="pc-card-actions">
            <button className="pc-btn" onClick={() => open(it.id, onOpen)}><Pencil size={18} /> Làm tiếp</button>
            <button className="pc-btn" onClick={() => open(it.id, onGuide)} aria-label="Chia sẻ cách làm"><FileText size={18} /></button>
            <button className={`pc-btn${confirm === it.id ? ' pc-danger' : ''}`} onClick={() => remove(it.id)} aria-label="Xoá">{confirm === it.id ? 'Xoá thật?' : <Trash2 size={18} />}</button>
          </div>
        </article>)}
      </div>
    </div>
  </div>;
}

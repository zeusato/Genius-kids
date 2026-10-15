// Cửa sổ xem mảnh (plan mục 7.1): nhấn giữ thẻ trong khay → mảnh xoay 3D, tên, kích thước thật, giọng đọc.
// Ảnh xoay vẽ sẵn bằng renderer phụ dùng chung (không tạo WebGL context mới — bẫy Safari mục 17).
import React, { useEffect, useState } from 'react';
import type { Catalog } from '../engine/types';
import type { IconRenderer } from '../render/icons';
import { speak, cancelSpeech } from '../../utils/speech';
import { useDialog } from './useDialog';

const cm = (ldu: number) => (ldu * 0.04).toLocaleString('vi-VN', { maximumFractionDigits: 1 });

export function partSizeText(catalog: Catalog, part: string) {
  const [lo, hi] = catalog.parts[part].bbox;
  return `${cm(hi[0] - lo[0])} × ${cm(hi[2] - lo[2])} × ${cm(hi[1] - lo[1])} cm`;
}

export function PartViewer({ part, color, catalog, icons, onClose, onChoose }: { part: string; color: string; catalog: Catalog; icons: IconRenderer; onClose: () => void; onChoose: () => void }) {
  const ref = useDialog<HTMLDivElement>(onClose);
  const [frames, setFrames] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const def = catalog.parts[part], colorName = catalog.palette.find(c => c.key === color)?.nameVi ?? '';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    let alive = true;
    void icons.turntable(part, color, reduced ? 1 : 16).then(f => alive && setFrames(f.filter(Boolean)));
    speak(def.name);
    return () => { alive = false; cancelSpeech(); };
  }, [part, color]);
  useEffect(() => {
    if (frames.length < 2) return;
    const t = window.setInterval(() => setI(v => (v + 1) % frames.length), 140);
    return () => window.clearInterval(t);
  }, [frames]);
  return (
    <div className="bk-dialog bk-viewer" role="dialog" aria-modal="true" aria-label={`Xem mảnh ${def.name}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} tabIndex={-1}>
        <div className="bk-export-head"><strong>{def.name}</strong><button className="bk-btn" onClick={onClose} aria-label="Đóng">✕</button></div>
        <div className="bk-viewer-stage">{frames.length ? <img src={frames[i % frames.length]} alt={def.name} /> : <span className="bk-muted">Đang vẽ mảnh…</span>}</div>
        <p>Kích thước thật: <b>{partSizeText(catalog, part)}</b>{colorName && <> · màu <b>{colorName}</b></>}</p>
        <p className="bk-muted">Mã mảnh: {def.ldraw ?? part}</p>
        <div className="bk-dialog-row">
          <button className="bk-btn" onClick={() => speak(`${def.name}. Kích thước ${partSizeText(catalog, part).replace(/×/g, 'nhân')}`)} aria-label="Nghe tên mảnh">🔊 Nghe</button>
          <button className="bk-btn ok" onClick={onChoose}>Chọn mảnh này</button>
        </div>
      </div>
    </div>
  );
}

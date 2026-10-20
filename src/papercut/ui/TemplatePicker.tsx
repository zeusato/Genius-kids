// Chọn mẫu gợi ý (plan mục 8). Ảnh xem trước vẽ 2D từ chính công thức của mẫu.
import { useEffect, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import { TEMPLATES, type Template } from '../content/templates';
import { drawStep } from '../export/diagrams';
import { buildSteps } from '../export/steps';

function Preview({ t }: { t: Template }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const g = c.getContext('2d')!, steps = buildSteps(t.spec, t.ops());
    g.clearRect(0, 0, c.width, c.height);
    drawStep(g, steps[steps.length - 1], t.spec, { x: 0, y: 0, w: c.width, h: c.height }, 1.5);
  }, [t]);
  return <canvas ref={ref} width={240} height={180} />;
}

export function TemplatePicker({ preschool, onPick, onClose }: { preschool: boolean; onPick: (t: Template) => void; onClose: () => void }) {
  const list = preschool ? TEMPLATES.filter(t => t.id !== 'flower8' && t.id !== 'people') : TEMPLATES;
  return <div className="pc-modal" role="dialog" aria-modal="true" aria-label="Chọn mẫu" onPointerDown={e => e.target === e.currentTarget && onClose()}>
    <div className="pc-sheet pc-wide">
      <header><h2><Sparkles size={22} /> Làm theo mẫu</h2><button className="pc-btn pc-round" onClick={onClose} aria-label="Đóng"><X size={20} /></button></header>
      <p className="pc-sub">App gấp giúp em, em cắt theo nét chấm. Muốn cắt khác cũng được nhé!</p>
      <div className="pc-grid">
        {list.map(t => <button key={t.id} className="pc-card pc-pick" onClick={() => onPick(t)}>
          <Preview t={t} />
          <strong>{t.name}</strong>
          <span className="pc-sub">{t.hint}</span>
        </button>)}
      </div>
    </div>
  </div>;
}

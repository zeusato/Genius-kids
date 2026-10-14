// Trang thử chế độ "Lắp theo hướng dẫn": ?guide=<id mẫu>[&auto=N] — auto chạm đúng N mảnh đích đầu tiên.
import React, { useEffect, useState } from 'react';
import { Workbench } from './ui/Workbench';
import { World } from './engine/world';
import { History } from './engine/history';
import { SAMPLES, buildSample } from './content/samples';
import { buildSteps, type Step } from './export/steps';
import type { Catalog } from './engine/types';

export function GuidePreview({ id, auto }: { id: string; auto: number }) {
  const [guide, setGuide] = useState<{ source: World; steps: Step[] } | null>(null);
  useEffect(() => {
    void fetch(`${import.meta.env.BASE_URL}bricks/catalog.json`).then(r => r.json()).then((c: Catalog) => {
      const source = new World(c); buildSample(source, new History(source), SAMPLES.find(s => s.id === id)!);
      setGuide({ source, steps: buildSteps(source) });
    });
  }, [id]);
  useEffect(() => {
    if (!guide || !auto) return;
    let n = 0;
    const step = () => {
      const lab = (window as any).__bricksLab, api = lab?.api();
      if (!api) { setTimeout(step, 200); return; }
      // chọn mảnh đích đầu tiên còn lại qua khay, rồi chạm vào vị trí của nó
      const cards = [...document.querySelectorAll<HTMLButtonElement>('.bk-part')];
      const card = cards[0]; if (!card) { document.title = 'done:' + n; return; }
      const r0 = card.getBoundingClientRect();
      const fire = (el: Element, type: string, x: number, y: number) => el.dispatchEvent(new PointerEvent(type, { pointerId: 50 + n, clientX: x, clientY: y, pointerType: 'mouse', bubbles: true }));
      fire(card, 'pointerdown', r0.x + 10, r0.y + 10); document.dispatchEvent(new PointerEvent('pointerup', { pointerId: 50 + n, clientX: r0.x + 10, clientY: r0.y + 10, bubbles: true }));
      setTimeout(() => {
        const name = card.getAttribute('aria-label');
        const t = [...guide.source.pieces.values()].find(p => lab.world && lab.lib.catalog.parts[p.part].name === name && ![...lab.world.pieces.values()].some((q: any) => q.pos.join() === p.pos.join()));
        if (!t) { document.title = 'notarget'; return; }
        const st = document.querySelector('.bk-stage')!, r = st.getBoundingClientRect();
        const s = api.project([(t.bbox[0] + t.bbox[3]) / 2, t.bbox[1] + 1, (t.bbox[2] + t.bbox[5]) / 2]);
        fire(st, 'pointerdown', r.left + s.x, r.top + s.y); fire(st, 'pointerup', r.left + s.x, r.top + s.y);
        n++;
        if (n < auto) setTimeout(step, 400); else setTimeout(() => { document.title = 'placed:' + lab.world.pieces.size; }, 300);
      }, 400);
    };
    setTimeout(step, 1500);
  }, [guide, auto]);
  if (!guide) return null;
  return <Workbench lab guide={guide} onGuideDone={() => (document.title = 'guide-done')} />;
}

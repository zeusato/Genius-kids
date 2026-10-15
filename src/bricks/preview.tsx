// Trang thử GĐ1 (chỉ chạy ở dev): /Genius-kids/bricks-preview.html
//   ?be=1   chế độ bé      ?demo=1   tự dựng cảnh mẫu (để chụp ảnh kiểm tra)      ?q=low|mid|high   mức chất lượng
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Workbench } from './ui/Workbench';
import { buildDemo } from './demo';
import { suggest } from './engine/place';
import { pick } from './engine/pick';
import { SAMPLES, buildSample } from './content/samples';
import { buildDocument } from './export/pages';
import { GuidePreview } from './previewGuide';

const params = new URLSearchParams(location.search);
// ?shot=1: ẩn giao diện, chỉ để khung 3D (chụp ảnh bìa)
if (params.get('shot') === '1') { const s = document.createElement('style'); s.textContent = '.bk-top,.bk-modes,.bk-tray,.bk-held,.bk-float,.bk-toast{display:none!important}'; document.head.appendChild(s); }
if (import.meta.env.DEV && params.get('guide'))
  createRoot(document.getElementById('root')!).render(<GuidePreview id={params.get('guide')!} auto={Number(params.get('auto') || 0)} />);
else if (import.meta.env.DEV)
  createRoot(document.getElementById('root')!).render(
    <Workbench lab preschool={params.get('be') === '1'} initialQuality={(params.get('q') as any) || undefined}
      onReady={w => {
        (window as any).__bricks = w;
        if (params.get('demo') !== '1') return;
        const wait = () => {
          const lab = (window as any).__bricksLab;
          if (!lab?.history) { setTimeout(wait, 50); return; }
          void lab.lib.ensureGroups(lab.lib.catalog.groups.map((g: any) => g.id)).then(() => {
            // ?demo=1&samples=1: bày 10 mẫu thành lưới 5×2 để duyệt
            const one = params.get('sample');
            const log = params.get('base') === '1'
              // ?demo=1&base=1: đế 32×32, trên đó ngôi nhà + chú vịt (kiểm nhóm Tấm nền)
              ? ((): string[] => {
                const put = (part: string, color: string, x: number, z: number) => { const s = suggest(lab.world, part, 0, pick(lab.world, [x, -4000, z], [0, 1, 0])!).best; if (s?.ok) lab.history.place(part, color, s.pos, s.o, s.lift); return s?.ok ? [] : [part + ': ' + s?.reason]; };
                return [...put('3811', 'bright-green', 0, 0), ...put('91405', 'tan', -150, 150),
                  ...buildSample(lab.world, lab.history, SAMPLES.find(s => s.id === 'nha')!, -150, -130), ...buildSample(lab.world, lab.history, SAMPLES.find(s => s.id === 'vit')!, 150, 50)];
              })()
              : one
              ? buildSample(lab.world, lab.history, SAMPLES.find(s => s.id === one)!)
              : params.get('samples') === '1'
              ? SAMPLES.flatMap((s, i) => buildSample(lab.world, lab.history, s, (i % 5 - 2) * 220, (Math.floor(i / 5) - 0.5) * 240).map(f => s.id + ': ' + f))
              : buildDemo(lab.world, lab.history);
            lab.bump();
            (window as any).__demoLog = log;
            lab.api()?.angle(35, 58, false);
            setTimeout(() => { const ws = [...lab.world.pieces.values()]; let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (const p of ws) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p.bbox[i]); hi[i] = Math.max(hi[i], p.bbox[i + 3]); } lab.api()?.angle(35, 58, false); lab.api()?.fit([lo, hi], false); document.title = 'demo-ready';
              // ?tap=select: chạm giả lập vào mảnh đầu tiên ở chế độ Chọn (kiểm bong bóng)
              if (params.get('tap') === 'select') setTimeout(() => {
                const btn = [...document.querySelectorAll<HTMLButtonElement>('.bk-mode')].find(b => b.textContent?.includes('Chọn')); btn?.click();
                setTimeout(() => {
                  const st = document.querySelector('.bk-stage')!, r = st.getBoundingClientRect();
                  const target = [...lab.world.pieces.values()][2];
                  const s = lab.api()!.project([(target.bbox[0] + target.bbox[3]) / 2, target.bbox[1] + 2, (target.bbox[2] + target.bbox[5]) / 2]);
                  const fire = (type: string) => st.dispatchEvent(new PointerEvent(type, { pointerId: 9, clientX: r.left + s.x, clientY: r.top + s.y, pointerType: 'mouse', bubbles: true }));
                  fire('pointerdown'); fire('pointerup');
                  setTimeout(() => { document.title = 'bubble:' + document.querySelectorAll('.bk-bubble .bk-btn').length; }, 300);
                }, 300);
              }, 500);
              // ?explode=0.7: kéo thanh Nổ tung (kiểm hiệu ứng)
              const ex = params.get('explode');
              if (ex) setTimeout(() => { const el = document.querySelector<HTMLInputElement>('.bk-explode input')!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, ex); el.dispatchEvent(new Event('input', { bubbles: true })); }, 400);
              // ?page=N: dựng tài liệu lắp ghép rồi hiện trang N (để chụp kiểm tra)
              const pg = params.get('page');
              if (pg) void buildDocument({ world: lab.world, lib: lab.lib, name: SAMPLES.find(s => s.id === one)?.name ?? 'Mô hình thử', author: 'Bé thử' }).then(d => {
                const c = d.pages[Math.min(Number(pg), d.pages.length) - 1];
                document.body.innerHTML = ''; document.body.style.margin = '0'; c.style.display = 'block'; document.body.appendChild(c); document.title = 'pages:' + d.pages.length;
              });
            }, 900);
          });
        };
        wait();
      }} />);

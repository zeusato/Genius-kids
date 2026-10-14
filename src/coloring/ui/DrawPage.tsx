import React, { useRef, useState, useEffect } from 'react';
import type { Page } from '../model';
type Shape = 'pen' | 'circle' | 'square' | 'heart' | 'star';
type Mark = {
    shape: Shape;
    pts: number[];
};
const SIZE = 2048;
export function DrawPage({ onReady, onBack }: {
    onReady: (page: Page, labels: Uint16Array) => void;
    onBack: () => void;
}) {
    const canvas = useRef<HTMLCanvasElement>(null), drawing = useRef<Mark | null>(null), worker = useRef<Worker | null>(null), marks = useRef<Mark[]>([]);
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [shape, setShape] = useState<Shape>('pen'), [count, setCount] = useState(0);
    function render() {
        const ctx = canvas.current!.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.strokeStyle = '#182b36';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const m of [...marks.current, ...(drawing.current ? [drawing.current] : [])]) {
            const [x, y] = m.pts;
            ctx.beginPath();
            if (m.shape === 'pen') {
                ctx.moveTo(x, y);
                for (let i = 2; i < m.pts.length; i += 2)
                    ctx.lineTo(m.pts[i], m.pts[i + 1]);
            }
            else if (m.shape === 'circle')
                ctx.arc(x, y, 180, 0, Math.PI * 2);
            else if (m.shape === 'square')
                ctx.rect(x - 180, y - 180, 360, 360);
            else if (m.shape === 'heart') {
                ctx.moveTo(x, y + 160);
                ctx.bezierCurveTo(x - 370, y - 70, x - 160, y - 290, x, y - 120);
                ctx.bezierCurveTo(x + 160, y - 290, x + 370, y - 70, x, y + 160);
                ctx.closePath();
            }
            else {
                for (let i = 0; i < 10; i++) {
                    const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 90 : 200;
                    if (i)
                        ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
                    else
                        ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
                }
                ctx.closePath();
            }
            ctx.stroke();
        }
    }
    useEffect(() => { const c = canvas.current!; render(); return () => { worker.current?.terminate(); c.width = c.height = 0; }; }, []);
    const point = (e: React.PointerEvent) => { const r = e.currentTarget.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * SIZE, (e.clientY - r.top) / r.height * SIZE]; };
    const done = () => {
        if (busy)
            return;
        setBusy(true);
        setError('');
        const rgba = canvas.current!.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data, gray = new Uint8Array(SIZE ** 2);
        for (let i = 0; i < gray.length; i++)
            gray[i] = rgba[i * 4];
        worker.current = new Worker(new URL('../workers/label.worker.ts', import.meta.url), { type: 'module' });
        worker.current.onmessage = ({ data }) => { setBusy(false); worker.current?.terminate(); if (data.error) {
            setError(data.error);
            return;
        } if (!data.regions.some((r: {
            bg: boolean;
            area: number;
        }) => !r.bg && r.area > 100)) {
            setError('Em khép kín một hình hoặc dùng con dấu để có vùng tô nhé.');
            return;
        } onReady({ id: 'draw-' + Date.now(), title: 'Tranh em tự vẽ', book: 'generated', tier: 'medium', scene: 'garden', count: data.regions.length, version: 1, rev: '1', size: SIZE, regions: data.regions, ink: data.ink }, data.labels); };
        worker.current.onerror = () => { worker.current?.terminate(); setBusy(false); setError('Chưa tách được vùng. Thử lại nhé.'); };
        worker.current.postMessage({ gray, size: SIZE }, [gray.buffer]);
    };
    return <div className="cs-draw"><div className="cs-row"><button className="cs-btn" onClick={onBack}>← Xưởng vẽ</button><h1>Vẽ rồi tô</h1><button className="cs-btn cs-primary" disabled={busy || !count} onClick={done}>{busy ? 'Đang tìm vùng…' : 'Tô tranh của em'}</button></div><p>Vẽ các nét khép kín hoặc chọn con dấu rồi chạm vào giấy.</p><div className="cs-books">{Object.entries({ pen: '✎ Bút nét', circle: '○ Hình tròn', square: '□ Hình vuông', heart: '♡ Trái tim', star: '☆ Ngôi sao' }).map(([k, v]) => <button key={k} disabled={busy} aria-pressed={shape === k} onClick={() => setShape(k as Shape)}>{v}</button>)}<button disabled={busy || !count} onClick={() => { marks.current.pop(); setCount(marks.current.length); render(); }}>↶ Hoàn tác</button></div><canvas ref={canvas} width={SIZE} height={SIZE} onPointerDown={e => { if (busy || drawing.current)
        return; e.currentTarget.setPointerCapture(e.pointerId); drawing.current = { shape, pts: point(e) }; render(); }} onPointerMove={e => { if (!drawing.current || drawing.current.shape !== 'pen')
        return; drawing.current.pts.push(...point(e)); render(); }} onPointerUp={() => { if (drawing.current) {
        marks.current.push(drawing.current);
        drawing.current = null;
        setCount(marks.current.length);
        render();
    } }} onPointerCancel={() => { drawing.current = null; render(); }}/>{error && <p role="alert">{error}</p>}</div>;
}

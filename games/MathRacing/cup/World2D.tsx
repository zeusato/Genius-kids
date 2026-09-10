import React, { useEffect, useRef } from 'react';
import { GATE, KARTS, Region, SEGMENT, Session } from './model';
import { activeQuestion, finishDistance } from './engine';
import { roadX } from './track';
import { FrameDriver, rivalOpacity } from './motion';
export default function World2D({ live, onFrame, region, kart, garage, reduced }: { live: React.MutableRefObject<Session | null>; onFrame: FrameDriver; region: Region; kart: number; garage?: boolean; reduced: boolean }) {
    const canvas = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const el = canvas.current!, ctx = el.getContext('2d'); if (!ctx) return;
        let frame = 0;
        const car = (x: number, y: number, size: number, color: string) => {
            ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
            ctx.fillStyle = '#2d4344'; ctx.beginPath(); ctx.ellipse(0, 24, 40, 12, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillRect(-39, -12, 14, 30); ctx.fillRect(25, -12, 14, 30);
            ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-33, -22, 66, 45, 13); ctx.fill();
            ctx.fillStyle = '#e6d7ae'; ctx.fillRect(-30, 8, 60, 7);
            ctx.fillStyle = '#35474b'; ctx.beginPath(); ctx.roundRect(-20, -40, 40, 30, 12); ctx.fill();
            ctx.fillStyle = '#54a7a0'; ctx.beginPath(); ctx.arc(0, -42, 19, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffdc83'; ctx.fillRect(-3, -60, 6, 25); ctx.fillStyle = '#e78668'; ctx.fillRect(-27, 0, 10, 6); ctx.fillRect(17, 0, 10, 6); ctx.restore();
        };
        const draw = (now: number) => {
            const poses = onFrame(now).racers;
            const w = el.clientWidth, h = el.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) { el.width = Math.round(w * dpr); el.height = Math.round(h * dpr); }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
            const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, region === 'city' ? '#c7b7dd' : '#cee8e9'); sky.addColorStop(1, '#faf0cf'); ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#fae3a1'; ctx.beginPath(); ctx.arc(w * .77, h * .19, 33, 0, Math.PI * 2); ctx.fill();
            for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#8db2a4' : '#afc7ac'; ctx.beginPath(); ctx.ellipse(i * w / 5, h * .41, w * .25, h * (.12 + i % 2 * .04), 0, 0, Math.PI * 2); ctx.fill(); }
            ctx.fillStyle = region === 'coast' ? '#ead5a3' : region === 'city' ? '#a5a9c3' : '#a8c689'; ctx.fillRect(0, h * .4, w, h * .6);
            const s = live.current, d = poses[0]?.distance || 0;
            const project = (at: number, offset = 0) => { const z = Math.max(-11, at - d), scale = 26 / (z + 26); return { x: w / 2 + (roadX(at) - roadX(d)) * w * .018 * scale + offset * w * .06 * scale, y: h * .39 + h * .6 * scale, k: scale }; };
            for (let z = 320; z >= 0; z -= 4) {
                const a = project(d + z), b = project(d + z + 4), half = w * .39;
                for (const [mul, color] of [[1.08, Math.floor((d + z) / 8) % 2 ? '#e69475' : '#f7e8be'], [1, '#557478']] as const) {
                    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(a.x - half * a.k * mul, a.y); ctx.lineTo(a.x + half * a.k * mul, a.y); ctx.lineTo(b.x + half * b.k * mul, b.y); ctx.lineTo(b.x - half * b.k * mul, b.y); ctx.fill();
                }
                if (Math.floor((d + z) / 6) % 2) for (const lane of [-1, 1]) { ctx.strokeStyle = '#e9dfb8'; ctx.lineWidth = 2.5 * a.k; ctx.beginPath(); ctx.moveTo(a.x + lane * half / 3 * a.k, a.y); ctx.lineTo(b.x + lane * half / 3 * b.k, b.y); ctx.stroke(); }
            }
            if (garage) { car(w * .5, h * .65, Math.min(w / 160, h / 160), KARTS[kart].color); }
            else if (s) {
                const qi = activeQuestion(s);
                if (qi >= 0) { const p = project(qi * SEGMENT + GATE); s.questions[qi].options.forEach((v, lane) => { const x = p.x + (lane - 1) * w * .25 * p.k, width = Math.max(30, 88 * p.k); ctx.fillStyle = '#fff3d3'; ctx.beginPath(); ctx.roundRect(x - width / 2, p.y - width * 1.25, width, width * .7, 4); ctx.fill(); ctx.fillStyle = '#23464a'; ctx.font = `bold ${Math.max(16, 40 * p.k)}px system-ui`; ctx.textAlign = 'center'; ctx.fillText(String(v), x, p.y - width * .78, width * .88); }); }
                for (const o of s.objects.filter(o => !o.hit && o.at > d && o.at - d < 220)) { const p = project(o.at, (o.lane - 1) * 4); ctx.fillStyle = o.type === 'cone' ? '#e78f65' : '#f7cb56'; ctx.beginPath(); ctx.moveTo(p.x, p.y - 38 * p.k); ctx.lineTo(p.x + 15 * p.k, p.y); ctx.lineTo(p.x - 15 * p.k, p.y); ctx.fill(); }
                if (s.config.mode !== 'practice') poses.slice(1).map((r, i) => ({ r, i })).sort((a, b) => b.r.distance - a.r.distance).forEach(({ r, i }) => { const opacity = rivalOpacity(r.distance - d); if (opacity > .001) { const p = project(r.distance, (r.lane - 1) * 4); ctx.globalAlpha = opacity; car(p.x, p.y, p.k * 1.4, ['#dc9386', '#aa99ce', '#799fc7'][i]); ctx.globalAlpha = 1; } });
                car(w / 2 + (poses[0].lane - 1) * w * .25, h * .88, Math.min(w / 400, 1.7), KARTS[kart].color);
                if (finishDistance(s) - d < 200) { const p = project(finishDistance(s)); ctx.fillStyle = '#eed18e'; ctx.fillRect(p.x - w * .38 * p.k, p.y - 100 * p.k, w * .76 * p.k, 16 * p.k); }
            }
            frame = requestAnimationFrame(draw);
        };
        frame = requestAnimationFrame(draw); return () => cancelAnimationFrame(frame);
    }, [live, onFrame, region, kart, garage, reduced]);
    return <canvas ref={canvas} style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden="true"/>;
}

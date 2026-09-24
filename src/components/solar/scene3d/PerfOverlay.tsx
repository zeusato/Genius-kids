import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

// ?debug=perf — bảng draw call / tam giác / fps / texture, đọc renderer.info (cộng dồn qua
// các pass của composer). Ghi thẳng vào một div cố định, không setState.
export function PerfOverlay({ tier }: { tier: string }) {
    const gl = useThree((s) => s.gl);
    const el = useRef<HTMLDivElement | null>(null);
    const acc = useRef({ frames: 0, calls: 0, tris: 0, points: 0, t0: performance.now() });

    useEffect(() => {
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;top:72px;right:12px;z-index:9999;font:11px/1.4 ui-monospace,monospace;color:#9ff;background:rgba(0,0,0,.72);padding:6px 8px;border-radius:8px;pointer-events:none;white-space:pre';
        document.body.appendChild(div);
        el.current = div;
        gl.info.autoReset = false;
        return () => {
            gl.info.autoReset = true;
            div.remove();
        };
    }, [gl]);

    useFrame(() => {
        const a = acc.current;
        a.frames++;
        a.calls += gl.info.render.calls;
        a.tris += gl.info.render.triangles;
        a.points += gl.info.render.points;
        gl.info.reset();
        const now = performance.now();
        if (now - a.t0 > 500 && el.current) {
            const f = a.frames;
            el.current.textContent =
                `tier ${tier}  ${(f / ((now - a.t0) / 1000)).toFixed(0)} fps\n` +
                `calls ${(a.calls / f).toFixed(0)}  tris ${(a.tris / f / 1000).toFixed(1)}k  pts ${(a.points / f / 1000).toFixed(1)}k\n` +
                `tex ${gl.info.memory.textures}  geo ${gl.info.memory.geometries}  dpr ${gl.getPixelRatio()}`;
            a.frames = a.calls = a.tris = a.points = 0;
            a.t0 = now;
        }
        // priority ÂM: priority dương làm R3F tắt tự render (tier thấp không có composer sẽ đen màn).
        // Chạy đầu frame → số liệu là của các lần render frame trước.
    }, -1000);

    return null;
}

import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { newPart, PartKind, postIds, postPosition } from '../engine/circuit';
import { startSimulation } from '../engine/simulation';
import { emptyCircuit } from '../engine/circuit';
import { getPartIcons, setPartIcons } from './icons';
import { materials } from './materials';
import { GEO } from './parts/geometry';
import { Emitters, LiveState, PartModel } from './parts/PartModel';

const KINDS: PartKind[] = ['battery', 'bulb', 'switch', 'button', 'bell', 'buzzer', 'motor', 'led', 'resistor', 'rheostat', 'ammeter', 'voltmeter', 'fuse', 'electromagnet', 'generator', 'lemon', 'potato', 'sample', 'spdt', 'junction'];
const CELL_W = 176, CELL_H = 136, SPACING = 6;

/**
 * Chụp icon hộp đồ nghề từ chính mô hình linh kiện ("icon render từ chính mô hình"): dựng các mô hình trong một
 * scene riêng, vẽ lần lượt vào render target nhỏ, đọc pixel ra PNG. Chạy một lần mỗi phiên, sau khi bàn đã sẵn sàng.
 */
export function IconBaker() {
    const gl = useThree(s => s.gl), mainScene = useThree(s => s.scene);
    const scene = useMemo(() => { const s = new THREE.Scene(); s.background = null; return s; }, []);
    const live = useRef<LiveState>({ sim: () => sim, night: false, hdr: false, reduced: true, morph: 0 });
    const sim = useMemo(() => startSimulation(emptyCircuit('icons')), []);
    const emitters = useMemo<Emitters>(() => new Map(), []);
    const frames = useRef(0), done = useRef(!!getPartIcons());
    const parts = useMemo(() => KINDS.map(k => {
        const p = newPart(k, 'icon', 7, 4);
        if (k === 'battery' && p.cells) p.cells = [p.cells[0], { ...p.cells[0] }];
        if (k === 'switch') p.closed = false;
        return p;
    }), []);
    useEffect(() => { scene.environment = mainScene.environment; scene.environmentIntensity = 0.7; }, [scene, mainScene.environment]);
    useFrame(() => {
        if (done.current || ++frames.current < 3) return;
        done.current = true;
        const rt = new THREE.WebGLRenderTarget(CELL_W * 2, CELL_H * 2, { samples: 4 });
        rt.texture.colorSpace = THREE.SRGBColorSpace;
        const cam = new THREE.PerspectiveCamera(28, CELL_W / CELL_H, 0.1, 50);
        const pixels = new Uint8Array(CELL_W * 2 * CELL_H * 2 * 4), canvas = document.createElement('canvas');
        canvas.width = CELL_W * 2; canvas.height = CELL_H * 2;
        const ctx = canvas.getContext('2d')!, out: Record<string, string> = {};
        const prevTarget = gl.getRenderTarget(), prevClear = gl.getClearAlpha(), prevColor = new THREE.Color(); gl.getClearColor(prevColor);
        const prevTone = gl.toneMapping;
        gl.setClearColor(0x000000, 0); gl.toneMapping = THREE.NoToneMapping;
        KINDS.forEach((kind, i) => {
            const x = i * SPACING, el = 0.62, dist = 4.3;
            cam.position.set(x, 0.45 + Math.sin(el) * dist, Math.cos(el) * dist); cam.lookAt(x, 0.35, 0);
            gl.setRenderTarget(rt); gl.clear(true, true, true); gl.render(scene, cam);
            gl.readRenderTargetPixels(rt, 0, 0, CELL_W * 2, CELL_H * 2, pixels);
            const img = ctx.createImageData(CELL_W * 2, CELL_H * 2);
            for (let y = 0; y < CELL_H * 2; y++) for (let xx = 0; xx < CELL_W * 2; xx++) {
                const src = ((CELL_H * 2 - 1 - y) * CELL_W * 2 + xx) * 4, dst = (y * CELL_W * 2 + xx) * 4, a = pixels[src + 3] / 255;
                // bỏ nhân alpha trước (NormalBlending ghi màu đã nhân alpha vào target trong suốt)
                img.data[dst] = a > 0 ? Math.min(255, pixels[src] / a) : 0; img.data[dst + 1] = a > 0 ? Math.min(255, pixels[src + 1] / a) : 0; img.data[dst + 2] = a > 0 ? Math.min(255, pixels[src + 2] / a) : 0; img.data[dst + 3] = pixels[src + 3];
            }
            ctx.putImageData(img, 0, 0);
            out[kind] = canvas.toDataURL('image/png');
        });
        gl.setRenderTarget(prevTarget); gl.setClearColor(prevColor, prevClear); gl.toneMapping = prevTone;
        rt.dispose();
        setPartIcons(out);
    });
    if (done.current && getPartIcons()) return null;
    const m = materials();
    return createPortal(<>
        <hemisphereLight args={['#fffaf0', '#8fa99a', 0.9]} />
        <directionalLight position={[-4, 9, 7]} intensity={2.2} color="#fff4e4" />
        {parts.map((p, i) => <group key={p.kind} position={[i * SPACING, 0, 0]}>
            <mesh geometry={GEO.shadowDisc()} material={m.shadowDisc} scale={[2.3, 1, 1.4]} position={[0, 0.001, 0.05]} />
            <PartModel part={p} live={live} emitters={emitters} />
            {postIds(p).map(id => { const [px, pz] = postPosition(p, id); return <mesh key={id} geometry={GEO.post()} material={m.brass} position={[px - p.x, p.kind === 'battery' || p.kind === 'generator' ? 0.3 : p.kind === 'junction' ? 0.22 : ['led', 'lemon', 'potato'].includes(p.kind) ? 0.24 : 0.26, pz - p.z]} />; })}
        </group>)}
    </>, scene);
}

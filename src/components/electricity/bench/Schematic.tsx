import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Part } from '../engine/circuit';
import { discGeometry, strokeGeometry, symbolFor, symbolGeometry } from './ink';
import { Glyph, glyphMaterial, glyphOffset, materials } from './materials';
import type { LiveState } from './parts/PartModel';
import type { WireView } from './Wires';

const INK_Y = 0.075;
const smooth = (t: number) => t * t * (3 - 2 * t);
/** Mực hiện ở nửa sau của phép biến hình (vật thể dẹt xuống trước, kí hiệu hiện sau). */
export const inkAlpha = (morph: number) => smooth(Math.max(0, Math.min(1, (morph - 0.35) / 0.55)));

export interface GlyphItem { ch: Glyph; x: number; y: number; z: number; size: number; color: string }

/** Nhãn kí tự phẳng, luôn đứng thẳng theo màn hình, một lượt vẽ cho cả bàn. */
export function GlyphLayer({ items, opacity, renderOrder = 6, live }: { items: GlyphItem[]; opacity: (live: LiveState) => number; renderOrder?: number; live: React.MutableRefObject<LiveState> }) {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const mat = useMemo(() => glyphMaterial(), []);
    const geo = useMemo(() => {
        const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2);
        g.setAttribute('aGlyph', new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, items.length) * 2), 2));
        return g;
    }, [items.length]);
    useEffect(() => () => geo.dispose(), [geo]);
    useEffect(() => () => mat.dispose(), [mat]);
    useEffect(() => {
        const inst = mesh.current; if (!inst) return;
        const attr = geo.getAttribute('aGlyph') as THREE.InstancedBufferAttribute, m4 = new THREE.Matrix4(), c = new THREE.Color();
        items.forEach((it, i) => {
            m4.makeScale(it.size, 1, it.size).setPosition(it.x, it.y, it.z); inst.setMatrixAt(i, m4);
            inst.setColorAt(i, c.set(it.color));
            const [u, v] = glyphOffset(it.ch); attr.setXY(i, u, v);
        });
        inst.count = items.length; inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true; attr.needsUpdate = true;
    }, [items, geo]);
    useFrame(() => { mat.opacity = opacity(live.current); mat.visible = mat.opacity > 0.01; });
    return items.length ? <instancedMesh key={items.length} ref={mesh} args={[geo, mat, items.length]} frustumCulled={false} renderOrder={renderOrder} /> : null;
}

export interface PlacedPart { part: Part; x: number; z: number; angle: number }

/** Lớp sơ đồ: giấy kẻ ô, kí hiệu, nét dây, chấm nối và chữ trong kí hiệu. */
export function Schematic({ placed, wires, junctions, W, D, center = [0, 0], live }: {
    placed: PlacedPart[]; wires: WireView[]; junctions: [number, number][]; W: number; D: number; center?: [number, number]; live: React.MutableRefObject<LiveState>;
}) {
    const m = materials();
    const paperGeo = useMemo(() => { const g = new THREE.PlaneGeometry(W + 0.1, D + 0.1); g.rotateX(-Math.PI / 2); const uv = g.getAttribute('uv') as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (W + 0.1), uv.getY(i) * (D + 0.1)); return g; }, [W, D]);
    useEffect(() => () => paperGeo.dispose(), [paperGeo]);
    const symbols = useMemo(() => placed.map(p => ({ ...p, geo: symbolGeometry(symbolFor(p.part), 0), spec: symbolFor(p.part) })), [placed]);
    useEffect(() => () => symbols.forEach(s => s.geo?.dispose()), [symbols]);
    const wireInk = useMemo(() => {
        const list = wires.map(w => strokeGeometry({ points: w.points.map(p => [p.x, -p.z] as [number, number]), width: 0.06 }, 0).toNonIndexed());
        const dots = junctions.map(([x, z]) => discGeometry([x, -z], 0.1, 0.002).toNonIndexed());
        const all = [...list, ...dots]; all.forEach(g => { for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k); });
        return all.length ? mergeGeometries(all) : null;
    }, [wires, junctions]);
    useEffect(() => () => { wireInk?.dispose(); }, [wireInk]);
    const glyphs = useMemo<GlyphItem[]>(() => symbols.flatMap(s => s.spec.glyphs.map(g => {
        // xoay điểm neo theo hướng linh kiện; chữ vẫn đứng thẳng.
        const lx = g.at[0], lz = -g.at[1], c = Math.cos(s.angle), sn = Math.sin(s.angle);
        return { ch: g.ch, x: s.x + lx * c + lz * sn, y: INK_Y + 0.004, z: s.z - lx * sn + lz * c, size: g.size, color: '#1f2a37' };
    })), [symbols]);
    const group = useRef<THREE.Group>(null);
    useFrame(() => {
        const a = inkAlpha(live.current.morph);
        m.ink.opacity = a; m.paper.opacity = smooth(Math.min(1, live.current.morph * 1.4));
        if (group.current) group.current.visible = live.current.morph > 0.02;
    });
    return <group ref={group}>
        <mesh geometry={paperGeo} material={m.paper} position={[center[0], 0.06, center[1]]} receiveShadow renderOrder={2} />
        {symbols.map(s => s.geo && <mesh key={s.part.id} geometry={s.geo} material={m.ink} position={[s.x, INK_Y, s.z]} rotation={[0, s.angle, 0]} renderOrder={3} />)}
        {wireInk && <mesh geometry={wireInk} material={m.ink} position={[0, INK_Y - 0.002, 0]} renderOrder={3} />}
        <GlyphLayer items={glyphs} opacity={l => inkAlpha(l.morph)} renderOrder={4} live={live} />
    </group>;
}

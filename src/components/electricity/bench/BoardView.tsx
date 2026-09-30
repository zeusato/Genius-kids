import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Part, postIds, postPosition } from '../engine/circuit';
import { routeAll } from '../engine/route';
import type { Simulation } from '../engine/simulation';
import { BenchProps, layoutKey } from '../ui/benchTypes';
import { junctionPosts } from './ink';
import { boardSize, toWorld } from './layout';
import { Glyph, materials } from './materials';
import { BASE_TOP, GEO, outlineGeometry } from './parts/geometry';
import { Emitters, footprint, LiveState, PartModel } from './parts/PartModel';
import { GlyphItem, GlyphLayer, PlacedPart, Schematic } from './Schematic';
import { wireTones } from './wireColors';
import { wirePoints } from './wireGeometry';
import { makeWireView, WireView, Wires } from './Wires';

export const smooth = (t: number) => t * t * (3 - 2 * t);
export const baseTop = (kind: Part['kind']) => kind === 'battery' || kind === 'generator' ? 0.3 : kind === 'junction' ? 0.22 : ['led', 'lemon', 'potato'].includes(kind) ? 0.24 : BASE_TOP;
const POST_GLYPH: Record<string, Glyph | null> = { plus: '+', minus: '−', a: 'A', b: 'B', anode: '+', cathode: '−', common: 'C', throw0: '1', throw1: '2', node: null };

export interface PostView { key: string; partId: string; postId: string; x: number; z: number; top: number }
export type Highlight = { armed: string | null; hover: string | null; snap: string | null };

/** Nền phòng nhận bóng đổ. */
export function Room({ night }: { night: boolean }) {
    return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={night ? '#141e1b' : '#afc6b6'} roughness={1} />
    </mesh>;
}

/** Mặt bàn kem có lỗ chìm. */
function Board({ W, D, center = [0, 0], full }: { W: number; D: number; center?: [number, number]; full: { W: number; D: number } }) {
    const m = materials();
    const geo = useMemo(() => new RoundedBoxGeometry(W + 0.5, 0.5, D + 0.5, 6, 0.28), [W, D]);
    useEffect(() => () => geo.dispose(), [geo]);
    const holes = useRef<THREE.InstancedMesh>(null);
    // Lỗ bàn luôn ở tọa độ nguyên của bàn đầy đủ (khớp lưới đặt linh kiện), chỉ giữ những lỗ nằm trong mặt bàn.
    const spots = useMemo(() => { const out: [number, number][] = []; for (let i = 1; i < full.W; i++) for (let j = 1; j < full.D; j++) { const x = i - full.W / 2, z = j - full.D / 2; if (Math.abs(x - center[0]) < W / 2 - 0.3 && Math.abs(z - center[1]) < D / 2 - 0.3) out.push([x, z]); } return out; }, [W, D, center[0], center[1], full.W, full.D]);
    const holeGeo = useMemo(() => { const g = new THREE.CircleGeometry(0.055, 14); g.rotateX(-Math.PI / 2); return g; }, []);
    useEffect(() => () => holeGeo.dispose(), [holeGeo]);
    useEffect(() => { const inst = holes.current; if (!inst) return; const m4 = new THREE.Matrix4(); spots.forEach(([x, z], i) => inst.setMatrixAt(i, m4.makeTranslation(x, 0.004, z))); inst.instanceMatrix.needsUpdate = true; }, [spots]);
    return <group>
        <mesh geometry={geo} material={m.board} position={[center[0], -0.25, center[1]]} castShadow receiveShadow />
        <instancedMesh key={spots.length} ref={holes} args={[holeGeo, m.peg, spots.length]} receiveShadow />
    </group>;
}

/** Cọc đồng của mọi linh kiện: một InstancedMesh; sang sơ đồ thì dẹt thành chấm mực nhỏ. */
function Posts({ posts, live, highlight }: { posts: PostView[]; live: React.MutableRefObject<LiveState>; highlight?: React.MutableRefObject<Highlight> }) {
    const m = materials(), mesh = useRef<THREE.InstancedMesh>(null);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.28 }), []);
    useEffect(() => () => mat.dispose(), [mat]);
    const last = useRef('');
    const ring = useRef<THREE.Mesh>(null), ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd76a', transparent: true, depthWrite: false, toneMapped: false }), []);
    useEffect(() => () => ringMat.dispose(), [ringMat]);
    const m4 = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []), s = useMemo(() => new THREE.Vector3(), []), p = useMemo(() => new THREE.Vector3(), []), c = useMemo(() => new THREE.Color(), []);
    const brass = useMemo(() => new THREE.Color(m.brass.color), [m]), ink = useMemo(() => new THREE.Color('#1f2a37'), []), gold = useMemo(() => new THREE.Color('#fff0b0'), []);
    useEffect(() => { last.current = ''; }, [posts]);
    useFrame(({ clock }) => {
        const inst = mesh.current; if (!inst) return;
        const { morph } = live.current, h = highlight?.current ?? { armed: null, hover: null, snap: null }, k = smooth(morph);
        const sig = `${posts.length}:${k.toFixed(3)}:${h.armed}:${h.hover}:${h.snap}`;
        if (sig !== last.current) {
            last.current = sig;
            posts.forEach((pt, i) => {
                const on = pt.key === h.armed || pt.key === h.snap, hov = pt.key === h.hover;
                const scale = (on ? 1.28 : hov ? 1.14 : 1) * (1 - 0.35 * k);
                p.set(pt.x, pt.top + (0.066 - pt.top) * k, pt.z); s.set(scale, scale * (1 - 0.96 * k), scale);
                inst.setMatrixAt(i, m4.compose(p, q, s));
                c.copy(brass).lerp(ink, k); if (on) c.lerp(gold, 0.55 * (1 - k)); inst.setColorAt(i, c);
            });
            inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
        }
        const target = posts.find(pt => pt.key === (h.snap ?? h.armed ?? h.hover));
        if (ring.current) {
            ring.current.visible = !!target && morph < 0.5;
            if (target) {
                ring.current.position.set(target.x, target.top + 0.012, target.z);
                const pulse = h.snap || h.armed ? 1.15 + Math.sin(clock.elapsedTime * 7) * 0.12 : 0.95;
                ring.current.scale.setScalar(pulse); ringMat.opacity = h.snap || h.armed ? 0.95 : 0.55;
            }
        }
    });
    return <>
        {posts.length > 0 && <instancedMesh key={posts.length} ref={mesh} args={[GEO.post(), mat, posts.length]} castShadow frustumCulled={false} onUpdate={() => { last.current = ''; }} />}
        <mesh ref={ring} geometry={GEO.postRing()} material={ringMat} renderOrder={6} visible={false} />
    </>;
}

/** 4 đèn điểm cố định (không đổi số lượng → không biên dịch lại shader), gán cho 4 nguồn sáng mạnh nhất, có trễ. */
export function LightSlots({ emitters }: { emitters: Emitters[] }) {
    const lights = useRef<(THREE.PointLight | null)[]>([]), assigned = useRef<(string | null)[]>([null, null, null, null]);
    useFrame(() => {
        const all: [string, Emitters extends Map<string, infer E> ? E : never][] = emitters.flatMap((map, b) => [...map.entries()].map(([id, e]) => [`${b}:${id}`, e] as [string, typeof e]));
        const byId = new Map(all);
        const list = all.filter(([, e]) => e.strength > 0.01)
            .map(([id, e]) => ({ id, e, score: e.strength * (assigned.current.includes(id) ? 1.25 : 1) }))
            .sort((a, b) => b.score - a.score).slice(0, 4);
        const next: (string | null)[] = [null, null, null, null];
        // giữ đèn đang gán ở đúng khe để khỏi nhảy vị trí
        for (const item of list) { const k = assigned.current.indexOf(item.id); if (k >= 0) next[k] = item.id; }
        for (const item of list) if (!next.includes(item.id)) { const k = next.indexOf(null); if (k >= 0) next[k] = item.id; }
        assigned.current = next;
        next.forEach((id, i) => {
            const l = lights.current[i]; if (!l) return;
            const e = id ? byId.get(id) : undefined;
            l.intensity = e ? e.strength : 0;
            if (e) { l.position.copy(e.position); l.color.copy(e.color); }
        });
    });
    return <>{[0, 1, 2, 3].map(i => <pointLight key={i} ref={el => { lights.current[i] = el; }} intensity={0} distance={7} decay={2} color="#ffb35a" />)}</>;
}

export function Lights({ night, hdr, span = 11 }: { night: boolean; hdr: boolean; span?: number }) {
    const scene = useThree(s => s.scene);
    useEffect(() => { scene.environmentIntensity = night ? 0.08 : 0.5; }, [scene, night]);
    const size = hdr ? 2048 : 1024;
    return <>
        <hemisphereLight args={['#f4fff8', '#8fa99a', night ? 0.05 : 0.28]} />
        <directionalLight position={[-6, 14, 8]} intensity={night ? 0.2 : 1.35} color={night ? '#9fb7d9' : '#fff3e2'} castShadow
            shadow-mapSize={[size, size]} shadow-bias={-0.0004} shadow-normalBias={0.02}
            shadow-camera-left={-span} shadow-camera-right={span} shadow-camera-top={span} shadow-camera-bottom={-span} shadow-camera-near={1} shadow-camera-far={48} />
    </>;
}

/** Viền chọn quanh thân linh kiện, nhấp nháy khi vừa quay lại từ sơ đồ. */
function Selection({ placed, selected, live }: { placed: PlacedPart[]; selected: string | null; live: React.MutableRefObject<LiveState> }) {
    const m = materials(), ref = useRef<THREE.Mesh>(null), pulse = useRef(0), prevMorph = useRef(0);
    const p = placed.find(v => v.part.id === selected);
    const [fw, fd] = p ? footprint(p.part.kind) : [2, 1.1];
    const geo = useMemo(() => outlineGeometry(fw + 0.26, fd + 0.26, 0.2, 0.07), [fw, fd]);
    useEffect(() => () => geo.dispose(), [geo]);
    useFrame(({ clock }, dt) => {
        const morph = live.current.morph;
        if (prevMorph.current > 0.5 && morph <= 0.5) pulse.current = 1.4; // "chính là món đồ em vừa chọn trong sơ đồ"
        prevMorph.current = morph; pulse.current = Math.max(0, pulse.current - dt);
        if (!ref.current) return;
        const wave = pulse.current > 0 ? 0.5 + 0.5 * Math.sin(clock.elapsedTime * 12) : 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3);
        m.select.opacity = (0.55 + 0.45 * wave) * (morph > 0.5 ? 0.85 : 1);
        ref.current.scale.setScalar(1 + (pulse.current > 0 ? 0.06 * wave : 0));
        ref.current.position.y = 0.02 + (morph > 0.5 ? 0.06 : 0);
    });
    if (!p) return null;
    return <mesh ref={ref} geometry={geo} material={m.select} position={[p.x, 0.02, p.z]} rotation={[0, p.angle, 0]} renderOrder={5} />;
}

export interface BoardViewProps {
    sim: Simulation;
    portrait: boolean;
    flow: BenchProps['flow'];
    selected: string | null;
    preview?: BenchProps['preview'];
    live: React.MutableRefObject<LiveState>;
    emitters: Emitters;
    highlight?: React.MutableRefObject<Highlight>;
    postsOut?: React.MutableRefObject<PostView[]>;
    placedOut?: React.MutableRefObject<PlacedPart[]>;
    partsGroupOut?: React.MutableRefObject<THREE.Group | null>;
    /** Chỉ dựng phần mặt bàn trong khung này (tọa độ bàn, hướng ngang) — màn so sánh dùng bàn nhỏ. */
    crop?: { x0: number; z0: number; x1: number; z1: number };
}

export function cropBox(crop: BoardViewProps['crop'], portrait: boolean) {
    const full = boardSize(portrait);
    if (!crop) return { W: full.W, D: full.D, center: [0, 0] as [number, number] };
    const [cx, cz] = toWorld((crop.x0 + crop.x1) / 2, (crop.z0 + crop.z1) / 2, portrait);
    return portrait ? { W: crop.z1 - crop.z0, D: crop.x1 - crop.x0, center: [cx, cz] as [number, number] } : { W: crop.x1 - crop.x0, D: crop.z1 - crop.z0, center: [cx, cz] as [number, number] };
}

/** Một bàn thí nghiệm hoàn chỉnh (mặt bàn, linh kiện, cọc, nhãn, dây, electron, lớp sơ đồ) — dùng cho bàn chính và màn so sánh. */
export function BoardView({ sim, portrait, flow, selected, preview, live, emitters, highlight, postsOut, placedOut, partsGroupOut, crop }: BoardViewProps) {
    const full = boardSize(portrait), box = cropBox(crop, portrait), { W, D } = box;
    const circuit = sim.circuit, lk = layoutKey(circuit);
    const routes = useMemo(() => routeAll(circuit), [lk]);
    const tones = wireTones(circuit, sim.solution);
    const toneKey = circuit.wires.map(w => `${w.id}${tones.get(w.id)}${w.broken ? 'x' : ''}`).join('|');
    const wireViews = useMemo<WireView[]>(() => circuit.wires.flatMap(w => { const r = routes.get(w.id); return r ? [makeWireView(w.id, wirePoints(r, portrait), tones.get(w.id) ?? 'teal', !!w.broken)] : []; }), [routes, toneKey, portrait]);
    const dragging = preview?.part && preview.point ? { id: preview.part, point: preview.point } : null;
    const placed = useMemo<PlacedPart[]>(() => circuit.parts.map(part => {
        const pos = dragging?.id === part.id ? dragging.point : [part.x, part.z] as [number, number];
        const [x, z] = toWorld(pos[0], pos[1], portrait);
        return { part, x, z, angle: (portrait ? Math.PI / 2 : 0) - part.rot * Math.PI / 180 };
    }), [circuit.parts, portrait, dragging?.id, dragging?.point?.[0], dragging?.point?.[1]]);
    const posts = useMemo<PostView[]>(() => placed.flatMap(({ part }) => postIds(part).map(id => {
        const pos = dragging?.id === part.id ? [dragging.point[0] + postPosition(part, id)[0] - part.x, dragging.point[1] + postPosition(part, id)[1] - part.z] as [number, number] : postPosition(part, id);
        const [x, z] = toWorld(pos[0], pos[1], portrait);
        return { key: `${part.id}:${id}`, partId: part.id, postId: id, x, z, top: baseTop(part.kind) + (dragging?.id === part.id ? 0.3 : 0) };
    })), [placed, portrait]);
    if (postsOut) postsOut.current = posts;
    if (placedOut) placedOut.current = placed;
    const junctions = useMemo(() => junctionPosts(circuit.parts, circuit.wires).map(j => { const pt = posts.find(p => p.key === `${j.partId}:${j.postId}`); return pt ? [pt.x, pt.z] as [number, number] : null; }).filter(Boolean) as [number, number][], [posts, circuit.wires]);

    // Nhãn cọc (+ − A B …) và số hiệu linh kiện: nằm trên mặt đế phía trước cọc, luôn đứng thẳng theo màn hình.
    const labels = useMemo<GlyphItem[]>(() => {
        const out: GlyphItem[] = [];
        for (const pl of placed) {
            const [fw, fd] = footprint(pl.part.kind), top = baseTop(pl.part.kind) + 0.004 + (dragging?.id === pl.part.id ? 0.3 : 0);
            const onBase = (wx: number, wz: number) => { const dx = wx - pl.x, dz = wz - pl.z, c = Math.cos(pl.angle), s = Math.sin(pl.angle); const lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) < fw / 2 - 0.08 && Math.abs(lz) < fd / 2 - 0.08; };
            const teal = pl.part.kind === 'battery' || pl.part.kind === 'generator';
            for (const pt of posts.filter(v => v.partId === pl.part.id)) {
                const ch = POST_GLYPH[pt.postId]; if (!ch) continue;
                const x = pt.x, z = pt.z + 0.36, on = onBase(x, z);
                const color = ch === '+' ? (teal ? '#ffd9cc' : '#c8553d') : ch === '−' ? (teal ? '#d6eef7' : '#2f6f8f') : teal ? '#f3efe2' : '#7a6848';
                out.push({ ch, x, y: on ? top : 0.014, z, size: ch === '+' || ch === '−' ? 0.3 : 0.24, color: on ? color : '#8a7a5c' });
            }
            const digits = pl.part.id.replace(/\D/g, '');
            if (digits.length === 1) {
                const lz = fd / 2 - 0.17, c = Math.cos(pl.angle), s = Math.sin(pl.angle);
                out.push({ ch: digits as Glyph, x: pl.x + lz * s, y: top, z: pl.z + lz * c, size: 0.2, color: teal ? '#e8f3ef' : '#9a8866' });
            }
        }
        return out;
    }, [placed, posts]);

    const partsGroup = useRef<THREE.Group>(null), wiresGroup = useRef<THREE.Group>(null);
    useEffect(() => { if (partsGroupOut) partsGroupOut.current = partsGroup.current; });
    useFrame(() => {
        const k = smooth(live.current.morph);
        if (partsGroup.current) { partsGroup.current.scale.y = 1 - 0.965 * k; partsGroup.current.visible = k < 0.999; }
        if (wiresGroup.current) wiresGroup.current.scale.y = 1 - 0.3 * k;
    });
    const highlighted = useMemo(() => new Set(circuit.wires.filter(w => w.id === selected || w.a.partId === selected || w.b.partId === selected).map(w => w.id)), [circuit.wires, selected]);

    return <group>
        <Board W={W} D={D} center={box.center} full={full} />
        <group ref={partsGroup}>
            {placed.map(pl => <group key={pl.part.id} position={[pl.x, dragging?.id === pl.part.id ? 0.3 : 0, pl.z]} rotation={[0, pl.angle, 0]} userData={{ partId: pl.part.id }}>
                <PartModel part={pl.part} live={live} emitters={emitters} />
            </group>)}
        </group>
        <Posts posts={posts} live={live} highlight={highlight} />
        <GlyphLayer items={labels} opacity={l => 1 - Math.min(1, l.morph * 2.5)} live={live} />
        <group ref={wiresGroup}><Wires views={wireViews} highlighted={highlighted} live={live} flow={flow} /></group>
        <Schematic placed={placed} wires={wireViews} junctions={junctions} W={W} D={D} center={box.center} live={live} />
        <Selection placed={placed} selected={selected} live={live} />
    </group>;
}

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { boardPoint, Part, postIds, postPosition } from '../engine/circuit';
import { PARTS } from '../engine/parts';
import { routeAll } from '../engine/route';
import { reading } from '../engine/solver';
import type { Simulation } from '../engine/simulation';
import { bindSurface } from '../controller/surface';
import { BenchProps, layoutKey } from '../ui/benchTypes';
import { junctionPosts } from './ink';
import { boardSize, cameraPosition, defaultElevation, fitView, POST_Y, toWorld, WIRE_Y } from './layout';
import { Glyph, materials } from './materials';
import { BASE_TOP, GEO, outlineGeometry } from './parts/geometry';
import { Emitters, footprint, LiveState, PartModel } from './parts/PartModel';
import { GlyphItem, GlyphLayer, inkAlpha, PlacedPart, Schematic } from './Schematic';
import { wireTones } from './wireColors';
import { dragPoints, wirePoints } from './wireGeometry';
import { DragWire, makeWireView, WireView, Wires } from './Wires';

const smooth = (t: number) => t * t * (3 - 2 * t);
const baseTop = (kind: Part['kind']) => kind === 'battery' || kind === 'generator' ? 0.3 : kind === 'junction' ? 0.22 : ['led', 'lemon', 'potato'].includes(kind) ? 0.24 : BASE_TOP;
const POST_GLYPH: Record<string, Glyph | null> = { plus: '+', minus: '−', a: 'A', b: 'B', anode: '+', cathode: '−', common: 'C', throw0: '1', throw1: '2', node: null };

export interface SceneOptions { hdr: boolean; onPerf?: (info: { calls: number; triangles: number }) => void }

interface PostView { key: string; partId: string; postId: string; x: number; z: number; top: number }

/** Mặt bàn kem có lỗ chìm + nền phòng. */
function Board({ W, D, night }: { W: number; D: number; night: boolean }) {
    const m = materials();
    const geo = useMemo(() => new RoundedBoxGeometry(W + 0.5, 0.5, D + 0.5, 6, 0.28), [W, D]);
    useEffect(() => () => geo.dispose(), [geo]);
    const holes = useRef<THREE.InstancedMesh>(null);
    const spots = useMemo(() => { const out: [number, number][] = []; for (let i = 1; i < W; i++) for (let j = 1; j < D; j++) out.push([i - W / 2, j - D / 2]); return out; }, [W, D]);
    const holeGeo = useMemo(() => { const g = new THREE.CircleGeometry(0.055, 14); g.rotateX(-Math.PI / 2); return g; }, []);
    useEffect(() => () => holeGeo.dispose(), [holeGeo]);
    useEffect(() => { const inst = holes.current; if (!inst) return; const m4 = new THREE.Matrix4(); spots.forEach(([x, z], i) => inst.setMatrixAt(i, m4.makeTranslation(x, 0.004, z))); inst.instanceMatrix.needsUpdate = true; }, [spots]);
    return <group>
        <mesh geometry={geo} material={m.board} position={[0, -0.25, 0]} castShadow receiveShadow />
        <instancedMesh key={spots.length} ref={holes} args={[holeGeo, m.peg, spots.length]} receiveShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[160, 160]} />
            <meshStandardMaterial color={night ? '#141e1b' : '#afc6b6'} roughness={1} />
        </mesh>
    </group>;
}

/** Cọc đồng của mọi linh kiện: một InstancedMesh; sang sơ đồ thì dẹt thành chấm mực nhỏ. */
function Posts({ posts, live, highlight }: { posts: PostView[]; live: React.MutableRefObject<LiveState>; highlight: React.MutableRefObject<{ armed: string | null; hover: string | null; snap: string | null }> }) {
    const m = materials(), mesh = useRef<THREE.InstancedMesh>(null);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.28 }), []);
    useEffect(() => () => mat.dispose(), [mat]);
    const last = useRef('');
    const ring = useRef<THREE.Mesh>(null), ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd76a', transparent: true, depthWrite: false, toneMapped: false }), []);
    useEffect(() => () => ringMat.dispose(), [ringMat]);
    const m4 = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []), s = useMemo(() => new THREE.Vector3(), []), p = useMemo(() => new THREE.Vector3(), []), c = useMemo(() => new THREE.Color(), []);
    const brass = useMemo(() => new THREE.Color(m.brass.color), [m]), ink = useMemo(() => new THREE.Color('#1f2a37'), []), gold = useMemo(() => new THREE.Color('#fff0b0'), []);
    useFrame(({ clock }) => {
        const inst = mesh.current; if (!inst) return;
        const { morph } = live.current, h = highlight.current, k = smooth(morph);
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
function LightSlots({ emitters }: { emitters: Emitters }) {
    const lights = useRef<(THREE.PointLight | null)[]>([]), assigned = useRef<(string | null)[]>([null, null, null, null]);
    useFrame(() => {
        const list = [...emitters.entries()].filter(([, e]) => e.strength > 0.01)
            .map(([id, e]) => ({ id, e, score: e.strength * (assigned.current.includes(id) ? 1.25 : 1) }))
            .sort((a, b) => b.score - a.score).slice(0, 4);
        const next: (string | null)[] = [null, null, null, null];
        // giữ đèn đang gán ở đúng khe để khỏi nhảy vị trí
        for (const item of list) { const k = assigned.current.indexOf(item.id); if (k >= 0) next[k] = item.id; }
        for (const item of list) if (!next.includes(item.id)) { const k = next.indexOf(null); if (k >= 0) next[k] = item.id; }
        assigned.current = next;
        next.forEach((id, i) => {
            const l = lights.current[i]; if (!l) return;
            const e = id ? emitters.get(id) : undefined;
            l.intensity = e ? e.strength : 0;
            if (e) { l.position.copy(e.position); l.color.copy(e.color); }
        });
    });
    return <>{[0, 1, 2, 3].map(i => <pointLight key={i} ref={el => { lights.current[i] = el; }} intensity={0} distance={7} decay={2} color="#ffb35a" />)}</>;
}

function Lights({ night, hdr }: { night: boolean; hdr: boolean }) {
    const scene = useThree(s => s.scene);
    useEffect(() => { scene.environmentIntensity = night ? 0.08 : 0.5; }, [scene, night]);
    const size = hdr ? 2048 : 1024;
    return <>
        <hemisphereLight args={['#f4fff8', '#8fa99a', night ? 0.05 : 0.28]} />
        <directionalLight position={[-6, 14, 8]} intensity={night ? 0.2 : 1.35} color={night ? '#9fb7d9' : '#fff3e2'} castShadow
            shadow-mapSize={[size, size]} shadow-bias={-0.0004} shadow-normalBias={0.02}
            shadow-camera-left={-11} shadow-camera-right={11} shadow-camera-top={11} shadow-camera-bottom={-11} shadow-camera-near={1} shadow-camera-far={40} />
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
    });
    if (!p) return null;
    return <mesh ref={ref} geometry={geo} material={m.select} position={[p.x, 0.02 + (live.current.morph > 0.5 ? 0.06 : 0), p.z]} rotation={[0, p.angle, 0]} renderOrder={5} />;
}

export function BenchScene(props: BenchProps & SceneOptions) {
    const { camera, gl, size } = useThree();
    const portrait = props.portrait, { W, D } = boardSize(portrait);
    const latest = useRef(props); latest.current = props;
    const simRef = useRef<Simulation>(props.sim); simRef.current = props.sim;
    const live = useRef<LiveState>({ sim: () => latest.current.getSim?.() ?? simRef.current, night: props.night, hdr: props.hdr, reduced: props.reduced, morph: props.schematic ? 1 : 0 });
    live.current.night = props.night; live.current.hdr = props.hdr; live.current.reduced = props.reduced;
    const emitters = useMemo<Emitters>(() => new Map(), []);
    const circuit = props.sim.circuit, lk = layoutKey(circuit);

    // ---- dữ liệu trình bày (chỉ dựng lại khi bố cục/kết nối đổi)
    const routes = useMemo(() => routeAll(circuit), [lk]);
    const tones = wireTones(circuit, props.sim.solution);
    const toneKey = circuit.wires.map(w => `${w.id}${tones.get(w.id)}${w.broken ? 'x' : ''}`).join('|');
    const wireViews = useMemo<WireView[]>(() => circuit.wires.flatMap(w => { const r = routes.get(w.id); return r ? [makeWireView(w.id, wirePoints(r, portrait), tones.get(w.id) ?? 'teal', !!w.broken)] : []; }), [routes, toneKey, portrait]);
    const dragging = props.preview?.part && props.preview.point ? { id: props.preview.part, point: props.preview.point } : null;
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

    // ---- điểm nhấn cọc (đang chọn / đang rê / đích hút dây)
    const highlight = useRef<{ armed: string | null; hover: string | null; snap: string | null }>({ armed: null, hover: null, snap: null });
    const hoverPoint = useRef<[number, number] | null>(null);
    highlight.current.armed = props.preview?.from ? `${props.preview.from.partId}:${props.preview.from.postId}` : null;

    // ---- camera: vừa khung, biến hình sang sơ đồ, pan/zoom
    const view = useRef({ zoom: 1, pan: [0, 0] as [number, number], fitSig: '', fit: { distance: 20, target: [0, 0] as [number, number] }, cur: { distance: 20, target: [0, 0] as [number, number] }, first: true });
    useEffect(() => { view.current.zoom = 1; view.current.pan = [0, 0]; }, [props.fitKey, portrait]);
    const project = useMemo(() => new THREE.Vector3(), []);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.1), l = live.current, cam = camera as THREE.PerspectiveCamera;
        const goal = latest.current.schematic ? 1 : 0, speed = l.reduced ? 1 / 0.15 : 1 / 0.8;
        l.morph = goal > l.morph ? Math.min(goal, l.morph + dt * speed) : Math.max(goal, l.morph - dt * speed);
        const k = smooth(l.morph);
        const elevation = defaultElevation(portrait) + (Math.PI / 2 - 0.0005 - defaultElevation(portrait)) * k;
        const fov = 30 + (15 - 30) * k, aspect = size.width / Math.max(1, size.height);
        const ins = latest.current.insets ?? { top: 0, bottom: 0, left: 0, right: 0 };
        const insets = { top: ins.top / size.height, bottom: ins.bottom / size.height, left: ins.left / size.width, right: ins.right / size.width };
        const sig = `${W}|${D}|${aspect.toFixed(4)}|${k.toFixed(4)}|${JSON.stringify(ins)}`;
        if (sig !== view.current.fitSig) { view.current.fitSig = sig; view.current.fit = fitView(W, D, fov, aspect, elevation, insets, 0.3, 1.5 * (1 - k) + 0.1); }
        const v = view.current, goalTarget: [number, number] = [v.fit.target[0] + v.pan[0], v.fit.target[1] + v.pan[1]], goalDist = v.fit.distance / v.zoom;
        // Trượt mượt tới khung mới (mở thẻ thuộc tính, xoay màn…); khung đầu tiên đặt thẳng.
        const a = v.first || l.reduced ? 1 : 1 - Math.exp(-dt * 7);
        v.first = false;
        v.cur.target = [v.cur.target[0] + (goalTarget[0] - v.cur.target[0]) * a, v.cur.target[1] + (goalTarget[1] - v.cur.target[1]) * a];
        v.cur.distance += (goalDist - v.cur.distance) * a;
        const target = v.cur.target;
        cam.fov = fov; cam.aspect = aspect; cam.near = 0.1; cam.far = 400; cam.updateProjectionMatrix();
        cam.position.set(...cameraPosition(target, v.cur.distance, elevation));
        cam.up.set(0, 1, elevation > 1.55 ? -1 : 0).normalize();
        cam.lookAt(target[0], 0, target[1]);
        // điểm rê chuột → cọc gần nhất (chỉ để làm sáng)
        const hp = hoverPoint.current, pv = latest.current.preview;
        let hover: string | null = null, snap: string | null = null;
        const probe = pv?.from && pv.point ? (() => { const [wx, wz] = toWorld(pv.point[0], pv.point[1], portrait); project.set(wx, POST_Y, wz).project(cam); const r = gl.domElement.getBoundingClientRect(); return [r.left + (project.x + 1) / 2 * r.width, r.top + (1 - project.y) / 2 * r.height] as [number, number]; })() : hp;
        if (probe) {
            const r = gl.domElement.getBoundingClientRect(); let best = 26;
            for (const pt of posts) {
                project.set(pt.x, pt.top + 0.25, pt.z).project(cam);
                const d = Math.hypot(r.left + (project.x + 1) / 2 * r.width - probe[0], r.top + (1 - project.y) / 2 * r.height - probe[1]);
                if (d < best && pt.key !== highlight.current.armed) { best = d; if (pv?.from) snap = pt.key; else hover = pt.key; }
            }
        }
        highlight.current.hover = hover; highlight.current.snap = snap;
    });

    // ---- nối thao tác chạm/kéo vào controller chung (cùng máy trạng thái với bàn SVG)
    const partsGroup = useRef<THREE.Group>(null);
    useEffect(() => {
        const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
        const setRay = (x: number, y: number) => { const r = gl.domElement.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); };
        const toBoard = (x: number, y: number): [number, number] => { setRay(x, y); if (!ray.ray.intersectPlane(plane, hit)) return [7, 4]; const { W: w, D: d } = boardSize(latest.current.portrait); return boardPoint(hit.x + w / 2, hit.z + d / 2, latest.current.portrait); };
        const toScreen = (p: [number, number], h?: 'post' | 'wire'): [number, number] => { const [wx, wz] = toWorld(p[0], p[1], latest.current.portrait); const v = new THREE.Vector3(wx, h === 'wire' ? WIRE_Y : POST_Y, wz).project(camera); const r = gl.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; };
        const pickPart = (x: number, y: number) => {
            if (!partsGroup.current || live.current.morph > 0.5) return null;
            setRay(x, y);
            for (const h of ray.intersectObjects(partsGroup.current.children, true)) { let o: THREE.Object3D | null = h.object; while (o && !o.userData.partId) o = o.parent; if (o) return o.userData.partId as string; }
            return null;
        };
        const cameraMove = (dx: number, dy: number, scale: number) => {
            const v = view.current, cam = camera as THREE.PerspectiveCamera, { W: w, D: d } = boardSize(latest.current.portrait);
            v.zoom = Math.max(1, Math.min(3, v.zoom * scale));
            const perPx = 2 * Math.tan(cam.fov * Math.PI / 360) * (v.fit.distance / v.zoom) / Math.max(1, gl.domElement.clientHeight);
            v.pan = [Math.max(-w / 2, Math.min(w / 2, v.pan[0] - dx * perPx)), Math.max(-d / 2, Math.min(d / 2, v.pan[1] - dy * perPx / Math.max(0.5, Math.sin(defaultElevation(latest.current.portrait)))))];
            if (v.zoom === 1) v.pan = [0, 0];
        };
        const surfaceProps = () => ({ ...latest.current, onHover: (p: [number, number] | null) => { hoverPoint.current = p; } });
        const clean = bindSurface(gl.domElement, surfaceProps, toBoard, toScreen, cameraMove, { pickPart });
        // Dev: tọa độ màn hình của một cọc/điểm bàn (kiểm thử kéo dây bằng CDP).
        if (import.meta.env.DEV) Object.assign(window, { __ewScreen: (partId: string, postId?: string) => { const p = latest.current.sim.circuit.parts.find(v => v.id === partId); return p ? toScreen(postId ? postPosition(p, postId) : [p.x, p.z], 'post') : null; } });
        const lost = (e: Event) => { e.preventDefault(); latest.current.onContextLost?.(); };
        gl.domElement.addEventListener('webglcontextlost', lost);
        return () => { clean(); gl.domElement.removeEventListener('webglcontextlost', lost); };
    }, [camera, gl]);

    // ---- nhóm linh kiện dẹt xuống khi sang sơ đồ
    useFrame(() => { if (partsGroup.current) { const k = smooth(live.current.morph); partsGroup.current.scale.y = 1 - 0.965 * k; partsGroup.current.visible = k < 0.999; } });
    const wiresGroup = useRef<THREE.Group>(null);
    useFrame(() => { if (wiresGroup.current) wiresGroup.current.scale.y = 1 - 0.3 * smooth(live.current.morph); });

    // ---- dây nháp khi kéo từ cọc
    const drag = useMemo(() => {
        const pv = props.preview; if (!pv?.from || !pv.point) return null;
        const part = circuit.parts.find(p => p.id === pv.from!.partId); if (!part) return null;
        const a = toWorld(...postPosition(part, pv.from.postId), portrait), b = toWorld(pv.point[0], pv.point[1], portrait);
        return dragPoints(a, b);
    }, [props.preview, circuit.parts, portrait]);

    const highlighted = useMemo(() => new Set(circuit.wires.filter(w => w.id === props.selected || w.a.partId === props.selected || w.b.partId === props.selected).map(w => w.id)), [circuit.wires, props.selected]);
    const selectedPart = placed.find(p => p.part.id === props.selected);
    const selReading = selectedPart ? reading(props.sim.solution, selectedPart.part.id) : null;

    return <>
        <color attach="background" args={[props.night ? '#101816' : '#afc6b6']} />
        <Lights night={props.night} hdr={props.hdr} />
        <LightSlots emitters={emitters} />
        <Board W={W} D={D} night={props.night} />
        <group ref={partsGroup}>
            {placed.map(pl => <group key={pl.part.id} position={[pl.x, dragging?.id === pl.part.id ? 0.3 : 0, pl.z]} rotation={[0, pl.angle, 0]} userData={{ partId: pl.part.id }}>
                <PartModel part={pl.part} live={live} emitters={emitters} />
            </group>)}
        </group>
        <Posts posts={posts} live={live} highlight={highlight} />
        <GlyphLayer items={labels} opacity={l => 1 - Math.min(1, l.morph * 2.5)} live={live} />
        <group ref={wiresGroup}><Wires views={wireViews} highlighted={highlighted} live={live} flow={props.flow} /></group>
        {drag && <DragWire points={drag} />}
        <Schematic placed={placed} wires={wireViews} junctions={junctions} W={W} D={D} live={live} />
        <Selection placed={placed} selected={props.selected} live={live} />
        {selectedPart && !dragging && <Html position={[selectedPart.x, props.schematic ? 0.2 : 1.9, selectedPart.z - (props.schematic ? 0.75 : 0)]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div className="ew-part-chip">{PARTS[selectedPart.part.kind].name} <b>{selectedPart.part.id}</b>{selReading && ['bulb', 'led'].includes(selectedPart.part.kind) && !props.schematic ? <span>{Math.round(Math.max(0, selReading.Pabsorbed) / 0.75 * 100)}% công suất</span> : null}</div>
        </Html>}
        <InkFade live={live} />
    </>;
}

/** Giữ mực sơ đồ đồng bộ với morph ngay cả khi lớp Schematic chưa dựng (tránh nháy mực ở khung đầu). */
function InkFade({ live }: { live: React.MutableRefObject<LiveState> }) {
    const m = materials();
    useFrame(() => { m.ink.opacity = inkAlpha(live.current.morph); });
    return null;
}

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { boardPoint, postPosition } from '../engine/circuit';
import { PARTS } from '../engine/parts';
import { reading } from '../engine/solver';
import type { Simulation } from '../engine/simulation';
import { bindSurface } from '../controller/surface';
import { BenchProps } from '../ui/benchTypes';
import { BoardView, Highlight, Lights, LightSlots, PostView, Room, smooth } from './BoardView';
import { boardSize, cameraPosition, defaultElevation, fitView, POST_Y, toWorld, WIRE_Y } from './layout';
import { materials } from './materials';
import { Emitters, LiveState } from './parts/PartModel';
import { inkAlpha } from './Schematic';
import { dragPoints } from './wireGeometry';
import { DragWire } from './Wires';

export interface SceneOptions { hdr: boolean; onPerf?: (info: { calls: number; triangles: number }) => void }


export function BenchScene(props: BenchProps & SceneOptions) {
    const { camera, gl, size } = useThree();
    const portrait = props.portrait, { W, D } = boardSize(portrait);
    const latest = useRef(props); latest.current = props;
    const simRef = useRef<Simulation>(props.sim); simRef.current = props.sim;
    const live = useRef<LiveState>({ sim: () => latest.current.getSim?.() ?? simRef.current, night: props.night, hdr: props.hdr, reduced: props.reduced, morph: props.schematic ? 1 : 0 });
    live.current.night = props.night; live.current.hdr = props.hdr; live.current.reduced = props.reduced;
    const emitters = useMemo<Emitters>(() => new Map(), []), emitterList = useMemo(() => [emitters], [emitters]);
    const circuit = props.sim.circuit;
    const postsRef = useRef<PostView[]>([]);
    const dragging = props.preview?.part && props.preview.point ? { id: props.preview.part, point: props.preview.point } : null;

    // ---- điểm nhấn cọc (đang chọn / đang rê / đích hút dây)
    const highlight = useRef<Highlight>({ armed: null, hover: null, snap: null });
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
            for (const pt of postsRef.current) {
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

    // ---- dây nháp khi kéo từ cọc
    const drag = useMemo(() => {
        const pv = props.preview; if (!pv?.from || !pv.point) return null;
        const part = circuit.parts.find(p => p.id === pv.from!.partId); if (!part) return null;
        const a = toWorld(...postPosition(part, pv.from.postId), portrait), b = toWorld(pv.point[0], pv.point[1], portrait);
        return dragPoints(a, b);
    }, [props.preview, circuit.parts, portrait]);

    const selPart = circuit.parts.find(p => p.id === props.selected);
    const selectedPart = selPart ? (() => { const [x, z] = toWorld(selPart.x, selPart.z, portrait); return { part: selPart, x, z }; })() : null;
    const selReading = selectedPart ? reading(props.sim.solution, selectedPart.part.id) : null;

    return <>
        <color attach="background" args={[props.night ? '#101816' : '#afc6b6']} />
        <Lights night={props.night} hdr={props.hdr} />
        <LightSlots emitters={emitterList} />
        <Room night={props.night} />
        <BoardView sim={props.sim} portrait={portrait} flow={props.flow} selected={props.selected} preview={props.preview} live={live} emitters={emitters}
            highlight={highlight} postsOut={postsRef} partsGroupOut={partsGroup} />
        {drag && <DragWire points={drag} />}
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

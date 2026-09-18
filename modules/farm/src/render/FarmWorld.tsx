import { obstacleName } from '../core/scenery';
import { Buildings } from './Buildings';
import { Landscape, LandscapeObjects, CAMERA_OFFSET, CAMERA_POLAR, CAMERA_AZIMUTH } from './Landscape';
import { ExplorationFog } from './ExplorationFog';
import { GroundCover } from './GroundCover';
import { CropField } from './CropField';
import { Roads } from './Roads';
import { SceneLife, FrameMeter } from './SceneLife';
import { Family, type FamilyWork } from './Family';
import { Suspense, useEffect, useMemo, useRef, useState, type RefObject, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as T from 'three';
import { ASSETS, type CropId } from '../core/catalog';
import { dimensions, placementError } from '../core/engine';
import { buildRequirements } from '../core/construction';
import { heightAt, ownedAt, type World } from '../core/world';
import { previewStroke, type Tool } from '../core/interaction';
import type { FarmState } from '../core/types';
import { BuildingModel, SceneBoundary, type Placement } from './FarmScene';
export type CameraIntent = {
    serial: number;
    kind: 'home' | 'overview' | 'district' | 'zoom-in' | 'zoom-out' | 'focus';
    x?: number;
    z?: number;
};
export type PlotScreenPoint = { id: string; x: number; y: number };
type Props = {
    state: FarmState;
    selected: string | null;
    placement: Placement | null;
    tool: Tool;
    seed: CropId;
    quality: 'soft' | 'light';
    reduced: boolean;
    camera: CameraIntent;
    onSelect: (id: string) => void;
    onDeselect: () => void;
    subjectMenu?: ReactNode;
    onPosition: (x: number, z: number) => void;
    onMoveStart: (id: string) => void;
    onPlace: (p: Placement) => void;
    onRotate: () => void;
    onCancel: () => void;
    onStroke: (ids: string[], revision: number, origins: PlotScreenPoint[]) => void;
    onPreview: (ids: string[]) => void;
    onHover: (text: string) => void;
    stroke: string[];
    familyWork: FamilyWork[];
    onResourceOrigin: (work: FamilyWork, x: number, y: number) => void;
};
function SubjectAnchor({ state, selected, children }: { state: FarmState; selected: string; children: ReactNode }) {
    const div = useRef<HTMLDivElement>(null), { camera, size } = useThree();
    const v = useMemo(() => new T.Vector3(), []);
    const entity = state.entities.find(e => e.id === selected);
    const subject = entity ?? state.plots.find(p => p.id === selected) ?? state.world.obstacles.find(o => o.id === selected) ?? state.world.bridges.find(b => b.id === selected);
    useFrame(() => {
        if (!subject || !div.current) return;
        const [w, d] = entity ? dimensions(entity.asset, entity.rotation) : [1, 1];
        v.set(subject.x + w / 2, heightAt(state.world, subject.x, subject.z) + (entity ? 2.7 : 1.1), subject.z + d / 2).project(camera);
        const height = div.current.offsetHeight;
        div.current.style.left = `${Math.max(155, Math.min(size.width - 155, (v.x + 1) * size.width / 2))}px`;
        div.current.style.top = `${Math.max(12, Math.min(size.height - height - 110, (-v.y + 1) * size.height / 2 - height - 18))}px`;
    });
    return subject ? <Html fullscreen calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]} style={{ pointerEvents: 'none' }} zIndexRange={[24, 21]}><div ref={div} className="farm-subject-anchor">{children}</div></Html> : null;
}
function Mark({ x, z, w = 1, d = 1, world, color = '#eed69a' }: {
    x: number;
    z: number;
    w?: number;
    d?: number;
    world: World;
    color?: string;
}) { return <mesh position={[x + w / 2, heightAt(world, x, z) + .065, z + d / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w - .03, d - .03]}/><meshBasicMaterial color={color} opacity={.55} transparent depthWrite={false}/></mesh>; }
function AnchoredActions({ p, world, onRotate, onCancel, onPlace, valid }: {
    p: Placement;
    world: World;
    onRotate: () => void;
    onCancel: () => void;
    onPlace: () => void;
    valid: boolean;
}) {
    const div = useRef<HTMLDivElement>(null), { camera, size } = useThree();
    const v = useMemo(() => new T.Vector3(), []);
    useFrame(() => { const [w, d] = p.asset === 'plot' ? [1, 1] : dimensions(p.asset, p.rotation); v.set(p.x + w / 2, heightAt(world, p.x, p.z) + 2.3, p.z + d / 2).project(camera); if (div.current) {
        div.current.style.left = `${Math.max(110, Math.min(size.width - 110, (v.x + 1) * size.width / 2))}px`;
        div.current.style.top = `${Math.max(60, Math.min(size.height - 160, (-v.y + 1) * size.height / 2))}px`;
    } });
    return <Html fullscreen calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 10]}><div ref={div} className="farm-object-actions"><button onClick={onRotate} aria-label="Xoay vật thể 90 độ">↻</button><button onClick={onPlace} disabled={!valid}>Xác nhận</button><button onClick={onCancel} aria-label="Hủy bố trí">×</button></div></Html>;
}
function Interaction({ props, controls }: {
    props: Props;
    controls: RefObject<any>;
}) {
    const { gl, camera, scene } = useThree(), latest = useRef(props), cancelRef = useRef(() => { });
    latest.current = props;
    useEffect(() => cancelRef.current(), [props.tool, props.seed]);
    useEffect(() => {
        const canvas = gl.domElement;
        canvas.tabIndex = 0;
        const ray = new T.Raycaster(), mouse = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
        const touches = new Map<number, {
            x: number;
            y: number;
        }>();
        let gesture: {
            x: number;
            y: number;
            distance: number;
            angle: number;
        } | null = null;
        const touchSample = () => { const [a, b] = [...touches.values()]; return a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y), angle: Math.atan2(b.y - a.y, b.x - a.x) } : null; };
        const pointers = new Set<number>();
        let start: {
            x: number;
            y: number;
            id?: string;
            revision: number;
            ids: string[];
            move?: Placement;
            offset?: {
                x: number;
                z: number;
            };
            drag: boolean;
        } | null = null;
        let space = false;
        const pick = (ev: PointerEvent) => {
            const b = canvas.getBoundingClientRect();
            mouse.set((ev.clientX - b.left) / b.width * 2 - 1, -(ev.clientY - b.top) / b.height * 2 + 1);
            ray.setFromCamera(mouse, camera);
            let id: string | undefined;
            const hits = ray.intersectObjects(scene.children, true);
            for (const i of hits) {
                let n: T.Object3D | null = i.object;
                if (n.userData.natural && ['plant', 'water', 'harvest', 'arrange'].includes(latest.current.tool)) continue;
                if (n.userData.opaqueAt && i.uv && !n.userData.opaqueAt(i.uv)) continue;
                if (n.userData.faceOwners && i.faceIndex !== undefined) {
                    id = n.userData.faceOwners.find((v: {
                        end: number;
                        id: string;
                    }) => i.faceIndex! < v.end)?.id;
                    if (id)
                        break;
                }
                if (n.userData.ids && i.instanceId !== undefined) {
                    id = n.userData.ids[i.instanceId];
                    break;
                }
                while (n && !n.userData.id)
                    n = n.parent;
                if (n) {
                    id = n.userData.id;
                    break;
                }
            }
            const ground = hits.find(i => i.object.userData.terrain);
            if (id) {
                const resource = latest.current.state.world.obstacles.find(o => o.id === id);
                if (resource && !ownedAt(latest.current.state.world, resource.x, resource.z)) id = undefined;
            }
            const point = ground?.point ?? ray.ray.intersectPlane(plane, hit) ?? hit;
            return { id, x: Math.floor(point.x), z: Math.floor(point.z) };
        };
        const cancel = () => { start = null; latest.current.onPreview([]); if (controls.current)
            controls.current.enabled = true; };
        cancelRef.current = cancel;
        const down = (ev: PointerEvent) => {
            canvas.focus({ preventScroll: true });
            pointers.add(ev.pointerId);
            touches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
            if (pointers.size > 1) {
                cancel();
                gesture = touchSample();
                if (controls.current)
                    controls.current.enabled = false;
                ev.stopImmediatePropagation();
                return;
            }
            if (ev.button !== 0 || space)
                return;
            const p = latest.current, q = pick(ev);
            start = { x: ev.clientX, y: ev.clientY, id: q.id, revision: p.state.revision, ids: [], drag: false };
            if (p.placement) {
                start.move = { ...p.placement };
                if (p.placement.moveId === q.id) start.offset = { x: q.x - p.placement.x, z: q.z - p.placement.z };
            }
            else if (p.tool === 'arrange' && q.id) {
                const e = p.state.entities.find(e => e.id === q.id);
                if (e && !e.construction) {
                    start.move = { asset: e.asset, moveId: e.id, x: e.x, z: e.z, rotation: e.rotation };
                    start.offset = { x: q.x - e.x, z: q.z - e.z };
                    p.onMoveStart(e.id);
                }
            }
            if (['plant', 'water', 'harvest'].includes(p.tool) || start.move) {
                if (controls.current)
                    controls.current.enabled = false;
                ev.stopImmediatePropagation();
                canvas.setPointerCapture(ev.pointerId);
            }
            if (q.id && ['plant', 'water', 'harvest'].includes(p.tool) && p.state.plots.some(v => v.id === q.id)) {
                start.ids.push(q.id);
                p.onPreview(start.ids);
            }
        };
        const move = (ev: PointerEvent) => {
            if (touches.has(ev.pointerId))
                touches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
            if (pointers.size > 1) {
                const next = touchSample(), c = controls.current;
                if (next && gesture && c && camera instanceof T.OrthographicCamera) {
                    const scale = (camera.right - camera.left) / (camera.zoom * canvas.clientWidth), right = new T.Vector3().setFromMatrixColumn(camera.matrix, 0), forward = new T.Vector3().crossVectors(new T.Vector3(0, 1, 0), right);
                    const delta = right.multiplyScalar(-(next.x - gesture.x) * scale).add(forward.multiplyScalar((next.y - gesture.y) * scale));
                    camera.position.add(delta);
                    c.target.add(delta);
                    camera.zoom = Math.max(2, Math.min(80, camera.zoom * next.distance / Math.max(1, gesture.distance)));
                    camera.updateProjectionMatrix();
                    c.update();
                }
                gesture = next;
                return;
            }
            const p = latest.current;
            if (!start && (space || ev.buttons !== 0)) return;
            if (start) {
                if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 5) start.drag = true;
                // Camera panning needs no terrain/foliage raycast. Keep picking
                // for placement and brush tools where the ground is actionable.
                if (!start.move && !['plant', 'water', 'harvest'].includes(p.tool)) return;
            }
            const q = pick(ev);
            if (!start) {
                const e = p.state.entities.find(e => e.id === q.id), o = p.state.world.obstacles.find(o => o.id === q.id);
                p.onHover(e ? `${ASSETS[e.asset].name} · ${ASSETS[e.asset].kind === 'building' ? `Cấp ${e.level}/25` : 'Trang trí'}` : o ? `${obstacleName(p.state.world, o)} · chọn để khai phá` : '');
                return;
            }
            if (start.move && start.drag) {
                start.move = { ...start.move, x: q.x - (start.offset?.x ?? 0), z: q.z - (start.offset?.z ?? 0) };
                p.onPosition(start.move.x, start.move.z);
            }
            else if (['plant', 'water', 'harvest'].includes(p.tool) && q.id && p.state.plots.some(v => v.id === q.id) && !start.ids.includes(q.id)) {
                start.ids.push(q.id);
                p.onPreview([...start.ids]);
            }
        };
        const up = (ev: PointerEvent) => {
            pointers.delete(ev.pointerId);
            touches.delete(ev.pointerId);
            if (gesture) {
                gesture = null;
                if (controls.current)
                    controls.current.enabled = true;
            }
            if (!start)
                return;
            const a = start, p = latest.current, b = canvas.getBoundingClientRect(), inside = ev.clientX >= b.left && ev.clientX <= b.right && ev.clientY >= b.top && ev.clientY <= b.bottom && document.elementFromPoint(ev.clientX,ev.clientY)===canvas;
            cancel();
            if (!inside) {
                if (a.move)
                    p.onCancel();
                return;
            }
            if (a.move) {
                if (a.drag)
                    p.onPlace(a.move);
                else {
                    const q = pick(ev);
                    p.onPosition(q.x, q.z);
                }
                return;
            }
            if (['plant', 'water', 'harvest'].includes(p.tool)) {
                const origins = a.ids.flatMap(id => {
                    const plot = p.state.plots.find(v => v.id === id);
                    if (!plot) return [];
                    const point = new T.Vector3(plot.x + .5, heightAt(p.state.world, plot.x, plot.z) + .7, plot.z + .5).project(camera);
                    return [{ id, x: b.left + (point.x + 1) * b.width / 2, y: b.top + (1 - point.y) * b.height / 2 }];
                });
                p.onStroke(a.ids, a.revision, origins);
                return;
            }
            if (!a.drag && a.id)
                p.onSelect(a.id);
            else if (!a.drag) p.onDeselect();
        };
        const key = (e: KeyboardEvent) => { if (e.code === 'Space') {
            space = true;
            e.preventDefault();
        } if (e.key === 'Escape') {
            cancel();
            latest.current.onCancel();
        } };
        const keyup = () => { space = false; };
        const lost = () => { pointers.clear(); touches.clear(); gesture = null; cancel(); space = false; };
        canvas.addEventListener('pointerdown', down, true);
        canvas.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        canvas.addEventListener('pointercancel', lost);
        canvas.addEventListener('keydown', key);
        window.addEventListener('keyup', keyup);
        window.addEventListener('blur', lost);
        return () => { cancel(); canvas.removeEventListener('pointerdown', down, true); canvas.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', lost); canvas.removeEventListener('keydown', key); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', lost); };
    }, [gl, camera, scene, controls]);
    return null;
}
function Scene(props: Props) {
    const { state: s, placement: p } = props, controls = useRef<any>(null), lastIntent = useRef(-1), { camera, size } = useThree();
    useFrame(() => { const c = controls.current; if (!c) return; const dx = Math.max(-12, Math.min(108, c.target.x)) - c.target.x, dz = Math.max(-12, Math.min(108, c.target.z)) - c.target.z; if (dx || dz) { c.target.x += dx; c.target.z += dz; camera.position.x += dx; camera.position.z += dz; c.update(); } });
    useEffect(() => {
        if (!(camera instanceof T.OrthographicCamera))
            return;
        const c = controls.current, intent = props.camera;
        if (!c || lastIntent.current === intent.serial)
            return;
        lastIntent.current = intent.serial;
        if (intent.kind === 'zoom-in' || intent.kind === 'zoom-out') {
            camera.zoom = Math.max(2, Math.min(80, camera.zoom * (intent.kind === 'zoom-in' ? 1.25 : .8)));
            camera.updateProjectionMatrix();
        }
        else {
            const home = s.entities.find(e => e.asset === 'home')!;
            const x = intent.kind === 'overview' ? 45 : intent.kind === 'district' ? 23 : intent.x ?? home.x - 1, z = intent.kind === 'overview' ? 44 : intent.kind === 'district' ? 17 : intent.z ?? home.z + 6;
            c.target.set(x, heightAt(s.world, x, z), z);
            camera.position.copy(c.target).add(CAMERA_OFFSET);
            camera.zoom = Math.max(2, Math.min(size.width / (intent.kind === 'overview' ? 165 : intent.kind === 'home' ? size.width < 700 ? 15 : 22 : 28), (size.height - (intent.kind === 'overview' ? 100 : 0)) / (intent.kind === 'overview' ? 110 : intent.kind === 'home' ? 18 : 22)));
            if (intent.kind === 'district') camera.zoom = Math.min(size.width / 62, (size.height - 150) / 28);
            camera.updateProjectionMatrix();
        }
        c.update();
    }, [props.camera.serial, size.width, size.height]);
    const preview = ['plant', 'water', 'harvest'].includes(props.tool) ? previewStroke(s, props.tool as 'plant' | 'water' | 'harvest', props.seed, props.stroke) : null;
    const [pw, pd] = p && p.asset !== 'plot' ? dimensions(p.asset, p.rotation) : [1, 1];
    const problem = p ? placementError(s, p.x, p.z, pw, pd, p.moveId, p.asset === 'plot' ? undefined : p.asset, p.rotation) || (!p.moveId && p.asset !== 'plot' ? buildRequirements(s, p.asset)[0] : null) : null;
    const hovered = s.entities.find(e => e.id === props.selected);
    return <><color attach="background" args={['#d8dfcb']}/><hemisphereLight args={['#fff0d8', '#8d9c75', 1.75]}/><directionalLight position={[-8, 30, 12]} intensity={2} color="#fff0d2" castShadow={props.quality === 'soft'} shadow-mapSize={[2048, 2048]} shadow-camera-left={-42} shadow-camera-right={42} shadow-camera-top={42} shadow-camera-bottom={-42} shadow-camera-far={130} shadow-normalBias={.07}/>
 <Landscape world={s.world} reduced={props.reduced}/><GroundCover state={s}/><LandscapeObjects world={s.world} ghosts={props.familyWork} reveal={['arrange', 'plant', 'water', 'harvest'].includes(props.tool)}/><Family state={s} works={props.familyWork} reduced={props.reduced} origin={props.onResourceOrigin}/>
 {(p?.asset === 'path' || s.entities.some(e => e.asset === 'path' && !e.stored)) && <Suspense fallback={null}><Roads state={s} placement={p}/></Suspense>}<Suspense fallback={null}><CropField state={s}/></Suspense><Suspense fallback={null}><SceneLife reduced={props.reduced}/></Suspense>{import.meta.env.DEV && new URLSearchParams(location.search).has('lab') && <FrameMeter />}
 <Buildings state={s} hide={p?.moveId} reduced={props.reduced}/>{s.entities.filter(e => !e.stored && e.id !== p?.moveId && e.construction).map(e => { const [w, d] = dimensions(e.asset, e.rotation); return <group key={e.id} userData={{ id: e.id }} position={[e.x + w / 2, heightAt(s.world, e.x, e.z) + .025, e.z + d / 2]} rotation={[0, e.rotation * Math.PI / 2, 0]}>{e.construction && <mesh position={[0, 1.2, 0]}><boxGeometry args={[w + .12, 2.4, d + .12]}/><meshBasicMaterial color="#c6ad72" wireframe transparent opacity={.65}/></mesh>}</group>; })}
 {s.world.bridges.map(b => <group key={b.id} userData={{ id: b.id }} position={[b.x + 3, .04, b.z + 1]}>{b.built ? <><mesh receiveShadow><boxGeometry args={[6, .22, 2]}/><meshStandardMaterial color="#ac8a5d"/></mesh>{[-1, 1].map(z => <mesh key={z} position={[0, .6, z * .9]}><boxGeometry args={[6, .08, .08]}/><meshStandardMaterial color="#816342"/></mesh>)}</> : <mesh><boxGeometry args={[6, .04, 2]}/><meshBasicMaterial color="#ecd3a0" wireframe/></mesh>}</group>)}
 {props.selected && s.plots.filter(v => v.id === props.selected).map(v => <Mark key={v.id} {...v} world={s.world}/>)}
 {hovered && !p && <><Mark x={hovered.x} z={hovered.z} w={dimensions(hovered.asset, hovered.rotation)[0]} d={dimensions(hovered.asset, hovered.rotation)[1]} world={s.world}/><Html position={[hovered.x + 1.5, heightAt(s.world, hovered.x, hovered.z) + 3.4, hovered.z + 1.5]} center style={{ pointerEvents: 'none' }} zIndexRange={[2, 0]}><span className="farm-world-label">{ASSETS[hovered.asset].name} · Cấp {hovered.level}/25</span></Html></>}
 {preview && props.stroke.map(id => { const plot = s.plots.find(v => v.id === id); return plot ? <Mark key={id} {...plot} world={s.world} color={preview.accepted.includes(id) ? '#ead49a' : '#d77c67'}/> : null; })}
 {p && <><Mark x={p.x} z={p.z} w={pw} d={pd} world={s.world} color={problem ? '#d97962' : '#ecdc9e'}/>{p.asset !== 'plot' && p.asset !== 'path' && <group position={[p.x + pw / 2, heightAt(s.world, p.x, p.z) + .12, p.z + pd / 2]} rotation={[0, p.rotation * Math.PI / 2, 0]}><BuildingModel asset={p.asset} level={s.entities.find(e => e.id === p.moveId)?.level ?? 1} reduced/></group>}<AnchoredActions p={p} world={s.world} onRotate={props.onRotate} onCancel={props.onCancel} onPlace={() => props.onPlace(p)} valid={!problem}/></>}
 <OrbitControls ref={controls} makeDefault target={[11, 0, 9]} minZoom={2} maxZoom={80} enableRotate={false} minPolarAngle={CAMERA_POLAR} maxPolarAngle={CAMERA_POLAR} minAzimuthAngle={CAMERA_AZIMUTH} maxAzimuthAngle={CAMERA_AZIMUTH} screenSpacePanning={false} mouseButtons={{ LEFT: T.MOUSE.PAN, MIDDLE: T.MOUSE.DOLLY, RIGHT: T.MOUSE.PAN }} touches={{ ONE: T.TOUCH.PAN, TWO: T.TOUCH.DOLLY_PAN }}/>
 <ExplorationFog world={s.world} reduced={props.reduced}/>
 {props.selected && props.subjectMenu && !p && props.tool === 'select' && <SubjectAnchor state={s} selected={props.selected}>{props.subjectMenu}</SubjectAnchor>}
 <Interaction props={props} controls={controls}/></>;
}
export function FarmWorld(props: Props) { return <SceneBoundary><Canvas orthographic shadows={props.quality === 'soft'} camera={{ position: [240, 270, 300], zoom: 30, near: .1, far: 2000 }} dpr={[1, 1.5]} frameloop={props.reduced ? 'demand' : 'always'} gl={{ antialias: true, powerPreference: 'high-performance' }} aria-label="Bản đồ 3D tương tác" onContextMenu={e => e.preventDefault()}><Suspense fallback={null}><Scene {...props}/></Suspense></Canvas></SceneBoundary>; }

import { Buildings } from './Buildings';
import { CropField } from './CropField';
import { SceneLife, FrameMeter } from './SceneLife';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as T from 'three';
import { ASSETS, CROPS, type CropId } from '../core/catalog';
import { dimensions, growthStage, placementError } from '../core/engine';
import { heightAt, isWater, chunkOf, type World } from '../core/world';
import { previewStroke, type Tool } from '../core/interaction';
import type { FarmState, Rotation } from '../core/types';
import { BuildingModel, SceneBoundary, type Placement } from './FarmScene';
import { cropModel } from './models';
export type CameraIntent = {
    serial: number;
    kind: 'home' | 'left' | 'right' | 'zoom-in' | 'zoom-out' | 'focus';
    x?: number;
    z?: number;
};
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
    onPosition: (x: number, z: number) => void;
    onMoveStart: (id: string) => void;
    onPlace: (p: Placement) => void;
    onRotate: () => void;
    onCancel: () => void;
    onStroke: (ids: string[], revision: number) => void;
    onPreview: (ids: string[]) => void;
    onHover: (text: string) => void;
    stroke: string[];
};
function terrainGeometry(w: World, cx: number, cz: number) {
    const pos: number[] = [], colors: number[] = [];
    const face = (points: number[][], color: T.Color) => { for (const i of [0, 1, 2, 0, 2, 3]) {
        pos.push(...points[i]);
        colors.push(color.r, color.g, color.b);
    } };
    for (let z = cz * 16; z < cz * 16 + 16; z++)
        for (let x = cx * 16; x < cx * 16 + 16; x++) {
            const h = heightAt(w, x, z), wet = isWater(w, x, z), owned = w.owned.includes(chunkOf(x, z)), color = new T.Color(wet ? '#7eaea7' : w.biome === 'stone' ? '#b0b285' : w.biome === 'ore' ? '#b0ac78' : '#a6b978');
            color.multiplyScalar((owned ? 1 : .8) * (1 + (((x * 19 + z * 13) % 7) - 3) * .012));
            const y = wet ? -.16 : h;
            face([[x, y, z], [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z]], color);
            const stone = new T.Color('#969582');
            if (x === 0 || heightAt(w, x - 1, z) < h)
                face([[x, -.4, z], [x, -.4, z + 1], [x, h, z + 1], [x, h, z]], stone);
            if (z === 0 || heightAt(w, x, z - 1) < h)
                face([[x, -.4, z], [x, h, z], [x + 1, h, z], [x + 1, -.4, z]], stone);
            if (x === 95 || heightAt(w, x + 1, z) < h)
                face([[x + 1, -.4, z], [x + 1, h, z], [x + 1, h, z + 1], [x + 1, -.4, z + 1]], stone);
            if (z === 95 || heightAt(w, x, z + 1) < h)
                face([[x, -.4, z + 1], [x + 1, -.4, z + 1], [x + 1, h, z + 1], [x, h, z + 1]], stone);
        }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
}
function Terrain({ world }: {
    world: World;
}) {
    const signature = world.owned.join(','), geo = useMemo(() => Array.from({ length: 36 }, (_, i) => terrainGeometry(world, i % 6, Math.floor(i / 6))), [world.seed, signature]);
    useEffect(() => () => geo.forEach(g => g.dispose()), [geo]);
    return <>{geo.map((g, i) => <mesh key={i} geometry={g} receiveShadow userData={{ terrain: true }}><meshStandardMaterial vertexColors roughness={1} side={T.DoubleSide}/></mesh>)}
 <mesh rotation={[-Math.PI / 2, 0, 0]} position={[48, -.5, 48]}><planeGeometry args={[300, 300]}/><meshStandardMaterial color="#d2dac3"/></mesh></>;
}
function Obstacles({ world }: {
    world: World;
}) {
    const signature = world.obstacles.filter(o => o.cleared).map(o => o.id).join(','), trees = useMemo(() => world.obstacles.filter(o => o.kind === 'tree' && !o.cleared), [world.seed, signature]), rocks = useMemo(() => world.obstacles.filter(o => o.kind !== 'tree' && !o.cleared), [world.seed, signature]);
    const trunks = useRef<T.InstancedMesh>(null), crowns = useRef<T.InstancedMesh>(null), stones = useRef<T.InstancedMesh>(null);
    useLayoutEffect(() => { const dummy = new T.Object3D(); for (const [list, ref, kind] of [[trees, trunks, 'trunk'], [trees, crowns, 'crown'], [rocks, stones, 'rock']] as const) {
        if (!ref.current)
            continue;
        list.forEach((o, i) => { const variant = (o.x * 7 + o.z * 11) % 5 / 10; dummy.position.set(o.x + .5, heightAt(world, o.x, o.z) + (kind === 'trunk' ? .65 : kind === 'crown' ? 1.5 + variant : .35), o.z + .5); dummy.scale.set(kind === 'trunk' ? .11 : kind === 'crown' ? .7 + variant : .5, kind === 'trunk' ? 1.3 : kind === 'crown' ? .95 + variant : .45, kind === 'trunk' ? .11 : kind === 'crown' ? .7 + variant : .48); dummy.rotation.set(0, variant * 4, 0); dummy.updateMatrix(); ref.current!.setMatrixAt(i, dummy.matrix); if (kind === 'rock')
            ref.current!.setColorAt(i, new T.Color(o.kind === 'ore' ? '#837b71' : '#a3a28c')); });
        ref.current.instanceMatrix.needsUpdate = true;
        ref.current.computeBoundingSphere();
    } }, [trees, rocks]);
    return <><instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} userData={{ ids: trees.map(o => o.id) }} castShadow><cylinderGeometry args={[1, 1, 1, 5]}/><meshStandardMaterial color="#8b6d48"/></instancedMesh><instancedMesh ref={crowns} args={[undefined, undefined, trees.length]} userData={{ ids: trees.map(o => o.id) }} castShadow><icosahedronGeometry args={[1, 1]}/><meshStandardMaterial color="#6f9157" roughness={1}/></instancedMesh><instancedMesh ref={stones} args={[undefined, undefined, rocks.length]} userData={{ ids: rocks.map(o => o.id) }} castShadow><dodecahedronGeometry args={[1, 0]}/><meshStandardMaterial color="white" roughness={1}/></instancedMesh></>;
}
function Crop({ p, now, world }: {
    p: FarmState['plots'][number];
    now: number;
    world: World;
}) { const stage = growthStage(p, now), model = useMemo(() => p.crop ? cropModel(p.crop, stage) : null, [p.crop, stage]); return <group userData={{ id: p.id }} position={[p.x + .5, heightAt(world, p.x, p.z) + .04, p.z + .5]}><mesh receiveShadow><boxGeometry args={[.9, .1, .9]}/><meshStandardMaterial color={p.watered ? '#70513b' : '#8e6a47'}/></mesh>{model && <primitive object={model} position={[0, .09, 0]} dispose={null}/>}</group>; }
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
    return <Html fullscreen style={{ pointerEvents: 'none' }} zIndexRange={[20, 10]}><div ref={div} className="farm-object-actions"><button onClick={onRotate} aria-label="Xoay vật thể 90 độ">↻</button><button onClick={onPlace} disabled={!valid}>Xác nhận</button><button onClick={onCancel} aria-label="Hủy bố trí">×</button></div></Html>;
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
            if (p.placement)
                start.move = { ...p.placement };
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
                    camera.zoom = Math.max(5, Math.min(100, camera.zoom * next.distance / Math.max(1, gesture.distance)));
                    camera.updateProjectionMatrix();
                    let angle = next.angle - gesture.angle;
                    if (angle > Math.PI)
                        angle -= 2 * Math.PI;
                    if (angle < -Math.PI)
                        angle += 2 * Math.PI;
                    c.setAzimuthalAngle(c.getAzimuthalAngle() - angle);
                    c.update();
                }
                gesture = next;
                return;
            }
            const p = latest.current, q = pick(ev);
            if (!start) {
                const e = p.state.entities.find(e => e.id === q.id), o = p.state.world.obstacles.find(o => o.id === q.id);
                p.onHover(e ? `${ASSETS[e.asset].name} · ${ASSETS[e.asset].kind === 'building' ? `Cấp ${e.level}/25` : 'Trang trí'}` : o ? `${o.kind === 'tree' ? 'Cây già' : o.kind === 'ore' ? 'Đá quặng' : 'Đá tảng'} · chọn để khai phá` : '');
                return;
            }
            if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 5)
                start.drag = true;
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
                p.onStroke(a.ids, a.revision);
                return;
            }
            if (!a.drag && a.id)
                p.onSelect(a.id);
        };
        const key = (e: KeyboardEvent) => { if (e.code === 'Space') {
            space = true;
            e.preventDefault();
        } if (e.key === 'Escape') {
            cancel();
            latest.current.onCancel();
        } if (e.key === 'q' || e.key === 'e') {
            const c = controls.current;
            if (c) {
                const angle = c.getAzimuthalAngle() + (e.key === 'q' ? -1 : 1) * Math.PI / 2;
                c.setAzimuthalAngle(angle);
                c.update();
            }
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
    useEffect(() => {
        if (!(camera instanceof T.OrthographicCamera))
            return;
        const c = controls.current, intent = props.camera;
        if (!c || lastIntent.current === intent.serial)
            return;
        lastIntent.current = intent.serial;
        if (intent.kind === 'left' || intent.kind === 'right')
            c.setAzimuthalAngle(c.getAzimuthalAngle() + (intent.kind === 'left' ? -1 : 1) * Math.PI / 2);
        else if (intent.kind === 'zoom-in' || intent.kind === 'zoom-out') {
            camera.zoom = Math.max(5, Math.min(100, camera.zoom * (intent.kind === 'zoom-in' ? 1.25 : .8)));
            camera.updateProjectionMatrix();
        }
        else {
            const x = intent.x ?? 9, z = intent.z ?? 7;
            c.target.set(x, 0, z);
            camera.position.set(x + 18, 23, z + 23);
            camera.zoom = Math.min(size.width / 23, size.height / 18);
            camera.updateProjectionMatrix();
        }
        c.update();
    }, [props.camera.serial, size.width, size.height]);
    const preview = ['plant', 'water', 'harvest'].includes(props.tool) ? previewStroke(s, props.tool as 'plant' | 'water' | 'harvest', props.seed, props.stroke) : null;
    const [pw, pd] = p && p.asset !== 'plot' ? dimensions(p.asset, p.rotation) : [1, 1];
    const problem = p ? placementError(s, p.x, p.z, pw, pd, p.moveId, p.asset === 'plot' ? undefined : p.asset, p.rotation) : null;
    const hovered = s.entities.find(e => e.id === props.selected);
    return <><color attach="background" args={['#d8dfcb']}/><fog attach="fog" args={['#d8dfcb', 100, 170]}/><hemisphereLight args={['#fff0d8', '#8d9c75', 2.4]}/><directionalLight position={[-8, 30, 12]} intensity={2.7} color="#fff0d2" castShadow={props.quality === 'soft'} shadow-mapSize={[2048, 2048]} shadow-camera-left={-42} shadow-camera-right={42} shadow-camera-top={42} shadow-camera-bottom={-42} shadow-camera-far={130} shadow-normalBias={.07}/>
 <Terrain world={s.world}/><Obstacles world={s.world}/>
 <CropField state={s}/><SceneLife reduced={props.reduced}/>{import.meta.env.DEV && new URLSearchParams(location.search).has('lab') && <FrameMeter />}
 <Buildings state={s} hide={p?.moveId} reduced={props.reduced}/>{s.entities.filter(e => !e.stored && e.id !== p?.moveId && e.construction).map(e => { const [w, d] = dimensions(e.asset, e.rotation); return <group key={e.id} userData={{ id: e.id }} position={[e.x + w / 2, heightAt(s.world, e.x, e.z) + .025, e.z + d / 2]} rotation={[0, e.rotation * Math.PI / 2, 0]}>{e.construction && <mesh position={[0, 1.2, 0]}><boxGeometry args={[w + .12, 2.4, d + .12]}/><meshBasicMaterial color="#c6ad72" wireframe transparent opacity={.65}/></mesh>}</group>; })}
 {s.world.bridges.map(b => <group key={b.id} userData={{ id: b.id }} position={[b.x + 3, .04, b.z + 1]}>{b.built ? <><mesh receiveShadow><boxGeometry args={[6, .22, 2]}/><meshStandardMaterial color="#ac8a5d"/></mesh>{[-1, 1].map(z => <mesh key={z} position={[0, .6, z * .9]}><boxGeometry args={[6, .08, .08]}/><meshStandardMaterial color="#816342"/></mesh>)}</> : <mesh><boxGeometry args={[6, .04, 2]}/><meshBasicMaterial color="#ecd3a0" wireframe/></mesh>}</group>)}
 {props.selected && s.plots.filter(v => v.id === props.selected).map(v => <Mark key={v.id} {...v} world={s.world}/>)}
 {hovered && !p && <><Mark x={hovered.x} z={hovered.z} w={dimensions(hovered.asset, hovered.rotation)[0]} d={dimensions(hovered.asset, hovered.rotation)[1]} world={s.world}/><Html position={[hovered.x + 1.5, heightAt(s.world, hovered.x, hovered.z) + 3.4, hovered.z + 1.5]} center style={{ pointerEvents: 'none' }} zIndexRange={[2, 0]}><span className="farm-world-label">{ASSETS[hovered.asset].name} · Cấp {hovered.level}/25</span></Html></>}
 {preview && props.stroke.map(id => { const plot = s.plots.find(v => v.id === id); return plot ? <Mark key={id} {...plot} world={s.world} color={preview.accepted.includes(id) ? '#ead49a' : '#d77c67'}/> : null; })}
 {p && <><Mark x={p.x} z={p.z} w={pw} d={pd} world={s.world} color={problem ? '#d97962' : '#ecdc9e'}/>{p.asset !== 'plot' && <group position={[p.x + pw / 2, heightAt(s.world, p.x, p.z) + .12, p.z + pd / 2]} rotation={[0, p.rotation * Math.PI / 2, 0]}><BuildingModel asset={p.asset} level={s.entities.find(e => e.id === p.moveId)?.level ?? 1} reduced/></group>}<AnchoredActions p={p} world={s.world} onRotate={props.onRotate} onCancel={props.onCancel} onPlace={() => props.onPlace(p)} valid={!problem}/></>}
 <OrbitControls ref={controls} makeDefault target={[11, 0, 9]} minZoom={5} maxZoom={100} minPolarAngle={.55} maxPolarAngle={1.1} screenSpacePanning={false} mouseButtons={{ LEFT: T.MOUSE.PAN, MIDDLE: T.MOUSE.DOLLY, RIGHT: T.MOUSE.ROTATE }} touches={{ ONE: T.TOUCH.PAN, TWO: T.TOUCH.DOLLY_PAN }}/>
 <Interaction props={props} controls={controls}/></>;
}
export function FarmWorld(props: Props) { return <SceneBoundary><Canvas orthographic shadows={props.quality === 'soft'} camera={{ position: [29, 23, 32], zoom: 30, near: .1, far: 250 }} dpr={[1, props.quality === 'soft' ? 1.5 : 1]} frameloop={props.reduced ? 'demand' : 'always'} gl={{ antialias: true, powerPreference: 'high-performance' }} aria-label="Bản đồ 3D tương tác" onContextMenu={e => e.preventDefault()}><Suspense fallback={null}><Scene {...props}/></Suspense></Canvas></SceneBoundary>; }
